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
      className={`${moved ? "absolute transition-[left,top] duration-200 ease-out" : ""} whitespace-nowrap rounded-full border-2 border-ink bg-paper px-5 py-2 font-brand font-semibold text-ink`}
    >
      {label("No")}
    </button>
  );

  return (
    <div ref={area} className="relative h-60 w-full overflow-hidden rounded-xl border-2 border-ink bg-paper">
      {saidYes ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <Particles mode="confetti" />
          <div className="animate-pop text-6xl">🥰</div>
          <p className="font-brand text-2xl font-bold text-ink">Knew you&apos;d say yes.</p>
          <button onClick={onReset} className="relative text-sm font-semibold text-ink/60 underline underline-offset-4">
            Try again
          </button>
        </div>
      ) : (
        <>
          <p className="pt-7 text-center font-brand text-2xl font-bold text-ink">Will you be my Valentine?</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              ref={yes}
              onClick={() => setSaidYes(true)}
              style={{ transform: `scale(${Math.min(1 + dodges * 0.1, 1.6)})` }}
              className="rounded-full border-2 border-ink bg-hot px-7 py-2 font-brand font-semibold text-white shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-300"
            >
              Yes 💖
            </button>
            {!moved && noButton}
          </div>
          {moved && noButton}
          <p className="absolute inset-x-0 bottom-3 text-center font-hand text-xl text-ink/50">
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
      <div className="flex items-start gap-3 rounded-xl border-2 border-paper/30 bg-paper/10 p-4">
        <span className="mt-0.5 text-xl">✍️</span>
        <p className="min-h-[3rem] text-lg font-semibold text-white">
          {PROMPT.slice(0, typed)}
          {typed < PROMPT.length && <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-white align-middle" />}
        </p>
      </div>
      <div className="flex min-h-[2.75rem] flex-wrap gap-2">
        {RESULTS.slice(0, shown).map((r) => (
          <span key={r} className="animate-pop rounded-full border-2 border-ink bg-paper px-3.5 py-1.5 text-sm font-bold text-ink">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

const WHEEL = [
  { label: "Pizza", emoji: "🍕", color: "#d8432f" },
  { label: "A film", emoji: "🎬", color: "#fbf7ef" },
  { label: "Cake", emoji: "🍰", color: "#ecb340" },
  { label: "Flowers", emoji: "💐", color: "#fbf7ef" },
  { label: "A hug", emoji: "🤗", color: "#2b5aa6" },
  { label: "A kiss", emoji: "💋", color: "#fbf7ef" },
];

// A small prize wheel for the features section. Tap to spin.
export function WheelDemo() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const slice = 360 / WHEEL.length;

  const spin = () => {
    if (spinning) return;
    const target = Math.floor(Math.random() * WHEEL.length);
    setRotation((r) => r - (r % 360) + 360 * 4 + (360 - (target * slice + slice / 2)));
    setSpinning(true);
    setResult(null);
    setTimeout(() => {
      setSpinning(false);
      setResult(target);
    }, 3100);
  };

  const point = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(Math.cos(a) * 96).toFixed(2)} ${(Math.sin(a) * 96).toFixed(2)}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button onClick={spin} aria-label="Spin the wheel" className="relative h-44 w-44 transition hover:scale-[1.03]">
        <svg viewBox="-100 -104 200 208" className="h-full w-full">
          <g style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 3s cubic-bezier(0.33, 1, 0.68, 1)" : "none" }}>
            {WHEEL.map((s, i) => (
              <g key={s.label}>
                <path d={`M0 0 L${point(i * slice)} A96 96 0 0 1 ${point((i + 1) * slice)} Z`} fill={s.color} stroke="#1f1b16" strokeWidth="1.5" />
                <text transform={`rotate(${i * slice + slice / 2}) translate(0 -64)`} textAnchor="middle" dominantBaseline="middle" fontSize="24">
                  {s.emoji}
                </text>
              </g>
            ))}
          </g>
          <circle r="96" fill="none" stroke="#1f1b16" strokeWidth="3" />
          <circle r="14" fill="#1f1b16" stroke="#fbf7ef" strokeWidth="4" />
          <path d="M-10 -104 L10 -104 L0 -84 Z" fill="#1f1b16" stroke="#fbf7ef" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </button>
      <p className="h-7 font-brand text-lg font-bold">
        {result !== null ? `${WHEEL[result].emoji} ${WHEEL[result].label}!` : spinning ? "Spinning…" : "Tap the wheel"}
      </p>
    </div>
  );
}
