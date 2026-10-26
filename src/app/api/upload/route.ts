import { NextResponse } from "next/server";
import { savePhoto, sniffImageType } from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
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
  return NextResponse.json({ url });
}
