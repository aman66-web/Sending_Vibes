"use client";

import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Occasion } from "@/lib/card";
import { feelingsFor, type Feeling } from "@/lib/vibe-defaults";
import { OtherChip, OtherInput, chip } from "./quiz-parts";

// "How should it feel?": each feeling with a line in that voice, so it's clear how the
// card will sound. The ones that suit the occasion come first.

export const FEELING_EMOJI: Record<Feeling, string> = {
  funny: "😂",
  heartfelt: "🥹",
  cute: "🧸",
  romantic: "🌹",
  festive: "🎉",
  elegant: "✨",
  cheeky: "😜",
  nostalgic: "📼",
  gentle: "🕊️",
  blessings: "🙏",
};

// Enough to choose from without a long list; the rest are a tap away.
const SHOWN = 6;
export const MAX_FEELINGS = 3;

type Props = {
  occasion: Occasion | "";
  vibes: Feeling[];
  vibeOther: string;
  // What suits the occasion and the person, first in the list.
  suggested: Feeling[];
  // Whether the ones picked are still our suggestion.
  isSuggestion: boolean;
  // Said under them while they are.
  note: string;
  onToggle: (feeling: Feeling) => void;
  onOther: (text: string) => void;
};

export function FeelingStep({ occasion, vibes, vibeOther, suggested, isSuggestion, note, onToggle, onOther }: Props) {
  const q = useI18n().t.quiz;
  const [more, setMore] = useState(false);
  const [other, setOther] = useState(false);
  const [full, setFull] = useState(false);
  const offered = feelingsFor(occasion);
  // One picked for another occasion (if they went back and changed it) stays, at the end.
  const order = [...suggested.filter((f) => offered.includes(f)), ...offered.filter((f) => !suggested.includes(f)), ...vibes.filter((f) => !offered.includes(f))];
  // Anything already picked stays in view.
  const shown = more ? order : order.filter((f, i) => i < SHOWN || vibes.includes(f));
  const tap = (f: Feeling) => {
    const adding = !vibes.includes(f);
    setFull(adding && vibes.length >= MAX_FEELINGS);
    if (adding && vibes.length >= MAX_FEELINGS) return;
    onToggle(f);
  };

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {shown.map((f) => {
          const on = vibes.includes(f);
          return (
            <button key={f} type="button" aria-pressed={on} onClick={() => tap(f)} className={`${chip(on, "rounded-2xl")} flex items-center gap-3`}>
              <span aria-hidden className="text-3xl">
                {FEELING_EMOJI[f]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg">{q.feelings[f].label}</span>
                <span className={`block text-base font-normal italic ${on ? "text-on-brand" : "opacity-70"}`}>{q.feelings[f].sample}</span>
              </span>
              {on && <span aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="mt-3 min-h-6 font-semibold">
        {full ? fmt(q.maxFeelings, { n: MAX_FEELINGS }) : isSuggestion && vibes.length ? <span className="opacity-75">✨ {note}</span> : null}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {!more && order.length > shown.length && (
          <button type="button" onClick={() => setMore(true)} className={chip(false)}>
            {q.moreFeelings} ↓
          </button>
        )}
        <OtherChip label={q.other} on={other || Boolean(vibeOther)} onClick={() => setOther(true)} className={chip} />
        {(other || vibeOther) && <OtherInput value={vibeOther} max={100} onChange={onOther} placeholder={q.questions.vibe.placeholder} />}
      </div>
    </div>
  );
}
