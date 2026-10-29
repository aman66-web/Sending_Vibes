"use client";

import { useI18n } from "@/i18n/client";
import { Flourish } from "@/components/card/ornaments";
import { Motif } from "@/components/card/motifs";
import type { Occasion } from "@/lib/card";
import { NEW_DESIGNS, type Template } from "@/lib/catalog";
import { themes } from "@/lib/themes";

// The line printed across the top of each card front. Card artwork is in English, like the cards.
const FRONT: Record<Occasion, string> = {
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

// The front of a card design, like a printed card: its colours, a printed border,
// a line drawing for the occasion and its headline.
export function ProductThumb({ template, className = "" }: { template: Template; className?: string }) {
  const theme = themes[template.theme];
  const { t } = useI18n();
  return (
    <div className={`relative aspect-[4/5] overflow-hidden ${className}`} style={{ background: theme.background, color: theme.text }} lang="en" dir="ltr">
      <div aria-hidden className="absolute inset-[6%] border" style={{ borderColor: theme.muted, opacity: 0.55 }} />
      <div aria-hidden className="absolute inset-[7.5%] border" style={{ borderColor: theme.muted, opacity: 0.3 }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[13%] text-center">
        <p className="text-[9px] font-semibold uppercase tracking-[0.28em]" style={{ color: theme.muted }}>
          {FRONT[template.occasion]}
        </p>
        <Motif occasion={template.occasion} className="my-4 h-12 w-12 transition duration-500 group-hover:scale-110" style={{ color: theme.accent }} />
        <p className="font-display text-[1.3rem] font-semibold italic leading-[1.15]">{template.headline}</p>
        <span className="mt-3" style={{ color: theme.muted }}>
          <Flourish className="w-20" />
        </span>
      </div>
      {NEW_DESIGNS.has(template.slug) && (
        <span className="absolute end-3 top-3 rotate-6 rounded-sm border-2 border-ink bg-sun px-2 py-0.5 font-sans text-[11px] font-black uppercase tracking-wide text-ink">{t.common.new}</span>
      )}
    </div>
  );
}
