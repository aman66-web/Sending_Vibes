"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CardData } from "@/lib/card";
import { occasions } from "@/lib/templates";
import { themes } from "@/lib/themes";
import { EmojiRain } from "./effects";
import { FinaleScreen, GameScreen, IntroScreen, MessageScreen, PhotosScreen, QuestionScreen } from "./screens";

type Props = {
  card: CardData;
  // Creator preview: keeps empty photo screens visible and jumps to the screen being edited.
  preview?: boolean;
  focusScreenId?: string;
};

export function CardPlayer({ card, preview = false, focusScreenId }: Props) {
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
  const [focused, setFocused] = useState(focusScreenId);
  if (focused !== focusScreenId) {
    setFocused(focusScreenId);
    if (focusScreenId) setIndex(focusIndex());
  }

  const current = screens[Math.min(index, screens.length - 1)];
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
    <div style={style} className={`relative flex w-full flex-col overflow-hidden ${preview ? "h-full" : "min-h-dvh"}`}>
      <EmojiRain effect={card.ambient} />

      <div className="relative z-10 flex justify-center gap-1.5 pt-5">
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

      <main className="flex flex-1 items-center justify-center px-5 py-8">
        <div key={`${run}-${current.id}`} className="w-full max-w-md animate-screen-in">
          {current.type === "intro" && <IntroScreen screen={current} onNext={next} emoji={occasions[card.occasion].emoji} />}
          {current.type === "question" && <QuestionScreen screen={current} onNext={next} />}
          {current.type === "photos" && <PhotosScreen screen={current} onNext={next} />}
          {current.type === "message" && <MessageScreen screen={current} onNext={next} />}
          {current.type === "game" && <GameScreen screen={current} onNext={next} />}
          {current.type === "finale" && (
            <FinaleScreen
              screen={current}
              onReplay={replay}
              footer={
                !preview && (
                  <Link
                    href="/create"
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
  );
}
