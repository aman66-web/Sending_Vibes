"use client";

import { useEffect, useRef, useState } from "react";

// A typical phone's width. The card is laid out this wide, as it would be on a real
// phone, then shrunk to fit the preview's frame, so what fits (or doesn't) is true to life.
const PHONE_WIDTH = 390;

export function AtPhoneSize({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = size ? size.width / PHONE_WIDTH : 1;
  return (
    <div ref={box} className="h-full w-full">
      {size && (
        <div className="origin-top-left" style={{ width: PHONE_WIDTH, height: size.height / scale, transform: `scale(${scale})` }}>
          {children}
        </div>
      )}
    </div>
  );
}
