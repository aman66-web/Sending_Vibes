// Checks every ready-made design. Run it from the project folder with
// `npx tsx scripts/check-designs.ts`, and add --strict to hold every design to the house
// standard, not only the ones written to it.
//
// Each design is built the way a buyer gets it, with its sample names and with the longest
// names the site takes, and must pass the card schema. Nothing on a screen may promise more
// than the screen shows: "Catch 10 snowflakes" needs a game that's won at 10, "12 reasons"
// needs twelve notes, and a scratch card's panel is silver. Problems fail the run; notes
// are things to look at.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { CATCHING, USUAL_GOAL } from "../src/components/card/tune";
import { OCCASION_ICONS } from "../src/components/card/sprites";
import { cardSchema, type Game, type Screen } from "../src/lib/card";
import { TEMPLATES, buildCard, type Template } from "../src/lib/catalog";
import { MORE_DESIGNS } from "../src/lib/catalog-more";
import { DESIGN_SCREENS } from "../src/lib/design-history";
import { labelsOn } from "../src/lib/labels";
import { contrast } from "../src/lib/screen-style";
import { themes } from "../src/lib/themes";

const strict = process.argv.includes("--strict");
// Written to the house standard (lib/catalog-more.ts), so held to it.
const HOUSE = new Set(MORE_DESIGNS.map((t) => t.slug));

// The most each game will take, whatever its tune asks for (see components/card/*games.tsx).
const MOST: Partial<Record<Game, number>> = {
  "light-diyas": 12,
  "blow-candles": 12,
  "unwrap-gift": 30,
  "cursor-chase": 20,
  "loves-me-not": 15,
  "whack-ghosts": 30,
  "launch-fireworks": 20,
  "release-lanterns": 10,
  "bubble-wrap": 40,
  pinata: 30,
  "throw-colours": 30,
};
// Games laid out in a single row, and how many fit across a 360px phone before the end
// ones go off the edge and can't be reached.
const ROW: Partial<Record<Game, number>> = { "blow-candles": 6, "release-lanterns": 5 };
// The flower always grows in five waterings.
const GROW_STAGES = 5;
// Wheel slices are cut short on the wheel itself after this many letters.
const WHEEL_LABEL = 16;

// "One" is left out: "each one" and "this one" aren't counts.
const WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, dozen: 12,
};

// The counts a line of text promises: "Catch 10 snowflakes", "three boxes". Ordinals
// ("your 40th") and years aren't counts.
function counts(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\b(\d+)(?!\d|st\b|nd\b|rd\b|th\b|%|:)/gi)) {
    const n = Number(m[1]);
    if (n < 1000) out.push(n);
  }
  for (const m of text.toLowerCase().matchAll(/\b([a-z]+)\b/g)) if (m[1] in WORDS) out.push(WORDS[m[1]]);
  return out;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));

// How many it takes to win a game on this screen, or nothing for games without a count.
function goalOf(screen: Extract<Screen, { type: "game" }>, occasion: Template["occasion"]): number | undefined {
  const asked = screen.style?.tune?.goal;
  if (screen.game === "memory-match") {
    const icons = OCCASION_ICONS[occasion].length;
    return clamp(asked ?? icons, 1, icons);
  }
  if (screen.game === "grow-flower") return GROW_STAGES;
  const usual = (USUAL_GOAL as Partial<Record<Game, number>>)[screen.game];
  if (usual === undefined) return undefined;
  return clamp(asked ?? usual, 1, MOST[screen.game] ?? 40);
}

// What a list screen shows, and how many.
function listOf(screen: Screen): [string, number] | undefined {
  switch (screen.type) {
    case "reasons":
      return ["notes", screen.reasons.length];
    case "coupons":
      return ["coupons", screen.coupons.length];
    case "timeline":
      return ["moments", screen.events.length];
    case "quiz":
      return ["questions", screen.questions.length];
    case "boxes":
      return ["boxes", screen.prizes.length];
    case "wheel":
      return ["slices", screen.options.length];
    default:
      return undefined;
  }
}

const INTERACTIVE = new Set<Screen["type"]>(["question", "game", "quiz", "scratch", "typeit", "wheel", "coupons", "reasons", "slider", "timeline", "boxes"]);

type Found = { problems: string[]; notes: string[] };

// What a screen says about itself to the person playing it.
const own = (s: Screen) => [
  "title" in s ? s.title : "",
  "instructions" in s ? s.instructions : "",
  "winText" in s ? s.winText : "",
];

function checkScreen(t: Template, s: Screen, i: number, found: Found) {
  const where = `screen ${i + 1} (${s.id}, ${s.type === "game" ? s.game : s.type})`;
  const { problems, notes } = found;
  const house = HOUSE.has(t.slug) || strict;
  const flag = (line: string) => (house ? problems : notes).push(line);

  // Games: the count in the words must be the count it takes to win.
  if (s.type === "game") {
    const goal = goalOf(s, t.occasion);
    for (const text of own(s)) {
      for (const n of counts(text)) {
        if (goal === undefined) problems.push(`${where}: "${text}" promises ${n}, but this game has no count`);
        else if (n !== goal) problems.push(`${where}: "${text}" promises ${n}, but the game is won at ${goal}`);
      }
    }
    const row = ROW[s.game];
    if (row !== undefined && goal !== undefined && goal > row) problems.push(`${where}: ${goal} won't fit across a phone (at most ${row})`);
    // Catching games: falling pieces mustn't be called rising, or the other way round.
    if (CATCHING.includes(s.game)) {
      const from = s.style?.tune?.from ?? (s.game === "pop-balloons" ? "bottom" : "top");
      const words = own(s).join(" ").toLowerCase();
      if (/\bfall(s|ing)?\b/.test(words) && from !== "top") problems.push(`${where}: says they fall, but they come from ${from}`);
      if (/\b(float(s|ing)? up|ris(e|es|ing))\b/.test(words) && from !== "bottom") problems.push(`${where}: says they rise, but they come from ${from}`);
    }
  }

  // Lists: "12 reasons" needs twelve of them.
  const list = listOf(s);
  if (list) {
    const [what, n] = list;
    for (const text of [s.type === "quiz" ? s.title : own(s)[0], own(s)[1]]) {
      for (const c of counts(text)) if (c !== n) problems.push(`${where}: "${text}" promises ${c}, but there are ${n} ${what}`);
    }
  }
  if (s.type === "wheel") {
    for (const o of s.options) if (o.length > WHEEL_LABEL) flag(`${where}: "${o}" is cut short on the wheel (over ${WHEEL_LABEL} letters)`);
  }
  if (s.type === "scratch" && /\b(gold|golden|bronze|copper)\b/i.test(s.instructions)) problems.push(`${where}: the scratch panel is silver, not "${s.instructions}"`);

  // Built-in words the screen never shows.
  for (const key of Object.keys(s.labels ?? {})) {
    if (!labelsOn(s).includes(key as never)) problems.push(`${where}: label "${key}" isn't shown on this screen`);
  }

  // The look (screens without one are counted once for the design, in checkDesign).
  const style = s.style;
  if (!style) return;
  for (const st of style.stickers ?? []) {
    if (st.x > 80 && st.y < 16) problems.push(`${where}: sticker ${st.emoji} is under the sound button (top right)`);
    else if (st.x > 15 && st.x < 85 && st.y > 14 && st.y < 86) flag(`${where}: sticker ${st.emoji} at ${st.x}, ${st.y} may cover the words`);
  }
  const theme = themes[t.theme];
  const backgrounds = style.background ?? [];
  if (backgrounds.length) {
    const text = style.text ?? theme.text;
    const worst = (c: string) => Math.min(...backgrounds.map((b) => contrast(c, b)));
    if (worst(text) < 3) flag(`${where}: text ${text} is hard to read on ${backgrounds.join(" to ")} (it'll be swapped for dark or light ink)`);
    if (style.accent && worst(style.accent) < 2) flag(`${where}: buttons in ${style.accent} disappear into ${backgrounds.join(" to ")} (they'll take the text colour)`);
  }
}

function checkDesign(t: Template): Found {
  const found: Found = { problems: [], notes: [] };
  const { problems, notes } = found;
  const house = HOUSE.has(t.slug) || strict;
  const flag = (line: string) => (house ? problems : notes).push(line);

  if (!/^[a-z0-9-]{1,60}$/.test(t.slug)) problems.push(`slug "${t.slug}" must be lower case letters, numbers and dashes, up to 60`);

  // As the buyer gets it, with the sample names and with the longest names allowed.
  const long = { to: "Maximilian-Alexander Fotheringham-Smythe", from: "Bartholomew-Christopher Montgomery-Jones" };
  for (const [label, to, from] of [
    ["sample names", t.demo.to, t.demo.from],
    ["40-letter names", long.to, long.from],
  ] as const) {
    const card = buildCard(t, to, from);
    const parsed = cardSchema.safeParse(card);
    if (!parsed.success) {
      for (const issue of parsed.error.issues.slice(0, 6)) problems.push(`with ${label}: ${issue.path.join(".")}: ${issue.message}`);
    }
  }

  const screens = t.screens(t.demo.to, t.demo.from);
  if (screens[0]?.type !== "intro") problems.push("the first screen must be the intro");
  if (screens.at(-1)?.type !== "finale") problems.push("the last screen must be the finale");
  // Cards already saved only keep counting as this design if its earlier screens are kept,
  // so any new list of screens has to be recorded before it ships (see cardTier).
  const list = t.screens("", "").map((s) => s.type).join(",");
  if (!DESIGN_SCREENS[t.slug]?.includes(list)) problems.push(`its screens (${list}) aren't in lib/design-history.ts: run \`npx tsx scripts/design-history.ts\` so cards made with its earlier screens still count as this design`);
  const ids = screens.map((s) => s.id);
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) problems.push(`screen id "${id}" is used twice`);
  screens.forEach((s, i) => checkScreen(t, s, i, found));
  const plain = screens.flatMap((s, i) => (s.style ? [] : [i + 1]));
  if (plain.length) flag(plain.length === screens.length ? "no screen has a look of its own" : `screen${plain.length > 1 ? "s" : ""} ${plain.join(", ")} ha${plain.length > 1 ? "ve" : "s"} no look of ${plain.length > 1 ? "their" : "its"} own`);

  // The house standard (see lib/catalog-more.ts).
  if (!screens.some((s) => s.type === "photos")) flag("no photos screen, so the questions skip the photo step");
  const playful = screens.filter((s) => INTERACTIVE.has(s.type)).length;
  if (playful < 2) flag(`only ${playful} thing${playful === 1 ? "" : "s"} to play with (the standard is two)`);
  if (!screens.some((s) => s.type === "message")) flag("no message before the finale");
  if (screens.length > 7) flag(`${screens.length} screens; seven or fewer keeps it quick to play`);

  for (const photo of t.demo.photos ?? []) {
    if (!existsSync(join(process.cwd(), "public", photo.src))) problems.push(`demo photo ${photo.src} isn't in public/`);
  }
  if ((t.demo.photos?.length ?? 0) > 6) problems.push("more than 6 demo photos");
  if (house && screens.some((s) => s.type === "photos") && !t.demo.photos?.length) problems.push("a photos screen but no demo photos for the preview");
  return found;
}

const slugs = TEMPLATES.map((t) => t.slug);
let problemCount = 0;
let noteCount = 0;
for (const slug of new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))) {
  console.log(`✗ slug "${slug}" is used by more than one design`);
  problemCount++;
}
for (const t of TEMPLATES) {
  const { problems, notes } = checkDesign(t);
  problemCount += problems.length;
  noteCount += notes.length;
  if (!problems.length && !notes.length) continue;
  console.log(`\n${problems.length ? "✗" : "·"} ${t.slug} (${t.occasion})`);
  for (const p of problems) console.log(`    problem: ${p}`);
  for (const n of notes) console.log(`    note: ${n}`);
}
console.log(`\n${TEMPLATES.length} designs checked (${HOUSE.size} held to the house standard${strict ? ", and the rest with --strict" : ""}): ${problemCount} problems, ${noteCount} notes.`);
process.exit(problemCount ? 1 : 0);
