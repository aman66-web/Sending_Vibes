// Big envelope used in the link-preview images (rendered by next/og, so plain SVG only).
export function OgEnvelope({ size = 360, flap = "#ffd1e0" }: { size?: number; flap?: string }) {
  return (
    <svg width={size} height={size * 0.78} viewBox="0 0 200 156">
      <rect x="4" y="20" width="192" height="132" rx="14" fill="#ffffff" />
      <path d="M4 34 L100 104 L196 34" fill="none" stroke={flap} strokeWidth="8" strokeLinejoin="round" />
      <path d="M100 30 C88 10 58 18 63 40 C66 55 100 76 100 76 C100 76 134 55 137 40 C142 18 112 10 100 30Z" fill="#ff2e7e" />
    </svg>
  );
}
