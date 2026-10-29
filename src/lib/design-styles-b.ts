import type { Font, Motion, Screen, ScreenStyle, Sticker, Transition } from "./card";

// How designs 27 to 52 in catalog.ts look, from Eid Mubarak to Our Year in Review: each
// design's colours, fonts and stickers, and what each of its screens wears. A screen
// finds its look by id, so the words in catalog.ts stay easy to read. The AI keeps these
// when it rewrites a design's words (see NOT_WORDS in lib/generate.ts).

// A background with the words and buttons that read on it. Light grounds take dark ink
// and dark grounds light ink, so a screen's own panels and buttons stay readable too
// (lib/screen-style.ts lightens or darkens them to match the background).
type Ground = Required<Pick<ScreenStyle, "background" | "text" | "accent">> & Pick<ScreenStyle, "gradient" | "pattern">;

type Kit<G extends string> = {
  grounds: Record<G, Ground>;
  heading: Font;
  body: Font;
  // How the stickers move, taken in turn.
  motion: Motion[];
  transition: Transition;
};

// What one screen wears: one of the design's grounds, a few emoji placed round its edge,
// and anything else of its own (a burst, the envelope, a tune). `scale` makes the
// stickers bigger for the intro and finale, smaller on busy screens.
type Wear<G extends string> = Omit<ScreenStyle, "stickers"> & { on: G; stickers: string[]; scale?: number };

// Spots round the edge for stickers, filled in order: the corners first, then the sides.
// The top corners belong to the card's own buttons, so the top-left spot sits below Back
// (there from the second screen on) and nothing goes in the top right, where the sound
// button is. Screens take turns with two layouts, so a design's stickers don't sit in the
// same places on every screen.
const SPOTS = [
  [[9, 15, 11, -12], [91, 91, 12, 10], [9, 92, 10, 8], [5, 46, 8, -8], [95, 62, 8, 12], [95, 30, 7, 6]],
  [[10, 16, 10, 10], [9, 90, 12, -8], [90, 92, 10, -12], [95, 55, 8, 8], [5, 66, 8, -10], [5, 32, 7, -6]],
] as const;

function place(emojis: string[], layout: number, motion: Motion[], scale = 1): Sticker[] {
  return emojis.slice(0, SPOTS[0].length).map((emoji, i) => {
    const [x, y, size, rotate] = SPOTS[layout % SPOTS.length][i];
    return { emoji, x, y, size: Math.round(size * scale), rotate, motion: motion[i % motion.length] };
  });
}

// Each screen's look, by screen id.
export type Look = Record<string, ScreenStyle>;

function design<G extends string>(kit: Kit<G>, screens: Record<string, Wear<G>>): Look {
  return Object.fromEntries(
    Object.entries(screens).map(([id, { on, stickers, scale, ...own }], i) => [
      id,
      { ...kit.grounds[on], heading: kit.heading, body: kit.body, transition: kit.transition, ...own, stickers: place(stickers, i, kit.motion, scale) },
    ]),
  );
}

// Puts each screen's look on it, matched by id; anything a screen sets itself wins. A
// fresh copy each time, so changing one card's stickers in the editor never touches the design.
export function dress(look: Look, screens: Screen[]): Screen[] {
  return screens.map((s) => (look[s.id] ? { ...s, style: { ...structuredClone(look[s.id]), ...s.style } } : s));
}

// ---------- Eid ----------

// A starry night in deep teal, with gold.
export const EID_MUBARAK = design(
  {
    grounds: {
      night: { background: ["#0e3340", "#0a1f2c"], gradient: "glow", text: "#f7efda", accent: "#e2bc66" },
      deep: { background: ["#0a1f2c", "#123f45"], gradient: "down", text: "#f7efda", accent: "#e8c672" },
      lantern: { background: ["#16474a", "#0c2a33", "#081923"], gradient: "glow", text: "#fbf3e1", accent: "#e2bc66" },
    },
    heading: "classic",
    body: "storybook",
    motion: ["float", "pulse"],
    transition: "fade",
  },
  {
    intro: { on: "night", envelope: "#f3e3bb", burst: "stars", stickers: ["🌙", "⭐", "🏮", "✨"], scale: 1.1 },
    game: { on: "deep", burst: "stars", stickers: ["⭐", "🌙", "✨"], scale: 0.9 },
    scratch: { on: "lantern", burst: "sparkles", stickers: ["🌙", "✨", "⭐"], scale: 0.9 },
    photos: { on: "night", stickers: ["🏮", "✨", "🌙"] },
    message: { on: "deep", stickers: ["🌙", "⭐"], transition: "blur" },
    finale: { on: "lantern", stickers: ["🌙", "🏮", "⭐", "✨", "🕌"], scale: 1.1 },
  },
);

// Ivory, sage and gold: quiet and elegant, for elders.
export const EID_BLESSINGS = design(
  {
    grounds: {
      ivory: { background: ["#fdf9f0", "#f1e5c9"], gradient: "glow", text: "#2f2818", accent: "#86652a" },
      sage: { background: ["#f5f6ec", "#dfe7d2"], gradient: "down", text: "#25321f", accent: "#7d5f26" },
      gold: { background: ["#f8ecd2", "#ead39f"], gradient: "glow", text: "#2e220c", accent: "#755518" },
    },
    heading: "script",
    body: "storybook",
    motion: ["float", "sway"],
    transition: "fade",
  },
  {
    intro: { on: "ivory", envelope: "#1f3b2d", burst: "sparkles", stickers: ["🌙", "✨", "🌿"] },
    game: { on: "sage", burst: "petals", stickers: ["🌿", "🌸", "✨"], scale: 0.9 },
    reasons: { on: "ivory", burst: "sparkles", stickers: ["🤲", "✨", "🌙"] },
    photos: { on: "sage", stickers: ["🌿", "🌙", "✨"] },
    message: { on: "ivory", stickers: ["🌙", "✨"] },
    finale: { on: "gold", stickers: ["🌙", "✨", "🌿", "⭐"], scale: 1.1 },
  },
);

// Crisp banknote greens, with a gold pay-up finale.
export const EIDI_PLEASE = design(
  {
    grounds: {
      mint: { background: ["#f0f9f1", "#d2ebd6"], gradient: "glow", text: "#11331f", accent: "#1b7445" },
      notes: { background: ["#e1f2e3", "#c4e4ca"], gradient: "diagonal", pattern: "stripes", text: "#0f2e1b", accent: "#14653a" },
      gold: { background: ["#fcf4da", "#f0dba2"], gradient: "glow", text: "#352606", accent: "#8a5f0e" },
    },
    heading: "bold",
    body: "rounded",
    motion: ["bounce", "sway"],
    transition: "bounce",
  },
  {
    intro: { on: "mint", envelope: "#2e7a4c", burst: "confetti", stickers: ["💸", "🌙", "💷", "✨"] },
    question: { on: "notes", burst: "confetti", stickers: ["💰", "🤑", "💸"], scale: 0.9 },
    quiz: { on: "mint", burst: "confetti", stickers: ["🧮", "💷", "💰"], scale: 0.9 },
    photos: { on: "notes", stickers: ["📸", "💸", "⭐"], transition: "zoom" },
    message: { on: "mint", stickers: ["🌙", "💚"], transition: "rise" },
    finale: { on: "gold", stickers: ["💸", "🌙", "💰", "✨", "💷"], scale: 1.1 },
  },
);

// Saffron and spice, like the Eid table.
export const EID_HUGS_AND_FEASTS = design(
  {
    grounds: {
      saffron: { background: ["#fff5e6", "#fbdcb3"], gradient: "glow", text: "#45200e", accent: "#b84c1b" },
      spice: { background: ["#fde7d0", "#f6c99b"], gradient: "diagonal", text: "#341606", accent: "#9f3f15" },
      cream: { background: ["#fffaf2", "#f9e3c5"], gradient: "down", pattern: "dots", text: "#45200e", accent: "#b84c1b" },
    },
    heading: "rounded",
    body: "rounded",
    motion: ["sway", "float"],
    transition: "rise",
  },
  {
    intro: { on: "saffron", envelope: "#b84c1b", burst: "sparkles", stickers: ["🤗", "🌙", "🍲", "✨"] },
    game: { on: "cream", burst: "hearts", stickers: ["🤗", "💛", "🌙"], scale: 0.9 },
    wheel: { on: "spice", burst: "confetti", stickers: ["🍲", "🥟", "🍮"], scale: 0.9, transition: "zoom" },
    photos: { on: "saffron", stickers: ["📸", "💛", "🌙"] },
    message: { on: "cream", stickers: ["🌙", "🤗"] },
    finale: { on: "spice", stickers: ["🍲", "🌙", "🥟", "✨", "🍮"], scale: 1.1 },
  },
);

// A gallery at night: warm black, emerald velvet and gold frames.
export const EID_FAMILY_GALLERY = design(
  {
    grounds: {
      gallery: { background: ["#2b241b", "#14110d"], gradient: "glow", text: "#f6ecd5", accent: "#d8b062" },
      velvet: { background: ["#1d3326", "#0f1b14"], gradient: "glow", text: "#f2ead4", accent: "#d8b062" },
    },
    heading: "classic",
    body: "storybook",
    motion: ["pulse", "float"],
    transition: "zoom",
  },
  {
    intro: { on: "gallery", envelope: "#d8b062", burst: "sparkles", stickers: ["🖼️", "🌙", "✨", "🏮"] },
    photos: { on: "gallery", stickers: ["📸", "✨", "🌙"], transition: "fade" },
    game: { on: "velvet", burst: "stars", stickers: ["🌙", "⭐", "✨"], scale: 0.9 },
    reasons: { on: "gallery", burst: "lanterns", stickers: ["🏮", "✨", "🖼️"] },
    message: { on: "velvet", stickers: ["🌙", "✨"], transition: "fade" },
    finale: { on: "gallery", stickers: ["🌙", "🏮", "✨", "⭐", "🖼️"], scale: 1.05 },
  },
);

// ---------- Anniversary ----------

// A storybook: blush pages that turn, ending on deep wine.
export const OUR_STORY = design(
  {
    grounds: {
      page: { background: ["#fdf7f0", "#f5e0d4"], gradient: "glow", text: "#4a1828", accent: "#9b2c48" },
      rose: { background: ["#f9e6e3", "#eec5c4"], gradient: "diagonal", text: "#431220", accent: "#87213c" },
      wine: { background: ["#5c1b2d", "#2c0b16"], gradient: "glow", text: "#fbeae6", accent: "#f1b6c2" },
    },
    heading: "storybook",
    body: "storybook",
    motion: ["sway", "float"],
    transition: "flip",
  },
  {
    intro: { on: "page", envelope: "#7a2238", burst: "petals", stickers: ["📖", "🌹", "✨"], transition: "fade" },
    photos: { on: "rose", stickers: ["🌹", "📸", "✒️"] },
    quiz: { on: "page", burst: "hearts", stickers: ["📖", "💌", "✒️"], scale: 0.9 },
    message: { on: "rose", stickers: ["🌹", "💌"] },
    question: { on: "page", burst: "hearts", stickers: ["🖋️", "🌹", "📖"], scale: 0.9 },
    finale: { on: "wine", stickers: ["🌹", "📖", "💌", "✨", "🕯️"], scale: 1.1 },
  },
);

// Champagne and linen, then candlelight for the toast.
export const STILL_CHOOSE_YOU = design(
  {
    grounds: {
      champagne: { background: ["#fcf7ee", "#efe2ca"], gradient: "glow", text: "#33281a", accent: "#906d2e" },
      linen: { background: ["#f7f2e9", "#e6dac7"], gradient: "down", text: "#2d251b", accent: "#86642b" },
      candle: { background: ["#33291e", "#16110c"], gradient: "glow", text: "#f7edd9", accent: "#dfc07f" },
    },
    heading: "script",
    body: "classic",
    motion: ["float"],
    transition: "blur",
  },
  {
    intro: { on: "champagne", envelope: "#bfa06b", burst: "sparkles", stickers: ["🥂", "✨", "🤍"] },
    message: { on: "linen", stickers: ["🕯️", "✨"] },
    reasons: { on: "champagne", burst: "sparkles", stickers: ["🤍", "✨", "🥂"] },
    photos: { on: "linen", stickers: ["✨", "🤍", "📸"] },
    slider: { on: "champagne", burst: "sparkles", stickers: ["🥂", "🤍", "✨"], scale: 0.9 },
    finale: { on: "candle", stickers: ["🥂", "✨", "🕯️", "🤍"], scale: 1.05 },
  },
);

// A midnight-blue vault with a pink glow once it's unlocked.
export const SECRET_PASSWORD = design(
  {
    grounds: {
      vault: { background: ["#1a2252", "#0b1030"], gradient: "glow", text: "#f1efff", accent: "#f4a8c9" },
      grid: { background: ["#141b45", "#0a0e2a"], gradient: "down", pattern: "grid", text: "#eef0ff", accent: "#ffb6d3" },
      open: { background: ["#3a2466", "#1c1240"], gradient: "glow", text: "#fbeeff", accent: "#ffb6d3" },
    },
    heading: "typewriter",
    body: "modern",
    motion: ["pulse", "float"],
    transition: "blur",
  },
  {
    intro: { on: "vault", envelope: "#f4a8c9", burst: "sparkles", stickers: ["🔐", "💌", "✨", "🔑"] },
    quiz: { on: "grid", burst: "stars", stickers: ["🔐", "🕵️", "✨"], scale: 0.9 },
    typeit: { on: "grid", burst: "hearts", stickers: ["🔑", "💗", "🔐"], scale: 0.9 },
    photos: { on: "open", stickers: ["💗", "✨", "📸"], transition: "zoom" },
    message: { on: "vault", stickers: ["💌", "✨"] },
    finale: { on: "open", stickers: ["💗", "🔓", "✨", "💌", "🗝️"], scale: 1.05 },
  },
);

// A lavender scrapbook with gingham checks.
export const MEMORY_LANE = design(
  {
    grounds: {
      lilac: { background: ["#f8f3fd", "#e8dcf5"], gradient: "glow", text: "#2f1f47", accent: "#7445ad" },
      checks: { background: ["#f0e7fa", "#ddcbf1"], gradient: "diagonal", pattern: "checks", text: "#2b1b42", accent: "#683ca0" },
    },
    heading: "handwritten",
    body: "rounded",
    motion: ["bounce", "float"],
    transition: "bounce",
  },
  {
    intro: { on: "lilac", envelope: "#9a78c9", burst: "hearts", stickers: ["🃏", "💜", "🌸", "✨"] },
    game: { on: "checks", burst: "hearts", stickers: ["🃏", "💜", "🌸"], scale: 0.9 },
    photos: { on: "lilac", stickers: ["📸", "💭", "💜"] },
    boxes: { on: "checks", burst: "confetti", stickers: ["🎁", "💜", "🧺"], scale: 0.9 },
    message: { on: "lilac", stickers: ["💌", "🌸"], transition: "rise" },
    finale: { on: "checks", stickers: ["💜", "🃏", "🌸", "✨", "🧸"], scale: 1.1 },
  },
);

// A travel journal: kraft paper, map greens and blue ink, ending at dusk.
export const OUR_TIMELINE = design(
  {
    grounds: {
      kraft: { background: ["#f7f1e6", "#e6d8c1"], gradient: "glow", text: "#2b2117", accent: "#2b5a7b" },
      map: { background: ["#eef1ee", "#d6dfd8"], gradient: "down", pattern: "grid", text: "#1f2a26", accent: "#2b5a7b" },
      dusk: { background: ["#26364a", "#121b28"], gradient: "glow", text: "#f4efe4", accent: "#e7b56a" },
    },
    heading: "classic",
    body: "typewriter",
    motion: ["float", "sway"],
    transition: "slide",
  },
  {
    intro: { on: "kraft", envelope: "#2b5a7b", burst: "sparkles", stickers: ["✈️", "📍", "💌", "🗺️"] },
    timeline: { on: "map", stickers: ["📍", "🗺️", "✈️"], scale: 0.9 },
    photos: { on: "kraft", stickers: ["📸", "🏠", "💛"] },
    reasons: { on: "map", burst: "hearts", stickers: ["💛", "📍", "✈️"] },
    slider: { on: "kraft", burst: "hearts", stickers: ["💛", "🗺️", "✨"], scale: 0.9 },
    message: { on: "kraft", stickers: ["✉️", "📍"], transition: "fade" },
    finale: { on: "dusk", stickers: ["✈️", "🌙", "📍", "✨", "💛"], scale: 1.05 },
  },
);

// Retro tickets: cream and cherry red, with stripes.
export const LOVE_COUPONS = design(
  {
    grounds: {
      ticket: { background: ["#fff8ee", "#fde2cc"], gradient: "glow", text: "#4f0f19", accent: "#c8283b" },
      stripes: { background: ["#ffefe2", "#fbd3bb"], gradient: "diagonal", pattern: "stripes", text: "#480d16", accent: "#b2202f" },
      cherry: { background: ["#8f1a2a", "#4d0b15"], gradient: "glow", text: "#fff1ea", accent: "#ffc9c2" },
    },
    heading: "bold",
    body: "rounded",
    motion: ["bounce", "pulse"],
    transition: "bounce",
  },
  {
    intro: { on: "ticket", envelope: "#c8283b", burst: "hearts", stickers: ["🎟️", "💋", "🍒", "💕"] },
    coupons: { on: "stripes", stickers: ["🎟️", "💕", "💋"], scale: 0.85 },
    wheel: { on: "ticket", burst: "hearts", stickers: ["💋", "🍒", "🎡"], scale: 0.85, transition: "zoom" },
    photos: { on: "stripes", stickers: ["📸", "💕", "🎟️"] },
    message: { on: "ticket", stickers: ["💌", "🍒"] },
    finale: { on: "cherry", stickers: ["💋", "🎟️", "💕", "🍒", "✨"], scale: 1.1 },
  },
);

// ---------- Sorry ----------

// Puppy-eyed lilac and periwinkle, in felt-tip.
export const PLEASE_FORGIVE_ME = design(
  {
    grounds: {
      lilac: { background: ["#f5f1ff", "#ded4ff"], gradient: "glow", text: "#271a4f", accent: "#6439e6" },
      periwinkle: { background: ["#edf1ff", "#d3defc"], gradient: "diagonal", pattern: "dots", text: "#1c2552", accent: "#4447cf" },
    },
    heading: "marker",
    body: "rounded",
    motion: ["bounce", "sway"],
    transition: "drop",
  },
  {
    intro: { on: "lilac", envelope: "#6439e6", burst: "hearts", stickers: ["🥺", "🙏", "💐"] },
    question: { on: "periwinkle", burst: "hearts", stickers: ["🥺", "🙏", "🍕"], scale: 0.9 },
    slider: { on: "lilac", burst: "confetti", stickers: ["🙏", "💜", "🍫"], scale: 0.9 },
    photos: { on: "periwinkle", stickers: ["📸", "💐", "🐶"] },
    message: { on: "lilac", stickers: ["📝", "🥺"], transition: "rise" },
    finale: { on: "periwinkle", stickers: ["🍕", "🍫", "💐", "🥺", "💜"], scale: 1.1 },
  },
);

// Quiet dusk blues that end on a warm dawn. Few stickers and slow, gentle moments.
export const IM_REALLY_SORRY = design(
  {
    grounds: {
      dusk: { background: ["#f3f5f9", "#dce3ee"], gradient: "glow", text: "#1f2b44", accent: "#43608e" },
      mist: { background: ["#eef1f4", "#d8dfe8"], gradient: "down", text: "#1f2a3a", accent: "#3d5878" },
      dawn: { background: ["#fbf3ee", "#efd9cf"], gradient: "glow", text: "#3a2420", accent: "#965444" },
    },
    heading: "classic",
    body: "storybook",
    motion: ["float"],
    transition: "fade",
  },
  {
    intro: { on: "dusk", envelope: "#43608e", burst: "petals", stickers: ["🌷", "🕊️"] },
    message: { on: "mist", stickers: ["🌷", "🤍"], tune: { speed: 0.85 } },
    reasons: { on: "dusk", burst: "petals", stickers: ["🕊️", "🌷"] },
    photos: { on: "mist", stickers: ["🤍", "🌷"] },
    // The lanterns go up softly, without the usual fireworks.
    game: { on: "dusk", burst: "lanterns", stickers: ["🕊️", "🤍"], tune: { speed: 0.8 } },
    finale: { on: "dawn", stickers: ["🌷", "🕊️", "🤍"] },
  },
);

// Peach and coral, with dinner on the way.
export const SCRATCH_MY_APOLOGY = design(
  {
    grounds: {
      peach: { background: ["#fff4ec", "#ffd9c4"], gradient: "glow", text: "#4a1d10", accent: "#c34c27" },
      coral: { background: ["#ffe8db", "#ffc6aa"], gradient: "diagonal", pattern: "zigzag", text: "#3a1508", accent: "#b84421" },
    },
    heading: "bold",
    body: "rounded",
    motion: ["bounce", "float"],
    transition: "zoom",
  },
  {
    intro: { on: "peach", envelope: "#c34c27", burst: "confetti", stickers: ["🎟️", "🍝", "💛"] },
    scratch: { on: "coral", burst: "confetti", stickers: ["🍝", "🍰", "✨"], scale: 0.9 },
    question: { on: "peach", burst: "hearts", stickers: ["🕯️", "🍰", "🌮"], scale: 0.9 },
    photos: { on: "coral", stickers: ["📸", "💛", "🍝"] },
    message: { on: "peach", stickers: ["💌", "💛"], transition: "rise" },
    finale: { on: "coral", stickers: ["🍝", "🍰", "💛", "✨", "🕯️"], scale: 1.1 },
  },
);

// Soft rose and mauve, handwritten, with teddies and tea.
export const HUG_IT_OUT = design(
  {
    grounds: {
      rose: { background: ["#fcf1f7", "#f0d6e6"], gradient: "glow", text: "#3d1a35", accent: "#a33d7c" },
      mauve: { background: ["#f6e7f2", "#e5c7dd"], gradient: "diagonal", text: "#381530", accent: "#90326d" },
    },
    heading: "handwritten",
    body: "rounded",
    motion: ["sway", "float"],
    transition: "rise",
  },
  {
    intro: { on: "rose", envelope: "#a33d7c", burst: "hearts", stickers: ["🤗", "🧸", "💞"] },
    question: { on: "mauve", burst: "hearts", stickers: ["🥺", "💞", "🧸"], scale: 0.9 },
    game: { on: "rose", burst: "hearts", stickers: ["🤗", "💞", "💗"], scale: 0.9, transition: "zoom" },
    coupons: { on: "mauve", stickers: ["🎟️", "☕", "🍪"], scale: 0.85 },
    photos: { on: "rose", stickers: ["📸", "💞", "🧸"] },
    message: { on: "mauve", stickers: ["💌", "🤍"] },
    finale: { on: "rose", stickers: ["🤗", "🧸", "💞", "☕", "🍪"], scale: 1.1 },
  },
);

// ---------- Thank you ----------

// Letterpress cream and navy, with gold stars.
export const THANK_YOU_SO_MUCH = design(
  {
    grounds: {
      cream: { background: ["#fdfaf2", "#efe6d2"], gradient: "glow", text: "#1d2a44", accent: "#2e4a7b" },
      navy: { background: ["#1d2b4d", "#0e1730"], gradient: "glow", text: "#f6f1e3", accent: "#e3c56f" },
      paper: { background: ["#f7f3ea", "#e8dfcd"], gradient: "down", pattern: "dots", text: "#1d2a44", accent: "#2e4a7b" },
    },
    heading: "handwritten",
    body: "storybook",
    motion: ["pulse", "float"],
    transition: "rise",
  },
  {
    intro: { on: "cream", envelope: "#2e4a7b", burst: "sparkles", stickers: ["💐", "✨", "💙"] },
    // Big, slow stars: this one's often for teachers and grandparents.
    game: { on: "navy", burst: "stars", stickers: ["⭐", "✨", "🌟"], scale: 0.9, tune: { goal: 8, speed: 0.85, size: 1.2 } },
    reasons: { on: "paper", burst: "sparkles", stickers: ["🙏", "💐", "✨"] },
    photos: { on: "cream", stickers: ["📸", "💙", "✨"] },
    message: { on: "paper", stickers: ["💌", "💐"], transition: "fade" },
    finale: { on: "navy", stickers: ["⭐", "💐", "✨", "🙏", "🌟"], scale: 1.1 },
  },
);

// A gallery wall: warm plaster and terracotta.
export const GALLERY_OF_THANKS = design(
  {
    grounds: {
      plaster: { background: ["#fdf6ee", "#f5dcc7"], gradient: "glow", pattern: "grid", text: "#3d2116", accent: "#b84f2a" },
      clay: { background: ["#f9e6d6", "#efc8ab"], gradient: "diagonal", text: "#30170c", accent: "#9e431d" },
    },
    heading: "bold",
    body: "modern",
    motion: ["float", "pulse"],
    transition: "zoom",
  },
  {
    intro: { on: "plaster", envelope: "#b84f2a", burst: "confetti", stickers: ["🖼️", "🧡", "📸", "🎉"] },
    photos: { on: "plaster", stickers: ["📌", "🖼️", "🧡"], transition: "fade" },
    game: { on: "clay", burst: "confetti", stickers: ["🧡", "🌟", "🖼️"], scale: 0.9 },
    slider: { on: "plaster", burst: "fireworks", stickers: ["🧡", "🎉", "🌟"], scale: 0.9 },
    message: { on: "clay", stickers: ["💌", "🧡"] },
    finale: { on: "clay", stickers: ["🎉", "🖼️", "🧡", "🌟", "📸"], scale: 1.05 },
  },
);

// A spring garden, ending in pink bloom.
export const THANKS_A_BUNCH = design(
  {
    grounds: {
      garden: { background: ["#f5f9ef", "#dce9cd"], gradient: "glow", text: "#1a2e14", accent: "#b33a6f" },
      meadow: { background: ["#ebf4e2", "#cde2bd"], gradient: "diagonal", pattern: "dots", text: "#16290f", accent: "#a2325f" },
      bloom: { background: ["#fdf2f6", "#f5d2df"], gradient: "glow", text: "#4a1630", accent: "#a8336a" },
    },
    heading: "storybook",
    body: "rounded",
    motion: ["sway", "float"],
    transition: "rise",
  },
  {
    intro: { on: "garden", envelope: "#d9779d", burst: "petals", stickers: ["🌷", "🌱", "🐝"] },
    game: { on: "meadow", burst: "petals", stickers: ["🐝", "🌱", "🦋"], scale: 0.9 },
    boxes: { on: "garden", burst: "petals", stickers: ["🌻", "🌷", "🌹"], scale: 0.9 },
    photos: { on: "meadow", stickers: ["📸", "🌼", "🦋"] },
    message: { on: "garden", stickers: ["🌷", "💌"] },
    finale: { on: "bloom", stickers: ["🌷", "🌻", "🌼", "🦋", "🌹"], scale: 1.1 },
  },
);

// ---------- Congrats ----------

// Mint confetti, then an emerald and gold podium.
export const YOU_DID_IT = design(
  {
    grounds: {
      mint: { background: ["#f0fbf4", "#d1eedd"], gradient: "glow", pattern: "dots", text: "#0b3022", accent: "#14734f" },
      fresh: { background: ["#e3f6ec", "#bde6d1"], gradient: "diagonal", text: "#0a2c1d", accent: "#106546" },
      podium: { background: ["#13493a", "#0a2a20"], gradient: "glow", text: "#f6f2e2", accent: "#f0c24f" },
    },
    heading: "bold",
    body: "modern",
    motion: ["bounce", "float"],
    transition: "zoom",
  },
  {
    intro: { on: "mint", envelope: "#c9962a", burst: "confetti", stickers: ["🏆", "🎉", "🎓", "⭐"] },
    game: { on: "fresh", burst: "confetti", stickers: ["🎈", "🎉", "⭐"], scale: 0.9 },
    photos: { on: "mint", stickers: ["📸", "🌟", "🎓"] },
    boxes: { on: "fresh", burst: "fireworks", stickers: ["🎁", "🏆", "🎉"], scale: 0.9 },
    message: { on: "mint", stickers: ["💚", "⭐"], transition: "rise" },
    finale: { on: "podium", stickers: ["🏆", "🎉", "🥇", "⭐", "🎓"], scale: 1.1 },
  },
);

// A chalkboard, in felt-tip and chalk yellow.
export const BIG_BRAIN_ENERGY = design(
  {
    grounds: {
      board: { background: ["#2b403a", "#1b2925"], gradient: "glow", pattern: "grid", text: "#f2f6ef", accent: "#f6d860" },
      slate: { background: ["#23312e", "#141d1b"], gradient: "down", text: "#eef4ec", accent: "#ffd84d" },
    },
    heading: "marker",
    body: "rounded",
    motion: ["pulse", "sway"],
    transition: "slide",
  },
  {
    intro: { on: "board", envelope: "#f6d860", burst: "stars", stickers: ["🤓", "💡", "✏️", "📐"] },
    question: { on: "slate", burst: "stars", stickers: ["🧠", "🤓", "💡"], scale: 0.9 },
    quiz: { on: "board", burst: "confetti", stickers: ["📐", "✏️", "🧠"], scale: 0.9 },
    game: { on: "slate", burst: "stars", stickers: ["⭐", "🌟", "💡"], scale: 0.9 },
    photos: { on: "board", stickers: ["📸", "🤓", "⭐"] },
    message: { on: "slate", stickers: ["🎓", "💡"], transition: "fade" },
    finale: { on: "board", stickers: ["🧠", "🎓", "⭐", "💡", "🤓"], scale: 1.1 },
  },
);

// A casino: red velvet, black felt and gold.
export const YOU_HIT_THE_JACKPOT = design(
  {
    grounds: {
      velvet: { background: ["#4a1022", "#2a0912"], gradient: "glow", text: "#fcefd4", accent: "#f2c443" },
      felt: { background: ["#2b0c16", "#160609"], gradient: "down", pattern: "checks", text: "#fbeed6", accent: "#f2c443" },
    },
    heading: "bold",
    body: "modern",
    motion: ["pulse", "bounce"],
    transition: "zoom",
  },
  {
    intro: { on: "velvet", envelope: "#f2c443", burst: "sparkles", stickers: ["🎰", "💰", "🍒", "💎"] },
    game: { on: "felt", burst: "fireworks", stickers: ["🍒", "💎", "⭐"], scale: 0.9 },
    slider: { on: "velvet", burst: "confetti", stickers: ["💰", "🎲", "⭐"], scale: 0.9 },
    photos: { on: "felt", stickers: ["📸", "🌟", "💎"] },
    message: { on: "velvet", stickers: ["🥂", "💰"], transition: "fade" },
    finale: { on: "felt", stickers: ["🎰", "💰", "💎", "🍒", "🎲"], scale: 1.1 },
  },
);

// ---------- Halloween ----------
// The ghost games go a little slower with fewer to win: recipients got stuck on them in testing.

// Pumpkin orange on a purple night.
export const TRICK_OR_TREAT = design(
  {
    grounds: {
      night: { background: ["#2e1739", "#160b1e"], gradient: "glow", text: "#fcecd8", accent: "#ff8a2b" },
      ember: { background: ["#3a1733", "#1d0c1a"], gradient: "diagonal", text: "#fdeedc", accent: "#ff9a3d" },
      candy: { background: ["#2e1739", "#1d0c1a"], gradient: "down", pattern: "stripes", text: "#fcecd8", accent: "#ff8a2b" },
    },
    heading: "spooky",
    body: "rounded",
    motion: ["sway", "float"],
    transition: "drop",
  },
  {
    intro: { on: "night", envelope: "#ff8a2b", burst: "spooky", stickers: ["🎃", "🦇", "🕸️", "🍬"] },
    question: { on: "ember", burst: "colours", stickers: ["🍬", "🎃", "🍭"], scale: 0.9 },
    game: { on: "night", burst: "spooky", stickers: ["👻", "🦇", "🎃"], scale: 0.9, tune: { goal: 6, speed: 0.75 } },
    game2: { on: "candy", burst: "confetti", stickers: ["🍬", "🍭", "🍫"], scale: 0.9, tune: { goal: 8, speed: 0.85, size: 1.2 } },
    photos: { on: "ember", stickers: ["📸", "🕸️", "🦇"] },
    message: { on: "night", stickers: ["🎃", "🍬"], transition: "fade" },
    finale: { on: "ember", stickers: ["🎃", "👻", "🦇", "🍬", "🕸️"], scale: 1.1 },
  },
);

// Pastel ghosts: lilac and mint, more cute than scary.
export const BOO_I_LOVE_YOU = design(
  {
    grounds: {
      lilac: { background: ["#f7f1fd", "#e5d8f6"], gradient: "glow", text: "#2b1c42", accent: "#c4407f" },
      mint: { background: ["#eff9f5", "#d3ebe1"], gradient: "diagonal", pattern: "dots", text: "#163328", accent: "#b23a74" },
      dusk: { background: ["#3a2a57", "#1f1533"], gradient: "glow", text: "#f7effe", accent: "#ff9fcb" },
    },
    heading: "rounded",
    body: "rounded",
    motion: ["float", "bounce"],
    transition: "bounce",
  },
  {
    intro: { on: "lilac", envelope: "#2b1c42", burst: "hearts", stickers: ["👻", "💜", "🍬"] },
    reasons: { on: "mint", burst: "hearts", stickers: ["👻", "💕", "🍭"] },
    photos: { on: "lilac", stickers: ["📸", "🎃", "💜"] },
    game: { on: "dusk", burst: "spooky", stickers: ["👻", "🦇", "💕"], scale: 0.9, tune: { goal: 6, speed: 0.75 } },
    message: { on: "mint", stickers: ["💌", "👻"], transition: "rise" },
    finale: { on: "dusk", stickers: ["👻", "💜", "🎃", "🍬", "💕"], scale: 1.1 },
  },
);

// A haunted manor: misty green-black, candlelit rooms, an old typewriter.
export const HAUNTED_HOUSE = design(
  {
    grounds: {
      manor: { background: ["#1f2b26", "#0d1311"], gradient: "glow", text: "#ecf1e8", accent: "#a5e06c" },
      fog: { background: ["#26332e", "#111916"], gradient: "down", text: "#e8eee4", accent: "#b5ea83" },
      candle: { background: ["#2e2216", "#120d08"], gradient: "glow", text: "#f6ead6", accent: "#f0b44c" },
    },
    heading: "spooky",
    body: "typewriter",
    motion: ["sway", "float"],
    transition: "blur",
  },
  {
    intro: { on: "manor", envelope: "#cfd8c8", burst: "spooky", stickers: ["🏚️", "🕸️", "🦇", "🕯️"] },
    typeit: { on: "fog", burst: "spooky", stickers: ["🗝️", "🚪", "🕸️"], scale: 0.9 },
    photos: { on: "candle", stickers: ["🕯️", "🖼️", "🦉"] },
    game: { on: "manor", burst: "spooky", stickers: ["👻", "🦇", "🕸️"], scale: 0.9, tune: { goal: 6, speed: 0.75 } },
    message: { on: "candle", stickers: ["🕯️", "🦉"], transition: "fade" },
    finale: { on: "fog", stickers: ["🏚️", "👻", "🦇", "🕯️", "🕸️"], scale: 1.05 },
  },
);

// ---------- New Year ----------

// Midnight blue and champagne gold, with bubbles.
export const HAPPY_NEW_YEAR = design(
  {
    grounds: {
      midnight: { background: ["#1b2147", "#0a0d22"], gradient: "glow", text: "#f4f1ff", accent: "#e9c869" },
      sky: { background: ["#12173a", "#06081a"], gradient: "down", text: "#f1eeff", accent: "#f0d27a" },
      fizz: { background: ["#2c2550", "#141838"], gradient: "diagonal", pattern: "dots", text: "#fbf3e0", accent: "#e9c869" },
    },
    heading: "bold",
    body: "modern",
    motion: ["pulse", "float"],
    transition: "zoom",
  },
  {
    intro: { on: "midnight", envelope: "#e9c869", burst: "fireworks", stickers: ["🥂", "🕛", "✨", "🍾"] },
    game: { on: "sky", burst: "fireworks", stickers: ["🎆", "✨", "🌟"], scale: 0.9 },
    wheel: { on: "fizz", burst: "confetti", stickers: ["🎉", "🥂", "✨"], scale: 0.85 },
    photos: { on: "midnight", stickers: ["📸", "✨", "🎆"] },
    message: { on: "fizz", stickers: ["🥂", "✨"], transition: "fade" },
    finale: { on: "sky", stickers: ["🎆", "🥂", "🍾", "✨", "🎉"], scale: 1.1 },
  },
);

// Frosted silver, warming to gold for the year ahead.
export const YEAR_IN_REVIEW = design(
  {
    grounds: {
      frost: { background: ["#f5f7fb", "#dee4ef"], gradient: "glow", text: "#1d2740", accent: "#7a5920" },
      silver: { background: ["#eef1f7", "#d2d9e7"], gradient: "down", pattern: "dots", text: "#1b2438", accent: "#735420" },
      gold: { background: ["#fcf5e4", "#eedbad"], gradient: "glow", text: "#33260c", accent: "#835d1d" },
    },
    heading: "classic",
    body: "storybook",
    motion: ["float", "pulse"],
    transition: "slide",
  },
  {
    intro: { on: "frost", envelope: "#1d2740", burst: "sparkles", stickers: ["📅", "✨", "❄️", "🥂"] },
    timeline: { on: "silver", stickers: ["❄️", "🌸", "🍂"], scale: 0.9 },
    photos: { on: "frost", stickers: ["📸", "✨", "📅"] },
    reasons: { on: "silver", burst: "sparkles", stickers: ["✨", "💛", "⭐"] },
    scratch: { on: "gold", burst: "confetti", stickers: ["⏳", "✨", "🗓️"], scale: 0.9 },
    message: { on: "frost", stickers: ["💌", "✨"], transition: "fade" },
    finale: { on: "gold", stickers: ["🥂", "🎆", "✨", "⏳", "🌟"], scale: 1.1 },
  },
);
