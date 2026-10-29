import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { emailReady } from "@/lib/email";
import { sendReplyEmail, senderOf } from "@/lib/notify";
import { DAY, MINUTE, allow, clientNetwork } from "@/lib/rate-limit";
import { NOTE_MAX, REACTIONS, REPLIES_PER_CARD } from "@/lib/reply";
import { countReplies, saveReply } from "@/lib/storage";

// A thank-you from the person a card is for (components/card/ReplyPanel.tsx), emailed to
// whoever bought it. This never shows the buyer's address. Anyone holding the link could
// send one, so it's kept small: a few per card and per visitor (counted across every
// server), and the words are escaped in the email. Errors are short codes; the page has
// the words for them.

const bodySchema = z.object({
  reaction: z.enum(REACTIONS),
  message: z.string().trim().max(NOTE_MAX).optional(),
});

const PER_VISITOR = [
  { max: 5, per: 10 * MINUTE },
  { max: 20, per: DAY },
];
const PER_CARD = [{ max: REPLIES_PER_CARD, per: DAY }];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail("forbidden", 403);
  if (!/^[A-Za-z0-9]{12}$/.test(id)) return fail("not-found", 404);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("invalid", 400);
  if (!(await allow("reply-ip", clientNetwork(req.headers), PER_VISITOR))) return fail("too-many", 429);

  try {
    const sender = await senderOf(id);
    if (!sender?.order.buyerEmail || !emailReady()) return fail("not-found", 404);
    // A few a day for any card, and a few in all once replies are kept (migration 0007).
    if (!(await allow("reply-card", id, PER_CARD)) || (await countReplies(id)) >= REPLIES_PER_CARD) return fail("full", 409);
    const reply = { reaction: parsed.data.reaction, message: parsed.data.message || undefined };
    await sendReplyEmail(sender.order, sender.item, reply);
    // Kept once it's on its way, so a failed email doesn't use up one of the card's replies.
    await saveReply(id, reply);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Could not send a card's reply", e);
    return fail("failed", 500);
  }
}
