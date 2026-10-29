"use client";

import { useEffect, useMemo, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { ProductThumb } from "@/components/catalog/ProductThumb";
import type { Brief } from "@/lib/brief";
import type { ThemeName } from "@/lib/card";
import { TONES, getTemplate, toneInfo, type Tone } from "@/lib/catalog";
import { getLook } from "@/lib/looks";
import { occasions } from "@/lib/templates";
import { VibePreview } from "./VibePreview";

// The half a minute or so while a card is written: what they chose, the card's big idea as
// soon as the writer has one, each screen ticked off as it's written, and a moment to say
// it's ready. If it doesn't come through, one big button asks for the same card again.

// The screens written so far (by type), and each one's title once the writer has given it one.
export type Progress = { screens: string[]; titles: (string | null)[] };
export const NO_PROGRESS: Progress = { screens: [], titles: [] };

// Why asking for a card didn't work, in words for the person, and whether asking for the
// same again could help (a dropped connection, a busy moment) or not (a limit reached).
export class AiError extends Error {
  retry: boolean;
  constructor(message: string, retry: boolean) {
    super(message);
    this.retry = retry;
  }
}

// Stops a phone's screen going to sleep while a card is made, as a sleeping phone drops the
// connection. Browsers without it just carry on. Call it straight from the tap (some only
// allow it then); it returns the way to let go again.
export function keepScreenOn(): () => void {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return () => {};
  let lock: WakeLockSentinel | null = null;
  let done = false;
  const ask = () => {
    if (done || document.visibilityState !== "visible") return;
    try {
      navigator.wakeLock.request("screen").then(
        (got) => {
          if (done) got.release().catch(() => {});
          else lock = got;
        },
        () => {},
      );
    } catch {}
  };
  // The browser lets go of it whenever the page is hidden, so ask again when they're back.
  document.addEventListener("visibilitychange", ask);
  ask();
  return () => {
    done = true;
    document.removeEventListener("visibilitychange", ask);
    lock?.release().catch(() => {});
    lock = null;
  };
}

type Props = {
  to: string;
  from: string;
  // The choices from the questions (none when they described the card in their own words).
  brief?: Brief;
  // The ready-made design their words are going into, if any, and the colour picked for it.
  template?: string;
  theme?: ThemeName;
  // What they typed, when they described the card in their own words.
  typed?: string;
  photos: number;
  // The card's big idea, once the writer has come up with it.
  concept: string | null;
  progress: Progress;
  // "ready" for a moment once the card has arrived; why, if it didn't come through.
  outcome: "ready" | { error: string } | null;
  onStop: () => void;
  onRetry: () => void;
  onBack: () => void;
};

export function MakingScreen({ to, from, brief, template, theme, typed, photos, concept, progress, outcome, onStop, onRetry, onBack }: Props) {
  const { t } = useI18n();
  const x = t.custom;
  const ready = outcome === "ready";
  const failed = outcome && outcome !== "ready" ? outcome.error : null;
  const working = !outcome;
  // Seconds since it started: the bar keeps creeping, and a slow card says so kindly.
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [working]);
  // Leaving or reloading the page now would lose the card, so the browser checks first.
  useEffect(() => {
    if (!working) return;
    const stay = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", stay);
    return () => window.removeEventListener("beforeunload", stay);
  }, [working]);
  // Stopping asks first, so a stray tap can't throw the wait away.
  const [stopping, setStopping] = useState(false);
  // So does a link on the page (the logo, say): it asks to stop rather than leave mid-way.
  useEffect(() => {
    if (!working) return;
    const ask = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!link || link.getAttribute("target") === "_blank" || e.defaultPrevented) return;
      e.preventDefault();
      e.stopPropagation();
      setStopping(true);
    };
    document.addEventListener("click", ask, true);
    return () => document.removeEventListener("click", ask, true);
  }, [working]);

  const written = progress.screens.length;
  // Each screen written moves it on, and so does time, so it never sits still or goes back.
  const width = ready ? 100 : Math.max(Math.min(90, 8 + written * 11), Math.round(90 * (1 - Math.exp(-seconds / 25))));
  const name = to.trim() || t.quiz.them;
  const look = getLook(brief?.look);
  const design = getTemplate(template);
  // A ready-made design shows its own front, as on the questions, in the colour they picked.
  const front = useMemo(() => (design && theme ? { ...design, theme } : design), [design, theme]);
  // Their choices in a few friendly words, not the instructions sent to the writer.
  const chips = [
    brief?.occasion && `${occasions[brief.occasion].emoji} ${t.occasions[brief.occasion].label}`,
    `💌 ${fmt(x.chipFor, { name })}${brief?.relation ? ` · ${brief.relation}` : ""}`,
    ...(brief?.tones ?? []).map((tone) => isTone(tone) && `${toneInfo[tone].emoji} ${t.tones[tone]}`),
    look && `🎨 ${look.name}`,
    design && `🖼️ ${design.name}`,
    brief?.music && brief.music !== "none" && `🎵 ${t.labels.music[brief.music]}`,
    photos > 0 && `📷 ${x.chipPhotos}`,
    from.trim() && `✍️ ${fmt(x.chipFrom, { name: from.trim() })}`,
  ].filter((chip): chip is string => Boolean(chip));
  // The big idea comes first, before any screen; once screens are coming without one, none is coming.
  const showIdea = Boolean(concept || typed || (working && !written));

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-xl flex-col items-center justify-center px-4 py-8 text-center">
      {ready ? <SealedEnvelope /> : <WritingEnvelope still={Boolean(failed)} />}
      <h1 aria-live="polite" className="mt-5 font-brand text-3xl font-bold sm:text-5xl">
        {ready ? `✓ ${fmt(x.ready, { name })}` : failed ? x.makingFailed : x.makingTitle}
      </h1>

      {failed ? (
        <>
          <p role="alert" className="mt-3 text-lg">
            {failed}
          </p>
          <p className="mt-1 opacity-70">{x.makingKept}</p>
          <button type="button" onClick={onRetry} autoFocus className="mt-6 w-full max-w-sm rounded-full bg-brand py-4 font-brand text-xl font-semibold text-on-brand shadow-lg">
            ↻ {x.tryAgain}
          </button>
          <button type="button" onClick={onBack} className="mt-2 min-h-11 px-4 font-semibold opacity-70 hover:opacity-100">
            {x.backToAnswers}
          </button>
        </>
      ) : (
        <>
          {working && (
            <p className="mt-2 min-h-6 opacity-70">
              <RotatingLine lines={x.making} />
            </p>
          )}
          <div
            role="progressbar"
            aria-label={x.makingTitle}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={width}
            className="mt-5 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${width}%` }} />
          </div>
          {working && <p className="mt-3 text-sm font-semibold opacity-75">{seconds < 45 ? x.makingKeep : x.makingLonger}</p>}
        </>
      )}

      <div className="mt-7 w-full rounded-3xl border border-line bg-panel p-5 text-start shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide opacity-75">{x.yourChoices}</p>
        <div className="mt-2 flex items-center gap-4">
          {front ? (
            <div className="w-24 shrink-0 overflow-hidden rounded-md shadow-sm sm:w-32">
              <ProductThumb template={front} />
            </div>
          ) : (
            <VibePreview to={to} from={from} occasion={brief?.occasion ?? ""} look={brief?.look ?? ""} className="w-24 shrink-0 sm:w-32" />
          )}
          <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {chips.map((chip, i) => (
              <li key={i} dir="auto" className="rounded-full border border-line bg-background px-3 py-1 text-sm font-semibold">
                {chip}
              </li>
            ))}
          </ul>
        </div>

        {showIdea && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-bold uppercase tracking-wide opacity-75">{concept || !typed ? fmt(x.ideaFor, { name }) : x.yourIdea}</p>
            {concept ? (
              <p key="concept" dir="auto" className="mt-1 animate-screen-in font-hand text-2xl leading-snug">
                “{concept}”
              </p>
            ) : typed ? (
              <p dir="auto" className="mt-1 line-clamp-4 font-hand text-xl leading-snug">
                “{typed}”
              </p>
            ) : (
              <p className="mt-1 animate-pulse font-hand text-xl opacity-75">{x.ideaThinking}</p>
            )}
          </div>
        )}

        {!failed && (
          <ul className="mt-4 space-y-2 border-t border-line pt-4 font-semibold" aria-live="polite">
            {progress.screens.map((type, i) => {
              const kind = Object.prototype.hasOwnProperty.call(t.labels.screens, type) ? (t.labels.screens as Record<string, string>)[type] : undefined;
              const title = progress.titles[i];
              const text = kind && title ? fmt(x.makingRow, { name: kind, title }) : (kind ?? title);
              if (!text) return null;
              return (
                <li key={i} className="flex animate-screen-in items-start gap-2">
                  <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] text-on-brand">
                    ✓
                  </span>
                  <span dir="auto" className="min-w-0 line-clamp-2">
                    {text}
                  </span>
                </li>
              );
            })}
            {working && (
              <li className="flex items-center gap-2 opacity-50">
                <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />…
              </li>
            )}
          </ul>
        )}
      </div>

      {working &&
        (stopping ? (
          <div role="group" aria-labelledby="stop-making" className="mt-6 w-full max-w-sm rounded-2xl border-2 border-line bg-panel p-4">
            <p id="stop-making" className="font-semibold">
              {x.stopSure}
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" autoFocus onClick={() => setStopping(false)} className="min-h-11 flex-1 rounded-full bg-brand px-4 font-semibold text-on-brand">
                {x.keepGoing}
              </button>
              <button type="button" onClick={onStop} className="min-h-11 flex-1 rounded-full border-2 border-line px-4 font-semibold">
                {x.stopYes}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setStopping(true)} className="mt-5 min-h-11 px-4 text-sm font-semibold opacity-75 hover:opacity-100">
            {x.stop}
          </button>
        ))}
    </section>
  );
}

// The feelings picked can include a few beyond the catalog's own, which have no label here.
const isTone = (tone: string): tone is Tone => (TONES as readonly string[]).includes(tone);

// An envelope with a card rising out of it while its lines are written. Still, when it's stopped.
function WritingEnvelope({ still = false }: { still?: boolean }) {
  return (
    <svg viewBox="0 0 200 170" className="w-44 text-brand sm:w-56" aria-hidden>
      <Twinkles />
      <path d="M40 78 L100 40 L160 78 Z" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" strokeLinejoin="round" opacity="0.9" />
      <g className={still ? "" : "animate-letter"}>
        <rect x="56" y="44" width="88" height="74" rx="4" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" />
        {[60, 72, 84].map((y, i) => (
          <path
            key={y}
            d={`M68 ${y} H${i === 2 ? 112 : 132}`}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={still ? undefined : "100"}
            className={still ? "" : "animate-write"}
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
        <path d="M118 98 c0-5 7-5 7 0 c0-5 7-5 7 0 c0 5-7 9-7 9 s-7-4-7-9z" fill="currentColor" />
      </g>
      <path d="M40 78 V150 H160 V78 L100 116 Z" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 150 L88 108 M160 150 L112 108" stroke="var(--foreground)" strokeWidth="2" opacity="0.35" />
    </svg>
  );
}

// The card is in: the envelope closes and a heart seal is pressed on.
function SealedEnvelope() {
  return (
    <svg viewBox="0 0 200 170" className="w-44 text-brand sm:w-56" aria-hidden>
      <Twinkles />
      <g className="animate-pop" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <path d="M40 78 V150 H160 V78 Z" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M40 150 L88 112 M160 150 L112 112" stroke="var(--foreground)" strokeWidth="2" opacity="0.35" />
        <path d="M40 78 L100 120 L160 78 Z" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <g className="animate-stamp" style={{ animationDelay: "0.35s", transformBox: "fill-box", transformOrigin: "center" }}>
        <circle cx="100" cy="118" r="15" fill="currentColor" />
        <path d="M93 116 c0-4.5 6.5-4.5 7 0 c0.5-4.5 7-4.5 7 0 c0 5-7 8.5-7 8.5 s-7-3.5-7-8.5z" fill="var(--panel)" />
      </g>
    </svg>
  );
}

function Twinkles() {
  return (
    <>
      {[
        [26, 40, 0],
        [176, 30, 0.6],
        [160, 96, 1.2],
        [36, 104, 0.9],
      ].map(([cx, cy, delay]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M${cx} ${cy - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`}
          fill="currentColor"
          className="animate-twinkle"
          style={{ animationDelay: `${delay}s`, transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </>
  );
}

// One line at a time, a new one every few seconds. After the first time through it goes
// round the second half again, so a slow card never looks stuck.
function RotatingLine({ lines }: { lines: readonly string[] }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setN((k) => k + 1), 4000);
    return () => clearInterval(timer);
  }, []);
  if (!lines.length) return null;
  const from = Math.floor(lines.length / 2);
  const i = n < lines.length ? n : from + ((n - from) % (lines.length - from));
  return (
    <span key={n} className="inline-block animate-screen-in">
      {lines[i]}
    </span>
  );
}
