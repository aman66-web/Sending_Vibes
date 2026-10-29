import { BLANK } from "@/lib/blanks";
import { LOOK, corners, kit, type KitItem } from "./parts";

// Endings: the big finale, each with its own celebration. The first leaves the big words
// to them; the rest are written already, with both names in.

export const ENDINGS: KitItem[] = [
  kit.finale("finale", "🎆", ["any"], ({ from }) => ({ title: BLANK.bigMessage, body: `With all my love, ${from}`, effect: "fireworks" })),

  kit.finale("finale:hearts", "💕", ["valentine", "anniversary", "wedding", "missyou"], ({ to, from }) => ({
    title: `I love you, ${to}`,
    body: `Always and forever. Love, ${from}`,
    effect: "hearts",
    style: { ...LOOK.rouge, heading: "script", transition: "zoom", stickers: corners(["💕", "💋", "🌹"], 9, "pulse") },
  })),

  kit.finale("finale:confetti", "🎊", ["birthday", "congrats", "newyear", "friendship", "fun", "any"], ({ to, from }) => ({
    title: `Three cheers for ${to}!`,
    body: `Hip hip hooray! Love, ${from}`,
    effect: "confetti",
    style: { ...LOOK.party, heading: "bold", body: "rounded", transition: "bounce", stickers: corners(["🎊", "🎉", "🥳"], 10, "bounce") },
  })),

  kit.finale("finale:birthday", "🎂", ["birthday"], ({ to, from }) => ({
    title: `Happy birthday, ${to}!`,
    body: `Have the most wonderful day. Love, ${from}`,
    effect: "confetti",
    style: { ...LOOK.pastel, heading: "bold", body: "rounded", transition: "zoom", stickers: corners(["🎂", "🎈", "🎁", "🧁"], 10, "float") },
  })),

  kit.finale("finale:balloons", "🎈", ["birthday", "newbaby", "congrats"], ({ to, from }) => ({
    title: `Hooray for ${to}!`,
    body: `Up, up and away. Love, ${from}`,
    effect: "balloons",
    style: { ...LOOK.sky, heading: "bold", body: "rounded", transition: "rise", stickers: corners(["🎈", "☁️"], 10, "float") },
  })),

  kit.finale("finale:gold", "✨", ["anniversary", "wedding", "congrats", "birthday", "newyear"], ({ to, from }) => ({
    title: `Here's to you, ${to}`,
    body: `With love and the very best wishes, ${from}`,
    effect: "sparkles",
    style: { ...LOOK.gold, heading: "script", transition: "zoom", stickers: corners(["✨", "🥂"], 8, "pulse") },
  })),

  kit.finale("finale:lanterns", "🏮", ["diwali", "eid", "newyear", "wedding"], ({ to, from }) => ({
    title: `May your days be bright, ${to}`,
    body: `With love and light, ${from}`,
    effect: "lanterns",
    style: { ...LOOK.diwali, heading: "storybook", transition: "rise", stickers: corners(["🏮", "✨"], 9, "float") },
  })),

  kit.finale("finale:diwali", "🪔", ["diwali"], ({ to, from }) => ({
    title: `Happy Diwali, ${to}!`,
    body: `May the festival of lights bring you joy all year. Love, ${from}`,
    effect: "fireworks",
    style: { ...LOOK.midnight, heading: "storybook", transition: "zoom", stickers: corners(["🪔", "🎆"], 9, "pulse") },
  })),

  kit.finale("finale:snow", "❄️", ["christmas"], ({ to, from }) => ({
    title: `Merry Christmas, ${to}!`,
    body: `Love and warm wishes, ${from}`,
    effect: "snow",
    style: { ...LOOK.noel, heading: "storybook", transition: "drop", stickers: corners(["🎄", "⛄", "🎁"], 10, "sway") },
  })),

  kit.finale("finale:eid", "🌙", ["eid"], ({ to, from }) => ({
    title: `Eid Mubarak, ${to}!`,
    body: `May this Eid bring you and your family peace and happiness. With love, ${from}`,
    effect: "stars",
    style: { ...LOOK.eid, transition: "fade", stickers: corners(["🌙", "⭐", "🕌"], 9, "float") },
  })),

  kit.finale("finale:new-year", "🥂", ["newyear"], ({ to, from }) => ({
    title: `Happy New Year, ${to}!`,
    body: `Here's to the best year yet. Love, ${from}`,
    effect: "fireworks",
    style: { ...LOOK.newyear, transition: "zoom", stickers: corners(["🥂", "🍾"], 9, "pulse") },
  })),

  kit.finale("finale:holi", "🌈", ["holi"], ({ to, from }) => ({
    title: `Happy Holi, ${to}!`,
    body: `Have the most colourful day. Love, ${from}`,
    effect: "colours",
    style: { ...LOOK.holi, heading: "bold", body: "rounded", transition: "bounce", stickers: corners(["🌈", "🎨", "💦"], 10, "bounce") },
  })),

  kit.finale("finale:spooky", "🦇", ["halloween"], ({ to, from }) => ({
    title: `Happy Halloween, ${to}!`,
    body: `Mwahaha! Love from beyond, ${from}`,
    effect: "spooky",
    style: { ...LOOK.spooky, heading: "spooky", transition: "blur", stickers: corners(["🎃", "🦇", "👻"], 10, "sway") },
  })),

  kit.finale("finale:petals", "🌸", ["mothersday", "wedding", "thanks", "getwell", "any"], ({ to, from }) => ({
    title: `You're wonderful, ${to}`,
    body: `Never forget it. Love, ${from}`,
    effect: "petals",
    style: { ...LOOK.garden, heading: "script", transition: "fade", stickers: corners(["🌸", "🌷"], 9, "sway") },
  })),

  kit.finale("finale:mum", "💐", ["mothersday"], ({ to, from }) => ({
    title: `Happy Mother's Day, ${to}!`,
    body: `Thank you for everything. All my love, ${from}`,
    effect: "petals",
    style: { ...LOOK.blush, heading: "script", transition: "zoom", stickers: corners(["💐", "💖"], 9, "float") },
  })),

  kit.finale("finale:dad", "🏆", ["fathersday"], ({ to, from }) => ({
    title: `Happy Father's Day, ${to}!`,
    body: `The best dad in the world, officially. Love, ${from}`,
    effect: "confetti",
    style: { ...LOOK.navy, heading: "bold", transition: "zoom", stickers: corners(["🏆", "👔"], 9, "pulse") },
  })),

  kit.finale("finale:rakhi", "🎀", ["rakhi"], ({ to, from }) => ({
    title: `Happy Raksha Bandhan, ${to}!`,
    body: `Always there for each other. Love, ${from}`,
    effect: "sparkles",
    style: { ...LOOK.rakhi, heading: "storybook", transition: "rise", stickers: corners(["🎀", "✨"], 9, "sway") },
  })),

  kit.finale("finale:sorry", "🕊️", ["sorry"], ({ to, from }) => ({
    title: `I'm sorry, ${to}`,
    body: `Thank you for reading this. Love, ${from}`,
    effect: "petals",
    style: { ...LOOK.dove, heading: "handwritten", transition: "fade", stickers: corners(["🕊️", "💐"], 9, "float") },
  })),

  kit.finale("finale:stars", "🌟", ["newbaby", "missyou", "congrats", "any"], ({ to, from }) => ({
    title: `You're a star, ${to}`,
    body: `Shine on. Love, ${from}`,
    effect: "stars",
    style: { ...LOOK.ocean, heading: "storybook", transition: "fade", stickers: corners(["🌟", "🌙"], 9, "float") },
  })),

  kit.finale("finale:bubbles", "🫧", ["getwell", "newbaby", "fun"], ({ to, from }) => ({
    title: `Sending you love, ${to}`,
    body: `Big hugs and lots of love, ${from}`,
    effect: "bubbles",
    style: { ...LOOK.teal, heading: "rounded", body: "rounded", transition: "rise", stickers: corners(["🫧", "💙"], 9, "float") },
  })),

  kit.finale("finale:farewell", "✈️", ["leaving"], ({ to, from }) => ({
    title: `Good luck, ${to}!`,
    body: `We'll miss you loads. Keep in touch! Love, ${from}`,
    effect: "confetti",
    style: { ...LOOK.travel, heading: "typewriter", transition: "slide", stickers: corners(["✈️", "🌍", "🧳"], 9, "float") },
  })),
];
