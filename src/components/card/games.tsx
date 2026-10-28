"use client";

import { useEffect, useRef, useState } from "react";
import type { Game, Occasion } from "@/lib/card";
import { useReducedMotion } from "./effects";
import { useWords } from "./words";
import {
  BubbleWrap,
  type GameProps,
  GrowFlower,
  HoldHug,
  LaunchFireworks,
  LovesMeNot,
  Pinata,
  ReleaseLanterns,
  SlotMachine,
  ThrowColours,
  WhackGhosts,
} from "./more-games";
import { Motif } from "./motifs";
import { HeartMark, Laurel } from "./ornaments";
import { useSfx } from "./sound";
import { USUAL_GOAL, useTune } from "./tune";
import { BalloonSprite, GameIcon, GiftSprite, HeartSprite, OCCASION_ICONS, SnowflakeSprite, StarSprite, SweetSprite } from "./sprites";

export function GameView({ game, occasion, ...props }: GameProps & { game: Game; occasion: Occasion }) {
  switch (game) {
    case "light-diyas":
      return <LightDiyas {...props} />;
    case "blow-candles":
      return <BlowCandles {...props} />;
    case "memory-match":
      return <MemoryMatch {...props} occasion={occasion} />;
    case "unwrap-gift":
      return <UnwrapGift {...props} />;
    case "shake-it":
      return <ShakeIt {...props} occasion={occasion} />;
    case "cursor-chase":
      return <CursorChase {...props} />;
    case "loves-me-not":
      return <LovesMeNot {...props} />;
    case "whack-ghosts":
      return <WhackGhosts {...props} />;
    case "launch-fireworks":
      return <LaunchFireworks {...props} />;
    case "release-lanterns":
      return <ReleaseLanterns {...props} />;
    case "bubble-wrap":
      return <BubbleWrap {...props} />;
    case "pinata":
      return <Pinata {...props} />;
    case "grow-flower":
      return <GrowFlower {...props} />;
    case "throw-colours":
      return <ThrowColours {...props} />;
    case "slot-machine":
      return <SlotMachine {...props} symbols={OCCASION_ICONS[occasion]} />;
    case "hold-hug":
      return <HoldHug {...props} />;
    default:
      return <Catcher {...props} kind={game} />;
  }
}

const TARGET = USUAL_GOAL["catch-hearts"];

// Balloons and sweets take turns between the card's colours.
const TINTS = ["var(--c-accent)", "var(--c-muted)", "color-mix(in srgb, var(--c-accent) 55%, white)"];

// "Catch the falling things" games share one engine with different pieces.
const CATCHERS: Record<string, { piece: (id: number) => React.ReactNode; icon: React.ReactNode; rise?: boolean }> = {
  "catch-hearts": { piece: (id) => <HeartSprite className={id % 3 ? "h-11 w-11" : "h-8 w-8"} />, icon: <HeartSprite className="h-5 w-5" /> },
  "pop-balloons": { piece: (id) => <BalloonSprite className="h-16 w-10" tint={TINTS[id % TINTS.length]} />, icon: <BalloonSprite className="h-6 w-4" />, rise: true },
  "catch-snowflakes": {
    piece: (id) => <SnowflakeSprite className={`opacity-85 ${id % 2 ? "h-10 w-10" : "h-8 w-8"}`} />,
    icon: <SnowflakeSprite className="h-5 w-5 text-[var(--c-muted)]" />,
  },
  "catch-stars": { piece: (id) => <StarSprite className={id % 2 ? "h-11 w-11" : "h-8 w-8"} />, icon: <StarSprite className="h-5 w-5" /> },
  "catch-candy": { piece: (id) => <SweetSprite className="h-8 w-12" tint={TINTS[id % TINTS.length]} />, icon: <SweetSprite className="h-4 w-6" /> },
};

type Drop = { id: number; left: number; top: number; duration: number };

// How a piece moves for each direction it can come from (style.tune.from).
const MOVES = {
  top: "top-[-15%] animate-fall",
  bottom: "bottom-[-15%] animate-rise",
  left: "left-[-15%] animate-cross-right",
  right: "left-full animate-cross-left",
  everywhere: "animate-bloom",
} as const;

function Catcher({ onWin, won, kind }: GameProps & { kind: string }) {
  const config = CATCHERS[kind] ?? CATCHERS["catch-hearts"];
  const sfx = useSfx();
  const tune = useTune();
  const target = tune.goal(TARGET);
  const from = tune.from ?? (config.rise ? "bottom" : "top");
  const across = from === "left" || from === "right";
  // With animations switched off, things sit still for a moment instead of falling.
  const still = useReducedMotion();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [score, setScore] = useState(0);
  // Counted in a ref so rapid taps between renders are never lost.
  const caught = useRef(0);
  const [pops, setPops] = useState<{ id: number; x: number; y: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (won) return;
    const spawn = () => {
      const id = nextId.current++;
      setDrops((d) => [...d, { id, left: 6 + Math.random() * 80, top: 6 + Math.random() * 74, duration: (3.2 + Math.random() * 1.8) / tune.speed }]);
    };
    spawn();
    const t = setInterval(spawn, 650 / tune.speed);
    return () => clearInterval(t);
  }, [won, tune.speed]);

  useEffect(() => {
    if (!still) return;
    const t = setInterval(() => setDrops((d) => d.slice(-5)), 650);
    return () => clearInterval(t);
  }, [still]);

  const grab = (drop: Drop, e: React.PointerEvent) => {
    if (won) return;
    const box = e.currentTarget.parentElement!.getBoundingClientRect();
    setPops((p) => [...p, { id: drop.id, x: e.clientX - box.left, y: e.clientY - box.top }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== drop.id)), 600);
    setDrops((d) => d.filter((x) => x.id !== drop.id));
    sfx("pop");
    caught.current += 1;
    setScore(caught.current);
    if (caught.current === target) onWin();
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-center gap-2 font-display text-lg font-semibold">
        {Math.min(score, target)} / {target} {config.icon}
      </div>
      <div className="relative h-72 w-full touch-none select-none overflow-hidden rounded-3xl bg-[var(--c-secondary)]/40 ring-1 ring-black/5">
        {drops.map((d) => (
          <button
            key={d.id}
            data-catchable
            aria-label="Catch it"
            onPointerDown={(e) => grab(d, e)}
            onAnimationEnd={() => !still && setDrops((all) => all.filter((x) => x.id !== d.id))}
            className={`absolute p-2 leading-none drop-shadow-sm ${still ? "" : MOVES[from]}`}
            style={{
              left: across && !still ? undefined : `${d.left}%`,
              top: still ? `${10 + ((d.id * 37) % 70)}%` : across || from === "everywhere" ? `${d.top}%` : undefined,
              animationDuration: `${d.duration}s`,
            }}
          >
            <span className="inline-block" style={{ scale: tune.size }}>
              {config.piece(d.id)}
            </span>
          </button>
        ))}
        {pops.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute animate-pop-fade font-display text-xl font-bold text-[var(--c-accent)]"
            style={{ left: p.x, top: p.y }}
          >
            {config.rise ? "pop!" : "+1"}
          </span>
        ))}
      </div>
    </div>
  );
}

const DIYAS = USUAL_GOAL["light-diyas"];

function LightDiyas({ onWin, won }: GameProps) {
  const tune = useTune();
  const total = tune.goal(DIYAS, 12);
  const sfx = useSfx();
  const { text } = useWords();
  const [lit, setLit] = useState<boolean[]>(() => Array(total).fill(false));

  const light = (i: number) => {
    if (lit[i] || won) return;
    const next = lit.map((v, j) => (j === i ? true : v));
    setLit(next);
    sfx("chime");
    if (next.every(Boolean)) onWin();
  };

  return (
    <div className="flex flex-wrap items-end justify-center gap-2 py-6">
      {lit.map((on, i) => (
        <button
          key={i}
          aria-label={on ? "Lit diya" : "Light this diya"}
          onClick={() => light(i)}
          className="group relative flex h-24 w-14 flex-col items-center justify-end"
        >
          {on && <span className="absolute bottom-5 h-14 w-14 rounded-full bg-amber-300/40 blur-xl" />}
          <svg viewBox="0 0 64 90" className="relative h-full w-full">
            {on ? (
              <g className="origin-[32px_52px] animate-flicker">
                <path d="M32 18 C40 34 42 44 32 54 C22 44 24 34 32 18Z" fill="#ffb703" />
                <path d="M32 30 C36 39 37 45 32 52 C27 45 28 39 32 30Z" fill="#fff3b0" />
              </g>
            ) : (
              <line x1="32" y1="48" x2="32" y2="56" stroke="#6b4423" strokeWidth="3" strokeLinecap="round" />
            )}
            <path d="M4 58 Q32 96 60 58 Q32 66 4 58Z" fill={on ? "#e76f51" : "#9c5a3c"} />
            <path d="M4 58 Q32 66 60 58" fill="none" stroke={on ? "#f4a261" : "#7a4630"} strokeWidth="3" />
            <circle cx="20" cy="70" r="2.5" fill="#ffd166" opacity={on ? 1 : 0.4} />
            <circle cx="32" cy="74" r="2.5" fill="#ffd166" opacity={on ? 1 : 0.4} />
            <circle cx="44" cy="70" r="2.5" fill="#ffd166" opacity={on ? 1 : 0.4} />
          </svg>
          {!on && !won && <span className="absolute -top-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50">{text("diyaTap")}</span>}
        </button>
      ))}
    </div>
  );
}

const CANDLES = USUAL_GOAL["blow-candles"];
// Ivory wax with a fine gold twist.
const WAX =
  "repeating-linear-gradient(-35deg, transparent 0 5px, color-mix(in srgb, var(--c-muted) 55%, transparent) 5px 6.5px), linear-gradient(90deg, #e9dfcb 0%, #fbf7ef 45%, #e2d5bc 100%)";

function BlowCandles({ onWin, won }: GameProps) {
  const tune = useTune();
  const total = tune.goal(CANDLES, 12);
  const sfx = useSfx();
  const [out, setOut] = useState<boolean[]>(() => Array(total).fill(false));

  const blow = (i: number) => {
    if (out[i] || won) return;
    const next = out.map((v, j) => (j === i ? true : v));
    setOut(next);
    sfx("whoosh");
    if (next.every(Boolean)) onWin();
  };

  return (
    <div className="flex flex-col items-center py-4">
      <div className="flex gap-5">
        {out.map((isOut, i) => (
          <button
            key={i}
            aria-label={isOut ? "Candle blown out" : "Blow out this candle"}
            onClick={() => blow(i)}
            className="relative flex h-24 w-8 flex-col items-center justify-end"
          >
            {isOut ? (
              <svg viewBox="0 0 20 40" className="absolute top-0 h-10 w-5 animate-smoke" aria-hidden fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round">
                <path d="M10 38c-4-5 4-9 0-14s4-9 0-14-2-6 1-8" />
              </svg>
            ) : (
              <span className="absolute top-1 h-7 w-4 origin-bottom animate-flicker rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-t from-amber-500 via-amber-200 to-white shadow-[0_0_18px_6px_rgba(255,214,140,0.45)]" />
            )}
            <span className="absolute top-8 h-2 w-px bg-neutral-800/70" />
            <span className="h-14 w-3 rounded-[2px] shadow-sm" style={{ background: WAX }} />
          </button>
        ))}
      </div>
      {/* Two tiers of cream icing, trimmed in the card's own colours */}
      <div className="relative h-14 w-56 rounded-t-md bg-[#f6efe3] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
        <div className="absolute inset-x-0 bottom-2 h-2 bg-[var(--c-accent)]" />
        <div className="absolute inset-x-3 bottom-[18px] flex justify-between">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--c-muted)] opacity-70" />
          ))}
        </div>
      </div>
      <div className="relative h-16 w-72 rounded-b-md bg-[#efe5d4] shadow-[inset_0_-8px_12px_rgba(0,0,0,0.07)] ring-1 ring-black/5">
        <div className="absolute inset-x-0 bottom-3 h-2.5 bg-[var(--c-accent)]" />
        <div className="absolute inset-x-0 bottom-[22px] h-px bg-[var(--c-muted)] opacity-60" />
      </div>
      <div className="h-2.5 w-80 rounded-full bg-[var(--c-muted)] opacity-40" />
    </div>
  );
}

// A fixed shuffle keeps server and browser renders identical.
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  let seed = 42;
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function MemoryMatch({ onWin, won, occasion }: GameProps & { occasion: Occasion }) {
  const sfx = useSfx();
  const { text } = useWords();
  // As many pairs as asked for (style.tune.goal), up to the occasion's set of pictures.
  const pairs = useTune().goal(OCCASION_ICONS[occasion].length, OCCASION_ICONS[occasion].length);
  const [deck] = useState(() => shuffled([...OCCASION_ICONS[occasion].slice(0, pairs), ...OCCASION_ICONS[occasion].slice(0, pairs)]));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const busy = open.length === 2;

  const flip = (i: number) => {
    if (won || busy || open.includes(i) || matched.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return sfx("tap");
    setMoves((m) => m + 1);
    if (deck[next[0]] === deck[next[1]]) {
      sfx("chime");
      const nowMatched = [...matched, ...next];
      setMatched(nowMatched);
      setOpen([]);
      if (nowMatched.length === deck.length) onWin();
    } else {
      setTimeout(() => setOpen([]), 750);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 text-center font-display text-lg font-semibold">
        {text("memoryScore", { i: matched.length / 2, n: deck.length / 2, moves })}
      </div>
      <div className="mx-auto grid max-w-sm grid-cols-4 gap-2.5 @2xl:max-w-lg">
        {deck.map((symbol, i) => {
          const shown = open.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              data-symbol={symbol}
              aria-label={shown ? symbol : "Hidden card"}
              onClick={() => flip(i)}
              className={`relative grid aspect-square place-items-center rounded-xl shadow-sm ring-1 ring-black/10 transition duration-300 ${
                shown ? "bg-[#fbf8f2] text-[var(--c-accent)] [transform:rotateY(0)]" : "bg-[var(--c-accent)] text-[var(--c-accent-text)] [transform:rotateY(180deg)]"
              } ${matched.includes(i) ? "ring-2 ring-[var(--c-muted)]" : ""}`}
            >
              {shown ? (
                <GameIcon name={symbol} className="h-3/5 w-3/5" />
              ) : (
                <>
                  <span aria-hidden className="absolute inset-1.5 rounded-lg border border-current opacity-35" />
                  <svg viewBox="0 0 16 16" className="h-4 w-4 opacity-70" aria-hidden>
                    <path d="M8 1l4 7-4 7-4-7z" fill="currentColor" />
                  </svg>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const UNWRAP_TAPS = USUAL_GOAL["unwrap-gift"];

function UnwrapGift({ onWin, won }: GameProps) {
  const tune = useTune();
  const total = tune.goal(UNWRAP_TAPS, 30);
  const sfx = useSfx();
  const [taps, setTaps] = useState(0);
  const tap = () => {
    if (won) return;
    const next = taps + 1;
    setTaps(next);
    sfx(next === total ? "pop" : "whoosh");
    if (next === total) onWin();
  };
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <button
        aria-label={won ? "Gift unwrapped" : "Tear the wrapping"}
        onClick={tap}
        className="relative grid h-48 w-48 place-items-center"
      >
        {won ? (
          <HeartMark className="h-32 w-32 animate-pop text-[var(--c-accent)]" />
        ) : (
          <span key={taps} className={`block ${taps > 0 ? "animate-shake" : ""}`} style={{ transform: `scale(${1 + taps * 0.05})` }}>
            <GiftSprite className="h-40 w-40 drop-shadow-md" />
          </span>
        )}
      </button>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-2.5 w-6 rounded-full transition ${i < taps ? "bg-[var(--c-accent)]" : "bg-current opacity-20"}`} />
        ))}
      </div>
    </div>
  );
}

type MotionPermission = { requestPermission?: () => Promise<string> };

// Built for phones: shaking fills the meter. Tapping works too, so it never gets stuck.
function ShakeIt({ onWin, won, occasion }: GameProps & { occasion: Occasion }) {
  const sfx = useSfx();
  const { text } = useWords();
  const sfxRef = useRef(sfx);
  const [power, setPower] = useState(0);
  const [mode, setMode] = useState<"idle" | "shake">("idle");
  const total = useRef(0);
  const winRef = useRef(onWin);
  useEffect(() => {
    winRef.current = onWin;
  });

  const add = useRef((amount: number) => {
    if (total.current >= 100) return;
    total.current = Math.min(100, total.current + amount);
    setPower(total.current);
    sfxRef.current("tick");
    if (total.current >= 100) winRef.current();
  });

  useEffect(() => {
    if (mode !== "shake" || won) return;
    let last = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const force = Math.abs(a.x ?? 0) + Math.abs(a.y ?? 0) + Math.abs(a.z ?? 0);
      const now = Date.now();
      if (force > 30 && now - last > 120) {
        last = now;
        add.current(7);
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [mode, won]);

  const start = async () => {
    const motion = (window as unknown as { DeviceMotionEvent?: MotionPermission }).DeviceMotionEvent;
    if (motion && typeof motion.requestPermission === "function") {
      try {
        if ((await motion.requestPermission()) === "granted") setMode("shake");
      } catch {}
    } else if (motion) setMode("shake");
  };

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <span
        key={power}
        className={`grid h-36 w-36 place-items-center rounded-full bg-[#fbf8f2] text-[var(--c-accent)] shadow-md ring-1 ring-black/5 ${power > 0 && !won ? "animate-shake" : ""} ${won ? "animate-pop" : ""}`}
      >
        {won ? <Laurel className="h-20 w-28 text-[var(--c-muted)]" /> : <Motif occasion={occasion} className="h-20 w-20" />}
      </span>
      <div className="h-4 w-full max-w-xs overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[var(--c-accent)] transition-all duration-200" style={{ width: `${power}%` }} />
      </div>
      {!won && (
        <div className="flex flex-col items-center gap-3">
          {mode === "idle" ? (
            <button onClick={start} className="rounded-full bg-[var(--c-accent)] px-6 py-3 font-display font-semibold text-[var(--c-accent-text)] shadow-lg">
              {text("shakeStart")}
            </button>
          ) : (
            <p className="font-display text-lg font-semibold">{text("shaking")}</p>
          )}
          <button onClick={() => add.current(10)} className="text-sm font-semibold underline underline-offset-4 opacity-75">
            {text("shakeTap")}
          </button>
        </div>
      )}
    </div>
  );
}

const CHASE_TARGET = USUAL_GOAL["cursor-chase"];

// Built for a mouse: the heart runs from the cursor. Corner it to catch it.
function CursorChase({ onWin, won }: GameProps) {
  const tune = useTune();
  const total = tune.goal(CHASE_TARGET, 20);
  const sfx = useSfx();
  const { text } = useWords();
  const area = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [caught, setCaught] = useState(0);

  const flee = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || won || !area.current) return;
    const box = area.current.getBoundingClientRect();
    const hx = box.left + (pos.x / 100) * box.width;
    const hy = box.top + (pos.y / 100) * box.height;
    const dx = hx - e.clientX;
    const dy = hy - e.clientY;
    const dist = Math.hypot(dx, dy);
    if (dist > 110 || dist === 0) return;
    const clamp = (v: number) => Math.min(92, Math.max(8, v));
    setPos({
      x: clamp(((hx + (dx / dist) * 70 * tune.speed - box.left) / box.width) * 100),
      y: clamp(((hy + (dy / dist) * 70 * tune.speed - box.top) / box.height) * 100),
    });
  };

  const grab = () => {
    if (won) return;
    const next = caught + 1;
    setCaught(next);
    sfx("pop");
    setPos({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
    if (next === total) onWin();
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-center gap-2 font-display text-lg font-semibold">
        {text("chaseScore", { i: caught, n: total })} <HeartSprite className="h-5 w-5" />
      </div>
      <div
        ref={area}
        onPointerMove={flee}
        className="relative h-72 w-full cursor-crosshair select-none overflow-hidden rounded-3xl bg-[var(--c-secondary)]/40 ring-1 ring-black/5 @2xl:h-96"
      >
        {!won && (
          <button
            aria-label="Catch the heart"
            onClick={grab}
            className="absolute -translate-x-1/2 -translate-y-1/2 p-2 transition-[left,top] duration-150 ease-out"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <HeartSprite className="h-12 w-12 drop-shadow-md" />
          </button>
        )}
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs font-semibold uppercase tracking-widest opacity-50">
          {text("chaseTip")}
        </p>
      </div>
    </div>
  );
}
