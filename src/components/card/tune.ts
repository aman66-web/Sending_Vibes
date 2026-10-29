"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Game, Tune } from "@/lib/card";

// How the screen on show plays (style.tune): its speed, how many to win, the size of its
// pieces and where they come from. Games and timed screens read it, with their own defaults.
export const NO_TUNE: Tune = {};
export const TuneContext = createContext<Tune>(NO_TUNE);

export function useTune() {
  const tune = useContext(TuneContext);
  return {
    // 1 is normal; 2 is twice as fast.
    speed: tune.speed ?? 1,
    // How many to win, or the usual number.
    goal: (usual: number, max = 40) => Math.min(max, Math.max(1, Math.round(tune.goal ?? usual))),
    size: tune.size ?? 1,
    from: tune.from,
  };
}

// How many it usually takes to win each game whose goal can be changed.
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
} satisfies Partial<Record<Game, number>>;

// The games whose pieces move about, so they can come from elsewhere or be bigger.
export const CATCHING: Game[] = ["catch-hearts", "pop-balloons", "catch-snowflakes", "catch-stars", "catch-candy"];

// Whether this is the card itself, opened by the person it's for, rather than a preview
// while it's being made (or in the shop). Only the real card offers help, sends anything
// or moves the page about, so previews look as designed and run no timers.
export const LiveContext = createContext(false);

// How long someone can be on a screen that has to be won before it offers to finish it
// for them ("Need a hand?"), so a slow finger or a phone keyboard never leaves them stuck.
export const HELP_AFTER = { game: 30_000, scratch: 20_000, typeit: 30_000, quiz: 25_000, slider: 25_000 };

// True once they've been at it for `after` ms, or have missed `maxMisses` times (`misses`
// so far). Starts again when `restart` changes (the next question, say).
export function useStuck(after: number, misses = 0, maxMisses = Infinity, restart: unknown = null) {
  const live = useContext(LiveContext);
  const [late, setLate] = useState(false);
  const [since, setSince] = useState(restart);
  if (since !== restart) {
    setSince(restart);
    setLate(false);
  }
  useEffect(() => {
    if (!live) return;
    const timer = setTimeout(() => setLate(true), after);
    return () => clearTimeout(timer);
  }, [live, after, restart]);
  return live && (late || misses >= maxMisses);
}
