"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

// Signing in or up: Continue with Google, or a code emailed to them. Used on
// the last step of the questions and on My cards. Google leaves the site and comes
// back to `next`, so anything worth keeping is saved first (onGoogle).

export type SignedIn = { email: string | null; name: string | null };

// Where a code was just sent, kept in this tab: phones often reload the page while someone's
// in their email app, and they should come back to the box for the code, not start again.
const SENT_KEY = "sv-code-sent";
type Sent = { email: string; digits: number; at: number };
// Supabase's codes are 6 digits unless it's set up otherwise; the server says how many.
const DIGITS = 6;

function loadSent(): Sent | null {
  try {
    const sent = JSON.parse(sessionStorage.getItem(SENT_KEY) ?? "null") as Sent | null;
    // A code works for an hour.
    return sent && typeof sent.email === "string" && typeof sent.at === "number" && Date.now() - sent.at < 60 * 60_000 ? sent : null;
  } catch {
    return null;
  }
}

function keepSent(sent: Sent | null) {
  try {
    if (sent) sessionStorage.setItem(SENT_KEY, JSON.stringify(sent));
    else sessionStorage.removeItem(SENT_KEY);
  } catch {}
}

const noop = () => () => {};

type Props = {
  google: boolean;
  email: boolean;
  next: string;
  onSignedIn: (account: SignedIn) => void;
  onGoogle?: () => void;
};

export function SignIn({ google, email: byEmail, next, onSignedIn, onGoogle }: Props) {
  const { t } = useI18n();
  const a = t.account;
  const k = t.create.code;
  const [sent] = useState(loadSent);
  const [email, setEmail] = useState(sent?.email ?? "");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(sent?.email ?? null);
  const [digits, setDigits] = useState(sent?.digits ?? DIGITS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [pasteHint, setPasteHint] = useState(false);
  // The code last sent off, so a complete code isn't checked twice.
  const tried = useRef("");
  // Not every browser lets a page read what's been copied.
  const canPaste = useSyncExternalStore(noop, () => typeof navigator.clipboard?.readText === "function", () => false);

  const post = async (url: string, body: object) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? a.codeFailed);
    return json;
  };

  const sendCode = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(a.badEmail);
    setBusy(true);
    setError(null);
    try {
      const json = await post("/api/auth/email", { email: email.trim() });
      const length = typeof json.digits === "number" && json.digits >= 6 && json.digits <= 10 ? json.digits : DIGITS;
      setResent(sentTo === email.trim());
      setSentTo(email.trim());
      setDigits(length);
      setCode("");
      tried.current = "";
      keepSent({ email: email.trim(), digits: length, at: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : a.codeFailed);
    }
    setBusy(false);
  };

  // Takes the code as typed, or straight from a paste, so it never checks one a keystroke old.
  const checkCode = async (value = code) => {
    if (busy) return;
    if (!sentTo || value.trim().length < 6) return setError(a.badCode);
    tried.current = value;
    setBusy(true);
    setError(null);
    try {
      const { account } = await post("/api/auth/verify", { email: sentTo, code: value.trim() });
      keepSent(null);
      onSignedIn(account);
    } catch (e) {
      setError(e instanceof Error ? e.message : a.badCode);
      setBusy(false);
    }
  };

  // Typed, pasted or filled in by the phone: once the whole code is there it's checked by
  // itself, with no button to find.
  const enterCode = (typed: string) => {
    const value = typed.replace(/\D/g, "").slice(0, 10);
    setCode(value);
    setPasteHint(false);
    // Typed again after it didn't work: check it again once it's complete.
    if (value.length < digits) tried.current = "";
    if (value.length === digits && value !== tried.current) checkCode(value);
  };

  const pasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // The whole email may have been copied: take the code from it.
      const found = text.match(new RegExp(`(?:^|\\D)(\\d{${digits}})(?!\\d)`))?.[1] ?? text.replace(/\D/g, "");
      if (!found) return setPasteHint(true);
      enterCode(found);
    } catch {
      // Not allowed to read it: say how to paste by hand.
      setPasteHint(true);
    }
  };

  const field = "w-full rounded-2xl border-2 border-line bg-panel px-4 py-3 text-lg outline-none focus:border-brand focus:ring-4 focus:ring-brand/15";

  return (
    <div className="space-y-4">
      {google && (
        // The browser leaves the site for Google's sign-in page. A link rather than a
        // form, since this can sit inside the questions' form.
        <a
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          onClick={() => onGoogle?.()}
          className="btn btn-paper flex w-full items-center justify-center gap-3 py-3 text-base"
        >
          <GoogleMark />
          {a.google}
        </a>
      )}
      {google && byEmail && (
        <p className="flex items-center gap-3 text-sm font-semibold opacity-50">
          <span className="h-px flex-1 bg-current" />
          {a.or}
          <span className="h-px flex-1 bg-current" />
        </p>
      )}
      {byEmail && !sentTo && (
        <div
          className="space-y-3"
          // Not a form of its own, since this can sit inside the questions' form.
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendCode();
            }
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold">{a.emailLabel}</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={a.emailPlaceholder} className={`mt-1 ${field}`} />
          </label>
          <button type="button" onClick={sendCode} disabled={busy} className="btn btn-ink w-full py-3 text-base disabled:opacity-60">
            {busy ? a.sending : a.sendCode}
          </button>
        </div>
      )}
      {byEmail && sentTo && (
        <div
          className="space-y-3"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              checkCode();
            }
          }}
        >
          <p className="text-base opacity-80">{fmt(a.codeSent, { email: sentTo })}</p>
          {resent && (
            <p role="status" className="text-base font-semibold">
              {k.resent}
            </p>
          )}
          {/* Where to find it, since it means leaving this page for their email. */}
          <ol className="space-y-2">
            {k.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-base leading-snug">
                <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-current/10 text-sm font-bold">
                  {i + 1}
                </span>
                <span>{fmt(step, { subject: fmt(t.email.codeSubject, { code: k.hidden }) })}</span>
              </li>
            ))}
          </ol>
          <label className="block">
            <span className="text-sm font-semibold">{a.codeLabel}</span>
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => enterCode(e.target.value)}
              className={`mt-1 ${field} tracking-[0.4em]`}
            />
          </label>
          {canPaste && (
            <button type="button" onClick={pasteCode} disabled={busy} className="btn btn-paper w-full py-3 text-base disabled:opacity-60">
              {k.paste}
            </button>
          )}
          {pasteHint && <p className="text-base font-semibold">{k.pasteHint}</p>}
          <button type="button" onClick={() => checkCode()} disabled={busy} className="btn btn-ink w-full py-3 text-base disabled:opacity-60">
            {busy ? a.checking : a.checkCode}
          </button>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setResent(false);
                setError(null);
                keepSent(null);
              }}
              className="min-h-12 rounded-full border-2 border-current/25 px-4 text-base font-semibold transition hover:border-current/60"
            >
              {a.otherEmail}
            </button>
            <button type="button" onClick={sendCode} disabled={busy} className="min-h-12 rounded-full border-2 border-current/25 px-4 text-base font-semibold transition hover:border-current/60 disabled:opacity-60">
              {a.sendAgain}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
