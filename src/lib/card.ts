import { z } from "zod";

// A card is a list of screens built from a fixed library of building blocks.
// Keeping it as structured data (not free-form HTML) means templates, the
// creator form, and later the AI editor all produce something that always renders.

export const OCCASIONS = ["valentine", "diwali", "birthday"] as const;
export const THEMES = ["rose", "marigold", "party", "midnight"] as const;
export const EFFECTS = ["hearts", "fireworks", "confetti", "sparkles", "none"] as const;
export const GAMES = ["catch-hearts", "light-diyas", "blow-candles"] as const;

export type Occasion = (typeof OCCASIONS)[number];
export type ThemeName = (typeof THEMES)[number];
export type Effect = (typeof EFFECTS)[number];
export type Game = (typeof GAMES)[number];

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
});

export type Screen = z.infer<typeof screenSchema>;
export type ScreenType = Screen["type"];
export type CardData = z.infer<typeof cardSchema>;
export type StoredCard = CardData & { id: string; createdAt: string };
