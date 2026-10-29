"use client";

import Link from "next/link";
import { Motif } from "@/components/card/motifs";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Made } from "@/lib/basket";
import type { CardData } from "@/lib/card";
import { themes } from "@/lib/themes";
import type { Draft, SavedQuiz, Waiting } from "./drafts";

// Before starting something new: the cards and answers from before, to carry on with in
// one tap, or start a new one.

type Props = {
  waiting: Waiting;
  onDraft: (draft: Draft) => void;
  onAdded: (made: Made) => void;
  onQuiz: (quiz: SavedQuiz) => void;
  onNew: () => void;
};

export function CarryOn({ waiting, onDraft, onAdded, onQuiz, onNew }: Props) {
  const { t } = useI18n();
  const c = t.create;
  const { draft, added, quiz, cantOpen } = waiting;
  const quizName = quiz ? (quiz.answers.to || quiz.to).trim() : "";
  const any = Boolean(draft || added || quiz);
  return (
    <section aria-labelledby={any ? "carry-on-title" : undefined} className="mx-auto max-w-3xl px-4 pt-6">
      <div className="rounded-3xl border-2 border-brand/50 bg-panel p-4 shadow-sm sm:p-5">
        {cantOpen && (
          <div role="alert" className="mb-4">
            <p className="text-lg font-semibold leading-snug">{c.cantOpen}</p>
            <Link href="/basket" className="mt-3 inline-flex min-h-12 items-center rounded-full border-2 border-foreground/80 px-5 text-base font-semibold">
              {c.toBasket}
            </Link>
          </div>
        )}
        {any && (
          <>
            <h2 id="carry-on-title" className="font-brand text-2xl font-bold leading-tight">
              {c.carryOnTitle}
            </h2>
            <div className="mt-3 space-y-2">
              {added && <Choice card={added.card} label={fmt(c.carryOnBasket, { name: added.card.to })} hint={c.carryOnBasketHint} onClick={() => onAdded(added)} />}
              {draft && <Choice card={draft.card} label={fmt(c.carryOnDraft, { name: draft.card.to })} hint={c.carryOnDraftHint} onClick={() => onDraft(draft)} />}
              {quiz && <Choice label={quizName ? fmt(c.carryOnQuiz, { name: quizName }) : c.carryOnAnswers} hint={c.carryOnQuizHint} onClick={() => onQuiz(quiz)} />}
            </div>
          </>
        )}
        <button type="button" onClick={onNew} className="mt-3 min-h-12 w-full rounded-full border-2 border-line px-5 font-semibold transition hover:border-foreground/40">
          {c.startNew}
        </button>
      </div>
    </section>
  );
}

// One thing to carry on with: a little front of the card in its own colours, or a note for answers.
function Choice({ card, label, hint, onClick }: { card?: CardData; label: string; hint: string; onClick: () => void }) {
  const theme = card ? (themes[card.theme] ?? themes.rose) : null;
  return (
    <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-brand bg-background p-3 text-start transition hover:bg-brand-soft">
      {card && theme ? (
        <span aria-hidden className="relative grid aspect-[4/5] w-11 shrink-0 place-items-center rounded-sm shadow-sm" style={{ background: theme.background, color: theme.accent }}>
          <span className="absolute inset-[8%] border" style={{ borderColor: theme.muted, opacity: 0.55 }} />
          <Motif occasion={card.occasion} className="h-6 w-6" />
        </span>
      ) : (
        <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center text-3xl">
          📝
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span dir="auto" className="block text-lg font-semibold leading-snug">
          {label}
        </span>
        <span className="block text-sm opacity-70">{hint}</span>
      </span>
      <span aria-hidden className="text-2xl text-brand rtl:rotate-180">
        →
      </span>
    </button>
  );
}
