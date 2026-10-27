import type { Occasion, ThemeName } from "./card";
import type { Tier } from "./pricing";

// The basket lives in the browser until checkout. Each card in it is already saved
// (unpaid) so its link exists, but the link only opens once the order is paid.

export const MAX_BASKET = 20;
// Resend can schedule an email up to 30 days ahead.
export const MAX_SCHEDULE_DAYS = 30;

export type BasketItem = {
  id: string;
  to: string;
  from: string;
  occasion: Occasion;
  theme: ThemeName;
  template?: string;
  // Sets the price shown here; the checkout works it out again from the saved card.
  tier?: Tier;
  delivery: "self" | "email";
  email?: string;
  // A later day to email it on (YYYY-MM-DD); empty sends it as soon as it's paid.
  sendOn?: string;
};

const KEY = "sv-basket";
const EVENT = "sv-basket";

function parse(raw: string | null): BasketItem[] {
  try {
    const items = JSON.parse(raw ?? "[]");
    return Array.isArray(items) ? items.filter((i) => i && typeof i.id === "string") : [];
  } catch {
    return [];
  }
}

function raw() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export const readBasket = () => parse(raw());

// The same array until the basket changes, as useSyncExternalStore needs.
let cache: { raw: string | null; items: BasketItem[] } = { raw: null, items: [] };
export function basketSnapshot(): BasketItem[] {
  const now = raw();
  if (now !== cache.raw) cache = { raw: now, items: parse(now) };
  return cache.items;
}
const EMPTY: BasketItem[] = [];
export const serverBasket = () => EMPTY;

export function writeBasket(items: BasketItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_BASKET)));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function addToBasket(item: BasketItem) {
  writeBasket([...readBasket().filter((i) => i.id !== item.id), item]);
}

export function removeFromBasket(ids: string[]) {
  writeBasket(readBasket().filter((i) => !ids.includes(i.id)));
}

// Calls back whenever the basket changes, in this tab or another.
export function onBasketChange(callback: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && callback();
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
