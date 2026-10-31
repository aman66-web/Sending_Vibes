import type { Motion, Screen, ScreenStyle, Sticker } from "./card";
import type { Template } from "./catalog";
import { P, at, boxes, coupons, finale, game, intro, message, photos, reasons, scratch, slider, timeline, wheel } from "./design-kit";
import type { Labels } from "./labels";

// More ready-made designs for the occasions the shop already has. They join the
// list in catalog.ts and are written with the same pieces (lib/design-kit.ts).
//
// Each one is built to the house standard: a photos screen, at least two things to play
// with, a sincere message before the finale, and its own look on every screen (colours,
// fonts, stickers, what bursts out at its big moment, how it comes in), so a ready-made
// card looks as finished as one written from scratch. The AI rewrites the words for each
// buyer but keeps every screen's look (see fillDesign in lib/generate.ts).
// Run `npx tsx scripts/check-designs.ts` after changing one.

// A screen in its own look and, where it helps, its own built-in words (lib/labels.ts).
function dress<S extends Screen>(screen: S, style: ScreenStyle, labels?: Labels): S {
  return labels ? { ...screen, style, labels } : { ...screen, style };
}

// Stickers go near the corners, clear of the words, and never top right, where the
// sound button sits.
const stick = (emoji: string, x: number, y: number, size = 10, motion: Motion = "float", rotate = 0): Sticker => ({ emoji, x, y, size, motion, rotate });

// Illustrated stand-ins drawn for these designs, alongside the shared ones in design-kit.
const DEMO = {
  thali: { src: "/demo/thali.jpg", caption: "The thali, ready and waiting" },
  waterLights: { src: "/demo/water-lights.jpg", caption: "Lights on the water" },
  cosyHome: { src: "/demo/cosy-home.jpg", caption: "Home for Christmas" },
  snowman: { src: "/demo/snowman.jpg", caption: "Our snowman" },
};

export const MORE_DESIGNS: Template[] = [
  // ---------- Diwali week ----------
  // Bandi Chhor Divas falls on the same day as Diwali, so it lives under Diwali.
  {
    slug: "bandi-chhor-divas",
    name: "Bandi Chhor Divas Lights",
    occasion: "diwali",
    tone: "heartfelt",
    theme: "midnight",
    ambient: "sparkles",
    emoji: "🪔",
    headline: "Happy Bandi Chhor Divas",
    blurb: "For Sikh family and friends: light the diyas, scratch off a wish, fill the sky with fireworks and read a message about what the day means.",
    screens: (to, from) => {
      const night = { text: "#fbf3e2", accent: "#f39c1f", heading: "classic", body: "storybook" } satisfies ScreenStyle;
      const paper = { background: ["#fbf3e2", "#f3e1bd"], text: "#24170a", accent: "#a8520a", heading: "classic", body: "storybook" } satisfies ScreenStyle;
      return [
        dress(
          intro(`Happy Bandi Chhor Divas, ${to}`, `${from} saved you a few diyas to light tonight.`, "Come and see"),
          {
            ...night,
            background: ["#1f3570", "#0b1634"],
            gradient: "glow",
            envelope: "#f6e7c8",
            effect: "sparkles",
            burst: "sparkles",
            transition: "fade",
            stickers: [stick("✨", 8, 10, 8, "pulse"), stick("🪔", 10, 89, 11, "pulse"), stick("🪔", 90, 88, 11, "pulse")],
          },
          { gotMail: "A little light for you" },
        ),
        dress(game("light-diyas", "Light up the house", "Tap each diya to light it", "Every diya lit, the way Amritsar lit up when Guru Hargobind Sahib Ji came home."), {
          ...night,
          background: ["#16295c", "#0b1634"],
          gradient: "down",
          effect: "stars",
          burst: "sparkles",
          transition: "rise",
          stickers: [stick("✨", 8, 12, 8, "pulse"), stick("🌟", 90, 88, 9, "pulse")],
        }),
        dress(photos("Our Bandi Chhor Divas"), {
          ...paper,
          gradient: "glow",
          effect: "sparkles",
          transition: "slide",
          stickers: [stick("🪔", 10, 89, 10, "pulse"), stick("✨", 90, 88, 8, "pulse")],
        }),
        dress(
          scratch("A wish for you", "Scratch the silver panel with your finger", "May you always stay in chardi kala."),
          {
            background: ["#f6ad3c", "#e0790f"],
            gradient: "diagonal",
            pattern: "dots",
            text: "#1f1406",
            accent: "#0b1634",
            heading: "classic",
            body: "storybook",
            burst: "sparkles",
            transition: "zoom",
            stickers: [stick("✨", 8, 12, 9, "pulse"), stick("🪔", 10, 89, 11, "sway"), stick("✨", 90, 88, 9, "pulse")],
          },
          { scratchDone: "My wish for you" },
        ),
        dress(game("launch-fireworks", "Fill the sky", "Tap the sky to launch 6 fireworks", "Now the whole sky is celebrating with us.", "game2"), {
          ...night,
          background: ["#14204a", "#060b1f"],
          gradient: "glow",
          effect: "stars",
          burst: "fireworks",
          transition: "zoom",
          stickers: [stick("🎆", 8, 12, 9, "pulse"), stick("🎇", 90, 88, 10, "pulse")],
        }),
        dress(
          message(
            "On Bandi Chhor Divas",
            `${to},\n\nToday we remember Guru Hargobind Sahib Ji walking free from Gwalior Fort, and refusing to leave until the 52 kings held with him were freed too.\n\nI love that the day is about a freedom you share, not one you keep. May it bring your home peace, good health and chardi kala, with a full table and everyone round it.\n\nWith love,\n${from}`,
          ),
          { ...paper, gradient: "down", effect: "sparkles", transition: "fade", tune: { speed: 0.9 }, stickers: [stick("🪔", 90, 89, 10, "pulse")] },
        ),
        dress(finale("Happy Bandi Chhor Divas", "Lakh lakh vadhaiyan to you and all the family.", "fireworks"), {
          ...night,
          background: ["#1f3570", "#0b1634"],
          gradient: "glow",
          effect: "stars",
          transition: "zoom",
          stickers: [stick("✨", 8, 12, 8, "pulse"), stick("🪔", 10, 89, 11, "pulse"), stick("🪔", 90, 88, 11, "pulse")],
        }),
      ];
    },
    demo: { to: "Dadi ji", from: "Harpreet", photos: [DEMO.waterLights, P.diyas, P.fireworks] },
  },
  // Gujarati New Year is the day after Diwali (or the day after that, some years).
  {
    slug: "saal-mubarak",
    name: "Saal Mubarak",
    occasion: "diwali",
    tone: "festive",
    theme: "marigold",
    ambient: "lanterns",
    emoji: "🎊",
    headline: "Saal Mubarak!",
    blurb: "For Gujarati New Year: send the old year off in a lantern, spin for the year ahead, then your photos, warm wishes and fireworks.",
    screens: (to, from) => {
      const red = { background: ["#b5172c", "#7d0c1f"], gradient: "glow", pattern: "dots", text: "#fff4dc", accent: "#f2b705" } satisfies ScreenStyle;
      const type = { heading: "bold", body: "modern" } satisfies ScreenStyle;
      return [
        dress(
          intro(`Saal Mubarak, ${to}!`, `${from} has some wishes for your new year.`, "Start the new year"),
          {
            ...red,
            ...type,
            envelope: "#ffd45c",
            effect: "sparkles",
            burst: "confetti",
            transition: "fade",
            stickers: [stick("🪔", 8, 10, 9, "pulse"), stick("🌼", 10, 89, 11, "sway"), stick("🌼", 90, 88, 11, "sway", 20)],
          },
          { gotMail: "Nutan varshabhinandan" },
        ),
        dress(game("release-lanterns", "Let the old year go", "Tap each lantern to send it up", "Off they go, and last year with them. Fresh start!"), {
          ...type,
          background: ["#3a1f5c", "#1a1036"],
          gradient: "down",
          text: "#fff4dc",
          accent: "#f2b705",
          effect: "stars",
          burst: "lanterns",
          transition: "rise",
          stickers: [stick("✨", 8, 12, 8, "pulse"), stick("🏮", 90, 88, 10, "sway")],
        }),
        dress(
          wheel("Spin for your new year", "Wherever it stops, it's coming your way", ["Good health", "Success at work", "Family time", "A holiday", "Big laughs", "Sweet surprises"], "Consider it done. Saal Mubarak!"),
          {
            ...type,
            background: ["#ffe08a", "#f2b705"],
            gradient: "glow",
            pattern: "zigzag",
            text: "#3b0a12",
            accent: "#b5172c",
            burst: "confetti",
            transition: "bounce",
            stickers: [stick("🎉", 8, 12, 9, "bounce"), stick("🍬", 10, 89, 10, "sway"), stick("🌼", 90, 88, 10, "spin")],
          },
        ),
        dress(photos("Diwali with the family"), {
          ...type,
          background: ["#fff7e6", "#fde7bd"],
          gradient: "glow",
          pattern: "dots",
          text: "#3b0a12",
          accent: "#1f6b43",
          effect: "sparkles",
          transition: "slide",
          stickers: [stick("🪔", 10, 89, 10, "pulse"), stick("🌼", 90, 88, 10, "sway")],
        }),
        dress(
          message(
            "For the year ahead",
            `${to},\n\nSaal Mubarak! Wishing you a new year of good health, full tins of mathiya and chorafali, and a house that's never quiet for long.\n\nThank you for every blessing you've sent my way. I'm taking them all into the new year with me.\n\nWith love,\n${from}`,
          ),
          {
            background: ["#1f5e3b", "#123a25"],
            gradient: "down",
            text: "#fff4dc",
            accent: "#f2b705",
            heading: "bold",
            body: "storybook",
            effect: "sparkles",
            transition: "fade",
            stickers: [stick("🌼", 90, 89, 10, "sway")],
          },
        ),
        dress(finale("Saal Mubarak!", "Here's to a happy, healthy and very sweet new year.", "fireworks"), {
          ...red,
          ...type,
          effect: "stars",
          transition: "zoom",
          stickers: [stick("🎆", 8, 12, 9, "pulse"), stick("🪔", 10, 89, 11, "pulse"), stick("🎆", 90, 88, 10, "pulse")],
        }),
      ];
    },
    demo: { to: "Kaka & Kaki", from: "Priya", photos: [P.rangoli, P.diyas, P.fireworks] },
  },
  // Bhai Dooj ends the five days of Diwali, so it's with Diwali rather than Raksha Bandhan.
  {
    slug: "bhai-dooj-tilak",
    name: "Bhai Dooj Tilak",
    occasion: "diwali",
    tone: "festive",
    theme: "marigold",
    ambient: "sparkles",
    emoji: "🌼",
    headline: "Happy Bhai Dooj! Your tilak's ready",
    blurb: "For your brother on the last day of Diwali: light his aarti, pull reasons from a jar, and hand him the list of gifts he owes you.",
    screens: (to, from) => {
      const kumkum = { background: ["#c8102e", "#8e0b20"], gradient: "glow", text: "#fff3e0", accent: "#f6c445" } satisfies ScreenStyle;
      const paper = { background: ["#fff6e5", "#ffe3b8"], text: "#3a0d14", accent: "#c8102e" } satisfies ScreenStyle;
      const type = { heading: "rounded", body: "modern" } satisfies ScreenStyle;
      return [
        dress(
          intro(`Happy Bhai Dooj, ${to}!`, `${from} has the thali ready. Sit still, this won't take long.`, "I'm sitting still"),
          {
            ...kumkum,
            ...type,
            envelope: "#ffe3b8",
            effect: "sparkles",
            burst: "petals",
            transition: "fade",
            stickers: [stick("🌼", 8, 10, 10, "sway"), stick("🪔", 10, 89, 11, "pulse"), stick("🌼", 90, 88, 11, "sway", 25)],
          },
          { gotMail: "For my brother" },
        ),
        dress(game("light-diyas", "Light your aarti", "Tap each diya to light it", "Aarti done, tilak on. Here's to a long and happy life."), {
          ...type,
          background: ["#6b1424", "#3e0a15"],
          gradient: "down",
          text: "#fff3e0",
          accent: "#f6c445",
          effect: "sparkles",
          burst: "petals",
          transition: "rise",
          tune: { goal: 3 },
          stickers: [stick("🌼", 8, 12, 9, "sway"), stick("🌼", 90, 88, 10, "sway", 30)],
        }),
        dress(
          reasons("Why I'm lucky you're my brother", "Tap the jar for each one", [
            "You always take my side (eventually)",
            "You still let me steal food off your plate",
            "You're the first person I call with news",
            "You make every family function bearable",
            "You'd drop everything if I needed you",
            "You. Even when you're annoying.",
          ]),
          {
            ...paper,
            ...type,
            gradient: "glow",
            pattern: "dots",
            effect: "petals",
            burst: "petals",
            transition: "bounce",
            stickers: [stick("🍬", 8, 12, 9, "bounce"), stick("🌼", 10, 89, 10, "sway"), stick("💛", 90, 88, 9, "pulse")],
          },
        ),
        dress(
          coupons("Your side of the deal", "Tilak given. Now tap each one to claim it.", ["One shopping trip, your treat", "A whole box of kaju katli", "Lifts whenever I ask", "You back me up at the next family dinner"]),
          {
            ...type,
            background: ["#ffb347", "#f28c28"],
            gradient: "diagonal",
            pattern: "stripes",
            text: "#3a0d14",
            accent: "#8e0b20",
            burst: "confetti",
            transition: "slide",
            stickers: [stick("🎁", 8, 13, 10, "bounce"), stick("🛍️", 90, 88, 10, "sway")],
          },
          { couponClaim: "Screenshot it as proof. No take-backs." },
        ),
        dress(photos("Us, growing up"), {
          ...type,
          background: ["#5a1647", "#2a0a20"],
          gradient: "glow",
          text: "#fff3e0",
          accent: "#f6c445",
          effect: "sparkles",
          transition: "zoom",
          stickers: [stick("✨", 8, 12, 8, "pulse"), stick("🌼", 90, 88, 10, "sway")],
        }),
        dress(
          message(
            "Jokes aside",
            `${to},\n\nI tease you all year, but today I mean every word: I'm praying for your long life and every happiness, same as always.\n\nThank you for looking out for me, even when I pretend I don't need it.\n\nLove you lots,\n${from}`,
          ),
          { ...paper, heading: "rounded", body: "storybook", gradient: "down", effect: "petals", transition: "fade", stickers: [stick("🪔", 90, 89, 10, "pulse")] },
        ),
        dress(finale("Happy Bhai Dooj", "Long life, lots of laughs, and those gifts by the weekend, please.", "sparkles"), {
          ...kumkum,
          ...type,
          effect: "petals",
          transition: "zoom",
          stickers: [stick("🌼", 8, 13, 10, "sway"), stick("🪔", 10, 89, 11, "pulse"), stick("🌼", 90, 88, 11, "sway", 25)],
        }),
      ];
    },
    demo: { to: "Arjun", from: "Meera", photos: [DEMO.thali, P.diyas, P.summer] },
  },
  // Gentle and easy to play: three diyas, a hug that only needs holding, nothing fast.
  {
    slug: "diwali-hug-for-grandparents",
    name: "A Diwali Hug for Grandparents",
    occasion: "diwali",
    tone: "heartfelt",
    theme: "marigold",
    ambient: "lanterns",
    emoji: "🤗",
    headline: "A Diwali hug from far away",
    blurb: "Gentle and easy to play, for grandparents and elders: a hug they hold, three diyas to light, your photos and a jar of things you love about them.",
    music: "love",
    screens: (to, from) => {
      const plum = { background: ["#6a2559", "#2e0c27"], gradient: "glow", text: "#fdf3e4", accent: "#e6b45a" } satisfies ScreenStyle;
      const paper = { background: ["#fdf3e4", "#f6dcc4"], text: "#3a1a2c", accent: "#7a2763" } satisfies ScreenStyle;
      const type = { heading: "storybook", body: "modern" } satisfies ScreenStyle;
      return [
        dress(
          intro(`Happy Diwali, ${to}`, `With all our love, from ${from}.`, "Open our card"),
          {
            ...plum,
            ...type,
            envelope: "#fdf3e4",
            effect: "lanterns",
            burst: "sparkles",
            transition: "fade",
            stickers: [stick("🪔", 10, 89, 12, "pulse"), stick("🪔", 90, 88, 12, "pulse")],
          },
          { gotMail: "A Diwali card for you" },
        ),
        dress(
          game("hold-hug", "A Diwali hug from all of us", "Press and hold the heart. Take your time.", "Hug delivered. We miss you."),
          {
            ...paper,
            ...type,
            gradient: "glow",
            effect: "sparkles",
            burst: "hearts",
            transition: "fade",
            stickers: [stick("🤗", 10, 89, 12, "float"), stick("💛", 90, 88, 10, "pulse")],
          },
          { hugLetGo: "Hold on a little longer", hugDone: "Hug delivered, with love" },
        ),
        dress(game("light-diyas", "Light the diyas with us", "Tap each diya to light it", "Shubh Deepavali. Your home is glowing.", "game2"), {
          ...plum,
          ...type,
          gradient: "down",
          effect: "lanterns",
          burst: "sparkles",
          transition: "fade",
          tune: { goal: 3 },
          stickers: [stick("✨", 8, 12, 9, "pulse"), stick("🪔", 90, 88, 11, "pulse")],
        }),
        dress(photos("The family this Diwali"), {
          ...paper,
          ...type,
          gradient: "glow",
          effect: "sparkles",
          transition: "fade",
          stickers: [stick("🪔", 10, 89, 11, "pulse"), stick("🌸", 90, 88, 10, "sway")],
        }),
        dress(
          reasons("What we love about you", "Tap the jar for each one", [
            "Your stories about when you were young",
            "Your cooking. Nobody makes it like you.",
            "Your blessings at the end of every phone call",
            "How proud you are of all of us",
            "You always remember everyone's favourite sweet",
            "You. Just you.",
          ]),
          {
            ...plum,
            ...type,
            background: ["#6a2559", "#3a1031"],
            effect: "lanterns",
            burst: "sparkles",
            transition: "fade",
            stickers: [stick("💛", 8, 12, 9, "pulse"), stick("🪔", 90, 88, 11, "pulse")],
          },
        ),
        dress(
          message(
            "Our Diwali wish for you",
            `Dear ${to},\n\nWe wish we could be there to light the diyas with you. This year our love is coming the long way round, and we'll be thinking of you when the fireworks start.\n\nThank you for your blessings, your prayers and every phone call. We love you very much.\n\n${from}`,
          ),
          // A little slower, so it's comfortable to read as it writes itself out.
          { ...paper, heading: "storybook", body: "classic", gradient: "down", effect: "sparkles", transition: "fade", tune: { speed: 0.8 }, stickers: [stick("🪔", 90, 89, 11, "pulse")] },
        ),
        dress(finale("Shubh Deepavali", "We love you, and we'll see you soon.", "sparkles"), {
          ...plum,
          ...type,
          effect: "lanterns",
          transition: "fade",
          stickers: [stick("✨", 8, 12, 8, "pulse"), stick("🪔", 10, 89, 12, "pulse"), stick("🪔", 90, 88, 12, "pulse")],
        }),
      ];
    },
    demo: { to: "Nani & Nana", from: "Aarav & Anaya", photos: [P.rangoli, P.diyas, P.fireworks] },
  },

  // ---------- Christmas ----------
  // For children: nothing to read quickly and nothing to type; a grown-up can read the letter.
  {
    slug: "letter-from-santa",
    name: "A Letter from Santa",
    occasion: "christmas",
    tone: "cute",
    theme: "noel",
    ambient: "snow",
    emoji: "🎅",
    headline: "Special delivery from the North Pole",
    blurb: "For children: Santa checks his list, they help with the snow and see their photos, then a grown-up reads them a letter from Santa himself.",
    screens: (to, from) => {
      const night = { background: ["#24497d", "#0d2240"], text: "#fff8ef", accent: "#f2c14e" } satisfies ScreenStyle;
      const red = { background: ["#d02a33", "#8f141b"], gradient: "glow", text: "#fff8ef", accent: "#f2c14e" } satisfies ScreenStyle;
      const type = { heading: "storybook", body: "rounded" } satisfies ScreenStyle;
      return [
        dress(
          intro(`Special delivery for ${to}!`, "This came all the way from the North Pole.", "See what Santa sent"),
          {
            ...night,
            ...type,
            gradient: "glow",
            envelope: "#c8232c",
            effect: "snow",
            burst: "stars",
            transition: "drop",
            stickers: [stick("⭐", 8, 10, 8, "pulse"), stick("🦌", 10, 89, 11, "bounce"), stick("🎅", 90, 88, 12, "sway")],
          },
          { gotMail: "North Pole Post" },
        ),
        dress(
          scratch("Santa checked his list…", "Scratch the silver panel to see which list you're on", "You're on the NICE list!"),
          {
            ...red,
            ...type,
            pattern: "stripes",
            effect: "snow",
            burst: "stars",
            transition: "zoom",
            stickers: [stick("📜", 8, 12, 9, "sway"), stick("⭐", 90, 88, 10, "spin")],
          },
          { scratchDone: "Hooray!" },
        ),
        // Slower, bigger snowflakes, so little fingers can catch them.
        dress(game("catch-snowflakes", "Make it snow", "Catch 10 snowflakes to give Santa's sleigh a soft landing", "Perfect. A soft landing on your roof!"), {
          ...night,
          ...type,
          gradient: "down",
          effect: "stars",
          burst: "snow",
          transition: "rise",
          tune: { speed: 0.8, size: 1.4 },
          stickers: [stick("❄️", 8, 12, 8, "spin"), stick("🛷", 10, 89, 11, "sway")],
        }),
        dress(photos("Santa's favourite photos of you"), {
          ...type,
          background: ["#1b5e45", "#0f3d2e"],
          gradient: "glow",
          text: "#fff8ef",
          accent: "#f2c14e",
          effect: "snow",
          transition: "slide",
          stickers: [stick("⭐", 8, 12, 8, "pulse"), stick("🎄", 10, 89, 12, "sway"), stick("🎁", 90, 88, 11, "bounce")],
        }),
        dress(
          message(
            `Dear ${to}`,
            "Ho ho ho! The elves tell me you've had a brilliant year, and I've been hearing very good things.\n\nKeep being kind, keep asking questions, and please remember a carrot for Rudolph on Christmas Eve. He's very fond of them.\n\nSee you soon (but only when you're fast asleep!),\nSanta",
          ),
          {
            background: ["#fbf7ef", "#efe6d6"],
            gradient: "down",
            text: "#2a1a12",
            accent: "#b3202a",
            heading: "handwritten",
            body: "storybook",
            effect: "sparkles",
            transition: "fade",
            stickers: [stick("❄️", 8, 12, 8, "spin"), stick("🎅", 90, 88, 12, "sway")],
          },
          { next: "Thank you, Santa!" },
        ),
        dress(finale(`Merry Christmas, ${to}!`, `Love from Santa, the elves and ${from}`, "snow"), {
          ...red,
          ...type,
          effect: "snow",
          transition: "zoom",
          stickers: [stick("⭐", 8, 12, 8, "pulse"), stick("🎅", 10, 89, 12, "bounce"), stick("🦌", 90, 88, 12, "bounce")],
        }),
      ];
    },
    demo: { to: "Maya", from: "Mum & Dad", photos: [DEMO.snowman, P.tree, P.lights] },
  },
  // Gentle and easy to play, like the Diwali hug, in Christmas colours.
  {
    slug: "christmas-hug-for-grandparents",
    name: "A Christmas Hug for Grandparents",
    occasion: "christmas",
    tone: "heartfelt",
    theme: "ivory",
    ambient: "snow",
    emoji: "🧣",
    headline: "A Christmas hug from all of us",
    blurb: "Gentle and easy to play, for grandparents and elders: a hug they hold, your photos, a jar of reasons they're loved and a warm Christmas letter.",
    screens: (to, from) => {
      const pine = { background: ["#2c6a52", "#123326"], gradient: "glow", text: "#fbf5ea", accent: "#d8b45c" } satisfies ScreenStyle;
      const cranberry = { background: ["#a83346", "#5e1420"], gradient: "glow", text: "#fbf5ea", accent: "#d8b45c" } satisfies ScreenStyle;
      const paper = { background: ["#fbf5ea", "#f0e3cc"], gradient: "glow", pattern: "checks", text: "#2b1a14" } satisfies ScreenStyle;
      const type = { heading: "classic", body: "storybook" } satisfies ScreenStyle;
      return [
        dress(intro(`Merry Christmas, ${to}`, `From ${from}, with a hug that's been waiting all year.`, "Open it"), {
          ...pine,
          ...type,
          envelope: "#9e2a3a",
          effect: "snow",
          burst: "snow",
          transition: "fade",
          stickers: [stick("❄️", 8, 10, 8, "spin"), stick("🎄", 10, 89, 12, "sway"), stick("🧣", 90, 88, 11, "sway")],
        }),
        dress(
          game("hold-hug", "A Christmas hug from all of us", "Press and hold the heart. No rush.", "Hug delivered. Can you feel it?"),
          {
            ...paper,
            ...type,
            accent: "#9e2a3a",
            effect: "sparkles",
            burst: "hearts",
            transition: "fade",
            stickers: [stick("🧣", 10, 89, 11, "sway"), stick("☕", 90, 88, 10, "float")],
          },
          { hugLetGo: "Hold on a little longer" },
        ),
        dress(photos("The family this Christmas"), {
          ...cranberry,
          ...type,
          effect: "snow",
          transition: "fade",
          stickers: [stick("✨", 8, 12, 8, "pulse"), stick("🎄", 10, 89, 11, "sway")],
        }),
        dress(
          reasons("Why you're the best", "Tap the jar for each one", [
            "Christmas dinner at yours, and the leftovers after",
            "The stories you tell every year (we secretly love them)",
            "Your hugs, still the best in the family",
            "You never, ever forget a birthday",
            "How you make everyone feel at home",
            "You. All of you.",
          ]),
          {
            ...paper,
            ...type,
            accent: "#245a45",
            effect: "sparkles",
            burst: "sparkles",
            transition: "fade",
            stickers: [stick("🕯️", 10, 89, 11, "pulse"), stick("❤️", 90, 88, 9, "pulse")],
          },
        ),
        dress(
          message(
            "This Christmas",
            `Dear ${to},\n\nChristmas isn't quite Christmas without you. We'll be thinking of you when the crackers are pulled, and saving you the last mince pie.\n\nThank you for every Christmas you've made special for us. We love you more than we say.\n\n${from}`,
          ),
          // A little slower, so it's comfortable to read as it writes itself out.
          { ...pine, ...type, gradient: "down", effect: "snow", transition: "fade", tune: { speed: 0.8 }, stickers: [stick("❄️", 90, 89, 9, "spin")] },
        ),
        dress(finale("Merry Christmas", "With all our love, today and every day.", "snow"), {
          ...cranberry,
          ...type,
          effect: "snow",
          transition: "fade",
          stickers: [stick("⭐", 8, 12, 8, "pulse"), stick("🎄", 10, 89, 12, "sway"), stick("🎁", 90, 88, 11, "float")],
        }),
      ];
    },
    demo: { to: "Grandma & Grandad", from: "Ella & Josh", photos: [DEMO.cosyHome, P.tree, P.lights] },
  },
  // The family Christmas letter, for relatives far away. General enough to send as it is;
  // the AI fills the year in from what they tell it.
  {
    slug: "our-family-year",
    name: "Our Family Year",
    occasion: "christmas",
    tone: "heartfelt",
    theme: "sky",
    ambient: "snow",
    emoji: "📰",
    headline: "All our news, in one card",
    blurb: "The family Christmas letter, made fun: a year of news to tap through, your photos and a warm note. Lovely for relatives far away.",
    screens: (to, from) => {
      const night = { background: ["#2b4170", "#14213d"], gradient: "glow", text: "#f7f3ea", accent: "#e2bf6b" } satisfies ScreenStyle;
      const paper = { background: ["#f7f9fc", "#dfe7f1"], text: "#1d2a44", accent: "#b23a3a" } satisfies ScreenStyle;
      const type = { heading: "classic", body: "typewriter" } satisfies ScreenStyle;
      return [
        dress(
          intro(`Merry Christmas, ${to}!`, `A whole year of news from ${from}.`, "Read our news"),
          {
            ...night,
            ...type,
            envelope: "#f7f3ea",
            effect: "snow",
            burst: "snow",
            transition: "fade",
            stickers: [stick("❄️", 8, 10, 8, "spin"), stick("📮", 10, 89, 11, "sway"), stick("🎄", 90, 88, 11, "sway")],
          },
          { gotMail: "The family news" },
        ),
        dress(
          timeline("Our year", [
            at("January", "Big plans, new diaries, and a promise to call you more."),
            at("Spring", "Longer days, muddy walks and a birthday or two."),
            at("Summer", "A holiday, a heatwave and one very sunburnt nose."),
            at("Autumn", "Back to school and work, and the heating went back on."),
            at("December", "Lights up, cards out, and you on our minds."),
          ]),
          {
            ...paper,
            ...type,
            gradient: "down",
            pattern: "grid",
            effect: "sparkles",
            transition: "slide",
            stickers: [stick("📰", 8, 12, 9, "sway"), stick("✏️", 90, 88, 9, "sway")],
          },
          { timelineMore: "What happened next… ({i}/{n})" },
        ),
        dress(photos("The family this year"), {
          ...type,
          background: ["#3a7262", "#1f4238"],
          gradient: "glow",
          text: "#f7f3ea",
          accent: "#e2bf6b",
          effect: "snow",
          transition: "slide",
          stickers: [stick("📸", 10, 89, 10, "float"), stick("🎄", 90, 88, 11, "sway")],
        }),
        dress(
          slider("How much have you missed us?", "A little", "Loads", "We knew it. We've missed you just as much."),
          {
            ...type,
            background: ["#fbefe9", "#f2d5cb"],
            gradient: "glow",
            text: "#3a1d1d",
            accent: "#b23a3a",
            burst: "hearts",
            transition: "rise",
            stickers: [stick("❤️", 8, 12, 8, "pulse"), stick("🏠", 90, 88, 10, "float")],
          },
          { sliderLines: ["Only that much?", "Keep going…", "That's more like it.", "Nearly there…"] },
        ),
        dress(
          message(
            "From all of us",
            `Dear ${to},\n\nThat's our year in a nutshell. The best bits were the ones with family in them, and we wish you'd been in more of them.\n\nHave a wonderful Christmas, and let's make next year the one we see each other more.\n\nWith love,\n${from}`,
          ),
          { ...paper, ...type, gradient: "down", effect: "sparkles", transition: "fade", stickers: [stick("✉️", 90, 89, 10, "float")] },
        ),
        dress(finale("Merry Christmas!", "And a very happy New Year from all of us.", "snow"), {
          ...night,
          ...type,
          effect: "snow",
          transition: "zoom",
          stickers: [stick("⭐", 8, 12, 8, "pulse"), stick("🎄", 10, 89, 12, "sway"), stick("🎁", 90, 88, 11, "float")],
        }),
      ];
    },
    demo: { to: "Auntie Kamla", from: "The Patels", photos: [DEMO.cosyHome, P.summer, P.tree] },
  },

  // ---------- Birthday ----------
  // For the big ones, 30th to 100th. The words never name the age, so it fits any of them.
  {
    slug: "milestone-birthday",
    name: "The Big Birthday",
    occasion: "birthday",
    tone: "heartfelt",
    theme: "gold",
    ambient: "sparkles",
    emoji: "🥂",
    headline: "Here's to a big one",
    blurb: "For a 30th, 40th, 50th or 90th: candles to blow out, their story so far, a jar of reasons they're loved and your photos through the years.",
    screens: (to, from) => {
      const black = { background: ["#2f2a35", "#0f0d12"], gradient: "glow", text: "#f6ecd6", accent: "#d4af37" } satisfies ScreenStyle;
      const champagne = { background: ["#fbf5e6", "#ecdcb9"], text: "#2a2116" } satisfies ScreenStyle;
      const type = { heading: "classic", body: "modern" } satisfies ScreenStyle;
      return [
        dress(
          intro(`${to}, this is a big one`, `${from} wanted to mark it properly.`, "Let's celebrate"),
          {
            ...black,
            ...type,
            envelope: "#f8f0de",
            effect: "sparkles",
            burst: "confetti",
            transition: "fade",
            stickers: [stick("✨", 8, 10, 8, "pulse"), stick("🥂", 10, 89, 11, "sway"), stick("🎈", 90, 88, 11, "float")],
          },
          { gotMail: "A birthday to remember" },
        ),
        dress(game("blow-candles", "Make a big wish", "Tap each flame to blow out your candles", "Wish made. Here's to the years ahead!"), {
          ...champagne,
          ...type,
          gradient: "glow",
          accent: "#8a6a1f",
          effect: "sparkles",
          burst: "confetti",
          transition: "rise",
          stickers: [stick("🎂", 10, 89, 11, "bounce"), stick("✨", 90, 88, 9, "pulse")],
        }),
        dress(
          timeline("Your story so far", [
            at("Day one", "The world got a lot more interesting."),
            at("Growing up", "Scraped knees, big dreams and a lot of questions."),
            at("Finding your way", "Work, love, laughter and a few wrong turns that turned out right."),
            at("Today", "Surrounded by people who think you're wonderful."),
            at("Next", "The best bits are still to come."),
          ]),
          {
            ...type,
            background: ["#1f1b24", "#0f0d12"],
            gradient: "down",
            text: "#f6ecd6",
            accent: "#d4af37",
            effect: "stars",
            transition: "slide",
            stickers: [stick("✨", 8, 12, 8, "pulse"), stick("🕰️", 90, 88, 10, "sway")],
          },
        ),
        dress(
          reasons("Why we love you", "Tap the jar. There are plenty.", [
            "You make everyone feel welcome",
            "Your laugh. We can hear it from the next room.",
            "Your advice, and the stories that come with it",
            "You never let a birthday go by without a phone call",
            "You've taught us more than you know",
            "How you keep going, whatever life throws at you",
            "You're still the life of every party",
            "You. Every year of you.",
          ]),
          {
            ...type,
            background: ["#f8e9e3", "#e9c6ba"],
            gradient: "glow",
            text: "#3a1f22",
            accent: "#7a2335",
            effect: "petals",
            burst: "confetti",
            transition: "rise",
            stickers: [stick("💛", 8, 12, 8, "pulse"), stick("🌹", 90, 88, 10, "sway")],
          },
        ),
        dress(photos("Through the years"), {
          ...black,
          ...type,
          effect: "sparkles",
          transition: "zoom",
          stickers: [stick("📸", 10, 89, 10, "float"), stick("✨", 90, 88, 8, "pulse")],
        }),
        dress(
          message(
            "On your big birthday",
            `${to},\n\nSome birthdays deserve a proper fuss, so here's ours: the candles, the memories and a jar full of reasons.\n\nThank you for being exactly who you are. We're so lucky to have you, and we can't wait to celebrate many more.\n\nHappy birthday, with all our love,\n${from}`,
          ),
          {
            ...champagne,
            heading: "classic",
            body: "classic",
            gradient: "down",
            accent: "#7a2335",
            effect: "sparkles",
            transition: "fade",
            stickers: [stick("🥂", 90, 88, 11, "sway")],
          },
        ),
        dress(finale(`Happy birthday, ${to}!`, "Here's to you, and to many more.", "fireworks"), {
          ...black,
          heading: "script",
          body: "modern",
          effect: "stars",
          transition: "zoom",
          stickers: [stick("🎆", 8, 12, 9, "pulse"), stick("🥂", 10, 89, 12, "sway"), stick("🎈", 90, 88, 12, "float")],
        }),
      ];
    },
    demo: { to: "Dadi", from: "All the family", photos: [P.cake, P.toast, P.summer] },
  },
  // For children: big, slow pieces and nothing to read in a hurry.
  {
    slug: "little-star-birthday",
    name: "Little Star Birthday",
    occasion: "birthday",
    tone: "cute",
    theme: "party",
    ambient: "balloons",
    emoji: "🧸",
    headline: "A birthday party in a card",
    blurb: "For children: blow out the candles, pop the balloons, pick a surprise and see their photos. Big, easy taps for little fingers.",
    screens: (to, from) => {
      const grape = { background: ["#7c64b3", "#5b3fa8"], gradient: "glow", pattern: "dots", text: "#fffaf0", accent: "#ffd23f" } satisfies ScreenStyle;
      const ink = "#1d2340";
      const type = { heading: "rounded", body: "rounded" } satisfies ScreenStyle;
      return [
        dress(
          intro(`Happy birthday, ${to}!`, `${from} sent you a birthday surprise. Ready?`, "I'm ready!"),
          {
            ...grape,
            ...type,
            envelope: "#ff8e8e",
            effect: "balloons",
            burst: "balloons",
            transition: "bounce",
            stickers: [stick("⭐", 8, 10, 9, "spin"), stick("🎈", 10, 89, 12, "float"), stick("🧸", 90, 88, 12, "bounce")],
          },
          { gotMail: "A party for you!" },
        ),
        dress(game("blow-candles", "Blow out your candles", "Tap each flame, then make a wish", "Wish made! Shh, it's a secret."), {
          ...type,
          background: ["#fff6c7", "#ffd23f"],
          gradient: "glow",
          text: ink,
          accent: "#c2185b",
          effect: "confetti",
          burst: "confetti",
          transition: "zoom",
          stickers: [stick("🎂", 10, 89, 11, "bounce"), stick("🎉", 90, 88, 11, "bounce")],
        }),
        // Fewer, bigger, slower balloons, so little fingers can catch them.
        dress(game("pop-balloons", "Balloon party!", "Pop 8 balloons as they float up", "Pop, pop, hooray!", "game2"), {
          ...type,
          background: ["#e3f5ff", "#9ed8ff"],
          gradient: "glow",
          text: ink,
          accent: "#c2185b",
          effect: "none",
          burst: "balloons",
          transition: "rise",
          tune: { goal: 8, speed: 0.75, size: 1.4 },
          stickers: [stick("☀️", 8, 13, 10, "spin"), stick("☁️", 90, 88, 11, "float")],
        }),
        dress(boxes("Pick a surprise", "Which box will you open?", ["A birthday crown for the whole day", "The very first slice of cake", "The biggest hug in the world"]), {
          ...type,
          background: ["#e6fbf1", "#9fe6c6"],
          gradient: "glow",
          pattern: "checks",
          text: ink,
          accent: "#5b3fa8",
          burst: "confetti",
          transition: "bounce",
          stickers: [stick("🎁", 10, 89, 11, "bounce"), stick("👑", 90, 88, 10, "sway")],
        }),
        dress(photos("Look how big you're getting!"), {
          ...type,
          background: ["#ffd0d0", "#ff9a9a"],
          gradient: "glow",
          text: ink,
          accent: "#5b3fa8",
          effect: "balloons",
          transition: "slide",
          stickers: [stick("⭐", 8, 12, 9, "spin"), stick("🧸", 90, 88, 11, "bounce")],
        }),
        dress(
          message(
            "Happy birthday!",
            `Dear ${to},\n\nYou make everyone around you smile, and today is all about you. Hope it's full of cake, games and all your favourite people.\n\nLots and lots of love,\n${from}`,
          ),
          {
            ...type,
            background: ["#fffaf0", "#ffeccc"],
            gradient: "glow",
            text: ink,
            accent: "#c2185b",
            effect: "confetti",
            transition: "fade",
            stickers: [stick("💌", 90, 88, 10, "float")],
          },
        ),
        dress(finale(`Happy birthday, ${to}!`, "Now go and have the best day ever.", "balloons"), {
          ...grape,
          ...type,
          effect: "balloons",
          transition: "bounce",
          stickers: [stick("🎉", 8, 13, 10, "bounce"), stick("🎈", 10, 89, 12, "float"), stick("🧸", 90, 88, 12, "bounce")],
        }),
      ];
    },
    demo: { to: "Zara", from: "Nani & Nana", photos: [P.balloons, P.cake, P.summer] },
  },
];
