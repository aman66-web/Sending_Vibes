import Link from "next/link";
import { Particles } from "@/components/card/effects";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { OccasionShowcase } from "@/components/landing/OccasionShowcase";
import { SHOWCASE, type ShowcaseOccasion } from "@/components/landing/showcase";
import { ComingUp } from "@/components/landing/ComingUp";
import { MusicDemo } from "@/components/landing/MusicDemo";
import { AiPromptDemo, RunawayDemo, TypewriterLoop, WheelDemo } from "@/components/landing/widgets";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { occasions } from "@/lib/templates";
import { nextDate } from "@/lib/calendar";
import { PRICES } from "@/lib/pricing";

// Re-rendered hourly so the "coming up" dates stay current.
export const revalidate = 3600;

const TIERS = [
  {
    name: "Card",
    price: PRICES.card.label,
    note: "per card",
    points: [`Any of the ${TEMPLATES.length} designs`, "Edit every word on every screen", "Up to 6 of your photos", "Every game, quiz and effect"],
    live: true,
  },
  {
    name: "AI Custom",
    price: PRICES.aiCustom.label,
    note: "per card",
    points: [`Everything in the ${PRICES.card.label} card`, "Describe changes in plain English", "Custom quizzes about you two", "Up to 30 AI edits"],
    featured: true,
  },
];

const FAQS = [
  { q: "Do they need to download an app?", a: "No. It's a link. They tap it and it opens in their browser, on any phone or computer." },
  { q: "Does it play music?", a: "Yes. Every card has sound effects and a tune you can pick, which starts when they open the envelope. There's a mute button if they're somewhere quiet." },
  { q: "Is it private?", a: "Only people with the link can open a card. Links are long random codes, and cards aren't listed or searchable anywhere." },
  { q: "Can I use my own photos?", a: "Yes, up to 6. They're resized on your phone before upload, which also strips out location data." },
  { q: "How long does it take to make one?", a: "About two minutes. Pick an occasion, add names and photos, tweak any words you like, and you'll get your link." },
  {
    q: "What does it cost?",
    a: `Each card is ${PRICES.card.label}, paid once. No subscription. AI Custom cards, where you describe changes in plain English, will be ${PRICES.aiCustom.label}.`,
  },
];

// Showcase tabs, soonest occasion first.
function showcaseOrder(): ShowcaseOccasion[] {
  return [...SHOWCASE].sort((a, b) => (nextDate(a)?.days ?? 999) - (nextDate(b)?.days ?? 999));
}

export default function Home() {
  return (
    <div className="grain overflow-x-clip bg-cream text-ink">
      <SiteHeader />

      {/* Every occasion, scrolling past under the header. Hover to pause; each one links to its page. */}
      <div className="group relative overflow-hidden border-b-2 border-ink bg-ink py-3 text-cream [contain:paint]">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-brand text-lg font-semibold will-change-transform [backface-visibility:hidden] group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:text-xl">
          {[...OCCASIONS, ...OCCASIONS].map((o, i) => (
            <Link
              key={i}
              href={`/occasions/${o}`}
              tabIndex={i < OCCASIONS.length ? 0 : -1}
              aria-hidden={i >= OCCASIONS.length}
              className="flex items-center gap-2.5 transition hover:text-sun"
            >
              <span>{occasions[o].emoji}</span>
              {occasions[o].label}
              <span className="ml-5 text-hot">✶</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Hero: says what we do in one glance, then shows it. */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pt-14">
          <div className="text-center lg:text-left">
            <p className="font-hand text-2xl text-ink/70 sm:text-3xl">for birthdays, Diwali, Eid, Valentine&apos;s and the rest</p>
            <h1 className="mt-2 font-brand text-[clamp(2.9rem,6.6vw,5.1rem)] font-black leading-[0.95] tracking-tight">
              <span className="text-hot">Personalised</span>
              <br />
              interactive{" "}
              <span className="relative inline-block">
                cards.
                <svg aria-hidden viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-3 w-full text-sun sm:-bottom-2 sm:h-4">
                  <path d="M4 13 C 55 3, 130 3, 196 11" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ink/75 sm:text-xl lg:mx-0">
              They open an envelope, play a little game, flick through your photos and find your message at the end. You just fill in the blanks.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link href="/create" className="btn btn-red px-6 py-3.5 text-base sm:px-8 sm:text-lg">
                Make a card · {PRICES.card.label} →
              </Link>
              <Link href="/cards" className="btn btn-paper px-6 py-3.5 text-base sm:px-8 sm:text-lg">
                See all {TEMPLATES.length} designs
              </Link>
            </div>
            <p className="mt-6 text-sm font-semibold text-ink/55">No app to download. No account. About two minutes.</p>
          </div>

          <HeroShowcase />
        </div>

        {/* The whole process in one line. */}
        <div className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <ol className="sheet grid divide-y-2 divide-dashed divide-ink/15 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
            {[
              { title: "Pick a design", body: `${TEMPLATES.length} designs for ${OCCASIONS.length} occasions` },
              { title: "Fill in the blanks", body: "Names, photos and your message" },
              { title: "Send the link", body: "WhatsApp, text or Instagram" },
            ].map((step, i) => (
              <li key={step.title} className="flex items-center gap-4 px-5 py-4">
                <span className="font-brand text-5xl font-black leading-none text-hot">{i + 1}</span>
                <span>
                  <span className="block font-brand text-lg font-bold leading-tight">{step.title}</span>
                  <span className="block text-sm text-ink/60">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Coming up */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <Reveal className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="font-brand text-4xl font-bold leading-tight sm:text-5xl">Coming up</h2>
            <p className="mt-2 text-lg text-ink/65">Sort it now and it&apos;s one less thing to remember.</p>
          </div>
          <Link href="/occasions" className="shrink-0 font-semibold underline decoration-hot decoration-2 underline-offset-4">
            All {OCCASIONS.length} occasions →
          </Link>
        </Reveal>
        <Reveal className="mt-8">
          <ComingUp />
        </Reveal>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2 className="font-brand text-5xl font-bold leading-[1.02] sm:text-6xl">A card they play, not just read</h2>
          <p className="mt-4 text-lg text-ink/65">Every card is a handful of screens you put together. Here are a few of them. Have a go.</p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <div className="sheet h-full bg-rose p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">The No button that runs away</h3>
              <p className="mt-2 max-w-md text-ink/75">They can try. They won&apos;t manage it, and the Yes button grows every time they miss.</p>
              <div className="mt-6">
                <RunawayDemo />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-2">
            <div className="sheet flex h-full flex-col bg-air p-7 text-paper sm:p-9">
              <h3 className="font-brand text-3xl font-bold">21 mini games</h3>
              <p className="mt-2 text-paper/75">Light the diyas, smash a piñata, launch fireworks, whack the ghosts.</p>
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
              <h3 className="font-brand text-3xl font-bold">Your photos, like a pile of prints</h3>
              <p className="mt-2 text-ink/65">They flick through them one at a time.</p>
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
              <h3 className="relative font-brand text-3xl font-bold">A finale worth a screenshot</h3>
              <p className="relative mt-2 text-paper/70">Fireworks, confetti or a storm of hearts.</p>
            </div>
          </Reveal>
          <Reveal delay={200} className="md:col-span-2">
            <div className="sheet h-full bg-sun p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">Your message, written out as they watch</h3>
              <div className="mt-6 -rotate-1 border-2 border-ink bg-paper p-5">
                <TypewriterLoop />
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-3">
            <div className="sheet flex h-full flex-col p-7 sm:p-9">
              <h3 className="font-brand text-3xl font-bold">Spin the wheel</h3>
              <p className="mt-2 text-ink/65">For date nights, birthday presents or a kiss. You can secretly decide where it lands.</p>
              <div className="mt-6 flex flex-1 items-center justify-center">
                <WheelDemo />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-3">
            <div className="sheet flex h-full flex-col bg-hot p-7 text-white sm:p-9">
              <h3 className="font-brand text-3xl font-bold">Music and sound</h3>
              <p className="mt-2 text-white/80">Every card has sound effects and its own tune, from Happy Birthday to something spooky. Have a listen:</p>
              <div className="mt-6 flex flex-1 items-center justify-center">
                <MusicDemo />
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-6">
            <div className="sheet grid gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
              {[
                { emoji: "🎟️", title: "Coupon books", body: "Breakfast in bed, a foot rub, you pick the film. Tap to redeem." },
                { emoji: "🫙", title: "A jar of reasons", body: "They pull out every reason you love them, one note at a time." },
                { emoji: "🗓️", title: "Your story", body: "From the day you met to today, moment by moment." },
                { emoji: "🎁", title: "Mystery boxes", body: "Three boxes, one choice. (Psst: put the same thing in all three.)" },
              ].map((b) => (
                <div key={b.title} className="rounded-xl border-2 border-dashed border-ink/20 p-5">
                  <span className="text-3xl">{b.emoji}</span>
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
                <span className="inline-block -rotate-6 rounded-md border-[3px] border-sun px-3 py-0.5 font-brand text-lg font-black uppercase tracking-wider text-sun">Coming soon</span>
                <h3 className="mt-5 font-brand text-4xl font-bold">Just say what you want.</h3>
                <p className="mt-3 max-w-md text-lg text-paper/75">
                  Type it like you&apos;re texting a friend and your card gets rebuilt: new colours, new games, a quiz about your first date.
                </p>
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
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">Try one now</h2>
            <p className="mt-3 text-lg text-ink/65">These are real cards, running live. Tap through them.</p>
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
            <h2 className="font-brand text-5xl font-bold leading-tight sm:text-6xl">Popular right now</h2>
            <p className="mt-3 text-lg text-ink/65">Funny, soppy, cute or festive. Scroll past one and it plays itself.</p>
          </div>
          <Link href="/cards" className="btn btn-paper shrink-0">
            Browse all {TEMPLATES.length} →
          </Link>
        </Reveal>
        <Reveal className="mt-10">
          <CatalogGrid limit={8} />
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal className="max-w-2xl">
          <h2 className="font-brand text-5xl font-bold sm:text-6xl">How it works</h2>
          <p className="mt-3 text-lg text-ink/65">Two minutes, start to finish.</p>
        </Reveal>
        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          <div aria-hidden className="absolute left-[16%] right-[16%] top-12 hidden border-t-2 border-dashed border-ink/30 md:block" />
          {[
            {
              title: "Pick a design",
              body: `${OCCASIONS.length} occasions and ${TEMPLATES.length} designs, from silly to soppy.`,
              mock: (
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border-2 border-ink bg-ink px-3 py-1 text-sm font-bold text-paper">💘 Valentine&apos;s</span>
                  <span className="rounded-full border-2 border-ink/20 bg-paper px-3 py-1 text-sm font-bold">🪔 Diwali</span>
                  <span className="rounded-full border-2 border-ink/20 bg-paper px-3 py-1 text-sm font-bold">🎂 Birthday</span>
                </div>
              ),
            },
            {
              title: "Make it yours",
              body: "Add names, photos and inside jokes. The preview updates as you type.",
              mock: (
                <div className="space-y-2 text-left text-sm">
                  <div className="border-b-2 border-dashed border-ink/25 px-1 pb-1">
                    <span className="font-brand text-ink/50">To: </span>
                    <span className="font-hand text-2xl leading-none">Priya</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {["/demo/sunset.svg", "/demo/coffee.svg", "/demo/lights.svg"].map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element -- decorative
                      <img key={src} src={src} alt="" className="h-12 w-12 bg-white object-cover p-0.5 ring-1 ring-ink/15" />
                    ))}
                    <span className="grid h-12 w-12 place-items-center border-2 border-dashed border-ink/25 text-ink/40">+</span>
                  </div>
                </div>
              ),
            },
            {
              title: "Send the link",
              body: "WhatsApp, Instagram, text. They tap it and the fun starts.",
              mock: (
                <div className="ml-auto max-w-[15rem] rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-2 text-left text-sm shadow-sm">
                  <div className="rounded-xl bg-white/70 p-2">
                    <p className="font-bold">Sam sent you something 💘</p>
                    <p className="text-xs text-ink/50">Tap to open your interactive card</p>
                  </div>
                  <p className="px-1 pt-1.5">I made you something 💌</p>
                </div>
              ),
            },
          ].map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <div className="sheet relative h-full p-7">
                <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-hot font-brand text-3xl font-black text-white">{i + 1}</span>
                <h3 className="mt-5 font-brand text-2xl font-bold">{step.title}</h3>
                <p className="mt-1 text-ink/65">{step.body}</p>
                <div className="mt-6 rounded-xl bg-cream p-4">{step.mock}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative overflow-hidden border-y-2 border-ink bg-air py-24 text-paper">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <h2 className="font-brand text-5xl font-bold sm:text-6xl">Cheaper than a bunch of flowers</h2>
            <p className="mt-3 text-lg text-paper/75">One price per card. No subscription, nothing to cancel.</p>
          </Reveal>
          <div className="mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {TIERS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className={`sheet relative flex h-full flex-col p-8 text-ink ${t.featured ? "bg-sun" : ""}`}>
                  {t.featured && (
                    <span className="absolute right-5 top-5 rotate-6 rounded-md border-[3px] border-hot px-2.5 py-0.5 font-brand text-sm font-black uppercase tracking-wider text-hot">
                      Coming soon
                    </span>
                  )}
                  <h3 className="font-brand text-2xl font-bold">{t.name}</h3>
                  <p className="mt-3 font-brand text-6xl font-black">
                    {t.price}
                    <span className="ml-2 font-sans text-base font-semibold text-ink/55">{t.note}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {t.points.map((p) => (
                      <li key={p} className="flex gap-3 text-ink/80">
                        <span className="font-bold text-hot">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  {t.live ? (
                    <Link href="/create" className="btn btn-red mt-8">
                      Make a card
                    </Link>
                  ) : (
                    <span className="mt-8 rounded-full border-2 border-dashed border-ink/40 py-3 text-center font-brand font-semibold text-ink/60">Not quite ready yet</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
        <Reveal>
          <h2 className="font-brand text-5xl font-bold">Questions people ask</h2>
        </Reveal>
        <div className="mt-10 space-y-4">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl border-2 border-ink bg-paper p-6 shadow-[3px_3px_0_var(--color-ink)] open:shadow-[5px_5px_0_var(--color-hot)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-brand text-xl font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink font-sans text-xl font-bold leading-none transition group-open:rotate-45 group-open:bg-hot group-open:text-white">+</span>
              </summary>
              <p className="mt-3 text-ink/75">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-ink/65">
          Anything else? The <Link href="/help" className="font-semibold underline decoration-hot decoration-2 underline-offset-4">help page</Link> has the rest.
        </p>
      </section>

      {/* Final call to action */}
      <section className="relative overflow-hidden border-t-2 border-ink bg-ink py-28 text-center text-paper">
        <Particles mode="fireworks" loop />
        <div className="relative mx-auto max-w-3xl px-4">
          <h2 className="font-brand text-5xl font-black leading-tight sm:text-7xl">Go on. Make someone&apos;s day.</h2>
          <Link href="/create" className="btn btn-red mt-10 px-10 py-4 text-xl shadow-[4px_4px_0_var(--color-sun)]">
            Make your card →
          </Link>
          <p className="mt-6 text-paper/60">{PRICES.card.label} a card. No sign-up needed.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
