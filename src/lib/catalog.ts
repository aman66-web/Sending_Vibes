import type { CardData, Effect, Layout, Music, Occasion, Screen, ThemeName } from "./card";
import type { Tier } from "./pricing";
import * as B from "./design-styles-b";
import { MORE_DESIGNS } from "./catalog-more";
import { OCCASION_DESIGNS } from "./catalog-occasions";
import { BLANK, arcade, bloom, blush, bout, candle, crown, dusk, fizz, flight, gallery, garden, golden, groan, gulal, hush, lilac, lullaby, memo, oak, reveal, splash, stick, sunny, thread, ticket, voyage, zine } from "./design-styles-c";
import { P, at, boxes, coupons, finale, game, intro, message, photos, q, question, quiz, reasons, scratch, slider, timeline, typeit, wheel } from "./design-kit";

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

type DemoPhoto = { src: string; caption: string };

export type Template = {
  slug: string;
  name: string;
  occasion: Occasion;
  tone: Tone;
  layout?: Layout;
  theme: ThemeName;
  ambient: Effect;
  // Shown on the product thumbnail.
  emoji: string;
  headline: string;
  blurb: string;
  featured?: boolean;
  // Defaults to the occasion's usual tune.
  music?: Music;
  screens: (to: string, from: string) => Screen[];
  demo: { to: string; from: string; photos?: DemoPhoto[] };
};

export const OCCASION_MUSIC: Record<Occasion, Music> = {
  valentine: "love",
  birthday: "birthday",
  diwali: "festive",
  christmas: "jingle",
  eid: "festive",
  anniversary: "love",
  sorry: "love",
  thanks: "festive",
  congrats: "joy",
  halloween: "spooky",
  newyear: "auld",
  mothersday: "love",
  fathersday: "festive",
  rakhi: "festive",
  holi: "festive",
  newbaby: "lullaby",
  wedding: "joy",
  getwell: "love",
  missyou: "love",
  friendship: "festive",
  leaving: "auld",
  graduation: "joy",
  retirement: "auld",
  newhome: "festive",
};


export const TEMPLATES: Template[] = [
  // ---------- Valentine's ----------
  {
    slug: "be-my-valentine",
    name: "Will You Be My Valentine?",
    occasion: "valentine",
    tone: "cute",
    theme: "rose",
    ambient: "hearts",
    emoji: "💘",
    headline: "Will you be my Valentine?",
    blurb: "The classic. They try to say no, the button runs away, and they end up smiling at their phone.",
    featured: true,
    screens: (to, from) => [
      intro(`Hey ${to}`, `${from} made you something. Tap when you're ready.`),
      question(`${to}, will you be my Valentine?`, "Yes!", "No", "I knew you'd say yes"),
      photos("Some of my favourite moments with you"),
      game("catch-hearts", "Catch my love", "Tap 10 falling hearts to unlock your surprise", "You caught all my love!"),
      message("Just so you know…", `Every day with you is my favourite day. Thank you for being you.\n\nLove, ${from}`),
      finale("Happy Valentine's Day", "Now screenshot this and send it back to me", "hearts"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.sunset, P.coffee, P.lights] },
  },
  {
    slug: "no-is-not-an-option",
    name: "No Is Not an Option",
    occasion: "valentine",
    tone: "funny",
    theme: "sunset",
    ambient: "hearts",
    emoji: "🙅",
    headline: "Saying no is not an option",
    blurb: "A Valentine's card with absolutely no respect for the word no, plus a quiz they can't get wrong.",
    featured: true,
    screens: (to, from) => [
      intro(`Official notice for ${to}`, `${from} has a very serious question. Legally you have to answer.`, "Proceed"),
      question("Will you be my Valentine?", "Fine, yes", "No", "Great choice. Very mature of you."),
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
      finale("Happy Valentine's!", "There was never a No button. There was only destiny.", "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "love-letter",
    name: "A Love Letter",
    occasion: "valentine",
    tone: "romantic",
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
      finale(`Happy Valentine's Day, ${to}`, "Always yours.", "petals"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.sunset, P.lights, P.coffee] },
  },
  {
    slug: "catch-me-if-you-can",
    name: "Catch Me If You Can",
    occasion: "valentine",
    tone: "funny",
    layout: "wide",
    theme: "midnight",
    ambient: "hearts",
    emoji: "🖱️",
    headline: "My heart runs from your cursor",
    blurb: "Built for a laptop. My heart literally runs away from their mouse until they trap it in a corner.",
    screens: (to, from) => [
      intro(`${to}, grab your mouse`, `${from} has made you work for this one.`, "I'm ready"),
      game("cursor-chase", "Catch my heart", "It runs from your cursor. Catch it 5 times.", "Okay, you've got it. It's yours now"),
      question("So… will you be my Valentine?", "Yes", "No", "Good, because you can't return it."),
      photos("Exhibit A: we're cute"),
      finale("Happy Valentine's Day", `Love, ${from} (and my heart, which you caught fair and square)`, "hearts"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.sunset, P.coffee, P.lights, P.balloons, P.fireworks, P.cake] },
  },
  {
    slug: "scratch-the-question",
    name: "Scratch to Find Out",
    occasion: "valentine",
    tone: "cute",
    theme: "rose",
    ambient: "hearts",
    emoji: "🪙",
    headline: "Scratch to reveal the question",
    blurb: "Made for a phone: they scratch the silver panel with a finger to reveal the big question.",
    screens: (to, from) => [
      intro(`${to}, you've won something`, `${from} hid a question under this scratch card.`, "Let me see"),
      scratch("Scratch to find out", "Rub the silver panel with your finger", "Will you be my Valentine?"),
      question("Well? What's your answer?", "YES", "No", "Best scratch card ever"),
      message("You won!", `Your prize: me, forever. No cash alternative.\n\nLove, ${from}`),
      finale("Happy Valentine's Day", "Jackpot.", "hearts"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },

  {
    slug: "date-night-roulette",
    name: "Date Night Roulette",
    occasion: "valentine",
    tone: "funny",
    theme: "midnight",
    ambient: "hearts",
    emoji: "🎡",
    headline: "Spin for our next date",
    blurb: "They spin a wheel to pick your next date night, then redeem date coupons. The No button still runs away.",
    screens: (to, from) => [
      intro(`${to}, let's leave it to fate`, `${from} couldn't decide what we're doing for Valentine's. So you're spinning for it.`, "Let's spin"),
      question("First things first. Will you be my Valentine?", "Obviously", "No", "Correct answer. Now spin."),
      wheel("Spin for our date", "Whatever it lands on, we're doing it", ["Pizza & a film", "Fancy dinner", "Takeaway in PJs", "Mini golf", "A picnic", "Cook together"], "It's a date!"),
      coupons("Your date coupons", "Tap to redeem. Valid forever.", ["You pick the restaurant", "I pay. All of it.", "Dessert is on me", "No phones all night"]),
      finale("Happy Valentine's Day", `It's a date. Love, ${from}`, "hearts"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "loves-me-loves-me-not",
    name: "Loves Me, Loves Me Not",
    occasion: "valentine",
    tone: "cute",
    theme: "rose",
    ambient: "petals",
    emoji: "🌼",
    headline: "Loves me, loves me not…",
    blurb: "They pluck the petals off a daisy (it always ends on 'loves me'), then try to slide the love-o-meter down. It only goes up.",
    screens: (to, from) => [
      intro(`${to}, a little flower for you`, `${from} wants to know something. The flower will decide.`, "Pick it"),
      game("loves-me-not", "Loves me, loves me not", "Pluck every petal to find out", "LOVES ME! The flower never lies"),
      slider(`How much do you love ${from}?`, "A little", "Too much", "Off the charts. As expected"),
      message("Just so you know", `It was always going to be 'loves me'. I made sure of it.\n\nHappy Valentine's, ${to}.\n${from} x`),
      finale("Happy Valentine's Day", "You're stuck with me now.", "petals"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "reasons-i-love-you",
    name: "Reasons I Love You",
    occasion: "valentine",
    tone: "romantic",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🫙",
    headline: "A jar full of reasons",
    blurb: "A jar of handwritten notes. They tap it to pull out every reason you love them, then see your photos.",
    featured: true,
    screens: (to, from) => [
      intro(`For ${to}, with love`, `${from} filled a jar with reasons. It wasn't hard.`, "Open the jar"),
      reasons("Reasons I love you", "Tap the jar to pull out a note", [
        "The way you laugh at your own jokes before you finish them",
        "You always save me the last bite",
        "How safe I feel when you hug me",
        "Your terrible singing in the car",
        "You make boring days fun",
        "The way you look at me when you think I'm not looking",
        "You're you. That's the main one.",
      ]),
      photos("Some of my favourite reasons"),
      message("And one more thing", `I could fill a hundred jars and still not be done.\n\nHappy Valentine's Day.\nLove, ${from}`),
      finale(`I love you, ${to}`, "Every single reason.", "hearts"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.sunset, P.coffee, P.lights] },
  },

  // ---------- Birthday ----------
  {
    slug: "birthday-bash",
    name: "Birthday Bash",
    occasion: "birthday",
    tone: "festive",
    theme: "party",
    ambient: "confetti",
    emoji: "🎂",
    headline: "Make a wish!",
    blurb: "Blow out the candles, flick through the memories, and get buried in confetti.",
    featured: true,
    screens: (to, from) => [
      intro(`It's your day, ${to}!`, `${from} has a surprise for you.`, "Let's party"),
      game("blow-candles", "Make a wish…", "Tap every flame to blow out your candles", "Wish made! I hope it comes true"),
      photos("Another year of great memories"),
      message("Happy birthday!", `Here's to another year of being amazing. Can't wait to celebrate with you.\n\nLove, ${from}`),
      finale(`Happy Birthday ${to}!`, "Go eat some cake. You've earned it.", "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.cake, P.balloons, P.summer] },
  },
  {
    slug: "another-year-older",
    name: "Another Year Older",
    occasion: "birthday",
    tone: "funny",
    theme: "sunset",
    ambient: "confetti",
    emoji: "👵",
    headline: "Admit it. You're old now.",
    blurb: "Gentle bullying about their age, a balloon-popping game, and a quiz about how old they feel.",
    featured: true,
    screens: (to, from) => [
      intro(`Happy birthday, ${to}!`, `${from} would like to discuss your age.`, "Ugh, fine"),
      question("Be honest. Are you old now?", "Fine, yes", "Never", "Thank you for your honesty. Here's a balloon."),
      game("pop-balloons", "Pop your birthday balloons", "Pop 10 balloons before your knees give out", "Nice! Still got it. Sort of"),
      quiz(
        "Age check",
        [
          q("What's the best part of a birthday?", ["The cake", "The presents", "Pretending you're not a year older"], 2),
          q("What time is bedtime now?", ["Midnight", "Whenever", "9:30, with a cup of tea"], 2),
        ],
        "Officially certified: old, but fabulous.",
      ),
      message("Jokes aside…", `You're getting better with age. Like cheese. Or wine. Mostly cheese.\n\nHave the best day.\n${from}`),
      finale(`Happy Birthday, ${to}!`, "Don't forget to take your vitamins.", "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "shake-the-present",
    name: "Shake the Present",
    occasion: "birthday",
    tone: "funny",
    theme: "party",
    ambient: "confetti",
    emoji: "📳",
    headline: "Shake your phone to open it",
    blurb: "Made for a phone: they shake it like a present to burst it open. There's a tap option if they're on a laptop.",
    screens: (to, from) => [
      intro(`${to}, there's a present for you`, `${from} wrapped it tightly. You'll need to shake it.`, "Ooh"),
      game("shake-it", "Shake it open!", "Shake your phone as hard as you dare", "It burst open!"),
      message("What's inside?", `A whole year of me being there for you. Plus cake, if you share.\n\nHappy birthday!\n${from}`),
      photos("Look how far we've come"),
      finale(`Happy Birthday ${to}!`, "You can stop shaking now.", "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.cake, P.balloons, P.summer] },
  },
  {
    slug: "birthday-from-the-heart",
    name: "From the Heart",
    occasion: "birthday",
    tone: "heartfelt",
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
      finale(`Happy Birthday, ${to}`, "Wishing you a year as wonderful as you are.", "sparkles"),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.summer, P.cake, P.balloons] },
  },
  {
    slug: "how-well-do-you-know-me",
    name: "How Well Do You Know Me?",
    occasion: "birthday",
    tone: "funny",
    theme: "mint",
    ambient: "confetti",
    emoji: "🧠",
    headline: "How well do you know me?",
    blurb: "A birthday quiz with questions you write yourself, then a memory game and a party finale.",
    screens: (to, from) => [
      intro(`Happy birthday ${to}!`, `But first, ${from} needs to know if you've been paying attention.`, "Bring it on"),
      quiz(
        "Birthday quiz",
        [
          q(`What's ${from}'s favourite food?`, ["Pizza", "Sushi", "Anything you're eating"], 2),
          q(`Where did we first meet?`, ["School", "Work", "A party"], 0),
          q(`What's ${from}'s worst habit?`, ["Being late", "Snoring", `${from} has no bad habits`], 2),
        ],
        "You know me so well. Suspiciously well.",
      ),
      game("memory-match", "Birthday memory", "Find all the matching pairs", "Sharp as ever!"),
      finale(`Happy Birthday ${to}!`, "You passed. Now go celebrate.", "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },

  {
    slug: "pinata-party",
    name: "Piñata Party",
    occasion: "birthday",
    tone: "festive",
    theme: "party",
    ambient: "confetti",
    emoji: "🪅",
    headline: "Smash it for your surprise",
    blurb: "They whack a swinging piñata until it bursts with sweets, then spin a wheel for their birthday present.",
    featured: true,
    screens: (to, from) => [
      intro(`It's party time, ${to}!`, `${from} hung up a piñata just for you. Grab a stick.`, "Let's smash it"),
      game("pinata", "Smash the piñata!", "Tap it 8 times to break it open", "Sweets everywhere!"),
      wheel("Spin for your present", "What will it be?", ["Cake", "A big hug", "Breakfast in bed", "A day off chores", "A surprise trip", "Karaoke night"], "Happy birthday to you!"),
      photos("Party memories"),
      finale(`Happy Birthday, ${to}!`, `Love, ${from}. Now go and eat all those sweets.`, "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.balloons, P.cake, P.summer] },
  },
  {
    slug: "birthday-coupon-book",
    name: "Birthday Coupon Book",
    occasion: "birthday",
    tone: "cute",
    theme: "mint",
    ambient: "sparkles",
    emoji: "🎟️",
    headline: "A book of birthday treats",
    blurb: "They blow out the candles, then get a book of birthday coupons to redeem all year: breakfast in bed, film picks and more.",
    screens: (to, from) => [
      intro(`Happy birthday, ${to}!`, `${from} got you something you can actually use.`, "Ooh, what is it?"),
      game("blow-candles", "Make a wish first", "Tap each flame to blow out your candles", "Wish made! Now for your present…"),
      coupons("Your birthday coupons", "Tap one to redeem it. Screenshot it as proof!", [
        "Breakfast in bed",
        "You pick the film (no complaints)",
        "One day off chores",
        "Dinner of your choice",
        "Unlimited hugs",
        "I'll sing to you (sorry)",
      ]),
      message("Happy birthday", `I hope this year brings you everything you've been wishing for. And if it doesn't, you've got coupons.\n\n${from}`),
      finale(`Happy Birthday, ${to}!`, "Coupons valid for one whole year.", "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "pick-your-present",
    name: "Pick Your Present",
    occasion: "birthday",
    tone: "funny",
    theme: "sunset",
    ambient: "confetti",
    emoji: "🎁",
    headline: "Three boxes. One present. No pressure.",
    blurb: "They choose a mystery box (they're all the same, shh), then pull a slot machine until they hit the jackpot.",
    screens: (to, from) => [
      intro(`Happy birthday, ${to}!`, `${from} has three presents for you. You can only pick one.`, "Show me"),
      boxes("Pick a present", "Choose wisely. No swapsies.", ["A hug", "A hug", "A hug"]),
      game("slot-machine", "Bonus round!", "Pull the lever for the jackpot", "JACKPOT! Happy birthday"),
      message("In all seriousness", `Happy birthday. You deserve the best day ever (and more than a hug, which is coming, I promise).\n\n${from}`),
      finale(`Happy Birthday, ${to}!`, "The real present was me all along.", "confetti"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },

  // ---------- Diwali ----------
  {
    slug: "festival-of-lights",
    name: "Festival of Lights",
    occasion: "diwali",
    tone: "festive",
    theme: "marigold",
    ambient: "sparkles",
    emoji: "🪔",
    headline: "Happy Diwali",
    blurb: "They light the diyas one by one, see your festive photos, then the sky fills with fireworks.",
    featured: true,
    screens: (to, from) => [
      intro(`Happy Diwali, ${to}`, `${from} sent you a little festival of lights.`, "Let's begin"),
      game("light-diyas", "Light the diyas", "Tap each diya to light it", "May your home always be this bright"),
      photos("Memories that light me up"),
      message("My Diwali wish for you", `Wishing you and your family love, light, laughter and lots of mithai this Diwali.\n\nWarmly, ${from}`),
      finale("Shubh Deepavali", "May this year bring you light in every way.", "fireworks"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.rangoli, P.diyas, P.fireworks] },
  },
  {
    slug: "diwali-blessings",
    name: "Diwali Blessings",
    occasion: "diwali",
    tone: "heartfelt",
    theme: "gold",
    ambient: "sparkles",
    emoji: "🙏",
    headline: "Blessings for you and yours",
    blurb: "A graceful card for family and elders, with heartfelt wishes and family photos.",
    screens: (to, from) => [
      intro(`Happy Diwali, ${to}`, "With love and blessings.", "Open"),
      message(
        "Diwali blessings",
        `May Maa Lakshmi bless your home with happiness, good health and prosperity. May every diya you light this year chase away the darkness.\n\nThank you for everything you do for our family.\n\nWith love, ${from}`,
      ),
      photos("Our family"),
      game("light-diyas", "Light a diya with me", "Tap each diya to light it", "Shubh Deepavali"),
      finale("Shubh Deepavali", "With love, today and always.", "fireworks"),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.rangoli, P.diyas, P.fireworks] },
  },
  {
    slug: "pocket-fireworks",
    name: "Pocket Fireworks",
    occasion: "diwali",
    tone: "festive",
    theme: "midnight",
    ambient: "sparkles",
    emoji: "🎆",
    headline: "Shake your phone, launch fireworks",
    blurb: "Made for a phone: they shake to light the fuse and set off their own fireworks show. Safer than the real thing.",
    screens: (to, from) => [
      intro(`${to}, it's fireworks time`, `${from} packed a whole fireworks show into your phone.`, "Light the fuse"),
      game("shake-it", "Shake to launch!", "Shake your phone to light the fuse", "Kaboom! Happy Diwali"),
      message("Happy Diwali!", `No burnt fingers, no scared dogs, all the sparkle.\n\nWishing you a bright one, ${from}`),
      finale("Happy Diwali!", "Same time next year?", "fireworks"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },

  {
    slug: "lanterns-of-light",
    name: "Lanterns of Light",
    occasion: "diwali",
    tone: "heartfelt",
    theme: "marigold",
    ambient: "stars",
    emoji: "🏮",
    headline: "Send a wish up into the sky",
    blurb: "They release glowing sky lanterns one by one, read your Diwali wishes, then light up the sky with fireworks.",
    screens: (to, from) => [
      intro(`Happy Diwali, ${to}`, `${from} saved you some lanterns. Make a wish with each one.`, "Let's go outside"),
      game("release-lanterns", "Release the lanterns", "Tap each lantern and make a wish", "May every wish come true"),
      message("My wishes for you", `Light to guide you, love to hold you, and sweets to keep you going.\n\nHappy Diwali, from ${from}`),
      game("launch-fireworks", "Now the fireworks!", "Tap the sky to launch 6 fireworks", "What a show!", "game2"),
      finale("Shubh Deepavali", "May your year shine as bright as tonight.", "fireworks"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "mithai-mayhem",
    name: "Mithai Mayhem",
    occasion: "diwali",
    tone: "funny",
    theme: "sunset",
    ambient: "sparkles",
    emoji: "🍬",
    headline: "How many laddoos is too many?",
    blurb: "A Diwali quiz about sweets with only one right answer, a spin of the mithai wheel and a fireworks finale.",
    screens: (to, from) => [
      intro(`Happy Diwali, ${to}!`, `${from} has some very important questions about sweets.`, "I'm ready"),
      quiz(
        "The Diwali sweets quiz",
        [
          q("How many laddoos is too many?", ["3", "10", "There's no such thing"], 2),
          q("The best part of Diwali is…", ["The lights", "The family", "The mithai, obviously"], 2),
          q("Who gets the last kaju katli?", [from, to, "We fight for it"], 2),
        ],
        "Correct. Sweets are life.",
      ),
      wheel("Spin for your mithai", "Whatever it lands on, I owe you a box", ["Kaju katli", "Gulab jamun", "Jalebi", "Laddoo", "Barfi", "Rasmalai"], "Your box of mithai is on its way"),
      game("launch-fireworks", "Light up the sky", "Tap the sky to launch 6 fireworks", "Dhamaka!"),
      finale("Happy Diwali!", "Save me a laddoo.", "fireworks"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },

  // ---------- Christmas ----------
  {
    slug: "merry-and-bright",
    name: "Merry & Bright",
    occasion: "christmas",
    tone: "festive",
    theme: "noel",
    ambient: "snow",
    emoji: "🎄",
    headline: "Merry Christmas!",
    blurb: "Unwrap a present, catch falling snowflakes and finish with a flurry of snow.",
    featured: true,
    screens: (to, from) => [
      intro(`Merry Christmas, ${to}!`, `${from} left something under the tree for you.`, "Peek under the tree"),
      game("unwrap-gift", "Unwrap your present", "Tap to tear off the wrapping paper", "It's love! The best present"),
      game("catch-snowflakes", "Let it snow", "Catch 10 snowflakes", "Snow-mazing!", "game2"),
      photos("Christmas memories"),
      message("Merry Christmas", `Wishing you a cosy Christmas full of good food, bad jokes and people you love.\n\n${from}`),
      finale("Merry Christmas!", "And a very happy New Year.", "snow"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.tree, P.lights, P.fireworks] },
  },
  {
    slug: "naughty-or-nice",
    name: "Naughty or Nice?",
    occasion: "christmas",
    tone: "funny",
    theme: "noel",
    ambient: "snow",
    emoji: "🎅",
    headline: "Have you been naughty or nice?",
    blurb: "Santa's official investigation. The Naughty button runs away, so they're nice whether they like it or not.",
    screens: (to, from) => [
      intro(`Ho ho ho, ${to}`, `Santa's office (${from}) has some questions.`, "I'm innocent"),
      question("Have you been nice this year?", "Nice, obviously", "Naughty", "That's what we thought. Approved for presents."),
      quiz(
        "Santa's investigation",
        [
          q("Who ate the last mince pie?", ["Me", "The dog", "It was like that when I found it"], 2),
          q("How many presents do you deserve?", ["One", "A few", "All of them"], 2),
        ],
        "Investigation closed. You're on the nice list.",
      ),
      game("unwrap-gift", "Here's your present", "Tap to unwrap it", "Merry Christmas!"),
      finale("Merry Christmas!", `Signed, Santa (definitely not ${from})`, "snow"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "christmas-memories",
    name: "Christmas Memories",
    occasion: "christmas",
    tone: "heartfelt",
    theme: "midnight",
    ambient: "snow",
    emoji: "⛄",
    headline: "Home for Christmas",
    blurb: "A quiet, cosy card with your photos and a heartfelt message as the snow falls.",
    screens: (to, from) => [
      intro(`Merry Christmas, ${to}`, "Grab a hot chocolate first", "Open"),
      photos("Christmases with you"),
      message("This Christmas", `Whatever this year brought, I'm grateful I got to spend it knowing you. Here's to many more Christmases together.\n\nLove, ${from}`),
      finale("Merry Christmas", "Warmest wishes for the season.", "snow"),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.tree, P.lights, P.coffee] },
  },

  {
    slug: "secret-santa",
    name: "Secret Santa",
    occasion: "christmas",
    tone: "funny",
    theme: "noel",
    ambient: "snow",
    emoji: "🎅",
    headline: "It's socks. It's always socks.",
    blurb: "They pick a present from under the tree (all three are socks), then pull a festive slot machine for the jackpot.",
    screens: (to, from) => [
      intro(`Ho ho ho, ${to}!`, `Your Secret Santa (it's ${from}) has three presents for you.`, "Gimme"),
      boxes("Pick a present", "Choose carefully…", ["Socks", "More socks", "A lovely jumper (it's socks)"]),
      game("slot-machine", "Christmas jackpot", "Pull the lever for some festive luck", "Jackpot! Merry Christmas"),
      message("Merry Christmas!", `Wishing you warm feet and a warm heart this Christmas.\n\n${from}`),
      finale("Merry Christmas!", "Wear them with pride.", "snow"),
    ],
    demo: { to: "Olivia", from: "Sam" },
  },
  {
    slug: "twelve-reasons-of-christmas",
    name: "12 Reasons of Christmas",
    occasion: "christmas",
    tone: "heartfelt",
    theme: "gold",
    ambient: "snow",
    emoji: "✨",
    headline: "On the 12th day of Christmas…",
    blurb: "A jar of twelve reasons you're thankful for them, your festive photos and a gentle snowfall.",
    screens: (to, from) => [
      intro(`Merry Christmas, ${to}`, `${from} has 12 things to tell you.`, "Open"),
      reasons("12 reasons of Christmas", "Tap the jar for each one", [
        "You make every Christmas feel like home",
        "Your famous roast potatoes",
        "You always find the perfect present",
        "Your laugh at the cracker jokes",
        "How you look after everyone",
        "Christmas films with you",
        "You let me have the last mince pie",
        "The way you light up a room",
        "Your patience with my wrapping",
        "Every memory we've made",
        "All the ones still to come",
        "You. Just you.",
      ]),
      photos("Christmas memories"),
      finale(`Merry Christmas, ${to}`, `With love, ${from}`, "snow"),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.tree, P.lights, P.fireworks] },
  },

  // ---------- Eid ----------
  {
    slug: "eid-mubarak",
    name: "Eid Mubarak",
    occasion: "eid",
    tone: "festive",
    theme: "crescent",
    ambient: "stars",
    emoji: "🌙",
    headline: "Eid Mubarak!",
    blurb: "Catch the stars under the crescent moon, scratch the silver for an Eid wish, then your photos and Eid wishes.",
    featured: true,
    screens: (to, from) =>
      B.dress(B.EID_MUBARAK, [
        { ...intro(`Eid Mubarak, ${to}`, `${from} sent you some Eid joy.`, "See the stars"), labels: { gotMail: "An Eid card for you" } },
        game("catch-stars", "Catch the stars", "Catch 10 falling stars", "Your Eid is written in the stars"),
        scratch("A wish under the moon", "Scratch the silver to find your Eid wish", "May every dua you make be answered, and every day after Eid feel just as bright."),
        photos("Eid with the family"),
        message(
          "Eid Mubarak",
          `Wishing you and your family a joyful Eid, full of peace, blessings and far too much food.\n\nThank you for being such a bright part of my life. Eid is always better with you in it.\n\n${from}`,
        ),
        { ...finale("Eid Mubarak!", "May this Eid bring you happiness and peace.", "stars"), labels: { playAgain: "See the stars again" } },
      ]),
    demo: { to: "Aisha", from: "Omar", photos: [P.crescent, P.lights, P.fireworks] },
  },
  {
    slug: "eid-blessings",
    name: "Eid Blessings",
    occasion: "eid",
    tone: "heartfelt",
    theme: "ivory",
    ambient: "stars",
    emoji: "🤲",
    headline: "Duas for you this Eid",
    blurb: "An elegant Eid card for family and elders: a garden of blessings to water, a jar of reasons Eid isn't Eid without them, family photos and heartfelt duas.",
    screens: (to, from) =>
      B.dress(B.EID_BLESSINGS, [
        { ...intro(`Eid Mubarak, ${to}`, "Something for you, with love and duas.", "Read my duas"), labels: { gotMail: "Eid Mubarak" } },
        game("grow-flower", "A garden of blessings", "Water the plant until it blooms", "May your home bloom with barakah"),
        {
          ...reasons("Why Eid isn't Eid without you", "Tap the jar, one at a time", [
            "The way you make everyone feel at home",
            "Your duas, which follow us everywhere",
            "The stories you tell about Eids long ago",
            "How there's always room for one more at your table",
            "Your hugs at the door",
          ]),
          labels: { jarEmpty: "And so many more." },
        },
        photos("Our family"),
        message(
          "My duas for you",
          `May Allah accept your prayers and good deeds, fill your home with barakah and keep you and your loved ones in good health.\n\nThank you for always being there.\n\n${from}`,
        ),
        finale("Eid Mubarak", "Today and always.", "stars"),
      ]),
    demo: { to: "Ammi", from: "Omar", photos: [P.crescent, P.lights, P.coffee] },
  },
  {
    slug: "eidi-please",
    name: "Eidi, Please",
    occasion: "eid",
    tone: "funny",
    theme: "mint",
    ambient: "stars",
    emoji: "💸",
    headline: "Where's my Eidi?",
    blurb: "A polite (not polite) request for Eidi. The No button runs away, the Eidi calculator does the maths, and there's a proper thank-you at the end.",
    screens: (to, from) =>
      B.dress(B.EIDI_PLEASE, [
        intro(`Eid Mubarak, ${to}!`, `${from} has one small question.`, "Uh oh"),
        {
          ...question("Will you be giving me Eidi this year?", "Of course", "No", "Wonderful. Bank transfers are accepted."),
          labels: { noLines: ["Eidi is tradition", "Check your pockets", "The aunties are watching", "That's not very Eid of you", "I've been very good", "Even a fiver is fine", "Wrong button"] },
        },
        {
          ...quiz(
            "Eidi calculator",
            [
              q("How much Eidi is appropriate?", ["£5", "£10", "Whatever's in your wallet"], 2),
              q("Who is your favourite?", ["Everyone equally", "Hard to say", from], 2),
            ],
            "Calculation complete. Please pay promptly.",
          ),
          labels: { wrongLines: ["Recalculating…", "That's not a lot of Eidi.", "Try a bigger number.", "Hmm, no."], quizPerfect: "Full marks. Payment due today." },
        },
        photos("Exhibit A: why I deserve Eidi"),
        message(
          "Jokes aside",
          `Eidi or no Eidi, you're one of my favourite people to celebrate with. Thank you for the duas, the sweets and the notes slipped into my hand when no one was looking.\n\nEid Mubarak.\n${from}`,
        ),
        finale("Eid Mubarak!", "(I'm only half joking about the Eidi.)", "stars"),
      ]),
    demo: {
      to: "Khala",
      from: "Omar",
      photos: [
        { ...P.balloons, caption: "Very well behaved" },
        { ...P.cake, caption: "Shared my sweets (once)" },
        { ...P.crescent, caption: "Eid best, as always" },
      ],
    },
  },
  {
    slug: "eid-hugs-and-feasts",
    name: "Eid Hugs & Feasts",
    occasion: "eid",
    tone: "cute",
    theme: "sunset",
    ambient: "stars",
    emoji: "🤗",
    headline: "Your Eid hug is waiting",
    blurb: "An Eid hug they press and hold to receive, a spin of the wheel to choose the Eid feast, and the moments you're missing.",
    screens: (to, from) =>
      B.dress(B.EID_HUGS_AND_FEASTS, [
        intro(`Eid Mubarak, ${to}!`, `${from} can't be there for an Eid hug, so here's the next best thing.`, "Get my hug"),
        game("hold-hug", "Your Eid hug", "Press and hold to receive it", "Eid hug delivered"),
        {
          ...wheel("Spin for the Eid feast", "Whatever it lands on, I'm bringing it", ["Biryani", "Sheer khurma", "Kebabs", "Samosas", "Dates", "Baklava"], "Feast secured"),
          labels: { spin: "Spin for the feast" },
        },
        photos("Missing moments like these"),
        message(
          "Eid Mubarak",
          `May Allah fill your home with peace, your table with food and your heart with happiness.\n\nI'm sorry I can't be there this year. Save me a seat and a plate, and I'll be there the moment I can.\n\n${from}`,
        ),
        finale("Eid Mubarak!", "Save me some sheer khurma.", "stars"),
      ]),
    demo: { to: "Ammi", from: "Omar", photos: [P.crescent, P.teacup, P.cake] },
  },
  {
    slug: "eid-family-gallery",
    name: "Eid Family Gallery",
    occasion: "eid",
    tone: "heartfelt",
    layout: "wide",
    theme: "gold",
    ambient: "stars",
    emoji: "🖼️",
    headline: "Eid memories, all in one place",
    blurb: "Built for a big screen: a wall of family photos from Eid, a memory game, a jar of Eid moments and your heartfelt wishes.",
    screens: (to, from) =>
      B.dress(B.EID_FAMILY_GALLERY, [
        intro(`Eid Mubarak, ${to}`, `${from} put together our Eid memories.`, "Open the gallery"),
        photos("Our Eid memories"),
        game("memory-match", "A little Eid game", "Find all the matching pairs", "Mashallah, perfect memory"),
        {
          ...reasons("What makes our Eid", "Tap the jar for a memory", [
            "Getting ready together on Eid morning",
            "Everyone talking at once at dinner",
            "The race for the last samosa",
            "Eidi envelopes and big hugs",
            "The family photo that takes twenty tries",
          ]),
          labels: { jarCount: "Memory {i} of {n}", jarEmpty: "And many more Eids to come." },
        },
        message(
          "Eid Mubarak",
          `Wishing you and the whole family a blessed Eid, full of love, laughter and good food.\n\nLooking back at these, I realise how lucky we are to have each other.\n\n${from}`,
        ),
        finale("Eid Mubarak", "From our family to yours.", "stars"),
      ]),
    demo: { to: "Ammi", from: "Omar", photos: [P.crescent, P.lights, P.coffee, P.cake, P.bouquet, P.toast] },
  },

  // ---------- Anniversary ----------
  {
    slug: "our-story",
    name: "Our Story",
    occasion: "anniversary",
    tone: "romantic",
    theme: "rose",
    ambient: "petals",
    emoji: "💍",
    headline: "Another year of us",
    blurb: "Your story so far, like a storybook: photos, a quiz about your firsts, a love letter and one last question with a No that runs away.",
    featured: true,
    screens: (to, from) =>
      B.dress(B.OUR_STORY, [
        intro(`Happy anniversary, ${to}`, `${from} wrote down our story.`, "Read it"),
        photos("Chapter one"),
        {
          ...quiz(
            "Our firsts",
            [
              q("Where was our first date?", ["Coffee", "Dinner", "The cinema"], 0),
              q(`Who said "I love you" first?`, [to, from, "We both did"], 1),
            ],
            "Still paying attention. I love that.",
          ),
          labels: { wrongLines: ["Wrong chapter!", "Did you skip a page?", "Hmm. Read it again.", "Plot hole!"] },
        },
        message("Happy anniversary", `Another year of laughing at the same jokes and stealing the covers. I'd choose you again in every version of my life.\n\n${from}`),
        {
          ...question("Shall we keep writing it together?", "Always", "No", "Then let's turn the page."),
          labels: { noLines: ["Plot twist?", "Wrong ending", "That's not how it ends", "Turn the page", "Read it again", "Try the other button"] },
        },
        { ...finale("Happy Anniversary", "Here's to the next chapter.", "petals"), labels: { playAgain: "Read it again" } },
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.toast, P.sunset, P.coffee] },
  },
  {
    slug: "still-choose-you",
    name: "I'd Still Choose You",
    occasion: "anniversary",
    tone: "heartfelt",
    theme: "ivory",
    ambient: "sparkles",
    emoji: "🥂",
    headline: "I'd still choose you",
    blurb: "Understated and elegant. A letter, a jar of reasons, your photos and a toast to the years ahead.",
    screens: (to, from) =>
      B.dress(B.STILL_CHOOSE_YOU, [
        intro(`To ${to}`, "Happy anniversary. Open this when you have a minute.", "I have a minute"),
        message("Every time", `If I could go back to the day we met, I'd do it all again. The good days, the hard days, all of it. Because all of it led here.\n\n${from}`),
        {
          ...reasons("Why I'd choose you again", "Tap the jar", [
            "You make an ordinary Tuesday feel like ours",
            "You hold my hand without thinking about it",
            "You're the first person I want to tell everything",
            "You make me braver",
            "Home is wherever you are",
          ]),
          labels: { jarEmpty: "And a thousand more." },
        },
        photos("Us"),
        {
          ...slider("Would I choose you again?", "Probably", "Every time", "Every time. In every version of my life."),
          labels: { sliderLines: ["Only probably? Keep going…", "Definitely…", "Without a doubt…", "Nearly there…"] },
        },
        finale("Happy Anniversary", "To us.", "sparkles"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.toast, P.sunset, P.lights] },
  },
  {
    slug: "secret-password",
    name: "The Secret Password",
    occasion: "anniversary",
    tone: "romantic",
    layout: "wide",
    theme: "midnight",
    ambient: "sparkles",
    emoji: "⌨️",
    headline: "Type the secret password",
    blurb: "Built for a computer: they pass a security check, type the secret password on the keyboard and unlock a full gallery wall of your photos.",
    screens: (to, from) =>
      B.dress(B.SECRET_PASSWORD, [
        intro(`${to}, this card is locked`, `Only ${from}'s favourite person knows the password.`, "Unlock it"),
        {
          ...quiz(
            "Security check",
            [
              q("Security question: who sent you this card?", [`Someone called ${from}`, "A secret admirer", "The bank"], 0),
              q(`How much does ${from} love you?`, ["A bit", "Quite a lot", "More than words can say"], 2),
            ],
            "Identity confirmed. Welcome back.",
          ),
          labels: {
            wrongLines: ["Access denied.", "Hmm. Suspicious.", "Try again, agent.", "Impostor alert!"],
            quizPerfect: "Not one wrong answer. Very secure.",
            quizMissedOne: "One wrong answer. We'll let it slide.",
            quizMissed: "{n} wrong answers. Suspicious, but you're in.",
          },
        },
        { ...typeit("Enter the password", "Three little words. You know them.", "I love you", "Access granted"), labels: { typeStart: "Type the password…" } },
        photos("Our gallery"),
        message("Happy anniversary", `Every one of these pictures is a day I'm glad I spent with you. Thank you for all of them, and for all the ones we haven't taken yet.\n\n${from}`),
        finale("Happy Anniversary", "Password changes next year. Hint: it won't.", "sparkles"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.toast, P.sunset, P.coffee, P.lights, P.balloons, P.fireworks] },
  },
  {
    slug: "memory-lane",
    name: "Memory Lane",
    occasion: "anniversary",
    tone: "cute",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🃏",
    headline: "Match our memories",
    blurb: "A sweet memory-match game, your photos, a mystery box for your next date and a little note. Cute, not cheesy (well, slightly cheesy).",
    screens: (to, from) =>
      B.dress(B.MEMORY_LANE, [
        intro(`Happy anniversary, ${to}!`, `${from} made you a little game.`, "Let's play"),
        game("memory-match", "Memory lane", "Find all the matching pairs", "Perfect match. Like us."),
        photos("The real memories"),
        {
          ...boxes("What's our next memory?", "Pick a box. Whatever's inside, we're doing it.", ["A picnic in the park", "A weekend away", "Breakfast in bed"]),
          labels: { boxesPicked: "Our next memory…" },
        },
        message("P.S.", `I'd play this game with you forever (and still let you win).\n\nThank you for every memory so far. My favourite place to be is anywhere with you.\n\n${from}`),
        finale("Happy Anniversary", "Many more matches to come.", "hearts"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.coffee, P.sunset, P.toast] },
  },

  {
    slug: "our-timeline",
    name: "Our Timeline",
    occasion: "anniversary",
    tone: "romantic",
    theme: "ivory",
    ambient: "sparkles",
    emoji: "🗓️",
    headline: "Every chapter of us",
    blurb: "Your story told moment by moment, like a travel journal, from the day you met to today, then your photos, a jar of reasons and a letter.",
    screens: (to, from) =>
      B.dress(B.OUR_TIMELINE, [
        intro(`Happy anniversary, ${to}`, `${from} wrote down our story. Every chapter of it.`, "Read our story"),
        {
          ...timeline("Our story so far", [
            at("The beginning", "We met, and I couldn't stop smiling"),
            at("First date", "I was so nervous I forgot my wallet"),
            at("Our first trip", "Lost, sunburnt and completely happy"),
            at("Moving in", "Too many cushions. Your idea."),
            at("Today", "Still my favourite person in the world"),
          ]),
          labels: { timelineMore: "Next chapter… ({i}/{n})" },
        },
        photos("Our favourite chapters"),
        reasons("Why I'd do it all again", "Tap the jar", ["You make me laugh every day", "You're my safe place", "We're a really good team", "You still give me butterflies"]),
        {
          ...slider("How much do I love you now?", "Loads", "More than ever", "More than the day we met. And still going."),
          labels: { sliderLines: ["Only that much?", "More…", "Even more…", "Nearly…"] },
        },
        message("Every chapter with you", `Looking back at all of it, the only thing I'd change is meeting you sooner.\n\nThank you for every chapter so far. I can't wait to see what we write next.\n\n${from}`),
        finale("Happy anniversary", "Here's to every chapter still to come.", "petals"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.toast, P.sunset, P.coffee] },
  },
  {
    slug: "love-coupons",
    name: "Love Coupons",
    occasion: "anniversary",
    tone: "cute",
    theme: "sunset",
    ambient: "hearts",
    emoji: "🎟️",
    headline: "Coupons, redeemable forever",
    blurb: "A book of love coupons they can cash in whenever they like, a prize wheel that's secretly rigged to land on a kiss, your photos and a love note.",
    screens: (to, from) =>
      B.dress(B.LOVE_COUPONS, [
        intro(`Happy anniversary, ${to}`, `${from} made you something you can cash in whenever you like.`, "Ooh"),
        {
          ...coupons("Your love coupons", "Tap to redeem. No expiry date.", [
            "One back massage",
            "Breakfast in bed",
            "A night off cooking",
            "You win the next argument",
            "Movie night, your pick",
            "One big hug, on demand",
          ]),
          labels: { coupon: "Love coupon", couponClaim: "Screenshot this and show me to claim it" },
        },
        {
          ...wheel("Bonus prize!", "Spin to see what else you've won", ["A kiss", "A hug", "A cuddle", "A dance", "A kiss", "A surprise"], "You won a kiss", 0),
          labels: { spinAgain: "Spin again (it's still a kiss)" },
        },
        photos("Proof we're good together"),
        message("No expiry date", `Every one of these coupons is a promise, and so is this: I'll keep choosing you, every day, for as long as you'll have me.\n\nHappy anniversary.\n${from}`),
        finale("Happy anniversary!", `Love you always, ${from}`, "hearts"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.coffee, P.sunset, P.toast] },
  },

  // ---------- Sorry ----------
  {
    slug: "please-forgive-me",
    name: "Please Forgive Me",
    occasion: "sorry",
    tone: "funny",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🥺",
    headline: "Do you forgive me?",
    blurb: "An apology where the No button refuses to cooperate and the forgiveness meter only goes up. Ideal for small crimes like eating their leftovers.",
    featured: true,
    screens: (to, from) =>
      B.dress(B.PLEASE_FORGIVE_ME, [
        intro(`${to}, I messed up`, `${from} is very, very sorry.`, "Go on…"),
        {
          ...question("Do you forgive me?", "Yes, fine", "No", "Thank you! I promise I've learnt my lesson. Probably."),
          labels: { noLines: ["I said sorry!", "I'll do the washing up", "Pretty please?", "Look at my sad face", "I brought snacks", "Forgiveness is free", "Wrong button"] },
        },
        {
          ...slider("How much do you forgive me?", "A tiny bit", "Completely", "Fully forgiven. You're too kind."),
          labels: { sliderLines: ["That's not much…", "Keep going…", "Nearly forgiven…", "So close…"] },
        },
        photos("Evidence of happier times"),
        message(
          "My official apology",
          `I'm sorry. You were right, I was wrong, and I'll never do it again (I will try very hard not to do it again).\n\nJokes aside, I hate it when we're not okay. You mean a lot to me.\n\nForgive me? ${from}`,
        ),
        finale("Friends again?", "I'll buy the snacks.", "hearts"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.friends, P.coffee, P.sunset] },
  },
  {
    slug: "im-really-sorry",
    name: "I'm Really Sorry",
    occasion: "sorry",
    tone: "heartfelt",
    theme: "sky",
    ambient: "petals",
    emoji: "🌷",
    headline: "I'm sorry",
    blurb: "A sincere apology for when it matters. No jokes: honest words, what you'll do differently, a few happier memories and lanterns to light.",
    screens: (to, from) =>
      B.dress(B.IM_REALLY_SORRY, [
        intro(`${to}`, "I owe you an apology, and I wanted to do it properly.", "Read it"),
        message("I'm sorry", `I know I hurt you, and I'm truly sorry. You didn't deserve that. I'm going to do better, because you matter to me more than being right.\n\n${from}`),
        {
          ...reasons("What I'll do differently", "Tap the jar, one at a time", ["Listen before I answer", "Say sorry sooner", "Think about how my words land", "Make proper time for us"]),
          labels: { jarCount: "Promise {i} of {n}", jarEmpty: "I mean every one of them." },
        },
        photos("Remember these?"),
        { ...game("release-lanterns", "A little light", "Tap each lantern to send it up into the sky", "Thank you for hearing me out"), labels: { lanternTap: "Tap each lantern to let it go" } },
        { ...finale("I'm sorry", "Whenever you're ready to talk, I'm here.", "petals"), labels: { playAgain: "Read it again" } },
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.bouquet, P.coffee, P.sunset] },
  },
  {
    slug: "scratch-my-apology",
    name: "Scratch My Apology",
    occasion: "sorry",
    tone: "cute",
    theme: "sunset",
    ambient: "hearts",
    emoji: "🎟️",
    headline: "An apology, under the scratch card",
    blurb: "They scratch away the silver panel to find your apology (and a peace offering), then a deal they can't refuse and a proper sorry.",
    screens: (to, from) =>
      B.dress(B.SCRATCH_MY_APOLOGY, [
        intro(`${to}, special delivery`, `${from} hid something under this scratch card.`, "Show me"),
        scratch("Scratch for a surprise", "Scratch the silver panel", "I'm sorry. Dinner's on me."),
        { ...question("Deal?", "Deal", "No", "Yay! Booking the table now."), labels: { noLines: ["Dessert too?", "Fine, two desserts", "And I'll get the taxi", "Final offer…", "Pretty please?"] } },
        photos("Us, before I messed up"),
        message("I mean it", `Dinner's just the start. I'm sorry for what I did. You deserved better, and I'm going to do better.\n\n${from}`),
        finale("Thank you for forgiving me", "You're the best.", "hearts"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.coffee, P.friends, P.sunset] },
  },

  {
    slug: "hug-it-out",
    name: "Can We Hug It Out?",
    occasion: "sorry",
    tone: "cute",
    theme: "rose",
    ambient: "hearts",
    emoji: "🤗",
    headline: "Sorry. Hug?",
    blurb: "An apology with a runaway No button, a press-and-hold hug, a book of make-it-up-to-you coupons and a proper sorry.",
    screens: (to, from) =>
      B.dress(B.HUG_IT_OUT, [
        intro(`${to}, I'm sorry`, "I know I messed up. Please hear me out.", "Okay…"),
        {
          ...question("Can you forgive me?", "Yes, fine", "No", "Thank you. Really."),
          labels: { noLines: ["Hug first, then decide", "Please?", "I'm really sorry", "I'll put the kettle on", "Don't make me beg", "Okay, I'm begging"] },
        },
        game("hold-hug", "Then let's hug it out", "Press and hold to send a hug", "Hug received. All better?"),
        coupons("Making it up to you", "Redeem these whenever you like", [
          "I'll do the washing up for a week",
          "Your choice of takeaway",
          "I'll admit you were right",
          "One grovelling apology, on demand",
        ]),
        photos("Us, on a better day"),
        message("Properly sorry", `I hate it when we fall out. I'm sorry for my part in it, and I'm going to listen more and talk less.\n\nLove, ${from}`),
        finale("Hugs fix everything", `Sorry again. Love, ${from}`, "hearts"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.friends, P.teacup, P.sunset] },
  },

  // ---------- Thank you ----------
  {
    slug: "thank-you-so-much",
    name: "Thank You So Much",
    occasion: "thanks",
    tone: "heartfelt",
    theme: "ivory",
    ambient: "sparkles",
    emoji: "🙏",
    headline: "Thank you, truly",
    blurb: "A warm thank-you for teachers, friends, colleagues or anyone who went above and beyond: stars to catch, a jar of thank-yous, your photos and a heartfelt note.",
    featured: true,
    screens: (to, from) =>
      B.dress(B.THANK_YOU_SO_MUCH, [
        intro(`${to}, this is for you`, `${from} wanted to say something.`, "See what it is"),
        game("catch-stars", "A star for every kindness", "Catch the falling stars, one for every kind thing you did", "You're a star. Officially."),
        {
          ...reasons("Never forgotten", "Tap the jar", [
            "How patient you were",
            "The extra time you gave without being asked",
            "The way you made everyone feel welcome",
            "Your encouragement when it mattered most",
            "Every kind word",
          ]),
          labels: { jarCount: "Thank you {i} of {n}", jarEmpty: "And that's only the start." },
        },
        photos("Some good times"),
        message("Thank you", `Thank you for everything you've done. You went above and beyond, and it didn't go unnoticed. I'm so grateful.\n\n${from}`),
        finale("Thank you!", "You're one of the good ones.", "sparkles"),
      ]),
    demo: { to: "Ms Patel", from: "Class 4B", photos: [P.bouquet, P.coffee, P.balloons] },
  },
  {
    slug: "gallery-of-thanks",
    name: "Gallery of Thanks",
    occasion: "thanks",
    tone: "cute",
    layout: "wide",
    theme: "sunset",
    ambient: "sparkles",
    emoji: "🖼️",
    headline: "A whole wall of thank yous",
    blurb: "Built for a big screen: a gallery wall of up to six photos, a memory game, a gratitude meter and a big thank-you. Great for group cards.",
    screens: (to, from) =>
      B.dress(B.GALLERY_OF_THANKS, [
        intro(`Thank you, ${to}!`, `From ${from}. We made you a gallery.`, "Open the gallery"),
        photos(`The ${to} appreciation gallery`),
        game("memory-match", "A little game", "Find all the matching pairs", "Thank you for being a perfect match"),
        {
          ...slider("How grateful are we?", "Very", "Beyond words", "Off the scale. Thank you!"),
          labels: { sliderLines: ["Only that much?", "More than that…", "Much more…", "Nearly there…"] },
        },
        message("From all of us", `We couldn't have done it without you. Thank you for your time, your patience and your kindness.\n\n${from}`),
        finale("THANK YOU!", "You're appreciated more than you know.", "confetti"),
      ]),
    demo: { to: "Ms Patel", from: "Class 4B", photos: [P.bouquet, P.balloons, P.coffee, P.cake, P.sunset, P.grad] },
  },

  {
    slug: "thanks-a-bunch",
    name: "Thanks a Bunch",
    occasion: "thanks",
    tone: "heartfelt",
    theme: "mint",
    ambient: "petals",
    emoji: "🌷",
    headline: "I grew you a thank you",
    blurb: "They water a little plant until it blooms, pick a bouquet, see your photos and read your thank-you message. Lovely for teachers, nurses and neighbours.",
    screens: (to, from) =>
      B.dress(B.THANKS_A_BUNCH, [
        intro(`Thank you, ${to}`, `${from} planted something for you.`, "Let's see"),
        game("grow-flower", "Help it grow", "Water the plant until it blooms", "A thank you, in full bloom"),
        {
          ...boxes("Pick a bouquet", "Choose a box. Every one is for you.", ["Sunflowers, for sunny days", "Tulips, for your kindness", "Roses, for being wonderful"]),
          labels: { boxesPicked: "Your bouquet…" },
        },
        photos("Some blooming lovely memories"),
        message("Thank you", `What you did meant more than you know. Thank you for your kindness, your time and your patience.\n\nWith thanks, ${from}`),
        finale("Thanks a bunch!", "You're one in a million.", "petals"),
      ]),
    demo: { to: "Ms Patel", from: "Class 4B", photos: [P.bouquet, P.teacup, P.coffee] },
  },

  // ---------- Congrats ----------
  {
    slug: "you-did-it",
    name: "You Did It!",
    occasion: "congrats",
    tone: "festive",
    theme: "mint",
    ambient: "confetti",
    emoji: "🏆",
    headline: "You did it!",
    blurb: "For graduations, new jobs, passed exams and big wins. Pop the balloons, pick a prize, then fireworks.",
    featured: true,
    screens: (to, from) =>
      B.dress(B.YOU_DID_IT, [
        intro(`Congratulations, ${to}!`, `${from} is so proud of you.`, "Celebrate"),
        game("pop-balloons", "Victory balloons", "Pop 10 balloons to celebrate", "Woohoo!"),
        photos("Look at you go"),
        { ...boxes("Pick your prize", "You've earned one. Choose a box.", ["A celebration dinner", "Bragging rights for life", "A massive hug"]), labels: { boxesPicked: "You've won…" } },
        message("So proud of you", `All that hard work paid off. You deserve every bit of this.\n\nCongratulations!\n${from}`),
        { ...finale(`Congrats, ${to}!`, "This is only the beginning.", "fireworks"), labels: { playAgain: "Celebrate again" } },
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.grad, P.balloons, P.cake] },
  },
  {
    slug: "big-brain-energy",
    name: "Big Brain Energy",
    occasion: "congrats",
    tone: "funny",
    theme: "noel",
    ambient: "stars",
    emoji: "🤓",
    headline: "Are you a genius?",
    blurb: "Congratulations, with a side of teasing. A genius test, a star-catching game, your photos, a proper well done and confetti.",
    screens: (to, from) =>
      B.dress(B.BIG_BRAIN_ENERGY, [
        intro(`Well well well, ${to}`, `${from} heard the news.`, "What news?"),
        {
          ...question("Are you, in fact, a genius?", "Yes, I am", "No", "Correct. Humble too."),
          labels: { noLines: ["A genius would say yes", "Modesty detected", "Our records disagree", "Wrong, genius", "Think about it (you're clever)", "Even the dog says yes"] },
        },
        {
          ...quiz(
            "Genius test",
            [
              q("What's 2 + 2?", ["4", "22", "Fish"], 0),
              q("Who's the cleverest person here?", [to, from, "The dog"], 0),
            ],
            "Genius confirmed. We're all very impressed.",
          ),
          labels: { wrongLines: ["A genius? Really?", "Recalculating…", "Even the dog knew that.", "Hmm. Recount."], quizPerfect: "Full marks. Big brain confirmed." },
        },
        game("catch-stars", "Gold stars for you", "Catch 10 gold stars", "Gold stars all round"),
        photos("Exhibit A: the genius at work"),
        message("Jokes aside", `I'm genuinely so proud of you. You worked hard for this and you deserve every bit of it.\n\n${from}`),
        finale(`Congratulations, ${to}!`, "Don't let it go to your head (too late).", "confetti"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.grad, P.desk, P.coffee] },
  },
  {
    slug: "you-hit-the-jackpot",
    name: "You Hit the Jackpot",
    occasion: "congrats",
    tone: "funny",
    theme: "gold",
    ambient: "stars",
    emoji: "🎰",
    headline: "Winner winner!",
    blurb: "For promotions, new jobs and big wins. They pull a slot machine for the jackpot, try (and fail) to rate how proud you are, then see the winner, pictured.",
    screens: (to, from) =>
      B.dress(B.YOU_HIT_THE_JACKPOT, [
        intro(`Big news, ${to}!`, `${from} heard you've been winning at life.`, "Spin to win"),
        game("slot-machine", "Pull for the jackpot", "Pull the lever. Third time lucky?", "JACKPOT! Just like you"),
        {
          ...slider(`How proud is ${from} of you?`, "A bit", "Ridiculously", "Ridiculously proud. Officially."),
          labels: { sliderLines: ["A bit? Really?", "More than that…", "Way more…", "Off the charts…"] },
        },
        photos("The winner, pictured"),
        message("Congratulations!", `You worked so hard for this and you absolutely deserve it. Drinks are on you, though.\n\n${from}`),
        finale(`Congrats, ${to}!`, "Onwards and upwards.", "fireworks"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.toast, P.desk, P.balloons] },
  },
  // ---------- Halloween ----------
  {
    slug: "trick-or-treat",
    name: "Trick or Treat",
    occasion: "halloween",
    tone: "funny",
    theme: "spooky",
    ambient: "spooky",
    emoji: "🎃",
    headline: "Trick or treat?",
    blurb: "They try to pick 'trick' but the button runs away. Then they whack some ghosts, catch a bag of sweets and see your spookiest photos.",
    featured: true,
    screens: (to, from) =>
      B.dress(B.TRICK_OR_TREAT, [
        { ...intro(`Happy Halloween, ${to}`, `${from} is at your door. Knock knock.`, "Open the door…"), labels: { tapEnvelope: "Tap the envelope… if you dare" } },
        {
          ...question("Trick or treat?", "Treat", "Trick", "Good choice. Nobody wants my tricks."),
          labels: { noLines: ["Too scared?", "BOO!", "This button is haunted", "The ghosts say treat", "Nice try", "Treats only", "Spooky, isn't it?"] },
        },
        game("whack-ghosts", "Ghosts in the garden!", "Whack the ghosts before they get you", "The ghosts have fled"),
        game("catch-candy", "Fill your sweet bag", "Catch the falling sweets", "That's a lot of sugar", "game2"),
        photos("Our spookiest photos"),
        message("Happy Halloween", `Thanks for being my favourite partner in crime, on the spooky days and all the others.\n\n${from}`),
        { ...finale("Happy Halloween!", `Boo! Love, ${from}`, "spooky"), labels: { playAgain: "Haunt me again" } },
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.pumpkin, P.lights, P.friends] },
  },
  {
    slug: "boo-i-love-you",
    name: "Boo, I Love You",
    occasion: "halloween",
    tone: "cute",
    theme: "lavender",
    ambient: "spooky",
    emoji: "👻",
    headline: "You're my boo",
    blurb: "A cute Halloween card for your other half: a jar of reasons they're your boo, your spookiest photos, a ghost hunt and a soppy note.",
    screens: (to, from) =>
      B.dress(B.BOO_I_LOVE_YOU, [
        intro(`${to}, you're my boo`, `${from} has something spooky (and soppy) for you.`, "Eek, open it"),
        {
          ...reasons("Reasons you're my boo", "Tap the jar… if you dare", ["You hold my hand in scary films", "You eat all the sweets with me", "Your costume ideas", "You're cute even as a zombie", "You never ghost me"]),
          labels: { jarCount: "Spooky reason {i} of {n}", jarEmpty: "That's all of them… for now." },
        },
        photos("Our spookiest moments"),
        game("whack-ghosts", "Protect our house", "Whack the ghosts", "Our house is safe. My hero"),
        message("My favourite boo", `Scary films, too many sweets and me hiding behind a cushion. There's no one I'd rather be spooked with.\n\nLove, ${from}`),
        finale("Happy Halloween, boo", `Love, ${from} (your favourite ghoul)`, "spooky"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.pumpkin, P.lights, P.coffee] },
  },
  {
    slug: "haunted-house",
    name: "The Haunted House",
    occasion: "halloween",
    tone: "funny",
    layout: "wide",
    theme: "spooky",
    ambient: "spooky",
    emoji: "🏚️",
    headline: "Say the magic word to get in",
    blurb: "Built for a laptop. They type the magic word to enter the haunted house, see a creepy photo wall and fight off the ghosts.",
    screens: (to, from) =>
      B.dress(B.HAUNTED_HOUSE, [
        intro(`${to}, the haunted house awaits`, `${from} dares you to come inside.`, "Enter… if you dare"),
        {
          ...typeit("The door is locked", "Say the magic word. What does a ghost say? It starts with B.", "Boo", "The door creaks open…"),
          labels: { typeStart: "Type the magic word…", next: "Step inside" },
        },
        { ...photos("The portrait gallery"), labels: { next: "Go deeper…" } },
        { ...game("whack-ghosts", "Ghosts everywhere!", "Whack the ghosts to escape", "You escaped! Barely."), labels: { next: "Run!" } },
        message(
          "You made it out",
          `Happy Halloween! Thanks for being brave enough to come in, and for being the best person to hide behind when things go bump in the night.\n\n${from}`,
        ),
        finale("Happy Halloween!", `You survived. ${from} is impressed.`, "spooky"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.pumpkin, P.lights, P.fireworks, P.coffee, P.sunset, P.balloons] },
  },

  // ---------- New Year ----------
  {
    slug: "happy-new-year",
    name: "Happy New Year",
    occasion: "newyear",
    tone: "festive",
    theme: "midnight",
    ambient: "sparkles",
    emoji: "🥂",
    headline: "3, 2, 1… Happy New Year!",
    blurb: "They launch their own midnight fireworks, spin the wheel for a New Year's resolution (it's rigged), then look back at the year's best bits.",
    featured: true,
    screens: (to, from) =>
      B.dress(B.HAPPY_NEW_YEAR, [
        intro(`Happy New Year, ${to}!`, `${from} saved you a spot for the countdown.`, "Start the countdown"),
        game("launch-fireworks", "It's midnight!", "Tap the sky to launch 6 fireworks", "Happy New Year!"),
        {
          ...wheel(
            "Spin for your resolution",
            "Whatever it lands on, you have to do it",
            ["Drink more water", "Go to the gym", "Read more books", "Spend more time with me", "Learn to cook", "Sleep more"],
            "Great resolution. I'll hold you to it",
            3,
          ),
          labels: { spinAgain: "Spin again (it'll still be me)" },
        },
        photos("The best bits of this year"),
        message("Here's to the new year", `Thank you for being part of my year. Here's to more laughs, more adventures and fewer early mornings.\n\nCheers, ${from}`),
        finale("Happy New Year!", "Same again next year?", "fireworks"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.newyear, P.toast, P.friends] },
  },
  {
    slug: "year-in-review",
    name: "Our Year in Review",
    occasion: "newyear",
    tone: "heartfelt",
    theme: "sky",
    ambient: "sparkles",
    emoji: "📅",
    headline: "What a year it's been",
    blurb: "The best moments of the year, season by season, with your photos, a jar of highlights, a peek at next year's plan and a letter.",
    screens: (to, from) =>
      B.dress(B.YEAR_IN_REVIEW, [
        intro(`Happy New Year, ${to}`, `${from} looked back at the year. You're in all the best bits.`, "Let's look back"),
        timeline("Our year", [at("Winter", "Cosy nights in and too much hot chocolate"), at("Spring", "That trip we nearly didn't take"), at("Summer", "Sunburn, ice cream and long evenings"), at("Autumn", "Rainy walks and good films"), at("Now", "Ready for whatever comes next, with you")]),
        photos("Some highlights"),
        { ...reasons("Best bits of the year", "Tap the jar", ["Every time you made me laugh", "Our late-night chats", "You being there when it mattered", "All the food we ate"]), labels: { jarCount: "Highlight {i} of {n}" } },
        { ...scratch("Next year's plan", "Scratch the silver to see what's next", "More adventures, more laughs and more time with you."), labels: { scratchDone: "That's the plan!" } },
        message(
          "Thank you for this year",
          `Whatever this year threw at us, you made it better. Thank you for every laugh, every late night and every ordinary day that turned out to be the best bit.\n\n${from}`,
        ),
        finale("Happy New Year", "Here's to the next one.", "fireworks"),
      ]),
    demo: { to: "Olivia", from: "Sam", photos: [P.clock, P.newyear, P.toast] },
  },
  {
    slug: "pop-the-champagne",
    name: "Pop the Champagne",
    occasion: "newyear",
    tone: "festive",
    theme: "gold",
    ambient: "sparkles",
    emoji: "🍾",
    headline: "Shake it to pop the cork",
    blurb: "Made for a phone: they shake it like a bottle of bubbly until the cork pops at midnight, then spin to see what their year holds.",
    screens: (to, from) => [
      fizz(intro(`${to}, it's nearly midnight`, `${from} brought the bubbly. You're on cork duty.`, "Grab the bottle"), {
        background: ["#14100b", "#2e2416"], gradient: "glow", envelope: "#ecdcb6", burst: "sparkles", transition: "zoom",
        stickers: [stick("🍾", "tl", 13, "sway", -14), stick("🥂", "br", 12, "float", 8), stick("✨", "bl", 9, "pulse"), stick("🕛", "lt", 8, "none", -6)],
      }),
      fizz(game("shake-it", "Shake the bottle!", "Shake your phone to pop the cork", "POP! Happy New Year!"), {
        background: ["#1b150d", "#3b2c16"], gradient: "diagonal", pattern: "stripes", burst: "confetti", transition: "bounce",
        stickers: [stick("🍾", "bl", 12, "sway", 12), stick("✨", "tl", 9, "pulse"), stick("🎉", "br", 11, "bounce")],
      }, { shakeStart: "Shake the bottle", shaking: "Keep shaking… it's fizzing" }),
      fizz(wheel("Spin for your year ahead", "Give it a whirl. The bubbles never lie.", ["Lots of lie-ins", "A big adventure", "Good news", "More dancing", "Fewer emails", "Excellent snacks"], "It's written in the bubbles."), {
        background: ["#0e0c09", "#2b2216"], gradient: "glow", pattern: "dots", burst: "sparkles", transition: "zoom",
        stickers: [stick("🔮", "tl", 10, "pulse"), stick("🥂", "br", 11, "sway", -8), stick("✨", "bl", 9, "float")],
      }),
      fizz(photos("Raise a glass to these"), {
        background: ["#17120c", "#33281a"], gradient: "down", transition: "fade",
        stickers: [stick("🥂", "tl", 11, "sway", -10), stick("📸", "br", 10, "float", 8), stick("✨", "bl", 8, "pulse")],
      }),
      fizz(message("Cheers to you", `Here's to a year of good news, good food and good people, and to you, for making the last one better just by being in it.\n\nHappy New Year.\n${from}`), {
        background: ["#120f0a", "#2a2116"], gradient: "glow", transition: "fade",
        stickers: [stick("🥂", "bl", 11, "float", 6), stick("✨", "tl", 9, "pulse")],
      }),
      fizz(finale("Happy New Year!", "Mind the cork.", "fireworks"), {
        background: ["#0a0806", "#231b11"], gradient: "down", transition: "zoom",
        stickers: [stick("🎆", "tl", 12, "pulse"), stick("🍾", "br", 13, "sway", 10), stick("✨", "bl", 9, "float"), stick("🥂", "tc", 8, "sway", -8)],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.toast, P.newyear, P.lights] },
  },

  // ---------- Mother's Day ----------
  {
    slug: "for-the-best-mum",
    name: "For the Best Mum",
    occasion: "mothersday",
    tone: "heartfelt",
    theme: "rose",
    ambient: "petals",
    emoji: "💐",
    headline: "I grew you a flower, Mum",
    blurb: "She waters a little plant until it blooms, pulls what she taught you from a jar, reads your message and sees your photos together. Have tissues ready.",
    featured: true,
    screens: (to, from) => [
      bloom(intro(`Happy Mother's Day, ${to}`, `${from} grew you something. It just needs a little water.`, "Grab the watering can"), {
        background: ["#fdf1f2", "#f7d9de"], gradient: "glow", envelope: "#ecc3cb", burst: "petals", transition: "fade",
        stickers: [stick("🌷", "tl", 12, "sway", -10), stick("💐", "br", 13, "float", 6), stick("🌸", "bl", 10, "spin")],
      }),
      bloom(game("grow-flower", "Help it bloom", "Water the plant until it flowers", "Just like you helped me grow"), {
        background: ["#f3f8f0", "#dcead5"], gradient: "glow", burst: "petals", transition: "rise",
        stickers: [stick("🌱", "bl", 11, "sway"), stick("🦋", "tl", 10, "float", -12), stick("🌷", "br", 11, "sway", 8)],
      }),
      bloom(reasons("What you taught me", "Tap the jar for each one", ["To always say thank you", "That a cup of tea fixes most things", "How to stand up for myself", "To be kind, even when it's hard", "That home is wherever you are"]), {
        background: ["#fdf4f4", "#f6dde1"], gradient: "down", pattern: "dots", burst: "hearts", transition: "blur",
        stickers: [stick("💗", "tl", 10, "pulse"), stick("☕", "bl", 10, "float", -6), stick("🌸", "br", 11, "spin")],
      }, { jarCount: "Lesson {i} of {n}", jarEmpty: "And so much more." }),
      bloom(message("Thank you, Mum", `For every packed lunch, every lift, every worried phone call and every hug. I know I don't say it enough, so here it is: thank you, and I love you.\n\n${from}`), {
        background: ["#fffaf7", "#f6e6e3"], gradient: "down", transition: "fade",
        stickers: [stick("💐", "bl", 11, "float"), stick("🌸", "tl", 9, "sway", 10)],
      }),
      bloom(photos("Us through the years"), {
        background: ["#fbecee", "#f1d2d8"], gradient: "diagonal", transition: "rise",
        stickers: [stick("🌷", "tl", 10, "sway", -8), stick("💗", "br", 10, "pulse"), stick("📸", "bl", 9, "float")],
      }),
      bloom(finale(`Happy Mother's Day, ${to}`, "You're the best. Officially.", "petals"), {
        background: ["#f9dfe4", "#f0c4cd"], gradient: "glow", transition: "zoom",
        stickers: [stick("💐", "tl", 12, "float", -6), stick("🌷", "bl", 11, "sway"), stick("🌸", "br", 11, "spin"), stick("💗", "tc", 8, "pulse")],
      }),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.mum, P.summer, P.cake] },
  },
  {
    slug: "mums-coupon-book",
    name: "Mum's Coupon Book",
    occasion: "mothersday",
    tone: "cute",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🎟️",
    headline: "Coupons for Mum",
    blurb: "A book of coupons she can cash in all year, a big hug she has to press and hold to receive, your photos and the real present: a proper thank you.",
    screens: (to, from) => [
      lilac(intro(`Happy Mother's Day, ${to}!`, `${from} has finally got you a useful present.`, "About time"), {
        background: ["#f6f1fb", "#e6dbf3"], gradient: "glow", envelope: "#d2bcec", burst: "hearts", transition: "drop",
        stickers: [stick("🎟️", "tl", 12, "sway", -14), stick("💜", "br", 11, "pulse"), stick("🎀", "bl", 11, "float", 8)],
      }),
      lilac(coupons("Your coupon book", "Tap to redeem. No take-backs.", ["A cup of tea in bed", "I'll tidy my room (really)", "One day of no arguing", "A phone call, every week", "I'll cook dinner", "You pick the film"]), {
        background: ["#fbf8fe", "#ece3f7"], gradient: "down", pattern: "dots", transition: "slide",
        stickers: [stick("✂️", "tl", 10, "sway", -20), stick("🎟️", "bl", 10, "float", 10), stick("💜", "br", 9, "pulse")],
      }, { coupon: "Mum coupon", couponTap: "Tap to cash in", couponDone: "Cashed in ✓", couponClaim: "Screenshot this and wave it at me" }),
      lilac(game("hold-hug", "And one big hug", "Press and hold to send it", "Hug delivered"), {
        background: ["#f0e6fa", "#dccbf0"], gradient: "glow", burst: "hearts", transition: "zoom",
        stickers: [stick("🤗", "bl", 11, "bounce"), stick("💜", "br", 10, "pulse"), stick("✨", "tl", 8, "float")],
      }),
      lilac(photos("Mum and me"), {
        background: ["#f4eefb", "#e2d5f2"], gradient: "diagonal", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("💜", "br", 10, "pulse"), stick("🎀", "bl", 9, "sway")],
      }),
      lilac(message("The real present", `The coupons are a joke (mostly). The truth is, nothing I could give you comes close to everything you've given me.\n\nThank you for being my mum. I love you.\n\n${from}`), {
        background: ["#fdfbff", "#efe7f8"], gradient: "down", transition: "fade",
        stickers: [stick("☕", "bl", 10, "float"), stick("💐", "tl", 10, "sway", -8)],
      }),
      lilac(finale("Love you, Mum", `Coupons valid forever. Love, ${from}`, "hearts"), {
        background: ["#e9dcf6", "#d5c1ee"], gradient: "glow", transition: "zoom",
        stickers: [stick("🎟️", "tl", 11, "sway", -10), stick("💜", "bl", 10, "pulse"), stick("🎀", "br", 12, "float", 8)],
      }),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.mum, P.teacup, P.summer] },
  },
  {
    slug: "who-is-mums-favourite",
    name: "Who's Mum's Favourite?",
    occasion: "mothersday",
    tone: "funny",
    theme: "sunset",
    ambient: "petals",
    emoji: "👑",
    headline: "Settle it once and for all",
    blurb: "A quiz with only one right answer (you), a slider that only goes up, the evidence in photos and a loving finale.",
    screens: (to, from) => [
      crown(intro(`Happy Mother's Day, ${to}`, `${from} needs you to answer some questions. Honestly.`, "Uh oh"), {
        background: ["#fff1e6", "#ffd6bf"], gradient: "glow", envelope: "#f3c969", burst: "stars", transition: "drop",
        stickers: [stick("👑", "tl", 13, "sway", -15), stick("🤨", "br", 11, "bounce"), stick("💐", "bl", 10, "float", 6)],
      }),
      crown(quiz("The favourite child quiz", [q("Who is your favourite child?", ["I love you all equally", "No comment", from], 2), q("Who calls you the most?", [from, "Not the others", "Both of those"], 2), q("Who made you this card?", ["Someone else", from, "A stranger"], 1)], "Confirmed: you have a favourite. It's me."), {
        background: ["#fff6ee", "#ffe2cf"], gradient: "down", pattern: "checks", burst: "confetti", transition: "slide",
        stickers: [stick("🏆", "bl", 11, "bounce"), stick("👑", "br", 11, "sway", 12), stick("❓", "tl", 9, "pulse", -10)],
      }, {
        wrongLines: ["Mum! Really?", "I'll pretend I didn't see that", "Try again. Carefully.", "The others put you up to this", "Wrong, but I still love you"],
        quizPerfect: "Full marks. You've always known.",
      }),
      crown(slider(`How much do you love ${from}?`, "A normal amount", "The most", "Exactly as I thought"), {
        background: ["#ffe7d8", "#ffcab0"], gradient: "diagonal", burst: "hearts", transition: "bounce",
        stickers: [stick("💯", "tl", 10, "pulse", -8), stick("💖", "br", 11, "float")],
      }, { sliderLines: ["Mum. Be honest…", "Getting warmer…", "That's more like it.", "Nearly there…"] }),
      crown(photos("Exhibit A: the favourite"), {
        background: ["#fff3ea", "#ffdcc8"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("👑", "br", 11, "sway", 10), stick("🥇", "bl", 10, "bounce")],
      }),
      crown(message("Jokes aside", `Thank you for everything, Mum. For the lifts, the dinners, the advice I ignored and later took, and for loving all of us more than we deserve. Even the others.\n\n${from}`), {
        background: ["#fffaf5", "#fde8da"], gradient: "down", transition: "fade",
        stickers: [stick("💐", "bl", 11, "float"), stick("💛", "tl", 9, "pulse")],
      }),
      crown(finale(`Happy Mother's Day!`, "Don't tell the others.", "petals"), {
        background: ["#ffd8c0", "#ffb995"], gradient: "glow", transition: "zoom",
        stickers: [stick("👑", "tl", 12, "sway", -12), stick("🤫", "br", 12, "bounce"), stick("🥇", "bl", 10, "float")],
      }),
    ],
    demo: { to: "Mum", from: "Ravi", photos: [P.mum, P.cake, P.summer] },
  },

  // ---------- Father's Day ----------
  {
    slug: "dad-joke-quiz",
    name: "The Dad Joke Quiz",
    occasion: "fathersday",
    tone: "funny",
    theme: "sky",
    ambient: "stars",
    emoji: "🤓",
    headline: "Why did the dad cross the road?",
    blurb: "A quiz of terrible dad jokes, a slider that won't let you call his jokes unfunny, three mystery presents (all ties) and, jokes aside, a proper thank you.",
    featured: true,
    screens: (to, from) => [
      groan(intro(`Happy Father's Day, ${to}!`, `${from} has prepared a test of your dad jokes.`, "Hi test, I'm Dad"), {
        background: ["#e6f1ff", "#c4dcf8"], gradient: "glow", envelope: "#fff8e7", burst: "stars", transition: "bounce",
        stickers: [stick("🤓", "tl", 13, "bounce", -8), stick("👔", "br", 12, "sway", 10), stick("😂", "bl", 10, "float")],
      }),
      groan(quiz("Dad joke quiz", [q("What do you call a fake noodle?", ["A spaghetto", "An impasta", "A fusilli-fake"], 1), q("Why don't eggs tell jokes?", ["They'd crack up", "They're shy", "Too yolky"], 0), q("What's Dad's favourite thing to say?", ["Ask your mother", "I'm not a taxi", "All of the above"], 2)], "You passed. Unfortunately."), {
        background: ["#f0f7ff", "#d6e7fb"], gradient: "down", pattern: "dots", burst: "confetti", transition: "slide",
        stickers: [stick("🥁", "bl", 11, "bounce"), stick("🤓", "br", 10, "sway"), stick("❓", "tl", 9, "pulse", -10)],
      }, {
        wrongLines: ["Wrong. Groan.", "Ba-dum… no.", "Not even a pun", "That answer's worse than his jokes", "Try again, champ"],
        quizPerfect: "Full marks. Dad would be proud. Ish.",
      }),
      groan(slider("How funny are Dad's jokes?", "Not at all", "Hilarious", "Hilarious. We all agree."), {
        background: ["#fff4e0", "#ffe0b5"], gradient: "diagonal", burst: "stars", transition: "bounce",
        stickers: [stick("😂", "tl", 11, "bounce"), stick("🙄", "br", 11, "sway")],
      }, { sliderLines: ["Be kind, he's sensitive…", "Getting warmer…", "That's more like it.", "Nearly at Dad level…"] }),
      groan(boxes("Pick your present", "Go on, choose one", ["A tie", "Another tie", "A tie (different colour)"]), {
        background: ["#eaf4ff", "#cfe3fb"], gradient: "glow", pattern: "grid", burst: "confetti", transition: "zoom",
        stickers: [stick("👔", "tl", 11, "sway", -12), stick("🎁", "bl", 10, "bounce"), stick("👔", "br", 11, "sway", 14)],
      }, { boxesPicked: "Drumroll please…" }),
      groan(photos("Dad's greatest hits"), {
        background: ["#f0f7ff", "#d6e7fb"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🏆", "br", 11, "bounce"), stick("😎", "bl", 10, "sway")],
      }),
      groan(message("Jokes aside, Dad", `Thank you for every lift, every bit of advice and every terrible joke told just to make me groan. They worked, by the way. Every single one.\n\nLove, ${from}`), {
        background: ["#fbfdff", "#e4effc"], gradient: "down", transition: "fade",
        stickers: [stick("💙", "bl", 10, "pulse"), stick("☕", "tl", 10, "float", -6)],
      }),
      groan(finale(`Happy Father's Day!`, "Please never stop the jokes.", "confetti"), {
        background: ["#cfe3fb", "#a9cbf3"], gradient: "glow", transition: "zoom",
        stickers: [stick("🤓", "tl", 12, "bounce"), stick("😂", "bl", 11, "float"), stick("👔", "br", 12, "sway", 10), stick("🥁", "tc", 8, "bounce")],
      }),
    ],
    demo: { to: "Dad", from: "Ravi", photos: [P.dad, P.summer, P.coffee] },
  },
  {
    slug: "best-dad-ever",
    name: "Best Dad Ever",
    occasion: "fathersday",
    tone: "heartfelt",
    theme: "mint",
    ambient: "stars",
    emoji: "🏆",
    headline: "Thanks for everything, Dad",
    blurb: "Growing up with Dad, moment by moment, the things he gave you pulled from a jar, your photos, a proper thank you and an award he scratches to reveal.",
    screens: (to, from) => [
      oak(intro(`Happy Father's Day, ${to}`, `${from} has a few things to say.`, "Let's hear it"), {
        background: ["#f1f6ef", "#d9e8d6"], gradient: "glow", envelope: "#dcc49a", burst: "stars", transition: "fade",
        stickers: [stick("🏆", "tl", 12, "sway", -10), stick("💚", "br", 11, "pulse"), stick("🌳", "bl", 11, "sway")],
      }),
      oak(timeline("Growing up with you", [at("Little me", "You taught me to ride a bike (and caught me every time)"), at("School years", "Every lift, every football match, every bad joke"), at("Growing up", "You let me make my own mistakes, then helped me fix them"), at("Now", "Still the first person I call")]), {
        background: ["#f5f9f3", "#e1ecdc"], gradient: "down", transition: "slide",
        stickers: [stick("🚲", "bl", 11, "sway"), stick("⭐", "tl", 9, "pulse")],
      }),
      oak(reasons("Things I got from you", "Tap the jar for each one", ["My sense of humour (sorry, everyone)", "Never leaving a job half done", "Knowing it'll all be fine in the end", "How to look after the people I love", "My stubborn streak. Thanks for that."]), {
        background: ["#eef5ec", "#d3e5cf"], gradient: "diagonal", pattern: "dots", burst: "sparkles", transition: "blur",
        stickers: [stick("🔧", "tl", 10, "sway", -20), stick("☕", "bl", 10, "float"), stick("💚", "br", 10, "pulse")],
      }, { jarCount: "Thing #{i} of {n}", jarEmpty: "And plenty more where those came from." }),
      oak(photos("Me and my dad"), {
        background: ["#f1f6ef", "#d9e8d6"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🌳", "br", 11, "sway")],
      }),
      oak(message("Thank you, Dad", `You've always been there. I don't say it enough, but I'm so grateful you're my dad.\n\n${from}`), {
        background: ["#fbfcf8", "#e8f0e3"], gradient: "down", transition: "fade",
        stickers: [stick("💚", "bl", 10, "pulse"), stick("✉️", "tl", 10, "float", -8)],
      }),
      oak(scratch("And the award goes to…", "Scratch the silver panel to see who won", "World's Best Dad. Again."), {
        background: ["#fbf3dc", "#efd9a0"], gradient: "glow", text: "#3a2a0c", accent: "#7f5400", burst: "stars", transition: "zoom",
        stickers: [stick("🏆", "tl", 12, "bounce"), stick("🎖️", "br", 11, "sway", 10), stick("✨", "bl", 9, "pulse")],
      }),
      oak(finale(`Happy Father's Day, ${to}`, "Officially certified. No recount.", "stars"), {
        background: ["#dcebd8", "#bcd7b6"], gradient: "glow", transition: "zoom",
        stickers: [stick("🏆", "tl", 12, "sway", -8), stick("💚", "bl", 10, "pulse"), stick("🎖️", "br", 11, "float")],
      }),
    ],
    demo: { to: "Dad", from: "Ravi", photos: [P.dad, P.summer, P.grad] },
  },
  {
    slug: "dads-hall-of-fame",
    name: "Dad's Hall of Fame",
    occasion: "fathersday",
    tone: "festive",
    layout: "wide",
    theme: "gold",
    ambient: "stars",
    emoji: "🖼️",
    headline: "A gallery of greatness",
    blurb: "Built for a big screen. A wall of photos celebrating Dad, a memory game, a password only he'd know and a note in the visitors' book.",
    screens: (to, from) => [
      gallery(intro(`Welcome to ${to}'s Hall of Fame`, `Curated by ${from}. Admission is free.`, "Enter the gallery"), {
        background: ["#1a1714", "#2e2721"], gradient: "glow", envelope: "#efe4cc", burst: "sparkles", transition: "fade",
        stickers: [stick("🏛️", "tl", 12, "none"), stick("🖼️", "bl", 11, "sway", -6), stick("🎟️", "br", 11, "float", 12)],
      }, { gotMail: "Now open" }),
      gallery(photos("The Hall of Fame"), {
        background: ["#2a1416", "#3e1f22"], gradient: "down", transition: "slide",
        stickers: [stick("🖼️", "tl", 9, "sway", -6), stick("🏆", "br", 10, "float")],
      }, { next: "On to the next room" }),
      gallery(game("memory-match", "Dad's memory test", "Find all the matching pairs", "Sharp as ever, Dad"), {
        background: ["#1d1a16", "#2c2620"], gradient: "down", pattern: "grid", burst: "stars", transition: "zoom",
        stickers: [stick("🎖️", "bl", 10, "sway"), stick("👑", "br", 10, "float", 10), stick("✨", "tl", 8, "pulse")],
      }),
      gallery(typeit("One last thing", "Type what you say whenever someone leaves the door open", "Were you born in a barn", "Classic."), {
        background: ["#14231d", "#20372d"], gradient: "glow", burst: "confetti", transition: "flip",
        stickers: [stick("🔐", "tl", 10, "sway", -8), stick("🗝️", "br", 11, "float", 20), stick("✨", "bl", 8, "pulse")],
      }, { typeHint: "Need a hint, Dad?" }),
      gallery(message("From the visitors' book", `What an exhibition. Years of hard work, bad jokes and quiet kindness, all under one roof.\n\nThank you for everything, Dad. You're the best thing in the building.\n\n${from}`), {
        background: ["#1d1915", "#2e2822"], gradient: "glow", transition: "fade",
        stickers: [stick("🖋️", "tl", 10, "sway", -12), stick("📖", "bl", 10, "float")],
      }),
      gallery(finale("Happy Father's Day!", "The gallery is now closed. The love isn't.", "fireworks"), {
        background: ["#0f0d0b", "#26201a"], gradient: "glow", transition: "zoom",
        stickers: [stick("🏆", "tl", 12, "bounce"), stick("🖼️", "bl", 11, "sway", -6), stick("👑", "br", 12, "float", 8)],
      }),
    ],
    demo: { to: "Dad", from: "Ravi", photos: [P.dad, P.summer, P.grad, P.coffee, P.cake, P.balloons] },
  },

  // ---------- Raksha Bandhan ----------
  {
    slug: "rakhi-promise",
    name: "The Rakhi Promise",
    occasion: "rakhi",
    tone: "festive",
    theme: "marigold",
    ambient: "sparkles",
    emoji: "🎀",
    headline: "Will you always protect me?",
    blurb: "A Raksha Bandhan card where 'No' isn't an option, a book of gift coupons they owe you, your photos together and a promise of your own.",
    featured: true,
    screens: (to, from) => [
      thread(intro(`Happy Raksha Bandhan, ${to}`, `${from} tied a rakhi on your wrist. Now there's a question.`, "Uh oh"), {
        background: ["#4a0e26", "#6e1838"], gradient: "glow", pattern: "dots", envelope: "#f28cb1", burst: "sparkles", transition: "zoom",
        stickers: [stick("🎀", "tl", 13, "sway", -12), stick("🪔", "bl", 11, "pulse"), stick("🌼", "br", 12, "spin"), stick("✨", "lb", 8, "float")],
      }),
      thread(question("Will you always protect me?", "Always", "No", "Promise made. No backing out."), {
        background: ["#5c0b3b", "#80124f"], gradient: "diagonal", burst: "petals", transition: "bounce",
        stickers: [stick("🎀", "bl", 11, "sway", 10), stick("✨", "tl", 9, "pulse"), stick("🌼", "br", 11, "spin")],
      }, { noLines: ["Rakhi says otherwise", "You're tied in now", "No take-backs", "Think of the mithai", "Nice try", "Just press Always"] }),
      thread(coupons("Rakhi gifts you owe me", "Tap to redeem. You have no choice.", ["One unlimited shopping trip", "Takeaway, your treat", "You take my side in every argument", "A lifetime of lifts"]), {
        background: ["#4a0e26", "#6e1838"], gradient: "down", pattern: "dots", transition: "slide",
        stickers: [stick("🎁", "tl", 10, "bounce", -8), stick("🍬", "br", 10, "sway", 20)],
      }, { coupon: "Rakhi gift" }),
      thread(photos("Us, growing up"), {
        background: ["#5a1d06", "#7e3008"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🌼", "br", 11, "spin"), stick("🎀", "bl", 9, "sway")],
      }),
      thread(message("My promise to you", `You've had my back for as long as I can remember, and I'll always have yours.\n\nThank you for being my protector, my partner in crime and my very first friend.\n\n${from}`), {
        background: ["#3f0b20", "#5c1430"], gradient: "glow", transition: "fade",
        stickers: [stick("🪔", "bl", 11, "pulse"), stick("✨", "tl", 9, "float")],
      }),
      thread(finale("Happy Raksha Bandhan", `Love you (don't let it go to your head). ${from}`, "sparkles"), {
        background: ["#6e1838", "#9c2650"], gradient: "glow", transition: "zoom",
        stickers: [stick("🎀", "tl", 12, "sway", -10), stick("🪔", "bl", 11, "pulse"), stick("🌼", "br", 12, "spin"), stick("✨", "tc", 8, "float")],
      }),
    ],
    demo: { to: "Arjun", from: "Olivia", photos: [P.rakhi, P.summer, P.cake] },
  },
  {
    slug: "sibling-rivalry",
    name: "Sibling Rivalry",
    occasion: "rakhi",
    tone: "funny",
    theme: "sunset",
    ambient: "confetti",
    emoji: "🥊",
    headline: "Who's the favourite?",
    blurb: "A quiz to settle who Mum loves most (it's you, obviously), a slot machine for your rakhi gift, the photo evidence and a lot of love.",
    screens: (to, from) => [
      bout(intro(`Happy Rakhi, ${to}!`, `${from} wants to settle some things once and for all.`, "Bring it on"), {
        background: ["#fff6d6", "#ffe58f"], gradient: "glow", pattern: "stripes", envelope: "#3b6fd4", burst: "stars", transition: "bounce",
        stickers: [stick("🥊", "tl", 13, "bounce", -20), stick("🥊", "br", 13, "bounce", 20), stick("🔔", "bl", 10, "sway")],
      }),
      bout(quiz("The sibling quiz", [q("Who's Mum's favourite?", [to, from, "The dog"], 1), q("Who started every fight?", [to, from, "Definitely not me"], 0), q("Who's the best sibling?", [from, `Also ${from}`, `Still ${from}`], 2)], "The results are in. I win."), {
        background: ["#fff0eb", "#ffd0c4"], gradient: "down", pattern: "checks", burst: "confetti", transition: "slide",
        stickers: [stick("🏆", "bl", 11, "bounce"), stick("😤", "tl", 10, "pulse"), stick("🥊", "br", 11, "sway", 18)],
      }, {
        wrongLines: ["Wrong. Typical.", "I'm telling Mum", "Lies. All lies.", "Classic you", "Try again, if you dare"],
        quizPerfect: "Full marks. I still win, though.",
      }),
      bout(game("slot-machine", "Spin for my rakhi gift", "Pull the lever to see what you're buying me", "Jackpot! You owe me big"), {
        background: ["#eef3ff", "#cddcff"], gradient: "diagonal", burst: "fireworks", transition: "zoom",
        stickers: [stick("🎰", "tl", 11, "bounce"), stick("💸", "br", 11, "float", 10), stick("🍕", "bl", 10, "sway", -14)],
      }, { slotWin: "Pay up!" }),
      bout(photos("Exhibit A: who started it"), {
        background: ["#fff6d6", "#ffe58f"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🙄", "br", 11, "sway"), stick("🥊", "bl", 9, "bounce", -16)],
      }),
      bout(message("But seriously", `You're annoying and you steal my food, but I wouldn't swap you for anything.\n\nHappy Raksha Bandhan.\n${from}`), {
        background: ["#fffbea", "#fff0bf"], gradient: "down", transition: "fade",
        stickers: [stick("💛", "bl", 10, "pulse"), stick("🤝", "tl", 10, "float")],
      }),
      bout(finale("Happy Raksha Bandhan!", "Now where's my present?", "confetti"), {
        background: ["#ffe58f", "#ffcf3f"], gradient: "glow", transition: "zoom",
        stickers: [stick("🥊", "tl", 12, "bounce", -16), stick("🏆", "bl", 11, "float"), stick("🎁", "br", 12, "sway", 10)],
      }),
    ],
    demo: { to: "Arjun", from: "Olivia", photos: [P.rakhi, P.cake, P.summer] },
  },

  // ---------- Holi ----------
  {
    slug: "happy-holi",
    name: "Happy Holi",
    occasion: "holi",
    tone: "festive",
    theme: "holi",
    ambient: "colours",
    emoji: "🌈",
    headline: "Throw some colour!",
    blurb: "They splash colour all over the screen with their finger, pull a wish for every colour from a jar, then see your Holi photos and wishes. No stains guaranteed.",
    featured: true,
    screens: (to, from) => [
      gulal(intro(`Happy Holi, ${to}!`, `${from} brought the colours. Ready?`, "Let's play"), {
        background: ["#ffe9f2", "#ffd3e6"], gradient: "glow", pattern: "dots", envelope: "#ffe57a", burst: "colours", transition: "bounce",
        stickers: [stick("🌈", "tl", 13, "float", -8), stick("🎨", "br", 12, "sway", 10), stick("💛", "bl", 10, "pulse"), stick("💚", "lb", 8, "float")],
      }),
      gulal(game("throw-colours", "Throw the colours!", "Tap to splash 12 colours", "Holi hai!"), {
        background: ["#fff8dc", "#ffeaa6"], gradient: "down", burst: "colours", transition: "zoom",
        stickers: [stick("💦", "tl", 10, "bounce"), stick("🎨", "bl", 11, "sway", -10), stick("💙", "br", 10, "pulse")],
      }),
      gulal(reasons("A colour for every wish", "Tap the jar for each colour", ["Pink, for love and laughter", "Yellow, for sunny days", "Green, for fresh starts", "Blue, for calm when you need it", "Orange, for energy (and second helpings)", "Purple, for a little magic"]), {
        background: ["#e7f8ef", "#c9eedb"], gradient: "glow", pattern: "dots", burst: "colours", transition: "bounce",
        stickers: [stick("💚", "tl", 10, "pulse"), stick("💜", "br", 10, "float"), stick("🌸", "bl", 11, "spin")],
      }, { jarCount: "Colour {i} of {n}", jarEmpty: "Every colour, just for you." }),
      gulal(photos("Colourful memories"), {
        background: ["#e8efff", "#cfdcff"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🌈", "br", 11, "sway")],
      }),
      gulal(message("Holi wishes", `May this year bring you as much colour as today: more laughter, more good food and more time with the people you love.\n\nHappy Holi!\n${from}`), {
        background: ["#f4ecff", "#e3d3fb"], gradient: "down", transition: "fade",
        stickers: [stick("💜", "bl", 10, "pulse"), stick("🌸", "tl", 10, "spin")],
      }),
      gulal(finale("Happy Holi!", "Here's to a colourful year ahead.", "colours"), {
        background: ["#ffd3e6", "#fff1b8", "#c9eedb"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("🌈", "tl", 12, "float"), stick("🎨", "bl", 11, "sway", -8), stick("💦", "br", 11, "bounce"), stick("💛", "tc", 8, "pulse")],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.holi, P.summer, P.balloons] },
  },
  {
    slug: "holi-hai",
    name: "Holi Hai!",
    occasion: "holi",
    tone: "funny",
    theme: "holi",
    ambient: "colours",
    emoji: "🎨",
    headline: "You're getting coloured either way",
    blurb: "They try to say no to Holi (the button runs away), throw colours at the screen, spin for their colour and, once it washes off, get a proper Holi wish.",
    screens: (to, from) => [
      splash(intro(`${to}, it's Holi!`, `${from} has a bucket of colour and isn't afraid to use it.`, "Oh no"), {
        background: ["#4d0b35", "#7a1553"], gradient: "glow", envelope: "#3fc6d8", burst: "colours", transition: "bounce",
        stickers: [stick("🎨", "tl", 13, "sway", -12), stick("💦", "br", 12, "bounce"), stick("😈", "bl", 11, "float"), stick("💛", "lt", 8, "pulse")],
      }),
      splash(question("Ready to get colourful?", "Yes!", "No", "You never had a choice"), {
        background: ["#1f1452", "#33207a"], gradient: "diagonal", pattern: "zigzag", burst: "colours", transition: "zoom",
        stickers: [stick("🙈", "tl", 10, "sway"), stick("💦", "bl", 11, "bounce"), stick("🎯", "br", 11, "spin")],
      }, { noLines: ["You're already pink", "Bura na mano!", "Colours have spoken", "No escape on Holi", "You're green now", "Just press yes"] }),
      splash(game("throw-colours", "Your turn!", "Tap to throw 12 colours", "Look at the state of you"), {
        background: ["#08423f", "#0d625c"], gradient: "down", burst: "colours", transition: "bounce",
        stickers: [stick("💦", "tl", 10, "bounce"), stick("🎨", "br", 11, "sway", 10), stick("🌈", "bl", 10, "float")],
      }),
      splash(wheel("Spin for your colour", "This is the colour you're wearing all day", ["Pink", "Yellow", "Green", "Blue", "Orange", "Purple"], "Looks great on you!"), {
        background: ["#5a1f04", "#8a3507"], gradient: "glow", pattern: "zigzag", burst: "colours", transition: "zoom",
        stickers: [stick("🌈", "tl", 10, "float"), stick("🎨", "bl", 10, "sway", -8), stick("🤞", "br", 11, "bounce")],
      }),
      splash(photos("The colourful evidence"), {
        background: ["#3a0f5c", "#56187f"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("💦", "br", 11, "bounce"), stick("😂", "bl", 10, "sway")],
      }),
      splash(message("Once the colour washes off", `Here's what stays: I'm so glad you're in my life. Wishing you a year full of laughter, sweets and good people.\n\nHappy Holi!\n${from}`), {
        background: ["#2a0f3f", "#43175f"], gradient: "glow", transition: "fade",
        stickers: [stick("💜", "bl", 10, "pulse"), stick("🌸", "tl", 10, "spin")],
      }),
      splash(finale("Happy Holi!", "Bura na mano, Holi hai!", "colours"), {
        background: ["#4d0b35", "#2b1a6e", "#08423f"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("🎨", "tl", 12, "sway", -10), stick("🌈", "bl", 11, "float"), stick("💦", "br", 12, "bounce"), stick("😂", "tc", 8, "bounce")],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.holi, P.balloons, P.friends] },
  },

  // ---------- New baby ----------
  {
    slug: "welcome-little-one",
    name: "Welcome, Little One",
    occasion: "newbaby",
    tone: "heartfelt",
    theme: "baby",
    ambient: "bubbles",
    emoji: "👶",
    headline: "Welcome to the world",
    blurb: "For new parents: a soft lullaby, wishes for the baby pulled from a jar, stars to catch for sweet dreams and a warm welcome message.",
    featured: true,
    screens: (to, from) => [
      lullaby(intro(`Congratulations, ${to}!`, `${from} is so happy for you.`, "Say hello"), {
        background: ["#eef4fb", "#d9e6f5"], gradient: "glow", envelope: "#fbefc4", burst: "bubbles", transition: "fade",
        stickers: [stick("🧸", "tl", 12, "sway", -8), stick("🍼", "br", 11, "float", 12), stick("☁️", "bl", 11, "float")],
      }, { gotMail: "Special delivery" }),
      lullaby(reasons("Wishes for the little one", "Tap the jar for each wish", ["Lots of cuddles", "Sweet dreams (for everyone)", "A lifetime of adventures", "Laughter every single day", "To be as loved as you are"]), {
        background: ["#fbf7ee", "#f1e7d2"], gradient: "down", pattern: "dots", burst: "stars", transition: "blur",
        stickers: [stick("⭐", "tl", 9, "pulse"), stick("🎈", "br", 11, "float", 8), stick("🍼", "bl", 10, "sway")],
      }, { jarCount: "Wish {i} of {n}", jarEmpty: "Every wish, sent with love." }),
      lullaby(game("catch-stars", "Catch some sweet dreams", "Catch 10 falling stars for the little one", "Sweet dreams, little one"), {
        background: ["#1b2645", "#2d3b66"], gradient: "glow", text: "#f3f1ea", accent: "#f4d58d", burst: "stars", transition: "fade",
        stickers: [stick("🌙", "tl", 11, "sway", -10), stick("⭐", "bl", 9, "pulse"), stick("☁️", "br", 11, "float")],
      }),
      lullaby(photos("The newest arrival"), {
        background: ["#eef4fb", "#d9e6f5"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🧸", "br", 11, "sway")],
      }),
      lullaby(message("Welcome to the world", `What wonderful news. Your little one is so lucky to have you. Enjoy every moment (and get some sleep when you can).\n\nWith love, ${from}`), {
        background: ["#f7f9fd", "#e3ebf6"], gradient: "down", transition: "fade",
        stickers: [stick("☁️", "tl", 10, "float"), stick("🤍", "bl", 9, "pulse")],
      }),
      lullaby(finale("Welcome, little one", "The world just got a little sweeter.", "bubbles"), {
        background: ["#dfe9f6", "#c3d5ee"], gradient: "glow", transition: "zoom",
        stickers: [stick("🌙", "tl", 11, "sway", -8), stick("🧸", "bl", 11, "float"), stick("⭐", "br", 10, "pulse"), stick("☁️", "tc", 8, "float")],
      }),
    ],
    demo: { to: "Olivia & Sam", from: "Auntie Meera", photos: [P.baby, P.bouquet, P.balloons] },
  },
  {
    slug: "scratch-to-reveal-baby",
    name: "Boy or Girl? Scratch to Reveal",
    occasion: "newbaby",
    tone: "cute",
    theme: "baby",
    ambient: "balloons",
    emoji: "🎀",
    headline: "Scratch to reveal: boy or girl?",
    blurb: "Made for a phone: a gender reveal they scratch off with a finger. Guess first, then scratch to find out. You type the big news yourself.",
    screens: (to, from) => [
      reveal(intro(`${to}, we have news!`, `${from} can finally tell you…`, "Tell me!"), {
        background: ["#ffe4ee", "#dde9ff"], gradient: "diagonal", envelope: "#c4ecd6", burst: "balloons", transition: "drop",
        stickers: [stick("🎈", "tl", 12, "float", -8), stick("❓", "br", 11, "bounce", 10), stick("🍼", "bl", 10, "sway")],
      }),
      reveal(boxes("Take a guess first", "Boy or girl? Pick a box", ["Boy?", "Girl?", "No idea!"]), {
        background: ["#f4efff", "#e2d9fb"], gradient: "down", pattern: "dots", burst: "sparkles", transition: "bounce",
        stickers: [stick("🤔", "tl", 10, "sway"), stick("💗", "bl", 10, "pulse"), stick("💙", "br", 10, "pulse")],
      }, { boxesPicked: "Your guess…" }),
      reveal(scratch("Scratch to reveal", "Rub the silver panel with your finger", BLANK.surprise), {
        background: ["#dde9ff", "#ffe4ee"], gradient: "diagonal", burst: "balloons", transition: "zoom",
        stickers: [stick("🎉", "bl", 11, "bounce"), stick("🎈", "br", 12, "float", 8), stick("✨", "tl", 9, "pulse")],
      }),
      reveal(photos("Our little one so far"), {
        background: ["#f7f3ff", "#e6defb"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("👣", "br", 10, "sway")],
      }),
      reveal(message("We can't wait", `We can't wait for you to meet our little one. They're already so lucky to have you in their life.\n\nLove, ${from}`), {
        background: ["#fffafc", "#f1ebfb"], gradient: "down", transition: "fade",
        stickers: [stick("🍼", "tl", 10, "sway", -8), stick("🤍", "bl", 9, "pulse")],
      }),
      reveal(finale("Now you know!", "Get ready for lots of cuddles.", "balloons"), {
        background: ["#ffd9e7", "#e7dcff", "#d4e3ff"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("🎈", "tl", 12, "float", -8), stick("🍼", "bl", 10, "sway"), stick("🎉", "br", 12, "bounce"), stick("💗", "tc", 8, "pulse")],
      }),
    ],
    demo: { to: "Mum & Dad", from: "Olivia & Sam", photos: [P.baby, P.balloons, P.bouquet] },
  },
  {
    slug: "big-news",
    name: "We Have Big News",
    occasion: "newbaby",
    tone: "cute",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🍼",
    headline: "Scratch to find out our news",
    blurb: "Made for a phone: announce a pregnancy with a scratch card, then share their first look at the baby. Perfect for telling grandparents-to-be.",
    screens: (to, from) => [
      hush(intro(`${to}, sit down`, `${from} has some news. Big news.`, "What is it?!"), {
        background: ["#f5f0fc", "#e5dbf5"], gradient: "glow", envelope: "#f1dca6", burst: "sparkles", transition: "fade",
        stickers: [stick("🤫", "tl", 12, "bounce"), stick("🎁", "br", 11, "sway", 10), stick("✨", "bl", 9, "pulse")],
      }),
      hush(question("Ready for the news?", "Yes, tell me!", "No", "Okay, here goes…"), {
        background: ["#f8f4fd", "#ebe2f7"], gradient: "down", burst: "sparkles", transition: "zoom",
        stickers: [stick("🙈", "tl", 10, "sway"), stick("😮", "br", 11, "bounce"), stick("✨", "bl", 9, "pulse")],
      }, { noLines: ["It's coming anyway", "Sit down first", "Trust me on this", "You'll love it", "Just press yes"] }),
      hush(scratch("Scratch to find out", "Rub the silver panel with your finger", "We're having a baby!"), {
        background: ["#fbf4e2", "#f2e2b8"], gradient: "glow", burst: "hearts", transition: "bounce",
        stickers: [stick("🍼", "tl", 11, "sway", -10), stick("👣", "bl", 10, "float"), stick("🤍", "br", 10, "pulse")],
      }, { scratchDone: "You heard it here first!" }),
      hush(photos("Your first look at our little one"), {
        background: ["#f5f0fc", "#e5dbf5"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("👣", "br", 10, "sway")],
      }),
      hush(message("Surprise!", `Our little one is on the way, and we couldn't wait to tell you. You're one of the very first to know.\n\nLove, ${from}`), {
        background: ["#fdfbff", "#efe8f8"], gradient: "down", transition: "fade",
        stickers: [stick("🤍", "bl", 10, "pulse"), stick("💌", "tl", 10, "float", -8)],
      }),
      hush(finale("Baby on board!", "Start practising the lullabies.", "hearts"), {
        background: ["#e9def7", "#d4c3ef"], gradient: "glow", transition: "zoom",
        stickers: [stick("🍼", "tl", 11, "sway", -8), stick("🧸", "bl", 11, "float"), stick("✨", "br", 10, "pulse"), stick("👣", "tc", 8, "float")],
      }),
    ],
    demo: { to: "Mum & Dad", from: "Olivia & Sam", photos: [P.baby, P.bouquet, P.balloons] },
  },

  // ---------- Wedding ----------
  {
    slug: "will-you-marry-me",
    name: "Will You Marry Me?",
    occasion: "wedding",
    tone: "romantic",
    theme: "ivory",
    ambient: "sparkles",
    emoji: "💍",
    headline: "The big question",
    blurb: "A proposal they'll never forget: your story so far, your photos, every reason it's them, then the question. The No button runs away, of course.",
    featured: true,
    screens: (to, from) => [
      candle(intro(`${to}, I have something to ask you`, "Find somewhere quiet. This one's important.", "I'm ready"), {
        background: ["#fcf8f0", "#f1e6d0"], gradient: "glow", envelope: "#e9c3b8", burst: "sparkles", transition: "fade",
        stickers: [stick("💍", "tl", 12, "pulse"), stick("🕯️", "bl", 11, "sway"), stick("🌹", "br", 12, "float", 10)],
      }, { gotMail: "For your eyes only" }),
      candle(timeline("Our story so far", [at("The day we met", "I knew you were special"), at("Our first date", "I didn't want it to end"), at("Every day since", "You've made my life better"), at("Today", "I want forever with you")]), {
        background: ["#fdfaf3", "#f3eadb"], gradient: "down", transition: "slide",
        stickers: [stick("✨", "tl", 9, "pulse"), stick("🌹", "bl", 11, "sway", -10)],
      }),
      candle(photos("Us"), {
        background: ["#fbf1ec", "#f2dcd2"], gradient: "down", transition: "fade",
        stickers: [stick("🤍", "tl", 10, "pulse"), stick("🌹", "br", 11, "float", 8)],
      }),
      candle(reasons("Why it's you", "Tap the jar for each reason", ["You make me laugh until I can't breathe", "You make the ordinary feel like an adventure", "You're kind to everyone, even when no one's looking", "I'm the best version of me when I'm with you", "I can't imagine a single day without you"]), {
        background: ["#fcf8f0", "#f1e6d0"], gradient: "glow", burst: "hearts", transition: "blur",
        stickers: [stick("💌", "tl", 10, "float", -8), stick("🕯️", "br", 11, "sway"), stick("✨", "bl", 9, "pulse")],
      }, { jarCount: "Reason {i} of {n}", jarEmpty: "And a million more." }),
      candle(message("Before I ask…", `${to},\n\nFrom the very start, you've been my favourite person. You make me braver, kinder and so much happier, and I don't want to spend a single day without you.\n\nSo I have one question.\n\n${from}`), {
        background: ["#fffdf8", "#f5ecdc"], gradient: "down", transition: "fade", tune: { speed: 0.8 },
        stickers: [stick("🕯️", "bl", 11, "sway"), stick("🌹", "tl", 10, "float", -8)],
      }),
      candle(question(`${to}, will you marry me?`, "YES!", "No", "You said yes!!!"), {
        background: ["#1c1714", "#3a2c20"], gradient: "glow", text: "#f6ecd7", accent: "#d8b26a", burst: "fireworks", transition: "zoom",
        stickers: [stick("💍", "tl", 12, "pulse"), stick("🕯️", "bl", 11, "sway"), stick("🕯️", "br", 11, "sway", 4)],
      }, { noLines: ["Are you sure?", "My knee's killing me", "Look at the ring", "Think about it", "Please?", "One answer only"] }),
      candle(finale("We're getting married!", `I love you. ${from}`, "fireworks"), {
        background: ["#1a1512", "#302419"], gradient: "glow", text: "#f6ecd7", accent: "#d8b26a", transition: "zoom",
        stickers: [stick("💍", "tl", 12, "pulse"), stick("🥂", "bl", 11, "sway", -8), stick("✨", "br", 10, "float"), stick("🌹", "tc", 8, "float")],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.rings, P.sunset, P.coffee] },
  },
  {
    slug: "to-the-happy-couple",
    name: "To the Happy Couple",
    occasion: "wedding",
    tone: "festive",
    theme: "ivory",
    ambient: "petals",
    emoji: "🥂",
    headline: "Congratulations, you two!",
    blurb: "For wedding guests: a toast to the happy couple, their photos, a quiz about the big day, a wheel of marriage advice and a shower of confetti.",
    screens: (to, from) => [
      garden(intro(`Congratulations, ${to}!`, `${from} raises a glass to you both.`, "Cheers!"), {
        background: ["#fdf2ef", "#f6dcd4"], gradient: "glow", envelope: "#cfdfc6", burst: "petals", transition: "fade",
        stickers: [stick("🥂", "tl", 12, "sway", -10), stick("💐", "bl", 11, "float"), stick("🎊", "br", 12, "bounce")],
      }),
      garden(photos("The happy couple"), {
        background: ["#f2f6ef", "#dde8d6"], gradient: "down", transition: "slide",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("💒", "br", 11, "sway")],
      }),
      garden(quiz("Wedding quiz", [q("Who cried first at the ceremony?", ["One of you two", "The parents", "Everyone"], 2), q("What's the secret to a happy marriage?", ["Separate duvets", "Always saying sorry", "Both"], 2)], "Correct! You'll be fine"), {
        background: ["#fdf6f3", "#f8e2db"], gradient: "down", pattern: "dots", burst: "petals", transition: "slide",
        stickers: [stick("💍", "tl", 10, "pulse"), stick("🍰", "bl", 11, "sway"), stick("🎉", "br", 10, "bounce")],
      }),
      garden(wheel("Spin for some marriage advice", "Whatever it lands on, it's the law", ["Talk it out", "Share the chips", "Kitchen dancing", "Say sorry first", "Two remotes", "Laugh every day"], "Wise words. Frame them."), {
        background: ["#f2f6ef", "#dde8d6"], gradient: "glow", burst: "confetti", transition: "zoom",
        stickers: [stick("🔔", "tl", 10, "sway", -12), stick("🎉", "br", 11, "bounce"), stick("💐", "bl", 10, "float")],
      }),
      garden(message("Wishing you both", `Wishing you a lifetime of love, laughter and someone to share the last slice of cake with. Congratulations!\n\n${from}`), {
        background: ["#fffcf8", "#f3ece2"], gradient: "down", transition: "fade",
        stickers: [stick("💌", "tl", 10, "float", -8), stick("🤍", "bl", 9, "pulse")],
      }),
      garden(finale("Congratulations!", "To love and laughter.", "confetti"), {
        background: ["#f6dcd4", "#dde8d6"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("🥂", "tl", 12, "sway", -10), stick("🎊", "bl", 11, "bounce"), stick("💐", "br", 12, "float"), stick("🍾", "tc", 8, "sway")],
      }),
    ],
    demo: { to: "Olivia & Sam", from: "Meera", photos: [P.rings, P.toast, P.bouquet] },
  },
  {
    slug: "be-my-bridesmaid",
    name: "Will You Be My Bridesmaid?",
    occasion: "wedding",
    tone: "cute",
    theme: "rose",
    ambient: "petals",
    emoji: "👰",
    headline: "Will you be my bridesmaid?",
    blurb: "Ask your best friend to be a bridesmaid (No runs away), with a book of bridesmaid perks to sweeten the deal and a few words on why it had to be them.",
    screens: (to, from) => [
      blush(intro(`${to}, I need you`, `${from} has a very important question.`, "What is it?"), {
        background: ["#fff0f3", "#fbd6df"], gradient: "glow", envelope: "#efd9b0", burst: "petals", transition: "drop",
        stickers: [stick("👰", "tl", 12, "sway", -8), stick("🎀", "br", 12, "float", 10), stick("💐", "bl", 11, "sway")],
      }),
      blush(question("Will you be my bridesmaid?", "Of course!", "No", "YAY! I couldn't do it without you"), {
        background: ["#fff5f7", "#fde0e7"], gradient: "down", pattern: "dots", burst: "hearts", transition: "zoom",
        stickers: [stick("💍", "tl", 10, "pulse"), stick("🥺", "br", 11, "bounce"), stick("🎀", "bl", 10, "sway", -10)],
      }, { noLines: ["The dress is lovely", "There's prosecco", "I'll cry", "Please?", "Think of the cake", "Not taking no"] }),
      blush(coupons("Your bridesmaid perks", "Tap to redeem", ["Unlimited prosecco on the day", "First pick of the cake", "A spa day before the wedding", "I'll owe you forever"]), {
        background: ["#fff0f3", "#fbd6df"], gradient: "diagonal", transition: "slide",
        stickers: [stick("🥂", "tl", 10, "sway", -10), stick("💅", "bl", 10, "float"), stick("🍰", "br", 10, "bounce")],
      }, { coupon: "VIP perk" }),
      blush(photos("Us, before the big day"), {
        background: ["#fff5f7", "#fde0e7"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("💖", "br", 10, "pulse")],
      }),
      blush(message("Why it had to be you", `I can't imagine the big day without you by my side. You've been there for every big moment so far, and this one wouldn't be the same without you.\n\nThank you for saying yes (you did say yes).\n\n${from}`), {
        background: ["#fffafb", "#fbe8ec"], gradient: "down", transition: "fade",
        stickers: [stick("💌", "tl", 10, "float", -8), stick("💐", "bl", 10, "sway")],
      }),
      blush(finale("It's official!", `Love you! ${from}`, "petals"), {
        background: ["#fbd6df", "#f5b8c8"], gradient: "glow", transition: "zoom",
        stickers: [stick("👰", "tl", 12, "sway", -8), stick("🎀", "bl", 11, "float"), stick("💖", "br", 11, "pulse"), stick("🥂", "tc", 8, "sway")],
      }),
    ],
    demo: { to: "Meera", from: "Olivia", photos: [P.friends, P.bouquet, P.sunset] },
  },

  // ---------- Get well ----------
  {
    slug: "get-well-soon",
    name: "Get Well Soon",
    occasion: "getwell",
    tone: "cute",
    theme: "sky",
    ambient: "bubbles",
    emoji: "🌻",
    headline: "Sending you a big hug",
    blurb: "A hug they can press and hold, some prescriptions from 'Dr You', a few photos to make them smile and a warm get-well-soon message.",
    featured: true,
    screens: (to, from) => [
      sunny(intro(`Get well soon, ${to}`, `${from} is sending you something to make you feel better.`, "Make me feel better"), {
        background: ["#fffbe6", "#ffefb3"], gradient: "glow", envelope: "#e6f0fc", burst: "sparkles", transition: "fade",
        stickers: [stick("🌻", "tl", 13, "sway", -8), stick("🧸", "br", 12, "float"), stick("☀️", "bl", 10, "spin")],
      }),
      sunny(game("hold-hug", "Here's a hug", "Press and hold to receive it", "Hug delivered. Feeling better?"), {
        background: ["#eef6ff", "#d6e8fd"], gradient: "glow", burst: "hearts", transition: "zoom",
        stickers: [stick("🤗", "bl", 11, "bounce"), stick("💛", "br", 10, "pulse"), stick("🌻", "tl", 9, "sway")],
      }),
      sunny(coupons("Your prescriptions", "Doctor's orders. Tap to redeem.", ["Unlimited naps", "Soup delivered to your door", "One full day of bad TV", "Ice cream, as needed"]), {
        background: ["#f6fbff", "#e2effd"], gradient: "down", pattern: "grid", transition: "slide",
        stickers: [stick("🩹", "tl", 10, "sway", -25), stick("🍲", "bl", 10, "float"), stick("🍦", "br", 10, "bounce")],
      }, { coupon: "Prescription", couponTap: "Tap to take", couponDone: "Taken ✓", couponClaim: "Doctor's orders: screenshot this" }),
      sunny(photos("Something to make you smile"), {
        background: ["#fffbe6", "#ffefb3"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🌻", "br", 11, "sway")],
      }),
      sunny(message("Get well soon", `Rest up, drink lots of tea and let everyone look after you for once. You look after everyone else, so it's your turn.\n\nMissing you lots, and here whenever you need anything.\n\n${from}`), {
        background: ["#fffef8", "#fff3cc"], gradient: "down", transition: "fade",
        stickers: [stick("🍵", "bl", 10, "float"), stick("🌻", "tl", 10, "sway", -8)],
      }),
      sunny(finale("Get well soon!", "Back on your feet in no time.", "bubbles"), {
        background: ["#ffefb3", "#d6e8fd"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("🌻", "tl", 12, "sway", -8), stick("☀️", "bl", 10, "spin"), stick("🧸", "br", 12, "float"), stick("💛", "tc", 8, "pulse")],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.teacup, P.bouquet, P.summer] },
  },
  {
    slug: "pop-the-boredom",
    name: "Pop the Boredom",
    occasion: "getwell",
    tone: "funny",
    theme: "sunset",
    ambient: "bubbles",
    emoji: "🫧",
    headline: "Bubble wrap for the sofa",
    blurb: "Made for a phone: a sheet of bubble wrap to pop in bed, a slot machine, a few photos and a cheeky get-well-soon message.",
    screens: (to, from) => [
      arcade(intro(`${to}, stuck in bed?`, `${from} sent you something to do.`, "Finally"), {
        background: ["#e8fbf7", "#c6f0e8"], gradient: "glow", envelope: "#ffe3ee", burst: "bubbles", transition: "bounce",
        stickers: [stick("🛋️", "tl", 12, "sway", -6), stick("📺", "br", 12, "bounce"), stick("🍿", "bl", 10, "float")],
      }),
      arcade(game("bubble-wrap", "Pop the bubble wrap", "Pop every single bubble", "So satisfying. Feeling better already?"), {
        background: ["#f0fdfa", "#d4f5ee"], gradient: "down", pattern: "dots", burst: "bubbles", transition: "zoom",
        stickers: [stick("🤒", "tl", 10, "sway"), stick("😌", "br", 11, "float"), stick("✨", "bl", 8, "pulse")],
      }),
      arcade(game("slot-machine", "Bonus round", "Pull the lever for a jackpot", "Jackpot! Your prize: getting better soon", "game2"), {
        background: ["#1a1035", "#2e1b5c"], gradient: "glow", text: "#f4f0ff", accent: "#ff6fa5", burst: "fireworks", transition: "flip",
        stickers: [stick("🎰", "tl", 11, "bounce"), stick("🍒", "bl", 10, "sway"), stick("⭐", "br", 10, "pulse")],
      }),
      arcade(photos("Proof you're more fun when you're well"), {
        background: ["#e8fbf7", "#c6f0e8"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("😎", "br", 11, "bounce")],
      }),
      arcade(message("Get well soon", `Hurry up and get better. Everything's boring without you, and nobody laughs at my jokes like you do.\n\nRest, eat something nice and let people fuss over you. I'll be here.\n\n${from}`), {
        background: ["#f7fefc", "#ddf6f0"], gradient: "down", transition: "fade",
        stickers: [stick("💌", "tl", 10, "float", -8), stick("🍦", "bl", 10, "sway")],
      }),
      arcade(finale("Get well soon!", "Doctor's orders: more naps.", "bubbles"), {
        background: ["#c6f0e8", "#ffd6e6"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("😴", "tl", 12, "float"), stick("🛌", "bl", 11, "sway"), stick("🍿", "br", 11, "bounce"), stick("💤", "tc", 8, "float")],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.friends, P.teacup, P.summer] },
  },

  // ---------- Miss you ----------
  {
    slug: "long-distance-hug",
    name: "A Long-Distance Hug",
    occasion: "missyou",
    tone: "heartfelt",
    theme: "lavender",
    ambient: "hearts",
    emoji: "🫶",
    headline: "Miles apart, still close",
    blurb: "For long distance: a hug they press and hold, a jar of things you miss about them, your photos together and a letter across the miles.",
    featured: true,
    screens: (to, from) => [
      dusk(intro(`I miss you, ${to}`, `${from} is sending a hug all the way to you.`, "Bring it in"), {
        background: ["#f3effa", "#e1d8f2"], gradient: "glow", envelope: "#f9d9b8", burst: "hearts", transition: "fade",
        stickers: [stick("✈️", "tl", 12, "float", 15), stick("🌍", "bl", 11, "spin"), stick("💌", "br", 12, "sway", 8)],
      }, { gotMail: "Sent across the miles" }),
      dusk(game("hold-hug", "Here's a hug", "Press and hold. It's coming a long way.", "Hug delivered. Can you feel it?"), {
        background: ["#2a2350", "#3d3170"], gradient: "glow", text: "#f3eefe", accent: "#f6c58f", burst: "hearts", transition: "zoom",
        stickers: [stick("🤗", "bl", 11, "bounce"), stick("💜", "br", 10, "pulse"), stick("✨", "tl", 8, "float")],
      }, { hugHolding: "Keep holding… it's on its way", hugLetGo: "Don't let go yet!" }),
      dusk(reasons("Things I miss about you", "Tap the jar", ["Your laugh", "Your terrible jokes", "Our late-night chats", "Just being in the same room", "Your hugs (the real ones)"]), {
        background: ["#f6f2fc", "#e7def5"], gradient: "down", burst: "hearts", transition: "blur",
        stickers: [stick("💭", "tl", 10, "float"), stick("💜", "br", 10, "pulse"), stick("📞", "bl", 10, "sway", -10)],
      }, { jarCount: "Thing {i} of {n}" }),
      dusk(photos("Until next time"), {
        background: ["#f3effa", "#e1d8f2"], gradient: "diagonal", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🌙", "br", 10, "sway")],
      }),
      dusk(message("Across the miles", `However far apart we are, you're never far from my thoughts. Every call and every message in between makes the miles feel a little smaller.\n\nI can't wait to see you.\n\n${from}`), {
        background: ["#231d45", "#352b63"], gradient: "glow", text: "#f3eefe", accent: "#f6c58f", transition: "fade",
        stickers: [stick("🌙", "tl", 10, "sway", -10), stick("✨", "bl", 8, "pulse")],
      }),
      dusk(finale("Not long now", `See you soon. Love, ${from}`, "hearts"), {
        background: ["#3d3170", "#5f4590"], gradient: "diagonal", text: "#f3eefe", accent: "#f6c58f", transition: "zoom",
        stickers: [stick("✈️", "tl", 12, "float", 15), stick("💜", "bl", 10, "pulse"), stick("🌍", "br", 11, "spin")],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.sunset, P.coffee, P.lights] },
  },
  {
    slug: "counting-the-days",
    name: "Counting the Days",
    occasion: "missyou",
    tone: "cute",
    theme: "midnight",
    ambient: "stars",
    emoji: "✈️",
    headline: "When I see you next…",
    blurb: "A slider for how much you miss them (it only goes up), boarding passes for everything you'll do when you're together again, and your photos to tide them over.",
    screens: (to, from) => [
      flight(intro(`${to}, I'm counting the days`, `${from} misses you. A lot.`, "How much?"), {
        background: ["#0f1633", "#1d2a55"], gradient: "glow", envelope: "#f3ead6", burst: "stars", transition: "drop",
        stickers: [stick("✈️", "tl", 12, "float", 20), stick("🌙", "bl", 11, "sway"), stick("📅", "br", 11, "bounce", 8)],
      }),
      flight(slider("How much do I miss you?", "A little bit", "Too much", "Way too much. Come back"), {
        background: ["#111a3d", "#24336a"], gradient: "down", burst: "stars", transition: "slide",
        stickers: [stick("💫", "tl", 10, "spin"), stick("✈️", "br", 11, "float", 20), stick("🧳", "bl", 10, "sway")],
      }, { sliderLines: ["A little bit…", "More than that…", "Much more than that…", "Nearly there…"] }),
      flight(coupons("When I see you next", "Tap to redeem when we're together", ["The biggest hug at arrivals", "Your favourite dinner", "A whole day of doing nothing together", "No phones, just us"]), {
        background: ["#0b2233", "#143f5a"], gradient: "down", pattern: "grid", transition: "slide",
        stickers: [stick("🛫", "tl", 10, "float"), stick("🧳", "bl", 10, "sway", -8), stick("🌍", "br", 10, "spin")],
      }, { coupon: "Boarding pass", couponTap: "Tap to check in", couponDone: "Checked in ✓", couponClaim: "Keep this for arrivals" }),
      flight(photos("Until then, these will have to do"), {
        background: ["#0f1633", "#1d2a55"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("⭐", "br", 9, "pulse")],
      }),
      flight(message("Until I see you", `Every day without you feels a bit too long, but each one brings me closer to seeing you again.\n\nI'm counting them all, and I'll be the one at arrivals grinning from ear to ear.\n\n${from}`), {
        background: ["#0d1430", "#1b264d"], gradient: "glow", transition: "fade",
        stickers: [stick("🌙", "tl", 10, "sway", -10), stick("✨", "bl", 8, "pulse")],
      }),
      flight(finale("See you soon", `Counting down, ${from}`, "stars"), {
        background: ["#1d2a55", "#3a3f7a"], gradient: "glow", transition: "zoom",
        stickers: [stick("✈️", "tl", 12, "float", 20), stick("🌙", "bl", 11, "sway"), stick("⭐", "br", 10, "pulse"), stick("🧳", "tc", 8, "sway")],
      }),
    ],
    demo: { to: "Olivia", from: "Sam", photos: [P.sunset, P.coffee, P.clock] },
  },

  // ---------- Best friends ----------
  {
    slug: "bestie-quiz",
    name: "The Bestie Quiz",
    occasion: "friendship",
    tone: "funny",
    theme: "party",
    ambient: "confetti",
    emoji: "👯",
    headline: "Are you really my best friend?",
    blurb: "A quiz to prove they're your bestie, a slider rating how good a friend you are (it only goes up), your best photos and a bit of real talk.",
    featured: true,
    screens: (to, from) => [
      zine(intro(`${to}, it's time`, `${from} needs to know if you're a real best friend.`, "Easy"), {
        background: ["#fff8d6", "#ffeb99"], gradient: "glow", pattern: "zigzag", envelope: "#ffd1e3", burst: "confetti", transition: "bounce",
        stickers: [stick("👯", "tl", 12, "bounce"), stick("💅", "br", 11, "sway", 10), stick("😎", "bl", 11, "float")],
      }),
      zine(quiz("The bestie test", [q(`What's ${from}'s go-to takeaway?`, ["Pizza", "Curry", "Whatever you're having"], 2), q("Who's the funny one?", [to, from, "Neither of us, honestly"], 1), q("Best friends forever?", ["Yes", "Obviously", "Do I have a choice?"], 1)], "Certified best friend. No refunds."), {
        background: ["#ffe6f0", "#ffc9de"], gradient: "down", pattern: "checks", burst: "confetti", transition: "slide",
        stickers: [stick("🤔", "tl", 10, "sway"), stick("💯", "br", 11, "pulse"), stick("👀", "bl", 10, "bounce")],
      }, {
        wrongLines: ["Excuse me?!", "We're not speaking now", "Who even are you?", "I'm telling everyone", "Wow. Okay."],
        quizPerfect: "Full marks. Bestie status confirmed.",
      }),
      zine(slider(`How good a friend is ${from}?`, "Just okay", "The best", "Correct. The best."), {
        background: ["#fff8d6", "#ffe27a"], gradient: "diagonal", burst: "stars", transition: "bounce",
        stickers: [stick("🏆", "tl", 10, "bounce"), stick("💖", "br", 11, "pulse")],
      }, { sliderLines: ["Rude…", "Getting warmer…", "That's more like it.", "Nearly there…"] }),
      zine(photos("Exhibit A: we're iconic"), {
        background: ["#ffe6f0", "#ffc9de"], gradient: "glow", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("✨", "br", 9, "pulse"), stick("😂", "bl", 10, "bounce")],
      }),
      zine(message("Real talk", `Jokes aside, I don't know what I'd do without you. You're the first person I tell everything to, and the one who makes even the worst days funny.\n\nThank you for being you.\n\n${from}`), {
        background: ["#fffcee", "#fff2c2"], gradient: "down", transition: "fade",
        stickers: [stick("💛", "bl", 10, "pulse"), stick("💌", "tl", 10, "float", -8)],
      }),
      zine(finale("Besties forever", `Love you, ${from}`, "confetti"), {
        background: ["#ffc9de", "#ffeb99"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("👯", "tl", 12, "bounce"), stick("🎉", "bl", 11, "float"), stick("💖", "br", 11, "pulse"), stick("😎", "tc", 8, "sway")],
      }),
    ],
    demo: { to: "Meera", from: "Olivia", photos: [P.friends, P.summer, P.coffee] },
  },
  {
    slug: "friendship-coupons",
    name: "Friendship Coupons",
    occasion: "friendship",
    tone: "cute",
    theme: "mint",
    ambient: "sparkles",
    emoji: "🎟️",
    headline: "Coupons for my best friend",
    blurb: "A book of best-friend coupons (2am chats, emergency snacks), a mystery box they get to pick, your photos and a note that needs no coupon.",
    screens: (to, from) => [
      ticket(intro(`For my best friend, ${to}`, `${from} got you something. You're welcome.`, "Ooh"), {
        background: ["#effaf4", "#d3f0e0"], gradient: "glow", envelope: "#ffd2b8", burst: "sparkles", transition: "drop",
        stickers: [stick("🎟️", "tl", 12, "sway", -14), stick("💚", "br", 11, "pulse"), stick("🍩", "bl", 11, "spin")],
      }),
      ticket(coupons("Bestie coupons", "Redeem whenever you need me", ["One 2am chat, no questions asked", "Emergency snacks, delivered", "I'll be your plus-one", "One brutally honest outfit check"]), {
        background: ["#f6fdf9", "#dcf3e6"], gradient: "down", pattern: "dots", transition: "slide",
        stickers: [stick("✂️", "tl", 10, "sway", -20), stick("🍕", "bl", 10, "float", 10), stick("🎟️", "br", 10, "sway", 12)],
      }, { coupon: "Bestie coupon" }),
      ticket(boxes("Pick a box", "One of these is your real present", ["A hug", "Another hug", "Me, forever"]), {
        background: ["#fff2ea", "#ffdcc9"], gradient: "glow", burst: "sparkles", transition: "zoom",
        stickers: [stick("🎁", "tl", 11, "bounce"), stick("🤭", "br", 11, "sway"), stick("💚", "bl", 9, "pulse")],
      }, { boxesPicked: "Your real present…" }),
      ticket(photos("Proof we're the best duo"), {
        background: ["#effaf4", "#d3f0e0"], gradient: "diagonal", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("😎", "br", 11, "bounce")],
      }),
      ticket(message("No coupon needed", `You don't need a coupon for any of this, really. I'll always be there, 2am or not.\n\nThank you for being the best friend anyone could ask for.\n\n${from}`), {
        background: ["#fbfefc", "#e6f6ed"], gradient: "down", transition: "fade",
        stickers: [stick("💌", "tl", 10, "float", -8), stick("💚", "bl", 9, "pulse")],
      }),
      ticket(finale("Best friends forever", `Love, ${from}`, "sparkles"), {
        background: ["#d3f0e0", "#ffdcc9"], gradient: "diagonal", transition: "zoom",
        stickers: [stick("🎟️", "tl", 11, "sway", -12), stick("🎉", "bl", 11, "bounce"), stick("💚", "br", 10, "pulse"), stick("🍩", "tc", 8, "spin")],
      }),
    ],
    demo: { to: "Meera", from: "Olivia", photos: [P.friends, P.coffee, P.summer] },
  },
  {
    slug: "friendship-gallery",
    name: "The Friendship Gallery",
    occasion: "friendship",
    tone: "heartfelt",
    layout: "wide",
    theme: "sunset",
    ambient: "sparkles",
    emoji: "🖼️",
    headline: "Our friendship, framed",
    blurb: "Built for a big screen: a wall of your best photos, your friendship story, a memory game, a jar of reasons and the words you don't say enough.",
    screens: (to, from) => [
      golden(intro(`${to}, welcome to our gallery`, `Curated by ${from}. Mostly embarrassing photos.`, "Step inside"), {
        background: ["#fff4ea", "#fbdcc4"], gradient: "glow", envelope: "#f7d27e", burst: "sparkles", transition: "fade",
        stickers: [stick("🖼️", "tl", 12, "sway", -6), stick("🌅", "bl", 11, "float"), stick("📸", "br", 11, "bounce", 10)],
      }, { gotMail: "Private view" }),
      golden(photos("The friendship gallery"), {
        background: ["#2b1a14", "#3f271d"], gradient: "glow", text: "#fbeee2", accent: "#f0a46c", transition: "slide",
        stickers: [stick("🖼️", "tl", 9, "sway", -6), stick("✨", "br", 9, "pulse")],
      }),
      golden(timeline("How it happened", [at("Day one", "We met and just clicked"), at("The early days", "Inside jokes nobody else gets"), at("The hard times", "You were always there"), at("Now", "Still my favourite person to text")]), {
        background: ["#fff8f1", "#f8e4d2"], gradient: "down", transition: "slide",
        stickers: [stick("🌟", "tl", 9, "pulse"), stick("💛", "bl", 10, "float")],
      }),
      golden(game("memory-match", "A little game", "Find all the matching pairs", "We make a good team"), {
        background: ["#fbe7d6", "#f5cfb1"], gradient: "glow", pattern: "dots", burst: "confetti", transition: "zoom",
        stickers: [stick("🃏", "tl", 10, "sway", -10), stick("🤝", "br", 10, "bounce")],
      }),
      golden(reasons("Why you're my favourite", "Tap the jar for each one", ["You always know when something's wrong", "You laugh at my worst jokes", "You've seen me at my worst and stayed anyway", "Every plan is better with you in it", "You're the best kind of trouble"]), {
        background: ["#fff4ea", "#fbdcc4"], gradient: "down", burst: "sparkles", transition: "blur",
        stickers: [stick("💛", "tl", 10, "pulse"), stick("🌻", "br", 11, "sway"), stick("✨", "bl", 8, "float")],
      }),
      golden(message("What I don't say enough", `Thank you for every laugh, every late-night chat and every time you turned up when I needed you. I'm so lucky to have you.\n\n${from}`), {
        background: ["#2b1a14", "#3f271d"], gradient: "glow", text: "#fbeee2", accent: "#f0a46c", transition: "fade",
        stickers: [stick("💌", "tl", 10, "float", -8), stick("✨", "bl", 8, "pulse")],
      }),
      golden(finale("Friends forever", "Here's to all the photos we haven't taken yet.", "confetti"), {
        background: ["#fbdcc4", "#f5b98f"], gradient: "glow", transition: "zoom",
        stickers: [stick("🖼️", "tl", 11, "sway", -6), stick("🌅", "bl", 11, "float"), stick("💛", "br", 10, "pulse")],
      }),
    ],
    demo: { to: "Meera", from: "Olivia", photos: [P.friends, P.summer, P.coffee, P.balloons, P.lights, P.cake] },
  },

  // ---------- Leaving ----------
  {
    slug: "sad-to-see-you-go",
    name: "Sad to See You Go",
    occasion: "leaving",
    tone: "heartfelt",
    theme: "sky",
    ambient: "balloons",
    emoji: "👋",
    headline: "Good luck on your next adventure",
    blurb: "For a colleague who's moving on: everything the team will miss, your photos, lanterns of good luck to send off and a proper goodbye.",
    featured: true,
    screens: (to, from) => [
      voyage(intro(`Good luck, ${to}!`, `From ${from}. We're not crying, you are.`, "Pass the tissues"), {
        background: ["#eef5fb", "#d6e6f4"], gradient: "glow", envelope: "#e7cfa3", burst: "balloons", transition: "fade",
        stickers: [stick("👋", "tl", 12, "sway", -10), stick("🎈", "bl", 11, "float"), stick("🧳", "br", 12, "bounce")],
      }),
      voyage(reasons("Things we'll miss", "Tap the jar", ["Your tea rounds", "How you always know the answer", "Your laugh across the office", "Friday afternoon chats", "You. Just you."]), {
        background: ["#f5f9fc", "#e2ecf6"], gradient: "down", pattern: "dots", burst: "balloons", transition: "blur",
        stickers: [stick("☕", "tl", 10, "float"), stick("💼", "bl", 10, "sway", -8), stick("💙", "br", 10, "pulse")],
      }, { jarEmpty: "That's all we could fit in the jar." }),
      voyage(photos("Some memories"), {
        background: ["#eef5fb", "#d6e6f4"], gradient: "diagonal", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("🎈", "br", 11, "float")],
      }),
      voyage(game("release-lanterns", "Send some luck with you", "Tap each lantern to send a wish for what's next", "Every wish is on its way"), {
        background: ["#1d2540", "#2e3a5f"], gradient: "glow", text: "#f4efe3", accent: "#f2c46d", burst: "stars", transition: "fade",
        stickers: [stick("🌙", "tl", 10, "sway", -10), stick("✨", "bl", 8, "pulse"), stick("⭐", "br", 9, "float")],
      }),
      voyage(message("Good luck!", `It won't be the same without you. Thank you for everything, and good luck with what comes next. Keep in touch!\n\n${from}`), {
        background: ["#fbfcfe", "#e6eef7"], gradient: "down", transition: "fade",
        stickers: [stick("✉️", "tl", 10, "float", -8), stick("💙", "bl", 9, "pulse")],
      }),
      voyage(finale(`Good luck, ${to}!`, "Don't forget us.", "balloons"), {
        background: ["#d6e6f4", "#b9d2ec"], gradient: "glow", transition: "zoom",
        stickers: [stick("👋", "tl", 12, "sway", -10), stick("🎈", "bl", 11, "float"), stick("🧳", "br", 11, "bounce"), stick("✈️", "tc", 8, "float", 15)],
      }),
    ],
    demo: { to: "Olivia", from: "The team", photos: [P.desk, P.cake, P.coffee] },
  },
  {
    slug: "you-cant-leave",
    name: "You Can't Leave",
    occasion: "leaving",
    tone: "funny",
    theme: "party",
    ambient: "confetti",
    emoji: "🙅",
    headline: "Please don't go (the No button won't let you)",
    blurb: "A leaving card that refuses to accept they're leaving, a leaving present slot machine, the evidence in photos and a jokey goodbye.",
    screens: (to, from) => [
      memo(intro(`${to}, we heard the news`, `${from} would like a word.`, "Uh oh"), {
        background: ["#fbfaf6", "#efece2"], gradient: "glow", pattern: "grid", envelope: "#e6d3a8", burst: "confetti", transition: "drop",
        stickers: [stick("📎", "tl", 11, "sway", 30), stick("🗂️", "bl", 11, "float"), stick("☕", "br", 11, "bounce")],
      }, { gotMail: "Internal memo" }),
      memo(question("Will you stay?", "Fine, I'll stay", "No", "Great, see you Monday! (We know you're still leaving.)"), {
        background: ["#fff9cf", "#fff0a0"], gradient: "down", burst: "confetti", transition: "zoom",
        stickers: [stick("🙅", "tl", 11, "bounce"), stick("📌", "bl", 10, "none", -20), stick("🖇️", "br", 11, "sway", 15)],
      }, { noLines: ["Request denied", "HR says no", "Who'll make the tea?", "Your desk needs you", "What about biscuits?", "Take the good chair", "Nice try", "Just press stay"] }),
      memo(game("slot-machine", "Spin for your leaving present", "Pull the lever", "You won… a card. This one."), {
        background: ["#eef3fb", "#d9e3f3"], gradient: "down", pattern: "grid", burst: "confetti", transition: "flip",
        stickers: [stick("🎰", "tl", 11, "bounce"), stick("🎁", "br", 11, "sway", 10), stick("📎", "bl", 9, "none", -30)],
      }, { slotWin: "Jackpot! Sort of." }),
      memo(photos("Exhibit A: why you can't leave"), {
        background: ["#fbfaf6", "#efece2"], gradient: "down", transition: "rise",
        stickers: [stick("📸", "tl", 10, "float", -8), stick("📌", "br", 10, "none", 20)],
      }),
      memo(message("In all seriousness", `We'll miss you loads. Thank you for the laughs, the help and for making Mondays bearable.\n\nGood luck with everything that comes next, and remember us when you're famous.\n\n${from}`), {
        background: ["#fffbe0", "#fff2b0"], gradient: "down", transition: "fade",
        stickers: [stick("☕", "bl", 10, "float"), stick("✏️", "tl", 10, "sway", -20)],
      }),
      memo(finale("Good luck!", "Traitor. (We love you.)", "confetti"), {
        background: ["#efece2", "#ddd6c4"], gradient: "glow", transition: "zoom",
        stickers: [stick("👋", "tl", 12, "sway", -10), stick("🎉", "bl", 11, "bounce"), stick("📎", "br", 11, "sway", 30), stick("☕", "tc", 8, "float")],
      }),
    ],
    demo: { to: "Olivia", from: "The team", photos: [P.desk, P.coffee, P.cake] },
  },
  // Added in their own files so they can be written alongside the ones above.
  ...MORE_DESIGNS,
  ...OCCASION_DESIGNS,
];

// Shown with a "New" badge in the shop: a handful of recent ones for the season ahead, and
// every design added in catalog-more.ts and catalog-occasions.ts. Kept short so it means something.
export const NEW_DESIGNS = new Set<string>([
  "lanterns-of-light",
  "mithai-mayhem",
  "secret-santa",
  "twelve-reasons-of-christmas",
  "year-in-review",
  "pop-the-champagne",
  "pick-your-present",
  "birthday-coupon-book",
  ...MORE_DESIGNS.map((d) => d.slug),
  ...OCCASION_DESIGNS.map((d) => d.slug),
]);

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
    // Every design works on a phone and a computer.
    device: "everywhere",
    layout: t.layout ?? "standard",
    music: t.music ?? OCCASION_MUSIC[t.occasion],
    screens: t.screens(to, from),
  };
}

// Premade: one of our designs with its screens as they come (every word, photo, colour
// and tune can still change). Anything else is custom: a card written from a
// description, or one with screens added, taken out or moved. The checkout works this
// out from the saved card, so the price never depends on what the browser says.
export function cardTier(card: Pick<CardData, "template" | "screens">): Tier {
  const template = getTemplate(card.template);
  if (!template) return "custom";
  const want = template.screens("", "").map((s) => s.type);
  const got = card.screens.map((s) => s.type);
  return want.length === got.length && want.every((type, i) => type === got[i]) ? "premade" : "custom";
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
