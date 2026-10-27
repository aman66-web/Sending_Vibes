import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/catalog/ProductTile";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt, LANGUAGES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { formatDay, nextDate, whenLabel } from "@/lib/calendar";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { price } from "@/lib/pricing";
import { occasions } from "@/lib/templates";

// Refreshed hourly so "in 5 days" stays true.
export const revalidate = 3600;

type Props = { params: Promise<{ occasion: string }> };

function find(slug: string) {
  return OCCASIONS.find((o) => o === slug);
}

export function generateStaticParams() {
  return OCCASIONS.map((occasion) => ({ occasion }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = find((await params).occasion);
  if (!o) return {};
  const { t } = await getI18n();
  const label = t.occasions[o].label;
  return {
    title: fmt(t.occasionPage.metaTitle, { label }),
    description: `${t.occasions[o].intro} ${t.occasionPage.metaSuffix}`,
    alternates: { canonical: `/occasions/${o}` },
  };
}

export default async function OccasionPage({ params }: Props) {
  const o = find((await params).occasion);
  if (!o) notFound();
  const { locale, currency, t } = await getI18n();
  const { tag } = LANGUAGES[locale];
  const info = { ...occasions[o], ...t.occasions[o] };
  const [titleBefore, titleAfter] = t.occasionPage.title.split("{label}");
  const designs = TEMPLATES.filter((t) => t.occasion === o);
  const next = nextDate(o);

  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <section className="relative">
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <nav className="text-sm font-semibold text-ink/50">
            <Link href="/cards" className="hover:text-ink">{t.common.allCards}</Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{info.label}</span>
          </nav>
          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="text-6xl">{info.emoji}</span>
              <h1 className="mt-3 font-brand text-5xl font-bold leading-[1.05] sm:text-6xl">
                {titleBefore}
                <span className="text-hot">{info.label}</span>
                {titleAfter}
              </h1>
              <p className="mt-4 text-lg text-ink/65">{info.intro}</p>
              {next && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-bold">
                  📅 {fmt(t.occasionPage.next, { name: t.calendar[next.key], date: formatDay(next.date, tag, t, next.approx) })} · <span className="text-hot">{whenLabel(next.days, t)}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <Link
                href={`/create?occasion=${o}`}
                className="btn btn-red px-7 py-3.5 text-lg"
              >
                {fmt(t.occasionPage.make, { label: info.label, price: price("card", currency) })}
              </Link>
              <a href="#designs" className="btn btn-paper px-7 py-3.5 text-lg">
                {fmt(t.occasionPage.see, { n: designs.length })}
              </a>
            </div>
          </div>
        </div>
      </section>

      <main id="designs" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 md:grid-cols-3 lg:grid-cols-4">
          {designs.map((x) => (
            <ProductTile key={x.slug} slug={x.slug} />
          ))}
        </div>

        <section className="mt-20 grid gap-5 md:grid-cols-3">
          {t.occasionPage.features.map((f, i) => (
            <div key={f.title} className="sheet p-6">
              <span className="text-3xl">{["✏️", "🎮", "🔗"][i]}</span>
              <h2 className="mt-3 font-brand text-xl font-bold">{f.title}</h2>
              <p className="mt-1 text-ink/65">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20">
          <h2 className="font-brand text-3xl font-bold">{t.occasionPage.more}</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {OCCASIONS.filter((x) => x !== o).map((x) => (
              <Link key={x} href={`/occasions/${x}`} className="rounded-full border-2 border-ink/15 bg-paper px-4 py-1.5 text-sm font-bold text-ink/75 transition hover:border-ink hover:text-ink">
                {occasions[x].emoji} {t.occasions[x].label}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
