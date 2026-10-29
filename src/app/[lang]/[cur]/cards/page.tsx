import type { Metadata } from "next";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TEMPLATES } from "@/lib/catalog";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

// The same page for everyone, served from the CDN (the filters in the address are read in
// the browser). Made again hourly so what's coming up stays current.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.cardsPage.metaTitle, description: fmt(t.cardsPage.metaDescription, { n: TEMPLATES.length }) };
}

export default async function CardsPage() {
  const { t } = await getI18n();
  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pt-14">
        <h1 className="font-brand text-5xl font-bold leading-tight sm:text-6xl">{t.cardsPage.title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink/65">
          {fmt(t.cardsPage.intro, { n: TEMPLATES.length })}
        </p>
      </section>
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <CatalogGrid allFilters fromUrl />
      </main>
      <SiteFooter />
    </div>
  );
}
