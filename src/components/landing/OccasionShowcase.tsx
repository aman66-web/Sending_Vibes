"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { PhoneFrame } from "@/components/PhoneFrame";
import type { Occasion } from "@/lib/card";
import { buildDemo, occasions } from "@/lib/templates";

// The homepage showcases the three flagship occasions; the full range lives in /cards.
const SHOWCASE = ["valentine", "diwali", "birthday"] as const;
type ShowcaseOccasion = (typeof SHOWCASE)[number];

const STYLES: Record<ShowcaseOccasion, { panel: string; text: string; muted: string; check: string; blurb: string; includes: string[] }> = {
  valentine: {
    panel: "from-[#ffe4ec] via-[#ffc8d8] to-[#ff9ebb]",
    text: "text-[#4a0d24]",
    muted: "text-[#4a0d24]/70",
    check: "bg-[#e11d63] text-white",
    blurb: "The one that started it all. They try to say no, the button runs away, and they end up smiling at their phone.",
    includes: ["An envelope that unseals", "The runaway No button", "Your photos as polaroids", "Catch-the-hearts game", "A love letter that types itself", "Floating-hearts finale"],
  },
  diwali: {
    panel: "from-[#2a0b3d] via-[#3f1158] to-[#5b1a7a]",
    text: "text-[#fff4dc]",
    muted: "text-[#fff4dc]/70",
    check: "bg-[#f59e0b] text-[#2a0b3d]",
    blurb: "A festival of lights in their pocket. They light the diyas one by one, then the sky fills with fireworks.",
    includes: ["An envelope with a diya seal", "Light-the-diyas game", "Rangoli and festival photos", "Your Diwali wishes", "A fireworks finale"],
  },
  birthday: {
    panel: "from-[#dbeafe] via-[#e9d5ff] to-[#fde68a]",
    text: "text-[#1e1b4b]",
    muted: "text-[#1e1b4b]/70",
    check: "bg-[#7c3aed] text-white",
    blurb: "Better than a card on the mantelpiece. They blow out the candles, make a wish, and get buried in confetti.",
    includes: ["A party envelope", "Blow-out-the-candles game", "Photo memories", "Your birthday message", "A confetti finale"],
  },
};

export function OccasionShowcase() {
  const [occasion, setOccasion] = useState<ShowcaseOccasion>("valentine");
  const demos = useMemo(() => Object.fromEntries(SHOWCASE.map((o) => [o, buildDemo(o)])) as Record<Occasion, ReturnType<typeof buildDemo>>, []);
  const style = STYLES[occasion];

  return (
    <div>
      <div role="tablist" className="mx-auto flex w-fit gap-1 rounded-full bg-white p-1.5 shadow-sm ring-1 ring-ink/5">
        {SHOWCASE.map((o) => (
          <button
            key={o}
            role="tab"
            aria-selected={o === occasion}
            onClick={() => setOccasion(o)}
            className={`rounded-full px-4 py-2.5 font-display font-semibold transition sm:px-6 ${o === occasion ? "bg-ink text-white shadow" : "text-ink/60 hover:text-ink"}`}
          >
            <span className="mr-1.5">{occasions[o].emoji}</span>
            {occasions[o].label}
          </button>
        ))}
      </div>

      <div className={`mt-8 grid items-center gap-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br p-6 sm:p-10 md:grid-cols-[1fr_auto] lg:p-14 ${style.panel}`}>
        <div key={occasion} className={`animate-screen-in ${style.text}`}>
          <div className="text-6xl">{occasions[occasion].emoji}</div>
          <h3 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{occasions[occasion].label}</h3>
          <p className={`mt-3 max-w-md text-lg ${style.muted}`}>{style.blurb}</p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {style.includes.map((item) => (
              <li key={item} className="flex items-center gap-2.5 font-semibold">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${style.check}`}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/create?occasion=${occasion}`} className="rounded-full bg-ink px-6 py-3.5 font-display font-semibold text-white shadow-lg transition hover:-translate-y-0.5">
              Make this card →
            </Link>
            <Link href={`/demo/${occasion}`} className="rounded-full bg-white/80 px-6 py-3.5 font-display font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white">
              Open full screen
            </Link>
          </div>
        </div>
        <div className="mx-auto">
          <PhoneFrame className="h-[600px] w-[292px]">
            <CardPlayer key={occasion} card={demos[occasion]} preview />
          </PhoneFrame>
          <p className={`mt-4 text-center font-hand text-2xl ${style.muted}`}>it&apos;s live, have a play ↑</p>
        </div>
      </div>
    </div>
  );
}
