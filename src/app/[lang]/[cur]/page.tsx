import Link from "next/link";
import { Particles } from "@/components/card/effects";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { OccasionShowcase } from "@/components/landing/OccasionShowcase";
import { SHOWCASE, type ShowcaseOccasion } from "@/components/landing/showcase";
import { ComingUp } from "@/components/landing/ComingUp";
import { MusicDemo } from "@/components/landing/MusicDemo";
import { AiPromptDemo, RunawayDemo, TypewriterLoop, WheelDemo } from "@/components/landing/widgets";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { RichText } from "@/components/RichText";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TwoWays } from "@/components/TwoWays";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { occasions } from "@/lib/templates";
import { nextDate } from "@/lib/calendar";
import { price as priceOf } from "@/lib/pricing";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

// Re-rendered hourly so the "coming up" dates stay current.
export const revalidate = 3600;

// Showcase tabs, soonest occasion first.
function showcaseOrder(): ShowcaseOccasion[] {
  return [...SHOWCASE].sort((a, b) => (nextDate(a)?.days ?? 999) - (nextDate(b)?.days ?? 999));
}

export default async function Home() {
  const { t, currency } = await getI18n();
  const h = t.home;
  const n = TEMPLATES.length;
  const o = OCCASIONS.length;
  const price = priceOf("card", currency);
  const aiPrice = priceOf("custom", currency);
  const TIERS = [
    { name: h.tierCard, price, points: [...h.tierCardPoints.map((p) => fmt(p, { n })), t.common.worldwideShort], href: "/create?start=premade", featured: false },
    { name: h.tierAi, price: aiPrice, points: h.tierAiPoints.map((p) => fmt(p, { price })), href: "/create?start=custom", featured: true },
  ];
  return (
    <div className="grain overflow-x-clip bg-cream text-ink">
      <SiteHeader />

      {/* Every occasion, scrolling past under the header. Hover to pause; each one links to its page. */}
      <div className="group relative overflow-hidden border-b-2 border-ink bg-ink py-3 text-cream [contain:paint]">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-brand text-lg font-semibold will-change-transform [backface-visibility:hidden] group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:text-xl">
          {[...OCCASIONS, ...OCCASIONS].map((occ, i) => (
            <Link
              key={i}
              href={`/occasions/${occ}`}
              tabIndex={i < OCCASIONS.length ? 0 : -1}
              aria-hidden={i >= OCCASIONS.length}
              className="flex items-center gap-2.5 transition hover:text-sun"
            >
              <span>{occasions[occ].emoji}</span>
              {t.occasions[occ].label}
              <span className="ms-5 text-hot">✶</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Hero: says what we do in one glance, then shows it. */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pt-14">
          <div className="text-center lg:text-left">
            <p className="font-hand text-2xl text-ink/70 sm:text-3xl">{h.eyebrow}</p>
            <h1 className="mt-2 font-brand text-[clamp(2.9rem,6.6vw,5.1rem)] font-black leading-[0.95] tracking-tight">
              <span className="text-hot">{h.h1a}</span>
              <br />
              {h.h1b}{" "}
              <span className="relative inline-block">
                {h.h1c}
                <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-3 w-full text-sun sm:-bottom-2 sm:h-4">
                  <path d="M4 13 C 55 3, 130 3, 196 11" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ink/75 sm:text-xl lg:mx-0">
              {h.intro}
            </p>
            <p className="mt-8 text-sm font-bold uppercase tracking-wide text-ink/55">{h.waysLabel}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/create?start=custom" className="btn btn-red px-6 py-3.5 text-base sm:text-lg">
                ✨ {t.create.personalTitle} · {fmt(t.create.fromPrice, { price: aiPrice })}
              </Link>
              <Link href="/create?start=premade" className="btn btn-paper px-6 py-3.5 text-base sm:text-lg">
                🎨 {t.create.readyTitle} · {price}
              </Link>
            </div>
            <Link href="/cards" className="mt-4 inline-block font-semibold underline decoration-hot decoration-2 underline-offset-4">
              {fmt(h.seeAll, { n })} →
            </Link>
            <p className="mt-6 text-sm font-semibold text-ink/55">
              {h.reassure}
              <br />
              🌍 {t.common.worldwide}
            </p>
          </div>

          <HeroShowcase />
        </div>
      </section>

      {/* The two ways to make a card. */}
      <section id="ways" className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-brand text-4xl font-bold leading-tight sm:text-5xl">{h.waysTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink/65">{h.waysIntro}</p>
        </Reveal>
        <Reveal className="mt-10">
          <TwoWays />
        </Reveal>
      </section>

      {/* How it works: four steps, left to right (top to bottom on a phone). */}
      <section id="how" className="scroll-mt-20 border-y-2 border-ink bg-paper py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">{h.howTitle}</h2>
            <p className="mt-3 text-lg text-ink/65">{h.howIntro}</p>
          </Reveal>
          <ol className="mt-12 flex flex-col items-stretch gap-3 lg:flex-row">
            {[
              {
                ...h.how[0],
                mock: (
                  <div className="space-y-2 text-sm font-bold">
                    <span className="block rounded-xl border-2 border-ink bg-hot px-3 py-2 text-white">
                      ✨ {t.create.personalTitle}
                      <span className="block text-xs font-semibold opacity-80">{fmt(t.create.fromPrice, { price: aiPrice })}</span>
                    </span>
                    <span className="block rounded-xl border-2 border-ink/20 bg-paper px-3 py-2">
                      🎨 {t.create.readyTitle}
                      <span className="block text-xs font-semibold text-ink/55">{price}</span>
                    </span>
                  </div>
                ),
              },
              {
                ...h.how[1],
                mock: (
                  <div className="text-left text-sm">
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full w-[55%] rounded-full bg-hot" />
                    </div>
                    <p className="mt-3 font-brand text-base font-bold leading-tight">{t.quiz.questions.describe.title}</p>
                    <p className="mt-2 rounded-lg border-2 border-ink/15 bg-paper px-2.5 py-2 text-ink/70">{h.howAnswer}</p>
                  </div>
                ),
              },
              {
                ...h.how[2],
                mock: (
                  <div className="space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2 rounded-lg border-2 border-ink/15 bg-paper p-1.5 ps-2.5">
                      <span className="min-w-0 flex-1 truncate text-ink/70">{h.howChange}</span>
                      <span className="rounded-full bg-hot px-2.5 py-1 text-xs font-bold text-white">{t.custom.go}</span>
                    </div>
                    <p className="text-xs font-semibold text-ink/55">✏️ {t.custom.clickHint}</p>
                  </div>
                ),
              },
              {
                ...h.how[3],
                mock: (
                  <div className="space-y-2 text-left text-sm">
                    <p className="rounded-lg border-2 border-ink/15 bg-paper px-2.5 py-2">
                      📧 <span className="font-semibold">{h.howEmail}</span>
                    </p>
                    <p className="rounded-lg border-2 border-ink/15 bg-paper px-2.5 py-2">
                      🔗 <span className="font-semibold">{h.howLink}</span>
                    </p>
                  </div>
                ),
              },
            ].map((step, i, all) => (
              <li key={step.title} className="contents">
                <Reveal delay={i * 120} className="min-w-0 flex-1">
                  <div className="sheet relative h-full p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-ink bg-hot font-brand text-2xl font-black text-white">{i + 1}</span>
                    <h3 className="mt-4 font-brand text-2xl font-bold leading-tight">{step.title}</h3>
                    <p className="mt-1 text-ink/65">{fmt(step.body, { n, o })}</p>
                    <div className="mt-5 rounded-xl bg-cream p-3">{step.mock}</div>
                  </div>
                </Reveal>
                {i < all.length - 1 && (
                  <span aria-hidden className="grid shrink-0 place-items-center font-brand text-4xl font-black text-hot lg:w-6">
                    <span className="lg:hidden">↓</span>
                    <span className="hidden lg:inline rtl:rotate-180">→</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link href="/create" className="btn btn-red px-8 py-3.5 text-lg">
              {t.nav.makeCard} →
            </Link>
          </div>
        </div>
      </section>

      {/* Coming up */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <Reveal className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="font-brand text-4xl font-bold leading-tight sm:text-5xl">{h.comingUp}</h2>
            <p className="mt-2 text-lg text-ink/65">{h.comingUpIntro}</p>
          </div>
          <Link href="/occasions" className="shrink-0 font-semibold underline decoration-hot decoration-2 underline-offset-4">
            {fmt(h.allOccasions, { n: o })}
          </Link>
        </Reveal>
        <Reveal className="mt-8">
          <ComingUp />
        </Reveal>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2 className="font-brand text-5xl font-bold leading-[1.02] sm:text-6xl">{h.featuresTitle}</h2>
          <p className="mt-4 text-lg text-ink/65">{h.featuresIntro}</p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <div className="sheet h-full bg-rose p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">{h.runawayTitle}</h3>
              <p className="mt-2 max-w-md text-ink/75">{h.runawayBody}</p>
              <div className="mt-6">
                <RunawayDemo />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-2">
            <div className="sheet flex h-full flex-col bg-air p-7 text-paper sm:p-9">
              <h3 className="font-brand text-3xl font-bold">{h.gamesTitle}</h3>
              <p className="mt-2 text-paper/75">{h.gamesBody}</p>
              <div className="mt-auto flex justify-center gap-2 pt-10 text-5xl">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="animate-glow" style={{ animationDelay: `${i * 0.35}s` }}>
                    🪔
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-2">
            <div className="sheet group h-full overflow-hidden p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">{h.photosTitle}</h3>
              <p className="mt-2 text-ink/65">{h.photosBody}</p>
              <div className="relative mx-auto mt-8 h-48 w-40">
                {["/demo/coffee.svg", "/demo/balloons.svg", "/demo/sunset.svg"].map((src, i) => (
                  <div
                    key={src}
                    className="absolute inset-0 bg-white p-2 pb-8 shadow-md ring-1 ring-ink/15 transition duration-500"
                    style={{ transform: `rotate(${(i - 1) * 9}deg) translateX(${(i - 1) * 14}px)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- decorative */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-2">
            <div className="sheet relative h-full min-h-80 overflow-hidden bg-ink p-7 text-paper shadow-[5px_5px_0_var(--color-hot)] sm:p-9">
              <Particles mode="fireworks" loop />
              <h3 className="relative font-brand text-3xl font-bold">{h.finaleTitle}</h3>
              <p className="relative mt-2 text-paper/70">{h.finaleBody}</p>
            </div>
          </Reveal>
          <Reveal delay={200} className="md:col-span-2">
            <div className="sheet h-full bg-sun p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">{h.typedTitle}</h3>
              <div className="mt-6 -rotate-1 border-2 border-ink bg-paper p-5">
                <TypewriterLoop />
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-3">
            <div className="sheet flex h-full flex-col p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">{h.wheelTitle}</h3>
              <p className="mt-2 text-ink/65">{h.wheelBody}</p>
              <div className="mt-6 flex flex-1 items-center justify-center">
                <WheelDemo />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-3">
            <div className="sheet flex h-full flex-col bg-hot p-7 text-white sm:p-9">
              <h3 className="font-brand text-3xl font-bold">{h.musicTitle}</h3>
              <p className="mt-2 text-white/80">{h.musicBody}</p>
              <div className="mt-6 flex flex-1 items-center justify-center">
                <MusicDemo />
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-6">
            <div className="sheet grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
              {h.blocks.map((b, i) => (
                <div key={b.title} className="rounded-xl border-2 border-dashed border-ink/20 p-5">
                  <span className="text-3xl">{["🎟️", "🫙", "🗓️", "🎁"][i]}</span>
                  <p className="mt-2 font-brand text-xl font-bold">{b.title}</p>
                  <p className="mt-1 text-sm text-ink/65">{b.body}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal className="md:col-span-6">
            <div className="sheet relative grid items-center gap-8 overflow-hidden bg-ink p-7 pt-10 text-paper shadow-[5px_5px_0_var(--color-hot)] sm:p-10 sm:pt-12 md:grid-cols-2">
              <div aria-hidden className="airmail absolute inset-x-0 top-0 h-2.5" />
              <div>
                <span className="inline-block -rotate-6 rounded-md border-[3px] border-sun px-3 py-0.5 font-brand text-lg font-black uppercase tracking-wider text-sun">{t.common.new}</span>
                <h3 className="mt-5 font-brand text-4xl font-bold">{h.aiTitle}</h3>
                <p className="mt-3 max-w-md text-lg text-paper/75">{h.aiBody}</p>
                <Link href="/create?start=custom" className="btn btn-red mt-6 inline-flex px-6 py-3">
                  {fmt(h.aiCta, { price: aiPrice })}
                </Link>
              </div>
              <AiPromptDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Occasions */}
      <section id="occasions" className="border-y-2 border-ink bg-paper py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-10 max-w-2xl">
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">{h.tryTitle}</h2>
            <p className="mt-3 text-lg text-ink/65">{h.tryIntro}</p>
          </Reveal>
          <Reveal>
            <OccasionShowcase order={showcaseOrder()} />
          </Reveal>
        </div>
      </section>

      {/* Products */}
      <section id="cards" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="font-brand text-5xl font-bold leading-tight sm:text-6xl">{h.popularTitle}</h2>
            <p className="mt-3 text-lg text-ink/65">{h.popularIntro}</p>
          </div>
          <Link href="/cards" className="btn btn-paper shrink-0">
            {fmt(h.browseAll, { n })}
          </Link>
        </Reveal>
        <Reveal className="mt-10">
          <CatalogGrid limit={8} />
        </Reveal>
      </section>


      {/* Pricing */}
      <section id="pricing" className="relative overflow-hidden border-y-2 border-ink bg-air py-24 text-paper">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">{h.pricingTitle}</h2>
            <p className="mt-3 text-lg text-paper/75">{h.pricingIntro}</p>
          </Reveal>
          <div className="mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {TIERS.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 100}>
                <div className={`sheet relative flex h-full flex-col p-8 text-ink ${tier.featured ? "bg-sun" : ""}`}>
                  {tier.featured && (
                    <span className="absolute end-5 top-5 rotate-6 rounded-md border-[3px] border-hot px-2.5 py-0.5 font-brand text-sm font-black uppercase tracking-wider text-hot">
                      {t.common.new}
                    </span>
                  )}
                  <h3 className="font-brand text-2xl font-bold">{tier.name}</h3>
                  <p className="mt-3 font-brand text-6xl font-black">
                    {tier.price}
                    <span className="ms-2 font-sans text-base font-semibold text-ink/55">{t.common.perCard}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.points.map((p) => (
                      <li key={p} className="flex gap-3 text-ink/80">
                        <span className="font-bold text-hot">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link href={tier.href} className="btn btn-red mt-8">
                    {t.nav.makeCard}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <Reveal>
          <h2 className="font-brand text-5xl font-bold">{h.faqTitle}</h2>
        </Reveal>
        <div className="mt-10 space-y-4">
          {[...h.faqs.slice(0, -1), t.common.abroad, ...h.faqs.slice(-1)].map((f) => (
            <details key={f.q} className="group rounded-2xl border-2 border-ink bg-paper p-6 shadow-[3px_3px_0_var(--color-ink)] open:shadow-[5px_5px_0_var(--color-hot)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-brand text-xl font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink font-sans text-xl font-bold leading-none transition group-open:rotate-45 group-open:bg-hot group-open:text-white">+</span>
              </summary>
              <p className="mt-3 text-ink/75">{fmt(f.a, { price, aiPrice, gbp: priceOf("card", "gbp"), usd: priceOf("card", "usd") })}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-ink/65">
          <RichText text={h.faqMore} />
        </p>
      </section>

      {/* Final call to action */}
      <section className="relative overflow-hidden border-t-2 border-ink bg-ink py-28 text-center text-paper">
        <Particles mode="fireworks" loop />
        <div className="relative mx-auto max-w-3xl px-4">
          <h2 className="font-brand text-5xl font-black leading-tight sm:text-7xl">{h.finalTitle}</h2>
          <Link href="/create" className="btn btn-red mt-10 px-10 py-4 text-xl shadow-[4px_4px_0_var(--color-sun)]">
            {h.finalCta}
          </Link>
          <p className="mt-6 text-paper/60">{fmt(h.finalNote, { price })}</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
