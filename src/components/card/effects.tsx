"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Effect } from "@/lib/card";

// Drawn shapes rather than emoji, in the card's own colours, so the background
// looks like printed stationery rather than a chat app.
const SHAPES = {
  heart: <path d="M12 20.5s-7.2-4.5-9.4-9.1C1.2 8.4 3.2 4.9 6.8 4.9c2.1 0 3.7 1.1 5.2 3 1.5-1.9 3.1-3 5.2-3 3.6 0 5.6 3.5 4.2 6.5-2.2 4.6-9.4 9.1-9.4 9.1z" />,
  sparkle: <path d="M12 1.5c.6 4.9 2.6 8.3 8.5 10.5-5.9 2.2-7.9 5.6-8.5 10.5-.6-4.9-2.6-8.3-8.5-10.5 5.9-2.2 7.9-5.6 8.5-10.5z" />,
  dot: <circle cx="12" cy="12" r="5" />,
  sliver: <rect x="10.2" y="2" width="3.6" height="20" rx="1.8" />,
  petal: <path d="M12 2.5c4.6 3.6 5.8 10 0 19-5.8-9-4.6-15.4 0-19z" />,
  snow: (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M12 2v20M3.4 7l17.2 10M3.4 17L20.6 7" />
      <path d="M9.6 3.8 12 6.2l2.4-2.4M9.6 20.2 12 17.8l2.4 2.4M3.6 10.3l3.3-.9-.9-3.3M20.4 13.7l-3.3.9.9 3.3M3.6 13.7l3.3.9-.9 3.3M20.4 10.3l-3.3-.9.9-3.3" />
    </g>
  ),
  bat: <path d="M12 9.5c.8-1.6 1.9-2.4 3-2.4-.3.9-.2 1.7.4 2.4 1.6-1.4 4-1.6 6.6-.5-1.6.7-2.6 1.9-2.8 3.6-1.3-.9-2.7-.9-3.9.2-1.4-.9-2.6-.6-3.3.9-.7-1.5-1.9-1.8-3.3-.9-1.2-1.1-2.6-1.1-3.9-.2C4.6 10.9 3.6 9.7 2 9c2.6-1.1 5-.9 6.6.5.6-.7.7-1.5.4-2.4 1.1 0 2.2.8 3 2.4z" />,
  ring: <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" />,
  orb: <circle cx="12" cy="12" r="7" />,
  balloon: (
    <>
      <ellipse cx="12" cy="9.5" rx="6.2" ry="7.6" />
      <path d="M12 17.1l-1.2 1.6h2.4z" />
      <path d="M12 18.7c-.8 1.4.8 2.2 0 3.8" fill="none" stroke="currentColor" strokeWidth="0.9" />
    </>
  ),
};
type Shape = keyof typeof SHAPES;

// Which shapes each effect uses, and in which of the card's colours.
const LOOKS: Partial<Record<Effect, { shapes: Shape[]; colors: string[]; glow?: boolean }>> = {
  hearts: { shapes: ["heart"], colors: ["var(--c-accent)", "var(--c-muted)"] },
  sparkles: { shapes: ["sparkle", "dot"], colors: ["var(--c-muted)"] },
  confetti: { shapes: ["sliver", "dot", "sparkle"], colors: ["var(--c-muted)", "var(--c-accent)"] },
  snow: { shapes: ["snow", "dot"], colors: ["var(--c-text)"] },
  stars: { shapes: ["sparkle", "dot"], colors: ["var(--c-muted)", "var(--c-text)"] },
  petals: { shapes: ["petal"], colors: ["var(--c-accent)", "var(--c-muted)"] },
  spooky: { shapes: ["bat"], colors: ["var(--c-muted)", "var(--c-text)"] },
  colours: { shapes: ["dot"], colors: ["#d9507f", "#e3a92f", "#3f9c7d", "#5677c9", "#9b5fc0"] },
  lanterns: { shapes: ["orb"], colors: ["var(--c-muted)", "var(--c-accent)"], glow: true },
  bubbles: { shapes: ["ring"], colors: ["var(--c-muted)", "var(--c-text)"] },
  balloons: { shapes: ["balloon"], colors: ["var(--c-accent)", "var(--c-muted)"] },
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

// Seeded so the server and browser render identical positions.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Drop = { id: number; left: number; size: number; duration: number; delay: number; shape: Shape; color: string; turn: number };

// Shapes drifting across the background.
export function Ambient({ effect, count = 14, intense = false }: { effect: Effect; count?: number; intense?: boolean }) {
  const reduced = useReducedMotion();
  const drops = useMemo<Drop[]>(() => {
    const look = LOOKS[effect];
    if (!look) return [];
    const rand = seededRandom(effect.length * 97 + count + (intense ? 1 : 0));
    return Array.from({ length: intense ? count * 2 : count }, (_, i) => ({
      id: i,
      left: rand() * 100,
      size: 9 + rand() * (intense ? 18 : 12),
      duration: (intense ? 6 : 11) + rand() * 7,
      delay: -rand() * 14,
      shape: look.shapes[i % look.shapes.length],
      color: look.colors[Math.floor(rand() * look.colors.length)],
      turn: Math.round(rand() * 360),
    }));
  }, [effect, count, intense]);

  if (!drops.length || reduced) return null;
  const falls = FALLS.includes(effect);
  const glow = LOOKS[effect]?.glow;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d) => (
        <svg
          key={d.id}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`absolute ${falls ? "top-[-10%] animate-float-down" : "bottom-[-10%] animate-float-up"}`}
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            color: d.color,
            rotate: `${d.turn}deg`,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            opacity: intense ? 0.75 : 0.4,
            filter: glow ? "blur(0.5px) drop-shadow(0 0 6px currentColor)" : undefined,
          }}
        >
          {SHAPES[d.shape]}
        </svg>
      ))}
    </div>
  );
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number; spin: number; rot: number };
type Rocket = { x: number; y: number; vy: number; targetY: number; color: string };

// Gold, champagne, blush, ivory and pearl: confetti that looks like foil.
const COLORS = ["#d8b25c", "#f1dfb3", "#e7b3b6", "#fffaf0", "#c79a43", "#c5cfdc", "#ead2a1"];
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
    // The card can grow under it (a button appearing), not just the window.
    const sized = new ResizeObserver(resize);
    sized.observe(canvas);
    // The card's own button colour among the foil, so a Holi or Christmas card bursts in its colours.
    const accent = getComputedStyle(canvas).getPropertyValue("--c-accent").trim();
    const colors = /^#[0-9a-f]{6}$/i.test(accent) ? [accent, accent, ...COLORS] : COLORS;
    // The part of the canvas that's on screen: on a long card, they go off where they're looking.
    const view = () => {
      const box = canvas.getBoundingClientRect();
      const s = box.height / h || 1;
      const top = Math.min(Math.max(0, -box.top / s), h);
      const bottom = Math.max(Math.min(h, (window.innerHeight - box.top) / s), top);
      return bottom - top > 120 ? { top, height: bottom - top } : { top: 0, height: h };
    };

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    const scale = reduced ? 0.3 : 1;

    const confettiBurst = (n: number) => {
      const v = view();
      for (let i = 0; i < n * scale; i++) {
        particles.push({
          x: w / 2 + (Math.random() - 0.5) * w * 0.3,
          y: v.top + v.height * 0.55,
          vx: (Math.random() - 0.5) * 14,
          vy: -Math.random() * 16 - 6,
          life: 1,
          color: pick(colors),
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
    const launch = () => {
      const v = view();
      rockets.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: v.top + v.height,
        vy: -(9 + Math.random() * 4),
        targetY: v.top + v.height * (0.15 + Math.random() * 0.3),
        color: pick(colors),
      });
    };

    if (mode === "confetti") confettiBurst(160);
    else for (let i = 0; i < 3; i++) setTimeout(launch, i * 350);

    let last = performance.now();
    let sinceSpawn = 0;
    let raf = 0;
    // Looping effects stop drawing while scrolled out of view, so they don't slow the rest of the page.
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    if (loop) io.observe(canvas);
    const tick = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
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
          // Glowing streaks read as sparks rather than dots. The glow is a faint wide
          // stroke, the spark a coloured one with a white-hot centre, all added together
          // like light. Far cheaper than a canvas shadow, which made pages stutter.
          const life = Math.max(p.life, 0);
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = p.color;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 4, p.y - p.vy * 4);
          ctx.lineTo(p.x, p.y);
          ctx.globalAlpha = life * 0.18;
          ctx.lineWidth = p.size * 3;
          ctx.stroke();
          ctx.globalAlpha = life;
          ctx.lineWidth = p.size;
          ctx.stroke();
          ctx.strokeStyle = "#ffffff";
          ctx.globalAlpha = life * 0.7;
          ctx.lineWidth = p.size * 0.4;
          ctx.stroke();
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.globalAlpha = 1;
      }
      if (loop || particles.length || rockets.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      sized.disconnect();
    };
  }, [mode, loop]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

// Where celebrations are drawn: a layer over the whole card, behind its words, provided
// by CardPlayer. Drawn inside a screen instead, they'd be trapped in its text box (its
// entrance animation leaves a transform) and painted over its words. null while the
// layer is still being put in place; without a layer at all, they're drawn where they are.
export const FxLayer = createContext<HTMLElement | null | undefined>(undefined);

function InFxLayer({ children }: { children: React.ReactNode }) {
  const layer = useContext(FxLayer);
  if (layer === undefined) return children;
  return layer ? createPortal(children, layer) : null;
}

export function FinaleEffect({ effect }: { effect: Effect }) {
  if (effect === "none") return null;
  return (
    <InFxLayer>
      {effect === "fireworks" || effect === "confetti" ? <Particles mode={effect} loop /> : <Ambient effect={effect} intense />}
    </InFxLayer>
  );
}

// What's floating behind a screen. Fireworks keep going off in the sky.
export function Backdrop({ effect }: { effect: Effect }) {
  if (effect === "fireworks") return <Particles mode="fireworks" loop />;
  return <Ambient effect={effect} />;
}

// The burst a screen has chosen for its big moment, if it's chosen one (see CardPlayer).
export const BurstContext = createContext<Effect | undefined>(undefined);

// Plays at a screen's big moment: the envelope opening, "yes", a game won. The screen's
// own choice, or what that moment usually does (`usual`, which may be nothing).
export function Burst({ usual = "confetti" }: { usual?: Effect | null }) {
  const own = useContext(BurstContext);
  const effect = own ?? usual;
  if (!effect || effect === "none") return null;
  return <InFxLayer>{effect === "fireworks" || effect === "confetti" ? <Particles mode={effect} /> : <Ambient effect={effect} intense />}</InFxLayer>;
}
