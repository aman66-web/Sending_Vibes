// Measures how good and how varied the AI's cards are, so a change to the card writer
// (src/lib/generate.ts, directions.ts, ai-examples.ts) can be judged on numbers, not a
// hunch. It asks a running site for a card from every brief in eval-briefs.json, a few
// times each, saves them and prints what it found.
//
// Every card costs real money (roughly 10p to 15p each), so run it on purpose, never in CI,
// and point it at a local or preview server so it doesn't use up anyone's allowance.
//
//   npx tsx scripts/eval-cards.mjs --base http://localhost:3000 --runs 2
//   npx tsx scripts/eval-cards.mjs --only dan-30th-details,nani-diwali --avoid
//
// --base     the site to ask (default http://localhost:3000)
// --runs     cards per brief (default 2)
// --only     brief ids, comma-separated
// --out      where to save the cards (default ./eval-out/<time>)
// --cookie   a file holding a signed-in Cookie header, if signing in is on
// --avoid    send each brief's earlier direction ids back, as the creator does
//
// Run with tsx so it can read the game limits straight from src/lib/games.ts.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GOAL_MAX, GOAL_NOUNS, USUAL_GOAL, hasGoal } from "../src/lib/games.ts";

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return pairs;
  }, []),
);
const BASE = String(args.base ?? "http://localhost:3000").replace(/\/$/, "");
const RUNS = Number(args.runs ?? 2);
const OUT = String(args.out ?? join(process.cwd(), "eval-out", new Date().toISOString().replace(/[:.]/g, "-")));
const cookie = typeof args.cookie === "string" ? readFileSync(args.cookie, "utf8").trim() : undefined;
const only = typeof args.only === "string" ? new Set(args.only.split(",")) : undefined;
const briefs = JSON.parse(readFileSync(join(here, "eval-briefs.json"), "utf8")).filter((b) => !only || only.has(b.id));

// The lines and habits the card writer is told to avoid (the "Defaults to avoid" in generate.ts).
const AVOID = [
  "favourite person to do nothing with",
  "especially when you're trying not to",
  "another year of being amazing",
  "you deserve the world",
  "words can't describe",
  "so lucky to have you",
  "here's to",
  "a little note",
  "a message for you",
  "quick quiz",
  "our memories",
  "knees",
  "vitamins",
];
const DULL_STICKERS = new Set(["⭐", "✨", "🌟", "💗", "💕", "🎈", "🎉"]);

const sameWords = (s) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?…]+$/, "");
const WORDS = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty"];
const numberIn = (w) => (/^\d+$/.test(w) ? Number(w) : w.toLowerCase() === "thirty" ? 30 : w.toLowerCase() === "forty" ? 40 : WORDS.indexOf(w.toLowerCase()) + 2);

// What's wrong with one card, as a list of short notes.
function check(card, brief) {
  const notes = [];
  const text = JSON.stringify(card).toLowerCase();
  for (const s of card.screens) {
    if (s.type === "quiz") {
      for (const q of s.questions) if (new Set(q.options.map(sameWords)).size < q.options.length) notes.push(`quiz option twice: ${q.question.slice(0, 40)}`);
      if (s.questions.length >= 3 && new Set(s.questions.map((q) => q.answer)).size === 1) notes.push("quiz answers all in one place");
      if (!s.labels?.wrongLines) notes.push("quiz without its own wrongLines");
    }
    if (s.type === "question" && !s.labels?.noLines) notes.push("question without its own noLines");
    if (s.type === "game" && hasGoal(s.game)) {
      const goal = s.style?.tune?.goal ?? USUAL_GOAL[s.game];
      if (goal > GOAL_MAX[s.game]) notes.push(`${s.game} goal ${goal} over ${GOAL_MAX[s.game]}`);
      const said = new RegExp(`\\b(\\d{1,2}|${WORDS.join("|")})(?:\\s+[\\p{L}'’-]+){0,2}\\s+(?:${GOAL_NOUNS[s.game].join("|")})\\b`, "iu").exec(`${s.instructions} ${s.title} ${s.winText}`);
      if (said && numberIn(said[1]) !== goal) notes.push(`${s.game} says ${said[1]} but plays ${goal}`);
    }
    for (const st of s.style?.stickers ?? []) if (st.x > 80 && st.y < 16) notes.push(`sticker under the sound button on ${s.id}`);
  }
  const stickers = card.screens.flatMap((s) => (s.style?.stickers ?? []).map((st) => st.emoji));
  if (stickers.length && stickers.every((e) => DULL_STICKERS.has(e))) notes.push("only the usual stickers");
  if (card.screens[0]?.button?.trim().toLowerCase() === "open it") notes.push('"Open it" on the envelope');
  for (const line of AVOID) if (text.includes(line)) notes.push(`avoid-list: "${line}"`);
  const details = brief.details ?? [];
  const found = details.filter((d) => text.includes(d.toLowerCase()));
  if (found.length < details.length) notes.push(`details missing: ${details.filter((d) => !found.includes(d)).join(", ")}`);
  if (brief.expectTypes && card.screens.map((s) => s.type).join(",") !== brief.expectTypes.join(",")) notes.push(`screens ${card.screens.map((s) => s.type).join(",")} not ${brief.expectTypes.join(",")}`);
  for (const key of brief.expectIncluded ?? []) {
    const has = card.screens.some((s) => (key.startsWith("game:") ? s.type === "game" && `game:${s.game}` === key : s.type === key));
    if (!has) notes.push(`picked screen missing: ${key}`);
  }
  if (brief.expectAccent && card.screens.some((s) => s.style?.accent?.toLowerCase() !== brief.expectAccent)) notes.push("favourite colour not the accent everywhere");
  if (brief.expectMusic && card.music !== brief.expectMusic) notes.push(`music ${card.music}, not ${brief.expectMusic}`);
  return { notes, details: details.length ? found.length / details.length : undefined };
}

// One card from the running site, timed, reading the stream as the creator does.
async function makeCard(brief, avoid) {
  const started = Date.now();
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ prompt: brief.prompt, to: brief.to, from: brief.from, brief: brief.brief, avoid: avoid.length ? avoid : undefined }),
  });
  if (!res.ok || !res.body) return { error: `${res.status} ${(await res.text()).slice(0, 200)}`, ms: Date.now() - started };
  const times = {};
  let retries = 0;
  let wrote = false;
  let last;
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let end;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line) continue;
      const event = JSON.parse(line);
      const at = Date.now() - started;
      if (event.type === "idea") times.idea ??= at;
      if (event.type === "progress") {
        // A second go starts again from no screens.
        if (event.screens.length === 0 && wrote) retries++;
        if (event.screens.length) {
          times.firstScreen ??= at;
          wrote = true;
        }
      }
      if (event.type === "card" || event.type === "error") last = { ...event, ms: at };
    }
  }
  if (!last) return { error: "the stream ended without a card", ms: Date.now() - started, times, retries };
  if (last.type === "error") return { error: last.error, ms: last.ms, times, retries };
  return { card: last.card, direction: last.direction, idea: last.idea, ms: last.ms, times, retries };
}

const seconds = (ms) => (ms === undefined ? "-" : `${(ms / 1000).toFixed(1)}s`);
const shapeOf = (card) => card.screens.map((s) => (s.type === "game" ? s.game : s.type)).join(">");
const coloursOf = (card) => [...new Set(card.screens.flatMap((s) => s.style?.background ?? []).map((c) => c.toLowerCase()))].sort().join(" ");
const fontsOf = (card) => {
  const counts = new Map();
  for (const s of card.screens) if (s.style?.heading) counts.set(`${s.style.heading}/${s.style.body ?? "?"}`, (counts.get(`${s.style.heading}/${s.style.body ?? "?"}`) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
};

mkdirSync(OUT, { recursive: true });
console.log(`Asking ${BASE} for ${briefs.length * RUNS} cards; saving them in ${OUT}\n`);
const results = [];
for (const brief of briefs) {
  const avoid = [];
  for (let run = 1; run <= RUNS; run++) {
    const made = await makeCard(brief, args.avoid ? avoid : []).catch((e) => ({ error: String(e) }));
    if (made.direction) avoid.push(made.direction);
    const checked = made.card ? check(made.card, brief) : { notes: [`failed: ${made.error}`] };
    results.push({ brief: brief.id, run, ...made, ...checked });
    if (made.card) writeFileSync(join(OUT, `${brief.id}-${run}.json`), JSON.stringify({ idea: made.idea, direction: made.direction, card: made.card }, null, 2));
    console.log(
      `${brief.id} #${run}: ${made.card ? "ok" : "FAILED"} in ${seconds(made.ms)} (idea ${seconds(made.times?.idea)}, first screen ${seconds(made.times?.firstScreen)})${made.retries ? `, ${made.retries} retry` : ""}`,
    );
    if (made.idea) console.log(`  idea: ${made.idea}`);
    if (made.card) console.log(`  ${made.direction ?? "no direction"} | ${fontsOf(made.card)} | ${shapeOf(made.card)}`);
    for (const note of checked.notes) console.log(`  - ${note}`);
  }
}

const cards = results.filter((r) => r.card);
const share = (n) => `${n}/${cards.length}`;
const sameTwice = briefs.filter((b) => {
  const shapes = cards.filter((r) => r.brief === b.id).map((r) => shapeOf(r.card));
  return shapes.length > 1 && new Set(shapes).size < shapes.length;
}).length;
const detailScores = cards.map((r) => r.details).filter((d) => d !== undefined);
const times = cards.map((r) => r.ms).sort((a, b) => a - b);

console.log("\nIn total");
console.log(`- made: ${share(cards.length)} (${results.length - cards.length} failed); retries: ${results.reduce((n, r) => n + (r.retries ?? 0), 0)}`);
console.log(`- time to the card: median ${seconds(times[Math.floor(times.length / 2)])}, slowest ${seconds(times.at(-1))}`);
console.log(`- different colour sets: ${new Set(cards.map((r) => coloursOf(r.card))).size}, font pairs: ${new Set(cards.map((r) => fontsOf(r.card))).size}, runs of screens: ${new Set(cards.map((r) => shapeOf(r.card))).size}, directions: ${new Set(cards.map((r) => r.direction)).size}`);
console.log(`- briefs that came out with the same run of screens twice: ${sameTwice}/${briefs.length}`);
console.log(`- their details used: ${detailScores.length ? Math.round((100 * detailScores.reduce((a, b) => a + b, 0)) / detailScores.length) : "-"}%`);
const tally = new Map();
for (const r of cards) for (const note of r.notes) tally.set(note.replace(/:.*/, ""), (tally.get(note.replace(/:.*/, "")) ?? 0) + 1);
for (const [note, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`- ${note}: ${share(n)}`);
writeFileSync(join(OUT, "results.json"), JSON.stringify(results.map(({ card, ...r }) => ({ ...r, screens: card ? shapeOf(card) : undefined })), null, 2));
