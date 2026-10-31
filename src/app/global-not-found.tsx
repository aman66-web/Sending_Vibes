import type { Metadata } from "next";
import { en } from "@/i18n/en";

// The "ran away" page for an address so broken it never reaches app/[lang]/[cur] (a stray
// "%" that can't be decoded, say), where Next would otherwise show its own bare 404. There's
// no layout around it, so like global-error.tsx it brings its own <html> and plain styles,
// and it's in English, as nothing tells us the visitor's language this early.
const t = en.notFound;

export const metadata: Metadata = { title: `${t.title} · Envelette`, robots: { index: false } };

const button = { minHeight: 52, boxSizing: "border-box", display: "inline-flex", alignItems: "center", padding: "12px 28px", fontSize: 18, fontWeight: 700, border: "2px solid #1f1b16", borderRadius: 999, boxShadow: "3px 3px 0 #1f1b16", textDecoration: "none" } as const;

export default function GlobalNotFound() {
  return (
    <html lang="en-GB">
      <body style={{ margin: 0, background: "#f3ecdf", color: "#1f1b16", fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
        <div aria-hidden style={{ height: 6, background: "repeating-linear-gradient(-45deg, #c23a27 0 14px, #fbf7ef 14px 22px, #2b5aa6 22px 36px, #fbf7ef 36px 44px)" }} />
        <main style={{ minHeight: "calc(100dvh - 6px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", textAlign: "center", boxSizing: "border-box" }}>
          <div aria-hidden style={{ fontSize: 72 }}>
            🙈
          </div>
          <h1 style={{ margin: "20px 0 0", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 36, lineHeight: 1.15 }}>{t.title}</h1>
          <p style={{ margin: "14px 0 0", maxWidth: 440, fontSize: 18, lineHeight: 1.5, opacity: 0.75 }}>{t.body}</p>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            {/* Plain links, so the next page loads afresh with the site's own layout. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ ...button, color: "#fff", background: "#c23a27" }}>
              {t.home}
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/cards" style={{ ...button, color: "#1f1b16", background: "#fbf7ef" }}>
              {t.browse}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
