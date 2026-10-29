import type { Occasion, Screen } from "./card";
import type { Template, Tone } from "./catalog";

// Who each design suits and whether it's easy to play, worked out from what the design
// already says about itself (its occasion, tone, screens and name), so new designs are
// tagged without anyone remembering to.

export const RECIPIENTS = ["partner", "mum", "dad", "grandparent", "sibling", "child", "family", "friend", "colleague", "teacher"] as const;
export type Recipient = (typeof RECIPIENTS)[number];

export const RECIPIENT_EMOJI: Record<Recipient, string> = {
  partner: "❤️",
  mum: "👩",
  dad: "👨",
  grandparent: "👵",
  sibling: "👫",
  child: "🧒",
  family: "🏡",
  friend: "🤝",
  colleague: "💼",
  teacher: "🍎",
};

// What people type when they mean each of them, for search ("nani", "hubby", "bhaiya").
export const RECIPIENT_WORDS: Record<Recipient, string[]> = {
  partner: ["partner", "boyfriend", "girlfriend", "husband", "wife", "hubby", "wifey", "fiance", "fiancee", "spouse", "other half", "crush", "bae", "darling", "sweetheart", "jaan", "love of my life"],
  mum: ["mum", "mom", "mam", "mummy", "mommy", "mother", "mama", "maa", "ammi", "amma", "mata", "stepmum", "mother in law"],
  dad: ["dad", "daddy", "father", "papa", "pops", "abbu", "abba", "baba", "pitaji", "stepdad", "father in law"],
  grandparent: ["grandparent", "grandparents", "grandma", "grandmother", "grandad", "granddad", "grandpa", "grandfather", "granny", "gran", "nan", "nana", "nani", "nanny", "dadi", "dada", "nanaji", "naniji", "dadaji", "dadiji", "nonna", "babcia", "abuela"],
  sibling: ["brother", "sister", "sibling", "siblings", "bro", "sis", "bhai", "bhaiya", "behen", "didi", "veer", "baji", "twin"],
  child: ["child", "children", "kid", "kids", "son", "daughter", "grandson", "granddaughter", "grandchild", "grandkid", "niece", "nephew", "toddler", "beta", "beti", "boy", "girl", "teen", "teenager"],
  family: ["family", "auntie", "aunty", "aunt", "uncle", "cousin", "chacha", "chachi", "mami", "khala", "khalu", "phuphi", "in laws", "relatives", "whole family"],
  friend: ["friend", "friends", "bestie", "bff", "best friend", "mate", "pal", "buddy", "yaar", "dost", "galentine"],
  colleague: ["colleague", "colleagues", "coworker", "workmate", "boss", "manager", "team", "office", "work", "staff", "client"],
  teacher: ["teacher", "tutor", "teaching assistant", "nursery", "school", "coach", "headteacher", "lecturer", "mentor", "sir", "miss"],
};

// Occasions that say who the card is for. The rest (birthdays, festivals) suit anyone,
// so the design's tone decides.
const BY_OCCASION: Partial<Record<Occasion, Recipient[]>> = {
  valentine: ["partner"],
  anniversary: ["partner"],
  mothersday: ["mum"],
  fathersday: ["dad"],
  rakhi: ["sibling"],
  friendship: ["friend"],
  leaving: ["colleague", "friend", "teacher"],
  thanks: ["teacher", "colleague", "friend", "family"],
  sorry: ["partner", "friend"],
  wedding: ["friend", "sibling", "family", "colleague"],
  newbaby: ["friend", "sibling", "family", "colleague"],
  congrats: ["friend", "child", "sibling", "colleague"],
  getwell: ["friend", "grandparent", "family", "colleague"],
  missyou: ["partner", "friend", "family"],
  halloween: ["friend", "child", "sibling"],
  graduation: ["child", "sibling", "friend", "family", "colleague"],
  retirement: ["colleague", "mum", "dad", "grandparent", "sibling", "family", "friend", "teacher"],
  newhome: ["friend", "family", "sibling", "child", "mum", "dad", "grandparent", "colleague"],
};

const BY_TONE: Record<Tone, Recipient[]> = {
  heartfelt: ["mum", "dad", "grandparent", "family"],
  funny: ["friend", "sibling", "colleague"],
  cute: ["partner", "child", "friend"],
  festive: ["friend", "family", "child", "colleague"],
  romantic: ["partner"],
};

// A festival card is a family thing: a cute one is for a child or the family, not a partner.
const FESTIVALS = new Set<Occasion>(["diwali", "christmas", "eid", "holi", "newyear"]);
const FESTIVE_CUTE: Recipient[] = ["child", "family", "friend"];

// Words in a design's name, the sample name it's shown with ("Mum", "Ammi", "Khala"), or
// the start of its blurb when that says who it's for ("For a colleague, a parent or…").
const HINTS: [RegExp, Recipient[]][] = [
  [/\b(mum|mums|mom|mother|ammi|amma|maa)\b/, ["mum"]],
  [/\b(dad|dads|father|papa|abbu)\b/, ["dad"]],
  // "New parents" are the people with the baby, not someone's mum and dad.
  [/(?<!new )\b(parent|parents)\b/, ["mum", "dad"]],
  [/\b(gran|grandma|grandad|grandpa|grandparent|grandparents|elders|nan|nani|nana|dadi|dada)\b/, ["grandparent"]],
  [/\b(sibling|siblings|brother|sister|bhai|didi)\b/, ["sibling"]],
  [/\b(bestie|friend|friends|friendship|bff|pal)\b/, ["friend"]],
  [/\b(team|colleague|colleagues|office|boss|secret santa)\b/, ["colleague", "friend"]],
  [/\b(teacher|teachers|class|school)\b/, ["teacher"]],
  [/\b(family|khala|khalu|auntie|aunty|aunt|uncle|chacha|chachi|cousin|eidi)\b/, ["family"]],
  [/\b(bridesmaid|bridesmaids)\b/, ["friend", "sibling"]],
];
// Love and dates mean a partner, unless the name says who else it's for ("Mum, I love you").
const ROMANCE = /\b(love|loves|date|kiss)\b/;
// Grown-up things that aren't for children.
const NOT_FOR_CHILDREN = /\b(champagne|prosecco|wine|beer|cocktail|pub|hangover|date|kiss|flirt)\b/;
// A design made for children is only for children.
const CHILDREN = /\b(children|kids|little ones|a child)\b/;
// A proposal is only ever for a partner; big baby news goes to the family first.
const PROPOSAL = /\b(marry|propose|proposal)\b/;
const BABY_NEWS = /\b(news|reveal|expecting|announcement)\b/;

// Games anyone can play at their own pace: a tap, a hold, or matching pairs. Catching
// things as they fall, whacking, chasing with a mouse and shaking the phone need quick
// hands, so they're left out. A new game counts as not easy until it's added here.
const EASY_GAMES = new Set<string>([
  "light-diyas",
  "blow-candles",
  "memory-match",
  "unwrap-gift",
  "loves-me-not",
  "launch-fireworks",
  "release-lanterns",
  "bubble-wrap",
  "pinata",
  "grow-flower",
  "throw-colours",
  "slot-machine",
  "hold-hug",
]);
// The same for screens: typing a password is hard on a phone, so it's left out.
const EASY_SCREENS = new Set<string>(["intro", "question", "photos", "message", "quiz", "scratch", "wheel", "coupons", "reasons", "slider", "timeline", "boxes", "finale"]);

const words = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ");

const easyCache = new Map<string, boolean>();
// Easy for anyone to play: no fast games and no typing.
export function isEasy(tpl: Template): boolean {
  let easy = easyCache.get(tpl.slug);
  if (easy === undefined) {
    easy = tpl.screens("", "").every((s: Screen) => (s.type === "game" ? EASY_GAMES.has(s.game) : EASY_SCREENS.has(s.type)));
    easyCache.set(tpl.slug, easy);
  }
  return easy;
}

const forCache = new Map<string, Recipient[]>();
// Who a design suits, in the order of RECIPIENTS.
export function recipientsOf(tpl: Template): Recipient[] {
  const cached = forCache.get(tpl.slug);
  if (cached) return cached;
  const name = words(`${tpl.slug} ${tpl.name}`);
  const sample = words(tpl.demo.to);
  const lead = words(/^for\s([^:.!?]+)/i.exec(tpl.blurb)?.[1] ?? "");
  let picked: Recipient[];
  if (PROPOSAL.test(name)) picked = ["partner"];
  else if (CHILDREN.test(lead)) picked = ["child"];
  else if (tpl.occasion === "newbaby" && BABY_NEWS.test(name)) picked = ["mum", "dad", "grandparent", "sibling", "family", "friend"];
  else {
    const hinted = HINTS.filter(([re]) => re.test(name) || re.test(sample) || re.test(lead)).flatMap(([, who]) => who);
    picked = [
      ...(BY_OCCASION[tpl.occasion] ?? (FESTIVALS.has(tpl.occasion) && tpl.tone === "cute" ? FESTIVE_CUTE : BY_TONE[tpl.tone])),
      ...hinted,
      ...(ROMANCE.test(name) && !hinted.length ? (["partner"] as const) : []),
    ];
  }
  const set = new Set(picked);
  if (NOT_FOR_CHILDREN.test(name)) set.delete("child");
  // Quick fingers or typing aren't for everyone's grandparents.
  if (!isEasy(tpl)) set.delete("grandparent");
  const result = RECIPIENTS.filter((r) => set.has(r));
  forCache.set(tpl.slug, result);
  return result;
}
