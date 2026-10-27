// A round post-office cancellation stamp with wavy lines, drawn in currentColor.
// Decorative: whatever it says should also be written out nearby.
export function Postmark({ id, middle, bottom, className = "" }: { id: string; middle: string; bottom: string; className?: string }) {
  return (
    <svg viewBox="0 0 160 90" className={className} aria-hidden>
      <defs>
        <path id={`${id}-top`} d="M 13.5 45 A 31.5 31.5 0 0 1 76.5 45" />
        <path id={`${id}-bottom`} d="M 7.5 45 A 37.5 37.5 0 0 0 82.5 45" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="45" cy="45" r="40" strokeWidth="2.2" />
        <circle cx="45" cy="45" r="28" strokeWidth="1.4" />
        {[29, 39, 51, 61].map((y) => (
          <path key={y} d={`M 88 ${y} q 8.75 -6 17.5 0 t 17.5 0 t 17.5 0 t 17.5 0`} strokeWidth="2.2" strokeLinecap="round" />
        ))}
      </g>
      <g fill="currentColor" fontFamily="var(--font-ui-face), sans-serif" fontWeight="800" letterSpacing="1.4">
        <text fontSize="7.5" textAnchor="middle">
          <textPath href={`#${id}-top`} startOffset="50%">
            ENVELETTE
          </textPath>
        </text>
        <text fontSize="7.5" textAnchor="middle">
          <textPath href={`#${id}-bottom`} startOffset="50%">
            {bottom.toUpperCase()}
          </textPath>
        </text>
        <text x="45" y="48.5" fontSize="9.5" textAnchor="middle" letterSpacing="0.6" {...(middle.length > 7 ? { textLength: 50, lengthAdjust: "spacingAndGlyphs" } : {})}>
          {middle.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
