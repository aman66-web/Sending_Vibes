import { ImageResponse } from "next/og";

// The postage-stamp logo as a square PNG at /logo.png, for search engines (see siteData in
// lib/structured-data.ts). Same drawing as the site icon.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3ecdf" }}>
        <svg width="440" height="440" viewBox="0 0 40 40">
          <path
            d="M1 1 L2.47 1 A1.7 1.7 0 0 0 5.87 1 L8.8 1 A1.7 1.7 0 0 0 12.2 1 L15.13 1 A1.7 1.7 0 0 0 18.53 1 L21.47 1 A1.7 1.7 0 0 0 24.87 1 L27.8 1 A1.7 1.7 0 0 0 31.2 1 L34.13 1 A1.7 1.7 0 0 0 37.53 1 L39 1 L39 2.47 A1.7 1.7 0 0 0 39 5.87 L39 8.8 A1.7 1.7 0 0 0 39 12.2 L39 15.13 A1.7 1.7 0 0 0 39 18.53 L39 21.47 A1.7 1.7 0 0 0 39 24.87 L39 27.8 A1.7 1.7 0 0 0 39 31.2 L39 34.13 A1.7 1.7 0 0 0 39 37.53 L39 39 L37.53 39 A1.7 1.7 0 0 0 34.13 39 L31.2 39 A1.7 1.7 0 0 0 27.8 39 L24.87 39 A1.7 1.7 0 0 0 21.47 39 L18.53 39 A1.7 1.7 0 0 0 15.13 39 L12.2 39 A1.7 1.7 0 0 0 8.8 39 L5.87 39 A1.7 1.7 0 0 0 2.47 39 L1 39 L1 37.53 A1.7 1.7 0 0 0 1 34.13 L1 31.2 A1.7 1.7 0 0 0 1 27.8 L1 24.87 A1.7 1.7 0 0 0 1 21.47 L1 18.53 A1.7 1.7 0 0 0 1 15.13 L1 12.2 A1.7 1.7 0 0 0 1 8.8 L1 5.87 A1.7 1.7 0 0 0 1 2.47 Z"
            fill="#d8432f"
          />
          <rect x="6" y="6" width="28" height="28" fill="none" stroke="#fbf7ef" strokeWidth="1.4" />
          <path d="M20 29.5s-8-4.6-8-10.2c0-2.6 2-4.6 4.4-4.6 1.6 0 2.8.8 3.6 2 .8-1.2 2-2 3.6-2 2.4 0 4.4 2 4.4 4.6 0 5.6-8 10.2-8 10.2z" fill="#fbf7ef" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
