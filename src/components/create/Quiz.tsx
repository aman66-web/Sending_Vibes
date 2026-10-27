"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Dict } from "@/i18n/en";
import { OCCASIONS, type Occasion, type ScreenType } from "@/lib/card";
import { TONES, type Tone } from "@/lib/catalog";
import { price } from "@/lib/pricing";
import { occasions } from "@/lib/templates";

// Eight quick questions that become the description a custom card is written from.

export type Answers = {
  to: string;
  relation: string;
  occasion: Occasion | "";
  vibes: Tone[];
  about: string;
  message: string;
  include: (ScreenType | "surprise")[];
  from: string;
  // Typed into "Other" when none of the choices fit.
  occasionOther: string;
  vibeOther: string;
  includeOther: string;
};

export const NO_ANSWERS: Answers = {
  to: "",
  relation: "",
  occasion: "",
  vibes: [],
  about: "",
  message: "",
  include: [],
  from: "",
  occasionOther: "",
  vibeOther: "",
  includeOther: "",
};

const QUESTIONS = ["to", "relation", "occasion", "vibe", "about", "message", "include", "from"] as const;
export const QUIZ_LENGTH = QUESTIONS.length;
const INCLUDE: ScreenType[] = ["game", "quiz", "question", "photos", "wheel", "scratch", "coupons", "reasons", "timeline", "boxes", "typeit", "slider"];

// The answers written out for the card writer. Labels are in the visitor's language.
export function quizPrompt(a: Answers, t: Dict) {
  const lines = [
    `Occasion: ${a.occasion ? t.occasions[a.occasion].label : a.occasionOther.trim() || "none in particular"}`,
    `It's for ${a.to.trim()}${a.relation.trim() ? ` (${a.relation.trim()})` : ""}, from ${a.from.trim()}.`,
  ];
  const feel = [...a.vibes.map((v) => t.tones[v]), a.vibeOther.trim()].filter(Boolean);
  if (feel.length) lines.push(`How it should feel: ${feel.join(", ")}`);
  if (a.about.trim()) lines.push(`About ${a.to.trim()}: ${a.about.trim()}`);
  if (a.message.trim()) lines.push(`What I most want them to know: ${a.message.trim()}`);
  const include = [...a.include.filter((x): x is ScreenType => x !== "surprise").map((x) => t.labels.screens[x]), a.includeOther.trim()].filter(Boolean);
  if (include.length) lines.push(`Please include: ${include.join(", ")}`);
  return lines.join("\n");
}

type Props = {
  answers: Answers;
  setAnswers: (update: (a: Answers) => Answers) => void;
  index: number;
  setIndex: (i: number) => void;
  onGenerate: () => void;
  onDescribe: () => void;
  onPremade: () => void;
};

export function Quiz({ answers, setAnswers, index, setIndex, onGenerate, onDescribe, onPremade }: Props) {
  const { t, currency } = useI18n();
  const q = t.quiz;
  const key = QUESTIONS[index];
  const question = q.questions[key];
  const name = answers.to.trim() || q.them;
  const last = index === QUESTIONS.length - 1;
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const required = key === "to" || key === "occasion" || key === "from";
  const ready = key === "to" ? answers.to.trim() : key === "occasion" ? answers.occasion || answers.occasionOther.trim() : key === "from" ? answers.from.trim() : true;
  // Which questions have their "Other" box open.
  const [other, setOther] = useState<Partial<Record<(typeof QUESTIONS)[number], boolean>>>({});
  const openOther = () => setOther((o) => ({ ...o, [key]: true }));
  const customRelation = Boolean(answers.relation && !q.relations.includes(answers.relation));

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, [index]);

  const set = <K extends keyof Answers>(field: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [field]: value }));
  const next = () => {
    if (!ready) return;
    if (last) onGenerate();
    else setIndex(index + 1);
  };
  // Single choices move on by themselves, after a beat so the tap registers.
  const pickAndGo = (apply: () => void) => {
    apply();
    setTimeout(() => setIndex(index + 1), 220);
  };
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const chip = (selected: boolean, shape = "rounded-full") =>
    `${shape} border-2 px-4 py-2.5 text-start font-semibold transition ${selected ? "border-brand bg-brand text-white" : "border-line bg-panel hover:-translate-y-0.5 hover:border-brand"}`;
  const field = "w-full rounded-2xl border-2 border-line bg-panel px-5 py-4 text-lg outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-2xl flex-col px-4 py-8 sm:py-12">
      <div className="flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="shrink-0 text-sm font-semibold opacity-60">{fmt(q.progress, { n: index + 1, total: QUESTIONS.length })}</span>
      </div>
      {index === 0 && <p className="mt-6 opacity-70">{q.intro}</p>}

      <form
        key={key}
        className="mt-8 flex flex-1 animate-screen-in flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <h1 className="font-brand text-4xl font-bold leading-tight sm:text-5xl">{fmt(question.title, { name })}</h1>
        <p className="mt-3 text-lg opacity-70">{question.hint}</p>

        <div className="mt-8">
          {key === "to" && (
            <input ref={input} value={answers.to} maxLength={40} dir="auto" onChange={(e) => set("to", e.target.value)} placeholder={q.questions.to.placeholder} aria-label={question.title} className={field} />
          )}
          {key === "from" && (
            <input ref={input} value={answers.from} maxLength={40} dir="auto" onChange={(e) => set("from", e.target.value)} placeholder={q.questions.from.placeholder} aria-label={question.title} className={field} />
          )}
          {key === "relation" && (
            <>
              <div className="flex flex-wrap gap-2">
                {q.relations.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setOther((o) => ({ ...o, relation: false }));
                      pickAndGo(() => set("relation", answers.relation === r ? "" : r));
                    }}
                    className={chip(answers.relation === r)}
                  >
                    {r}
                  </button>
                ))}
                <OtherChip label={q.other} on={Boolean(other.relation) || customRelation} onClick={openOther} className={chip} />
              </div>
              {(other.relation || customRelation) && (
                <OtherInput value={customRelation ? answers.relation : ""} max={40} onChange={(v) => set("relation", v)} placeholder={q.questions.relation.placeholder} className={field} />
              )}
            </>
          )}
          {key === "occasion" && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {OCCASIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => {
                      setOther((x) => ({ ...x, occasion: false }));
                      pickAndGo(() => setAnswers((a) => ({ ...a, occasion: o, occasionOther: "" })));
                    }}
                    className={chip(answers.occasion === o, "rounded-2xl")}
                  >
                    <span className="me-1.5">{occasions[o].emoji}</span>
                    {t.occasions[o].label}
                  </button>
                ))}
                <OtherChip label={q.other} on={Boolean(other.occasion || answers.occasionOther)} onClick={openOther} className={(on) => chip(on, "rounded-2xl")} />
              </div>
              {(other.occasion || answers.occasionOther) && (
                <OtherInput
                  value={answers.occasionOther}
                  max={60}
                  onChange={(v) => setAnswers((a) => ({ ...a, occasionOther: v, occasion: "" }))}
                  placeholder={q.questions.occasion.placeholder}
                  className={field}
                />
              )}
            </>
          )}
          {key === "vibe" && (
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button key={tone} type="button" aria-pressed={answers.vibes.includes(tone)} onClick={() => set("vibes", toggle(answers.vibes, tone))} className={chip(answers.vibes.includes(tone))}>
                  {t.tones[tone]}
                </button>
              ))}
              <OtherChip label={q.other} on={Boolean(other.vibe || answers.vibeOther)} onClick={openOther} className={chip} />
              {(other.vibe || answers.vibeOther) && (
                <OtherInput value={answers.vibeOther} max={100} onChange={(v) => set("vibeOther", v)} placeholder={q.questions.vibe.placeholder} className={field} />
              )}
            </div>
          )}
          {(key === "about" || key === "message") && (
            <textarea
              ref={input}
              value={answers[key]}
              maxLength={400}
              rows={4}
              dir="auto"
              onChange={(e) => set(key, e.target.value)}
              placeholder={q.questions[key].placeholder}
              aria-label={fmt(question.title, { name })}
              className={`${field} resize-y leading-relaxed`}
            />
          )}
          {key === "include" && (
            <div className="flex flex-wrap gap-2">
              {INCLUDE.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={answers.include.includes(type)}
                  onClick={() => set("include", toggle(answers.include.filter((x) => x !== "surprise"), type))}
                  className={chip(answers.include.includes(type))}
                >
                  {t.labels.screens[type]}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={answers.include.includes("surprise")}
                onClick={() => set("include", answers.include.includes("surprise") ? [] : ["surprise"])}
                className={chip(answers.include.includes("surprise"))}
              >
                ✨ {q.surprise}
              </button>
              <OtherChip label={q.other} on={Boolean(other.include || answers.includeOther)} onClick={openOther} className={chip} />
              {(other.include || answers.includeOther) && (
                <OtherInput
                  value={answers.includeOther}
                  max={200}
                  onChange={(v) => setAnswers((a) => ({ ...a, includeOther: v, include: a.include.filter((x) => x !== "surprise") }))}
                  placeholder={q.questions.include.placeholder}
                  className={field}
                />
              )}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center gap-3 pt-10">
          {index > 0 && (
            <button type="button" onClick={() => setIndex(index - 1)} className="rounded-full border-2 border-line px-5 py-3 font-semibold hover:border-foreground/40">
              ← {q.back}
            </button>
          )}
          {!required && !last && (
            <button type="button" onClick={() => setIndex(index + 1)} className="px-3 py-3 text-sm font-semibold opacity-60 hover:opacity-100">
              {q.skip}
            </button>
          )}
          <button disabled={!ready} className="ms-auto rounded-full bg-brand px-7 py-3.5 font-brand text-lg font-semibold text-white shadow-lg disabled:opacity-40">
            {last ? `${q.generate} ✨` : `${q.next} →`}
          </button>
        </div>
        {last && <p className="mt-3 text-end text-sm opacity-60">{fmt(q.price, { price: price("custom", currency) })}</p>}
      </form>

      {index === 0 && (
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm font-semibold">
          <button onClick={onDescribe} className="text-brand underline-offset-4 hover:underline">
            {q.describeLink}
          </button>
          <button onClick={onPremade} className="opacity-70 underline-offset-4 hover:underline">
            {fmt(q.premadeLink, { price: price("card", currency) })}
          </button>
        </div>
      )}
    </section>
  );
}

// "Other", for when none of the choices fit. It opens a box to type your own.
function OtherChip({ label, on, onClick, className }: { label: string; on: boolean; onClick: () => void; className: (on: boolean) => string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={className(on)}>
      ✏️ {label}
    </button>
  );
}

function OtherInput({ value, onChange, placeholder, max, className }: { value: string; onChange: (value: string) => void; placeholder: string; max: number; className: string }) {
  return (
    <input
      autoFocus
      value={value}
      maxLength={max}
      dir="auto"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={`${className} mt-4 basis-full`}
    />
  );
}
