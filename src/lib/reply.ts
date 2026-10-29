import type { Occasion } from "./card";

// What the person a card is for can send back from its last screen
// (components/card/ReplyPanel.tsx, api/cards/[id]/reply). Shared by the page and the server.

export const REACTIONS = ["love", "laugh", "tears", "party"] as const;
export type Reaction = (typeof REACTIONS)[number];

export const REACTION_EMOJI: Record<Reaction, string> = { love: "❤️", laugh: "😂", tears: "🥹", party: "🎉" };

// The few words they can add, and how many thank-yous one card can send its sender.
export const NOTE_MAX = 300;
export const REPLIES_PER_CARD = 3;

// The card to send back. Some occasions go both ways (Diwali, Eid, Christmas); for the
// rest, a thank-you is the natural answer.
const SEND_BACK: Partial<Record<Occasion, Occasion>> = {
  birthday: "thanks",
  getwell: "thanks",
  congrats: "thanks",
  newbaby: "thanks",
  wedding: "thanks",
  mothersday: "thanks",
  fathersday: "thanks",
  thanks: "friendship",
  sorry: "friendship",
  leaving: "missyou",
};

// The card maker with both names swapped and that occasion's designs showing
// (app/[lang]/[cur]/create/page.tsx reads these).
export function sendBackHref(card: { to: string; from: string; occasion: Occasion }) {
  const params = new URLSearchParams({ occasion: SEND_BACK[card.occasion] ?? card.occasion, to: card.from, from: card.to });
  return `/create?${params}`;
}
