import type { CardData, Occasion, Screen } from "./card";

export type OccasionInfo = {
  label: string;
  emoji: string;
  tagline: string;
};

export const occasions: Record<Occasion, OccasionInfo> = {
  valentine: {
    label: "Valentine's",
    emoji: "💘",
    tagline: "The No button runs away. They have to say yes.",
  },
  diwali: {
    label: "Diwali",
    emoji: "🪔",
    tagline: "Light the diyas together and finish with fireworks.",
  },
  birthday: {
    label: "Birthday",
    emoji: "🎂",
    tagline: "Blow out the candles, see the memories, and make a wish.",
  },
};

export function buildTemplate(occasion: Occasion, to: string, from: string): CardData {
  const screens = templateScreens[occasion](to, from);
  return {
    occasion,
    to,
    from,
    theme: occasion === "valentine" ? "rose" : occasion === "diwali" ? "marigold" : "party",
    ambient: occasion === "valentine" ? "hearts" : occasion === "diwali" ? "sparkles" : "none",
    screens,
  };
}

const templateScreens: Record<Occasion, (to: string, from: string) => Screen[]> = {
  valentine: (to, from) => [
    {
      id: "intro",
      type: "intro",
      title: `Hey ${to} 💌`,
      subtitle: `${from} made you something. Tap when you're ready.`,
      button: "Open it",
    },
    {
      id: "question",
      type: "question",
      question: `${to}, will you be my Valentine?`,
      yes: "Yes! 💖",
      no: "No",
      afterYes: "I knew you'd say yes 🥰",
    },
    {
      id: "photos",
      type: "photos",
      title: "Some of my favourite moments with you",
      captions: [],
      photos: [],
    },
    {
      id: "game",
      type: "game",
      game: "catch-hearts",
      title: "Catch my love",
      instructions: "Tap 10 falling hearts to unlock your surprise",
      winText: "You caught all my love! 💘",
    },
    {
      id: "message",
      type: "message",
      title: "Just so you know…",
      body: `Every day with you is my favourite day. Thank you for being you.\n\nLove, ${from}`,
    },
    {
      id: "finale",
      type: "finale",
      title: "Happy Valentine's Day ❤️",
      body: "Now screenshot this and send it back to me 😌",
      effect: "hearts",
    },
  ],
  diwali: (to, from) => [
    {
      id: "intro",
      type: "intro",
      title: `Happy Diwali, ${to} ✨`,
      subtitle: `${from} sent you a little festival of lights.`,
      button: "Let's begin",
    },
    {
      id: "game",
      type: "game",
      game: "light-diyas",
      title: "Light the diyas",
      instructions: "Tap each diya to light it",
      winText: "May your home always be this bright 🪔",
    },
    {
      id: "photos",
      type: "photos",
      title: "Memories that light me up",
      captions: [],
      photos: [],
    },
    {
      id: "message",
      type: "message",
      title: "My Diwali wish for you",
      body: `Wishing you and your family love, light, laughter and lots of mithai this Diwali.\n\nWarmly, ${from}`,
    },
    {
      id: "finale",
      type: "finale",
      title: "Shubh Deepavali 🎆",
      body: "May this year bring you light in every way.",
      effect: "fireworks",
    },
  ],
  birthday: (to, from) => [
    {
      id: "intro",
      type: "intro",
      title: `It's your day, ${to}! 🎉`,
      subtitle: `${from} has a surprise for you.`,
      button: "Let's party",
    },
    {
      id: "game",
      type: "game",
      game: "blow-candles",
      title: "Make a wish…",
      instructions: "Tap every flame to blow out your candles",
      winText: "Wish made! I hope it comes true 🌟",
    },
    {
      id: "photos",
      type: "photos",
      title: "Another year of great memories",
      captions: [],
      photos: [],
    },
    {
      id: "message",
      type: "message",
      title: "Happy birthday!",
      body: `Here's to another year of being amazing. Can't wait to celebrate with you.\n\nLove, ${from}`,
    },
    {
      id: "finale",
      type: "finale",
      title: `Happy Birthday ${to}! 🎂`,
      body: "Go eat some cake. You've earned it.",
      effect: "confetti",
    },
  ],
};
