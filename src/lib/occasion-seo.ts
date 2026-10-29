import { fmt } from "@/i18n/config";
import type { Dict } from "@/i18n/en";
import { MAX_SCHEDULE_DAYS } from "./basket";
import { nextDate } from "./calendar";
import type { Occasion } from "./card";

// The extra words on an occasion's own page (what to write, questions people ask), from
// the dictionary's occasionSeo section. A newer occasion may not have an entry yet, and a
// language that hasn't been translated may not have the section at all, so pages must
// cope with getting nothing back.

export type Faq = { q: string; a: string };

export type OccasionSeo = {
  title: string;
  description: string;
  // The big heading, with the **red part** marked.
  heading?: string;
  aboutTitle: string;
  about: string[];
  writeTitle: string;
  ideas: { who: string; text: string }[];
  faqTitle: string;
  faqs: Faq[];
};

export function occasionSeo(t: Dict, occasion: Occasion): OccasionSeo | undefined {
  const all = (t as { occasionSeo?: Partial<Record<string, OccasionSeo>> }).occasionSeo;
  return all && Object.hasOwn(all, occasion) ? all[occasion] : undefined;
}

// These fall on the same date every year, so "When is Christmas?" isn't worth answering.
const SAME_DAY_EVERY_YEAR: readonly Occasion[] = ["valentine", "halloween", "christmas", "newyear"];

// "When is Diwali in 2026?", for occasions whose date moves. `tag` is a language tag such as "en-GB".
export function whenFaq(t: Dict, occasion: Occasion, tag: string, now = new Date()): Faq | undefined {
  if (SAME_DAY_EVERY_YEAR.includes(occasion)) return;
  const next = nextDate(occasion, now);
  if (!next) return;
  const p = t.occasionPage;
  const name = t.calendar[next.key];
  const date = next.date.toLocaleDateString(tag, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const answer = fmt(next.approx ? p.whenApprox : p.whenA, { name, date });
  return { q: fmt(p.whenQ, { name, year: next.date.getUTCFullYear() }), a: `${answer} ${fmt(p.whenSend, { days: MAX_SCHEDULE_DAYS })}` };
}
