import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfilSession, markExpired } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

// Stripe calls this when a checkout is paid (straight away, or later for bank
// payments) or abandoned. Anything that throws returns a 500 and Stripe retries:
// strict fulfilment throws while an email is still worth another go, but not for one
// refused for good (that's kept on the order instead), so retries don't go on for days.
export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "Payments are not set up" }, { status: 503 });

  let event: Stripe.Event;
  try {
    // The signature covers the exact bytes Stripe sent, so read the body as text.
    event = s.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfilSession(event.data.object.id, { strict: true });
      break;
    case "checkout.session.expired": {
      const orderId = event.data.object.metadata?.order_id;
      if (orderId) await markExpired(orderId);
      break;
    }
  }
  return NextResponse.json({ received: true });
}
