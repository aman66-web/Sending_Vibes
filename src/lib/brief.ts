import { z } from "zod";
import { MUSIC, OCCASIONS } from "./card";

// What the questions found out about the card they want, sent alongside the written prompt
// when a new card is made, so the card writer (lib/generate.ts) can act on each choice
// directly: the look they picked, which screens to include, who will be playing it.
// Every part is optional; the prompt still says it all in words.
export const briefSchema = z.object({
  occasion: z.enum(OCCASIONS).optional(),
  // Their relationship to the sender, as picked or typed ("Grandparent", "Best friend").
  relation: z.string().trim().max(40).optional(),
  // The feelings picked, most important first (catalog TONES and a few more).
  tones: z.array(z.string().trim().max(30)).max(6).optional(),
  // A look from lib/looks.ts, by key.
  look: z.string().max(30).optional(),
  music: z.enum(MUSIC).optional(),
  // Screens or games to include, by screen-kit key ("quiz", "game:blow-candles").
  include: z.array(z.string().max(40)).max(10).optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  // Who is opening it, and whether to keep the games gentle and easy.
  age: z.enum(["little", "child", "teen", "adult", "older"]).optional(),
  gentle: z.boolean().optional(),
  // Their favourite colour, used as the accent.
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  // A little about them, in the sender's words (also in the prompt).
  about: z.string().trim().max(600).optional(),
  // They left the design to us ("Choose for me"), so it's free to surprise.
  surprise: z.boolean().optional(),
});

export type Brief = z.infer<typeof briefSchema>;
