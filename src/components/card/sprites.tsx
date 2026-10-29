// Drawn game pieces, coloured from the card's palette (CSS variables), used in
// place of emoji so the games look as finished as the rest of the card.

import { useId } from "react";
import type { Occasion } from "@/lib/card";

type Props = { className?: string; style?: React.CSSProperties };

export function HeartSprite({ className = "", style }: Props) {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--c-accent) 70%, white)" />
          <stop offset="1" stopColor="var(--c-accent)" />
        </linearGradient>
      </defs>
      <path
        d="M24 41S8 31.5 5.2 21.6C3.5 15.2 7.5 9 13.8 9c4.2 0 7.6 2.3 10.2 6 2.6-3.7 6-6 10.2-6 6.3 0 10.3 6.2 8.6 12.6C40 31.5 24 41 24 41z"
        fill={`url(#${id})`}
      />
      <path d="M12 16.5c1.2-2.4 3.6-3.6 6-3.2" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function BalloonSprite({ className = "", style, tint = "var(--c-accent)" }: Props & { tint?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 40 64" className={className} style={style} aria-hidden>
      <path d="M20 44c-1 4 1 7-1 11s1 6 0 9" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1" />
      <ellipse cx="20" cy="21" rx="15" ry="18.5" fill={tint} />
      <ellipse cx="20" cy="21" rx="15" ry="18.5" fill={`url(#${id})`} />
      <path d="M17.5 39.2h5l-2.5 3.8z" fill={tint} />
      <path d="M11 12c2-4 6-5.5 9-5" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="white" stopOpacity="0.35" />
          <stop offset="0.6" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.18" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function SnowflakeSprite({ className = "", style }: Props) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M24 4v40M6.7 14l34.6 20M6.7 34l34.6-20" />
      <path d="M19 8l5 5 5-5M19 40l5-5 5 5M6.5 20.5l6.8-1.8-1.8-6.8M41.5 27.5l-6.8 1.8 1.8 6.8M6.5 27.5l6.8 1.8-1.8 6.8M41.5 20.5l-6.8-1.8 1.8-6.8" />
    </svg>
  );
}

export function StarSprite({ className = "", style }: Props) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden>
      <path d="M24 3c1.2 10 5.3 16.5 18 21-12.7 4.5-16.8 11-18 21-1.2-10-5.3-16.5-18-21 12.7-4.5 16.8-11 18-21z" fill="var(--c-muted)" />
      <path d="M24 13c.6 5 2.6 8.2 9 11-6.4 2.8-8.4 6-9 11-.6-5-2.6-8.2-9-11 6.4-2.8 8.4-6 9-11z" fill="white" fillOpacity="0.55" />
    </svg>
  );
}

export function SweetSprite({ className = "", style, tint = "var(--c-accent)" }: Props & { tint?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} style={style} aria-hidden>
      <path d="M17 20 3 9v22zM47 20l14-11v22z" fill="var(--c-muted)" />
      <ellipse cx="32" cy="20" rx="16" ry="13" fill={tint} />
      <path d="M22 14c3-3 8-4.5 12-3.5" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 30c4-6 12-14 16-18" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="3" />
    </svg>
  );
}

export function GhostSprite({ className = "", style }: Props) {
  const id = useId();
  return (
    <svg viewBox="0 0 48 56" className={className} style={style} aria-hidden>
      <path d="M24 3C13 3 7 11.5 7 22v28l5.5-4 5.5 4 6-4 6 4 5.5-4 5.5 4V22C41 11.5 35 3 24 3z" fill="#f5f1ea" />
      <path d="M24 3C13 3 7 11.5 7 22v28l5.5-4 5.5 4 6-4 6 4 5.5-4 5.5 4V22C41 11.5 35 3 24 3z" fill={`url(#${id})`} />
      <ellipse cx="18" cy="22" rx="2.6" ry="3.6" fill="#2a2234" />
      <ellipse cx="30" cy="22" rx="2.6" ry="3.6" fill="#2a2234" />
      <ellipse cx="24" cy="31" rx="3" ry="2.2" fill="#2a2234" opacity="0.8" />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HeadstoneSprite({ className = "", style }: Props) {
  return (
    <svg viewBox="0 0 24 28" className={className} style={style} aria-hidden>
      <path d="M3 28V11a9 9 0 0 1 18 0v17z" fill="#4a4858" />
      <path d="M8 13h8M12 9v9" stroke="#2e2c3a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// A wrapped present: box in the card's accent, a gold ribbon and bow.
export function GiftSprite({ className = "", style }: Props) {
  const id = useId();
  return (
    <svg viewBox="0 0 96 96" className={className} style={style} aria-hidden>
      <rect x="14" y="40" width="68" height="48" rx="3" fill="var(--c-accent)" />
      <rect x="10" y="30" width="76" height="14" rx="3" fill="color-mix(in srgb, var(--c-accent) 80%, black)" />
      <rect x="43" y="30" width="10" height="58" fill="var(--c-muted)" />
      <path
        d="M48 30c-6-12-22-14-22-5 0 6 12 6 22 5zM48 30c6-12 22-14 22-5 0 6-12 6-22 5z"
        fill="none"
        stroke="var(--c-muted)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <rect x="14" y="44" width="68" height="44" rx="3" fill={`url(#${id})`} />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.15" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// A star piñata in the card's colours, with paper fringes.
export function PinataSprite({ className = "", style }: Props) {
  const points = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return [50 + Math.cos(a) * 44, 52 + Math.sin(a) * 44];
  });
  return (
    <svg viewBox="0 0 100 110" className={className} style={style} aria-hidden>
      {points.map(([x, y], i) => (
        <g key={i}>
          <path
            d={`M${x} ${y} l-3 14 M${x} ${y} l0 16 M${x} ${y} l3 14`}
            stroke={i % 2 ? "var(--c-muted)" : "var(--c-accent)"}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      ))}
      <path
        d={
          points
            .map(([x, y], i) => {
              const a = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
              return `${i ? "L" : "M"}${x} ${y} L${50 + Math.cos(a) * 18} ${52 + Math.sin(a) * 18}`;
            })
            .join(" ") + "Z"
        }
        fill="var(--c-accent)"
        stroke="var(--c-muted)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="52" r="12" fill="var(--c-muted)" />
      <circle cx="50" cy="52" r="6" fill="var(--c-accent)" />
    </svg>
  );
}

// A drop of water for the flower game.
export function DropSprite({ className = "", style }: Props) {
  return (
    <svg viewBox="0 0 24 32" className={className} style={style} aria-hidden>
      <path d="M12 2C8 8 4 13 4 19a8 8 0 0 0 16 0c0-6-4-11-8-17z" fill="#8db4cc" />
      <path d="M8.5 19.5a4 4 0 0 0 3.5 4" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Small line icons for the memory and slot-machine games, drawn in the card's accent
// on a 48×48 grid.
const ICONS = {
  heart: <path d="M24 39S9 30 6.6 21C5 15 8.6 10 14 10c4 0 7.5 2.4 10 6 2.5-3.6 6-6 10-6 5.4 0 9 5 7.4 11C39 30 24 39 24 39z" />,
  star: <path d="M24 6l5.3 11.6 12.7 1.4-9.5 8.6 2.7 12.5L24 33.8 12.8 40.1l2.7-12.5L6 19l12.7-1.4z" />,
  sparkle: (
    <path d="M22 6c1 9 4 12.5 13 13.5-9 1-12 4.5-13 13.5-1-9-4-12.5-13-13.5 9-1 12-4.5 13-13.5zM37 30c.5 3.4 1.7 4.8 5 5.3-3.3.5-4.5 1.9-5 5.3-.5-3.4-1.7-4.8-5-5.3 3.3-.5 4.5-1.9 5-5.3z" />
  ),
  moon: <path d="M31 8a16 16 0 1 0 9.5 28A13 13 0 1 1 31 8z" />,
  sun: (
    <>
      <circle cx="24" cy="24" r="8" />
      <path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M11.3 36.7l3.5-3.5M33.2 14.8l3.5-3.5" />
    </>
  ),
  flower: (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="24" cy="13.5" rx="5" ry="6.5" transform={`rotate(${a} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="3.5" />
    </>
  ),
  rose: (
    <>
      <path d="M24 23c-5.5 0-8.5-3.6-8.5-8.2 0-3 1.8-5.4 4.6-6.6 1.4 1.8 4 2.3 6 1.2 2.8.9 5.4 3.4 5.4 6.2 0 4.2-3 7.4-7.5 7.4z" />
      <path d="M23.5 14.5c-2 .2-3 1.6-2.7 3.1.4 1.6 2.6 2.4 4.3 1.5" />
      <path d="M24 23v19M24 33c-4-4-8-4.5-10.5-3.5 2 4 6.2 5.3 10.5 3.5z" />
    </>
  ),
  leaf: <path d="M10 38C10 18 22 8 40 8c0 20-10 30-30 30zM10 38l16-16" />,
  feather: <path d="M38 8C22 9 12 20 11 37c15-1 25-11 27-29zM7 41l20-20M17 31h8M21 25h8" />,
  diamond: <path d="M14 9h20l8 10-18 21L6 19zM6 19h36M19 9l-4 10 9 21 9-21-4-10" />,
  ring: (
    <>
      <circle cx="24" cy="30" r="12" />
      <path d="M18 12h12l-6 7z" />
    </>
  ),
  crown: <path d="M8 36V16l9 8 7-12 7 12 9-8v20zM8 41h32" />,
  trophy: <path d="M15 8h18v8a9 9 0 0 1-18 0zM15 11h-5c0 5 2 8 6 8M33 11h5c0 5-2 8-6 8M24 25v7M17 41h14M19 41c0-5 2-9 5-9s5 4 5 9" />,
  gift: <path d="M9 20h30v20H9zM7 14h34v6H7zM24 14v26M24 14c-3-7-13-8-13-3 0 3 7 3 13 3zM24 14c3-7 13-8 13-3 0 3-7 3-13 3z" />,
  bow: (
    <>
      <path d="M24 22c-6-8-16-10-16-3 0 6 10 6 16 3zM24 22c6-8 16-10 16-3 0 6-10 6-16 3z" />
      <circle cx="24" cy="22" r="2.8" />
      <path d="M22 25l-6 14M26 25l6 14" />
    </>
  ),
  balloon: <path d="M24 31c-7 0-12-6-12-13a12 12 0 0 1 24 0c0 7-5 13-12 13zM22 31l2 3 2-3M24 34c-2.5 3 2.5 5 0 9" />,
  cake: <path d="M8 41h32M11 41V28h26v13M11 33c3 2 5.5 2 8.5 0s5.5-2 8.5 0 5.5 2 9 0M24 28v-6M24 18.5c-2-1.8-1.6-4 0-6.5 1.6 2.5 2 4.7 0 6.5z" />,
  candle: <path d="M18 21h12v20H18zM24 21v-3M24 15.5c-3-2.6-2.4-6 0-9.5 2.4 3.5 3 6.9 0 9.5zM14 41h20" />,
  diya: <path d="M7 28h34c-2 7-9 10.5-17 10.5S9 35 7 28zM24 24c-3.2-3-2.6-7.4 0-11.5 2.6 4.1 3.2 8.5 0 11.5zM18 42h12" />,
  lantern: (
    <>
      <path d="M21 6h6M24 3v3M17 10h14c4 7 4 17 0 24H17c-4-7-4-17 0-24z" />
      <path d="M15 10h18M15 34h18M21 10c-2 7-2 17 0 24M27 10c2 7 2 17 0 24M24 34v6M21 41h6" />
    </>
  ),
  bell: <path d="M14 34V22a10 10 0 0 1 20 0v12l4 4H10zM20 40a4 4 0 0 0 8 0M24 8v4" />,
  glass: <path d="M17 6h14l-1.4 13a5.6 5.6 0 0 1-11.2 0zM18 12.5h12M24 24.6V39M17 41h14" />,
  cup: <path d="M10 18h24v10a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10zM34 21h3a4 4 0 0 1 0 8h-3.5M8 42h28M18 7c-2 2 2 4 0 6.5M25 7c-2 2 2 4 0 6.5" />,
  envelope: (
    <>
      <rect x="6" y="12" width="36" height="25" rx="2" />
      <path d="M6 14l18 13 18-13" />
    </>
  ),
  key: (
    <>
      <circle cx="14" cy="24" r="7" />
      <path d="M21 24h21M36 24v6M41 24v5" />
    </>
  ),
  house: <path d="M7 22L24 8l17 14M11 19v21h26V19M20 40V29h8v11" />,
  plane: <path d="M6 25l36-16-9 31-9-11zM24 29L42 9M24 29v9l5-6" />,
  suitcase: (
    <>
      <rect x="8" y="16" width="32" height="22" rx="3" />
      <path d="M18 16v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M8 25h32M15 38v3M33 38v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="24" cy="25" r="16" />
      <path d="M24 15v10l7 5M18 5h12" />
    </>
  ),
  tree: <path d="M24 5l-9 11h5l-8 10h5l-7 10h28l-7-10h5l-8-10h5zM24 36v6" />,
  snowflake: (
    <path d="M24 6v36M8.4 15l31.2 18M8.4 33l31.2-18M20 9.5l4 4 4-4M20 38.5l4-4 4 4M9 20.5l5.5-1.4-1.4-5.5M39 27.5l-5.5 1.4 1.4 5.5M9 27.5l5.5 1.4-1.4 5.5M39 20.5l-5.5-1.4 1.4-5.5" />
  ),
  pumpkin: <path d="M24 14c-9 0-16 6-16 14s7 13 16 13 16-5 16-13-7-14-16-14zM24 14c-4 0-6 6-6 13.5S20 41 24 41s6-6 6-13.5S28 14 24 14zM24 14c0-3 1-6 4-8" />,
  web: <path d="M24 6v36M6 24h36M11.3 11.3l25.4 25.4M36.7 11.3L11.3 36.7M24 15l6.4 2.6L33 24l-2.6 6.4L24 33l-6.4-2.6L15 24l2.6-6.4z" />,
  tie: <path d="M20 6h8l-1.6 6h-4.8zM21.6 12L17 33l7 8 7-8-4.6-21" />,
  drop: <path d="M24 6c-7 10-12 16-12 23a12 12 0 0 0 24 0c0-7-5-13-12-23zM18 29a6 6 0 0 0 6 6" />,
  cap: <path d="M4 18 24 9l20 9-20 9zM12 21.6V31c0 3 5.4 5.5 12 5.5s12-2.5 12-5.5v-9.4M24 18l13 4.5V32M35 37l2-5 2 5z" />,
  diploma: (
    <>
      <rect x="5" y="19" width="38" height="10" rx="5" transform="rotate(-28 24 24)" />
      <circle cx="11.6" cy="30.6" r="2.4" />
      <path d="M21.7 19.6l4.7 8.8M26.4 28.4 25 38l3-2.5 2.5 3L29.5 28" />
    </>
  ),
  deckchair: <path d="M30 42 15 10M14 42l20-14M15 10c4.5 10 10 16.5 19 18M34 28h4M8 42h32" />,
  plant: <path d="M14 30h20l-3 12H17zM24 30V17M24 23c-6.5 0-10-3.5-10-10 6.5 0 10 3.5 10 10zM24 19c0-6.5 3.5-10 10-10 0 6.5-3.5 10-10 10z" />,
} as const;

export type IconName = keyof typeof ICONS;

// Six for each occasion: the memory game deals them as pairs, the slot machine
// spins them, and the first is the jackpot.
export const OCCASION_ICONS: Record<Occasion, IconName[]> = {
  valentine: ["heart", "rose", "envelope", "ring", "key", "candle"],
  birthday: ["cake", "balloon", "gift", "candle", "star", "glass"],
  diwali: ["diya", "lantern", "flower", "sparkle", "bell", "star"],
  christmas: ["tree", "snowflake", "bell", "gift", "star", "candle"],
  eid: ["moon", "star", "lantern", "gift", "flower", "cup"],
  anniversary: ["ring", "glass", "rose", "heart", "house", "key"],
  sorry: ["flower", "heart", "envelope", "cup", "feather", "sun"],
  thanks: ["flower", "cup", "heart", "envelope", "star", "sun"],
  congrats: ["trophy", "crown", "star", "glass", "balloon", "gift"],
  halloween: ["pumpkin", "moon", "candle", "web", "key", "star"],
  newyear: ["glass", "clock", "sparkle", "star", "bell", "moon"],
  mothersday: ["flower", "rose", "cup", "heart", "crown", "envelope"],
  fathersday: ["tie", "cup", "trophy", "star", "key", "crown"],
  rakhi: ["bow", "flower", "gift", "diya", "star", "heart"],
  holi: ["drop", "flower", "sun", "sparkle", "star", "heart"],
  newbaby: ["moon", "star", "bow", "heart", "feather", "sun"],
  wedding: ["ring", "glass", "rose", "cake", "bell", "heart"],
  getwell: ["sun", "flower", "cup", "leaf", "heart", "feather"],
  missyou: ["plane", "envelope", "heart", "house", "moon", "star"],
  friendship: ["heart", "star", "cup", "glass", "sun", "key"],
  leaving: ["plane", "suitcase", "envelope", "star", "glass", "leaf"],
  graduation: ["cap", "diploma", "star", "trophy", "glass", "crown"],
  retirement: ["deckchair", "sun", "plant", "cup", "plane", "glass"],
  newhome: ["house", "key", "plant", "cup", "heart", "gift"],
};

export function GameIcon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}
