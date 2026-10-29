"use client";

import { isBlank } from "@/lib/blanks";

// Tapping into words that still say what goes there ("Type your question here") selects
// them, so typing replaces them. Every box that can hold such words uses these: on the
// card, in the list of every word, and in the Words tab.
type WordBox = HTMLInputElement | HTMLTextAreaElement;

export const selectBlank = (e: React.FocusEvent<WordBox>) => {
  const el = e.currentTarget;
  if (!isBlank(el.value)) return;
  // Just the first line, so a message keeps its sign-off. Again a moment later, as iOS
  // drops a selection made while it's still focusing.
  const line = el.value.indexOf("\n");
  const pick = () => el.setSelectionRange(0, line < 0 ? el.value.length : line);
  pick();
  setTimeout(pick, 0);
};

// A click that focuses a box selects on mousedown, then the mouseup puts the caret where
// it was clicked (Safari, and Chrome sometimes). Keep the selection for that one click.
let focusingByMouse = false;
export const blankMouse = {
  onMouseDown: (e: React.MouseEvent<WordBox>) => {
    focusingByMouse = document.activeElement !== e.currentTarget;
  },
  onMouseUp: (e: React.MouseEvent<WordBox>) => {
    if (focusingByMouse && isBlank(e.currentTarget.value)) e.preventDefault();
    focusingByMouse = false;
  },
};
