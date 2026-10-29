"use client";

import { catchError, type ErrorInfo } from "next/error";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CardData, Screen, ScreenStyle, Transition } from "@/lib/card";
import { labelText } from "@/lib/labels";
import { FONT_VARS, cropStyle, screenLook } from "@/lib/screen-style";
import { themes } from "@/lib/themes";
import { Backdrop, BurstContext, FxLayer } from "./effects";
import { BoxesScreen, CouponsScreen, ReasonsScreen, SliderScreen, TimelineScreen, WheelScreen } from "./more-screens";
import { HeartMark } from "./ornaments";
import { PersonalProvider } from "./personal";
import { ReplyPanel, type Recipient } from "./ReplyPanel";
import {
  FinaleScreen,
  GameScreen,
  IntroScreen,
  MessageScreen,
  PhotosScreen,
  PrimaryButton,
  QuestionScreen,
  QuizScreen,
  ScratchScreen,
  TypeItScreen,
} from "./screens";
import { playMusic, setMuted, SoundEnabled, unlockAudio, useMuted } from "./sound";
import { LiveContext, NO_TUNE, TuneContext } from "./tune";
import { LabelsContext, useWords } from "./words";

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
  // A preview that grows to fit each screen (filling at least its box) instead of scrolling
  // inside itself: the editor's own on a phone, so a swipe on it always scrolls the page.
  grow?: boolean;
  // Only on the card's own page (c/[id]), for the person it's for: a thank-you and a card back.
  recipient?: Recipient;
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
  grow = false,
  recipient,
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
  // The furthest they've got, so after going back the dots can take them forward again.
  const [furthest, setFurthest] = useState(index);
  // The layer celebrations are drawn in (see FxLayer), set once it's on the page.
  const [fxLayer, setFxLayer] = useState<HTMLDivElement | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const screenBox = useRef<HTMLDivElement>(null);
  // Set when they move to another screen themselves (not when the creator jumps to one).
  const moved = useRef(false);

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
    moved.current = true;
    setIndex(i);
    setStage(0);
    setFurthest((f) => Math.max(f, i));
  };
  const next = () => go(Math.min(index + 1, screens.length - 1));
  const replay = () => {
    go(0);
    setRun((r) => r + 1);
  };

  // Each new screen starts at its top, so after Next at the bottom of a long letter they
  // don't land part-way down the next one; and a screen reader starts reading it. Never in
  // a preview, where the creator's own page would move.
  useEffect(() => {
    if (!moved.current || preview) return;
    moved.current = false;
    const top = (root.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "instant" });
    screenBox.current?.focus({ preventScroll: true });
  }, [index, run, preview]);

  // Fetch the photos while they're still opening the envelope, so each one is there the
  // moment its screen comes up rather than loading in front of them.
  useEffect(() => {
    if (preview) return;
    const urls = new Set(card.screens.flatMap((s) => [...(s.type === "photos" ? s.photos : []), ...(s.style?.images ?? []).map((img) => img.src)]));
    if (!urls.size) return;
    // Held on to while the card is open, so nothing cuts them short.
    const fetched: HTMLImageElement[] = [];
    const timer = setTimeout(() => {
      for (const src of urls) {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        fetched.push(img);
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      fetched.length = 0;
    };
  }, [card.screens, preview]);

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
      ref={root}
      style={style}
      onPointerDownCapture={unlock}
      onPointerUpCapture={unlock}
      onClickCapture={unlock}
      onKeyDownCapture={unlock}
      // The cards are written in English, so they read left to right even on Arabic and Urdu pages.
      dir="ltr"
      lang="en"
      className={`@container relative flex w-full flex-col overflow-hidden font-card ${grow ? "flex-1" : preview ? "h-full" : "min-h-dvh"}`}
    >
      {look.pattern && (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: look.pattern.image, backgroundSize: look.pattern.size }} />
      )}
      {/* One looping effect at a time: on the finale, its own fills the card instead. */}
      {!(current.type === "finale" && current.effect !== "none") && <Backdrop effect={current?.style?.effect ?? card.ambient} />}
      {/* Bursts and the finale's effect, over the whole card but behind its words. */}
      <div ref={setFxLayer} aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" />
      {/* A printed double border, like a real card. */}
      <div aria-hidden className="pointer-events-none absolute inset-2.5 rounded-[14px] border border-current opacity-[0.16]" />
      <div aria-hidden className="pointer-events-none absolute inset-[15px] rounded-[10px] border border-current opacity-[0.08]" />
      {sound && (
        <button
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Turn sound and vibration on" : "Turn sound and vibration off"}
          aria-pressed={!muted}
          className={`absolute right-3 z-30 grid h-12 w-12 place-items-center rounded-full bg-[var(--c-surface)] text-xl shadow-sm ring-1 ring-black/10 backdrop-blur ${preview ? "top-10" : "top-3"}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
            {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
          </svg>
        </button>
      )}

      {/* A proper Back button, as the dots are too small for most fingers. */}
      {!preview && index > 0 && (
        <button
          onClick={() => go(index - 1)}
          className="absolute left-3 top-3 z-30 flex h-11 items-center gap-1 rounded-full bg-[var(--c-surface)] pl-2.5 pr-4 text-base font-semibold shadow-sm ring-1 ring-black/10 backdrop-blur"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {labelText(current.labels, "back")}
        </button>
      )}

      {/* On the card itself the dots sit between Back and the sound button, in line with them.
          Above the screen (z-[15]), so their larger tap areas aren't covered by it. */}
      <div className={`relative z-[15] flex flex-wrap justify-center gap-x-1.5 gap-y-3 ${preview ? (bare ? "pt-5" : "pt-12") : "px-28 pt-8"}`}>
        {screens.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Go to step ${i + 1}`}
            aria-current={i === index ? "step" : undefined}
            disabled={!preview && i > furthest}
            onClick={() => go(i)}
            // Easier to hit than they look.
            className={`relative h-1.5 rounded-full transition-all after:absolute after:-inset-x-1 after:-inset-y-4 after:content-[''] ${i === index ? "w-6 bg-[var(--c-accent)]" : "w-1.5 bg-current opacity-30"}`}
          />
        ))}
      </div>

      {/* Auto margins centre short screens; long ones (lots of coupons, say) scroll inside previews. */}
      <main className={`relative z-10 flex flex-1 flex-col px-5 py-8 ${preview && !grow ? "min-h-0 overflow-y-auto [scrollbar-width:none]" : ""}`}>
        <LiveContext.Provider value={!preview}>
        {/* Their names and photos, for the games to use (see personal.tsx). */}
        <PersonalProvider card={card}>
        <LabelsContext.Provider value={current.labels}>
        <BurstContext.Provider value={current.style?.burst}>
        <FxLayer.Provider value={fxLayer}>
        <TuneContext.Provider value={current.style?.tune ?? NO_TUNE}>
        <div
          key={`${run}-${current.id}-${stage}-${editing}-${JSON.stringify(current.style?.tune ?? "")}`}
          ref={screenBox}
          tabIndex={-1}
          className={`m-auto w-full outline-none ${ENTRANCE[current.style?.transition ?? "rise"]} ${wide ? "max-w-4xl" : "max-w-md"}`}
        >
          <ScreenGuard screen={current} last={index >= screens.length - 1} onSkip={index >= screens.length - 1 ? replay : next}>
          {current.type === "intro" && <IntroScreen screen={current} onNext={next} stage={stage} to={card.to} from={card.from} envelope={look.envelope} occasion={card.occasion} editing={editing} />}
          {current.type === "question" && <QuestionScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "photos" && <PhotosScreen screen={current} onNext={next} stage={stage} wide={wide} />}
          {current.type === "message" && <MessageScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "game" && <GameScreen screen={current} onNext={next} stage={stage} occasion={card.occasion} />}
          {current.type === "quiz" && <QuizScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "scratch" && <ScratchScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "typeit" && <TypeItScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "wheel" && <WheelScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "coupons" && <CouponsScreen screen={current} onNext={next} stage={stage} from={card.from} />}
          {current.type === "reasons" && <ReasonsScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "slider" && <SliderScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "timeline" && <TimelineScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "boxes" && <BoxesScreen screen={current} onNext={next} stage={stage} />}
          {current.type === "finale" && (
            <FinaleScreen
              screen={current}
              onReplay={replay}
              from={card.from}
              footer={
                // The real card, for the person it's for: tell the sender what they thought, or
                // send one back (ReplyPanel.tsx). Demos keep the plain link; previews show nothing.
                recipient && !preview ? (
                  <ReplyPanel card={card} {...recipient} />
                ) : !preview && (
                  <Link
                    href={card.template ? `/create?template=${card.template}` : "/create"}
                    className="mt-4 inline-flex min-h-12 items-center rounded-full bg-[var(--c-surface)] px-6 py-3 text-base font-semibold shadow-sm ring-1 ring-black/10 backdrop-blur"
                  >
                    Make your own on Envelette
                  </Link>
                )
              }
            />
          )}
          </ScreenGuard>
        </div>
        </TuneContext.Provider>
        </FxLayer.Provider>
        </BurstContext.Provider>
        </LabelsContext.Provider>
        </PersonalProvider>
        </LiveContext.Provider>
      </main>

      {current?.style && <Decorations key={`${run}-${current.id}`} style={current.style} editing={editing} />}

      {!preview && (
        <p className="relative z-10 px-6 pb-4 text-center text-sm opacity-75">
          From {card.from} to {card.to} · made with Envelette
        </p>
      )}
    </div>
    </SoundEnabled.Provider>
  );
}

// One screen that won't show (an old phone tripping over a game, say) shouldn't blank the
// whole card: it says sorry and offers to carry on with the rest of it.
const ScreenGuard = catchError(function ScreenTrouble(
  { screen, last, onSkip }: { screen: Screen; last: boolean; onSkip: () => void },
  { error, reset }: ErrorInfo,
) {
  const { text } = useWords();
  // The screen as it was when it broke. If the creator changes it, try it again.
  const [broken] = useState(screen);
  useEffect(() => {
    console.error("A card screen failed to show", error);
  }, [error]);
  useEffect(() => {
    if (screen !== broken) reset();
  }, [screen, broken, reset]);
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <HeartMark className="h-16 w-16 text-[var(--c-accent)]" />
      <p className="font-display text-2xl font-semibold leading-snug">{text("screenBroken")}</p>
      <PrimaryButton onClick={onSkip}>{last ? text("playAgain") : text("screenSkip")}</PrimaryButton>
    </div>
  );
});

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
