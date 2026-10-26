"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { Effect } from "@/lib/card";

const EMOJI: Partial<Record<Effect, string[]>> = {
  hearts: ["💖", "💕", "❤️", "💗", "💘"],
  sparkles: ["✨", "🌟", "✨", "💫"],
  confetti: ["🎉", "🎊", "🥳", "🎈"],
  snow: ["❄️", "❅", "❆", "❄️"],
  stars: ["⭐", "🌟", "✨", "🌙"],
  petals: ["🌸", "🌷", "💮", "🌺"],
};

// Snow and petals drift down; everything else floats up.
const FALLS: Effect[] = ["snow", "petals"];

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches;
}

export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    prefersReducedMotion,
    () => false,
  );
}

// Seeded so the server and browser render identical emoji positions.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Drop = { id: number; left: number; size: number; duration: number; delay: number; emoji: string };

// Emoji drifting across the background.
export function EmojiRain({ effect, count = 14, intense = false }: { effect: Effect; count?: number; intense?: boolean }) {
  const reduced = useReducedMotion();
  const drops = useMemo<Drop[]>(() => {
    const set = EMOJI[effect];
    if (!set) return [];
    const rand = seededRandom(effect.length * 97 + count + (intense ? 1 : 0));
    return Array.from({ length: intense ? count * 2 : count }, (_, i) => ({
      id: i,
      left: rand() * 100,
      size: 16 + rand() * (intense ? 26 : 16),
      duration: (intense ? 5 : 9) + rand() * 6,
      delay: -rand() * 12,
      emoji: set[i % set.length],
    }));
  }, [effect, count, intense]);

  if (!drops.length || reduced) return null;
  const falls = FALLS.includes(effect);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d) => (
        <span
          key={d.id}
          className={`absolute ${falls ? "top-[-10%] animate-float-down" : "bottom-[-10%] animate-float-up"}`}
          style={{
            left: `${d.left}%`,
            fontSize: d.size,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            opacity: intense ? 0.7 : 0.45,
          }}
        >
          {d.emoji}
        </span>
      ))}
    </div>
  );
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; spin: number; rot: number };
type Rocket = { x: number; y: number; vy: number; targetY: number; color: string };

const COLORS = ["#ff4d8d", "#ffd166", "#06d6a0", "#4cc9f0", "#f72585", "#ff9f1c", "#b388ff"];
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// Canvas confetti / fireworks. `loop` keeps it going; otherwise it is a single burst.
export function Particles({ mode, loop = false }: { mode: "confetti" | "fireworks"; loop?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    const scale = reduced ? 0.3 : 1;

    const confettiBurst = (n: number) => {
      for (let i = 0; i < n * scale; i++) {
        particles.push({
          x: w / 2 + (Math.random() - 0.5) * w * 0.3,
          y: h * 0.55,
          vx: (Math.random() - 0.5) * 14,
          vy: -Math.random() * 16 - 6,
          life: 1,
          color: pick(COLORS),
          size: 6 + Math.random() * 6,
          spin: (Math.random() - 0.5) * 0.4,
          rot: Math.random() * Math.PI,
        });
      }
    };
    const explode = (x: number, y: number, color: string) => {
      const n = 70 * scale;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, color, size: 2.5, spin: 0, rot: 0 });
      }
    };
    const launch = () =>
      rockets.push({ x: w * (0.15 + Math.random() * 0.7), y: h, vy: -(9 + Math.random() * 4), targetY: h * (0.15 + Math.random() * 0.3), color: pick(COLORS) });

    if (mode === "confetti") confettiBurst(160);
    else for (let i = 0; i < 3; i++) setTimeout(launch, i * 350);

    let last = performance.now();
    let sinceSpawn = 0;
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      sinceSpawn += dt;
      if (loop && sinceSpawn > (mode === "confetti" ? 70 : 40)) {
        sinceSpawn = 0;
        if (mode === "confetti") confettiBurst(60);
        else launch();
      }
      ctx.clearRect(0, 0, w, h);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy * dt;
        ctx.fillStyle = r.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = r.color;
        ctx.fillRect(r.x - 1.5, r.y, 3, 14);
        ctx.shadowBlur = 0;
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const isConfetti = mode === "confetti";
        p.vy += (isConfetti ? 0.35 : 0.06) * dt;
        p.vx *= isConfetti ? 0.99 : 0.98;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        p.life -= (isConfetti ? 0.006 : 0.014) * dt;
        if (p.life <= 0 || p.y > h + 20) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.fillStyle = p.color;
        if (isConfetti) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          // Glowing streaks read as sparks rather than dots.
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 4, p.y - p.vy * 4);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }
      if (loop || particles.length || rockets.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [mode, loop]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

export function FinaleEffect({ effect }: { effect: Effect }) {
  if (effect === "fireworks") return <Particles mode="fireworks" loop />;
  if (effect === "confetti") return <Particles mode="confetti" loop />;
  if (effect === "none") return null;
  return <EmojiRain effect={effect} intense />;
}
