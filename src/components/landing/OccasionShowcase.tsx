"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { PhoneFrame } from "@/components/PhoneFrame";
import type { Occasion } from "@/lib/card";
import { buildDemo, occasions } from "@/lib/templates";
import { SHOWCASE, type ShowcaseOccasion } from "./showcase";

// The homepage showcases a few flagship occasions; the full range lives in /cards.

const STYLES: Record<ShowcaseOccasion, { panel: string; text: string; muted: string; check: string; blurb: string; includes: string[] }> = {
  valentine: {
    panel: "bg-[#f6cfd6]",
    text: "text-[#4a0d24]",
    muted: "text-[#4a0d24]/70",
    check: "bg-[#e11d63] text-white",
    blurb: "The one that started it all. They try to say no, the button runs away, and they end up smiling at their phone.",
    includes: ["An envelope that unseals", "The runaway No button", "Your photos as polaroids", "Catch-the-hearts game", "A love letter that types itself", "Floating-hearts finale"],
  },
  diwali: {
    panel: "bg-[#3a1650]",
    text: "text-[#fff4dc]",
    muted: "text-[#fff4dc]/70",
    check: "bg-[#f59e0b] text-[#2a0b3d]",
    blurb: "A festival of lights in their pocket. They light the diyas one by one, then the sky fills with fireworks.",
    includes: ["An envelope with a diya seal", "Light-the-diyas game", "Rangoli and festival photos", "Your Diwali wishes", "A fireworks finale"],
  },
  birthday: {
    panel: "bg-[#dde5f3]",
    text: "text-[#1e1b4b]",
    muted: "text-[#1e1b4b]/70",
    check: "bg-[#7c3aed] text-white",
    blurb: "Better than a card on the mantelpiece. They blow out the candles, make a wish, and get buried in confetti.",
    includes: ["A party envelope", "Blow-out-the-candles game", "Photo memories", "Your birthday message", "A confetti finale"],
  },
  halloween: {
    panel: "bg-[#2a1b48]",
    text: "text-[#fff7ed]",
    muted: "text-[#fff7ed]/70",
    check: "bg-[#f97316] text-[#1c0a00]",
    blurb: "Trick or treat? The Trick button runs away, then they whack the ghosts and fill a bag with sweets. Spooky music included.",
    includes: ["A runaway Trick button", "Whack-the-ghosts game", "Catch the falling sweets", "Spooky music", "Bats and ghosts finale"],
  },
  christmas: {
    panel: "bg-[#173f30]",
    text: "text-[#fff7ed]",
    muted: "text-[#fff7ed]/70",
    check: "bg-[#dc2626] text-white",
    blurb: "A present they unwrap with their finger, snowflakes to catch and Jingle Bells playing in the background.",
    includes: ["Unwrap-the-present game", "Catch the snowflakes", "Christmas photos", "Jingle Bells", "A snowy finale"],
  },
};

// `order` puts whatever is coming up soonest first (worked out on the server).
export function OccasionShowcase({ order = SHOWCASE }: { order?: readonly ShowcaseOccasion[] }) {
  const [occasion, setOccasion] = useState<ShowcaseOccasion>(order[0]);
  const demos = useMemo(() => Object.fromEntries(SHOWCASE.map((o) => [o, buildDemo(o)])) as Record<Occasion, ReturnType<typeof buildDemo>>, []);
  const style = STYLES[occasion];

  return (
    <div>
      <div role="tablist" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border-2 border-ink bg-cream p-1 [scrollbar-width:none]">
        {order.map((o) => (
          <button
            key={o}
            role="tab"
            aria-selected={o === occasion}
            onClick={() => setOccasion(o)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 font-brand font-semibold transition sm:px-5 ${o === occasion ? "bg-ink text-paper" : "text-ink/65 hover:text-ink"}`}
          >
            <span className="mr-1.5">{occasions[o].emoji}</span>
            {occasions[o].label}
          </button>
        ))}
      </div>

      <div className={`sheet mt-6 grid items-center gap-10 overflow-hidden p-6 sm:p-10 md:grid-cols-[1fr_auto] lg:p-14 ${style.panel}`}>
        <div key={occasion} className={`animate-screen-in ${style.text}`}>
          <div className="text-6xl">{occasions[occasion].emoji}</div>
          <h3 className="mt-4 font-brand text-4xl font-bold sm:text-5xl">{occasions[occasion].label}</h3>
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
            <Link href={`/create?occasion=${occasion}`} className="btn btn-red">
              Make this card →
            </Link>
            <Link href={`/demo/${occasion}`} className="btn btn-paper">
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
