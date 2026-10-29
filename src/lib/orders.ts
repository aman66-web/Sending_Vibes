import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import type Stripe from "stripe";
import type { Locale } from "@/i18n/config";
import type { Occasion, ThemeName } from "./card";
import { alertOwner } from "./alert";
import { nothingLeft, pending, type EmailResult } from "./delivery";
import { emailReady, sendOrderEmails } from "./email";
import type { Currency, Tier } from "./pricing";
import { DATA_DIR, adminSupabase, markCardsPaid, usingSupabase } from "./storage";
import { stripe } from "./stripe";

const newOrderId = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 16);

export type OrderItem = {
  cardId: string;
  to: string;
  from: string;
  delivery: "self" | "email";
  // Older orders don't have these. They were all premade.
  tier?: Tier;
  // For showing the card in someone's account.
  occasion?: Occasion;
  theme?: ThemeName;
  email?: string;
  // When the buyer picked a later day: that day as they chose it (YYYY-MM-DD), and the
  // moment to email it (9am their time).
  sendOn?: string;
  sendAt?: string;
  // The design it was made from, for "send this design to someone else". Older orders don't have it.
  template?: string;
  // How its emails went: the card to the recipient, and the buyer's receipt with its link.
  // Kept as they go out, so a retry only sends what's still missing. Older orders don't have these.
  cardEmail?: EmailResult;
  receipt?: EmailResult;
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
  // Who was signed in when they bought it, if anyone.
  userId?: string;
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
  user_id: string | null;
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
  userId: r.user_id ?? undefined,
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
      user_id: full.userId ?? null,
    });
    if (error) throw new Error(`Could not save order: ${error.message}`);
  } else {
    await writeLocal(full);
  }
  return full;
}

// Paid orders for a signed-in buyer: the ones placed while signed in, and any paid
// for with the same (confirmed) email address. Newest first.
export async function ordersFor(account: { id: string; email: string | null }): Promise<Order[]> {
  const email = account.email?.toLowerCase();
  const mine = (o: Order) => o.status === "paid" && (o.userId === account.id || (!!email && o.buyerEmail?.toLowerCase() === email));
  let orders: Order[];
  if (!usingSupabase()) {
    const dir = path.join(DATA_DIR, "orders");
    const files = await fs.readdir(dir).catch(() => [] as string[]);
    orders = (await Promise.all(files.map((f) => readLocal(f.replace(/\.json$/, ""))))).filter((o): o is Order => o !== null);
  } else {
    const paid = () => db().select("*").eq("status", "paid").order("paid_at", { ascending: false }).limit(100);
    const results = await Promise.all([
      paid().eq("user_id", account.id),
      // ilike so the case doesn't matter; escape its wildcards so it's an exact match.
      email ? paid().ilike("buyer_email", email.replace(/[\\%_]/g, (c) => `\\${c}`)) : null,
    ]);
    const rows = results.flatMap((r) => {
      if (r?.error) throw new Error(`Could not load orders: ${r.error.message}`);
      return (r?.data ?? []) as Row[];
    });
    orders = rows.map(fromRow);
  }
  const unique = new Map(orders.filter(mine).map((o) => [o.id, o]));
  return [...unique.values()].sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt));
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

// Emails go out once per order: the first caller claims them. If some fail in a way worth
// another go, the claim is released, so the webhook's retry can try again. `stale` takes
// over a claim left behind, but only if nobody else has since.
async function claimEmails(id: string, leftBehind?: string): Promise<boolean> {
  const at = new Date().toISOString();
  if (usingSupabase()) {
    const unclaimed = db().update({ emailed_at: at }).eq("id", id);
    const { data, error } = await (leftBehind ? unclaimed.eq("emailed_at", leftBehind) : unclaimed.is("emailed_at", null)).select("id");
    if (error) throw new Error(`Could not update order: ${error.message}`);
    return (data?.length ?? 0) > 0;
  }
  const order = await readLocal(id);
  if (!order || order.emailedAt !== leftBehind) return false;
  await writeLocal({ ...order, emailedAt: at });
  return true;
}

// Keeps what happened to each email on the order. If anything is worth another go, the claim
// is released in the same write, so the next attempt picks up only what's left.
async function saveDelivery(id: string, items: OrderItem[], again: boolean) {
  if (usingSupabase()) {
    const { error } = await db().update(again ? { items, emailed_at: null } : { items }).eq("id", id);
    if (error) throw new Error(`Could not save email results: ${error.message}`);
    return;
  }
  const order = await readLocal(id);
  if (order) await writeLocal({ ...order, items, ...(again ? { emailedAt: undefined } : {}) });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A claim older than any attempt can run for was left behind (it crashed, or couldn't save).
const STALE = 10 * 60_000;
const stale = (order: Order) => !!order.emailedAt && Date.now() - Date.parse(order.emailedAt) > STALE;

// Whether someone else's claim has finished: everything sent or refused for good. Orders
// from before results were kept have none, so theirs counts once it's old.
function finished(order: Order) {
  if (!order.emailedAt) return false;
  if (nothingLeft(pending(order))) return true;
  return stale(order) && order.items.every((i) => !i.cardEmail && !i.receipt);
}

// This attempt's failures are logged with the order, so the owner can see who to help.
// One Resend refuses for good also emails the owner, since nothing will try it again;
// the rest are retried, and the webhook's alert covers them if that keeps failing.
async function report(id: string, sent: Awaited<ReturnType<typeof sendOrderEmails>>) {
  const failed = [...Object.entries(sent.cards).map(([card, result]) => [`card ${card}`, result] as const), ["receipt", sent.receipt] as const];
  for (const [what, result] of failed) {
    if (!result || result.ok) continue;
    console.error(`Order ${id}: ${what} couldn't be emailed (${result.retry ? "will retry" : "gave up"}): ${result.error}`);
    if (!result.retry) await alertOwner("An order email couldn't be sent", { order: id, email: what, error: result.error });
  }
}

async function sendEmails(claimed: Order, strict: boolean): Promise<Order> {
  // Read it again now it's ours: an earlier attempt may already have sent some.
  const order = (await getOrder(claimed.id)) ?? claimed;
  const todo = pending(order);
  if (nothingLeft(todo)) return order;
  const sent = await sendOrderEmails(order, todo);
  const items = order.items.map((i) => ({ ...i, ...(sent.cards[i.cardId] ? { cardEmail: sent.cards[i.cardId] } : {}), ...(sent.receipt ? { receipt: sent.receipt } : {}) }));
  const again = !nothingLeft(pending({ ...order, items }));
  await report(order.id, sent);
  try {
    await saveDelivery(order.id, items, again);
  } catch (e) {
    // The claim is now left behind; after a while the next attempt takes it over.
    if (strict) throw e;
    console.error(`Order ${order.id}: emails sent but their results weren't saved`, e);
  }
  if (again && strict) throw new Error(`Some emails for order ${order.id} haven't gone yet; Stripe will try again`);
  return { ...order, items, emailedAt: again ? undefined : order.emailedAt };
}

// Sends whatever emails the order still needs. Each email is tried on its own and never
// stops the cards being shown. Strict callers (the webhook) throw while anything is left
// worth retrying, so Stripe calls again later; final failures are kept and reported instead.
async function deliver(order: Order, strict: boolean): Promise<Order> {
  if (!emailReady()) return order;
  for (let tries = 0; ; tries++) {
    if (await claimEmails(order.id)) return sendEmails(order, strict);
    // Someone else (the webhook or the thank-you page) has them, or they've all gone.
    const now = (await getOrder(order.id)) ?? order;
    if (finished(now)) return now;
    if (stale(now) && (await claimEmails(order.id, now.emailedAt))) return sendEmails(order, strict);
    if (!strict) return now;
    // Give the other caller a few seconds to finish before asking Stripe to come back.
    if (tries >= 3) throw new Error(`Emails for order ${order.id} are still being sent`);
    if (now.emailedAt) await sleep(2000);
  }
}

// "finishing": paid, but the cards couldn't be opened just yet (a database hiccup).
export type Fulfilment = { order: Order; state: "paid" | "finishing" | "processing" | "unpaid" };

// Checks a Checkout session with Stripe and, once it's paid, opens the cards and sends
// the emails. Called by the webhook and by the thank-you page; every step is safe to repeat.
// Once paid, email trouble never hides the cards. Only `strict` (the webhook) throws for
// anything left to finish, so that Stripe tries again.
export async function fulfilSession(sessionId: string, { strict = false } = {}): Promise<Fulfilment | null> {
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
      try {
        await markCardsPaid(paid.items.map((i) => i.cardId));
      } catch (e) {
        if (strict) throw e;
        console.error(`Order ${paid.id}: paid, but the cards couldn't be opened yet`, e);
        return { order: paid, state: "finishing" };
      }
      const delivered = await deliver(paid, strict).catch((e) => {
        if (strict) throw e;
        console.error(`Order ${paid.id}: couldn't send its emails`, e);
        return paid;
      });
      return { order: delivered, state: "paid" };
    }
    return { order: paid, state: "unpaid" };
  }
  // A bank transfer or similar that Stripe is still waiting on.
  return { order, state: session.status === "complete" ? "processing" : "unpaid" };
}
