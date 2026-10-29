"use client";

import { useEffect, useRef } from "react";
import { openChat } from "@/components/open-chat";
import { useI18n } from "@/i18n/client";
import type { Dict } from "@/i18n/en";

// Something that went wrong, shown where the person is looking: brought into view, focused
// and read out, with a big way forward (try again, go and fix it, or ask us).

type Props = {
  message: string;
  onRetry?: () => void;
  // A way to fix it, such as going to the screen that has something missing.
  fix?: { label: string; onClick: () => void };
  onClose?: () => void;
  // Smaller, for the bar along the bottom of a phone.
  compact?: boolean;
};

export function ErrorNotice({ message, onRetry, fix, onClose, compact = false }: Props) {
  const { t } = useI18n();
  const c = t.create;
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Once the page has settled, so a box that's just appeared beside it can't take the focus back.
    const frame = requestAnimationFrame(() => {
      const el = box.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      const { top, bottom } = el.getBoundingClientRect();
      if (top < 0 || bottom > window.innerHeight) {
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [message]);
  const size = compact ? "min-h-11 px-4 text-base" : "min-h-12 px-5 text-lg";
  const solid = `rounded-full bg-red-700 font-bold text-white ${size}`;
  // In the bar on a phone there's only room for one way forward; help is always one of them.
  const help = !compact || (!fix && !onRetry);
  return (
    <div
      ref={box}
      role="alert"
      tabIndex={-1}
      className={`relative rounded-2xl bg-red-50 text-red-900 outline-none ring-2 ring-red-300 dark:bg-red-950 dark:text-red-50 dark:ring-red-800 ${compact ? "p-3" : "p-4"}`}
    >
      <p className={`font-semibold leading-snug ${compact ? "text-base" : "text-lg"} ${onClose ? "pe-10" : ""}`}>
        <span aria-hidden>⚠️ </span>
        {message}
      </p>
      <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-3"}`}>
        {fix && (
          <button type="button" onClick={fix.onClick} className={solid}>
            ✎ {fix.label}
          </button>
        )}
        {onRetry && (
          <button type="button" onClick={onRetry} className={solid}>
            ↻ {c.tryAgain}
          </button>
        )}
        {help && (
          <button type="button" onClick={openChat} className={`rounded-full border-2 border-red-300 font-semibold dark:border-red-800 ${size}`}>
            💬 {c.askHelp}
          </button>
        )}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label={c.dismiss} className="absolute end-1 top-1 grid h-11 w-11 place-items-center rounded-full text-lg">
          ✕
        </button>
      )}
    </div>
  );
}

// Whether pressing the same button again could work: not when their cards are used up, it's
// switched off, or what they asked for has to change first.
export function canRetry(message: string, t: Dict) {
  const e = t.custom.errors;
  if ([e.off, e.signIn, e.describe, e.refused, e.tooMany, t.account.signInFailed, t.create.needNames].includes(message)) return false;
  // These have numbers filled in, like how many cards they've made.
  return !Object.entries(e).some(([key, text]) => key.startsWith("limit") && typeof text === "string" && filled(text).test(message));
}

const literal = (part: string) => part.replace(/[.*+?^$|()[\]{}\\]/g, "\\$&");
const filled = (text: string) => new RegExp("^" + text.split(/\{\w+\}/).map(literal).join(".+?") + "$", "s");
