"use client";

import { useRef, useState } from "react";

export const NO_LINES = ["Are you sure?", "Really sure?", "Think again", "Please?", "Nice try", "You can't escape", "Just press yes", "Wrong button"];

// A No button that can never be pressed: any attempt moves it somewhere random
// inside `area`, away from the Yes button. Used by the card and the homepage demo.
export function useRunaway(onDodge?: () => void) {
  const area = useRef<HTMLDivElement>(null);
  const yes = useRef<HTMLButtonElement>(null);
  const no = useRef<HTMLButtonElement>(null);
  const [dodges, setDodges] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const dodge = () => {
    const box = area.current?.getBoundingClientRect();
    const noBox = no.current?.getBoundingClientRect();
    const yesBox = yes.current?.getBoundingClientRect();
    if (!box || !noBox) return;
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 20; tries++) {
      x = Math.random() * Math.max(box.width - noBox.width, 0);
      y = Math.random() * Math.max(box.height - noBox.height, 0);
      if (!yesBox) break;
      const left = box.left + x;
      const top = box.top + y;
      const overlaps =
        left < yesBox.right + 12 && left + noBox.width > yesBox.left - 12 && top < yesBox.bottom + 12 && top + noBox.height > yesBox.top - 12;
      if (!overlaps) break;
    }
    // The maths above is in screen pixels; convert to the area's own pixels in
    // case the card is shown scaled down (e.g. inside a phone or laptop mockup).
    const scale = box.width / (area.current?.offsetWidth || box.width) || 1;
    setPos({ x: x / scale, y: y / scale });
    setDodges((d) => d + 1);
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

  return { area, yes, noProps, dodges, moved: pos !== null, label: (initial: string, lines: string[] = NO_LINES) => (dodges === 0 ? initial : lines[(dodges - 1) % lines.length]) };
}
