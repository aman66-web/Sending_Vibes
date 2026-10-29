import type { Game, Motion, Occasion, Screen, ScreenStyle, ScreenType, Sticker } from "@/lib/card";
import type { Dict } from "@/i18n/en";

// The pieces the ready-made screens in the Screens tab are written with (see screen-kit.ts),
// so each list reads like a catalogue. Every screen's name and one-line description are in
// the en.ts `kit` section under the same key, which the type below insists on.

export type Names = { to: string; from: string };
export type KitKey = keyof Dict["kit"]["items"];
// Which cards a screen suits: an occasion, "any" card, or "fun" for the playful ones.
export type Tag = Occasion | "any" | "fun";

export type KitItem = {
  key: KitKey;
  type: ScreenType;
  game?: Game;
  emoji: string;
  tags: Tag[];
  make: (names: Names) => Screen;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

type Of<T extends ScreenType> = Extract<Screen, { type: T }>;
type Fields<T extends ScreenType> = Omit<Of<T>, "id" | "type">;

// A ready-made screen of one type: kit.quiz(key, emoji, tags, words). Each one made is
// brand new (its own id and its own copy of the look), so two added from the same item
// never share anything. One builder per type, so TypeScript checks each one's fields.
function builder<T extends Exclude<ScreenType, "game">>(type: T) {
  return (key: KitKey, emoji: string, tags: Tag[], fields: (names: Names) => Fields<T>): KitItem => ({
    key,
    type,
    emoji,
    tags,
    // TypeScript can't follow the type through the spread; scripts/check-kit.ts checks each one.
    make: (names) => structuredClone({ ...fields(names), id: uid(), type }) as unknown as Screen,
  });
}

export const kit = {
  intro: builder("intro"),
  question: builder("question"),
  photos: builder("photos"),
  message: builder("message"),
  quiz: builder("quiz"),
  scratch: builder("scratch"),
  typeit: builder("typeit"),
  wheel: builder("wheel"),
  coupons: builder("coupons"),
  reasons: builder("reasons"),
  slider: builder("slider"),
  timeline: builder("timeline"),
  boxes: builder("boxes"),
  finale: builder("finale"),
};

export function gameKit(game: Game, key: KitKey, emoji: string, tags: Tag[], fields: (names: Names) => Omit<Fields<"game">, "game">): KitItem {
  return { key, type: "game", game, emoji, tags, make: (names) => structuredClone({ ...fields(names), id: uid(), type: "game", game }) as Screen };
}

// Who a screen is for, in the groups the quick filters use.
export const LOVE: Occasion[] = ["valentine", "anniversary", "wedding", "missyou"];
export const FESTIVE: Occasion[] = ["diwali", "christmas", "eid", "halloween", "newyear", "holi"];
export const FAMILY: Occasion[] = ["mothersday", "fathersday", "rakhi", "newbaby"];

// Colours that go together. Text and buttons are checked against the background when
// shown, so none of these can end up unreadable (see lib/screen-style.ts).
export const LOOK = {
  blush: { background: ["#fff0f3", "#ffd3dd"], gradient: "glow", text: "#5a1631", accent: "#c9184a" },
  rouge: { background: ["#8c1c3c", "#3e0718"], gradient: "glow", text: "#fff1f4", accent: "#ffb3c6" },
  wine: { background: ["#4a0f24", "#1c040d"], gradient: "glow", text: "#fbe9ee", accent: "#e8b4bc" },
  midnight: { background: ["#2b3270", "#0c0f2e"], gradient: "glow", text: "#f2efff", accent: "#f2c96b" },
  gold: { background: ["#2e281d", "#0e0c08"], gradient: "glow", text: "#f6ecd4", accent: "#d6b25e" },
  party: { background: ["#fff1a8", "#ffc2d6"], gradient: "diagonal", text: "#3b0f3a", accent: "#7b2cbf" },
  pastel: { background: ["#fde4f2", "#dcefff"], gradient: "diagonal", text: "#3c2b57", accent: "#c34182" },
  sky: { background: ["#e3f4ff", "#b3dcff"], gradient: "down", text: "#143457", accent: "#d23448" },
  spooky: { background: ["#2d1846", "#0c0613"], gradient: "glow", text: "#fbe8cf", accent: "#ff8a1f" },
  pumpkin: { background: ["#ffb066", "#f07a1a"], gradient: "down", text: "#2a1203", accent: "#3b1d5c" },
  diwali: { background: ["#5e1240", "#21041a"], gradient: "glow", text: "#ffedcf", accent: "#f6b53b" },
  marigold: { background: ["#ffcf6b", "#ff8a4c"], gradient: "diagonal", text: "#3d0f12", accent: "#8b1538" },
  noel: { background: ["#1f5b45", "#0a281d"], gradient: "glow", text: "#fbf3e3", accent: "#f25c54" },
  frost: { background: ["#f2f9ff", "#cde5f6"], gradient: "down", text: "#163a5f", accent: "#2f6fbf" },
  eid: { background: ["#155e59", "#052523"], gradient: "glow", text: "#f7f0dc", accent: "#e3ba5f" },
  holi: { background: ["#ffe1f0", "#fff3c4", "#d4f4ff"], gradient: "diagonal", text: "#3e1150", accent: "#d6247a" },
  baby: { background: ["#e9f4ff", "#fde9f2"], gradient: "down", text: "#2d3f66", accent: "#5070b8" },
  garden: { background: ["#f0faf1", "#d3efdc"], gradient: "down", text: "#1e3c2a", accent: "#c93a6a" },
  sunshine: { background: ["#fffbe0", "#ffe38f"], gradient: "glow", text: "#4a2f00", accent: "#b35400" },
  lavender: { background: ["#f5f0fd", "#ddd1f4"], gradient: "down", text: "#38295c", accent: "#6f4fc2" },
  ivory: { background: ["#fffdf6", "#f0e6d0"], gradient: "glow", text: "#3b3223", accent: "#8c6e30" },
  navy: { background: ["#1e3a5f", "#0b1a2d"], gradient: "glow", text: "#f1f5fb", accent: "#f4b942" },
  kraft: { background: ["#ead9b6", "#d2b98a"], gradient: "down", text: "#3a2913", accent: "#a3361c" },
  film: { background: ["#2b2b2e", "#111113"], gradient: "down", text: "#f4f1ea", accent: "#ffcc4d" },
  terminal: { background: ["#0f1a12", "#050906"], gradient: "down", text: "#9dffb0", accent: "#38e07b" },
  sepia: { background: ["#f4e9d6", "#dcc6a2"], gradient: "glow", text: "#3d2b19", accent: "#8a5a2b" },
  peach: { background: ["#fff1e6", "#ffd2b8"], gradient: "glow", text: "#4a2414", accent: "#c4471c" },
  lilac: { background: ["#efe2ff", "#ffd9f0"], gradient: "diagonal", text: "#36174f", accent: "#9c1f9c" },
  coral: { background: ["#ffe3dc", "#ffb4a2"], gradient: "diagonal", text: "#4a1a10", accent: "#b02e24" },
  teal: { background: ["#e0f7f4", "#b2e7df"], gradient: "down", text: "#0f3b36", accent: "#0b7a6d" },
  cork: { background: ["#d9b384", "#b98a55"], gradient: "glow", text: "#2a1a0c", accent: "#7a1f12" },
  vegas: { background: ["#3a0d0d", "#0a0303"], gradient: "glow", text: "#fff3d6", accent: "#ffcc33" },
  fiesta: { background: ["#ff7aa8", "#ffc14d"], gradient: "diagonal", text: "#2b0a1a", accent: "#1d3557" },
  rainbow: { background: ["#fff7d1", "#ffe0f0", "#dff3ff"], gradient: "diagonal", text: "#2d1a4a", accent: "#d33068" },
  candy: { background: ["#ffe4f1", "#d9fff0"], gradient: "diagonal", text: "#4a1438", accent: "#d02a75" },
  rakhi: { background: ["#ffe0b2", "#ffab91"], gradient: "diagonal", text: "#4a1606", accent: "#b0124f" },
  dove: { background: ["#f3f1f8", "#dcd8ea"], gradient: "down", text: "#2f2b45", accent: "#5b4bc4" },
  travel: { background: ["#e6f2ff", "#fff4d6"], gradient: "down", text: "#18324f", accent: "#c24d2c" },
  newyear: { background: ["#1b1446", "#060418"], gradient: "glow", text: "#f5f0ff", accent: "#ffd166" },
  mint: { background: ["#effbf3", "#c9eed6"], gradient: "down", text: "#173d29", accent: "#1d8250" },
  ocean: { background: ["#0f4c75", "#062a43"], gradient: "glow", text: "#eaf6ff", accent: "#7fdbff" },
} satisfies Record<string, ScreenStyle>;

// Stickers in the corners, clear of the words in the middle and the card's own buttons:
// top left (below Back, there from the second screen on), top right (below the sound
// button, which sits lower in previews), bottom left, bottom right, then beside Back and
// along the top by the sound button.
const SPOTS: [number, number, number][] = [
  [9, 15, -12],
  [91, 25, 10],
  [8, 90, 8],
  [92, 88, -10],
  [26, 14, 6],
  [76, 6, -6],
];

export function corners(emoji: string[], size = 9, motion?: Motion): Sticker[] {
  return emoji.slice(0, SPOTS.length).map((e, i) => {
    const [x, y, rotate] = SPOTS[i];
    // Only the first two move, so it's lively without being busy.
    return { emoji: e, x, y, rotate, size: i < 2 ? size : Math.max(4, size - 2), ...(motion && i < 2 ? { motion } : {}) };
  });
}
