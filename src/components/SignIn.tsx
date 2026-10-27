"use client";

import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

// Signing in or up: Continue with Google, or a code emailed to them. Used on
// the last step of the questions and on My cards. Google leaves the site and comes
// back to `next`, so anything worth keeping is saved first (onGoogle).

export type SignedIn = { email: string | null; name: string | null };

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
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await post("/api/auth/email", { email: email.trim() });
      setSentTo(email.trim());
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : a.codeFailed);
    }
    setBusy(false);
  };

  const checkCode = async () => {
    if (!sentTo || code.trim().length < 6) return setError(a.badCode);
    setBusy(true);
    setError(null);
    try {
      const { account } = await post("/api/auth/verify", { email: sentTo, code: code.trim() });
      onSignedIn(account);
    } catch (e) {
      setError(e instanceof Error ? e.message : a.badCode);
      setBusy(false);
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
          <p aria-live="polite" className="text-sm opacity-75">
            {fmt(a.codeSent, { email: sentTo })}
          </p>
          <label className="block">
            <span className="text-sm font-semibold">{a.codeLabel}</span>
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`mt-1 ${field} tracking-[0.4em]`}
            />
          </label>
          <button type="button" onClick={checkCode} disabled={busy} className="btn btn-ink w-full py-3 text-base disabled:opacity-60">
            {busy ? a.checking : a.checkCode}
          </button>
          <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
            <button type="button" onClick={() => setSentTo(null)} className="opacity-60 underline-offset-4 hover:underline hover:opacity-100">
              {a.otherEmail}
            </button>
            <button type="button" onClick={sendCode} disabled={busy} className="opacity-60 underline-offset-4 hover:underline hover:opacity-100">
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
