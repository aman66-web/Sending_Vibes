import type { Effect } from "@/lib/card";
import { deviceInfo, type Template } from "@/lib/catalog";
import { themes } from "@/lib/themes";

const SCATTER: Record<Effect, string> = {
  hearts: "💗",
  sparkles: "✨",
  confetti: "🎊",
  fireworks: "🎆",
  snow: "❄️",
  stars: "⭐",
  petals: "🌸",
  none: "✨",
};

const SPOTS = [
  { x: 8, y: 10, s: 22, r: -12 },
  { x: 78, y: 7, s: 28, r: 10 },
  { x: 88, y: 28, s: 18, r: -6 },
  { x: 6, y: 74, s: 24, r: 14 },
  { x: 70, y: 82, s: 24, r: -10 },
  { x: 18, y: 86, s: 18, r: 8 },
];

// The artwork for a card design: its colours, a big emoji and its headline.
export function ProductThumb({ template, className = "" }: { template: Template; className?: string }) {
  const theme = themes[template.theme];
  return (
    <div className={`relative aspect-[4/5] overflow-hidden ${className}`} style={{ background: theme.background, color: theme.text }}>
      {SPOTS.map((p, i) => (
        <span key={i} aria-hidden className="absolute opacity-50" style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.s, transform: `rotate(${p.r}deg)` }}>
          {SCATTER[template.ambient]}
        </span>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl drop-shadow-sm transition duration-500 group-hover:-rotate-6 group-hover:scale-110">{template.emoji}</span>
        <p className="mt-4 font-display text-xl font-bold leading-tight">{template.headline}</p>
      </div>
      {template.device !== "everywhere" && (
        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
          {deviceInfo[template.device].emoji} {deviceInfo[template.device].label}
        </span>
      )}
    </div>
  );
}
