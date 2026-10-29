import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cardSchema, type CardData, type StoredCard } from "./card";
import type { Order } from "./orders";
import type { Reaction } from "./reply";

// Card links must be unguessable, since they contain people's personal photos.
const newId = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 12);
const newPhotoName = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Uses Supabase when configured, otherwise a local .data folder so the app runs
// with zero setup in development. Local storage does not work on Vercel.
// Cards are read and written with the publishable key, through the create_card /
// get_card database functions (see supabase/migrations); the cards table itself
// is not accessible to the public.
function supabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const usingSupabase = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

// The secret key, for the few things the public must not be able to do: recording
// orders and marking cards as paid. Server-only, never sent to the browser.
export function adminSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const DATA_DIR = path.join(process.cwd(), ".data");

export async function saveCard(card: CardData): Promise<string> {
  const id = newId();
  const stored: StoredCard = { ...card, id, createdAt: new Date().toISOString() };
  const db = supabase();
  if (db) {
    const { error } = await db.rpc("create_card", { card_id: id, card: stored });
    if (error) throw new Error(`Could not save card: ${error.message}`);
    return id;
  }
  await fs.mkdir(path.join(DATA_DIR, "cards"), { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "cards", `${id}.json`), JSON.stringify({ ...stored, paid: false }));
  return id;
}

// paid is false while the card waits in someone's basket. Cards saved before
// checkout existed have no flag and count as paid. Cached for the request, so a card's
// page, its metadata and its colours share one database call.
export const getCard = cache(async (id: string): Promise<(StoredCard & { paid: boolean }) | null> => {
  if (!/^[A-Za-z0-9]{12}$/.test(id)) return null;
  const db = supabase();
  let raw: unknown = null;
  if (db) {
    const { data, error } = await db.rpc("get_card", { card_id: id });
    if (error) throw new Error(`Could not load card: ${error.message}`);
    raw = data;
  } else {
    try {
      raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, "cards", `${id}.json`), "utf8"));
    } catch {
      return null;
    }
  }
  // Re-validate on read: anyone holding the publishable key can call create_card
  // directly, so stored data is never trusted to be well-formed.
  const parsed = cardSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { createdAt, paid } = raw as { createdAt?: unknown; paid?: unknown };
  return { ...parsed.data, id, createdAt: typeof createdAt === "string" ? createdAt : "", paid: paid !== false };
});

// Opens cards once their order is paid. Safe to repeat.
export async function markCardsPaid(ids: string[]): Promise<void> {
  if (!ids.length) return;
  if (usingSupabase()) {
    const db = adminSupabase();
    if (!db) throw new Error("SUPABASE_SECRET_KEY is not set");
    const { error } = await db.from("cards").update({ paid_at: new Date().toISOString() }).in("id", ids).is("paid_at", null);
    if (error) throw new Error(`Could not mark cards paid: ${error.message}`);
    return;
  }
  for (const id of ids) {
    const file = path.join(DATA_DIR, "cards", `${id}.json`);
    const raw = JSON.parse(await fs.readFile(file, "utf8").catch(() => "null"));
    if (raw && raw.paid === false) await fs.writeFile(file, JSON.stringify({ ...raw, paid: true }));
  }
}

// ---------- After a card is sent: who sent it, its first opening, thank-yous ----------

const readJson = async (file: string) => {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
};

// The paid order a card was bought in, so its buyer can be told about it. Null for cards
// made before checkout existed.
export async function paidOrderFor(cardId: string): Promise<string | null> {
  if (usingSupabase()) {
    const db = adminSupabase();
    if (!db) return null;
    // Passed as JSON text: given an array, the client writes a Postgres array ({...}), not JSON.
    const { data, error } = await db.from("orders").select("id").eq("status", "paid").contains("items", JSON.stringify([{ cardId }])).order("paid_at").limit(1);
    if (error) throw new Error(`Could not find the card's order: ${error.message}`);
    return (data?.[0]?.id as string | undefined) ?? null;
  }
  const dir = path.join(DATA_DIR, "orders");
  for (const file of await fs.readdir(dir).catch(() => [] as string[])) {
    const order = (await readJson(path.join(dir, file))) as Order | null;
    if (order?.status === "paid" && order.items?.some((i) => i.cardId === cardId)) return order.id;
  }
  return null;
}

// Notes the first time a paid card is opened. True only for the call that noted it, so the
// sender is told once. Before migration 0008 there's nowhere to note it, so nobody is told.
export async function claimFirstOpen(id: string): Promise<boolean> {
  const at = new Date().toISOString();
  if (usingSupabase()) {
    const db = adminSupabase();
    if (!db) return false;
    const { data, error } = await db.from("cards").update({ opened_at: at }).eq("id", id).is("opened_at", null).not("paid_at", "is", null).select("id");
    if (error) {
      console.error("Could not note that a card was opened", error.message);
      return false;
    }
    return (data?.length ?? 0) > 0;
  }
  const file = path.join(DATA_DIR, "cards", `${id}.json`);
  const raw = await readJson(file);
  if (!raw || raw.paid === false || raw.openedAt) return false;
  await fs.writeFile(file, JSON.stringify({ ...raw, openedAt: at }));
  return true;
}

// When each of these cards was first opened, for those that have been. Empty when it
// can't tell (before migration 0008, say), so the account page just doesn't say.
export async function openedTimes(ids: string[]): Promise<Record<string, string>> {
  const times: Record<string, string> = {};
  // Cards paid for before openings were noted are marked -infinity (see 0008): unknown.
  const keep = (id: string, at: unknown) => {
    if (typeof at === "string" && Number.isFinite(Date.parse(at))) times[id] = at;
  };
  if (!ids.length) return times;
  try {
    if (usingSupabase()) {
      const db = adminSupabase();
      if (!db) return times;
      const { data, error } = await db.from("cards").select("id, opened_at").in("id", ids).not("opened_at", "is", null);
      if (error) throw new Error(error.message);
      for (const row of data ?? []) keep(row.id, row.opened_at);
    } else {
      const valid = ids.filter((id) => /^[A-Za-z0-9]{12}$/.test(id));
      await Promise.all(valid.map(async (id) => keep(id, (await readJson(path.join(DATA_DIR, "cards", `${id}.json`)))?.openedAt)));
    }
  } catch (e) {
    console.error("Could not check which cards were opened", e);
  }
  return times;
}

type Reply = { reaction: Reaction; message?: string };
const replyFile = (cardId: string) => path.join(DATA_DIR, "replies", `${cardId}.json`);

// Thank-yous sent back from a card (lib/reply.ts). Only the server reads and writes them,
// with the secret key. Before migration 0007 there's nowhere to keep them, so they aren't
// counted and the per-visitor limit is the only brake.
export async function countReplies(cardId: string): Promise<number> {
  if (usingSupabase()) {
    const db = adminSupabase();
    if (!db) return 0;
    const { count, error } = await db.from("card_replies").select("id", { count: "exact", head: true }).eq("card_id", cardId);
    if (error) {
      console.error("Could not count a card's replies", error.message || error.code);
      return 0;
    }
    return count ?? 0;
  }
  const saved = await readJson(replyFile(cardId));
  return Array.isArray(saved) ? saved.length : 0;
}

export async function saveReply(cardId: string, reply: Reply): Promise<void> {
  if (usingSupabase()) {
    const db = adminSupabase();
    const result = db ? await db.from("card_replies").insert({ card_id: cardId, reaction: reply.reaction, message: reply.message || null }) : null;
    if (!result || result.error) console.error("Could not save a card's reply", result?.error?.message ?? "SUPABASE_SECRET_KEY is not set");
    return;
  }
  const saved = await readJson(replyFile(cardId));
  await fs.mkdir(path.dirname(replyFile(cardId)), { recursive: true });
  await fs.writeFile(replyFile(cardId), JSON.stringify([...(Array.isArray(saved) ? saved : []), { ...reply, createdAt: new Date().toISOString() }]));
}

export async function savePhoto(bytes: Buffer, contentType: string): Promise<string> {
  const name = `${newPhotoName()}.${PHOTO_TYPES[contentType]}`;
  const db = supabase();
  if (db) {
    const { error } = await db.storage
      .from("photos")
      .upload(name, bytes, { contentType, cacheControl: "31536000" });
    if (error) throw new Error(`Could not upload photo: ${error.message}`);
    return db.storage.from("photos").getPublicUrl(name).data.publicUrl;
  }
  await fs.mkdir(path.join(DATA_DIR, "photos"), { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "photos", name), bytes);
  return `/api/photos/${name}`;
}

export async function readLocalPhoto(name: string): Promise<{ bytes: Buffer; type: string } | null> {
  const match = /^[a-z0-9]{24}\.(jpg|png|webp)$/.exec(name);
  if (!match) return null;
  try {
    const bytes = await fs.readFile(path.join(DATA_DIR, "photos", name));
    const type = Object.keys(PHOTO_TYPES).find((t) => PHOTO_TYPES[t] === match[1])!;
    return { bytes, type };
  } catch {
    return null;
  }
}

// Check the file's real signature rather than trusting the browser-supplied type.
export function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  return null;
}
