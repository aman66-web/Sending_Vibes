import "server-only";
import Stripe from "stripe";
import { tierPrice, type Currency, type Tier } from "./pricing";

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

const priceIds = new Map<string, string | null>();

const PRODUCTS: Record<Tier, { lookup: string; name: string; description: string }> = {
  premade: { lookup: "card", name: "Interactive card", description: "A personalised interactive e-card, delivered by link" },
  custom: { lookup: "custom_card", name: "Personalised interactive card", description: "An interactive e-card made from your answers, delivered by link" },
};

// A card's price as a line item. Uses the catalogue price with lookup key card_gbp,
// custom_card_usd and so on when it exists, so sales report against one product;
// otherwise the same amount inline.
export async function cardLineItem(s: Stripe, currency: Currency, tier: Tier, quantity: number): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const product = PRODUCTS[tier];
  const key = `${product.lookup}_${currency}`;
  const amount = tierPrice(tier, currency);
  if (!priceIds.has(key)) {
    const found = await s.prices.list({ lookup_keys: [key], active: true, limit: 1 }).catch(() => null);
    const match = found?.data[0];
    priceIds.set(key, match && match.unit_amount === amount && match.currency === currency ? match.id : null);
  }
  const id = priceIds.get(key);
  if (id) return { price: id, quantity };
  return { price_data: { currency, unit_amount: amount, product_data: { name: product.name, description: product.description } }, quantity };
}
