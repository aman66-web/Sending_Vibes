import type { Game } from "./card";

// What each game asks of the player and how many it takes to win, as plain data the
// server can read (the card writer in lib/generate.ts). The games themselves are in
// components/card/games.tsx and more-games.tsx, which read these numbers through
// components/card/tune.ts: keep GOAL_MAX in step with the caps they pass to tune.goal().

// How many it usually takes to win each game whose goal can be changed (style.tune.goal).
export const USUAL_GOAL = {
  "catch-hearts": 10,
  "pop-balloons": 10,
  "catch-snowflakes": 10,
  "catch-stars": 10,
  "catch-candy": 10,
  "light-diyas": 5,
  "blow-candles": 5,
  "memory-match": 6,
  "unwrap-gift": 6,
  "cursor-chase": 5,
  "loves-me-not": 9,
  "whack-ghosts": 8,
  "launch-fireworks": 6,
  "release-lanterns": 5,
  "bubble-wrap": 20,
  pinata: 8,
  "throw-colours": 12,
  "grow-flower": 5,
} satisfies Partial<Record<Game, number>>;

export type GoalGame = keyof typeof USUAL_GOAL;

export const hasGoal = (game: string): game is GoalGame => game in USUAL_GOAL;

// The most each game will show, whatever the goal says (the caps in the game components).
// Memory match has six pairs of pictures for every occasion.
export const GOAL_MAX: Record<GoalGame, number> = {
  "catch-hearts": 40,
  "pop-balloons": 40,
  "catch-snowflakes": 40,
  "catch-stars": 40,
  "catch-candy": 40,
  "light-diyas": 12,
  "blow-candles": 12,
  "memory-match": 6,
  "unwrap-gift": 30,
  "cursor-chase": 20,
  "loves-me-not": 15,
  "whack-ghosts": 30,
  "launch-fireworks": 20,
  "release-lanterns": 10,
  "bubble-wrap": 40,
  pinata: 30,
  "throw-colours": 30,
  "grow-flower": 12,
};

// What the player counts in each game, for reading "Blow out all 7 candles" in its words.
export const GOAL_NOUNS: Record<GoalGame, string[]> = {
  "catch-hearts": ["hearts?"],
  "pop-balloons": ["balloons?"],
  "catch-snowflakes": ["snowflakes?", "flakes?"],
  "catch-stars": ["stars?"],
  "catch-candy": ["sweets?", "sweeties", "cand(?:y|ies)", "treats?"],
  "light-diyas": ["diyas?", "lamps?"],
  "blow-candles": ["candles?"],
  "memory-match": ["pairs?"],
  "unwrap-gift": ["taps?", "tears?", "rips?", "tugs?", "times"],
  "cursor-chase": ["hearts?", "times"],
  "loves-me-not": ["petals?"],
  "whack-ghosts": ["ghosts?", "ghouls?"],
  "launch-fireworks": ["fireworks?", "rockets?"],
  "release-lanterns": ["lanterns?"],
  "bubble-wrap": ["bubbles?"],
  pinata: ["hits?", "whacks?", "bashes", "smacks?", "taps?", "swings?", "times"],
  "throw-colours": ["splats?", "splashes", "handfuls?", "throws?"],
  "grow-flower": ["waterings?", "drops?", "times"],
};

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const BIG_WORDS: Record<string, number> = { thirty: 30, forty: 40 };

// A count, in figures or words ("7", "seven").
export const numberIn = (word: string) => (/^\d+$/.test(word) ? Number(word) : (BIG_WORDS[word.toLowerCase()] ?? NUMBER_WORDS.indexOf(word.toLowerCase())));

// A count just before what the game counts, with up to two words between ("all 7 little
// candles"), but not "30 years of candles", "Happy 30th" or "one heart at a time".
function countPattern(game: GoalGame) {
  const words = [...NUMBER_WORDS.slice(2), ...Object.keys(BIG_WORDS)].join("|");
  const between = "(?:\\s+(?!(?:years?|yrs|days?|weeks?|months?|hours?|minutes?|mins?|seconds?)\\b)[\\p{L}'’-]+){0,2}";
  return new RegExp(`\\b(\\d{1,2}|${words})${between}\\s+(?:${GOAL_NOUNS[game].join("|")})\\b`, "giu");
}

// The words on a game screen that can say how many it takes to win.
export const GAME_WORDS = ["instructions", "title", "winText"] as const;

// How many the words say it takes to win, from the first that says (the instructions first).
export function goalInWords(game: GoalGame, texts: string[]): number | undefined {
  return texts.flatMap((text) => [...text.matchAll(countPattern(game))].map((m) => numberIn(m[1]))).find((n) => n > 0);
}

// The words, with every count of what the game counts made this many.
export function withGoal(game: GoalGame, text: string, goal: number) {
  return text.replace(countPattern(game), (whole, n: string) => (numberIn(n) === goal ? whole : whole.replace(n, String(goal))));
}

// The games whose pieces move, so a slower speed makes them easier.
export const MOVING: Game[] = ["catch-hearts", "pop-balloons", "catch-snowflakes", "catch-stars", "catch-candy", "whack-ghosts", "cursor-chase"];

// Games that need a quick eye, a good memory or a shake: not for grandparents or small children.
export const HARD_GAMES: Game[] = ["memory-match", "shake-it", "cursor-chase", "whack-ghosts"];

// How a card for a grandparent (or anyone who asked for gentle games) and one for a small
// child should play at most, whatever the card writer chose (see lib/generate.ts).
export const GENTLE_TUNE = { size: 1.4, speed: 0.8, goal: 6 };
export const LITTLE_TUNE = { size: 1.4, speed: 0.85, goal: 8 };

// One line on each game for the card writer: what the player really does, how many it
// takes, and who it suits. Written from the game components, so it says what they do.
export const GAME_GUIDE: Record<Game, string> = {
  "catch-hearts": "hearts fall down a panel and they tap them before they drop out of sight. Usually 10, up to 40. Easy on a phone; slower and bigger (speed 0.7, size 1.5) for grandparents",
  "pop-balloons": "balloons float up and they tap to pop them. Usually 10, up to 40. Cheerful and easy; balloons take the card's colours",
  "catch-snowflakes": "snowflakes drift down and they tap them. Usually 10, up to 40. Wintry and calm",
  "catch-stars": "stars fall and they tap them. Usually 10, up to 40. Wishes, night skies, congratulations",
  "catch-candy": "wrapped sweets fall and they tap them. Usually 10, up to 40. Halloween, children, anyone with a sweet tooth",
  "light-diyas": "a row of little clay lamps; they tap each one to light it. Usually 5, up to 12. Calm and easy, lovely for grandparents; Diwali, or any warm, glowing card",
  "blow-candles": "candles on a two-tier cake with their name piped on it; they tap each flame to blow it out. Usually 5, up to 12. Never promise their age in candles: say \"blow them all out\" instead",
  "memory-match": "turn over cards two at a time to find the pairs (their own photos, then the occasion's pictures). Up to 6 pairs. The hardest game: needs a good memory, so not for grandparents or small children",
  "unwrap-gift": "a wrapped present with a name tag; they tap it again and again to tear the paper until it opens on one of their photos. Usually 6 taps, up to 30. Easy for anyone",
  "shake-it": "they shake the phone to fill a meter, with a tap-fast button for computers and for anyone who can't shake. No goal. Fun for teens and friends, not for grandparents",
  "cursor-chase": "a heart darts away from their finger (or the mouse) and they catch it with a quick, close tap. Usually 5, up to 20. A chase: not for grandparents or small children",
  "loves-me-not": "a daisy; they pluck the petals one by one, \"loves me\", \"loves me not\", and it always ends on \"loves me\". Usually 9, up to 15. Romantic or teasing",
  "whack-ghosts": "ghosts pop up in a 3 by 3 grid and vanish again; they tap them quickly. Usually 8, up to 30. Needs quick reactions: Halloween, teens and friends, not grandparents or small children",
  "launch-fireworks": "a night sky; they tap anywhere to send up a firework, and their name lights up the sky at the end. Usually 6, up to 20. Easy and showy: New Year, Diwali, big congratulations",
  "release-lanterns": "paper lanterns at the foot of a night sky; they tap each one to let it float away, and their name lights up the sky at the end. Usually 5, up to 10. Calm, lovely for grandparents, wishes, missing you, Diwali, Eid",
  "bubble-wrap": "a sheet of bubble wrap; they tap or drag a finger across to pop it. Usually 20, up to 40. Satisfying: get well, exams, stress, leaving",
  pinata: "a swinging piñata; they tap to hit it until it bursts. Usually 8, up to 30. Parties, birthdays, congratulations",
  "grow-flower": "a plant pot with their name on it; they water it until it grows into a flower. Usually 5 waterings, up to 12. Gentle and easy: Mother's Day, thanks, get well, new baby, grandparents",
  "throw-colours": "they tap anywhere to throw powder paint until the screen is covered. Usually 12, up to 30. Holi, or any loud, colourful celebration",
  "slot-machine": "they pull a lever; the third pull always hits the jackpot (the occasion's pictures). No goal. Good for a \"you've won\" reveal",
  "hold-hug": "they press and hold a big button for a few seconds to send a hug, which fills with their photo; letting go drains it. No goal (a lower speed makes it take longer). The easiest game of all: grandparents, small children, missing you, sorry, get well",
};
