"use client";

import type { Occasion } from "@/lib/card";

// A small live preview of the card's envelope as the questions are answered: their name,
// the occasion and the look they picked. Also shown while the card is being made.

type Props = {
  to: string;
  from: string;
  occasion: Occasion | "";
  look: string;
  className?: string;
};

export function VibePreview(props: Props) {
  void props;
  return null;
}
