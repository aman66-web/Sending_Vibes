import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/catalog/ProductTile";
import { ProductView } from "@/components/catalog/ProductView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TEMPLATES, getTemplate } from "@/lib/catalog";
import { PRICES } from "@/lib/pricing";
import { occasions } from "@/lib/templates";
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
  return { title: fmt(d.product.metaTitle, { name: t.name, occasion: d.occasions[t.occasion].label }), description: t.blurb };
}

export default async function ProductPage({ params }: Props) {
  const t = getTemplate((await params).slug);
  if (!t) notFound();
  const related = TEMPLATES.filter((x) => x.occasion === t.occasion && x.slug !== t.slug).slice(0, 4);
  const more = related.length ? related : TEMPLATES.filter((x) => x.featured && x.slug !== t.slug).slice(0, 4);
  const { t: d } = await getI18n();
  const occasionLabel = d.occasions[t.occasion].label;

  // Lets search engines show the price and description with the result.
  const productJson = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${t.name}: interactive ${occasions[t.occasion].label} card`,
    description: t.blurb,
    brand: { "@type": "Brand", name: "Sending Vibes" },
    offers: { "@type": "Offer", price: (PRICES.card.pence / 100).toFixed(2), priceCurrency: "GBP", availability: "https://schema.org/InStock" },
  };

  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJson).replace(/</g, "\\u003c") }} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm font-semibold text-ink/50">
          <Link href="/cards" className="hover:text-ink">{d.common.allCards}</Link>
          <span className="mx-2">/</span>
          <Link href={`/occasions/${t.occasion}`} className="hover:text-ink">{occasionLabel}</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{t.name}</span>
        </nav>
        <ProductView slug={t.slug} />

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
