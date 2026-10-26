import type { CardData, Occasion } from "./card";
import { TEMPLATES, buildCard, buildTemplateDemo, type Template } from "./catalog";

export type OccasionInfo = {
  label: string;
  emoji: string;
  tagline: string;
};

export const occasions: Record<Occasion, OccasionInfo> = {
  valentine: { label: "Valentine's", emoji: "💘", tagline: "The No button runs away. They have to say yes." },
  birthday: { label: "Birthday", emoji: "🎂", tagline: "Blow out the candles, see the memories, and make a wish." },
  diwali: { label: "Diwali", emoji: "🪔", tagline: "Light the diyas together and finish with fireworks." },
  christmas: { label: "Christmas", emoji: "🎄", tagline: "Unwrap a present and catch the snow." },
  eid: { label: "Eid", emoji: "🌙", tagline: "Catch the stars and send your Eid wishes." },
  anniversary: { label: "Anniversary", emoji: "💍", tagline: "Your story so far, with a quiz about your firsts." },
  sorry: { label: "Sorry", emoji: "🥺", tagline: "Apologise in a way they can't say no to." },
  thanks: { label: "Thank you", emoji: "🙏", tagline: "Say thanks with photos, games and a big finish." },
  congrats: { label: "Congrats", emoji: "🏆", tagline: "Pop the balloons for their big win." },
};

// The first design listed for an occasion is its default.
export function defaultTemplate(occasion: Occasion): Template {
  return TEMPLATES.find((t) => t.occasion === occasion)!;
}

export function buildTemplate(occasion: Occasion, to: string, from: string): CardData {
  return buildCard(defaultTemplate(occasion), to, from);
}

export function buildDemo(occasion: Occasion): CardData {
  return buildTemplateDemo(defaultTemplate(occasion));
}
