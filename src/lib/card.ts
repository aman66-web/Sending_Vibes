import { z } from "zod";

// A card is a list of screens built from a fixed library of building blocks.
// Keeping it as structured data (not free-form HTML) means templates, the
// creator form, and later the AI editor all produce something that always renders.

export const OCCASIONS = ["valentine", "birthday", "diwali", "christmas", "eid", "anniversary", "sorry", "thanks", "congrats"] as const;
export const THEMES = ["rose", "marigold", "party", "midnight", "noel", "crescent", "gold", "lavender", "mint", "sunset"] as const;
export const EFFECTS = ["hearts", "fireworks", "confetti", "sparkles", "snow", "stars", "petals", "none"] as const;
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
] as const;
// Which screen size a design is built for. Most work everywhere.
export const DEVICES = ["everywhere", "phone", "desktop"] as const;
export const LAYOUTS = ["standard", "wide"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type ThemeName = (typeof THEMES)[number];
export type Effect = (typeof EFFECTS)[number];
export type Game = (typeof GAMES)[number];
export type Device = (typeof DEVICES)[number];
export type Layout = (typeof LAYOUTS)[number];

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

const screenBase = { id: z.string().min(1).max(40) };

const quizQuestion = z
  .object({
    question: text(140),
    options: z.array(text(60)).min(2).max(4),
    answer: z.number().int().min(0).max(3),
  })
  .refine((q) => q.answer < q.options.length, "Answer must be one of the options");

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
});

export type Screen = z.infer<typeof screenSchema>;
export type ScreenType = Screen["type"];
export type QuizQuestion = z.infer<typeof quizQuestion>;
export type CardData = z.infer<typeof cardSchema>;
export type StoredCard = CardData & { id: string; createdAt: string };
