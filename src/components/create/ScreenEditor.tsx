"use client";

import { useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Screen } from "@/lib/card";
import { blankMouse, selectBlank } from "./blank-focus";
import { uploadPhoto } from "./image";

const MAX_PHOTOS = 6;

// Updates are functions of the latest screen, so photo uploads finishing one by
// one never overwrite each other or edits made in the meantime.
type Update = (update: (prev: Screen) => Screen) => void;
// keepDesign: a ready-made design keeps its games and finale as they are, so only the words show.
// onUploaded: a photo that has finished uploading (onChange if left out), which can land while
// another box is being typed in.
type Props = { screen: Screen; onChange: Update; keepDesign?: boolean; onUploaded?: Update };

// Big, labelled boxes that are easy to tap and read, at 16px or more so iPhones don't zoom in.
const BOX = "rounded-xl border-2 border-line bg-panel px-3 py-3 text-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const LABEL = "text-base font-bold";
// Adding another line to a list.
const ADD = "min-h-11 rounded-full border-2 border-line px-4 py-2 text-base font-semibold text-brand transition hover:border-brand";
// The ✕ that takes one out.
const REMOVE = "grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg opacity-75 transition hover:bg-brand-soft hover:opacity-100";

export function ScreenEditor({ screen, onChange, keepDesign = false, onUploaded }: Props) {
  const { t } = useI18n();
  const e = t.editor;
  // Each field edit produces a new screen of the same type.
  const set = (key: string, value: string) => onChange((prev) => ({ ...prev, [key]: value }) as Screen);
  const setList = (key: string) => (fn: (items: string[]) => string[]) =>
    onChange((prev) => ({ ...prev, [key]: fn((prev as unknown as Record<string, string[]>)[key] ?? []) }) as Screen);

  switch (screen.type) {
    case "intro":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.subtitle} value={screen.subtitle} max={200} onChange={(v) => set("subtitle", v)} />
          <Field label={e.button} value={screen.button} max={40} onChange={(v) => set("button", v)} />
        </>
      );
    case "question":
      return (
        <>
          <Field label={e.question} value={screen.question} max={140} onChange={(v) => set("question", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={e.yes} value={screen.yes} max={30} onChange={(v) => set("yes", v)} />
            <Field label={e.no} value={screen.no} max={30} onChange={(v) => set("no", v)} />
          </div>
          <Field label={e.afterYes} value={screen.afterYes} max={140} onChange={(v) => set("afterYes", v)} />
        </>
      );
    case "photos":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <PhotoField screen={screen} onChange={onChange} onUploaded={onUploaded} />
        </>
      );
    case "message":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.message} value={screen.body} max={1500} rows={6} onChange={(v) => set("body", v)} />
        </>
      );
    case "game":
      return (
        <>
          {!keepDesign && <Select label={e.game} value={screen.game} options={t.labels.games} onChange={(v) => set("game", v)} />}
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.instructions} value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <Field label={e.winText} value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "quiz":
      return (
        <>
          <Field label={e.quizName} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <QuizField screen={screen} onChange={onChange} />
          <Field label={e.quizDone} value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "scratch":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.instructions} value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <Field label={e.hidden} value={screen.hidden} max={200} onChange={(v) => set("hidden", v)} />
        </>
      );
    case "typeit":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.clue} value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <Field label={e.phrase} value={screen.phrase} max={40} onChange={(v) => set("phrase", v)} />
          <Field label={e.phraseDone} value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "wheel":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.instructions} value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField
            label={e.wheelItems}
            items={screen.options}
            min={2}
            max={8}
            maxLength={40}
            placeholder={e.wheelExample}
            addLabel={e.addSlice}
            removeLabel={e.remove}
            onChange={(fn) =>
              onChange((prev) => {
                if (prev.type !== "wheel") return prev;
                const options = fn(prev.options);
                // Keep "always lands on" pointing at the same slice when one is removed.
                const removed = prev.options.findIndex((o, i) => options[i] !== o);
                let landOn = prev.landOn;
                if (options.length < prev.options.length && removed >= 0 && landOn >= 0) landOn = landOn === removed ? -1 : landOn > removed ? landOn - 1 : landOn;
                return { ...prev, options, landOn };
              })
            }
          />
          <Select
            label={e.landsWhere}
            value={String(screen.landOn)}
            options={[["-1", e.landsAnywhere], ...screen.options.map((o, i): [string, string] => [String(i), fmt(e.landsOn, { option: o || fmt(e.slice, { n: i + 1 }) })])]}
            onChange={(v) => onChange((prev) => (prev.type === "wheel" ? { ...prev, landOn: Number(v) } : prev))}
          />
          <Field label={e.wheelDone} value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "coupons":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.instructions} value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField label={e.coupons} items={screen.coupons} min={1} max={6} maxLength={80} placeholder={e.couponExample} addLabel={e.addCoupon} removeLabel={e.remove} onChange={setList("coupons")} />
        </>
      );
    case "reasons":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.instructions} value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField label={e.notes} items={screen.reasons} min={1} max={12} maxLength={160} placeholder={e.noteExample} addLabel={e.addNote} removeLabel={e.remove} onChange={setList("reasons")} />
        </>
      );
    case "slider":
      return (
        <>
          <Field label={e.question} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={e.low} value={screen.low} max={30} onChange={(v) => set("low", v)} />
            <Field label={e.high} value={screen.high} max={30} onChange={(v) => set("high", v)} />
          </div>
          <p className="text-base opacity-75">{e.sliderTip}</p>
          <Field label={e.sliderDone} value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "timeline":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <TimelineField screen={screen} onChange={onChange} />
        </>
      );
    case "boxes":
      return (
        <>
          <Field label={e.title} value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label={e.instructions} value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField label={e.boxes} items={screen.prizes} min={2} max={3} maxLength={80} placeholder={e.boxExample} addLabel={e.addBox} removeLabel={e.remove} onChange={setList("prizes")} />
          <p className="text-base opacity-75">{e.boxTip}</p>
        </>
      );
    case "finale":
      return (
        <>
          <Field label={e.title} value={screen.title} max={140} onChange={(v) => set("title", v)} />
          <Field label={e.finalWords} value={screen.body} max={600} rows={3} onChange={(v) => set("body", v)} />
          {!keepDesign && <Select label={e.effect} value={screen.effect} options={t.labels.effects} onChange={(v) => set("effect", v)} />}
        </>
      );
  }
}

// A list of short texts the person can edit, add to and remove from.
function ListField({
  label,
  items,
  min,
  max,
  maxLength,
  placeholder,
  addLabel,
  removeLabel,
  onChange,
}: {
  label: string;
  items: string[];
  min: number;
  max: number;
  maxLength: number;
  placeholder?: string;
  addLabel: string;
  removeLabel: string;
  onChange: (fn: (items: string[]) => string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <span className={LABEL}>
        {label} ({items.length}/{max})
      </span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-end text-sm font-bold opacity-75">{i + 1}</span>
          <input
            value={item}
            maxLength={maxLength}
            placeholder={placeholder}
            dir="auto"
            aria-label={`${label} ${i + 1}`}
            onFocus={selectBlank}
            {...blankMouse}
            onChange={(e) => onChange((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
            className={`min-w-0 flex-1 ${BOX}`}
          />
          {items.length > min && (
            <button type="button" aria-label={`${removeLabel}: ${label} ${i + 1}`} onClick={() => onChange((list) => list.filter((_, j) => j !== i))} className={REMOVE}>
              ✕
            </button>
          )}
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange((list) => [...list, ""])} className={ADD}>
          {addLabel}
        </button>
      )}
    </div>
  );
}

type TimelineScreen = Extract<Screen, { type: "timeline" }>;

function TimelineField({ screen, onChange }: { screen: TimelineScreen; onChange: Update }) {
  const e = useI18n().t.editor;
  const update = (fn: (events: TimelineScreen["events"]) => TimelineScreen["events"]) =>
    onChange((prev) => (prev.type === "timeline" ? { ...prev, events: fn(prev.events) } : prev));
  return (
    <div className="space-y-2">
      <span className={LABEL}>{fmt(e.moments, { n: screen.events.length })}</span>
      {screen.events.map((ev, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={ev.when}
            maxLength={40}
            placeholder={e.when}
            aria-label={fmt(e.momentDate, { n: i + 1 })}
            onFocus={selectBlank}
            {...blankMouse}
            onChange={(e) => update((list) => list.map((x, j) => (j === i ? { ...x, when: e.target.value } : x)))}
            dir="auto"
            className={`w-32 shrink-0 ${BOX}`}
          />
          <input
            value={ev.what}
            maxLength={160}
            placeholder={e.what}
            aria-label={fmt(e.moment, { n: i + 1 })}
            onFocus={selectBlank}
            {...blankMouse}
            onChange={(e) => update((list) => list.map((x, j) => (j === i ? { ...x, what: e.target.value } : x)))}
            dir="auto"
            className={`min-w-0 flex-1 ${BOX}`}
          />
          {screen.events.length > 1 && (
            <button type="button" aria-label={e.removeMoment} onClick={() => update((list) => list.filter((_, j) => j !== i))} className={`${REMOVE} mt-1.5`}>
              ✕
            </button>
          )}
        </div>
      ))}
      {screen.events.length < 8 && (
        <button type="button" onClick={() => update((list) => [...list, { when: "", what: "" }])} className={ADD}>
          {e.addMoment}
        </button>
      )}
    </div>
  );
}

type QuizScreen = Extract<Screen, { type: "quiz" }>;
const MAX_QUESTIONS = 6;

function QuizField({ screen, onChange }: { screen: QuizScreen; onChange: Update }) {
  const e = useI18n().t.editor;
  const update = (fn: (questions: QuizScreen["questions"]) => QuizScreen["questions"]) =>
    onChange((prev) => (prev.type === "quiz" ? { ...prev, questions: fn(prev.questions) } : prev));
  const setQuestion = (qi: number, patch: Partial<QuizScreen["questions"][number]>) =>
    update((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  return (
    <div className="space-y-4">
      {screen.questions.map((q, qi) => (
        <div key={qi} className="space-y-3 rounded-2xl border-2 border-line p-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{fmt(e.questionN, { n: qi + 1 })}</span>
            {screen.questions.length > 1 && (
              <button type="button" onClick={() => update((qs) => qs.filter((_, i) => i !== qi))} className="min-h-11 rounded-full px-3 text-base font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950">
                {e.remove}
              </button>
            )}
          </div>
          <Field label={e.questionLabel} value={q.question} max={140} onChange={(v) => setQuestion(qi, { question: v })} />
          <div className="space-y-2">
            <span className={LABEL}>{e.answers}</span>
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-1.5">
                {/* The tick has a finger-sized space around it. */}
                <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-brand-soft">
                  <input
                    type="radio"
                    name={`quiz-${screen.id}-${qi}`}
                    checked={q.answer === oi}
                    onChange={() => setQuestion(qi, { answer: oi })}
                    aria-label={fmt(e.answerCorrect, { n: oi + 1 })}
                    className="h-6 w-6 accent-[var(--brand)]"
                  />
                </label>
                <input
                  value={opt}
                  maxLength={60}
                  dir="auto"
                  aria-label={`${fmt(e.questionN, { n: qi + 1 })}: ${fmt(e.answerN, { n: oi + 1 })}`}
                  onFocus={selectBlank}
                  {...blankMouse}
                  onChange={(e) => setQuestion(qi, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                  className={`min-w-0 flex-1 ${BOX}`}
                />
                {q.options.length > 2 && (
                  <button type="button"
                    aria-label={e.removeAnswer}
                    onClick={() =>
                      setQuestion(qi, {
                        options: q.options.filter((_, j) => j !== oi),
                        answer: q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer,
                      })
                    }
                    className={REMOVE}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {q.options.length < 4 && (
              <button type="button" onClick={() => setQuestion(qi, { options: [...q.options, ""] })} className={ADD}>
                {e.addAnswer}
              </button>
            )}
          </div>
        </div>
      ))}
      {screen.questions.length < MAX_QUESTIONS && (
        <button type="button"
          onClick={() => update((qs) => [...qs, { question: "", options: ["", ""], answer: 0 }])}
          className={ADD}
        >
          {e.addQuestion}
        </button>
      )}
    </div>
  );
}

type PhotosScreen = Extract<Screen, { type: "photos" }>;

// `onBusy` hears photos start uploading (+n) and finish (-1), so nothing moves on without
// them. As changes rather than a total, uploads carry on counting after the field is gone.
export function PhotoField({ screen, onChange, onBusy, onUploaded = onChange }: { screen: PhotosScreen; onChange: Update; onBusy?: (change: number) => void; onUploaded?: Update }) {
  const e = useI18n().t.editor;
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const busy = (change: number) => {
    setUploading((n) => n + change);
    onBusy?.(change);
  };
  const [error, setError] = useState<string | null>(null);
  const update = (fn: (s: PhotosScreen) => PhotosScreen, to = onChange) => to((prev) => (prev.type === "photos" ? fn(prev) : prev));

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = MAX_PHOTOS - screen.photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(fmt(e.tooManyPhotos, { n: MAX_PHOTOS }));
    busy(picked.length);
    for (const file of picked) {
      try {
        const url = await uploadPhoto(file);
        // One caption per photo, kept in line with the photos, and never more than fit.
        update((s) => (s.photos.length >= MAX_PHOTOS ? s : { ...s, photos: [...s.photos, url], captions: [...s.photos.map((_, j) => s.captions[j] ?? ""), ""] }), onUploaded);
      } catch {
        setError(e.uploadFailed);
      } finally {
        busy(-1);
      }
    }
    if (input.current) input.current.value = "";
  };

  // How each photo sits in its frame goes with it, so the others keep their own.
  const remove = (i: number) =>
    update((s) => ({ ...s, photos: s.photos.filter((_, j) => j !== i), captions: s.captions.filter((_, j) => j !== i), crops: s.crops?.filter((_, j) => j !== i) }));
  const caption = (i: number, v: string) =>
    update((s) => ({ ...s, captions: s.photos.map((_, j) => (j === i ? v : (s.captions[j] ?? ""))) }));

  return (
    <div className="space-y-3">
      <span className={LABEL}>{fmt(e.photos, { n: screen.photos.length, max: MAX_PHOTOS })}</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {screen.photos.map((src, i) => (
          <div key={src} className="space-y-1.5">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- user upload thumbnail */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button type="button"
                onClick={() => remove(i)}
                aria-label={e.removePhoto}
                className="absolute end-1 top-1 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-base text-white"
              >
                ✕
              </button>
            </div>
            <input
              value={screen.captions[i] ?? ""}
              maxLength={120}
              onChange={(e) => caption(i, e.target.value)}
              placeholder={e.caption}
              aria-label={e.caption}
              dir="auto"
              className="w-full rounded-lg border-2 border-line bg-transparent px-2 py-2 text-base outline-none focus:border-brand"
            />
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`up-${i}`} className="grid aspect-square animate-pulse place-items-center rounded-xl bg-brand-soft text-sm">
            {e.uploading}
          </div>
        ))}
        {screen.photos.length + uploading < MAX_PHOTOS && (
          <button type="button"
            onClick={() => input.current?.click()}
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-base font-semibold hover:border-brand hover:text-brand"
          >
            {e.addPhotos}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  max,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  rows?: number;
  placeholder?: string;
}) {
  const cls = `mt-1 w-full ${BOX}`;
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {rows ? (
        <textarea value={value} maxLength={max} rows={rows} placeholder={placeholder} dir="auto" onFocus={selectBlank} {...blankMouse} onChange={(e) => onChange(e.target.value)} className={`${cls} leading-relaxed`} />
      ) : (
        <input value={value} maxLength={max} placeholder={placeholder} dir="auto" onFocus={selectBlank} {...blankMouse} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  // An array keeps its order; object keys that look like numbers get sorted first.
  options: Record<T, string> | [T, string][];
  onChange: (v: T) => void;
}) {
  const entries = Array.isArray(options) ? options : (Object.entries(options) as [T, string][]);
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className={`mt-1 w-full ${BOX}`}>
        {entries.map(([k, text]) => (
          <option key={k} value={k}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
