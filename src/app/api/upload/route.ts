import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { DAY, HOUR, allow, clientNetwork } from "@/lib/rate-limit";
import { logEvent } from "@/lib/log";
import { savePhoto, sniffImageType } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;

// Photos are public once uploaded, so keep this to what people making cards need: a card
// holds up to 6, and a family on one Wi-Fi might make a few cards and swap photos about.
const LIMITS = [
  { max: 40, per: HOUR },
  { max: 150, per: DAY },
];

export async function POST(req: NextRequest) {
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  const t = DICTS[isLive(lang) ? lang : DEFAULT_LOCALE];
  // Only from the site's own pages.
  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) {
    return NextResponse.json({ error: t.editor.uploadFailed }, { status: 403 });
  }
  if (Number(req.headers.get("content-length")) > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "That photo is too big (max 5MB)." }, { status: 413 });
  }
  if (!(await allow("upload", clientNetwork(req.headers), LIMITS))) {
    logEvent("upload_limited", {}, "warn");
    return NextResponse.json({ error: t.notFound.errors.uploadTooMany }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is too big (max 5MB)." }, { status: 413 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) {
    return NextResponse.json({ error: "Only JPG, PNG or WebP photos please." }, { status: 415 });
  }
  const url = await savePhoto(bytes, type);
  logEvent("photo_uploaded", { bytes: bytes.length, type });
  return NextResponse.json({ url });
}
