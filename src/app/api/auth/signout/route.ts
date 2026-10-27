import { NextResponse } from "next/server";
import { authClient, authReady } from "@/lib/auth";

export async function POST() {
  if (authReady()) await (await authClient()).auth.signOut();
  return NextResponse.json({ ok: true });
}
