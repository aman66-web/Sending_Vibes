"use client";

import type { Music, Occasion } from "@/lib/card";

// The "Pick a look" question: tiles for the looks in lib/looks.ts, best first for the
// occasion and feelings, and a row of music to choose from (with a short sample on tap).

type Props = {
  // Their name, for the tiles ("For Lily").
  name: string;
  occasion: Occasion | "";
  tones: string[];
  look: string;
  music: Music | "";
  onLook: (key: string) => void;
  onMusic: (music: Music | "") => void;
};

export function LookStep(props: Props) {
  void props;
  return null;
}
