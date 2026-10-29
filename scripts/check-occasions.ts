// Checks the newer occasions without a browser. Run it with:
//   npx tsx scripts/check-occasions.ts
// Each of their designs must build into a card that passes the same validation as a
// saved card (with the demo names and with the longest names allowed), every map that
// lists all the occasions must have them, and each design must meet the house standard:
// a photos screen, two interactive moments, a heartfelt message and a look of its own
// on every screen that stays readable.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { en } from "../src/i18n/en";
import { OCCASIONS, cardSchema, type Occasion, type Screen } from "../src/lib/card";
import { OCCASION_MUSIC, TEMPLATES, buildCard, cardTier, type Template } from "../src/lib/catalog";
import { OCCASION_DESIGNS } from "../src/lib/catalog-occasions";
import { contrast } from "../src/lib/screen-style";
import { occasions } from "../src/lib/templates";
import { OCCASION_ICONS } from "../src/components/card/sprites";

const NEW: Occasion[] = ["graduation", "retirement", "newhome"];
const ROOT = join(__dirname, "..");

let failures = 0;
const fail = (what: string) => {
  failures++;
  console.log(`  ✗ ${what}`);
};
const pass = (what: string) => console.log(`  ✓ ${what}`);

// ---------- Every occasion is listed everywhere ----------

console.log("Occasion lists");
for (const o of NEW) if (!OCCASIONS.includes(o)) fail(`OCCASIONS is missing "${o}"`);
for (const o of OCCASIONS) {
  if (!occasions[o]?.label || !occasions[o].emoji || !occasions[o].tagline) fail(`lib/templates.ts occasions.${o} is incomplete`);
  const words = (en.occasions as Record<string, { label?: string; tagline?: string; intro?: string } | undefined>)[o];
  if (!words?.label || !words.tagline || !words.intro) fail(`en.ts occasions.${o} needs a label, tagline and intro`);
  if (!OCCASION_MUSIC[o]) fail(`OCCASION_MUSIC.${o} is missing`);
  const icons = OCCASION_ICONS[o];
  if (icons?.length !== 6 || new Set(icons).size !== 6) fail(`OCCASION_ICONS.${o} needs six different pictures`);
  // The occasion's first design is its default (lib/templates.ts), so there has to be one.
  if (!TEMPLATES.some((t) => t.occasion === o)) fail(`no design for ${o}`);
}
pass(`${OCCASIONS.length} occasions, each with words, music, game pictures and a design`);

// Every `Record<Occasion, …>` written out in full in the code, found by reading the source.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

function occasionMaps(file: string) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const found: { name: string; keys: string[] }[] = [];
  const isOccasionRecord = (type: ts.TypeNode | undefined) =>
    !!type && ts.isTypeReferenceNode(type) && type.typeName.getText(source) === "Record" && type.typeArguments?.[0]?.getText(source) === "Occasion";
  const keysOf = (literal: ts.ObjectLiteralExpression) =>
    literal.properties.flatMap((p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? [p.name.text] : []));
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      let init: ts.Expression = node.initializer;
      let typed = isOccasionRecord(node.type);
      if (ts.isSatisfiesExpression(init) || ts.isAsExpression(init)) {
        typed ||= isOccasionRecord(init.type);
        init = init.expression;
      }
      if (typed && ts.isObjectLiteralExpression(init)) found.push({ name: node.name.getText(source), keys: keysOf(init) });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

let maps = 0;
for (const file of sourceFiles(join(ROOT, "src"))) {
  for (const map of occasionMaps(file)) {
    maps++;
    const missing = OCCASIONS.filter((o) => !map.keys.includes(o));
    if (missing.length) fail(`${relative(ROOT, file)} ${map.name} is missing ${missing.join(", ")}`);
  }
}
if (maps < 5) fail(`only found ${maps} Record<Occasion, …> maps; the search may have stopped working`);
else pass(`${maps} Record<Occasion, …> maps in src list every occasion`);

// The card writer lists the occasions from OCCASIONS itself, so it needs no change.
const generate = readFileSync(join(ROOT, "src/lib/generate.ts"), "utf8");
if (!generate.includes("list(OCCASIONS)")) fail("lib/generate.ts no longer lists OCCASIONS for the card writer");
else pass("the card writer is told about every occasion from OCCASIONS");

// ---------- The designs ----------

console.log("Designs");
const INTERACTIVE = new Set<Screen["type"]>(["question", "game", "quiz", "scratch", "typeit", "wheel", "coupons", "reasons", "slider", "boxes"]);
const US_SPELLINGS = /\b(color|colors|favorite|favorites|center|gray|mom|organize|realize|apologize|theater|traveled|jewelry|cozy)\b/i;
const GENDERED = /\b(he|she|him|her|his|hers|himself|herself)\b/i;
const LONGEST = "W".repeat(40);

// Every word on a screen that someone reads, including its own labels and text boxes.
function wordsOn(value: unknown, key = ""): string[] {
  if (["id", "type", "game", "effect", "src"].includes(key)) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((v) => wordsOn(v));
  if (value && typeof value === "object") {
    if (key === "style") return wordsOn((value as { texts?: unknown }).texts ?? []);
    return Object.entries(value).flatMap(([k, v]) => wordsOn(v, k));
  }
  return [];
}

function checkDesign(t: Template) {
  const where = t.slug;
  const before = failures;
  for (const [to, from] of [
    [t.demo.to, t.demo.from],
    [LONGEST, LONGEST],
  ]) {
    const card = buildCard(t, to, from);
    const parsed = cardSchema.safeParse(card);
    if (!parsed.success) fail(`${where} with ${to.length}-letter names: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    if (cardTier(card) !== "premade") fail(`${where} isn't priced as a ready-made design`);
  }

  const screens = t.screens(t.demo.to, t.demo.from);
  const types = screens.map((s) => s.type);
  if (types[0] !== "intro" || types.at(-1) !== "finale") fail(`${where} must start with the envelope and end with the finale`);
  if (!types.includes("photos")) fail(`${where} has no photos screen`);
  if (!types.includes("message")) fail(`${where} has no message`);
  const moments = screens.filter((s) => INTERACTIVE.has(s.type)).length;
  if (moments < 2) fail(`${where} has ${moments} interactive moment(s), not two`);
  if (new Set(screens.map((s) => s.id)).size !== screens.length) fail(`${where} has two screens with the same id`);
  for (const p of t.demo.photos ?? []) if (!existsSync(join(ROOT, "public", p.src))) fail(`${where} demo photo ${p.src} doesn't exist`);
  if (!t.demo.photos?.length) fail(`${where} has no demo photos to show in previews`);

  for (const s of screens) {
    const at = `${where} › ${s.id}`;
    const style = s.style;
    if (!style?.background?.length || !style.text || !style.accent || !style.heading) {
      fail(`${at} needs its own background, text, accent and heading font`);
      continue;
    }
    // Text at 4.5:1 for body copy; buttons at 3:1 (below 2:1 the card swaps the colour out anyway).
    const text = Math.min(...style.background.map((b) => contrast(style.text!, b)));
    if (text < 4.5) fail(`${at} text is ${text.toFixed(1)}:1 on its background`);
    const accent = Math.min(...style.background.map((b) => contrast(style.accent!, b)));
    if (accent < 3) fail(`${at} accent is ${accent.toFixed(1)}:1 on its background`);
    if (s.type === "intro" && !style.envelope) fail(`${at} has no envelope colour`);
    for (const st of style.stickers ?? []) {
      const nearEdge = st.x < 15 || st.x > 85 || st.y < 14 || st.y > 86;
      const soundButton = st.x > 75 && st.y < 20;
      if (!nearEdge || soundButton) fail(`${at} sticker ${st.emoji} at ${st.x},${st.y} could cover the words or the sound button`);
    }
    if (s.type === "wheel") for (const o of s.options) if (o.length > 16) fail(`${at} wheel slice "${o}" is cut short on the wheel`);
    for (const words of wordsOn(s)) {
      if (US_SPELLINGS.test(words)) fail(`${at} American spelling: "${words}"`);
      if (GENDERED.test(words)) fail(`${at} assumes a gender: "${words}"`);
    }
  }
  if (failures === before) pass(`${where}: ${types.join(" → ")}`);
}

for (const o of NEW) {
  const designs = OCCASION_DESIGNS.filter((t) => t.occasion === o);
  if (designs.length !== 2) fail(`${o} has ${designs.length} designs, not 2`);
  designs.forEach(checkDesign);
}
const slugs = TEMPLATES.map((t) => t.slug);
const repeated = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (repeated.length) fail(`design slugs used twice: ${repeated.join(", ")}`);
for (const t of OCCASION_DESIGNS) if (!TEMPLATES.includes(t)) fail(`${t.slug} isn't in the shop's list`);

console.log(failures ? `\n${failures} problem(s)` : "\nAll good");
process.exitCode = failures ? 1 : 0;
