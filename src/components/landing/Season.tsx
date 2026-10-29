import Link from "next/link";
import { LANGUAGES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { formatDay, whenLabel, type DatedOccasion } from "@/lib/calendar";
import { occasions } from "@/lib/templates";

type Upcoming = DatedOccasion & { days: number };

async function words(next: Upcoming) {
  const { locale, t } = await getI18n();
  const { tag } = LANGUAGES[locale];
  return {
    emoji: occasions[next.occasion].emoji,
    name: t.calendar[next.key],
    when: `${formatDay(next.date, tag, t, next.approx)} · ${whenLabel(next.days, t)}`,
    cta: t.home.seasonCta,
  };
}

// The next date worth sending for, in a strip across the top of a phone screen
// (where it takes the place of the scrolling occasions).
export async function SeasonBanner({ next }: { next: Upcoming }) {
  const w = await words(next);
  return (
    <Link href={`/occasions/${next.occasion}`} className="flex min-h-14 items-center gap-2.5 border-b-2 border-ink bg-ink px-4 py-2 text-cream sm:hidden">
      <span aria-hidden className="text-2xl leading-none">
        {w.emoji}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block font-brand text-lg font-bold">{w.name}</span>
        <span className="block text-sm font-semibold text-cream/75">{w.when}</span>
      </span>
      <span className="shrink-0 rounded-full bg-sun px-3 py-1.5 text-sm font-bold text-ink">{w.cta} →</span>
    </Link>
  );
}

// The same on bigger screens, as a label above the big heading.
export async function SeasonPill({ next, className = "" }: { next: Upcoming; className?: string }) {
  const w = await words(next);
  return (
    <Link
      href={`/occasions/${next.occasion}`}
      className={`inline-flex max-w-full items-center gap-2.5 rounded-full border-2 border-ink bg-paper py-1.5 pe-4 ps-2.5 text-start font-semibold shadow-[3px_3px_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:shadow-[4px_5px_0_var(--color-ink)] ${className}`}
    >
      <span aria-hidden className="text-2xl leading-none">
        {w.emoji}
      </span>
      <span className="min-w-0">
        <b className="font-brand">{w.name}</b> <span className="text-ink/65">· {w.when}</span>
      </span>
      <span className="shrink-0 font-bold text-hot">{w.cta} →</span>
    </Link>
  );
}
