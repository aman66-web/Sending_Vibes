"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Dict } from "@/i18n/en";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { TONES, type Tone } from "@/lib/catalog";
import { price } from "@/lib/pricing";
import { occasions } from "@/lib/templates";
import { PhotoField } from "./ScreenEditor";

// The questions a custom card is written from. The eight core ones must all be
// answered (the written ones at some length, since specific details are what make a
// card feel personal); then up to two follow-ups written about their answers, which
// can be skipped, and an optional step to add photos.

export type Answers = {
  to: string;
  relation: string;
  occasion: Occasion | "";
  occasionOther: string;
  vibes: Tone[];
  vibeOther: string;
  memory: string;
  about: string;
  message: string;
  from: string;
  // Null until they've been asked for.
  followups: { q: string; a: string }[] | null;
  photos: string[];
  captions: string[];
};

export const NO_ANSWERS: Answers = {
  to: "",
  relation: "",
  occasion: "",
  occasionOther: "",
  vibes: [],
  vibeOther: "",
  memory: "",
  about: "",
  message: "",
  from: "",
  followups: null,
  photos: [],
  captions: [],
};

const QUESTIONS = ["to", "relation", "occasion", "vibe", "memory", "about", "message", "from"] as const;
type Question = (typeof QUESTIONS)[number];
// The fewest characters a written answer needs before moving on.
export const MIN_CHARS: Partial<Record<Question, number>> = { memory: 40, about: 30, message: 20 };
const FOLLOWUPS = 2;

// The answers written out for the card writer. Labels are in the visitor's language.
export function quizPrompt(a: Answers, t: Dict) {
  const to = a.to.trim();
  const feel = [...a.vibes.map((v) => t.tones[v]), a.vibeOther.trim()].filter(Boolean);
  const lines = [
    `Occasion: ${a.occasion ? t.occasions[a.occasion].label : a.occasionOther.trim()}`,
    `It's for ${to} (${a.relation.trim()}), from ${a.from.trim()}.`,
    `How it should feel: ${feel.join(", ")}`,
    `A memory we share: ${a.memory.trim()}`,
    `What ${to} is like: ${a.about.trim()}`,
    `What I most want them to know: ${a.message.trim()}`,
  ];
  for (const f of a.followups ?? []) if (f.a.trim()) lines.push(`${f.q}\n${f.a.trim()}`);
  if (a.photos.length) lines.push(`I've added ${a.photos.length} photo${a.photos.length > 1 ? "s" : ""}, so include a photos screen.`);
  return lines.join("\n");
}

// Whether a core question has been answered well enough to move on.
function answered(key: Question, a: Answers, relations: string[]) {
  const long = (text: string, min = 1) => text.trim().length >= min;
  switch (key) {
    case "to":
      return long(a.to);
    case "from":
      return long(a.from);
    case "relation":
      return relations.includes(a.relation) || long(a.relation, 2);
    case "occasion":
      return Boolean(a.occasion) || long(a.occasionOther, 2);
    case "vibe":
      return a.vibes.length > 0 || long(a.vibeOther, 2);
    default:
      return long(a[key], MIN_CHARS[key]);
  }
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
  const name = answers.to.trim() || q.them;
  // The core questions, then a follow-up step for each follow-up (or one "thinking"
  // step while they're being written), then photos.
  const followups = answers.followups;
  const steps: (Question | "thinking" | `f${number}` | "photos")[] = [
    ...QUESTIONS,
    ...(followups ? followups.map((_, i) => `f${i}` as const) : (["thinking"] as const)),
    "photos",
  ];
  const step = steps[Math.min(index, steps.length - 1)];
  const total = QUESTIONS.length + (followups ? followups.length : FOLLOWUPS) + 1;
  const core = (QUESTIONS as readonly string[]).includes(step) ? (step as Question) : null;
  const followIndex = step.startsWith("f") && step !== "from" ? Number(step.slice(1)) : -1;
  const ready = core ? answered(core, answers, q.relations) : step !== "thinking";
  const input = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  // Which questions have their "Other" box open.
  const [other, setOther] = useState<Partial<Record<Question, boolean>>>({});
  const openOther = () => core && setOther((o) => ({ ...o, [core]: true }));
  const customRelation = Boolean(answers.relation && !q.relations.includes(answers.relation));

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, [index]);

  const set = <K extends keyof Answers>(field: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [field]: value }));

  // Asks for follow-up questions about what they've written. Without any (or if it
  // fails) it goes straight on to photos.
  const askFollowups = async () => {
    let questions: string[] = [];
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: quizPrompt(answers, t) }),
      });
      if (res.ok) questions = ((await res.json()).questions ?? []).slice(0, FOLLOWUPS);
    } catch {}
    setAnswers((a) => ({ ...a, followups: questions.map((text) => ({ q: text, a: "" })) }));
  };

  const next = () => {
    if (!ready) return;
    if (step === "photos") return onGenerate();
    if (step === "from" && !followups) askFollowups();
    setIndex(index + 1);
  };
  // Single choices move on by themselves, after a beat so the tap registers.
  const pickAndGo = (apply: () => void) => {
    apply();
    setTimeout(() => setIndex(index + 1), 220);
  };
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  // Starts a written answer off with a phrase they tapped.
  const start = (field: "memory" | "about", phrase: string) => {
    setAnswers((a) => ({ ...a, [field]: a[field].trim() ? `${a[field].trimEnd()} ${phrase}` : phrase }));
    input.current?.focus();
  };

  const chip = (selected: boolean, shape = "rounded-full") =>
    `${shape} border-2 px-4 py-2.5 text-start font-semibold transition ${selected ? "border-brand bg-brand text-white" : "border-line bg-panel hover:-translate-y-0.5 hover:border-brand"}`;
  const field = "w-full rounded-2xl border-2 border-line bg-panel px-5 py-4 text-lg outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

  const title =
    core ? fmt(q.questions[core].title, { name }) : step === "photos" ? fmt(q.photosTitle, { name }) : step === "thinking" ? fmt(q.followLoading, { name }) : (followups?.[followIndex]?.q ?? "");
  const hint = core ? q.questions[core].hint : step === "photos" ? q.photosHint : step === "thinking" ? "" : q.followHint;

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-2xl flex-col px-4 py-8 sm:py-12">
      <div className="flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <span className="shrink-0 text-sm font-semibold opacity-60">{fmt(q.progress, { n: index + 1, total })}</span>
      </div>
      {index === 0 && <p className="mt-6 opacity-70">{q.intro}</p>}

      <form
        key={step}
        className="mt-8 flex flex-1 animate-screen-in flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <h1 dir="auto" className="font-brand text-4xl font-bold leading-tight sm:text-5xl">
          {title}
        </h1>
        {hint && <p className="mt-3 text-lg opacity-70">{hint}</p>}

        <div className="mt-8">
          {step === "to" && (
            <input ref={input} value={answers.to} maxLength={40} dir="auto" onChange={(e) => set("to", e.target.value)} placeholder={q.questions.to.placeholder} aria-label={title} className={field} />
          )}
          {step === "from" && (
            <input ref={input} value={answers.from} maxLength={40} dir="auto" onChange={(e) => set("from", e.target.value)} placeholder={q.questions.from.placeholder} aria-label={title} className={field} />
          )}
          {step === "relation" && (
            <>
              <div className="flex flex-wrap gap-2">
                {q.relations.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setOther((o) => ({ ...o, relation: false }));
                      pickAndGo(() => set("relation", r));
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
          {step === "occasion" && (
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
          {step === "vibe" && (
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
          {(step === "memory" || step === "about" || step === "message") && (
            <>
              {(step === "memory" || step === "about") && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {(step === "memory" ? q.memoryStarters : q.aboutStarters).map((phrase) => (
                    <button key={phrase} type="button" onClick={() => start(step, phrase)} className="rounded-full border border-line bg-panel px-3 py-1.5 text-sm font-semibold transition hover:border-brand hover:text-brand">
                      + {phrase}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={input}
                value={answers[step]}
                maxLength={500}
                rows={4}
                dir="auto"
                onChange={(e) => set(step, e.target.value)}
                placeholder={q.questions[step].placeholder}
                aria-label={title}
                className={`${field} resize-y leading-relaxed`}
              />
              <CharsLeft value={answers[step]} min={MIN_CHARS[step] ?? 0} more={q.moreChars} enough={q.enough} />
            </>
          )}
          {step === "thinking" && (
            <div className="flex items-center gap-3 opacity-70" aria-live="polite">
              <span aria-hidden className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand" />
            </div>
          )}
          {followIndex >= 0 && followups?.[followIndex] && (
            <textarea
              ref={input}
              value={followups[followIndex].a}
              maxLength={500}
              rows={3}
              dir="auto"
              onChange={(e) => setAnswers((a) => ({ ...a, followups: (a.followups ?? []).map((f, i) => (i === followIndex ? { ...f, a: e.target.value } : f)) }))}
              aria-label={title}
              className={`${field} resize-y leading-relaxed`}
            />
          )}
          {step === "photos" && (
            <PhotoField
              screen={{ id: "quiz-photos", type: "photos", title: "", photos: answers.photos, captions: answers.captions }}
              onChange={(update) =>
                setAnswers((a) => {
                  const next = update({ id: "quiz-photos", type: "photos", title: "", photos: a.photos, captions: a.captions });
                  return next.type === "photos" ? { ...a, photos: next.photos, captions: next.captions } : a;
                })
              }
            />
          )}
        </div>

        <div className="mt-auto flex items-center gap-3 pt-10">
          {index > 0 && step !== "thinking" && (
            <button type="button" onClick={() => setIndex(index - 1)} className="rounded-full border-2 border-line px-5 py-3 font-semibold hover:border-foreground/40">
              ← {q.back}
            </button>
          )}
          {followIndex >= 0 && (
            <button type="button" onClick={() => setIndex(index + 1)} className="px-3 py-3 text-sm font-semibold opacity-60 hover:opacity-100">
              {q.skip}
            </button>
          )}
          {step !== "thinking" && (
            <button disabled={!ready} className="ms-auto rounded-full bg-brand px-7 py-3.5 font-brand text-lg font-semibold text-white shadow-lg disabled:opacity-40">
              {step === "photos" ? `${q.generate} ✨` : `${q.next} →`}
            </button>
          )}
        </div>
        {step === "photos" && <p className="mt-3 text-end text-sm opacity-60">{fmt(q.price, { price: price("custom", currency) })}</p>}
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

// How much more there is to write, then a tick once there's enough.
function CharsLeft({ value, min, more, enough }: { value: string; min: number; more: string; enough: string }) {
  const left = min - value.trim().length;
  return (
    <p aria-live="polite" className={`mt-2 text-sm font-semibold ${left > 0 ? "opacity-60" : "text-brand"}`}>
      {left > 0 ? fmt(more, { n: left }) : `✓ ${enough}`}
    </p>
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
