"use client";

import { useEffect, useState } from "react";
import { Particles } from "@/components/card/effects";
import { useRunaway } from "@/components/card/runaway";

// Homepage version of the card's question screen, sized for a feature tile.
export function RunawayDemo() {
  const [round, setRound] = useState(0);
  return <RunawayRound key={round} onReset={() => setRound((r) => r + 1)} />;
}

function RunawayRound({ onReset }: { onReset: () => void }) {
  const { area, yes, noProps, dodges, moved, label } = useRunaway();
  const [saidYes, setSaidYes] = useState(false);

  const noButton = (
    <button
      {...noProps}
      className={`${moved ? "absolute transition-[left,top] duration-200 ease-out" : ""} whitespace-nowrap rounded-full bg-white px-5 py-2.5 font-display font-semibold text-ink shadow ring-1 ring-black/10`}
    >
      {label("No")}
    </button>
  );

  return (
    <div ref={area} className="relative h-60 w-full overflow-hidden rounded-3xl bg-white/60 ring-1 ring-white backdrop-blur">
      {saidYes ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Particles mode="confetti" />
          <div className="animate-pop text-6xl">🥰</div>
          <p className="font-display text-2xl font-bold text-ink">Knew you&apos;d say yes.</p>
          <button onClick={onReset} className="relative text-sm font-semibold text-ink/60 underline underline-offset-4">
            Try again
          </button>
        </div>
      ) : (
        <>
          <p className="pt-7 text-center font-display text-2xl font-bold text-ink">Will you be my Valentine?</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              ref={yes}
              onClick={() => setSaidYes(true)}
              style={{ transform: `scale(${Math.min(1 + dodges * 0.1, 1.6)})` }}
              className="rounded-full bg-gradient-to-r from-hot to-tangerine px-7 py-2.5 font-display font-semibold text-white shadow-lg transition-transform duration-300"
            >
              Yes 💖
            </button>
            {!moved && noButton}
          </div>
          {moved && noButton}
          <p className="absolute inset-x-0 bottom-4 text-center text-xs font-semibold uppercase tracking-widest text-ink/40">
            {dodges === 0 ? "Go on, try pressing No" : `Escaped ${dodges} time${dodges === 1 ? "" : "s"}`}
          </p>
        </>
      )}
    </div>
  );
}

const MESSAGES = [
  "Every day with you is my favourite day.",
  "Happy Diwali to the brightest person I know.",
  "Another year older, still my favourite human.",
];

// Types a message out, holds it, deletes it, then moves on to the next.
export function TypewriterLoop() {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const text = MESSAGES[index];

  useEffect(() => {
    const full = length === text.length;
    const delay = deleting ? 18 : full ? 1800 : 45;
    const t = setTimeout(() => {
      if (!deleting && full) setDeleting(true);
      else if (deleting && length === 0) {
        setDeleting(false);
        setIndex((i) => (i + 1) % MESSAGES.length);
      } else setLength((l) => l + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(t);
  }, [length, deleting, text]);

  return (
    <p className="min-h-[5.5rem] font-hand text-3xl leading-snug text-ink">
      {text.slice(0, length)}
      <span className="ml-0.5 inline-block h-7 w-0.5 animate-pulse bg-hot align-middle" />
    </p>
  );
}

const PROMPT = "Make it pink, add a quiz about our first date, and end with fireworks";
const RESULTS = ["🎨 Colours → Rose pink", "❓ Added: First-date quiz", "🎆 Finale → Fireworks"];

// A preview of the planned "describe what you want" editor.
export function AiPromptDemo() {
  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (typed < PROMPT.length) t = setTimeout(() => setTyped((n) => n + 1), 35);
    else if (shown < RESULTS.length) t = setTimeout(() => setShown((n) => n + 1), 650);
    else
      t = setTimeout(() => {
        setTyped(0);
        setShown(0);
      }, 3500);
    return () => clearTimeout(t);
  }, [typed, shown]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-2xl bg-white/15 p-4 ring-1 ring-white/25 backdrop-blur">
        <span className="mt-0.5 text-xl">✍️</span>
        <p className="min-h-[3rem] text-lg font-semibold text-white">
          {PROMPT.slice(0, typed)}
          {typed < PROMPT.length && <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-white align-middle" />}
        </p>
      </div>
      <div className="flex min-h-[2.75rem] flex-wrap gap-2">
        {RESULTS.slice(0, shown).map((r) => (
          <span key={r} className="animate-pop rounded-full bg-white px-3.5 py-2 text-sm font-bold text-grape shadow">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
