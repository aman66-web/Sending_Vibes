import { BLANK } from "@/lib/blanks";
import { LOOK, corners, kit, type KitItem } from "./parts";

// Messages and photos: letters, photo stacks, timelines, jars of reasons and coupon books.
// Words that only they can write are blanks (see lib/blanks.ts); the rest is written
// already, so the screen works as it is.

const MESSAGES: KitItem[] = [
  kit.message("message", "✉️", ["any"], ({ from }) => ({ title: "A little note", body: `${BLANK.message}\n\nLove, ${from}` })),

  kit.message("message:love-letter", "💌", ["valentine", "anniversary", "wedding", "missyou"], ({ to, from }) => ({
    title: `Dear ${to}`,
    body: `${BLANK.message}\n\nForever yours,\n${from}`,
    style: { ...LOOK.blush, heading: "script", body: "handwritten", transition: "fade", tune: { speed: 0.8 }, stickers: corners(["🌹", "💌"], 9, "sway") },
  })),

  kit.message("message:birthday", "🎂", ["birthday"], ({ to, from }) => ({
    title: `Happy birthday, ${to}!`,
    body: `${BLANK.message}\n\nHave the best day,\n${from}`,
    style: { ...LOOK.party, heading: "bold", body: "rounded", effect: "confetti", transition: "bounce", stickers: corners(["🎂", "🎈", "🎉"], 9, "bounce") },
  })),

  kit.message("message:birthday-poem", "📝", ["birthday"], ({ to, from }) => ({
    title: `Happy birthday, ${to}`,
    body: `Another year, another candle,\nanother reason to celebrate you.\nMay today be full of cake, laughter\nand everything you love.\n\nHappy birthday!\nLove, ${from}`,
    style: { ...LOOK.pastel, heading: "storybook", body: "handwritten", effect: "balloons", transition: "rise", stickers: corners(["🧁", "🎈"], 9, "float") },
  })),

  kit.message("message:roses", "🌹", ["valentine", "anniversary"], ({ from }) => ({
    title: "Roses are red…",
    body: `Roses are red,\nviolets are blue,\nof all the people in the world,\nI'm so glad I've got you.\n\nLove, ${from}`,
    style: { ...LOOK.rouge, heading: "script", body: "handwritten", effect: "petals", transition: "fade", stickers: corners(["🌹", "❤️"], 9, "pulse") },
  })),

  kit.message("message:thanks", "🙏", ["thanks", "leaving", "mothersday", "fathersday"], ({ to, from }) => ({
    title: `Thank you, ${to}`,
    body: `${BLANK.message}\n\nWith thanks and love,\n${from}`,
    style: { ...LOOK.peach, heading: "storybook", effect: "petals", transition: "rise", stickers: corners(["💐", "✨"], 9, "float") },
  })),

  kit.message("message:sorry", "🥺", ["sorry"], ({ from }) => ({
    title: "I'm sorry",
    body: `${BLANK.message}\n\nI hope you can forgive me.\n${from}`,
    style: { ...LOOK.dove, heading: "handwritten", body: "handwritten", transition: "fade", tune: { speed: 0.8 }, stickers: corners(["🥺", "💐"], 9, "sway") },
  })),

  kit.message("message:get-well", "🌻", ["getwell"], ({ to, from }) => ({
    title: `Get well soon, ${to}`,
    body: `${BLANK.message}\n\nThinking of you,\n${from}`,
    style: { ...LOOK.sunshine, heading: "rounded", body: "rounded", effect: "sparkles", transition: "rise", stickers: corners(["🌻", "☀️", "🍵"], 9, "sway") },
  })),

  kit.message("message:get-well-hug", "🫶", ["getwell"], ({ to, from }) => ({
    title: `Feel better soon, ${to}`,
    body: `Sorry you're feeling poorly.\nI'm sending a big hug, a hot cup of tea and all the get-well-soon wishes I can fit in one card.\n\nRest up and be kind to yourself.\nLove, ${from}`,
    style: { ...LOOK.mint, heading: "storybook", effect: "bubbles", transition: "fade", stickers: corners(["🫶", "🍵"], 9, "float") },
  })),

  kit.message("message:proud", "🏆", ["congrats", "birthday", "leaving"], ({ to, from }) => ({
    title: `So proud of you, ${to}`,
    body: `${BLANK.message}\n\nYou did it!\n${from}`,
    style: { ...LOOK.navy, heading: "bold", effect: "stars", transition: "zoom", stickers: corners(["🏆", "⭐", "🎓"], 9, "pulse") },
  })),

  kit.message("message:christmas", "🎄", ["christmas"], ({ to, from }) => ({
    title: `Merry Christmas, ${to}`,
    body: `${BLANK.message}\n\nWith love at Christmas,\n${from}`,
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", transition: "drop", stickers: corners(["🎄", "❄️", "⭐"], 9, "sway") },
  })),

  kit.message("message:christmas-wishes", "🎅", ["christmas"], ({ to, from }) => ({
    title: `Merry Christmas, ${to}!`,
    body: `Wishing you a Christmas full of warmth, laughter and far too many mince pies.\nThank you for being you.\n\nMerry Christmas and a happy new year,\n${from}`,
    style: { ...LOOK.frost, heading: "storybook", effect: "snow", transition: "fade", stickers: corners(["🎅", "🎁"], 9, "float") },
  })),

  kit.message("message:diwali", "🪔", ["diwali"], ({ to, from }) => ({
    title: `Happy Diwali, ${to}`,
    body: `${BLANK.message}\n\nShubh Deepavali,\n${from}`,
    style: { ...LOOK.diwali, heading: "storybook", effect: "lanterns", transition: "rise", stickers: corners(["🪔", "✨", "🪔"], 9, "pulse") },
  })),

  kit.message("message:diwali-blessings", "✨", ["diwali"], ({ to, from }) => ({
    title: `Happy Diwali, ${to}!`,
    body: `May the light of the diyas fill your home with joy,\nyour year with good fortune\nand your plate with far too many sweets.\n\nShubh Deepavali,\n${from}`,
    style: { ...LOOK.marigold, heading: "storybook", effect: "sparkles", transition: "rise", stickers: corners(["🪔", "🌼"], 9, "pulse") },
  })),

  kit.message("message:eid", "🌙", ["eid"], ({ to, from }) => ({
    title: `Eid Mubarak, ${to}`,
    body: `${BLANK.message}\n\nWith love and duas,\n${from}`,
    style: { ...LOOK.eid, effect: "stars", transition: "fade", stickers: corners(["🌙", "⭐"], 9, "float") },
  })),

  kit.message("message:new-year", "🥂", ["newyear"], ({ to, from }) => ({
    title: `Here's to a new year, ${to}`,
    body: `${BLANK.message}\n\nHappy New Year,\n${from}`,
    style: { ...LOOK.newyear, effect: "sparkles", transition: "zoom", stickers: corners(["🥂", "✨"], 9, "pulse") },
  })),

  kit.message("message:new-baby", "👶", ["newbaby"], ({ from }) => ({
    title: "Welcome to the world",
    body: `${BLANK.message}\n\nSo much love,\n${from}`,
    style: { ...LOOK.baby, heading: "rounded", body: "rounded", effect: "bubbles", transition: "rise", stickers: corners(["👶", "🧸", "⭐"], 9, "float") },
  })),

  kit.message("message:mum", "💐", ["mothersday"], ({ to, from }) => ({
    title: `Dear ${to}`,
    body: `${BLANK.message}\n\nAll my love, always,\n${from}`,
    style: { ...LOOK.garden, heading: "script", body: "handwritten", effect: "petals", transition: "fade", stickers: corners(["💐", "🌸"], 9, "sway") },
  })),

  kit.message("message:dad", "👔", ["fathersday"], ({ to, from }) => ({
    title: `Dear ${to}`,
    body: `${BLANK.message}\n\nLove you lots,\n${from}`,
    style: { ...LOOK.navy, heading: "bold", transition: "slide", stickers: corners(["👔", "☕"], 9) },
  })),

  kit.message("message:friend", "👯", ["friendship", "birthday"], ({ to, from }) => ({
    title: `To my favourite person, ${to}`,
    body: `${BLANK.message}\n\nFriends forever,\n${from}`,
    style: { ...LOOK.lilac, heading: "marker", body: "rounded", effect: "sparkles", transition: "bounce", stickers: corners(["👯", "✨", "💜"], 9, "bounce") },
  })),

  kit.message("message:miss-you", "🫶", ["missyou", "leaving"], ({ to, from }) => ({
    title: `Missing you, ${to}`,
    body: `${BLANK.message}\n\nUntil I see you again,\n${from}`,
    style: { ...LOOK.ocean, heading: "handwritten", body: "handwritten", effect: "stars", transition: "fade", tune: { speed: 0.8 }, stickers: corners(["🫶", "✈️"], 9, "float") },
  })),

  kit.message("message:good-luck", "🍀", ["leaving", "congrats"], ({ to, from }) => ({
    title: `Good luck, ${to}!`,
    body: `${BLANK.message}\n\nYou'll be brilliant.\n${from}`,
    style: { ...LOOK.mint, heading: "bold", effect: "confetti", transition: "rise", stickers: corners(["🍀", "⭐"], 9, "spin") },
  })),

  kit.message("message:anniversary", "💞", ["anniversary", "wedding"], ({ to, from }) => ({
    title: `Happy anniversary, ${to}`,
    body: `${BLANK.message}\n\nHere's to many more,\n${from}`,
    style: { ...LOOK.wine, heading: "script", effect: "hearts", transition: "fade", stickers: corners(["💞", "🥂"], 9, "pulse") },
  })),

  kit.message("message:typed", "⌨️", ["any", "fun"], ({ to, from }) => ({
    title: `Dear ${to},`,
    body: `${BLANK.message}\n\nYours sincerely (and a bit soppily),\n${from}`,
    style: { ...LOOK.kraft, heading: "typewriter", body: "typewriter", transition: "drop", tune: { speed: 0.7 }, stickers: corners(["📮", "✒️"], 8) },
  })),
];

const PHOTOS: KitItem[] = [
  kit.photos("photos", "📸", ["any"], () => ({ title: "Us", photos: [], captions: [] })),

  kit.photos("photos:best-bits", "🎞️", ["any", "friendship", "anniversary", "birthday"], () => ({
    title: "Our best bits",
    photos: [],
    captions: [],
    style: { ...LOOK.film, heading: "bold", transition: "slide", stickers: corners(["🎞️", "📸", "🍿"], 9) },
  })),

  kit.photos("photos:polaroid-wall", "📌", ["any", "friendship", "birthday", "leaving"], () => ({
    title: "The wall of fame",
    photos: [],
    captions: [],
    style: { ...LOOK.cork, heading: "marker", transition: "drop", stickers: corners(["📌", "📌", "⭐"], 8) },
    labels: { photosTap: "Tap for the next one ({i}/{n})" },
  })),

  kit.photos("photos:memory-lane", "🕰️", ["any", "anniversary", "birthday", "mothersday", "fathersday", "missyou"], () => ({
    title: "A walk down memory lane",
    photos: [],
    captions: [],
    style: { ...LOOK.sepia, heading: "typewriter", transition: "fade", stickers: corners(["🕰️", "🍂"], 8, "sway") },
  })),

  kit.photos("photos:party", "🥳", ["birthday", "newyear", "friendship", "fun"], () => ({
    title: "Party evidence",
    photos: [],
    captions: [],
    style: { ...LOOK.fiesta, heading: "bold", effect: "confetti", transition: "bounce", stickers: corners(["🥳", "🎉", "🪩"], 10, "bounce") },
  })),

  kit.photos("photos:love", "💑", ["valentine", "anniversary", "wedding"], () => ({
    title: "You and me",
    photos: [],
    captions: [],
    style: { ...LOOK.blush, heading: "script", effect: "hearts", transition: "fade", stickers: corners(["💑", "❤️"], 9, "pulse") },
  })),

  kit.photos("photos:family", "🏡", ["mothersday", "fathersday", "rakhi", "newbaby", "any"], () => ({
    title: "Our family album",
    photos: [],
    captions: [],
    style: { ...LOOK.ivory, heading: "storybook", transition: "rise", stickers: corners(["🏡", "💛"], 8, "float") },
  })),

  kit.photos("photos:baby", "🍼", ["newbaby"], () => ({
    title: "Tiny moments",
    photos: [],
    captions: [],
    style: { ...LOOK.baby, heading: "rounded", body: "rounded", effect: "bubbles", transition: "rise", stickers: corners(["🍼", "👣", "⭐"], 9, "float") },
  })),

  kit.photos("photos:christmas", "🎄", ["christmas"], () => ({
    title: "Christmas snaps",
    photos: [],
    captions: [],
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", transition: "drop", stickers: corners(["🎄", "🎁", "❄️"], 9, "sway") },
  })),

  kit.photos("photos:diwali", "🪔", ["diwali"], () => ({
    title: "Diwali at home",
    photos: [],
    captions: [],
    style: { ...LOOK.diwali, heading: "storybook", effect: "lanterns", transition: "rise", stickers: corners(["🪔", "✨"], 9, "pulse") },
  })),

  kit.photos("photos:adventures", "🧭", ["leaving", "missyou", "friendship", "anniversary"], () => ({
    title: "Our adventures",
    photos: [],
    captions: [],
    style: { ...LOOK.travel, heading: "typewriter", transition: "slide", stickers: corners(["🧭", "✈️", "🗺️"], 9, "float") },
  })),
];

const TIMELINES: KitItem[] = [
  kit.timeline("timeline", "🗓️", ["any"], () => ({
    title: "Our story so far",
    events: [
      { when: BLANK.date(1), what: BLANK.happened(1) },
      { when: BLANK.date(2), what: BLANK.happened(2) },
    ],
  })),

  kit.timeline("timeline:our-story", "💞", ["valentine", "anniversary", "wedding"], () => ({
    title: "Our story",
    events: [
      { when: BLANK.date(1), what: "The day we met" },
      { when: BLANK.date(2), what: "Our first date" },
      { when: BLANK.date(3), what: BLANK.happened(3) },
      { when: "Today", what: "Still completely crazy about you" },
    ],
    style: { ...LOOK.blush, heading: "script", effect: "hearts", transition: "fade", stickers: corners(["💞", "🌹"], 8, "pulse") },
  })),

  kit.timeline("timeline:your-year", "📅", ["birthday", "newyear"], () => ({
    title: "Your year in moments",
    events: [
      { when: "Spring", what: BLANK.happened(1) },
      { when: "Summer", what: BLANK.happened(2) },
      { when: "Autumn", what: BLANK.happened(3) },
      { when: "And now", what: "Another year older and even more brilliant" },
    ],
    style: { ...LOOK.sky, heading: "bold", body: "rounded", transition: "slide", stickers: corners(["📅", "🌸", "☀️", "🍂"], 8, "float") },
  })),

  kit.timeline("timeline:then-now", "⏳", ["birthday", "anniversary", "mothersday", "fathersday", "friendship"], () => ({
    title: "Then and now",
    events: [
      { when: "Then", what: BLANK.happened(1) },
      { when: "Now", what: BLANK.happened(2) },
    ],
    style: { ...LOOK.sepia, heading: "typewriter", transition: "flip", stickers: corners(["⏳", "📷"], 8) },
  })),

  kit.timeline("timeline:friends", "👯", ["friendship"], () => ({
    title: "How we became best friends",
    events: [
      { when: BLANK.date(1), what: "The day we met" },
      { when: BLANK.date(2), what: "When I knew you were a keeper" },
      { when: BLANK.date(3), what: BLANK.happened(3) },
      { when: "Today", what: "Still the best of friends" },
    ],
    style: { ...LOOK.lilac, heading: "marker", body: "rounded", transition: "bounce", stickers: corners(["👯", "💜"], 9, "bounce") },
  })),

  kit.timeline("timeline:growing-up", "🧸", ["birthday", "mothersday", "fathersday", "rakhi"], () => ({
    title: "Look how you've grown",
    events: [
      { when: "When you were little", what: BLANK.happened(1) },
      { when: "Your teenage years", what: BLANK.happened(2) },
      { when: "Today", what: "Look at you now. So proud." },
    ],
    style: { ...LOOK.pastel, heading: "storybook", transition: "rise", stickers: corners(["🧸", "🎒", "🎓"], 8, "float") },
  })),

  kit.timeline("timeline:journey", "🎓", ["congrats", "leaving"], () => ({
    title: "Your journey",
    events: [
      { when: BLANK.date(1), what: "Your very first day" },
      { when: BLANK.date(2), what: BLANK.happened(2) },
      { when: "Next", what: "On to the next big thing" },
    ],
    style: { ...LOOK.navy, heading: "bold", transition: "slide", stickers: corners(["🎓", "🚀", "⭐"], 8, "float") },
  })),
];

const REASONS: KitItem[] = [
  kit.reasons("reasons", "🫙", ["any", "valentine", "anniversary"], () => ({
    title: "Reasons I love you",
    instructions: "Tap the jar to pull out a note",
    reasons: [1, 2, 3].map(BLANK.reason),
  })),

  kit.reasons("reasons:admire", "⭐", ["any", "congrats", "thanks", "leaving", "friendship"], () => ({
    title: "Things I admire about you",
    instructions: "Tap the jar to pull out a note",
    reasons: [1, 2, 3, 4].map(BLANK.reason),
    style: { ...LOOK.navy, heading: "storybook", effect: "stars", transition: "rise", stickers: corners(["⭐", "✨"], 9, "pulse") },
    labels: { jarTap: "Tap the jar of stars", jarEmpty: "And that's just the start." },
  })),

  kit.reasons("reasons:best-mum", "💐", ["mothersday", "birthday"], () => ({
    title: "Why you're the best mum",
    instructions: "Tap the jar to pull out a note",
    reasons: ["You always know just what to say", "Your hugs fix everything", "You never stopped believing in me", "You taught me how to be kind", BLANK.reason(5)],
    style: { ...LOOK.garden, heading: "script", body: "handwritten", effect: "petals", transition: "fade", stickers: corners(["💐", "🌸"], 9, "sway") },
    labels: { jarEmpty: "I could fill a hundred jars, Mum." },
  })),

  kit.reasons("reasons:best-dad", "👔", ["fathersday", "birthday"], () => ({
    title: "Why you're the best dad",
    instructions: "Tap the jar to pull out a note",
    reasons: ["Your terrible jokes (I secretly love them)", "You can fix absolutely anything", "All those lifts, at all hours", "You taught me never to give up", BLANK.reason(5)],
    style: { ...LOOK.navy, heading: "bold", transition: "slide", stickers: corners(["👔", "🔧", "🏆"], 9) },
    labels: { jarEmpty: "That's all for now. Love you, Dad." },
  })),

  kit.reasons("reasons:best-friend", "👯", ["friendship", "birthday"], () => ({
    title: "Why you're my best friend",
    instructions: "Tap the jar to pull out a note",
    reasons: ["You laugh at my jokes, even the bad ones", "You know my order off by heart", "You're always there when it matters", BLANK.reason(4)],
    style: { ...LOOK.lilac, heading: "marker", body: "rounded", effect: "sparkles", transition: "bounce", stickers: corners(["👯", "💜"], 9, "bounce") },
  })),

  kit.reasons("reasons:grandparent", "👵", ["birthday", "mothersday", "fathersday", "any"], () => ({
    title: "Why we love you so much",
    instructions: "Tap the jar to pull out a note",
    reasons: ["Your stories from the old days", "Your cooking, the best in the world", "Your cuddles", "You always have time for us", BLANK.reason(5)],
    style: { ...LOOK.ivory, heading: "storybook", body: "rounded", transition: "rise", stickers: corners(["👵", "👴", "💛"], 9, "float") },
  })),

  kit.reasons("reasons:miss", "🫶", ["missyou", "leaving"], () => ({
    title: "Things I miss about you",
    instructions: "Tap the jar to pull out a note",
    reasons: [1, 2, 3].map(BLANK.reason),
    style: { ...LOOK.ocean, heading: "handwritten", body: "handwritten", effect: "stars", transition: "fade", stickers: corners(["🫶", "🌙"], 9, "float") },
    labels: { jarEmpty: "Come back soon. The jar's waiting." },
  })),

  kit.reasons("reasons:forgive", "😇", ["sorry", "fun"], () => ({
    title: "Reasons to forgive me",
    instructions: "Tap the jar to pull out a note",
    reasons: ["I made you a whole card", "I'll do the washing-up for a week", "I really am very sorry", BLANK.reason(4)],
    style: { ...LOOK.dove, heading: "handwritten", body: "handwritten", transition: "bounce", stickers: corners(["😇", "🥺"], 9, "sway") },
    labels: { jarEmpty: "So… am I forgiven?" },
  })),

  kit.reasons("reasons:birthday", "🎉", ["birthday"], () => ({
    title: "Things to celebrate about you",
    instructions: "Tap the jar to pull out a note",
    reasons: [1, 2, 3].map(BLANK.reason),
    style: { ...LOOK.party, heading: "bold", body: "rounded", effect: "confetti", transition: "bounce", stickers: corners(["🎉", "🎂"], 9, "bounce") },
  })),
];

const COUPONS: KitItem[] = [
  kit.coupons("coupons", "🎟️", ["any"], () => ({ title: "Your coupon book", instructions: "Tap one to redeem it", coupons: [1, 2, 3].map(BLANK.coupon) })),

  kit.coupons("coupons:hugs", "🤗", ["any", "valentine", "missyou", "getwell", "sorry", "mothersday", "fathersday", "friendship"], () => ({
    title: "Hug coupons",
    instructions: "Tap one whenever you need a hug",
    coupons: ["One big bear hug", "A hug, no questions asked", "A hug when you need it most", "A group hug"],
    style: { ...LOOK.peach, heading: "rounded", body: "rounded", transition: "bounce", stickers: corners(["🤗", "🧸"], 9, "bounce") },
  })),

  kit.coupons("coupons:chores", "🧽", ["mothersday", "fathersday", "birthday", "sorry", "fun"], () => ({
    title: "Chore pass",
    instructions: "Tap one and I'll do it. No moaning.",
    coupons: ["I'll do the washing-up", "I'll take the bins out", "I'll do the hoovering", "A lie-in, no chores at all"],
    style: { ...LOOK.teal, heading: "bold", transition: "slide", stickers: corners(["🧽", "🧺", "✨"], 9, "sway") },
    labels: { couponDone: "Done ✓" },
  })),

  kit.coupons("coupons:breakfast", "🥞", ["mothersday", "fathersday", "valentine", "anniversary", "birthday"], () => ({
    title: "Breakfast in bed",
    instructions: "Tap one and I'll bring it up",
    coupons: ["Tea and toast in bed", "A full English, in bed", "Pancakes with all the toppings", "Coffee and croissants"],
    style: { ...LOOK.sunshine, heading: "storybook", transition: "rise", stickers: corners(["🥞", "☕", "🍓"], 9, "float") },
  })),

  kit.coupons("coupons:date-night", "🍝", ["valentine", "anniversary", "wedding"], () => ({
    title: "Date night coupons",
    instructions: "Tap one to book our next date",
    coupons: ["Dinner out, my treat", "A film of your choice (no complaining)", "A moonlit walk", "Dessert first"],
    style: { ...LOOK.wine, heading: "script", effect: "hearts", transition: "fade", stickers: corners(["🍝", "🍷", "❤️"], 9, "pulse") },
  })),

  kit.coupons("coupons:birthday", "🎁", ["birthday"], () => ({
    title: "Birthday treats",
    instructions: "Tap one to claim your treat",
    coupons: ["Cake for breakfast", "You pick the takeaway", "A day off from everything", "Unlimited birthday songs"],
    style: { ...LOOK.party, heading: "bold", body: "rounded", effect: "confetti", transition: "bounce", stickers: corners(["🎁", "🎂", "🎈"], 9, "bounce") },
  })),

  kit.coupons("coupons:pamper", "🛁", ["mothersday", "getwell", "birthday", "thanks"], () => ({
    title: "Pamper day",
    instructions: "Tap one to put your feet up",
    coupons: ["A bubble bath, no interruptions", "A foot rub", "Your favourite treats on tap", "A whole afternoon nap"],
    style: { ...LOOK.lavender, heading: "storybook", effect: "bubbles", transition: "fade", stickers: corners(["🛁", "🕯️", "🌸"], 9, "float") },
  })),

  kit.coupons("coupons:kids", "🧸", ["mothersday", "fathersday"], () => ({
    title: "Coupons from the kids",
    instructions: "Tap one and we promise to do it",
    coupons: ["I'll tidy my room (really)", "One morning with no arguing", "Extra cuddles", "I'll go to bed on time"],
    style: { ...LOOK.rainbow, heading: "marker", body: "rounded", transition: "bounce", stickers: corners(["🧸", "🖍️", "🌈"], 9, "bounce") },
  })),

  kit.coupons("coupons:friend", "🍿", ["friendship", "birthday", "leaving"], () => ({
    title: "Friendship vouchers",
    instructions: "Tap one to cash it in",
    coupons: ["A night in with snacks", "A coffee, my treat", "A shoulder to cry on", "One brutally honest outfit opinion"],
    style: { ...LOOK.lilac, heading: "marker", body: "rounded", transition: "bounce", stickers: corners(["🍿", "☕", "💜"], 9, "bounce") },
  })),
];

export const WORDS: KitItem[] = [...MESSAGES, ...PHOTOS, ...TIMELINES, ...REASONS, ...COUPONS];
