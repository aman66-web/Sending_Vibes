"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { LaptopFrame } from "@/components/LaptopFrame";
import { AutoPlay } from "./AutoPlay";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useI18n } from "@/i18n/client";
import { buildTemplateDemo, templatesBySlug } from "@/lib/catalog";
import { buildDemo } from "@/lib/templates";

const LAPTOP_TEMPLATE = "be-my-valentine";

// The hero's right-hand side: a laptop and a phone running real cards, plus a
// "fill in the blanks" box that personalises the laptop card as you type.
export function HeroShowcase() {
  const { t } = useI18n();
  const h = t.hero;
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  // Clicking into a name box brings the laptop back to the question; every
  // keystroke keeps the autoplay still so they can watch their name appear.
  const [jump, setJump] = useState(0);
  const [typing, setTyping] = useState(0);
  const startTyping = () => {
    setJump((n) => n + 1);
    setTyping((n) => n + 1);
  };
  const laptopCard = useMemo(() => buildTemplateDemo(templatesBySlug[LAPTOP_TEMPLATE], { to: to.trim(), from: from.trim() }), [to, from]);
  const phoneCard = useMemo(() => buildDemo("diwali"), []);

  const params = new URLSearchParams({ template: LAPTOP_TEMPLATE });
  if (to.trim()) params.set("to", to.trim());
  if (from.trim()) params.set("from", from.trim());

  return (
    <div>
      {/* Built at one design size (600×520) and scaled to fit each breakpoint. */}
      <div className="relative mx-auto mt-6 h-[312px] w-full sm:mt-10 sm:h-[468px] lg:mt-0 lg:h-[375px] xl:h-[416px]">
        <div className="absolute left-1/2 top-0 h-[520px] w-[600px] origin-top -translate-x-1/2 scale-[0.6] sm:scale-90 lg:scale-[0.72] xl:scale-[0.8]">
          <p className="absolute left-4 top-0 z-20 flex items-end gap-2 whitespace-nowrap font-hand text-[2.1rem] leading-none text-hot">
            {h.tryNo}
            <svg width="54" height="44" viewBox="0 0 54 44" aria-hidden className="mb-[-26px] text-hot">
              <path d="M3 4 C 22 4 38 12 44 34" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M36 28 L44 36 L49 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
          <div className="absolute left-0 top-14">
            {/* A slightly smaller virtual screen keeps the card legible at this size. */}
            <LaptopFrame screenWidth={760} screenHeight={475} scale={504 / 760}>
              <AutoPlay holdSignal={typing}>
                <CardPlayer card={laptopCard} preview focusScreenId="question" focusNonce={jump} />
              </AutoPlay>
            </LaptopFrame>
          </div>
          <div className="absolute left-[438px] top-[150px] z-10 h-[307px] w-[150px] rotate-[5deg]">
            <div className="origin-top-left scale-[0.48]">
              <PhoneFrame>
                <CardPlayer card={phoneCard} preview focusScreenId="game" />
              </PhoneFrame>
            </div>
          </div>
          <p className="absolute right-2 top-[472px] z-20 whitespace-nowrap font-hand text-[2.1rem] leading-none text-ink/70">{h.onPhone}</p>
        </div>
      </div>

      {/* Kept outside the scaled mockup so the inputs stay full size (and phones don't zoom in on them). */}
      <div className="sheet relative z-30 mx-auto -mt-2 w-full max-w-sm -rotate-1 p-5 sm:-mt-6 lg:-mt-24 lg:ml-0 lg:w-[290px]">
        <div className="flex items-baseline justify-between">
          <p className="font-brand text-xl font-bold">{h.boxTitle}</p>
          <span className="font-hand text-xl text-hot">{h.tryIt}</span>
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-baseline gap-2">
            <span className="w-12 shrink-0 font-brand text-sm font-semibold text-ink/60">{h.to}</span>
            <input
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setTyping((n) => n + 1);
              }}
              onFocus={startTyping}
              maxLength={40}
              placeholder="Priya"
              aria-label={h.theirName}
              className="w-full border-b-2 border-dashed border-ink/30 bg-transparent px-1 py-1 font-hand text-2xl leading-none outline-none placeholder:text-ink/25 focus:border-solid focus:border-hot"
            />
          </label>
          <label className="flex items-baseline gap-2">
            <span className="w-12 shrink-0 font-brand text-sm font-semibold text-ink/60">{h.from}</span>
            <input
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setTyping((n) => n + 1);
              }}
              onFocus={startTyping}
              maxLength={40}
              placeholder="Sam"
              aria-label={h.yourName}
              className="w-full border-b-2 border-dashed border-ink/30 bg-transparent px-1 py-1 font-hand text-2xl leading-none outline-none placeholder:text-ink/25 focus:border-solid focus:border-hot"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {["/demo/sunset.svg", "/demo/coffee.svg", "/demo/lights.svg"].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- decorative sample photos
            <img key={src} src={src} alt="" className="h-10 w-10 bg-white object-cover p-0.5 shadow-sm ring-1 ring-ink/15" style={{ rotate: `${(i - 1) * 6}deg` }} />
          ))}
          <span className="grid h-10 w-10 place-items-center border-2 border-dashed border-ink/25 text-ink/40">+</span>
          <span className="ms-auto text-xs font-semibold text-ink/50">{h.yourPhotos}</span>
        </div>
        <p className="mt-3 text-sm text-ink/60">{to.trim() ? h.hintTyped : h.hintEmpty}</p>
        <Link href={`/create?${params.toString()}`} className="btn btn-ink mt-3 w-full py-2.5">
          {h.finish}
        </Link>
      </div>
    </div>
  );
}
