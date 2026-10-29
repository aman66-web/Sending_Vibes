import { ImageResponse } from "next/og";
import { Motif } from "@/components/card/motifs";
import { fmt } from "@/i18n/config";
import { en } from "@/i18n/en";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { occasionSeo } from "@/lib/occasion-seo";
import { DEFAULT_CURRENCY, isCurrency, price } from "@/lib/pricing";
import { themes } from "@/lib/themes";

export const alt = "Interactive e-cards from Envelette";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link preview when someone shares an occasion's page, in the colours of its first
// design. Always in English, like the other share images: the image font only has Latin letters.
export default async function OccasionOgImage({ params }: { params: Promise<{ occasion: string; cur: string }> }) {
  const { occasion, cur } = await params;
  const o = OCCASIONS.find((x) => x === occasion);
  const theme = themes[TEMPLATES.find((t) => t.occasion === o)?.theme ?? "rose"];
  const heading = o ? (occasionSeo(en, o)?.heading ?? fmt(en.occasionPage.title, { label: `**${en.occasions[o].label}**` })) : "**Envelette**";
  // Word by word, so lines break between words; the **marked** ones are in the accent colour.
  const words = heading.split(/\*\*(.+?)\*\*/).flatMap((part, i) => part.split(" ").filter(Boolean).map((text) => ({ text, red: i % 2 === 1 })));
  const label = price("card", isCurrency(cur) ? cur : DEFAULT_CURRENCY);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "60px 80px", background: theme.og ?? theme.background, color: theme.text }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: theme.muted }}>Envelette</div>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 18 }}>
            {words.map((w, i) => (
              <span key={i} style={{ color: w.red ? theme.accent : theme.text, marginRight: 20 }}>
                {w.text}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 24, lineHeight: 1.3, color: theme.muted }}>{o ? en.occasions[o].tagline : ""}</div>
          <div style={{ display: "flex", marginTop: 36, alignItems: "center" }}>
            <div style={{ display: "flex", background: theme.accent, color: theme.accentText, fontSize: 30, fontWeight: 700, padding: "14px 32px", borderRadius: 999 }}>
              {fmt(en.occasionPage.ogPrice, { price: label })}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 340,
            height: 420,
            border: `3px solid ${theme.muted}`,
            outline: `1px solid ${theme.muted}`,
            outlineOffset: -14,
            background: theme.surface,
            color: theme.accent,
            transform: "rotate(4deg)",
          }}
        >
          {o ? <Motif occasion={o} style={{ width: 180, height: 180 }} /> : null}
        </div>
      </div>
    ),
    size,
  );
}
