"use client";

import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Dict } from "@/i18n/en";
import { GAMES, type Game, type Occasion } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { WriteBox, chip, subhead } from "./quiz-parts";

// "What should be in it?": leave it to us (the default), or tap the games and screens
// to include, and say roughly how long. Writing it out in their own words is still
// there for anyone who wants something exact.

// Screens and games by the same keys the screen kit uses ("quiz", "game:blow-candles").
// The opening, message and finale are always there, so they're not offered.
const SCREEN_PICKS = ["question", "quiz", "photos", "reasons", "coupons", "wheel", "scratch", "boxes", "slider", "timeline", "typeit"] as const;
type ScreenPick = (typeof SCREEN_PICKS)[number];
export const ALL_PICKS: string[] = [...SCREEN_PICKS, ...GAMES.map((g) => `game:${g}`)];
export const MAX_PICKS = 8;
const SHOWN = 8;
export const LENGTHS = ["short", "medium", "long"] as const;
export type Length = (typeof LENGTHS)[number];

const SCREEN_EMOJI: Record<ScreenPick, string> = {
  question: "🙅",
  quiz: "❓",
  photos: "📸",
  reasons: "🫙",
  coupons: "🎟️",
  wheel: "🎡",
  scratch: "🪙",
  boxes: "🎁",
  slider: "📈",
  timeline: "🗓️",
  typeit: "🔐",
};
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

const gameOf = (key: string) => (key.startsWith("game:") ? (key.slice(5) as Game) : null);
const isPick = (key: string) => ALL_PICKS.includes(key);

export function pickEmoji(key: string) {
  const game = gameOf(key);
  return game ? (GAME_EMOJI[game] ?? "🎮") : (SCREEN_EMOJI[key as ScreenPick] ?? "▫️");
}

export function pickName(key: string, t: Dict) {
  const game = gameOf(key);
  return game ? (t.labels.games[game] ?? key) : (t.labels.screens[key as ScreenPick] ?? key);
}

// Games that need a shake, a mouse or typing are harder going, so they're never
// suggested first (they're still under "Show all").
const FIDDLY = ["game:shake-it", "game:cursor-chase"];
const FIDDLY_GENTLE = [...FIDDLY, "typeit"];

// What each occasion's own designs use most, worked out once: up to three of its games,
// then its screens, then the usual favourites.
const FAVOURITE_GAMES = ["game:pop-balloons", "game:memory-match", "game:unwrap-gift"];
const USED = new Map<Occasion, Map<string, number>>();
for (const tpl of TEMPLATES) {
  const counts = USED.get(tpl.occasion) ?? new Map<string, number>();
  for (const s of tpl.screens(tpl.demo.to, tpl.demo.from)) {
    const key = s.type === "game" ? `game:${s.game}` : s.type;
    if (isPick(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  USED.set(tpl.occasion, counts);
}

// Every screen and game, best first for the occasion.
export function picksFor(occasion: Occasion | "", gentle: boolean): string[] {
  const avoid = gentle ? FIDDLY_GENTLE : FIDDLY;
  const used = [...(occasion ? (USED.get(occasion) ?? []) : [])].sort((a, b) => b[1] - a[1]).map(([key]) => key);
  const games = [...used.filter((k) => gameOf(k)), ...FAVOURITE_GAMES].filter((k) => !avoid.includes(k));
  const screens = [...used.filter((k) => !gameOf(k)), ...SCREEN_PICKS].filter((k) => !avoid.includes(k));
  const first = [...new Set([...games.slice(0, 3), ...screens])].slice(0, SHOWN);
  return [...first, ...ALL_PICKS.filter((k) => !first.includes(k))];
}

type Props = {
  name: string;
  occasion: Occasion | "";
  gentle: boolean;
  include: string[];
  length: Length | "";
  describe: string;
  onInclude: (include: string[]) => void;
  onLength: (length: Length | "") => void;
  onDescribe: (text: string) => void;
};

export function InsideStep({ name, occasion, gentle, include, length, describe, onInclude, onLength, onDescribe }: Props) {
  const { t } = useI18n();
  const q = t.quiz;
  const [all, setAll] = useState(false);
  const [full, setFull] = useState(false);
  const [writing, setWriting] = useState(Boolean(describe.trim()));
  const order = picksFor(occasion, gentle);
  // Anything already picked stays in view.
  const shown = all ? order : order.filter((k, i) => i < SHOWN || include.includes(k));
  const chooseForMe = include.length === 0;
  const tap = (key: string) => {
    const on = include.includes(key);
    setFull(!on && include.length >= MAX_PICKS);
    if (!on && include.length >= MAX_PICKS) return;
    onInclude(on ? include.filter((k) => k !== key) : [...include, key]);
  };

  return (
    <div>
      <button
        type="button"
        aria-pressed={chooseForMe}
        onClick={() => {
          setFull(false);
          onInclude([]);
        }}
        className={`${chip(chooseForMe, "rounded-2xl")} flex w-full items-center gap-3`}
      >
        <span aria-hidden className="text-3xl">
          🎲
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg">
            {q.chooseForMe} <span className={`text-base font-normal ${chooseForMe ? "text-on-brand" : "opacity-70"}`}>({q.recommended})</span>
          </span>
          <span className={`block text-base font-normal ${chooseForMe ? "text-on-brand" : "opacity-70"}`}>{fmt(q.chooseForMeHint, { name })}</span>
        </span>
        {chooseForMe && <span aria-hidden>✓</span>}
      </button>

      <p className="mt-6 font-semibold opacity-70">{q.orPick}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {shown.map((key) => {
          const on = include.includes(key);
          const game = gameOf(key);
          return (
            <button key={key} type="button" aria-pressed={on} onClick={() => tap(key)} className={`${chip(on, "rounded-2xl")} relative flex flex-col items-start gap-1 pe-8`}>
              <span aria-hidden className="text-2xl">
                {pickEmoji(key)}
              </span>
              <span className="leading-snug">{pickName(key, t)}</span>
              <span className={`text-sm font-normal leading-snug ${on ? "text-on-brand" : "opacity-70"}`}>{game ? t.labels.screens.game : t.studio.kit[key as ScreenPick]}</span>
              {on && (
                <span aria-hidden className="absolute end-3 top-2.5">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-2 min-h-6 font-semibold">
        {full ? fmt(q.maxPicks, { n: MAX_PICKS }) : null}
      </p>
      <button type="button" onClick={() => setAll((a) => !a)} className={chip(false)}>
        {all ? `${q.showFewer} ↑` : `${fmt(q.showAll, { n: ALL_PICKS.length })} ↓`}
      </button>

      <h2 className={`${subhead} mt-10`}>{q.howLong}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {LENGTHS.map((l) => (
          <button key={l} type="button" aria-pressed={length === l} onClick={() => onLength(length === l ? "" : l)} className={chip(length === l, "rounded-2xl")}>
            <span className="block">{q.lengths[l].label}</span>
            <span className={`block text-sm font-normal ${length === l ? "text-on-brand" : "opacity-70"}`}>{q.lengths[l].detail}</span>
          </button>
        ))}
      </div>

      <div className="mt-10">
        {writing ? (
          <>
            <h2 className={subhead}>{q.questions.describe.title}</h2>
            <p className="mb-4 mt-2 text-lg opacity-70">{q.questions.describe.hint}</p>
            <WriteBox
              value={describe}
              onChange={onDescribe}
              starters={q.describeStarters}
              placeholder={q.questions.describe.placeholder}
              label={q.questions.describe.title}
              max={1000}
              rows={5}
            />
          </>
        ) : (
          <button type="button" onClick={() => setWriting(true)} className="min-h-11 text-start text-lg font-semibold text-brand underline underline-offset-4">
            ✏️ {q.describeOwn}
          </button>
        )}
      </div>
    </div>
  );
}
