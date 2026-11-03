"use client";

import { useRef, useState } from "react";

export const NO_LINES = ["Are you sure?", "Really sure?", "Think again", "Please?", "Nice try", "You can't escape", "Just press yes", "Wrong button"];

// Space kept clear around the Yes button, in screen pixels.
const GAP = 12;

type Options = {
  onDodge?: () => void;
  // What the No button says after each dodge, in turn.
  lines?: readonly string[];
  // Yes grows by this much on every dodge, up to `maxGrow` times its size.
  grow?: number;
  maxGrow?: number;
};

// A No button that can never be pressed: any attempt moves it somewhere random
// inside `area`, away from the Yes button. Used by the card and the homepage demo.
export function useRunaway({ onDodge, lines = NO_LINES, grow = 0.12, maxGrow = 1.8 }: Options = {}) {
  const area = useRef<HTMLDivElement>(null);
  const yes = useRef<HTMLButtonElement>(null);
  const no = useRef<HTMLButtonElement>(null);
  const count = useRef(0);
  const [dodges, setDodges] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const pool = lines.length ? lines : NO_LINES;
  const yesScale = (n: number) => Math.min(1 + n * grow, maxGrow);

  const dodge = () => {
    const el = area.current;
    const btn = no.current;
    if (!el || !btn) return;
    const box = el.getBoundingClientRect();
    // Screen pixels per layout pixel, in case the card is shown scaled down
    // (e.g. inside a phone or laptop mockup).
    const scale = box.width / (el.offsetWidth || box.width) || 1;
    const n = count.current;
    // Size the button will have once it shows its next line, which is often much
    // wider than "No".
    const w = Math.max(btn.offsetWidth, widthWith(btn, pool[n % pool.length])) * scale;
    const h = btn.offsetHeight * scale;
    // Where Yes will be once it has grown for this dodge (it grows from its centre).
    let avoid: Rect | null = null;
    const y = yes.current;
    if (y) {
      const r = y.getBoundingClientRect();
      const half = (size: number) => (size * yesScale(n + 1) * scale) / 2 + GAP;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      avoid = {
        left: cx - half(y.offsetWidth),
        right: cx + half(y.offsetWidth),
        top: cy - half(y.offsetHeight),
        bottom: cy + half(y.offsetHeight),
      };
    }
    // Random spots first; the four corners as a fallback, so there is always
    // somewhere clear of Yes when the area has room.
    const maxX = Math.max(box.width - w, 0);
    const maxY = Math.max(box.height - h, 0);
    const spots = [...Array.from({ length: 24 }, () => [Math.random() * maxX, Math.random() * maxY]), [0, maxY], [maxX, maxY], [0, 0], [maxX, 0]];
    let best = { x: 0, y: 0, overlap: Infinity };
    for (const [x, top] of spots) {
      const overlap = avoid
        ? overlapArea(
            {
              left: box.left + x,
              top: box.top + top,
              right: box.left + x + w,
              bottom: box.top + top + h,
            },
            avoid,
          )
        : 0;
      if (overlap < best.overlap) best = { x, y: top, overlap };
      if (overlap === 0) break;
    }
    count.current = n + 1;
    setPos({ x: best.x / scale, y: best.y / scale });
    setDodges(n + 1);
    onDodge?.();
  };

  const noProps = {
    ref: no,
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && dodge(),
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      dodge();
    },
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      dodge();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dodge();
      }
    },
    style: pos ? { left: pos.x, top: pos.y } : undefined,
  };

  return {
    area,
    yes,
    noProps,
    dodges,
    moved: pos !== null,
    yesScale: yesScale(dodges),
    label: (initial: string) => (dodges === 0 ? initial : pool[(dodges - 1) % pool.length]),
  };
}

type Rect = { left: number; top: number; right: number; bottom: number };

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

let ctx: CanvasRenderingContext2D | null | undefined;

// The button's width, in layout pixels, if it said `text` instead: the words
// measured in its own font, plus whatever padding and border it has now.
function widthWith(btn: HTMLElement, text: string) {
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return btn.offsetWidth;
  const cs = getComputedStyle(btn);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const spacing = parseFloat(cs.letterSpacing) || 0;
  const measure = (s: string) => ctx!.measureText(s).width + [...s].length * spacing;
  return Math.ceil(measure(text) + btn.offsetWidth - measure(btn.textContent ?? ""));
}
