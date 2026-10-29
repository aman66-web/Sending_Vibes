"use client";

import { useRef } from "react";

// Many people double-tap out of habit. The second tap of a double-tap mustn't add a
// second sticker, delete a second screen or land on whatever has just opened under the
// finger, so a tap within a moment of the last one (or a double-click) doesn't count.
const MOMENT_MS = 450;

// Whether a tap is a fresh one, checked when it happens: onClick={(e) => fresh(e) && act()}.
export function useFreshTap() {
  const last = useRef(-Infinity);
  return (e: React.MouseEvent) => {
    if (e.detail > 1 || e.timeStamp - last.current < MOMENT_MS) return false;
    last.current = e.timeStamp;
    return true;
  };
}
