"use client";

import { useRef } from "react";

// Pieces shared by the question screens: the tap-to-choose chips, the big text boxes,
// and the phrases that start a written answer off.

// A choice to tap. Selected ones are filled in, so it's clear what's chosen.
export const chip = (selected: boolean, shape = "rounded-full") =>
  `${shape} min-h-11 border-2 px-4 py-2.5 text-start font-semibold transition ${selected ? "border-brand bg-brand text-on-brand" : "border-line bg-panel hover:-translate-y-0.5 hover:border-brand"}`;

// Big enough to read, and 16px or more so phones don't zoom in.
export const field = "w-full rounded-2xl border-2 border-line bg-panel px-5 py-4 text-lg outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

// A smaller heading for a second question on the same screen.
export const subhead = "font-brand text-2xl font-bold leading-tight";

// Adds a phrase to the end of what's written, as a new sentence when the last one has
// ended, so tapping a few in a row still reads well.
export function addPhrase(text: string, phrase: string) {
  const kept = text.trimEnd();
  if (!kept) return phrase;
  return `${kept}${/[.!?,;:]$/.test(kept) ? " " : ". "}${phrase}`;
}

// A box to write in, with phrases to tap above it that start the writing off. The
// phrases are only a start: the cursor goes to the end so they can carry on typing.
export function WriteBox({
  value,
  onChange,
  starters,
  extra,
  placeholder,
  label,
  max,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  starters: readonly string[];
  // Another button beside the phrases (such as "Surprise me").
  extra?: { label: string; text: string };
  placeholder: string;
  label: string;
  max: number;
  rows?: number;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const add = (phrase: string) => {
    const next = addPhrase(value, phrase).slice(0, max);
    onChange(next);
    // After the new words are in, so the cursor lands after them.
    requestAnimationFrame(() => {
      const el = box.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.length, next.length);
    });
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {starters.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => add(phrase)}
            className="min-h-11 rounded-full border-2 border-line bg-panel px-4 py-2 font-semibold transition hover:border-brand hover:text-brand"
          >
            + {phrase.trim()}
          </button>
        ))}
        {extra && (
          <button
            type="button"
            onClick={() => !value.includes(extra.text) && add(extra.text)}
            className="min-h-11 rounded-full border-2 border-brand bg-brand-soft px-4 py-2 font-bold text-on-brand-soft transition hover:bg-brand hover:text-on-brand"
          >
            🎲 {extra.label}
          </button>
        )}
      </div>
      <textarea
        ref={box}
        value={value}
        maxLength={max}
        rows={rows}
        dir="auto"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={`${field} resize-y leading-relaxed`}
      />
    </div>
  );
}

// "Other", for when none of the choices fit. It opens a box to type your own.
export function OtherChip({ label, on, onClick, className }: { label: string; on: boolean; onClick: () => void; className: (on: boolean) => string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={className(on)}>
      ✏️ {label}
    </button>
  );
}

export function OtherInput({ value, onChange, placeholder, max }: { value: string; onChange: (value: string) => void; placeholder: string; max: number }) {
  return (
    <input
      autoFocus
      value={value}
      maxLength={max}
      dir="auto"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`${field} mt-4 basis-full`}
    />
  );
}
