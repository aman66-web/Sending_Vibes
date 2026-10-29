import type { Game } from "@/lib/card";
import { LOOK, corners, gameKit, type KitItem } from "./parts";

// Every mini game, first in the card's own colours, then dressed up two more ways: a look
// of its own, or tuned for someone who'd like it gentler (bigger, slower, fewer) or
// harder. Where the instructions give a number, it's the number the tune asks for.

// The emoji that stands for each game.
export const GAME_EMOJI: Record<Game, string> = {
  "catch-hearts": "💕",
  "light-diyas": "🪔",
  "blow-candles": "🕯️",
  "pop-balloons": "🎈",
  "catch-snowflakes": "❄️",
  "catch-stars": "⭐",
  "memory-match": "🃏",
  "unwrap-gift": "🎁",
  "shake-it": "📳",
  "cursor-chase": "💘",
  "loves-me-not": "🌼",
  "whack-ghosts": "👻",
  "launch-fireworks": "🎆",
  "release-lanterns": "🏮",
  "bubble-wrap": "🫧",
  pinata: "🪅",
  "grow-flower": "🌱",
  "throw-colours": "🎨",
  "slot-machine": "🎰",
  "hold-hug": "🤗",
  "catch-candy": "🍬",
};

const g = gameKit;

export const GAMES_KIT: KitItem[] = [
  // Catch the hearts
  g("catch-hearts", "game:catch-hearts", "💕", ["valentine", "anniversary", "any"], () => ({ title: "Catch my love", instructions: "Tap 10 falling hearts to unlock your surprise", winText: "You caught all my love!" })),
  g("catch-hearts", "game:catch-hearts:sweetheart", "💘", ["valentine", "anniversary", "wedding"], () => ({
    title: "Catch my heart",
    instructions: "Tap 12 falling hearts. Every one is yours.",
    winText: "All of them, caught. My heart's all yours.",
    style: { ...LOOK.blush, heading: "script", burst: "hearts", transition: "zoom", tune: { goal: 12 }, stickers: corners(["💘", "🌹"], 9, "pulse") },
  })),
  g("catch-hearts", "game:catch-hearts:gentle", "🫶", ["any", "mothersday", "fathersday", "getwell", "missyou"], () => ({
    title: "Catch the hearts",
    instructions: "Tap 6 big, slow hearts. Take your time.",
    winText: "Lovely! Every heart caught.",
    style: { ...LOOK.peach, heading: "rounded", body: "rounded", burst: "hearts", transition: "fade", tune: { speed: 0.6, goal: 6, size: 1.6 }, stickers: corners(["🫶", "💛"], 8) },
  })),

  // Light the diyas
  g("light-diyas", "game:light-diyas", "🪔", ["diwali"], () => ({ title: "Light the diyas", instructions: "Tap each diya to light it", winText: "May your home always be this bright" })),
  g("light-diyas", "game:light-diyas:midnight", "✨", ["diwali"], () => ({
    title: "Light up the night",
    instructions: "Tap each diya to light it",
    winText: "Shubh Deepavali! May your year glow like this.",
    style: { ...LOOK.midnight, heading: "storybook", effect: "stars", burst: "fireworks", transition: "fade", stickers: corners(["✨", "🌙"], 8, "pulse") },
  })),
  g("light-diyas", "game:light-diyas:marigold", "🌼", ["diwali"], () => ({
    title: "Light the diyas with me",
    instructions: "Tap all 7 diyas to light them",
    winText: "Happy Diwali! Your home is glowing.",
    style: { ...LOOK.marigold, heading: "storybook", burst: "sparkles", transition: "rise", tune: { goal: 7 }, stickers: corners(["🌼", "🌺", "🪔"], 9, "sway") },
  })),

  // Blow out the candles
  g("blow-candles", "game:blow-candles", "🕯️", ["birthday"], () => ({ title: "Make a wish…", instructions: "Tap every flame to blow out your candles", winText: "Wish made! I hope it comes true" })),
  g("blow-candles", "game:blow-candles:pastel", "🧁", ["birthday"], () => ({
    title: "Make a wish!",
    instructions: "Close your eyes, make a wish, then tap every flame",
    winText: "Wish made! Now for the cake…",
    style: { ...LOOK.pastel, heading: "rounded", body: "rounded", effect: "balloons", burst: "balloons", transition: "bounce", stickers: corners(["🧁", "🎈", "🎂"], 9, "float") },
  })),
  g("blow-candles", "game:blow-candles:gold", "🥂", ["birthday", "anniversary", "congrats"], () => ({
    title: "A big birthday wish",
    instructions: "Tap all 8 flames. Big birthday, big wish.",
    winText: "Cheers to you! May every wish come true.",
    style: { ...LOOK.gold, heading: "classic", effect: "sparkles", burst: "fireworks", transition: "zoom", tune: { goal: 8 }, stickers: corners(["🥂", "✨"], 8, "pulse") },
  })),

  // Pop the balloons
  g("pop-balloons", "game:pop-balloons", "🎈", ["birthday", "congrats", "any"], () => ({ title: "Pop the balloons", instructions: "Pop 10 balloons as they float up", winText: "Pop-tastic!" })),
  g("pop-balloons", "game:pop-balloons:rainbow", "🌈", ["birthday", "fun"], () => ({
    title: "Pop the rainbow",
    instructions: "Pop 15 balloons. Quick, they're getting away!",
    winText: "Every last one! Happy birthday!",
    style: { ...LOOK.rainbow, heading: "bold", body: "rounded", burst: "confetti", transition: "bounce", tune: { goal: 15, speed: 1.2 }, stickers: corners(["🌈", "🎈"], 9, "bounce") },
  })),
  g("pop-balloons", "game:pop-balloons:gentle", "🎈", ["birthday", "any", "newbaby"], () => ({
    title: "Pop the balloons",
    instructions: "Tap 6 big balloons as they drift up slowly",
    winText: "Hooray! You did it!",
    style: { ...LOOK.sky, heading: "rounded", body: "rounded", burst: "balloons", transition: "rise", tune: { goal: 6, speed: 0.6, size: 1.5 }, stickers: corners(["🎈", "☁️"], 9, "float") },
  })),

  // Catch the snowflakes
  g("catch-snowflakes", "game:catch-snowflakes", "❄️", ["christmas", "newyear"], () => ({ title: "Let it snow", instructions: "Catch 10 snowflakes", winText: "Snow-mazing!" })),
  g("catch-snowflakes", "game:catch-snowflakes:frosty", "⛄", ["christmas", "missyou"], () => ({
    title: "Catch the snow",
    instructions: "Tap 10 falling snowflakes",
    winText: "Snow-mazing! Stay warm.",
    style: { ...LOOK.frost, heading: "storybook", effect: "snow", burst: "snow", transition: "drop", stickers: corners(["⛄", "❄️"], 9, "sway") },
  })),
  g("catch-snowflakes", "game:catch-snowflakes:blizzard", "🌨️", ["christmas", "fun"], () => ({
    title: "Blizzard!",
    instructions: "Catch 15 snowflakes. They're quick!",
    winText: "Champion snow-catcher!",
    style: { ...LOOK.ocean, heading: "bold", effect: "snow", burst: "snow", transition: "blur", tune: { goal: 15, speed: 1.5, size: 0.85 }, stickers: corners(["🌨️", "🥶"], 9, "bounce") },
  })),

  // Catch the stars
  g("catch-stars", "game:catch-stars", "⭐", ["any", "eid", "congrats"], () => ({ title: "Catch the stars", instructions: "Catch 10 falling stars", winText: "You're a star!" })),
  g("catch-stars", "game:catch-stars:night-sky", "🌙", ["eid", "newbaby", "any"], () => ({
    title: "Catch a falling star",
    instructions: "Tap 8 stars as they fall from the sky",
    winText: "Make a wish on every one",
    style: { ...LOOK.midnight, heading: "storybook", effect: "stars", burst: "stars", transition: "fade", tune: { goal: 8, speed: 0.8 }, stickers: corners(["🌙", "✨"], 9, "float") },
  })),
  g("catch-stars", "game:catch-stars:gold-stars", "🌟", ["congrats", "thanks", "leaving"], () => ({
    title: "Gold stars for you",
    instructions: "Catch 10 gold stars. You've earned them.",
    winText: "Gold stars all round!",
    style: { ...LOOK.navy, heading: "bold", burst: "confetti", transition: "zoom", stickers: corners(["🌟", "🏆"], 9, "pulse") },
  })),

  // Memory match
  g("memory-match", "game:memory-match", "🃏", ["any"], () => ({ title: "Memory match", instructions: "Find all the matching pairs", winText: "Sharp as ever!" })),
  g("memory-match", "game:memory-match:quick", "🧠", ["any", "getwell", "mothersday", "fathersday"], () => ({
    title: "A quick memory game",
    instructions: "Find the 4 matching pairs",
    winText: "Perfect memory!",
    style: { ...LOOK.teal, heading: "rounded", body: "rounded", burst: "confetti", transition: "flip", tune: { goal: 4 }, stickers: corners(["🧠", "✨"], 8) },
  })),
  g("memory-match", "game:memory-match:retro", "🕹️", ["fun", "any", "friendship"], () => ({
    title: "Level 1: memory",
    instructions: "Match all 6 pairs in as few goes as you can",
    winText: "High score!",
    style: { ...LOOK.terminal, heading: "typewriter", body: "typewriter", burst: "sparkles", transition: "blur", stickers: corners(["🕹️", "👾"], 8, "bounce") },
  })),

  // Unwrap the present
  g("unwrap-gift", "game:unwrap-gift", "🎁", ["birthday", "christmas", "any"], () => ({ title: "Unwrap your present", instructions: "Tap to tear off the wrapping paper", winText: "It's yours! Happy unwrapping" })),
  g("unwrap-gift", "game:unwrap-gift:christmas", "🎄", ["christmas"], () => ({
    title: "One present under the tree",
    instructions: "Tap to tear off the wrapping paper",
    winText: "Merry Christmas!",
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", burst: "snow", transition: "drop", stickers: corners(["🎄", "⭐", "🎁"], 9, "sway") },
  })),
  g("unwrap-gift", "game:unwrap-gift:birthday", "🎂", ["birthday"], () => ({
    title: "Your birthday present",
    instructions: "Tap and tear. No need to save the paper.",
    winText: "Happy birthday! It's all yours.",
    style: { ...LOOK.party, heading: "bold", body: "rounded", effect: "confetti", burst: "confetti", transition: "bounce", stickers: corners(["🎂", "🎈", "🎉"], 9, "bounce") },
  })),

  // Shake the phone
  g("shake-it", "game:shake-it", "📳", ["any", "fun"], () => ({ title: "Shake it open!", instructions: "Shake your phone as hard as you dare", winText: "It burst open!" })),
  g("shake-it", "game:shake-it:champagne", "🍾", ["newyear", "congrats", "wedding", "birthday"], () => ({
    title: "Shake the bottle!",
    instructions: "Shake your phone to pop the cork",
    winText: "POP! Cheers to you!",
    style: { ...LOOK.gold, heading: "classic", effect: "sparkles", burst: "confetti", transition: "zoom", stickers: corners(["🍾", "🥂"], 9, "sway") },
  })),
  g("shake-it", "game:shake-it:snow-globe", "🔮", ["christmas"], () => ({
    title: "Shake the snow globe",
    instructions: "Shake your phone to make it snow",
    winText: "Let it snow!",
    style: { ...LOOK.frost, heading: "storybook", effect: "snow", burst: "snow", transition: "fade", stickers: corners(["⛄", "❄️"], 9, "sway") },
  })),

  // Chase the heart
  g("cursor-chase", "game:cursor-chase", "💘", ["valentine", "any"], () => ({ title: "Catch my heart", instructions: "It runs from your cursor. Catch it 5 times.", winText: "Okay, you've got it. It's yours now" })),
  g("cursor-chase", "game:cursor-chase:playful", "😜", ["valentine", "fun"], () => ({
    title: "Hard to get",
    instructions: "My heart is playing hard to get. Catch it 5 times.",
    winText: "Fine, you win. It's yours.",
    style: { ...LOOK.candy, heading: "marker", body: "rounded", burst: "hearts", transition: "bounce", tune: { speed: 1.2 }, stickers: corners(["😜", "💘"], 9, "bounce") },
  })),
  g("cursor-chase", "game:cursor-chase:slow", "🐢", ["valentine", "any", "anniversary"], () => ({
    title: "Catch my heart",
    instructions: "It runs away slowly. Catch it 3 times.",
    winText: "Caught! It was always yours.",
    style: { ...LOOK.rouge, heading: "script", burst: "hearts", transition: "fade", tune: { speed: 0.6, goal: 3 }, stickers: corners(["❤️", "🌹"], 9, "pulse") },
  })),

  // Loves me, loves me not
  g("loves-me-not", "game:loves-me-not", "🌼", ["valentine"], () => ({ title: "Loves me, loves me not", instructions: "Pluck every petal to find out", winText: "LOVES ME! The flower never lies" })),
  g("loves-me-not", "game:loves-me-not:meadow", "🐝", ["valentine", "friendship", "anniversary"], () => ({
    title: "Ask the daisy",
    instructions: "Tap every petal to find out",
    winText: "Loves me! Told you.",
    style: { ...LOOK.mint, heading: "storybook", effect: "petals", burst: "petals", transition: "rise", stickers: corners(["🐝", "🌼", "🦋"], 9, "float") },
  })),
  // An odd number of petals, so it always ends on "loves me".
  g("loves-me-not", "game:loves-me-not:rose", "🥀", ["valentine", "anniversary"], () => ({
    title: "Loves me, loves me not",
    instructions: "Pluck all 11 petals to find out",
    winText: "Loves me. Always has.",
    style: { ...LOOK.wine, heading: "script", effect: "petals", burst: "hearts", transition: "fade", tune: { goal: 11 }, stickers: corners(["🌹", "🕯️"], 9, "sway") },
  })),

  // Whack the ghosts
  g("whack-ghosts", "game:whack-ghosts", "👻", ["halloween"], () => ({ title: "Whack the ghosts", instructions: "Whack 8 ghosts before they get you", winText: "The ghosts have fled" })),
  g("whack-ghosts", "game:whack-ghosts:haunted", "🏚️", ["halloween"], () => ({
    title: "The haunted house",
    instructions: "Whack 8 ghosts to escape",
    winText: "You escaped! Barely.",
    style: { ...LOOK.spooky, heading: "spooky", effect: "spooky", burst: "spooky", transition: "blur", stickers: corners(["🕸️", "🦇", "🕯️"], 9, "sway") },
  })),
  g("whack-ghosts", "game:whack-ghosts:pumpkin", "🎃", ["halloween", "fun"], () => ({
    title: "Pumpkin patch panic",
    instructions: "Whack 10 ghosts. They're fast tonight!",
    winText: "The patch is safe. My hero!",
    style: { ...LOOK.pumpkin, heading: "spooky", burst: "spooky", transition: "bounce", tune: { goal: 10, speed: 1.3 }, stickers: corners(["🎃", "🍬"], 10, "bounce") },
  })),

  // Launch fireworks
  g("launch-fireworks", "game:launch-fireworks", "🎆", ["newyear", "diwali", "any"], () => ({ title: "Light up the sky", instructions: "Tap the sky to launch 6 fireworks", winText: "What a show!" })),
  g("launch-fireworks", "game:launch-fireworks:midnight", "🕛", ["newyear"], () => ({
    title: "It's midnight!",
    instructions: "Tap the sky to launch 6 fireworks",
    winText: "Happy New Year!",
    style: { ...LOOK.newyear, heading: "classic", effect: "sparkles", burst: "fireworks", transition: "zoom", stickers: corners(["🕛", "🥂"], 9, "pulse") },
  })),
  g("launch-fireworks", "game:launch-fireworks:grand", "🎇", ["congrats", "birthday", "wedding", "diwali"], () => ({
    title: "The grand finale",
    instructions: "Tap the sky to launch 12 fireworks",
    winText: "Now that's a celebration!",
    style: { ...LOOK.gold, heading: "bold", burst: "fireworks", transition: "zoom", tune: { goal: 12 }, stickers: corners(["🎇", "✨"], 8, "pulse") },
  })),

  // Release the lanterns
  g("release-lanterns", "game:release-lanterns", "🏮", ["diwali", "newyear", "wedding", "any"], () => ({ title: "Release the lanterns", instructions: "Tap each lantern and make a wish", winText: "May every wish come true" })),
  g("release-lanterns", "game:release-lanterns:wishes", "🌌", ["any", "birthday", "missyou"], () => ({
    title: "A night of wishes",
    instructions: "Tap each lantern and make a wish for the year ahead",
    winText: "Every wish is on its way",
    style: { ...LOOK.ocean, heading: "storybook", effect: "stars", burst: "lanterns", transition: "fade", stickers: corners(["🌌", "🌙"], 8, "float") },
  })),
  g("release-lanterns", "game:release-lanterns:golden", "🪔", ["diwali", "eid"], () => ({
    title: "Lanterns of light",
    instructions: "Tap each lantern to send it into the sky",
    winText: "May your days be as bright as these",
    style: { ...LOOK.diwali, heading: "storybook", effect: "lanterns", burst: "sparkles", transition: "rise", stickers: corners(["🏮", "✨"], 9, "float") },
  })),

  // Pop the bubble wrap
  g("bubble-wrap", "game:bubble-wrap", "🫧", ["getwell", "sorry", "fun", "any"], () => ({ title: "Pop the bubble wrap", instructions: "Pop every single bubble", winText: "So satisfying. Feeling better already?" })),
  g("bubble-wrap", "game:bubble-wrap:calm", "🧘", ["getwell", "any", "missyou"], () => ({
    title: "A moment of calm",
    instructions: "Breathe in, pop a bubble, breathe out. Pop all 12.",
    winText: "There. Feeling a little lighter?",
    style: { ...LOOK.lavender, heading: "storybook", effect: "bubbles", transition: "fade", tune: { goal: 12 }, stickers: corners(["🧘", "🌿"], 8, "float") },
  })),
  g("bubble-wrap", "game:bubble-wrap:stress", "💥", ["fun", "leaving", "getwell", "congrats"], () => ({
    title: "Stress buster",
    instructions: "Pop all 30. Go on, take it out on the bubbles.",
    winText: "All popped. Much better.",
    style: { ...LOOK.fiesta, heading: "bold", burst: "confetti", transition: "bounce", tune: { goal: 30 }, stickers: corners(["💥", "😤"], 9, "bounce") },
  })),

  // Smash the piñata
  g("pinata", "game:pinata", "🪅", ["birthday", "fun"], () => ({ title: "Smash the piñata!", instructions: "Tap it 8 times to break it open", winText: "Sweets everywhere!" })),
  g("pinata", "game:pinata:fiesta", "🌮", ["birthday", "fun", "friendship"], () => ({
    title: "Fiesta time!",
    instructions: "Give it 10 good whacks",
    winText: "¡Olé! Sweets for everyone!",
    style: { ...LOOK.fiesta, heading: "marker", body: "rounded", effect: "confetti", burst: "confetti", transition: "bounce", tune: { goal: 10 }, stickers: corners(["🌮", "🎉", "🌵"], 10, "bounce") },
  })),
  g("pinata", "game:pinata:quick", "🍭", ["birthday", "any", "newbaby"], () => ({
    title: "Smash the piñata!",
    instructions: "Tap it 4 times to break it open",
    winText: "Hooray! Sweets!",
    style: { ...LOOK.candy, heading: "rounded", body: "rounded", burst: "confetti", transition: "rise", tune: { goal: 4 }, stickers: corners(["🍭", "🍬"], 9, "float") },
  })),

  // Grow a flower
  g("grow-flower", "game:grow-flower", "🌱", ["thanks", "mothersday", "getwell", "any"], () => ({ title: "Help it grow", instructions: "Water the plant until it blooms", winText: "A thank you, in full bloom" })),
  g("grow-flower", "game:grow-flower:mum", "🌸", ["mothersday"], () => ({
    title: "Help it bloom",
    instructions: "Water the plant until it flowers",
    winText: "Just like you helped me grow",
    style: { ...LOOK.garden, heading: "script", effect: "petals", burst: "petals", transition: "rise", stickers: corners(["🌸", "🦋"], 9, "float") },
  })),
  g("grow-flower", "game:grow-flower:get-well", "🌻", ["getwell", "thanks"], () => ({
    title: "A little sunshine",
    instructions: "Water the sunflower until it blooms",
    winText: "Get well soon. Bloom again!",
    style: { ...LOOK.sunshine, heading: "rounded", body: "rounded", burst: "sparkles", transition: "rise", stickers: corners(["🌻", "☀️"], 9, "spin") },
  })),

  // Throw colours
  g("throw-colours", "game:throw-colours", "🎨", ["holi"], () => ({ title: "Throw the colours!", instructions: "Tap to splash 12 colours", winText: "Holi hai!" })),
  g("throw-colours", "game:throw-colours:rainbow", "🌈", ["holi", "fun"], () => ({
    title: "Make it a rainbow",
    instructions: "Tap to splash 20 colours. Don't hold back!",
    winText: "Look at the state of you! Holi hai!",
    style: { background: ["#ffffff", "#f3f0ea"], gradient: "glow", text: "#2d1a4a", accent: "#d6247a", heading: "bold", body: "rounded", burst: "colours", transition: "bounce", tune: { goal: 20 }, stickers: corners(["🌈", "💦"], 9, "bounce") },
  })),
  g("throw-colours", "game:throw-colours:gulal", "🌸", ["holi"], () => ({
    title: "Gulal for you",
    instructions: "Tap to throw 12 handfuls of colour",
    winText: "Bura na mano, Holi hai!",
    style: { ...LOOK.lilac, heading: "storybook", effect: "colours", burst: "colours", transition: "rise", stickers: corners(["🌸", "💗"], 9, "float") },
  })),

  // Slot machine
  g("slot-machine", "game:slot-machine", "🎰", ["any", "fun", "birthday"], () => ({ title: "Pull for the jackpot", instructions: "Pull the lever. Third time lucky?", winText: "JACKPOT! Just like you" })),
  g("slot-machine", "game:slot-machine:vegas", "🎲", ["fun", "birthday", "congrats"], () => ({
    title: "Feeling lucky?",
    instructions: "Pull the lever and hit the jackpot",
    winText: "JACKPOT! You lucky thing!",
    style: { ...LOOK.vegas, heading: "bold", burst: "confetti", transition: "zoom", stickers: corners(["🎲", "💰", "🍒"], 9, "spin") },
    labels: { slotStart: "Pull the lever, high roller!" },
  })),
  g("slot-machine", "game:slot-machine:christmas", "🎄", ["christmas"], () => ({
    title: "Christmas jackpot",
    instructions: "Pull the lever for some festive luck",
    winText: "Jackpot! Merry Christmas!",
    style: { ...LOOK.noel, heading: "storybook", effect: "snow", burst: "snow", transition: "drop", stickers: corners(["🎄", "🔔"], 9, "sway") },
  })),

  // Send a hug
  g("hold-hug", "game:hold-hug", "🤗", ["any", "missyou", "sorry", "getwell"], () => ({ title: "And one big hug", instructions: "Press and hold to send it", winText: "Hug delivered" })),
  g("hold-hug", "game:hold-hug:cosy", "🧸", ["missyou", "getwell", "sorry", "mothersday", "fathersday"], () => ({
    title: "A warm, cosy hug",
    instructions: "Press and hold. Don't let go too soon.",
    winText: "Hug received. Feel better?",
    style: { ...LOOK.peach, heading: "handwritten", burst: "hearts", transition: "fade", stickers: corners(["🧸", "💛"], 9, "float") },
  })),
  g("hold-hug", "game:hold-hug:bear", "🐻", ["fun", "friendship", "birthday"], () => ({
    title: "Bear hug incoming!",
    instructions: "Press and hold for a big squeeze",
    winText: "Squeeeeze! Hug delivered.",
    style: { ...LOOK.kraft, heading: "marker", body: "rounded", burst: "hearts", transition: "bounce", stickers: corners(["🐻", "🍯"], 10, "bounce") },
  })),

  // Catch the sweets
  g("catch-candy", "game:catch-candy", "🍬", ["halloween", "birthday", "fun"], () => ({ title: "Fill your sweet bag", instructions: "Catch 10 falling sweets", winText: "That's a lot of sugar" })),
  g("catch-candy", "game:catch-candy:trick-treat", "🎃", ["halloween"], () => ({
    title: "Trick or treat!",
    instructions: "Catch 10 sweets before the ghosts do",
    winText: "Treat! Your bag is full.",
    style: { ...LOOK.spooky, heading: "spooky", effect: "spooky", burst: "spooky", transition: "blur", stickers: corners(["🎃", "👻"], 9, "sway") },
  })),
  g("catch-candy", "game:catch-candy:sweet-shop", "🍭", ["birthday", "fun", "diwali"], () => ({
    title: "The sweet shop",
    instructions: "Catch 12 sweets for your bag",
    winText: "Sweet! Don't eat them all at once.",
    style: { ...LOOK.candy, heading: "rounded", body: "rounded", burst: "confetti", transition: "bounce", tune: { goal: 12 }, stickers: corners(["🍭", "🧁"], 9, "float") },
  })),
];
