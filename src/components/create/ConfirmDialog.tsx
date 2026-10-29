"use client";

import { useEffect, useId, useRef, useState } from "react";

// A big, plain question before something that can't be undone. Keeping things is the
// first button and the one already picked; Escape or a tap outside keeps them too.
type Props = { title: string; body: string; keep: string; yes: string; onKeep: () => void; onYes: () => void };

export function ConfirmDialog({ title, body, keep, yes, onKeep, onYes }: Props) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Where the focus was, to go back to once it's closed.
  const [before] = useState(() => document.activeElement as HTMLElement | null);
  const keepNow = useRef(onKeep);
  useEffect(() => {
    keepNow.current = onKeep;
  });
  useEffect(() => {
    const node = panel.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return keepNow.current();
      // Tab stays within the question.
      const buttons = panel.current?.querySelectorAll<HTMLButtonElement>("button");
      if (e.key !== "Tab" || !buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      // Only once it's really gone, and only if what had the focus is still there.
      requestAnimationFrame(() => !node?.isConnected && before?.isConnected && before.focus({ preventScroll: true }));
    };
  }, [before]);
  // A second tap of a double-tap lands on whatever has just opened under the finger; it
  // mustn't answer the question.
  const once = (act: () => void) => (e: React.MouseEvent) => e.detail < 2 && act();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`} className="fixed inset-0 z-[70] overflow-y-auto bg-black/50" onClick={once(onKeep)}>
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <div ref={panel} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border-2 border-foreground bg-background p-6 shadow-2xl">
          <h2 id={`${id}-title`} className="font-brand text-3xl font-bold leading-tight">
            {title}
          </h2>
          <p id={`${id}-body`} className="mt-3 text-lg leading-relaxed opacity-80">
            {body}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" autoFocus onClick={once(onKeep)} className="min-h-14 rounded-full bg-brand px-6 font-brand text-xl font-semibold text-on-brand shadow-lg">
              {keep}
            </button>
            <button type="button" onClick={once(onYes)} className="min-h-14 rounded-full border-2 border-red-600 px-6 text-lg font-semibold text-red-700 dark:border-red-400 dark:text-red-300">
              {yes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
