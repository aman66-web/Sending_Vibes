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

// A card's price as a line item: the catalogue price with lookup key card_gbp, custom_card_usd
// and so on, made in Stripe the first time it's needed. Sales then report against one product
// for each kind of card, and Stripe's promotion codes apply to it as they do to any catalogue
// product (they're refused on a price made up inline). Inline only if Stripe won't make it.
export async function cardLineItem(s: Stripe, currency: Currency, tier: Tier, quantity: number): Promise<Stripe.Checkout.SessionCreateParams.LineItem> {
  const product = PRODUCTS[tier];
  const key = `${product.lookup}_${currency}`;
  const amount = tierPrice(tier, currency);
  if (!priceIds.has(key)) priceIds.set(key, await catalogPrice(s, tier, currency, amount, key));
  const id = priceIds.get(key);
  if (id) return { price: id, quantity };
  return { price_data: { currency, unit_amount: amount, product_data: { name: product.name, description: product.description } }, quantity };
}

// The price with this lookup key, at this amount: the one already there, or a new one on the
// product for this kind of card (taking the key over from an old amount). Null if Stripe can't.
async function catalogPrice(s: Stripe, tier: Tier, currency: Currency, amount: number, key: string): Promise<string | null> {
  try {
    const found = await s.prices.list({ lookup_keys: [key], active: true, limit: 1 });
    const match = found.data[0];
    if (match && match.unit_amount === amount && match.currency === currency) return match.id;
    const price = await s.prices.create(
      { product: await cardProduct(s, tier), currency, unit_amount: amount, lookup_key: key, transfer_lookup_key: true },
      // Two checkouts at once make it only once.
      { idempotencyKey: `envelette-price-${key}-${amount}` },
    );
    return price.id;
  } catch (e) {
    console.error(`Couldn't find or make the Stripe price ${key}; using an inline one`, e);
    return null;
  }
}

// The one catalogue product for each kind of card, with an id of our own so it's found again.
async function cardProduct(s: Stripe, tier: Tier) {
  const { lookup, name, description } = PRODUCTS[tier];
  const id = `envelette_${lookup}`;
  const existing = await s.products.retrieve(id).catch(() => null);
  if (existing && !existing.deleted) {
    if (!existing.active) await s.products.update(id, { active: true });
    return id;
  }
  await s.products.create({ id, name, description }, { idempotencyKey: `envelette-product-${id}` });
  return id;
}
