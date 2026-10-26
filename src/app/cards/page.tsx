import type { Metadata } from "next";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { SiteHeader } from "@/components/SiteHeader";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "All cards · Sending Vibes",
  description: `${TEMPLATES.length} interactive card designs for Valentine's, birthdays, Diwali, Christmas, Eid, anniversaries and more.`,
};

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ occasion?: string }> }) {
  const { occasion } = await searchParams;
  const initial = OCCASIONS.find((o) => o === occasion) as Occasion | undefined;
  return (
    <div className="min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-hot/15 blur-3xl" />
          <div className="absolute -right-40 top-0 h-[26rem] w-[26rem] rounded-full bg-tangerine/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6">
          <p className="font-bold uppercase tracking-[0.2em] text-hot">The collection</p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
            Find the <span className="font-serif font-normal italic text-hot">perfect</span> card
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-ink/65">
            {TEMPLATES.length} interactive designs. Hover over any card and hit play to see it in action, then make it yours.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <CatalogGrid allFilters initialOccasion={initial} />
      </main>
    </div>
  );
}
