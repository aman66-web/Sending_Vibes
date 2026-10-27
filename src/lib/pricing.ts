// Every card is paid. One place for prices so the site never disagrees with itself.
// Prices are the same number in each currency: £9.99 in the UK, $9.99 everywhere else.

export const CURRENCIES = ["gbp", "usd"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "gbp";
export const CURRENCY_COOKIE = "cur";

export const isCurrency = (value: unknown): value is Currency => typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);

// In pence or cents.
export const PRICES = {
  card: 999,
  aiCustom: 1499,
} as const;

const SYMBOLS: Record<Currency, string> = { gbp: "£", usd: "$" };

// An amount in pence or cents, e.g. 2997 → "£29.97".
export function formatMoney(minor: number, currency: Currency) {
  return `${SYMBOLS[currency]}${(minor / 100).toFixed(2)}`;
}

export function price(item: keyof typeof PRICES, currency: Currency) {
  return formatMoney(PRICES[item], currency);
}

// Visitors in the UK (and the Crown Dependencies) pay in pounds, everyone else in dollars.
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return DEFAULT_CURRENCY;
  return ["GB", "JE", "GG", "IM"].includes(country.toUpperCase()) ? "gbp" : "usd";
}
