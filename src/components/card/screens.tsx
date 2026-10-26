"use client";

import { useEffect, useState } from "react";
import type { Screen } from "@/lib/card";
import { FinaleEffect, Particles, useReducedMotion } from "./effects";
import { GameView } from "./games";
import { useRunaway } from "./runaway";

type Of<T extends Screen["type"]> = Extract<Screen, { type: T }>;
type ScreenProps<T extends Screen["type"]> = { screen: Of<T>; onNext: () => void };

export function PrimaryButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full bg-[var(--c-accent)] px-8 py-3.5 font-display text-lg font-semibold text-[var(--c-accent-text)] shadow-lg shadow-black/10 transition hover:brightness-110 active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

export function IntroScreen({ screen, onNext, emoji }: ScreenProps<"intro"> & { emoji: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="font-display text-2xl font-bold">{open ? "\u00a0" : "You've got mail 💌"}</p>
      {/* An envelope that unseals and slides its letter up when tapped. */}
      <button
        aria-label={open ? screen.title : "Open the envelope"}
        onClick={() => setOpen(true)}
        disabled={open}
        className="group relative mt-24 h-44 w-64 [perspective:900px]"
      >
        <span className="absolute inset-0 rounded-xl bg-[var(--c-accent)] brightness-75" />
        <span
          className={`absolute inset-x-3 bottom-2 top-2 flex flex-col items-center rounded-lg bg-white px-4 pt-5 text-[#3b0a1f] shadow-md transition-transform duration-700 ease-out ${open ? "-translate-y-28 delay-300" : ""}`}
          style={{ zIndex: 2 }}
        >
          <span className="font-display text-xl font-bold leading-tight">{screen.title}</span>
          <span className="mt-2 h-1 w-10 rounded-full bg-[var(--c-accent)]" />
        </span>
        <span
          className="absolute inset-0 rounded-xl bg-[var(--c-accent)] shadow-lg [clip-path:polygon(0_0,50%_54%,100%_0,100%_100%,0_100%)]"
          style={{ zIndex: 3 }}
        />
        <span
          className={`absolute inset-x-0 top-0 h-[60%] origin-top rounded-t-xl bg-[var(--c-accent)] brightness-90 [clip-path:polygon(0_0,100%_0,50%_100%)] ${open ? "[transform:rotateX(180deg)]" : ""}`}
          style={{ zIndex: open ? 1 : 4, transition: "transform 0.5s ease-in-out, z-index 0s linear 0.25s" }}
        />
        <span
          className={`absolute left-1/2 top-[60%] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#b3123f] text-2xl shadow-lg ring-4 ring-white/30 transition duration-300 ${open ? "scale-0 opacity-0" : "group-hover:scale-110"}`}
          style={{ zIndex: 5 }}
        >
          {emoji}
        </span>
      </button>
      {open ? (
        <div className="flex animate-screen-in flex-col items-center gap-5 [animation-delay:800ms]">
          <p className="text-lg text-[var(--c-muted)]">{screen.subtitle}</p>
          <PrimaryButton onClick={onNext}>{screen.button}</PrimaryButton>
        </div>
      ) : (
        <p className="animate-pulse text-sm font-semibold opacity-80">Tap the envelope to open it</p>
      )}
    </div>
  );
}

export function QuestionScreen({ screen, onNext }: ScreenProps<"question">) {
  const { area, yes, noProps, dodges, moved, label } = useRunaway();
  const [saidYes, setSaidYes] = useState(false);

  if (saidYes) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <Particles mode="confetti" />
        <div className="animate-pop text-8xl">🥰</div>
        <h2 className="font-display text-3xl font-bold">{screen.afterYes}</h2>
        <PrimaryButton onClick={onNext}>Next</PrimaryButton>
      </div>
    );
  }

  const yesScale = Math.min(1 + dodges * 0.12, 1.8);
  // Sits next to Yes until the first dodge, then roams the play area.
  const noButton = (
    <button
      {...noProps}
      className={`${moved ? "absolute transition-[left,top] duration-200 ease-out" : ""} whitespace-nowrap rounded-full bg-[var(--c-secondary)] px-6 py-3 font-display text-base font-semibold text-[var(--c-text)] shadow ring-1 ring-black/10`}
    >
      {label(screen.no)}
    </button>
  );

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <div className="text-6xl">🥺</div>
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.question}</h2>
      <div ref={area} className="relative h-64 w-full">
        <div className="absolute inset-x-0 top-6 flex items-center justify-center gap-4">
          <button
            ref={yes}
            onClick={() => setSaidYes(true)}
            style={{ transform: `scale(${yesScale})` }}
            className="rounded-full bg-[var(--c-accent)] px-8 py-3.5 font-display text-lg font-semibold text-[var(--c-accent-text)] shadow-lg transition-transform duration-300"
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

export function PhotosScreen({ screen, onNext }: ScreenProps<"photos">) {
  const [index, setIndex] = useState(0);
  const photos = screen.photos;
  const total = photos.length;

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      {total === 0 ? (
        <div className="flex h-72 w-60 rotate-[-3deg] items-center justify-center rounded-md bg-white p-3 pb-12 text-sm text-neutral-400 shadow-xl">
          Your photos will appear here
        </div>
      ) : (
        <button aria-label="Next photo" onClick={() => setIndex((i) => (i + 1) % total)} className="relative h-80 w-64">
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
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <button
        onClick={() => setTyped(screen.body.length)}
        className="min-h-40 w-full whitespace-pre-line rounded-3xl bg-[var(--c-surface)] p-6 text-left text-lg leading-relaxed shadow-sm ring-1 ring-black/5 backdrop-blur"
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

export function GameScreen({ screen, onNext }: ScreenProps<"game">) {
  const [won, setWon] = useState(false);
  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      {won && <Particles mode={screen.game === "light-diyas" ? "fireworks" : "confetti"} />}
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <p className="text-[var(--c-muted)]">{won ? screen.winText : screen.instructions}</p>
      <GameView game={screen.game} won={won} onWin={() => setWon(true)} />
      <PrimaryButton onClick={onNext} className={won ? "animate-pop" : "invisible"}>
        Next
      </PrimaryButton>
    </div>
  );
}

export function FinaleScreen({ screen, onReplay, footer }: { screen: Of<"finale">; onReplay: () => void; footer?: React.ReactNode }) {
  return (
    <>
      <FinaleEffect effect={screen.effect} />
      {/* Stacked above the effect so the words stay readable. */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <h1 className="animate-pop font-display text-5xl font-bold leading-tight">{screen.title}</h1>
        <p className="text-lg text-[var(--c-muted)]">{screen.body}</p>
        <button onClick={onReplay} className="text-sm font-semibold underline underline-offset-4 opacity-80 hover:opacity-100">
          Play it again
        </button>
        {footer}
      </div>
    </>
  );
}
