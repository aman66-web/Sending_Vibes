// One line of JSON per event, so Vercel → Logs can be searched by name ("event":"…") and
// filtered by field. Only ids, counts, timings and what went wrong: never card words,
// names, email addresses or IP addresses.

type Level = "info" | "warn" | "error";

export function logEvent(event: string, fields: Record<string, unknown> = {}, level: Level = "info") {
  let line: string;
  try {
    line = JSON.stringify({ event, ...fields });
  } catch {
    line = JSON.stringify({ event, unloggable: true });
  }
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

// What an error says, made safe to keep: trimmed, and with anything personal blanked out.
export function errorFields(e: unknown) {
  const err = e instanceof Error ? e : null;
  const digest = typeof e === "object" && e !== null && "digest" in e ? String(e.digest) : undefined;
  return { error: scrub(err ? err.message : String(e)).slice(0, 500), kind: err?.name, digest };
}

// Card links are private (whoever has one can open it), so their ids are blanked too, and
// query strings can carry checkout ids.
export function scrub(text: string) {
  return text
    .replace(/[^\s@<>()"',;:/]+@[^\s@<>()"',;:/]+\.[a-z]{2,}/gi, "[email]")
    .replace(/\/c\/[A-Za-z0-9]{12}(?![A-Za-z0-9])/g, "/c/[id]")
    .replace(/\b(session_id|cs_(?:live|test))[=_][A-Za-z0-9_]+/g, "$1=[id]");
}

// A page's path without its query string, with any card id blanked.
export const safePath = (path: string) => scrub(path.split(/[?#]/)[0]).slice(0, 200);
