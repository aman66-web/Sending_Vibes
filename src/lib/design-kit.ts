import type { Effect, Game, QuizQuestion, Screen, TimelineEvent } from "./card";

// The pieces ready-made designs are written with (see catalog.ts and its add-on lists),
// so each design reads like a script.

type DemoPhoto = { src: string; caption: string };

export const intro = (title: string, subtitle: string, button = "Open it"): Screen => ({ id: "intro", type: "intro", title, subtitle, button });
export const question = (q: string, yes: string, no: string, afterYes: string, id = "question"): Screen => ({ id, type: "question", question: q, yes, no, afterYes });
export const photos = (title: string, id = "photos"): Screen => ({ id, type: "photos", title, photos: [], captions: [] });
export const message = (title: string, body: string, id = "message"): Screen => ({ id, type: "message", title, body });
export const game = (g: Game, title: string, instructions: string, winText: string, id = "game"): Screen => ({ id, type: "game", game: g, title, instructions, winText });
export const quiz = (title: string, questions: QuizQuestion[], winText: string, id = "quiz"): Screen => ({ id, type: "quiz", title, questions, winText });
export const scratch = (title: string, instructions: string, hidden: string, id = "scratch"): Screen => ({ id, type: "scratch", title, instructions, hidden });
export const typeit = (title: string, instructions: string, phrase: string, winText: string, id = "typeit"): Screen => ({ id, type: "typeit", title, instructions, phrase, winText });
export const finale = (title: string, body: string, effect: Effect): Screen => ({ id: "finale", type: "finale", title, body, effect });
export const q = (text: string, options: string[], answer: number): QuizQuestion => ({ question: text, options, answer });
export const wheel = (title: string, instructions: string, options: string[], winText: string, landOn = -1, id = "wheel"): Screen => ({ id, type: "wheel", title, instructions, options, landOn, winText });
export const coupons = (title: string, instructions: string, list: string[], id = "coupons"): Screen => ({ id, type: "coupons", title, instructions, coupons: list });
export const reasons = (title: string, instructions: string, list: string[], id = "reasons"): Screen => ({ id, type: "reasons", title, instructions, reasons: list });
export const slider = (title: string, low: string, high: string, winText: string, id = "slider"): Screen => ({ id, type: "slider", title, low, high, winText });
export const timeline = (title: string, events: TimelineEvent[], id = "timeline"): Screen => ({ id, type: "timeline", title, events });
export const boxes = (title: string, instructions: string, prizes: string[], id = "boxes"): Screen => ({ id, type: "boxes", title, instructions, prizes });
export const at = (when: string, what: string): TimelineEvent => ({ when, what });

// Illustrated stand-ins for their photos, used in previews.
export const P = {
  sunset: { src: "/demo/sunset.svg", caption: "Golden hour with you" },
  coffee: { src: "/demo/coffee.svg", caption: "Where it all started" },
  lights: { src: "/demo/lights.svg", caption: "Fairy-light nights" },
  rangoli: { src: "/demo/rangoli.svg", caption: "Our rangoli this year" },
  diyas: { src: "/demo/lights.svg", caption: "Diwali at home" },
  fireworks: { src: "/demo/fireworks.svg", caption: "Fireworks from the roof" },
  cake: { src: "/demo/cake.svg", caption: "Cake o'clock" },
  balloons: { src: "/demo/balloons.svg", caption: "Up, up and away" },
  summer: { src: "/demo/sunset.svg", caption: "Last summer" },
  tree: { src: "/demo/tree.svg", caption: "Tree goals" },
  crescent: { src: "/demo/crescent.svg", caption: "Chaand raat" },
  grad: { src: "/demo/grad.svg", caption: "The big day" },
  bouquet: { src: "/demo/bouquet.svg", caption: "For you" },
  toast: { src: "/demo/toast.svg", caption: "Cheers to us" },
  pumpkin: { src: "/demo/pumpkin.svg", caption: "Our spooky pumpkin" },
  baby: { src: "/demo/baby.svg", caption: "Tiny feet" },
  rings: { src: "/demo/rings.svg", caption: "The rings" },
  holi: { src: "/demo/holi.svg", caption: "Holi hai!" },
  rakhi: { src: "/demo/rakhi.svg", caption: "This year's rakhi" },
  dad: { src: "/demo/dad.svg", caption: "World's best dad" },
  friends: { src: "/demo/friends.svg", caption: "Milkshake dates" },
  teacup: { src: "/demo/teacup.svg", caption: "Tea fixes everything" },
  desk: { src: "/demo/desk.svg", caption: "Your desk (we'll miss it)" },
  clock: { src: "/demo/clock.svg", caption: "The countdown" },
  newyear: { src: "/demo/fireworks.svg", caption: "Midnight fireworks" },
  mum: { src: "/demo/bouquet.svg", caption: "Flowers for you" },
} satisfies Record<string, DemoPhoto>;
