import Link from "next/link";
import { CardPlayer } from "@/components/card/CardPlayer";
import { Particles } from "@/components/card/effects";
import { OccasionShowcase } from "@/components/landing/OccasionShowcase";
import { AiPromptDemo, RunawayDemo, TypewriterLoop } from "@/components/landing/widgets";
import { Logo } from "@/components/Logo";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Reveal } from "@/components/Reveal";
import { buildDemo } from "@/lib/templates";

const MARQUEE = [
  { emoji: "💘", label: "Valentine's" },
  { emoji: "🪔", label: "Diwali" },
  { emoji: "🎂", label: "Birthdays" },
  { emoji: "💍", label: "Anniversaries", soon: true },
  { emoji: "🌙", label: "Eid", soon: true },
  { emoji: "🎄", label: "Christmas", soon: true },
  { emoji: "🙏", label: "Sorry cards", soon: true },
  { emoji: "🧵", label: "Raksha Bandhan", soon: true },
];

const TIERS = [
  {
    name: "Free",
    price: "£0",
    note: "while we launch",
    points: ["Every template and game", "Edit every word", "Up to 6 photos", "Small Sending Vibes credit"],
    live: true,
  },
  {
    name: "Personal",
    price: "£3.99",
    note: "per card",
    points: ["Everything in Free", "No branding", "Background music", "Extra games"],
  },
  {
    name: "AI Custom",
    price: "£9.99",
    note: "per card",
    points: ["Everything in Personal", "Describe changes in plain English", "Custom quizzes about you two", "Up to 30 AI edits"],
    featured: true,
  },
];

const FAQS = [
  { q: "Do they need to download an app?", a: "No. It's a link. They tap it and it opens in their browser, on any phone or computer." },
  { q: "Is it private?", a: "Only people with the link can open a card. Links are long random codes, and cards aren't listed or searchable anywhere." },
  { q: "Can I use my own photos?", a: "Yes, up to 6. They're resized on your phone before upload, which also strips out location data." },
  { q: "How long does it take to make one?", a: "About two minutes. Pick an occasion, add names and photos, tweak any words you like, and you'll get your link." },
  { q: "What does it cost?", a: "Making and sending cards is free while we launch. Paid extras like no branding and the AI editor are coming soon." },
];

export default function Home() {
  const heroCard = buildDemo("valentine");

  return (
    <div className="overflow-x-clip bg-cream text-ink">
      <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/75 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-semibold text-ink/70 md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#occasions" className="hover:text-ink">Occasions</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
          </div>
          <Link href="/create" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-hot">
            Make a card
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] animate-blob rounded-full bg-hot/25 blur-3xl" />
          <div className="absolute -right-40 top-10 h-[34rem] w-[34rem] animate-blob rounded-full bg-tangerine/25 blur-3xl [animation-delay:-6s]" />
          <div className="absolute -bottom-48 left-1/3 h-[30rem] w-[30rem] animate-blob rounded-full bg-grape/20 blur-3xl [animation-delay:-12s]" />
          <div className="absolute inset-0 bg-[radial-gradient(#1d0b17_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.05]" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-hot/20 bg-white/70 px-3.5 py-1.5 text-sm font-bold text-hot shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-hot" />
              </span>
              Diwali cards are live 🪔
            </span>
            <h1 className="mt-6 font-display text-[clamp(2.9rem,6.2vw,4.6rem)] font-bold leading-[0.95] tracking-tight">
              Don&apos;t send a card.
              <br />
              Send a{" "}
              <span className="relative inline-block whitespace-nowrap pr-2 font-serif font-normal italic">
                <span className="animate-shimmer bg-gradient-to-r from-hot via-tangerine to-grape bg-[length:200%_auto] bg-clip-text text-transparent">
                  moment
                </span>
                <svg viewBox="0 0 300 24" className="absolute -bottom-2 left-0 w-full" aria-hidden>
                  <path d="M4 16 C 60 4, 120 22, 180 10 S 270 8, 296 14" fill="none" stroke="#ff2e7e" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink/70 sm:text-xl lg:mx-0">
              Interactive cards with a No button that runs away, mini games, your photos and a finale worth screenshotting. Made in two minutes. Sent as a link.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/create"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-hot to-tangerine px-8 py-4 font-display text-lg font-semibold text-white shadow-[0_14px_34px_-10px_rgba(255,46,126,0.8)] transition hover:-translate-y-0.5"
              >
                Make yours free
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <a href="#occasions" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-display text-lg font-semibold shadow-sm ring-1 ring-ink/10 transition hover:-translate-y-0.5">
                See all occasions
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-ink/60 lg:justify-start">
              <li>✓ No app needed</li>
              <li>✓ Ready in 2 minutes</li>
              <li>✓ Works on any phone</li>
            </ul>
          </div>

          <div className="relative mx-auto">
            <div aria-hidden className="absolute inset-x-0 top-16 -z-10 h-[80%] rounded-full bg-gradient-to-br from-hot/50 via-tangerine/40 to-grape/40 blur-3xl" />
            <div className="rotate-[-2.5deg] transition duration-500 hover:rotate-0">
              <PhoneFrame>
                <CardPlayer card={heroCard} preview />
              </PhoneFrame>
            </div>
            <span
              style={{ "--r": "-8deg" } as React.CSSProperties}
              className="absolute -left-14 top-24 hidden animate-bob rounded-2xl bg-white px-4 py-2.5 font-display font-semibold shadow-xl sm:block"
            >
              Nope 🙅‍♀️
            </span>
            <span
              style={{ "--r": "6deg", animationDelay: "-2s" } as React.CSSProperties}
              className="absolute -right-10 top-48 hidden animate-bob rounded-2xl bg-gradient-to-r from-hot to-tangerine px-4 py-2.5 font-display font-semibold text-white shadow-xl sm:block"
            >
              💘 +1
            </span>
            <span
              style={{ "--r": "-4deg", animationDelay: "-3.5s" } as React.CSSProperties}
              className="absolute -right-8 top-6 hidden h-16 w-16 animate-bob place-items-center rounded-full bg-ink text-3xl shadow-xl sm:grid"
            >
              🎆
            </span>
            <span
              style={{ "--r": "8deg", animationDelay: "-1s" } as React.CSSProperties}
              className="absolute -left-12 bottom-24 hidden animate-bob rounded-md bg-white p-1.5 pb-5 shadow-xl sm:block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative sticker */}
              <img src="/demo/sunset.svg" alt="" className="h-20 w-16 rounded-sm object-cover" />
            </span>
            <p className="absolute -bottom-12 left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-hand text-2xl text-ink/60 sm:block">
              ↑ it&apos;s real, tap the envelope
            </p>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="relative -rotate-1 overflow-hidden bg-ink py-5 text-white shadow-2xl">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-2xl font-semibold motion-reduce:animate-none">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-3">
              <span>{m.emoji}</span>
              {m.label}
              {m.soon && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase tracking-widest text-white/60">soon</span>}
              <span className="ml-7 text-hot">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-bold uppercase tracking-[0.2em] text-hot">Why it hits different</p>
          <h2 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
            Not a card. A little <span className="font-serif font-normal italic text-hot">adventure</span>.
          </h2>
          <p className="mt-4 text-lg text-ink/65">Every card is a set of interactive screens. Here are a few of the building blocks. Go ahead and play with them.</p>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-6">
          <Reveal className="md:col-span-4">
            <div className="h-full rounded-[2rem] bg-gradient-to-br from-[#ffe4ec] to-[#ffc2d4] p-7 sm:p-9">
              <h3 className="font-display text-3xl font-bold">The No button that runs away</h3>
              <p className="mt-2 max-w-md text-ink/70">They can try. They will fail. The Yes button gets bigger every time they miss.</p>
              <div className="mt-6">
                <RunawayDemo />
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-2">
            <div className="flex h-full flex-col rounded-[2rem] bg-gradient-to-b from-[#3f1158] to-[#1a0626] p-7 text-[#fff4dc] sm:p-9">
              <h3 className="font-display text-3xl font-bold">Mini games</h3>
              <p className="mt-2 text-[#fff4dc]/70">Catch falling hearts, light the diyas, blow out the candles.</p>
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
            <div className="group h-full overflow-hidden rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-ink/5 sm:p-9">
              <h3 className="font-display text-3xl font-bold">Your photos, polaroid-style</h3>
              <p className="mt-2 text-ink/65">Tap through them like a stack on the table.</p>
              <div className="relative mx-auto mt-8 h-48 w-40">
                {["/demo/coffee.svg", "/demo/balloons.svg", "/demo/sunset.svg"].map((src, i) => (
                  <div
                    key={src}
                    className="absolute inset-0 rounded-md bg-white p-2 pb-8 shadow-lg ring-1 ring-black/5 transition duration-500"
                    style={{ transform: `rotate(${(i - 1) * 9}deg) translateX(${(i - 1) * 14}px)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- decorative */}
                    <img src={src} alt="" className="h-full w-full rounded-sm object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="md:col-span-2">
            <div className="relative h-full min-h-80 overflow-hidden rounded-[2rem] bg-ink p-7 text-white sm:p-9">
              <Particles mode="fireworks" loop />
              <h3 className="relative font-display text-3xl font-bold">A finale worth a screenshot</h3>
              <p className="relative mt-2 text-white/65">Fireworks, confetti or a storm of hearts.</p>
            </div>
          </Reveal>
          <Reveal delay={200} className="md:col-span-2">
            <div className="h-full rounded-[2rem] bg-[#fff1dc] p-7 sm:p-9">
              <h3 className="font-display text-3xl font-bold">Words that write themselves</h3>
              <p className="mt-2 text-ink/65">Your message types out like a handwritten note.</p>
              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <TypewriterLoop />
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-6">
            <div className="relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-grape via-[#b5179e] to-hot p-7 text-white sm:p-10 md:grid-cols-2">
              <div>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest">Coming soon</span>
                <h3 className="mt-4 font-display text-4xl font-bold">Just say what you want.</h3>
                <p className="mt-3 max-w-md text-lg text-white/80">
                  Type it like you&apos;re texting a friend and the AI rebuilds your card: new colours, new games, a quiz about your first date.
                </p>
              </div>
              <AiPromptDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Occasions */}
      <section id="occasions" className="bg-white py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            <p className="font-bold uppercase tracking-[0.2em] text-hot">Occasions</p>
            <h2 className="mt-3 font-display text-5xl font-bold sm:text-6xl">
              Pick your <span className="font-serif font-normal italic text-hot">vibe</span>
            </h2>
          </Reveal>
          <Reveal>
            <OccasionShowcase />
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="font-bold uppercase tracking-[0.2em] text-hot">How it works</p>
          <h2 className="mt-3 font-display text-5xl font-bold sm:text-6xl">
            Two minutes. <span className="font-serif font-normal italic text-hot">Zero</span> effort.
          </h2>
        </Reveal>
        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div aria-hidden className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-hot/30 md:block" />
          {[
            {
              title: "Pick an occasion",
              body: "Valentine's, Diwali or a birthday, with more on the way.",
              mock: (
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-ink px-3 py-1.5 text-sm font-bold text-white">💘 Valentine&apos;s</span>
                  <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10">🪔 Diwali</span>
                  <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold ring-1 ring-ink/10">🎂 Birthday</span>
                </div>
              ),
            },
            {
              title: "Make it yours",
              body: "Add names, photos and inside jokes. Watch it update live.",
              mock: (
                <div className="space-y-2 text-left text-sm">
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-ink/10"><span className="text-ink/40">To </span><b>Priya</b></div>
                  <div className="flex gap-2">
                    {["/demo/sunset.svg", "/demo/coffee.svg", "/demo/lights.svg"].map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element -- decorative
                      <img key={src} src={src} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ))}
                    <span className="grid h-12 w-12 place-items-center rounded-lg border-2 border-dashed border-ink/20 text-ink/40">+</span>
                  </div>
                </div>
              ),
            },
            {
              title: "Send the link",
              body: "WhatsApp, Instagram, text. They open it and the fun starts.",
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
              <div className="relative h-full rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-ink/5">
                <span className="relative z-10 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-hot to-tangerine font-display text-3xl font-bold text-white shadow-lg">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-2xl font-bold">{step.title}</h3>
                <p className="mt-1 text-ink/65">{step.body}</p>
                <div className="mt-6 rounded-2xl bg-cream p-4">{step.mock}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative overflow-hidden bg-ink py-28 text-white">
        <div aria-hidden className="absolute left-1/2 top-0 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-hot/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="font-bold uppercase tracking-[0.2em] text-hot">Pricing</p>
            <h2 className="mt-3 font-display text-5xl font-bold sm:text-6xl">
              Cheaper than <span className="font-serif font-normal italic text-sun">flowers</span>.
            </h2>
            <p className="mt-4 text-lg text-white/60">One price per card. No subscriptions. Free while we launch.</p>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {TIERS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div
                  className={`relative flex h-full flex-col rounded-[2rem] p-8 ${t.featured ? "bg-gradient-to-br from-hot via-[#d6246e] to-grape shadow-[0_30px_60px_-20px_rgba(255,46,126,0.6)]" : "bg-white/5 ring-1 ring-white/10"}`}
                >
                  {t.featured && <span className="absolute -top-3 right-6 rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink">Most magical ✨</span>}
                  <h3 className="font-display text-2xl font-bold">{t.name}</h3>
                  <p className="mt-3 font-display text-5xl font-bold">
                    {t.price}
                    <span className="ml-1 text-base font-semibold text-white/60">{t.note}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {t.points.map((p) => (
                      <li key={p} className="flex gap-3 text-white/85">
                        <span className="text-sun">✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  {t.live ? (
                    <Link href="/create" className="mt-8 rounded-full bg-white py-3.5 text-center font-display font-semibold text-ink transition hover:bg-sun">
                      Start free
                    </Link>
                  ) : (
                    <span className="mt-8 rounded-full bg-white/10 py-3.5 text-center font-display font-semibold text-white/70">Coming soon</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-28 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-5xl font-bold">Questions?</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink/5 open:ring-hot/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-semibold">
                {f.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream text-hot transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call to action */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2a0b3d] via-ink to-[#5b1a7a] py-32 text-center text-white">
        <Particles mode="fireworks" loop />
        <div className="relative mx-auto max-w-3xl px-4">
          <h2 className="font-display text-5xl font-bold leading-tight sm:text-7xl">
            Someone deserves a <span className="font-serif font-normal italic text-sun">moment</span> today.
          </h2>
          <Link
            href="/create"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-hot to-tangerine px-10 py-5 font-display text-xl font-semibold shadow-[0_14px_34px_-10px_rgba(255,46,126,0.8)] transition hover:-translate-y-0.5"
          >
            Make your card →
          </Link>
          <p className="mt-5 text-white/60">Free while we launch. No sign-up needed.</p>
        </div>
      </section>

      <footer className="bg-ink py-10 text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <Logo textClass="text-white" />
          <div className="flex gap-6 text-sm font-semibold">
            <Link href="/create" className="hover:text-white">Make a card</Link>
            <Link href="/demo/valentine" className="hover:text-white">Demos</Link>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Sending Vibes</p>
        </div>
      </footer>
    </div>
  );
}
