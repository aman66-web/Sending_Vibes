import Link from "next/link";
import { Postmark } from "@/components/Postmark";
import { fmt, LANGUAGES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { dateName, formatDay, upcoming, whenLabel } from "@/lib/calendar";
import { TEMPLATES } from "@/lib/catalog";
import { occasions } from "@/lib/templates";

// The next few occasions, so people remember to send something in time.
export async function ComingUp() {
  const { locale, t } = await getI18n();
  const { tag } = LANGUAGES[locale];
  const next = upcoming(new Date(), 4);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {next.map((d, i) => {
        const count = TEMPLATES.filter((x) => x.occasion === d.occasion).length;
        const first = i === 0;
        return (
          <Link
            key={`${d.occasion}-${d.date.toISOString()}`}
            href={`/occasions/${d.occasion}`}
            className={`sheet group relative flex min-h-44 flex-col overflow-hidden p-5 transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_var(--color-ink)] ${first ? "bg-hot text-white" : ""}`}
          >
            <Postmark
              id={`pm-${i}`}
              middle={whenLabel(d.days, t)}
              bottom={formatDay(d.date, tag, t)}
              className={`absolute -right-6 top-3 w-40 -rotate-[8deg] ${first ? "text-white/90" : "text-hot/85"}`}
            />
            <span className="text-4xl transition group-hover:-rotate-6">{occasions[d.occasion].emoji}</span>
            <p className="mt-auto pt-8 font-brand text-2xl font-bold leading-tight">{dateName(d, t)}</p>
            <p className={`mt-0.5 text-sm font-semibold ${first ? "text-white/75" : "text-ink/55"}`}>
              {formatDay(d.date, tag, t, d.approx)} · {whenLabel(d.days, t)}
            </p>
            <p className={`mt-3 text-sm font-bold underline decoration-2 underline-offset-4 ${first ? "decoration-white/60" : "decoration-hot/50"}`}>
              {fmt(t.common.designs, { n: count })} →
            </p>
          </Link>
        );
      })}
    </div>
  );
}
