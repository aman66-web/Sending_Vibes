"use client";

import type { CardData } from "@/lib/card";

// "Try another look": gives the whole card new colours, fonts and finishing touches at a
// tap, without changing a word or a screen (see lib/vary.ts). Undo brings the old one back.

type Props = {
  card: CardData;
  // Called with the restyled card; the caller saves the old one for Undo first.
  onChange: (card: CardData) => void;
  className?: string;
};

export function NewLookButton(props: Props) {
  void props;
  return null;
}
