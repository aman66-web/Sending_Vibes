import type { Effect, Font, Occasion, Pattern, ThemeName } from "./card";

// The looks people pick from before a card is made ("Soft & cute", "Midnight & stars"):
// colours, fonts and a background effect the card writer must use (see lib/generate.ts).
// Plain data with no React, so the server can read it too.

export type Look = {
  key: string;
  // Shown on the tile.
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
  stickers: string[];
  // Occasions it suits best; it can be picked for any.
  suits: Occasion[];
};

export const LOOKS: Look[] = [];

export function getLook(key: string | undefined | null): Look | undefined {
  return key ? LOOKS.find((l) => l.key === key) : undefined;
}

// The looks in the order to offer them for this occasion and these feelings, best first.
export function rankLooks(occasion: Occasion | "" | undefined, tones: string[] = []): Look[] {
  void occasion;
  void tones;
  return LOOKS;
}
