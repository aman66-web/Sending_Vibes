"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/lib/card";

type GameProps = { onWin: () => void; won: boolean };

export function GameView({ game, ...props }: GameProps & { game: Game }) {
  if (game === "light-diyas") return <LightDiyas {...props} />;
  if (game === "blow-candles") return <BlowCandles {...props} />;
  return <CatchHearts {...props} />;
}

const TARGET = 10;
type Heart = { id: number; left: number; duration: number; emoji: string };

function CatchHearts({ onWin, won }: GameProps) {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [score, setScore] = useState(0);
  // Counted in a ref so rapid taps between renders are never lost.
  const caught = useRef(0);
  const [pops, setPops] = useState<{ id: number; x: number; y: number }[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (won) return;
    const spawn = () => {
      const id = nextId.current++;
      setHearts((h) => [
        ...h,
        { id, left: 6 + Math.random() * 80, duration: 3.2 + Math.random() * 1.8, emoji: ["💖", "💗", "❤️", "💘"][id % 4] },
      ]);
    };
    spawn();
    const t = setInterval(spawn, 650);
    return () => clearInterval(t);
  }, [won]);

  const catchHeart = (heart: Heart, e: React.PointerEvent) => {
    if (won) return;
    const box = e.currentTarget.parentElement!.getBoundingClientRect();
    setPops((p) => [...p, { id: heart.id, x: e.clientX - box.left, y: e.clientY - box.top }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== heart.id)), 600);
    setHearts((h) => h.filter((x) => x.id !== heart.id));
    caught.current += 1;
    setScore(caught.current);
    if (caught.current === TARGET) onWin();
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-center font-display text-lg font-semibold">
        {Math.min(score, TARGET)} / {TARGET} 💘
      </div>
      <div className="relative h-72 w-full touch-none select-none overflow-hidden rounded-3xl bg-[var(--c-secondary)]/40 ring-1 ring-black/5">
        {hearts.map((h) => (
          <button
            key={h.id}
            aria-label="Catch heart"
            onPointerDown={(e) => catchHeart(h, e)}
            onAnimationEnd={() => setHearts((all) => all.filter((x) => x.id !== h.id))}
            className="absolute top-[-15%] animate-fall p-2 text-4xl leading-none"
            style={{ left: `${h.left}%`, animationDuration: `${h.duration}s` }}
          >
            {h.emoji}
          </button>
        ))}
        {pops.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute animate-pop-fade font-display text-xl font-bold text-[var(--c-accent)]"
            style={{ left: p.x, top: p.y }}
          >
            +1
          </span>
        ))}
      </div>
    </div>
  );
}

const DIYAS = 5;

function LightDiyas({ onWin, won }: GameProps) {
  const [lit, setLit] = useState<boolean[]>(() => Array(DIYAS).fill(false));

  const light = (i: number) => {
    if (lit[i] || won) return;
    const next = lit.map((v, j) => (j === i ? true : v));
    setLit(next);
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
  const [out, setOut] = useState<boolean[]>(() => Array(CANDLES).fill(false));

  const blow = (i: number) => {
    if (out[i] || won) return;
    const next = out.map((v, j) => (j === i ? true : v));
    setOut(next);
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
