import { NextResponse } from "next/server";
import { authReady, currentAccount, emailSignInReady, googleEnabled } from "@/lib/auth";
import { ordersFor } from "@/lib/orders";
import { getCard } from "@/lib/storage";

// The signed-in buyer and every card they've paid for, and which ways of signing in are on.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const google = authReady() && (await googleEnabled());
  const email = emailSignInReady();
  const enabled = google || email;
  const ways = { enabled, google, email };
  const account = enabled ? await currentAccount().catch(() => null) : null;
  if (!account) return NextResponse.json({ ...ways, account: null, cards: [] }, { headers });
  try {
    const orders = await ordersFor(account);
    const items = orders.flatMap((o) => o.items.map((item) => ({ ...item, paidAt: o.paidAt ?? o.createdAt })));
    const cards = await Promise.all(
      items.slice(0, 60).map(async (item) => {
        // Older orders didn't keep the look, so read it from the card.
        const look = item.occasion && item.theme ? item : await getCard(item.cardId).catch(() => null);
        return {
          id: item.cardId,
          to: item.to,
          from: item.from,
          paidAt: item.paidAt,
          occasion: look?.occasion ?? "friendship",
          theme: look?.theme ?? "ivory",
          email: item.delivery === "email" ? item.email : undefined,
          sendOn: item.sendOn,
        };
      }),
    );
    return NextResponse.json({ ...ways, account: { email: account.email, name: account.name }, cards }, { headers });
  } catch (e) {
    console.error("Could not load account", e);
    return NextResponse.json({ ...ways, account: { email: account.email, name: account.name }, cards: [], error: true }, { headers });
  }
}
