"use client";

import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { fmt } from "@/i18n/config";
import type { Dict } from "@/i18n/en";
import type { CardData } from "@/lib/card";
import { NOTE_MAX, REACTIONS, REACTION_EMOJI, sendBackHref, type Reaction } from "@/lib/reply";
import { useSfx } from "./sound";

// What the card's page (c/[id]) gives CardPlayer, so its last screen can offer these.
// Previews, the editor and the shop's demos never have it.
export type Recipient = {
  cardId: string;
  // In the site's language, unlike the card's own words.
  text: Dict["reply"];
  // Whether a thank-you can reach the sender (their card came from an order with an email address).
  canReply: boolean;
};

// Which cards this browser has already said thank you for, so coming back to the card
// shows that rather than asking again.
const KEY = "sv-replied";
const EVENT = "sv-replied";

function sentFor(cardId: string): Reaction | "" {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "{}")[cardId];
    return REACTIONS.includes(value) ? value : "";
  } catch {
    return "";
  }
}

function rememberSent(cardId: string, reaction: Reaction) {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    localStorage.setItem(KEY, JSON.stringify({ ...(saved && typeof saved === "object" ? saved : {}), [cardId]: reaction }));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function onSentChange(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Under the finale: a one-tap thank-you to the sender, with a few words if they like, and
// a big button to send them a card back with both names already filled in.
export function ReplyPanel({ card, cardId, text, canReply }: Recipient & { card: CardData }) {
  const sfx = useSfx();
  const id = useId();
  const name = card.from;
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [justSent, setJustSent] = useState<Reaction | "">("");
  const remembered = useSyncExternalStore<Reaction | "">(onSentChange, () => sentFor(cardId), () => "");
  const sent = justSent || remembered;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reaction || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/cards/${cardId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction, message: note.trim() || undefined }),
      });
      if (res.ok) {
        setJustSent(reaction);
        rememberSent(cardId, reaction);
        sfx("chime");
      } else {
        setError(res.status === 409 ? fmt(text.full, { name }) : res.status === 429 ? text.tooMany : text.failed);
      }
    } catch {
      setError(text.failed);
    } finally {
      setSending(false);
    }
  };

  return (
    // Comes in once the finale has had its moment.
    <div className="mt-2 flex w-full max-w-sm animate-screen-in flex-col items-center gap-4 [animation-delay:900ms]">
      {canReply && (
        <section aria-labelledby={`${id}-title`} className="w-full rounded-2xl bg-[var(--c-surface)] p-5 shadow-[0_14px_30px_-20px_rgba(0,0,0,0.6)] ring-1 ring-current/10 backdrop-blur">
          {sent ? (
            <p role="status" id={`${id}-title`} className="flex flex-col items-center gap-2 font-display text-2xl font-semibold italic leading-snug">
              <span aria-hidden className="animate-pop text-5xl not-italic">
                {REACTION_EMOJI[sent]}
              </span>
              {fmt(text.sent, { name })}
            </p>
          ) : (
            <>
              <h2 id={`${id}-title`} className="font-display text-2xl font-semibold italic leading-tight">
                {fmt(text.title, { name })}
              </h2>
              <p className="mt-1 text-base text-[var(--c-muted)]">{text.hint}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {REACTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={reaction === r}
                    onClick={() => {
                      setReaction(r);
                      setError("");
                      sfx("pop");
                    }}
                    className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-base font-semibold leading-tight ring-2 transition active:scale-95 ${
                      reaction === r ? "bg-[var(--c-accent)] text-[var(--c-accent-text)] ring-[var(--c-accent)]" : "bg-[var(--c-secondary)] text-[var(--c-text)] ring-current/15"
                    }`}
                  >
                    <span aria-hidden className="text-3xl leading-none">
                      {REACTION_EMOJI[r]}
                    </span>
                    {text.reactions[r]}
                  </button>
                ))}
              </div>
              {reaction && (
                <form onSubmit={send} className="mt-5 flex animate-screen-in flex-col gap-2 text-left">
                  <label htmlFor={`${id}-note`} className="text-base font-semibold">
                    {text.noteLabel}
                  </label>
                  <textarea
                    id={`${id}-note`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={NOTE_MAX}
                    rows={3}
                    placeholder={text.notePlaceholder}
                    className="w-full resize-none rounded-xl bg-[var(--c-secondary)] p-3 text-lg leading-snug text-[var(--c-text)] ring-1 ring-current/20 placeholder:text-[var(--c-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]"
                  />
                  <p className="text-sm text-[var(--c-muted)]">{fmt(text.left, { n: NOTE_MAX - note.length })}</p>
                  {error && (
                    <p role="alert" className="text-base font-semibold">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="mt-1 min-h-14 rounded-full bg-[var(--c-accent)] px-6 py-3 text-lg font-semibold text-[var(--c-accent-text)] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.7)] transition active:scale-95 disabled:opacity-60"
                  >
                    {sending ? text.sending : fmt(text.send, { name })}
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      )}
      <Link
        href={sendBackHref(card)}
        className="flex min-h-14 w-full items-center justify-center rounded-full bg-[var(--c-accent)] px-6 py-3 text-center text-lg font-semibold leading-snug text-[var(--c-accent-text)] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.7)] transition hover:brightness-110 active:scale-95"
      >
        {fmt(text.sendBack, { name })}
      </Link>
      <Link href={card.template ? `/create?template=${card.template}` : "/create"} className="inline-flex min-h-11 items-center px-3 text-base font-semibold underline underline-offset-4 opacity-80 hover:opacity-100">
        {text.makeOwn}
      </Link>
    </div>
  );
}
