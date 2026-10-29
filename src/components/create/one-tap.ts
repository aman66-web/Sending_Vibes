"use client";

// Many people double-tap out of habit. The second tap of a double-tap mustn't add a
// second sticker, delete a second screen or land on whatever has just opened under the
// finger, so a tap within a moment of the last one (or a double-click) doesn't count.
const MOMENT_MS = 450;

// The last tap that counted, on any button that checks: the second tap often lands on a
// different one, opened or uncovered by the first (Delete closes the sheet over Add to basket).
let last = -Infinity;

// Whether a tap is a fresh one, checked when it happens: onClick={(e) => fresh(e) && act()}.
export function useFreshTap() {
  return (e: React.MouseEvent) => {
    if (e.detail > 1 || (e.timeStamp >= last && e.timeStamp - last < MOMENT_MS)) return false;
    last = e.timeStamp;
    return true;
  };
}
