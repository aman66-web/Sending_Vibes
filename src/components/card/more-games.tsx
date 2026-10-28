"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./effects";
import { HeartMark } from "./ornaments";
import { useSfx } from "./sound";
import { useWords } from "./words";
import { DropSprite, GameIcon, GhostSprite, HeadstoneSprite, HeartSprite, type IconName, PinataSprite, StarSprite } from "./sprites";

export type GameProps = { onWin: () => void; won: boolean };

const PANEL = "relative w-full select-none overflow-hidden rounded-3xl ring-1 ring-black/5";
const FOCUS = "outline-none focus-visible:ring-4 focus-visible:ring-[var(--c-accent)]";

// Where a tap lands inside a panel, in the panel's own pixels (it may be shown scaled down).
// Keyboard players get a random spot instead.
function tapPoint(e: React.PointerEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) {
  const el = e.currentTarget;
  const box = el.getBoundingClientRect();
  const scale = box.width / el.offsetWidth || 1;
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  if (!("clientX" in e)) return { x: width * (0.15 + Math.random() * 0.7), y: height * (0.15 + Math.random() * 0.5), height };
  return { x: (e.clientX - box.left) / scale, y: (e.clientY - box.top) / scale, height };
}

const isPress = (e: React.KeyboardEvent) => e.key === "Enter" || e.key === " ";

// ---------- Loves me, loves me not ----------

// An odd number of petals, so the last one is always "loves me".
const PETALS = 9;

export function LovesMeNot({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const [plucked, setPlucked] = useState<boolean[]>(() => Array(PETALS).fill(false));
  const count = plucked.filter(Boolean).length;

  const pluck = (i: number) => {
    if (plucked[i] || won) return;
    const next = plucked.map((p, j) => (j === i ? true : p));
    setPlucked(next);
    sfx(next.filter(Boolean).length % 2 ? "pop" : "boing");
    if (next.every(Boolean)) onWin();
  };

  const verdict = count === 0 ? text("petalStart") : count % 2 === 1 ? text("lovesMe") : text("lovesMeNot");
  return (
    <div className="flex flex-col items-center gap-2">
      <p key={count} className="h-9 animate-pop font-display text-2xl font-semibold italic">
        {verdict}
      </p>
      <svg viewBox="-110 -110 220 260" className="h-72 w-60 overflow-visible">
        <path d="M0 20 C 6 70, -8 100, 2 150" stroke="#5f8a4e" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M2 95 C 30 80, 45 92, 52 100 C 30 108, 14 104, 2 95Z" fill="#6f9a5a" />
        {plucked.map((gone, i) => (
          <g key={i} transform={`rotate(${(360 / PETALS) * i})`}>
            <ellipse
              data-petal={gone ? undefined : i}
              role="button"
              tabIndex={gone ? -1 : 0}
              aria-label={gone ? "Plucked petal" : "Pluck this petal"}
              onClick={() => pluck(i)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pluck(i)}
              cx="0"
              cy="-56"
              rx="17"
              ry="40"
              fill="#ffffff"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1.5"
              className="cursor-pointer outline-none transition-[transform,opacity] duration-700 ease-out hover:brightness-95 focus-visible:stroke-[var(--c-accent)]"
              style={{ transform: gone ? "translateY(-140px) rotate(25deg)" : "none", opacity: gone ? 0 : 1, pointerEvents: gone ? "none" : "auto" }}
            />
          </g>
        ))}
        <circle r="26" fill="#efc65c" stroke="#d3a43c" strokeWidth="2.5" />
        <circle r="26" fill="url(#seeds)" opacity="0.35" />
        <defs>
          <pattern id="seeds" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1.6" fill="#a86b00" />
          </pattern>
        </defs>
      </svg>
      <p className="text-sm font-semibold opacity-70">{won ? text("petalsDone") : text("petalsLeft", { n: PETALS - count })}</p>
    </div>
  );
}

// ---------- Whack the ghosts ----------

const GHOST_TARGET = 8;
type Ghost = { id: number; cell: number };

export function WhackGhosts({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const reduced = useReducedMotion();
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [booed, setBooed] = useState<{ id: number; cell: number }[]>([]);
  const [score, setScore] = useState(0);
  const hits = useRef(0);
  const nextId = useRef(0);

  useEffect(() => {
    if (won) return;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let last = -1;
    const spawn = () => {
      let cell = Math.floor(Math.random() * 9);
      if (cell === last) cell = (cell + 4) % 9;
      last = cell;
      const id = nextId.current++;
      setGhosts((g) => [...g, { id, cell }]);
      const t = setTimeout(() => {
        setGhosts((g) => g.filter((x) => x.id !== id));
        timers.delete(t);
      }, 1150);
      timers.add(t);
    };
    spawn();
    const interval = setInterval(spawn, 700);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, [won]);

  const whack = (ghost: Ghost) => {
    if (won) return;
    setGhosts((g) => g.filter((x) => x.id !== ghost.id));
    setBooed((b) => [...b, ghost]);
    setTimeout(() => setBooed((b) => b.filter((x) => x.id !== ghost.id)), 600);
    sfx("pop");
    hits.current += 1;
    setScore(hits.current);
    if (hits.current === GHOST_TARGET) onWin();
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-center gap-2 font-display text-lg font-semibold">
        {Math.min(score, GHOST_TARGET)} / {GHOST_TARGET} <GhostSprite className="h-6 w-5" />
      </div>
      {/* Keyboard players press Enter or Space to whack whichever ghost is up. */}
      <div
        tabIndex={0}
        aria-label="Ghost garden. Press Enter or Space to whack a ghost."
        onKeyDown={(e) => {
          if (!isPress(e)) return;
          e.preventDefault();
          if (ghosts[0]) whack(ghosts[0]);
        }}
        className={`${PANEL} ${FOCUS} grid grid-cols-3 gap-2 bg-[linear-gradient(180deg,#1f1d30_0%,#121120_100%)] p-3`}
      >
        {Array.from({ length: 9 }, (_, cell) => {
          const ghost = ghosts.find((g) => g.cell === cell);
          const boo = booed.find((b) => b.cell === cell);
          return (
            <div key={cell} className="relative h-20 overflow-hidden rounded-2xl bg-white/5 @2xl:h-24">
              {ghost && !won && (
                <button
                  data-whack
                  aria-label="Whack the ghost"
                  onPointerDown={() => whack(ghost)}
                  className={`absolute inset-x-0 bottom-3 mx-auto w-fit leading-none ${reduced ? "" : "animate-ghost"}`}
                >
                  <GhostSprite className="h-14 w-12 drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]" />
                </button>
              )}
              {boo && <span className="pointer-events-none absolute inset-0 grid animate-pop place-items-center font-display text-lg font-bold tracking-widest text-[#f3d9a4]">{text("boo")}</span>}
              <span className="pointer-events-none absolute inset-x-2 bottom-0 h-4 rounded-t-full bg-[#2a2839]" />
              <HeadstoneSprite className="pointer-events-none absolute bottom-1 right-1.5 h-6 w-5 opacity-80" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Launch fireworks ----------

const FIREWORK_TARGET = 6;
type Firework = { id: number; x: number; y: number; from: number; tone: number };
const TONES = [
  { spark: "#f2cf7e", glow: "#d4a537" },
  { spark: "#f6e7c8", glow: "#d9bd86" },
  { spark: "#f0b8a4", glow: "#d48a72" },
  { spark: "#ffffff", glow: "#c9d3e6" },
];

export function LaunchFireworks({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [count, setCount] = useState(0);
  const launched = useRef(0);
  const nextId = useRef(0);

  const launch = (e: React.PointerEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    // Read everything from the event now: React clears currentTarget once the handler returns.
    const { x, y: tapY, height } = tapPoint(e);
    const y = Math.min(tapY, height - 40);
    const id = nextId.current++;
    const firework = { id, x, y, from: height - y, tone: id % TONES.length };
    setFireworks((f) => [...f, firework]);
    setTimeout(() => setFireworks((f) => f.filter((w) => w.id !== id)), 1700);
    sfx("whoosh");
    setTimeout(() => sfx("boom"), 450);
    if (won) return;
    launched.current += 1;
    setCount(launched.current);
    if (launched.current === FIREWORK_TARGET) setTimeout(onWin, 500);
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-center gap-2 font-display text-lg font-semibold">
        {Math.min(count, FIREWORK_TARGET)} / {FIREWORK_TARGET} <StarSprite className="h-5 w-5" />
      </div>
      <div
        data-sky
        role="button"
        tabIndex={0}
        aria-label="Launch a firework"
        onPointerDown={launch}
        onKeyDown={(e) => {
          if (!isPress(e)) return;
          e.preventDefault();
          launch(e);
        }}
        className={`${PANEL} ${FOCUS} h-72 cursor-crosshair touch-none bg-[radial-gradient(circle_at_50%_120%,#24345e_0%,#0e1730_55%,#060a17_100%)] @2xl:h-96`}
      >
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className="absolute h-0.5 w-0.5 rounded-full bg-white/70" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 70}%` }} />
        ))}
        {fireworks.map((f) => {
          const { spark, glow } = TONES[f.tone];
          return (
            <span key={f.id} className="pointer-events-none absolute" style={{ left: f.x, top: f.y }}>
              <span
                className="absolute h-4 w-1 animate-rocket rounded-full"
                style={{ background: spark, boxShadow: `0 0 8px ${glow}`, "--from": `${f.from}px` } as React.CSSProperties}
              />
              <span
                className="absolute h-16 w-16 animate-burst rounded-full opacity-0 blur-md [animation-delay:450ms]"
                style={{ background: `color-mix(in srgb, ${glow} 70%, transparent)`, "--dx": "0px", "--dy": "0px" } as React.CSSProperties}
              />
              {Array.from({ length: 28 }, (_, i) => {
                // Two rings of sparks, the inner one smaller and paler.
                const outer = i < 18;
                const a = (i / (outer ? 18 : 10)) * Math.PI * 2 + (outer ? 0 : 0.3);
                const r = outer ? 78 : 42;
                return (
                  <span
                    key={i}
                    className={`absolute animate-burst rounded-full opacity-0 [animation-delay:450ms] ${outer ? "h-2 w-2" : "h-1.5 w-1.5"}`}
                    style={
                      {
                        background: outer ? spark : `color-mix(in srgb, ${spark} 45%, white)`,
                        boxShadow: `0 0 10px 1px ${glow}`,
                        "--dx": `${Math.cos(a) * r}px`,
                        "--dy": `${Math.sin(a) * r + 12}px`,
                      } as React.CSSProperties
                    }
                  />
                );
              })}
            </span>
          );
        })}
        {count === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center font-display text-lg font-semibold text-white/80">{text("skyTap")}</p>
        )}
      </div>
    </div>
  );
}

// ---------- Release the lanterns ----------

const LANTERNS = 5;

function LanternShape({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 40 56" className="h-full w-full">
      <defs>
        <radialGradient id="lantern-glow" cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="45%" stopColor="#f2c46c" />
          <stop offset="100%" stopColor="#c47f35" />
        </radialGradient>
      </defs>
      <path d="M8 6 H32 L37 44 Q20 50 3 44 Z" fill={lit ? "url(#lantern-glow)" : "#cdb48a"} />
      <path d="M8 6 H32" stroke="#5a4026" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 8 L12 44 M26 8 L28 44" stroke="rgba(90,64,38,0.35)" strokeWidth="1.2" />
      <path d="M17 48 Q20 54 23 48" fill={lit ? "#f2c46c" : "#6b4c2c"} />
    </svg>
  );
}

export function ReleaseLanterns({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const [released, setReleased] = useState<boolean[]>(() => Array(LANTERNS).fill(false));

  const release = (i: number) => {
    if (released[i] || won) return;
    const next = released.map((r, j) => (j === i ? true : r));
    setReleased(next);
    sfx("chime");
    if (next.every(Boolean)) setTimeout(onWin, 900);
  };

  return (
    <div className={`${PANEL} h-80 bg-[linear-gradient(180deg,#0a1230_0%,#17213f_55%,#3b3150_100%)]`}>
      {Array.from({ length: 22 }, (_, i) => (
        <span key={i} className="absolute h-1 w-1 animate-pulse rounded-full bg-white/70" style={{ left: `${(i * 41) % 100}%`, top: `${(i * 17) % 60}%`, animationDelay: `${i * 0.3}s` }} />
      ))}
      <div className="absolute inset-x-0 bottom-4 flex items-end justify-center gap-3">
        {released.map((up, i) => (
          <button
            key={i}
            data-lantern={up ? undefined : i}
            aria-label={up ? "Lantern released" : "Release this lantern"}
            onClick={() => release(i)}
            className={`relative h-16 w-12 ${up ? "animate-lantern" : "hover:-translate-y-1"} transition`}
            style={{ animationDelay: up ? "0s" : undefined }}
          >
            {up && <span className="absolute inset-0 rounded-full bg-amber-300/50 blur-xl" />}
            <LanternShape lit={up} />
          </button>
        ))}
      </div>
      {!released.some(Boolean) && (
        <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center font-display text-lg font-semibold text-white/85">{text("lanternTap")}</p>
      )}
    </div>
  );
}

// ---------- Bubble wrap ----------

const BUBBLES = 20;

export function BubbleWrap({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const [popped, setPopped] = useState<boolean[]>(() => Array(BUBBLES).fill(false));
  const state = useRef(popped);
  const pressing = useRef(false);

  const pop = (i: number) => {
    if (state.current[i] || won) return;
    state.current = state.current.map((p, j) => (j === i ? true : p));
    setPopped(state.current);
    sfx("pop");
    if (state.current.every(Boolean)) onWin();
  };

  // Popping by dragging a finger across, which a plain click handler can't do on touch screens.
  const popUnder = (e: React.PointerEvent) => {
    if (!pressing.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const i = el?.dataset.bubble;
    if (i !== undefined) pop(Number(i));
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-center font-display text-lg font-semibold">
        {text("bubblesScore", { i: popped.filter(Boolean).length, n: BUBBLES })}
      </div>
      <div
        onPointerDown={(e) => {
          pressing.current = true;
          popUnder(e);
        }}
        onPointerMove={popUnder}
        onPointerUp={() => (pressing.current = false)}
        onPointerLeave={() => (pressing.current = false)}
        className={`${PANEL} mx-auto grid max-w-sm touch-none grid-cols-5 gap-2 bg-[#ece8df] p-3`}
      >
        {popped.map((p, i) => (
          <button
            key={i}
            data-bubble={i}
            aria-label={p ? "Popped" : "Pop this bubble"}
            onClick={() => pop(i)}
            className={`aspect-square rounded-full transition duration-150 ${
              p
                ? "scale-75 bg-black/[0.06] shadow-inner"
                : "bg-[radial-gradient(circle_at_32%_30%,#ffffff_0%,#ffffff_16%,rgba(255,255,255,0.8)_38%,rgba(214,217,224,0.9)_100%)] shadow-[inset_0_-3px_6px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.14)] ring-1 ring-black/10 hover:scale-105"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Piñata ----------

const PINATA_HITS = 8;
// Foil pieces that burst out when it breaks.
const FOIL = Array.from({ length: 16 }, (_, i) => ({
  color: ["var(--c-accent)", "var(--c-muted)", "#e9d8b4", "#f3efe6"][i % 4],
  round: i % 3 === 0,
  turn: (i * 47) % 180,
}));

export function Pinata({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const [hits, setHits] = useState(0);

  const hit = () => {
    if (won) return;
    const next = hits + 1;
    setHits(next);
    sfx(next === PINATA_HITS ? "boom" : "stamp");
    if (next === PINATA_HITS) onWin();
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="relative flex h-72 w-full justify-center">
        <span className="absolute top-0 h-12 w-0.5 bg-current opacity-40" />
        {won ? (
          <div className="relative mt-24">
            {FOIL.map((f, i) => {
              const a = (i / FOIL.length) * Math.PI * 2;
              return (
                <span
                  key={i}
                  className={`absolute animate-burst ${f.round ? "h-3 w-3 rounded-full" : "h-4 w-2 rounded-[1px]"}`}
                  style={
                    {
                      background: f.color,
                      rotate: `${f.turn}deg`,
                      "--dx": `${Math.cos(a) * (100 + (i % 3) * 20)}px`,
                      "--dy": `${Math.sin(a) * 90 + 60}px`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
            <StarSprite className="block h-20 w-20 animate-pop" />
          </div>
        ) : (
          <button
            data-pinata
            aria-label="Hit the piñata"
            onClick={hit}
            className="absolute top-10 origin-top animate-swing leading-none"
          >
            <span key={hits} className={`block ${hits ? "animate-shake" : ""}`} style={{ transform: `rotate(${hits * 4}deg)` }}>
              <PinataSprite className="h-36 w-32 drop-shadow-md" />
            </span>
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: PINATA_HITS }, (_, i) => (
          <span key={i} className={`h-2.5 w-5 rounded-full transition ${i < hits ? "bg-[var(--c-accent)]" : "bg-current opacity-20"}`} />
        ))}
      </div>
    </div>
  );
}

// ---------- Grow a flower ----------

const STAGES = 5;

function Plant({ stage }: { stage: number }) {
  const stem = [0, 22, 48, 72, 84, 90][stage];
  return (
    <svg viewBox="0 0 200 220" className="h-full w-full overflow-visible">
      {/* Stem and leaves */}
      {stage > 0 && (
        <>
          <path d={`M100 160 L100 ${160 - stem}`} stroke="#5f8a4e" strokeWidth="6" strokeLinecap="round" className="transition-all duration-700" />
          <path d="M100 150 C 80 140, 70 128, 72 120 C 88 122, 98 134, 100 150Z" fill="#6f9a5a" className="origin-[100px_150px] animate-pop" />
          {stage > 1 && <path d="M100 130 C 120 120, 132 108, 128 100 C 112 104, 102 116, 100 130Z" fill="#7aa564" className="origin-[100px_130px] animate-pop" />}
        </>
      )}
      {/* Bud, then the bloom in the card's own colour */}
      {stage === 3 && <ellipse cx="100" cy={160 - stem} rx="9" ry="14" fill="#5f8a4e" className="animate-pop" />}
      {stage >= 4 && (
        <g transform={`translate(100 ${160 - stem})`}>
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx="0"
              cy={stage === 5 ? -24 : -12}
              rx={stage === 5 ? 13 : 7}
              ry={stage === 5 ? 24 : 12}
              transform={`rotate(${i * 45})`}
              style={{ fill: "var(--c-accent)" }}
              className="transition-all duration-700"
              opacity={0.92}
            />
          ))}
          <circle r={stage === 5 ? 14 : 8} fill="#e3b950" className="transition-all duration-700" />
        </g>
      )}
      {/* Pot */}
      <path d="M58 160 H142 L132 214 H68 Z" fill="#b5643c" />
      <rect x="52" y="152" width="96" height="16" rx="4" fill="#c97a4f" />
      <ellipse cx="100" cy="155" rx="42" ry="4" fill="#4a3324" />
      {stage === 0 && <ellipse cx="100" cy="152" rx="6" ry="3.5" fill="#7a5235" />}
    </svg>
  );
}

export function GrowFlower({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const [stage, setStage] = useState(0);
  const [drops, setDrops] = useState(0);

  const water = () => {
    if (won) return;
    const next = Math.min(stage + 1, STAGES);
    setStage(next);
    setDrops((d) => d + 1);
    sfx(next === STAGES ? "sparkle" : "tap");
    if (next === STAGES) onWin();
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button aria-label="Water the plant" onClick={water} className="relative h-64 w-56">
        {drops > 0 && !won && (
          <span key={drops} className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
            {[-18, 0, 18].map((x, i) => (
              <DropSprite key={i} className="absolute h-6 w-4 animate-drip" style={{ left: x, animationDelay: `${i * 90}ms` }} />
            ))}
          </span>
        )}
        <Plant stage={stage} />
        {won && <StarSprite className="absolute -right-2 top-6 h-10 w-10 animate-pop" />}
      </button>
      {!won && (
        <button
          data-water
          onClick={water}
          className="rounded-full bg-[var(--c-accent)] px-6 py-3 font-display font-semibold text-[var(--c-accent-text)] shadow-lg active:scale-95"
        >
          {text("waterIt", { i: stage, n: STAGES })}
        </button>
      )}
    </div>
  );
}

// ---------- Throw colours (Holi) ----------

const SPLAT_TARGET = 12;
// Gulal shades: deep pinks, saffron, turmeric, leaf, indigo, violet, teal.
const SPLAT_COLORS = ["#c2185b", "#e8891c", "#e2b31f", "#2e8b57", "#3949ab", "#7b3f9e", "#138a8a"];
type Splat = { id: number; x: number; y: number; color: string; size: number; shape: string; rot: number };

export function ThrowColours({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const [splats, setSplats] = useState<Splat[]>([]);
  const count = useRef(0);
  const nextId = useRef(0);

  const throwAt = (e: React.PointerEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    const { x, y } = tapPoint(e);
    const id = nextId.current++;
    const r = () => 35 + Math.floor(Math.random() * 30);
    const splat = {
      id,
      x,
      y,
      color: SPLAT_COLORS[id % SPLAT_COLORS.length],
      size: 70 + Math.random() * 60,
      shape: `${r()}% ${r()}% ${r()}% ${r()}% / ${r()}% ${r()}% ${r()}% ${r()}%`,
      rot: Math.random() * 360,
    };
    setSplats((s) => [...s.slice(-40), splat]);
    sfx("pop");
    if (won) return;
    count.current += 1;
    if (count.current === SPLAT_TARGET) onWin();
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-center font-display text-lg font-semibold">
        {Math.min(splats.length, SPLAT_TARGET)} / {SPLAT_TARGET}
      </div>
      <div
        data-splat
        role="button"
        tabIndex={0}
        aria-label="Throw some colour"
        onPointerDown={throwAt}
        onKeyDown={(e) => {
          if (!isPress(e)) return;
          e.preventDefault();
          throwAt(e);
        }}
        className={`${PANEL} ${FOCUS} h-72 cursor-pointer touch-none bg-[#fbf8f2] @2xl:h-96`}
      >
        {splats.map((s) => (
          <span
            key={s.id}
            className="pointer-events-none absolute animate-pop"
            style={{ left: s.x - s.size / 2, top: s.y - s.size / 2, width: s.size, height: s.size, transform: `rotate(${s.rot}deg)` }}
          >
            <span className="absolute inset-0 opacity-85 blur-[2px]" style={{ background: s.color, borderRadius: s.shape }} />
            {[0, 1, 2, 3].map((k) => (
              <span
                key={k}
                className="absolute h-3 w-3 rounded-full"
                style={{ background: s.color, left: `${50 + Math.cos(k * 1.7 + s.rot) * 62}%`, top: `${50 + Math.sin(k * 1.7 + s.rot) * 62}%` }}
              />
            ))}
          </span>
        ))}
        {splats.length === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center font-display text-lg font-semibold text-neutral-500">{text("colourTap")}</p>
        )}
      </div>
    </div>
  );
}

// ---------- Slot machine ----------

// Rigged, kindly: the third pull is always the jackpot.
export function SlotMachine({ onWin, won, symbols }: GameProps & { symbols: IconName[] }) {
  const sfx = useSfx();
  const { text } = useWords();
  const [reels, setReels] = useState([symbols[1], symbols[2], symbols[3]]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [pulls, setPulls] = useState(0);
  const stopped = useRef([true, true, true]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const busy = spinning.some(Boolean);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearInterval(ticker.current);
    },
    [],
  );

  const pull = () => {
    if (busy || won) return;
    const n = pulls + 1;
    setPulls(n);
    const at = (k: number) => symbols[k % symbols.length];
    const final = n >= 3 ? [symbols[0], symbols[0], symbols[0]] : n === 2 ? [at(n + 1), at(n + 1), at(n + 3)] : [at(1), at(2), at(4)];
    stopped.current = [false, false, false];
    setSpinning([true, true, true]);
    sfx("whoosh");
    ticker.current = setInterval(() => {
      const shuffle = stopped.current.map((done) => (done ? null : symbols[Math.floor(Math.random() * symbols.length)]));
      setReels((r) => r.map((s, i) => shuffle[i] ?? s));
      sfx("tick");
    }, 80);
    final.forEach((sym, i) => {
      const t = setTimeout(
        () => {
          stopped.current[i] = true;
          setSpinning(stopped.current.map((done) => !done));
          setReels((r) => r.map((s, j) => (j === i ? sym : s)));
          sfx("stamp");
          if (i === 2) {
            clearInterval(ticker.current);
            if (n >= 3) onWin();
          }
        },
        700 + i * 350,
      );
      timers.current.push(t);
    });
  };

  const message = won ? text("slotWin") : busy ? text("spinning") : pulls === 0 ? text("slotStart") : pulls === 1 ? text("slotMiss") : text("slotClose");
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="h-8 font-display text-2xl font-bold">{message}</p>
      <div className="rounded-[2rem] bg-[var(--c-accent)] p-3 shadow-xl">
        <div className="flex gap-2 rounded-3xl bg-[#fbf8f2] p-3 shadow-inner">
          {reels.map((s, i) => (
            <div key={i} className="grid h-24 w-20 place-items-center overflow-hidden rounded-2xl bg-white text-[var(--c-accent)] ring-1 ring-black/10 @2xl:h-28 @2xl:w-24">
              <span className={`block h-12 w-12 @2xl:h-14 @2xl:w-14 ${spinning[i] ? "translate-y-1 blur-[1.5px]" : won ? "animate-pop" : ""}`}>
                <GameIcon name={s} className="h-full w-full" />
              </span>
            </div>
          ))}
        </div>
      </div>
      {!won && (
        <button
          data-pull
          onClick={pull}
          disabled={busy}
          className="rounded-full bg-[var(--c-accent)] px-8 py-3.5 font-display text-lg font-semibold text-[var(--c-accent-text)] shadow-lg transition active:scale-95 disabled:opacity-60"
        >
          {text("slotPull")}
        </button>
      )}
    </div>
  );
}

// ---------- Hold to send a hug ----------

const HUG_MS = 2600;

export function HoldHug({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const { text } = useWords();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const value = useRef(0);
  const winRef = useRef(onWin);
  useEffect(() => {
    winRef.current = onWin;
  });

  useEffect(() => {
    if (won) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const before = value.current;
      value.current = holding ? Math.min(1, before + dt / HUG_MS) : Math.max(0, before - dt / 4000);
      if (value.current !== before) setProgress(value.current);
      if (value.current >= 1) {
        winRef.current();
        return;
      }
      if (holding || value.current > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [holding, won]);

  useEffect(() => {
    if (!holding || won) return;
    sfx("chime");
    const t = setInterval(() => sfx("tick"), 260);
    return () => clearInterval(t);
  }, [holding, won, sfx]);

  const r = 88;
  const circumference = 2 * Math.PI * r;
  const shown = won ? 1 : progress;
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative grid h-56 w-56 place-items-center">
        <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
          <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="12" />
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            style={{ stroke: "var(--c-accent)" }}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - shown)}
          />
        </svg>
        <button
          data-hold
          aria-label="Press and hold to send a hug"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setHolding(true);
          }}
          onPointerUp={() => setHolding(false)}
          onPointerCancel={() => setHolding(false)}
          onKeyDown={(e) => {
            if (e.key !== " " && e.key !== "Enter") return;
            e.preventDefault();
            setHolding(true);
          }}
          onKeyUp={() => setHolding(false)}
          onContextMenu={(e) => e.preventDefault()}
          disabled={won}
          className="grid h-40 w-40 touch-none select-none place-items-center rounded-full bg-[var(--c-secondary)] shadow-xl ring-1 ring-black/10 [-webkit-touch-callout:none]"
        >
          <span className={`block transition-transform ${won ? "animate-pop" : ""}`} style={{ transform: won ? undefined : `scale(${1 + shown * 0.5})` }}>
            {won ? <HeartMark className="h-20 w-20 text-[var(--c-accent)]" /> : <HeartSprite className="h-16 w-16" />}
          </span>
        </button>
      </div>
      <p className="font-display text-lg font-semibold">{won ? text("hugDone") : holding ? text("hugHolding") : progress > 0 ? text("hugLetGo") : text("hugStart")}</p>
    </div>
  );
}
