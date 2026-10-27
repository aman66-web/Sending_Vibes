import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import type Stripe from "stripe";
import type { Locale } from "@/i18n/config";
import { emailReady, sendOrderEmails } from "./email";
import type { Currency } from "./pricing";
import { DATA_DIR, adminSupabase, markCardsPaid, usingSupabase } from "./storage";
import { stripe } from "./stripe";

const newOrderId = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 16);

export type OrderItem = {
  cardId: string;
  to: string;
  from: string;
  delivery: "self" | "email";
  email?: string;
  // When the buyer picked a later day: that day as they chose it (YYYY-MM-DD), and the
  // moment to email it (9am their time).
  sendOn?: string;
  sendAt?: string;
};

export type Order = {
  id: string;
  status: "pending" | "paid" | "expired";
  currency: Currency;
  locale: Locale;
  // The site the order was placed on, so emailed links point back to it.
  site: string;
  items: OrderItem[];
  stripeSessionId?: string;
  buyerEmail?: string;
  amountTotal?: number;
  createdAt: string;
  paidAt?: string;
  emailedAt?: string;
};

type Row = {
  id: string;
  status: Order["status"];
  currency: Currency;
  locale: Locale;
  site: string;
  items: OrderItem[];
  stripe_session_id: string | null;
  buyer_email: string | null;
  amount_total: number | null;
  created_at: string;
  paid_at: string | null;
  emailed_at: string | null;
};

const fromRow = (r: Row): Order => ({
  id: r.id,
  status: r.status,
  currency: r.currency,
  locale: r.locale,
  site: r.site,
  items: r.items,
  stripeSessionId: r.stripe_session_id ?? undefined,
  buyerEmail: r.buyer_email ?? undefined,
  amountTotal: r.amount_total ?? undefined,
  createdAt: r.created_at,
  paidAt: r.paid_at ?? undefined,
  emailedAt: r.emailed_at ?? undefined,
});

// Orders need the secret key on Supabase. Without Supabase (local development) they
// are JSON files next to the cards.
export function ordersReady() {
  return usingSupabase() ? adminSupabase() !== null : true;
}

function db() {
  const client = adminSupabase();
  if (!client) throw new Error("SUPABASE_SECRET_KEY is not set");
  return client.from("orders");
}

const orderFile = (id: string) => path.join(DATA_DIR, "orders", `${id}.json`);

async function readLocal(id: string): Promise<Order | null> {
  if (!/^[A-Za-z0-9]{16}$/.test(id)) return null;
  return JSON.parse(await fs.readFile(orderFile(id), "utf8").catch(() => "null"));
}

async function writeLocal(order: Order) {
  await fs.mkdir(path.dirname(orderFile(order.id)), { recursive: true });
  await fs.writeFile(orderFile(order.id), JSON.stringify(order));
}

export async function createOrder(order: Omit<Order, "id" | "status" | "createdAt">): Promise<Order> {
  const full: Order = { ...order, id: newOrderId(), status: "pending", createdAt: new Date().toISOString() };
  if (usingSupabase()) {
    const { error } = await db().insert({
      id: full.id,
      currency: full.currency,
      locale: full.locale,
      site: full.site,
      items: full.items,
    });
    if (error) throw new Error(`Could not save order: ${error.message}`);
  } else {
    await writeLocal(full);
  }
  return full;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!usingSupabase()) return readLocal(id);
  const { data, error } = await db().select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data ? fromRow(data as Row) : null;
}

export async function setOrderSession(id: string, sessionId: string) {
  if (usingSupabase()) {
    const { error } = await db().update({ stripe_session_id: sessionId }).eq("id", id);
    if (error) throw new Error(`Could not save order: ${error.message}`);
    return;
  }
  const order = await readLocal(id);
  if (order) await writeLocal({ ...order, stripeSessionId: sessionId });
}

// Moves a pending order to paid. Only one caller wins, so it is safe for the webhook
// and the thank-you page to race.
async function markPaid(id: string, details: { buyerEmail?: string; amountTotal?: number }) {
  const paidAt = new Date().toISOString();
  if (usingSupabase()) {
    const { error } = await db()
      .update({ status: "paid", paid_at: paidAt, buyer_email: details.buyerEmail ?? null, amount_total: details.amountTotal ?? null })
      .eq("id", id)
      .eq("status", "pending");
    if (error) throw new Error(`Could not update order: ${error.message}`);
    return;
  }
  const order = await readLocal(id);
  if (order?.status === "pending") await writeLocal({ ...order, status: "paid", paidAt, ...details });
}

export async function markExpired(id: string) {
  if (usingSupabase()) {
    const { error } = await db().update({ status: "expired" }).eq("id", id).eq("status", "pending");
    if (error) throw new Error(`Could not update order: ${error.message}`);
    return;
  }
  const order = await readLocal(id);
  if (order?.status === "pending") await writeLocal({ ...order, status: "expired" });
}

// Emails go out once per order: the first caller claims them. If sending fails the
// claim is released, so the webhook's retry can try again.
async function claimEmails(id: string): Promise<boolean> {
  const at = new Date().toISOString();
  if (usingSupabase()) {
    const { data, error } = await db().update({ emailed_at: at }).eq("id", id).is("emailed_at", null).select("id");
    if (error) throw new Error(`Could not update order: ${error.message}`);
    return (data?.length ?? 0) > 0;
  }
  const order = await readLocal(id);
  if (!order || order.emailedAt) return false;
  await writeLocal({ ...order, emailedAt: at });
  return true;
}

async function releaseEmails(id: string) {
  if (usingSupabase()) {
    await db().update({ emailed_at: null }).eq("id", id);
    return;
  }
  const order = await readLocal(id);
  if (order) await writeLocal({ ...order, emailedAt: undefined });
}

async function emailOrder(order: Order) {
  if (!emailReady() || !(await claimEmails(order.id))) return;
  try {
    await sendOrderEmails(order);
  } catch (e) {
    await releaseEmails(order.id);
    throw e;
  }
}

export type Fulfilment = { order: Order; state: "paid" | "processing" | "unpaid" };

// Checks a Checkout session with Stripe and, once it's paid, opens the cards and sends
// the emails. Called by the webhook and by the thank-you page; every step is safe to repeat.
export async function fulfilSession(sessionId: string): Promise<Fulfilment | null> {
  const s = stripe();
  if (!s || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  let session: Stripe.Checkout.Session;
  try {
    session = await s.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
  const orderId = session.metadata?.order_id;
  const order = orderId ? await getOrder(orderId) : null;
  if (!order || order.stripeSessionId !== session.id) return null;

  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
    await markPaid(order.id, { buyerEmail: session.customer_details?.email ?? undefined, amountTotal: session.amount_total ?? undefined });
    const paid = (await getOrder(order.id))!;
    if (paid.status === "paid") {
      await markCardsPaid(paid.items.map((i) => i.cardId));
      await emailOrder(paid);
      return { order: paid, state: "paid" };
    }
    return { order: paid, state: "unpaid" };
  }
  // A bank transfer or similar that Stripe is still waiting on.
  return { order, state: session.status === "complete" ? "processing" : "unpaid" };
}
