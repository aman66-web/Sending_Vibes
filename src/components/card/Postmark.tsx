import { useId } from "react";

// The round date stamp the post office prints beside a stamp, with wavy lines that run
// across it. Drawn in currentColor. Decorative: the names on it are on the card already.
export function Postmark({
  date,
  from,
  className = "",
  style,
}: {
  // "29 OCT" over "2026"; left blank until the browser knows the date.
  date?: { day: string; year: string };
  from: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Each postmark's own ids for the curves its words follow, as there can be several on a page.
  const id = `pm${useId().replace(/[^\w-]/g, "")}`;
  // A long name is cut short so it stays on the curve.
  const letters = [...from.trim()];
  const name = letters.length > 14 ? `${letters.slice(0, 13).join("")}…` : letters.join("");
  return (
    <svg viewBox="0 0 150 84" className={className} style={style} aria-hidden>
      <defs>
        <path id={`${id}-top`} d="M 13 42 A 29 29 0 0 1 71 42" />
        <path id={`${id}-bottom`} d="M 8 42 A 34 34 0 0 0 76 42" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="42" cy="42" r="38" strokeWidth="2" />
        <circle cx="42" cy="42" r="25" strokeWidth="1.2" />
        {[24, 36, 48, 60].map((y) => (
          <path key={y} d={`M 84 ${y} q 8.25 -5.5 16.5 0 t 16.5 0 t 16.5 0 t 16.5 0`} strokeWidth="2" strokeLinecap="round" />
        ))}
      </g>
      <g fill="currentColor" fontFamily="var(--font-ui-face), sans-serif" fontWeight="800" textAnchor="middle">
        <text fontSize="7" letterSpacing="1.2">
          <textPath href={`#${id}-top`} startOffset="50%">
            ENVELETTE
          </textPath>
        </text>
        {name && (
          <text fontSize="7" letterSpacing="1.2">
            <textPath href={`#${id}-bottom`} startOffset="50%">
              {`FROM ${name.toUpperCase()}`}
            </textPath>
          </text>
        )}
        {date && (
          <>
            <text x="42" y="40" fontSize="10" letterSpacing="0.5">
              {date.day}
            </text>
            <text x="42" y="51" fontSize="9" letterSpacing="1">
              {date.year}
            </text>
          </>
        )}
      </g>
    </svg>
  );
}
