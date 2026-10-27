import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { customAlphabet } from "nanoid";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cardSchema, type CardData, type StoredCard } from "./card";

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
// checkout existed have no flag and count as paid.
export async function getCard(id: string): Promise<(StoredCard & { paid: boolean }) | null> {
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
}

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
