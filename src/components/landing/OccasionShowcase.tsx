"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { PhoneFrame } from "@/components/PhoneFrame";
import type { Occasion } from "@/lib/card";
import { useI18n } from "@/i18n/client";
import { buildDemo, occasions } from "@/lib/templates";
import { SHOWCASE, type ShowcaseOccasion } from "./showcase";

// The homepage showcases a few flagship occasions; the full range lives in /cards.

const STYLES: Record<ShowcaseOccasion, { panel: string; text: string; muted: string; check: string }> = {
  valentine: {
    panel: "bg-[#f6cfd6]",
    text: "text-[#4a0d24]",
    muted: "text-[#4a0d24]/70",
    check: "bg-[#e11d63] text-white",
  },
  diwali: {
    panel: "bg-[#3a1650]",
    text: "text-[#fff4dc]",
    muted: "text-[#fff4dc]/70",
    check: "bg-[#f59e0b] text-[#2a0b3d]",
  },
  birthday: {
    panel: "bg-[#dde5f3]",
    text: "text-[#1e1b4b]",
    muted: "text-[#1e1b4b]/70",
    check: "bg-[#7c3aed] text-white",
  },
  halloween: {
    panel: "bg-[#2a1b48]",
    text: "text-[#fff7ed]",
    muted: "text-[#fff7ed]/70",
    check: "bg-[#f97316] text-[#1c0a00]",
  },
  christmas: {
    panel: "bg-[#173f30]",
    text: "text-[#fff7ed]",
    muted: "text-[#fff7ed]/70",
    check: "bg-[#dc2626] text-white",
  },
};

// `order` puts whatever is coming up soonest first (worked out on the server).
export function OccasionShowcase({ order = SHOWCASE }: { order?: readonly ShowcaseOccasion[] }) {
  const { t } = useI18n();
  const [occasion, setOccasion] = useState<ShowcaseOccasion>(order[0]);
  const demos = useMemo(() => Object.fromEntries(SHOWCASE.map((o) => [o, buildDemo(o)])) as Record<Occasion, ReturnType<typeof buildDemo>>, []);
  const style = STYLES[occasion];
  const copy = t.showcase[occasion];

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
            <span className="me-1.5">{occasions[o].emoji}</span>
            {t.occasions[o].label}
          </button>
        ))}
      </div>

      <div className={`sheet mt-6 grid items-center gap-10 overflow-hidden p-6 sm:p-10 md:grid-cols-[1fr_auto] lg:p-14 ${style.panel}`}>
        <div key={occasion} className={`animate-screen-in ${style.text}`}>
          <div className="text-6xl">{occasions[occasion].emoji}</div>
          <h3 className="mt-4 font-brand text-4xl font-bold sm:text-5xl">{t.occasions[occasion].label}</h3>
          <p className={`mt-3 max-w-md text-lg ${style.muted}`}>{copy.blurb}</p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {copy.includes.map((item) => (
              <li key={item} className="flex items-center gap-2.5 font-semibold">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${style.check}`}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/create?occasion=${occasion}`} className="btn btn-red">
              {t.showcase.make}
            </Link>
            <Link href={`/demo/${occasion}`} className="btn btn-paper">
              {t.showcase.fullScreen}
            </Link>
          </div>
        </div>
        <div className="mx-auto">
          <PhoneFrame className="h-[600px] w-[292px]">
            <CardPlayer key={occasion} card={demos[occasion]} preview />
          </PhoneFrame>
          <p className={`mt-4 text-center font-hand text-2xl ${style.muted}`}>{t.showcase.live}</p>
        </div>
      </div>
    </div>
  );
}
