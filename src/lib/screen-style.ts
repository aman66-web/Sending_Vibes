import type { Crop, Font, Pattern, ScreenStyle } from "./card";
import type { Theme } from "./themes";

// Turns a screen's own look (colours, fonts, pattern) into the colours and CSS the card
// is drawn with, starting from the card's theme. Whatever colours the AI picks, the
// words stay readable: text that's too close to its background is swapped for dark or
// light ink, and so is a button colour that would disappear.

const INK = "#1f1b16";
const PAPER = "#fdfbf6";

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: Rgb) {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

function mix(a: string, b: string, amount: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex([0, 1, 2].map((i) => x[i] * (1 - amount) + y[i] * amount) as Rgb);
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// The weakest contrast against any of the background's colours.
const worst = (colour: string, backgrounds: string[]) => Math.min(...backgrounds.map((b) => contrast(colour, b)));

// Dark ink or light paper, whichever reads better on these colours.
export function readableOn(backgrounds: string[]) {
  return worst(INK, backgrounds) >= worst(PAPER, backgrounds) ? INK : PAPER;
}

function gradient(colours: string[], kind: ScreenStyle["gradient"]) {
  if (colours.length === 1) return colours[0];
  const stops = colours.join(", ");
  if (kind === "glow") return `radial-gradient(130% 90% at 50% 0%, ${stops})`;
  return `linear-gradient(${kind === "diagonal" ? "135deg" : "180deg"}, ${stops})`;
}

// Faint repeating patterns drawn in the text colour, over the background.
function pattern(kind: Pattern | undefined, ink: string) {
  const line = `color-mix(in srgb, ${ink} 9%, transparent)`;
  switch (kind) {
    case "dots":
      return { image: `radial-gradient(${line} 2px, transparent 2.5px)`, size: "22px 22px" };
    case "stripes":
      return { image: `repeating-linear-gradient(135deg, ${line} 0 10px, transparent 10px 24px)`, size: "auto" };
    case "grid":
      return { image: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`, size: "26px 26px" };
    case "checks":
      return { image: `repeating-conic-gradient(${line} 0 25%, transparent 0 50%)`, size: "40px 40px" };
    case "zigzag":
      return {
        image: `linear-gradient(135deg, ${line} 25%, transparent 25%), linear-gradient(225deg, ${line} 25%, transparent 25%)`,
        size: "28px 28px",
      };
    default:
      return null;
  }
}

// Each font's variable, set by next/font in the site layout. "classic" is the cards' usual serif.
export const FONT_VARS: Record<Font, string> = {
  classic: "--font-display-face",
  modern: "--font-ui-face",
  handwritten: "--font-hand-face",
  storybook: "--font-brand-face",
  script: "--font-script-face",
  rounded: "--font-rounded-face",
  bold: "--font-bold-face",
  typewriter: "--font-typewriter-face",
  marker: "--font-marker-face",
  spooky: "--font-spooky-face",
};

export type ScreenLook = {
  theme: Theme;
  // Extra CSS for the card's outer box: the fonts.
  css: Record<string, string>;
  // A faint pattern over the background.
  pattern?: { image: string; size: string };
  // The envelope's paper and the ink for the name written on it.
  envelope?: { paper: string; shade: string; ink: string };
};

export function screenLook(base: Theme, style: ScreenStyle | undefined): ScreenLook {
  const theme = { ...base };
  const css: Record<string, string> = {};
  if (!style) return { theme, css };

  const backgrounds = style.background;
  if (backgrounds?.length) {
    theme.background = gradient(backgrounds, style.gradient);
    const mid = backgrounds.length === 1 ? backgrounds[0] : mix(backgrounds[0], backgrounds.at(-1)!, 0.5);
    const dark = luminance(mid) < 0.18;
    theme.surface = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.62)";
    theme.secondary = dark ? "rgba(255,255,255,0.11)" : mix(mid, "#ffffff", 0.85);
  }
  // Without a background of its own, check against the theme's (light themes are light at the top).
  const against = backgrounds?.length ? backgrounds : [hexIn(base.background) ?? PAPER];
  const wanted = style.text ?? (backgrounds?.length ? base.text : undefined);
  if (wanted) {
    // 3:1, the standard for large text: keeps a design's white on hot pink, but not navy on black.
    const text = worst(wanted, against) >= 3 ? wanted : readableOn(against);
    theme.text = text;
    theme.muted = mix(text, against[0], 0.28);
  }
  if (style.accent) {
    // A button that's nearly the background colour is no use; fall back to the text colour.
    const accent = worst(style.accent, against) >= 2 ? style.accent : theme.text;
    theme.accent = accent;
    theme.accentText = readableOn([accent]);
  } else if (backgrounds?.length && worst(theme.accent, against) < 2) {
    theme.accent = theme.text;
    theme.accentText = readableOn([theme.text]);
  }

  if (style.heading && style.heading !== "classic") css["--card-display"] = `var(${FONT_VARS[style.heading]})`;
  if (style.body && style.body !== "modern") css["--card-body"] = `var(${FONT_VARS[style.body]})`;

  const envelope = style.envelope ? { paper: style.envelope, shade: mix(style.envelope, INK, 0.1), ink: readableOn([style.envelope]) } : undefined;
  if (css["--card-display"] || css["--card-body"]) css["fontSynthesis"] = "none";
  return { theme, css, envelope, pattern: pattern(style.pattern, theme.text) ?? undefined };
}

// The first hex colour in a CSS background, for checking contrast against a theme.
function hexIn(background: string) {
  return /#[0-9a-fA-F]{6}/.exec(background)?.[0];
}

// Shows the part of a photo chosen for its frame (see Crop in lib/card.ts). The photo's
// frame clips it, so zooming in fills the frame with that part.
export function cropStyle(crop?: Crop | null): React.CSSProperties | undefined {
  if (!crop) return undefined;
  const at = `${crop.x}% ${crop.y}%`;
  return { objectPosition: at, transformOrigin: at, transform: crop.zoom > 1 ? `scale(${crop.zoom})` : undefined };
}
