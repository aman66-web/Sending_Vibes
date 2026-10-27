import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { cardSchema } from "@/lib/card";
import { GenerateError, generateCard, generateReady } from "@/lib/generate";

// Writes a card from a description, or makes a change to one.

// A whole card can take half a minute to write, and a bad first try is retried once.
export const maxDuration = 120;

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(1000),
  to: z.string().trim().min(1).max(40),
  from: z.string().trim().min(1).max(40),
  card: cardSchema.optional(),
  template: z.string().max(60).regex(/^[a-z0-9-]*$/).optional(),
});

// Each one costs real money, so keep it to a sensible rate per visitor. In memory, so
// it resets on a restart; the spend limit on the API key is the real backstop.
const WINDOW_MS = 60 * 60_000;
const PER_WINDOW = 30;
const recent = new Map<string, number[]>();

function allowed(ip: string) {
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_WINDOW) return false;
  times.push(now);
  recent.set(ip, times);
  if (recent.size > 5000) {
    for (const [key, list] of recent) if (list.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
  }
  return true;
}

export async function POST(req: NextRequest) {
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  const errors = DICTS[isLocale(lang) ? lang : DEFAULT_LOCALE].custom.errors;
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail(errors.failed, 403);
  if (!generateReady()) return fail(errors.off, 503);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  if (!allowed(ip)) return fail(errors.tooMany, 429);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(errors.describe, 400);

  // Streams one JSON event per line: {type:"progress",screens} as each screen is written,
  // then {type:"card",card} or {type:"error",error}.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The visitor may have gone (cancelled, closed the tab), so writing can fail.
      const send = (event: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {}
      };
      try {
        const card = await generateCard(parsed.data, { signal: req.signal, onProgress: (screens) => send({ type: "progress", screens }) });
        send({ type: "card", card });
      } catch (e) {
        if (!req.signal.aborted) console.error("generate failed", e);
        send({ type: "error", error: errors[e instanceof GenerateError ? e.reason : "failed"] });
      }
      try {
        controller.close();
      } catch {}
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
