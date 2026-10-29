"use client";

import { useEffect, useRef } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardData } from "@/lib/card";
import { NewLookButton } from "./NewLook";

// Straight after a card is made: it plays filling the screen, just as the person getting it
// will see it (tapping the envelope opens it, nothing is edited), and underneath, "Happy
// with it?": finish it, change something in the editor, or try another look.

type Props = {
  card: CardData;
  // On to the basket.
  onFinish: () => void;
  // Into the editor.
  onEdit: () => void;
  // A new look from "Try another look"; the caller keeps the old one for Undo.
  onNewLook: (card: CardData) => void;
  // Puts the last look back, once they've tried another.
  onUndo?: () => void;
  // Their favourite colour, kept by every new look (see NewLook.tsx).
  favourite?: string | null;
};

const FOCUSABLE = "button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])";

export function FirstLook({ card, onFinish, onEdit, onNewLook, onUndo, favourite }: Props) {
  const { t } = useI18n();
  const x = t.custom;
  const box = useRef<HTMLDivElement>(null);
  const leave = useRef(onEdit);
  useEffect(() => {
    leave.current = onEdit;
  });
  useEffect(() => {
    // It covers the page, which mustn't scroll behind it.
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = "hidden";
    box.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return leave.current();
      // Tab stays within it.
      const all = [...(box.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((el) => !el.matches(":disabled"));
      if (e.key !== "Tab" || !all.length) return;
      const first = all[0];
      const last = all[all.length - 1];
      const inside = box.current?.contains(document.activeElement) && document.activeElement !== box.current;
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = was;
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  const second = "min-h-12 flex-1 basis-0 rounded-full border-2 border-foreground/80 bg-panel px-3 py-2.5 font-semibold leading-tight";
  return (
    <div
      ref={box}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-look-title"
      aria-describedby="first-look-line"
      className="fixed inset-0 z-[70] flex flex-col bg-background outline-none"
    >
      <div className="relative min-h-0 flex-1">
        <CardPlayer card={card} preview sound />
        {/* Over the card's own top margin, clear of its sound button. */}
        <p id="first-look-line" className="pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center px-16">
          <span className="rounded-full bg-black/70 px-3 py-1 text-center text-sm font-semibold text-white">{fmt(x.firstLookLine, { name: card.to })}</span>
        </p>
      </div>
      <div className="relative z-10 border-t-2 border-foreground/80 bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.15)]">
        <div className="mx-auto max-w-2xl">
          <div className="relative flex min-h-11 items-center justify-center">
            <h2 id="first-look-title" className="font-brand text-2xl font-bold sm:text-3xl">
              {x.happyTitle}
            </h2>
            {onUndo && (
              <button type="button" onClick={onUndo} className="absolute end-0 min-h-11 px-2 text-sm font-semibold underline underline-offset-4">
                ↶ {x.undo}
              </button>
            )}
          </div>
          {/* On a phone, the yes on its own row and the other two side by side under it. */}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onFinish}
              className="min-h-13 basis-full rounded-full bg-brand px-5 py-3 font-brand text-lg font-semibold text-on-brand shadow-lg sm:flex-[1.4] sm:basis-0"
            >
              {x.happyYes}
            </button>
            <button type="button" onClick={onEdit} className={second}>
              {x.happyChange}
            </button>
            <NewLookButton card={card} onChange={onNewLook} favourite={favourite} className={second} inRow />
          </div>
        </div>
      </div>
    </div>
  );
}
