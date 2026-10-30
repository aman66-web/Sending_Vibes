import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { currentAccount } from "@/lib/auth";
import { isBuyer, senderOf } from "@/lib/notify";
import { orderOfSession, sendCardNow } from "@/lib/orders";
import { HOUR, MINUTE, allow, clientNetwork } from "@/lib/rate-limit";

// "Send it now" for a card booked to be emailed later (components/basket/SendNow.tsx): its
// booked emails go within the minute instead. Only its buyer can: from the thank-you page,
// which holds the Checkout session, or signed in on their account page. Errors are short
// codes; the page has the words for them.

const bodySchema = z.object({ session: z.string().max(255).optional() });

const PER_VISITOR = [
  { max: 10, per: 10 * MINUTE },
  { max: 30, per: HOUR },
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail("forbidden", 403);
  if (!/^[A-Za-z0-9]{12}$/.test(id)) return fail("notFound", 404);
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("failed", 400);
  if (!(await allow("send-now", clientNetwork(req.headers), PER_VISITOR))) return fail("tooMany", 429);

  try {
    const { session } = parsed.data;
    // The thank-you page's own order, or one the signed-in buyer paid for.
    let order = session ? await orderOfSession(session) : null;
    if (!order) {
      const account = await currentAccount().catch(() => null);
      const sender = account ? await senderOf(id) : null;
      order = sender && account && isBuyer(sender.order, account) ? sender.order : null;
    }
    if (!order?.items.some((i) => i.cardId === id)) return fail("notFound", 404);
    const result = await sendCardNow(order, id);
    if (result === "sent") return NextResponse.json({ ok: true });
    return fail(result, result === "notBooked" ? 409 : 502);
  } catch (e) {
    console.error("Could not send a booked card now", e);
    return fail("failed", 500);
  }
}
