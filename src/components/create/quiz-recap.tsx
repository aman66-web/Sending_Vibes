"use client";

import { useI18n } from "@/i18n/client";

// "Your card": every answer on one screen before it's made, each a tap away from
// changing, so a misspelt name or the wrong occasion is caught before it's written.

export type RecapLine = { key: string; emoji: string; text: string; onChange: () => void };

export function Recap({ lines }: { lines: RecapLine[] }) {
  const q = useI18n().t.quiz;
  return (
    <section aria-labelledby="quiz-recap" className="mt-10 rounded-3xl border-2 border-line bg-panel p-4 sm:p-5">
      <h2 id="quiz-recap" className="font-brand text-2xl font-bold">
        {q.recap.title}
      </h2>
      <p className="mt-1 opacity-70">{q.recap.hint}</p>
      <ul className="mt-3 divide-y divide-line">
        {lines.map((line) => (
          <li key={line.key}>
            <button type="button" onClick={line.onChange} className="flex min-h-12 w-full items-center gap-3 py-2.5 text-start">
              <span aria-hidden className="text-xl">
                {line.emoji}
              </span>
              <span dir="auto" className="min-w-0 flex-1 text-lg leading-snug">
                {line.text}
              </span>
              <span className="shrink-0 font-semibold text-brand underline underline-offset-4">{q.recap.change}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
