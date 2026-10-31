import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

// Where card photos are kept (Supabase Storage).
const supabase = URL.canParse(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin : "";
// Vercel's comment toolbar, which only appears on preview deployments.
const preview = process.env.VERCEL_ENV === "preview";
const list = (...sources: (string | false)[]) => sources.filter(Boolean).join(" ");

// What the pages may load, as a trial: browsers report anything that breaks it (to
// /api/client-error, then "csp_violation" in the logs) but block nothing. Once the logs
// stay quiet with real visitors, rename the header to Content-Security-Policy to enforce
// it. Scripts and styles must be allowed inline: Next puts its page data in inline
// scripts, and cards and Tailwind style things inline. Stripe and Google sign-in are
// whole-page visits to their own sites, so they need nothing here.
const trialPolicy = [
  "default-src 'self'",
  `script-src ${list("'self'", "'unsafe-inline'", dev && "'unsafe-eval'", preview && "https://vercel.live")}`,
  `style-src ${list("'self'", "'unsafe-inline'", preview && "https://vercel.live")}`,
  `img-src ${list("'self'", "data:", "blob:", supabase, preview && "https://vercel.live https://vercel.com")}`,
  `font-src ${list("'self'", "data:", preview && "https://vercel.live https://assets.vercel.com")}`,
  `connect-src ${list("'self'", supabase, dev && "ws:", preview && "https://vercel.live wss://ws-us3.pusher.com")}`,
  `frame-src ${list("'self'", preview && "https://vercel.live")}`,
  "worker-src 'self' blob:",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "report-uri /api/client-error?type=csp",
  "report-to csp",
].join("; ");

const securityHeaders = [
  // Safe to enforce now: nobody else's site can show these pages in a frame (to trick
  // a tap), pages can't be pointed elsewhere by an injected <base>, and no plugins.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: "Content-Security-Policy-Report-Only", value: trialPolicy },
  { key: "Reporting-Endpoints", value: 'csp="/api/client-error?type=csp"' },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites see only "envelette.com", never a card's private link.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing on the site uses these. Motion sensors stay allowed: the shake-it game needs them.
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), browsing-topics=()" },
];

// Sent cards are private. Their pages already say "noindex", but this header covers their
// link-preview images too, at both addresses a card can be reached by.
const PRIVATE = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  // app/global-not-found.tsx: the friendly 404 for addresses too broken to reach app/[lang]/[cur].
  experimental: { globalNotFound: true },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/c/:path*", headers: PRIVATE },
      { source: "/:lang/:cur/c/:path*", headers: PRIVATE },
    ];
  },
};

export default nextConfig;
