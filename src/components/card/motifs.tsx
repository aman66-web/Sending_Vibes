import type { Occasion } from "@/lib/card";

// A fine line drawing for each occasion, used on card fronts instead of emoji.
// Drawn on a 48×48 grid in currentColor.
const MOTIFS: Record<Occasion, React.ReactNode> = {
  valentine: (
    <>
      <path d="M24 39s-13-8-15.4-16.4C7 17 10.4 12 15.6 12c3.6 0 6.3 2 8.4 5.2C26.1 14 28.8 12 32.4 12c5.2 0 8.6 5 7 10.6C37 31 24 39 24 39z" />
      <path d="M8 34 40 14M36 13.5l4.5.5-.6 4.4M8 34l-1.6 3.4 3.6-1" />
    </>
  ),
  birthday: (
    <>
      <path d="M10 40h28M12 40V28h24v12M14 28v-5h20v5" />
      <path d="M12 33c3 2 5 2 8 0s5-2 8 0 5 2 8 0" />
      <path d="M18 23v-5M24 23v-5M30 23v-5" />
      <path d="M18 15.5c-1.2-1.4-.4-3 0-4 .4 1 1.2 2.6 0 4zM24 15.5c-1.2-1.4-.4-3 0-4 .4 1 1.2 2.6 0 4zM30 15.5c-1.2-1.4-.4-3 0-4 .4 1 1.2 2.6 0 4z" />
    </>
  ),
  diwali: (
    <>
      <path d="M8 28h32c-1.5 7-8 11-16 11S9.5 35 8 28z" />
      <path d="M12 28c0-2 5-3 12-3s12 1 12 3" />
      <path d="M24 23c-4-4-3-9 0-14 3 5 4 10 0 14z" />
      <path d="M24 20c-1.5-1.6-1.2-3.6 0-5.6 1.2 2 1.5 4 0 5.6z" />
      <path d="M18 42h12" />
    </>
  ),
  christmas: (
    <>
      <path d="M24 9l-8 10h4l-7 9h5l-7 9h26l-7-9h5l-7-9h4z" />
      <path d="M22 37v4h4v-4" />
      <path d="M24 3.5l1 2.2 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z" />
    </>
  ),
  eid: (
    <>
      <path d="M30 9a15 15 0 1 0 9 26.5A12 12 0 1 1 30 9z" />
      <path d="M36 15l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" />
    </>
  ),
  anniversary: (
    <>
      <circle cx="19" cy="28" r="10" />
      <circle cx="29" cy="28" r="10" />
      <path d="M26 10l3-4 3 4-3 3.5z" />
    </>
  ),
  sorry: (
    <>
      <path d="M24 44V22" />
      <path d="M24 32c-5 0-8-3-9-7 5 0 8 2 9 7zM24 36c4 0 7-2.5 8-6-4 0-7 2-8 6z" />
      <path d="M24 22c-5 0-7-4-6-9 2 1 4 1 6-2 2 3 4 3 6 2 1 5-1 9-6 9z" />
    </>
  ),
  thanks: (
    <>
      <path d="M24 44V26M24 26l-8-10M24 26l8-10M24 26V12" />
      <circle cx="24" cy="9" r="4" />
      <circle cx="14.5" cy="13.5" r="4" />
      <circle cx="33.5" cy="13.5" r="4" />
      <path d="M18 36c3 0 6 1 6 4M30 36c-3 0-6 1-6 4" />
    </>
  ),
  congrats: (
    <>
      <path d="M15 8h18v8a9 9 0 0 1-18 0z" />
      <path d="M15 11h-5c0 5 2 8 6 8M33 11h5c0 5-2 8-6 8" />
      <path d="M24 25v7M17 40h14M19 40c0-4 2-8 5-8s5 4 5 8" />
    </>
  ),
  halloween: (
    <>
      <path d="M24 14c-9 0-16 6-16 14s7 13 16 13 16-5 16-13-7-14-16-14z" />
      <path d="M24 14c-4 0-6 6-6 13.5S20 41 24 41s6-6 6-13.5S28 14 24 14z" />
      <path d="M24 14c0-3 1-6 4-8" />
    </>
  ),
  newyear: (
    <>
      <path d="M13 8h9l-1 10a3.5 3.5 0 0 1-7 0zM17.5 21.5V36M13 36h9" />
      <path d="M26 8h9l-1 10a3.5 3.5 0 0 1-7 0zM30.5 21.5V36M26 36h9" />
      <path d="M24 4v-1M20 5l-1-1M28 5l1-1" />
    </>
  ),
  mothersday: (
    <>
      <path d="M24 44V24" />
      <path d="M24 24c-6 0-9-4-9-11 3 2 5 2 9-2 4 4 6 4 9 2 0 7-3 11-9 11z" />
      <path d="M24 34c-5-1-8-4-9-8M24 38c4-1 7-3 8-7" />
    </>
  ),
  fathersday: (
    <>
      <path d="M24 24l-14-8v16zM24 24l14-8v16z" />
      <rect x="20.5" y="20.5" width="7" height="7" rx="1.5" />
    </>
  ),
  rakhi: (
    <>
      <path d="M4 24h12M32 24h12" />
      <circle cx="24" cy="24" r="8" />
      <circle cx="24" cy="24" r="3" />
      <path d="M24 16v-3M24 32v3M16 24h-0M31 18l2-2M17 30l-2 2M31 30l2 2M17 18l-2-2" />
    </>
  ),
  holi: (
    <>
      <circle cx="18" cy="20" r="8" />
      <circle cx="30" cy="20" r="8" />
      <circle cx="24" cy="30" r="8" />
    </>
  ),
  newbaby: (
    <>
      <circle cx="24" cy="16" r="9" />
      <path d="M24 25v13M19 41h10" />
      <circle cx="24" cy="16" r="3.5" />
    </>
  ),
  wedding: (
    <>
      <circle cx="20" cy="30" r="9" />
      <circle cx="28" cy="27" r="9" />
      <path d="M24 9l4 4-4 5-4-5z" />
    </>
  ),
  getwell: (
    <>
      <circle cx="24" cy="20" r="5" />
      <path d="M24 9v3M24 28v3M13 20h3M32 20h3M16.2 12.2l2.1 2.1M29.7 25.7l2.1 2.1M16.2 27.8l2.1-2.1M29.7 14.3l2.1-2.1" />
      <path d="M24 31v13M24 38c-3-3-6-3-8-2 2 3 5 3 8 2z" />
    </>
  ),
  missyou: (
    <>
      <path d="M6 23 42 8l-9 32-9-12z" />
      <path d="M24 28 42 8M24 28v10l5-6" />
    </>
  ),
  friendship: (
    <>
      <path d="M18 33s-9-5.5-10.7-11.4C6.2 17.8 8.6 14 12.3 14c2.4 0 4.2 1.4 5.7 3.6" />
      <path d="M30 37s-9-5.5-10.7-11.4C18.2 21.8 20.6 18 24.3 18c2.4 0 4.2 1.4 5.7 3.6 1.5-2.2 3.3-3.6 5.7-3.6 3.7 0 6.1 3.8 5 7.6C39 31.5 30 37 30 37z" />
    </>
  ),
  leaving: (
    <>
      <rect x="9" y="17" width="30" height="21" rx="3" />
      <path d="M19 17v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4M9 25h30M16 38v3M32 38v3" />
    </>
  ),
};

export function Motif({ occasion, className = "", style }: { occasion: Occasion; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {MOTIFS[occasion]}
    </svg>
  );
}
