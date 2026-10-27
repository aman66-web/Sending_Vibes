import Link from "next/link";

// The outline of a postage stamp: a square with half-circle bites along each edge.
function stampOutline(x0: number, y0: number, size: number, holes: number, r: number) {
  const step = size / holes;
  const x1 = x0 + size;
  const y1 = y0 + size;
  const bite = (x: number, y: number) => ` A${r} ${r} 0 0 0 ${x} ${y}`;
  let d = `M${x0} ${y0}`;
  for (let i = 0; i < holes; i++) {
    const c = x0 + step * (i + 0.5);
    d += ` L${c - r} ${y0}` + bite(c + r, y0);
  }
  d += ` L${x1} ${y0}`;
  for (let i = 0; i < holes; i++) {
    const c = y0 + step * (i + 0.5);
    d += ` L${x1} ${c - r}` + bite(x1, c + r);
  }
  d += ` L${x1} ${y1}`;
  for (let i = 0; i < holes; i++) {
    const c = x1 - step * (i + 0.5);
    d += ` L${c + r} ${y1}` + bite(c - r, y1);
  }
  d += ` L${x0} ${y1}`;
  for (let i = 0; i < holes; i++) {
    const c = y1 - step * (i + 0.5);
    d += ` L${x0} ${c + r}` + bite(x0, c - r);
  }
  return d + " Z";
}

const OUTLINE = stampOutline(1, 1, 38, 6, 1.7);

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d={OUTLINE} fill="#d8432f" />
      <rect x="6" y="6" width="28" height="28" fill="none" stroke="#fbf7ef" strokeWidth="1.4" />
      <path d="M20 29.5s-8-4.6-8-10.2c0-2.6 2-4.6 4.4-4.6 1.6 0 2.8.8 3.6 2 .8-1.2 2-2 3.6-2 2.4 0 4.4 2 4.4 4.6 0 5.6-8 10.2-8 10.2z" fill="#fbf7ef" />
    </svg>
  );
}

export function Logo({ textClass = "text-ink" }: { textClass?: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
      <span className={`whitespace-nowrap font-brand text-[1.2rem] font-extrabold leading-none tracking-tight sm:text-[1.4rem] ${textClass}`}>Envelette</span>
    </Link>
  );
}
