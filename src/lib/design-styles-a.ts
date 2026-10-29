import type { Motion, Screen, ScreenStyle, Sticker } from "./card";
import type { Labels } from "./labels";

// Helpers for the looks of the first ready-made designs in catalog.ts (Valentine's,
// birthdays, Diwali and Christmas). Each screen gets its own style on top of the
// design's theme, the way the card writer styles a custom card (see SYSTEM in
// generate.ts), so a ready-made card looks as finished as one written for them.

// A screen with its look and, where a line suits the design better, its own wording
// for the words built into it (see lib/labels.ts).
export function dress(screen: Screen, style: ScreenStyle, labels?: Labels): Screen {
  return labels ? { ...screen, style, labels } : { ...screen, style };
}

// An emoji stuck on a screen: x and y are % across and down, size is % of the card's
// shorter side. Keep them near the edges and out of the top right, where the sound
// button sits (scripts/check-art-a.ts checks this).
export function sticker(emoji: string, x: number, y: number, size = 11, motion: Motion = "none", rotate = 0): Sticker {
  return { emoji, x, y, size, ...(motion !== "none" ? { motion } : {}), ...(rotate ? { rotate } : {}) };
}
