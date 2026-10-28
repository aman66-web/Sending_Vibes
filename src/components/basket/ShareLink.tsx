"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { removeFromBasket } from "@/lib/basket";

// A paid card's link, with copy and WhatsApp buttons.
export function ShareLink({ url }: { url: string }) {
  const c = useI18n().t.create;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/15 bg-paper p-1.5 ps-4">
        <span className="flex-1 truncate text-sm" dir="ltr">
          {url}
        </span>
        <button onClick={copy} className="btn btn-ink shrink-0 px-4 py-2 text-sm">
          {copied ? c.copied : c.copy}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(fmt(c.whatsappMessage, { url }))}`} target="_blank" rel="noreferrer" className="btn rounded-full bg-[#25D366] px-4 py-2 text-sm text-white">
          {c.whatsapp}
        </a>
        {/* A plain text message, for anyone who doesn't use WhatsApp. "?&body=" works on iPhones and Android. */}
        <a href={`sms:?&body=${encodeURIComponent(fmt(c.whatsappMessage, { url }))}`} className="btn btn-paper px-4 py-2 text-sm">
          {c.textMessage}
        </a>
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-paper px-4 py-2 text-sm">
          {c.openCard}
        </a>
      </div>
    </div>
  );
}

// Takes the cards that were just bought out of this browser's basket.
export function ClearBasket({ ids }: { ids: string[] }) {
  useEffect(() => removeFromBasket(ids), [ids]);
  return null;
}
