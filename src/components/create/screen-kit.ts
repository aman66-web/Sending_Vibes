import { GAMES, type Game, type Screen, type ScreenType } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";

// Ready-made screens to add to a card, like slide layouts in a presentation. Where the
// words are theirs to write, they say what goes there ("Type your question here"), so it's
// clear what each screen is for and what to change; see stillToWrite below.

const uid = () => Math.random().toString(36).slice(2, 10);

// What each game asks of the player, taken from the designs that use it.
const gameInstructions = new Map<Game, string>();
for (const t of TEMPLATES) {
  for (const s of t.screens(t.demo.to, t.demo.from)) if (s.type === "game" && !gameInstructions.has(s.game)) gameInstructions.set(s.game, s.instructions);
}

type Names = { to: string; from: string };

export type KitItem = { key: string; type: ScreenType; game?: Game; emoji: string; make: (names: Names) => Screen };

const SCREENS: KitItem[] = [
  { key: "intro", type: "intro", emoji: "💌", make: ({ to }) => ({ id: uid(), type: "intro", title: `For ${to}`, subtitle: "Someone's sent you something special", button: "Open it" }) },
  {
    key: "question",
    type: "question",
    emoji: "🙅",
    make: () => ({ id: uid(), type: "question", question: "Type your question here", yes: "Yes", no: "No", afterYes: "Good answer" }),
  },
  { key: "message", type: "message", emoji: "✉️", make: ({ from }) => ({ id: uid(), type: "message", title: "A little note", body: `Type your message here.\n\nLove, ${from}` }) },
  { key: "photos", type: "photos", emoji: "📸", make: () => ({ id: uid(), type: "photos", title: "Us", photos: [], captions: [] }) },
  {
    key: "quiz",
    type: "quiz",
    emoji: "❓",
    make: () => ({
      id: uid(),
      type: "quiz",
      title: "Quick quiz",
      questions: [{ question: "Type your question here", options: ["Type the right answer", "Type a wrong answer"], answer: 0 }],
      winText: "You know me so well!",
    }),
  },
  {
    key: "scratch",
    type: "scratch",
    emoji: "🪙",
    make: () => ({ id: uid(), type: "scratch", title: "Scratch for a surprise", instructions: "Scratch the silver panel", hidden: "Type your surprise here" }),
  },
  {
    key: "typeit",
    type: "typeit",
    emoji: "🔐",
    make: () => ({ id: uid(), type: "typeit", title: "Enter the password", instructions: "Type a clue here", phrase: "your password", winText: "Unlocked!" }),
  },
  {
    key: "wheel",
    type: "wheel",
    emoji: "🎡",
    make: () => ({
      id: uid(),
      type: "wheel",
      title: "Spin for your prize",
      instructions: "Whatever it lands on, you get",
      options: ["Type prize 1", "Type prize 2", "Type prize 3", "Type prize 4"],
      landOn: -1,
      winText: "The wheel has spoken!",
    }),
  },
  { key: "boxes", type: "boxes", emoji: "🎁", make: () => ({ id: uid(), type: "boxes", title: "Pick a box", instructions: "Choose wisely…", prizes: ["Type prize 1", "Type prize 2", "Type prize 3"] }) },
  {
    key: "coupons",
    type: "coupons",
    emoji: "🎟️",
    make: () => ({ id: uid(), type: "coupons", title: "Your coupon book", instructions: "Tap one to redeem it", coupons: ["Type coupon 1", "Type coupon 2", "Type coupon 3"] }),
  },
  {
    key: "reasons",
    type: "reasons",
    emoji: "🫙",
    make: () => ({ id: uid(), type: "reasons", title: "Reasons I love you", instructions: "Tap the jar to pull out a note", reasons: ["Type reason 1", "Type reason 2", "Type reason 3"] }),
  },
  { key: "slider", type: "slider", emoji: "📈", make: () => ({ id: uid(), type: "slider", title: "Type your question here", low: "A little", high: "SO much", winText: "Correct answer" }) },
  {
    key: "timeline",
    type: "timeline",
    emoji: "🗓️",
    make: () => ({
      id: uid(),
      type: "timeline",
      title: "Our story so far",
      events: [
        { when: "Type a date", what: "Type what happened" },
        { when: "Type a date", what: "Type what happened" },
      ],
    }),
  },
  {
    key: "finale",
    type: "finale",
    emoji: "🎆",
    make: ({ from }) => ({ id: uid(), type: "finale", title: "Type your big message", body: `With all my love, ${from}`, effect: "fireworks" }),
  },
];

const GAME_EMOJI: Record<Game, string> = {
  "catch-hearts": "💕",
  "light-diyas": "🪔",
  "blow-candles": "🕯️",
  "pop-balloons": "🎈",
  "catch-snowflakes": "❄️",
  "catch-stars": "⭐",
  "memory-match": "🃏",
  "unwrap-gift": "🎁",
  "shake-it": "📳",
  "cursor-chase": "💘",
  "loves-me-not": "🌼",
  "whack-ghosts": "👻",
  "launch-fireworks": "🎆",
  "release-lanterns": "🏮",
  "bubble-wrap": "🫧",
  pinata: "🪅",
  "grow-flower": "🌱",
  "throw-colours": "🎨",
  "slot-machine": "🎰",
  "hold-hug": "🤗",
  "catch-candy": "🍬",
};

const GAME_SCREENS: KitItem[] = GAMES.map((game) => ({
  key: `game:${game}`,
  type: "game",
  game,
  emoji: GAME_EMOJI[game],
  make: () => ({ id: uid(), type: "game", game, title: "Quick game!", instructions: gameInstructions.get(game) ?? "Have a go!", winText: "You did it!" }),
}));

export const KIT_GROUPS: { key: "start" | "fun" | "words" | "games" | "end"; items: KitItem[] }[] = [
  { key: "start", items: SCREENS.filter((s) => s.type === "intro") },
  { key: "words", items: SCREENS.filter((s) => ["message", "photos", "timeline", "reasons", "coupons"].includes(s.type)) },
  { key: "fun", items: SCREENS.filter((s) => ["question", "quiz", "scratch", "typeit", "wheel", "boxes", "slider"].includes(s.type)) },
  { key: "games", items: GAME_SCREENS },
  { key: "end", items: SCREENS.filter((s) => s.type === "finale") },
];

// A copy of a screen with a new id, for duplicating it.
export const copyScreen = (s: Screen): Screen => ({ ...structuredClone(s), id: uid() });

// The emoji that stands for a screen in the screens strip.
export function screenEmoji(s: Screen) {
  return s.type === "game" ? GAME_EMOJI[s.game] : (SCREENS.find((k) => k.type === s.type)?.emoji ?? "▫️");
}

// Every piece of text on a screen (not its id, type, photos or look), with where it is.
function wordsOf(value: unknown, path: (string | number)[], out: { path: (string | number)[]; text: string }[]) {
  if (typeof value === "string") out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, j) => wordsOf(v, [...path, j], out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) if (!["id", "type", "game", "effect", "photos", "style"].includes(k)) wordsOf(v, [...path, k], out);
  return out;
}

// The "what goes here" words the ready-made screens start with, and the older ones some
// saved cards may still have.
const BLANKS = [
  ...new Set(
    SCREENS.flatMap((k) => wordsOf(k.make({ to: "", from: "" }), [], []))
      .map((w) => w.text)
      .filter((text) => text.startsWith("Type ") || text === "your password")
      // The message keeps its sign-off; only the first line says what to write.
      .map((text) => text.split("\n")[0]),
  ),
  "Write your message here",
];

// Whether these words are still a ready-made screen's "what goes here".
export const isBlank = (text: string) => BLANKS.some((b) => text.trim().startsWith(b));

// Words on the card still saying what to write there, with the screen they're on.
export function stillToWrite(card: { screens: Screen[] }) {
  return card.screens.flatMap((screen, index) =>
    wordsOf(screen, [], [])
      .filter((w) => isBlank(w.text))
      .map((w) => ({ index, id: screen.id, text: w.text.split("\n")[0] })),
  );
}
