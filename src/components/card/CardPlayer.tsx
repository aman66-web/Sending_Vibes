"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CardData } from "@/lib/card";
import { occasions } from "@/lib/templates";
import { themes } from "@/lib/themes";
import { EmojiRain } from "./effects";
import { BoxesScreen, CouponsScreen, ReasonsScreen, SliderScreen, TimelineScreen, WheelScreen } from "./more-screens";
import {
  FinaleScreen,
  GameScreen,
  IntroScreen,
  MessageScreen,
  PhotosScreen,
  QuestionScreen,
  QuizScreen,
  ScratchScreen,
  TypeItScreen,
} from "./screens";
import { playMusic, setMuted, SoundEnabled, unlockAudio, useMuted } from "./sound";

type Props = {
  card: CardData;
  // Creator preview: keeps empty photo screens visible and jumps to the screen being edited.
  preview?: boolean;
  focusScreenId?: string;
  // Changing this jumps back to focusScreenId even if it hasn't changed.
  focusNonce?: number;
  // Sound effects and music. Off in previews unless asked for.
  sound?: boolean;
  // Thumbnail mode: no room left for a phone notch.
  bare?: boolean;
};

export function CardPlayer({ card, preview = false, focusScreenId, focusNonce = 0, sound = !preview, bare = false }: Props) {
  const theme = themes[card.theme];
  const screens = useMemo(
    () => card.screens.filter((s) => preview || s.type !== "photos" || s.photos.length > 0),
    [card.screens, preview],
  );
  const focusIndex = () => Math.max(screens.findIndex((s) => s.id === focusScreenId), 0);
  const [index, setIndex] = useState(focusIndex);
  // Bumped on replay so every screen remounts with fresh state.
  const [run, setRun] = useState(0);

  // Jump to whichever screen the creator is editing.
  const focusTarget = `${focusScreenId ?? ""}:${focusNonce}`;
  const [focused, setFocused] = useState(focusTarget);
  if (focused !== focusTarget) {
    setFocused(focusTarget);
    if (focusScreenId) {
      setIndex(focusIndex());
      // Start that screen fresh (e.g. the question again, not "after yes").
      setRun((r) => r + 1);
    }
  }

  const current = screens[Math.min(index, screens.length - 1)];
  const muted = useMuted();
  // Browsers only count some events as a "real" tap that may start audio (on
  // phones that's the finger lifting, not landing), so try on each of them.
  const unlock = () => {
    if (!sound) return;
    unlockAudio();
    if (!tapped) setTapped(true);
  };
  // Browsers only allow audio after a tap, so nothing plays until their first one.
  const [tapped, setTapped] = useState(false);
  const music = card.music ?? "none";
  useEffect(() => {
    if (!sound || !tapped || muted || music === "none") return;
    return playMusic(music);
  }, [sound, tapped, muted, music]);

  const wide = card.layout === "wide";
  const next = () => setIndex((i) => Math.min(i + 1, screens.length - 1));
  const replay = () => {
    setIndex(0);
    setRun((r) => r + 1);
  };

  const style = {
    background: theme.background,
    color: theme.text,
    "--c-text": theme.text,
    "--c-muted": theme.muted,
    "--c-accent": theme.accent,
    "--c-accent-text": theme.accentText,
    "--c-surface": theme.surface,
    "--c-secondary": theme.secondary,
  } as React.CSSProperties;

  return (
    <SoundEnabled.Provider value={sound}>
    <div
      style={style}
      onPointerDownCapture={unlock}
      onPointerUpCapture={unlock}
      onClickCapture={unlock}
      onKeyDownCapture={unlock}
      className={`@container relative flex w-full flex-col overflow-hidden font-card ${preview ? "h-full" : "min-h-dvh"}`}
    >
      <EmojiRain effect={card.ambient} />
      {!preview && card.device && card.device !== "everywhere" && <DeviceTip device={card.device} />}
      {sound && (
        <button
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          aria-pressed={!muted}
          className={`absolute right-3 z-30 grid h-10 w-10 place-items-center rounded-full bg-[var(--c-surface)] text-lg shadow-sm ring-1 ring-black/10 backdrop-blur ${preview ? "top-10" : "top-3"}`}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      )}

      <div className={`relative z-10 flex justify-center gap-1.5 ${preview && !bare ? "pt-12" : "pt-5"}`}>
        {screens.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to step ${i + 1}`}
            disabled={!preview && i > index}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-[var(--c-accent)]" : "w-1.5 bg-current opacity-30"}`}
          />
        ))}
      </div>

      {/* Auto margins centre short screens; long ones (lots of coupons, say) scroll inside previews. */}
      <main className={`flex flex-1 flex-col px-5 py-8 ${preview ? "min-h-0 overflow-y-auto [scrollbar-width:none]" : ""}`}>
        <div key={`${run}-${current.id}`} className={`m-auto w-full animate-screen-in ${wide ? "max-w-4xl" : "max-w-md"}`}>
          {current.type === "intro" && <IntroScreen screen={current} onNext={next} emoji={occasions[card.occasion].emoji} />}
          {current.type === "question" && <QuestionScreen screen={current} onNext={next} />}
          {current.type === "photos" && <PhotosScreen screen={current} onNext={next} wide={wide} />}
          {current.type === "message" && <MessageScreen screen={current} onNext={next} />}
          {current.type === "game" && <GameScreen screen={current} onNext={next} occasion={card.occasion} />}
          {current.type === "quiz" && <QuizScreen screen={current} onNext={next} />}
          {current.type === "scratch" && <ScratchScreen screen={current} onNext={next} />}
          {current.type === "typeit" && <TypeItScreen screen={current} onNext={next} />}
          {current.type === "wheel" && <WheelScreen screen={current} onNext={next} />}
          {current.type === "coupons" && <CouponsScreen screen={current} onNext={next} />}
          {current.type === "reasons" && <ReasonsScreen screen={current} onNext={next} />}
          {current.type === "slider" && <SliderScreen screen={current} onNext={next} />}
          {current.type === "timeline" && <TimelineScreen screen={current} onNext={next} />}
          {current.type === "boxes" && <BoxesScreen screen={current} onNext={next} />}
          {current.type === "finale" && (
            <FinaleScreen
              screen={current}
              onReplay={replay}
              footer={
                !preview && (
                  <Link
                    href={card.template ? `/create?template=${card.template}` : "/create"}
                    className="mt-4 rounded-full bg-[var(--c-surface)] px-5 py-2.5 text-sm font-semibold shadow-sm ring-1 ring-black/10 backdrop-blur"
                  >
                    ✨ Make your own on Sending Vibes
                  </Link>
                )
              }
            />
          )}
        </div>
      </main>

      {!preview && (
        <p className="relative z-10 pb-4 text-center text-xs opacity-60">
          From {card.from} to {card.to} · made with Sending Vibes
        </p>
      )}
    </div>
    </SoundEnabled.Provider>
  );
}

const COARSE = "(pointer: coarse)";

function useIsTouch() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(COARSE);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(COARSE).matches,
    () => null,
  );
}

// A gentle nudge when a phone-first card is opened on a computer, or the other way round.
function DeviceTip({ device }: { device: "phone" | "desktop" }) {
  const touch = useIsTouch();
  const [dismissed, setDismissed] = useState(false);
  const mismatch = touch !== null && (device === "phone" ? !touch : touch);
  if (!mismatch || dismissed) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center p-3">
      <div className="flex items-center gap-3 rounded-full bg-black/75 py-2 pl-4 pr-2 text-sm font-semibold text-white shadow-lg backdrop-blur">
        {device === "phone" ? "📱 Best on a phone, but it works here too" : "💻 Best on a computer, but it works here too"}
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="grid h-6 w-6 place-items-center rounded-full bg-white/20">
          ✕
        </button>
      </div>
    </div>
  );
}
