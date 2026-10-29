"use client";

import { useState } from "react";

// Copies a few words to paste into a card, and says so for a moment. The button's name
// stays the same; "Copied" is announced from a status line beside it, which is on the page
// from the start so screen readers are already listening when its words change. (Some,
// including VoiceOver on iPhones, don't hear live text inside a button.)
export function CopyButton({ text, label, done, aria, className = "" }: { text: string; label: string; done: string; aria: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <>
      <button type="button" onClick={copy} aria-label={aria} className={`btn btn-paper min-h-11 px-5 py-2 text-base ${className}`}>
        {copied ? done : label}
      </button>
      <span role="status" className="sr-only">
        {copied ? done : ""}
      </span>
    </>
  );
}
