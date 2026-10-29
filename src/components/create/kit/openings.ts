import { LOOK, corners, kit, type KitItem } from "./parts";

// Openings: the envelope they tap first. The classic one takes the card's own colours;
// the rest bring their own paper, wax seal and a line or two of their own.

export const OPENINGS: KitItem[] = [
  kit.intro("intro", "💌", ["any"], ({ to }) => ({ title: `For ${to}`, subtitle: "Someone's sent you something special", button: "Open it" })),

  kit.intro("intro:midnight", "🌙", ["any", "valentine", "anniversary", "missyou", "eid", "newyear"], ({ to }) => ({
    title: `A letter for ${to}`,
    subtitle: "Written late at night, with you on my mind",
    button: "Read it",
    style: { ...LOOK.midnight, envelope: "#ece6f7", heading: "script", effect: "stars", burst: "sparkles", transition: "fade", stickers: corners(["🌙", "✨", "⭐"], 9, "float") },
    labels: { gotMail: "A midnight letter", tapEnvelope: "Tap to break the seal" },
  })),

  kit.intro("intro:party", "🎉", ["birthday", "congrats", "newyear", "friendship", "fun"], ({ to }) => ({
    title: `Hey ${to}!`,
    subtitle: "Get ready… this one's a party",
    button: "Let's party",
    style: { ...LOOK.party, envelope: "#fffaf0", heading: "bold", body: "rounded", effect: "confetti", burst: "confetti", transition: "bounce", stickers: corners(["🎉", "🎈", "🥳", "🎊"], 10, "bounce") },
    labels: { gotMail: "Party post!", tapEnvelope: "Tap to pop it open" },
  })),

  kit.intro("intro:kiss", "💋", ["valentine", "anniversary", "wedding", "missyou"], ({ to }) => ({
    title: `My dearest ${to}`,
    subtitle: "I've been meaning to tell you something…",
    button: "Read my letter",
    style: { ...LOOK.blush, envelope: "#fff8f9", heading: "script", body: "handwritten", effect: "hearts", burst: "hearts", transition: "fade", stickers: corners(["💋", "❤️", "🌹"], 9, "pulse") },
    labels: { gotMail: "Sealed with a kiss", tapEnvelope: "Tap the kiss to open it" },
  })),

  kit.intro("intro:golden", "✨", ["any", "wedding", "anniversary", "birthday", "congrats", "newyear"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "The pleasure of your company is requested… right this way",
    button: "Step inside",
    style: { ...LOOK.gold, envelope: "#f7efd9", effect: "sparkles", burst: "sparkles", transition: "zoom", stickers: corners(["✨", "✨"], 7, "pulse") },
    labels: { gotMail: "You are cordially invited", tapEnvelope: "Tap to open your invitation" },
  })),

  kit.intro("intro:spooky", "👻", ["halloween", "fun"], ({ to }) => ({
    title: `For ${to}…`,
    subtitle: "Delivered at midnight. No return address.",
    button: "Dare to enter",
    style: { ...LOOK.spooky, envelope: "#d9c9a8", heading: "spooky", effect: "spooky", burst: "spooky", transition: "blur", stickers: corners(["🎃", "👻", "🕸️", "🦇"], 10, "sway") },
    labels: { gotMail: "Something's arrived…", tapEnvelope: "Open it… if you dare" },
  })),

  kit.intro("intro:lantern", "🪔", ["diwali"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "Light, love and something sweet inside",
    button: "Open it",
    style: { ...LOOK.diwali, envelope: "#fff2d9", heading: "storybook", effect: "lanterns", burst: "sparkles", transition: "rise", stickers: corners(["🪔", "✨", "🪔", "🌼"], 9, "pulse") },
    labels: { gotMail: "A festive delivery", tapEnvelope: "Tap to light it up" },
  })),

  kit.intro("intro:north-pole", "🎅", ["christmas"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "Sent straight from the North Pole",
    button: "Open it",
    style: { ...LOOK.noel, envelope: "#fdf6ec", heading: "storybook", effect: "snow", burst: "snow", transition: "drop", stickers: corners(["🎄", "⭐", "🎁", "❄️"], 10, "sway") },
    labels: { gotMail: "Special delivery", tapEnvelope: "Tap to open it before the elves do" },
  })),

  kit.intro("intro:eid-moon", "🌙", ["eid"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "With Eid blessings, from my home to yours",
    button: "Open it",
    style: { ...LOOK.eid, envelope: "#f7f0dc", heading: "classic", effect: "stars", burst: "sparkles", transition: "fade", stickers: corners(["🌙", "⭐", "🕌"], 9, "float") },
    labels: { gotMail: "Eid Mubarak", tapEnvelope: "Tap to open your Eid card" },
  })),

  kit.intro("intro:stork", "🍼", ["newbaby"], ({ to }) => ({
    title: "Welcome, little one",
    subtitle: `A card for ${to}, with all our love`,
    button: "Open it",
    style: { ...LOOK.baby, envelope: "#ffffff", heading: "rounded", body: "rounded", effect: "bubbles", burst: "stars", transition: "rise", stickers: corners(["👶", "🍼", "🧸", "⭐"], 9, "float") },
    labels: { gotMail: "Special delivery!", tapEnvelope: "Tap to open, gently" },
  })),

  kit.intro("intro:balloons", "🎈", ["birthday"], ({ to }) => ({
    title: `Happy birthday, ${to}!`,
    subtitle: "Your birthday card is here. Ready?",
    button: "Let's go",
    style: { ...LOOK.sky, envelope: "#ffffff", heading: "bold", body: "rounded", effect: "balloons", burst: "balloons", transition: "rise", stickers: corners(["🎈", "🎂", "🎈", "🎁"], 10, "float") },
    labels: { gotMail: "Birthday post!", tapEnvelope: "Tap to open your birthday card" },
  })),

  kit.intro("intro:garden", "🌷", ["mothersday", "thanks", "getwell", "any"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "Something lovely has bloomed for you",
    button: "Open it",
    style: { ...LOOK.garden, envelope: "#fffdf7", heading: "storybook", effect: "petals", burst: "petals", transition: "fade", stickers: corners(["🌷", "🦋", "🌸", "🌿"], 9, "sway") },
    labels: { gotMail: "Fresh from the garden", tapEnvelope: "Tap the envelope to open it" },
  })),

  kit.intro("intro:top-secret", "🕵️", ["fun", "birthday", "friendship", "any"], ({ to }) => ({
    title: `TOP SECRET: for ${to} only`,
    subtitle: "This message will self-destruct… only joking. Read on.",
    button: "Accept the mission",
    style: { ...LOOK.film, envelope: "#e8cf98", heading: "typewriter", body: "typewriter", accent: "#d43440", burst: "none", transition: "zoom", stickers: corners(["🔒", "🕵️", "❗"], 8) },
    labels: { gotMail: "Classified", tapEnvelope: "Tap to break the seal. For your eyes only." },
  })),

  kit.intro("intro:snowy", "❄️", ["christmas", "newyear", "missyou"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "A little warmth for a chilly day",
    button: "Open it",
    style: { ...LOOK.frost, envelope: "#ffffff", heading: "storybook", effect: "snow", burst: "snow", transition: "fade", stickers: corners(["❄️", "⛄", "❄️"], 9, "spin") },
    labels: { gotMail: "Brrr… post!", tapEnvelope: "Tap to open it by the fire" },
  })),

  kit.intro("intro:holi", "🎨", ["holi"], ({ to }) => ({
    title: `Happy Holi, ${to}!`,
    subtitle: "Bura na mano, Holi hai! Something colourful is inside",
    button: "Open it",
    style: { ...LOOK.holi, envelope: "#ffffff", heading: "bold", body: "rounded", effect: "colours", burst: "colours", transition: "bounce", stickers: corners(["🎨", "💦", "🌈", "🌸"], 10, "bounce") },
    labels: { gotMail: "Holi hai!", tapEnvelope: "Tap to splash it open" },
  })),

  kit.intro("intro:new-year", "🥂", ["newyear"], ({ to }) => ({
    title: `Happy New Year, ${to}!`,
    subtitle: "A fresh start, and a little something from me",
    button: "Let's begin",
    style: { ...LOOK.newyear, envelope: "#f5f0ff", heading: "classic", effect: "sparkles", burst: "fireworks", transition: "zoom", stickers: corners(["🥂", "🎆", "✨", "🕛"], 9, "pulse") },
    labels: { gotMail: "3… 2… 1…", tapEnvelope: "Tap to open it at midnight" },
  })),

  kit.intro("intro:lace", "💍", ["wedding", "anniversary"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "On your special day, with so much love",
    button: "Open it",
    style: { ...LOOK.ivory, envelope: "#ffffff", heading: "script", effect: "petals", burst: "petals", transition: "fade", stickers: corners(["💍", "🤍", "🕊️"], 8, "float") },
    labels: { gotMail: "With love, on your special day", tapEnvelope: "Tap the envelope to open it" },
  })),

  kit.intro("intro:sunshine", "☀️", ["getwell", "thanks", "friendship", "missyou"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "Sending you a big dose of sunshine",
    button: "Let it in",
    style: { ...LOOK.sunshine, envelope: "#fffdf5", heading: "rounded", body: "rounded", effect: "sparkles", burst: "sparkles", transition: "rise", stickers: corners(["☀️", "🌻", "🌈"], 10, "spin") },
    labels: { gotMail: "A ray of sunshine", tapEnvelope: "Tap to let the sunshine in" },
  })),

  kit.intro("intro:rakhi", "🎀", ["rakhi"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "A thread of love, from me to you",
    button: "Open it",
    style: { ...LOOK.rakhi, envelope: "#fff6ea", heading: "storybook", effect: "petals", burst: "sparkles", transition: "rise", stickers: corners(["🎀", "✨", "🌼"], 9, "sway") },
    labels: { gotMail: "Happy Raksha Bandhan", tapEnvelope: "Tap the envelope to open it" },
  })),

  kit.intro("intro:dad", "👔", ["fathersday"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "Yes, it's a card. No, you don't need your glasses… actually, you might.",
    button: "Open it",
    style: { ...LOOK.navy, envelope: "#f4ecd8", heading: "bold", effect: "stars", burst: "confetti", transition: "slide", stickers: corners(["👔", "🏆", "🔧"], 9) },
    labels: { gotMail: "You've got mail, Dad", tapEnvelope: "Tap the envelope to open it" },
  })),

  kit.intro("intro:sorry", "🏳️", ["sorry"], ({ to }) => ({
    title: `${to}…`,
    subtitle: "I've got something to say. Will you read it?",
    button: "Go on then",
    style: { ...LOOK.dove, envelope: "#ffffff", heading: "handwritten", body: "handwritten", effect: "petals", transition: "fade", stickers: corners(["🏳️", "🥺", "💐"], 9, "sway") },
    labels: { gotMail: "A peace offering", tapEnvelope: "Tap to open it (please)" },
  })),

  kit.intro("intro:thanks", "💐", ["thanks", "leaving", "congrats"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "A big thank you, wrapped up just for you",
    button: "Open it",
    style: { ...LOOK.peach, envelope: "#fffaf5", heading: "storybook", effect: "petals", burst: "confetti", transition: "rise", stickers: corners(["💐", "🙏", "✨"], 9, "float") },
    labels: { gotMail: "With thanks", tapEnvelope: "Tap the envelope to open it" },
  })),

  kit.intro("intro:bon-voyage", "✈️", ["leaving", "missyou", "congrats"], ({ to }) => ({
    title: `For ${to}`,
    subtitle: "Something to pack for your next adventure",
    button: "Open it",
    style: { ...LOOK.travel, envelope: "#fffdf7", heading: "typewriter", effect: "stars", burst: "confetti", transition: "slide", stickers: corners(["✈️", "🌍", "🧳"], 9, "float") },
    labels: { gotMail: "Before you go…", tapEnvelope: "Tap the envelope to open it" },
  })),
];
