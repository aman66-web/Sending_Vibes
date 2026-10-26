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
  halloween: { label: "Halloween", emoji: "🎃", tagline: "Whack the ghosts, grab the sweets, get spooked." },
  newyear: { label: "New Year", emoji: "🥂", tagline: "Launch the fireworks and toast to the year ahead." },
  mothersday: { label: "Mother's Day", emoji: "💐", tagline: "Grow her a flower and tell her what she means to you." },
  fathersday: { label: "Father's Day", emoji: "👔", tagline: "Dad jokes, a quiz he can't fail and a big thank you." },
  rakhi: { label: "Raksha Bandhan", emoji: "🎀", tagline: "For your brother or sister: memories, teasing and a promise." },
  holi: { label: "Holi", emoji: "🌈", tagline: "Throw colours all over the screen. No stains, all the fun." },
  newbaby: { label: "New baby", emoji: "👶", tagline: "Welcome the little one, or scratch to reveal big news." },
  wedding: { label: "Wedding", emoji: "💒", tagline: "Pop the question or toast the happy couple." },
  getwell: { label: "Get well", emoji: "🌻", tagline: "A hug they can hold and some bubble wrap for the sofa." },
  missyou: { label: "Miss you", emoji: "🫶", tagline: "For long distance: a hug they can actually feel." },
  friendship: { label: "Best friends", emoji: "👯", tagline: "Inside jokes, a bestie quiz and your best photos." },
  leaving: { label: "Leaving", emoji: "👋", tagline: "Send off a colleague with games and good wishes." },
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
