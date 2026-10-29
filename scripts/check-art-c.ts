// Checks the ready-made designs from Pop the Champagne to You Can't Leave (designs 53 to 78
// in catalog.ts): each builds a valid card, meets the house standard and has a readable,
// tidy look on every screen. Run with: node_modules/.bin/jiti scripts/check-art-c.ts
import { cardSchema, type Screen, type ScreenStyle } from "../src/lib/card";
import { TEMPLATES, buildCard, buildTemplateDemo, cardTier } from "../src/lib/catalog";
import { isBlank, stillToWrite } from "../src/lib/blanks";
import { LABEL_KEYS, labelsOn } from "../src/lib/labels";
import { contrast, screenLook } from "../src/lib/screen-style";
import { themes } from "../src/lib/themes";
import { buttonWords, underButtons } from "./card-chrome";

const SLUGS = [
  "pop-the-champagne",
  "for-the-best-mum",
  "mums-coupon-book",
  "who-is-mums-favourite",
  "dad-joke-quiz",
  "best-dad-ever",
  "dads-hall-of-fame",
  "rakhi-promise",
  "sibling-rivalry",
  "happy-holi",
  "holi-hai",
  "welcome-little-one",
  "scratch-to-reveal-baby",
  "big-news",
  "will-you-marry-me",
  "to-the-happy-couple",
  "be-my-bridesmaid",
  "get-well-soon",
  "pop-the-boredom",
  "long-distance-hug",
  "counting-the-days",
  "bestie-quiz",
  "friendship-coupons",
  "friendship-gallery",
  "sad-to-see-you-go",
  "you-cant-leave",
];

// Screens the recipient does something on, beyond reading and tapping Next.
const INTERACTIVE = new Set<Screen["type"]>(["question", "game", "quiz", "scratch", "typeit", "wheel", "coupons", "reasons", "slider", "boxes"]);
const HEX = /^#[0-9a-f]{6}$/i;

const problems: string[] = [];
const fail = (slug: string, what: string) => problems.push(`${slug}: ${what}`);

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Mixes two hex colours, as screen-style.ts does for a light background's buttons.
function mix(a: string, b: string, amount: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((c, i) => Math.round(c * (1 - amount) + y[i] * amount).toString(16).padStart(2, "0")).join("")}`;
}

// How far apart two colours are (0 to about 441), for colours that differ in hue as much as lightness.
function distance(a: string, b: string) {
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(...x.map((c, i) => c - y[i]));
}

// The colour a translucent white layer (rgba(255,255,255,a)) makes over a background.
function overWhite(layer: string, background: string) {
  const alpha = Number(/rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/.exec(layer)?.[1]);
  return Number.isFinite(alpha) ? mix(background, "#ffffff", alpha) : undefined;
}

function checkStyle(slug: string, screen: Screen, theme: keyof typeof themes, first: boolean) {
  const where = `${screen.id} (${screen.type})`;
  const style: ScreenStyle | undefined = screen.style;
  if (!style) return fail(slug, `${where} has no style`);

  // Colours: six-digit hex everywhere.
  const colours = [...(style.background ?? []), style.text, style.accent, style.envelope].filter((c): c is string => c !== undefined);
  for (const c of colours) if (!HEX.test(c)) fail(slug, `${where} colour ${c} isn't six-digit hex`);
  if (!style.background?.length) fail(slug, `${where} has no background of its own`);
  if (style.envelope && screen.type !== "intro") fail(slug, `${where} has an envelope colour but isn't the intro`);
  if (screen.type === "intro" && !style.envelope) fail(slug, `${where} has no envelope colour`);
  if (!style.heading || !style.body) fail(slug, `${where} is missing a heading or body font`);
  if (!style.transition) fail(slug, `${where} has no transition`);

  // Readable: the colours chosen are the ones shown (not swapped for ink or paper), with
  // room to spare, on the background and on the panels drawn over it.
  const look = screenLook(themes[theme], style);
  const backgrounds = style.background ?? [];
  if (style.text && look.theme.text !== style.text) fail(slug, `${where} text ${style.text} is swapped for ${look.theme.text} as too faint`);
  if (style.accent && look.theme.accent !== style.accent) fail(slug, `${where} accent ${style.accent} is changed when shown (too faint, or its button words wouldn't read)`);
  // The words on the buttons (Next, Spin) are everyday-sized, so they need 4.5:1.
  if (style.accent && buttonWords(style.accent) < 4.5) fail(slug, `${where} button words on ${style.accent} are only ${buttonWords(style.accent).toFixed(2)}:1`);
  if (contrast(look.theme.accent, look.theme.accentText) < 4.5) fail(slug, `${where} button words don't read on the button as drawn`);
  for (const bg of backgrounds) {
    const text = contrast(look.theme.text, bg);
    if (text < 4.5) fail(slug, `${where} text on ${bg} is only ${text.toFixed(2)}:1`);
    const muted = contrast(look.theme.muted, bg);
    if (muted < 3) fail(slug, `${where} muted text on ${bg} is only ${muted.toFixed(2)}:1`);
    const accent = contrast(look.theme.accent, bg);
    if (accent < 3) fail(slug, `${where} accent on ${bg} is only ${accent.toFixed(2)}:1`);
    for (const [name, layer] of [["panel", look.theme.surface], ["button", look.theme.secondary]] as const) {
      const solid = HEX.test(layer) ? layer : overWhite(layer, bg);
      if (!solid) continue;
      const on = contrast(look.theme.text, solid);
      if (on < 4.5) fail(slug, `${where} text on its ${name} over ${bg} is only ${on.toFixed(2)}:1`);
    }
  }
  // The envelope sits mid-screen, so it must stand out from the background there, and its
  // wax seal (the accent) must stand out from the envelope.
  if (style.envelope && backgrounds.length) {
    const middle = mix(backgrounds[0], backgrounds.at(-1)!, 0.5);
    if (distance(style.envelope, middle) < 40) fail(slug, `${where} envelope ${style.envelope} disappears into its background`);
    if (distance(style.envelope, look.theme.accent) < 60) fail(slug, `${where} envelope ${style.envelope} hides its seal (${look.theme.accent})`);
  }

  // Stickers: 2 to 6, near the edges and corners, never under the card's own buttons (sound
  // in the top right, Back in the top left from the second screen on).
  const stickers = style.stickers ?? [];
  if (stickers.length < 2 || stickers.length > 6) fail(slug, `${where} has ${stickers.length} stickers (2 to 6 wanted)`);
  for (const s of stickers) {
    const edge = s.x < 15 || s.x > 85 || s.y < 14 || s.y > 86;
    if (!edge) fail(slug, `${where} sticker ${s.emoji} at ${s.x},${s.y} is over the middle`);
    if (s.x > 70 && s.y < 22) fail(slug, `${where} sticker ${s.emoji} at ${s.x},${s.y} covers the sound button`);
    const hidden = underButtons(s, first);
    if (hidden) fail(slug, `${where} sticker ${s.emoji} at ${s.x},${s.y} is ${hidden}`);
    if (s.size < 6 || s.size > 14) fail(slug, `${where} sticker ${s.emoji} is size ${s.size} (6 to 14 wanted)`);
  }
  const spots = new Set(stickers.map((s) => `${s.x},${s.y}`));
  if (spots.size !== stickers.length) fail(slug, `${where} has two stickers in the same spot`);
}

function checkLabels(slug: string, screen: Screen) {
  if (!screen.labels) return;
  const allowed = new Set(labelsOn(screen));
  for (const key of Object.keys(screen.labels)) {
    if (!(LABEL_KEYS as string[]).includes(key)) fail(slug, `${screen.id} has an unknown label ${key}`);
    else if (!allowed.has(key as (typeof LABEL_KEYS)[number])) fail(slug, `${screen.id} (${screen.type}) never shows the label ${key}`);
  }
  // The runaway No button doesn't wrap, and is placed by its last width, so its excuses stay short.
  for (const line of screen.labels.noLines ?? []) if (line.length > 20) fail(slug, `${screen.id} No button line "${line}" is too long for a phone`);
}

const slugAt = TEMPLATES.map((t) => t.slug);
const first = slugAt.indexOf(SLUGS[0]);
if (first !== 52) problems.push(`Pop the Champagne should be design 53, not ${first + 1}`);
if (SLUGS.some((slug, i) => slugAt[first + i] !== slug)) problems.push("These designs aren't together in the order expected");

for (const slug of SLUGS) {
  const t = TEMPLATES.find((x) => x.slug === slug);
  if (!t) {
    fail(slug, "missing");
    continue;
  }
  for (const [to, from] of [["Lily", "Sam"], ["A".repeat(40), "B".repeat(40)]]) {
    const parsed = cardSchema.safeParse(buildCard(t, to, from));
    if (!parsed.success) fail(slug, `doesn't build a valid card for ${to.length}-letter names: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  }
  const card = buildCard(t, "Lily", "Sam");
  const { screens } = card;
  if (cardTier(card) !== "premade") fail(slug, "a fresh card isn't counted as the ready-made design");

  // The house standard.
  if (screens.length < 4 || screens.length > 9) fail(slug, `has ${screens.length} screens (4 to 9 wanted)`);
  if (screens[0]?.type !== "intro" || screens[0].id !== "intro") fail(slug, "doesn't open with the intro");
  if (screens.at(-1)?.type !== "finale" || screens.at(-1)?.id !== "finale") fail(slug, "doesn't end with the finale");
  const ids = screens.map((s) => s.id);
  if (new Set(ids).size !== ids.length) fail(slug, `has repeated screen ids: ${ids.join(", ")}`);
  const played = screens.filter((s) => INTERACTIVE.has(s.type)).length;
  if (played < 2) fail(slug, `has ${played} interactive screens (2 wanted)`);
  if (!screens.some((s) => s.type === "message")) fail(slug, "has no message");
  const photoScreens = screens.filter((s) => s.type === "photos");
  if (photoScreens.length !== 1) fail(slug, `has ${photoScreens.length} photos screens`);
  else if (!t.demo.photos?.length) fail(slug, "has a photos screen but no demo photos for previews");
  const demo = buildTemplateDemo(t);
  if (demo.screens.some((s) => s.type === "photos" && s.photos.length === 0)) fail(slug, "previews with an empty photos screen");
  const intro = screens[0];
  if (intro?.type === "intro" && intro.button.trim().toLowerCase() === "open") fail(slug, 'intro button just says "Open"');

  for (const screen of screens) {
    checkStyle(slug, screen, t.theme, screen === screens[0]);
    checkLabels(slug, screen);
    // The wheel cuts its slice labels short after 16 letters.
    if (screen.type === "wheel") for (const option of screen.options) if (option.length > 16) fail(slug, `wheel option "${option}" is cut short on the wheel`);
  }
}

// Copy: the gender reveal leaves the news to the buyer, and no two designs end the same way.
const revealCard = buildCard(TEMPLATES.find((t) => t.slug === "scratch-to-reveal-baby")!, "Lily", "Sam");
const words = JSON.stringify(revealCard.screens.map((s) => ({ ...s, style: undefined })));
if (/\bit'?s a (girl|boy)\b/i.test(words) || /\b(pink|blue)\b/i.test(words)) problems.push("scratch-to-reveal-baby still gives away the answer");
const hidden = revealCard.screens.find((s) => s.type === "scratch");
if (!hidden || hidden.type !== "scratch" || !isBlank(hidden.hidden)) problems.push("scratch-to-reveal-baby's news isn't a blank for the buyer to fill");
if (!stillToWrite(revealCard).some((b) => b.id === hidden?.id)) problems.push("the reminder before the basket doesn't ask for the reveal's news");
for (const slug of SLUGS) {
  if (slug === "scratch-to-reveal-baby") continue;
  const card = buildCard(TEMPLATES.find((t) => t.slug === slug)!, "Lily", "Sam");
  if (stillToWrite(card).length) fail(slug, "has blanks left for the buyer");
}
const finales = new Map<string, string>();
for (const t of TEMPLATES) {
  const end = t.screens("Lily", "Sam").at(-1);
  if (end?.type !== "finale") continue;
  const line = end.body.toLowerCase();
  const other = finales.get(line);
  if (other && (SLUGS.includes(t.slug) || SLUGS.includes(other))) problems.push(`${t.slug} ends the same way as ${other}: "${end.body}"`);
  finales.set(line, t.slug);
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} problems`);
  process.exit(1);
}
console.log(`All ${SLUGS.length} designs build valid cards, meet the house standard and have readable, tidy looks.`);
