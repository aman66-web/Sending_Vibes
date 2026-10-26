import Link from "next/link";
import { formatDay, upcoming, whenLabel } from "@/lib/calendar";
import { TEMPLATES } from "@/lib/catalog";
import { occasions } from "@/lib/templates";

// The next few occasions, so people remember to send something in time.
export function ComingUp() {
  const next = upcoming(new Date(), 4);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {next.map((d, i) => {
        const count = TEMPLATES.filter((t) => t.occasion === d.occasion).length;
        return (
          <Link
            key={`${d.occasion}-${d.date.toISOString()}`}
            href={`/occasions/${d.occasion}`}
            className={`group relative overflow-hidden rounded-3xl p-5 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-lg ${
              i === 0 ? "bg-ink text-white ring-ink" : "bg-white ring-ink/5"
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl transition group-hover:scale-110">{occasions[d.occasion].emoji}</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${i === 0 ? "bg-hot text-white" : "bg-hot/10 text-hot"}`}>{whenLabel(d.days)}</span>
            </div>
            <p className="mt-4 font-display text-xl font-bold leading-tight">{d.name}</p>
            <p className={`mt-0.5 text-sm font-semibold ${i === 0 ? "text-white/60" : "text-ink/50"}`}>{formatDay(d.date, d.approx)}</p>
            <p className={`mt-3 text-sm font-bold ${i === 0 ? "text-sun" : "text-hot"}`}>
              {count} designs <span className="inline-block transition group-hover:translate-x-1">→</span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
