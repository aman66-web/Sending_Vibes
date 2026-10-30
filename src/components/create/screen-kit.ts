import type { Occasion, Screen, ScreenType } from "@/lib/card";
import { ENDINGS } from "./kit/endings";
import { GAME_EMOJI, GAMES_KIT } from "./kit/games";
import { OPENINGS } from "./kit/openings";
import { FAMILY, FESTIVE, LOVE, uid, type KitItem } from "./kit/parts";
import { QUESTIONS, SURPRISES } from "./kit/surprises";
import { WORDS } from "./kit/words";

// Ready-made screens to add to a card, like slide layouts in a presentation: several of
// each kind, each with a look and words of its own (see kit/*.ts). Where the words are
// theirs to write, they say what goes there ("Type your question here"), so it's clear what
// each screen is for and what to change; see lib/blanks.ts. Names and descriptions are in
// the en.ts `kit` section, by each screen's key.

export type { KitItem, KitKey, Names, Tag } from "./kit/parts";
export { GAME_EMOJI };

export type KitGroupKey = "start" | "yesno" | "words" | "fun" | "games" | "end";

export const KIT_GROUPS: { key: KitGroupKey; items: KitItem[] }[] = [
  { key: "start", items: OPENINGS },
  // The questions whose No button runs away, the card's best-known trick.
  { key: "yesno", items: QUESTIONS },
  { key: "words", items: WORDS },
  { key: "fun", items: SURPRISES },
  { key: "games", items: GAMES_KIT },
  { key: "end", items: ENDINGS },
];

// Every ready-made screen, in the order they're shown.
export const KIT: KitItem[] = KIT_GROUPS.flatMap((g) => g.items);

// One by its key ("quiz", "intro:midnight", "game:blow-candles").
export const kitItem = (key: string) => KIT.find((k) => k.key === key);

// The quick filters above the screens: this card's occasion first, then the big ones.
export const KIT_FILTERS = ["card", "birthday", "love", "festive", "family", "fun", "all"] as const;
export type KitFilter = (typeof KIT_FILTERS)[number];

const FILTER_OCCASIONS: Record<"birthday" | "love" | "festive" | "family", Occasion[]> = { birthday: ["birthday"], love: LOVE, festive: FESTIVE, family: FAMILY };

// How well a screen suits a card for this occasion: made for it (2 and a bit more, the
// fewer other occasions it's for), then good for any card (1), then not really (0).
export function fit(item: KitItem, occasion: Occasion) {
  if (item.tags.includes(occasion)) return 2 + 0.5 / item.tags.filter((t) => t !== "any" && t !== "fun").length;
  return item.tags.includes("any") ? 1 : 0;
}

export function inFilter(item: KitItem, filter: KitFilter, occasion: Occasion) {
  if (filter === "card") return fit(item, occasion) > 0;
  if (filter === "all") return true;
  if (filter === "fun") return item.tags.includes("fun");
  return FILTER_OCCASIONS[filter].some((o) => item.tags.includes(o));
}

// A group's screens, the best for this card first. The first few are each a different kind
// of screen (or a different game) where there's a choice, so the first look shows the range.
export function ranked(items: KitItem[], occasion: Occasion, first = 6) {
  const score = new Map(items.map((item) => [item, fit(item, occasion)]));
  const tier = (item: KitItem) => Math.floor(score.get(item)!);
  const kind = (item: KitItem) => item.game ?? item.type;
  const rest = items.map((item, i) => ({ item, i })).sort((a, b) => score.get(b.item)! - score.get(a.item)! || a.i - b.i).map((x) => x.item);
  const top: KitItem[] = [];
  while (top.length < first && rest.length) {
    const seen = new Set(top.map(kind));
    const next = rest.findIndex((item) => tier(item) === tier(rest[0]) && !seen.has(kind(item)));
    top.push(rest.splice(Math.max(next, 0), 1)[0]);
  }
  return [...top, ...rest];
}

// Lower case without accents, so "pinata" finds "piñata".
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

// Whether every word searched for is in this text. "Candles" finds "candle", too.
export function matches(text: string, search: string) {
  const hay = fold(text);
  return fold(search)
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean)
    .every((word) => hay.includes(word) || (word.length > 3 && word.endsWith("s") && hay.includes(word.slice(0, -1))));
}

// A copy of a screen with a new id, for duplicating it.
export const copyScreen = (s: Screen): Screen => ({ ...structuredClone(s), id: uid() });

// The plain one of each kind of screen stands for it ("quiz", "message").
const TYPE_EMOJI = new Map<ScreenType, string>(KIT.filter((k) => k.key === k.type).map((k) => [k.type, k.emoji]));

// The emoji that stands for a screen in the screens strip.
export function screenEmoji(s: Screen) {
  return s.type === "game" ? GAME_EMOJI[s.game] : (TYPE_EMOJI.get(s.type) ?? "▫️");
}
