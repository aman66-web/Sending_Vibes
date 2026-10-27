import { ImageResponse } from "next/og";
import { Motif } from "@/components/card/motifs";
import { getTemplate } from "@/lib/catalog";
import { DEFAULT_CURRENCY, isCurrency, price } from "@/lib/pricing";
import { occasions } from "@/lib/templates";
import { themes } from "@/lib/themes";

export const alt = "An interactive card from Sending Vibes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The link preview when someone shares a design's page.
export default async function ProductOgImage({ params }: { params: Promise<{ slug: string; cur: string }> }) {
  const { slug, cur } = await params;
  const t = getTemplate(slug);
  const label = price("card", isCurrency(cur) ? cur : DEFAULT_CURRENCY);
  const theme = themes[t?.theme ?? "rose"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "60px 80px", background: theme.og ?? theme.background, color: theme.text }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: theme.muted }}>
            {t ? `Interactive ${occasions[t.occasion].label} card` : "Interactive cards"}
          </div>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 800, lineHeight: 1.04, marginTop: 18 }}>{t?.headline ?? "Sending Vibes"}</div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 24, lineHeight: 1.3, color: theme.muted }}>{t?.blurb ?? ""}</div>
          <div style={{ display: "flex", marginTop: 36, alignItems: "center" }}>
            <div style={{ display: "flex", background: theme.accent, color: theme.accentText, fontSize: 30, fontWeight: 700, padding: "14px 32px", borderRadius: 999 }}>
              {`Personalise it · ${label}`}
            </div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, marginLeft: 26, opacity: 0.75 }}>Sending Vibes</div>
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
          {t ? <Motif occasion={t.occasion} style={{ width: 180, height: 180 }} /> : null}
        </div>
      </div>
    ),
    size,
  );
}
