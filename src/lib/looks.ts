import type { Effect, Font, Occasion, Pattern, ScreenStyle, ThemeName } from "./card";

// The looks people pick from before a card is made ("Soft & cute", "Midnight & stars"):
// colours, fonts and a background effect the card writer must use (see lib/generate.ts).
// Plain data with no React, so the server can read it too.

export type Look = {
  key: string;
  // In English, for the card writer. The site shows its own words for it (t.looks.names).
  name: string;
  theme: ThemeName;
  background: string[];
  gradient?: "down" | "diagonal" | "glow";
  text?: string;
  accent: string;
  envelope: string;
  heading: Font;
  body: Font;
  pattern?: Pattern;
  ambient: Effect;
  // What goes off at its big moments (the envelope opening, the finale), when it has its own.
  burst?: Effect;
  stickers: string[];
  // Occasions it suits best, the one it was made for first; it can be picked for any.
  suits: Occasion[];
  // Feelings it suits: catalog TONES and a few more ("elegant", "gentle", "cheeky",
  // "nostalgic", "blessings"), used to put it higher when they're picked.
  feels: string[];
};

// Every colour pairing here keeps its words readable (checked with lib/screen-style.ts):
// the text on both background colours, and the buttons against the background.
// The order is the order to show them in when nothing else decides it.
export const LOOKS: Look[] = [
  {
    key: "classic",
    name: "Classic & elegant",
    theme: "ivory",
    background: ["#f8f3e8", "#ebdfc6"],
    gradient: "glow",
    text: "#2f2a21",
    accent: "#8a6a32",
    envelope: "#fffdf8",
    heading: "classic",
    body: "classic",
    ambient: "sparkles",
    stickers: ["🤍", "🕊️"],
    suits: ["wedding", "anniversary", "thanks", "mothersday", "birthday", "eid", "diwali", "christmas", "newyear", "sorry", "getwell", "newbaby", "leaving", "congrats", "valentine", "graduation", "retirement"],
    feels: ["elegant", "heartfelt", "blessings", "romantic", "gentle"],
  },
  {
    key: "party",
    name: "Bright & playful",
    theme: "party",
    background: ["#ffe27a", "#ff9fb8"],
    gradient: "diagonal",
    text: "#2b1a10",
    accent: "#6d28b8",
    envelope: "#fffcf2",
    heading: "bold",
    body: "rounded",
    pattern: "zigzag",
    ambient: "confetti",
    stickers: ["🎉", "🎈"],
    suits: ["birthday", "congrats", "friendship", "rakhi", "holi", "newyear", "leaving", "fathersday", "thanks", "halloween", "graduation", "retirement", "newhome"],
    feels: ["funny", "festive", "cheeky", "cute"],
  },
  {
    key: "cute",
    name: "Soft & cute",
    theme: "lavender",
    background: ["#fde4ef", "#e6dbf7"],
    gradient: "diagonal",
    text: "#3d2350",
    accent: "#b8326f",
    envelope: "#fff7fb",
    heading: "rounded",
    body: "rounded",
    pattern: "dots",
    ambient: "hearts",
    stickers: ["🧸", "💗"],
    suits: ["sorry", "valentine", "newbaby", "friendship", "missyou", "birthday", "getwell", "mothersday", "rakhi", "holi", "eid", "newhome"],
    feels: ["cute", "gentle", "funny", "cheeky", "romantic"],
  },
  {
    key: "garden",
    name: "Fresh garden",
    theme: "mint",
    background: ["#f4f8ee", "#d6e5cb"],
    gradient: "glow",
    text: "#22301f",
    accent: "#3d6837",
    envelope: "#fffdf6",
    heading: "storybook",
    body: "modern",
    ambient: "petals",
    stickers: ["🌷", "🌿"],
    suits: ["getwell", "mothersday", "thanks", "wedding", "newbaby", "eid", "sorry", "birthday", "friendship", "missyou", "holi", "newhome"],
    feels: ["gentle", "heartfelt", "cute", "blessings"],
  },
  {
    key: "midnight",
    name: "Midnight & stars",
    theme: "midnight",
    background: ["#262d58", "#0c1030"],
    gradient: "glow",
    text: "#eeedf8",
    accent: "#f0c46c",
    envelope: "#f4efe6",
    heading: "classic",
    body: "modern",
    ambient: "stars",
    stickers: ["💫", "⭐"],
    suits: ["missyou", "eid", "newyear", "diwali", "anniversary", "valentine", "christmas", "halloween", "leaving", "birthday", "retirement"],
    feels: ["romantic", "heartfelt", "nostalgic", "gentle", "elegant"],
  },
  {
    key: "blush",
    name: "Rose & blush",
    theme: "rose",
    background: ["#fcefec", "#f2cfcd"],
    gradient: "glow",
    text: "#4a1626",
    accent: "#a3324f",
    envelope: "#fffaf7",
    heading: "script",
    body: "classic",
    ambient: "petals",
    stickers: ["🌹", "💕"],
    suits: ["valentine", "wedding", "mothersday", "anniversary", "sorry", "missyou", "getwell", "birthday"],
    feels: ["romantic", "heartfelt", "gentle", "elegant", "cute"],
  },
  {
    key: "blackgold",
    name: "Black & gold",
    theme: "gold",
    background: ["#2e2924", "#0d0b09"],
    gradient: "glow",
    text: "#f5ecd8",
    accent: "#d4af55",
    envelope: "#ead5a0",
    heading: "classic",
    body: "modern",
    ambient: "sparkles",
    burst: "fireworks",
    stickers: ["🥂", "✨"],
    suits: ["newyear", "congrats", "wedding", "anniversary", "diwali", "birthday", "eid", "christmas", "leaving", "fathersday", "halloween", "graduation", "retirement"],
    feels: ["elegant", "festive"],
  },
  {
    key: "jewel",
    name: "Jewel & gold",
    theme: "marigold",
    background: ["#5c1a48", "#250a1e"],
    gradient: "glow",
    text: "#f8ead0",
    accent: "#e2aa3e",
    envelope: "#fbecd2",
    heading: "storybook",
    body: "modern",
    ambient: "lanterns",
    stickers: ["🪔", "✨"],
    suits: ["diwali", "rakhi", "wedding", "holi", "newyear", "anniversary", "thanks"],
    feels: ["festive", "blessings", "elegant", "heartfelt"],
  },
  {
    key: "crescent",
    name: "Moonlit emerald",
    theme: "crescent",
    background: ["#1b5753", "#072222"],
    gradient: "glow",
    text: "#f4ecd8",
    accent: "#dcb86c",
    envelope: "#f6efdc",
    heading: "script",
    body: "classic",
    ambient: "stars",
    stickers: ["🌙", "✨"],
    suits: ["eid", "missyou", "wedding", "thanks"],
    feels: ["blessings", "elegant", "festive", "gentle", "heartfelt"],
  },
  {
    key: "cosy",
    name: "Cosy Christmas",
    theme: "sunset",
    background: ["#fbf3e6", "#efd9bf"],
    gradient: "glow",
    text: "#3b1f17",
    accent: "#a8302b",
    envelope: "#b3312b",
    heading: "handwritten",
    body: "classic",
    pattern: "checks",
    ambient: "snow",
    stickers: ["🎄", "🧦"],
    suits: ["christmas"],
    feels: ["festive", "heartfelt", "nostalgic", "cute", "funny"],
  },
  {
    key: "evergreen",
    name: "Evergreen & gold",
    theme: "noel",
    background: ["#21523f", "#0b2419"],
    gradient: "glow",
    text: "#f7f0e2",
    accent: "#e2b866",
    envelope: "#f6efe0",
    heading: "classic",
    body: "classic",
    ambient: "snow",
    stickers: ["🎁", "❄️"],
    suits: ["christmas"],
    feels: ["festive", "elegant", "blessings", "heartfelt"],
  },
  {
    key: "sky",
    name: "Sky & clouds",
    theme: "sky",
    background: ["#f0f6fc", "#cde0f2"],
    gradient: "glow",
    text: "#1c2a43",
    accent: "#2d5a96",
    envelope: "#ffffff",
    heading: "rounded",
    body: "modern",
    ambient: "bubbles",
    stickers: ["☁️", "💙"],
    suits: ["newbaby", "getwell", "fathersday", "missyou", "sorry", "thanks", "birthday", "friendship", "mothersday", "eid", "newhome"],
    feels: ["gentle", "cute", "heartfelt"],
  },
  {
    key: "doodle",
    name: "Notebook doodles",
    theme: "party",
    background: ["#fffef7", "#f3efdf"],
    gradient: "down",
    text: "#1f2a44",
    accent: "#d63b2a",
    envelope: "#fff1a8",
    heading: "marker",
    body: "rounded",
    pattern: "grid",
    ambient: "balloons",
    stickers: ["✏️", "😜"],
    suits: ["friendship", "birthday", "fathersday", "leaving", "sorry", "getwell", "valentine", "congrats", "halloween", "rakhi", "graduation", "retirement", "newhome"],
    feels: ["funny", "cheeky", "cute", "nostalgic"],
  },
  {
    key: "vintage",
    name: "Vintage letter",
    theme: "sunset",
    background: ["#f5ead4", "#e4cfa8"],
    gradient: "glow",
    text: "#3d2a1a",
    accent: "#94452a",
    envelope: "#d6bb8c",
    heading: "typewriter",
    body: "classic",
    pattern: "stripes",
    ambient: "none",
    stickers: ["📮", "🕰️"],
    suits: ["fathersday", "leaving", "anniversary", "missyou", "thanks", "christmas", "mothersday", "birthday", "retirement"],
    feels: ["nostalgic", "heartfelt", "gentle"],
  },
  {
    key: "minimal",
    name: "Clean & simple",
    theme: "baby",
    background: ["#ffffff", "#eeede9"],
    gradient: "down",
    text: "#1d1d1f",
    accent: "#1d1d1f",
    envelope: "#e7e2d8",
    heading: "modern",
    body: "modern",
    ambient: "none",
    stickers: ["🖤", "✉️"],
    suits: ["leaving", "thanks", "congrats", "sorry", "getwell", "fathersday", "newbaby", "wedding", "birthday", "newyear", "graduation", "retirement"],
    feels: ["elegant", "heartfelt", "gentle"],
  },
  {
    key: "rainbow",
    name: "Rainbow colours",
    theme: "holi",
    background: ["#ffd3e6", "#fff0b3", "#c6f0de"],
    gradient: "diagonal",
    text: "#341a3a",
    accent: "#b0175f",
    envelope: "#ffffff",
    heading: "bold",
    body: "modern",
    ambient: "colours",
    stickers: ["🌈", "🎨"],
    suits: ["holi", "rakhi", "birthday", "friendship", "congrats", "newbaby", "diwali", "graduation", "newhome"],
    feels: ["festive", "funny", "cute", "cheeky"],
  },
  {
    key: "velvet",
    name: "Red velvet",
    theme: "marigold",
    background: ["#7d1733", "#3a0715"],
    gradient: "glow",
    text: "#fff1ec",
    accent: "#f5b4c3",
    envelope: "#fbeee8",
    heading: "script",
    body: "modern",
    ambient: "hearts",
    stickers: ["❤️", "💌"],
    suits: ["valentine", "anniversary", "halloween", "wedding", "diwali", "birthday"],
    feels: ["romantic", "cheeky", "elegant", "heartfelt"],
  },
  {
    key: "spooky",
    name: "Spooky night",
    theme: "spooky",
    background: ["#30264a", "#110c18"],
    gradient: "glow",
    text: "#f2eadc",
    accent: "#f08a2c",
    envelope: "#efe2c2",
    heading: "spooky",
    body: "modern",
    ambient: "spooky",
    stickers: ["🎃", "🦇"],
    suits: ["halloween"],
    feels: ["funny", "cheeky", "festive"],
  },
];

const BY_KEY = new Map(LOOKS.map((l) => [l.key, l]));

// A look by its key, or nothing for an empty or unknown one (an old saved choice, or a
// key from a request, which is never trusted).
export function getLook(key: string | undefined | null): Look | undefined {
  return key ? BY_KEY.get(key) : undefined;
}

// The look as a screen's own style (see lib/card.ts), for showing it or putting it on a card.
export function lookStyle(look: Look): ScreenStyle {
  return {
    background: look.background,
    gradient: look.gradient,
    text: look.text,
    accent: look.accent,
    envelope: look.envelope,
    heading: look.heading,
    body: look.body,
    pattern: look.pattern,
  };
}

// How many are offered first, before "More looks".
export const TOP_LOOKS = 6;

// How well a look fits: the occasion it was made for counts most, then the others it
// suits, a little less for each place down its list. The feelings picked come next, the
// first one most; together they can lift a look that fits past the one made for the
// occasion (a "Funny" Valentine's puts Soft & cute first), but a look that doesn't fit
// the occasion always comes after every one that does.
const MADE_FOR = 10;
const SUITS = 7;
const FEELS = [5, 3, 2];
const MOST_FEELS = 8;
// Looks made for these carry the festival's own symbols (diyas, a crescent moon, a tree,
// a pumpkin), so with no occasion picked they don't fit until one of theirs is.
const FESTIVALS: Occasion[] = ["diwali", "eid", "christmas", "halloween"];

function score(look: Look, occasion: Occasion | "" | undefined, feelings: string[]) {
  let fit: number;
  if (occasion) {
    const at = look.suits.indexOf(occasion);
    fit = at < 0 ? 0 : at === 0 ? MADE_FOR : Math.max(SUITS - (at - 1) * 0.5, 3);
  } else {
    fit = FESTIVALS.includes(look.suits[0]) ? 0 : 1;
  }
  let feel = 0;
  feelings.forEach((f, i) => {
    if (look.feels.includes(f)) feel += FEELS[Math.min(i, FEELS.length - 1)];
  });
  feel = Math.min(feel, MOST_FEELS);
  // Below 1 for a look that doesn't fit, so the feelings only order those among themselves.
  return fit ? fit + feel : feel / 10;
}

// Dark backgrounds (light words) or light ones (dark words), by their colours on average.
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const DARK = new Set(LOOKS.filter((l) => l.background.reduce((sum, c) => sum + luminance(c), 0) / l.background.length < 0.18).map((l) => l.key));
export const isDarkLook = (look: Look) => DARK.has(look.key);

// The looks in the order to offer them for this occasion and these feelings, best first.
// Every look is returned once, so the rest can follow under "More looks". The first few
// include a light one and a dark one whenever both fit, so there's a real choice.
export function rankLooks(occasion: Occasion | "" | undefined, tones: string[] = []): Look[] {
  const feelings = [...new Set(tones.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  const ranked = LOOKS.map((look, i) => ({ look, i, score: score(look, occasion, feelings) })).sort((a, b) => b.score - a.score || a.i - b.i);

  // All light or all dark: the best of the other kind that fits takes the last of the first places.
  const top = ranked.slice(0, TOP_LOOKS);
  const dark = top.filter((r) => isDarkLook(r.look)).length;
  if (dark === 0 || dark === top.length) {
    const other = ranked.findIndex((r, i) => i >= TOP_LOOKS && r.score >= 1 && isDarkLook(r.look) !== isDarkLook(top[0].look));
    if (other >= 0) ranked.splice(TOP_LOOKS - 1, 0, ...ranked.splice(other, 1));
  }
  return ranked.map((r) => r.look);
}
