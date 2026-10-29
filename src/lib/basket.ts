import type { CardData, Occasion, ThemeName } from "./card";
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

// A card changed after it went in: the new copy takes the old one's place in the list and
// keeps how it was going to be sent.
export function replaceInBasket(oldId: string, item: BasketItem) {
  const items = readBasket();
  if (!items.some((i) => i.id === oldId)) return addToBasket(item);
  writeBasket(items.map((i) => (i.id === oldId ? { ...item, delivery: i.delivery, email: i.email, sendOn: i.sendOn } : i)));
}

export const inBasket = (id: string) => readBasket().some((i) => i.id === id);

// The cards put in the basket from this browser, so "Change this card" can open one again.
// Only the newest few are kept; photos are links, so each card is small.
const MADE_KEY = "sv-made-v1";
const MAX_MADE = 10;

export type Made = { id: string; card: CardData; mode: Tier; at: number };
// A card changed after it went in the basket is saved again under a new id. Its old id
// points to the new one, so an old link (or Back from the basket) still finds it.
type MadeEntry = Made | { id: string; movedTo: string; at: number };

function readMadeList(): MadeEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem(MADE_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((m) => m && typeof m.id === "string") : [];
  } catch {
    return [];
  }
}

export function saveMade(id: string, card: CardData, mode: Tier, replaces?: string) {
  const at = Date.now();
  const list: MadeEntry[] = [
    { id, card, mode, at },
    ...(replaces ? [{ id: replaces, movedTo: id, at }] : []),
    ...readMadeList().filter((m) => m.id !== id && m.id !== replaces),
  ];
  // Only the cards count towards the limit; a pointer is a few bytes.
  let cards = 0;
  const kept = list.filter((m) => !("card" in m) || ++cards <= MAX_MADE).slice(0, MAX_MADE * 3);
  try {
    localStorage.setItem(MADE_KEY, JSON.stringify(kept));
  } catch {
    // Storage nearly full: the newest card matters most.
    try {
      localStorage.setItem(MADE_KEY, JSON.stringify(kept.slice(0, 2)));
    } catch {}
  }
}

// The basket cards there's a copy of here, to change.
export function madeIds() {
  return new Set(readMadeList().flatMap((m) => ("card" in m && Array.isArray(m.card?.screens) && m.card.screens.length > 0 ? [m.id] : [])));
}

export function readMade(id: string): Made | null {
  const list = readMadeList();
  for (let hops = 0; hops < MAX_MADE * 3; hops++) {
    const entry = list.find((m) => m.id === id);
    if (!entry) return null;
    if (!("movedTo" in entry)) return Array.isArray(entry.card?.screens) && entry.card.screens.length > 0 ? entry : null;
    id = entry.movedTo;
  }
  return null;
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
