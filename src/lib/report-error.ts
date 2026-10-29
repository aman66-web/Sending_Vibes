// Tells the server when something breaks in someone's browser (see api/client-error), so
// the owner can see which game fails on which phone. Only what broke and on which page:
// no card words or names, and card ids are blanked on arrival. A few per page at most.

export type ClientErrorKind = "error" | "rejection" | "boundary";

let sent = 0;
const seen = new Set<string>();

export function reportClientError(kind: ClientErrorKind, value: unknown, digest?: string) {
  try {
    const err = value instanceof Error ? value : null;
    const message = String(err ? err.message : (value ?? "")).slice(0, 300);
    const stack = (err?.stack ?? "").slice(0, 1500);
    // Errors from other sites' scripts and browser add-ons say nothing useful.
    if (!message || message === "Script error." || /-extension:\/\//.test(stack)) return;
    if (sent >= 3 || seen.has(message)) return;
    sent += 1;
    seen.add(message);
    const body = JSON.stringify({ kind, message, stack, path: location.pathname, digest });
    if (navigator.sendBeacon?.("/api/client-error", body)) return;
    fetch("/api/client-error", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {}
}

// The site was updated while the page was open, so parts of the old version have gone.
// Only loading the page afresh fixes that.
export function isStaleCode(error: unknown) {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /ChunkLoadError|Loading (CSS )?chunk|Failed to load chunk|dynamically imported module|Importing a module script failed/i.test(text);
}

// What the error screens do when someone taps "Try again".
export function tryAgain(error: unknown, retry: () => void) {
  if (isStaleCode(error)) window.location.reload();
  else retry();
}

// What an error screen caught. Errors from the server carry a digest and are in the
// server's logs already, so only the browser's own are sent.
export function reportCaught(error: unknown) {
  const digest = typeof error === "object" && error !== null && "digest" in error ? error.digest : undefined;
  if (!digest) reportClientError("boundary", error);
}
