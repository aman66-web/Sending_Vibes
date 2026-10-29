import Link from "next/link";
import { LANGUAGES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { formatDay, upcoming, whenLabel } from "@/lib/calendar";
import { occasions } from "@/lib/templates";

// The next few dates worth a card, shown while the buyer is happy with the one they just
// sent. Each starts a card for that occasion with their name already filled in.
export async function NextOccasions({ from }: { from: string }) {
  const { locale, t } = await getI18n();
  const th = t.basket.thanks;
  const { tag } = LANGUAGES[locale];
  const next = upcoming(new Date(), 3);
  if (!next.length) return null;
  return (
    <section aria-labelledby="next-occasions" className="mt-14">
      <h2 id="next-occasions" className="font-brand text-3xl font-bold leading-tight">
        {th.nextTitle}
      </h2>
      <p className="mt-1 text-ink/65">{th.nextIntro}</p>
      <ul className="mt-5 space-y-3">
        {next.map((d) => (
          <li key={`${d.occasion}-${d.date.toISOString()}`}>
            <Link
              href={`/create?occasion=${d.occasion}&from=${encodeURIComponent(from)}`}
              className="sheet flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--color-ink)]"
            >
              <span aria-hidden className="text-4xl">
                {occasions[d.occasion].emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-brand text-xl font-bold leading-tight">{t.calendar[d.key]}</span>
                <span className="block text-sm font-semibold text-ink/60">
                  {formatDay(d.date, tag, t, d.approx)} · {whenLabel(d.days, t)}
                </span>
                <span className="mt-1 block font-semibold underline decoration-hot decoration-2 underline-offset-4 sm:hidden">{th.nextMake} →</span>
              </span>
              <span className="hidden shrink-0 font-semibold underline decoration-hot decoration-2 underline-offset-4 sm:block">{th.nextMake} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
