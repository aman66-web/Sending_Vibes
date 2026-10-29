"use client";

import { useEffect, useRef, useState } from "react";
import type { Game, Occasion, Screen } from "@/lib/card";
import { Burst, FinaleEffect, useReducedMotion } from "./effects";
import { GameView } from "./games";
import { useRunaway } from "./runaway";
import { Flourish, HeartMark, Laurel } from "./ornaments";
import { useSfx } from "./sound";
import { HELP_AFTER, useStuck, useTune } from "./tune";
import { cropStyle } from "@/lib/screen-style";
import { isRtl } from "./personal";
import { useWords } from "./words";
import { Envelope, TapHint, type EnvelopeColours } from "./Envelope";
import { Keepsake } from "./Keepsake";

type Of<T extends Screen["type"]> = Extract<Screen, { type: T }>;
// `stage` starts the screen part-way through (see lib/stages.ts), for the editor.
type ScreenProps<T extends Screen["type"]> = { screen: Of<T>; onNext: () => void; stage?: number };

// Plays a stage that's an animation (the envelope opening, the wheel spinning) by
// pressing the screen's own button once it's on, so it looks as it will for them.
export function usePressAt(stage: number, at: number, find: () => HTMLElement | null | undefined) {
  const press = useRef(find);
  useEffect(() => {
    press.current = find;
  });
  useEffect(() => {
    if (stage < at) return;
    const timer = setTimeout(() => press.current()?.click(), 450);
    return () => clearTimeout(timer);
  }, [stage, at]);
}

// A big pill in plain words (easier for older eyes than small capitals), tall enough to tap.
export const BUTTON =
  "min-h-14 rounded-full bg-[var(--c-accent)] px-8 py-3 text-[1.0625rem] font-semibold leading-snug tracking-[0.02em] text-[var(--c-accent-text)] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.7)] transition hover:brightness-110 active:scale-95";

export function PrimaryButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button data-primary onClick={onClick} className={`${BUTTON} ${className}`}>
      {children}
    </button>
  );
}

// Offered on a screen that has to be won, once they seem stuck (see useStuck in tune.ts). It
// sits where Next will appear and finishes the screen for them, so nobody is left unable
// to reach the rest of their card.
export function HelpButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      data-help
      onClick={onClick}
      className="min-h-14 animate-screen-in rounded-full bg-[var(--c-surface)] px-6 py-3 text-base font-semibold leading-snug text-[var(--c-text)] shadow-sm ring-1 ring-current/25 backdrop-blur"
    >
      {children}
    </button>
  );
}

// The Next button, in the screen's own words.
export function NextButton({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  const { text } = useWords();
  return (
    <PrimaryButton onClick={onClick} className={className}>
      {text("next")}
    </PrimaryButton>
  );
}

export function IntroScreen({
  screen,
  onNext,
  stage = 0,
  to,
  from,
  envelope,
  occasion,
  sentAt,
  editing = false,
}: ScreenProps<"intro"> & {
  to: string;
  from: string;
  envelope?: EnvelopeColours;
  // For the stamp and the postmark's date (see Envelope).
  occasion?: Occasion;
  sentAt?: string;
  // The editor's edit mode, where the envelope keeps still so it's easy to pick.
  editing?: boolean;
}) {
  const sfx = useSfx();
  const { text } = useWords();
  const [open, setOpen] = useState(false);
  // Set once the letter has come out, so a quick double tap doesn't skip straight past it.
  const [opened, setOpened] = useState(false);
  const after = useRef<HTMLDivElement>(null);
  const envelopeButton = useRef<HTMLButtonElement>(null);
  usePressAt(stage, 1, () => envelopeButton.current);

  // Once it's open, bring the message and button into view: on a short screen (a small
  // phone, or the preview while making a card) they'd otherwise sit below the fold.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setOpened(true);
      after.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 1300);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Nothing usually, unless the card has chosen something to burst out as it opens. */}
      {open && <Burst usual={null} />}
      <div className={`transition-opacity duration-500 ${open ? "opacity-0" : ""}`}>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--c-muted)]">{text("gotMail")}</p>
        <Flourish className="mx-auto mt-3 text-[var(--c-muted)]" />
      </div>
      <Envelope
        ref={envelopeButton}
        open={open}
        label={open ? screen.title : "Open the envelope"}
        title={screen.title}
        to={to}
        from={from}
        colours={envelope}
        occasion={occasion}
        sentAt={sentAt}
        still={editing}
        onClick={() => {
          if (opened) return onNext();
          if (open) return;
          setOpen(true);
          // The seal cracks, the flap lifts, the letter comes out.
          sfx("crack");
          setTimeout(() => sfx("whoosh"), 180);
          setTimeout(() => sfx("sparkle"), 800);
        }}
      />
      {open ? (
        <div ref={after} className="flex animate-screen-in flex-col items-center gap-5 [animation-delay:1100ms]">
          <p className="text-lg text-[var(--c-muted)]">{screen.subtitle}</p>
          <PrimaryButton onClick={onNext}>{screen.button}</PrimaryButton>
        </div>
      ) : (
        <TapHint tap={text("tapEnvelope")} sound={text("soundHint")} still={editing} />
      )}
    </div>
  );
}

export function QuestionScreen({ screen, onNext, stage = 0 }: ScreenProps<"question">) {
  const sfx = useSfx();
  const { list } = useWords();
  const { area, yes, noProps, dodges, moved, label } = useRunaway(() => sfx("boing"));
  const [saidYes, setSaidYes] = useState(stage >= 2);
  usePressAt(stage === 1 ? 1 : 0, 1, () => area.current?.querySelector<HTMLElement>("[data-no]"));

  if (saidYes) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <Burst />
        <HeartMark className="h-24 w-24 animate-pop text-[var(--c-accent)]" />
        <h2 className="font-display text-3xl font-semibold italic">{screen.afterYes}</h2>
        <NextButton onClick={onNext} />
      </div>
    );
  }

  const yesScale = Math.min(1 + dodges * 0.12, 1.8);
  // Sits next to Yes until the first dodge, then roams the play area.
  const noButton = (
    <button
      {...noProps}
      data-no
      className={`${moved ? "absolute transition-[left,top] duration-200 ease-out" : ""} min-h-14 whitespace-nowrap rounded-full bg-[var(--c-secondary)] px-6 py-3 text-[1.0625rem] font-semibold tracking-[0.02em] text-[var(--c-text)] shadow-sm ring-1 ring-current/20`}
    >
      {label(screen.no, list("noLines"))}
    </button>
  );

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <HeartMark className="h-12 w-12 text-[var(--c-accent)]" />
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.question}</h2>
      <div ref={area} className="relative h-64 w-full">
        {/* Long answers ("Absolutely not") go on two rows rather than off a phone's edges. */}
        <div className="absolute inset-x-0 top-6 flex flex-wrap items-center justify-center gap-4 px-2">
          <button
            ref={yes}
            data-yes
            onClick={() => {
              setSaidYes(true);
              sfx("win");
            }}
            style={{ transform: `scale(${yesScale})` }}
            className={`${BUTTON} duration-300`}
          >
            {screen.yes}
          </button>
          {!moved && noButton}
        </div>
        {moved && noButton}
      </div>
    </div>
  );
}

export function PhotosScreen({ screen, onNext, stage = 0, wide = false }: ScreenProps<"photos"> & { wide?: boolean }) {
  const sfx = useSfx();
  const { text } = useWords();
  const photos = screen.photos;
  const total = photos.length;
  const [index, setIndex] = useState(total ? Math.min(stage, total - 1) : 0);

  // Desktop designs pin every photo up at once, like a gallery wall.
  if (wide && total > 0) {
    return (
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <h2 className="font-display text-3xl font-semibold leading-tight @2xl:text-4xl">{screen.title}</h2>
        <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-4 @2xl:grid-cols-3 @2xl:gap-6">
          {photos.map((src, i) => (
            <figure
              key={`${src}-${i}`}
              className="relative animate-pop rounded-md bg-white p-2 pb-9 shadow-xl transition duration-300 hover:z-10 hover:scale-105 hover:rotate-0 @2xl:p-3 @2xl:pb-12"
              style={{ transform: `rotate(${[-4, 3, -2, 5, -3, 2][i % 6]}deg)`, animationDelay: `${i * 120}ms` }}
            >
              <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[var(--c-accent)] shadow ring-2 ring-white" />
              <div className="aspect-square w-full overflow-hidden rounded-sm bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- user photos from our storage, already resized on upload */}
                <img
                  data-photo={i}
                  src={src}
                  alt={screen.captions[i] || `Photo ${i + 1}`}
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={cropStyle(screen.crops?.[i])}
                  draggable={false}
                />
              </div>
              <figcaption className="absolute inset-x-2 bottom-1.5 truncate font-hand text-lg text-neutral-700 @2xl:bottom-3 @2xl:text-xl">
                {screen.captions[i] ?? ""}
              </figcaption>
            </figure>
          ))}
        </div>
        <NextButton onClick={onNext} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      {total === 0 ? (
        // In the editor, tapping it adds photos.
        <div data-photo="new" className="flex h-72 w-60 rotate-[-3deg] items-center justify-center rounded-md bg-white p-3 pb-12 text-sm text-neutral-400 shadow-xl">
          Your photos will appear here
        </div>
      ) : (
        <button
          aria-label="Next photo"
          onClick={() => {
            setIndex((i) => (i + 1) % total);
            sfx("tap");
          }}
          className="relative h-80 w-64"
        >
          {photos.map((src, i) => {
            const offset = (i - index + total) % total;
            const rotation = [-4, 5, -2, 3, -6, 2][i % 6];
            return (
              <figure
                // The same photo can be in twice.
                key={`${src}-${i}`}
                className="absolute inset-0 rounded-md bg-white p-3 pb-14 shadow-xl transition-all duration-500"
                style={{
                  transform: `rotate(${offset === 0 ? rotation : rotation * 1.6}deg) translateY(${offset * 6}px) scale(${1 - offset * 0.04})`,
                  zIndex: total - offset,
                  opacity: offset > 2 ? 0 : 1,
                }}
              >
                {/* A soft paper colour, so a photo still on its way doesn't look like a hole. */}
                <div className="h-full w-full overflow-hidden rounded-sm bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- user photos from our storage, already resized on upload */}
                  <img
                    data-photo={i}
                    src={src}
                    alt={screen.captions[i] || `Photo ${i + 1}`}
                    decoding="async"
                    fetchPriority={offset === 0 ? "high" : undefined}
                    className="h-full w-full object-cover"
                    style={cropStyle(screen.crops?.[i])}
                    draggable={false}
                  />
                </div>
                <figcaption className="absolute inset-x-3 bottom-3 truncate font-hand text-xl text-neutral-700">
                  {screen.captions[i] ?? ""}
                </figcaption>
              </figure>
            );
          })}
        </button>
      )}
      {total > 1 && <p className="text-base text-[var(--c-muted)]">{text("photosTap", { i: index + 1, n: total })}</p>}
      <NextButton onClick={onNext} />
    </div>
  );
}

export function MessageScreen({ screen, onNext }: ScreenProps<"message">) {
  const reduced = useReducedMotion();
  const { text } = useWords();
  const body = screen.body;
  const [typed, setTyped] = useState(0);
  // Restart the typewriter when the text changes (e.g. while editing in the preview).
  const [typedBody, setTypedBody] = useState(body);
  if (typedBody !== body) {
    setTypedBody(body);
    setTyped(0);
  }
  let shown = reduced ? body.length : Math.min(typed, body.length);
  // Never half an emoji.
  if (shown < body.length && /[\uD800-\uDBFF]/.test(body[shown - 1] ?? "")) shown += 1;
  const done = shown >= body.length;

  // Typed out letter by letter; faster or slower with style.tune.speed. A long letter types
  // a few at a time, so even the longest is all there in about eight seconds.
  const { speed } = useTune();
  const step = Math.max(1, Math.ceil(body.length / 280));
  useEffect(() => {
    const t = setInterval(() => setTyped((s) => (s >= body.length ? s : s + step)), 28 / speed);
    return () => clearInterval(t);
  }, [body, speed, step]);

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div>
        <h2 className="font-display text-3xl font-semibold italic leading-tight">{screen.title}</h2>
        <Flourish className="mx-auto mt-3 text-[var(--c-muted)]" />
      </div>
      <button
        onClick={() => setTyped(body.length)}
        className="min-h-40 w-full whitespace-pre-line rounded-sm bg-[var(--c-surface)] p-7 text-left text-xl leading-relaxed shadow-[0_14px_30px_-20px_rgba(0,0,0,0.6)] ring-1 ring-current/10"
      >
        {body.slice(0, shown)}
        {/* The words still to come are already in place, unseen, and the cursor takes no
            room, so the letter is its full size from the start and never pushes things down. */}
        {!done && (
          <>
            <span aria-hidden className="relative">
              <span className="absolute inset-y-0 left-0 w-0.5 animate-pulse bg-current" />
            </span>
            <span aria-hidden className="invisible">
              {body.slice(shown)}
            </span>
          </>
        )}
      </button>
      {done ? (
        <NextButton onClick={onNext} className="animate-pop" />
      ) : (
        <p className="grid min-h-14 place-items-center text-base text-[var(--c-muted)]">{text("messageSkip")}</p>
      )}
    </div>
  );
}

const FIREWORK_GAMES: Game[] = ["light-diyas", "release-lanterns", "launch-fireworks"];

export function GameScreen({ screen, onNext, stage = 0, occasion }: ScreenProps<"game"> & { occasion: Occasion }) {
  const sfx = useSfx();
  const { text } = useWords();
  const [won, setWon] = useState(stage >= 1);
  const stuck = useStuck(HELP_AFTER.game);
  const win = () => {
    setWon(true);
    sfx("win");
  };
  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      {won && <Burst usual={FIREWORK_GAMES.includes(screen.game) || (screen.game === "shake-it" && occasion === "diwali") ? "fireworks" : "confetti"} />}
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      <p className="text-lg text-[var(--c-muted)]">{won ? screen.winText : screen.instructions}</p>
      <GameView game={screen.game} occasion={occasion} won={won} onWin={win} />
      {/* Finishing it for them still counts as a win: the burst, the sound, the win words. */}
      {stuck && !won ? <HelpButton onClick={win}>{text("helpFinish")}</HelpButton> : <NextButton onClick={onNext} className={won ? "animate-pop" : "invisible"} />}
    </div>
  );
}

export function FinaleScreen({
  screen,
  onReplay,
  footer,
  from = "",
}: {
  screen: Of<"finale">;
  onReplay: () => void;
  footer?: React.ReactNode;
  // The sender, to sign and seal the message (see Keepsake).
  from?: string;
}) {
  const sfx = useSfx();
  const { text } = useWords();
  const sealed = from.trim() !== "";
  useEffect(() => {
    const timers = [setTimeout(() => sfx("win"), 150), setTimeout(() => sfx("sparkle"), 700)];
    if (screen.effect === "fireworks") for (let i = 0; i < 4; i++) timers.push(setTimeout(() => sfx("boom"), 900 + i * 800));
    // A soft thud as the seal is pressed on at the end (keepsake-seal in globals.css).
    if (sealed) timers.push(setTimeout(() => sfx("stamp"), 2650));
    return () => timers.forEach(clearTimeout);
  }, [sfx, screen.effect, sealed]);
  return (
    <>
      <FinaleEffect effect={screen.effect} />
      {/* Stacked above the effect so the words stay readable. */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <Flourish className="text-[var(--c-muted)]" />
        <h1 className="finale-title text-balance font-display text-[clamp(2.25rem,11cqw,3.25rem)] font-semibold italic leading-[1.1]">{screen.title}</h1>
        <Keepsake body={screen.body} from={from} />
        <div className="finale-later flex flex-col items-center gap-2">
          <button
            onClick={onReplay}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--c-surface)] px-6 py-2 text-base font-semibold shadow-sm ring-1 ring-current/15 transition active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4.2h4.2" />
            </svg>
            {text("playAgain")}
          </button>
          {footer}
        </div>
      </div>
    </>
  );
}

export function QuizScreen({ screen, onNext, stage = 0 }: ScreenProps<"quiz">) {
  const sfx = useSfx();
  const { text, list } = useWords();
  // Stages: the first question, a wrong answer to it, the other questions, the end.
  const [index, setIndex] = useState(stage <= 1 ? 0 : stage - 1);
  const [wrong, setWrong] = useState<number | null>(stage === 1 ? (screen.questions[0].answer === 0 ? 1 : 0) : null);
  const [misses, setMisses] = useState(stage === 1 ? 1 : 0);
  // Wrong answers to this question, to offer the answer after a couple.
  const [missesHere, setMissesHere] = useState(stage === 1 ? 1 : 0);
  const [right, setRight] = useState<number | null>(null);
  const done = index >= screen.questions.length;
  const q = screen.questions[Math.min(index, screen.questions.length - 1)];
  const stuck = useStuck(HELP_AFTER.quiz, missesHere, 2, index);

  const pick = (i: number) => {
    if (right !== null) return;
    if (i === q.answer) {
      setRight(i);
      setWrong(null);
      sfx(index === screen.questions.length - 1 ? "win" : "chime");
      setTimeout(() => {
        setRight(null);
        setIndex((n) => n + 1);
        setMissesHere(0);
      }, 650);
    } else {
      setWrong(i);
      setMisses((m) => m + 1);
      setMissesHere((m) => m + 1);
      sfx("wrong");
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <Burst />
        <Laurel className={`h-20 w-28 animate-pop ${misses === 0 ? "text-[var(--c-accent)]" : "text-[var(--c-muted)]"}`} />
        <h2 className="font-display text-3xl font-semibold">{screen.winText}</h2>
        <p className="text-lg text-[var(--c-muted)]">{misses === 0 ? text("quizPerfect") : misses === 1 ? text("quizMissedOne") : text("quizMissed", { n: misses })}</p>
        <NextButton onClick={onNext} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <p className="text-base font-semibold text-[var(--c-muted)]">
        <span>{screen.title}</span> · <span>{text("quizCount", { i: index + 1, n: screen.questions.length })}</span>
      </p>
      <h2 key={index} className="animate-screen-in font-display text-3xl font-semibold leading-tight">
        {q.question}
      </h2>
      <div className="grid w-full gap-3 @xl:grid-cols-2">
        {q.options.map((option, i) => (
          <button
            key={`${index}-${i}`}
            data-quiz-option={i}
            onClick={() => pick(i)}
            className={`rounded-2xl px-5 py-4 text-left font-display text-lg font-semibold shadow-sm ring-1 ring-black/10 transition ${
              right === i
                ? "scale-[1.02] bg-emerald-500 text-white"
                : wrong === i
                  ? "animate-shake bg-red-500 text-white"
                  : "bg-[var(--c-secondary)] text-[var(--c-text)] hover:-translate-y-0.5"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="h-7 font-display text-lg font-semibold">{wrong !== null ? list("wrongLines")[(misses - 1) % list("wrongLines").length] : ""}</p>
      {stuck && right === null && <HelpButton onClick={() => pick(q.answer)}>{text("helpAnswer")}</HelpButton>}
    </div>
  );
}

// How wide a stroke scratches off, in pixels from the finger.
const SCRATCH_BRUSH = 32;

// A silver panel they rub away with a finger (or mouse) to reveal a hidden message.
export function ScratchScreen({ screen, onNext, stage = 0 }: ScreenProps<"scratch">) {
  const sfx = useSfx();
  const { text } = useWords();
  const cover = text("scratchHere");
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const [revealed, setRevealed] = useState(stage >= 1);
  const stuck = useStuck(HELP_AFTER.scratch);

  useEffect(() => {
    const el = canvas.current;
    // It's read back often to see how much is scratched off; the first call sets that up.
    const ctx = el?.getContext("2d", { willReadFrequently: true });
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = el.clientWidth * dpr;
    el.height = el.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = el.clientWidth;
    const h = el.clientHeight;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#d4d4d8");
    g.addColorStop(0.5, "#f4f4f5");
    g.addColorStop(1, "#a1a1aa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (let i = 0; i < 300; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    ctx.fillStyle = "#52525b";
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(cover, w / 2, h / 2 + 7);
  }, [cover]);

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Scratch whenever a finger or a held mouse button moves across, even if the press began outside the panel.
    const pressed = drawing.current || e.pointerType !== "mouse" || (e.buttons & 1) === 1;
    if (!pressed || revealed) return;
    const el = e.currentTarget;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const box = el.getBoundingClientRect();
    // The card may be shown scaled down (a thumbnail or a phone mockup), so convert screen pixels to the canvas's own.
    const scale = el.clientWidth / box.width || 1;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    // A broad brush, so a slow or shaky finger still clears plenty.
    ctx.arc((e.clientX - box.left) * scale, (e.clientY - box.top) * scale, SCRATCH_BRUSH, 0, Math.PI * 2);
    ctx.fill();
    strokes.current += 1;
    if (strokes.current % 5 === 0) sfx("tick");
    if (strokes.current % 12 !== 0) return;
    // Sample the panel to see how much has been scratched away.
    const { data } = ctx.getImageData(0, 0, el.width, el.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 40) {
      total++;
      if (data[i] === 0) clear++;
    }
    if (clear / total > 0.5) {
      setRevealed(true);
      sfx("win");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      {revealed && <Burst />}
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      <p className="text-lg text-[var(--c-muted)]">{revealed ? text("scratchDone") : screen.instructions}</p>
      <div className="relative h-56 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="absolute inset-0 grid place-items-center p-6">
          <p className="font-display text-3xl font-semibold leading-tight text-[#3b0a1f]">{screen.hidden}</p>
        </div>
        <canvas
          ref={canvas}
          aria-label="Scratch card"
          // Drawn on the canvas, so the editor reads it from here.
          data-text={cover}
          onPointerDown={(e) => {
            drawing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scratch(e);
          }}
          onPointerMove={scratch}
          onPointerUp={() => (drawing.current = false)}
          className={`absolute inset-0 h-full w-full touch-none transition-opacity duration-700 ${revealed ? "pointer-events-none opacity-0" : ""}`}
        />
      </div>
      {stuck && !revealed ? (
        <HelpButton
          onClick={() => {
            setRevealed(true);
            sfx("win");
          }}
        >
          {text("helpReveal")}
        </HelpButton>
      ) : (
        <NextButton onClick={onNext} className={revealed ? "animate-pop" : "invisible"} />
      )}
    </div>
  );
}

// Accents people rarely type: Latin ones (é, ü), Arabic vowel marks and the stretching
// stroke, Hebrew points. Other marks stay, as in Hindi or Bengali they're part of the letter.
const ACCENTS = /[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f\u0591-\u05c7\u0610-\u061a\u064b-\u065f\u0670\u0640]/g;

// What counts when matching the phrase: letters and numbers in any script, ignoring case,
// those accents, punctuation and extra spaces (and full-width or other look-alike forms).
const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(ACCENTS, "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

// Each letter with the marks written on it, so a Hindi letter and its vowel sign share a tile.
const lettersOf = (s: string) => s.match(/\P{M}\p{M}*|\p{M}+/gu) ?? [];

// They have to type the secret phrase. Made for a keyboard, works with a phone keyboard too.
export function TypeItScreen({ screen, onNext, stage = 0 }: ScreenProps<"typeit">) {
  const sfx = useSfx();
  const { text } = useWords();
  // A phrase with no letters or numbers at all (only emoji, say) is matched just as it is.
  const loose = !normalise(screen.phrase);
  const match = (s: string) => (loose ? s.trim().toLowerCase() : normalise(s));
  const target = match(screen.phrase);
  const tiles = lettersOf(target);
  // Where each tile ends in the phrase, to show it once everything up to there is right.
  const ends = tiles.reduce<number[]>((all, t) => [...all, (all.at(-1) ?? 0) + t.length], []);
  const rtl = isRtl(screen.phrase);
  const [value, setValue] = useState(stage >= 1 ? screen.phrase : "");
  const [hints, setHints] = useState(0);
  // Times they've gone wrong while typing, to offer the answer after a few.
  const [slips, setSlips] = useState(0);
  const stuck = useStuck(HELP_AFTER.typeit, slips, 3);
  const typed = match(value);
  const solved = typed === target;
  // How many leading characters are right so far.
  let correct = 0;
  while (correct < typed.length && typed[correct] === target[correct]) correct++;
  const wrongNow = typed.length > correct;
  const solve = (phrase: string) => {
    setValue(phrase);
    sfx("unlock");
    setTimeout(() => sfx("win"), 200);
  };
  // Each hint types the next letter in for them (putting right anything wrong before it),
  // so pressing it enough times solves it.
  const hint = () => {
    let h = Math.min(Math.max(hints, ends.filter((end) => end <= correct).length) + 1, tiles.length);
    while (h < tiles.length && tiles[h - 1] === " ") h++;
    setHints(h);
    const filled = tiles.slice(0, h).join("");
    if (filled === target) return solve(filled);
    setValue(filled);
    sfx("tap");
  };

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      {solved && <Burst />}
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      <p className="text-lg text-[var(--c-muted)]">{solved ? screen.winText : screen.instructions}</p>
      {/* The tiles show it a letter at a time (or not yet), so the editor reads it from here. */}
      <div dir={rtl ? "rtl" : "ltr"} className={`flex flex-wrap justify-center gap-1.5 ${wrongNow ? "animate-shake" : ""}`} aria-hidden data-text={screen.phrase}>
        {tiles.map((ch, i) =>
          ch === " " ? (
            <span key={i} className="w-4" />
          ) : (
            <span
              key={i}
              className={`grid h-11 w-9 place-items-center rounded-lg font-display text-xl font-bold uppercase shadow-sm ring-1 ring-black/10 @2xl:h-14 @2xl:w-11 @2xl:text-2xl ${
                ends[i] <= correct || i < hints ? "bg-[var(--c-accent)] text-[var(--c-accent-text)]" : "bg-[var(--c-secondary)]"
              }`}
            >
              {ends[i] <= correct || i < hints ? ch : ""}
            </span>
          ),
        )}
      </div>
      {!solved && (
        <>
          <input
            value={value}
            onChange={(e) => {
              const next = match(e.target.value);
              if (next === target) return solve(e.target.value);
              setValue(e.target.value);
              if (next.length > typed.length) {
                const ok = target.startsWith(next);
                sfx(ok ? "tap" : "wrong");
                if (!ok && !wrongNow) setSlips((n) => n + 1);
              }
            }}
            aria-label="Type the secret phrase"
            placeholder={text("typeStart")}
            data-text={text("typeStart")}
            dir={rtl ? "rtl" : "auto"}
            // The phone's keyboard mustn't "fix" the secret phrase into something else.
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
            className="w-full max-w-sm rounded-2xl bg-[var(--c-secondary)] px-5 py-4 text-center font-display text-xl font-semibold text-[var(--c-text)] shadow-sm outline-none ring-1 ring-black/10 placeholder:opacity-50 focus:ring-2 focus:ring-[var(--c-accent)]"
          />
          <button onClick={hint} className="min-h-11 px-4 text-base font-semibold underline underline-offset-4 opacity-80">
            {text("typeHint")}
          </button>
        </>
      )}
      {stuck && !solved ? <HelpButton onClick={() => solve(screen.phrase)}>{text("helpAnswer")}</HelpButton> : <NextButton onClick={onNext} className={solved ? "animate-pop" : "invisible"} />}
    </div>
  );
}
