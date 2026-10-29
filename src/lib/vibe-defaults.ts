import type { Music, Occasion } from "./card";
import { OCCASION_MUSIC, TONES, type Tone } from "./catalog";
import { rankLooks } from "./looks";

// Sensible first answers for the questions, from the occasion and who the card is for,
// so most people can just press Next. They're only suggestions: the questions never let
// one replace something the person picked themselves.

// The feelings a card can have: the catalogue's tones and a few more.
export const FEELINGS = [...TONES, "elegant", "cheeky", "nostalgic", "gentle", "blessings"] as const;
export type Feeling = (typeof FEELINGS)[number];

// "Full of blessings" is only offered where it fits.
const BLESSINGS: Occasion[] = ["diwali", "eid", "rakhi", "newbaby", "wedding", "christmas"];
export const feelingsFor = (occasion: Occasion | ""): Feeling[] => FEELINGS.filter((f) => f !== "blessings" || (occasion && BLESSINGS.includes(occasion)));

// Who is opening it (lib/brief.ts has the same list).
export const AGES = ["little", "child", "teen", "adult", "older"] as const;
export type Age = (typeof AGES)[number];

// The relationships, in the same order as t.quiz.relations, so each language's
// list maps onto them. Anything typed under "Other" has no key.
export const RELATIONS = [
  "partner",
  "crush",
  "wife",
  "husband",
  "bestFriend",
  "friend",
  "mum",
  "dad",
  "sister",
  "brother",
  "daughter",
  "son",
  "granddaughter",
  "grandson",
  "grandparent",
  "niece",
  "nephew",
  "colleague",
  "teacher",
] as const;
export type Relation = (typeof RELATIONS)[number];

const OCCASION_FEELINGS: Record<Occasion, Feeling[]> = {
  valentine: ["romantic", "cute"],
  birthday: ["funny", "festive"],
  diwali: ["festive", "heartfelt"],
  christmas: ["festive", "funny"],
  eid: ["heartfelt", "festive"],
  anniversary: ["romantic", "heartfelt"],
  sorry: ["heartfelt", "cute"],
  thanks: ["heartfelt"],
  congrats: ["festive", "funny"],
  halloween: ["funny"],
  newyear: ["festive"],
  mothersday: ["heartfelt"],
  fathersday: ["funny", "heartfelt"],
  rakhi: ["funny", "heartfelt"],
  holi: ["festive", "funny"],
  newbaby: ["cute", "heartfelt"],
  wedding: ["romantic", "festive"],
  getwell: ["cute", "heartfelt"],
  missyou: ["heartfelt", "cute"],
  friendship: ["funny", "cute"],
  leaving: ["funny", "heartfelt"],
};

const PARTNERS: Relation[] = ["partner", "crush", "wife", "husband"];
const PARENTS: Relation[] = ["mum", "dad", "grandparent"];
// Where the romance is the couple's own, so it suits a card from anyone.
const COUPLES: Occasion[] = ["wedding", "anniversary"];

export type Suggestion = { vibes: Feeling[]; look: string; music: Music | ""; age: Age | ""; gentle: boolean };

// `chosen` is the feelings they picked themselves, if they have, so the look suits those.
export function suggest({ occasion, relation, design, chosen }: { occasion: Occasion | ""; relation?: Relation; design?: { tone: Tone }; chosen?: Feeling[] }): Suggestion {
  const age: Age | "" = relation === "grandparent" ? "older" : "";
  const gentle = age === "older";
  // A ready-made design already has its feeling, look and music.
  if (design) return { vibes: [design.tone], look: "", music: "", age, gentle };

  let vibes: Feeling[] = occasion ? [...OCCASION_FEELINGS[occasion]] : [];
  if (relation && PARTNERS.includes(relation)) {
    if (!occasion || ["valentine", "anniversary", "missyou"].includes(occasion)) vibes = ["romantic", ...vibes];
  } else if (relation && !(occasion && COUPLES.includes(occasion))) {
    // Romantic only suits a partner (a Valentine's card for Mum is cute instead).
    vibes = vibes.filter((v) => v !== "romantic");
  }
  if (relation && PARENTS.includes(relation)) vibes = ["heartfelt", ...vibes];
  if (!occasion && (relation === "bestFriend" || relation === "friend")) vibes = ["funny", ...vibes];
  vibes = [...new Set(vibes)].slice(0, 2);
  if (occasion && !vibes.length) vibes = ["heartfelt"];

  return {
    vibes,
    look: rankLooks(occasion, chosen ?? vibes)[0]?.key ?? "",
    music: occasion ? OCCASION_MUSIC[occasion] : "",
    age,
    gentle,
  };
}
