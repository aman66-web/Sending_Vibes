"use client";

import { createContext, useContext } from "react";
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
