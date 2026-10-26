"use client";

import { useRef, useState } from "react";
import { EFFECTS, GAMES, type Screen } from "@/lib/card";
import { uploadPhoto } from "./image";

const MAX_PHOTOS = 6;

const GAME_LABELS: Record<(typeof GAMES)[number], string> = {
  "catch-hearts": "Catch the falling hearts",
  "light-diyas": "Light the diyas",
  "blow-candles": "Blow out the candles",
};

const EFFECT_LABELS: Record<(typeof EFFECTS)[number], string> = {
  hearts: "Floating hearts",
  fireworks: "Fireworks",
  confetti: "Confetti",
  sparkles: "Sparkles",
  none: "Nothing",
};

export const SCREEN_LABELS: Record<Screen["type"], string> = {
  intro: "Opening",
  question: "Runaway question",
  photos: "Photos",
  message: "Message",
  game: "Mini game",
  finale: "Big finale",
};

// Updates are functions of the latest screen, so photo uploads finishing one by
// one never overwrite each other or edits made in the meantime.
type Update = (update: (prev: Screen) => Screen) => void;
type Props = { screen: Screen; onChange: Update };

export function ScreenEditor({ screen, onChange }: Props) {
  // Each field edit produces a new screen of the same type.
  const set = (key: string, value: string) => onChange((prev) => ({ ...prev, [key]: value }) as Screen);

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
