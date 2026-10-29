import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/catalog/ProductTile";
import { ProductView } from "@/components/catalog/ProductView";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustStrip } from "@/components/TrustStrip";
import { TEMPLATES, getTemplate } from "@/lib/catalog";
import { plainAmount, tierPrice } from "@/lib/pricing";
import { absolute, breadcrumbs, seller } from "@/lib/structured-data";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTemplate((await params).slug);
  if (!t) return {};
  const { t: d } = await getI18n();
  const occasion = d.occasions[t.occasion].label;
  return {
    title: fmt(d.product.metaTitle, { name: t.name, occasion }),
    description: `${t.blurb} ${fmt(d.product.metaSuffix, { occasion })}`,
    alternates: { canonical: `/cards/${t.slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const t = getTemplate((await params).slug);
  if (!t) notFound();
  const related = TEMPLATES.filter((x) => x.occasion === t.occasion && x.slug !== t.slug).slice(0, 4);
  const more = related.length ? related : TEMPLATES.filter((x) => x.featured && x.slug !== t.slug).slice(0, 4);
  const { t: d, currency } = await getI18n();
  const occasionLabel = d.occasions[t.occasion].label;

  // Lets search engines show the price, picture and description with the result. The price
  // is in the currency this copy of the page is in. A card is digital, so it's always in stock.
  const url = absolute(`/cards/${t.slug}`);
  const productJson = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fmt(d.product.schemaName, { name: t.name, occasion: occasionLabel }),
    description: t.blurb,
    url,
    image: absolute(`/cards/${t.slug}/opengraph-image`),
    sku: t.slug,
    category: "Interactive e-cards",
    brand: { "@type": "Brand", name: "Envelette" },
    offers: {
      "@type": "Offer",
      url,
      price: plainAmount(tierPrice("premade", currency), currency),
      priceCurrency: currency.toUpperCase(),
      availability: "https://schema.org/InStock",
      seller: seller(),
    },
  };
  const trail = breadcrumbs([{ name: d.common.allCards, path: "/cards" }, { name: occasionLabel, path: `/occasions/${t.occasion}` }, { name: t.name }]);

  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <JsonLd data={productJson} />
      <JsonLd data={trail} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <nav className="mb-4 flex flex-wrap items-center text-sm font-semibold text-ink/50">
          <Link href="/cards" className="inline-flex min-h-11 items-center hover:text-ink">
            {d.common.allCards}
          </Link>
          <span aria-hidden className="mx-2">/</span>
          <Link href={`/occasions/${t.occasion}`} className="inline-flex min-h-11 items-center hover:text-ink">
            {occasionLabel}
          </Link>
          <span aria-hidden className="mx-2">/</span>
          <span className="text-ink">{t.name}</span>
        </nav>
        <ProductView slug={t.slug} />
        <TrustStrip className="mt-14 rounded-2xl border-2 border-dashed border-ink/25 p-6 sm:p-8" />

        <section className="mt-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-brand text-3xl font-bold">
              {related.length ? fmt(d.product.more, { occasion: occasionLabel }) : d.product.alsoLike}
            </h2>
            <Link href="/cards" className="shrink-0 text-sm font-bold underline decoration-hot decoration-2 underline-offset-4">
              {d.common.seeAll}
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 md:grid-cols-4">
            {more.map((x) => (
              <ProductTile key={x.slug} slug={x.slug} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
