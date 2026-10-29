"use client";

import { useContext, useEffect, useRef, useState } from "react";
import type { Screen } from "@/lib/card";
import { SLIDER_STAGES } from "@/lib/stages";
import { Burst } from "./effects";
import { HelpButton, NextButton, usePressAt } from "./screens";
import { useSfx } from "./sound";
import { HELP_AFTER, LiveContext, useStuck, useTune } from "./tune";
import { useWords } from "./words";

type Of<T extends Screen["type"]> = Extract<Screen, { type: T }>;
// `stage` starts the screen part-way through (see lib/stages.ts), for the editor.
type ScreenProps<T extends Screen["type"]> = { screen: Of<T>; onNext: () => void; stage?: number };

// ---------- Spin the wheel ----------

const SPIN_MS = 4200;

function point(deg: number, r: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
}

export function WheelScreen({ screen, onNext, stage = 0 }: ScreenProps<"wheel">) {
  const sfx = useSfx();
  const { text } = useWords();
  // Faster spins for less time (style.tune.speed).
  const spinMs = SPIN_MS / useTune().speed;
  const options = screen.options;
  const n = options.length;
  const slice = 360 / n;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const spinButton = useRef<HTMLButtonElement>(null);
  usePressAt(stage, 1, () => spinButton.current);

  const spin = () => {
    if (spinning) return;
    const target = screen.landOn >= 0 && screen.landOn < n ? screen.landOn : Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * slice * 0.6;
    // The pointer is at the top, so turn the wheel until the target slice's centre is there.
    const final = rotation - (rotation % 360) + 360 * 5 + (360 - (target * slice + slice / 2)) + jitter;
    setRotation(final);
    setSpinning(true);
    setResult(null);
    sfx("whoosh");
    // Clicks that slow down with the wheel (it eases out like a cubic curve).
    const ticks = Math.min(Math.round((final - rotation) / slice), 48);
    for (let k = 1; k <= ticks; k++) {
      const t = spinMs * (1 - Math.cbrt(1 - k / ticks));
      timers.current.push(setTimeout(() => sfx("tick"), t));
    }
    timers.current.push(
      setTimeout(() => {
        setSpinning(false);
        setResult(target);
        sfx("win");
      }, spinMs + 100),
    );
  };

  // Accent and white slices read well on every theme, light or dark.
  const fills = options.map((_, i) => (n % 2 === 1 && i === n - 1 ? "color-mix(in srgb, var(--c-accent) 45%, white)" : i % 2 === 0 ? "var(--c-accent)" : "#ffffff"));
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      {result !== null && <Burst />}
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <p className="text-lg text-[var(--c-muted)]">{result !== null ? screen.winText : screen.instructions}</p>
      <div className="relative h-72 w-72 @2xl:h-80 @2xl:w-80">
        <svg viewBox="-104 -104 208 208" className="h-full w-full drop-shadow-xl">
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${spinMs}ms cubic-bezier(0.33, 1, 0.68, 1)` : "none",
            }}
          >
            <circle r="102" fill="white" />
            {options.map((label, i) => {
              const a0 = i * slice;
              const a1 = (i + 1) * slice;
              const mid = a0 + slice / 2;
              const dark = fills[i] === "var(--c-accent)";
              const short = label.length > 16 ? `${label.slice(0, 15)}…` : label;
              // Labels run from the rim towards the hub; shrink long ones so they don't slide under it.
              const fontSize = Math.min(n > 6 ? 10 : n > 4 ? 12 : 14, 66 / (short.length * 0.6));
              return (
                <g key={i}>
                  <path d={`M0 0 L${point(a0, 98)} A98 98 0 ${slice > 180 ? 1 : 0} 1 ${point(a1, 98)} Z`} style={{ fill: fills[i] }} stroke="white" strokeWidth="2" />
                  <text
                    transform={`rotate(${mid - 90}) translate(90 0)`}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={fontSize.toFixed(1)}
                    fontWeight="700"
                    style={{ fill: dark ? "var(--c-accent-text)" : "#2a0f1c" }}
                  >
                    {short}
                  </text>
                </g>
              );
            })}
          </g>
          <circle r="16" style={{ fill: "var(--c-accent)" }} stroke="white" strokeWidth="5" />
          <path d="M-11 -106 L11 -106 L0 -84 Z" fill="#1d0b17" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </div>
      {result !== null ? (
        <>
          <p className="animate-pop rounded-2xl bg-[var(--c-surface)] px-6 py-3 font-display text-2xl font-semibold italic shadow-sm ring-1 ring-black/5">{options[result]}</p>
          <NextButton onClick={onNext} />
          <button onClick={spin} className="min-h-11 px-4 text-base font-semibold underline underline-offset-4 opacity-80">
            {text("spinAgain")}
          </button>
        </>
      ) : (
        <button
          ref={spinButton}
          data-spin
          onClick={spin}
          disabled={spinning}
          className="rounded-full bg-[var(--c-accent)] px-8 py-3.5 font-display text-lg font-semibold text-[var(--c-accent-text)] shadow-lg transition active:scale-95 disabled:opacity-60"
        >
          {spinning ? text("spinning") : text("spin")}
        </button>
      )}
    </div>
  );
}

// ---------- Coupon book ----------

// Notches cut into both sides so each one looks like a ticket.
const TICKET_MASK =
  "radial-gradient(circle 9px at left center, transparent 98%, #000) left / 51% 100% no-repeat, radial-gradient(circle 9px at right center, transparent 98%, #000) right / 51% 100% no-repeat";

export function CouponsScreen({ screen, onNext, stage = 0, from = "" }: ScreenProps<"coupons"> & { from?: string }) {
  const sfx = useSfx();
  const { text } = useWords();
  const live = useContext(LiveContext);
  const [redeemed, setRedeemed] = useState<boolean[]>(() => screen.coupons.map(() => stage >= 1));
  const any = redeemed.some(Boolean);

  const redeem = (i: number) => {
    if (redeemed[i]) return;
    setRedeemed((r) => r.map((v, j) => (j === i ? true : v)));
    sfx("stamp");
  };

  // Sends the ones they've redeemed to whoever made the card, as a message from their own
  // phone (its share menu, or WhatsApp where there isn't one), so there's nothing to
  // screenshot. Nothing goes through us.
  const send = () => {
    const chosen = screen.coupons.filter((_, i) => redeemed[i]).join(", ");
    const words = text("couponMessage", { coupons: chosen });
    const message = words.includes(chosen) ? words : `${words} ${chosen}`;
    const whatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    sfx("chime");
    if (typeof navigator.share !== "function") return whatsApp();
    // Closing the share menu without sending isn't a failure.
    navigator.share({ text: message }).catch((e: unknown) => {
      if (!(e instanceof DOMException && e.name === "AbortError")) whatsApp();
    });
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <p className="text-lg text-[var(--c-muted)]">{any ? text("couponClaim") : screen.instructions}</p>
      <div className="grid w-full grid-cols-2 gap-3 @2xl:grid-cols-3">
        {screen.coupons.map((c, i) => (
          <button
            key={i}
            data-redeem={redeemed[i] ? undefined : i}
            onClick={() => redeem(i)}
            className="relative flex min-h-28 flex-col items-center justify-center gap-1 overflow-hidden bg-white px-4 py-3 text-[#3b0a1f] shadow-md transition hover:-translate-y-0.5"
            style={{ mask: TICKET_MASK, WebkitMask: TICKET_MASK, borderRadius: 14 }}
          >
            <span className="absolute inset-1.5 rounded-[10px] border-2 border-dashed border-[var(--c-accent)] opacity-40" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--c-accent)]">{text("coupon")}</span>
            <span className="font-display text-lg font-bold leading-tight">{c}</span>
            <span className={`text-sm font-semibold opacity-75 ${redeemed[i] ? "invisible" : ""}`}>{text("couponTap")}</span>
            {redeemed[i] && (
              <span className="absolute bottom-1.5 right-2 animate-stamp rounded-md border-2 border-red-600 bg-white/80 px-1.5 font-display text-sm font-black uppercase tracking-wider text-red-600">
                {text("couponDone")}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Only on the card itself: a preview has nobody to send it to. */}
      {any && live && (
        <button
          data-coupon-send
          onClick={send}
          className="inline-flex min-h-14 animate-screen-in items-center gap-2.5 rounded-full bg-[var(--c-surface)] px-6 py-3 text-base font-semibold leading-snug text-[var(--c-text)] shadow-sm ring-2 ring-[var(--c-accent)] backdrop-blur"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M21.5 2.5 10.5 13.5M21.5 2.5l-7 19-4-8-8-4z" />
          </svg>
          {text("couponSend", { name: from.trim() || "them" })}
        </button>
      )}
      <NextButton onClick={onNext} className={any ? "animate-pop" : ""} />
    </div>
  );
}

// ---------- Reasons jar ----------

const SLIP_COLORS = ["#fde68a", "#fbcfe8", "#bfdbfe", "#bbf7d0", "#ddd6fe", "#fed7aa"];

export function ReasonsScreen({ screen, onNext, stage = 0 }: ScreenProps<"reasons">) {
  const sfx = useSfx();
  const { text } = useWords();
  const total = screen.reasons.length;
  const [pulled, setPulled] = useState(Math.min(stage, total));
  const done = pulled >= total;

  const pull = () => {
    if (done) return;
    setPulled((p) => p + 1);
    sfx(pulled + 1 === total ? "chime" : "pop");
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      {done && <Burst />}
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <p className="text-lg text-[var(--c-muted)]">{done ? text("jarEmpty") : screen.instructions}</p>
      <div className="flex min-h-32 w-full items-center justify-center">
        {pulled > 0 ? (
          <div
            key={pulled}
            className="w-full max-w-sm animate-pop rounded-2xl px-6 py-5 text-[#3b0a1f] shadow-lg"
            style={{ background: SLIP_COLORS[(pulled - 1) % SLIP_COLORS.length], transform: `rotate(${pulled % 2 ? -2 : 2}deg)` }}
          >
            <p className="text-sm font-bold uppercase tracking-wider opacity-75">
              {text("jarCount", { i: pulled, n: total })}
            </p>
            <p className="mt-1 font-hand text-2xl leading-snug">{screen.reasons[pulled - 1]}</p>
          </div>
        ) : (
          <p className="font-display text-lg font-semibold opacity-80">{text("jarTap")}</p>
        )}
      </div>
      <button data-jar={done ? undefined : true} onClick={pull} aria-label={done ? "The jar is empty" : "Take a note from the jar"} className="relative h-44 w-36">
        <span key={pulled} className={`absolute inset-0 ${pulled ? "animate-shake" : ""}`}>
          {/* Lid */}
          <span className="absolute inset-x-5 top-0 h-5 rounded-md bg-[var(--c-accent)] shadow" />
          <span className="absolute inset-x-7 top-4 h-3 bg-white/60" />
          {/* Glass */}
          <span className="absolute inset-x-2 bottom-0 top-6 overflow-hidden rounded-[2rem] bg-white/35 shadow-inner ring-2 ring-white/70 backdrop-blur-sm">
            {Array.from({ length: Math.max(total - pulled, 0) }, (_, i) => (
              <span
                key={i}
                className="absolute h-5 w-8 rounded-sm shadow-sm"
                style={{
                  background: SLIP_COLORS[i % SLIP_COLORS.length],
                  left: `${8 + ((i * 29) % 60)}%`,
                  bottom: `${6 + Math.floor(i / 3) * 14}%`,
                  transform: `rotate(${((i * 47) % 60) - 30}deg)`,
                }}
              />
            ))}
            <span className="absolute left-3 top-3 h-16 w-2 rounded-full bg-white/70" />
          </span>
        </span>
      </button>
      <NextButton onClick={onNext} className={done ? "animate-pop" : "invisible"} />
    </div>
  );
}

// ---------- The slider that only goes up ----------

// Where the slider's lines change, as it climbs (the lines themselves are labels).
const SLIDER_STEPS = [30, 55, 80, 100];

export function SliderScreen({ screen, onNext, stage = 0 }: ScreenProps<"slider">) {
  const sfx = useSfx();
  const { text, list } = useWords();
  const start = SLIDER_STAGES[stage] ?? SLIDER_STAGES[0];
  const [value, setValue] = useState(start);
  const current = useRef(start);
  const last = useRef<number | null>(null);
  const done = value >= 100;
  const stuck = useStuck(HELP_AFTER.slider);

  const bump = (amount: number) => {
    const before = current.current;
    if (before >= 100) return;
    const next = Math.min(100, before + amount);
    current.current = next;
    setValue(next);
    if (Math.floor(next / 8) !== Math.floor(before / 8)) sfx(next >= 100 ? "win" : "tick");
  };

  // Whichever way they drag, it goes up. That's the joke.
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (last.current === null) return;
    const width = e.currentTarget.offsetWidth || 300;
    const dx = Math.abs(e.clientX - last.current);
    last.current = e.clientX;
    bump((dx / width) * 70);
  };

  const lines = list("sliderLines");
  const step = SLIDER_STEPS.findIndex((max) => value < max);
  const line = done ? screen.winText : step >= 0 ? (lines[Math.min(step, lines.length - 1)] ?? "") : "";
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      {done && <Burst />}
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <p className={`font-display text-6xl font-black tabular-nums ${done ? "animate-pop text-[var(--c-accent)]" : ""}`}>{done ? "100%" : `${Math.round(value)}%`}</p>
      <p key={line} className="h-7 animate-screen-in font-display text-lg font-semibold">
        {line}
      </p>
      <div className="w-full max-w-sm">
        <div
          data-meter={done ? undefined : true}
          role="slider"
          tabIndex={0}
          aria-label={screen.title}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(value)}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            last.current = e.clientX;
            bump(6);
          }}
          onPointerMove={move}
          onPointerUp={() => (last.current = null)}
          onPointerCancel={() => (last.current = null)}
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) return;
            e.preventDefault();
            bump(9);
          }}
          className="relative h-14 cursor-grab touch-none select-none rounded-full bg-black/10 ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] active:cursor-grabbing"
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--c-accent)] transition-[width] duration-150" style={{ width: `${Math.max(value, 12)}%` }} />
          <span
            className="absolute top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--c-secondary)] text-[var(--c-accent)] shadow-md ring-1 ring-black/10 transition-[left] duration-150"
            style={{ left: `${Math.min(Math.max(value, 8), 92)}%` }}
          >
            <svg viewBox="0 0 24 24" className={`h-7 w-7 ${done ? "animate-pop" : ""}`} aria-hidden fill="currentColor">
              <path d="M12 20.5s-7.2-4.5-9.4-9.1C1.2 8.4 3.2 4.9 6.8 4.9c2.1 0 3.7 1.1 5.2 3 1.5-1.9 3.1-3 5.2-3 3.6 0 5.6 3.5 4.2 6.5-2.2 4.6-9.4 9.1-9.4 9.1z" />
            </svg>
          </span>
        </div>
        <div className="mt-2 flex justify-between text-sm font-semibold text-[var(--c-muted)]">
          <span>{screen.low}</span>
          <span>{screen.high}</span>
        </div>
      </div>
      {!done && <p className="text-base font-semibold opacity-75">{text("sliderDrag")}</p>}
      {stuck && !done ? <HelpButton onClick={() => bump(100)}>{text("helpFinish")}</HelpButton> : <NextButton onClick={onNext} className={done ? "animate-pop" : "invisible"} />}
    </div>
  );
}

// ---------- Our story so far ----------

export function TimelineScreen({ screen, onNext, stage = 0 }: ScreenProps<"timeline">) {
  const sfx = useSfx();
  const { text } = useWords();
  const total = screen.events.length;
  const [shown, setShown] = useState(Math.min(stage + 1, total));
  const done = shown >= total;

  const reveal = () => {
    if (done) return;
    setShown((s) => s + 1);
    sfx("tap");
  };

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <ol className="relative w-full max-w-md space-y-3 text-left">
        <span className="absolute bottom-3 left-[1.15rem] top-3 w-0.5 rounded-full bg-[var(--c-accent)] opacity-40" />
        {screen.events.slice(0, shown).map((ev, i) => (
          <li key={i} className="relative flex animate-screen-in items-start gap-3">
            <span className="relative z-10 mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--c-accent)] text-sm font-bold text-[var(--c-accent-text)] shadow ring-4 ring-[var(--c-surface)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-2xl bg-[var(--c-surface)] px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-wider text-[var(--c-muted)]">{ev.when}</p>
              <p className="mt-0.5 text-lg font-semibold leading-snug">{ev.what}</p>
            </div>
          </li>
        ))}
      </ol>
      {done ? (
        <NextButton onClick={onNext} className="animate-pop" />
      ) : (
        <button
          data-reveal-next
          onClick={reveal}
          className="min-h-14 rounded-full bg-[var(--c-secondary)] px-6 py-3 font-display text-lg font-semibold text-[var(--c-text)] shadow ring-1 ring-black/10 transition hover:-translate-y-0.5"
        >
          {text("timelineMore", { i: shown, n: total })}
        </button>
      )}
    </div>
  );
}

// ---------- Pick a box ----------

export function BoxesScreen({ screen, onNext, stage = 0 }: ScreenProps<"boxes">) {
  const sfx = useSfx();
  const { text } = useWords();
  const [picked, setPicked] = useState<number | null>(null);
  const [others, setOthers] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const row = useRef<HTMLDivElement>(null);
  usePressAt(stage, 1, () => row.current?.querySelector<HTMLElement>("[data-box]"));

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    sfx("pop");
    setTimeout(() => sfx("chime"), 250);
    timer.current = setTimeout(() => setOthers(true), 1100);
  };

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      {picked !== null && <Burst />}
      <h2 className="font-display text-3xl font-bold leading-tight">{screen.title}</h2>
      <p className="text-lg text-[var(--c-muted)]">{picked !== null ? text("boxesPicked") : screen.instructions}</p>
      <div ref={row} className="flex w-full items-end justify-center gap-4 pt-10">
        {screen.prizes.map((prize, i) => {
          const open = picked === i || (others && picked !== null);
          const mine = picked === i;
          return (
            <button
              key={i}
              data-box={picked === null ? i : undefined}
              onClick={() => pick(i)}
              aria-label={open ? prize : `Box ${i + 1}`}
              className={`relative flex w-24 flex-col items-center transition @2xl:w-32 ${picked === null ? "hover:-translate-y-1" : mine ? "" : "opacity-70"}`}
            >
              {open && (
                <span
                  className={`absolute bottom-full left-1/2 mb-3 w-[6.5rem] -translate-x-1/2 animate-pop rounded-xl px-2 py-2 font-display font-bold leading-tight shadow-lg @2xl:w-36 ${
                    mine ? "z-10 bg-white text-base text-[#3b0a1f] ring-2 ring-[var(--c-accent)]" : "bg-[var(--c-surface)] text-sm"
                  }`}
                >
                  {prize}
                </span>
              )}
              {/* Lid */}
              <span
                className={`relative z-[1] h-6 w-[110%] rounded-md bg-[var(--c-accent)] shadow brightness-110 transition duration-500 ${open ? "-translate-y-8 rotate-[-18deg] opacity-0" : ""}`}
              >
                <span className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-white/80" />
              </span>
              {/* Box */}
              <span className="relative h-20 w-full rounded-b-lg bg-[var(--c-accent)] shadow-lg @2xl:h-24">
                <span className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-white/80" />
                <span className="absolute inset-0 grid place-items-center font-display text-2xl font-black text-[var(--c-accent-text)] opacity-80">{open ? "" : "?"}</span>
              </span>
            </button>
          );
        })}
      </div>
      <NextButton onClick={onNext} className={picked !== null ? "animate-pop" : "invisible"} />
    </div>
  );
}
