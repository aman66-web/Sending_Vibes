import type { Motion, Screen, ScreenStyle, Sticker } from "./card";
import type { Labels } from "./labels";

// The looks of the ready-made designs from New Year to Leaving in catalog.ts (Pop the
// Champagne to You Can't Leave). Each design has one look: the colours and fonts all its
// screens share, so the card holds together while each screen brings its own background,
// stickers, burst and entrance. The AI keeps every look as it is when it writes the words
// for a buyer (see NOT_WORDS in generate.ts).

// So these designs can leave words for the buyer to write, like the news on a gender reveal.
export { BLANK } from "./blanks";

// Where stickers sit: the corners and the top edge, clear of the words in the middle, the
// progress dots at the top and the card's own buttons: Back in the top left (from the second
// screen on) and sound in the top right. So the top spots sit just below Back and beside it.
// The sides are for the envelope screen, where the envelope leaves room either side. The
// opening screen has no Back button, so its top-left sticker sits up in the corner (open),
// above the words.
const SPOTS = {
  open: [9, 9],
  tl: [9, 15],
  tc: [30, 13],
  bl: [9, 91],
  br: [91, 91],
  lt: [5, 34],
  lb: [5, 66],
} as const satisfies Record<string, readonly [number, number]>;
export type Spot = keyof typeof SPOTS;

export function stick(emoji: string, spot: Spot, size = 11, motion: Motion = "float", rotate = 0): Sticker {
  const [x, y] = SPOTS[spot];
  return { emoji, x, y, size, rotate, motion };
}

// A design's look, as a way to dress each of its screens: the shared colours and fonts,
// then that screen's own style on top, and any of its built-in words it says differently.
function look(base: ScreenStyle) {
  return <S extends Screen>(screen: S, style: ScreenStyle, labels?: Labels): S => ({ ...screen, style: { ...base, ...style }, ...(labels ? { labels } : {}) });
}

// ---------- New Year ----------
// Pop the Champagne: a black-tie night in, gold on black like the bottle's foil.
export const fizz = look({ text: "#f6e7c0", accent: "#d9b25a", heading: "script", body: "modern" });

// ---------- Mother's Day ----------
// For the Best Mum: a cottage garden, blush and sage with deep rose.
export const bloom = look({ text: "#4a1f2b", accent: "#a63a56", heading: "storybook", body: "storybook" });
// Mum's Coupon Book: lilac stationery, a book of tickets with polka dots.
export const lilac = look({ text: "#32204a", accent: "#7446a8", heading: "rounded", body: "rounded" });
// Who's Mum's Favourite?: a royal decree in coral and peach.
export const crown = look({ text: "#3e1c10", accent: "#b8430f", heading: "bold", body: "modern" });

// ---------- Father's Day ----------
// The Dad Joke Quiz: a comic strip, sky blue with an orange punchline.
export const groan = look({ text: "#14284b", accent: "#c2410c", heading: "marker", body: "rounded" });
// Best Dad Ever: a handwritten thank you in garden greens, with a gold trophy.
export const oak = look({ text: "#1e3324", accent: "#2f6a46", heading: "handwritten", body: "storybook" });
// Dad's Hall of Fame: a museum after hours, charcoal and oxblood walls with gilt frames.
export const gallery = look({ text: "#f4ead6", accent: "#c9a24a", heading: "storybook", body: "classic" });

// ---------- Raksha Bandhan ----------
// The Rakhi Promise: maroon and marigold, with bandhani dots.
export const thread = look({ text: "#fde8c0", accent: "#f2a93b", heading: "script", body: "storybook" });
// Sibling Rivalry: a fight-night poster, yellow with the red corner and the blue corner.
export const bout = look({ text: "#2a1208", accent: "#c1121f", heading: "bold", body: "modern" });

// ---------- Holi ----------
// Happy Holi: a different soft colour on every screen, like gulal in the air.
export const gulal = look({ text: "#3a1640", accent: "#b8155a", heading: "rounded", body: "rounded" });
// Holi Hai!: a colour fight on deep jewel colours, so every splash glows.
export const splash = look({ text: "#fff4fa", accent: "#ffd23f", heading: "marker", body: "rounded" });

// ---------- New baby ----------
// Welcome, Little One: a lullaby sky, soft blue by day and deep blue for sweet dreams.
export const lullaby = look({ text: "#22324d", accent: "#4f6fa8", heading: "storybook", body: "storybook" });
// Boy or Girl? Scratch to Reveal: pink and blue in equal measure, so nothing gives it away.
export const reveal = look({ text: "#2b2440", accent: "#6c4fb3", heading: "rounded", body: "rounded" });
// We Have Big News: a hushed secret in lavender and gold.
export const hush = look({ text: "#2d2145", accent: "#6b47a6", heading: "handwritten", body: "storybook" });

// ---------- Wedding ----------
// Will You Marry Me?: ivory and gold by candlelight, darker for the question itself.
export const candle = look({ text: "#2e2516", accent: "#8f6b2a", heading: "script", body: "classic" });
// To the Happy Couple: a garden party in sage and blush with gold.
export const garden = look({ text: "#2c2a22", accent: "#8a6a2a", heading: "storybook", body: "modern" });
// Will You Be My Bridesmaid?: blush and bows.
export const blush = look({ text: "#4a1830", accent: "#b0375a", heading: "handwritten", body: "rounded" });

// ---------- Get well ----------
// Get Well Soon: sunflowers and a clear blue sky.
export const sunny = look({ text: "#1d2b44", accent: "#1f5fa8", heading: "rounded", body: "rounded" });
// Pop the Boredom: an arcade on the sofa, aqua and bubblegum pink.
export const arcade = look({ text: "#0f3a35", accent: "#c2255c", heading: "bold", body: "rounded" });

// ---------- Miss you ----------
// A Long-Distance Hug: lavender by day, dusk across the miles.
export const dusk = look({ text: "#2b2142", accent: "#6a4c9c", heading: "handwritten", body: "storybook" });
// Counting the Days: a night flight, navy with a departures-board font.
export const flight = look({ text: "#eef1ff", accent: "#ffcf6b", heading: "typewriter", body: "modern" });

// ---------- Best friends ----------
// The Bestie Quiz: a home-made zine in lemon and hot pink.
export const zine = look({ text: "#2b1a2f", accent: "#c8175d", heading: "marker", body: "modern" });
// Friendship Coupons: mint tickets and peach.
export const ticket = look({ text: "#173a2a", accent: "#1d7550", heading: "rounded", body: "rounded" });
// The Friendship Gallery: golden-hour colours, with a warm dark wall for the photos.
export const golden = look({ text: "#3b2116", accent: "#b04a26", heading: "handwritten", body: "storybook" });

// ---------- Leaving ----------
// Sad to See You Go: fair winds, sky blue with lanterns at dusk.
export const voyage = look({ text: "#1c2a43", accent: "#2e5a8c", heading: "storybook", body: "modern" });
// You Can't Leave: an office memo, typed on squared paper with a red stamp.
export const memo = look({ text: "#1f1d1a", accent: "#c62828", heading: "typewriter", body: "typewriter" });
