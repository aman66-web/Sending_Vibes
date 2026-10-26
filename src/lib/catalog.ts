import type { CardData, Device, Effect, Game, Layout, Occasion, QuizQuestion, Screen, ThemeName } from "./card";

// The card designs people can browse and start from. Each one is a preset list
// of building-block screens plus a look; everything stays editable afterwards.

export const TONES = ["funny", "heartfelt", "cute", "romantic", "festive"] as const;
export type Tone = (typeof TONES)[number];

export const toneInfo: Record<Tone, { label: string; emoji: string }> = {
  funny: { label: "Funny", emoji: "😂" },
  heartfelt: { label: "Heartfelt", emoji: "🥹" },
  cute: { label: "Cute", emoji: "🧸" },
  romantic: { label: "Romantic", emoji: "🌹" },
  festive: { label: "Festive", emoji: "🎉" },
};

export const deviceInfo: Record<Device, { label: string; emoji: string; detail: string }> = {
  everywhere: { label: "Phone & desktop", emoji: "✨", detail: "Looks great on any phone, tablet or computer." },
  phone: { label: "Best on phone", emoji: "📱", detail: "Made for touch: shaking, scratching and tapping with a finger. Still works on a computer." },
  desktop: { label: "Best on desktop", emoji: "💻", detail: "Made for a big screen, a mouse and a keyboard. Still works on a phone." },
};

type DemoPhoto = { src: string; caption: string };

export type Template = {
  slug: string;
  name: string;
  occasion: Occasion;
  tone: Tone;
  device: Device;
  layout?: Layout;
  theme: ThemeName;
  ambient: Effect;
  // Shown on the product thumbnail.
  emoji: string;
  headline: string;
  blurb: string;
  featured?: boolean;
  screens: (to: string, from: string) => Screen[];
  demo: { to: string; from: string; photos?: DemoPhoto[] };
};

// Small builders so each design reads like a script.
const intro = (title: string, subtitle: string, button = "Open it"): Screen => ({ id: "intro", type: "intro", title, subtitle, button });
const question = (q: string, yes: string, no: string, afterYes: string, id = "question"): Screen => ({ id, type: "question", question: q, yes, no, afterYes });
const photos = (title: string, id = "photos"): Screen => ({ id, type: "photos", title, photos: [], captions: [] });
const message = (title: string, body: string, id = "message"): Screen => ({ id, type: "message", title, body });
const game = (g: Game, title: string, instructions: string, winText: string, id = "game"): Screen => ({ id, type: "game", game: g, title, instructions, winText });
const quiz = (title: string, questions: QuizQuestion[], winText: string, id = "quiz"): Screen => ({ id, type: "quiz", title, questions, winText });
const scratch = (title: string, instructions: string, hidden: string, id = "scratch"): Screen => ({ id, type: "scratch", title, instructions, hidden });
const typeit = (title: string, instructions: string, phrase: string, winText: string, id = "typeit"): Screen => ({ id, type: "typeit", title, instructions, phrase, winText });
const finale = (title: string, body: string, effect: Effect): Screen => ({ id: "finale", type: "finale", title, body, effect });
const q = (text: string, options: string[], answer: number): QuizQuestion => ({ question: text, options, answer });

const P = {
  sunset: { src: "/demo/sunset.svg", caption: "Golden hour with you" },
  coffee: { src: "/demo/coffee.svg", caption: "Where it all started ☕" },
  lights: { src: "/demo/lights.svg", caption: "Fairy-light nights ✨" },
  rangoli: { src: "/demo/rangoli.svg", caption: "Our rangoli this year" },
  diyas: { src: "/demo/lights.svg", caption: "Diwali at home 🪔" },
  fireworks: { src: "/demo/fireworks.svg", caption: "Fireworks from the roof" },
  cake: { src: "/demo/cake.svg", caption: "Cake o'clock 🎂" },
  balloons: { src: "/demo/balloons.svg", caption: "Up, up and away" },
  summer: { src: "/demo/sunset.svg", caption: "Last summer ☀️" },
  tree: { src: "/demo/tree.svg", caption: "Tree goals 🎄" },
  crescent: { src: "/demo/crescent.svg", caption: "Chaand raat 🌙" },
  grad: { src: "/demo/grad.svg", caption: "The big day 🎓" },
  bouquet: { src: "/demo/bouquet.svg", caption: "For you 💐" },
  toast: { src: "/demo/toast.svg", caption: "Cheers to us 🥂" },
};

export const TEMPLATES: Template[] = [
  // ---------- Valentine's ----------
  {
    slug: "be-my-valentine",
    name: "Will You Be My Valentine?",
    occasion: "valentine",
    tone: "cute",
    device: "everywhere",
    theme: "rose",
    ambient: "hearts",
    emoji: "💘",
    headline: "Will you be my Valentine?",
    blurb: "The classic. They try to say no, the button runs away, and they end up smiling at their phone.",
    featured: true,
    screens: (to, from) => [
      intro(`Hey ${to} 💌`, `${from} made you something. Tap when you're ready.`),
      question(`${to}, will you be my Valentine?`, "Yes! 💖", "No", "I knew you'd say yes 🥰"),
      photos("Some of my favourite moments with you"),
      game("catch-hearts", "Catch my love", "Tap 10 falling hearts to unlock your surprise", "You caught all my love! 💘"),
      message("Just so you know…", `Every day with you is my favourite day. Thank you for being you.\n\nLove, ${from}`),
      finale("Happy Valentine's Day ❤️", "Now screenshot this and send it back to me 😌", "hearts"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.sunset, P.coffee, P.lights] },
  },
  {
    slug: "no-is-not-an-option",
    name: "No Is Not an Option",
    occasion: "valentine",
    tone: "funny",
    device: "everywhere",
    theme: "sunset",
    ambient: "hearts",
    emoji: "🙅",
    headline: "Saying no is not an option",
    blurb: "A Valentine's card with absolutely no respect for the word no, plus a quiz they can't get wrong.",
    featured: true,
    screens: (to, from) => [
      intro(`Official notice for ${to} 📜`, `${from} has a very serious question. Legally you have to answer.`, "Proceed"),
      question("Will you be my Valentine?", "Fine, yes 🙄", "No", "Great choice. Very mature of you."),
      quiz(
        "Quick quiz",
        [
          q(`Who's the best-looking person you know?`, [from, `Also ${from}`, `Definitely ${from}`], 2),
          q(`What does ${from} deserve this Valentine's?`, ["Chocolate", "A nice dinner", "Both, obviously"], 2),
          q("How lucky are you?", ["Quite lucky", "Very lucky", "The luckiest person alive"], 2),
        ],
        "You passed! Your prize is me.",
      ),
      message("The fine print", `By opening this card you have agreed to:\n• Share your food with me\n• Laugh at my jokes (even the bad ones)\n• Be my Valentine, forever and ever\n\nNo refunds. Love, ${from}`),
      finale("Happy Valentine's! 😘", "There was never a No button. There was only destiny.", "confetti"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },
  {
    slug: "love-letter",
    name: "A Love Letter",
    occasion: "valentine",
    tone: "romantic",
    device: "everywhere",
    theme: "gold",
    ambient: "petals",
    emoji: "🌹",
    headline: "Words I don't say enough",
    blurb: "Slow, elegant and a little bit soppy. A letter that writes itself out, your photos, and falling petals.",
    screens: (to, from) => [
      intro(`My dearest ${to}`, "Find somewhere quiet. This one's just for you.", "Read my letter"),
      message(
        "Words I don't say enough",
        `${to},\n\nI don't always say it out loud, so here it is in writing. You make ordinary days feel like something worth remembering. You're my favourite person to do nothing with.\n\nThank you for choosing me.\n\nYours, ${from}`,
      ),
      photos("Us, so far"),
      message("Three things I love about you", "Your laugh, especially when you're trying not to.\nThe way you look after everyone.\nThat you're still here, putting up with me.", "message2"),
      finale(`Happy Valentine's Day, ${to} 🌹`, "Always yours.", "petals"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.sunset, P.lights, P.coffee] },
  },
  {
    slug: "catch-me-if-you-can",
    name: "Catch Me If You Can",
    occasion: "valentine",
    tone: "funny",
    device: "desktop",
    layout: "wide",
    theme: "midnight",
    ambient: "hearts",
    emoji: "🖱️",
    headline: "My heart runs from your cursor",
    blurb: "Built for a laptop. My heart literally runs away from their mouse until they trap it in a corner.",
    screens: (to, from) => [
      intro(`${to}, grab your mouse 🖱️`, `${from} has made you work for this one.`, "I'm ready"),
      game("cursor-chase", "Catch my heart", "It runs from your cursor. Catch it 5 times.", "Okay, you've got it. It's yours now 💓"),
      question("So… will you be my Valentine?", "Yes 💖", "No", "Good, because you can't return it."),
      photos("Exhibit A: we're cute"),
      finale("Happy Valentine's Day 💓", `Love, ${from} (and my heart, which you caught fair and square)`, "hearts"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.sunset, P.coffee, P.lights, P.balloons, P.fireworks, P.cake] },
  },
  {
    slug: "scratch-the-question",
    name: "Scratch to Find Out",
    occasion: "valentine",
    tone: "cute",
    device: "phone",
    theme: "rose",
    ambient: "hearts",
    emoji: "🪙",
    headline: "Scratch to reveal the question",
    blurb: "Made for a phone: they scratch the silver panel with a finger to reveal the big question.",
    screens: (to, from) => [
      intro(`${to}, you've won something 🎟️`, `${from} hid a question under this scratch card.`, "Let me see"),
      scratch("Scratch to find out", "Rub the silver panel with your finger", "Will you be my Valentine? 💘"),
      question("Well? What's your answer?", "YES 💖", "No", "Best scratch card ever 🥰"),
      message("You won!", `Your prize: me, forever. No cash alternative.\n\nLove, ${from}`),
      finale("Happy Valentine's Day 💝", "Jackpot.", "hearts"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },

  // ---------- Birthday ----------
  {
    slug: "birthday-bash",
    name: "Birthday Bash",
    occasion: "birthday",
    tone: "festive",
    device: "everywhere",
    theme: "party",
    ambient: "confetti",
    emoji: "🎂",
    headline: "Make a wish!",
    blurb: "Blow out the candles, flick through the memories, and get buried in confetti.",
    featured: true,
    screens: (to, from) => [
      intro(`It's your day, ${to}! 🎉`, `${from} has a surprise for you.`, "Let's party"),
      game("blow-candles", "Make a wish…", "Tap every flame to blow out your candles", "Wish made! I hope it comes true 🌟"),
      photos("Another year of great memories"),
      message("Happy birthday!", `Here's to another year of being amazing. Can't wait to celebrate with you.\n\nLove, ${from}`),
      finale(`Happy Birthday ${to}! 🎂`, "Go eat some cake. You've earned it.", "confetti"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.cake, P.balloons, P.summer] },
  },
  {
    slug: "another-year-older",
    name: "Another Year Older",
    occasion: "birthday",
    tone: "funny",
    device: "everywhere",
    theme: "sunset",
    ambient: "confetti",
    emoji: "👵",
    headline: "Admit it. You're old now.",
    blurb: "Gentle bullying about their age, a balloon-popping game, and a quiz about how old they feel.",
    featured: true,
    screens: (to, from) => [
      intro(`Happy birthday, ${to}! 🎈`, `${from} would like to discuss your age.`, "Ugh, fine"),
      question("Be honest. Are you old now?", "Fine, yes 👵", "Never", "Thank you for your honesty. Here's a balloon."),
      game("pop-balloons", "Pop your birthday balloons", "Pop 10 balloons before your knees give out", "Nice! Still got it. Sort of 💪"),
      quiz(
        "Age check",
        [
          q("What's the best part of a birthday?", ["The cake", "The presents", "Pretending you're not a year older"], 2),
          q("What time is bedtime now?", ["Midnight", "Whenever", "9:30, with a cup of tea"], 2),
        ],
        "Officially certified: old, but fabulous.",
      ),
      message("Jokes aside…", `You're getting better with age. Like cheese. Or wine. Mostly cheese.\n\nHave the best day.\n${from}`),
      finale(`Happy Birthday, ${to}! 🎂`, "Don't forget to take your vitamins.", "confetti"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },
  {
    slug: "shake-the-present",
    name: "Shake the Present",
    occasion: "birthday",
    tone: "funny",
    device: "phone",
    theme: "party",
    ambient: "confetti",
    emoji: "📳",
    headline: "Shake your phone to open it",
    blurb: "Made for a phone: they shake it like a present to burst it open. There's a tap option if they're on a laptop.",
    screens: (to, from) => [
      intro(`${to}, there's a present for you 🎁`, `${from} wrapped it tightly. You'll need to shake it.`, "Ooh"),
      game("shake-it", "Shake it open!", "Shake your phone as hard as you dare", "It burst open! 🥳"),
      message("What's inside?", `A whole year of me being there for you. Plus cake, if you share.\n\nHappy birthday!\n${from}`),
      photos("Look how far we've come"),
      finale(`Happy Birthday ${to}! 🎉`, "You can stop shaking now.", "confetti"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.cake, P.balloons, P.summer] },
  },
  {
    slug: "birthday-from-the-heart",
    name: "From the Heart",
    occasion: "birthday",
    tone: "heartfelt",
    device: "everywhere",
    theme: "sunset",
    ambient: "sparkles",
    emoji: "💛",
    headline: "Things I want you to know",
    blurb: "A warm, sincere birthday message with your photos. Perfect for parents, best friends and partners.",
    screens: (to, from) => [
      intro(`Happy birthday, ${to}`, "I wanted to say this properly.", "Open"),
      message(
        "On your birthday",
        `${to}, I hope today you feel even a fraction of how loved you are. You make everyone around you better, and I'm so grateful you're in my life.\n\nHere's to the year ahead.\n\n${from}`,
      ),
      photos("A few of my favourite memories"),
      finale(`Happy Birthday, ${to} 💛`, "Wishing you a year as wonderful as you are.", "sparkles"),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.summer, P.cake, P.balloons] },
  },
  {
    slug: "how-well-do-you-know-me",
    name: "How Well Do You Know Me?",
    occasion: "birthday",
    tone: "funny",
    device: "everywhere",
    theme: "mint",
    ambient: "confetti",
    emoji: "🧠",
    headline: "How well do you know me?",
    blurb: "A birthday quiz with questions you write yourself, then a memory game and a party finale.",
    screens: (to, from) => [
      intro(`Happy birthday ${to}! 🥳`, `But first, ${from} needs to know if you've been paying attention.`, "Bring it on"),
      quiz(
        "Birthday quiz",
        [
          q(`What's ${from}'s favourite food?`, ["Pizza", "Sushi", "Anything you're eating"], 2),
          q(`Where did we first meet?`, ["School", "Work", "A party"], 0),
          q(`What's ${from}'s worst habit?`, ["Being late", "Snoring", `${from} has no bad habits`], 2),
        ],
        "You know me so well. Suspiciously well.",
      ),
      game("memory-match", "Birthday memory", "Find all the matching pairs", "Sharp as ever! 🧠"),
      finale(`Happy Birthday ${to}! 🎂`, "You passed. Now go celebrate.", "confetti"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },

  // ---------- Diwali ----------
  {
    slug: "festival-of-lights",
    name: "Festival of Lights",
    occasion: "diwali",
    tone: "festive",
    device: "everywhere",
    theme: "marigold",
    ambient: "sparkles",
    emoji: "🪔",
    headline: "Happy Diwali ✨",
    blurb: "They light the diyas one by one, see your festive photos, then the sky fills with fireworks.",
    featured: true,
    screens: (to, from) => [
      intro(`Happy Diwali, ${to} ✨`, `${from} sent you a little festival of lights.`, "Let's begin"),
      game("light-diyas", "Light the diyas", "Tap each diya to light it", "May your home always be this bright 🪔"),
      photos("Memories that light me up"),
      message("My Diwali wish for you", `Wishing you and your family love, light, laughter and lots of mithai this Diwali.\n\nWarmly, ${from}`),
      finale("Shubh Deepavali 🎆", "May this year bring you light in every way.", "fireworks"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.rangoli, P.diyas, P.fireworks] },
  },
  {
    slug: "diwali-blessings",
    name: "Diwali Blessings",
    occasion: "diwali",
    tone: "heartfelt",
    device: "everywhere",
    theme: "gold",
    ambient: "sparkles",
    emoji: "🙏",
    headline: "Blessings for you and yours",
    blurb: "A graceful card for family and elders, with heartfelt wishes and family photos.",
    screens: (to, from) => [
      intro(`Happy Diwali, ${to} 🙏`, "With love and blessings.", "Open"),
      message(
        "Diwali blessings",
        `May Maa Lakshmi bless your home with happiness, good health and prosperity. May every diya you light this year chase away the darkness.\n\nThank you for everything you do for our family.\n\nWith love, ${from}`,
      ),
      photos("Our family"),
      game("light-diyas", "Light a diya with me", "Tap each diya to light it", "Shubh Deepavali 🪔"),
      finale("Shubh Deepavali", "With love, today and always.", "fireworks"),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.rangoli, P.diyas, P.fireworks] },
  },
  {
    slug: "pocket-fireworks",
    name: "Pocket Fireworks",
    occasion: "diwali",
    tone: "festive",
    device: "phone",
    theme: "midnight",
    ambient: "sparkles",
    emoji: "🎆",
    headline: "Shake your phone, launch fireworks",
    blurb: "Made for a phone: they shake to light the fuse and set off their own fireworks show. Safer than the real thing.",
    screens: (to, from) => [
      intro(`${to}, it's fireworks time 🎆`, `${from} packed a whole fireworks show into your phone.`, "Light the fuse"),
      game("shake-it", "Shake to launch!", "Shake your phone to light the fuse", "Kaboom! Happy Diwali 🎇"),
      message("Happy Diwali!", `No burnt fingers, no scared dogs, all the sparkle.\n\nWishing you a bright one, ${from}`),
      finale("Happy Diwali! 🎆", "Same time next year?", "fireworks"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },

  // ---------- Christmas ----------
  {
    slug: "merry-and-bright",
    name: "Merry & Bright",
    occasion: "christmas",
    tone: "festive",
    device: "everywhere",
    theme: "noel",
    ambient: "snow",
    emoji: "🎄",
    headline: "Merry Christmas!",
    blurb: "Unwrap a present, catch falling snowflakes and finish with a flurry of snow.",
    featured: true,
    screens: (to, from) => [
      intro(`Merry Christmas, ${to}! 🎄`, `${from} left something under the tree for you.`, "Peek under the tree"),
      game("unwrap-gift", "Unwrap your present", "Tap to tear off the wrapping paper", "It's love! The best present 💝"),
      game("catch-snowflakes", "Let it snow", "Catch 10 snowflakes", "Snow-mazing! ❄️", "game2"),
      photos("Christmas memories"),
      message("Merry Christmas", `Wishing you a cosy Christmas full of good food, bad jokes and people you love.\n\n${from}`),
      finale("Merry Christmas! ⛄", "And a very happy New Year.", "snow"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.tree, P.lights, P.fireworks] },
  },
  {
    slug: "naughty-or-nice",
    name: "Naughty or Nice?",
    occasion: "christmas",
    tone: "funny",
    device: "everywhere",
    theme: "noel",
    ambient: "snow",
    emoji: "🎅",
    headline: "Have you been naughty or nice?",
    blurb: "Santa's official investigation. The Naughty button runs away, so they're nice whether they like it or not.",
    screens: (to, from) => [
      intro(`Ho ho ho, ${to} 🎅`, `Santa's office (${from}) has some questions.`, "I'm innocent"),
      question("Have you been nice this year?", "Nice, obviously 😇", "Naughty", "That's what we thought. Approved for presents."),
      quiz(
        "Santa's investigation",
        [
          q("Who ate the last mince pie?", ["Me", "The dog", "It was like that when I found it"], 2),
          q("How many presents do you deserve?", ["One", "A few", "All of them"], 2),
        ],
        "Investigation closed. You're on the nice list.",
      ),
      game("unwrap-gift", "Here's your present", "Tap to unwrap it", "Merry Christmas! 🎁"),
      finale("Merry Christmas! 🎄", `Signed, Santa (definitely not ${from})`, "snow"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },
  {
    slug: "christmas-memories",
    name: "Christmas Memories",
    occasion: "christmas",
    tone: "heartfelt",
    device: "everywhere",
    theme: "midnight",
    ambient: "snow",
    emoji: "⛄",
    headline: "Home for Christmas",
    blurb: "A quiet, cosy card with your photos and a heartfelt message as the snow falls.",
    screens: (to, from) => [
      intro(`Merry Christmas, ${to}`, "Grab a hot chocolate first ☕", "Open"),
      photos("Christmases with you"),
      message("This Christmas", `Whatever this year brought, I'm grateful I got to spend it knowing you. Here's to many more Christmases together.\n\nLove, ${from}`),
      finale("Merry Christmas ❄️", "Warmest wishes for the season.", "snow"),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.tree, P.lights, P.coffee] },
  },

  // ---------- Eid ----------
  {
    slug: "eid-mubarak",
    name: "Eid Mubarak",
    occasion: "eid",
    tone: "festive",
    device: "everywhere",
    theme: "crescent",
    ambient: "stars",
    emoji: "🌙",
    headline: "Eid Mubarak! 🌙",
    blurb: "Catch the stars under the crescent moon, then share your Eid wishes and photos.",
    featured: true,
    screens: (to, from) => [
      intro(`Eid Mubarak, ${to} 🌙`, `${from} sent you some Eid joy.`, "Open"),
      game("catch-stars", "Catch the stars", "Catch 10 falling stars", "Your Eid is written in the stars ⭐"),
      photos("Eid with the family"),
      message("Eid Mubarak", `Wishing you and your family a joyful Eid full of peace, blessings and far too much food.\n\n${from}`),
      finale("Eid Mubarak! 🌙", "May this Eid bring you happiness and peace.", "stars"),
    ],
    demo: { to: "Aisha", from: "Omar", photos: [P.crescent, P.lights, P.fireworks] },
  },
  {
    slug: "eid-blessings",
    name: "Eid Blessings",
    occasion: "eid",
    tone: "heartfelt",
    device: "everywhere",
    theme: "gold",
    ambient: "stars",
    emoji: "🤲",
    headline: "Duas for you this Eid",
    blurb: "An elegant Eid card for family and elders, with heartfelt duas and family photos.",
    screens: (to, from) => [
      intro(`Eid Mubarak, ${to}`, "With love and duas.", "Open"),
      message(
        "My duas for you",
        `May Allah accept your prayers and fasts, fill your home with barakah and keep you and your loved ones in good health.\n\nThank you for always being there.\n\n${from}`,
      ),
      photos("Our family"),
      finale("Eid Mubarak 🌙", "Today and always.", "stars"),
    ],
    demo: { to: "Ammi", from: "Omar", photos: [P.crescent, P.lights, P.coffee] },
  },
  {
    slug: "eidi-please",
    name: "Eidi, Please",
    occasion: "eid",
    tone: "funny",
    device: "everywhere",
    theme: "crescent",
    ambient: "stars",
    emoji: "💸",
    headline: "Where's my Eidi?",
    blurb: "A polite (not polite) request for Eidi. The No button runs away, so they don't really have a choice.",
    screens: (to, from) => [
      intro(`Eid Mubarak, ${to}! 🌙`, `${from} has one small question.`, "Uh oh"),
      question("Will you be giving me Eidi this year?", "Of course 💸", "No", "Wonderful. Bank transfers are accepted."),
      quiz(
        "Eidi calculator",
        [
          q("How much Eidi is appropriate?", ["£5", "£10", "Whatever's in your wallet"], 2),
          q("Who is your favourite?", ["Everyone equally", "Hard to say", from], 2),
        ],
        "Calculation complete. Please pay promptly.",
      ),
      finale("Eid Mubarak! 🌙", "(I'm only half joking about the Eidi.)", "stars"),
    ],
    demo: { to: "Khala", from: "Omar" },
  },

  // ---------- Anniversary ----------
  {
    slug: "our-story",
    name: "Our Story",
    occasion: "anniversary",
    tone: "romantic",
    device: "everywhere",
    theme: "rose",
    ambient: "petals",
    emoji: "💍",
    headline: "Another year of us",
    blurb: "Your story so far: photos, a quiz about your firsts, and a love letter.",
    featured: true,
    screens: (to, from) => [
      intro(`Happy anniversary, ${to} 💍`, `${from} wrote down our story.`, "Read it"),
      photos("Chapter one"),
      quiz(
        "Our firsts",
        [
          q("Where was our first date?", ["Coffee", "Dinner", "The cinema"], 0),
          q(`Who said "I love you" first?`, [to, from, "We both did"], 1),
        ],
        "Still paying attention. I love that.",
      ),
      message("Happy anniversary", `Another year of laughing at the same jokes and stealing the covers. I'd choose you again in every version of my life.\n\n${from}`),
      finale("Happy Anniversary 💞", "Here's to the next chapter.", "petals"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.toast, P.sunset, P.coffee] },
  },
  {
    slug: "still-choose-you",
    name: "I'd Still Choose You",
    occasion: "anniversary",
    tone: "heartfelt",
    device: "everywhere",
    theme: "gold",
    ambient: "sparkles",
    emoji: "🥂",
    headline: "I'd still choose you",
    blurb: "Understated and elegant. A letter, your photos, and a toast to the years ahead.",
    screens: (to, from) => [
      intro(`To ${to}`, "Happy anniversary. Open this when you have a minute.", "Open"),
      message("Every time", `If I could go back to the day we met, I'd do it all again. The good days, the hard days, all of it. Because all of it led here.\n\n${from}`),
      photos("Us"),
      finale("Happy Anniversary 🥂", "To us.", "sparkles"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.toast, P.sunset, P.lights] },
  },
  {
    slug: "secret-password",
    name: "The Secret Password",
    occasion: "anniversary",
    tone: "romantic",
    device: "desktop",
    layout: "wide",
    theme: "midnight",
    ambient: "sparkles",
    emoji: "⌨️",
    headline: "Type the secret password",
    blurb: "Built for a computer: they type the secret password on the keyboard to unlock a full gallery wall of your photos.",
    screens: (to, from) => [
      intro(`${to}, this card is locked 🔒`, `Only ${from}'s favourite person knows the password.`, "Unlock it"),
      typeit("Enter the password", "Three little words. You know them.", "I love you", "Access granted 💞"),
      photos("Our gallery"),
      message("Happy anniversary", `Every one of these pictures is a day I'm glad I spent with you.\n\n${from}`),
      finale("Happy Anniversary 💫", "Password changes next year. Hint: it won't.", "sparkles"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.toast, P.sunset, P.coffee, P.lights, P.balloons, P.fireworks] },
  },
  {
    slug: "memory-lane",
    name: "Memory Lane",
    occasion: "anniversary",
    tone: "cute",
    device: "everywhere",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🃏",
    headline: "Match our memories",
    blurb: "A sweet memory-match game, your photos and a little note. Cute, not cheesy (well, slightly cheesy).",
    screens: (to, from) => [
      intro(`Happy anniversary, ${to}! 💜`, `${from} made you a little game.`, "Let's play"),
      game("memory-match", "Memory lane", "Find all the matching pairs", "Perfect match. Like us 💑"),
      photos("The real memories"),
      message("P.S.", `I'd play this game with you forever (and still let you win).\n\n${from}`),
      finale("Happy Anniversary 💜", "Many more matches to come.", "hearts"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.coffee, P.sunset, P.toast] },
  },

  // ---------- Sorry ----------
  {
    slug: "please-forgive-me",
    name: "Please Forgive Me",
    occasion: "sorry",
    tone: "funny",
    device: "everywhere",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🥺",
    headline: "Do you forgive me?",
    blurb: "An apology where the No button refuses to cooperate. Ideal for small crimes like eating their leftovers.",
    featured: true,
    screens: (to, from) => [
      intro(`${to}, I messed up 🥺`, `${from} is very, very sorry.`, "Go on…"),
      question("Do you forgive me?", "Yes, fine 🙄", "No", "Thank you! I promise I've learnt my lesson. Probably."),
      message("My official apology", `I'm sorry. You were right, I was wrong, and I'll never do it again (I will try very hard not to do it again).\n\nForgive me? ${from}`),
      finale("Friends again? 🤝", "I'll buy the snacks.", "hearts"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },
  {
    slug: "im-really-sorry",
    name: "I'm Really Sorry",
    occasion: "sorry",
    tone: "heartfelt",
    device: "everywhere",
    theme: "lavender",
    ambient: "petals",
    emoji: "🌷",
    headline: "I'm sorry",
    blurb: "A sincere apology for when it matters. No jokes, just honest words and a few happier memories.",
    screens: (to, from) => [
      intro(`${to}`, "I owe you an apology, and I wanted to do it properly.", "Open"),
      message("I'm sorry", `I know I hurt you, and I'm truly sorry. You didn't deserve that. I'm going to do better, because you matter to me more than being right.\n\n${from}`),
      photos("Remember these?"),
      finale("I'm sorry 🌷", "Whenever you're ready to talk, I'm here.", "petals"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.bouquet, P.coffee, P.sunset] },
  },
  {
    slug: "scratch-my-apology",
    name: "Scratch My Apology",
    occasion: "sorry",
    tone: "cute",
    device: "everywhere",
    theme: "sunset",
    ambient: "hearts",
    emoji: "🎟️",
    headline: "An apology, under the scratch card",
    blurb: "They scratch away the silver panel to find your apology (and a peace offering).",
    screens: (to, from) => [
      intro(`${to}, special delivery 📦`, `${from} hid something under this scratch card.`, "Show me"),
      scratch("Scratch for a surprise", "Scratch the silver panel", "I'm sorry 🥺 Dinner's on me."),
      question("Deal?", "Deal 🤝", "No", "Yay! Booking the table now."),
      finale("Thank you for forgiving me 💛", "You're the best.", "hearts"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },

  // ---------- Thank you ----------
  {
    slug: "thank-you-so-much",
    name: "Thank You So Much",
    occasion: "thanks",
    tone: "heartfelt",
    device: "everywhere",
    theme: "mint",
    ambient: "sparkles",
    emoji: "🙏",
    headline: "Thank you, truly",
    blurb: "A warm thank-you for teachers, friends, colleagues or anyone who went above and beyond.",
    featured: true,
    screens: (to, from) => [
      intro(`${to}, this is for you 💐`, `${from} wanted to say something.`, "Open"),
      message("Thank you", `Thank you for everything you've done. You went above and beyond, and it didn't go unnoticed. I'm so grateful.\n\n${from}`),
      photos("Some good times"),
      finale("Thank you! 💚", "You're one of the good ones.", "sparkles"),
    ],
    demo: { to: "Ms Patel", from: "Class 4B", photos: [P.bouquet, P.coffee, P.balloons] },
  },
  {
    slug: "gallery-of-thanks",
    name: "Gallery of Thanks",
    occasion: "thanks",
    tone: "cute",
    device: "desktop",
    layout: "wide",
    theme: "sunset",
    ambient: "sparkles",
    emoji: "🖼️",
    headline: "A whole wall of thank yous",
    blurb: "Built for a big screen: a gallery wall of up to six photos, a memory game and a big thank-you. Great for group cards.",
    screens: (to, from) => [
      intro(`Thank you, ${to}! 🖼️`, `From ${from}. We made you a gallery.`, "Open the gallery"),
      photos(`The ${to} appreciation gallery`),
      game("memory-match", "A little game", "Find all the matching pairs", "Thank you for being a perfect match 🙏"),
      message("From all of us", `We couldn't have done it without you. Thank you for your time, your patience and your kindness.\n\n${from}`),
      finale("THANK YOU! 🎉", "You're appreciated more than you know.", "confetti"),
    ],
    demo: { to: "Ms Patel", from: "Class 4B", photos: [P.bouquet, P.balloons, P.coffee, P.cake, P.sunset, P.grad] },
  },

  // ---------- Congrats ----------
  {
    slug: "you-did-it",
    name: "You Did It!",
    occasion: "congrats",
    tone: "festive",
    device: "everywhere",
    theme: "mint",
    ambient: "confetti",
    emoji: "🏆",
    headline: "You did it! 🎉",
    blurb: "For graduations, new jobs, passed exams and big wins. Pop the balloons, then fireworks.",
    featured: true,
    screens: (to, from) => [
      intro(`Congratulations, ${to}! 🏆`, `${from} is so proud of you.`, "Celebrate"),
      game("pop-balloons", "Victory balloons", "Pop 10 balloons to celebrate", "Woohoo! 🎈"),
      photos("Look at you go"),
      message("So proud of you", `All that hard work paid off. You deserve every bit of this.\n\nCongratulations!\n${from}`),
      finale(`Congrats, ${to}! 🎓`, "Onwards and upwards.", "fireworks"),
    ],
    demo: { to: "Priya", from: "Sam", photos: [P.grad, P.balloons, P.cake] },
  },
  {
    slug: "big-brain-energy",
    name: "Big Brain Energy",
    occasion: "congrats",
    tone: "funny",
    device: "everywhere",
    theme: "party",
    ambient: "stars",
    emoji: "🤓",
    headline: "Are you a genius?",
    blurb: "Congratulations, with a side of teasing. A genius test, a star-catching game and confetti.",
    screens: (to, from) => [
      intro(`Well well well, ${to} 🤓`, `${from} heard the news.`, "What news?"),
      question("Are you, in fact, a genius?", "Yes, I am 😎", "No", "Correct. Humble too."),
      quiz(
        "Genius test",
        [
          q("What's 2 + 2?", ["4", "22", "Fish"], 0),
          q("Who's the cleverest person here?", [to, from, "The dog"], 0),
        ],
        "Genius confirmed. We're all very impressed.",
      ),
      game("catch-stars", "Gold stars for you", "Catch 10 gold stars", "Gold stars all round ⭐"),
      finale(`Congratulations, ${to}! 🎉`, "Don't let it go to your head (too late).", "confetti"),
    ],
    demo: { to: "Priya", from: "Sam" },
  },
];

export const templatesBySlug = Object.fromEntries(TEMPLATES.map((t) => [t.slug, t])) as Record<string, Template>;

export function getTemplate(slug: string | undefined | null): Template | undefined {
  return slug ? templatesBySlug[slug] : undefined;
}

export function buildCard(t: Template, to: string, from: string): CardData {
  return {
    occasion: t.occasion,
    theme: t.theme,
    ambient: t.ambient,
    to,
    from,
    template: t.slug,
    device: t.device,
    layout: t.layout ?? "standard",
    screens: t.screens(to, from),
  };
}

// The card as shown in previews: sample names and illustrated photos.
export function buildTemplateDemo(t: Template, names?: { to?: string; from?: string }): CardData {
  const card = buildCard(t, names?.to || t.demo.to, names?.from || t.demo.from);
  const photos = t.demo.photos ?? [];
  return {
    ...card,
    screens: card.screens.map((s) =>
      s.type === "photos" && photos.length ? { ...s, photos: photos.map((p) => p.src), captions: photos.map((p) => p.caption) } : s,
    ),
  };
}
