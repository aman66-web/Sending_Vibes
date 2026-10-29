import { fmt } from "@/i18n/config";
import type { Dict } from "@/i18n/en";
import type { ScreenType } from "./card";
import type { Template } from "./catalog";

// One picture for each kind of screen, on design pages and tiles.
export const SCREEN_ICONS: Record<ScreenType, string> = {
  intro: "✉️",
  question: "🙅",
  photos: "📸",
  message: "💌",
  game: "🎮",
  quiz: "❓",
  scratch: "🪙",
  typeit: "⌨️",
  wheel: "🎡",
  coupons: "🎟️",
  reasons: "🫙",
  slider: "📈",
  timeline: "🗓️",
  boxes: "🎁",
  finale: "🎆",
};

// The kinds of screen between the envelope and the finale (which every card has), in the
// order they first come, with how many games there are.
const kindsCache = new Map<string, { kinds: ScreenType[]; games: number }>();
function kindsOf(tpl: Template) {
  let found = kindsCache.get(tpl.slug);
  if (!found) {
    const screens = tpl.screens("", "");
    const kinds: ScreenType[] = [];
    for (const s of screens) if (s.type !== "intro" && s.type !== "finale" && !kinds.includes(s.type)) kinds.push(s.type);
    found = { kinds, games: screens.filter((s) => s.type === "game").length };
    kindsCache.set(tpl.slug, found);
  }
  return found;
}

// What's inside a design, short enough for its tile: "🎮 2 games · 📸 photos · 💌 letter".
export function insideLine(tpl: Template, t: Dict, max = 3): string {
  const { kinds, games } = kindsOf(tpl);
  const words: Partial<Record<ScreenType, string>> = t.catalog.inside;
  return kinds
    .slice(0, max)
    .map((k) => {
      const label = k === "game" ? (games === 1 ? t.catalog.inside.game : fmt(t.catalog.inside.games, { n: games })) : (words[k] ?? t.labels.screens[k].toLowerCase());
      return `${SCREEN_ICONS[k]} ${label}`;
    })
    .join(" · ");
}
