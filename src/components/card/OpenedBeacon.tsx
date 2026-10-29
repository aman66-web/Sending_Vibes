"use client";

import { useEffect } from "react";

// On a card's own page (c/[id]): the moment its envelope is tapped open, tells the server
// once, so the person who sent it hears it's been opened (api/cards/[id]/opened). Link
// previews never tap anything, so only a real opening counts. A card without an envelope
// counts its first tap. "?me" on the address skips it, for a sender checking their own card.
export function OpenedBeacon({ cardId, hasEnvelope }: { cardId: string; hasEnvelope: boolean }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("me")) return;
    const onClick = (e: MouseEvent) => {
      if (hasEnvelope && !(e.target instanceof Element && e.target.closest("[data-envelope]"))) return;
      document.removeEventListener("click", onClick, true);
      const url = `/api/cards/${cardId}/opened`;
      // A beacon still goes if they close the page straight away.
      let queued = false;
      try {
        queued = navigator.sendBeacon(url);
      } catch {}
      if (!queued) fetch(url, { method: "POST", keepalive: true }).catch(() => {});
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [cardId, hasEnvelope]);
  return null;
}
