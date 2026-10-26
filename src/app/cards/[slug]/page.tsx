import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/catalog/ProductTile";
import { ProductView } from "@/components/catalog/ProductView";
import { SiteHeader } from "@/components/SiteHeader";
import { TEMPLATES, getTemplate } from "@/lib/catalog";
import { occasions } from "@/lib/templates";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTemplate((await params).slug);
  if (!t) return {};
  return { title: `${t.name} · ${occasions[t.occasion].label} card · Sending Vibes`, description: t.blurb };
}

export default async function ProductPage({ params }: Props) {
  const t = getTemplate((await params).slug);
  if (!t) notFound();
  const related = TEMPLATES.filter((x) => x.occasion === t.occasion && x.slug !== t.slug).slice(0, 4);
  const more = related.length ? related : TEMPLATES.filter((x) => x.featured && x.slug !== t.slug).slice(0, 4);

  return (
    <div className="min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm font-semibold text-ink/50">
          <Link href="/cards" className="hover:text-ink">All cards</Link>
          <span className="mx-2">/</span>
          <Link href={`/cards?occasion=${t.occasion}`} className="hover:text-ink">{occasions[t.occasion].label}</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{t.name}</span>
        </nav>
        <ProductView slug={t.slug} />

        <section className="mt-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold">
              {related.length ? `More ${occasions[t.occasion].label} cards` : "You might also like"}
            </h2>
            <Link href="/cards" className="shrink-0 text-sm font-bold text-hot">
              See all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-4">
            {more.map((x) => (
              <ProductTile key={x.slug} template={x} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
