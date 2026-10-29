// The card's own buttons over the top corners of a screen, for the art checks (see
// components/card/CardPlayer.tsx): Back in the top left from the second screen on, and the
// sound button in the top right, lower down in the previews. Both sit above the stickers,
// so a sticker under either is half hidden. Also the rule for a button's own words.

import type { Sticker } from "../src/lib/card";
import { contrast, readableOn } from "../src/lib/screen-style";

// Sizes the card is played at (phones, a tablet, a computer) and previewed at (the phone
// and browser frames). Stickers are placed by % of the card and sized by % of its shorter side.
const LIVE = [[360, 640], [375, 667], [390, 844], [414, 896], [768, 1024], [1280, 800]] as const;
const PREVIEW = [[290, 618], [760, 470]] as const;
type Box = [left: number, top: number, right: number, bottom: number];

// "Back" is about 90px wide; this leaves room for a slightly longer word.
const back: Box = [12, 12, 112, 58];
const sound = (width: number, top: number): Box => [width - 60, top, width - 12, top + 48];

const covered = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));

// Where a sticker ends up under one of the buttons, if it does. `first` is the opening
// screen, which has no Back button. A sliver (2%) is allowed for the emoji's own margins.
export function underButtons(s: Sticker, first: boolean): string | undefined {
  for (const [views, live] of [[LIVE, true], [PREVIEW, false]] as const) {
    for (const [w, h] of views) {
      // An emoji is about as wide and tall as its font size.
      const half = (0.55 * s.size * Math.min(w, h)) / 100;
      const [x, y] = [(s.x * w) / 100, (s.y * h) / 100];
      const box: Box = [x - half, y - half, x + half, y + half];
      const area = (2 * half) ** 2;
      const at = `${live ? "a" : "the preview at"} ${w}×${h} screen`;
      if (covered(box, sound(w, live ? 12 : 40)) / area > 0.02) return `under the sound button on ${at}`;
      if (live && !first && covered(box, back) / area > 0.02) return `under the Back button on ${at}`;
    }
  }
  return undefined;
}

// A button's words (Next, Spin, Water it) are everyday-sized, so they need 4.5:1 on it.
export const buttonWords = (accent: string) => contrast(accent, readableOn([accent]));
