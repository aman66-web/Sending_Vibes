import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CHAT_SYSTEM, chatContext } from "@/lib/chat-prompt";

// The live chat. Streams the reply back as one JSON event per line:
// {type:"text",text} pieces, {type:"reset"} (throw away what came so far),
// {type:"error",message}, then {type:"done"}.

export const maxDuration = 60;

const MODEL = "claude-opus-5-5";
// Older messages are dropped so a long chat doesn't get slower and dearer.
const KEEP_MESSAGES = 16;

const bodySchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(800) }),
        z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(4000) }),
      ]),
    )
    .min(1)
    .max(40),
  page: z.string().max(200).optional(),
});

// A rough per-visitor limit so nobody can run up the bill. It lives in memory, so
// it resets when the server restarts; the monthly spend limit on the API key is
// the real backstop.
const WINDOW_MS = 10 * 60_000;
const PER_WINDOW = 20;
const recent = new Map<string, number[]>();

function allowed(ip: string) {
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= PER_WINDOW) return false;
  times.push(now);
  recent.set(ip, times);
  if (recent.size > 5000) {
    for (const [key, list] of recent) if (list.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
  }
  return true;
}

const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });

let client: Anthropic | undefined;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return fail("Chat isn't switched on yet. Have a look at Help & FAQ in the meantime.", 503);

  // Only our own pages can use the chat.
  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail("Not allowed.", 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  if (!allowed(ip)) return fail("You've sent a lot of messages. Have a short break and try again in a few minutes.", 429);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("That message couldn't be sent. Keep it under 800 characters.", 400);

  let messages = parsed.data.messages.slice(-KEEP_MESSAGES);
  while (messages[0]?.role === "assistant") messages = messages.slice(1);
  if (!messages.length || messages.at(-1)?.role !== "user" || messages.some((m, i) => i > 0 && m.role === messages[i - 1].role)) {
    return fail("That conversation doesn't look right. Try starting a new chat.", 400);
  }

  client ??= new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 2000,
    // Short, friendly answers don't need deep thought, and low effort keeps replies quick.
    output_config: { effort: "low" },
    system: [
      { type: "text", text: CHAT_SYSTEM, cache_control: { type: "ephemeral" } },
      { type: "text", text: chatContext(parsed.data.page) },
    ],
    messages,
    // If the model declines, the API retries on its recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        for await (const event of stream) {
          if (event.type === "content_block_start" && event.content_block.type === "fallback") send({ type: "reset" });
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") send({ type: "text", text: event.delta.text });
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          send({ type: "reset" });
          send({ type: "text", text: "Sorry, I can't help with that one. I'm happy to help you pick a card or write the words for it." });
        } else if (final.stop_reason === "max_tokens") {
          send({ type: "text", text: "…" });
        }
      } catch (error) {
        console.error("chat failed", error);
        const busy = error instanceof Anthropic.RateLimitError || (error instanceof Anthropic.APIError && (error.status === 529 || error.status === 503));
        send({ type: "error", message: busy ? "I'm a bit busy right now. Try again in a minute." : "Something went wrong on our side. Try again in a moment." });
      }
      send({ type: "done" });
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
