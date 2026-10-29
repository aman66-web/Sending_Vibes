// Checks designs 27 to 52 in src/lib/catalog.ts (Eid Mubarak to Our Year in Review) and
// their looks in src/lib/design-styles-b.ts: each builds into a valid card, meets the
// house standard, keeps its stickers clear of the words and the card's own buttons, and stays
// readable. Run it with: npx jiti scripts/check-art-b.ts

import { cardSchema, type Screen, type ScreenStyle } from "../src/lib/card";
import { TEMPLATES, buildCard } from "../src/lib/catalog";
import * as B from "../src/lib/design-styles-b";
import { LISTS, TEXTS, isList, labelsOn } from "../src/lib/labels";
import { contrast, screenLook } from "../src/lib/screen-style";
import { themes } from "../src/lib/themes";
import { buttonWords, underButtons } from "./card-chrome";

const SLUGS = [
  "eid-mubarak",
  "eid-blessings",
  "eidi-please",
  "eid-hugs-and-feasts",
  "eid-family-gallery",
  "our-story",
  "still-choose-you",
  "secret-password",
  "memory-lane",
  "our-timeline",
  "love-coupons",
  "please-forgive-me",
  "im-really-sorry",
  "scratch-my-apology",
  "hug-it-out",
  "thank-you-so-much",
  "gallery-of-thanks",
  "thanks-a-bunch",
  "you-did-it",
  "big-brain-energy",
  "you-hit-the-jackpot",
  "trick-or-treat",
  "boo-i-love-you",
  "haunted-house",
  "happy-new-year",
  "year-in-review",
];

// Screens they play with, rather than read.
const PLAYED = new Set<Screen["type"]>(["question", "game", "quiz", "scratch", "typeit", "wheel", "coupons", "reasons", "slider", "boxes"]);
// Screens whose panels, buttons or lists run the full width: stickers only in the corners
// (the top ones just below the card's own buttons).
const BUSY = new Set<Screen["type"]>(["game", "quiz", "scratch", "typeit", "wheel", "coupons", "boxes", "timeline", "slider"]);
const HEX = /^#[0-9a-f]{6}$/i;

const problems: string[] = [];
const fail = (slug: string, what: string) => problems.push(`${slug}: ${what}`);

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mix(a: string, b: string, amount: number) {
  const parts = (h: string) => [16, 8, 0].map((s) => (parseInt(h.slice(1), 16) >> s) & 255);
  const [x, y] = [parts(a), parts(b)];
  return `#${x.map((c, i) => Math.round(c * (1 - amount) + y[i] * amount).toString(16).padStart(2, "0")).join("")}`;
}

const placeholders = (s: string) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));

function checkStyle(slug: string, theme: keyof typeof themes, screen: Screen, first: boolean) {
  const where = `${slug} ${screen.id}`;
  const style: ScreenStyle | undefined = screen.style;
  if (!style) return fail(where, "has no style");
  const { background, text, accent, envelope, stickers = [] } = style;
  if (!background?.length || !text || !accent) return fail(where, "needs a background, text and accent colour");
  if (!style.heading || !style.body || !style.transition) fail(where, "needs heading and body fonts and a transition");

  // Colours: six-digit hex, readable words, buttons that stand out.
  for (const c of [...background, text, accent, ...(envelope ? [envelope] : [])]) if (!HEX.test(c)) fail(where, `colour ${c} isn't six-digit hex`);
  const mid = background.length === 1 ? background[0] : mix(background[0], background.at(-1)!, 0.5);
  const dark = luminance(mid) < 0.18;
  // screen-style.ts lightens panels on light backgrounds and darkens them on dark ones,
  // so the ink must be the opposite or the buttons and answers lose their words.
  if (dark !== luminance(text) > 0.4) fail(where, `${dark ? "dark" : "light"} background needs ${dark ? "light" : "dark"} text`);
  const worst = (c: string) => Math.min(...background.map((b) => contrast(c, b)));
  if (worst(text) < 7) fail(where, `text ${text} only ${worst(text).toFixed(1)}:1 on its background`);
  if (worst(mix(text, background[0], 0.28)) < 4.5) fail(where, "instructions (the muted text) aren't readable enough");
  if (worst(accent) < 3) fail(where, `buttons ${accent} only ${worst(accent).toFixed(1)}:1 on their background`);
  if (buttonWords(accent) < 4.5) fail(where, `the words on its buttons (${accent}) are only ${buttonWords(accent).toFixed(2)}:1`);
  // The screen is drawn with exactly the colours chosen, none swapped for readability.
  const look = screenLook(themes[theme], style);
  if (look.theme.text !== text || look.theme.accent !== accent) fail(where, "screen-style.ts swapped its colours, so they don't read well");
  if (contrast(look.theme.accent, look.theme.accentText) < 4.5) fail(where, "button words don't read on the button as drawn");

  if (envelope) {
    if (screen.type !== "intro") fail(where, "only the intro has an envelope");
    else if (worst(envelope) < 1.8) fail(where, `envelope ${envelope} disappears into the background`);
  } else if (screen.type === "intro") fail(where, "the intro should colour its envelope");

  // Stickers: 2 to 6, near the edges, never under the sound or Back buttons, corners only on busy screens.
  if (stickers.length < 2 || stickers.length > 6) fail(where, `has ${stickers.length} stickers (2 to 6)`);
  for (const s of stickers) {
    const at = `${s.emoji} at ${s.x},${s.y}`;
    if (!(s.x < 15 || s.x > 85 || s.y < 14 || s.y > 86)) fail(where, `${at} is over the words`);
    if (s.x > 70 && s.y < 20) fail(where, `${at} covers the sound button`);
    const hidden = underButtons(s, first);
    if (hidden) fail(where, `${at} is ${hidden}`);
    if (BUSY.has(screen.type) && !(s.y < 18 || s.y > 86)) fail(where, `${at} is on the edge of a busy screen`);
    if (s.size < 6 || s.size > 16) fail(where, `${at} is size ${s.size} (6 to 16)`);
  }

  // A game's instructions say how many to win, so they must match its tune.
  const goal = style.tune?.goal;
  if (screen.type === "game" && goal) {
    const said = /\b(\d+)\b/.exec(screen.instructions)?.[1];
    if (said && Number(said) !== goal) fail(where, `says ${said} to win but the tune needs ${goal}`);
  }
}

function checkLabels(slug: string, screen: Screen) {
  for (const [key, value] of Object.entries(screen.labels ?? {})) {
    if (!labelsOn(screen).includes(key as never)) fail(`${slug} ${screen.id}`, `label ${key} isn't shown on a ${screen.type} screen`);
    if (isList(key) !== Array.isArray(value)) fail(`${slug} ${screen.id}`, `label ${key} should ${isList(key) ? "" : "not "}be a list`);
    const usual = isList(key) ? LISTS[key].join(" ") : TEXTS[key as keyof typeof TEXTS];
    const allowed = placeholders(usual ?? "");
    for (const p of placeholders([value].flat().join(" "))) if (!allowed.has(p)) fail(`${slug} ${screen.id}`, `label ${key} uses {${p}}, which it never fills in`);
  }
}

const start = TEMPLATES.findIndex((t) => t.slug === SLUGS[0]);
const mine = TEMPLATES.slice(start, start + SLUGS.length);
if (start !== 26 || mine.map((t) => t.slug).join() !== SLUGS.join()) problems.push(`expected designs 27 to 52 to be ${SLUGS.join(", ")}`);

const finales = new Map<string, string>();
for (const t of mine) {
  const card = buildCard(t, "Lily", "Sam");
  const parsed = cardSchema.safeParse(card);
  if (!parsed.success) fail(t.slug, `not a valid card: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  const { screens } = card;
  const ids = screens.map((s) => s.id);

  // The house standard, and what saved cards rely on.
  if (screens.length < 4 || screens.length > 9) fail(t.slug, `has ${screens.length} screens (4 to 9)`);
  if (screens[0]?.type !== "intro" || screens[0].id !== "intro") fail(t.slug, "must open with the intro, id intro");
  if (screens.at(-1)?.type !== "finale" || screens.at(-1)?.id !== "finale") fail(t.slug, "must end with the finale, id finale");
  if (new Set(ids).size !== ids.length) fail(t.slug, `screen ids repeat: ${ids.join(", ")}`);
  if (screens.filter((s) => PLAYED.has(s.type)).length < 2) fail(t.slug, "needs two things to play");
  if (screens.filter((s) => s.type === "photos").length !== 1) fail(t.slug, "needs one photos screen");
  if (!screens.some((s) => s.type === "message")) fail(t.slug, "needs a heartfelt message");
  if (screens.some((s) => s.type === "photos") && !t.demo.photos?.length) fail(t.slug, "needs demo photos for its previews");

  // Every screen wears its look, and the look has nothing for screens that aren't there.
  const look = (B as unknown as Record<string, B.Look>)[t.slug.toUpperCase().replace(/-/g, "_")];
  if (!look) fail(t.slug, "has no look in design-styles-b.ts");
  else for (const id of Object.keys(look)) if (!ids.includes(id)) fail(t.slug, `look for "${id}", which isn't one of its screens`);
  for (const s of screens) {
    checkStyle(t.slug, t.theme, s, s === screens[0]);
    checkLabels(t.slug, s);
  }

  // Each card gets its own copy of the look, so editing one never changes the design.
  const again = buildCard(t, "Lily", "Sam");
  if (again.screens[0].style?.stickers && again.screens[0].style.stickers === screens[0].style?.stickers) fail(t.slug, "shares its stickers between cards");

  // Copy: right for both Eids, intro buttons that say more than "Open", no finale twice.
  const words = JSON.stringify(screens);
  if (t.occasion === "eid" && /\bfast(s|ing)?\b|ramadan/i.test(words)) fail(t.slug, "mentions fasting, which is wrong at Eid al-Adha");
  const intro = screens[0];
  if (intro.type === "intro" && /^open$/i.test(intro.button.trim())) fail(t.slug, `intro button just says "${intro.button}"`);
  const end = screens.at(-1);
  if (end?.type === "finale") {
    if (finales.has(end.body)) fail(t.slug, `finale says "${end.body}", like ${finales.get(end.body)}`);
    finales.set(end.body, t.slug);
  }
  // Halloween passwords: short and easy to guess (recipients got stuck on them).
  for (const s of screens) if (t.occasion === "halloween" && s.type === "typeit" && (s.phrase.length > 12 || s.phrase.trim().split(/\s+/).length > 2)) fail(t.slug, `password "${s.phrase}" is too hard`);
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} problems in designs 27 to 52`);
  process.exit(1);
}
console.log(`All ${mine.length} designs (27 to 52) build into valid cards, meet the house standard and read well.`);
