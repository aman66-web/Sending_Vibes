"use client";

import { useContext, useSyncExternalStore } from "react";
import type { Occasion } from "@/lib/card";
import { Motif } from "./motifs";
import { Flourish, HeartMark } from "./ornaments";
import { Postmark } from "./Postmark";
import { SoundEnabled } from "./sound";

export type EnvelopeColours = { paper: string; shade: string; ink: string };

// Cream paper and dark ink, unless the screen has chosen its own (see lib/screen-style.ts).
const ENVELOPE_COLOURS: EnvelopeColours = { paper: "#f6efe0", shade: "#ebe1cb", ink: "#3a3127" };

// The inside, in the card's accent colour, seen once the flap lifts.
const LINING = "repeating-linear-gradient(135deg, var(--c-accent) 0 7px, color-mix(in srgb, var(--c-accent) 78%, white) 7px 14px)";
const STAMP = "linear-gradient(155deg, color-mix(in srgb, var(--c-accent) 78%, white), var(--c-accent) 70%)";
const WAX = "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--c-accent) 65%, white) 0%, var(--c-accent) 45%, color-mix(in srgb, var(--c-accent) 55%, black) 100%)";
const WAX_SHADOW = "0 4px 10px rgba(0,0,0,0.35), inset 0 -3px 6px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.25)";
// Where the seal cracks in two: a jagged line down the middle.
const LEFT_HALF = "polygon(0 0, 53% 0, 47% 24%, 56% 46%, 45% 66%, 54% 84%, 49% 100%, 0 100%)";
const RIGHT_HALF = "polygon(53% 0, 100% 0, 100% 100%, 49% 100%, 54% 84%, 45% 66%, 56% 46%, 47% 24%)";

// The first letter of the sender's name, pressed into the seal, or a heart.
export function initialOf(from: string) {
  return ([...from.trim()][0] ?? "").toUpperCase() || "♥";
}

// A blob of sealing wax in the card's accent colour.
export function WaxSeal({ initial, className = "", style }: { initial: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`grid place-items-center rounded-[47%_53%_50%_50%/53%_47%_52%_48%] font-display font-semibold italic text-white/90 ${className}`}
      style={{ background: WAX, boxShadow: WAX_SHADOW, ...style }}
    >
      <span className="grid h-[72%] w-[72%] place-items-center rounded-full ring-1 ring-white/35">{initial}</span>
    </span>
  );
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const unchanging = () => () => {};
let today = "";

// The day it was sent (or today, while it's being made), as a post office prints it. Only
// worked out in the browser, which knows what day it is where they are: the page as the
// server first sends it leaves the date off.
function usePostmarkDate(sentAt?: string) {
  const when = useSyncExternalStore(unchanging, () => sentAt || (today ||= new Date().toISOString()), () => "");
  const date = new Date(when);
  if (!when || Number.isNaN(date.getTime())) return undefined;
  return { day: `${date.getDate()} ${MONTHS[date.getMonth()]}`, year: String(date.getFullYear()) };
}

// A real-looking envelope, addressed by hand, stamped and franked, closed with a wax seal.
// Opening it cracks the seal, lifts the flap and slides the letter up out of it; tapping it
// again carries on, like the button underneath (IntroScreen decides).
export function Envelope({
  ref,
  open,
  label,
  onClick,
  title,
  to,
  from,
  colours = ENVELOPE_COLOURS,
  occasion,
  sentAt,
  still = false,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  open: boolean;
  label: string;
  onClick: () => void;
  // Written on the letter inside.
  title: string;
  to: string;
  from: string;
  colours?: EnvelopeColours;
  // Pictured on the stamp; a heart without one.
  occasion?: Occasion;
  // When the card was sent, for the postmark; today without one.
  sentAt?: string;
  // Keeps it from nudging, e.g. while its words are being changed in the editor.
  still?: boolean;
}) {
  // Only a card someone is playing nudges itself; silent thumbnails and previews keep still.
  const nudge = useContext(SoundEnabled) && !still && !open;
  const date = usePostmarkDate(sentAt);
  const initial = initialOf(from);
  const seal = "absolute left-1/2 top-[56%] aspect-square w-[17%] -translate-x-1/2 -translate-y-1/2 text-[clamp(1.1rem,5.5cqw,1.4rem)]";
  const flap = "absolute inset-x-0 h-[60%] [clip-path:polygon(0_0,100%_0,50%_100%)]";

  return (
    <button
      ref={ref}
      data-envelope
      aria-label={label}
      onClick={onClick}
      className={`group relative mt-12 aspect-[3/2] w-[min(21rem,84cqw)] [perspective:900px] @2xl:w-[25rem] ${nudge ? "envelope-nudge" : ""}`}
    >
      <span className="absolute inset-0 rounded-md shadow-[0_22px_44px_-20px_rgba(0,0,0,0.6)]" style={{ background: LINING }} />
      {/* The letter, which slides up out of it once the flap is open. */}
      <span
        className={`envelope-letter absolute inset-x-[5%] bottom-[4%] top-[4%] flex flex-col items-center rounded-sm bg-[#fffdf8] px-[7%] pt-[7%] text-[#2b2318] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] ${open ? "envelope-letter-out" : ""}`}
        style={{ zIndex: 2 }}
      >
        <span className="font-display text-[clamp(1.2rem,6.4cqw,1.6rem)] font-semibold italic leading-tight">{title}</span>
        <Flourish className="mt-2 w-24 shrink-0 text-[#a8894f]" />
      </span>
      {/* The front, with its folds, and their name written on it. */}
      <span
        className="absolute inset-0 rounded-md [clip-path:polygon(0_0,50%_54%,100%_0,100%_100%,0_100%)]"
        style={{ zIndex: 3, background: `linear-gradient(180deg, ${colours.paper} 0%, ${colours.shade} 100%)` }}
      >
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" fill="none" stroke={colours.ink} strokeOpacity="0.12">
          <path d="M0 100 41 59M100 100 59 59" vectorEffect="non-scaling-stroke" />
        </svg>
        {to && (
          <span className="absolute inset-x-0 bottom-[6%] truncate px-6 font-hand text-[clamp(1.6rem,8.5cqw,2.1rem)] leading-tight" style={{ color: colours.ink }}>
            {to}
          </span>
        )}
      </span>
      {/* The flap's shadow on the front while it's shut. */}
      <span aria-hidden className={`${flap} top-[1.5%] transition-opacity duration-150 ${open ? "opacity-0" : ""}`} style={{ zIndex: 4, background: "rgba(0,0,0,0.1)" }} />
      {/* The flap, which lifts back over the top once the seal has cracked. */}
      <span
        className={`${flap} top-0 origin-top rounded-t-md ${open ? "[transform:rotateX(180deg)]" : ""}`}
        style={{
          zIndex: open ? 1 : 4,
          background: open ? "color-mix(in srgb, var(--c-accent) 85%, black)" : colours.shade,
          transition: "transform 0.55s ease-in-out 0.15s, z-index 0s linear 0.42s, background 0s linear 0.42s",
        }}
      />
      {/* A stamp, franked with the date and who it's from. Taps go through it to the envelope. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute right-[3%] top-[5%] aspect-[2/1] w-[42%] transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
        style={{ zIndex: 5 }}
      >
        <span className="absolute right-0 top-0 w-[38%] rotate-[4deg] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.25)]">
          <span className="stamp block aspect-[5/6]" style={{ "--hole": "2px" } as React.CSSProperties}>
            <span className="grid h-full w-full place-items-center text-[var(--c-accent-text)]" style={{ background: STAMP }}>
              {occasion ? <Motif occasion={occasion} className="h-[82%] w-[82%]" /> : <HeartMark className="h-[66%] w-[66%]" />}
            </span>
          </span>
        </span>
        <Postmark date={date} from={from} className="absolute left-0 top-[18%] w-[86%] -rotate-[8deg]" style={{ color: colours.ink, opacity: 0.55 }} />
      </span>
      {/* The wax seal, which cracks in two and falls away as it opens. */}
      {open ? (
        <>
          <WaxSeal initial={initial} className={`${seal} seal-half-left`} style={{ zIndex: 5, clipPath: LEFT_HALF }} />
          <WaxSeal initial={initial} className={`${seal} seal-half-right`} style={{ zIndex: 5, clipPath: RIGHT_HALF }} />
        </>
      ) : (
        <WaxSeal initial={initial} className={`${seal} transition-transform duration-300 group-hover:scale-105`} style={{ zIndex: 5 }} />
      )}
    </button>
  );
}

// Under the closed envelope: what to do, with a hand pointing up at it, and that the card
// has sound. Big and plain, to read at arm's length.
export function TapHint({ tap, sound, still = false }: { tap: string; sound: string; still?: boolean }) {
  const playing = useContext(SoundEnabled);
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="flex items-center justify-center gap-2.5 text-lg font-semibold leading-snug">
        <TapHand className={`h-9 w-9 shrink-0 ${playing && !still ? "tap-hand-bob" : ""}`} />
        <span className="text-balance">{tap}</span>
      </p>
      {/* Silent previews have no sound to mention. */}
      {playing && <p className="text-base text-[var(--c-muted)]">{sound}</p>}
    </div>
  );
}

function TapHand({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        className="fill-[var(--c-surface)]"
        d="M9.5 16.5V4.25a1.6 1.6 0 0 1 3.2 0v6.35a1.6 1.6 0 0 1 3.2 0v1a1.6 1.6 0 0 1 3.2 0v4.1c0 3.4-2.4 5.8-5.8 5.8h-1.4c-1.9 0-3.2-.7-4.4-2l-3.1-3.6a1.5 1.5 0 0 1 2.2-2z"
      />
      <path d="M12.7 10.6v2M15.9 11.6v1.6" />
    </svg>
  );
}
