"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { MUSIC, type Music, type Occasion } from "@/lib/card";
import { OCCASION_MUSIC } from "@/lib/catalog";
import { TOP_LOOKS, rankLooks, type Look } from "@/lib/looks";
import { playMusic, unlockAudio } from "@/components/card/sound";
import { LookThumb } from "./LookThumb";

// The "Pick a look" question: tiles for the looks in lib/looks.ts, best first for the
// occasion and feelings, and a row of music to choose from (with a short sample on tap).

type Props = {
  // Their name, for the tiles ("For Lily").
  name: string;
  occasion: Occasion | "";
  tones: string[];
  look: string;
  music: Music | "";
  onLook: (key: string) => void;
  onMusic: (music: Music | "") => void;
};

// How long a tapped tune plays for, and how many tunes show before "More…".
const SAMPLE_MS = 8000;
const FIRST_TUNES = 3;
// After the occasion's own tune, one that suits each feeling picked, then the rest.
const FEEL_TUNES = new Map<string, Music>([
  ["romantic", "love"],
  ["heartfelt", "love"],
  ["gentle", "lullaby"],
  ["cute", "lullaby"],
  ["funny", "festive"],
  ["cheeky", "festive"],
  ["festive", "festive"],
  ["nostalgic", "auld"],
  ["blessings", "joy"],
  ["elegant", "joy"],
]);
const USUAL_TUNES: Music[] = ["love", "festive", "joy", "lullaby", "birthday", "jingle", "auld", "spooky"];

// Every tune once, best first for this occasion and these feelings.
function rankTunes(occasion: Occasion | "", tones: string[]): Music[] {
  const picks = [occasion ? OCCASION_MUSIC[occasion] : undefined, ...tones.map((t) => FEEL_TUNES.get(t.trim().toLowerCase())), ...USUAL_TUNES, ...MUSIC];
  return [...new Set(picks.filter((m): m is Music => Boolean(m) && m !== "none"))];
}

const focusRing = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40";

export function LookStep({ name, occasion, tones, look, music, onLook, onMusic }: Props) {
  const { t } = useI18n();
  const l = t.looks;
  const musicTitle = useId();
  const forName = name.trim() || "you";

  const looks = useMemo(() => rankLooks(occasion, tones), [occasion, tones]);
  // Opens already showing them all if the one they picked before is further down.
  const [allLooks, setAllLooks] = useState(() => looks.findIndex((x) => x.key === look) >= TOP_LOOKS);
  const shownLooks = allLooks ? looks : looks.slice(0, TOP_LOOKS);
  const firstMore = useRef<HTMLButtonElement>(null);
  const lookName = (x: Look) => l.names[x.key as keyof typeof l.names] ?? x.name;

  const tunes = useMemo(() => rankTunes(occasion, tones), [occasion, tones]);
  const [allTunes, setAllTunes] = useState(() => Boolean(music) && music !== "none" && tunes.indexOf(music as Music) >= FIRST_TUNES);
  const shownTunes = allTunes ? tunes : tunes.slice(0, FIRST_TUNES);

  // The tune playing a sample, if any. Nothing plays until it's tapped, and it stops after
  // a few seconds, when another is tapped, or when they leave this question.
  const [playing, setPlaying] = useState<Music | null>(null);
  useEffect(() => {
    if (!playing) return;
    const stop = playMusic(playing);
    const timer = setTimeout(() => setPlaying(null), SAMPLE_MS);
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, [playing]);

  const pickTune = (tune: Music) => {
    // Browsers only allow sound straight from a tap, so this comes before anything else.
    unlockAudio();
    onMusic(tune);
    // Tapping the one that's playing stops it; tapping it again plays it again.
    setPlaying((p) => (p === tune ? null : tune));
  };

  const showMoreLooks = () => {
    setAllLooks(true);
    // The button goes, so keep keyboard users where they were: on the first new look.
    requestAnimationFrame(() => firstMore.current?.focus());
  };

  const chip = (on: boolean) =>
    `inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-4 py-2.5 font-semibold transition ${focusRing} ${on ? "border-brand bg-brand text-white" : "border-line bg-panel hover:-translate-y-0.5 hover:border-brand"}`;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shownLooks.map((x, i) => {
          const on = x.key === look;
          return (
            <button
              key={x.key}
              ref={i === TOP_LOOKS ? firstMore : undefined}
              type="button"
              aria-pressed={on}
              onClick={() => onLook(x.key)}
              className={`relative flex flex-col overflow-hidden rounded-2xl border-[3px] bg-panel text-start transition ${focusRing} ${on ? "border-brand shadow-lg" : "border-line hover:-translate-y-0.5 hover:border-brand/60"}`}
            >
              <LookThumb look={x} name={forName} className="w-full" />
              <span className="flex min-h-12 items-center gap-1.5 px-3 py-2 font-semibold leading-tight">
                {on && (
                  <span aria-hidden className="text-brand">
                    ✓
                  </span>
                )}
                {lookName(x)}
              </span>
              {i === 0 && (
                <span className="absolute start-2 top-2 rounded-full bg-sun px-2.5 py-1 text-xs font-black uppercase tracking-wide text-ink shadow-sm">{l.suggested}</span>
              )}
              {on && (
                <span aria-hidden className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-brand text-base font-black text-white shadow-md">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!allLooks && looks.length > TOP_LOOKS && (
        <button
          type="button"
          aria-expanded={false}
          onClick={showMoreLooks}
          className={`mt-3 min-h-12 w-full rounded-2xl border-2 border-dashed border-line px-4 py-3 font-semibold transition hover:border-brand hover:text-brand ${focusRing}`}
        >
          {fmt(l.moreLooks, { n: looks.length - TOP_LOOKS })} ↓
        </button>
      )}

      <section aria-labelledby={musicTitle} className="mt-10">
        <h2 id={musicTitle} className="font-brand text-2xl font-bold">
          🎵 {l.music}
        </h2>
        <p className="mt-1 opacity-70">{l.musicHint}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {shownTunes.map((tune) => (
            <button key={tune} type="button" aria-pressed={music === tune} onClick={() => pickTune(tune)} className={chip(music === tune)}>
              <span aria-hidden>{music === tune ? "✓" : "▶"}</span>
              {t.labels.music[tune]}
              {playing === tune && <Playing />}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={music === "none"}
            onClick={() => {
              onMusic("none");
              setPlaying(null);
            }}
            className={chip(music === "none")}
          >
            <span aria-hidden>{music === "none" ? "✓" : "🔇"}</span>
            {t.labels.music.none}
          </button>
          {!allTunes && tunes.length > FIRST_TUNES && (
            <button
              type="button"
              aria-expanded={false}
              onClick={() => setAllTunes(true)}
              className={`inline-flex min-h-12 items-center rounded-full border-2 border-dashed border-line px-4 py-2.5 font-semibold transition hover:border-brand hover:text-brand ${focusRing}`}
            >
              {l.moreMusic}
            </button>
          )}
        </div>
        <p aria-live="polite" className="mt-3 min-h-6 text-sm font-semibold text-brand">
          {playing ? fmt(l.playing, { tune: t.labels.music[playing] }) : ""}
        </p>
      </section>
    </div>
  );
}

// Little bars that bounce while a sample plays.
function Playing() {
  return (
    <span aria-hidden className="flex h-4 items-end gap-0.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-full w-1 origin-bottom animate-equalise rounded-full bg-current" style={{ animationDelay: `${i * -0.3}s` }} />
      ))}
    </span>
  );
}
