// Small engraved-style ornaments used on card screens in place of big emoji.
// They draw in currentColor, so each card's palette colours them.

export function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 16" className={`h-4 w-40 ${className}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
      <path d="M4 8h52M104 8h52" />
      <path d="M56 8c6-6 12-6 16 0-4 6-10 6-16 0zM104 8c-6-6-12-6-16 0 4 6 10 6 16 0z" />
      <path d="M80 2l5 6-5 6-5-6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HeartMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 54S9 40 6.5 25.5C4.8 15.6 11 9 18.8 9c5.6 0 9.9 3.2 13.2 8.2C35.3 12.2 39.6 9 45.2 9 53 9 59.2 15.6 57.5 25.5 55 40 32 54 32 54z" strokeWidth="2.2" />
      <path d="M32 46s-15-9.2-16.7-18.6C14.2 21 18.2 16.8 23.2 16.8c3.6 0 6.4 2 8.8 5.3" strokeWidth="1.1" opacity="0.6" />
    </svg>
  );
}

export function Laurel({ className = "" }: { className?: string }) {
  const leaves = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 96 64" className={className} aria-hidden fill="currentColor">
      {[-1, 1].map((side) => (
        <g key={side} transform={side === 1 ? "translate(96 0) scale(-1 1)" : undefined}>
          <path d="M44 58C26 54 14 40 14 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          {leaves.map((i) => {
            const t = i / 4;
            const x = 14 + t * 22 + (1 - t) * 2;
            const y = 20 + t * 34 - Math.sin(t * Math.PI) * 4;
            return <ellipse key={i} cx={x - 4} cy={y - 2} rx="6.5" ry="3" transform={`rotate(${-50 + t * 40} ${x - 4} ${y - 2})`} />;
          })}
        </g>
      ))}
      <path d="M48 26l3 6.2 6.8 1-4.9 4.8 1.2 6.8L48 41.6l-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1z" />
    </svg>
  );
}
