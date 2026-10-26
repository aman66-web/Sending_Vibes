"use client";

import { useRef, useState } from "react";
import { EFFECTS, GAMES, type Screen } from "@/lib/card";
import { uploadPhoto } from "./image";

const MAX_PHOTOS = 6;

export const GAME_LABELS: Record<(typeof GAMES)[number], string> = {
  "catch-hearts": "Catch the falling hearts",
  "light-diyas": "Light the diyas",
  "blow-candles": "Blow out the candles",
  "pop-balloons": "Pop the balloons",
  "catch-snowflakes": "Catch the snowflakes",
  "catch-stars": "Catch the stars",
  "memory-match": "Memory match",
  "unwrap-gift": "Unwrap the present",
  "shake-it": "Shake the phone (best on phone)",
  "cursor-chase": "Chase the heart with the mouse (best on desktop)",
  "loves-me-not": "Loves me, loves me not",
  "whack-ghosts": "Whack the ghosts",
  "launch-fireworks": "Launch fireworks",
  "release-lanterns": "Release the sky lanterns",
  "bubble-wrap": "Pop the bubble wrap",
  pinata: "Smash the piñata",
  "grow-flower": "Grow a flower",
  "throw-colours": "Throw colours (Holi)",
  "slot-machine": "Slot machine jackpot",
  "hold-hug": "Press and hold to send a hug",
  "catch-candy": "Catch the sweets",
};

export const EFFECT_LABELS: Record<(typeof EFFECTS)[number], string> = {
  hearts: "Floating hearts",
  fireworks: "Fireworks",
  confetti: "Confetti",
  sparkles: "Sparkles",
  snow: "Snow",
  stars: "Stars",
  petals: "Falling petals",
  spooky: "Bats and ghosts",
  colours: "Holi colours",
  lanterns: "Lanterns",
  bubbles: "Bubbles",
  balloons: "Balloons",
  none: "Nothing",
};

export const SCREEN_LABELS: Record<Screen["type"], string> = {
  intro: "Opening",
  question: "Runaway question",
  photos: "Photos",
  message: "Message",
  game: "Mini game",
  quiz: "Quiz",
  scratch: "Scratch card",
  typeit: "Secret password",
  wheel: "Spin the wheel",
  coupons: "Coupon book",
  reasons: "Reasons jar",
  slider: "Love-o-meter",
  timeline: "Our story",
  boxes: "Pick a box",
  finale: "Big finale",
};

// Updates are functions of the latest screen, so photo uploads finishing one by
// one never overwrite each other or edits made in the meantime.
type Update = (update: (prev: Screen) => Screen) => void;
type Props = { screen: Screen; onChange: Update };

export function ScreenEditor({ screen, onChange }: Props) {
  // Each field edit produces a new screen of the same type.
  const set = (key: string, value: string) => onChange((prev) => ({ ...prev, [key]: value }) as Screen);
  const setList = (key: string) => (fn: (items: string[]) => string[]) =>
    onChange((prev) => ({ ...prev, [key]: fn((prev as unknown as Record<string, string[]>)[key] ?? []) }) as Screen);

  switch (screen.type) {
    case "intro":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Subtitle" value={screen.subtitle} max={200} onChange={(v) => set("subtitle", v)} />
          <Field label="Button text" value={screen.button} max={40} onChange={(v) => set("button", v)} />
        </>
      );
    case "question":
      return (
        <>
          <Field label="The question" value={screen.question} max={140} onChange={(v) => set("question", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Yes button" value={screen.yes} max={30} onChange={(v) => set("yes", v)} />
            <Field label="No button (it runs away)" value={screen.no} max={30} onChange={(v) => set("no", v)} />
          </div>
          <Field label="After they say yes" value={screen.afterYes} max={140} onChange={(v) => set("afterYes", v)} />
        </>
      );
    case "photos":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <PhotoField screen={screen} onChange={onChange} />
        </>
      );
    case "message":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Your message" value={screen.body} max={1500} rows={6} onChange={(v) => set("body", v)} />
        </>
      );
    case "game":
      return (
        <>
          <Select label="Game" value={screen.game} options={GAME_LABELS} onChange={(v) => set("game", v)} />
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Instructions" value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <Field label="When they win" value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "quiz":
      return (
        <>
          <Field label="Quiz name" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <QuizField screen={screen} onChange={onChange} />
          <Field label="When they finish" value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "scratch":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Instructions" value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <Field label="Hidden message (revealed when scratched)" value={screen.hidden} max={200} onChange={(v) => set("hidden", v)} />
        </>
      );
    case "typeit":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Clue" value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <Field label="Secret password they have to type" value={screen.phrase} max={40} onChange={(v) => set("phrase", v)} />
          <Field label="When they get it" value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "wheel":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Instructions" value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField
            label="What's on the wheel"
            items={screen.options}
            min={2}
            max={8}
            maxLength={40}
            placeholder="e.g. Breakfast in bed"
            addLabel="+ Add a slice"
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
            label="Where it lands"
            value={String(screen.landOn)}
            options={Object.fromEntries([["-1", "Anywhere (a fair spin)"], ...screen.options.map((o, i) => [String(i), `Always on "${o || `slice ${i + 1}`}" (rigged 😏)`])])}
            onChange={(v) => onChange((prev) => (prev.type === "wheel" ? { ...prev, landOn: Number(v) } : prev))}
          />
          <Field label="When it stops" value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "coupons":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Instructions" value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField label="Coupons" items={screen.coupons} min={1} max={6} maxLength={80} placeholder="e.g. One foot rub" addLabel="+ Add a coupon" onChange={setList("coupons")} />
        </>
      );
    case "reasons":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Instructions" value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField label="Notes in the jar" items={screen.reasons} min={1} max={12} maxLength={160} placeholder="e.g. Your terrible jokes" addLabel="+ Add a note" onChange={setList("reasons")} />
        </>
      );
    case "slider":
      return (
        <>
          <Field label="The question" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Low end" value={screen.low} max={30} onChange={(v) => set("low", v)} />
            <Field label="High end" value={screen.high} max={30} onChange={(v) => set("high", v)} />
          </div>
          <p className="text-xs opacity-60">However they drag it, it only goes up. 😌</p>
          <Field label="When it hits 100%" value={screen.winText} max={140} onChange={(v) => set("winText", v)} />
        </>
      );
    case "timeline":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <TimelineField screen={screen} onChange={onChange} />
        </>
      );
    case "boxes":
      return (
        <>
          <Field label="Title" value={screen.title} max={120} onChange={(v) => set("title", v)} />
          <Field label="Instructions" value={screen.instructions} max={200} onChange={(v) => set("instructions", v)} />
          <ListField label="What's in each box" items={screen.prizes} min={2} max={3} maxLength={80} placeholder="e.g. A hug" addLabel="+ Add a box" onChange={setList("prizes")} />
          <p className="text-xs opacity-60">Tip: put the same thing in every box. They&apos;ll never know.</p>
        </>
      );
    case "finale":
      return (
        <>
          <Field label="Title" value={screen.title} max={140} onChange={(v) => set("title", v)} />
          <Field label="Final words" value={screen.body} max={600} rows={3} onChange={(v) => set("body", v)} />
          <Select label="Celebration effect" value={screen.effect} options={EFFECT_LABELS} onChange={(v) => set("effect", v)} />
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
  onChange,
}: {
  label: string;
  items: string[];
  min: number;
  max: number;
  maxLength: number;
  placeholder?: string;
  addLabel: string;
  onChange: (fn: (items: string[]) => string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold">
        {label} ({items.length}/{max})
      </span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs font-bold opacity-50">{i + 1}</span>
          <input
            value={item}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) => onChange((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
            className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand"
          />
          {items.length > min && (
            <button aria-label="Remove" onClick={() => onChange((list) => list.filter((_, j) => j !== i))} className="px-1 text-sm opacity-60 hover:opacity-100">
              ✕
            </button>
          )}
        </div>
      ))}
      {items.length < max && (
        <button onClick={() => onChange((list) => [...list, ""])} className="text-xs font-semibold text-brand">
          {addLabel}
        </button>
      )}
    </div>
  );
}

type TimelineScreen = Extract<Screen, { type: "timeline" }>;

function TimelineField({ screen, onChange }: { screen: TimelineScreen; onChange: Update }) {
  const update = (fn: (events: TimelineScreen["events"]) => TimelineScreen["events"]) =>
    onChange((prev) => (prev.type === "timeline" ? { ...prev, events: fn(prev.events) } : prev));
  const cls = "rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-brand";
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold">Moments ({screen.events.length}/8)</span>
      {screen.events.map((ev, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={ev.when}
            maxLength={40}
            placeholder="When"
            aria-label={`Moment ${i + 1} date`}
            onChange={(e) => update((list) => list.map((x, j) => (j === i ? { ...x, when: e.target.value } : x)))}
            className={`w-28 shrink-0 ${cls}`}
          />
          <input
            value={ev.what}
            maxLength={160}
            placeholder="What happened"
            aria-label={`Moment ${i + 1}`}
            onChange={(e) => update((list) => list.map((x, j) => (j === i ? { ...x, what: e.target.value } : x)))}
            className={`min-w-0 flex-1 ${cls}`}
          />
          {screen.events.length > 1 && (
            <button aria-label="Remove moment" onClick={() => update((list) => list.filter((_, j) => j !== i))} className="px-1 pt-2 text-sm opacity-60 hover:opacity-100">
              ✕
            </button>
          )}
        </div>
      ))}
      {screen.events.length < 8 && (
        <button onClick={() => update((list) => [...list, { when: "", what: "" }])} className="text-xs font-semibold text-brand">
          + Add a moment
        </button>
      )}
    </div>
  );
}

type QuizScreen = Extract<Screen, { type: "quiz" }>;
const MAX_QUESTIONS = 6;

function QuizField({ screen, onChange }: { screen: QuizScreen; onChange: Update }) {
  const update = (fn: (questions: QuizScreen["questions"]) => QuizScreen["questions"]) =>
    onChange((prev) => (prev.type === "quiz" ? { ...prev, questions: fn(prev.questions) } : prev));
  const setQuestion = (qi: number, patch: Partial<QuizScreen["questions"][number]>) =>
    update((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  return (
    <div className="space-y-4">
      {screen.questions.map((q, qi) => (
        <div key={qi} className="space-y-3 rounded-xl border border-line p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Question {qi + 1}</span>
            {screen.questions.length > 1 && (
              <button onClick={() => update((qs) => qs.filter((_, i) => i !== qi))} className="text-xs font-semibold text-red-600">
                Remove
              </button>
            )}
          </div>
          <Field label="Question" value={q.question} max={140} onChange={(v) => setQuestion(qi, { question: v })} />
          <div className="space-y-2">
            <span className="text-sm font-semibold">Answers (tick the right one)</span>
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`quiz-${screen.id}-${qi}`}
                  checked={q.answer === oi}
                  onChange={() => setQuestion(qi, { answer: oi })}
                  aria-label={`Answer ${oi + 1} is correct`}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
                <input
                  value={opt}
                  maxLength={60}
                  onChange={(e) => setQuestion(qi, { options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                  className="flex-1 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm outline-none focus:border-brand"
                />
                {q.options.length > 2 && (
                  <button
                    aria-label="Remove answer"
                    onClick={() =>
                      setQuestion(qi, {
                        options: q.options.filter((_, j) => j !== oi),
                        answer: q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer,
                      })
                    }
                    className="text-sm opacity-60"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {q.options.length < 4 && (
              <button onClick={() => setQuestion(qi, { options: [...q.options, ""] })} className="text-xs font-semibold text-brand">
                + Add an answer
              </button>
            )}
          </div>
        </div>
      ))}
      {screen.questions.length < MAX_QUESTIONS && (
        <button
          onClick={() => update((qs) => [...qs, { question: "", options: ["", ""], answer: 0 }])}
          className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-brand hover:text-brand"
        >
          + Add a question
        </button>
      )}
    </div>
  );
}

type PhotosScreen = Extract<Screen, { type: "photos" }>;

function PhotoField({ screen, onChange }: { screen: PhotosScreen; onChange: Update }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const update = (fn: (s: PhotosScreen) => PhotosScreen) => onChange((prev) => (prev.type === "photos" ? fn(prev) : prev));

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = MAX_PHOTOS - screen.photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    setUploading((n) => n + picked.length);
    for (const file of picked) {
      try {
        const url = await uploadPhoto(file);
        update((s) => ({ ...s, photos: [...s.photos, url], captions: [...s.captions, ""] }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
  };

  const remove = (i: number) =>
    update((s) => ({ ...s, photos: s.photos.filter((_, j) => j !== i), captions: s.captions.filter((_, j) => j !== i) }));
  const caption = (i: number, v: string) =>
    update((s) => ({ ...s, captions: s.photos.map((_, j) => (j === i ? v : (s.captions[j] ?? ""))) }));

  return (
    <div className="space-y-3">
      <span className="text-sm font-semibold">Photos ({screen.photos.length}/{MAX_PHOTOS})</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {screen.photos.map((src, i) => (
          <div key={src} className="space-y-1.5">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element -- user upload thumbnail */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => remove(i)}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-sm text-white"
              >
                ✕
              </button>
            </div>
            <input
              value={screen.captions[i] ?? ""}
              maxLength={120}
              onChange={(e) => caption(i, e.target.value)}
              placeholder="Caption (optional)"
              className="w-full rounded-lg border border-line bg-transparent px-2 py-1.5 text-sm outline-none focus:border-brand"
            />
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`up-${i}`} className="grid aspect-square animate-pulse place-items-center rounded-xl bg-brand-soft text-sm">
            Uploading…
          </div>
        ))}
        {screen.photos.length + uploading < MAX_PHOTOS && (
          <button
            onClick={() => input.current?.click()}
            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-sm font-semibold hover:border-brand hover:text-brand"
          >
            + Add photos
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
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
  const cls = "mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {rows ? (
        <textarea value={value} maxLength={max} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : (
        <input value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />
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
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 w-full rounded-xl border border-line bg-panel px-3 py-2.5 outline-none focus:border-brand"
      >
        {(Object.keys(options) as T[]).map((k) => (
          <option key={k} value={k}>
            {options[k]}
          </option>
        ))}
      </select>
    </label>
  );
}
