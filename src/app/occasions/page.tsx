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
    <div className="min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6">
        <p className="font-bold uppercase tracking-[0.2em] text-hot">Occasions</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
          A card for <span className="font-serif font-normal italic text-hot">every</span> moment
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink/65">
          {OCCASIONS.length} occasions and {TEMPLATES.length} designs. The ones coming up soonest are first.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map(({ o, next }) => (
            <Link
              key={o}
              href={`/occasions/${o}`}
              className="group flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-5xl transition group-hover:scale-110">{occasions[o].emoji}</span>
              <span className="mt-4 font-display text-xl font-bold leading-tight">{occasions[o].label}</span>
              <span className="mt-1 text-sm text-ink/60">{occasions[o].tagline}</span>
              <span className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs font-bold">
                <span className="rounded-full bg-cream px-2.5 py-1 text-ink/70">{TEMPLATES.filter((t) => t.occasion === o).length} designs</span>
                {next && (
                  <span className="rounded-full bg-hot/10 px-2.5 py-1 text-hot" title={formatDay(next.date, next.approx)}>
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
