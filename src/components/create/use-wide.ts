"use client";

import { useSyncExternalStore } from "react";

// Whether the page is wide enough for the card beside the typing box (a computer),
// rather than above it (a phone). Pages are first drawn as for a computer.
const WIDE = "(min-width: 1024px)";

export function useWide() {
  return useSyncExternalStore(
    (changed) => {
      const query = window.matchMedia(WIDE);
      query.addEventListener("change", changed);
      return () => query.removeEventListener("change", changed);
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}
