"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductThumb } from "@/components/catalog/ProductThumb";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { TEMPLATES, getTemplate } from "@/lib/catalog";
import { price } from "@/lib/pricing";

// The two ways to make a card, side by side: personalised (made from scratch from
// their answers) or a ready-made design (their words written into it). On the
// homepage they link into the card maker; in the card maker they pick the way.

export type Way = "custom" | "premade";

export function TwoWays({ onPick }: { onPick?: (way: Way) => void }) {
  const { t, currency } = useI18n();
  const c = t.create;
  const describe = t.quiz.questions.describe;
  const ways = [
    {
      way: "custom" as const,
      featured: true,
      title: c.personalTitle,
      easy: c.personalEasy,
      body: c.personalBody,
      steps: c.personalSteps,
      price: price("custom", currency),
      cta: c.personalCta,
      visual: <QuestionDemo question={describe.title} answer={describe.placeholder.replace(/^e\.g\.\s*/, "")} />,
    },
    {
      way: "premade" as const,
      featured: false,
      title: c.readyTitle,
      easy: c.readyEasy,
      body: fmt(c.readyBody, { n: TEMPLATES.length }),
      steps: c.readySteps,
      price: price("card", currency),
      cta: c.readyCta,
      visual: <ThumbFan slugs={["birthday-bash", "be-my-valentine", "festival-of-lights"]} />,
    },
  ];
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {ways.map((w, i) => {
        const inside = (
          <>
            <div className="relative grid h-44 place-items-center overflow-hidden border-b-2 border-ink bg-cream px-6">
              {/* "Option 1" and "Option 2", so it's clear there are two to choose from. */}
              <span className="absolute start-3 top-3 z-10 rounded-full border-2 border-ink bg-paper px-3 py-1 font-brand text-sm font-black uppercase tracking-wide">
                {fmt(c.option, { n: i + 1 })}
              </span>
              {w.visual}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-brand text-3xl font-bold leading-tight">{w.title}</h3>
              <p className="mt-1 text-sm font-bold uppercase tracking-wide text-hot">{w.easy}</p>
              <p className="mt-3 leading-relaxed text-ink/75">{w.body}</p>
              <ol className="mt-4 flex-1 space-y-2 text-sm font-semibold">
                {w.steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-black text-paper">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-5 font-brand text-3xl font-black">
                {w.price} <span className="font-sans text-sm font-semibold text-ink/55">{t.common.perCard}</span>
              </p>
              <span className={`btn mt-4 w-full py-3 text-lg ${w.featured ? "btn-red" : "btn-paper"}`}>{w.cta} →</span>
            </div>
          </>
        );
        const className = `group sheet relative flex flex-col overflow-hidden text-start text-ink transition hover:-translate-y-1 ${w.featured ? "bg-sun/25" : ""}`;
        return onPick ? (
          <button key={w.way} onClick={() => onPick(w.way)} className={className}>
            {inside}
          </button>
        ) : (
          <Link key={w.way} href={`/create?start=${w.way}`} className={className}>
            {inside}
          </Link>
        );
      })}
    </div>
  );
}

// A question from the quiz with an answer typing itself out, for the personalised way.
function QuestionDemo({ question, answer }: { question: string; answer: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setShown((n) => (n >= answer.length + 40 ? 0 : n + 1)), 45);
    return () => clearInterval(timer);
  }, [answer]);
  return (
    <div className="w-full max-w-sm text-start" aria-hidden>
      <p className="font-brand text-lg font-bold leading-tight">{question}</p>
      <div className="mt-2 rounded-2xl border-2 border-ink/15 bg-paper p-3 text-sm leading-snug">
        <span dir="auto">{answer.slice(0, shown)}</span>
        <span className="ms-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-hot" />
      </div>
    </div>
  );
}

// Three design fronts fanned out, for the ready-made way.
function ThumbFan({ slugs }: { slugs: string[] }) {
  return (
    <div className="relative h-40 w-72" aria-hidden>
      {slugs.map((slug, i) => {
        const tpl = getTemplate(slug);
        return (
          tpl && (
            <div key={slug} className="absolute top-1 w-28 shadow-md transition duration-300 group-hover:-translate-y-1" style={{ left: `${i * 28}%`, rotate: `${(i - 1) * 8}deg`, zIndex: i === 1 ? 2 : 1 }}>
              <ProductThumb template={tpl} />
            </div>
          )
        );
      })}
    </div>
  );
}
