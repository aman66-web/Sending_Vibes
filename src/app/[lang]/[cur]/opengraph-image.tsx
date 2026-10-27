import { ImageResponse } from "next/og";
import { OgEnvelope } from "@/components/OgEnvelope";
import { DEFAULT_CURRENCY, isCurrency, price } from "@/lib/pricing";

export const alt = "Sending Vibes: interactive cards they'll actually remember";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ cur: string }> }) {
  const { cur } = await params;
  const label = price("card", isCurrency(cur) ? cur : DEFAULT_CURRENCY);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 22,
          backgroundImage: "repeating-linear-gradient(-45deg, #d8432f 0px, #d8432f 26px, #fbf7ef 26px, #fbf7ef 40px, #2b5aa6 40px, #2b5aa6 66px, #fbf7ef 66px, #fbf7ef 80px)",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "50px 70px",
            background: "#f3ecdf",
            color: "#1f1b16",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 660 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: "#d8432f" }}>Sending Vibes</div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 1, marginTop: 22, letterSpacing: -2 }}>
              <span style={{ color: "#d8432f" }}>Personalised</span>
              <span>interactive cards.</span>
            </div>
            <div style={{ fontSize: 30, marginTop: 28, color: "#5b534a" }}>{`Runaway No buttons, mini games, your photos and a big finale. ${label} a card.`}</div>
          </div>
          <div style={{ display: "flex", transform: "rotate(-8deg)" }}>
            <OgEnvelope size={330} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
