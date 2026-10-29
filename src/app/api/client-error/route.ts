import { type NextRequest } from "next/server";
import { z } from "zod";
import { logEvent, safePath, scrub } from "@/lib/log";
import { MINUTE, clientNetwork, limiter } from "@/lib/rate-limit";

// Where browsers report what broke (lib/report-error.ts), and what the trial security
// policy would have blocked (next.config.ts). Each becomes one line in the logs, with
// anything personal blanked out. Counted in memory only: these are just log lines, and
// a flood of them shouldn't become a flood of database calls.

const MAX_BYTES = 8 * 1024;
const perVisitor = limiter(10 * MINUTE, 10);
const perServer = limiter(MINUTE, 120);

const report = z.object({
  kind: z.enum(["error", "rejection", "boundary"]).catch("error"),
  message: z.string().catch(""),
  stack: z.string().catch(""),
  path: z.string().catch(""),
  digest: z.string().max(40).optional().catch(undefined),
});

// Just the site that was blocked, or "inline" / "eval": the rest of an address can be private.
function blocked(value: unknown) {
  const text = typeof value === "string" ? value : "";
  return URL.canParse(text) && /^https?:/.test(text) ? new URL(text).origin : text.slice(0, 40);
}

// A security policy report, in either of the two shapes browsers send.
function cspReport(body: unknown) {
  const list = Array.isArray(body) ? body.filter((r) => r?.type === "csp-violation").map((r) => r.body) : [(body as { "csp-report"?: unknown })?.["csp-report"]];
  return list
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({
      directive: String(r.effectiveDirective ?? r["effective-directive"] ?? r["violated-directive"] ?? "").slice(0, 60),
      blocked: blocked(r.blockedURL ?? r["blocked-uri"]),
      page: URL.canParse(String(r.documentURL ?? r["document-uri"])) ? safePath(new URL(String(r.documentURL ?? r["document-uri"])).pathname) : undefined,
      source: blocked(r.sourceFile ?? r["source-file"]) || undefined,
    }))
    // Browser add-ons trip the policy all the time; they aren't the site's doing.
    .filter((r) => !/-extension$|^(chrome|moz|safari)/.test(r.blocked.split(":")[0]));
}

export async function POST(req: NextRequest) {
  const done = new Response(null, { status: 204 });
  if (Number(req.headers.get("content-length")) > MAX_BYTES) return new Response(null, { status: 413 });
  if (!perVisitor(clientNetwork(req.headers)) || !perServer("all")) return new Response(null, { status: 429 });

  const text = await req.text().catch(() => "");
  if (text.length > MAX_BYTES) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return done;
  }
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 200);

  if (req.nextUrl.searchParams.get("type") === "csp") {
    for (const r of cspReport(body).slice(0, 5)) logEvent("csp_violation", { ...r, ua }, "warn");
    return done;
  }

  // Only the site's own pages report errors. (Security reports come from the browser
  // itself, and some send no usable origin.)
  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return done;
  const parsed = report.safeParse(body);
  if (!parsed.success || !parsed.data.message) return done;
  const { kind, message, stack, path, digest } = parsed.data;
  logEvent("client_error", { kind, message: scrub(message).slice(0, 300), stack: scrub(stack).slice(0, 1500), path: safePath(path), digest, ua }, "error");
  return done;
}
