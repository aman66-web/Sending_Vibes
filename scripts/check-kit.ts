// Checks every ready-made screen in the Screens tab (src/components/create/screen-kit.ts):
// each one builds a valid screen for short and long names, gets a new id every time, has its
// name and description in en.ts, and only uses blanks the editor knows about. Also warns
// where a look's colours are too close to read (they'd be swapped when shown).
// Run with: npx tsx scripts/check-kit.ts

import { screenSchema } from "@/lib/card";
import { isBlank } from "@/lib/blanks";
import { contrast } from "@/lib/screen-style";
import { en } from "@/i18n/en";
import { KIT, KIT_FILTERS, KIT_GROUPS, inFilter, kitItem, ranked, screenEmoji } from "@/components/create/screen-kit";

const problems: string[] = [];
const warnings: string[] = [];
const fail = (key: string, why: string) => problems.push(`${key}: ${why}`);

const NAMES = [
  { to: "Lily", from: "Sam" },
  { to: "Bartholomew Montgomery-Fitzwilliam Smyth", from: "Wilhelmina Featherstonehaugh-Cholmondeley" },
];

// Every string on a screen apart from its look.
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) if (k !== "style") strings(v, out);
  return out;
}

const keys = new Set<string>();
for (const item of KIT) {
  if (keys.has(item.key)) fail(item.key, "key used twice");
  keys.add(item.key);
  if (!/^[a-z0-9:-]{1,40}$/.test(item.key)) fail(item.key, "key must be up to 40 of a-z, 0-9, : and -");
  if (!item.tags.length) fail(item.key, "no tags");
  const words = (en.kit.items as Record<string, { name: string; about: string } | undefined>)[item.key];
  if (!words?.name || !words.about) fail(item.key, "no name or description in en.ts kit.items");

  for (const names of NAMES) {
    const screen = item.make(names);
    const parsed = screenSchema.safeParse(screen);
    if (!parsed.success) fail(item.key, `invalid for ${names.to.length}-letter names: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
    if (screen.type !== item.type) fail(item.key, `makes a ${screen.type}, says ${item.type}`);
    if (item.game && (screen.type !== "game" || screen.game !== item.game)) fail(item.key, "makes a different game");
    for (const text of strings(screen)) if (/^Type\b/.test(text) && !isBlank(text)) fail(item.key, `"${text}" looks like a blank but isn't one in lib/blanks.ts`);
  }

  // New every time, sharing nothing.
  const [a, b] = [item.make(NAMES[0]), item.make(NAMES[0])];
  if (a.id === b.id) fail(item.key, "same id twice");
  if (a.style && a.style === b.style) fail(item.key, "two screens share one style object");
  if (a.style?.stickers && a.style.stickers === b.style?.stickers) fail(item.key, "two screens share stickers");

  // An even number of petals would end on "loves me not".
  if (a.type === "game" && a.game === "loves-me-not" && a.style?.tune?.goal && a.style.tune.goal % 2 === 0) fail(item.key, "needs an odd number of petals");

  // Colours that would be swapped for readable ones when shown.
  const bg = a.style?.background;
  if (bg) {
    const worst = (c: string) => Math.min(...bg.map((x) => contrast(c, x)));
    if (a.style?.text && worst(a.style.text) < 3) warnings.push(`${item.key}: text ${a.style.text} is faint on ${bg.join(" → ")} (${worst(a.style.text).toFixed(2)})`);
    if (a.style?.accent && worst(a.style.accent) < 2) warnings.push(`${item.key}: button ${a.style.accent} is faint on ${bg.join(" → ")} (${worst(a.style.accent).toFixed(2)})`);
  }
  if (screenEmoji(a) === "▫️") fail(item.key, "no emoji for its kind of screen");
}

for (const key of Object.keys(en.kit.items)) if (!keys.has(key)) fail(key, "in en.ts kit.items but not a screen");
// Older keys other code may use (lib/brief.ts "include").
for (const key of ["intro", "question", "message", "photos", "quiz", "scratch", "typeit", "wheel", "boxes", "coupons", "reasons", "slider", "timeline", "finale", "game:blow-candles"])
  if (!kitItem(key)) fail(key, "plain key missing");

console.log(`${KIT.length} ready-made screens`);
for (const group of KIT_GROUPS) {
  const counts = KIT_FILTERS.filter((f) => f !== "card" && f !== "all").map((f) => `${f} ${group.items.filter((i) => inFilter(i, f, "birthday")).length}`);
  console.log(`  ${group.key}: ${group.items.length} (${counts.join(", ")})`);
  if (ranked(group.items, "valentine").length !== group.items.length) fail(group.key, "ranking loses screens");
}
console.log(`  first six openings for a Valentine's card: ${ranked(KIT_GROUPS[0].items, "valentine").slice(0, 6).map((i) => i.key).join(", ")}`);
console.log(`  first six games for a birthday card: ${ranked(KIT_GROUPS[3].items.filter((i) => inFilter(i, "card", "birthday")), "birthday").slice(0, 6).map((i) => i.key).join(", ")}`);
if (KIT.length < 120) problems.push(`only ${KIT.length} screens; want 120 or more`);

for (const w of warnings) console.log(`warning: ${w}`);
if (problems.length) {
  for (const p of problems) console.error(`problem: ${p}`);
  process.exit(1);
}
console.log("All good.");
