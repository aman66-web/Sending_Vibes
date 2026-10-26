import { ImageResponse } from "next/og";
import { OgEnvelope } from "@/components/OgEnvelope";

export const alt = "Sending Vibes: interactive cards they'll actually remember";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "70px 90px",
          background: "linear-gradient(135deg, #ff2e7e 0%, #ff8a3d 55%, #7c3aed 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ fontSize: 34, fontWeight: 700, opacity: 0.85 }}>Sending Vibes</div>
          <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.02, marginTop: 24 }}>Don&apos;t send a card. Send a moment.</div>
          <div style={{ fontSize: 30, marginTop: 28, opacity: 0.9 }}>Runaway No buttons, mini games, your photos and a big finale.</div>
        </div>
        <div style={{ display: "flex", transform: "rotate(-8deg)" }}>
          <OgEnvelope size={380} />
        </div>
      </div>
    ),
    size,
  );
}
