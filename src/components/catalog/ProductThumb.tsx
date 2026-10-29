"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/client";
import { Flourish } from "@/components/card/ornaments";
import { Motif } from "@/components/card/motifs";
import type { Font, Occasion } from "@/lib/card";
import { NEW_DESIGNS, type Template } from "@/lib/catalog";
import { FONT_VARS, screenLook } from "@/lib/screen-style";
import { themes } from "@/lib/themes";

// The line printed across the top of each card front. Card artwork is in English, like the cards.
export const FRONT: Record<Occasion, string> = {
  valentine: "Happy Valentine's Day",
  birthday: "Happy Birthday",
  diwali: "Happy Diwali",
  christmas: "Merry Christmas",
  eid: "Eid Mubarak",
  anniversary: "Happy Anniversary",
  sorry: "I'm Sorry",
  thanks: "Thank You",
  congrats: "Congratulations",
  halloween: "Happy Halloween",
  newyear: "Happy New Year",
  mothersday: "Happy Mother's Day",
  fathersday: "Happy Father's Day",
  rakhi: "Happy Raksha Bandhan",
  holi: "Happy Holi",
  newbaby: "Welcome, Little One",
  wedding: "Happily Ever After",
  getwell: "Get Well Soon",
  missyou: "Missing You",
  friendship: "For My Best Friend",
  leaving: "Good Luck",
  graduation: "Congratulations, Graduate",
  retirement: "Happy Retirement",
  newhome: "Happy New Home",
};

// The headline's size in each font, so a wide typewriter or a small handwriting fill
// the front about as much as the usual serif does.
const HEADLINE_SIZE: Record<Font, string> = {
  classic: "1.3rem",
  modern: "1.2rem",
  handwritten: "1.6rem",
  storybook: "1.25rem",
  script: "1.5rem",
  rounded: "1.25rem",
  bold: "1.2rem",
  typewriter: "1.1rem",
  marker: "1.15rem",
  spooky: "1.35rem",
};

// The front of a card design, like a printed card: a printed border, a line drawing
// for the occasion and its headline. Its colours, pattern, fonts and stickers come
// from the design's first screen (the envelope), so designs for the same occasion
// look different from each other.
export function ProductThumb({ template, className = "" }: { template: Template; className?: string }) {
  const { t } = useI18n();
  const style = useMemo(() => template.screens(template.demo.to, template.demo.from)[0]?.style, [template]);
  const { theme, pattern } = screenLook(themes[template.theme], style);
  const heading = style?.heading ?? "classic";
  const body = style?.body && style.body !== "modern" ? `var(${FONT_VARS[style.body]})` : undefined;
  // A few of its stickers, never in the top right where the "New" badge goes.
  const stickers = (style?.stickers ?? []).filter((s) => !(s.x > 70 && s.y < 25)).slice(0, 3);
  return (
    <div
      className={`@container relative aspect-[4/5] overflow-hidden ${className}`}
      style={{ background: theme.background, color: theme.text, fontSynthesis: style?.heading || style?.body ? "none" : undefined }}
      lang="en"
      dir="ltr"
    >
      {pattern && <div aria-hidden className="absolute inset-0" style={{ backgroundImage: pattern.image, backgroundSize: pattern.size }} />}
      <div aria-hidden className="absolute inset-[6%] border" style={{ borderColor: theme.muted, opacity: 0.55 }} />
      <div aria-hidden className="absolute inset-[7.5%] border" style={{ borderColor: theme.muted, opacity: 0.3 }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[13%] text-center">
        <p className="text-[9px] font-semibold uppercase tracking-[0.28em]" style={{ color: theme.muted, fontFamily: body }}>
          {FRONT[template.occasion]}
        </p>
        <Motif occasion={template.occasion} className="my-4 h-12 w-12 transition duration-500 group-hover:scale-110" style={{ color: theme.accent }} />
        <p
          className={`font-display font-semibold leading-[1.15] ${heading === "classic" ? "italic" : ""}`}
          style={{ fontSize: HEADLINE_SIZE[heading], fontFamily: heading === "classic" ? undefined : `var(${FONT_VARS[heading]})` }}
        >
          {template.headline}
        </p>
        <span className="mt-3" style={{ color: theme.muted }}>
          <Flourish className="w-20" />
        </span>
      </div>
      {stickers.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute leading-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, translate: "-50% -50%", rotate: `${s.rotate ?? 0}deg`, fontSize: `${s.size * 0.9}cqw` }}
        >
          {s.emoji}
        </span>
      ))}
      {NEW_DESIGNS.has(template.slug) && (
        <span className="absolute end-3 top-3 rotate-6 rounded-sm border-2 border-ink bg-sun px-2 py-0.5 font-sans text-[11px] font-black uppercase tracking-wide text-ink">{t.common.new}</span>
      )}
    </div>
  );
}
