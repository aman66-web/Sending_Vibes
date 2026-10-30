"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CardData, Screen } from "@/lib/card";
import { CardPlayer } from "@/components/card/CardPlayer";
import { AtPhoneSize } from "./AtPhoneSize";

// One screen played as it'll look on this card, small and not tappable. Only played while
// it's on screen, so a group full of games stays quick.
export function ScreenPreview({ card, screen, className = "w-full rounded-xl shadow-sm" }: { card: CardData; screen: Screen; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // A quick jump can bring two changes at once (in view, then out): the last is where it is now.
    const io = new IntersectionObserver((entries) => setSeen(entries[entries.length - 1].isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const sample = useMemo(() => ({ ...card, ambient: "none" as const, music: "none" as const, screens: [screen] }), [card, screen]);
  return (
    <div ref={box} inert aria-hidden className={`pointer-events-none aspect-[3/4] shrink-0 overflow-hidden border border-line bg-background ${className}`}>
      {seen && (
        <AtPhoneSize>
          <CardPlayer card={sample} preview bare />
        </AtPhoneSize>
      )}
    </div>
  );
}
