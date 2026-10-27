import type { Metadata } from "next";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "All cards · Sending Vibes",
  description: `${TEMPLATES.length} personalised interactive card designs for Valentine's, birthdays, Diwali, Christmas, Eid, Halloween, weddings, new babies and more.`,
};

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ occasion?: string }> }) {
  const { occasion } = await searchParams;
  const initial = OCCASIONS.find((o) => o === occasion) as Occasion | undefined;
  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pt-14">
        <h1 className="font-brand text-5xl font-bold leading-tight sm:text-6xl">All the cards</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink/65">
          {TEMPLATES.length} designs. Each one plays itself as you scroll past. Open one to try it with your names, then make it yours.
        </p>
      </section>
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <CatalogGrid allFilters initialOccasion={initial} />
      </main>
      <SiteFooter />
    </div>
  );
}
