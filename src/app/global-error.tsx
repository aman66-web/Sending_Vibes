"use client";

import { useEffect } from "react";
import { reportCaught, tryAgain } from "@/lib/report-error";

// The last resort, when the part every page shares (the root layout, with the header
// text and the chat) failed and took everything with it. It replaces the whole page, so
// it brings its own <html>, styles and words: the site's text (src/i18n) arrives with
// that layout, and this file loads with every page, so it carries just these few English
// lines rather than the whole dictionary.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => reportCaught(error), [error]);

  return (
    <html lang="en-GB">
      <body style={{ margin: 0, background: "#f3ecdf", color: "#1f1b16", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
        <title>Envelette</title>
        <div aria-hidden style={{ height: 6, background: "repeating-linear-gradient(-45deg, #d8432f 0 14px, #fbf7ef 14px 22px, #2b5aa6 22px 36px, #fbf7ef 36px 44px)" }} />
        <main style={{ minHeight: "calc(100dvh - 6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", textAlign: "center", boxSizing: "border-box" }}>
          <div aria-hidden style={{ fontSize: 72 }}>
            📮
          </div>
          <h1 style={{ margin: "20px 0 0", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 36, lineHeight: 1.15 }}>Sorry, that didn&apos;t work</h1>
          <p style={{ margin: "14px 0 0", maxWidth: 440, fontSize: 18, lineHeight: 1.5, opacity: 0.75 }}>
            Something went wrong on our side, not yours. If someone sent you a card, it&apos;s safe. Please try again.
          </p>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => tryAgain(error, retry)}
              style={{ minHeight: 52, padding: "12px 28px", fontSize: 18, fontWeight: 700, color: "#fff", background: "#d8432f", border: "2px solid #1f1b16", borderRadius: 999, boxShadow: "3px 3px 0 #1f1b16", cursor: "pointer" }}
            >
              Try again
            </button>
            {/* A plain link, so the page loads afresh. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ minHeight: 52, boxSizing: "border-box", display: "inline-flex", alignItems: "center", padding: "12px 28px", fontSize: 18, fontWeight: 700, color: "#1f1b16", background: "#fbf7ef", border: "2px solid #1f1b16", borderRadius: 999, boxShadow: "3px 3px 0 #1f1b16", textDecoration: "none" }}>
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
