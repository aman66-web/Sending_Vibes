import { allowanceLeft } from "@/lib/allowance";
import { NextResponse } from "next/server";
import { authReady, currentAccount, emailSignInReady, googleEnabled } from "@/lib/auth";
import { getTemplate } from "@/lib/catalog";
import { cardStatus } from "@/lib/delivery";
import { ordersFor } from "@/lib/orders";
import { getCard, openedTimes } from "@/lib/storage";

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
        // Older orders didn't keep the look or the design, so read them from the card.
        // Personalised cards mostly have no design, so those aren't looked up.
        const look = item.occasion && item.theme && (item.template || item.tier === "custom") ? item : await getCard(item.cardId).catch(() => null);
        return {
          id: item.cardId,
          to: item.to,
          from: item.from,
          paidAt: item.paidAt,
          occasion: look?.occasion ?? "friendship",
          theme: look?.theme ?? "ivory",
          // How it's reaching them, and what "make another" should start from.
          status: cardStatus(item),
          template: getTemplate(look?.template)?.slug,
          custom: item.tier === "custom",
          email: item.delivery === "email" ? item.email : undefined,
          sendOn: item.sendOn,
        };
      }),
    );
    // "Opened ✓": when each card was first opened, if it has been (lib/storage.ts).
    const opened = await openedTimes(cards.map((c) => c.id));
    for (const c of cards) Object.assign(c, { openedAt: opened[c.id] });
    // How many typed changes and new cards they have left today.
    const [change, card] = await Promise.all([allowanceLeft(account, "change"), allowanceLeft(account, "card")]).catch(() => [null, null]);
    const left = change && card ? { change: change.left, card: card.left } : undefined;
    return NextResponse.json({ ...ways, account: { email: account.email, name: account.name }, cards, left }, { headers });
  } catch (e) {
    console.error("Could not load account", e);
    return NextResponse.json({ ...ways, account: { email: account.email, name: account.name }, cards: [], error: true }, { headers });
  }
}
