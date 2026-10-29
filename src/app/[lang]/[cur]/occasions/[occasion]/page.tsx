import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/catalog/ProductTile";
import { CopyButton } from "@/components/CopyButton";
import { JsonLd } from "@/components/JsonLd";
import { RichText } from "@/components/RichText";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fmt, LANGUAGES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { MAX_SCHEDULE_DAYS } from "@/lib/basket";
import { formatDay, nextDate, whenLabel } from "@/lib/calendar";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { occasionSeo, whenFaq } from "@/lib/occasion-seo";
import { price } from "@/lib/pricing";
import { breadcrumbs, faqPage } from "@/lib/structured-data";
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
  const seo = occasionSeo(t, o);
  return {
    title: seo?.title ?? fmt(t.occasionPage.metaTitle, { label }),
    description: seo?.description ?? `${t.occasions[o].intro} ${t.occasionPage.metaSuffix}`,
    alternates: { canonical: `/occasions/${o}` },
  };
}

// A heading with its **marked** words in red.
function Marked({ text }: { text: string }) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? <span key={i} className="text-hot">{part}</span> : part));
}

export default async function OccasionPage({ params }: Props) {
  const o = find((await params).occasion);
  if (!o) notFound();
  const { locale, currency, t } = await getI18n();
  const { tag } = LANGUAGES[locale];
  const info = { ...occasions[o], ...t.occasions[o] };
  const p = t.occasionPage;
  const seo = occasionSeo(t, o);
  const designs = TEMPLATES.filter((t) => t.occasion === o);
  const next = nextDate(o);
  const values = { price: price("card", currency), days: MAX_SCHEDULE_DAYS, n: designs.length };
  const make = fmt(p.make, { label: info.label, price: values.price });
  const when = whenFaq(t, o, tag);
  const faqs = [...(when ? [when] : []), ...(seo?.faqs ?? p.faqs)].map((f) => ({ q: f.q, a: fmt(f.a, values) }));

  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <JsonLd data={breadcrumbs([{ name: t.common.allCards, path: "/cards" }, { name: info.label }])} />
      <JsonLd data={faqPage(faqs)} />
      <SiteHeader />
      <section className="relative">
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
          <nav className="flex flex-wrap items-center text-sm font-semibold text-ink/50">
            <Link href="/cards" className="inline-flex min-h-11 items-center hover:text-ink">
              {t.common.allCards}
            </Link>
            <span aria-hidden className="mx-2">/</span>
            <span className="text-ink">{info.label}</span>
          </nav>
          <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="text-6xl">{info.emoji}</span>
              <h1 className="mt-3 hyphens-auto break-words font-brand text-5xl font-bold leading-[1.05] sm:text-6xl">
                <Marked text={seo?.heading ?? p.title.replace("{label}", `**${info.label}**`)} />
              </h1>
              <p className="mt-4 text-lg text-ink/65">{info.intro}</p>
              {next && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-bold">
                  📅 {fmt(p.next, { name: t.calendar[next.key], date: formatDay(next.date, tag, t, next.approx) })} · <span className="text-hot">{whenLabel(next.days, t)}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <Link href={`/create?occasion=${o}`} className="btn btn-red px-7 py-3.5 text-lg">
                {make}
              </Link>
              <a href="#designs" className="btn btn-paper px-7 py-3.5 text-lg">
                {fmt(p.see, { n: designs.length })}
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

        {seo && (
          <section className="mt-24 grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-14">
            <h2 className="font-brand text-3xl font-bold leading-tight sm:text-4xl">{seo.aboutTitle}</h2>
            <div className="space-y-4 text-lg leading-relaxed text-ink/75">
              {seo.about.map((para) => (
                <p key={para}>
                  <RichText text={fmt(para, values)} />
                </p>
              ))}
            </div>
          </section>
        )}

        {seo && seo.ideas.length > 0 && (
          <section className="mt-24">
            <h2 className="font-brand text-3xl font-bold leading-tight sm:text-4xl">{seo.writeTitle}</h2>
            <p className="mt-3 max-w-2xl text-lg text-ink/65">{p.writeIntro}</p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {seo.ideas.map((idea) => (
                <li key={idea.text} className="sheet flex flex-col p-6">
                  <p className="text-sm font-bold text-hot">{idea.who}</p>
                  <p className="mt-2 flex-1 font-brand text-xl leading-snug">{idea.text}</p>
                  <CopyButton text={idea.text} label={p.copy} done={p.copied} aria={fmt(p.copyAria, { who: idea.who })} className="mt-5 self-start" />
                </li>
              ))}
            </ul>
            <Link href={`/create?occasion=${o}`} className="btn btn-red mt-10 px-7 py-3.5 text-lg">
              {make}
            </Link>
          </section>
        )}

        <section className="mt-24 grid gap-5 md:grid-cols-3">
          {p.features.map((f, i) => (
            <div key={f.title} className="sheet p-6">
              <span className="text-3xl">{["✏️", "🎮", "🔗"][i]}</span>
              <h2 className="mt-3 font-brand text-xl font-bold">{f.title}</h2>
              <p className="mt-1 text-ink/65">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 max-w-3xl">
          <h2 className="font-brand text-3xl font-bold leading-tight sm:text-4xl">{seo?.faqTitle ?? p.faqTitle}</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border-2 border-ink bg-paper p-5 shadow-[3px_3px_0_var(--color-ink)] open:shadow-[5px_5px_0_var(--color-hot)]">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-brand text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink font-sans text-xl font-bold leading-none transition group-open:rotate-45 group-open:bg-hot group-open:text-white">+</span>
                </summary>
                <div className="mt-3 leading-relaxed text-ink/70">
                  <RichText text={f.a} />
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <h2 className="font-brand text-3xl font-bold">{p.more}</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {OCCASIONS.filter((x) => x !== o).map((x) => (
              <Link
                key={x}
                href={`/occasions/${x}`}
                className="inline-flex min-h-11 items-center rounded-full border-2 border-ink/15 bg-paper px-4 py-1.5 text-sm font-bold text-ink/75 transition hover:border-ink hover:text-ink"
              >
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
