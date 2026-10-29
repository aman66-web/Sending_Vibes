import type { Game, Screen, ScreenType } from "./card";

// The words built into the screens themselves ("You've got mail", "Next", the No
// button's excuses, a game's "Keep shaking…"). Every one can be changed on a
// screen, by tapping it in the editor or by asking the AI, and is kept in that
// screen's "labels"; these are what a screen says when it hasn't changed them.
// {i}, {n} and the like are filled in with numbers as the card plays.

export const TEXTS = {
  next: "Next",
  gotMail: "You've got mail",
  tapEnvelope: "Tap the envelope to open it",
  playAgain: "Play it again",
  photosTap: "Tap the photo to see the next one ({i}/{n})",
  quizCount: "{i} of {n}",
  quizPerfect: "Full marks. Obviously.",
  quizMissedOne: "Only 1 wrong answer. We'll talk about that later.",
  quizMissed: "Only {n} wrong answers. We'll talk about that later.",
  scratchHere: "Scratch here",
  scratchDone: "There it is!",
  typeStart: "Start typing…",
  typeHint: "Need a hint?",
  spin: "Spin the wheel",
  spinning: "Spinning…",
  spinAgain: "Spin again",
  coupon: "Coupon",
  couponTap: "Tap to redeem",
  couponDone: "Redeemed ✓",
  couponClaim: "Now let them know you're cashing in",
  jarTap: "Tap the jar",
  jarCount: "Reason #{i} of {n}",
  jarEmpty: "That's all of them… for now.",
  sliderDrag: "Drag the heart",
  timelineMore: "And then… ({i}/{n})",
  boxesPicked: "You picked…",
  diyaTap: "tap",
  memoryScore: "{i} / {n} pairs · {moves} moves",
  shakeStart: "Start shaking",
  shaking: "Keep shaking…",
  shakeTap: "Can't shake? Tap here really fast",
  chaseScore: "Caught {i} / {n}",
  chaseTip: "Tip: trap it in a corner",
  petalStart: "Pluck a petal…",
  lovesMe: "Loves me",
  lovesMeNot: "Loves me not",
  petalsLeft: "{n} petals left",
  petalsDone: "The flower has spoken.",
  boo: "BOO!",
  skyTap: "Tap anywhere in the sky",
  lanternTap: "Tap each lantern to let it go",
  bubblesScore: "{i} / {n} popped",
  waterIt: "Water it ({i}/{n})",
  colourTap: "Tap to throw colour",
  slotStart: "Pull the lever!",
  slotMiss: "No luck. Try again!",
  slotClose: "So close! One more…",
  slotWin: "Jackpot!",
  slotPull: "Pull",
  hugStart: "Press and hold",
  hugHolding: "Keep holding…",
  hugLetGo: "Don't let go!",
  hugDone: "Hug delivered!",
  // Help to finish, Back, the letter, sending coupons, a screen that won't load (card-readable)
  helpFinish: "Need a hand? Tap here to finish",
  helpReveal: "Need a hand? Tap here to show it",
  helpAnswer: "Need a hand? Show me the answer",
  back: "Back",
  messageSkip: "Tap the letter to read it all now",
  couponSend: "Send it to {name}",
  couponMessage: "🎟️ I'm cashing in: {coupons}",
  screenBroken: "Sorry, this part of the card didn't load.",
  screenSkip: "Skip this screen",
};

export const LISTS = {
  // What the runaway No button says each time it gets away.
  noLines: ["Are you sure?", "Really sure?", "Think again", "Please?", "Nice try", "You can't escape", "Just press yes", "Wrong button"],
  // A quiz's reaction to a wrong answer, in turn.
  wrongLines: ["Wrong!", "Excuse me?", "Try again.", "Hmm, no.", "I'm offended."],
  // The slider's lines as it climbs, below 30%, 55%, 80% and 100%.
  sliderLines: ["Hmm. Be honest…", "Getting warmer…", "That's more like it.", "Nearly there…"],
};

export type TextKey = keyof typeof TEXTS;
export type ListKey = keyof typeof LISTS;
export type LabelKey = TextKey | ListKey;
export type Labels = Partial<Record<LabelKey, string | string[]>>;

export const LABEL_KEYS = [...Object.keys(TEXTS), ...Object.keys(LISTS)] as [LabelKey, ...LabelKey[]];
export const isList = (key: string): key is ListKey => key in LISTS;

// Which of them each kind of screen shows, and on a game screen, each game.
export const LABELS_ON: Record<ScreenType, LabelKey[]> = {
  intro: ["gotMail", "tapEnvelope"],
  question: ["next", "noLines"],
  photos: ["next", "photosTap"],
  message: ["next", "messageSkip"],
  game: ["next", "helpFinish"],
  quiz: ["next", "quizCount", "quizPerfect", "quizMissedOne", "quizMissed", "wrongLines", "helpAnswer"],
  scratch: ["next", "scratchHere", "scratchDone", "helpReveal"],
  typeit: ["next", "typeStart", "typeHint", "helpAnswer"],
  wheel: ["next", "spin", "spinning", "spinAgain"],
  coupons: ["next", "coupon", "couponTap", "couponDone", "couponClaim", "couponSend", "couponMessage"],
  reasons: ["next", "jarTap", "jarCount", "jarEmpty"],
  slider: ["next", "sliderLines", "sliderDrag", "helpFinish"],
  timeline: ["next", "timelineMore"],
  boxes: ["next", "boxesPicked"],
  finale: ["playAgain"],
};

export const GAME_LABELS: Partial<Record<Game, LabelKey[]>> = {
  "light-diyas": ["diyaTap"],
  "memory-match": ["memoryScore"],
  "shake-it": ["shakeStart", "shaking", "shakeTap"],
  "cursor-chase": ["chaseScore", "chaseTip"],
  "loves-me-not": ["petalStart", "lovesMe", "lovesMeNot", "petalsLeft", "petalsDone"],
  "whack-ghosts": ["boo"],
  "launch-fireworks": ["skyTap"],
  "release-lanterns": ["lanternTap"],
  "bubble-wrap": ["bubblesScore"],
  "grow-flower": ["waterIt"],
  "throw-colours": ["colourTap"],
  "slot-machine": ["slotStart", "spinning", "slotMiss", "slotClose", "slotWin", "slotPull"],
  "hold-hug": ["hugStart", "hugHolding", "hugLetGo", "hugDone"],
};

export function labelsOn(screen: Screen): LabelKey[] {
  return screen.type === "game" ? [...LABELS_ON.game, ...(GAME_LABELS[screen.game] ?? [])] : LABELS_ON[screen.type];
}

// Puts the numbers into a label: fill("{i} of {n}", { i: 2, n: 5 }) is "2 of 5".
export function fill(template: string, vars?: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (vars && name in vars ? String(vars[name]) : whole));
}

// A screen's own words for a label, or the usual ones.
export function labelText(labels: Labels | undefined, key: TextKey, vars?: Record<string, string | number>) {
  const own = labels?.[key];
  return fill(typeof own === "string" && own.trim() ? own : TEXTS[key], vars);
}

export function labelList(labels: Labels | undefined, key: ListKey): string[] {
  const own = labels?.[key];
  const usual = LISTS[key];
  // Lines they've cleared fall back to the usual ones, so a list never has a gap.
  return Array.isArray(own) && own.length ? own.map((line, i) => (line.trim() ? line : (usual[i % usual.length] ?? ""))) : usual;
}
