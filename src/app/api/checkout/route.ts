import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, fmt, isLive, type Locale } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { alertOwner } from "@/lib/alert";
import { currentAccount } from "@/lib/auth";
import { MAX_BASKET, MAX_SCHEDULE_DAYS } from "@/lib/basket";
import { emailReady } from "@/lib/email";
import { createOrder, ordersReady, setOrderSession, type OrderItem } from "@/lib/orders";
import { cardTier } from "@/lib/catalog";
import { errorFields } from "@/lib/log";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency, type Tier } from "@/lib/pricing";
import { clientNetwork } from "@/lib/rate-limit";
import { getCard } from "@/lib/storage";
import { cardLineItem, stripe } from "@/lib/stripe";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().regex(/^[A-Za-z0-9]{12}$/),
        delivery: z.enum(["self", "email"]),
        email: z.email().max(254).optional(),
        sendOn: z.iso.date().optional(),
        sendAt: z.iso.datetime({ offset: true }).optional(),
      }),
    )
    .min(1)
    .max(MAX_BASKET),
});

// Languages Stripe's checkout page speaks; the rest follow the visitor's browser.
const STRIPE_LOCALES: Partial<Record<Locale, Stripe.Checkout.SessionCreateParams.Locale>> = { en: "en", es: "es", fr: "fr", pl: "pl" };

// Each checkout creates a Stripe session, so keep it to a sensible rate per visitor.
const WINDOW_MS = 10 * 60_000;
const LIMIT = 10;
const recent = new Map<string, number[]>();

function allowed(ip: string) {
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= LIMIT) return false;
  times.push(now);
  recent.set(ip, times);
  return true;
}

export async function POST(req: NextRequest) {
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLive(lang) ? lang : DEFAULT_LOCALE;
  const errors = DICTS[locale].basket.errors;
  const fail = (error: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail(errors.failed, 403);
  const s = stripe();
  if (!s || !ordersReady()) return fail(errors.notReady, 503);
  const ip = clientNetwork(req.headers);
  if (!allowed(ip)) return fail(errors.tooMany, 429);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(errors.failed, 400);

  const cur = req.cookies.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(cur) ? cur : DEFAULT_CURRENCY;
  const now = Date.now();
  const seen = new Set<string>();
  const items: OrderItem[] = [];
  const gone: string[] = [];

  try {
    for (const wanted of parsed.data.items) {
      if (seen.has(wanted.id)) continue;
      seen.add(wanted.id);
      const card = await getCard(wanted.id);
      // Already paid for (a second tab, say) or deleted: drop it from the basket.
      if (!card || card.paid) {
        gone.push(wanted.id);
        continue;
      }
      // Names and price come from the saved card, not the browser.
      const item: OrderItem = { cardId: wanted.id, to: card.to, from: card.from, tier: cardTier(card), occasion: card.occasion, theme: card.theme, template: card.template, delivery: wanted.delivery };
      if (wanted.delivery === "email") {
        if (!emailReady()) return fail(errors.noEmail, 400, { id: wanted.id });
        if (!wanted.email) return fail(fmt(errors.needEmail, { name: card.to }), 400, { id: wanted.id });
        item.email = wanted.email;
        if (wanted.sendAt) {
          const at = Date.parse(wanted.sendAt);
          // Resend books emails up to MAX_SCHEDULE_DAYS ahead; keep an hour's room, since
          // it's booked when payment comes through, not now. The basket offers one day less.
          if (at > now + MAX_SCHEDULE_DAYS * 86_400_000 - 3_600_000) return fail(fmt(errors.tooFar, { days: MAX_SCHEDULE_DAYS - 1 }), 400, { id: wanted.id });
          if (at > now + 2 * 60_000) Object.assign(item, { sendAt: new Date(at).toISOString(), sendOn: wanted.sendOn });
        }
      }
      items.push(item);
    }
    if (gone.length) return fail(errors.gone, 409, { gone });

    const site = req.nextUrl.origin;
    // Signed in? Then the order shows up in their account and Stripe already knows their email.
    const account = await currentAccount().catch(() => null);
    const order = await createOrder({ currency, locale, site, items, userId: account?.id });
    const session = await s.checkout.sessions.create({
      mode: "payment",
      line_items: await Promise.all(
        (["premade", "custom"] as Tier[])
          .map((tier) => ({ tier, count: items.filter((i) => i.tier === tier).length }))
          .filter((g) => g.count > 0)
          .map((g) => cardLineItem(s, currency, g.tier, g.count)),
      ),
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      success_url: `${site}/basket/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/basket`,
      customer_email: account?.email ?? undefined,
      allow_promotion_codes: true,
      submit_type: "pay",
      locale: STRIPE_LOCALES[locale] ?? "auto",
    });
    await setOrderSession(order.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Checkout failed", e);
    await alertOwner("Checkout failed", errorFields(e));
    return fail(errors.failed, 500);
  }
}
