"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// A sent card's link is the only key to it, so the stats see every card as "/c/[card]",
// in any language. Only utm_ tags are kept from the query, so a Stripe session id
// (?session_id= on the thank-you page) or a sign-in code never leaves the browser.
export function redact(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.pathname = url.pathname.replace(/(^|\/)c\/[^/]+/, "$1c/[card]");
  for (const key of [...url.searchParams.keys()]) if (!key.startsWith("utm_")) url.searchParams.delete(key);
  url.hash = "";
  return { ...event, url: url.toString() };
}

// Vercel's visitor counts: pages viewed and where visitors came from, with no cookies.
export function VisitorStats() {
  return <Analytics beforeSend={redact} />;
}
