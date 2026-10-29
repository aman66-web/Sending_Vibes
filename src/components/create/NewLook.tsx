"use client";

import { useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardData } from "@/lib/card";
import { newSeed, restyle } from "@/lib/vary";

// "Try another look": gives the whole card new colours, fonts and finishing touches at a
// tap, without changing a word or a screen (see lib/vary.ts). Undo brings the old one back.

type Props = {
  card: CardData;
  // Called with the restyled card; the caller saves the old one for Undo first.
  onChange: (card: CardData) => void;
  className?: string;
  // Their favourite colour from the questions (brief.accent), or null if they didn't give one,
  // so it stays wherever it's used. Left out, button colours that aren't ours are kept, in case.
  favourite?: string | null;
  // The button and its line go straight into the caller's row of buttons (the first look's):
  // the button styled by className, like the others, and the line on a row of its own under them.
  inRow?: boolean;
};

export function NewLookButton({ card, onChange, className = "", favourite, inRow = false }: Props) {
  const { t } = useI18n();
  const v = t.vary;
  // A run of looks of their own, stepped through a tap at a time. The seed is made on the
  // first tap rather than while drawing, so nothing random happens during render.
  const seed = useRef<string | null>(null);
  const [look, setLook] = useState(1);
  const another = () => {
    seed.current ??= newSeed();
    const next = look + 1;
    onChange(restyle(card, `${seed.current}:${next}`, { favourite }));
    setLook(next);
  };
  const line = look > 1 ? `${fmt(v.look, { n: look })} · ${v.again}` : v.hint;
  if (inRow)
    return (
      <>
        <button type="button" onClick={another} className={className}>
          <span aria-hidden>🎨</span> {v.button}
        </button>
        <p aria-live="polite" className="basis-full text-center text-sm font-semibold opacity-70">
          {line}
        </p>
      </>
    );
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      <button type="button" onClick={another} className="btn btn-paper min-h-12 text-lg">
        <span aria-hidden>🎨</span>
        {v.button}
      </button>
      <p aria-live="polite" className="text-sm font-semibold opacity-70">
        {line}
      </p>
    </div>
  );
}
