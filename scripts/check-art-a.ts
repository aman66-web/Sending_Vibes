// Checks the art direction of the first 26 ready-made designs (Valentine's to Christmas)
// in src/lib/catalog.ts. Run it with: node_modules/.bin/jiti scripts/check-art-a.ts
// It builds each design for "Lily" from "Sam", validates the card like a saved one, and
// checks the looks: stickers by the edges and clear of the card's own buttons, colours as
// six-digit hex, words readable on their backgrounds, and the house standard (photos,
// two interactive moments, a sincere message, 4 to 9 screens).

import { TEMPLATES, buildCard } from "../src/lib/catalog";
import { cardSchema, type Game, type Screen, type ScreenType } from "../src/lib/card";
import { labelsOn } from "../src/lib/labels";
import { contrast, screenLook } from "../src/lib/screen-style";
import { themes } from "../src/lib/themes";
import { buttonWords, underButtons } from "./card-chrome";

const SLUGS = [
  "be-my-valentine",
  "no-is-not-an-option",
  "love-letter",
  "catch-me-if-you-can",
  "scratch-the-question",
  "date-night-roulette",
  "loves-me-loves-me-not",
  "reasons-i-love-you",
  "birthday-bash",
  "another-year-older",
  "shake-the-present",
  "birthday-from-the-heart",
  "how-well-do-you-know-me",
  "pinata-party",
  "birthday-coupon-book",
  "pick-your-present",
  "festival-of-lights",
  "diwali-blessings",
  "pocket-fireworks",
  "lanterns-of-light",
  "mithai-mayhem",
  "merry-and-bright",
  "naughty-or-nice",
  "christmas-memories",
  "secret-santa",
  "twelve-reasons-of-christmas",
];

// Screens with something to do, and the ones with a big moment for a burst.
const INTERACTIVE: ScreenType[] = ["question", "game", "quiz", "scratch", "typeit", "wheel", "coupons", "reasons", "slider", "boxes"];
const BIG_MOMENT: ScreenType[] = ["intro", "question", "game", "quiz", "scratch", "typeit", "wheel", "reasons", "slider", "boxes"];
// Games that draw the accent on a white surface (see checkScreen).
const ON_WHITE: Game[] = ["memory-match", "shake-it", "slot-machine"];
// Designs where a photos screen doesn't fit (a Secret Santa is often for a colleague).
const NO_PHOTOS = new Set(["secret-santa"]);
const HEX = /^#[0-9a-f]{6}$/i;

const problems: string[] = [];
const notes: string[] = [];
const fail = (slug: string, what: string) => problems.push(`${slug}: ${what}`);

const mine = TEMPLATES.slice(0, SLUGS.length);
mine.forEach((t, i) => {
  if (t.slug !== SLUGS[i]) fail(t.slug, `expected ${SLUGS[i]} at position ${i + 1}`);
});

const fronts = new Map<string, string>();
const finales = new Map<string, string>();

for (const t of mine) {
  const card = buildCard(t, "Lily", "Sam");
  const parsed = cardSchema.safeParse(card);
  if (!parsed.success) for (const issue of parsed.error.issues) fail(t.slug, `invalid card: ${issue.path.join(".")}: ${issue.message}`);
  const screens = card.screens;

  // The shape of the design.
  if (screens.length < 4 || screens.length > 9) fail(t.slug, `${screens.length} screens (want 4 to 9)`);
  if (screens[0]?.type !== "intro" || screens[0].id !== "intro") fail(t.slug, "must open with the intro, id 'intro'");
  if (screens.at(-1)?.type !== "finale" || screens.at(-1)?.id !== "finale") fail(t.slug, "must end with the finale, id 'finale'");
  const ids = screens.map((s) => s.id);
  if (new Set(ids).size !== ids.length) fail(t.slug, `repeated screen ids: ${ids.join(", ")}`);
  const interactive = screens.filter((s) => INTERACTIVE.includes(s.type)).length;
  if (interactive < 2) fail(t.slug, `only ${interactive} interactive screen(s)`);
  if (!screens.some((s) => s.type === "message")) fail(t.slug, "no message screen");
  if (!screens.some((s) => s.type === "photos") && !NO_PHOTOS.has(t.slug)) fail(t.slug, "no photos screen");
  if (screens.some((s) => s.type === "photos") && !t.demo.photos?.length) fail(t.slug, "a photos screen but no demo photos for previews");

  for (const s of screens) checkScreen(t.slug, s, t.theme, s === screens[0]);

  // Fronts of the same occasion should differ: heading font and envelope colours.
  const first = screens[0].style;
  const front = `${t.occasion} ${first?.heading} ${first?.background?.join("+")}`;
  if (fronts.has(front)) fail(t.slug, `same front as ${fronts.get(front)}`);
  fronts.set(front, t.slug);
  const fonts = mine.filter((o) => o.occasion === t.occasion && o.slug !== t.slug && o.screens("", "")[0].style?.heading === first?.heading);
  if (fonts.length) notes.push(`${t.slug} shares its heading font (${first?.heading}) with ${fonts.map((o) => o.slug).join(", ")}`);

  const end = screens.at(-1);
  if (end?.type === "finale") {
    if (finales.has(end.body)) fail(t.slug, `finale line "${end.body}" repeats ${finales.get(end.body)}`);
    finales.set(end.body, t.slug);
  }
}

function checkScreen(slug: string, s: Screen, theme: keyof typeof themes, first: boolean) {
  const where = `${slug} ${s.id}`;
  const style = s.style;
  if (!style) return fail(where, "no style");
  if (!style.heading || !style.body) fail(where, "heading and body fonts should be set on every screen");
  if (!style.background?.length) fail(where, "no background");
  if (style.envelope && s.type !== "intro") fail(where, "an envelope colour only shows on the intro");
  if (s.type === "intro" && !style.envelope) fail(where, "the intro should colour its envelope");
  if (style.burst && !BIG_MOMENT.includes(s.type)) fail(where, `a burst on a ${s.type} screen never plays`);

  // Colours: six-digit hex, and words that read well on every colour of the background.
  const colours = [...(style.background ?? []), style.text, style.accent, style.envelope, ...(style.texts ?? []).map((x) => x.color)].filter((c): c is string => !!c);
  for (const c of colours) if (!HEX.test(c)) fail(where, `colour ${c} isn't six-digit hex`);
  const backgrounds = style.background ?? [];
  if (backgrounds.length && !style.text) fail(where, "a background without its own text colour");
  if (style.text) {
    const worst = Math.min(...backgrounds.map((b) => contrast(style.text!, b)));
    if (worst < 4.5) fail(where, `text ${style.text} only ${worst.toFixed(2)}:1 on its background (want 4.5)`);
  }
  if (style.accent) {
    // Below 2 the card swaps it for the text colour; 2.5 leaves room to spare.
    const worst = Math.min(...backgrounds.map((b) => contrast(style.accent!, b)));
    if (worst < 2.5) fail(where, `accent ${style.accent} only ${worst.toFixed(2)}:1 on its background (want 2.5)`);
    // Coupons, memory cards, the shake game's circle and the slot machine's reels are
    // white, and draw the accent on them.
    const onWhite = s.type === "coupons" || (s.type === "game" && ON_WHITE.includes(s.game));
    if (onWhite && contrast(style.accent, "#ffffff") < 3) fail(where, `accent ${style.accent} is drawn on white here and only reaches ${contrast(style.accent, "#ffffff").toFixed(2)}:1 (want 3)`);
    // The words on the buttons (Next, Spin) are everyday-sized, so they need 4.5:1.
    if (buttonWords(style.accent) < 4.5) fail(where, `the words on its buttons (${style.accent}) are only ${buttonWords(style.accent).toFixed(2)}:1 (want 4.5)`);
  }
  const look = screenLook(themes[theme], style);
  if (contrast(look.theme.accent, look.theme.accentText) < 4.5) fail(where, "button words don't read on the button as drawn");

  // Stickers: 2 to 6, by the edges, never under the card's own buttons (sound in the top
  // right, Back in the top left from the second screen on).
  const stickers = style.stickers ?? [];
  if (stickers.length < 2 || stickers.length > 6) fail(where, `${stickers.length} stickers (want 2 to 6)`);
  for (const st of stickers) {
    const at = `${st.emoji} at ${st.x},${st.y}`;
    if (!(st.x < 15 || st.x > 85 || st.y < 14 || st.y > 86)) fail(where, `${at} isn't near an edge`);
    if (st.x > 75 && st.y < 20) fail(where, `${at} is in the top right, under the sound button`);
    const hidden = underButtons(st, first);
    if (hidden) fail(where, `${at} is ${hidden}`);
    if (st.x < 4 || st.x > 96 || st.y < 4 || st.y > 96) fail(where, `${at} is half off the card`);
    if (st.size < 8 || st.size > 14) fail(where, `${at} is size ${st.size} (want 8 to 14)`);
  }

  // Labels: only ones this kind of screen shows.
  const allowed = new Set<string>(labelsOn(s));
  for (const key of Object.keys(s.labels ?? {})) if (!allowed.has(key)) fail(where, `label "${key}" isn't shown on a ${s.type} screen`);
}

for (const n of notes) console.log(`note: ${n}`);
if (problems.length) {
  for (const p of problems) console.log(`FAIL ${p}`);
  console.log(`\n${problems.length} problem(s) in ${SLUGS.length} designs.`);
  process.exit(1);
}
const total = mine.reduce((n, t) => n + t.screens("", "").length, 0);
console.log(`All ${SLUGS.length} designs pass: ${total} screens, every one styled, valid and readable.`);
