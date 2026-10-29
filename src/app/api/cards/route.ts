import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, fmt, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { cardSchema } from "@/lib/card";
import { errorFields, logEvent } from "@/lib/log";
import { DAY, HOUR, allow, clientNetwork } from "@/lib/rate-limit";
import { saveCard } from "@/lib/storage";

// Saves a card (unpaid, until it's bought) and returns its link id.

// The database turns away anything over 100KB anyway (create_card).
const MAX_BYTES = 150_000;

// Each save makes a card in the database, so keep it to what someone making cards needs.
const LIMITS = [
  { max: 30, per: HOUR },
  { max: 100, per: DAY },
];

// The first screen something is wrong on (counting from 0), so the editor can take them
// straight to it. The editor checks the rest (the names, say) before it saves.
function firstBadScreen(issues: readonly { path: readonly PropertyKey[] }[]) {
  const screens = issues.map((i) => (i.path[0] === "screens" && typeof i.path[1] === "number" ? i.path[1] : Infinity));
  const first = Math.min(...screens);
  return Number.isFinite(first) ? first : undefined;
}

export async function POST(req: NextRequest) {
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  const t = DICTS[isLive(lang) ? lang : DEFAULT_LOCALE];
  const errors = t.notFound.errors;
  const fail = (error: string, status: number, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail(t.custom.errors.failed, 403);
  if (Number(req.headers.get("content-length")) > MAX_BYTES) return fail(errors.saveInvalid, 413);
  if (!(await allow("save-card", clientNetwork(req.headers), LIMITS))) {
    logEvent("card_save_limited", {}, "warn");
    return fail(errors.saveTooMany, 429);
  }

  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BYTES) return fail(errors.saveInvalid, 413);
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = cardSchema.safeParse(body);
  if (!parsed.success) {
    const screen = firstBadScreen(parsed.error.issues);
    // Where it went wrong and how, never what was written.
    const issue = parsed.error.issues[0];
    logEvent("card_save_invalid", { screen, code: issue?.code, path: issue?.path.map(String).join(".") }, "warn");
    return screen === undefined ? fail(errors.saveInvalid, 400) : fail(fmt(errors.saveScreen, { n: screen + 1 }), 400, { screen });
  }
  try {
    const id = await saveCard(parsed.data);
    logEvent("card_saved", { screens: parsed.data.screens.length, template: parsed.data.template || undefined });
    return NextResponse.json({ id });
  } catch (e) {
    logEvent("card_save_failed", errorFields(e), "error");
    return fail(t.custom.errors.failed, 500);
  }
}
