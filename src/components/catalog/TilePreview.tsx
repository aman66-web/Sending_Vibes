"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { AutoPlay } from "@/components/landing/AutoPlay";
import { buildTemplateDemo, templatesBySlug } from "@/lib/catalog";
import { ProductThumb } from "./ProductThumb";
import { useSheetOpen } from "./PreviewSheet";

// The card is laid out at this phone-ish size, then scaled to fit the tile.
const WIDTH = 340;
const HEIGHT = WIDTH * (5 / 4);

// A design's thumbnail that comes alive: while it's in the middle of the screen,
// the real card plays itself inside it. Elsewhere it's the still artwork, so a
// page full of designs only ever runs a row or so at a time.
export function TilePreview({ slug }: { slug: string }) {
  const template = templatesBySlug[slug];
  const box = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [scale, setScale] = useState(1);
  // Not while a preview covers the page: nobody can see it, and the preview's own card needs the phone.
  const covered = useSheetOpen();
  const playing = live && !covered;
  const card = useMemo(() => (playing ? buildTemplateDemo(template) : null), [playing, template]);

  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Only the band through the middle of the screen counts, and only after a short
    // pause, so scrolling quickly past doesn't start (and stop) dozens of cards.
    const io = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.isIntersecting) timer = setTimeout(() => setLive(true), 250);
        else setLive(false);
      },
      { rootMargin: "-38% 0px -38% 0px" },
    );
    io.observe(el);
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / WIDTH));
    ro.observe(el);
    return () => {
      clearTimeout(timer);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={box} className="relative">
      <ProductThumb template={template} />
      {card && (
        // Decorative copy of the card: the tile itself is the link, so nothing inside takes focus,
        // and the pretend taps that play it stop here instead of reaching the link and opening the page.
        <div
          aria-hidden
          inert
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="pointer-events-none absolute inset-0 animate-[fade-in_0.4s_ease-out] overflow-hidden"
        >
          <div className="origin-top-left" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}>
            <AutoPlay startAfter={500}>
              <CardPlayer card={card} preview bare />
            </AutoPlay>
          </div>
        </div>
      )}
    </div>
  );
}
