"use client";

import { useMemo } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardData, Occasion, Screen } from "@/lib/card";
import { getLook, lookStyle } from "@/lib/looks";
import { defaultTemplate, occasions } from "@/lib/templates";
import { FRONT } from "@/components/catalog/ProductThumb";
import { ScreenPreview } from "./ScreenPreview";

// A small live preview of the card's envelope as the questions are answered: their name,
// the occasion and the look they picked. Also shown while the card is being made.

type Props = {
  to: string;
  from: string;
  occasion: Occasion | "";
  look: string;
  className?: string;
};

// Give it a width with className; it keeps the card's 3:4 shape. It reads well from a
// thumbnail (about 72px wide) to a column (about 260px).
export function VibePreview({ to, from, occasion, look, className = "" }: Props) {
  const { t } = useI18n();
  const name = to.trim();

  // One envelope screen, rebuilt only when an answer it shows changes. It's played inert
  // and silent, with no background effect (ScreenPreview), so it stays light.
  const card = useMemo<CardData>(() => {
    const chosen = getLook(look);
    // The occasion's own emoji and the look's stickers, two at most.
    const stickers = [...new Set([occasion ? occasions[occasion].emoji : "", ...(chosen?.stickers ?? [])].filter(Boolean))].slice(0, 2);
    const screen: Screen = {
      id: "vibe",
      type: "intro",
      title: name ? `For ${name}` : "For you",
      subtitle: "",
      button: "Open",
      style: {
        ...(chosen ? lookStyle(chosen) : {}),
        // The greeting in the look's heading font, in the space between "You've got mail"
        // and the envelope (it sits there on a 3:4 card), and the stickers on its corners.
        texts: [{ text: occasion ? FRONT[occasion] : "Just for you", x: 50, y: 33.5, size: 7, font: chosen?.heading }],
        stickers: stickers.map((emoji, i) => (i === 0 ? { emoji, x: 80, y: 49, size: 10, rotate: 8 } : { emoji, x: 14, y: 25, size: 9, rotate: -12 })),
      },
    };
    return {
      occasion: occasion || "friendship",
      // With no look picked yet, the colours the occasion's cards usually have.
      theme: chosen?.theme ?? (occasion ? defaultTemplate(occasion).theme : "ivory"),
      to: name,
      from: from.trim(),
      ambient: "none",
      music: "none",
      screens: [screen],
    };
  }, [name, from, occasion, look]);

  return (
    <div role="img" aria-label={name ? fmt(t.looks.preview, { name }) : t.looks.previewNoName} className={`@container ${className}`}>
      <ScreenPreview card={card} screen={card.screens[0]} className="w-full rounded-[7cqw] shadow-md" />
    </div>
  );
}
