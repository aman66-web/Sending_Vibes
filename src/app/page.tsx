import Link from "next/link";
import { OCCASIONS } from "@/lib/card";
import { occasions } from "@/lib/templates";

const STEPS = [
  { emoji: "🎨", title: "Pick an occasion", body: "Valentine's, Diwali, birthdays, with more on the way." },
  { emoji: "📸", title: "Make it yours", body: "Add your photos, inside jokes and messages. See it live as you go." },
  { emoji: "💌", title: "Send the link", body: "WhatsApp, Instagram, text. They tap through it like a mini adventure." },
];

const TIERS = [
  {
    name: "Free",
    price: "£0",
    points: ["Any template", "Edit all the words", "Small Sending Vibes credit on the card"],
    cta: "Start free",
    live: true,
  },
  {
    name: "Personal",
    price: "£3.99",
    points: ["Up to 6 of your photos", "No branding", "Keep it forever"],
    cta: "Coming soon",
    live: false,
  },
  {
    name: "AI Custom",
    price: "£9.99",
    points: ["Everything in Personal", "Just type what you want changed", "Custom games, quizzes and surprises"],
    cta: "Coming soon",
    live: false,
    highlight: true,
  },
];

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="font-display text-xl font-bold text-brand">Sending Vibes 💌</span>
        <Link href="/create" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
          Make a card
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <div>
          <p className="inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">E-cards, but actually fun</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
            Don&apos;t send a card.
            <br />
            <span className="text-brand">Send a moment.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg opacity-80">
            Interactive cards with a No button that runs away, mini games, your photos and a big finish. Made in two minutes and sent as a link.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="rounded-full bg-brand px-7 py-3.5 font-display text-lg font-semibold text-white shadow-lg shadow-brand/30">
              Make one now
            </Link>
            <Link href="/demo/valentine" className="rounded-full border border-line px-7 py-3.5 font-display text-lg font-semibold">
              Try the demo 💘
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-pink-300/50 via-rose-200/40 to-amber-200/50 blur-2xl" />
          <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#ffe4ec] to-[#ff9ebb] p-8 text-center text-[#4a0d24] shadow-2xl">
            <div className="text-6xl">🥺</div>
            <p className="mt-4 font-display text-3xl font-bold leading-tight">Will you be my Valentine?</p>
            <div className="relative mt-8 h-40">
              <span className="absolute left-1/2 top-2 -translate-x-[115%] rounded-full bg-[#e11d63] px-7 py-3 font-display font-semibold text-white shadow-lg">
                Yes! 💖
              </span>
              <span className="absolute right-0 top-24 rotate-6 rounded-full bg-white px-5 py-2.5 font-display text-sm font-semibold shadow">
                Nice try 😏
              </span>
              <span className="absolute right-10 top-16 text-2xl">👆</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-soft/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center font-display text-4xl font-bold">Pick your vibe</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {OCCASIONS.map((o) => (
              <div key={o} className="flex flex-col rounded-3xl border border-line bg-panel p-6 shadow-sm">
                <div className="text-5xl">{occasions[o].emoji}</div>
                <h3 className="mt-3 font-display text-2xl font-bold">{occasions[o].label}</h3>
                <p className="mt-1 flex-1 opacity-75">{occasions[o].tagline}</p>
                <div className="mt-5 flex gap-2">
                  <Link href={`/create?occasion=${o}`} className="flex-1 rounded-full bg-brand py-2.5 text-center font-semibold text-white">
                    Make one
                  </Link>
                  <Link href={`/demo/${o}`} className="flex-1 rounded-full border border-line py-2.5 text-center font-semibold">
                    Demo
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-4xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-3xl">{s.emoji}</div>
              <p className="mt-4 text-sm font-bold text-brand">Step {i + 1}</p>
              <h3 className="font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-1 opacity-75">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="text-center font-display text-4xl font-bold">Simple pricing</h2>
        <p className="mt-2 text-center opacity-70">One price per card. No subscriptions.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-3xl border p-6 ${t.highlight ? "border-brand bg-brand text-white shadow-xl shadow-brand/30" : "border-line bg-panel"}`}
            >
              <h3 className="font-display text-xl font-bold">{t.name}</h3>
              <p className="mt-2 font-display text-4xl font-bold">
                {t.price}
                <span className="text-base font-normal opacity-70"> / card</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {t.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              {t.live ? (
                <Link href="/create" className="mt-6 rounded-full bg-brand py-3 text-center font-semibold text-white">
                  {t.cta}
                </Link>
              ) : (
                <span className={`mt-6 rounded-full py-3 text-center font-semibold ${t.highlight ? "bg-white/20" : "bg-brand-soft text-brand"}`}>{t.cta}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm opacity-60">© {new Date().getFullYear()} Sending Vibes</footer>
    </div>
  );
}
