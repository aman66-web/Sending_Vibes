import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { customAlphabet } from "nanoid";
import { EFFECTS, GAMES, MUSIC, OCCASIONS, THEMES, cardSchema, type CardData, type Game, type ScreenType } from "./card";
import { LANGUAGES, type Locale } from "@/i18n/config";
import { TEMPLATES, buildCard, getTemplate } from "./catalog";

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
- screens: 4 to 9 screens in the order they appear. The first is always "intro" and the last is always "finale".

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

# Writing it
- Use everything they told you: names, nicknames, inside jokes, places, hobbies. Specific beats generic every time.
- Never invent shared memories or facts about the two of them. If they didn't give you details, write questions and lines that are playful rather than factual ("Who's the better cook?" with the answer being the sender).
- Include what they ask for. Otherwise pick a good mix: at least two playful screens (a question, game, quiz, wheel, scratch card and so on), a photos screen (they can add their own photos or remove it), and a heartfelt message near the end.
- Sound like a person, not a greeting card factory: warm, a bit funny where it fits, no clichés. Use emoji sparingly or not at all.
- Write in the language their description is written in. If it's only names and choices, use the language you're told the site is in. For English, use British spelling.
- Pick the occasion, colours, effects and music that suit it.

# Changing a card
If you're given an existing card and a change, return the whole card with that change made. Keep everything they didn't ask to change exactly as it is, including screen ids. Photos appear as "photo-1", "photo-2" and so on: keep, move or drop those as asked, but never make new ones.

# Two of our designs, for the voice and the shape
${EXAMPLES}`;

export type GenerateInput = {
  prompt: string;
  to: string;
  from: string;
  // The card to change. Without one, a new card is written.
  card?: CardData;
  // A design to start a new card from.
  template?: string;
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
    return restorePhotos({ ...s, id }, urls);
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

function request(input: GenerateInput): { message: string; urls: string[] } {
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
  const start = base ? `\nStart from this design and rework it to fit what they want:\n${JSON.stringify(withoutTemplate(buildCard(base, input.to, input.from)))}\n` : "";
  const language = input.locale && input.locale !== "en" ? `The site is in ${LANGUAGES[input.locale].english}.\n` : "";
  return { message: `Their name: ${input.to}\nYour name (the sender): ${input.from}\n${language}${start}\nWhat they want:\n${prompt}`, urls: [] };
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
  const { message, urls } = request(input);
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
    if ("card" in result) return result.card;
    console.warn("generated card was off", result.problem);
    messages.push({ role: "assistant", content: text || "{}" }, { role: "user", content: `${result.problem}\nReply with the whole corrected card as JSON only.` });
  }
  throw new GenerateError("failed", "The card didn't come out right twice");
}
