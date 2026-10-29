"use client";

import { useEffect, useRef, useState } from "react";

// A typical phone's width. The card is laid out this wide, as it would be on a real
// phone, then shrunk to fit the preview's frame, so what fits (or doesn't) is true to life.
const PHONE_WIDTH = 390;
// The same for a laptop's browser window, for seeing the computer look on a phone.
const COMPUTER_WIDTH = 1280;

export function AtPhoneSize({ children }: { children: React.ReactNode }) {
  return <AtWidth width={PHONE_WIDTH}>{children}</AtWidth>;
}

export function AtComputerSize({ children }: { children: React.ReactNode }) {
  return <AtWidth width={COMPUTER_WIDTH}>{children}</AtWidth>;
}

function AtWidth({ width, children }: { width: number; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = size ? size.width / width : 1;
  return (
    <div ref={box} className="h-full w-full">
      {size && (
        <div className="origin-top-left" style={{ width, height: size.height / scale, transform: `scale(${scale})` }}>
          {children}
        </div>
      )}
    </div>
  );
}
