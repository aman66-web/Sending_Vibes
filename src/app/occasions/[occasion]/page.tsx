import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductTile } from "@/components/catalog/ProductTile";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDay, nextDate, whenLabel } from "@/lib/calendar";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { PRICES } from "@/lib/pricing";
import { occasions } from "@/lib/templates";

// Refreshed hourly so "in 5 days" stays true.
export const revalidate = 3600;

const INTROS: Record<Occasion, string> = {
  valentine: "Ask them to be your Valentine with a No button they can never press, then hit them with photos, a love letter and a shower of hearts.",
  birthday: "Candles to blow out, balloons to pop, a piñata to smash and a confetti finale. A birthday card they'll actually play with.",
  diwali: "Light the diyas, release sky lanterns and fill the sky with fireworks, all from their phone. Happy Diwali, minus the smoke.",
  christmas: "Unwrap presents, catch the snow and open a jar of reasons you're grateful for them. Christmas cards that feel like a present.",
  eid: "Send Eid wishes with an Eid hug they can feel, a feast wheel, the stars and moon, and plenty of cheeky Eidi requests.",
  anniversary: "Your story told moment by moment, your photos, love coupons and a jar of reasons. For every year you've been together.",
  sorry: "Say sorry in a way they can't say no to: a runaway No button, a hug they press and hold, and coupons to make it up to them.",
  thanks: "Grow them a thank-you flower, show them a gallery of appreciation and finish with confetti. For teachers, nurses, neighbours and friends.",
  congrats: "For new jobs, exams and big wins: pop the balloons, pull the jackpot and tell them just how proud you are.",
  halloween: "Trick or treat (the Trick button runs away), whack the ghosts and fill a sweet bag. Spooky, silly and only a little bit scary.",
  newyear: "Launch midnight fireworks, spin the wheel for their resolution and look back on the year together.",
  mothersday: "Grow Mum a flower, give her a coupon book she'll actually use and remind her who her favourite is.",
  fathersday: "A quiz of terrible dad jokes, a hall of fame and a proper thank you. For the best dad (and his jokes).",
  rakhi: "For your brother or sister: a promise they can't refuse, a book of rakhi gifts they owe you and your photos growing up.",
  holi: "Splash colour all over the screen with a finger, spin for their colour and send Holi wishes. No stains, all the fun.",
  newbaby: "Welcome the little one with a lullaby and wishes from a jar, or scratch to reveal a gender or a pregnancy announcement.",
  wedding: "Propose with a No button that runs away, ask your bridesmaids or toast the happy couple with photos and confetti.",
  getwell: "A hug they can press and hold, prescriptions for naps and ice cream, and bubble wrap to pop on the sofa.",
  missyou: "For long distance: a hug that travels, a jar of things you miss and coupons for when you're together again.",
  friendship: "A bestie quiz, friendship coupons and a gallery of your most iconic photos. For your favourite person to text.",
  leaving: "Send off a colleague with everything the team will miss, a leaving-present slot machine and a lot of good luck.",
};

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
  const label = occasions[o].label;
  return {
    title: `Interactive ${label} cards · Sending Vibes`,
    description: `${INTROS[o]} Personalise one in two minutes, no coding.`,
    alternates: { canonical: `/occasions/${o}` },
  };
}

export default async function OccasionPage({ params }: Props) {
  const o = find((await params).occasion);
  if (!o) notFound();
  const info = occasions[o];
  const designs = TEMPLATES.filter((t) => t.occasion === o);
  const next = nextDate(o);

  return (
    <div className="min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-hot/15 blur-3xl" />
          <div className="absolute -right-40 top-10 h-[26rem] w-[26rem] rounded-full bg-grape/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
          <nav className="text-sm font-semibold text-ink/50">
            <Link href="/cards" className="hover:text-ink">All cards</Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{info.label}</span>
          </nav>
          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="text-6xl">{info.emoji}</span>
              <h1 className="mt-3 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
                Interactive <span className="text-hot">{info.label}</span> cards
              </h1>
              <p className="mt-4 text-lg text-ink/65">{INTROS[o]}</p>
              {next && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-ink/5">
                  📅 {next.name} is {formatDay(next.date, next.approx)} · <span className="text-hot">{whenLabel(next.days)}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <Link
                href={`/create?occasion=${o}`}
                className="rounded-full bg-ink px-7 py-4 text-center font-display text-lg font-semibold text-white shadow-xl shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-hot"
              >
                Make a {info.label} card · {PRICES.card.label}
              </Link>
              <a href="#designs" className="rounded-full bg-white px-7 py-4 text-center font-display text-lg font-semibold ring-1 ring-ink/10 transition hover:-translate-y-0.5">
                See the {designs.length} designs ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      <main id="designs" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {designs.map((t) => (
            <ProductTile key={t.slug} template={t} />
          ))}
        </div>

        <section className="mt-20 grid gap-5 md:grid-cols-3">
          {[
            { emoji: "✏️", title: "Just fill in the blanks", body: "Their name, your photos, your words. No design skills, no coding, about two minutes." },
            { emoji: "🎮", title: "They play it, not just read it", body: "Games, a runaway No button, music and a big finale. It's the card they show everyone." },
            { emoji: "🔗", title: "Send it as a link", body: "WhatsApp, text or Instagram. It opens in their browser on any phone or computer. Nothing to download." },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink/5">
              <span className="text-3xl">{f.emoji}</span>
              <h2 className="mt-3 font-display text-xl font-bold">{f.title}</h2>
              <p className="mt-1 text-ink/65">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-20">
          <h2 className="font-display text-3xl font-bold">More occasions</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {OCCASIONS.filter((x) => x !== o).map((x) => (
              <Link key={x} href={`/occasions/${x}`} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink/75 ring-1 ring-ink/10 transition hover:text-ink hover:ring-hot">
                {occasions[x].emoji} {occasions[x].label}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
