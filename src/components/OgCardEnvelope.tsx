import type { CardData } from "@/lib/card";
import { screenLook } from "@/lib/screen-style";
import { themes } from "@/lib/themes";

// A card's own sealed envelope for its link preview, as it looks when the card opens
// (IntroScreen): its paper and colours, their name across the front and the sender's
// initial on the wax seal. Drawn by next/og, so inline styles only, display:flex on
// anything with more than one child, and no clip-path or color-mix.

// The intro's paper when the card hasn't chosen its own (as in components/card/screens.tsx).
const ENVELOPE = { paper: "#f6efe0", shade: "#ebe1cb", ink: "#3a3127" };

const HEX = /^#[0-9a-fA-F]{6}$/;

// Mixes two #rrggbb colours; anything else is left as it is.
function mix(a: string, b: string, amount: number) {
  if (!HEX.test(a) || !HEX.test(b)) return a;
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(channel(a, i) * (1 - amount) + channel(b, i) * amount).toString(16).padStart(2, "0")).join("")}`;
}

// The colours the card opens in: the envelope screen's own look over the card's theme.
// `top` is a plain colour for the top of the screen (the phone's browser bar).
export function cardEnvelopeLook(card: CardData) {
  const intro = card.screens.find((s) => s.type === "intro") ?? card.screens[0];
  const theme = themes[card.theme] ?? themes.rose;
  const look = screenLook(theme, intro?.style);
  const own = intro?.style?.background;
  // Share images can't draw the cards' layered gradients, so themes keep a simpler one.
  const background = own?.length ? (own.length === 1 ? own[0] : `linear-gradient(170deg, ${own.join(", ")})`) : (theme.og ?? theme.background);
  const top = own?.[0] ?? /#[0-9a-fA-F]{6}/.exec(theme.og ?? theme.background)?.[0] ?? "#f3ecdf";
  return { background, top, text: look.theme.text, muted: look.theme.muted, accent: look.theme.accent, envelope: look.envelope ?? ENVELOPE };
}

// Long names are cut short rather than squeezed.
export const clip = (name: string, max = 24) => (name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name);

export function OgCardEnvelope({ to, from, look, width = 560 }: { to: string; from: string; look: ReturnType<typeof cardEnvelopeLook>; width?: number }) {
  const height = Math.round(width * 0.66);
  // The striped airmail edge, like the envelope's lining in the card.
  const edge = 10;
  const inner = { width: width - edge * 2, height: height - edge * 2 };
  const flap = Math.round(inner.height * 0.52);
  const seal = Math.round(width * 0.21);
  const { paper, shade, ink } = look.envelope;
  const accent = look.accent;
  const name = clip(to);
  const nameSize = Math.round(width * (name.length <= 10 ? 0.15 : name.length <= 16 ? 0.12 : 0.085));
  const initial = ([...from.trim()][0] ?? "").toUpperCase() || "♥";

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width,
        height,
        padding: edge,
        borderRadius: 16,
        backgroundImage: `repeating-linear-gradient(135deg, ${accent} 0px, ${accent} 14px, ${mix(accent, "#ffffff", 0.22)} 14px, ${mix(accent, "#ffffff", 0.22)} 28px)`,
        boxShadow: "0 34px 60px -30px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          width: inner.width,
          height: inner.height,
          paddingBottom: Math.round(inner.height * 0.05),
          borderRadius: 8,
          overflow: "hidden",
          backgroundImage: `linear-gradient(180deg, ${paper} 0%, ${shade} 100%)`,
        }}
      >
        {/* The closed flap, folded down to the seal. */}
        <svg width={inner.width} height={flap + 4} viewBox={`0 0 ${inner.width} ${flap + 4}`} style={{ position: "absolute", top: 0, left: 0 }}>
          <path d={`M0 0 L${inner.width / 2} ${flap + 3} L${inner.width} 0 Z`} fill="rgba(0,0,0,0.07)" />
          <path d={`M0 0 L${inner.width / 2} ${flap} L${inner.width} 0 Z`} fill={shade} />
        </svg>
        <div
          style={{
            display: "flex",
            maxWidth: inner.width - 60,
            fontFamily: "Caveat",
            fontSize: nameSize,
            lineHeight: 1.05,
            color: ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {name}
        </div>
      </div>
      {/* The wax seal where the flap meets, with the sender's initial pressed into it. */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: width / 2 - seal / 2,
          top: edge + flap - seal / 2,
          width: seal,
          height: seal,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: seal,
          backgroundImage: `linear-gradient(150deg, ${mix(accent, "#ffffff", 0.32)} 0%, ${accent} 50%, ${mix(accent, "#000000", 0.42)} 100%)`,
          boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: Math.round(seal * 0.72),
            height: Math.round(seal * 0.72),
            borderRadius: seal,
            border: "2px solid rgba(255,255,255,0.35)",
            fontFamily: "Playfair",
            fontStyle: "italic",
            fontSize: Math.round(seal * 0.42),
            color: "rgba(255,255,255,0.92)",
          }}
        >
          {initial}
        </div>
      </div>
    </div>
  );
}
