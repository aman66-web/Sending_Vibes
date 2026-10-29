import Link from "next/link";
import { Particles } from "@/components/card/effects";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { OccasionShowcase } from "@/components/landing/OccasionShowcase";
import { SHOWCASE, type ShowcaseOccasion } from "@/components/landing/showcase";
import { ComingUp } from "@/components/landing/ComingUp";
import { MusicDemo } from "@/components/landing/MusicDemo";
import { SeasonBanner, SeasonPill } from "@/components/landing/Season";
import { AiPromptDemo, RunawayDemo, TypewriterLoop, WheelDemo } from "@/components/landing/widgets";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { RichText } from "@/components/RichText";
import { Reveal } from "@/components/Reveal";
import { SiteFooter, WithEmail } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StickyMakeBar } from "@/components/StickyMakeBar";
import { TrustStrip } from "@/components/TrustStrip";
import { TwoWays } from "@/components/TwoWays";
import { MAX_SCHEDULE_DAYS } from "@/lib/basket";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { defaultTemplate, occasions } from "@/lib/templates";
import { nextDate, upcoming } from "@/lib/calendar";
import { price as priceOf } from "@/lib/pricing";
import { COMPANY, CONTACT_EMAIL } from "@/lib/terms";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

// Re-rendered hourly so the "coming up" dates, the banner and the hero's card stay current.
export const revalidate = 3600;

// Showcase tabs, soonest occasion first.
function showcaseOrder(): ShowcaseOccasion[] {
  return [...SHOWCASE].sort((a, b) => (nextDate(a)?.days ?? 999) - (nextDate(b)?.days ?? 999));
}

// How close a date has to be before the page is dressed for it (Christmas from late October).
const SEASON_DAYS = 60;

// What's coming up: the date for the banner (if one is close), the design the hero
// plays, and the one on the little phone beside it (the date after, or a birthday).
// Worked out here on the server so the browser never disagrees about the date.
function season() {
  const soon = upcoming(new Date(), 6);
  const next = soon.find((d) => d.days <= SEASON_DAYS);
  const main: Occasion = next?.occasion ?? "birthday";
  const second: Occasion = soon.find((d) => d.days <= 90 && d.occasion !== main)?.occasion ?? (main === "birthday" ? "valentine" : "birthday");
  return { next, slug: defaultTemplate(main).slug, phoneSlug: defaultTemplate(second).slug };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://envelette.com";

// Tells search engines who runs the shop, the same details as the footer.
const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Envelette",
  legalName: COMPANY.legalName,
  url: SITE_URL,
  email: CONTACT_EMAIL,
  address: { "@type": "PostalAddress", streetAddress: COMPANY.street, addressLocality: COMPANY.town, postalCode: COMPANY.postcode, addressCountry: "GB" },
  identifier: { "@type": "PropertyValue", propertyID: "Companies House company number", value: COMPANY.number },
};

export default async function Home() {
  const { t, currency } = await getI18n();
  const h = t.home;
  const n = TEMPLATES.length;
  const o = OCCASIONS.length;
  const price = priceOf("card", currency);
  const aiPrice = priceOf("custom", currency);
  const { next, slug, phoneSlug } = season();
  const faqValues = { price, aiPrice, company: COMPANY.legalName, number: COMPANY.number, email: CONTACT_EMAIL };
  const emailLink = "font-semibold underline decoration-hot decoration-2 underline-offset-4";
  return (
    <div className="grain overflow-x-clip bg-cream text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION).replace(/</g, "\\u003c") }} />
      <SiteHeader />

      {/* Phones: the next date coming up, in place of the scrolling occasions below (moving links are hard to tap). */}
      {next && <SeasonBanner next={next} />}

      {/* Every occasion, scrolling past under the header. Hover (or tab into it) to pause; each one links to its page. */}
      <div className={`group relative overflow-hidden border-b-2 border-ink bg-ink py-3 text-cream [contain:paint] ${next ? "max-sm:hidden" : ""}`}>
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-brand text-lg font-semibold will-change-transform [backface-visibility:hidden] group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:text-xl">
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

      {/* Hero: says what we do in one glance, then shows it. On phones the button and price
          come before the card, so all three are on the first screen. */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-12 pt-6 sm:gap-10 sm:px-6 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pt-14">
          <div className="text-center lg:text-left">
            {next ? (
              <SeasonPill next={next} className="mb-3 max-sm:hidden" />
            ) : (
              <p className="font-hand text-2xl text-ink/70 max-sm:hidden sm:text-3xl">{h.eyebrow}</p>
            )}
            <h1 className="mt-2 font-brand text-[clamp(2.4rem,6.6vw,5.1rem)] font-black leading-[0.95] tracking-tight">
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
            {/* On phones this sits under the card instead (see HeroShowcase). */}
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ink/75 max-sm:hidden sm:text-xl lg:mx-0">
              {h.intro}
            </p>
            <Link id="hero-cta" href="/create" className="btn btn-red mt-6 px-8 py-4 text-lg sm:mt-8 sm:text-xl">
              {h.cta}
            </Link>
            <p className="mt-4 text-base text-ink/75 sm:mt-6">
              <RichText text={fmt(h.reassure, { price })} />
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/55 max-sm:hidden">🌍 {t.common.worldwide}</p>
          </div>

          <HeroShowcase slug={slug} phoneSlug={phoneSlug} />
        </div>
      </section>

      {/* Coming up: why now. */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8">
        <Reveal className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="font-brand text-4xl font-bold leading-tight sm:text-5xl">{h.comingUp}</h2>
            <p className="mt-2 text-lg text-ink/65">
              {h.comingUpIntro} {fmt(h.comingUpSchedule, { days: MAX_SCHEDULE_DAYS })}
            </p>
          </div>
          <Link href="/occasions" className="shrink-0 font-semibold underline decoration-hot decoration-2 underline-offset-4">
            {fmt(h.allOccasions, { n: o })}
          </Link>
        </Reveal>
        <Reveal className="mt-6 sm:mt-8">
          <ComingUp />
        </Reveal>
      </section>

      {/* Try one now: real cards to play, by occasion. */}
      <section id="occasions" className="border-y-2 border-ink bg-paper py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mb-8 max-w-2xl sm:mb-10">
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">{h.tryTitle}</h2>
            <p className="mt-3 text-lg text-ink/65">{h.tryIntro}</p>
          </Reveal>
          <Reveal>
            <OccasionShowcase order={showcaseOrder()} />
          </Reveal>
        </div>
      </section>

      {/* The two ways to make a card. Not on phones: "Make your card" opens this same choice,
          and the first step of How it works says it in a line. */}
      <section id="ways" className="mx-auto max-w-5xl px-4 py-20 max-sm:hidden sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-brand text-4xl font-bold leading-tight sm:text-5xl">{h.waysTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink/65">{h.waysIntro}</p>
        </Reveal>
        <Reveal className="mt-10">
          <TwoWays />
        </Reveal>
      </section>

      {/* How it works: four steps, left to right (top to bottom on a phone, without the little pictures). */}
      <section id="how" className="scroll-mt-20 border-y-2 border-ink bg-paper py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">{h.howTitle}</h2>
            <p className="mt-3 text-lg text-ink/65">{h.howIntro}</p>
          </Reveal>
          <ol className="mt-8 flex flex-col items-stretch gap-2 sm:mt-12 sm:gap-3 lg:flex-row">
            {[
              {
                ...h.how[0],
                mock: (
                  <div className="space-y-2 text-sm font-bold">
                    <span className="block rounded-xl border-2 border-ink bg-hot px-3 py-2 text-white">
                      ✨ {t.create.personalTitle}
                      <span className="block text-xs font-semibold opacity-80">{aiPrice}</span>
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
                  <div className="sheet relative flex h-full gap-4 p-5 sm:block sm:p-6">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-hot font-brand text-2xl font-black text-white">{i + 1}</span>
                    <div>
                      <h3 className="font-brand text-2xl font-bold leading-tight sm:mt-4">{step.title}</h3>
                      <p className="mt-1 text-ink/65">{fmt(step.body, { n, o })}</p>
                      <div className="mt-5 rounded-xl bg-cream p-3 max-sm:hidden">{step.mock}</div>
                    </div>
                  </div>
                </Reveal>
                {i < all.length - 1 && (
                  <span aria-hidden className="grid shrink-0 place-items-center font-brand text-3xl font-black text-hot sm:text-4xl lg:w-6">
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

      {/* Some designs. The order is the catalogue's own. */}
      <section id="cards" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2 className="font-brand text-5xl font-bold leading-tight sm:text-6xl">{h.popularTitle}</h2>
            <p className="mt-3 text-lg text-ink/65">{h.popularIntro}</p>
          </div>
          <Link href="/cards" className="btn btn-paper shrink-0">
            {fmt(h.browseAll, { n })}
          </Link>
        </Reveal>
        {/* Four on a phone (two rows) is plenty before "Browse all"; the rest are for bigger screens. */}
        <Reveal className="mt-8 max-sm:[&_.grid-cols-2>:nth-child(n+5)]:hidden sm:mt-10">
          <CatalogGrid limit={8} />
        </Reveal>
      </section>

      {/* Features. Phones get the few that show off the most; bigger screens get them all. */}
      <section id="features" className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 sm:pt-8">
        <Reveal className="max-w-2xl">
          <h2 className="font-brand text-5xl font-bold leading-[1.02] sm:text-6xl">{h.featuresTitle}</h2>
          <p className="mt-4 text-lg text-ink/65">{h.featuresIntro}</p>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:mt-12 md:grid-cols-6">
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
              <div className="mt-auto flex justify-center gap-2 pt-8 text-5xl sm:pt-10">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="animate-glow" style={{ animationDelay: `${i * 0.35}s` }}>
                    🪔
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="max-sm:hidden md:col-span-2">
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
          <Reveal delay={100} className="max-sm:hidden md:col-span-2">
            <div className="sheet relative h-full min-h-80 overflow-hidden bg-ink p-7 text-paper shadow-[5px_5px_0_var(--color-hot)] sm:p-9">
              <Particles mode="fireworks" loop />
              <h3 className="relative font-brand text-3xl font-bold">{h.finaleTitle}</h3>
              <p className="relative mt-2 text-paper/70">{h.finaleBody}</p>
            </div>
          </Reveal>
          <Reveal delay={200} className="max-sm:hidden md:col-span-2">
            <div className="sheet h-full bg-sun p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">{h.typedTitle}</h3>
              <div className="mt-6 -rotate-1 border-2 border-ink bg-paper p-5">
                <TypewriterLoop />
              </div>
            </div>
          </Reveal>

          <Reveal className="max-sm:hidden md:col-span-3">
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

          <Reveal className="max-sm:hidden md:col-span-6">
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

      {/* Pricing: one price, said once, with what you get and what happens if it goes wrong. */}
      <section id="pricing" className="scroll-mt-20 border-y-2 border-ink bg-air py-16 text-paper sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">{h.pricingTitle}</h2>
            <p className="mt-3 text-lg text-paper/75">{h.pricingIntro}</p>
          </Reveal>
          <Reveal className="mt-10 sm:mt-12">
            <div className="sheet max-w-4xl overflow-hidden text-ink">
              <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="@container flex flex-col items-center justify-center gap-5 border-b-2 border-ink bg-sun p-7 text-center sm:p-9 md:border-b-0 md:border-e-2">
                  {/* The price as a postage stamp's value, as big as fits: £9.99 at full size, Rp 159,000 smaller. */}
                  <div className="stamp -rotate-3">
                    <div className="border-2 border-hot px-5 pb-3 pt-4">
                      <p
                        dir="ltr"
                        className="whitespace-nowrap font-brand font-black leading-none"
                        style={{ fontSize: `min(3.75rem, calc((100cqw - 4.5rem) / ${(price.length * 0.62).toFixed(2)}))` }}
                      >
                        {price}
                      </p>
                      <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.2em] text-hot">{t.common.perCard}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-ink/75">{h.priceOne}</p>
                  <Link href="/create" className="btn btn-red w-full py-3.5 text-lg">
                    {t.nav.makeCard} →
                  </Link>
                </div>
                <ul className="space-y-3 p-7 sm:p-9">
                  {h.pricePoints.map((p) => (
                    <li key={p} className="flex gap-3 text-ink/80">
                      <span aria-hidden className="font-bold text-hot">✓</span>
                      {fmt(p, { n, days: MAX_SCHEDULE_DAYS })}
                    </li>
                  ))}
                </ul>
              </div>
              <TrustStrip className="border-t-2 border-dashed border-ink/25 bg-cream p-7 sm:p-9" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <h2 className="font-brand text-5xl font-bold">{h.faqTitle}</h2>
        </Reveal>
        <div className="mt-8 space-y-4 sm:mt-10">
          {[...h.faqs.slice(0, -1), t.common.abroad, ...h.faqs.slice(-1)].map((f) => (
            <details key={f.q} className="group rounded-2xl border-2 border-ink bg-paper p-6 shadow-[3px_3px_0_var(--color-ink)] open:shadow-[5px_5px_0_var(--color-hot)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-brand text-xl font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink font-sans text-xl font-bold leading-none transition group-open:rotate-45 group-open:bg-hot group-open:text-white">+</span>
              </summary>
              <p className="mt-3 text-ink/75">
                <WithEmail text={fmt(f.a, faqValues)} linkClass={emailLink} />
              </p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-ink/65">
          <RichText text={h.faqMore} />
        </p>
      </section>

      {/* Final call to action. The phone's bottom bar steps aside here, as this has its own big button. */}
      <section data-no-bar className="relative overflow-hidden border-t-2 border-ink bg-ink py-20 text-center text-paper sm:py-28">
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

      <StickyMakeBar href="/create" label={fmt(h.stickyCta, { price })} watchId="hero-cta" />
    </div>
  );
}
