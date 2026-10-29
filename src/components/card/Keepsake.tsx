"use client";

import { WaxSeal, initialOf } from "./Envelope";

// The longest sign-off at the end of a message that's written by hand ("Love you, Sam").
const SIGN_OFF_MAX = 48;
// Words in a name that don't pick out a person ("The Smiths", "Your secret admirer").
const NOT_NAMES = new Set(["the", "your", "our", "all", "from", "love", "with", "and", "team"]);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// What the sender might sign as: their whole name, or its first or last word ("Sam" for
// "Sam Jones", "Dad" for "Mum & Dad").
function namesOf(from: string) {
  const whole = from.trim();
  const words = whole.split(/\s+/).filter((w) => /\p{L}{2,}/u.test(w) && !NOT_NAMES.has(w.toLowerCase()));
  return [...new Set([whole, words[0], words.at(-1)])].filter((n): n is string => !!n);
}

// No lookbehind in these: older iPhones can't run it.
const mentions = (text: string, names: string[]) =>
  names.some((n) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(n)}($|[^\\p{L}\\p{N}])`, "iu").test(text));

// Whether the words end with one of the names, give or take a full stop, an emoji or kisses ("Sam xx").
function endsWithName(text: string, names: string[]) {
  const end = text.replace(/[^\p{L}\p{N}]+$/u, "");
  const noKisses = end.replace(/\s+x+$/i, "").replace(/[^\p{L}\p{N}]+$/u, "");
  return names.some((n) => {
    const name = new RegExp(`(^|[^\\p{L}\\p{N}])${escape(n)}$`, "iu");
    return name.test(end) || name.test(noKisses);
  });
}

// How the finale's message is signed. A message that already ends by signing off with their
// name ("It's a date. Love, Sam") has that last bit written by hand rather than signed twice;
// one that mentions them near the end some other way ("Signed, Santa (definitely not Sam)")
// is left as it is; any other is signed with their name.
export function signing(body: string, from: string): { main: string; hand: string | null; fromBody: boolean } {
  const text = body.trim();
  const names = namesOf(from);
  if (!names.length) return { main: text, hand: null, fromBody: false };
  const lineStart = text.lastIndexOf("\n") + 1;
  const line = text.slice(lineStart);
  // The last sentence of the last line.
  let start = 0;
  for (const m of line.matchAll(/[.!?…]+["'”’)]*\s+/g)) start = (m.index ?? 0) + m[0].length;
  let signFrom = lineStart + start;
  if (text.length - signFrom <= SIGN_OFF_MAX && endsWithName(text.slice(signFrom), names)) {
    // A name on a line of its own takes a short line before it that ends in a comma ("With love,").
    if (start === 0 && lineStart > 0) {
      const before = text.slice(text.lastIndexOf("\n", lineStart - 2) + 1, lineStart - 1);
      if (before.trim() && before.length <= 30 && /,\s*$/.test(before)) signFrom -= before.length + 1;
    }
    return { main: text.slice(0, signFrom).trimEnd(), hand: text.slice(signFrom), fromBody: true };
  }
  if (mentions(text.slice(-60), names)) return { main: text, hand: null, fromBody: false };
  return { main: text, hand: from.trim(), fromBody: false };
}

// The finale's message as a keepsake: set on paper, signed by hand, then pressed with the
// sender's wax seal, the same seal that was cracked to open the envelope.
export function Keepsake({ body, from }: { body: string; from: string }) {
  const { main, hand, fromBody } = signing(body, from);
  const name = from.trim();
  if (!main && !hand) return null;
  const short = main.length <= 90 && !main.includes("\n");
  return (
    <div className="keepsake w-full rounded-sm bg-[var(--c-surface)] px-6 py-7 text-[var(--c-text)] shadow-[0_18px_36px_-22px_rgba(0,0,0,0.65)] ring-1 ring-current/10 @sm:px-8">
      {main && <p className={`whitespace-pre-line text-lg leading-relaxed @sm:text-xl ${short ? "text-balance text-center" : "text-pretty text-left"}`}>{main}</p>}
      {name && (
        <div className={`flex items-end justify-between gap-4 ${main ? "mt-5" : ""}`}>
          <WaxSeal initial={initialOf(name)} className="keepsake-seal relative h-12 w-12 shrink-0 text-lg" />
          {hand && (
            <div className="min-w-0 text-right">
              <span className="inline-flex max-w-full flex-col">
                {/* The end of their own message is changed with the rest of it in the editor; a plain
                    signature is their name, changed as their name. */}
                <span
                  data-text={fromBody ? body : undefined}
                  className="keepsake-sign whitespace-pre-line text-balance font-hand text-[clamp(1.9rem,9cqw,2.6rem)] leading-[1.05]"
                >
                  {hand}
                </span>
                <svg aria-hidden viewBox="0 0 120 10" preserveAspectRatio="none" className="mt-1 h-2.5 w-full opacity-50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path className="keepsake-swash" pathLength={1} d="M3 7c18-5 38-6 58-3s38 3 56-3" />
                </svg>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
