import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, fmt, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { ALLOWANCE, allowanceLeft, spend, type Kind } from "@/lib/allowance";
import { currentAccount, signInAvailable, type Account } from "@/lib/auth";
import { briefSchema } from "@/lib/brief";
import { cardSchema } from "@/lib/card";
import { GenerateError, generateCard, generateReady } from "@/lib/generate";

// Writes a card from a description, or makes a change to one.

// A whole card can take a minute or two to write, and a bad first try is retried once if
// there's time. lib/generate.ts gives up before this, so the visitor still hears back and
// gets their go back.
export const maxDuration = 300;

const bodySchema = z.object({
  // All the answers to the questions can run to a few thousand characters.
  prompt: z.string().trim().min(3).max(5000),
  to: z.string().trim().min(1).max(40),
  from: z.string().trim().min(1).max(40),
  card: cardSchema.optional(),
  template: z.string().max(60).regex(/^[a-z0-9-]*$/).optional(),
  keepDesign: z.boolean().optional(),
  focus: z.string().max(40).optional(),
  // The choices from the questions, for a new card.
  brief: briefSchema.optional(),
  // The creative directions of their last few cards, so the next one looks different.
  avoid: z.array(z.string().max(40)).max(12).optional(),
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

// Who's asking: every use of the AI needs an account once signing in is switched on
// (new cards are made after signing up, the last step of the questions). If the check
// itself fails, let them through rather than stop anyone making a card.
async function whoIsAsking(): Promise<{ account: Account | null; needed: boolean }> {
  try {
    if (!(await signInAvailable())) return { account: null, needed: false };
    return { account: await currentAccount(), needed: true };
  } catch {
    return { account: null, needed: false };
  }
}

export async function POST(req: NextRequest) {
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLive(lang) ? lang : DEFAULT_LOCALE;
  const errors = DICTS[locale].custom.errors;
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail(errors.failed, 403);
  if (!generateReady()) return fail(errors.off, 503);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  if (!allowed(ip)) return fail(errors.tooMany, 429);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(errors.describe, 400);

  // Each account has a daily allowance (lib/allowance.ts), so nobody can run up the bill
  // without buying. One use is counted before the AI starts and given back if it fails.
  const kind: Kind = parsed.data.card ? "change" : "card";
  const { account, needed } = await whoIsAsking();
  if (needed && !account) return fail(errors.signIn, 401);
  let refund: (() => Promise<void>) | undefined;
  let left: number | undefined;
  if (account) {
    try {
      const allowance = await allowanceLeft(account, kind);
      if (allowance.left <= 0) {
        const message = allowance.reason === "day" ? (kind === "card" ? errors.limitDayCards : errors.limitDayChanges) : kind === "card" ? errors.limitCards : errors.limitChanges;
        return NextResponse.json({ error: fmt(message, { n: allowance.total, more: ALLOWANCE.perCardBought[kind] }), left: 0 }, { status: 429 });
      }
      refund = await spend(account, kind);
      left = allowance.left - 1;
    } catch (e) {
      console.error("allowance check failed", e);
    }
  }

  // Streams one JSON event per line: {type:"idea",idea} with the card's big idea as soon as
  // it's written (new cards only), {type:"progress",screens,titles} as each screen and its
  // title are written (titles[i] is null until screen i's title is), then
  // {type:"card",card,note,left,direction,idea} or {type:"error",error}.
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
        const { card, note, direction, idea } = await generateCard(
          { ...parsed.data, locale },
          {
            signal: req.signal,
            onIdea: (idea) => send({ type: "idea", idea }),
            onProgress: (screens, titles) => send({ type: "progress", screens, titles }),
          },
        );
        send({ type: "card", card, note, left, direction, idea });
      } catch (e) {
        // Whatever went wrong, they get their go back.
        await refund?.().catch((r) => console.error("allowance refund failed", r));
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
