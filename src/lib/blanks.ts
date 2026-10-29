import type { Screen } from "./card";

// The words a ready-made screen starts with where the words are theirs to write ("Type
// your question here"), so it's clear what each screen is for and what to change. One
// list for the screens that use them (components/create/screen-kit.ts), the editor that
// selects them when tapped, the reminder before the basket and the AI that fills them in.

export const BLANK = {
  question: "Type your question here",
  message: "Type your message here.",
  rightAnswer: "Type the right answer",
  wrongAnswer: "Type a wrong answer",
  surprise: "Type your surprise here",
  clue: "Type a clue here",
  password: "your password",
  bigMessage: "Type your big message",
  // A "Who said it?" quiz question.
  quote: "Type something one of you said",
  // Numbered, so each one can be told apart when tapped.
  prize: (n: number) => `Type prize ${n}`,
  coupon: (n: number) => `Type coupon ${n}`,
  reason: (n: number) => `Type reason ${n}`,
  date: (n: number) => `Type date ${n}`,
  happened: (n: number) => `Type what happened ${n}`,
};

// Only the first line counts, without a full stop at the end, so a message keeps its
// sign-off ("Type your message here.\n\nLove, Sam").
const firstLine = (text: string) =>
  text
    .trim()
    .split("\n")[0]
    .trim()
    .replace(/[.…!?]+$/, "");

const numbered = (make: (n: number) => string, most: number) => Array.from({ length: most }, (_, i) => make(i + 1));

// Every blank, plus older ones that saved drafts may still have.
export const BLANKS = [
  BLANK.question,
  BLANK.message,
  BLANK.rightAnswer,
  BLANK.wrongAnswer,
  BLANK.surprise,
  BLANK.clue,
  BLANK.password,
  BLANK.bigMessage,
  BLANK.quote,
  ...numbered(BLANK.prize, 8),
  ...numbered(BLANK.coupon, 8),
  ...numbered(BLANK.reason, 8),
  ...numbered(BLANK.date, 8),
  ...numbered(BLANK.happened, 8),
  "Write your message here",
  "Write what happened",
  "Type a date",
  "Type what happened",
].map(firstLine);
const BLANK_SET = new Set(BLANKS);

// Whether these words are still exactly a blank, untouched.
export const isBlank = (text: string) => BLANK_SET.has(firstLine(text));

type Path = (string | number)[];

// Every piece of text on a screen (not its id, type, photos or look), with where it is.
function wordsOf(value: unknown, path: Path, out: { path: Path; text: string }[]) {
  if (typeof value === "string") out.push({ path, text: value });
  else if (Array.isArray(value)) value.forEach((v, j) => wordsOf(v, [...path, j], out));
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) if (!["id", "type", "game", "effect", "photos", "style"].includes(k)) wordsOf(v, [...path, k], out);
  return out;
}

// Words on the card still blank, with the screen they're on and where on it.
export function stillToWrite(card: { screens: Screen[] }) {
  return card.screens.flatMap((screen, index) =>
    wordsOf(screen, [], [])
      .filter((w) => isBlank(w.text))
      .map((w) => ({ index, id: screen.id, path: w.path, text: w.text.split("\n")[0] })),
  );
}

// The moment within a screen where these words show (see lib/stages.ts), so going to
// them shows them: a box once picked, a reason once pulled from the jar, and so on.
export function stageFor(screen: Screen, path: Path) {
  const n = Number(path[1]);
  switch (screen.type) {
    case "scratch":
      return path[0] === "hidden" ? 1 : 0;
    case "boxes":
      return path[0] === "prizes" ? 1 : 0;
    case "reasons":
      return path[0] === "reasons" ? n + 1 : 0;
    case "timeline":
      return path[0] === "events" ? n : 0;
    case "quiz":
      return path[0] === "questions" && n > 0 ? n + 1 : 0;
    default:
      return 0;
  }
}

// For the AI: the blanks, written out.
export const BLANKS_FOR_AI = [...new Set(BLANKS)].map((b) => JSON.stringify(b)).join(", ");
