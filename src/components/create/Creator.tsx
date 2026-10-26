"use client";

import { useEffect, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { Logo } from "@/components/Logo";
import { PhoneFrame } from "@/components/PhoneFrame";
import { OCCASIONS, THEMES, type CardData, type Effect, type Occasion, type Screen } from "@/lib/card";
import { buildTemplate, occasions } from "@/lib/templates";
import { themes } from "@/lib/themes";
import { Field, SCREEN_LABELS, ScreenEditor, Select } from "./ScreenEditor";

const DRAFT_KEY = "sv-draft-v1";
const MAX_SCREENS = 12;

// Fireworks only work as a finale effect, so they're not offered as a background.
const AMBIENT_OPTIONS: Record<Exclude<Effect, "fireworks">, string> = {
  hearts: "Floating hearts",
  sparkles: "Sparkles",
  confetti: "Party emoji",
  none: "Nothing",
};

const NEW_SCREENS: Record<"message" | "photos" | "game" | "question", () => Screen> = {
  message: () => ({ id: uid(), type: "message", title: "A little note", body: "" }),
  photos: () => ({ id: uid(), type: "photos", title: "Us ❤️", photos: [], captions: [] }),
  game: () => ({ id: uid(), type: "game", game: "catch-hearts", title: "Quick game!", instructions: "Tap 10 falling hearts", winText: "You did it!" }),
  question: () => ({ id: uid(), type: "question", question: "Do you love me?", yes: "Yes", no: "No", afterYes: "Good answer 😌" }),
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Step = "occasion" | "names" | "edit" | "done";

// An unfinished card is kept in localStorage so a refresh doesn't lose someone's work.
function loadDraft(): CardData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CardData) : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

// Rendered client-only (see app/create/page.tsx), so reading localStorage on first render is safe.
export function Creator({ initialOccasion }: { initialOccasion?: Occasion }) {
  const [draft] = useState(() => (initialOccasion ? null : loadDraft()));
  const [step, setStep] = useState<Step>(draft ? "edit" : initialOccasion ? "names" : "occasion");
  const [occasion, setOccasion] = useState<Occasion>(draft?.occasion ?? initialOccasion ?? "valentine");
  const [to, setTo] = useState(draft?.to ?? "");
  const [from, setFrom] = useState(draft?.from ?? "");
  const [card, setCard] = useState<CardData | null>(draft);
  const [selected, setSelected] = useState<string | undefined>(draft?.screens[0]?.id);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (card && step === "edit") localStorage.setItem(DRAFT_KEY, JSON.stringify(card));
    } catch {}
  }, [card, step]);

  const start = () => {
    const c = buildTemplate(occasion, to.trim(), from.trim());
    setCard(c);
    setSelected(c.screens[0].id);
    setStep("edit");
  };

  const startOver = () => {
    clearDraft();
    setCard(null);
    setCardId(null);
    setTo("");
    setFrom("");
    setStep("occasion");
  };

  const updateScreen = (id: string, update: (s: Screen) => Screen) =>
    setCard((c) => c && { ...c, screens: c.screens.map((x) => (x.id === id ? update(x) : x)) });
  const moveScreen = (id: string, dir: -1 | 1) =>
    setCard((c) => {
      if (!c) return c;
      const i = c.screens.findIndex((s) => s.id === id);
      const j = i + dir;
      if (j < 0 || j >= c.screens.length) return c;
      const screens = [...c.screens];
      [screens[i], screens[j]] = [screens[j], screens[i]];
      return { ...c, screens };
    });
  const removeScreen = (id: string) => setCard((c) => c && { ...c, screens: c.screens.filter((s) => s.id !== id) });
  const addScreen = (type: keyof typeof NEW_SCREENS) => {
    const s = NEW_SCREENS[type]();
    setCard((c) => {
      if (!c) return c;
      const finale = c.screens.findIndex((x) => x.type === "finale");
      const screens = [...c.screens];
      screens.splice(finale >= 0 ? finale : screens.length, 0, s);
      return { ...c, screens };
    });
    setSelected(s.id);
  };

  const publish = async () => {
    if (!card) return;
    if (!card.to.trim() || !card.from.trim()) return setError("Add both names first.");
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(card) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
      setCardId(json.id);
      setStep("done");
      clearDraft();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <Logo textClass="text-foreground" />
        {step === "edit" && (
          <button onClick={startOver} className="text-sm font-semibold opacity-70 hover:opacity-100">
            Start over
          </button>
        )}
      </header>

      {step === "occasion" && (
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-center font-display text-4xl font-bold">What are we celebrating?</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setOccasion(o);
                  setStep("names");
                }}
                className="rounded-3xl border border-line bg-panel p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md"
              >
                <div className="text-5xl">{occasions[o].emoji}</div>
                <div className="mt-3 font-display text-xl font-bold">{occasions[o].label}</div>
                <p className="mt-1 text-sm opacity-70">{occasions[o].tagline}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "names" && (
        <section className="mx-auto max-w-md px-4 py-12">
          <button onClick={() => setStep("occasion")} className="text-sm font-semibold opacity-70">
            ← {occasions[occasion].emoji} {occasions[occasion].label}
          </button>
          <h1 className="mt-4 font-display text-4xl font-bold">Who&apos;s it for?</h1>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (to.trim() && from.trim()) start();
            }}
          >
            <Field label="Their name" value={to} max={40} onChange={setTo} placeholder="e.g. Priya" />
            <Field label="Your name" value={from} max={40} onChange={setFrom} placeholder="e.g. Sam" />
            <button
              disabled={!to.trim() || !from.trim()}
              className="w-full rounded-full bg-brand py-3.5 font-display text-lg font-semibold text-white disabled:opacity-40"
            >
              Next: make it yours →
            </button>
          </form>
        </section>
      )}

      {step === "edit" && card && (
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6 pb-28 lg:pb-10">
            <div>
              <h1 className="font-display text-3xl font-bold">Make it yours</h1>
              <p className="mt-1 opacity-70">Change any words, add your photos, and preview as you go.</p>
            </div>

            <Panel title="Look & feel">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Their name" value={card.to} max={40} onChange={(v) => setCard({ ...card, to: v })} />
                <Field label="Your name" value={card.from} max={40} onChange={(v) => setCard({ ...card, from: v })} />
              </div>
              <div>
                <span className="text-sm font-semibold">Colours</span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setCard({ ...card, theme: t })}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${card.theme === t ? "border-brand ring-2 ring-brand/30" : "border-line"}`}
                    >
                      <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: themes[t].background }} />
                      {themes[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <Select
                label="Background effect"
                value={card.ambient === "fireworks" ? "none" : card.ambient}
                options={AMBIENT_OPTIONS}
                onChange={(v) => setCard({ ...card, ambient: v })}
              />
            </Panel>

            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold">Screens</h2>
              {card.screens.map((s, i) => {
                const open = selected === s.id;
                return (
                  <div key={s.id} className={`rounded-2xl border bg-panel ${open ? "border-brand shadow-md" : "border-line"}`}>
                    <div className="flex items-center gap-2 px-4 py-3">
                      <button onClick={() => setSelected(open ? undefined : s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i + 1}</span>
                        <span className="shrink-0 font-semibold">{SCREEN_LABELS[s.type]}</span>
                        <span className="hidden min-w-0 truncate text-sm opacity-60 sm:block">{summary(s)}</span>
                      </button>
                      <IconButton label="Move up" onClick={() => moveScreen(s.id, -1)} disabled={i === 0}>↑</IconButton>
                      <IconButton label="Move down" onClick={() => moveScreen(s.id, 1)} disabled={i === card.screens.length - 1}>↓</IconButton>
                      <IconButton label="Remove screen" onClick={() => removeScreen(s.id)} disabled={card.screens.length <= 1}>✕</IconButton>
                    </div>
                    {open && (
                      <div className="space-y-4 border-t border-line px-4 py-4">
                        <ScreenEditor screen={s} onChange={(update) => updateScreen(s.id, update)} />
                      </div>
                    )}
                  </div>
                );
              })}
              {card.screens.length < MAX_SCREENS && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-sm font-semibold opacity-70">Add:</span>
                  {(Object.keys(NEW_SCREENS) as (keyof typeof NEW_SCREENS)[]).map((t) => (
                    <button key={t} onClick={() => addScreen(t)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-brand hover:text-brand">
                      + {SCREEN_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-line bg-background/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
              <button onClick={() => setShowPreview(true)} className="flex-1 rounded-full border border-line py-3.5 font-semibold lg:hidden">
                Preview
              </button>
              <button onClick={publish} disabled={saving} className="flex-[2] rounded-full bg-brand py-3.5 font-display text-lg font-semibold text-white shadow-lg disabled:opacity-50 lg:w-full">
                {saving ? "Creating…" : "Create my card 💌"}
              </button>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <PhoneFrame className="mx-auto h-[680px] w-[340px]">
                <CardPlayer card={card} preview focusScreenId={selected} />
              </PhoneFrame>
              <p className="mt-3 text-center text-xs opacity-60">Live preview. Tap through it like they will.</p>
            </div>
          </aside>
        </div>
      )}

      {showPreview && card && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <CardPlayer card={card} preview focusScreenId={selected} />
          <button onClick={() => setShowPreview(false)} className="absolute right-4 top-4 z-50 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
            Close preview
          </button>
        </div>
      )}

      {step === "done" && cardId && <Done id={cardId} to={card?.to ?? ""} onAnother={startOver} />}
    </div>
  );
}

function Done({ id, to, onAnother }: { id: string; to: string; onAnother: () => void }) {
  const url = `${window.location.origin}/c/${id}`;
  const [copied, setCopied] = useState(false);

  const message = `I made you something 💌 ${url}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="mx-auto max-w-md px-4 py-14 text-center">
      <div className="text-7xl">🎉</div>
      <h1 className="mt-4 font-display text-4xl font-bold">Your card is ready!</h1>
      <p className="mt-2 opacity-70">Send this link to {to || "them"}. Only people with the link can open it.</p>
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-panel p-2 pl-4">
        <span className="flex-1 truncate text-left text-sm">{url}</span>
        <button onClick={copy} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] py-3.5 font-semibold text-white">
          Send on WhatsApp
        </a>
        <a href={`/c/${id}`} target="_blank" className="rounded-full border border-line py-3.5 font-semibold">
          Open the card
        </a>
        <button onClick={onAnother} className="py-2 text-sm font-semibold opacity-70">
          Make another one
        </button>
      </div>
    </section>
  );
}

function summary(s: Screen) {
  switch (s.type) {
    case "intro":
    case "message":
    case "photos":
    case "game":
    case "finale":
      return s.title;
    case "question":
      return s.question;
  }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-panel p-4">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} disabled={disabled} className="grid h-8 w-8 place-items-center rounded-full text-sm hover:bg-brand-soft disabled:opacity-25">
      {children}
    </button>
  );
}
