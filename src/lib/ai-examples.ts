import type { CardData } from "./card";

// Two cards written by hand to show the card writer (lib/generate.ts) the standard we
// want: an idea that runs through every screen, their details everywhere, a full style
// on every screen, its own words on the built-in buttons, and games tuned to who's
// playing. Deliberately far apart (a cheeky get-well card for a sister, a gentle Diwali
// card for a grandmother) and far from the usual requests, so they teach the standard
// rather than a card to copy. Their colours aren't in lib/directions.ts, so a direction
// never asks for an example's palette.

export type AiExample = {
  // What the sender told us, shortened.
  request: string;
  idea: string;
  card: CardData;
};

const SISTER: AiExample = {
  request:
    "Occasion: Get well soon. It's for Tash (my big sister), from Mo. How it should feel: Funny, Heartfelt. She broke her ankle at roller derby (her derby name is Tash Bandicoot) and is stuck on the sofa with her cat Biscuit, watching Bake Off and complaining.",
  idea: "Tash Bandicoot's official sofa recovery programme, supervised by Biscuit the cat",
  card: {
    occasion: "getwell",
    theme: "lavender",
    ambient: "bubbles",
    music: "joy",
    to: "Tash",
    from: "Mo",
    screens: [
      {
        id: "intro",
        type: "intro",
        title: "Official notice for Tash Bandicoot",
        subtitle: "From the Department of Little Brothers. Keep that foot up while you read.",
        button: "Accept delivery",
        labels: { gotMail: "Special delivery for the sofa" },
        style: {
          background: ["#3a2e6e", "#2a2152"],
          gradient: "diagonal",
          pattern: "zigzag",
          text: "#fff4ec",
          accent: "#ff9f1c",
          envelope: "#ffd1dc",
          heading: "marker",
          body: "rounded",
          burst: "bubbles",
          transition: "drop",
          stickers: [
            { emoji: "🩼", x: 10, y: 9, size: 13, rotate: -18, motion: "sway" },
            { emoji: "🛼", x: 88, y: 89, size: 14, rotate: 14, motion: "bounce" },
            { emoji: "🐈", x: 11, y: 88, size: 12, rotate: -6, motion: "float" },
          ],
        },
      },
      {
        id: "lock",
        type: "typeit",
        title: "Security check",
        instructions: "Only one skater alive has this name. Type it to prove you're the real patient. Clue: a small, grumpy marsupial, with your name in front.",
        phrase: "Tash Bandicoot",
        winText: "Identity confirmed. The patient may proceed.",
        labels: { typeHint: "It's literally your own name", next: "Proceed, patient" },
        style: {
          background: ["#fff4ec"],
          text: "#3a2e6e",
          accent: "#3a2e6e",
          heading: "marker",
          body: "rounded",
          transition: "flip",
          stickers: [
            { emoji: "🔐", x: 9, y: 90, size: 12, rotate: -10, motion: "pulse" },
            { emoji: "🩹", x: 90, y: 88, size: 12, rotate: 25, motion: "none" },
          ],
        },
      },
      {
        id: "foot",
        type: "question",
        question: "Have you kept your foot up like the doctor said?",
        yes: "Yes, obviously",
        no: 'Define "up"',
        afterYes: "Biscuit says otherwise, but we'll let it go.",
        labels: {
          noLines: ["Biscuit saw everything", "The physio has been told", "Then why is your skate bag by the door?", "You tried a crossover in the kitchen", "I'm telling Mum", "No derby till you press Yes"],
          next: "Fine, moving on",
        },
        style: {
          background: ["#3a2e6e"],
          text: "#fff4ec",
          accent: "#ff9f1c",
          heading: "marker",
          body: "rounded",
          burst: "balloons",
          transition: "bounce",
          stickers: [
            { emoji: "🦶", x: 89, y: 87, size: 13, rotate: 20, motion: "sway" },
            { emoji: "🛋️", x: 11, y: 90, size: 13, rotate: -4, motion: "none" },
          ],
          texts: [{ text: "Biscuit is watching", x: 50, y: 95, size: 3.5, color: "#ffd1dc", font: "marker", rotate: -3 }],
        },
      },
      {
        id: "bakeoff",
        type: "quiz",
        title: "The Great Sofa Bake Off",
        questions: [
          { question: "How many episodes of Bake Off have you watched since Saturday?", options: ["Three, very sensibly", "All of them. Twice.", "I've started on the Junior one"], answer: 2 },
          { question: "Who's the real nurse in your flat?", options: ["The NHS", "Biscuit, lying on the bad ankle", "Mo, from forty miles away"], answer: 1 },
          { question: "First thing you'll do on two feet?", options: ["Lace up the skates", "Bake Mo a thank-you cake", "Throw the crutches in the canal"], answer: 0 },
        ],
        winText: "Star Baker of recovery. Paul would shake your hand.",
        labels: { wrongLines: ["Biscuit disagrees", "Soggy bottom of an answer", "Try again, Bandicoot", "Wrong, but brave"], quizPerfect: "Full marks. A Hollywood handshake." },
        style: {
          background: ["#ffd1dc", "#fff4ec"],
          gradient: "glow",
          pattern: "dots",
          text: "#3a2e6e",
          accent: "#3a2e6e",
          heading: "marker",
          body: "rounded",
          burst: "confetti",
          transition: "zoom",
          stickers: [
            { emoji: "🧁", x: 9, y: 50, size: 12, rotate: -12, motion: "float" },
            { emoji: "🍰", x: 89, y: 90, size: 12, rotate: 10, motion: "none" },
          ],
        },
      },
      {
        id: "prize",
        type: "boxes",
        title: "Pick your get-well prize",
        instructions: "Three boxes. One patient. They're all good, because I'm a great brother.",
        prizes: ["I'll do your big shop for a fortnight", "A custard slice, hand-delivered", "I'll watch a whole bout and not ask the rules once"],
        style: {
          background: ["#3a2e6e", "#4b3d8a"],
          gradient: "down",
          text: "#fff4ec",
          accent: "#ff9f1c",
          heading: "marker",
          body: "rounded",
          burst: "balloons",
          transition: "flip",
          stickers: [
            { emoji: "🎁", x: 9, y: 89, size: 12, rotate: -8, motion: "bounce" },
            { emoji: "🛼", x: 90, y: 90, size: 12, rotate: -14, motion: "spin" },
          ],
        },
      },
      {
        id: "letter",
        type: "message",
        title: "Right. The soppy bit.",
        body: "Tash,\n\nI know the sofa is driving you up the wall. You're the person who skates straight through a wall of blockers and laughs about it after, so sitting still is basically your worst nightmare.\n\nYou'll be back on eight wheels before you know it. Until then I'm on snack duty, so text me what you need, even if it's just someone to shout at the telly with when the bread doesn't rise.\n\nBiscuit and I are very proud of you. Mostly me. Biscuit is a cat.\n\nMo x",
        labels: { next: "Back to the sofa" },
        style: { background: ["#fff4ec"], text: "#3a2e6e", accent: "#3a2e6e", heading: "marker", body: "rounded", transition: "fade" },
      },
      {
        id: "finale",
        type: "finale",
        title: "Doctor's orders: rest, cake, repeat",
        body: "Get well soon, Bandicoot. The track misses you, and so do I.",
        effect: "balloons",
        labels: { playAgain: "Watch it again (foot up)" },
        style: {
          background: ["#ffd1dc", "#ff9f1c"],
          gradient: "diagonal",
          text: "#3a2e6e",
          accent: "#3a2e6e",
          heading: "marker",
          body: "rounded",
          transition: "zoom",
          stickers: [
            { emoji: "🩹", x: 11, y: 89, size: 12, rotate: -20, motion: "pulse" },
            { emoji: "🛼", x: 88, y: 88, size: 14, rotate: 12, motion: "bounce" },
          ],
        },
      },
    ],
  },
};

const NANI: AiExample = {
  request:
    "Occasion: Diwali. It's for Nani (my grandmother), from Kiran. How it should feel: Heartfelt, Festive. She's 84 and has just moved into a flat in Leicester. She makes the best kheer, grows marigolds on her balcony, and we video call every Sunday. Keep the games gentle and easy.",
  idea: "Lighting up Nani's first Diwali in her new flat, one little lamp at a time",
  card: {
    occasion: "diwali",
    theme: "marigold",
    ambient: "lanterns",
    music: "festive",
    to: "Nani",
    from: "Kiran",
    screens: [
      {
        id: "intro",
        type: "intro",
        title: "Happy Diwali, Nani",
        subtitle: "From Kiran, with love all the way to Leicester",
        button: "Open your card",
        style: {
          background: ["#5a2a1b", "#3d1a10"],
          gradient: "glow",
          text: "#fff8ec",
          accent: "#f6d58e",
          envelope: "#f6d58e",
          heading: "storybook",
          body: "classic",
          burst: "sparkles",
          transition: "fade",
          stickers: [
            { emoji: "🪔", x: 12, y: 88, size: 14, rotate: 0, motion: "pulse" },
            { emoji: "🌼", x: 88, y: 88, size: 13, rotate: 10, motion: "sway" },
            { emoji: "🌼", x: 10, y: 10, size: 10, rotate: 15, motion: "sway" },
          ],
        },
      },
      {
        id: "diyas",
        type: "game",
        game: "light-diyas",
        title: "Light up your new home",
        instructions: "Tap each little lamp to light it. There are five, one for every room of your new flat.",
        winText: "Your new home is glowing, Nani. Just like you.",
        labels: { diyaTap: "tap me", next: "Next, Nani" },
        style: {
          background: ["#fff8ec", "#f6d58e"],
          gradient: "down",
          text: "#5a2a1b",
          accent: "#c0392b",
          heading: "storybook",
          body: "classic",
          burst: "sparkles",
          transition: "rise",
          tune: { goal: 5 },
          stickers: [
            { emoji: "🌼", x: 9, y: 90, size: 12, rotate: -10, motion: "sway" },
            { emoji: "🌼", x: 91, y: 90, size: 12, rotate: 20, motion: "sway" },
          ],
        },
      },
      {
        id: "letter",
        type: "message",
        title: "Sunday thoughts, written down",
        body: "Dear Nani,\n\nThis is your first Diwali in the new flat. I wish I could be there to light the diyas with you.\n\nI hope the marigolds on your balcony are still flowering. You always said they like the cold more than we do.\n\nI keep thinking about your kheer. Nobody makes it like you. Please save me a bowl, and I promise to finish every spoonful when I visit.\n\nThank you for every Sunday call. They are the best part of my week, even when the picture freezes and all I can see is your ceiling.\n\nHappy Diwali, Nani. I love you very much.\n\nKiran",
        labels: { next: "Next, Nani" },
        style: {
          background: ["#fff8ec"],
          text: "#5a2a1b",
          accent: "#c0392b",
          heading: "storybook",
          body: "classic",
          transition: "fade",
          tune: { speed: 0.8 },
          stickers: [{ emoji: "🥣", x: 90, y: 92, size: 10, rotate: 0, motion: "none" }],
        },
      },
      {
        id: "wishes",
        type: "game",
        game: "release-lanterns",
        title: "Send your wishes up",
        instructions: "Tap each lantern to let it float away. Every one carries a wish for your year.",
        winText: "Good health, happy Sundays and plenty of kheer. All sent.",
        labels: { lanternTap: "Tap a lantern, Nani" },
        style: {
          background: ["#3d1a10", "#5a2a1b"],
          gradient: "down",
          text: "#fff8ec",
          accent: "#f6d58e",
          heading: "storybook",
          body: "classic",
          burst: "lanterns",
          transition: "rise",
          tune: { goal: 4 },
        },
      },
      {
        id: "finale",
        type: "finale",
        title: "Shubh Deepavali, Nani",
        body: "May your new home be full of light this year. Speak to you on Sunday.",
        effect: "lanterns",
        style: {
          background: ["#5a2a1b", "#3d1a10"],
          gradient: "glow",
          text: "#fff8ec",
          accent: "#f6d58e",
          heading: "storybook",
          body: "classic",
          transition: "fade",
          stickers: [
            { emoji: "🪔", x: 10, y: 90, size: 14, rotate: 0, motion: "pulse" },
            { emoji: "🪔", x: 90, y: 90, size: 14, rotate: 0, motion: "pulse" },
          ],
        },
      },
    ],
  },
};

export const AI_EXAMPLES: AiExample[] = [SISTER, NANI];
