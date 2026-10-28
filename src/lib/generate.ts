import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { customAlphabet } from "nanoid";
import { EFFECTS, FONTS, GAMES, MOTIONS, MUSIC, OCCASIONS, PATTERNS, THEMES, cardSchema, screenStyle, type CardData, type Game, type Screen, type ScreenType } from "./card";
import { LANGUAGES, type Locale } from "@/i18n/config";
import { TEMPLATES, buildCard, getTemplate } from "./catalog";
import { GAME_LABELS, LABELS_ON, LISTS, TEXTS, isList, type LabelKey } from "./labels";

// Writes a whole card from a description, or changes an existing one, with Claude.
// The model replies with card JSON in the same shape the creator saves, so whatever
// comes back goes through the same validation as a card made by hand.

const MODEL = "claude-opus-5-5";
const newId = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

// What each game asks of the player, taken from the designs that use it.
function gameNotes() {
  const notes = new Map<Game, string>();
  for (const t of TEMPLATES) {
    for (const s of t.screens(t.demo.to, t.demo.from)) if (s.type === "game" && !notes.has(s.game)) notes.set(s.game, s.instructions);
  }
  return GAMES.map((g) => `  - ${g}: ${notes.get(g) ?? "a short tap game"}`).join("\n");
}

const list = (values: readonly string[]) => values.map((v) => `"${v}"`).join(", ");

function labelGuide() {
  const say = (keys: LabelKey[]) => keys.map((k) => `${k} ${JSON.stringify(isList(k) ? LISTS[k] : TEXTS[k])}`).join(", ");
  const games = Object.entries(GAME_LABELS).map(([game, keys]) => `  - ${game}: ${say(keys ?? [])}`);
  return [...Object.entries(LABELS_ON).map(([type, keys]) => `- ${type}: ${say(keys)}`), "  And on a game screen, by game:", ...games].join("\n");
}

// Two of the shop's own designs, so the model sees the voice and the shape.
const EXAMPLES = ["be-my-valentine", "birthday-bash"]
  .map((slug) => getTemplate(slug))
  .filter((t) => t !== undefined)
  .map((t) => JSON.stringify(withoutTemplate(buildCard(t, t.demo.to, t.demo.from))))
  .join("\n\n");

function withoutTemplate(card: CardData): CardData {
  const rest = { ...card };
  delete rest.template;
  return rest;
}

const SYSTEM = `You write interactive e-cards for Envelette, a small UK shop. A card is a short run of screens that opens from a link: an envelope, then games, questions and messages, then a big finale. You reply with the card as one JSON object and nothing else: no explanation and no code fences.

# The card
{"occasion", "theme", "ambient", "music", "to", "from", "screens"}
- occasion: one of ${list(OCCASIONS)}. Use the closest; "friendship" or "thanks" when nothing fits.
- theme (the colours): one of ${list(THEMES)}.
- ambient (the background effect): one of ${list(EFFECTS.filter((e) => e !== "fireworks"))}.
- music: one of ${list(MUSIC)}.
- to: the person receiving it. from: the person sending it.
- screens: 4 to 12 screens in the order they appear. The first is always "intro" and the last is always "finale".

# Screens
Every screen has "id" (a short unique word like "intro", "quiz2") and "type". Numbers after a field are its maximum length in characters. Every field must be present.
- intro: {"type":"intro","title" 120,"subtitle" 200,"button" 40}. The envelope screen. The button opens it, e.g. "Open it".
- question: {"type":"question","question" 140,"yes" 30,"no" 30,"afterYes" 140}. A yes/no question; the No button runs away when they try to press it.
- photos: {"type":"photos","title" 120,"photos":[],"captions":[]}. The sender adds up to 6 photos afterwards, so leave both lists empty.
- message: {"type":"message","title" 120,"body" 1500}. A letter that types itself out. Separate paragraphs with a blank line.
- game: {"type":"game","game","title" 120,"instructions" 200,"winText" 140}. game is one of:
${gameNotes()}
  The instructions must describe what that game really asks them to do.
- quiz: {"type":"quiz","title" 120,"questions":[{"question" 140,"options":[2 to 4 options, 60 each],"answer": index of the right option}] (1 to 6 questions),"winText" 140}
- scratch: {"type":"scratch","title" 120,"instructions" 200,"hidden" 200}. They scratch a silver panel to reveal the hidden message.
- typeit: {"type":"typeit","title" 120,"instructions" 200,"phrase" 40,"winText" 140}. They have to type a secret phrase; the instructions are the clue.
- wheel: {"type":"wheel","title" 120,"instructions" 200,"options":[2 to 8 prizes, 40 each],"landOn": -1 for a fair spin or the index it always lands on,"winText" 140}
- coupons: {"type":"coupons","title" 120,"instructions" 200,"coupons":[1 to 6 treats, 80 each]}
- reasons: {"type":"reasons","title" 120,"instructions" 200,"reasons":[1 to 12 reasons, 160 each]}. Notes they pull from a jar.
- slider: {"type":"slider","title" 120,"low" 30,"high" 30,"winText" 140}. A "how much" slider that only goes up.
- timeline: {"type":"timeline","title" 120,"events":[{"when" 40,"what" 160}] (1 to 8)}
- boxes: {"type":"boxes","title" 120,"instructions" 200,"prizes":[2 or 3 prizes, 80 each]}. They pick one of the mystery boxes.
- finale: {"type":"finale","title" 140,"body" 600,"effect"}. effect is one of ${list(EFFECTS)}.

# How each screen looks
Every screen can have a "style" that sets its look on top of the theme. Design every screen from what they describe: "a dark blue envelope with stars twinkling" is a dark blue background, a dark blue envelope and the stars effect on that screen. If they don't describe the look, still give each screen a style that suits the card, so no two cards look alike. Keep it tasteful: a palette of two or three colours used across the whole card, varied from screen to screen.
"style": {
  "background": 1 to 3 colours like "#14213d"; two or three make a gradient,
  "gradient": "down", "diagonal" or "glow" (lighter at the top), for how the colours run,
  "pattern": one of ${list(PATTERNS)}, drawn faintly over the background,
  "text": the colour of the words, easy to read on the background,
  "accent": the colour of the buttons and highlights,
  "envelope": the colour of the envelope (the intro only),
  "heading": the font of the titles, one of ${list(FONTS)},
  "body": the font of everything else, one of the same,
  "effect": what floats in the background of this screen, instead of the card's ambient, one of ${list(EFFECTS)},
  "stickers": up to 10 emoji placed around the screen: [{"emoji": one emoji, "x": 0 to 100 (% from the left), "y": 0 to 100 (% from the top), "size": 4 to 40 (% of the card's shorter side; 8 to 16 suits most), "rotate": -180 to 180, "motion": one of ${list(MOTIONS)}}]
}
- Every part is optional. Colours are always six-digit hex.
- The fonts: classic is an elegant serif, modern a clean sans-serif, handwritten casual handwriting, storybook a soft old-style serif, script a flowing wedding script, rounded bubbly and friendly, bold a chunky modern headline, typewriter an old typewriter, marker a thick felt-tip pen and spooky a dripping horror font. For the body, use one that's easy to read in a long letter: modern, classic, storybook, rounded or typewriter.
- Put stickers near the edges and corners (x under 15 or over 85, or y under 14 or over 86) so they don't cover the words, 2 to 6 on a screen. Keep the top right corner clear for the sound button.

# The words built into the screens
Screens also say a few things of their own: the envelope's "You've got mail", the Next buttons, the excuses the runaway No button makes, a game's "Keep shaking…". Left out, they say the usual thing. To change them on a screen, give it "labels" with just the ones to change, e.g. "labels": {"next": "Onwards", "noLines": ["Nope", "Try again"]}. Do this when they ask for particular wording, or when a line would clearly suit the card better. Each screen's labels and what they usually say ({i}, {n} and {moves} become numbers; lists are said in turn):
${labelGuide()}

# Writing it
- Use everything they told you: names, nicknames, inside jokes, places, hobbies. Specific beats generic every time.
- Never invent shared memories or facts about the two of them. If they didn't give you details, write questions and lines that are playful rather than factual ("Who's the better cook?" with the answer being the sender).
- Don't guess anyone's gender. Use their name or "you" unless the relationship or what they told you makes it clear (mum, sister, "she").
- If they describe the card screen by screen, build exactly that: the same screens in the same order, each doing what they described, using the closest screen type and game. Don't add screens they didn't ask for (apart from the intro at the start and the finale at the end) and don't leave any out. If something can't be done with these screens, do the closest thing that can.
- If they don't describe the screens, design a card that suits these two people and the occasion. Vary it: there are 13 kinds of screen and 21 games, so don't fall back on the same few (a candle game, a quiz, photos, a message) every time. Include at least two playful screens and a heartfelt message near the end; a photos screen is welcome but not required.
- Sound like a person, not a greeting card factory: warm, a bit funny where it fits, no clichés. Use emoji sparingly or not at all.
- Write in the language their description is written in. If it's only names and choices, use the language you're told the site is in. For English, use British spelling.
- Take the theme, background effect, finale effect and music from what they describe too (for example "dark blue with stars" suits the midnight theme with stars). If they don't say, choose what suits the feel of the card rather than the obvious default for the occasion.

# Changing a card
If you're given an existing card and a change, return the whole card with that change made. Keep everything they didn't ask to change exactly as it is, including screen ids. Photos appear as "photo-1", "photo-2" and so on: keep, move or drop those as asked, but never make new ones.

# Two of our designs, for the voice and the JSON format (not a structure to copy)
${EXAMPLES}`;

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

// Photo links are swapped for placeholders on the way out and back again on the way in,
// so the model can move photos around but can't make up new links.
function hidePhotos(card: CardData) {
  const urls: string[] = [];
  const screens = card.screens.map((s) =>
    s.type === "photos"
      ? {
          ...s,
          photos: s.photos.map((url) => {
            urls.push(url);
            return `photo-${urls.length}`;
          }),
        }
      : s,
  );
  return { card: { ...card, screens }, urls };
}

function restorePhotos(screen: Record<string, unknown>, urls: string[]) {
  if (screen.type !== "photos") return screen;
  const photos = Array.isArray(screen.photos) ? screen.photos : [];
  const captions = Array.isArray(screen.captions) ? screen.captions : [];
  const kept = photos.map((p) => urls[Number(/^photo-(\d+)$/.exec(String(p))?.[1]) - 1]);
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
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(style)) {
    let value = Array.isArray(raw) && key === "background" ? raw.map(longHex) : longHex(raw);
    if (key === "stickers" && Array.isArray(raw)) {
      value = raw
        .filter((s) => s && typeof s === "object")
        .map((s) => ({ ...s, x: clamp(s.x, 0, 100), y: clamp(s.y, 0, 100), size: clamp(s.size, 4, 40), rotate: clamp(s.rotate, -180, 180) }))
        .filter((s) => fields.stickers.safeParse([s]).success)
        .slice(0, 10);
    }
    const parsed = fields[key]?.safeParse(value);
    if (parsed?.success) out[key] = parsed.data;
  }
  return Object.keys(out).length ? out : undefined;
}

// A screen's own wording for its built-in words, keeping the ones that fit: known
// labels only, a list where a list goes, and nothing too long.
function tidyLabels(labels: unknown) {
  if (!labels || typeof labels !== "object" || Array.isArray(labels)) return undefined;
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(labels)) {
    if (isList(key)) {
      const lines = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim().slice(0, 80)) : [];
      if (lines.length) out[key] = lines.slice(0, 12);
    } else if (key in TEXTS && typeof value === "string" && value.trim()) out[key] = value.trim().slice(0, 160);
  }
  return Object.keys(out).length ? out : undefined;
}

// Pulls the JSON out of the reply and makes it a valid card, or says what's wrong.
function toCard(text: string, input: GenerateInput, urls: string[]): { card: CardData } | { problem: string } {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return { problem: "That wasn't valid JSON." };
  }
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { screens?: unknown }).screens)) return { problem: "The card needs a screens list." };
  const draft = raw as Record<string, unknown> & { screens: Record<string, unknown>[] };
  // Ids only need to be unique; fix them rather than fail.
  const seen = new Set<string>();
  draft.screens = draft.screens.map((s) => {
    let id = typeof s?.id === "string" && s.id.trim() ? s.id.trim().slice(0, 40) : newId();
    if (seen.has(id)) id = newId();
    seen.add(id);
    return restorePhotos({ ...s, id, style: tidyStyle(s.style), labels: tidyLabels(s.labels) }, urls);
  });
  if (typeof draft.to !== "string" || !draft.to.trim()) draft.to = input.to;
  if (typeof draft.from !== "string" || !draft.from.trim()) draft.from = input.from;
  if (draft.ambient === "fireworks") draft.ambient = "sparkles";
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
  if (screens[0]?.type !== "intro" || screens.at(-1)?.type !== "finale") return { problem: "The first screen must be the intro and the last the finale." };
  return { card: parsed.data };
}

// Puts the words that were written into the design, so only the words can change: the
// screens, their order, games, list lengths, colours and music stay as the design has them.
const NOT_WORDS = new Set(["id", "type", "game", "effect", "photos", "captions", "landOn", "style"]);

function copyWords(design: unknown, written: unknown): unknown {
  if (typeof design === "string") return typeof written === "string" && written.trim() ? written : design;
  if (Array.isArray(design)) return design.map((item, i) => copyWords(item, Array.isArray(written) ? written[i] : undefined));
  if (design && typeof design === "object") {
    const from = (written && typeof written === "object" ? written : {}) as Record<string, unknown>;
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
  return parsed.success ? parsed.data : design;
}

function request(input: GenerateInput): { message: string; urls: string[]; design?: CardData } {
  const prompt = `<request>\n${input.prompt}\n</request>`;
  if (input.card) {
    const { card, urls } = hidePhotos(withoutTemplate(input.card));
    const screen = input.card.screens.find((s) => s.id === input.focus);
    const about = screen
      ? `\n\nThey're looking at the screen with id "${screen.id}" (a ${screen.type} screen), so "this", "here" and "this screen" mean that one. Make the change to that screen, unless what they ask is clearly about the whole card (like the colours, the music, or adding or removing screens). Leave the other screens as they are.`
      : "";
    return { message: `Here is the card:\n${JSON.stringify(card)}${about}\n\nThe change they want:\n${prompt}`, urls };
  }
  const base = getTemplate(input.template);
  const language = input.locale && input.locale !== "en" ? `The site is in ${LANGUAGES[input.locale].english}.\n` : "";
  const names = `Their name: ${input.to}\nYour name (the sender): ${input.from}\n${language}`;
  if (base && input.keepDesign) {
    const design = buildCard(base, input.to, input.from);
    return {
      message: `${names}\nThey picked this design:\n${JSON.stringify(withoutTemplate(design))}\n\nRewrite its words to fit what they told you. Keep the design exactly as it is: the same screens in the same order with the same ids and types, the same number of items in every list, the same game on each game screen, and the same occasion, theme, ambient, music and finale effect. Only the words change, and every one of them should feel written for these two. In a quiz, set each "answer" to the index of the right option. Leave photos empty.\n\nWhat they told you:\n${prompt}`,
      urls: [],
      design,
    };
  }
  const start = base ? `\nStart from this design and rework it to fit what they want:\n${JSON.stringify(withoutTemplate(buildCard(base, input.to, input.from)))}\n` : "";
  return { message: `${names}${start}\nWhat they want:\n${prompt}`, urls: [] };
}

const SCREEN_TYPES = new Set<string>(cardSchema.shape.screens.element.options.map((o) => o.shape.type.value));

// The screens written so far, read from the JSON as it streams in. Only screens have a "type".
function screensSoFar(text: string): ScreenType[] {
  return [...text.matchAll(/"type"\s*:\s*"([a-z]+)"/g)].map((m) => m[1]).filter((t): t is ScreenType => SCREEN_TYPES.has(t));
}

type Options = {
  // Called each time another screen has been written.
  onProgress?: (screens: ScreenType[]) => void;
  signal?: AbortSignal;
};

export async function generateCard(input: GenerateInput, { onProgress, signal }: Options = {}): Promise<CardData> {
  if (!generateReady()) throw new GenerateError("off");
  client ??= new Anthropic();
  const { message, urls, design } = request(input);
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: message }];
  // One retry, telling the model what was wrong with its first go.
  for (let attempt = 0; attempt < 2; attempt++) {
    let reply: Anthropic.Message;
    try {
      const stream = client.messages.stream(
        {
          model: MODEL,
          max_tokens: 8000,
          output_config: { effort: "low" },
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
          messages,
        },
        { signal },
      );
      let written = 0;
      if (onProgress) {
        onProgress([]);
        stream.on("text", (_, snapshot) => {
          const screens = screensSoFar(snapshot);
          if (screens.length > written) {
            written = screens.length;
            onProgress(screens);
          }
        });
      }
      reply = await stream.finalMessage();
    } catch (e) {
      const busy = e instanceof Anthropic.RateLimitError || (e instanceof Anthropic.APIError && (e.status === 529 || e.status === 503));
      throw new GenerateError(busy ? "busy" : "failed", e instanceof Error ? e.message : String(e));
    }
    if (reply.stop_reason === "refusal") throw new GenerateError("refused");
    const text = reply.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const result = toCard(text, input, urls);
    if ("card" in result) return design ? fillDesign(design, result.card) : result.card;
    console.warn("generated card was off", result.problem);
    messages.push({ role: "assistant", content: text || "{}" }, { role: "user", content: `${result.problem}\nReply with the whole corrected card as JSON only.` });
  }
  throw new GenerateError("failed", "The card didn't come out right twice");
}

const FOLLOWUP_MODEL = "claude-haiku-5-5";

// One or two questions about what they've already said, to draw out the specific
// details (a moment, a habit, a phrase) that make a card feel personal. Quick, so a
// smaller model. Any trouble and there are simply no follow-ups.
export async function followUpQuestions(summary: string, locale: Locale): Promise<string[]> {
  if (!generateReady()) return [];
  client ??= new Anthropic();
  const reply = await client.messages.create({
    model: FOLLOWUP_MODEL,
    max_tokens: 2000,
    system: `Someone is making a personalised interactive card and has answered a few questions about who it's for. Ask exactly two short follow-up questions that would bring out the specific details that make a card feel personal: a moment, a habit, a phrase, a place, a name. Each question must build on something they wrote, and must not ask for anything they've already told you. Keep each under 120 characters, warm and casual, speaking to the sender as "you". Don't guess anyone's gender. Write in ${LANGUAGES[locale].english}. Reply with JSON only: {"questions": ["...", "..."]}`,
    messages: [{ role: "user", content: `<answers>\n${summary}\n</answers>` }],
  });
  const text = reply.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  try {
    const { questions } = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return Array.isArray(questions) ? questions.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 200)).slice(0, 2) : [];
  } catch {
    return [];
  }
}
