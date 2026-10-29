import type { CardData, Effect, Font, Occasion, Pattern, Screen, ScreenStyle, Sticker, ThemeName, Transition } from "./card";
import { TEMPLATES, getTemplate, type Tone } from "./catalog";
import { contrast } from "./screen-style";
import { themes } from "./themes";

// A new look for a card without touching a word of it: its colours, fonts, pattern,
// stickers, bursts, transitions and background effect, all picked from a seed, so the same
// seed always gives the same look. The screens, their order, games and lists stay exactly
// as they are, so a ready-made design is still priced as one (see cardTier in catalog.ts).
// Their own photos and text boxes are left alone, and so is their favourite colour.

type Rand = () => number;

// mulberry32, started from a string, so a look can be written down and made again.
export function seeded(seed: string): Rand {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  let a = (h ^ (h >>> 16)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A fresh seed. Only from an event handler, never while rendering.
export function newSeed() {
  const n = new Uint32Array(2);
  crypto.getRandomValues(n);
  return Array.from(n, (v) => v.toString(36)).join("");
}

const pick = <T>(rand: Rand, list: readonly T[]): T => list[Math.floor(rand() * list.length)];
const between = (rand: Rand, [low, high]: readonly [number, number]) => low + rand() * (high - low);

function weighted<T>(rand: Rand, items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let r = rand() * total;
  for (const item of items) {
    r -= weight(item);
    if (r < 0) return item;
  }
  return items[items.length - 1];
}

function shuffle<T>(rand: Rand, list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- Colours ----------

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

function mix(a: string, b: string, amount: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex(x.map((v, i) => v * (1 - amount) + y[i] * amount));
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const worst = (colour: string, backgrounds: readonly string[]) => Math.min(...backgrounds.map((b) => contrast(colour, b)));
const lower = (hex: string) => hex.toLowerCase();
const same = (a: string | undefined, b: string | undefined) => Boolean(a && b && lower(a) === lower(b));
// Within a shade or two, allowing for rounding.
const near = (a: string, b: string) => rgb(a).every((v, i) => Math.abs(v - rgb(b)[i]) <= 3);

// The colour halfway down a background, which is how screen-style.ts judges it.
const middleOf = (backgrounds: readonly string[]) => (backgrounds.length === 1 ? backgrounds[0] : mix(backgrounds[0], backgrounds[backgrounds.length - 1], 0.5));
const isDark = (backgrounds: readonly string[]) => luminance(middleOf(backgrounds)) < 0.18;

// OKLab, for telling which of the card themes a colour is closest to.
function oklab(hex: string): Rgb {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

// Hue (0 to 360), saturation and lightness (0 to 1).
function hsl(hex: string): Rgb {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const [max, min] = [Math.max(r, g, b), Math.min(r, g, b)];
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, d / (1 - Math.abs(2 * l - 1)), l];
}

function fromHsl(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex([r, g, b].map((v) => (v + l - c / 2) * 255));
}

// A colour's own cousins: as bright and as light, with the hue turned a little either way.
const TURNS = [-16, -8, 8, 16];
const cousinsOf = (hex: string) => {
  const [h, s, l] = hsl(hex);
  return s < 0.2 ? [] : TURNS.map((d) => fromHsl((h + d + 360) % 360, s, l));
};

// Close enough to a colour to be its cousin: a near hue (or, for a greyish one, a near lightness).
function cousin(a: string, b: string) {
  const [[h1, s1, l1], [h2, s2, l2]] = [hsl(a), hsl(b)];
  if (s1 < 0.2) return s2 < 0.35 && Math.abs(l1 - l2) < 0.2;
  const gap = Math.abs(h1 - h2) % 360;
  return Math.min(gap, 360 - gap) <= 40 && s2 >= 0.25;
}

// The colours in a theme's background, top first.
const themeHexes = (name: ThemeName) => (themes[name].background.match(/#[0-9a-fA-F]{6}/g) ?? [themes[name].secondary]).map(lower);

// The card theme nearest a background, so the basket, their account and the link's preview
// picture match the card, and a screen added later fits in.
function nearestTheme(backgrounds: readonly string[]): ThemeName {
  const mid = oklab(middleOf(backgrounds));
  const distance = (name: ThemeName) => {
    const hexes = themeHexes(name);
    const theirs = oklab(hexes[Math.floor(hexes.length / 2)]);
    // Pale themes differ more in colour than in lightness, so colour counts for more.
    return (theirs[0] - mid[0]) ** 2 + 4 * ((theirs[1] - mid[1]) ** 2 + (theirs[2] - mid[2]) ** 2);
  };
  return (Object.keys(themes) as ThemeName[]).reduce((best, name) => (distance(name) < distance(best) ? name : best));
}

// ---------- Palettes ----------

type Mood = "soft" | "bright" | "rich" | "elegant" | "playful" | "calm" | "spooky";

export type Palette = {
  key: string;
  // The card theme it's nearest, for the basket, their account and the link's preview picture.
  theme: ThemeName;
  // Its own way round: deep backgrounds with light words, or pale ones with deep words.
  dark: boolean;
  // Words on pale screens, backgrounds on dark ones.
  deep: string;
  // Backgrounds on pale screens, words on dark ones.
  light: string;
  // The second colour of a pale background.
  soft: string;
  // Buttons and highlights.
  accent: string;
  // The occasions it suits; with `only`, it's for those and no others.
  occasions: Occasion[];
  only?: boolean;
  moods: Mood[];
};

// Each one checked (scripts/check-vary.ts) so the words and buttons read clearly either way round.
export const PALETTES: Palette[] = [
  { key: "blush", theme: "rose", dark: false, deep: "#4a1626", light: "#fff4f2", soft: "#f5cfd2", accent: "#c2456a", occasions: ["valentine", "anniversary", "mothersday", "sorry", "wedding", "missyou", "newbaby", "thanks"], moods: ["soft", "elegant"] },
  { key: "ruby-night", theme: "marigold", dark: true, deep: "#2a0a16", light: "#fbe9ec", soft: "#eab3bf", accent: "#e0607e", occasions: ["valentine", "anniversary", "wedding", "sorry", "missyou", "mothersday"], moods: ["rich", "elegant"] },
  { key: "plum-velvet", theme: "midnight", dark: true, deep: "#22102d", light: "#f7eefa", soft: "#d9bce6", accent: "#c4609c", occasions: ["valentine", "anniversary", "mothersday", "missyou", "birthday", "friendship", "halloween"], moods: ["rich", "elegant", "playful"] },
  { key: "bubblegum", theme: "rose", dark: false, deep: "#4a1036", light: "#fff3f9", soft: "#f9cbe3", accent: "#d63f86", occasions: ["birthday", "friendship", "valentine", "holi", "newbaby", "congrats", "getwell", "rakhi"], moods: ["bright", "playful"] },
  { key: "peach-sorbet", theme: "sunset", dark: false, deep: "#4a2316", light: "#fff6ef", soft: "#f9d5c0", accent: "#d9603a", occasions: ["birthday", "thanks", "friendship", "mothersday", "getwell", "sorry", "leaving", "valentine", "retirement", "newhome", "rakhi"], moods: ["bright", "soft", "playful"] },
  { key: "saffron", theme: "sunset", dark: false, deep: "#43200a", light: "#fff7e8", soft: "#f8d99e", accent: "#c85a17", occasions: ["diwali", "rakhi", "holi", "thanks", "congrats", "eid", "birthday", "newhome"], moods: ["bright", "rich"] },
  { key: "terracotta", theme: "sunset", dark: false, deep: "#3d1d12", light: "#fdf4ee", soft: "#efc8b3", accent: "#b4532f", occasions: ["fathersday", "thanks", "leaving", "friendship", "sorry", "getwell", "retirement", "newhome"], moods: ["calm", "rich"] },
  { key: "lemon-sherbet", theme: "party", dark: false, deep: "#3a2e0b", light: "#fffbea", soft: "#f5e29b", accent: "#b0700e", occasions: ["birthday", "congrats", "getwell", "thanks", "newbaby", "friendship", "leaving", "holi", "graduation", "newhome"], moods: ["bright", "playful"] },
  { key: "champagne", theme: "party", dark: false, deep: "#2e2415", light: "#fffaf1", soft: "#efdfbd", accent: "#a87a2c", occasions: ["newyear", "congrats", "wedding", "anniversary", "leaving", "birthday", "thanks", "graduation", "retirement"], moods: ["elegant", "bright"] },
  { key: "ivory-gold", theme: "ivory", dark: false, deep: "#2f2a21", light: "#fdfaf3", soft: "#e8dec7", accent: "#9c7a35", occasions: ["wedding", "anniversary", "thanks", "eid", "diwali", "newyear", "sorry", "fathersday", "graduation", "retirement", "newhome", "christmas"], moods: ["elegant", "calm"] },
  { key: "rainbow", theme: "holi", dark: false, deep: "#341a3a", light: "#fffaf3", soft: "#f6d6e6", accent: "#1d8f7d", occasions: ["holi", "birthday", "friendship", "congrats", "newbaby", "rakhi"], moods: ["bright", "playful"] },
  { key: "mint-julep", theme: "mint", dark: false, deep: "#173326", light: "#f2fbf5", soft: "#c2e5d0", accent: "#2b8a60", occasions: ["getwell", "thanks", "newbaby", "leaving", "friendship", "eid", "birthday", "sorry", "retirement", "newhome", "holi"], moods: ["calm", "soft"] },
  { key: "sage-linen", theme: "mint", dark: false, deep: "#25302a", light: "#f8f8f2", soft: "#d8dfcd", accent: "#62804a", occasions: ["thanks", "sorry", "getwell", "leaving", "mothersday", "fathersday", "missyou", "retirement", "newhome"], moods: ["calm", "elegant"] },
  { key: "sky-blue", theme: "sky", dark: false, deep: "#13253e", light: "#f3f8fe", soft: "#c8ddf3", accent: "#3a72bd", occasions: ["fathersday", "newbaby", "leaving", "congrats", "missyou", "getwell", "birthday", "graduation", "retirement"], moods: ["calm", "bright"] },
  { key: "cornflower", theme: "baby", dark: false, deep: "#1e2a4f", light: "#f6f7ff", soft: "#d0d8f6", accent: "#5068c9", occasions: ["newbaby", "fathersday", "sorry", "missyou", "friendship", "rakhi", "newhome", "graduation"], moods: ["soft", "calm"] },
  { key: "lilac", theme: "lavender", dark: false, deep: "#2b1f45", light: "#faf6ff", soft: "#dfd1f3", accent: "#8758c4", occasions: ["mothersday", "birthday", "friendship", "sorry", "missyou", "newbaby", "getwell", "rakhi", "valentine", "holi"], moods: ["soft", "playful"] },
  { key: "frosty", theme: "baby", dark: false, deep: "#10283d", light: "#f4f9fc", soft: "#d0e4ef", accent: "#2e7cab", occasions: ["christmas", "newyear", "missyou", "getwell", "newbaby", "fathersday"], moods: ["calm", "soft"] },
  { key: "candy-cane", theme: "ivory", dark: false, deep: "#3a0d12", light: "#fff7f5", soft: "#f4cdc8", accent: "#c4302d", occasions: ["christmas"], only: true, moods: ["bright", "playful"] },
  { key: "evergreen", theme: "noel", dark: true, deep: "#0d291e", light: "#f7f1e3", soft: "#cfe0c6", accent: "#d2473f", occasions: ["christmas"], only: true, moods: ["rich", "elegant"] },
  { key: "starry-navy", theme: "midnight", dark: true, deep: "#0e1430", light: "#eef0fb", soft: "#bcc3ea", accent: "#e0b04f", occasions: ["eid", "missyou", "newyear", "diwali", "getwell", "christmas", "fathersday", "leaving", "halloween", "graduation"], moods: ["rich", "calm"] },
  { key: "emerald-lantern", theme: "crescent", dark: true, deep: "#06231f", light: "#f4edd9", soft: "#c3e2d4", accent: "#d2a24a", occasions: ["eid", "diwali", "wedding", "rakhi", "anniversary", "graduation", "christmas"], moods: ["rich", "elegant"] },
  { key: "ocean-teal", theme: "crescent", dark: true, deep: "#08262e", light: "#eaf7f5", soft: "#acdcd5", accent: "#ef8b5f", occasions: ["fathersday", "congrats", "leaving", "missyou", "friendship", "retirement", "graduation"], moods: ["calm", "rich"] },
  { key: "midnight-gold", theme: "gold", dark: true, deep: "#13110d", light: "#f8efd9", soft: "#dcc591", accent: "#c99c3c", occasions: ["newyear", "wedding", "anniversary", "diwali", "eid", "congrats", "leaving", "christmas", "valentine", "graduation", "retirement", "halloween"], moods: ["rich", "elegant"] },
  { key: "marigold-glow", theme: "marigold", dark: true, deep: "#2a0c22", light: "#fcefdc", soft: "#f1cc90", accent: "#e2862e", occasions: ["diwali", "holi", "rakhi", "eid", "thanks", "newyear"], moods: ["rich", "bright"] },
  { key: "pumpkin-night", theme: "spooky", dark: true, deep: "#17121f", light: "#f6ebd8", soft: "#e8bd8f", accent: "#e0702a", occasions: ["halloween"], only: true, moods: ["spooky", "playful"] },
  { key: "witchy-violet", theme: "spooky", dark: true, deep: "#170c25", light: "#f0e7fb", soft: "#cbb5ec", accent: "#7fbf3a", occasions: ["halloween"], only: true, moods: ["spooky", "rich"] },
  { key: "ghostly", theme: "lavender", dark: false, deep: "#1d1a2a", light: "#f6f4fb", soft: "#d6d0e6", accent: "#c95a17", occasions: ["halloween"], only: true, moods: ["spooky", "soft", "playful"] },
];

// The usual cream, and other papers that go with anything.
const ENVELOPES = ["#f6efe0", "#efe4cf", "#e9dcc4", "#f4ead8"];

// A button colour that reads well on these backgrounds, as close to the palette's own as it can be.
function accentOn(p: Palette, backgrounds: string[], dark: boolean) {
  let accent = p.accent;
  for (const amount of [0.15, 0.3, 0.45, 0.6]) {
    if (worst(accent, backgrounds) >= 2.6) break;
    accent = mix(p.accent, dark ? p.light : p.deep, amount);
  }
  return accent;
}

type Paints = {
  // Top to bottom: lightest to deepest for pale screens; a glow, the deep colour and darker for dark ones.
  pale: [string, string, string];
  deep: [string, string, string];
  accent: { pale: string; deep: string };
  // Other button colours to try on a background of their own that neither of those suits.
  spare: string[];
  tint: string;
};

function paintsOf(p: Palette): Paints {
  const pale: Paints["pale"] = [p.light, mix(p.light, p.soft, 0.5), p.soft];
  const deep: Paints["deep"] = [mix(p.deep, p.soft, 0.16), p.deep, mix(p.deep, "#000000", 0.4)];
  return {
    pale,
    deep,
    accent: { pale: accentOn(p, pale, false), deep: accentOn(p, deep, true) },
    spare: [p.accent, mix(p.accent, p.light, 0.5), mix(p.accent, p.deep, 0.5), p.light, p.deep],
    tint: mix(p.light, p.accent, 0.14),
  };
}

const PAINTS = new Map(PALETTES.map((p) => [p.key, paintsOf(p)]));
const paintsFor = (p: Palette) => PAINTS.get(p.key)!;

// Every colour a look of ours can use. Anything else on a card came from them or the AI.
const OURS = new Set(
  [
    ...PALETTES.flatMap((p) => {
      const paints = paintsFor(p);
      return [p.deep, p.light, p.soft, p.accent, ...paints.pale, ...paints.deep, paints.accent.pale, paints.accent.deep, ...paints.spare, paints.tint];
    }),
    ...(Object.keys(themes) as ThemeName[]).flatMap((name) => [...themeHexes(name), themes[name].text, themes[name].accent, themes[name].muted].filter((c) => c.startsWith("#"))),
    ...ENVELOPES,
  ].map(lower),
);

// The button colours the ready-made designs and themes use, and their cousins (see
// gentleLook). They're the shop's, not theirs, so a new look may change them even when it
// can't tell what their favourite colour is.
let designAccents: Set<string> | undefined;
function shopAccent(hex: string) {
  designAccents ??= new Set(
    [...TEMPLATES.flatMap((t) => t.screens("", "").flatMap((s) => (s.style?.accent ? [s.style.accent] : []))), ...(Object.keys(themes) as ThemeName[]).map((name) => themes[name].accent)]
      .flatMap((c) => [c, ...cousinsOf(c)])
      .map(lower),
  );
  return OURS.has(lower(hex)) || designAccents.has(lower(hex));
}

// The colours from darkest to lightest, through the palette's own, for moving a colour
// of theirs to the same lightness here: a dark background stays dark, a pale one pale.
const ramp = (p: Palette) => [mix(p.deep, "#000000", 0.6), p.deep, p.accent, p.soft, p.light, mix(p.light, "#ffffff", 0.7)];

export function toPalette(p: Palette, hex: string) {
  const stops = ramp(p);
  const target = luminance(hex);
  const levels = stops.map(luminance);
  if (target <= levels[0]) return stops[0];
  if (target >= levels[levels.length - 1]) return stops[stops.length - 1];
  const i = levels.findIndex((l) => l >= target);
  let [low, high] = [0, 1];
  for (let step = 0; step < 16; step++) {
    const mid = (low + high) / 2;
    if (luminance(mix(stops[i - 1], stops[i], mid)) < target) low = mid;
    else high = mid;
  }
  return mix(stops[i - 1], stops[i], (low + high) / 2);
}

// A background's colours moved away from the words, a little at a time, until every one of
// them reads at 4.5:1: darker under light words, paler under dark ones. screen-style.ts
// would put up with less, but these are cards for people of every age to read on a phone.
function legible(background: string[], text: string, darker = "#000000", paler = "#ffffff") {
  return background.map((c) => {
    const towards = luminance(text) > luminance(c) ? darker : paler;
    let out = c;
    for (let amount = 0.05; contrast(text, out) < 4.5 && amount <= 1.001; amount += 0.05) out = mix(c, towards, amount);
    return contrast(text, out) >= 4.5 ? out : towards;
  });
}

// ---------- What suits what ----------

const TONE_MOODS: Record<Tone, Mood[]> = {
  funny: ["bright", "playful"],
  cute: ["soft", "playful"],
  romantic: ["elegant", "rich", "soft"],
  heartfelt: ["soft", "calm", "elegant"],
  festive: ["bright", "rich"],
};

// A heading font and an easy-to-read one for everything else.
const FONT_PAIRS: { heading: Font; body: Font; moods: Mood[] }[] = [
  { heading: "classic", body: "modern", moods: ["elegant", "calm", "rich"] },
  { heading: "classic", body: "storybook", moods: ["elegant", "calm"] },
  { heading: "script", body: "classic", moods: ["elegant", "rich"] },
  { heading: "script", body: "modern", moods: ["elegant", "soft"] },
  { heading: "storybook", body: "storybook", moods: ["soft", "calm"] },
  { heading: "storybook", body: "modern", moods: ["soft", "calm", "elegant"] },
  { heading: "handwritten", body: "modern", moods: ["playful", "soft"] },
  { heading: "handwritten", body: "storybook", moods: ["soft", "calm"] },
  { heading: "rounded", body: "rounded", moods: ["playful", "soft", "bright"] },
  { heading: "bold", body: "modern", moods: ["bright", "playful"] },
  { heading: "bold", body: "rounded", moods: ["bright", "playful"] },
  { heading: "marker", body: "rounded", moods: ["playful", "bright"] },
  { heading: "typewriter", body: "classic", moods: ["calm", "spooky"] },
  { heading: "spooky", body: "typewriter", moods: ["spooky"] },
  { heading: "spooky", body: "modern", moods: ["spooky"] },
];

// Heading fonts of the same character, for a gentle change.
const KIN: Record<Font, Font[]> = {
  classic: ["classic", "storybook", "script"],
  storybook: ["storybook", "classic", "handwritten"],
  script: ["script", "classic", "storybook"],
  modern: ["modern", "bold", "rounded"],
  rounded: ["rounded", "handwritten", "bold"],
  bold: ["bold", "modern", "marker"],
  handwritten: ["handwritten", "rounded", "marker"],
  marker: ["marker", "handwritten", "bold"],
  typewriter: ["typewriter", "classic"],
  spooky: ["spooky", "typewriter"],
};

// "none" more than once where a plain background suits better.
const PATTERNS_FOR: Record<Mood, Pattern[]> = {
  soft: ["none", "none", "dots"],
  bright: ["dots", "zigzag", "checks", "stripes", "none"],
  rich: ["none", "none", "grid", "stripes"],
  elegant: ["none", "none", "stripes", "grid"],
  playful: ["dots", "checks", "zigzag", "none"],
  calm: ["none", "none", "dots", "grid"],
  spooky: ["none", "grid", "zigzag"],
};

const TRANSITIONS_FOR: Record<Mood, Transition[]> = {
  soft: ["fade", "rise", "blur"],
  bright: ["zoom", "drop", "bounce", "slide"],
  rich: ["fade", "blur", "zoom"],
  elegant: ["fade", "blur", "rise"],
  playful: ["bounce", "zoom", "drop", "flip", "slide"],
  calm: ["fade", "rise", "slide"],
  spooky: ["blur", "drop", "flip"],
};

// Ways in of the same kind, for a gentle change.
const TRANSITION_KIN: Record<Transition, Transition[]> = {
  rise: ["rise", "fade", "drop"],
  fade: ["fade", "blur", "rise"],
  blur: ["blur", "fade"],
  slide: ["slide", "flip", "rise"],
  zoom: ["zoom", "drop", "bounce"],
  drop: ["drop", "zoom", "rise"],
  bounce: ["bounce", "zoom", "drop"],
  flip: ["flip", "slide", "zoom"],
  spin: ["spin", "zoom", "flip"],
};

// What floats behind the card (never fireworks: see generate.ts), what the finale does,
// and what bursts out at a screen's big moment, for each occasion.
const EFFECTS_FOR: Record<Occasion, { ambient: Effect[]; finale: Effect[]; burst: Effect[] }> = {
  valentine: { ambient: ["hearts", "petals", "sparkles"], finale: ["hearts", "fireworks", "petals"], burst: ["hearts", "confetti", "petals", "sparkles"] },
  birthday: { ambient: ["confetti", "balloons", "sparkles", "bubbles"], finale: ["confetti", "fireworks", "balloons"], burst: ["confetti", "balloons", "fireworks", "sparkles"] },
  diwali: { ambient: ["sparkles", "lanterns", "stars"], finale: ["fireworks", "lanterns"], burst: ["fireworks", "sparkles", "lanterns"] },
  christmas: { ambient: ["snow", "stars", "sparkles"], finale: ["snow", "fireworks", "stars"], burst: ["snow", "confetti", "sparkles", "stars"] },
  eid: { ambient: ["stars", "lanterns", "sparkles"], finale: ["stars", "fireworks", "lanterns"], burst: ["stars", "sparkles", "fireworks", "lanterns"] },
  anniversary: { ambient: ["petals", "hearts", "sparkles"], finale: ["petals", "hearts", "fireworks"], burst: ["hearts", "petals", "sparkles", "confetti"] },
  sorry: { ambient: ["hearts", "petals", "bubbles"], finale: ["hearts", "petals", "confetti"], burst: ["hearts", "petals", "confetti"] },
  thanks: { ambient: ["sparkles", "petals", "confetti"], finale: ["confetti", "sparkles", "petals", "fireworks"], burst: ["confetti", "sparkles", "petals"] },
  congrats: { ambient: ["confetti", "stars", "sparkles", "balloons"], finale: ["fireworks", "confetti", "balloons"], burst: ["confetti", "fireworks", "stars", "balloons"] },
  halloween: { ambient: ["spooky", "stars"], finale: ["spooky", "fireworks"], burst: ["spooky", "confetti", "stars"] },
  newyear: { ambient: ["sparkles", "stars", "confetti"], finale: ["fireworks", "confetti"], burst: ["fireworks", "confetti", "sparkles"] },
  mothersday: { ambient: ["petals", "hearts", "sparkles"], finale: ["petals", "hearts", "fireworks"], burst: ["petals", "hearts", "sparkles", "confetti"] },
  fathersday: { ambient: ["stars", "sparkles", "confetti"], finale: ["fireworks", "confetti", "stars"], burst: ["confetti", "stars", "fireworks"] },
  rakhi: { ambient: ["sparkles", "confetti", "petals", "lanterns"], finale: ["sparkles", "confetti", "fireworks", "petals"], burst: ["sparkles", "confetti", "petals"] },
  holi: { ambient: ["colours", "confetti", "bubbles"], finale: ["colours", "confetti"], burst: ["colours", "confetti", "bubbles"] },
  newbaby: { ambient: ["bubbles", "stars", "balloons", "hearts"], finale: ["bubbles", "balloons", "hearts", "stars"], burst: ["bubbles", "hearts", "stars", "confetti"] },
  wedding: { ambient: ["petals", "sparkles", "hearts"], finale: ["fireworks", "petals", "confetti", "hearts"], burst: ["petals", "confetti", "hearts", "sparkles"] },
  getwell: { ambient: ["bubbles", "petals", "sparkles"], finale: ["bubbles", "confetti", "petals"], burst: ["bubbles", "confetti", "petals"] },
  missyou: { ambient: ["hearts", "stars", "petals"], finale: ["hearts", "stars", "fireworks"], burst: ["hearts", "stars", "sparkles"] },
  friendship: { ambient: ["confetti", "sparkles", "bubbles", "balloons"], finale: ["confetti", "sparkles", "fireworks", "balloons"], burst: ["confetti", "balloons", "sparkles", "bubbles"] },
  leaving: { ambient: ["balloons", "confetti", "sparkles", "stars"], finale: ["balloons", "confetti", "fireworks"], burst: ["confetti", "balloons", "stars"] },
  graduation: { ambient: ["confetti", "stars", "sparkles"], finale: ["fireworks", "confetti", "stars"], burst: ["confetti", "stars", "fireworks"] },
  retirement: { ambient: ["sparkles", "balloons", "confetti"], finale: ["confetti", "balloons", "fireworks"], burst: ["confetti", "balloons", "sparkles"] },
  newhome: { ambient: ["sparkles", "petals", "confetti"], finale: ["confetti", "lanterns", "sparkles"], burst: ["confetti", "sparkles", "petals"] },
};

// Emoji that suit each occasion; a card uses a few of them.
const STICKERS: Record<Occasion, string[]> = {
  valentine: ["💕", "🌹", "💌", "💖", "✨", "💘", "🥰"],
  birthday: ["🎈", "🎂", "🎉", "🎁", "🥳", "✨", "🍰"],
  diwali: ["🪔", "✨", "🌼", "🎆", "🪷", "⭐"],
  christmas: ["🎄", "❄️", "⭐", "🎁", "🔔", "☃️", "🦌"],
  eid: ["🌙", "⭐", "🏮", "✨", "🕌", "🌟"],
  anniversary: ["💍", "🥂", "💕", "🌹", "✨", "💞"],
  sorry: ["🥺", "💐", "🫶", "🌷", "💌", "🩹"],
  thanks: ["🙏", "🌻", "💐", "✨", "💛", "🌼"],
  congrats: ["🏆", "🎉", "🌟", "🥂", "🎊", "👏"],
  halloween: ["🎃", "👻", "🦇", "🕸️", "🍬", "🌙", "🕷️"],
  newyear: ["🥂", "🎆", "✨", "🎉", "🍾", "🌟"],
  mothersday: ["💐", "🌷", "💖", "🌸", "🫖", "✨"],
  fathersday: ["👔", "🏆", "⭐", "☕", "🔧", "⚽"],
  rakhi: ["🎀", "✨", "🌼", "💛", "🍬", "🪔"],
  holi: ["🌈", "🎨", "💦", "🌸", "✨", "💛"],
  newbaby: ["👶", "🍼", "🧸", "⭐", "🌙", "🐣", "🎀"],
  wedding: ["💍", "💒", "🥂", "🤍", "🌸", "✨", "🕊️"],
  getwell: ["🌻", "💛", "🍵", "🌈", "🧸", "🌷"],
  missyou: ["🫶", "💌", "🌙", "⭐", "💕", "✈️"],
  friendship: ["👯", "💛", "🌈", "✨", "🍕", "🎉", "🫶"],
  leaving: ["👋", "🎈", "🌟", "✈️", "🎉", "🍀"],
  graduation: ["🎓", "📜", "🌟", "🎉", "📚", "✨"],
  retirement: ["🏖️", "⛳", "🌴", "☕", "🎉", "🌟"],
  newhome: ["🏡", "🔑", "🪴", "📦", "✨", "🛋️"],
};

// Where stickers go: corners and edges, clear of the words in the middle, the progress dots
// at the top and the line along the bottom. Never the top right, where the sound button is.
// The spots halfway down the sides are only for screens without long lines of words, which
// on a phone run almost to the edge.
type Spot = { x: [number, number]; y: [number, number]; size: [number, number]; side?: true };
const SPOTS: Spot[] = [
  { x: [5, 12], y: [4, 11], size: [9, 12] },
  { x: [23, 30], y: [3, 7], size: [6.5, 8] },
  { x: [5, 12], y: [89, 95], size: [9, 12] },
  { x: [88, 95], y: [89, 95], size: [9, 12] },
  { x: [3, 6], y: [26, 36], size: [6.5, 8], side: true },
  { x: [3, 6], y: [62, 74], size: [6.5, 8], side: true },
  { x: [94, 97], y: [42, 70], size: [6.5, 8], side: true },
];
const WORDY = new Set<Screen["type"]>(["message", "reasons", "quiz", "timeline", "coupons"]);
const MOTION_PICKS = ["float", "sway", "float", "sway", "pulse", "none"] as const;

// Our own stickers carry a seal: the second decimal places of the position and size are a
// checksum of everything else about the sticker (its emoji, turn, motion, and where it is to
// one place). Anything they do to one breaks it: dragging, resizing, turning it, a new emoji,
// a copy put down somewhere else. So does a sticker they or the AI added. A new look only ever
// takes away its own (and a design's, once it's been varied), never one of theirs.
function sealFor(s: Sticker, tenths: number[]) {
  let h = 2166136261;
  for (const ch of `${s.emoji}|${s.rotate ?? 0}|${s.motion ?? "none"}|${tenths.join("|")}`) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  h >>>= 0;
  return [1 + (h % 9), 1 + (Math.floor(h / 9) % 9), 1 + (Math.floor(h / 81) % 9)];
}
function seal(s: Sticker): Sticker {
  const tenths = [s.x, s.y, Math.min(39.9, s.size)].map((v) => Math.round(v * 10));
  const [x, y, size] = sealFor(s, tenths).map((d, i) => (tenths[i] * 10 + d) / 100);
  return { ...s, x, y, size };
}
export function isOurSticker(s: Sticker) {
  const hundredths = [s.x, s.y, s.size].map((v) => Math.round(v * 100));
  const want = sealFor(s, hundredths.map((h) => Math.floor(h / 10)));
  return hundredths.every((h, i) => h % 10 === want[i]);
}
// Near an edge, clear of the words, and out of the sound button's corner.
const safeSpot = (s: { x: number; y: number }) => (s.x < 15 || s.x > 85 || s.y < 14 || s.y > 86) && !(s.x > 75 && s.y < 22) && s.x >= 1 && s.x <= 99 && s.y >= 1 && s.y <= 99;

// ---------- Making a look ----------

export type RestyleOptions = {
  // A light touch for a ready-made design: its own colours and kind of fonts, with new
  // accents, stickers and finishing touches, so it's still the design they picked.
  gentle?: boolean;
  // Their favourite colour (brief.accent), kept wherever it's a button colour, or null when
  // they didn't give one. Left out (not known), button colours that aren't ours are kept, in case.
  favourite?: string | null;
};

type Keep = (accent: string | undefined) => boolean;

export function restyle(card: CardData, seed: string, options: RestyleOptions = {}): CardData {
  const rand = seeded(seed);
  // Not known, none, or a colour (anything that isn't one counts as none).
  const favourite = options.favourite === undefined ? undefined : options.favourite && /^#[0-9a-fA-F]{6}$/.test(options.favourite) ? options.favourite : null;
  const keep: Keep = (accent) => Boolean(accent) && (favourite === undefined ? !shopAccent(accent!) : same(accent, favourite ?? undefined));
  // Stickers from an earlier look go; theirs stay.
  const screens = card.screens.map((s) => {
    const stickers = s.style?.stickers;
    return stickers?.some(isOurSticker) ? withStyle(s, { ...s.style, stickers: stickers.filter((x) => !isOurSticker(x)) }) : s;
  });
  const tone = getTemplate(card.template)?.tone;
  const plain = { ...card, screens };
  return options.gentle ? gentleLook(plain, rand, tone, keep, favourite) : newLook(plain, rand, tone, keep);
}

// A screen with its look replaced, leaving out anything unset.
function withStyle(screen: Screen, style: ScreenStyle): Screen {
  const tidy = Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))) as ScreenStyle;
  const rest = { ...screen };
  delete rest.style;
  return Object.keys(tidy).length ? { ...rest, style: tidy } : rest;
}

const backgroundOf = (card: CardData, screen: Screen) => screen.style?.background?.map(lower) ?? themeHexes(card.theme);
// Text boxes in a colour of their own, which need the screen to stay dark or light to read.
const hasInkedText = (style: ScreenStyle | undefined) => Boolean(style?.texts?.some((t) => t.color));
const isMiddle = (s: Screen) => s.type !== "intro" && s.type !== "finale";

// A whole new look: a new palette, fonts, pattern, stickers, bursts, transitions and effects.
function newLook(card: CardData, rand: Rand, tone: Tone | undefined, keep: Keep): CardData {
  const effects = EFFECTS_FOR[card.occasion];
  const old = themes[card.theme];
  // Colours set by them, the AI or a hand-made design are moved across to the new palette at
  // the same lightness, so the way the card was designed survives. A card in our own colours
  // (or the theme's) gets a fresh design.
  const colours = card.screens.flatMap((s) => [...(s.style?.background ?? []), ...(s.style?.text ? [s.style.text] : [])]).map(lower);
  const theirs = colours.some((c) => !OURS.has(c));
  const current = colours.length
    ? PALETTES.find((p) => (theirs ? colours.every((c) => near(toPalette(p, c), c)) : colours.every((c) => paletteHas(p, c))))
    : undefined;
  const moods = tone ? TONE_MOODS[tone] : [];
  const palette = choosePalette(rand, card.occasion, moods, current?.key);
  const paints = paintsFor(palette);
  const feel = [...new Set([...palette.moods, ...moods])];
  const first = card.screens[0]?.style;
  const fonts = choosePair(rand, feel, first?.heading, first?.body);
  const pattern = pick(rand, feel.flatMap((m) => PATTERNS_FOR[m]));
  const transition = pick(rand, feel.flatMap((m) => TRANSITIONS_FOR[m]));
  const burst = pick(rand, effects.burst);
  const opening = rand() < 0.6 ? pick(rand, effects.burst) : undefined;
  // Now and then the envelope and the finale are the other way round, like a card's cover.
  const framed = !theirs && rand() < 0.3;
  const washStart = Math.floor(rand() * 3);
  const stickers = planStickers(rand, card, 4, (s) => !isMiddle(s) || rand() < 0.5);
  let middle = 0;

  const screens = card.screens.map((screen, i) => {
    const style = screen.style ?? {};
    const ends = !isMiddle(screen);
    let background: string[];
    let gradient = style.gradient;
    let text: string;
    if (theirs) {
      background = backgroundOf(card, screen).map((c) => toPalette(palette, c));
      if (!style.background) gradient = "glow";
      text = toPalette(palette, style.text ?? old.text);
      // Light words stay light and dark ones dark, in the palette's own colours if they need
      // to be clearer, with the background moved just far enough for them to read.
      if (worst(text, background) < 4.5) text = luminance(text) > luminance(middleOf(background)) ? palette.light : palette.deep;
      background = legible(background, text, palette.deep, palette.light);
    } else {
      const wasDark = isDark(backgroundOf(card, screen));
      const dark = hasInkedText(style) ? wasDark : framed && ends ? !palette.dark : palette.dark;
      const wash = WASHES[ends ? 0 : 1 + ((washStart + middle++) % 3)];
      background = wash.stops.map((k) => (dark ? paints.deep : paints.pale)[k]);
      gradient = wash.gradient;
      text = dark ? palette.light : palette.deep;
    }
    const dark = isDark(background);
    const accent = keep(style.accent) ? style.accent : buttonOn(paints, background, dark);
    let envelope = style.envelope && theirs ? toPalette(palette, style.envelope) : undefined;
    if (screen.type === "intro" && !envelope) envelope = pick(rand, dark ? [palette.light, paints.tint, ENVELOPES[0]] : [palette.soft, paints.tint, ENVELOPES[0]]);
    const restyled = withStyle(screen, {
      ...style,
      background,
      gradient: background.length > 1 ? gradient : undefined,
      text,
      accent,
      envelope,
      heading: fonts.heading,
      body: fonts.body,
      pattern: pattern === "none" ? undefined : pattern,
      transition,
      burst: screen.type === "intro" ? opening : burst,
      // A screen's effect that only repeated the card's own gives way to the new one.
      effect: style.effect === card.ambient ? undefined : style.effect,
      stickers: [...(style.stickers ?? []), ...(stickers.get(i) ?? [])],
    });
    return restyled.type === "finale" ? { ...restyled, effect: pick(rand, effects.finale) } : restyled;
  });
  const theme = theirs ? nearestTheme(screens[0]?.style?.background ?? themeHexes(card.theme)) : palette.theme;
  return { ...card, theme, ambient: pick(rand, effects.ambient), screens };
}

// How a background's colours run, as positions in a palette's three (see Paints): the
// richest for the envelope and the finale, the rest taking turns on the screens between.
const WASHES: { stops: number[]; gradient: NonNullable<ScreenStyle["gradient"]> }[] = [
  { stops: [0, 1, 2], gradient: "glow" },
  { stops: [0, 2], gradient: "glow" },
  { stops: [0, 1], gradient: "down" },
  { stops: [1, 2], gradient: "diagonal" },
];

// The palette's button colour for this background, or the nearest of its others that stands
// out on it (a background moved across from theirs can sit right where the accent does).
function buttonOn(paints: Paints, background: string[], dark: boolean) {
  const first = dark ? paints.accent.deep : paints.accent.pale;
  if (worst(first, background) >= 2.6) return first;
  const options = [dark ? paints.accent.pale : paints.accent.deep, ...paints.spare];
  return options.find((c) => worst(c, background) >= 2.6) ?? options.reduce((best, c) => (worst(c, background) > worst(best, background) ? c : best));
}

function paletteHas(p: Palette, hex: string) {
  const paints = paintsFor(p);
  return [p.deep, p.light, ...paints.pale, ...paints.deep].some((c) => same(c, hex));
}

// One that suits the occasion and the feel of the card, and isn't the one it already has.
function choosePalette(rand: Rand, occasion: Occasion, moods: Mood[], avoid: string | undefined) {
  const allowed = PALETTES.filter((p) => p.key !== avoid && (!p.only || p.occasions.includes(occasion)));
  const suits = allowed.filter((p) => p.occasions.includes(occasion));
  const choices = suits.length >= 3 ? suits : allowed;
  return weighted(rand, choices, (p) => 1 + 2 * p.moods.filter((m) => moods.includes(m)).length);
}

function choosePair(rand: Rand, feel: Mood[], heading: Font | undefined, body: Font | undefined) {
  const spooky = feel.includes("spooky");
  const choices = FONT_PAIRS.filter((f) => (spooky || !f.moods.every((m) => m === "spooky")) && !(f.heading === heading && f.body === body));
  return weighted(rand, choices, (f) => 0.3 + f.moods.filter((m) => feel.includes(m)).length ** 2);
}

// A few of the occasion's emoji, placed in the corners and edges of some screens. Never on
// a game, where they'd be mistaken for something to tap, and never crowding what's there.
function planStickers(rand: Rand, card: CardData, kinds: number, wanted: (s: Screen) => boolean) {
  const set = shuffle(rand, STICKERS[card.occasion]).slice(0, kinds);
  const plan = new Map<number, Sticker[]>();
  card.screens.forEach((screen, i) => {
    if (screen.type === "game" || !wanted(screen)) return;
    const style = screen.style ?? {};
    const own = style.stickers ?? [];
    if (own.length >= 2) return;
    const taken = [...own, ...(style.texts ?? []), ...(style.images ?? [])];
    const free = shuffle(rand, SPOTS).filter((spot) => {
      if (spot.side && WORDY.has(screen.type)) return false;
      const [x, y] = [(spot.x[0] + spot.x[1]) / 2, (spot.y[0] + spot.y[1]) / 2];
      return taken.every((t) => Math.hypot(t.x - x, t.y - y) > 16);
    });
    const count = Math.min(free.length, 10 - own.length, isMiddle(screen) ? 2 : 3);
    const offset = Math.floor(rand() * set.length);
    plan.set(
      i,
      free.slice(0, count).map((spot, k) =>
        seal({
          emoji: set[(offset + k) % set.length],
          x: between(rand, spot.x),
          y: between(rand, spot.y),
          size: between(rand, spot.size),
          rotate: Math.round(between(rand, [-18, 18])),
          motion: pick(rand, MOTION_PICKS),
        }),
      ),
    );
  });
  return plan;
}

// A ready-made design, a little different: the same theme, backgrounds and kind of fonts,
// with new button and envelope colours and its stickers moved about and partly swapped, so
// no two people's copies are alike but it's plainly still the design they picked. Only for
// a design as it becomes their card, when everything on it is the design's own.
function gentleLook(card: CardData, rand: Rand, tone: Tone | undefined, keep: Keep, favourite: string | null | undefined): CardData {
  const effects = EFFECTS_FOR[card.occasion];
  const theme = themes[card.theme];
  const feel: Mood[] = tone ? TONE_MOODS[tone] : ["soft", "calm"];

  // The design's own backgrounds, made clearer only where its words don't read at 4.5:1.
  const backgrounds = card.screens.map((screen) => {
    const style = screen.style ?? {};
    const text = style.text ?? theme.text;
    const own = backgroundOf(card, screen);
    return worst(text, own) < 4.5 ? legible(own, text) : style.background;
  });
  const backdrop = (i: number) => backgrounds[i] ?? themeHexes(card.theme);

  // Each of the design's button colours becomes a cousin of itself (raspberry or coral for its
  // pink, say) that reads on every screen using it; their favourite colour wherever it reads.
  // Failing its own cousins, a near one from the palettes.
  const pool = [
    ...PALETTES.filter((p) => !p.only || p.occasions.includes(card.occasion)).flatMap((p) => [p.accent, paintsFor(p).accent.pale, paintsFor(p).accent.deep, ...paintsFor(p).spare.slice(1, 3)]),
    ...(Object.keys(themes) as ThemeName[]).map((name) => themes[name].accent),
  ].filter((c, i, all) => all.findIndex((d) => same(c, d)) === i);
  const accentOf = (screen: Screen) => lower(screen.style?.accent ?? theme.accent);
  const swapsFor = new Map<string, string | undefined>();
  let favouriteUsed = false;
  const accents = card.screens.map((screen, i) => {
    const style = screen.style ?? {};
    if (keep(style.accent)) return style.accent;
    if (favourite && worst(favourite, backdrop(i)) >= 2.6) {
      favouriteUsed = true;
      return favourite;
    }
    const was = accentOf(screen);
    if (!swapsFor.has(was)) {
      const sharing = card.screens.flatMap((s, j) => (accentOf(s) === was ? backdrop(j) : []));
      const readable = (c: string) => !same(c, was) && worst(c, sharing) >= 2.6;
      const own = cousinsOf(was).filter(readable);
      const options = own.length ? own : pool.filter((c) => readable(c) && cousin(was, c));
      swapsFor.set(was, options.length ? pick(rand, options) : undefined);
    }
    return swapsFor.get(was) ?? style.accent;
  });

  // Cream papers, or one with a hint of the new button colour. A favourite too pale for a
  // button still colours the envelope.
  const papers = [...ENVELOPES, ...ENVELOPES.slice(0, 2).map((c) => mix(c, accents[0] ?? theme.accent, 0.16))];
  const envelope = favourite && !favouriteUsed ? mix(favourite, "#ffffff", 0.55) : pick(rand, papers);
  const fonts = new Map<Font, Font>();
  const kin = (font: Font) => {
    if (!fonts.has(font)) fonts.set(font, pick(rand, KIN[font].filter((f) => f !== "script" || tone === "romantic" || tone === "heartfelt" || tone === "festive")));
    return fonts.get(font)!;
  };
  const ways = new Map<Transition, Transition>();
  const wayIn = (t: Transition) => {
    if (!ways.has(t)) ways.set(t, pick(rand, TRANSITION_KIN[t]));
    return ways.get(t)!;
  };
  // A design with no transitions or pattern of its own (one saved before they had them) gets them now and then.
  const styled = card.screens.some((s) => s.style?.transition);
  const transition = styled ? undefined : pick(rand, feel.flatMap((m) => TRANSITIONS_FOR[m]));
  const pattern = card.screens.some((s) => s.style?.pattern) || rand() >= 0.4 ? undefined : pick(rand, feel.flatMap((m) => PATTERNS_FOR[m]).filter((p) => p !== "none"));
  const opening = rand() < 0.5 ? pick(rand, effects.burst) : undefined;

  // The design's stickers, each nudged a little within its corner, with one or two of its
  // emoji swapped for others that suit the occasion everywhere they appear.
  const emoji = [...new Set(card.screens.flatMap((s) => (s.style?.stickers ?? []).map((st) => st.emoji)))];
  const spare = shuffle(rand, STICKERS[card.occasion]).filter((e) => !emoji.includes(e));
  const swapped = new Map(shuffle(rand, emoji).slice(0, Math.min(spare.length, rand() < 0.5 ? 1 : 2)).map((e, i) => [e, spare[i]]));
  const nudge = (st: Sticker): Sticker => {
    const moved = { x: st.x + between(rand, [-3, 3]), y: st.y + between(rand, [-3, 3]) };
    const at = safeSpot(moved) ? moved : st;
    const size = Math.min(40, Math.max(4, st.size * between(rand, [0.9, 1.12])));
    const turned = Math.max(-180, Math.min(180, (st.rotate ?? 0) + Math.round(between(rand, [-8, 8]))));
    const varied = seal({ ...st, emoji: swapped.get(st.emoji) ?? st.emoji, x: at.x, y: at.y, size, rotate: turned });
    // One that isn't near an edge (or can't be sealed as ours there) is left as the design has it.
    return safeSpot(varied) ? varied : st;
  };
  // Screens with no stickers of the design's get a few of ours: the envelope, the finale and
  // one screen between that isn't a game.
  const middles = card.screens.filter((s) => isMiddle(s) && s.type !== "game");
  const chosen = middles.length ? pick(rand, middles) : undefined;
  const added = planStickers(rand, card, 3, (s) => !s.style?.stickers?.length && (!isMiddle(s) || s === chosen));

  const screens = card.screens.map((screen, i) => {
    const style = screen.style ?? {};
    return withStyle(screen, {
      ...style,
      background: backgrounds[i],
      gradient: backgrounds[i] && backgrounds[i].length > 1 ? (style.gradient ?? (style.background ? undefined : "glow")) : undefined,
      accent: accents[i],
      envelope: screen.type === "intro" ? envelope : style.envelope,
      heading: kin(style.heading ?? "classic"),
      pattern: style.pattern ?? pattern,
      transition: style.transition ? wayIn(style.transition) : transition,
      burst: screen.type === "intro" ? (style.burst ?? opening) : style.burst,
      stickers: [...(style.stickers ?? []).map(nudge), ...(added.get(i) ?? [])],
    });
  });
  return { ...card, screens };
}
