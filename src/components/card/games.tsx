"use client";

import { useEffect, useRef, useState } from "react";
import type { Game, Occasion } from "@/lib/card";
import { useReducedMotion } from "./effects";
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
import { useSfx } from "./sound";

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
      return <SlotMachine {...props} symbols={MEMORY_SYMBOLS[occasion]} />;
    case "hold-hug":
      return <HoldHug {...props} />;
    default:
      return <Catcher {...props} kind={game} />;
  }
}

const TARGET = 10;

// "Catch the falling things" games share one engine with different emoji.
const CATCHERS: Record<string, { emojis: string[]; rise?: boolean; icon: string; hue?: boolean }> = {
  "catch-hearts": { emojis: ["💖", "💗", "❤️", "💘"], icon: "💘" },
  "pop-balloons": { emojis: ["🎈"], rise: true, icon: "🎈", hue: true },
  "catch-snowflakes": { emojis: ["❄️", "❅", "❆", "☃️"], icon: "❄️" },
  "catch-stars": { emojis: ["⭐", "🌟", "🌙", "✨"], icon: "🌟" },
  "catch-candy": { emojis: ["🍬", "🍭", "🍫", "🎃"], icon: "🍬" },
};

type Drop = { id: number; left: number; duration: number; emoji: string };

function Catcher({ onWin, won, kind }: GameProps & { kind: string }) {
  const config = CATCHERS[kind] ?? CATCHERS["catch-hearts"];
  const sfx = useSfx();
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
      setDrops((d) => [
        ...d,
        { id, left: 6 + Math.random() * 80, duration: 3.2 + Math.random() * 1.8, emoji: config.emojis[id % config.emojis.length] },
      ]);
    };
    spawn();
    const t = setInterval(spawn, 650);
    return () => clearInterval(t);
  }, [won, config]);

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
    if (caught.current === TARGET) onWin();
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-center font-display text-lg font-semibold">
        {Math.min(score, TARGET)} / {TARGET} {config.icon}
      </div>
      <div className="relative h-72 w-full touch-none select-none overflow-hidden rounded-3xl bg-[var(--c-secondary)]/40 ring-1 ring-black/5">
        {drops.map((d) => (
          <button
            key={d.id}
            data-catchable
            aria-label="Catch it"
            onPointerDown={(e) => grab(d, e)}
            onAnimationEnd={() => !still && setDrops((all) => all.filter((x) => x.id !== d.id))}
            className={`absolute p-2 text-4xl leading-none ${still ? "" : config.rise ? "bottom-[-15%] animate-rise" : "top-[-15%] animate-fall"}`}
            style={{
              left: `${d.left}%`,
              top: still ? `${10 + ((d.id * 37) % 70)}%` : undefined,
              animationDuration: `${d.duration}s`,
              filter: config.hue ? `hue-rotate(${(d.id * 67) % 360}deg)` : undefined,
            }}
          >
            {d.emoji}
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

const DIYAS = 5;

function LightDiyas({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const [lit, setLit] = useState<boolean[]>(() => Array(DIYAS).fill(false));

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
          {!on && !won && <span className="absolute -top-1 animate-bounce text-xs opacity-70">tap</span>}
        </button>
      ))}
    </div>
  );
}

const CANDLES = 5;
const CANDLE_COLORS = ["#f472b6", "#60a5fa", "#facc15", "#34d399", "#a78bfa"];

function BlowCandles({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const [out, setOut] = useState<boolean[]>(() => Array(CANDLES).fill(false));

  const blow = (i: number) => {
    if (out[i] || won) return;
    const next = out.map((v, j) => (j === i ? true : v));
    setOut(next);
    sfx("whoosh");
    if (next.every(Boolean)) onWin();
  };

  return (
    <div className="flex flex-col items-center py-4">
      <div className="flex gap-4">
        {out.map((isOut, i) => (
          <button
            key={i}
            aria-label={isOut ? "Candle blown out" : "Blow out this candle"}
            onClick={() => blow(i)}
            className="relative flex h-24 w-8 flex-col items-center justify-end"
          >
            {isOut ? (
              <span className="absolute top-0 animate-smoke text-lg opacity-60">💨</span>
            ) : (
              <span className="absolute top-1 h-7 w-4 origin-bottom animate-flicker rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-gradient-to-t from-orange-500 via-amber-300 to-yellow-100 shadow-[0_0_18px_6px_rgba(255,200,80,0.5)]" />
            )}
            <span className="h-14 w-3 rounded-sm" style={{ background: CANDLE_COLORS[i] }} />
          </button>
        ))}
      </div>
      <div className="relative -mt-1 h-16 w-64 rounded-t-2xl bg-pink-200 shadow-inner">
        <div className="absolute inset-x-0 top-0 h-4 rounded-t-2xl bg-white/90" />
        <div className="absolute inset-x-0 top-3 flex justify-around">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="h-4 w-4 rounded-b-full bg-white/90" />
          ))}
        </div>
      </div>
      <div className="h-16 w-72 rounded-b-2xl bg-amber-700/90 shadow-lg">
        <div className="h-3 w-full bg-pink-300" />
      </div>
      <div className="h-3 w-80 rounded-full bg-black/10" />
    </div>
  );
}

export const MEMORY_SYMBOLS: Record<Occasion, string[]> = {
  valentine: ["💘", "🌹", "💌", "🍫", "💍", "🧸"],
  birthday: ["🎂", "🎈", "🎁", "🥳", "🍰", "🎉"],
  diwali: ["🪔", "🎆", "🍬", "🌸", "✨", "🎇"],
  christmas: ["🎄", "🎅", "⛄", "🎁", "🦌", "🍪"],
  eid: ["🌙", "⭐", "🕌", "🍬", "🎁", "🤲"],
  anniversary: ["💍", "🥂", "🌹", "💑", "🏡", "📸"],
  sorry: ["🥺", "🌷", "🍫", "🧸", "💐", "🙏"],
  thanks: ["🙏", "💐", "☕", "🍪", "⭐", "💛"],
  congrats: ["🎓", "🏆", "🎉", "⭐", "🥂", "🚀"],
};

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
  const [deck] = useState(() => shuffled([...MEMORY_SYMBOLS[occasion], ...MEMORY_SYMBOLS[occasion]]));
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
        {matched.length / 2} / {deck.length / 2} pairs · {moves} moves
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
              className={`grid aspect-square place-items-center rounded-2xl text-3xl shadow-sm ring-1 ring-black/5 transition duration-300 @2xl:text-4xl ${
                shown ? "bg-white [transform:rotateY(0)]" : "bg-[var(--c-accent)] text-[var(--c-accent-text)] [transform:rotateY(180deg)]"
              } ${matched.includes(i) ? "opacity-70" : ""}`}
            >
              {shown ? symbol : <span className="text-xl font-bold opacity-80">?</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const UNWRAP_TAPS = 6;

function UnwrapGift({ onWin, won }: GameProps) {
  const sfx = useSfx();
  const [taps, setTaps] = useState(0);
  const tap = () => {
    if (won) return;
    const next = taps + 1;
    setTaps(next);
    sfx(next === UNWRAP_TAPS ? "pop" : "whoosh");
    if (next === UNWRAP_TAPS) onWin();
  };
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <button
        aria-label={won ? "Gift unwrapped" : "Tear the wrapping"}
        onClick={tap}
        className="relative grid h-48 w-48 place-items-center"
      >
        {won ? (
          <span className="animate-pop text-9xl">💝</span>
        ) : (
          <span key={taps} className={`text-9xl ${taps > 0 ? "animate-shake" : ""}`} style={{ transform: `scale(${1 + taps * 0.05})` }}>
            🎁
          </span>
        )}
      </button>
      <div className="flex gap-1.5">
        {Array.from({ length: UNWRAP_TAPS }, (_, i) => (
          <span key={i} className={`h-2.5 w-6 rounded-full transition ${i < taps ? "bg-[var(--c-accent)]" : "bg-current opacity-20"}`} />
        ))}
      </div>
    </div>
  );
}

const SHAKE_EMOJI: Partial<Record<Occasion, string>> = { diwali: "🎆", birthday: "🎁", christmas: "🎁", congrats: "🍾" };
type MotionPermission = { requestPermission?: () => Promise<string> };

// Built for phones: shaking fills the meter. Tapping works too, so it never gets stuck.
function ShakeIt({ onWin, won, occasion }: GameProps & { occasion: Occasion }) {
  const sfx = useSfx();
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

  const emoji = SHAKE_EMOJI[occasion] ?? "🎉";
  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <span key={power} className={`text-8xl ${power > 0 && !won ? "animate-shake" : ""} ${won ? "animate-pop" : ""}`}>
        {won ? "🥳" : emoji}
      </span>
      <div className="h-4 w-full max-w-xs overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[var(--c-accent)] transition-all duration-200" style={{ width: `${power}%` }} />
      </div>
      {!won && (
        <div className="flex flex-col items-center gap-3">
          {mode === "idle" ? (
            <button onClick={start} className="rounded-full bg-[var(--c-accent)] px-6 py-3 font-display font-semibold text-[var(--c-accent-text)] shadow-lg">
              📳 Start shaking
            </button>
          ) : (
            <p className="font-display text-lg font-semibold">Shake shake shake! 📳</p>
          )}
          <button onClick={() => add.current(10)} className="text-sm font-semibold underline underline-offset-4 opacity-75">
            Can&apos;t shake? Tap here really fast
          </button>
        </div>
      )}
    </div>
  );
}

const CHASE_TARGET = 5;

// Built for a mouse: the heart runs from the cursor. Corner it to catch it.
function CursorChase({ onWin, won }: GameProps) {
  const sfx = useSfx();
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
      x: clamp(((hx + (dx / dist) * 70 - box.left) / box.width) * 100),
      y: clamp(((hy + (dy / dist) * 70 - box.top) / box.height) * 100),
    });
  };

  const grab = () => {
    if (won) return;
    const next = caught + 1;
    setCaught(next);
    sfx("pop");
    setPos({ x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 });
    if (next === CHASE_TARGET) onWin();
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-center font-display text-lg font-semibold">
        Caught {caught} / {CHASE_TARGET} 💓
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
            className="absolute -translate-x-1/2 -translate-y-1/2 p-2 text-5xl transition-[left,top] duration-150 ease-out"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            💓
          </button>
        )}
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs font-semibold uppercase tracking-widest opacity-50">
          Tip: trap it in a corner
        </p>
      </div>
    </div>
  );
}
