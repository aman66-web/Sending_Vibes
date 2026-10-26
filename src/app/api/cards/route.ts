import { NextResponse } from "next/server";
import { cardSchema } from "@/lib/card";
import { saveCard } from "@/lib/storage";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = cardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That card doesn't look right. Check every field is filled in." }, { status: 400 });
  }
  const id = await saveCard(parsed.data);
  return NextResponse.json({ id });
}
