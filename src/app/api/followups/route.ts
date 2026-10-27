import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive } from "@/i18n/config";
import { followUpQuestions } from "@/lib/generate";

// Two follow-up questions about a quiz's answers. Returns {questions}, empty if
// there's nothing to ask or anything goes wrong, so the quiz just carries on.

const bodySchema = z.object({ summary: z.string().trim().min(10).max(4000) });

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
  const none = NextResponse.json({ questions: [] });
  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return none;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  if (!allowed(ip)) return none;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return none;
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  try {
    const questions = await followUpQuestions(parsed.data.summary, isLive(lang) ? lang : DEFAULT_LOCALE);
    return NextResponse.json({ questions });
  } catch (e) {
    console.error("follow-up questions failed", e);
    return none;
  }
}
