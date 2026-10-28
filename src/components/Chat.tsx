"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useI18n } from "@/i18n/client";
import { usePathname } from "next/navigation";
import { OPEN_CHAT } from "./open-chat";
import { Fragment, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const STORE = "sv-chat";
const MAX_LENGTH = 800;

// Turns the assistant's light markdown (paragraphs, "- " lists, **bold** and
// links to our own pages) into elements. Anything else stays as plain text.
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g;

function Inline({ text, onLink }: { text: string; onLink: () => void }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    parts.push(text.slice(last, match.index));
    if (match[1]) parts.push(<b key={match.index}>{match[1]}</b>);
    else
      parts.push(
        <Link key={match.index} href={match[3]} onClick={onLink} className="font-semibold text-hot underline underline-offset-2">
          {match[2]}
        </Link>,
      );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function Rich({ text, onLink }: { text: string; onLink: () => void }) {
  return (
    <>
      {text
        .trim()
        .split(/\n{2,}/)
        .map((block, i) => {
          const lines = block.split("\n");
          if (lines.every((l) => /^\s*[-•*] /.test(l))) {
            return (
              <ul key={i} className="list-disc space-y-1 ps-5">
                {lines.map((l, j) => (
                  <li key={j}>
                    <Inline text={l.replace(/^\s*[-•*] /, "")} onLink={onLink} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i}>
              {lines.map((l, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  <Inline text={l} onLink={onLink} />
                </Fragment>
              ))}
            </p>
          );
        })}
    </>
  );
}

function restore(): { messages?: Message[]; open?: boolean } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
    return Array.isArray(saved?.messages) ? saved : {};
  } catch {
    return {};
  }
}

// The live chat bubble in the bottom corner of every page. Rendered only in the
// browser (see ChatWidget.tsx), so it can read the saved chat on first render.
export function Chat() {
  const path = usePathname();
  const { locale, t } = useI18n();
  const c = t.chat;
  const [saved] = useState(restore);
  const [open, setOpen] = useState(!!saved.open);
  const [messages, setMessages] = useState<Message[]>(saved.messages ?? []);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController | null>(null);

  // Keep the conversation if they reload the page.
  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ messages, open }));
    } catch {}
  }, [messages, open, busy]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages, busy, error]);

  useEffect(() => {
    if (!open) return;
    input.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => request.current?.abort(), []);

  // Other parts of the site can open it (the card maker's Help button on phones).
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_CHAT, show);
    return () => window.removeEventListener(OPEN_CHAT, show);
  }, []);

  // Never on the card itself, where it would cover what they're playing.
  if (path.startsWith("/c/") || path.startsWith("/demo/")) return null;

  const closeOnPhone = () => {
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  };

  async function send(text: string) {
    text = text.trim().slice(0, MAX_LENGTH);
    if (!text || busy) return;
    const history: Message[] = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setError("");
    setShowHelp(false);
    setBusy(true);
    const controller = new AbortController();
    request.current = controller;
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map((m) => ({ ...m, content: m.content.slice(0, 4000) })), page: path, locale }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        if (res.status === 503) setShowHelp(true);
        throw new Error(data?.error ?? c.errors.generic);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "text") reply += event.text;
          else if (event.type === "reset") reply = "";
          else if (event.type === "error") throw new Error(event.message);
        }
        setMessages([...history, { role: "assistant", content: reply }]);
      }
      if (!reply.trim()) throw new Error(c.errors.generic);
    } catch (e) {
      if (controller.signal.aborted) return;
      // Put their message back so they can send it again.
      setMessages(messages);
      setDraft(text);
      setError(e instanceof Error ? e.message : c.errors.generic);
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  const restart = () => {
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setMessages([]);
    setError("");
    setDraft("");
  };

  // On phones the card maker has a Help button in its top bar instead, so this
  // never sits over an answer or the Next button.
  const lift = path.startsWith("/create") ? "max-lg:hidden bottom-5" : "bottom-5";

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="site-chat"
        aria-label={open ? c.closeAria : c.openAria}
        className={`btn btn-ink fixed end-4 z-40 h-14 px-4 shadow-[3px_3px_0_var(--color-hot)] sm:end-5 ${lift} ${open ? "max-sm:hidden" : ""}`}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="currentColor">
            <path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4.3 21l4-2.1c1.2.4 2.4.6 3.7.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3Z" />
          </svg>
        )}
        <span className="hidden sm:inline">{open ? c.close : c.open}</span>
      </button>

      {open && (
        <section
          id="site-chat"
          role="dialog"
          aria-label={c.dialogAria}
          className={`fixed inset-x-3 z-[60] flex animate-[fade-in_0.2s_ease-out] flex-col overflow-hidden rounded-2xl border-2 border-ink bg-cream text-ink shadow-[5px_5px_0_var(--color-ink)] max-sm:bottom-3 max-sm:top-[max(0.75rem,env(safe-area-inset-top))] sm:inset-x-auto sm:end-5 sm:h-[min(580px,calc(100dvh-8rem))] sm:w-[380px] ${path.startsWith("/create") ? "sm:bottom-44 lg:bottom-24" : "sm:bottom-24"}`}
        >
          <header className="flex items-center gap-3 border-b-2 border-ink bg-ink px-4 py-3 text-paper">
            <LogoMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-brand font-semibold leading-tight">{c.title}</p>
              <p className="text-xs text-white/60">{c.subtitle}</p>
            </div>
            {messages.length > 0 && (
              <button onClick={restart} className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">
                {c.newChat}
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label={c.closeAria} className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div ref={list} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 text-[15px] leading-relaxed" aria-live="polite">
            <div className="max-w-[85%] rounded-2xl rounded-ss-md border-2 border-ink/10 bg-paper px-3.5 py-2.5">{c.greeting}</div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {c.starters.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border-2 border-ink/15 bg-paper px-3 py-1 text-sm font-semibold transition hover:border-ink">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ms-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-se-md bg-hot px-3.5 py-2.5 text-white">
                  {m.content}
                </div>
              ) : m.content ? (
                <div key={i} className="max-w-[85%] space-y-2 break-words rounded-2xl rounded-ss-md border-2 border-ink/10 bg-paper px-3.5 py-2.5">
                  <Rich text={m.content} onLink={closeOnPhone} />
                </div>
              ) : (
                <div key={i} className="flex w-fit gap-1 rounded-2xl rounded-ss-md border-2 border-ink/10 bg-paper px-4 py-3.5" aria-label={c.typing}>
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-ink/40" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </div>
              ),
            )}
            {error && (
              <p role="alert" className="rounded-2xl bg-hot/10 px-3.5 py-2.5 text-sm text-ink">
                {error}{" "}
                {showHelp && (
                  <Link href="/help" onClick={closeOnPhone} className="font-semibold text-hot underline">
                    {c.openHelp}
                  </Link>
                )}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-end gap-2 border-t-2 border-ink bg-paper p-3"
          >
            <textarea
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              rows={1}
              maxLength={MAX_LENGTH}
              placeholder={c.placeholder}
              aria-label={c.inputAria}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-2 border-ink/20 bg-cream px-3.5 py-2 text-base outline-none [field-sizing:content] focus:border-ink"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label={c.send}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-hot text-white transition enabled:hover:bg-ink disabled:opacity-40"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="currentColor">
                <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
              </svg>
            </button>
          </form>
          <p className="bg-paper px-4 pb-2 text-center text-[11px] text-ink/50">{c.footer}</p>
        </section>
      )}
    </>
  );
}
