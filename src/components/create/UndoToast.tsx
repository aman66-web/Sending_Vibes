"use client";

import { useEffect, useRef, useState } from "react";

// A note that something has just gone, with a big Undo, for a few seconds. It stays while
// someone's on its buttons with the keyboard, so it can't vanish from under them.
export function UndoToast({ text, undo, closeLabel, onUndo, onClose }: { text: string; undo: string; closeLabel: string; onUndo: () => void; onClose: () => void }) {
  const [held, setHeld] = useState(false);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (held) return;
    const timer = setTimeout(() => close.current(), 8000);
    return () => clearTimeout(timer);
  }, [held]);
  return (
    // Above the bar along the bottom of a phone; bottom left on a computer, clear of the help chat.
    <div
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
      className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md animate-screen-in items-center gap-2 rounded-full bg-foreground py-2 pe-2 ps-5 text-background shadow-2xl lg:inset-x-auto lg:bottom-6 lg:start-6 lg:mx-0"
    >
      <p role="status" className="min-w-0 flex-1 font-semibold leading-tight">
        <span aria-hidden>🗑 </span>
        {text}
      </p>
      <button type="button" onClick={onUndo} className="min-h-11 shrink-0 rounded-full bg-background px-5 font-bold text-foreground">
        {undo}
      </button>
      <button type="button" onClick={onClose} aria-label={closeLabel} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg">
        ✕
      </button>
    </div>
  );
}
