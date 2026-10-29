import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { RichText } from "@/components/RichText";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { OCCASIONS } from "@/lib/card";
import { MAX_SCHEDULE_DAYS } from "@/lib/basket";
import { TEMPLATES } from "@/lib/catalog";
import { price } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.help.metaTitle, description: t.help.metaDescription };
}

export default async function HelpPage() {
  const { t, currency } = await getI18n();
  const values = {
    n: TEMPLATES.length,
    o: OCCASIONS.length,
    price: price("card", currency),
    aiPrice: price("custom", currency),
    days: MAX_SCHEDULE_DAYS,
  };
  // The "send abroad" answer sits with the basics.
  const groups = t.help.groups.map((g, i) => (i === 0 ? { ...g, items: [...g.items, t.common.abroad] } : g));
  return (
    <InfoPage title={t.help.title} intro={t.help.intro}>
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="font-brand text-2xl font-bold">{g.title}</h2>
          <div className="mt-4 space-y-3">
            {g.items.map((item) => (
              <details key={item.q} className="group rounded-2xl border-2 border-ink bg-paper p-5 shadow-[3px_3px_0_var(--color-ink)] open:shadow-[5px_5px_0_var(--color-hot)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-brand text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink font-sans text-xl font-bold leading-none transition group-open:rotate-45 group-open:bg-hot group-open:text-white">+</span>
                </summary>
                <div className="mt-3 leading-relaxed text-ink/70 [&_a]:font-semibold [&_a]:underline [&_a]:decoration-hot [&_a]:decoration-2 [&_a]:underline-offset-4">
                  <RichText text={fmt(item.a, values)} linkClass="" />
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
      <div className="sheet relative overflow-hidden bg-ink p-8 pt-10 text-center text-paper">
        <div aria-hidden className="airmail absolute inset-x-0 top-0 h-2" />
        <p className="font-brand text-2xl font-bold">{t.help.ready}</p>
        <Link href="/create" className="btn btn-red mt-4 shadow-[3px_3px_0_var(--color-sun)]">
          {t.help.cta}
        </Link>
      </div>
    </InfoPage>
  );
}
