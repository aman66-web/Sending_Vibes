import Link from "next/link";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="sv-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff2e7e" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#sv-logo)" />
      <path d="M9 14.5h22v13a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="#fff" />
      <path d="M9 14.5 20 23l11-8.5" fill="none" stroke="#ffd1e0" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 11.2c-1.6-2.4-5.2-1.4-4.6 1.3.4 1.8 4.6 4.3 4.6 4.3s4.2-2.5 4.6-4.3c.6-2.7-3-3.7-4.6-1.3z" fill="#fff" />
    </svg>
  );
}

export function Logo({ textClass = "text-ink" }: { textClass?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-xl font-bold tracking-tight ${textClass}`}>
        Sending Vibes
      </span>
    </Link>
  );
}
