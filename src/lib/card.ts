import { z } from "zod";
import { LABEL_KEYS } from "./labels";

// A card is a list of screens built from a fixed library of building blocks.
// Keeping it as structured data (not free-form HTML) means templates, the
// creator form, and later the AI editor all produce something that always renders.

export const OCCASIONS = [
  "valentine",
  "birthday",
  "diwali",
  "christmas",
  "eid",
  "anniversary",
  "sorry",
  "thanks",
  "congrats",
  "halloween",
  "newyear",
  "mothersday",
  "fathersday",
  "rakhi",
  "holi",
  "newbaby",
  "wedding",
  "getwell",
  "missyou",
  "friendship",
  "leaving",
] as const;
export const THEMES = ["rose", "marigold", "party", "midnight", "noel", "crescent", "gold", "lavender", "mint", "sunset", "spooky", "holi", "baby", "ivory", "sky"] as const;
export const EFFECTS = ["hearts", "fireworks", "confetti", "sparkles", "snow", "stars", "petals", "spooky", "colours", "lanterns", "bubbles", "balloons", "none"] as const;
export const GAMES = [
  "catch-hearts",
  "light-diyas",
  "blow-candles",
  "pop-balloons",
  "catch-snowflakes",
  "catch-stars",
  "memory-match",
  "unwrap-gift",
  "shake-it",
  "cursor-chase",
  "loves-me-not",
  "whack-ghosts",
  "launch-fireworks",
  "release-lanterns",
  "bubble-wrap",
  "pinata",
  "grow-flower",
  "throw-colours",
  "slot-machine",
  "hold-hug",
  "catch-candy",
] as const;
// Background tunes, synthesised in the browser (see components/card/sound.ts).
export const MUSIC = ["none", "love", "birthday", "jingle", "festive", "lullaby", "spooky", "joy", "auld"] as const;
// Which screen size a design is built for. Most work everywhere.
export const DEVICES = ["everywhere", "phone", "desktop"] as const;
export const LAYOUTS = ["standard", "wide"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type ThemeName = (typeof THEMES)[number];
export type Effect = (typeof EFFECTS)[number];
export type Game = (typeof GAMES)[number];
export type Device = (typeof DEVICES)[number];
export type Layout = (typeof LAYOUTS)[number];
export type Music = (typeof MUSIC)[number];

const text = (max: number) => z.string().trim().max(max);

// Photos must live in our own storage, never arbitrary third-party URLs.
const photoUrl = z
  .string()
  .max(500)
  .refine((u) => u.startsWith("/api/photos/") || isSupabasePhotoUrl(u), "Invalid photo URL");

function isSupabasePhotoUrl(u: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!base && u.startsWith(`${base}/storage/v1/object/public/photos/`);
}

// How one screen looks, written by the AI from what they describe. Every part is
// optional and falls back to the card's theme. Colours are plain hex and the rest are
// fixed choices, so nothing here can carry CSS or links of its own; dark-on-dark text
// is fixed when the screen is shown (see lib/screen-style.ts).
export const FONTS = ["classic", "modern", "handwritten", "storybook", "script", "rounded", "bold", "typewriter", "marker", "spooky"] as const;
export const GRADIENTS = ["down", "diagonal", "glow"] as const;
export const PATTERNS = ["none", "dots", "stripes", "grid", "checks", "zigzag"] as const;
export const MOTIONS = ["none", "float", "spin", "pulse", "sway", "bounce"] as const;
export type Font = (typeof FONTS)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Motion = (typeof MOTIONS)[number];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "A colour must be like #1a2b3c");

// An emoji or two, never words.
const sticker = z.object({
  emoji: z
    .string()
    .max(16)
    .regex(/^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}|\u200d|\ufe0f|\u20e3)+$/u, "A sticker must be an emoji"),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(4).max(40),
  rotate: z.number().min(-180).max(180).optional(),
  motion: z.enum(MOTIONS).optional(),
});

export const screenStyle = z.object({
  // One colour is a plain background; two or three make a gradient.
  background: z.array(hex).min(1).max(3).optional(),
  gradient: z.enum(GRADIENTS).optional(),
  pattern: z.enum(PATTERNS).optional(),
  text: hex.optional(),
  accent: hex.optional(),
  // The envelope's paper, on the intro.
  envelope: hex.optional(),
  heading: z.enum(FONTS).optional(),
  body: z.enum(FONTS).optional(),
  // Floating in the background of this screen instead of the card's own.
  effect: z.enum(EFFECTS).optional(),
  stickers: z.array(sticker).max(10).optional(),
});

export type ScreenStyle = z.infer<typeof screenStyle>;
export type Sticker = z.infer<typeof sticker>;

// A screen's own wording for the words built into it (see lib/labels.ts).
const labels = z.partialRecord(z.enum(LABEL_KEYS), z.union([text(160), z.array(text(80)).min(1).max(12)]));

const screenBase = { id: z.string().min(1).max(40), style: screenStyle.optional(), labels: labels.optional() };

const quizQuestion = z
  .object({
    question: text(140),
    options: z.array(text(60)).min(2).max(4),
    answer: z.number().int().min(0).max(3),
  })
  .refine((q) => q.answer < q.options.length, "Answer must be one of the options");

const timelineEvent = z.object({ when: text(40), what: text(160) });

export const screenSchema = z.discriminatedUnion("type", [
  z.object({
    ...screenBase,
    type: z.literal("intro"),
    title: text(120),
    subtitle: text(200),
    button: text(40),
  }),
  z.object({
    ...screenBase,
    type: z.literal("question"),
    question: text(140),
    yes: text(30),
    no: text(30),
    afterYes: text(140),
  }),
  z.object({
    ...screenBase,
    type: z.literal("photos"),
    title: text(120),
    captions: z.array(text(120)).max(6),
    photos: z.array(photoUrl).max(6),
  }),
  z.object({
    ...screenBase,
    type: z.literal("message"),
    title: text(120),
    body: text(1500),
  }),
  z.object({
    ...screenBase,
    type: z.literal("game"),
    game: z.enum(GAMES),
    title: text(120),
    instructions: text(200),
    winText: text(140),
  }),
  z.object({
    ...screenBase,
    type: z.literal("quiz"),
    title: text(120),
    questions: z.array(quizQuestion).min(1).max(6),
    winText: text(140),
  }),
  z.object({
    ...screenBase,
    type: z.literal("scratch"),
    title: text(120),
    instructions: text(200),
    hidden: text(200),
  }),
  z.object({
    ...screenBase,
    type: z.literal("typeit"),
    title: text(120),
    instructions: text(200),
    phrase: text(40).min(1),
    winText: text(140),
  }),
  z.object({
    ...screenBase,
    type: z.literal("wheel"),
    title: text(120),
    instructions: text(200),
    options: z.array(text(40)).min(2).max(8),
    // Which slice it always lands on, or -1 for a fair spin.
    landOn: z.number().int().min(-1).max(7),
    winText: text(140),
  }),
  z.object({
    ...screenBase,
    type: z.literal("coupons"),
    title: text(120),
    instructions: text(200),
    coupons: z.array(text(80)).min(1).max(6),
  }),
  z.object({
    ...screenBase,
    type: z.literal("reasons"),
    title: text(120),
    instructions: text(200),
    reasons: z.array(text(160)).min(1).max(12),
  }),
  z.object({
    ...screenBase,
    type: z.literal("slider"),
    title: text(120),
    low: text(30),
    high: text(30),
    winText: text(140),
  }),
  z.object({
    ...screenBase,
    type: z.literal("timeline"),
    title: text(120),
    events: z.array(timelineEvent).min(1).max(8),
  }),
  z.object({
    ...screenBase,
    type: z.literal("boxes"),
    title: text(120),
    instructions: text(200),
    prizes: z.array(text(80)).min(2).max(3),
  }),
  z.object({
    ...screenBase,
    type: z.literal("finale"),
    title: text(140),
    body: text(600),
    effect: z.enum(EFFECTS),
  }),
]);

export const cardSchema = z.object({
  occasion: z.enum(OCCASIONS),
  theme: z.enum(THEMES),
  to: text(40).min(1),
  from: text(40).min(1),
  ambient: z.enum(EFFECTS),
  screens: z.array(screenSchema).min(1).max(12),
  // Optional so cards saved before these existed still load.
  template: z.string().max(60).regex(/^[a-z0-9-]*$/).optional(),
  device: z.enum(DEVICES).optional(),
  layout: z.enum(LAYOUTS).optional(),
  music: z.enum(MUSIC).optional(),
});

export type Screen = z.infer<typeof screenSchema>;
export type ScreenType = Screen["type"];
export type QuizQuestion = z.infer<typeof quizQuestion>;
export type TimelineEvent = z.infer<typeof timelineEvent>;
export type CardData = z.infer<typeof cardSchema>;
export type StoredCard = CardData & { id: string; createdAt: string };
