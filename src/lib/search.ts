import type { ClientDict } from "@/i18n/en";
import { upcoming } from "./calendar";
import { OCCASIONS, type Occasion } from "./card";
import { toneInfo, type Template, type Tone } from "./catalog";
import { RECIPIENT_WORDS, isEasy, recipientsOf, type Recipient } from "./design-tags";
import { occasions } from "./templates";

// Finding a design: what's coming up first, and a search that understands how people
// actually type ("bday", "xmas", "ramadan", "nani") and forgives a slip of the finger.

// ---------- What's coming up ----------

// Occasions this close go ahead of birthdays; ones a little further off come straight after.
const SOON_DAYS = 30;
const COMING_DAYS = 75;
// Occasions without a date, the most popular first.
const EVERGREEN: Occasion[] = ["anniversary", "thanks", "congrats", "getwell", "newbaby", "wedding", "sorry", "missyou", "friendship", "leaving"];

// Every occasion, in the order to show them today: the next few dates, birthdays (always
// someone's), the rest of what's coming up, the everyday ones, then dates far off.
export function occasionOrder(now = new Date()): Occasion[] {
  const days = new Map<Occasion, number>();
  for (const d of upcoming(now, 1000)) if (!days.has(d.occasion)) days.set(d.occasion, d.days);
  const rank = (o: Occasion): [number, number] => {
    const d = days.get(o);
    if (d !== undefined && d <= SOON_DAYS) return [0, d];
    if (o === "birthday") return [1, 0];
    if (d !== undefined && d <= COMING_DAYS) return [2, d];
    if (d !== undefined) return [4, d];
    const i = EVERGREEN.indexOf(o);
    return [3, i >= 0 ? i : EVERGREEN.length + OCCASIONS.indexOf(o)];
  };
  return [...OCCASIONS].sort((a, b) => {
    const [ga, da] = rank(a);
    const [gb, db] = rank(b);
    return ga - gb || da - db;
  });
}

// Designs grouped by occasion in that order, the featured ones first in each.
export function seasonal(designs: readonly Template[], order: readonly Occasion[]): Template[] {
  const at = new Map(order.map((o, i) => [o, i]));
  const rank = (o: Occasion) => at.get(o) ?? order.length;
  return [...designs].sort((a, b) => rank(a.occasion) - rank(b.occasion) || Number(!!b.featured) - Number(!!a.featured));
}

// A short mixed selection: no more than `each` designs for any one occasion.
export function fewOfEach(designs: readonly Template[], limit: number, each = 2): Template[] {
  const taken = new Map<Occasion, number>();
  const out: Template[] = [];
  for (const tpl of designs) {
    if (out.length >= limit) break;
    const n = taken.get(tpl.occasion) ?? 0;
    if (n >= each) continue;
    taken.set(tpl.occasion, n + 1);
    out.push(tpl);
  }
  return out;
}

// ---------- Search ----------

// Other words people use for each occasion: short forms, other spellings, and the names
// it goes by in other traditions and families.
export const OCCASION_WORDS: Partial<Record<Occasion, string[]>> = {
  valentine: ["valentines", "valentines day", "vday", "galentines", "love", "romance", "romantic", "boyfriend", "girlfriend", "husband", "wife", "crush", "14 february", "february"],
  birthday: ["bday", "birthday", "birthdays", "hbd", "happy birthday", "birthday party", "party", "cake", "candles", "turning", "18th", "21st", "30th", "40th", "50th", "60th", "70th", "80th", "90th", "100th", "milestone", "sweet sixteen", "janamdin", "saalgirah", "jubilee"],
  diwali: ["deepavali", "deepawali", "divali", "dipawali", "diwali", "festival of lights", "bandi chhor", "bandi chhor divas", "lakshmi", "diya", "diyas", "rangoli", "saal mubarak", "kali puja", "tihar"],
  christmas: ["xmas", "chrimbo", "crimbo", "christmas", "merry christmas", "noel", "santa", "father christmas", "yule", "nativity", "secret santa", "advent", "festive season", "seasons greetings", "navidad"],
  eid: ["eid", "eid mubarak", "ramadan", "ramzan", "ramadhan", "ramadan mubarak", "ramadan kareem", "eid al fitr", "eid ul fitr", "eid al adha", "eid ul adha", "bakri eid", "bakrid", "qurbani", "hajj", "eidi", "iftar", "chand raat", "muslim"],
  anniversary: ["anniversary", "wedding anniversary", "years together", "ruby", "silver", "golden", "pearl", "diamond", "saalgirah", "husband", "wife", "together"],
  sorry: ["sorry", "apology", "apologise", "apologize", "forgive", "forgive me", "forgiveness", "my bad", "make up", "oops"],
  thanks: ["thank you", "thankyou", "thanks", "grateful", "gratitude", "appreciation", "teacher", "nurse", "carer", "doctor", "neighbour", "volunteer", "shukriya", "dhanyavad"],
  congrats: ["congratulations", "congrats", "well done", "proud", "graduation", "graduate", "exam", "exams", "results", "gcse", "gcses", "a levels", "promotion", "new job", "new home", "new house", "housewarming", "driving test", "passed", "achievement", "award", "mubarak ho"],
  halloween: ["halloween", "spooky", "trick or treat", "pumpkin", "ghost", "ghosts", "witch", "all hallows"],
  newyear: ["new year", "new years", "new years eve", "nye", "hogmanay", "happy new year", "lunar new year", "chinese new year", "countdown"],
  mothersday: ["mothers day", "mothering sunday", "mum", "mom", "mam", "mummy", "mommy", "mother", "mama", "maa", "ammi", "amma"],
  fathersday: ["fathers day", "dad", "daddy", "father", "papa", "pops", "abbu", "abba", "baba", "pitaji"],
  rakhi: ["rakhi", "raksha bandhan", "rakshabandhan", "bhai dooj", "bhaiya dooj", "bhai", "bhaiya", "brother", "sister", "sibling", "behen", "didi"],
  holi: ["holi", "festival of colours", "festival of colors", "colours", "colors", "rang", "holika", "dhulandi", "phagwa"],
  newbaby: ["new baby", "baby", "newborn", "baby shower", "pregnancy", "pregnant", "expecting", "gender reveal", "christening", "baptism", "naming ceremony", "aqiqah", "new arrival", "new parents", "mum to be", "dad to be"],
  wedding: ["wedding", "marriage", "married", "getting married", "engagement", "engaged", "proposal", "propose", "nikah", "shaadi", "mehndi", "sangeet", "walima", "bride", "groom", "bridesmaid", "best man", "hen do", "stag do", "civil partnership", "happy couple", "mr and mrs"],
  getwell: ["get well", "get well soon", "feel better", "poorly", "ill", "illness", "sick", "hospital", "operation", "surgery", "recovery", "recover", "speedy recovery", "thinking of you"],
  missyou: ["miss you", "missing you", "thinking of you", "long distance", "far away", "abroad", "apart", "hug", "hugs"],
  friendship: ["friendship", "friend", "friends", "best friend", "bestie", "bff", "mate", "pal", "buddy", "friendship day", "yaar", "dost"],
  leaving: ["leaving", "goodbye", "farewell", "bon voyage", "retirement", "retiring", "retire", "moving on", "moving away", "new job", "emigrating", "good luck", "last day", "colleague"],
};

// Words that don't help find a design ("a birthday card for my mum").
const FILLER = new Set([
  "a", "an", "the", "for", "to", "my", "our", "your", "his", "her", "their", "of", "and", "with", "from", "in", "on", "at",
  "card", "cards", "ecard", "ecards", "online", "interactive", "personalised", "personalized", "design", "designs",
  "something", "some", "me", "i", "im", "happy", "send", "make", "want", "need", "looking", "someone", "special", "please", "very", "really", "idea", "ideas",
]);

// Lower case without accents or apostrophes ("Valentine's" → "valentines"). Hyphens join
// a word up ("b-day" → "bday") or split it, whichever `join` says.
export function normalise(text: string, join = false) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[-‐‑–]/g, join ? "" : " ")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

// The words of a search worth matching, each once.
export function queryWords(query: string): string[] {
  return [...new Set(normalise(query, true).split(" ").filter((w) => w && !FILLER.has(w)))];
}

// Every word a design can be found by. Short phrases are also kept run together ("eid ul
// fitr" as "eidulfitr" and "uladha"…), so however they're hyphenated or spaced, they match.
function addWords(out: Set<string>, text: string, phrase: boolean) {
  const words = normalise(text).split(" ").filter(Boolean);
  for (const w of words) out.add(w);
  if (phrase && words.length > 1 && words.length <= 4) {
    out.add(words.join(""));
    for (let i = 0; i + 1 < words.length; i++) out.add(words[i] + words[i + 1]);
  }
}

// The index depends on the page's language too, so it's kept per dictionary.
const indexes = new WeakMap<ClientDict, Map<string, Set<string>>>();
function indexOf(tpl: Template, t: ClientDict): Set<string> {
  let byDesign = indexes.get(t);
  if (!byDesign) indexes.set(t, (byDesign = new Map()));
  const cached = byDesign.get(tpl.slug);
  if (cached) return cached;
  const out = new Set<string>();
  const phrases = [
    tpl.slug,
    tpl.name,
    tpl.headline,
    tpl.occasion,
    occasions[tpl.occasion]?.label ?? "",
    t.occasions[tpl.occasion]?.label ?? "",
    ...(OCCASION_WORDS[tpl.occasion] ?? []),
    tpl.tone,
    toneInfo[tpl.tone].label,
    t.tones[tpl.tone],
    ...tpl.screens("", "").flatMap((s) => (s.type === "game" ? [s.type, s.game, t.labels.games[s.game] ?? ""] : [s.type, t.labels.screens[s.type] ?? ""])),
    ...recipientsOf(tpl).flatMap((r) => [r, ...RECIPIENT_WORDS[r], t.catalog.who[r]]),
    ...(isEasy(tpl) ? ["easy", "simple", "elderly", t.catalog.easy] : []),
  ];
  for (const p of phrases) addWords(out, p, true);
  addWords(out, tpl.blurb, false);
  byDesign.set(tpl.slug, out);
  return out;
}

// Edit distance with swapped neighbours counting as one slip ("birhtday").
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      row.push(d);
      best = Math.min(best, d);
    }
    if (best > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

// How well one search word matches a design: 3 exactly, 2 as the start of a word
// ("mum" for "mummy", "dads" for "dad"), 1 with a typing slip ("chrismas"), 0 not at all.
function strength(q: string, words: Set<string>) {
  if (words.has(q)) return 3;
  const plural = q.length > 3 && q.endsWith("s") ? q.slice(0, -1) : "";
  const slips = q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0;
  let best = 0;
  for (const w of words) {
    if (w.startsWith(q) || w === plural) return 2;
    if (!best && slips && (distance(q, w, slips) <= slips || (w.length > q.length && q.length >= 5 && distance(q, w.slice(0, q.length), 1) <= 1))) best = 1;
  }
  return best;
}

export type Filters = { occasion?: Occasion | "all"; tone?: Tone | "all"; who?: Recipient | "all"; easy?: boolean; query?: string };

// The designs that match, best first. When nothing matches every word of a search,
// `near` has the ones that match some of them, so there's always somewhere to go.
export function findDesigns(all: readonly Template[], f: Filters, t: ClientDict, order: readonly Occasion[]): { designs: Template[]; near: Template[] } {
  const chosen = all.filter(
    (tpl) =>
      (!f.occasion || f.occasion === "all" || tpl.occasion === f.occasion) &&
      (!f.tone || f.tone === "all" || tpl.tone === f.tone) &&
      (!f.who || f.who === "all" || recipientsOf(tpl).includes(f.who)) &&
      (!f.easy || isEasy(tpl)),
  );
  const sorted = seasonal(chosen, order);
  const asked = queryWords(f.query ?? "");
  if (!asked.length) return { designs: sorted, near: [] };
  const indexed = sorted.map((tpl) => ({ tpl, index: indexOf(tpl, t) }));
  // Two words that name one thing together ("mothers day", "bhai dooj") count as one.
  const words: string[] = [];
  for (let i = 0; i < asked.length; i++) {
    const pair = asked[i] + (asked[i + 1] ?? "");
    if (i + 1 < asked.length && indexed.some((x) => x.index.has(pair))) {
      words.push(pair);
      i++;
    } else words.push(asked[i]);
  }
  const scored = indexed.map(({ tpl, index }) => {
    const each = words.map((w) => strength(w, index));
    return { tpl, each, total: each.reduce((a, b) => a + b, 0) };
  });
  // Exact and start-of-word matches first; typing slips only if those find nothing.
  for (const least of [2, 1]) {
    const hits = scored.filter((x) => x.each.every((s) => s >= least));
    if (hits.length) return { designs: hits.sort((a, b) => b.total - a.total).map((x) => x.tpl), near: [] };
  }
  const some = (x: (typeof scored)[number]) => x.each.filter((s) => s >= 2).length;
  const near = words.length > 1 ? scored.filter((x) => some(x) > 0).sort((a, b) => some(b) - some(a) || b.total - a.total) : [];
  return { designs: [], near: near.map((x) => x.tpl) };
}
