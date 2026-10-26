"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { LaptopFrame } from "@/components/LaptopFrame";
import { PhoneFrame } from "@/components/PhoneFrame";
import { buildTemplateDemo, templatesBySlug } from "@/lib/catalog";
import { buildDemo } from "@/lib/templates";

const LAPTOP_TEMPLATE = "be-my-valentine";

// The hero's right-hand side: a laptop and a phone running real cards, plus a
// "fill in the blanks" box that personalises the laptop card as you type.
export function HeroShowcase() {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const laptopCard = useMemo(() => buildTemplateDemo(templatesBySlug[LAPTOP_TEMPLATE], { to: to.trim(), from: from.trim() }), [to, from]);
  const phoneCard = useMemo(() => buildDemo("diwali"), []);

  const params = new URLSearchParams({ template: LAPTOP_TEMPLATE });
  if (to.trim()) params.set("to", to.trim());
  if (from.trim()) params.set("from", from.trim());

  return (
    <div>
      {/* Built at one design size (600×520) and scaled to fit each breakpoint. */}
      <div className="relative mx-auto mt-6 h-[312px] w-full sm:mt-10 sm:h-[468px] lg:mt-0 lg:h-[375px] xl:h-[416px]">
        <div aria-hidden className="absolute inset-x-6 top-10 h-3/4 rounded-full bg-gradient-to-br from-hot/40 via-tangerine/30 to-grape/30 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-[520px] w-[600px] origin-top -translate-x-1/2 scale-[0.6] sm:scale-90 lg:scale-[0.72] xl:scale-[0.8]">
          <span className="absolute left-3 top-0 z-20 whitespace-nowrap rounded-full bg-ink px-5 py-2.5 font-display text-xl font-semibold text-white shadow-xl">
            💻 On a laptop · try pressing No
          </span>
          <div className="absolute left-0 top-14">
            {/* A slightly smaller virtual screen keeps the card legible at this size. */}
            <LaptopFrame screenWidth={760} screenHeight={475} scale={504 / 760}>
              <CardPlayer card={laptopCard} preview focusScreenId="question" />
            </LaptopFrame>
          </div>
          <div className="absolute left-[438px] top-[150px] z-10 h-[307px] w-[150px] rotate-[5deg]">
            <div className="origin-top-left scale-[0.48]">
              <PhoneFrame>
                <CardPlayer card={phoneCard} preview focusScreenId="game" />
              </PhoneFrame>
            </div>
          </div>
          <span className="absolute right-0 top-[470px] z-20 whitespace-nowrap rounded-full bg-white px-5 py-2.5 font-display text-xl font-semibold text-ink shadow-xl">
            📱 On a phone
          </span>
        </div>
      </div>

      {/* Kept outside the scaled mockup so the inputs stay full size (and phones don't zoom in on them). */}
      <div className="relative z-30 mx-auto -mt-2 w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-ink/5 sm:-mt-6 lg:-mt-24 lg:ml-0 lg:w-[280px]">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold">✏️ Fill in the blanks</p>
          <span className="rounded-full bg-hot/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-hot">Try it</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="text-xs font-bold text-ink/50">Their name</span>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              maxLength={40}
              placeholder="Priya"
              className="mt-1 w-full rounded-xl bg-cream px-3 py-2 text-base font-semibold outline-none ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-hot"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-ink/50">Your name</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              maxLength={40}
              placeholder="Sam"
              className="mt-1 w-full rounded-xl bg-cream px-3 py-2 text-base font-semibold outline-none ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-hot"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {["/demo/sunset.svg", "/demo/coffee.svg", "/demo/lights.svg"].map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- decorative sample photos
            <img key={src} src={src} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-ink/5" />
          ))}
          <span className="grid h-10 w-10 place-items-center rounded-lg border-2 border-dashed border-ink/15 text-ink/30">+</span>
          <span className="ml-auto text-xs font-bold text-ink/50">Your photos</span>
        </div>
        <p className="mt-3 text-sm text-ink/60">{to.trim() ? "See? The card on the laptop just changed. That's all it takes." : "Type a name and watch the card on the laptop change."}</p>
        <Link
          href={`/create?${params.toString()}`}
          className="mt-3 flex items-center justify-center gap-2 rounded-full bg-ink py-3 font-display font-semibold text-white transition hover:bg-hot"
        >
          Finish this card →
        </Link>
      </div>
    </div>
  );
}
