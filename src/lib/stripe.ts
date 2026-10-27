import "server-only";
import Stripe from "stripe";
import { PRICES, type Currency } from "./pricing";

let client: Stripe | null | undefined;

// Null until STRIPE_SECRET_KEY is set, and checkout says payments aren't on yet.
export function stripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return (client = null);
  // STRIPE_API_BASE points the client at stripe-mock (or a stand-in) when testing locally.
  const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
  client = new Stripe(
    key,
    base ? { host: base.hostname, port: Number(base.port) || undefined, protocol: base.protocol === "http:" ? "http" : "https" } : {},
  );
  return client;
}

const priceIds = new Map<Currency, string | null>();

// The card price as a line item. Uses the catalogue price with lookup key card_gbp / card_usd
// when it exists, so sales report against one product; otherwise the same amount inline.
export async function cardLineItem(s: Stripe, currency: Currency, quantity: number): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  if (!priceIds.has(currency)) {
    const found = await s.prices.list({ lookup_keys: [`card_${currency}`], active: true, limit: 1 }).catch(() => null);
    const match = found?.data[0];
    priceIds.set(currency, match && match.unit_amount === PRICES.card && match.currency === currency ? match.id : null);
  }
  const id = priceIds.get(currency);
  if (id) return { price: id, quantity };
  return {
    price_data: { currency, unit_amount: PRICES.card, product_data: { name: "Interactive card", description: "A personalised interactive e-card, delivered by link" } },
    quantity,
  };
}
