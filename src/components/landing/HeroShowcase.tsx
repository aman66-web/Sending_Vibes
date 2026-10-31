"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { LaptopFrame } from "@/components/LaptopFrame";
import { AutoPlay } from "./AutoPlay";
import { PhoneFrame } from "@/components/PhoneFrame";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardData, Screen } from "@/lib/card";
import { buildTemplateDemo, templatesBySlug } from "@/lib/catalog";
import { themes } from "@/lib/themes";

const FALLBACK = "be-my-valentine";

// Phones get one real card at full size; bigger screens get the laptop and phone
// mock-up. Only the one on show is mounted, so a phone runs a single card.
const WIDE = "(min-width: 640px)";
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
// Unknown on the server: the phone card is drawn then (most visitors are on phones),
// and the mock-up's screens fill in once the browser knows it has the room.
function useWide() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => null);
}

type Question = Extract<Screen, { type: "question" }>;

// Where a card starts in the hero (its runaway question if it has one, otherwise its
// first game), and where it jumps while they type a name (a screen that shows the name).
function plan(card: CardData) {
  const question = card.screens.find((s): s is Question => s.type === "question");
  const start = question ?? card.screens.find((s) => s.type === "game");
  const named = question?.question.includes(card.to) ? question : card.screens.find((s) => s.type === "intro");
  return { start: start?.id, named: (named ?? start)?.id, no: question?.no };
}

// Until a card is running, its frame shows the card's own colours rather than a white flash.
function Blank({ card }: { card: CardData }) {
  return <div aria-hidden className="h-full w-full" style={{ background: themes[card.theme].background }} />;
}

// The hero's card, chosen by the season on the server: on phones a real card to play,
// on bigger screens a laptop and phone running real cards. Under it a "fill in the
// blanks" box that personalises the card as you type.
export function HeroShowcase({ slug, phoneSlug }: { slug: string; phoneSlug: string }) {
  const { t } = useI18n();
  const h = t.hero;
  const wide = useWide();
  const template = templatesBySlug[slug] ?? templatesBySlug[FALLBACK];
  const phoneTemplate = templatesBySlug[phoneSlug] ?? templatesBySlug[FALLBACK];
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  // Clicking into a name box brings the card back to a screen with the name on it;
  // every keystroke keeps the autoplay still so they can watch their name appear.
  const [jump, setJump] = useState(0);
  const [typing, setTyping] = useState(0);
  const startTyping = () => {
    setJump((n) => n + 1);
    setTyping((n) => n + 1);
  };
  const steps = useMemo(() => plan(buildTemplateDemo(template)), [template]);
  const card = useMemo(() => buildTemplateDemo(template, { to: to.trim(), from: from.trim() }), [template, to, from]);
  const phoneCard = useMemo(() => buildTemplateDemo(phoneTemplate), [phoneTemplate]);
  const phoneStart = useMemo(() => plan(phoneCard).start, [phoneCard]);
  const note = steps.no ? fmt(h.tryNo, { no: steps.no }) : h.tapIt;
  const focus = jump ? steps.named : steps.start;

  const params = new URLSearchParams({ template: template.slug });
  if (to.trim()) params.set("to", to.trim());
  if (from.trim()) params.set("from", from.trim());

  return (
    <div>
      {/* Phones: the card at its real size, so the words are as big as they'll be on theirs. */}
      <div className="sm:hidden">
        <div className="relative mx-auto w-full max-w-[300px]">
          <p aria-hidden className="absolute -top-4 end-3 z-10 rotate-3 rounded-md border-2 border-ink bg-sun px-2.5 font-hand text-xl leading-snug text-ink shadow-[2px_2px_0_var(--color-ink)]">
            {note}
          </p>
          <div role="region" aria-label={h.cardAria} className="sheet isolate h-[520px] overflow-hidden">
            {wide !== true && (
              <AutoPlay holdSignal={typing}>
                <CardPlayer card={card} preview bare focusScreenId={focus} focusNonce={jump} />
              </AutoPlay>
            )}
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-md text-center text-base leading-relaxed text-ink/75">{t.home.intro}</p>
      </div>

      {/* Bigger screens. Built at one design size (600×520) and scaled to fit each breakpoint. */}
      <div className="relative mx-auto hidden h-[468px] w-full sm:mt-10 sm:block lg:mt-0 lg:h-[375px] xl:h-[416px]">
        <div className="absolute left-1/2 top-0 h-[520px] w-[600px] origin-top -translate-x-1/2 scale-90 lg:scale-[0.72] xl:scale-[0.8]">
          <p className="absolute left-4 top-0 z-20 flex items-end gap-2 whitespace-nowrap font-hand text-[2.1rem] leading-none text-hot">
            {note}
            <svg width="54" height="44" viewBox="0 0 54 44" aria-hidden className="mb-[-26px] text-hot">
              <path d="M3 4 C 22 4 38 12 44 34" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M36 28 L44 36 L49 26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
          <div className="absolute left-0 top-14">
            {/* A slightly smaller virtual screen keeps the card legible at this size. */}
            <LaptopFrame screenWidth={760} screenHeight={475} scale={504 / 760}>
              {wide ? (
                <AutoPlay holdSignal={typing}>
                  <CardPlayer card={card} preview focusScreenId={focus} focusNonce={jump} />
                </AutoPlay>
              ) : (
                <Blank card={card} />
              )}
            </LaptopFrame>
          </div>
          <div className="absolute left-[438px] top-[150px] z-10 h-[307px] w-[150px] rotate-[5deg]">
            <div className="origin-top-left scale-[0.48]">
              <PhoneFrame>{wide ? <CardPlayer card={phoneCard} preview focusScreenId={phoneStart} /> : <Blank card={phoneCard} />}</PhoneFrame>
            </div>
          </div>
          <p className="absolute right-2 top-[472px] z-20 whitespace-nowrap font-hand text-[2.1rem] leading-none text-ink/70">{h.onPhone}</p>
        </div>
      </div>

      {/* Kept outside the scaled mockup so the inputs stay full size (and phones don't zoom in on them). */}
      <div className="sheet relative z-30 mx-auto mt-6 w-full max-w-sm -rotate-1 p-5 sm:-mt-6 lg:-mt-24 lg:ml-0 lg:w-[290px]">
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
              placeholder={template.demo.to}
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
              placeholder={template.demo.from}
              aria-label={h.yourName}
              className="w-full border-b-2 border-dashed border-ink/30 bg-transparent px-1 py-1 font-hand text-2xl leading-none outline-none placeholder:text-ink/25 focus:border-solid focus:border-hot"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {["/demo/sunset.jpg", "/demo/coffee.jpg", "/demo/lights.jpg"].map((src, i) => (
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
