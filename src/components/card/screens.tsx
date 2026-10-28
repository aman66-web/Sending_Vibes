"use client";

import { useEffect, useRef, useState } from "react";
import type { Game, Occasion, Screen } from "@/lib/card";
import { FinaleEffect, Particles, useReducedMotion } from "./effects";
import { GameView } from "./games";
import { useRunaway } from "./runaway";
import { Flourish, HeartMark, Laurel } from "./ornaments";
import { useSfx } from "./sound";

type Of<T extends Screen["type"]> = Extract<Screen, { type: T }>;
type ScreenProps<T extends Screen["type"]> = { screen: Of<T>; onNext: () => void };

// Small capitals with generous spacing, like the button on a printed invitation.
export const BUTTON =
  "rounded-full bg-[var(--c-accent)] px-8 py-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.2em] text-[var(--c-accent-text)] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.7)] transition hover:brightness-110 active:scale-95";

export function PrimaryButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button data-primary onClick={onClick} className={`${BUTTON} ${className}`}>
      {children}
    </button>
  );
}

const ENVELOPE = "#f6efe0";
const ENVELOPE_SHADE = "#ebe1cb";

export function IntroScreen({ screen, onNext, to, from }: ScreenProps<"intro"> & { to: string; from: string }) {
  const sfx = useSfx();
  const [open, setOpen] = useState(false);
  // Set once the letter has come out, so a quick double tap doesn't skip straight past it.
  const [opened, setOpened] = useState(false);
  const after = useRef<HTMLDivElement>(null);
  const initial = (from.trim()[0] ?? "").toUpperCase() || "\u2665";

  // Once it's open, bring the message and button into view: on a short screen (a small
  // phone, or the preview while making a card) they'd otherwise sit below the fold.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setOpened(true);
      after.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 1100);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className={`transition-opacity duration-500 ${open ? "opacity-0" : ""}`}>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-[var(--c-muted)]">You&apos;ve got mail</p>
        <Flourish className="mx-auto mt-3 text-[var(--c-muted)]" />
      </div>
      {/* A cream envelope, hand-addressed, closed with a wax seal. It opens and the letter
          slides up; tapping it again carries on, like the button underneath. */}
      <button
        aria-label={open ? screen.title : "Open the envelope"}
        onClick={() => {
          if (opened) return onNext();
          if (open) return;
          setOpen(true);
          sfx("whoosh");
          setTimeout(() => sfx("sparkle"), 450);
        }}
        className="group relative mt-16 h-48 w-72 [perspective:900px]"
      >
        <span
          className="absolute inset-0 rounded-md shadow-[0_22px_44px_-20px_rgba(0,0,0,0.6)]"
          style={{ background: `repeating-linear-gradient(135deg, var(--c-accent) 0 7px, color-mix(in srgb, var(--c-accent) 78%, white) 7px 14px)` }}
        />
        <span
          className={`absolute inset-x-4 bottom-3 top-3 flex flex-col items-center rounded-sm bg-[#fffdf8] px-5 pt-6 text-[#2b2318] shadow transition-transform duration-700 ease-out ${open ? "-translate-y-28 delay-300" : ""}`}
          style={{ zIndex: 2 }}
        >
          <span className="font-display text-xl font-semibold italic leading-tight">{screen.title}</span>
          <Flourish className="mt-2 w-24 text-[#a8894f]" />
        </span>
        <span
          className="absolute inset-0 rounded-md [clip-path:polygon(0_0,50%_54%,100%_0,100%_100%,0_100%)]"
          style={{ zIndex: 3, background: `linear-gradient(180deg, ${ENVELOPE} 0%, ${ENVELOPE_SHADE} 100%)` }}
        >
          {to && <span className="absolute inset-x-0 bottom-2 truncate px-6 font-hand text-2xl text-[#3a3127]">{to}</span>}
        </span>
        <span
          className={`absolute inset-x-0 top-0 h-[60%] origin-top rounded-t-md [clip-path:polygon(0_0,100%_0,50%_100%)] ${open ? "[transform:rotateX(180deg)]" : ""}`}
          style={{
            zIndex: open ? 1 : 4,
            background: open ? "color-mix(in srgb, var(--c-accent) 85%, black)" : ENVELOPE_SHADE,
            filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.12))",
            transition: "transform 0.5s ease-in-out, z-index 0s linear 0.25s, background 0s linear 0.25s",
          }}
        />
        <span
          className={`absolute left-1/2 top-[56%] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display text-xl font-semibold italic text-white/90 transition duration-300 ${open ? "scale-0 opacity-0" : "group-hover:scale-105"}`}
          style={{
            zIndex: 5,
            background: "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c-accent) 65%, white) 0%, var(--c-accent) 45%, color-mix(in srgb, var(--c-accent) 55%, black) 100%)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.35), inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.25)",
          }}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-white/35">{initial}</span>
        </span>
      </button>
      {open ? (
        <div ref={after} className="flex animate-screen-in flex-col items-center gap-5 [animation-delay:800ms]">
          <p className="text-lg text-[var(--c-muted)]">{screen.subtitle}</p>
          <PrimaryButton onClick={onNext}>{screen.button}</PrimaryButton>
        </div>
      ) : (
        <p className="animate-pulse text-xs font-semibold uppercase tracking-[0.25em] opacity-70">Tap the envelope to open it</p>
      )}
    </div>
  );
}

export function QuestionScreen({ screen, onNext }: ScreenProps<"question">) {
  const sfx = useSfx();
  const { area, yes, noProps, dodges, moved, label } = useRunaway(() => sfx("boing"));
  const [saidYes, setSaidYes] = useState(false);

  if (saidYes) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <Particles mode="confetti" />
        <HeartMark className="h-24 w-24 animate-pop text-[var(--c-accent)]" />
        <h2 className="font-display text-3xl font-semibold italic">{screen.afterYes}</h2>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </div>
    );
  }

  const yesScale = Math.min(1 + dodges * 0.12, 1.8);
  // Sits next to Yes until the first dodge, then roams the play area.
  const noButton = (
    <button
      {...noProps}
      data-no
      className={`${moved ? "absolute transition-[left,top] duration-200 ease-out" : ""} whitespace-nowrap rounded-full bg-[var(--c-secondary)] px-6 py-3 text-[0.8rem] font-semibold uppercase tracking-[0.18em] text-[var(--c-text)] shadow-sm ring-1 ring-current/20`}
    >
      {label(screen.no)}
    </button>
  );

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <HeartMark className="h-12 w-12 text-[var(--c-accent)]" />
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.question}</h2>
      <div ref={area} className="relative h-64 w-full">
        <div className="absolute inset-x-0 top-6 flex items-center justify-center gap-4">
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

export function PhotosScreen({ screen, onNext, wide = false }: ScreenProps<"photos"> & { wide?: boolean }) {
  const sfx = useSfx();
  const [index, setIndex] = useState(0);
  const photos = screen.photos;
  const total = photos.length;

  // Desktop designs pin every photo up at once, like a gallery wall.
  if (wide && total > 0) {
    return (
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <h2 className="font-display text-3xl font-semibold leading-tight @2xl:text-4xl">{screen.title}</h2>
        <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-4 @2xl:grid-cols-3 @2xl:gap-6">
          {photos.map((src, i) => (
            <figure
              key={src + i}
              className="relative animate-pop rounded-md bg-white p-2 pb-9 shadow-xl transition duration-300 hover:z-10 hover:scale-105 hover:rotate-0 @2xl:p-3 @2xl:pb-12"
              style={{ transform: `rotate(${[-4, 3, -2, 5, -3, 2][i % 6]}deg)`, animationDelay: `${i * 120}ms` }}
            >
              <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[var(--c-accent)] shadow ring-2 ring-white" />
              {/* eslint-disable-next-line @next/next/no-img-element -- user photos from our storage, already resized on upload */}
              <img src={src} alt="" className="aspect-square w-full rounded-sm object-cover" draggable={false} />
              <figcaption className="absolute inset-x-2 bottom-1.5 truncate font-hand text-lg text-neutral-700 @2xl:bottom-3 @2xl:text-xl">
                {screen.captions[i] ?? ""}
              </figcaption>
            </figure>
          ))}
        </div>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      {total === 0 ? (
        <div className="flex h-72 w-60 rotate-[-3deg] items-center justify-center rounded-md bg-white p-3 pb-12 text-sm text-neutral-400 shadow-xl">
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
                key={src}
                className="absolute inset-0 rounded-md bg-white p-3 pb-14 shadow-xl transition-all duration-500"
                style={{
                  transform: `rotate(${offset === 0 ? rotation : rotation * 1.6}deg) translateY(${offset * 6}px) scale(${1 - offset * 0.04})`,
                  zIndex: total - offset,
                  opacity: offset > 2 ? 0 : 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user photos from our storage, already resized on upload */}
                <img src={src} alt="" className="h-full w-full rounded-sm object-cover" draggable={false} />
                <figcaption className="absolute inset-x-3 bottom-3 truncate font-hand text-xl text-neutral-700">
                  {screen.captions[i] ?? ""}
                </figcaption>
              </figure>
            );
          })}
        </button>
      )}
      {total > 1 && <p className="text-sm text-[var(--c-muted)]">Tap the photo to see the next one ({index + 1}/{total})</p>}
      <PrimaryButton onClick={onNext}>Next</PrimaryButton>
    </div>
  );
}

export function MessageScreen({ screen, onNext }: ScreenProps<"message">) {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(0);
  // Restart the typewriter when the text changes (e.g. while editing in the preview).
  const [typedBody, setTypedBody] = useState(screen.body);
  if (typedBody !== screen.body) {
    setTypedBody(screen.body);
    setTyped(0);
  }
  const shown = reduced ? screen.body.length : typed;
  const done = shown >= screen.body.length;

  useEffect(() => {
    const t = setInterval(() => setTyped((s) => (s >= screen.body.length ? s : s + 1)), 28);
    return () => clearInterval(t);
  }, [screen.body]);

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div>
        <h2 className="font-display text-3xl font-semibold italic leading-tight">{screen.title}</h2>
        <Flourish className="mx-auto mt-3 text-[var(--c-muted)]" />
      </div>
      <button
        onClick={() => setTyped(screen.body.length)}
        className="min-h-40 w-full whitespace-pre-line rounded-sm bg-[var(--c-surface)] p-7 text-left text-lg leading-relaxed shadow-[0_14px_30px_-20px_rgba(0,0,0,0.6)] ring-1 ring-current/10"
      >
        {screen.body.slice(0, shown)}
        {!done && <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-current align-middle" />}
      </button>
      <PrimaryButton onClick={onNext} className={done ? "" : "invisible"}>
        Next
      </PrimaryButton>
    </div>
  );
}

const FIREWORK_GAMES: Game[] = ["light-diyas", "release-lanterns", "launch-fireworks"];

export function GameScreen({ screen, onNext, occasion }: ScreenProps<"game"> & { occasion: Occasion }) {
  const sfx = useSfx();
  const [won, setWon] = useState(false);
  const win = () => {
    setWon(true);
    sfx("win");
  };
  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      {won && <Particles mode={FIREWORK_GAMES.includes(screen.game) || (screen.game === "shake-it" && occasion === "diwali") ? "fireworks" : "confetti"} />}
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      <p className="text-[var(--c-muted)]">{won ? screen.winText : screen.instructions}</p>
      <GameView game={screen.game} occasion={occasion} won={won} onWin={win} />
      <PrimaryButton onClick={onNext} className={won ? "animate-pop" : "invisible"}>
        Next
      </PrimaryButton>
    </div>
  );
}

export function FinaleScreen({ screen, onReplay, footer }: { screen: Of<"finale">; onReplay: () => void; footer?: React.ReactNode }) {
  const sfx = useSfx();
  useEffect(() => {
    const timers = [setTimeout(() => sfx("win"), 150), setTimeout(() => sfx("sparkle"), 700)];
    if (screen.effect === "fireworks") for (let i = 0; i < 4; i++) timers.push(setTimeout(() => sfx("boom"), 900 + i * 800));
    return () => timers.forEach(clearTimeout);
  }, [sfx, screen.effect]);
  return (
    <>
      <FinaleEffect effect={screen.effect} />
      {/* Stacked above the effect so the words stay readable. */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <Flourish className="text-[var(--c-muted)]" />
        <h1 className="animate-pop font-display text-5xl font-semibold italic leading-tight">{screen.title}</h1>
        <p className="text-lg text-[var(--c-muted)]">{screen.body}</p>
        <button onClick={onReplay} className="text-sm font-semibold underline underline-offset-4 opacity-80 hover:opacity-100">
          Play it again
        </button>
        {footer}
      </div>
    </>
  );
}

const WRONG_LINES = ["Wrong!", "Excuse me?", "Try again.", "Hmm, no.", "I'm offended."];

export function QuizScreen({ screen, onNext }: ScreenProps<"quiz">) {
  const sfx = useSfx();
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [right, setRight] = useState<number | null>(null);
  const done = index >= screen.questions.length;
  const q = screen.questions[Math.min(index, screen.questions.length - 1)];

  const pick = (i: number) => {
    if (right !== null) return;
    if (i === q.answer) {
      setRight(i);
      setWrong(null);
      sfx(index === screen.questions.length - 1 ? "win" : "chime");
      setTimeout(() => {
        setRight(null);
        setIndex((n) => n + 1);
      }, 650);
    } else {
      setWrong(i);
      setMisses((m) => m + 1);
      sfx("wrong");
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <Particles mode="confetti" />
        <Laurel className={`h-20 w-28 animate-pop ${misses === 0 ? "text-[var(--c-accent)]" : "text-[var(--c-muted)]"}`} />
        <h2 className="font-display text-3xl font-semibold">{screen.winText}</h2>
        <p className="text-[var(--c-muted)]">{misses === 0 ? "Full marks. Obviously." : `Only ${misses} wrong answer${misses === 1 ? "" : "s"}. We'll talk about that later.`}</p>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-[var(--c-muted)]">
        {screen.title} · {index + 1} of {screen.questions.length}
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
      <p className="h-6 font-display font-semibold text-[var(--c-accent)]">{wrong !== null ? WRONG_LINES[misses % WRONG_LINES.length] : ""}</p>
    </div>
  );
}

// A silver panel they rub away with a finger (or mouse) to reveal a hidden message.
export function ScratchScreen({ screen, onNext }: ScreenProps<"scratch">) {
  const sfx = useSfx();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
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
    ctx.fillText("Scratch here", w / 2, h / 2 + 7);
  }, []);

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
    ctx.arc((e.clientX - box.left) * scale, (e.clientY - box.top) * scale, 24, 0, Math.PI * 2);
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
      {revealed && <Particles mode="confetti" />}
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      <p className="text-[var(--c-muted)]">{revealed ? "There it is!" : screen.instructions}</p>
      <div className="relative h-56 w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="absolute inset-0 grid place-items-center p-6">
          <p className="font-display text-3xl font-semibold leading-tight text-[#3b0a1f]">{screen.hidden}</p>
        </div>
        <canvas
          ref={canvas}
          aria-label="Scratch card"
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
      <PrimaryButton onClick={onNext} className={revealed ? "animate-pop" : "invisible"}>
        Next
      </PrimaryButton>
    </div>
  );
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

// They have to type the secret phrase. Made for a keyboard, works with a phone keyboard too.
export function TypeItScreen({ screen, onNext }: ScreenProps<"typeit">) {
  const sfx = useSfx();
  const target = normalise(screen.phrase);
  const [value, setValue] = useState("");
  const [hints, setHints] = useState(0);
  const typed = normalise(value);
  const solved = typed === target;
  // How many leading characters are right so far.
  let correct = 0;
  while (correct < typed.length && typed[correct] === target[correct]) correct++;
  const wrongNow = typed.length > correct;

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      {solved && <Particles mode="confetti" />}
      <h2 className="font-display text-3xl font-semibold leading-tight">{screen.title}</h2>
      <p className="text-[var(--c-muted)]">{solved ? screen.winText : screen.instructions}</p>
      <div className={`flex flex-wrap justify-center gap-1.5 ${wrongNow ? "animate-shake" : ""}`} aria-hidden>
        {target.split("").map((ch, i) =>
          ch === " " ? (
            <span key={i} className="w-4" />
          ) : (
            <span
              key={i}
              className={`grid h-11 w-9 place-items-center rounded-lg font-display text-xl font-bold uppercase shadow-sm ring-1 ring-black/10 @2xl:h-14 @2xl:w-11 @2xl:text-2xl ${
                i < correct || i < hints ? "bg-[var(--c-accent)] text-[var(--c-accent-text)]" : "bg-[var(--c-secondary)]"
              }`}
            >
              {i < correct || i < hints ? ch : ""}
            </span>
          ),
        )}
      </div>
      {!solved && (
        <>
          <input
            value={value}
            onChange={(e) => {
              const next = normalise(e.target.value);
              setValue(e.target.value);
              if (next === target) {
                sfx("unlock");
                setTimeout(() => sfx("win"), 200);
              } else if (next.length > typed.length) sfx(target.startsWith(next) ? "tap" : "wrong");
            }}
            aria-label="Type the secret phrase"
            placeholder="Start typing…"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full max-w-sm rounded-2xl bg-[var(--c-secondary)] px-5 py-4 text-center font-display text-xl font-semibold text-[var(--c-text)] shadow-sm outline-none ring-1 ring-black/10 placeholder:opacity-50 focus:ring-2 focus:ring-[var(--c-accent)]"
          />
          <button onClick={() => setHints((h) => Math.min(h + 1, target.length))} className="text-sm font-semibold underline underline-offset-4 opacity-75">
            Need a hint?
          </button>
        </>
      )}
      <PrimaryButton onClick={onNext} className={solved ? "animate-pop" : "invisible"}>
        Next
      </PrimaryButton>
    </div>
  );
}
