import { after, type NextRequest } from "next/server";
import { currentAccount } from "@/lib/auth";
import { isBuyer, sendOpenedEmail, senderOf } from "@/lib/notify";
import { clientIp, limiter } from "@/lib/rate-limit";
import { claimFirstOpen } from "@/lib/storage";

// Sent once by the card's page when its envelope is opened (components/card/OpenedBeacon.tsx).
// The first opening is noted and its buyer emailed, once; every later call does nothing.
// Only the time is kept: nothing about who opened it or where. The answer is always the
// same, so it says nothing about the card.

const perIp = limiter(10 * 60_000, 30);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const done = () => new Response(null, { status: 204 });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return new Response(null, { status: 403 });
  if (!/^[A-Za-z0-9]{12}$/.test(id) || !perIp(clientIp(req.headers))) return done();

  try {
    const sender = await senderOf(id);
    if (!sender) return done();
    // A card that's still waiting to be emailed can't have reached them yet: this is its buyer looking.
    if (sender.item.sendAt && Date.parse(sender.item.sendAt) > Date.now()) return done();
    // The buyer looking at their own card, signed in, isn't the card being opened.
    const account = await currentAccount().catch(() => null);
    if (account && isBuyer(sender.order, account)) return done();
    if (await claimFirstOpen(id)) {
      // After the answer has gone, so the page never waits on the email.
      after(() => sendOpenedEmail(sender.order, sender.item).catch((e) => console.error("Could not send the card-opened email", e)));
    }
  } catch (e) {
    console.error("Could not note a card being opened", e);
  }
  return done();
}
