import { BLANK } from "@/lib/blanks";
import { LOOK, corners, kit, type KitItem } from "./parts";

// Questions and surprises: runaway questions, quizzes, scratch cards, passwords, wheels,
// mystery boxes and sliders. The runaway No buttons get excuses to suit each question.

// The runaway Yes/No questions get a group of their own in the Screens tab (screen-kit.ts).
export const QUESTIONS: KitItem[] = [
  kit.question("question", "🙅", ["any"], () => ({ question: BLANK.question, yes: "Yes", no: "No", afterYes: "Good answer" })),

  kit.question("question:valentine", "💘", ["valentine"], () => ({
    question: "Will you be my Valentine?",
    yes: "Yes!",
    no: "No",
    afterYes: "I knew you'd say yes",
    style: { ...LOOK.blush, heading: "script", effect: "hearts", burst: "hearts", transition: "zoom", stickers: corners(["💘", "🌹", "💌"], 9, "pulse") },
    labels: { noLines: ["Are you sure?", "Cupid says no", "Wrong button, my love", "Try the other one", "Not an option", "You know you want to"] },
  })),

  kit.question("question:favourite", "😇", ["any", "fun", "birthday", "friendship", "mothersday", "fathersday", "rakhi"], () => ({
    question: "Am I your favourite?",
    yes: "Obviously",
    no: "No",
    afterYes: "I knew it. I'm telling everyone.",
    style: { ...LOOK.sunshine, heading: "bold", body: "rounded", burst: "confetti", transition: "bounce", stickers: corners(["😇", "👑", "⭐"], 9, "bounce") },
    labels: { noLines: ["Think carefully…", "Wrong answer", "Be honest", "I'm watching you", "Last chance", "Try again"] },
  })),

  kit.question("question:surprise", "🎁", ["any", "birthday", "christmas", "anniversary"], () => ({
    question: "Ready for your surprise?",
    yes: "Ready!",
    no: "Not yet",
    afterYes: "Here it comes…",
    style: { ...LOOK.party, heading: "bold", body: "rounded", burst: "confetti", transition: "zoom", stickers: corners(["🎁", "🎀", "✨"], 9, "bounce") },
    labels: { noLines: ["Too late, it's happening", "Ready or not!", "You can't wait forever", "Go on…", "Just press Ready", "It's worth it, promise"] },
  })),

  kit.question("question:forgive", "🥺", ["sorry"], () => ({
    question: "Will you forgive me?",
    yes: "I forgive you",
    no: "No",
    afterYes: "Thank you. I'll make it up to you, I promise.",
    style: { ...LOOK.dove, heading: "handwritten", body: "handwritten", burst: "petals", transition: "fade", stickers: corners(["🥺", "💐", "🏳️"], 9, "sway") },
    labels: { noLines: ["Pretty please?", "I said sorry!", "With a cherry on top?", "I'll do the washing-up", "Look at my sad face", "One more chance?"] },
  })),

  kit.question("question:dinner", "🍝", ["valentine", "anniversary", "birthday", "thanks", "friendship", "any"], () => ({
    question: "Dinner on me?",
    yes: "Yes please",
    no: "No thanks",
    afterYes: "It's a date. You pick the place.",
    style: { ...LOOK.wine, heading: "script", burst: "hearts", transition: "zoom", stickers: corners(["🍝", "🍷", "🕯️"], 9, "sway") },
    labels: { noLines: ["But I'm paying!", "Free food though…", "Dessert too?", "Nope, you're coming", "The table's booked", "Go on, treat yourself"] },
  })),

  kit.question("question:bff", "👯", ["friendship", "birthday"], () => ({
    question: "Best friends forever?",
    yes: "Forever",
    no: "No",
    afterYes: "Good. You're stuck with me now.",
    style: { ...LOOK.lilac, heading: "marker", body: "rounded", burst: "sparkles", transition: "bounce", stickers: corners(["👯", "💜", "✨"], 9, "bounce") },
    labels: { noLines: ["Too late, it's official", "Friendship isn't optional", "Try again, bestie", "Nice try", "I'm not letting you go", "Wrong button!"] },
  })),

  kit.question("question:bridesmaid", "👰", ["wedding"], () => ({
    question: "Will you be my bridesmaid?",
    yes: "Yes!",
    no: "No",
    afterYes: "Eek! I can't wait to have you by my side.",
    style: { ...LOOK.ivory, heading: "script", effect: "petals", burst: "petals", transition: "zoom", stickers: corners(["👰", "💐", "💍"], 9, "float") },
    labels: { noLines: ["You have to!", "I've already picked the dress", "Think of the cake", "Please?", "There's no one else", "Say yes!"] },
  })),

  kit.question("question:still-love", "❤️", ["anniversary", "valentine", "sorry"], () => ({
    question: "Do you still love me?",
    yes: "Always",
    no: "No",
    afterYes: "Phew. Me too, forever.",
    style: { ...LOOK.rouge, heading: "script", effect: "hearts", burst: "hearts", transition: "fade", stickers: corners(["❤️", "💞"], 9, "pulse") },
    labels: { noLines: ["Are you sure?", "Even a little bit?", "That's not what you said yesterday", "Try again", "Wrong button", "Please?"] },
  })),

  kit.question("question:trip", "✈️", ["anniversary", "birthday", "valentine", "any"], () => ({
    question: "Fancy a little trip away?",
    yes: "Yes!",
    no: "No",
    afterYes: "Pack your bags. Details coming soon…",
    style: { ...LOOK.travel, heading: "typewriter", burst: "confetti", transition: "slide", stickers: corners(["✈️", "🧳", "🌍"], 9, "float") },
    labels: { noLines: ["The bags are packed", "Too late, it's booked", "Sun, sea and me?", "Think again", "You'll love it", "Just say yes"] },
  })),

  kit.question("question:hug", "🤗", ["missyou", "sorry", "getwell", "any"], () => ({
    question: "Can I have a hug?",
    yes: "Of course",
    no: "No",
    afterYes: "Squeeeeze. That's better.",
    style: { ...LOOK.peach, heading: "rounded", body: "rounded", burst: "hearts", transition: "bounce", stickers: corners(["🤗", "🧸"], 9, "bounce") },
    labels: { noLines: ["Just a little one?", "Arms are open", "Please?", "I'll be quick", "Nobody's looking", "Come on…"] },
  })),
];

const QUIZZES: KitItem[] = [
  kit.quiz("quiz", "❓", ["any"], () => ({
    title: "Quick quiz",
    questions: [{ question: BLANK.question, options: [BLANK.rightAnswer, BLANK.wrongAnswer], answer: 0 }],
    winText: "You know me so well!",
  })),

  kit.quiz("quiz:know-me", "🤔", ["any", "birthday", "friendship", "valentine", "anniversary"], () => ({
    title: "How well do you know me?",
    questions: [
      { question: "What's my favourite food?", options: [BLANK.rightAnswer, BLANK.wrongAnswer, BLANK.wrongAnswer], answer: 0 },
      { question: "Where would I go on my dream holiday?", options: [BLANK.wrongAnswer, BLANK.rightAnswer, BLANK.wrongAnswer], answer: 1 },
      { question: "What's my secret talent?", options: [BLANK.wrongAnswer, BLANK.wrongAnswer, BLANK.rightAnswer], answer: 2 },
    ],
    winText: "You really do know me!",
    style: { ...LOOK.teal, heading: "bold", body: "rounded", burst: "confetti", transition: "slide", stickers: corners(["🤔", "💡"], 9, "bounce") },
  })),

  kit.quiz("quiz:year", "📅", ["any", "birthday", "anniversary"], () => ({
    title: "Guess the year",
    questions: [
      { question: "What year did we first meet?", options: [BLANK.wrongAnswer, BLANK.rightAnswer, BLANK.wrongAnswer], answer: 1 },
      { question: "What year was our best holiday?", options: [BLANK.rightAnswer, BLANK.wrongAnswer, BLANK.wrongAnswer], answer: 0 },
      { question: "What year did you learn to drive?", options: [BLANK.wrongAnswer, BLANK.wrongAnswer, BLANK.rightAnswer], answer: 2 },
    ],
    winText: "A memory like an elephant!",
    style: { ...LOOK.sepia, heading: "typewriter", transition: "flip", stickers: corners(["📅", "🕰️"], 8) },
    labels: { wrongLines: ["Not quite!", "Way off!", "Hmm, earlier?", "Later, I think", "Try again"] },
  })),

  kit.quiz("quiz:who-said", "💬", ["any", "fun", "friendship", "mothersday", "fathersday"], ({ to, from }) => ({
    title: "Who said it?",
    questions: [
      { question: BLANK.quote, options: [to, from], answer: 0 },
      { question: BLANK.quote, options: [to, from], answer: 1 },
      { question: "Who always says “just five more minutes”?", options: [to, from], answer: 0 },
    ],
    winText: "Guilty as charged!",
    style: { ...LOOK.coral, heading: "marker", body: "rounded", burst: "confetti", transition: "bounce", stickers: corners(["💬", "🗯️"], 9, "bounce") },
    labels: { wrongLines: ["Nope, the other one!", "Are you sure?", "Think again", "Ha! No."] },
  })),

  // The quiz always has a right answer, so this one is "guess which I'd pick".
  kit.quiz("quiz:would-rather", "⚖️", ["any", "fun", "friendship", "valentine"], () => ({
    title: "Would I rather…?",
    questions: [
      { question: "Tea or coffee?", options: ["Tea", "Coffee"], answer: 0 },
      { question: "A cosy night in or a big night out?", options: ["A cosy night in", "A big night out"], answer: 0 },
      { question: "Beach or mountains?", options: ["Beach", "Mountains"], answer: 0 },
    ],
    winText: "You read me like a book!",
    style: { ...LOOK.candy, heading: "bold", body: "rounded", burst: "confetti", transition: "slide", stickers: corners(["⚖️", "🤷"], 9, "sway") },
    labels: { wrongLines: ["Ooh, no. The other one!", "Interesting guess…", "Not me at all!", "Try again"] },
  })),

  kit.quiz("quiz:christmas", "🎄", ["christmas", "fun"], () => ({
    title: "Christmas cracker quiz",
    questions: [
      { question: "What do we leave out for Santa?", options: ["Mince pies", "Pizza", "Sprouts"], answer: 0 },
      { question: "How many reindeer pull the sleigh, counting Rudolph?", options: ["Six", "Nine", "Twelve"], answer: 1 },
      { question: "What's the best bit of Christmas dinner?", options: ["The sprouts", "All of it", "The washing-up"], answer: 1 },
    ],
    winText: "Top of the nice list!",
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", burst: "snow", transition: "drop", stickers: corners(["🎄", "🎅", "❄️"], 9, "sway") },
    labels: { wrongLines: ["Bah humbug!", "Naughty list!", "Try again, elf", "Ho ho… no."] },
  })),

  kit.quiz("quiz:birthday", "🎂", ["birthday", "fun"], ({ to, from }) => ({
    title: "The birthday quiz",
    questions: [
      { question: "Who's the birthday star today?", options: [to, "The cat", "The postman"], answer: 0 },
      { question: "How many slices of cake are allowed today?", options: ["One", "Two", "As many as you like"], answer: 2 },
      { question: "Who made you this card?", options: ["Someone lovely", from, "Both of those"], answer: 2 },
    ],
    winText: "Full marks, birthday star!",
    style: { ...LOOK.party, heading: "bold", body: "rounded", effect: "confetti", burst: "confetti", transition: "bounce", stickers: corners(["🎂", "🎈", "🥳"], 9, "bounce") },
  })),

  kit.quiz("quiz:family", "🏡", ["mothersday", "fathersday", "rakhi", "any"], () => ({
    title: "Family trivia",
    questions: [
      { question: "Who's the best cook in the family?", options: [BLANK.rightAnswer, BLANK.wrongAnswer], answer: 0 },
      { question: "Who's always running late?", options: [BLANK.wrongAnswer, BLANK.rightAnswer], answer: 1 },
      { question: "Who tells the worst jokes?", options: [BLANK.rightAnswer, BLANK.wrongAnswer], answer: 0 },
    ],
    winText: "A true member of the family!",
    style: { ...LOOK.ivory, heading: "storybook", body: "rounded", burst: "confetti", transition: "rise", stickers: corners(["🏡", "💛"], 9, "float") },
  })),

  kit.quiz("quiz:love", "💕", ["valentine", "anniversary", "wedding"], ({ to, from }) => ({
    title: "Our love quiz",
    questions: [
      { question: "Where was our first date?", options: [BLANK.wrongAnswer, BLANK.rightAnswer], answer: 1 },
      { question: "What's our song?", options: [BLANK.rightAnswer, BLANK.wrongAnswer], answer: 0 },
      { question: "Who fell in love first?", options: [to, from], answer: 1 },
    ],
    winText: "Perfect match. Just like us.",
    style: { ...LOOK.blush, heading: "script", effect: "hearts", burst: "hearts", transition: "fade", stickers: corners(["💕", "💑"], 9, "pulse") },
    labels: { wrongLines: ["Wrong, my love!", "Excuse me?", "We'll talk about this later", "Try again, sweetheart"] },
  })),
];

const SCRATCHES: KitItem[] = [
  kit.scratch("scratch", "🪙", ["any"], () => ({ title: "Scratch for a surprise", instructions: "Scratch the silver panel", hidden: BLANK.surprise })),

  kit.scratch("scratch:gift", "🎁", ["any", "birthday", "christmas", "valentine", "anniversary"], () => ({
    title: "Your present is under here",
    instructions: "Scratch the silver to see what you're getting",
    hidden: BLANK.surprise,
    style: { ...LOOK.gold, heading: "classic", burst: "confetti", transition: "zoom", stickers: corners(["🎁", "✨"], 9, "pulse") },
    labels: { scratchDone: "Surprise!" },
  })),

  kit.scratch("scratch:fortune", "🥠", ["any", "fun", "newyear", "birthday"], () => ({
    title: "Your fortune",
    instructions: "Scratch to read your fortune",
    hidden: "Great things are coming your way… starting with this card.",
    style: { background: ["#b3122e", "#5c0614"], gradient: "glow", text: "#fff4dc", accent: "#f2c14e", heading: "storybook", burst: "sparkles", transition: "zoom", stickers: corners(["🥠", "✨", "🏮"], 9, "sway") },
    labels: { scratchHere: "Crack it open", scratchDone: "The cookie has spoken" },
  })),

  kit.scratch("scratch:big-news", "📣", ["any", "newbaby", "wedding", "congrats"], () => ({
    title: "I've got big news…",
    instructions: "Scratch to find out",
    hidden: BLANK.surprise,
    style: { background: ["#ffd60a", "#ffc300"], gradient: "down", text: "#1b1b1b", accent: "#1b1b1b", heading: "bold", body: "bold", burst: "confetti", transition: "bounce", stickers: corners(["📣", "❗", "🎉"], 10, "bounce") },
    labels: { scratchHere: "Scratch me!", scratchDone: "Surprise!" },
  })),

  kit.scratch("scratch:ticket", "🎫", ["any", "fun", "birthday"], () => ({
    title: "Is it your lucky day?",
    instructions: "Scratch the ticket to see what you've won",
    hidden: BLANK.surprise,
    style: { ...LOOK.mint, heading: "bold", burst: "confetti", transition: "flip", stickers: corners(["🎫", "🍀", "💰"], 9, "spin") },
    labels: { scratchHere: "Scratch to win", scratchDone: "WINNER!" },
  })),

  kit.scratch("scratch:baby-news", "🍼", ["newbaby", "mothersday", "fathersday"], () => ({
    title: "We've got some news…",
    instructions: "Scratch gently to find out",
    hidden: BLANK.surprise,
    style: { ...LOOK.baby, heading: "rounded", body: "rounded", burst: "stars", transition: "rise", stickers: corners(["🍼", "👶", "💕"], 9, "float") },
    labels: { scratchDone: "Surprise!" },
  })),

  kit.scratch("scratch:save-date", "💍", ["wedding", "anniversary"], () => ({
    title: "Save the date",
    instructions: "Scratch to see when",
    hidden: BLANK.surprise,
    style: { ...LOOK.ivory, heading: "script", burst: "petals", transition: "fade", stickers: corners(["💍", "🕊️"], 8, "float") },
    labels: { scratchDone: "See you there!" },
  })),
];

const PASSWORDS: KitItem[] = [
  kit.typeit("typeit", "🔐", ["any"], () => ({ title: "Enter the password", instructions: BLANK.clue, phrase: BLANK.password, winText: "Unlocked!" })),

  kit.typeit("typeit:crack-code", "🔢", ["any", "fun", "birthday"], () => ({
    title: "Crack the code",
    instructions: BLANK.clue,
    phrase: BLANK.password,
    winText: "Code cracked. Access granted.",
    style: { ...LOOK.terminal, heading: "typewriter", body: "typewriter", burst: "sparkles", transition: "blur", stickers: corners(["🔢", "💻"], 8) },
    labels: { typeStart: "Enter the code…", typeHint: "Request a clue" },
  })),

  kit.typeit("typeit:magic-word", "🪄", ["any", "fun", "birthday"], () => ({
    title: "What's the magic word?",
    instructions: "Clue: it starts with P, and you could stand to use it more",
    phrase: "please",
    winText: "Correct! See, that wasn't so hard.",
    style: { ...LOOK.midnight, heading: "storybook", effect: "sparkles", burst: "sparkles", transition: "zoom", stickers: corners(["🪄", "✨", "🎩"], 9, "spin") },
  })),

  kit.typeit("typeit:pet-name", "💕", ["valentine", "anniversary"], () => ({
    title: "What do I call you?",
    instructions: BLANK.clue,
    phrase: BLANK.password,
    winText: "That's you",
    style: { ...LOOK.blush, heading: "script", effect: "hearts", burst: "hearts", transition: "fade", stickers: corners(["💕", "🔐"], 9, "pulse") },
  })),

  kit.typeit("typeit:our-song", "🎵", ["valentine", "anniversary", "wedding", "friendship"], () => ({
    title: "Name our song",
    instructions: BLANK.clue,
    phrase: BLANK.password,
    winText: "Now it's stuck in your head. You're welcome.",
    style: { ...LOOK.lilac, heading: "marker", burst: "sparkles", transition: "bounce", stickers: corners(["🎵", "🎶", "🎧"], 9, "sway") },
    labels: { typeStart: "Our song is…" },
  })),

  kit.typeit("typeit:santa", "🎅", ["christmas"], () => ({
    title: "Santa's secret code",
    instructions: "Clue: what Santa says, three times",
    phrase: "ho ho ho",
    winText: "Ho ho ho! Merry Christmas!",
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", burst: "snow", transition: "drop", stickers: corners(["🎅", "🔐", "❄️"], 9, "sway") },
  })),
];

const WHEELS: KitItem[] = [
  kit.wheel("wheel", "🎡", ["any"], () => ({
    title: "Spin for your prize",
    instructions: "Whatever it lands on, you get",
    options: [1, 2, 3, 4].map(BLANK.prize),
    landOn: -1,
    winText: "The wheel has spoken!",
  })),

  kit.wheel("wheel:date-night", "🍷", ["valentine", "anniversary", "wedding"], () => ({
    title: "Date night roulette",
    instructions: "Spin to pick our next date",
    options: ["Fancy dinner", "Cinema night", "Takeaway and a film", "A picnic", "Stargazing", "Cook together"],
    landOn: -1,
    winText: "It's a date!",
    style: { ...LOOK.wine, heading: "script", burst: "hearts", transition: "spin", stickers: corners(["🍷", "🎬", "❤️"], 9, "sway") },
  })),

  kit.wheel("wheel:treat", "🍫", ["any", "birthday", "thanks", "getwell", "fun"], () => ({
    title: "Spin for a treat",
    instructions: "Whatever it lands on, it's yours",
    options: ["Chocolate", "A cuppa in bed", "A day off", "Ice cream", "A long bath", "Your favourite takeaway"],
    landOn: -1,
    winText: "Treat yourself. Doctor's orders.",
    style: { ...LOOK.candy, heading: "bold", body: "rounded", burst: "confetti", transition: "spin", stickers: corners(["🍫", "🍦", "🍩"], 9, "bounce") },
  })),

  kit.wheel("wheel:dinner", "🍕", ["any", "fun"], () => ({
    title: "What's for dinner?",
    instructions: "Can't decide? Let the wheel choose",
    options: ["Pizza", "Curry", "Fish and chips", "Sushi", "Tacos", "A roast"],
    landOn: -1,
    winText: "Dinner is decided!",
    style: { ...LOOK.coral, heading: "marker", body: "rounded", burst: "confetti", transition: "spin", stickers: corners(["🍕", "🍛", "🌮"], 9, "spin") },
  })),

  kit.wheel("wheel:birthday", "🎂", ["birthday"], () => ({
    title: "Birthday wheel of fortune",
    instructions: "Spin for your birthday present",
    options: ["Extra cake", "Breakfast in bed", "A big hug", "A day out", "You pick the film", "One wish granted"],
    landOn: -1,
    winText: "Happy birthday to you!",
    style: { ...LOOK.party, heading: "bold", body: "rounded", effect: "balloons", burst: "confetti", transition: "spin", stickers: corners(["🎂", "🎈", "🎁"], 9, "bounce") },
  })),

  // Rigged on purpose: it always lands on the first slice.
  kit.wheel("wheel:rigged", "😏", ["any", "fun", "valentine", "birthday"], () => ({
    title: "Spin to see what you've won",
    instructions: "Good luck… you'll need it",
    options: ["Dinner on me", "A foot rub", "Washing-up duty", "Absolutely nothing"],
    landOn: 0,
    winText: "What luck! (Totally not rigged.)",
    style: { ...LOOK.vegas, heading: "bold", burst: "confetti", transition: "spin", stickers: corners(["😏", "🎰", "💰"], 9, "sway") },
  })),

  kit.wheel("wheel:christmas", "🎄", ["christmas"], () => ({
    title: "Festive spin",
    instructions: "Spin for a Christmas treat",
    options: ["A mince pie", "Pick the Christmas film", "No washing-up", "First go at presents", "A festive hug", "Extra pudding"],
    landOn: -1,
    winText: "Merry Christmas!",
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", burst: "snow", transition: "spin", stickers: corners(["🎄", "🎁", "⭐"], 9, "sway") },
  })),

  kit.wheel("wheel:eid", "🌙", ["eid"], () => ({
    title: "Spin for your Eid treat",
    instructions: "Whatever it lands on, it's yours",
    options: ["Extra Eidi", "Biryani for dinner", "A box of sweets", "A day out", "Your favourite dessert", "A big Eid hug"],
    landOn: -1,
    winText: "Eid Mubarak!",
    style: { ...LOOK.eid, effect: "stars", burst: "sparkles", transition: "spin", stickers: corners(["🌙", "⭐", "🎁"], 9, "float") },
  })),
];

const BOXES: KitItem[] = [
  kit.boxes("boxes", "🎁", ["any"], () => ({ title: "Pick a box", instructions: "Choose wisely…", prizes: [1, 2, 3].map(BLANK.prize) })),

  kit.boxes("boxes:present", "🎀", ["any", "birthday", "christmas"], () => ({
    title: "Pick a present",
    instructions: "Only one, so choose carefully…",
    prizes: [1, 2, 3].map(BLANK.prize),
    style: { ...LOOK.pastel, heading: "bold", body: "rounded", burst: "confetti", transition: "bounce", stickers: corners(["🎀", "🎁"], 9, "bounce") },
  })),

  kit.boxes("boxes:mystery", "❔", ["any", "fun"], () => ({
    title: "Mystery boxes",
    instructions: "Three boxes. One choice. No peeking.",
    prizes: ["A day out, my treat", "Dinner, my treat", "Breakfast in bed"],
    style: { ...LOOK.midnight, heading: "bold", burst: "sparkles", transition: "zoom", stickers: corners(["❔", "❓", "✨"], 9, "float") },
  })),

  kit.boxes("boxes:crackers", "🎄", ["christmas"], () => ({
    title: "Pull a cracker",
    instructions: "Pick a cracker to see what's inside",
    prizes: ["A paper crown and a terrible joke", "A festive hug", "First pick of the chocolates"],
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", burst: "confetti", transition: "drop", stickers: corners(["🎄", "👑", "🎁"], 9, "sway") },
    labels: { boxesPicked: "Bang! Inside you find…" },
  })),

  kit.boxes("boxes:love", "💝", ["valentine", "anniversary"], () => ({
    title: "Pick a box, my love",
    instructions: "Every one is full of love. One is full of more.",
    prizes: ["A kiss", "A candlelit dinner", "A whole day of cuddles"],
    style: { ...LOOK.rouge, heading: "script", effect: "hearts", burst: "hearts", transition: "zoom", stickers: corners(["💝", "💋"], 9, "pulse") },
  })),

  kit.boxes("boxes:eidi", "💰", ["eid"], () => ({
    title: "Pick your Eidi",
    instructions: "Choose a box for your Eid gift",
    prizes: [1, 2, 3].map(BLANK.prize),
    style: { ...LOOK.eid, effect: "stars", burst: "sparkles", transition: "rise", stickers: corners(["💰", "🌙", "⭐"], 9, "float") },
  })),

  kit.boxes("boxes:mithai", "🍬", ["diwali"], () => ({
    title: "Pick a box of mithai",
    instructions: "Which sweet treat is yours?",
    prizes: ["Kaju katli", "Gulab jamun", "Motichoor ladoo"],
    style: { ...LOOK.marigold, heading: "storybook", burst: "sparkles", transition: "bounce", stickers: corners(["🍬", "🪔", "🌼"], 9, "pulse") },
  })),
];

const SLIDERS: KitItem[] = [
  kit.slider("slider", "📈", ["any"], () => ({ title: BLANK.question, low: "A little", high: "SO much", winText: "Correct answer" })),

  kit.slider("slider:love", "❤️", ["valentine", "anniversary", "wedding", "mothersday", "fathersday"], () => ({
    title: "How much do I love you?",
    low: "A little",
    high: "To the moon and back",
    winText: "Correct. Off the charts.",
    style: { ...LOOK.blush, heading: "script", effect: "hearts", burst: "hearts", transition: "zoom", stickers: corners(["❤️", "🌙"], 9, "pulse") },
    labels: { sliderLines: ["Hmm, more than that…", "Keep going…", "Getting warmer…", "Nearly there…"] },
  })),

  kit.slider("slider:missed", "🫶", ["missyou", "leaving"], () => ({
    title: "How much did I miss you?",
    low: "A bit",
    high: "Loads",
    winText: "Yep. That much.",
    style: { ...LOOK.ocean, heading: "handwritten", burst: "hearts", transition: "fade", stickers: corners(["🫶", "✈️"], 9, "float") },
    labels: { sliderLines: ["More than that…", "Even more…", "Keep going…", "Nearly…"] },
  })),

  kit.slider("slider:sorry", "😔", ["sorry"], () => ({
    title: "How sorry am I?",
    low: "A tiny bit",
    high: "Really, really sorry",
    winText: "That sorry. Truly.",
    style: { ...LOOK.dove, heading: "handwritten", burst: "petals", transition: "fade", stickers: corners(["😔", "💐"], 9, "sway") },
    labels: { sliderLines: ["No, sorrier than that", "Keep going…", "Sorrier still…", "Almost there…"] },
  })),

  kit.slider("slider:excited", "🤩", ["any", "birthday", "christmas", "newyear", "fun"], () => ({
    title: "How excited are you?",
    low: "Meh",
    high: "Can't. Even.",
    winText: "Same! Let's go!",
    style: { ...LOOK.fiesta, heading: "bold", body: "rounded", burst: "confetti", transition: "bounce", stickers: corners(["🤩", "🎉"], 10, "bounce") },
    labels: { sliderLines: ["Come on, more than that!", "Getting there…", "Yes!", "MORE!"] },
  })),

  kit.slider("slider:proud", "🏆", ["congrats", "birthday", "mothersday", "fathersday", "leaving"], () => ({
    title: "How proud am I of you?",
    low: "Proud",
    high: "Bursting with pride",
    winText: "Bursting. Absolutely bursting.",
    style: { ...LOOK.navy, heading: "bold", burst: "confetti", transition: "zoom", stickers: corners(["🏆", "⭐"], 9, "pulse") },
    labels: { sliderLines: ["Prouder than that…", "Keep going…", "Even prouder…", "Nearly bursting…"] },
  })),

  kit.slider("slider:age", "👵", ["birthday", "fun"], () => ({
    title: "How old do you feel today?",
    low: "Forever young",
    high: "Vintage",
    winText: "Don't worry, you don't look it!",
    style: { ...LOOK.sepia, heading: "typewriter", burst: "confetti", transition: "rise", stickers: corners(["👵", "🎂"], 9, "sway") },
    labels: { sliderLines: ["Still a spring chicken…", "Hmm, creaking a bit…", "Ooh, distinguished…", "Positively antique…"] },
  })),
];

export const SURPRISES: KitItem[] = [...QUIZZES, ...SCRATCHES, ...PASSWORDS, ...WHEELS, ...BOXES, ...SLIDERS];
