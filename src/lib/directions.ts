import type { Effect, Font, Game, Occasion, Pattern, ScreenType, ThemeName, Transition } from "./card";
import { HARD_GAMES } from "./games";
import type { Look } from "./looks";

// A creative direction for each new card the AI writes: a palette, a pair of fonts, a
// shape for the card, a screen to feature and the effects, picked at random (weighted by
// the occasion and the feelings they chose) so that two people who give the same answers
// still get cards that look and play differently. It goes in the request, never the
// system prompt, so the cached prompt stays the same for everyone (see lib/generate.ts).
// Each part has a short id; the card's direction id joins them, and the browser sends
// back the last few so the next card skips them.

type Mood = "bright" | "soft" | "deep" | "warm" | "fresh" | "retro";

type Palette = {
  id: string;
  name: string;
  moods: Mood[];
  // Occasions it's made for. Without, it suits any.
  occasions?: Occasion[];
  deep: string;
  light: string;
  soft: string;
  accent: string;
  // The closest of the card themes, for anything a screen's style doesn't colour.
  theme: ThemeName;
};

// No navy and gold: that's what the AI falls back on by itself.
const PALETTES: Palette[] = [
  { id: "pistachio", name: "Pistachio & plum", moods: ["retro", "fresh"], deep: "#2d1b3d", light: "#f3efe0", soft: "#b7d3a8", accent: "#e2725b", theme: "lavender" },
  { id: "tomato", name: "Tomato & cream", moods: ["bright", "retro", "warm"], deep: "#b8361f", light: "#fbf3e4", soft: "#f2c6a0", accent: "#1f3a5f", theme: "sunset" },
  { id: "sage", name: "Sage & terracotta", moods: ["warm", "soft"], deep: "#3f4a3c", light: "#f4eee4", soft: "#b9c4a7", accent: "#c8643b", theme: "ivory" },
  { id: "cobalt", name: "Cobalt & lemon", moods: ["bright", "fresh"], deep: "#1a3a9c", light: "#fdfbea", soft: "#f7e463", accent: "#ff5a36", theme: "sky" },
  { id: "blush", name: "Blush & forest", moods: ["soft", "warm"], deep: "#1f3d2b", light: "#fbeee9", soft: "#f2c4c0", accent: "#d9506b", theme: "rose" },
  { id: "inkcoral", name: "Ink & coral", moods: ["deep", "bright"], deep: "#1c2230", light: "#fff4ee", soft: "#ffc2ad", accent: "#ff6f59", theme: "sunset" },
  { id: "lilacmint", name: "Lilac & mint", moods: ["soft", "fresh"], deep: "#3d2f63", light: "#f7f2fc", soft: "#cdb8f0", accent: "#2fb393", theme: "lavender" },
  { id: "bubblegum", name: "Bubblegum & grape", moods: ["bright", "retro"], deep: "#4a1d6e", light: "#fff0f7", soft: "#ffb3d9", accent: "#ff3d8b", theme: "party" },
  { id: "butter", name: "Butter & cornflower", moods: ["soft", "fresh"], occasions: ["newbaby", "getwell", "thanks", "mothersday", "friendship", "newhome"], deep: "#2f4f7a", light: "#fffaf0", soft: "#ffe9a8", accent: "#3c78c8", theme: "sky" },
  { id: "peachteal", name: "Peach & teal", moods: ["warm", "fresh"], deep: "#134e5e", light: "#fff3ea", soft: "#ffcfb0", accent: "#f26b38", theme: "mint" },
  { id: "nightpeach", name: "Midnight & peach", moods: ["deep", "soft"], deep: "#23214a", light: "#fdf1e8", soft: "#f9c7a5", accent: "#ff8a65", theme: "midnight" },
  { id: "olive", name: "Olive & mustard", moods: ["retro", "warm"], deep: "#3e3a1f", light: "#f7f0dc", soft: "#e3b448", accent: "#c4512b", theme: "ivory" },
  { id: "mintchoc", name: "Mint & cocoa", moods: ["fresh", "retro"], deep: "#3b2620", light: "#f1fbf6", soft: "#b5ead7", accent: "#2fa37f", theme: "mint" },
  { id: "berryoat", name: "Berry & oat", moods: ["warm", "soft"], deep: "#4b1c3a", light: "#f5efe6", soft: "#d9c6b0", accent: "#b8336a", theme: "rose" },
  { id: "seaglass", name: "Sea glass & apricot", moods: ["fresh", "soft"], occasions: ["missyou", "leaving", "getwell", "thanks", "fathersday", "retirement", "newhome"], deep: "#1d4e5f", light: "#eef7f4", soft: "#a8d8cf", accent: "#e8833a", theme: "mint" },
  { id: "aubergine", name: "Aubergine & apricot", moods: ["warm", "deep"], deep: "#3a1c3d", light: "#fff2e6", soft: "#ffb38a", accent: "#ff7a3d", theme: "sunset" },
  { id: "skypoppy", name: "Sky & poppy", moods: ["fresh", "bright"], occasions: ["fathersday", "congrats", "leaving", "birthday", "friendship", "graduation", "retirement"], deep: "#24476b", light: "#f3f8fc", soft: "#bcdcf2", accent: "#e63946", theme: "sky" },
  { id: "fern", name: "Fern & honey", moods: ["fresh", "deep"], deep: "#20342a", light: "#f2f5ec", soft: "#c3d9a5", accent: "#e0913a", theme: "mint" },
  { id: "popcorn", name: "Popcorn & raspberry", moods: ["bright", "retro"], occasions: ["birthday", "congrats", "newyear", "friendship", "leaving", "graduation"], deep: "#1e1b4b", light: "#fffdf5", soft: "#ffd23f", accent: "#ff4d6d", theme: "party" },
  { id: "cherry", name: "Cherry & milk", moods: ["deep", "warm"], occasions: ["valentine", "anniversary", "mothersday", "wedding", "sorry"], deep: "#5c0f22", light: "#fff0f2", soft: "#ffb8c6", accent: "#e8233f", theme: "rose" },
  // Made for particular festivals.
  { id: "magenta", name: "Marigold & magenta", moods: ["bright", "warm"], occasions: ["diwali", "holi", "rakhi", "wedding"], deep: "#5b1149", light: "#fff4e0", soft: "#ffb627", accent: "#e4007c", theme: "marigold" },
  { id: "lamplight", name: "Lamplight & plum", moods: ["deep", "warm"], occasions: ["diwali", "eid", "newyear", "missyou"], deep: "#2a1846", light: "#fff4e2", soft: "#ffcf70", accent: "#ff7b54", theme: "marigold" },
  { id: "pine", name: "Pine & cranberry", moods: ["deep", "warm"], occasions: ["christmas", "newyear"], deep: "#173f2f", light: "#f8f3ea", soft: "#e8c9a0", accent: "#b8203a", theme: "noel" },
  { id: "snowberry", name: "Snow & berry", moods: ["fresh", "bright"], occasions: ["christmas"], deep: "#7a1530", light: "#f8fbff", soft: "#cfe3f2", accent: "#1f6f50", theme: "noel" },
  { id: "tealgold", name: "Teal & saffron", moods: ["deep", "warm"], occasions: ["eid", "wedding", "anniversary", "rakhi"], deep: "#0d4d4d", light: "#f6f0e2", soft: "#9fd3c7", accent: "#e09f2e", theme: "crescent" },
  { id: "pumpkin", name: "Pumpkin & slime", moods: ["deep", "retro"], occasions: ["halloween"], deep: "#1a1423", light: "#f6ead8", soft: "#f28c28", accent: "#7ed957", theme: "spooky" },
  { id: "gown", name: "Gown & sunshine", moods: ["bright", "deep"], occasions: ["graduation", "congrats"], deep: "#2b2440", light: "#fbf8ef", soft: "#ffd84d", accent: "#e4572e", theme: "party" },
  { id: "deckchair", name: "Deckchair stripes", moods: ["fresh", "warm"], occasions: ["retirement", "leaving"], deep: "#1f5f5b", light: "#fff8ee", soft: "#f5b0a2", accent: "#f28f3b", theme: "mint" },
  { id: "frontdoor", name: "Front door & stone", moods: ["warm", "fresh"], occasions: ["newhome"], deep: "#2e4a3f", light: "#faf6ef", soft: "#e8d5b9", accent: "#c8473f", theme: "ivory" },
  { id: "gulal", name: "Gulal splash", moods: ["bright"], occasions: ["holi"], deep: "#2b1a5e", light: "#fffaf0", soft: "#2ec4b6", accent: "#ff4f9a", theme: "holi" },
];

type FontPair = {
  id: string;
  heading: Font;
  body: Font;
  tones: string[];
  // Clear enough for someone with weaker eyes, and friendly enough for a small child.
  gentle?: boolean;
  little?: boolean;
  occasions?: Occasion[];
};

const FONT_PAIRS: FontPair[] = [
  { id: "mk+rd", heading: "marker", body: "rounded", tones: ["funny", "cute"], little: true },
  { id: "sc+sb", heading: "script", body: "storybook", tones: ["romantic", "heartfelt"] },
  { id: "bd+mo", heading: "bold", body: "modern", tones: ["funny", "festive"], gentle: true },
  { id: "tw+cl", heading: "typewriter", body: "classic", tones: ["heartfelt", "funny"] },
  { id: "hw+rd", heading: "handwritten", body: "rounded", tones: ["cute", "heartfelt"], little: true },
  { id: "sb+cl", heading: "storybook", body: "classic", tones: ["heartfelt", "romantic", "festive"], gentle: true },
  { id: "rd+rd", heading: "rounded", body: "rounded", tones: ["cute", "funny"], gentle: true, little: true },
  { id: "cl+mo", heading: "classic", body: "modern", tones: ["romantic", "festive"], gentle: true },
  { id: "bd+sb", heading: "bold", body: "storybook", tones: ["festive", "heartfelt"], gentle: true },
  { id: "hw+sb", heading: "handwritten", body: "storybook", tones: ["heartfelt", "romantic", "cute"] },
  { id: "mk+mo", heading: "marker", body: "modern", tones: ["funny", "festive"] },
  { id: "tw+mo", heading: "typewriter", body: "modern", tones: ["funny"] },
  { id: "sp+mo", heading: "spooky", body: "modern", tones: ["funny", "festive"], occasions: ["halloween"] },
];

type Shape = {
  id: string;
  name: string;
  guide: string;
  tones: string[];
  gentle?: boolean;
  // Fine for a small child; "only" when it's made for one.
  little?: boolean | "only";
  lengths: ("short" | "medium" | "long")[];
};

// How the card runs from start to finish. Only used when they haven't picked the screens.
const SHAPES: Shape[] = [
  { id: "tease", name: "Tease, play, then mean it", guide: "open cheeky, two or three playful screens that tease them with their own details, then turn warm for the letter and the finale", tones: ["funny", "heartfelt"], lengths: ["medium", "long"] },
  { id: "reveal", name: "Mystery reveal", guide: "every screen builds up to a surprise: a scratch panel or mystery boxes hint at it, and the letter is the last secret", tones: ["romantic", "heartfelt", "cute"], gentle: true, lengths: ["short", "medium"] },
  { id: "show", name: "Game show", guide: "a quiz about them, then a wheel or slot-machine, then coupons as the prizes, all in a game-show host's voice", tones: ["funny", "festive"], lengths: ["medium", "long"] },
  { id: "story", name: "Our story", guide: "a timeline of what they told you (playful, never invented), a jar of reasons, then the letter", tones: ["heartfelt", "romantic"], gentle: true, lengths: ["medium", "long"] },
  { id: "hunt", name: "Treasure hunt", guide: "a typeit lock with a clue only they'd get, then mystery boxes, then the letter as the treasure", tones: ["funny", "cute", "romantic"], lengths: ["medium", "long"] },
  { id: "calm", name: "Gentle and slow", guide: "few screens, one easy game, photos if there are any and a long, warm letter in short sentences", tones: ["heartfelt", "cute", "romantic", "festive"], gentle: true, lengths: ["short", "medium"] },
  { id: "play", name: "Play time", guide: "mostly tapping games, each with a big, happy win line, and a very short letter for a grown-up to read aloud", tones: ["cute", "funny", "festive", "heartfelt"], little: "only", lengths: ["short", "medium"] },
  { id: "party", name: "Party in a card", guide: "two lively games close together, a how-much slider, then a big finale", tones: ["festive", "funny", "cute"], little: true, lengths: ["medium", "long"] },
  { id: "parts", name: "A letter in pieces", guide: "the message comes in parts: a question, a line hidden under a scratch panel, a jar of reasons, then the rest of the letter", tones: ["romantic", "heartfelt"], lengths: ["medium", "long"] },
  { id: "sweet", name: "Short and sweet", guide: "four or five screens: one perfect game and one great line, nothing extra", tones: ["cute", "funny", "heartfelt", "festive"], gentle: true, little: true, lengths: ["short"] },
  { id: "dares", name: "Three challenges", guide: "three quick challenges in a row, each with a win line that teases them, then the prize (coupons or boxes) and the letter", tones: ["funny", "cute"], lengths: ["medium", "long"] },
];

type Moment = {
  id: string;
  // What it is, for the card writer.
  text: string;
  // A screen type, or a game.
  screen: ScreenType | Game;
  occasions?: Occasion[];
  notFor?: Occasion[];
  tones?: string[];
  gentle?: boolean;
  little?: boolean;
};

// A screen to feature in the middle of the card. Half the time the occasion's obvious
// game is left out, so a birthday isn't always candles.
const SIGNATURES: Moment[] = [
  { id: "candles", screen: "blow-candles", text: "the \"blow-candles\" game", occasions: ["birthday"], gentle: true, little: true },
  { id: "diyas", screen: "light-diyas", text: "the \"light-diyas\" game", occasions: ["diwali"], gentle: true, little: true },
  { id: "hearts", screen: "catch-hearts", text: "the \"catch-hearts\" game", occasions: ["valentine", "anniversary", "mothersday", "missyou"], little: true },
  { id: "snow", screen: "catch-snowflakes", text: "the \"catch-snowflakes\" game", occasions: ["christmas", "newyear"], little: true },
  { id: "ghosts", screen: "whack-ghosts", text: "the \"whack-ghosts\" game", occasions: ["halloween"] },
  { id: "colours", screen: "throw-colours", text: "the \"throw-colours\" game", occasions: ["holi"], gentle: true, little: true },
  { id: "rockets", screen: "launch-fireworks", text: "the \"launch-fireworks\" game", occasions: ["newyear", "diwali", "congrats", "eid", "graduation"], gentle: true, little: true },
  { id: "lanterns", screen: "release-lanterns", text: "the \"release-lanterns\" game, each lantern carrying a wish for them", occasions: ["diwali", "eid", "missyou", "newyear", "leaving", "wedding", "retirement"], gentle: true },
  { id: "exam", screen: "quiz", text: "a quiz set like an exam paper about them, with a pass mark", occasions: ["graduation"] },
  { id: "freedom", screen: "coupons", text: "a coupon book of lazy days and the things they'll finally have time for", occasions: ["retirement"], gentle: true },
  { id: "keys", screen: "typeit", text: "a typeit lock that opens the front door of their new home, with a clue from their details", occasions: ["newhome"] },
  { id: "petals", screen: "loves-me-not", text: "the \"loves-me-not\" game", occasions: ["valentine", "anniversary", "wedding", "sorry"] },
  { id: "unwrap", screen: "unwrap-gift", text: "the \"unwrap-gift\" game", notFor: ["sorry", "getwell", "missyou"], gentle: true, little: true },
  { id: "balloons", screen: "pop-balloons", text: "the \"pop-balloons\" game", notFor: ["sorry", "missyou", "halloween"], gentle: true, little: true },
  { id: "stars", screen: "catch-stars", text: "the \"catch-stars\" game", little: true },
  { id: "candy", screen: "catch-candy", text: "the \"catch-candy\" game", notFor: ["sorry", "getwell"], little: true },
  { id: "pinata", screen: "pinata", text: "the \"pinata\" game", notFor: ["sorry", "getwell", "missyou", "anniversary", "wedding"], little: true },
  { id: "wrap", screen: "bubble-wrap", text: "the \"bubble-wrap\" game", notFor: ["valentine", "anniversary", "wedding"], little: true },
  { id: "flower", screen: "grow-flower", text: "the \"grow-flower\" game, growing into something of theirs", notFor: ["halloween"], gentle: true, little: true },
  { id: "slots", screen: "slot-machine", text: "the \"slot-machine\" game, with the jackpot as the reveal", notFor: ["sorry"] },
  { id: "hug", screen: "hold-hug", text: "the \"hold-hug\" game", notFor: ["halloween"], gentle: true, little: true },
  { id: "memory", screen: "memory-match", text: "the \"memory-match\" game", notFor: ["sorry"] },
  { id: "shake", screen: "shake-it", text: "the \"shake-it\" game", notFor: ["sorry", "getwell"] },
  { id: "quiz", screen: "quiz", text: "a quiz about them", notFor: ["sorry"] },
  { id: "scratch", screen: "scratch", text: "a scratch panel hiding the best line", gentle: true, little: true },
  { id: "lock", screen: "typeit", text: "a typeit lock with a clue from their details" },
  { id: "wheel", screen: "wheel", text: "a wheel of prizes", notFor: ["sorry"], gentle: true },
  { id: "boxes", screen: "boxes", text: "mystery boxes", gentle: true, little: true },
  { id: "coupons", screen: "coupons", text: "a coupon book", gentle: true },
  { id: "jar", screen: "reasons", text: "a jar of reasons", gentle: true },
  { id: "slider", screen: "slider", text: "a how-much slider", gentle: true, little: true },
  { id: "timeline", screen: "timeline", text: "a playful timeline", notFor: ["newbaby"], gentle: true },
  { id: "noway", screen: "question", text: "a yes/no question with a runaway No", gentle: true, little: true },
];

// The game everyone expects for an occasion.
const OBVIOUS: Partial<Record<Occasion, string[]>> = {
  birthday: ["candles"],
  diwali: ["diyas"],
  valentine: ["hearts", "petals"],
  christmas: ["snow"],
  halloween: ["ghosts"],
  holi: ["colours"],
  newyear: ["rockets"],
};

// One idea that makes the card one of a kind, for when they left it to us ("Choose for me").
const TWISTS: Moment[] = [
  { id: "lockup", screen: "typeit", text: "Open with a typeit lock whose password is their nickname or a word from their details, with a clue only they'd get" },
  { id: "climb", screen: "slider", text: "A how-much slider whose sliderLines get more and more outrageous as it climbs", gentle: true },
  { id: "treats", screen: "boxes", text: "Mystery boxes where every box is a real treat from the sender, so they can't lose", gentle: true, little: true },
  { id: "rigged", screen: "wheel", text: "A wheel that always lands on the best prize (set landOn), with the other slices as funny near-misses", tones: ["funny", "festive", "cute"] },
  { id: "hidden", screen: "scratch", text: "Hide the most heartfelt line of the whole card under a scratch panel", gentle: true, little: true },
  { id: "promise", screen: "coupons", text: "A coupon book of small promises the sender can really keep, drawn from their details", gentle: true },
  { id: "reasons", screen: "reasons", text: "A jar of reasons instead of one long letter, every reason specific to them", tones: ["heartfelt", "romantic", "cute"], gentle: true },
  { id: "day", screen: "timeline", text: "A playful timeline of their day, week or year (from what they told you, never invented memories)", tones: ["funny", "heartfelt"], gentle: true },
  { id: "aboutme", screen: "quiz", text: "A quiz where the right answer is always the sender, in a different place each time", tones: ["funny", "cute"], notFor: ["sorry", "getwell"] },
  { id: "echo", screen: "intro", text: "Give the envelope a burst that matches the finale effect, so the card opens and closes with the same flourish", gentle: true, little: true },
  { id: "excuse", screen: "question", text: "A yes/no question whose runaway No button tells a little story, one excuse at a time", tones: ["funny", "cute", "romantic"] },
  { id: "jackpot", screen: "slot-machine", text: "A slot-machine whose jackpot reveals the card's real message", notFor: ["sorry"] },
  { id: "unlock", screen: "hold-hug", text: "Finish the playing with a hold-hug that unlocks the letter", tones: ["heartfelt", "cute", "romantic"], notFor: ["halloween"], gentle: true, little: true },
  { id: "bloom", screen: "grow-flower", text: "A grow-flower whose win line is the first line of the letter", tones: ["heartfelt", "cute"], notFor: ["halloween"], gentle: true, little: true },
];

type Effects = { ambient: Effect[]; burst: Effect[]; finale: Effect[]; lively: Transition[]; calm: Transition[]; patterns: Pattern[] };

// What each feeling likes. Fireworks are rare on purpose: the AI uses them for every finale.
const TONE_EFFECTS: Record<string, Effects> = {
  funny: { ambient: ["bubbles", "confetti", "balloons", "none"], burst: ["confetti", "balloons", "colours", "bubbles"], finale: ["balloons", "confetti", "colours", "bubbles"], lively: ["bounce", "drop", "flip", "zoom"], calm: ["rise", "slide"], patterns: ["dots", "checks", "zigzag", "stripes"] },
  heartfelt: { ambient: ["petals", "sparkles", "stars", "none"], burst: ["petals", "sparkles", "hearts", "stars"], finale: ["petals", "lanterns", "stars", "sparkles"], lively: ["rise", "zoom", "slide"], calm: ["fade", "rise", "blur"], patterns: ["none", "dots", "grid"] },
  cute: { ambient: ["bubbles", "hearts", "balloons", "stars"], burst: ["bubbles", "hearts", "balloons", "confetti"], finale: ["bubbles", "hearts", "balloons", "stars"], lively: ["bounce", "zoom", "drop"], calm: ["rise", "fade"], patterns: ["dots", "checks"] },
  romantic: { ambient: ["petals", "hearts", "sparkles", "stars"], burst: ["hearts", "petals", "sparkles"], finale: ["hearts", "petals", "lanterns", "stars"], lively: ["zoom", "rise", "flip"], calm: ["fade", "blur"], patterns: ["none", "dots"] },
  festive: { ambient: ["confetti", "sparkles", "lanterns", "stars"], burst: ["confetti", "fireworks", "colours", "lanterns"], finale: ["fireworks", "lanterns", "confetti", "colours", "balloons"], lively: ["zoom", "spin", "slide", "drop"], calm: ["rise", "fade"], patterns: ["stripes", "zigzag", "grid"] },
};

// Effects that belong to an occasion, added to what the feelings like.
const OCCASION_EFFECTS: Partial<Record<Occasion, Effect[]>> = {
  christmas: ["snow"],
  diwali: ["lanterns", "sparkles"],
  eid: ["lanterns", "stars"],
  halloween: ["spooky"],
  holi: ["colours"],
  newyear: ["fireworks", "sparkles"],
  valentine: ["hearts"],
  newbaby: ["bubbles", "stars"],
  wedding: ["petals"],
  graduation: ["confetti", "stars"],
  retirement: ["balloons", "bubbles"],
  newhome: ["confetti", "sparkles"],
};

export type DirectionInput = {
  occasion?: Occasion;
  // Most important first.
  tones?: string[];
  // Direction ids from their last few cards.
  avoid?: string[];
  gentle?: boolean;
  little?: boolean;
  length?: "short" | "medium" | "long";
  // They picked the screens, so the card's shape and featured screen are theirs.
  screensChosen?: boolean;
  // They left it to us, so add a twist.
  surprise?: boolean;
  look?: Look;
  // Their favourite colour, for the accent.
  accent?: string;
};

export type Direction = { id: string; text: string };

// A random number in [0, 1) that doesn't repeat between server instances.
function random() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

// One item, more likely the higher its weight; never one that weighs nothing.
function pick<T>(items: T[], weight: (item: T) => number): T | undefined {
  const weights = items.map((item) => Math.max(0, weight(item)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return undefined;
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0 && weights[i] > 0) return items[i];
  }
  return items.findLast((_, i) => weights[i] > 0);
}

// The parts used recently, left out unless nothing else is left.
function fresh<T extends { id: string }>(items: T[], avoid: Set<string>, ok: (item: T) => boolean) {
  const allowed = items.filter(ok);
  const unseen = allowed.filter((item) => !avoid.has(item.id));
  return unseen.length ? unseen : allowed;
}

// How much a feeling counts: the first one they picked most.
function toneWeight(tones: string[], liked: string[]) {
  return tones.reduce((sum, tone, i) => sum + (liked.includes(tone) ? Math.max(1, 3 - i) : 0), 0);
}

const MOOD_OF_TONE: Record<string, Mood[]> = {
  funny: ["bright", "retro", "fresh"],
  heartfelt: ["warm", "soft"],
  cute: ["soft", "bright", "fresh"],
  romantic: ["deep", "warm"],
  festive: ["bright", "warm", "deep"],
};

function pickPalette(input: DirectionInput, avoid: Set<string>) {
  const tones = input.tones ?? [];
  const suits = (p: Palette) => !p.occasions || (input.occasion !== undefined && p.occasions.includes(input.occasion));
  return pick(fresh(PALETTES, avoid, suits), (p) => {
    const made = input.occasion && p.occasions?.includes(input.occasion) ? 3 : 1;
    const mood = tones.reduce((sum, tone, i) => sum + p.moods.filter((m) => MOOD_OF_TONE[tone]?.includes(m)).length * Math.max(1, 3 - i), 0);
    // Bold, bright palettes are hard on older eyes; soft and warm ones are kinder.
    const eyes = input.gentle ? (p.moods.includes("soft") || p.moods.includes("warm") ? 2 : 0.5) : 1;
    return (made + mood) * eyes;
  });
}

function pickFonts(input: DirectionInput, avoid: Set<string>) {
  const tones = input.tones ?? [];
  const ok = (f: FontPair) => (!f.occasions || (input.occasion !== undefined && f.occasions.includes(input.occasion))) && (!input.gentle || f.gentle === true) && (!input.little || f.little === true);
  return pick(fresh(FONT_PAIRS, avoid, ok), (f) => 1 + toneWeight(tones, f.tones) + (f.occasions ? 4 : 0));
}

function pickShape(input: DirectionInput, avoid: Set<string>) {
  const tones = input.tones ?? [];
  const ok = (s: Shape) =>
    (!input.gentle || s.gentle === true) && (input.little ? s.little !== undefined && s.little !== false : s.little !== "only") && (!input.length || s.lengths.includes(input.length));
  return pick(fresh(SHAPES, avoid, ok), (s) => 1 + toneWeight(tones, s.tones));
}

const suitsOccasion = (m: Moment, occasion?: Occasion) => (!m.occasions || (occasion !== undefined && m.occasions.includes(occasion))) && !(occasion && m.notFor?.includes(occasion));
const suitsPlayer = (m: Moment, input: DirectionInput) =>
  (!input.gentle || m.gentle === true) && (!input.little || m.little === true) && !((input.gentle || input.little) && HARD_GAMES.includes(m.screen as Game));

function pickSignature(input: DirectionInput, avoid: Set<string>) {
  // Half the time, not the game everyone expects for the occasion.
  const obvious = (input.occasion && OBVIOUS[input.occasion]) || [];
  const skipObvious = random() < 0.5;
  const ok = (m: Moment) => suitsOccasion(m, input.occasion) && suitsPlayer(m, input) && !(skipObvious && obvious.includes(m.id));
  return pick(fresh(SIGNATURES, avoid, ok), (m) => (m.occasions ? 3 : 1));
}

function pickTwist(input: DirectionInput, avoid: Set<string>, signature?: Moment) {
  const tones = input.tones ?? [];
  const ok = (m: Moment) => suitsOccasion(m, input.occasion) && suitsPlayer(m, input) && m.screen !== signature?.screen;
  return pick(fresh(TWISTS, avoid, ok), (m) => 1 + (m.tones ? toneWeight(tones, m.tones) : 1));
}

function pickEffects(input: DirectionInput) {
  const known = (input.tones ?? []).filter((tone) => tone in TONE_EFFECTS);
  const tones = known.length ? known : ["heartfelt", "funny"];
  const extra = (input.occasion && OCCASION_EFFECTS[input.occasion]) || [];
  // Each one different from those already picked, so the card doesn't do the same thing everywhere.
  const used = new Set<string>();
  // Each kind of effect from the feelings, most from the first one picked.
  const from = (key: keyof Effects) => {
    const choices = new Map<string, number>();
    tones.forEach((tone, i) => TONE_EFFECTS[tone][key].forEach((e) => choices.set(e, (choices.get(e) ?? 0) + Math.max(1, 3 - i))));
    if (key === "ambient" || key === "burst" || key === "finale") extra.forEach((e) => choices.set(e, (choices.get(e) ?? 0) + 3));
    // Calm cards stay calm.
    if (input.gentle && key === "lively") ["rise", "fade", "zoom"].forEach((e) => choices.set(e, 1));
    // Fireworks only go off at a moment: as a background they're shown as sparkles.
    const list = [...choices.keys()].filter((e) => (!(input.gentle && key === "lively") || ["rise", "fade", "zoom"].includes(e)) && !(key === "ambient" && e === "fireworks"));
    const chosen = pick(list, (e) => (choices.get(e) ?? 0) * (e === "fireworks" ? 0.4 : 1) * (used.has(e) && e !== "none" ? 0.15 : 1)) ?? list[0];
    if (chosen) used.add(chosen);
    return chosen;
  };
  return { ambient: from("ambient"), burst: from("burst"), finale: from("finale"), lively: from("lively"), calm: from("calm"), pattern: from("patterns") };
}

const quote = (s: string) => `"${s}"`;

// The direction for a new card, written for the card writer, and its id.
export function pickDirection(input: DirectionInput): Direction {
  const avoid = new Set((input.avoid ?? []).flatMap((id) => id.split(".")));
  const look = input.look;
  const palette = look ? undefined : pickPalette(input, avoid);
  const fonts = look ? undefined : pickFonts(input, avoid);
  const shape = input.screensChosen ? undefined : pickShape(input, avoid);
  const signature = input.screensChosen ? undefined : pickSignature(input, avoid);
  const twist = input.surprise && !input.screensChosen ? pickTwist(input, avoid, signature) : undefined;
  const effects = pickEffects(input);
  const accent = input.accent;

  const lines: string[] = [];
  if (look) {
    const background = look.background.join(", ");
    lines.push(
      `- Colours: the look they picked, ${quote(look.name)}. Use exactly these on every screen and nothing else: background ${background}${look.gradient ? ` (gradient ${quote(look.gradient)})` : ""}, text ${look.text ?? "that reads well on it"}, accent ${accent ?? look.accent}, and the envelope ${look.envelope}${look.pattern && look.pattern !== "none" ? `; pattern ${quote(look.pattern)} on a screen or two` : ""}. Change which colour leads from screen to screen so they don't all look alike. Theme ${quote(look.theme)}; background effect ${quote(look.ambient)}.`,
      `- Fonts: headings ${quote(look.heading)}, body ${quote(look.body)} on every screen.`,
    );
    if (look.stickers.length) lines.push(`- Stickers that go with the look: ${look.stickers.join(" ")}, alongside ones from their details.`);
  } else if (palette) {
    lines.push(
      `- Colours, ${quote(palette.name)}: deep ${palette.deep}, light ${palette.light}, soft ${palette.soft}, accent ${accent ?? palette.accent}. Make every screen's background, text, accent and the envelope from these exact hex values: alternate deep screens (light text) and light screens (deep text), with soft for second gradient colours, text boxes and the envelope. Theme ${quote(palette.theme)}.`,
    );
  }
  if (fonts) lines.push(`- Fonts: headings ${quote(fonts.heading)}, body ${quote(fonts.body)} on every screen.`);
  if (accent) lines.push(`- Their favourite colour is ${accent}: make it the accent (buttons and highlights) on every screen.`);
  if (shape) lines.push(`- Shape, ${quote(shape.name)}: ${shape.guide} (unless they described the screens they want).`);
  if (signature) lines.push(`- Feature ${signature.text} somewhere in the middle (unless they described the screens they want).`);
  if (twist) lines.push(`- They left it to us, so make it one of a kind: ${twist.text}.`);
  const fx = [
    look ? undefined : `background effect ${quote(effects.ambient ?? "none")}`,
    `the envelope bursts ${quote(look?.burst ?? effects.burst ?? "confetti")} when it opens`,
    `finale effect ${quote(look?.burst ?? effects.finale ?? "confetti")}`,
    `transition ${quote(effects.lively ?? "rise")} on the playful screens and ${quote(effects.calm ?? "fade")} on the letter`,
    !look && effects.pattern && effects.pattern !== "none" ? `pattern ${quote(effects.pattern)} on one or two light screens` : undefined,
  ].filter(Boolean);
  lines.push(`- Effects: ${fx.join("; ")}.`);

  const id = [look ? undefined : palette?.id, fonts?.id, shape?.id, signature?.id, twist?.id].filter(Boolean).join(".");
  const text = `# Creative direction for this card\nPicked so that no two cards look alike. Follow it unless what they told you asks for something else: their own words always win.\n${lines.join("\n")}`;
  return { id: id.slice(0, 40), text };
}
