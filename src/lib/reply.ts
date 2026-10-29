import type { Occasion } from "./card";

// What the person a card is for can send back from its last screen
// (components/card/ReplyPanel.tsx, api/cards/[id]/reply). Shared by the page and the server.

export const REACTIONS = ["love", "laugh", "tears", "party"] as const;
export type Reaction = (typeof REACTIONS)[number];

export const REACTION_EMOJI: Record<Reaction, string> = { love: "❤️", laugh: "😂", tears: "🥹", party: "🎉" };

// The few words they can add, and how many thank-yous one card can send its sender.
export const NOTE_MAX = 300;
export const REPLIES_PER_CARD = 3;

// The card to send back. Some occasions go both ways (Diwali, Eid, Christmas); for
// one-way ones, a thank-you is the natural answer. Every occasion is listed, so a new one
// won't type-check until someone picks its answer.
const SEND_BACK: Record<Occasion, Occasion> = {
  valentine: "valentine",
  birthday: "thanks",
  diwali: "diwali",
  christmas: "christmas",
  eid: "eid",
  anniversary: "anniversary",
  sorry: "friendship",
  thanks: "friendship",
  congrats: "thanks",
  halloween: "halloween",
  newyear: "newyear",
  mothersday: "thanks",
  fathersday: "thanks",
  rakhi: "rakhi",
  holi: "holi",
  newbaby: "thanks",
  wedding: "thanks",
  getwell: "thanks",
  missyou: "missyou",
  friendship: "friendship",
  leaving: "missyou",
  graduation: "thanks",
  retirement: "thanks",
  newhome: "thanks",
};

// The card maker with both names swapped and that occasion's designs showing
// (app/[lang]/[cur]/create/page.tsx reads these).
export function sendBackHref(card: { to: string; from: string; occasion: Occasion }) {
  const params = new URLSearchParams({ occasion: SEND_BACK[card.occasion], to: card.from, from: card.to });
  return `/create?${params}`;
}
