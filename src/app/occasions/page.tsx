import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDay, nextDate, whenLabel } from "@/lib/calendar";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { occasions } from "@/lib/templates";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Interactive cards for every occasion · Sending Vibes",
  description: `Personalised interactive cards for ${OCCASIONS.length} occasions: Valentine's, birthdays, Diwali, Eid, Christmas, Halloween, weddings, new babies and more.`,
};

export default function OccasionsPage() {
  // Soonest first, then the ones without a fixed date.
  const sorted = [...OCCASIONS]
    .map((o) => ({ o, next: nextDate(o) }))
    .sort((a, b) => (a.next?.days ?? 9999) - (b.next?.days ?? 9999));
  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6">
        <h1 className="font-brand text-5xl font-bold leading-tight sm:text-6xl">Occasions</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink/65">
          {OCCASIONS.length} occasions and {TEMPLATES.length} designs. The ones coming up soonest are first.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map(({ o, next }) => (
            <Link
              key={o}
              href={`/occasions/${o}`}
              className="sheet group flex flex-col p-5 transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--color-ink)]"
            >
              <span className="text-5xl transition group-hover:scale-110">{occasions[o].emoji}</span>
              <span className="mt-4 font-brand text-xl font-bold leading-tight">{occasions[o].label}</span>
              <span className="mt-1 text-sm text-ink/60">{occasions[o].tagline}</span>
              <span className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs font-bold">
                <span className="rounded-full border-2 border-ink/15 px-2.5 py-0.5 text-ink/70">{TEMPLATES.filter((t) => t.occasion === o).length} designs</span>
                {next && (
                  <span className="rounded-full bg-hot px-2.5 py-1 text-white" title={formatDay(next.date, next.approx)}>
                    {whenLabel(next.days)}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
