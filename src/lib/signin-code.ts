import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// The 6-digit code someone types to sign in with their email. Supabase's own codes are as long
// as its dashboard says (8 digits here), so the site makes its own: Supabase still makes the
// sign-in (a magic link's hashed token), and the code and that token are sealed together in a
// cookie in the visitor's own browser that only this server can open. Typing the right code
// then hands Supabase the token, which signs them in.

export const CODE_COOKIE = "sv-signin";
export const CODE_DIGITS = 6;
// As long as Supabase's token lasts, as the email says ("It works for the next hour").
export const CODE_TTL_S = 60 * 60;

type Ticket = { email: string; tokenHash: string; type: string; code: string; exp: number };

// AES-256-GCM, with a key of its own made from the server's secret.
const key = () => createHash("sha256").update(`signin-code:${process.env.SUPABASE_SECRET_KEY ?? ""}`).digest();

export function newCode() {
  return String(randomInt(0, 10 ** CODE_DIGITS)).padStart(CODE_DIGITS, "0");
}

export function seal(ticket: Omit<Ticket, "exp">, now = Date.now()) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ ...ticket, exp: now + CODE_TTL_S * 1000 })), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

function open(sealed: string): Ticket | null {
  try {
    const raw = Buffer.from(sealed, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8"));
  } catch {
    return null;
  }
}

// The sealed sign-in waiting for this email and code: null if there isn't one, it's for
// another address, it's run out, or the code is wrong.
export function unseal(sealed: string | undefined, email: string, code: string, now = Date.now()) {
  const ticket = sealed ? open(sealed) : null;
  if (!ticket || ticket.email !== email || ticket.exp < now || ticket.code.length !== code.length) return null;
  return timingSafeEqual(Buffer.from(ticket.code), Buffer.from(code)) ? ticket : null;
}

// One inbox, however the address is written, for counting only (the code still goes to
// the address as typed): name+anything@ is name@, and Gmail ignores dots and also
// answers to googlemail.com.
export function inbox(email: string) {
  const at = email.lastIndexOf("@");
  let name = email.slice(0, at).toLowerCase().replace(/\+.*$/, "");
  let domain = email.slice(at + 1).toLowerCase();
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") name = name.replace(/\./g, "");
  return `${name}@${domain}`;
}
