"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CardData, ScreenStyle, Transition } from "@/lib/card";
import { FONT_VARS, cropStyle, screenLook } from "@/lib/screen-style";
import { themes } from "@/lib/themes";
import { Backdrop, BurstContext } from "./effects";
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
import { NO_TUNE, TuneContext } from "./tune";
import { LabelsContext } from "./words";

// A faint paper texture under every card.
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E\")";

// How each screen comes in (style.transition); "rise" is the usual.
const ENTRANCE: Record<Transition, string> = {
  rise: "animate-screen-in",
  fade: "animate-screen-fade",
  slide: "animate-screen-slide",
  zoom: "animate-screen-zoom",
  flip: "animate-screen-flip",
  spin: "animate-screen-spin",
  bounce: "animate-screen-bounce",
  drop: "animate-screen-drop",
  blur: "animate-screen-blur",
};

type Props = {
  card: CardData;
  // Creator preview: keeps empty photo screens visible and jumps to the screen being edited.
  preview?: boolean;
  focusScreenId?: string;
  // Changing this jumps back to focusScreenId even if it hasn't changed.
  focusNonce?: number;
  // Part-way through that screen: the envelope opened, after "yes" (see lib/stages.ts).
  focusStage?: number;
  // Sound effects and music. Off in previews unless asked for.
  sound?: boolean;
  // Thumbnail mode: no room left for a phone notch.
  bare?: boolean;
  // Tells the creator which screen is showing, so a typed change can be about that one.
  onScreenChange?: (id: string) => void;
  // The creator's edit mode. Switching in or out starts the screen afresh, so its words
  // are the card's own (not, say, a runaway No button's "Are you sure?").
  editing?: boolean;
};

export function CardPlayer({
  card,
  preview = false,
  focusScreenId,
  focusNonce = 0,
  focusStage = 0,
  sound = !preview,
  bare = false,
  onScreenChange,
  editing = false,
}: Props) {
  const screens = useMemo(
    () => card.screens.filter((s) => preview || s.type !== "photos" || s.photos.length > 0),
    [card.screens, preview],
  );
  const focusIndex = () => Math.max(screens.findIndex((s) => s.id === focusScreenId), 0);
  const [index, setIndex] = useState(focusIndex);
  const [stage, setStage] = useState(focusScreenId ? focusStage : 0);
  // Bumped on replay so every screen remounts with fresh state.
  const [run, setRun] = useState(0);

  // Jump to whichever screen the creator is editing.
  const focusTarget = `${focusScreenId ?? ""}:${focusNonce}`;
  const [focused, setFocused] = useState(focusTarget);
  if (focused !== focusTarget) {
    setFocused(focusTarget);
    if (focusScreenId) {
      setIndex(focusIndex());
      setStage(focusStage);
      // Start that screen fresh (e.g. the question again, not "after yes").
      setRun((r) => r + 1);
    }
  }

  const current = screens[Math.min(index, screens.length - 1)];
  const currentId = current?.id;
  // Each screen can have its own colours, fonts and stickers on top of the card's theme.
  const look = screenLook(themes[card.theme], current?.style);
  const theme = look.theme;
  useEffect(() => {
    if (currentId) onScreenChange?.(currentId);
  }, [currentId, onScreenChange]);
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
  const go = (i: number) => {
    setIndex(i);
    setStage(0);
  };
  const next = () => go(Math.min(index + 1, screens.length - 1));
  const replay = () => {
    go(0);
    setRun((r) => r + 1);
  };

  const style = {
    background: `${PAPER_GRAIN}, ${theme.background}`,
    color: theme.text,
    "--c-text": theme.text,
    "--c-muted": theme.muted,
    "--c-accent": theme.accent,
    "--c-accent-text": theme.accentText,
    "--c-surface": theme.surface,
    "--c-secondary": theme.secondary,
    ...look.css,
  } as React.CSSProperties;

  return (
    <SoundEnabled.Provider value={sound}>
    <div
      style={style}
      onPointerDownCapture={unlock}
      onPointerUpCapture={unlock}
      onClickCapture={unlock}
      onKeyDownCapture={unlock}
      // The cards are written in English, so they read left to right even on Arabic and Urdu pages.
      dir="ltr"
      lang="en"
      className={`@container relative flex w-full flex-col overflow-hidden font-card ${preview ? "h-full" : "min-h-dvh"}`}
    >
      {look.pattern && (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: look.pattern.image, backgroundSize: look.pattern.size }} />
      )}
      <Backdrop effect={current?.style?.effect ?? card.ambient} />
      {/* A printed double border, like a real card. */}
      <div aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[14px] border border-current opacity-[0.16]" />
      <div aria-hidden className="pointer-events-none absolute inset-[15px] rounded-[10px] border border-current opacity-[0.08]" />
      {sound && (
        <button
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          aria-pressed={!muted}
          className={`absolute right-3 z-30 grid h-10 w-10 place-items-center rounded-full bg-[var(--c-surface)] text-lg shadow-sm ring-1 ring-black/10 backdrop-blur ${preview ? "top-10" : "top-3"}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
            {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
          </svg>
        </button>
      )}

      <div className={`relative z-10 flex justify-center gap-1.5 ${preview && !bare ? "pt-12" : "pt-5"}`}>
        {screens.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to step ${i + 1}`}
            disabled={!preview && i > index}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-[var(--c-accent)]" : "w-1.5 bg-current opacity-30"}`}
          />
        ))}
      </div>

      {/* Auto margins centre short screens; long ones (lots of coupons, say) scroll inside previews. */}
      <main className={`flex flex-1 flex-col px-5 py-8 ${preview ? "min-h-0 overflow-y-auto [scrollbar-width:none]" : ""}`}>
        <LabelsContext.Provider value={current.labels}>
        <BurstContext.Provider value={current.style?.burst}>
        <TuneContext.Provider value={current.style?.tune ?? NO_TUNE}>
        <div key={`${run}-${current.id}-${stage}-${editing}-${JSON.stringify(current.style?.tune ?? "")}`} className={`m-auto w-full ${ENTRANCE[current.style?.transition ?? "rise"]} ${wide ? "max-w-4xl" : "max-w-md"}`}>
          {current.type === "intro" && <IntroScreen screen={current} onNext={next} stage={stage} to={card.to} from={card.from} envelope={look.envelope} />}
          {current.type === "question" && <QuestionScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "photos" && <PhotosScreen screen={current} onNext={next} stage={stage} wide={wide} />}
          {current.type === "message" && <MessageScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "game" && <GameScreen screen={current} onNext={next} stage={stage} occasion={card.occasion} />}
          {current.type === "quiz" && <QuizScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "scratch" && <ScratchScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "typeit" && <TypeItScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "wheel" && <WheelScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "coupons" && <CouponsScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "reasons" && <ReasonsScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "slider" && <SliderScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "timeline" && <TimelineScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "boxes" && <BoxesScreen screen={current} onNext={next} stage={stage} />}
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
                    Make your own on Envelette
                  </Link>
                )
              }
            />
          )}
        </div>
        </TuneContext.Provider>
        </BurstContext.Provider>
        </LabelsContext.Provider>
      </main>

      {current?.style && <Decorations key={`${run}-${current.id}`} style={current.style} editing={editing} />}

      {!preview && (
        <p className="relative z-10 pb-4 text-center text-xs opacity-60">
          From {card.from} to {card.to} · made with Envelette
        </p>
      )}
    </div>
    </SoundEnabled.Provider>
  );
}

// What's placed on top of a screen: emoji stickers, text boxes and photos, each at a
// spot given as a share of the card's width and height. Sizes are a share of the card's
// shorter side, so they look the same on a phone and a computer. They let taps through
// to the card underneath, except while editing, when the editor can pick them out
// (data-deco) to change or drag them.
function Decorations({ style, editing }: { style: ScreenStyle; editing: boolean }) {
  const { stickers = [], texts = [], images = [] } = style;
  if (!stickers.length && !texts.length && !images.length) return null;
  const place = (x: number, y: number, rotate = 0) => ({ left: `${x}%`, top: `${y}%`, rotate: `${rotate}deg`, translate: "-50% -50%" });
  const item = `absolute ${editing ? "pointer-events-auto" : ""}`;
  return (
    <div aria-hidden data-deco-layer className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {images.map((img, i) => (
        <span key={`i${i}`} data-deco={`image:${i}`} className={`${item} animate-pop`} style={{ ...place(img.x, img.y, img.rotate), width: `${img.size}cqmin` }}>
          <span className={img.frame === "round" || img.frame === "plain" ? "block" : "block bg-white p-[5%] pb-[16%] shadow-xl"}>
            <span
              className={`block overflow-hidden ${img.frame === "round" ? "aspect-square rounded-full shadow-lg ring-4 ring-white" : img.frame === "plain" ? "rounded-lg shadow-lg" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- their own photos, already resized on upload */}
              <img src={img.src} alt="" draggable={false} className={`block w-full ${img.frame === "round" ? "h-full object-cover" : ""}`} style={cropStyle(img.crop)} />
            </span>
          </span>
        </span>
      ))}
      {stickers.map((s, i) => (
        <span
          key={`s${i}`}
          data-deco={`sticker:${i}`}
          className={`${item} animate-pop leading-none`}
          style={{ ...place(s.x, s.y, s.rotate), fontSize: `${s.size}cqmin`, animationDelay: `${i * 80}ms` }}
        >
          <span className={`block ${s.motion && s.motion !== "none" ? `sticker-${s.motion}` : ""}`} style={{ animationDelay: `${-i * 0.7}s` }}>
            {s.emoji}
          </span>
        </span>
      ))}
      {texts.map((t, i) => (
        <span
          key={`t${i}`}
          data-deco={`text:${i}`}
          className={`${item} max-w-[92%] animate-screen-in whitespace-pre-wrap text-center font-semibold leading-tight`}
          style={{
            ...place(t.x, t.y, t.rotate),
            fontSize: `${t.size}cqmin`,
            color: t.color ?? "var(--c-text)",
            fontFamily: t.font ? `var(${FONT_VARS[t.font]})` : "var(--card-display, var(--font-display-face))",
            width: "max-content",
          }}
        >
          {t.text}
        </span>
      ))}
    </div>
  );
}
