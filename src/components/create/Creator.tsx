"use client";

import { useEffect, useState } from "react";
import { CardPlayer } from "@/components/card/CardPlayer";
import { Logo } from "@/components/Logo";
import { PhoneFrame } from "@/components/PhoneFrame";
import { EFFECTS, OCCASIONS, THEMES, type CardData, type Effect, type Occasion, type Screen, type ThemeName } from "@/lib/card";
import { ProductThumb } from "@/components/catalog/ProductThumb";
import { TEMPLATES, buildCard, deviceInfo, getTemplate, toneInfo } from "@/lib/catalog";
import { defaultTemplate, occasions } from "@/lib/templates";
import { themes } from "@/lib/themes";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { Field, ScreenEditor, Select } from "./ScreenEditor";

const DRAFT_KEY = "sv-draft-v1";
const MAX_SCREENS = 12;

type Addable = Exclude<Screen["type"], "intro" | "finale">;

// What "Add a screen" offers, with a starting point for each.
const NEW_SCREENS: Record<Addable, { emoji: string; make: () => Screen }> = {
  message: { emoji: "💌", make: () => ({ id: uid(), type: "message", title: "A little note", body: "" }) },
  photos: { emoji: "📸", make: () => ({ id: uid(), type: "photos", title: "Us ❤️", photos: [], captions: [] }) },
  question: {
    emoji: "🙅",
    make: () => ({ id: uid(), type: "question", question: "Do you love me?", yes: "Yes", no: "No", afterYes: "Good answer 😌" }),
  },
  game: {
    emoji: "🎮",
    make: () => ({ id: uid(), type: "game", game: "catch-hearts", title: "Quick game!", instructions: "Tap 10 falling hearts", winText: "You did it!" }),
  },
  wheel: {
    emoji: "🎡",
    make: () => ({
      id: uid(),
      type: "wheel",
      title: "Spin for your prize",
      instructions: "Whatever it lands on, you get",
      options: ["A hug", "Dinner on me", "A movie night", "Breakfast in bed"],
      landOn: -1,
      winText: "The wheel has spoken!",
    }),
  },
  coupons: {
    emoji: "🎟️",
    make: () => ({ id: uid(), type: "coupons", title: "Your coupon book", instructions: "Tap one to redeem it", coupons: ["One free hug", "Breakfast in bed", "You pick the film"] }),
  },
  reasons: {
    emoji: "🫙",
    make: () => ({ id: uid(), type: "reasons", title: "Reasons I love you", instructions: "Tap the jar to pull out a note", reasons: ["Your laugh", "Your terrible jokes", "How kind you are"] }),
  },
  quiz: {
    emoji: "❓",
    make: () => ({
      id: uid(),
      type: "quiz",
      title: "Quick quiz",
      questions: [{ question: "Where did we first meet?", options: ["", ""], answer: 0 }],
      winText: "You know me so well!",
    }),
  },
  slider: {
    emoji: "📈",
    make: () => ({ id: uid(), type: "slider", title: "How much do you love me?", low: "A little", high: "SO much", winText: "Correct answer 😌" }),
  },
  timeline: {
    emoji: "🗓️",
    make: () => ({ id: uid(), type: "timeline", title: "Our story so far", events: [{ when: "The day we met", what: "" }, { when: "Today", what: "Still my favourite person" }] }),
  },
  boxes: {
    emoji: "🎁",
    make: () => ({ id: uid(), type: "boxes", title: "Pick a box", instructions: "Choose wisely…", prizes: ["A hug", "A kiss", "Both"] }),
  },
  scratch: {
    emoji: "🪙",
    make: () => ({ id: uid(), type: "scratch", title: "Scratch for a surprise", instructions: "Scratch the silver panel", hidden: "Surprise! 🎉" }),
  },
  typeit: {
    emoji: "⌨️",
    make: () => ({ id: uid(), type: "typeit", title: "Enter the password", instructions: "You know it…", phrase: "I love you", winText: "Unlocked!" }),
  },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Step = "occasion" | "design" | "names" | "edit" | "done";

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
type CreatorProps = { initialOccasion?: Occasion; initialTemplate?: string; initialTo?: string; initialFrom?: string; initialTheme?: ThemeName };

export function Creator({ initialOccasion, initialTemplate, initialTo, initialFrom, initialTheme }: CreatorProps) {
  const { t } = useI18n();
  const c = t.create;
  // Fireworks only work as a finale effect, so they're not offered as a background.
  const ambientOptions = Object.fromEntries(
    EFFECTS.filter((x) => x !== "fireworks").map((x) => [x, x === "confetti" ? t.labels.partyEmoji : t.labels.effects[x]]),
  ) as Record<Exclude<Effect, "fireworks">, string>;
  const chosen = getTemplate(initialTemplate);
  const [draft] = useState(() => (initialOccasion || chosen ? null : loadDraft()));
  const [step, setStep] = useState<Step>(draft ? "edit" : chosen ? "names" : initialOccasion ? "design" : "occasion");
  const [occasion, setOccasion] = useState<Occasion>(draft?.occasion ?? chosen?.occasion ?? initialOccasion ?? "valentine");
  const [templateSlug, setTemplateSlug] = useState<string | undefined>(chosen?.slug);
  const [to, setTo] = useState(draft?.to ?? initialTo ?? "");
  const [from, setFrom] = useState(draft?.from ?? initialFrom ?? "");
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
    const template = getTemplate(templateSlug) ?? defaultTemplate(occasion);
    const built = buildCard(template, to.trim(), from.trim());
    // A colour picked on the product page carries over, but only for that design.
    const c = initialTheme && template.slug === initialTemplate ? { ...built, theme: initialTheme } : built;
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
  const addScreen = (type: Addable) => {
    const s = NEW_SCREENS[type].make();
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
    if (!card.to.trim() || !card.from.trim()) return setError(c.needNames);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(card) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? c.failed);
      setCardId(json.id);
      setStep("done");
      clearDraft();
    } catch (e) {
      setError(e instanceof Error ? e.message : c.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <div aria-hidden className="airmail h-1.5" />
      <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <Logo textClass="text-foreground" />
        {step === "edit" && (
          <button onClick={startOver} className="text-sm font-semibold opacity-70 hover:opacity-100">
            {c.startOver}
          </button>
        )}
      </header>

      {step === "occasion" && (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <h1 className="text-center font-brand text-4xl font-bold">{c.occasionTitle}</h1>
          <p className="mt-2 text-center opacity-70">
            {fmt(c.occasionIntro, { o: OCCASIONS.length, n: TEMPLATES.length })}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setOccasion(o);
                  setStep("design");
                }}
                className="rounded-3xl border border-line bg-panel p-4 text-start shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{occasions[o].emoji}</span>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">{fmt(t.common.designs, { n: TEMPLATES.filter((x) => x.occasion === o).length })}</span>
                </div>
                <div className="mt-3 font-brand text-lg font-bold leading-tight">{t.occasions[o].label}</div>
                <p className="mt-1 text-sm leading-snug opacity-70">{t.occasions[o].tagline}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "design" && (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <button onClick={() => setStep("occasion")} className="text-sm font-semibold opacity-70">
            {c.allOccasions}
          </button>
          <h1 className="mt-4 font-brand text-4xl font-bold">
            {fmt(c.designTitle, { label: t.occasions[occasion].label, emoji: occasions[occasion].emoji })}
          </h1>
          <p className="mt-1 opacity-70">{c.designIntro}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TEMPLATES.filter((x) => x.occasion === occasion).map((tpl) => (
              <div key={tpl.slug} className="group overflow-hidden rounded-3xl border border-line bg-panel shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md">
                <button
                  onClick={() => {
                    setTemplateSlug(tpl.slug);
                    setStep("names");
                  }}
                  className="block w-full text-start"
                >
                  <ProductThumb template={tpl} />
                  <div className="p-3">
                    <p className="font-brand font-bold leading-tight">{tpl.name}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {toneInfo[tpl.tone].emoji} {t.tones[tpl.tone]} · {deviceInfo[tpl.device].emoji} {t.devices[tpl.device].label}
                    </p>
                  </div>
                </button>
                <a href={`/cards/${tpl.slug}`} target="_blank" rel="noreferrer" className="block border-t border-line px-3 py-2 text-xs font-semibold text-brand">
                  {c.previewIt}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === "names" && (
        <section className="mx-auto max-w-md px-4 py-12">
          <button onClick={() => setStep("design")} className="text-sm font-semibold opacity-70">
            ← {getTemplate(templateSlug)?.name ?? t.occasions[occasion].label}
          </button>
          <h1 className="mt-4 font-brand text-4xl font-bold">{c.namesTitle}</h1>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (to.trim() && from.trim()) start();
            }}
          >
            <Field label={c.theirName} value={to} max={40} onChange={setTo} placeholder={c.theirExample} />
            <Field label={c.yourName} value={from} max={40} onChange={setFrom} placeholder={c.yourExample} />
            <button
              disabled={!to.trim() || !from.trim()}
              className="w-full rounded-full bg-brand py-3.5 font-brand text-lg font-semibold text-white disabled:opacity-40"
            >
              {c.next}
            </button>
          </form>
        </section>
      )}

      {step === "edit" && card && (
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6 pb-28 lg:pb-10">
            <div>
              <h1 className="font-brand text-3xl font-bold">{c.editTitle}</h1>
              <p className="mt-1 opacity-70">{c.editIntro}</p>
            </div>

            <Panel title={c.look}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={c.theirName} value={card.to} max={40} onChange={(v) => setCard({ ...card, to: v })} />
                <Field label={c.yourName} value={card.from} max={40} onChange={(v) => setCard({ ...card, from: v })} />
              </div>
              <div>
                <span className="text-sm font-semibold">{c.colours}</span>
                <div className="mt-2 flex flex-wrap gap-3">
                  {THEMES.map((x) => (
                    <button
                      key={x}
                      onClick={() => setCard({ ...card, theme: x })}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${card.theme === x ? "border-brand ring-2 ring-brand/30" : "border-line"}`}
                    >
                      <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: themes[x].background }} />
                      {t.themes[x]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label={c.background}
                  value={card.ambient === "fireworks" ? "none" : card.ambient}
                  options={ambientOptions}
                  onChange={(v) => setCard({ ...card, ambient: v })}
                />
                <Select label={c.music} value={card.music ?? "none"} options={t.labels.music} onChange={(v) => setCard({ ...card, music: v })} />
              </div>
            </Panel>

            <div className="space-y-3">
              <h2 className="font-brand text-xl font-bold">{c.screens}</h2>
              {card.screens.map((s, i) => {
                const open = selected === s.id;
                return (
                  <div key={s.id} className={`rounded-2xl border bg-panel ${open ? "border-brand shadow-md" : "border-line"}`}>
                    <div className="flex items-center gap-2 px-4 py-3">
                      <button onClick={() => setSelected(open ? undefined : s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{i + 1}</span>
                        <span className="shrink-0 font-semibold">{t.labels.screens[s.type]}</span>
                        <span className="hidden min-w-0 truncate text-sm opacity-60 sm:block">{summary(s)}</span>
                      </button>
                      <IconButton label={c.moveUp} onClick={() => moveScreen(s.id, -1)} disabled={i === 0}>↑</IconButton>
                      <IconButton label={c.moveDown} onClick={() => moveScreen(s.id, 1)} disabled={i === card.screens.length - 1}>↓</IconButton>
                      <IconButton label={c.remove} onClick={() => removeScreen(s.id)} disabled={card.screens.length <= 1}>✕</IconButton>
                    </div>
                    {open && (
                      <div className="space-y-4 border-t border-line px-4 py-4">
                        <ScreenEditor screen={s} onChange={(update) => updateScreen(s.id, update)} />
                      </div>
                    )}
                  </div>
                );
              })}
              {card.screens.length < MAX_SCREENS ? (
                <div className="rounded-2xl border border-dashed border-line p-4">
                  <p className="text-sm font-bold">{c.addScreen}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(Object.keys(NEW_SCREENS) as Addable[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => addScreen(type)}
                        className="flex items-start gap-2 rounded-xl border border-line bg-panel p-2.5 text-start transition hover:-translate-y-0.5 hover:border-brand"
                      >
                        <span className="text-xl leading-none">{NEW_SCREENS[type].emoji}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-tight">{t.labels.screens[type]}</span>
                          <span className="mt-0.5 block text-xs leading-tight opacity-60">{c.hints[type]}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm opacity-60">{fmt(c.maxScreens, { n: MAX_SCREENS })}</p>
              )}
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-line bg-background/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
              <button onClick={() => setShowPreview(true)} className="flex-1 rounded-full border border-line py-3.5 font-semibold lg:hidden">
                {c.preview}
              </button>
              <button onClick={publish} disabled={saving} className="flex-[2] rounded-full bg-brand py-3.5 font-brand text-lg font-semibold text-white shadow-lg disabled:opacity-50 lg:w-full">
                {saving ? c.creating : c.create}
              </button>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <PhoneFrame className="mx-auto h-[680px] w-[340px]">
                <CardPlayer card={card} preview sound focusScreenId={selected} />
              </PhoneFrame>
              <p className="mt-3 text-center text-xs opacity-60">{c.livePreview}</p>
            </div>
          </aside>
        </div>
      )}

      {showPreview && card && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <CardPlayer card={card} preview sound focusScreenId={selected} />
          <button onClick={() => setShowPreview(false)} className="absolute start-4 top-4 z-50 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
            {c.closePreview}
          </button>
        </div>
      )}

      {step === "done" && cardId && <Done id={cardId} to={card?.to ?? ""} onAnother={startOver} />}
    </div>
  );
}

function Done({ id, to, onAnother }: { id: string; to: string; onAnother: () => void }) {
  const c = useI18n().t.create;
  const url = `${window.location.origin}/c/${id}`;
  const [copied, setCopied] = useState(false);

  const message = fmt(c.whatsappMessage, { url });
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
      <h1 className="mt-4 font-brand text-4xl font-bold">{c.readyTitle}</h1>
      <p className="mt-2 opacity-70">{fmt(c.readyBody, { name: to || c.them })}</p>
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-panel p-2 pl-4">
        <span className="flex-1 truncate text-start text-sm" dir="ltr">{url}</span>
        <button onClick={copy} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
          {copied ? c.copied : c.copy}
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="rounded-full bg-[#25D366] py-3.5 font-semibold text-white">
          {c.whatsapp}
        </a>
        <a href={`/c/${id}`} target="_blank" className="rounded-full border border-line py-3.5 font-semibold">
          {c.openCard}
        </a>
        <button onClick={onAnother} className="py-2 text-sm font-semibold opacity-70">
          {c.another}
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
    case "quiz":
    case "scratch":
    case "typeit":
    case "wheel":
    case "coupons":
    case "reasons":
    case "slider":
    case "timeline":
    case "boxes":
      return s.title;
    case "question":
      return s.question;
  }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-panel p-4">
      <h2 className="font-brand text-xl font-bold">{title}</h2>
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
