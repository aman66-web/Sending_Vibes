"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { removeFromBasket } from "@/lib/basket";
import { rememberMine } from "@/lib/mine";

const noop = () => () => {};
// Phones (and some computers) have their own share menu, which already lists WhatsApp,
// Messages, email and whatever else the person uses.
const canShare = () => typeof navigator.share === "function";

// A paid card's link, sent with one big button. It opens the phone's own share menu; where
// there isn't one, the button shows WhatsApp, text, email and copy buttons instead.
export function ShareLink({ url, to, from, compact = false }: { url: string; to: string; from: string; compact?: boolean }) {
  const { t } = useI18n();
  const c = t.create;
  const s = t.basket.share;
  const native = useSyncExternalStore(noop, canShare, () => false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const title = fmt(s.title, { from });
  const message = fmt(s.message, { to });

  const send = async () => {
    if (!native) return setOpen((was) => !was);
    try {
      await navigator.share({ title, text: message, url });
    } catch (e) {
      // Closing the menu is fine; if sharing fails any other way, offer the buttons.
      if (!(e instanceof DOMException && e.name === "AbortError")) setOpen(true);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const option = "btn min-h-12 px-4 py-2.5";
  return (
    <div className="mt-4 space-y-3">
      <button type="button" onClick={send} aria-expanded={native ? undefined : open} className={`btn btn-red ${compact ? "px-6 py-3" : "w-full py-4 text-lg"}`}>
        <span aria-hidden>💌</span> {fmt(s.send, { name: to })}
      </button>
      {open && (
        <div className="grid gap-2 sm:grid-cols-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`} target="_blank" rel="noreferrer" className={`${option} bg-[#25D366] text-white`}>
            {c.whatsapp}
          </a>
          {/* A plain text message, for anyone who doesn't use WhatsApp. "?&body=" works on iPhones and Android. */}
          <a href={`sms:?&body=${encodeURIComponent(`${message} ${url}`)}`} className={`${option} btn-paper`}>
            {c.textMessage}
          </a>
          <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`} className={`${option} btn-paper`}>
            {s.byEmail}
          </a>
          <button type="button" onClick={copy} className={`${option} btn-paper`}>
            {copied ? c.copied : s.copy}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-6">
        {/* ?me=1 says it's the buyer having a look, not the person it's for opening it. */}
        <a href={`${url}?me=1`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold underline decoration-hot decoration-2 underline-offset-4">
          ▶ {s.watch}
        </a>
        <details className="min-w-0 open:basis-full">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ink/70 underline underline-offset-4">{s.showLink}</summary>
          <div className="mb-1 flex items-center gap-2 rounded-2xl border-2 border-ink/15 bg-paper p-1.5 ps-4">
            <span className="min-w-0 flex-1 select-all break-all text-sm" dir="ltr">
              {url}
            </span>
            <button type="button" onClick={copy} className="btn btn-ink shrink-0 px-4 py-2 text-sm">
              {copied ? c.copied : c.copy}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

// Takes the cards that were just bought out of this browser's basket, and notes them as
// this buyer's own, so opening them here isn't reported to them as the card being opened.
export function ClearBasket({ ids }: { ids: string[] }) {
  useEffect(() => {
    removeFromBasket(ids);
    rememberMine(ids);
  }, [ids]);
  return null;
}
