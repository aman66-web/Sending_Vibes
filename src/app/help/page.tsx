import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { PRICES } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Help & FAQ · Sending Vibes",
  description: "How interactive cards work, how to make and send one, and answers to common questions.",
};

const GROUPS: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: "Making a card",
    items: [
      {
        q: "How do I make a card?",
        a: (
          <>
            Go to <Link href="/create">Make a card</Link>, pick an occasion and a design, type their name and yours, then change anything you like. You&apos;ll see a live
            preview as you go. When you&apos;re happy, press <b>Create my card</b> and you&apos;ll get a link to send.
          </>
        ),
      },
      { q: "Do I need any design or coding skills?", a: "None at all. Every design is already built. You just fill in the blanks: names, photos and words." },
      {
        q: "What can I change?",
        a: "Every word on every screen, the colours, the background effect and the music. You can add, remove and reorder screens, add up to 6 photos, write your own quiz questions, coupons, reasons and story moments, and choose from 21 mini games.",
      },
      { q: "Can I save my card and finish it later?", a: "Yes. Unfinished cards are saved in your browser automatically, so you can close the page and carry on later on the same device." },
      {
        q: "Which design should I pick?",
        a: (
          <>
            There are {TEMPLATES.length} designs across {OCCASIONS.length} occasions, from funny to heartfelt. Hover over any card in the <Link href="/cards">collection</Link> and
            press play to try it first. Most work on any device; a few are made for phones (shaking, scratching) or for computers (mouse games, photo walls).
          </>
        ),
      },
    ],
  },
  {
    title: "Sending and opening",
    items: [
      { q: "How do I send it?", a: "You get a link. Send it however you like: WhatsApp, text, Instagram, email. There's a WhatsApp button and a copy button to make it quick." },
      { q: "Do they need to download anything?", a: "No. The link opens in their web browser on any phone, tablet or computer." },
      { q: "Does it have sound?", a: "Yes. Cards have sound effects and music, which start when they tap the envelope. There's a mute button in the corner if they're somewhere quiet." },
      { q: "Can they open it more than once?", a: "As many times as they like. There's a 'Play it again' button at the end too." },
    ],
  },
  {
    title: "Privacy",
    items: [
      { q: "Who can see my card?", a: "Only people who have the link. Links are long random codes, and cards aren't listed, searchable or shown anywhere on the site." },
      { q: "What happens to my photos?", a: "They're resized on your own device before upload, which also removes hidden location data. They're only used in your card." },
      {
        q: "Where can I read more?",
        a: (
          <>
            See our <Link href="/privacy">privacy page</Link> for the details.
          </>
        ),
      },
    ],
  },
  {
    title: "Price",
    items: [
      { q: "How much does a card cost?", a: `${PRICES.card.label} per card, paid once. No subscription and no hidden extras.` },
      { q: "What is AI Custom?", a: `Coming soon: for ${PRICES.aiCustom.label}, you'll be able to describe changes in plain English and have them made for you, like custom quizzes about you two.` },
    ],
  },
];

export default function HelpPage() {
  return (
    <InfoPage title="Help and questions" intro="Everything you need to know about making, sending and opening an interactive card.">
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="font-brand text-2xl font-bold">{g.title}</h2>
          <div className="mt-4 space-y-3">
            {g.items.map((item) => (
              <details key={item.q} className="group rounded-2xl border-2 border-ink bg-paper p-5 shadow-[3px_3px_0_var(--color-ink)] open:shadow-[5px_5px_0_var(--color-hot)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-brand text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink font-sans text-xl font-bold leading-none transition group-open:rotate-45 group-open:bg-hot group-open:text-white">+</span>
                </summary>
                <div className="mt-3 leading-relaxed text-ink/70 [&_a]:font-semibold [&_a]:underline [&_a]:decoration-hot [&_a]:decoration-2 [&_a]:underline-offset-4">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}
      <div className="sheet relative overflow-hidden bg-ink p-8 pt-10 text-center text-paper">
        <div aria-hidden className="airmail absolute inset-x-0 top-0 h-2" />
        <p className="font-brand text-2xl font-bold">Ready to make one?</p>
        <Link href="/create" className="btn btn-red mt-4 shadow-[3px_3px_0_var(--color-sun)]">
          Make a card →
        </Link>
      </div>
    </InfoPage>
  );
}
