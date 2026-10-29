import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { customAlphabet } from "nanoid";
import { DIRECTIONS, EFFECTS, FONTS, FRAMES, GAMES, MOTIONS, MUSIC, OCCASIONS, PATTERNS, THEMES, TRANSITIONS, cardSchema, screenStyle, type CardData, type Game, type Occasion, type Screen, type ScreenType } from "./card";
import { LANGUAGES, type Locale } from "@/i18n/config";
import { AI_EXAMPLES } from "./ai-examples";
import { BLANKS_FOR_AI } from "./blanks";
import type { Brief } from "./brief";
import { buildCard, getTemplate } from "./catalog";
import { pickDirection, type Direction } from "./directions";
import { GAME_GUIDE, GENTLE_TUNE, GOAL_MAX, GOAL_NOUNS, LITTLE_TUNE, MOVING, PHONE_MAX, USUAL_GOAL, hasGoal, type GoalGame } from "./games";
import { GAME_LABELS, LABELS_ON, LISTS, TEXTS, isList, type LabelKey } from "./labels";
import { getLook, type Look } from "./looks";

// Writes a whole card from a description, or changes an existing one, with Claude.
// The model replies with card JSON in the same shape the creator saves, so whatever
// comes back goes through the same validation as a card made by hand. Small mistakes
// (a quiz option twice, too many candles, a title a few letters too long) are put right
// here rather than asking again, which would mean another half a minute's wait.

const MODEL = "claude-opus-5-5";
const newId = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

// Room for a long, fully styled card plus the model's thinking, which counts towards it.
const MAX_TOKENS = 32000;
// The route stops at 300 seconds (api/generate/route.ts). Stop before that, so they still
// hear what happened and get their go back.
const TIME_MS = 280_000;
// A second go only starts if the first finished in time for another like it.
const RETRY_BEFORE_MS = 135_000;
// Asking again over something that's only not quite right is worth it only when the first go was quick.
const SOFT_RETRY_BEFORE_MS = 70_000;

// One line on each game: what it asks of the player, how many it takes and who it suits.
function gameGuide() {
  return GAMES.map((g) => `  - ${g}: ${GAME_GUIDE[g]}.`).join("\n");
}

const list = (values: readonly string[]) => values.map((v) => `"${v}"`).join(", ");

function labelGuide() {
  const say = (keys: LabelKey[]) => keys.map((k) => `${k} ${JSON.stringify(isList(k) ? LISTS[k] : TEXTS[k])}`).join(", ");
  const games = Object.entries(GAME_LABELS).map(([game, keys]) => `  - ${game}: ${say(keys ?? [])}`);
  return [...Object.entries(LABELS_ON).map(([type, keys]) => `- ${type}: ${say(keys)}`), "  And on a game screen, by game:", ...games].join("\n");
}

// Two cards written by hand (lib/ai-examples.ts), with what they were made from.
const EXAMPLES = AI_EXAMPLES.map((e, i) => `Example ${i + 1}. What they told us: ${e.request}\n${JSON.stringify({ idea: e.idea, ...e.card })}`).join("\n\n");

function withoutTemplate(card: CardData): CardData {
  const rest = { ...card };
  delete rest.template;
  return rest;
}

// The same for every request, so it stays cached: anything that changes from card to card
// (their choices, the creative direction) goes in the request instead.
const SYSTEM = `You write interactive e-cards for Envelette, a small UK shop. A card is a short run of screens that opens from a link: an envelope, then games, questions and messages, then a big finale. Most people open theirs on a phone. Every card should feel as if it could only have been made for this one person, by someone who knows them. You reply with the card as one JSON object and nothing else: no explanation and no code fences. Write the JSON compactly, without line breaks or indentation, so it reaches them sooner.

# The card
{"idea", "occasion", "theme", "ambient", "music", "to", "from", "screens"}
- idea: for a new card, one sentence under 90 characters with this card's big idea for these two people. Write it first, before anything else, then make every screen play on it. It isn't shown in the card. A card being changed doesn't need one.
- occasion: one of ${list(OCCASIONS)}. Use the closest; "friendship" or "thanks" when nothing fits.
- theme (the colours behind anything a screen's style doesn't colour, and the link's preview picture): one of ${list(THEMES)}. Pick the one closest to the card's colours.
- ambient (the background effect): one of ${list(EFFECTS.filter((e) => e !== "fireworks"))}.
- music: one of ${list(MUSIC)}.
- to: the person receiving it. from: the person sending it.
- screens: 4 to 12 screens in the order they appear. The first is always "intro" and the last is always "finale".

# Screens
Every screen has "id" (a short unique word like "intro", "quiz2") and "type". Numbers after a field are its maximum length in characters: stay well inside them. Every field must be present.
- intro: {"type":"intro","title" 120,"subtitle" 200,"button" 40}. The envelope screen. The button opens it.
- question: {"type":"question","question" 140,"yes" 30,"no" 30,"afterYes" 140}. A yes/no question; the No button runs away when they try to press it, saying its noLines as it goes.
- photos: {"type":"photos","title" 120,"photos":[],"captions":[]}. The sender adds up to 6 photos afterwards, so leave both lists empty.
- message: {"type":"message","title" 120,"body" 1500}. A letter that types itself out. Separate paragraphs with a blank line.
- game: {"type":"game","game","title" 120,"instructions" 200,"winText" 140}. game is one of these (the numbers are how many it takes to win, set with the tune's goal):
${gameGuide()}
  The instructions must describe what that game really asks them to do. Any number in a game's words is its goal: set the tune's goal to the same number, within that game's limit.
- quiz: {"type":"quiz","title" 120,"questions":[{"question" 140,"options":[2 to 4 options, 60 each, all different],"answer": index of the right option}] (1 to 6 questions),"winText" 140}
- scratch: {"type":"scratch","title" 120,"instructions" 200,"hidden" 200}. They scratch a silver panel to reveal the hidden message.
- typeit: {"type":"typeit","title" 120,"instructions" 200,"phrase" 40,"winText" 140}. They type a secret phrase; the instructions are the clue. Keep the phrase short (one to three words) and guessable from the clue, in plain letters a to z, numbers and spaces: accents and other alphabets can't be typed into it.
- wheel: {"type":"wheel","title" 120,"instructions" 200,"options":[2 to 8 prizes, 40 each],"landOn": -1 for a fair spin or the index it always lands on,"winText" 140}
- coupons: {"type":"coupons","title" 120,"instructions" 200,"coupons":[1 to 6 treats, 80 each]}
- reasons: {"type":"reasons","title" 120,"instructions" 200,"reasons":[1 to 12 reasons, 160 each]}. Notes they pull from a jar.
- slider: {"type":"slider","title" 120,"low" 30,"high" 30,"winText" 140}. A "how much" slider that only goes up.
- timeline: {"type":"timeline","title" 120,"events":[{"when" 40,"what" 160}] (1 to 8)}
- boxes: {"type":"boxes","title" 120,"instructions" 200,"prizes":[2 or 3 prizes, 80 each]}. They pick one of the mystery boxes, then the others open too, so make every prize a treat.
- finale: {"type":"finale","title" 140,"body" 600,"effect"}. effect is one of ${list(EFFECTS)}.

# How each screen looks
Every screen has a "style" that sets its look on top of the theme. If they describe the look, build it from their words: "a sunflower-yellow envelope and bees" is a yellow envelope on the intro, honey and leaf-green screens and bee stickers. If they don't, follow the creative direction you're given. Keep it tasteful: the card's few colours on every screen, varied from screen to screen (darker and lighter screens taking turns), and the same two fonts throughout.
"style": {
  "background": 1 to 3 colours; two or three make a gradient,
  "gradient": "down", "diagonal" or "glow" (lighter at the top), for how the colours run,
  "pattern": one of ${list(PATTERNS)}, drawn faintly over the background,
  "text": the colour of the words, easy to read on the background,
  "accent": the colour of the buttons and highlights,
  "envelope": the colour of the envelope (the intro only),
  "heading": the font of the titles, one of ${list(FONTS)},
  "body": the font of everything else, one of the same,
  "effect": what's going on in the background of this screen, instead of the card's ambient, one of ${list(EFFECTS)} ("fireworks" keeps going off in the sky),
  "burst": what bursts out at this screen's big moment, one of ${list(EFFECTS)}: when the envelope opens on the intro, when they say yes, win a game, finish the quiz, scratch it off, solve the phrase, the wheel lands, open a box, reach 100% or empty the jar. Without one, these moments throw confetti (the intro does nothing),
  "stickers": up to 10 emoji placed around the screen: [{"emoji": one emoji, "x": 0 to 100 (% from the left), "y": 0 to 100 (% from the top), "size": 4 to 40 (% of the card's shorter side; 8 to 16 suits most), "rotate": -180 to 180, "motion": one of ${list(MOTIONS)}}],
  "texts": up to 8 text boxes placed anywhere: [{"text" 120, "x", "y", "size": 2 to 20 (letter height, % of the shorter side; 5 is ordinary, 10 is big), "color", "font", "rotate"}],
  "images": their own photos placed on the screen: [{"src", "x", "y", "size": 10 to 90 (width), "rotate", "frame": one of ${list(FRAMES)}, "crop": {"x": 0 to 100, "y": 0 to 100, "zoom": 1 to 4} (which part of the photo shows in its frame: zoomed in towards that point, % across and down)}]. They add these themselves; keep, move, resize, turn, crop or remove them as asked, but never make new ones. A photos screen's "crops" does the same for its photos, one for each photo in order (null for whole).
  "transition": how this screen comes in when it's reached (the animation between screens), one of ${list(TRANSITIONS)}. Without one it rises gently into place,
  "tune": how this screen plays: {"speed": 0.25 to 3 (1 is normal, 0.5 half speed, 2 twice as fast: how fast a game's pieces move and appear, how fast the ghosts pop up, how quickly the hug fills, how fast the message types itself out, how long the wheel spins), "goal": 1 to 40 (how many it takes to win a game, within each game's limit above), "size": 0.5 to 2.5 (how big a catching game's pieces or the ghosts are), "from": one of ${list(DIRECTIONS)} (where a catching game's pieces come from: falling from the top, rising from the bottom, across from either side, or popping up all over)}
}
- Every part is optional. Colours are always six-digit hex.
- The fonts: classic is an elegant serif, modern a clean sans-serif, handwritten casual handwriting, storybook a soft old-style serif, script a flowing wedding script, rounded bubbly and friendly, bold a chunky modern headline, typewriter an old typewriter, marker a thick felt-tip pen and spooky a dripping horror font. For the body, use one that's easy to read in a long letter: modern, classic, storybook, rounded or typewriter.
- Put stickers near the edges and corners (x under 15 or over 85, or y under 14 or over 86) so they don't cover the words, 2 to 5 on a screen. Keep the top right corner clear (x over 80 with y under 16): the sound button sits there.

# The words built into the screens
Screens also say a few things of their own: the envelope's "You've got mail", the Next buttons, the excuses the runaway No button makes, a game's "Keep shaking…". Left out, they say the usual thing. To change them on a screen, give it "labels" with just the ones to change, e.g. "labels": {"next": "Onwards", "noLines": ["Nope", "Try again"]}. Do this when they ask for particular wording, or when a line would clearly suit the card better. Each screen's labels and what they usually say ({i}, {n} and {moves} become numbers; lists are said in turn):
${labelGuide()}

# Make it theirs
- Every screen uses something they told you: a name, nickname, place, hobby, pet, joke or habit. If they told you little, use something true of this relationship and occasion (a big sister, a grandad, a first Diwali in a new home). If a line could go in anyone's card, rewrite it.
- The idea runs through the whole card: the titles, a game's instructions and win line, the No button's excuses, the finale.
- Never invent shared memories or facts about the two of them. If they didn't give you details, write questions and lines that are playful rather than factual ("Who's the better cook?" with the answer being the sender).
- On every question screen, write labels.noLines: 5 to 8 excuses in the card's voice that use their details. On every quiz, write labels.wrongLines in the same voice.
- Give the envelope's button, and a Next button or two, words that suit this card rather than "Open it" and "Next".
- Pick stickers from their details and the idea (a football for the Arsenal fan, the cat, a bowl of ramen), not just from the occasion.
- In a quiz, the right answer moves about from question to question.
- Sign the letter once, at the end of the message. The finale doesn't sign it again.
- Don't guess anyone's gender. Use their name or "you" unless the relationship or what they told you makes it clear (mum, sister, "she").

# Who's playing
- Most people open their card on a phone, with one thumb, so every game must work with taps. Use cursor-chase only when they ask for a game to play on a computer.
- Grandparents, anyone they say is older or not used to phones, and any card they want kept gentle: 4 to 7 screens; only easy screens and games (hold-hug, grow-flower, unwrap-gift, light-diyas, release-lanterns, blow-candles, launch-fireworks, a catching game slowed down, scratch, boxes, coupons, reasons, slider, timeline, a yes/no question); on games with moving pieces a tune with speed 0.7 and size 1.5; a goal of 6 or fewer; no typeit, memory-match, shake-it, whack-ghosts or cursor-chase; clear fonts (storybook, classic, rounded or modern for the body, never script for anything long); short, warm sentences and a longer letter. A quiz has at most 3 easy questions.
- Small children (under 5): 4 to 6 screens, very few words, big pieces (tune size 1.6, speed 0.8, a goal of 8 or fewer), rounded or handwritten fonts, games that are just tapping (catching games, pop-balloons, bubble-wrap, unwrap-gift, hold-hug, grow-flower). No typeit and no quiz: a grown-up will be reading it to them.
- Children (5 to 12): bright and silly, short words, any tapping game, a quiz about the things they love.
- Teenagers: funny and never babyish; quick games (whack-ghosts, shake-it, slot-machine, bubble-wrap) suit them.
- Colleagues and leaving cards: warm but not intimate.

# Defaults to avoid (they make every card look the same)
- Colours: navy with gold (like #0a1633, #14254f and #d4af37) and a classic serif, or a black-and-gold finale, unless they ask for them.
- Stickers: only ⭐ ✨ 🌟 💗 💕 🎈 🎉.
- Effects: fireworks for every finale, confetti for every burst, sparkles behind everything.
- Words: "Open it" on the envelope's button; titles like "A little note", "A message for you", "Quick quiz" or "Our memories"; lines like "favourite person to do nothing with", "your laugh, especially when you're trying not to", "another year of being amazing", "you deserve the world", "words can't describe", "I'm so lucky to have you"; endings that start "Here's to…"; age jokes about knees, vitamins, bedtime or being old, unless they ask for them.
- Quiz options that repeat a word ("Toast", "Toast", "Also toast"), or the right answer in the same place every time.
- The same run of screens every time: intro, a game, photos, message, finale.

# Writing it
- Use everything they told you: names, nicknames, inside jokes, places, hobbies. Specific beats generic every time.
- If they describe the card screen by screen, or pick the screens, build exactly that: the same screens in the same order (or the order that plays best, if they only picked them), each doing what they described, using the closest screen type and game. Don't add screens they didn't ask for (apart from the intro at the start and the finale at the end) and don't leave any out. If something can't be done with these screens, do the closest thing that can.
- If they don't, design a card that suits these two people and the occasion, in the shape you're given. Include at least two playful screens and a heartfelt message near the end; a photos screen is welcome but not required.
- Sound like a person, not a greeting card factory: warm, a bit funny where it fits. Use emoji in the words sparingly or not at all.
- Write in the language their description is written in. If it's only names and choices, use the language you're told the site is in. For English, use British spelling.
- Take the theme, background effect, finale effect and music from what they describe too. If they don't say, follow the creative direction.

# Changing a card
If you're given an existing card and a change, return the whole card with that change made. Keep everything they didn't ask to change exactly as it is, including screen ids. Photos appear as "photo-1", "photo-2" and so on: keep, move or drop those as asked, but never make new ones.
- Do whatever they ask that these screens, styles, labels, bursts, effects, transitions and tunes can do; that's almost everything. "Fireworks when the envelope opens" is a fireworks burst on the intro; "change Next to Let's go" is the next label; "add a game after this" is a new game screen after it; "a different animation between the screens" is a transition on each screen; "slow the balloons down and send them all over" is a tune with a lower speed and "from": "everywhere"; "make it 5 to win" is a tune goal.
- They can ask for changes to one screen, several ("screens 2 and 3", "the quiz and the wheel") or every screen. Screens are numbered from 1 in the order they appear.
- A card has at most 12 screens. If a change would take it past that, say so in the note and do the closest thing you can.
- These exact words are blanks on a ready-made screen they added and haven't written yet: ${BLANKS_FOR_AI} (a message's blank may have a sign-off after it). Other words that just happen to start with "Type", like a clue they or a design wrote, are real: keep them. Leave blanks as they are unless they ask you to write or fill in the words (on that screen or the whole card) or to change that screen's words; then replace every blank on it with real words that suit the card. Don't invent memories or facts they didn't give you: keep a timeline playful and general, or leave its blanks. When you fill any in, say so in the note.
- Also add "note" to the card: one or two short, friendly sentences telling them what you changed, in plain words, like "Fireworks now burst out of the envelope when it opens." If something they asked for can't be done, say so plainly in the note and what you did instead.

# Two examples of the standard we want
They show the quality and the JSON, not a card to copy: never reuse their words, jokes, colours or order of screens.
${EXAMPLES}

# Before you reply, check
- Does every screen use something of theirs, and play on the idea?
- Is anything from the defaults to avoid in it?
- If they picked or described the screens, is it exactly those?
- Does every number in a game's words match its goal, within that game's limit?
- Is every option in each quiz question different?
- Is every text within its length, and every colour six-digit hex?`;

export type GenerateInput = {
  prompt: string;
  to: string;
  from: string;
  // The card to change. Without one, a new card is written.
  card?: CardData;
  // A design to start a new card from.
  template?: string;
  // Keep that design exactly as it is and only write its words.
  keepDesign?: boolean;
  // The screen they're looking at, when the change is about that screen.
  focus?: string;
  // The language the site is shown in, for new cards.
  locale?: Locale;
  // The choices from the questions, for a new card (see lib/brief.ts).
  brief?: Brief;
  // The creative directions of their last few cards, to steer clear of (lib/directions.ts).
  avoid?: string[];
};

export class GenerateError extends Error {
  constructor(
    public reason: "off" | "busy" | "refused" | "failed",
    message?: string,
  ) {
    super(message ?? reason);
  }
}

let client: Anthropic | undefined;

export function generateReady() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

// Photo links are swapped for placeholders on the way out and back again on the way in,
// so the model can move photos around but can't make up new links.
function hidePhotos(card: CardData) {
  const urls: string[] = [];
  const hide = (url: string) => {
    urls.push(url);
    return `photo-${urls.length}`;
  };
  const screens = card.screens.map((s) => {
    // Photos placed on any screen, as well as a photos screen's own.
    const images = s.style?.images?.map((img) => ({ ...img, src: hide(img.src) }));
    const screen = images ? { ...s, style: { ...s.style, images } } : s;
    return screen.type === "photos" ? { ...screen, photos: screen.photos.map(hide) } : screen;
  });
  return { card: { ...card, screens }, urls };
}

function restorePhotos(screen: Raw, urls: string[]) {
  const url = (p: unknown) => urls[Number(/^photo-(\d+)$/.exec(String(p))?.[1]) - 1];
  const style = screen.style as { images?: unknown } | undefined;
  if (style && typeof style === "object" && Array.isArray(style.images)) {
    const images = style.images.map((img) => (img && typeof img === "object" ? { ...img, src: url((img as { src?: unknown }).src) } : img)).filter((img) => img?.src);
    screen = { ...screen, style: { ...style, images } };
  }
  if (screen.type !== "photos") return screen;
  const photos = Array.isArray(screen.photos) ? screen.photos : [];
  const captions = Array.isArray(screen.captions) ? screen.captions : [];
  const kept = photos.map(url);
  return { ...screen, photos: kept.filter(Boolean), captions: captions.filter((_, i) => i >= photos.length || kept[i]) };
}

// A screen's look, keeping the parts that are right rather than failing the whole card
// over one: "#fff" is read as "#ffffff", numbers out of range are brought in, and
// anything else that's wrong is left out.
function tidyStyle(style: unknown) {
  if (!style || typeof style !== "object" || Array.isArray(style)) return undefined;
  const fields = screenStyle.shape as Record<string, { safeParse: (v: unknown) => { success: boolean; data?: unknown } }>;
  const longHex = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{3}$/i.test(v) ? `#${[...v.slice(1)].map((c) => c + c).join("")}` : v);
  const clamp = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : v);
  const out: Raw = {};
  for (const [key, raw] of Object.entries(style)) {
    let value = Array.isArray(raw) && key === "background" ? raw.map(longHex) : longHex(raw);
    // Lists keep the items that are right, with numbers brought into range.
    const items = (max: number, size: [number, number]) =>
      (raw as unknown[])
        .filter((s): s is Raw => Boolean(s) && typeof s === "object")
        .map((s) => ({ ...s, x: clamp(s.x, 0, 100), y: clamp(s.y, 0, 100), size: clamp(s.size, ...size), rotate: clamp(s.rotate, -180, 180), ...("crop" in s ? { crop: tidyCrop(s.crop) } : {}) }))
        .filter((s) => fields[key].safeParse([s]).success)
        .slice(0, max);
    if (Array.isArray(raw) && key === "stickers") value = items(10, [4, 40]);
    if (Array.isArray(raw) && key === "texts") value = items(8, [2, 20]);
    if (Array.isArray(raw) && key === "images") value = items(6, [10, 90]);
    // How a screen plays, with each number brought into range.
    if (key === "tune" && raw && typeof raw === "object" && !Array.isArray(raw)) {
      const t = raw as Raw;
      value = { ...t, speed: clamp(t.speed, 0.25, 3), goal: typeof t.goal === "number" ? clamp(Math.round(t.goal), 1, 40) : t.goal, size: clamp(t.size, 0.5, 2.5) };
    }
    const parsed = fields[key]?.safeParse(value);
    if (parsed?.success) out[key] = parsed.data;
  }
  return Object.keys(out).length ? out : undefined;
}

// Which part of a photo shows, with numbers brought into range, or nothing if it isn't one.
function tidyCrop(crop: unknown) {
  if (!crop || typeof crop !== "object") return undefined;
  const { x, y, zoom } = crop as Raw;
  if (![x, y, zoom].every((v) => typeof v === "number" && Number.isFinite(v))) return undefined;
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  return { x: clamp(x as number, 0, 100), y: clamp(y as number, 0, 100), zoom: clamp(zoom as number, 1, 4) };
}

// A screen's own wording for its built-in words, keeping the ones that fit: known
// labels only, a list where a list goes, and nothing too long.
function tidyLabels(labels: unknown) {
  if (!labels || typeof labels !== "object" || Array.isArray(labels)) return undefined;
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(labels)) {
    if (isList(key)) {
      const lines = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => cut(v.trim(), 80)) : [];
      if (lines.length) out[key] = lines.slice(0, 12);
    } else if (key in TEXTS && typeof value === "string" && value.trim()) out[key] = cut(value.trim(), 160);
  }
  return Object.keys(out).length ? out : undefined;
}

// Words over their limit, cut at the last whole sentence (in a long letter) or word rather
// than failing the whole card over a few letters.
function cut(text: string, max: number) {
  if (text.length <= max) return text;
  const dots = max > 40 ? "…" : "";
  const room = text.slice(0, max - dots.length);
  if (max >= 400) {
    const end = Math.max(...[". ", "! ", "? ", ".\n", "!\n", "?\n"].map((s) => room.lastIndexOf(s)));
    if (end > max * 0.6) return room.slice(0, end + 1).trim();
  }
  const space = room.lastIndexOf(" ");
  const kept = (space > max * 0.5 ? room.slice(0, space) : room).replace(/[\uD800-\uDBFF]$/, "").replace(/[\s,;:–—-]+$/, "");
  return kept + dots;
}

// What each kind of screen holds, read from the card's own rules (lib/card.ts), so the
// lengths and list sizes here can never drift from them.
type Rule = {
  def: { type: string; innerType?: Rule; element?: Rule; checks?: { _zod: { def: { check: string; maximum?: number } } }[] };
  maxLength?: number | null;
  shape?: Record<string, Rule>;
};
const SCREEN_RULES = new Map(cardSchema.shape.screens.element.options.map((o) => [o.shape.type.value as string, o as unknown as Rule]));
const SCREEN_TYPES = new Set<string>(SCREEN_RULES.keys());
// The parts of a screen that aren't its words, or are looked after elsewhere.
const NOT_FITTED = new Set(["id", "type", "style", "labels", "photos", "crops"]);

function fit(rule: Rule, value: unknown): unknown {
  const { def } = rule;
  if ((def.type === "optional" || def.type === "nullable") && def.innerType) return value == null ? value : fit(def.innerType, value);
  if (def.type === "string") return typeof value === "string" && rule.maxLength != null ? cut(value.trim(), rule.maxLength) : value;
  if (def.type === "array" && def.element && Array.isArray(value)) {
    const max = def.checks?.map((c) => c._zod.def).find((c) => c.check === "max_length")?.maximum;
    return value.slice(0, max ?? value.length).map((v) => fit(def.element!, v));
  }
  if (def.type === "object" && rule.shape && isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rule.shape?.[k] ? fit(rule.shape[k], v) : v]));
  return value;
}

function fitScreen(screen: Raw): Raw {
  const rule = SCREEN_RULES.get(String(screen.type));
  if (!rule?.shape) return screen;
  return Object.fromEntries(Object.entries(screen).map(([k, v]) => [k, !NOT_FITTED.has(k) && rule.shape?.[k] ? fit(rule.shape[k], v) : v]));
}

// The same words, give or take capitals, spaces and a full stop.
const sameWords = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?…]+$/, "");

// A quiz option said twice is kept once, with the right answer still pointing at it; an
// answer that isn't one of the options is brought in. Otherwise tapping the second copy of
// the right answer says "Wrong!".
function tidyQuiz(screen: Raw): Raw {
  if (!Array.isArray(screen.questions)) return screen;
  const questions = screen.questions.filter(isObj).flatMap((q) => {
    const all = Array.isArray(q.options) ? q.options.filter(isText) : [];
    const given = typeof q.answer === "number" && Number.isFinite(q.answer) ? Math.round(q.answer) : 0;
    const right = all[Math.min(Math.max(given, 0), Math.max(all.length - 1, 0))];
    const options: string[] = [];
    for (const o of all) if (!options.some((k) => sameWords(k) === sameWords(o))) options.push(o);
    let answer = right === undefined ? 0 : Math.max(0, options.findIndex((o) => sameWords(o) === sameWords(right)));
    // Four at most, keeping the right one.
    let kept = options.slice(0, 4);
    if (answer >= 4) {
      kept = [...options.slice(0, 3), options[answer]];
      answer = 3;
    }
    return kept.length >= 2 ? [{ ...q, options: kept, answer }] : [];
  });
  // With no question left, it stays as it was and is reported.
  return questions.length ? { ...screen, questions: questions.slice(0, 6) } : screen;
}

// A wheel that always lands on a slice it doesn't have spins fairly instead.
function tidyWheel(screen: Raw): Raw {
  if (!Array.isArray(screen.options)) return screen;
  let options = screen.options.filter(isText);
  let landOn = typeof screen.landOn === "number" && Number.isFinite(screen.landOn) ? Math.round(screen.landOn) : -1;
  if (options.length > 8) {
    if (landOn >= 8 && landOn < options.length) {
      options = [...options.slice(0, 7), options[landOn]];
      landOn = 7;
    } else options = options.slice(0, 8);
  }
  if (landOn < -1 || landOn >= options.length) landOn = -1;
  return { ...screen, options, landOn };
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const BIG_WORDS: Record<string, number> = { thirty: 30, forty: 40 };
const numberIn = (word: string) => (/^\d+$/.test(word) ? Number(word) : (BIG_WORDS[word.toLowerCase()] ?? NUMBER_WORDS.indexOf(word.toLowerCase())));

// A count just before what the game counts, with up to two words between ("all 7 little
// candles"), but not "30 years of candles", "Happy 30th" or "one heart at a time".
function counts(game: GoalGame) {
  const words = [...NUMBER_WORDS.slice(2), ...Object.keys(BIG_WORDS)].join("|");
  const between = "(?:\\s+(?!(?:years?|yrs|days?|weeks?|months?|hours?|minutes?|mins?|seconds?)\\b)[\\p{L}'’-]+){0,2}";
  return new RegExp(`\\b(\\d{1,2}|${words})${between}\\s+(?:${GOAL_NOUNS[game].join("|")})\\b`, "giu");
}

const GAME_WORDS = ["instructions", "title", "winText"] as const;

// How a game plays, made to match its words and the player: the number in "Blow out all 7
// candles" is how many it takes to win, never more than the game can show (and the words
// say so if it was), and gentle cards play slower with bigger pieces.
function tidyGame(screen: Raw, fix: Fix): Raw {
  const game = String(screen.game) as Game;
  const style = isObj(screen.style) ? screen.style : {};
  const tune: Raw = isObj(style.tune) ? { ...style.tune } : {};
  const out: Raw = { ...screen };
  if (fix.tune && MOVING.includes(game)) {
    tune.speed = Math.min(typeof tune.speed === "number" ? tune.speed : 1, fix.tune.speed);
    tune.size = Math.max(typeof tune.size === "number" ? tune.size : 1, fix.tune.size);
  }
  if (hasGoal(game)) {
    // More than fit across a phone can't all be tapped there, so the game could never be won.
    const cap = Math.min(GOAL_MAX[game], fix.desktop ? 40 : (PHONE_MAX[game] ?? 40), fix.tune?.goal ?? 40);
    // An odd number of petals, so it ends on "loves me".
    const allowed = (n: number) => {
      const v = Math.min(cap, Math.max(1, Math.round(n)));
      return game === "loves-me-not" && v % 2 === 0 ? Math.max(1, v - 1) : v;
    };
    const said = GAME_WORDS.flatMap((f) => (typeof out[f] === "string" ? [...(out[f] as string).matchAll(counts(game))].map((m) => numberIn(m[1])) : [])).find((n) => n > 0);
    const goal = said !== undefined ? allowed(said) : typeof tune.goal === "number" ? allowed(tune.goal) : USUAL_GOAL[game] > cap ? allowed(cap) : undefined;
    if (goal !== undefined) tune.goal = goal;
    if (said !== undefined && goal !== undefined)
      for (const f of GAME_WORDS) {
        if (typeof out[f] === "string") out[f] = (out[f] as string).replace(counts(game), (whole, n: string) => (numberIn(n) === goal ? whole : whole.replace(n, String(goal))));
      }
  }
  if (Object.keys(tune).length) out.style = { ...style, tune };
  return out;
}

// Stickers in the top right corner would sit under the sound button: over to the left they go.
function clearCorner(screen: Raw): Raw {
  const style = screen.style;
  if (!isObj(style) || !Array.isArray(style.stickers)) return screen;
  const stickers = style.stickers.map((s) => (isObj(s) && typeof s.x === "number" && typeof s.y === "number" && s.x > 82 && s.y < 16 ? { ...s, x: 100 - s.x } : s));
  return { ...screen, style: { ...style, stickers } };
}

// How a screen counts against the screens they picked ("quiz", "game:blow-candles").
const kitKeys = (s: Raw) => (s.type === "game" ? [`game:${String(s.game)}`, "game"] : [String(s.type)]);

// A new card opens with the envelope and ends with the finale, wherever they were written,
// and has 12 screens at most: extra ones go from just before the finale, a second of the
// same kind first, keeping the letter, the photos and anything they asked for.
function tidyOrder(screens: Raw[], fix: Fix): Raw[] {
  const out = [...screens];
  const intro = out.findIndex((s) => s.type === "intro");
  if (intro > 0) out.unshift(...out.splice(intro, 1));
  const finale = out.findLastIndex((s) => s.type === "finale");
  if (finale >= 0 && finale < out.length - 1) out.push(...out.splice(finale, 1));
  const keep = (s: Raw) => ["intro", "finale", "message", "photos"].includes(String(s.type)) || kitKeys(s).some((k) => fix.include.includes(k));
  const twice = (s: Raw) => out.filter((o) => kitKeys(o)[0] === kitKeys(s)[0]).length > 1;
  while (out.length > 12) {
    const spare = (s: Raw, i: number) => i > 0 && i < out.length - 1 && !keep(s);
    const at = [out.findLastIndex((s, i) => spare(s, i) && twice(s)), out.findLastIndex(spare)].find((i) => i >= 0) ?? -1;
    if (at < 0) break;
    out.splice(at, 1);
  }
  return out;
}

// Puts right what can be put right on each screen.
function repairScreens(screens: Raw[], fix: Fix): Raw[] {
  const fixed = screens.map((s) => {
    try {
      // Quizzes and wheels first, so cutting their lists down to size keeps the right answer.
      let screen = s.type === "quiz" ? tidyQuiz(s) : s.type === "wheel" ? tidyWheel(s) : s;
      screen = fitScreen(screen);
      if (screen.type === "game") screen = tidyGame(screen, fix);
      return fix.fresh ? clearCorner(screen) : screen;
    } catch (e) {
      // A repair that goes wrong mustn't cost them the card: the checks still run.
      console.error("couldn't tidy a generated screen", e);
      return s;
    }
  });
  return fix.fresh ? tidyOrder(fixed, fix) : fixed;
}

// What the repairs need to know about the card being made.
type Fix = {
  // A new card, written now (not one being changed, nor a design's words).
  fresh: boolean;
  // Made for a computer, where long rows of pieces fit.
  desktop: boolean;
  // How the games may play at most, for grandparents or small children.
  tune?: { size: number; speed: number; goal: number };
  // The screens they picked, by screen-kit key.
  include: string[];
};

// Everything worked out once for a request: how to put the card right, the look they
// picked and the creative direction.
type Plan = { kind: "card" | "change"; fix: Fix; look?: Look; direction?: Direction };

type Result = { card: CardData; note?: string; idea?: string; problem?: string };

// Pulls the JSON out of the reply and makes it a valid card, or says what's wrong. A card
// that's valid but not quite what they asked for comes back with a problem too.
function toCard(text: string, input: GenerateInput, urls: string[], plan: Plan): Result | { problem: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return { problem: "That wasn't valid JSON." };
  }
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { screens?: unknown }).screens)) return { problem: "The card needs a screens list." };
  const draft = raw as Raw & { screens: Raw[] };
  // Ids only need to be unique; fix them rather than fail.
  const seen = new Set<string>();
  draft.screens = draft.screens.filter(isObj).map((s) => {
    let id = typeof s.id === "string" && s.id.trim() ? s.id.trim().slice(0, 40) : newId();
    if (seen.has(id)) id = newId();
    seen.add(id);
    // Photo links back first, so the look is checked with the real ones.
    const restored = restorePhotos({ ...s, id }, urls);
    const tidy: Raw = { ...restored, style: tidyStyle(restored.style), labels: tidyLabels(restored.labels) };
    // A photos screen's crops only where they make sense, one per photo.
    if ("crops" in tidy) {
      const crops = tidy.crops;
      tidy.crops = Array.isArray(crops) && Array.isArray(tidy.photos) ? tidy.photos.map((_, i) => tidyCrop(crops[i]) ?? null) : undefined;
    }
    return tidy;
  });
  draft.screens = repairScreens(draft.screens, plan.fix);
  if (typeof draft.to !== "string" || !draft.to.trim()) draft.to = input.to;
  if (typeof draft.from !== "string" || !draft.from.trim()) draft.from = input.from;
  if (draft.ambient === "fireworks") draft.ambient = "sparkles";
  // What the model says it changed, its idea for the card and whether they gave their own
  // colours, for us; not part of the card.
  const note = typeof draft.note === "string" ? draft.note.trim().slice(0, 400) : undefined;
  const idea = typeof draft.idea === "string" ? draft.idea.trim().slice(0, 200) : undefined;
  const ownColours = draft.ownColours === true;
  delete draft.note;
  delete draft.idea;
  delete draft.ownColours;
  delete draft.template;
  // Size and layout aren't the model's to choose; keep the card's own.
  draft.device = input.card?.device ?? "everywhere";
  draft.layout = input.card?.layout ?? "standard";
  const parsed = cardSchema.safeParse(draft);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(".")}: ${i.message}`);
    return { problem: `The card didn't fit the format:\n${issues.join("\n")}` };
  }
  const { screens } = parsed.data;
  // A new card opens with the envelope and ends with the finale. A card being changed keeps
  // whatever order they've arranged in the editor.
  if (!input.card && (screens[0]?.type !== "intro" || screens.at(-1)?.type !== "finale")) return { problem: "The first screen must be the intro and the last the finale." };
  const card = plan.fix.fresh ? keepChoices(parsed.data, input, plan.look, ownColours) : parsed.data;
  const missing = plan.fix.fresh ? missingScreens(card, plan.fix.include) : [];
  return {
    card,
    note: note || undefined,
    idea: idea || undefined,
    problem: missing.length ? `They picked these screens and the card doesn't have them: ${missing.map(screenWords).join(", ")}. Add them, keeping everything else.` : undefined,
  };
}

// What they chose in the questions, made so whatever the model wrote: the music they
// picked, and the look's colours and their favourite colour unless they described colours
// of their own.
function keepChoices(card: CardData, input: GenerateInput, look: Look | undefined, ownColours: boolean): CardData {
  const brief = input.brief;
  if (!brief) return card;
  let out = brief.music ? { ...card, music: brief.music } : card;
  if (ownColours) return out;
  if (look) out = { ...out, theme: look.theme, screens: out.screens.map((s) => (s.type === "intro" ? { ...s, style: { ...s.style, envelope: look.envelope } } : s)) };
  const accent = brief.accent;
  if (accent) out = { ...out, screens: out.screens.map((s) => ({ ...s, style: { ...s.style, accent } }) as Screen) };
  return out;
}

// The screens they picked that the card leaves out.
function missingScreens(card: CardData, include: string[]) {
  const have = card.screens.flatMap((s) => kitKeys(s as unknown as Raw));
  const missing: string[] = [];
  for (const key of include) {
    const at = have.indexOf(key);
    if (at >= 0) have.splice(at, 1);
    else missing.push(key);
  }
  return missing;
}

const SCREEN_NAMES: Record<ScreenType, string> = {
  intro: "the envelope",
  question: "a yes/no question",
  photos: "a photos screen",
  message: "a message",
  game: "a game",
  quiz: "a quiz",
  scratch: "a scratch panel",
  typeit: "a secret phrase to type",
  wheel: "a wheel",
  coupons: "a coupon book",
  reasons: "a jar of reasons",
  slider: "a how-much slider",
  timeline: "a timeline",
  boxes: "mystery boxes",
  finale: "the finale",
};

const screenWords = (key: string) => (key.startsWith("game:") ? `the "${key.slice(5)}" game` : `${SCREEN_NAMES[key as ScreenType] ?? key} ("${key}")`);

// The screens they picked that this card can have: screen types, or "game:" and a game.
function picked(include: string[] | undefined) {
  return (include ?? []).filter((k) => (k.startsWith("game:") ? (GAMES as readonly string[]).includes(k.slice(5)) : SCREEN_TYPES.has(k) || k === "game"));
}

// Puts the words that were written into the design, so only the words can change: the
// screens, their order, games, list lengths, colours and music stay as the design has them.
const NOT_WORDS = new Set(["id", "type", "game", "effect", "photos", "captions", "landOn", "style"]);

function copyWords(design: unknown, written: unknown): unknown {
  if (typeof design === "string") return typeof written === "string" && written.trim() ? written : design;
  if (Array.isArray(design)) return design.map((item, i) => copyWords(item, Array.isArray(written) ? written[i] : undefined));
  if (design && typeof design === "object") {
    const from = (written && typeof written === "object" ? written : {}) as Raw;
    const out = Object.fromEntries(Object.entries(design).map(([k, v]) => [k, NOT_WORDS.has(k) ? v : copyWords(v, from[k])]));
    // A quiz's right answer goes with its new options, as long as it's one of them.
    if ("answer" in out && Array.isArray(out.options)) {
      const answer = from.answer;
      if (typeof answer === "number" && Number.isInteger(answer) && answer >= 0 && answer < out.options.length) out.answer = answer;
    }
    return out;
  }
  return design;
}

function fillDesign(design: CardData, written: CardData): CardData {
  const screens = design.screens.map((screen, i) => {
    const match = written.screens.find((s) => s.id === screen.id && s.type === screen.type) ?? (written.screens[i]?.type === screen.type ? written.screens[i] : undefined);
    return match ? (copyWords(screen, match) as Screen) : screen;
  });
  const parsed = cardSchema.safeParse({ ...design, screens });
  if (!parsed.success) return design;
  // The new words checked again against the design's games and quizzes (a number of
  // candles, an option said twice), keeping the words as written if that goes wrong.
  const fix: Fix = { fresh: false, desktop: design.device === "desktop", include: [] };
  const repaired = cardSchema.safeParse({ ...parsed.data, screens: repairScreens(parsed.data.screens as unknown as Raw[], fix) });
  return repaired.success ? repaired.data : parsed.data;
}

// Grandparents (as picked, or typed in a few languages), not grandchildren.
const GRANDPARENT = /\b(?:gran|granny|grandma|grandmother|grandpa|grandfather|grandad|granddad|grandparents?|grandmum|nan|nana|nanna|nani|nanu|naniji|nanaji|dadi|dadiji|gramps|grampa|oma|opa|abuela|abuelo|abuelos|babcia|dziadek|dziadkowie|mamie|papy|grand-?m[eè]re|grand-?p[eè]re|grands-parents)\b/i;

// Who will be playing, from their choices: gentle games for grandparents and anyone who asked.
function players(brief?: Brief) {
  const gentle = Boolean(brief?.gentle || brief?.age === "older" || (brief?.relation && GRANDPARENT.test(brief.relation)));
  return { gentle, little: brief?.age === "little" };
}

// The occasion, from their words, when the questions didn't ask (the describe box).
const OCCASION_WORDS: [Occasion, RegExp][] = [
  ["birthday", /\b(birthday|bday|b-day|turns? \d{1,3}|\d{1,3}(st|nd|rd|th) birthday)\b/i],
  ["christmas", /\b(christmas|xmas)\b/i],
  ["diwali", /\b(diwali|deepavali)\b/i],
  ["eid", /\beid\b/i],
  ["valentine", /\bvalentine/i],
  ["anniversary", /\banniversary\b/i],
  ["wedding", /\b(wedding|getting married|engaged|engagement)\b/i],
  ["newbaby", /\b(new baby|newborn|baby (boy|girl)|just had a baby)\b/i],
  ["getwell", /\b(get well|feel better|recover|recovery|surgery|operation|hospital)\b/i],
  ["halloween", /\bhalloween\b/i],
  ["newyear", /\bnew year\b/i],
  ["mothersday", /\bmother'?s'? day\b/i],
  ["fathersday", /\bfather'?s'? day\b/i],
  ["rakhi", /\b(rakhi|raksha bandhan)\b/i],
  ["holi", /\bholi\b/i],
  ["sorry", /\b(sorry|apologi[sz]e)\b/i],
  ["congrats", /\b(congrat\w*|well done|passed|graduat\w+|promotion)\b/i],
  ["leaving", /\b(leaving|retire\w*|retirement|farewell|moving away)\b/i],
  ["missyou", /\bmiss(ing)? you\b/i],
  ["thanks", /\b(thank you|thanks)\b/i],
];

const guessOccasion = (text: string) => OCCASION_WORDS.find(([, words]) => words.test(text))?.[0];

const LENGTHS = { short: "short: 4 or 5 screens, and short words", medium: "medium: 6 to 8 screens", long: "long: 9 to 12 screens and a longer letter" };
const AGES = {
  little: "a small child, under 5 (follow the guide for small children)",
  child: "a child, 5 to 12",
  teen: "a teenager",
  adult: "a grown-up",
  older: "someone older (follow the guide for grandparents)",
};

// The choices from the questions, written out for the model. For a design's words, only
// what shapes the words.
function choices(brief: Brief | undefined, include: string[], wordsOnly: boolean) {
  if (!brief) return "";
  const { gentle, little } = players(brief);
  const tones = brief.tones ?? [];
  const lines: string[] = [];
  if (brief.occasion) lines.push(`- Occasion: "${brief.occasion}".`);
  if (brief.relation) lines.push(`- Who they are to the sender: ${brief.relation}.`);
  if (tones.length) lines.push(`- How it should feel, most important first: ${tones.join(", then ")}. Lead with ${tones[0]}${tones.length > 1 ? "; the others come through in places" : ""}.`);
  if (!wordsOnly && include.length)
    lines.push(`- The screens they picked: ${include.map(screenWords).join(", ")}. Build exactly these, in the order that plays best, with the intro first and the finale last: no others, and none left out.`);
  if (!wordsOnly && brief.length) lines.push(include.length ? `- Length: ${brief.length}, in how much each screen says (the screens are the ones they picked).` : `- Length: ${LENGTHS[brief.length]}.`);
  if (brief.age) lines.push(`- Who's opening it: ${AGES[brief.age]}.`);
  if (gentle && brief.age !== "older") lines.push(wordsOnly ? "- Keep it gentle: short, clear, warm sentences." : '- Keep it gentle and easy: follow the guide for grandparents in "Who\'s playing".');
  if (little && wordsOnly) lines.push("- Very few words, for a grown-up to read aloud.");
  if (brief.about) lines.push(`- About them, in the sender's words: "${brief.about}". Use these details all through the card.`);
  if (!wordsOnly && brief.music) lines.push(`- Music: "${brief.music}".`);
  if (!wordsOnly && brief.surprise) lines.push("- They left the design to us, so surprise them.");
  return lines.length ? `# What they chose in the questions\n${lines.join("\n")}\n\n` : "";
}

function request(input: GenerateInput, plan: Plan): { message: string; urls: string[]; design?: CardData } {
  const prompt = `<request>\n${input.prompt}\n</request>`;
  if (input.card) {
    const { card, urls } = hidePhotos(withoutTemplate(input.card));
    const screen = input.card.screens.find((s) => s.id === input.focus);
    const about = screen
      ? `\n\nThey're looking at screen ${input.card.screens.indexOf(screen) + 1} of ${input.card.screens.length} (id "${screen.id}", a ${screen.type} screen), so "this", "here" and "this screen" mean that one. Make the change there, unless they say which screens they mean (by number, by what's on them, "all of them", "every screen") or it's clearly about the whole card (like the colours, the music, or adding or removing screens). Leave the screens they didn't mean as they are.`
      : "";
    return { message: `Here is the card:\n${JSON.stringify(card)}${about}\n\nThe change they want:\n${prompt}`, urls };
  }
  const base = getTemplate(input.template);
  const language = input.locale && input.locale !== "en" ? `The site is in ${LANGUAGES[input.locale].english}.\n` : "";
  const names = `Their name: ${input.to}\nYour name (the sender): ${input.from}\n${language}\n`;
  if (base && input.keepDesign) {
    const design = buildCard(base, input.to, input.from);
    return {
      message: `${names}${choices(input.brief, [], true)}They picked this design:\n${JSON.stringify(withoutTemplate(design))}\n\nRewrite its words to fit what they told you. Keep the design exactly as it is: the same screens in the same order with the same ids and types, the same number of items in every list, the same game on each game screen, and the same occasion, theme, ambient, music and finale effect. Only the words change, and every one of them should feel written for these two: their names, their details, their jokes, in the feelings they picked. Start the JSON with "idea": one sentence under 90 characters with the big idea for this card, and let the words play on it. Keep any number in a game's words the same as the design's. In a quiz, make every option different and set each "answer" to the index of the right option. Leave photos empty.\n\nWhat they told you:\n${prompt}`,
      urls: [],
      design,
    };
  }
  const start = base ? `They picked this design to start from; rework it to fit what they want:\n${JSON.stringify(withoutTemplate(buildCard(base, input.to, input.from)))}\n\n` : "";
  // Their colours win over the look and their favourite colour, and we need to know when they did.
  const colours = plan.look || input.brief?.accent ? '\nIf what they told you describes colours of their own, use theirs instead, and add "ownColours": true to the card.' : "";
  const direction = plan.direction ? `${plan.direction.text}${colours}\n\n` : "";
  return { message: `${names}${choices(input.brief, plan.fix.include, false)}${direction}${start}What they want:\n${prompt}`, urls: [] };
}

// What to work out once for a request.
function planFor(input: GenerateInput): Plan {
  if (input.card) return { kind: "change", fix: { fresh: false, desktop: input.card.device === "desktop", include: [] } };
  if (input.keepDesign && getTemplate(input.template)) return { kind: "card", fix: { fresh: false, desktop: false, include: [] } };
  const brief = input.brief;
  const { gentle, little } = players(brief);
  const include = picked(brief?.include);
  const look = getLook(brief?.look);
  const direction = pickDirection({
    occasion: brief?.occasion ?? guessOccasion(input.prompt),
    tones: brief?.tones,
    avoid: input.avoid,
    gentle,
    little,
    length: brief?.length,
    screensChosen: include.length > 0,
    surprise: brief?.surprise,
    look,
    accent: brief?.accent,
  });
  const tune = gentle ? GENTLE_TUNE : little ? LITTLE_TUNE : undefined;
  return { kind: "card", fix: { fresh: true, desktop: false, tune, include }, look, direction };
}

// The screens written so far, read from the JSON as it streams in, each with its title (or
// question) once that's written. Only screens have a "type".
function screensSoFar(text: string): { screens: ScreenType[]; titles: (string | null)[] } {
  const found = [...text.matchAll(/"type"\s*:\s*"([a-z]+)"/g)].filter((m) => SCREEN_TYPES.has(m[1]));
  const titles = found.map((m, i) => {
    const part = text.slice(m.index + m[0].length, found[i + 1]?.index ?? text.length);
    const title = /"(?:title|question)"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(part);
    return title ? unquote(title[1]) : null;
  });
  return { screens: found.map((m) => m[1] as ScreenType), titles };
}

// The idea, as soon as it's written: it comes first.
const IDEA = /^[^{]*\{\s*"idea"\s*:\s*"((?:[^"\\]|\\.)*)"/;

function unquote(text: string) {
  try {
    return String(JSON.parse(`"${text}"`)).trim() || null;
  } catch {
    return null;
  }
}

type Options = {
  // Called each time another screen, or its title, has been written.
  onProgress?: (screens: ScreenType[], titles: (string | null)[]) => void;
  // Called once with the card's big idea, as soon as it's written.
  onIdea?: (idea: string) => void;
  signal?: AbortSignal;
};

// What the model is told when its reply was cut off, by kind of request.
const CUT_OFF = {
  card: "Your last reply was cut off before the end. Write the whole card again, shorter: at most 8 screens, at most 3 stickers and 2 text boxes on a screen, and fewer words.",
  change: "Your last reply was cut off before the end. Write the whole card again with the change, keeping every screen, but say things in fewer words and add no stickers or text boxes beyond the ones it has.",
};

// The card, its creative direction and big idea, and for a change, a line saying what was
// changed (or what couldn't be).
export async function generateCard(input: GenerateInput, { onProgress, onIdea, signal }: Options = {}): Promise<{ card: CardData; note?: string; direction?: string; idea?: string }> {
  if (!generateReady()) throw new GenerateError("off");
  client ??= new Anthropic();
  const started = Date.now();
  const plan = planFor(input);
  const { message, urls, design } = request(input, plan);
  // A change is quick work; a new card deserves more thought. Each keeps its own effort,
  // so each keeps its own cached prompt.
  const effort = plan.kind === "change" ? "low" : "medium";
  let messages: Anthropic.Beta.Messages.BetaMessageParam[] = [{ role: "user", content: message }];
  // A valid card that wasn't quite what they asked for, kept in case asking again fails.
  let best: { card: CardData; note?: string; idea?: string } | undefined;
  let idea: string | undefined;
  const finish = (r: { card: CardData; note?: string; idea?: string }) => ({
    card: design ? fillDesign(design, r.card) : r.card,
    note: input.card ? r.note : undefined,
    direction: plan.direction?.id || undefined,
    idea: input.card ? undefined : (r.idea ?? idea),
  });
  const log = (fields: object) => console.info(JSON.stringify({ event: "generate", kind: plan.kind, effort, direction: plan.direction?.id, ...fields }));

  for (let attempt = 1; attempt <= 2; attempt++) {
    const began = Date.now();
    const deadline = AbortSignal.timeout(Math.max(1000, TIME_MS - (began - started)));
    let reply: Anthropic.Beta.Messages.BetaMessage;
    let written = "";
    try {
      const stream = client.beta.messages.stream(
        {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          output_config: { effort },
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
          messages,
        },
        { signal: signal ? AbortSignal.any([signal, deadline]) : deadline, maxRetries: 1 },
      );
      let shown = "";
      onProgress?.([], []);
      // Read from all the text so far, not one block.
      stream.on("text", (delta) => {
        written += delta;
        if (!idea && !input.card) {
          const found = IDEA.exec(written);
          const text = found && unquote(found[1]);
          if (text) {
            idea = text;
            onIdea?.(text);
          }
        }
        if (onProgress) {
          const { screens, titles } = screensSoFar(written);
          const now = `${screens.length}:${titles.filter((t) => t !== null).length}`;
          if (now !== shown) {
            shown = now;
            onProgress(screens, titles);
          }
        }
      });
      reply = await stream.finalMessage();
    } catch (e) {
      log({ attempt, ms: Date.now() - began, error: e instanceof Anthropic.APIError ? (e.status ?? e.name) : e instanceof Error ? e.name : String(e) });
      if (signal?.aborted) throw new GenerateError("failed", "They stopped it");
      if (deadline.aborted) {
        if (best) return finish(best);
        throw new GenerateError("busy", "Ran out of time");
      }
      const busy = e instanceof Anthropic.RateLimitError || (e instanceof Anthropic.APIError && (e.status === 529 || e.status === 503));
      throw new GenerateError(busy ? "busy" : "failed", e instanceof Error ? e.message : String(e));
    }
    const usage = reply.usage;
    const text = reply.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const usageLog = {
      attempt,
      ms: Date.now() - began,
      totalMs: Date.now() - started,
      stop: reply.stop_reason,
      model: reply.model === MODEL ? undefined : reply.model,
      input: usage.input_tokens,
      output: usage.output_tokens,
      cacheRead: usage.cache_read_input_tokens,
      cacheWrite: usage.cache_creation_input_tokens,
    };
    if (reply.stop_reason === "refusal") {
      log({ ...usageLog, outcome: "refused" });
      if (best) return finish(best);
      throw new GenerateError("refused");
    }
    const elapsed = Date.now() - started;
    // Cut off: what was written can't be finished, so start again from the request, shorter.
    if (reply.stop_reason === "max_tokens") {
      log({ ...usageLog, outcome: "cut off" });
      if (elapsed > RETRY_BEFORE_MS) break;
      messages = [{ role: "user", content: `${message}\n\n${CUT_OFF[plan.kind]}` }];
      continue;
    }
    const result = toCard(text, input, urls, plan);
    const made = "card" in result ? result : undefined;
    const problem = result.problem;
    if (made && !problem) {
      log({ ...usageLog, screens: made.card.screens.length, outcome: "ok" });
      return finish(made);
    }
    log({ ...usageLog, screens: made?.card.screens.length, outcome: made ? "not quite" : "invalid", problem: problem?.slice(0, 300) });
    console.warn("generated card was off", problem);
    if (made) {
      best = made;
      if (elapsed > SOFT_RETRY_BEFORE_MS) break;
    } else if (elapsed > RETRY_BEFORE_MS) break;
    messages = [...messages, { role: "assistant", content: text || "{}" }, { role: "user", content: `${problem}\nReply with the whole corrected card as JSON only.` }];
  }
  if (best) return finish(best);
  throw new GenerateError("failed", "The card didn't come out right");
}
