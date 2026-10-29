"use client";

import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Occasion } from "@/lib/card";
import { AGES, type Age } from "@/lib/vibe-defaults";
import { WriteBox, chip, subhead } from "./quiz-parts";

// "Tell us a little about them": a few words with phrases to start them off, who's
// opening it, and their favourite colour. All of it can be skipped. With a ready-made
// design the words are what the card should say.

// Favourite colours, as the card's accent. Strong enough to show up on a pale card.
export const COLOURS = {
  red: "#c8102e",
  pink: "#e0457b",
  purple: "#7b3fa0",
  lilac: "#a78bcb",
  navy: "#1f3a68",
  blue: "#2f6fd1",
  teal: "#138a8a",
  green: "#2e7d32",
  yellow: "#e6b422",
  orange: "#e8762c",
  gold: "#b8902f",
  black: "#2b2b2b",
} as const;
export type Colour = keyof typeof COLOURS;
export const isColour = (key: string): key is Colour => key in COLOURS;

export const AGE_EMOJI: Record<Age, string> = { little: "🧸", child: "🧒", teen: "🎧", adult: "🙂", older: "🧓" };

type Props = {
  name: string;
  occasion: Occasion | "";
  // A ready-made design: the words are what it should say, and its games stay as they are.
  design: boolean;
  text: string;
  onText: (text: string) => void;
  age: Age | "";
  onAge: (age: Age | "") => void;
  gentle: boolean;
  onGentle: (gentle: boolean) => void;
  colour: string;
  onColour: (colour: string) => void;
};

export function AboutStep({ name, occasion, design, text, onText, age, onAge, gentle, onGentle, colour, onColour }: Props) {
  const q = useI18n().t.quiz;
  const starters = q.aboutStarters[occasion || "other"];
  const words = design ? q.questions.say : q.questions.about;
  const chosen = isColour(colour) ? colour : null;

  return (
    <div>
      <WriteBox
        value={text}
        onChange={onText}
        starters={design ? [...starters, ...q.sayStarters] : starters}
        extra={design ? { label: q.surprise, text: q.surpriseSay } : undefined}
        placeholder={words.placeholder}
        label={fmt(words.title, { name })}
        max={design ? 1000 : 600}
        rows={4}
      />

      <h2 className={`${subhead} mt-10`}>{fmt(q.age.title, { name })}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {AGES.map((a) => (
          <button key={a} type="button" aria-pressed={age === a} onClick={() => onAge(age === a ? "" : a)} className={chip(age === a)}>
            <span aria-hidden className="me-1.5">
              {AGE_EMOJI[a]}
            </span>
            {q.age[a]}
          </button>
        ))}
      </div>
      {/* A design's games stay as they are, so this is only for cards made from scratch. */}
      {!design && (
        <button
          type="button"
          role="switch"
          aria-checked={gentle}
          onClick={() => onGentle(!gentle)}
          className="mt-4 flex w-full items-center gap-4 rounded-2xl border-2 border-line bg-panel px-4 py-3 text-start transition hover:border-brand"
        >
          <span aria-hidden className={`relative h-8 w-14 shrink-0 rounded-full transition ${gentle ? "bg-brand" : "bg-line"}`}>
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${gentle ? "start-7" : "start-1"}`} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold">{q.gentle}</span>
            <span className="block opacity-70">{q.gentleHint}</span>
          </span>
        </button>
      )}

      <h2 className={`${subhead} mt-10`}>{fmt(q.colour.title, { name })}</h2>
      <p className="mt-1 opacity-70">{q.colour.hint}</p>
      <div className="mt-3 grid grid-cols-6 gap-2 sm:flex sm:flex-wrap">
        {(Object.keys(COLOURS) as Colour[]).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={chosen === c}
            aria-label={q.colours[c]}
            title={q.colours[c]}
            onClick={() => onColour(chosen === c ? "" : c)}
            className={`grid aspect-square min-h-11 place-items-center rounded-full border-4 text-lg font-bold text-white transition sm:h-12 sm:w-12 ${chosen === c ? "scale-110 border-foreground" : "border-panel shadow-sm"}`}
            style={{ background: COLOURS[c] }}
          >
            {chosen === c ? "✓" : ""}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-2 min-h-6 font-semibold">
        {chosen ? q.colours[chosen] : ""}
      </p>
    </div>
  );
}
