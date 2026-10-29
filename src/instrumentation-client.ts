import { reportClientError } from "@/lib/report-error";

// Runs in the browser before each page starts. Errors nothing else caught, on the pages
// where cards play (a sent card, the shop's try-it-out and the demos), go to the server's
// logs. The error screens report what they catch themselves.

const CARD_PAGE = /\/(c\/[A-Za-z0-9]{12}|cards\/[^/]+\/play|demo\/[^/]+)\/?$/;

try {
  window.addEventListener("error", (e) => {
    if (CARD_PAGE.test(location.pathname)) reportClientError("error", e.error ?? e.message);
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (CARD_PAGE.test(location.pathname)) reportClientError("rejection", e.reason);
  });
} catch {}
