// Every card is paid. One place for prices so the site never disagrees with itself.
// A card costs £9.99 in pounds, $9.99 in US dollars and €9.99 in euros; in other
// currencies it's about the same, rounded to how prices look there. A premade card is one
// of our designs as it comes; a custom (personalised) card is written from their answers,
// or has had screens added, removed or moved (see cardTier in catalog.ts). Both cost the
// same; the tier is still recorded on each order.

type CurrencyInfo = {
  // In the currency's smallest unit, as Stripe takes it (pence, cents; whole yen and won).
  price: number;
  // Written before the number, or after it with `after`.
  symbol: string;
  after?: boolean;
  // A comma before the pennies, as in 39,99 zł.
  comma?: boolean;
  // Stripe counts these in whole units (no pennies).
  zeroDecimal?: boolean;
};

// Symbols are spelt out (not left to Intl) so the server and every browser show the same.
const CURRENCY_INFO = {
  gbp: { price: 999, symbol: "£" },
  usd: { price: 999, symbol: "$" },
  eur: { price: 999, symbol: "€" },
  aed: { price: 3699, symbol: "AED " },
  aud: { price: 1499, symbol: "A$" },
  bdt: { price: 119900, symbol: "৳" },
  brl: { price: 5490, symbol: "R$" },
  cad: { price: 1399, symbol: "CA$" },
  chf: { price: 899, symbol: "CHF " },
  czk: { price: 22900, symbol: " Kč", after: true },
  dkk: { price: 6900, symbol: " kr.", after: true },
  hkd: { price: 7800, symbol: "HK$" },
  idr: { price: 15900000, symbol: "Rp " },
  ils: { price: 3690, symbol: "₪" },
  inr: { price: 84900, symbol: "₹" },
  jpy: { price: 1500, symbol: "¥", zeroDecimal: true },
  krw: { price: 13900, symbol: "₩", zeroDecimal: true },
  mxn: { price: 18900, symbol: "MX$" },
  myr: { price: 4490, symbol: "RM " },
  nok: { price: 10900, symbol: " kr", after: true },
  nzd: { price: 1699, symbol: "NZ$" },
  php: { price: 56900, symbol: "₱" },
  pkr: { price: 279900, symbol: "Rs " },
  pln: { price: 3999, symbol: " zł", after: true, comma: true },
  sar: { price: 3799, symbol: "SAR " },
  sek: { price: 9900, symbol: " kr", after: true },
  sgd: { price: 1399, symbol: "S$" },
  thb: { price: 34900, symbol: "฿" },
  zar: { price: 17900, symbol: "R" },
} satisfies Record<string, CurrencyInfo>;

export type Currency = keyof typeof CURRENCY_INFO;
export const CURRENCIES = Object.keys(CURRENCY_INFO) as Currency[];
// Shown first in the currency menu; the rest follow in alphabetical order.
export const COMMON_CURRENCIES: Currency[] = ["gbp", "usd", "eur"];
export const DEFAULT_CURRENCY: Currency = "gbp";
export const CURRENCY_COOKIE = "cur";

export const isCurrency = (value: unknown): value is Currency => typeof value === "string" && Object.hasOwn(CURRENCY_INFO, value);

export type Tier = "premade" | "custom";
// A card's price in that currency, in its smallest unit. Both kinds of card cost the same.
export const tierPrice = (_tier: Tier, currency: Currency) => (CURRENCY_INFO[currency] as CurrencyInfo).price;

// The short symbol for the currency button, e.g. "A$" or "kr".
export const currencySymbol = (currency: Currency) => CURRENCY_INFO[currency].symbol.trim();

// Whether Stripe counts this currency in whole units.
export const zeroDecimal = (currency: Currency) => Boolean((CURRENCY_INFO[currency] as CurrencyInfo).zeroDecimal);

// An amount as a plain number in the main unit, e.g. "9.99" or "1500" (yen), for search engines.
export const plainAmount = (minor: number, currency: Currency) => (zeroDecimal(currency) ? String(minor) : (minor / 100).toFixed(2));

// An amount in the currency's smallest unit, e.g. 2997 gbp → "£29.97", 84900 inr → "₹849".
// Whole amounts drop the pennies.
export function formatMoney(minor: number, currency: Currency) {
  const info: CurrencyInfo = CURRENCY_INFO[currency];
  const major = info.zeroDecimal ? minor : minor / 100;
  const [whole, pennies] = (Number.isInteger(major) ? String(major) : major.toFixed(2)).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, info.comma ? " " : ",");
  const number = pennies ? `${grouped}${info.comma ? "," : "."}${pennies}` : grouped;
  return info.after ? `${number}${info.symbol}` : `${info.symbol}${number}`;
}

export function price(tier: "card" | "custom", currency: Currency) {
  return formatMoney(tierPrice(tier === "custom" ? "custom" : "premade", currency), currency);
}

// Countries that pay in each currency other than dollars, which everyone else pays in.
const COUNTRIES: Partial<Record<Currency, string[]>> = {
  gbp: ["GB", "JE", "GG", "IM"],
  eur: ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK", "AD", "MC", "SM", "VA", "ME", "XK", "GP", "MQ", "GF", "RE", "YT", "PM", "BL", "MF"],
  aed: ["AE"],
  aud: ["AU", "CX", "CC", "NF", "NR", "KI", "TV"],
  bdt: ["BD"],
  brl: ["BR"],
  cad: ["CA"],
  chf: ["CH", "LI"],
  czk: ["CZ"],
  dkk: ["DK", "GL", "FO"],
  hkd: ["HK"],
  idr: ["ID"],
  ils: ["IL"],
  inr: ["IN"],
  jpy: ["JP"],
  krw: ["KR"],
  mxn: ["MX"],
  myr: ["MY"],
  nok: ["NO", "SJ"],
  nzd: ["NZ", "CK", "NU", "PN", "TK"],
  php: ["PH"],
  pkr: ["PK"],
  pln: ["PL"],
  sar: ["SA"],
  sek: ["SE"],
  sgd: ["SG"],
  thb: ["TH"],
  zar: ["ZA"],
};
const BY_COUNTRY = new Map(Object.entries(COUNTRIES).flatMap(([currency, countries]) => countries.map((c) => [c, currency as Currency])));

// The currency for a country: its own, or dollars.
export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return DEFAULT_CURRENCY;
  return BY_COUNTRY.get(country.toUpperCase()) ?? "usd";
}

// The currency a visitor sees and pays in: always their own country's (Vercel says where
// they are), so nobody can see or pay what a card costs somewhere else. Only without a
// country, as when running the site locally, does a saved one count.
export function visitorCurrency(country: string | null | undefined, saved: string | null | undefined): Currency {
  if (country) return currencyForCountry(country);
  return isCurrency(saved) ? saved : DEFAULT_CURRENCY;
}
