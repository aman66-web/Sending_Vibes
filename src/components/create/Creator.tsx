"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { Motif } from "@/components/card/motifs";
import { Logo } from "@/components/Logo";
import { BrowserFrame } from "@/components/BrowserFrame";
import { PhoneFrame } from "@/components/PhoneFrame";
import { addToBasket } from "@/lib/basket";
import { EFFECTS, OCCASIONS, THEMES, type CardData, type Effect, type Occasion, type Screen, type ScreenType, type ThemeName } from "@/lib/card";
import { ProductThumb } from "@/components/catalog/ProductThumb";
import { TEMPLATES, buildCard, cardTier, deviceInfo, getTemplate, toneInfo } from "@/lib/catalog";
import { defaultTemplate, occasions } from "@/lib/templates";
import { formatMoney, price, tierPrice } from "@/lib/pricing";
import { themes } from "@/lib/themes";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { Field, ScreenEditor, Select } from "./ScreenEditor";

const DRAFT_KEY = "sv-draft-v1";
const MODE_KEY = "sv-draft-mode";
const MAX_SCREENS = 12;
// The designs shown next to each example description, in the same order as t.custom.examples.
const EXAMPLE_SLUGS = ["be-my-valentine", "birthday-bash", "festival-of-lights", "naughty-or-nice", "please-forgive-me", "for-the-best-mum"];

type Addable = Exclude<Screen["type"], "intro" | "finale">;

// What "Add a screen" offers, with a starting point for each.
const NEW_SCREENS: Record<Addable, { emoji: string; make: () => Screen }> = {
  message: { emoji: "💌", make: () => ({ id: uid(), type: "message", title: "A little note", body: "" }) },
  photos: { emoji: "📸", make: () => ({ id: uid(), type: "photos", title: "Us", photos: [], captions: [] }) },
  question: {
    emoji: "🙅",
    make: () => ({ id: uid(), type: "question", question: "Do you love me?", yes: "Yes", no: "No", afterYes: "Good answer" }),
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
    make: () => ({ id: uid(), type: "slider", title: "How much do you love me?", low: "A little", high: "SO much", winText: "Correct answer" }),
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
    make: () => ({ id: uid(), type: "scratch", title: "Scratch for a surprise", instructions: "Scratch the silver panel", hidden: "Surprise!" }),
  },
  typeit: {
    emoji: "⌨️",
    make: () => ({ id: uid(), type: "typeit", title: "Enter the password", instructions: "You know it…", phrase: "I love you", winText: "Unlocked!" }),
  },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type Step = "choose" | "describe" | "making" | "occasion" | "design" | "names" | "edit";
// Premade keeps a design's screens as they are; custom can change anything, including by typing.
type Mode = "premade" | "custom";
export type Start = Mode;

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
    localStorage.removeItem(MODE_KEY);
  } catch {}
}

function loadMode(draft: CardData): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === "premade" || saved === "custom") return saved;
  } catch {}
  return cardTier(draft);
}

// Rendered client-only (see app/create/page.tsx), so reading localStorage on first render is safe.
type CreatorProps = { initialOccasion?: Occasion; initialTemplate?: string; initialTo?: string; initialFrom?: string; initialTheme?: ThemeName; initialStart?: Start };

export function Creator({ initialOccasion, initialTemplate, initialTo, initialFrom, initialTheme, initialStart }: CreatorProps) {
  const { t, currency } = useI18n();
  const c = t.create;
  const x = t.custom;
  const router = useRouter();
  // Fireworks only work as a finale effect, so they're not offered as a background.
  const ambientOptions = Object.fromEntries(
    EFFECTS.filter((x) => x !== "fireworks").map((x) => [x, x === "confetti" ? t.labels.partyEmoji : t.labels.effects[x]]),
  ) as Record<Exclude<Effect, "fireworks">, string>;
  const chosen = getTemplate(initialTemplate);
  const [draft] = useState(() => (initialOccasion || chosen || initialStart ? null : loadDraft()));
  const [step, setStep] = useState<Step>(
    draft ? "edit" : chosen ? "names" : initialOccasion ? "design" : initialStart === "custom" ? "describe" : initialStart === "premade" ? "occasion" : "choose",
  );
  const [mode, setMode] = useState<Mode>(() => (draft ? loadMode(draft) : initialStart === "custom" ? "custom" : "premade"));
  const [occasion, setOccasion] = useState<Occasion>(draft?.occasion ?? chosen?.occasion ?? initialOccasion ?? "valentine");
  const [templateSlug, setTemplateSlug] = useState<string | undefined>(chosen?.slug);
  const [to, setTo] = useState(draft?.to ?? initialTo ?? "");
  const [from, setFrom] = useState(draft?.from ?? initialFrom ?? "");
  const [card, setCard] = useState<CardData | null>(draft);
  const [selected, setSelected] = useState<string | undefined>(draft?.screens[0]?.id);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Making a card by typing, and changing one by typing.
  const [idea, setIdea] = useState("");
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState<"make" | "change" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDone, setAiDone] = useState(false);
  const [undo, setUndo] = useState<CardData | null>(null);
  // The screens written so far while a card is being made, and a way to stop it.
  const [progress, setProgress] = useState<ScreenType[]>([]);
  const making = useRef<AbortController | null>(null);
  // The live preview: on a phone or a computer, which screen it's showing, and a nudge
  // that makes it jump back to a screen after that screen changes.
  const [view, setView] = useState<"phone" | "computer">(() => (draft?.device === "desktop" ? "computer" : "phone"));
  const [viewing, setViewing] = useState<string | undefined>();
  const [nudge, setNudge] = useState(0);
  const [screenAsk, setScreenAsk] = useState("");
  const [pickOccasion, setPickOccasion] = useState<Occasion | "all">("all");
  const ideaBox = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      if (card && step === "edit") {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(card));
        localStorage.setItem(MODE_KEY, mode);
      }
    } catch {}
  }, [card, step, mode]);

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
    setTo("");
    setFrom("");
    setUndo(null);
    setAiDone(false);
    setStep("choose");
  };

  // Asks for a new card from a description, or for a change to the current one. The
  // reply streams in: a line for each screen as it's written, then the finished card.
  const callAi = async (
    body: { prompt: string; card?: CardData },
    names: { to: string; from: string },
    onProgress?: (screens: ScreenType[]) => void,
    signal?: AbortSignal,
  ): Promise<CardData> => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, to: names.to.trim(), from: names.from.trim() }),
      signal,
    });
    if (!res.ok || !res.body) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? x.errors.failed);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end).trim();
        buffer = buffer.slice(end + 1);
        if (!line) continue;
        const event = JSON.parse(line);
        if (event.type === "progress") onProgress?.(event.screens);
        else if (event.type === "card") return event.card as CardData;
        else if (event.type === "error") throw new Error(event.error ?? x.errors.failed);
      }
    }
    throw new Error(x.errors.failed);
  };

  const makeFromIdea = async () => {
    if (idea.trim().length < 3) return setAiError(x.errors.describe);
    if (!to.trim() || !from.trim()) return setAiError(c.needNames);
    const controller = new AbortController();
    making.current = controller;
    setBusy("make");
    setAiError(null);
    setProgress([]);
    setStep("making");
    window.scrollTo({ top: 0 });
    try {
      const made = await callAi({ prompt: idea.trim() }, { to, from }, setProgress, controller.signal);
      setCard(made);
      setSelected(made.screens[0]?.id);
      setMode("custom");
      setStep("edit");
      window.scrollTo({ top: 0 });
    } catch (e) {
      if (!controller.signal.aborted) setAiError(e instanceof Error ? e.message : x.errors.failed);
      setStep("describe");
    }
    making.current = null;
    setBusy(null);
  };

  // A change to the whole card, or (with focus) to the screen showing in the preview.
  const changeByTyping = async (prompt = ask, focus?: string) => {
    if (!card || prompt.trim().length < 3) return setAiError(x.errors.describe);
    setBusy("change");
    setAiError(null);
    setAiDone(false);
    // Typing changes are a custom-card thing.
    setMode("custom");
    try {
      const changed = await callAi({ prompt: prompt.trim(), card, ...(focus ? { focus } : {}) }, { to: card.to, from: card.from });
      setUndo(card);
      setCard(changed);
      if (focus) {
        setScreenAsk("");
        // Show that screen again from the start, with the change.
        setSelected(focus);
        setNudge((n) => n + 1);
      } else setAsk("");
      setAiDone(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : x.errors.failed);
    }
    setBusy(null);
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
      // Saved but locked until it's paid for; the basket takes it from here.
      addToBasket({ id: json.id, to: card.to, from: card.from, occasion: card.occasion, theme: card.theme, template: card.template, tier: cardTier(card), delivery: "self" });
      clearDraft();
      router.push("/basket");
    } catch (e) {
      setError(e instanceof Error ? e.message : c.failed);
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

      {step === "choose" && (
        <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <h1 className="text-center font-brand text-4xl font-bold sm:text-5xl">{x.chooseTitle}</h1>
          <p className="mx-auto mt-3 max-w-xl text-center opacity-70">{x.chooseIntro}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Choice
              featured
              title={x.customTitle}
              easy={x.customEasy}
              body={x.customBody}
              points={x.customPoints}
              price={fmt(x.from, { price: price("custom", currency) })}
              perCard={x.perCard}
              cta={x.customCta}
              visual={<TypingDemo text={x.examples[1]} />}
              onClick={() => {
                setMode("custom");
                setStep("describe");
              }}
            />
            <Choice
              title={x.premadeTitle}
              easy={x.premadeEasy}
              body={fmt(x.premadeBody, { n: TEMPLATES.length })}
              points={x.premadePoints.map((p) => fmt(p, { n: TEMPLATES.length, o: OCCASIONS.length }))}
              price={price("card", currency)}
              perCard={x.perCard}
              cta={x.premadeCta}
              visual={<ThumbFan slugs={["birthday-bash", "be-my-valentine", "festival-of-lights"]} />}
              onClick={() => {
                setMode("premade");
                setStep("occasion");
              }}
            />
          </div>
        </section>
      )}

      {step === "describe" && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <button onClick={() => setStep("choose")} className="text-sm font-semibold opacity-70">
            {x.back}
          </button>
          <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <h1 className="font-brand text-4xl font-bold leading-tight sm:text-5xl">{x.describeTitle}</h1>
              <p className="mt-3 max-w-xl opacity-70">{x.describeIntro}</p>
              <form
                className="mt-6 space-y-4 rounded-3xl border border-line bg-panel p-4 shadow-sm sm:p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  makeFromIdea();
                }}
              >
                <label className="block">
                  <span className="text-sm font-semibold">{x.describeLabel}</span>
                  <textarea
                    ref={ideaBox}
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    maxLength={1000}
                    rows={5}
                    dir="auto"
                    placeholder={x.describePlaceholder}
                    className="mt-1 w-full resize-y rounded-2xl border border-line bg-background px-4 py-3 text-base leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={c.theirName} value={to} max={40} onChange={setTo} placeholder={c.theirExample} />
                  <Field label={c.yourName} value={from} max={40} onChange={setFrom} placeholder={c.yourExample} />
                </div>
                <button disabled={busy !== null} className="w-full rounded-full bg-brand py-3.5 font-brand text-lg font-semibold text-white shadow-lg disabled:opacity-70">
                  {x.make} ✨
                </button>
                <p className="text-center text-sm opacity-60">{x.takesAMoment}</p>
                {aiError && <p className="text-sm font-semibold text-red-600">{aiError}</p>}
              </form>

              <h2 className="mt-10 font-brand text-xl font-bold">{x.examplesTitle}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {x.examples.map((example, i) => {
                  const tpl = getTemplate(EXAMPLE_SLUGS[i]);
                  return (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setIdea(example);
                        setAiError(null);
                        ideaBox.current?.scrollIntoView({ block: "center", behavior: "smooth" });
                        ideaBox.current?.focus({ preventScroll: true });
                      }}
                      className="flex items-start gap-3 rounded-2xl border border-line bg-panel p-3 text-start transition hover:-translate-y-0.5 hover:border-brand"
                    >
                      {tpl && (
                        <span aria-hidden className="relative grid aspect-[4/5] w-12 shrink-0 place-items-center rounded-sm shadow-sm" style={{ background: themes[tpl.theme].background, color: themes[tpl.theme].accent }}>
                          <span className="absolute inset-[8%] border" style={{ borderColor: themes[tpl.theme].muted, opacity: 0.55 }} />
                          <Motif occasion={tpl.occasion} className="h-6 w-6" />
                        </span>
                      )}
                      <span dir="auto" className="text-sm leading-snug opacity-80">
                        {example}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="min-w-0">
              <div className="rounded-3xl border border-line bg-panel p-4 sm:p-5 lg:sticky lg:top-6">
                <h2 className="font-brand text-2xl font-bold">{x.orTemplate}</h2>
                <p className="mt-1 text-sm opacity-70">{x.orTemplateIntro}</p>
                <select
                  value={pickOccasion}
                  onChange={(e) => setPickOccasion(e.target.value as Occasion | "all")}
                  aria-label={x.orTemplate}
                  className="mt-4 w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm font-semibold"
                >
                  <option value="all">{x.allOccasions}</option>
                  {OCCASIONS.map((o) => (
                    <option key={o} value={o}>
                      {occasions[o].emoji} {t.occasions[o].label}
                    </option>
                  ))}
                </select>
                <div className="mt-4 grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto pe-1 sm:grid-cols-3 lg:grid-cols-2">
                  {TEMPLATES.filter((tpl) => pickOccasion === "all" || tpl.occasion === pickOccasion).map((tpl) => (
                    <button
                      key={tpl.slug}
                      type="button"
                      onClick={() => {
                        setTemplateSlug(tpl.slug);
                        setOccasion(tpl.occasion);
                        setMode("custom");
                        setStep("names");
                      }}
                      className="overflow-hidden rounded-2xl border border-line bg-background text-start transition hover:-translate-y-0.5 hover:border-brand"
                    >
                      <ProductThumb template={tpl} />
                      <p className="p-2 text-xs font-bold leading-tight">{tpl.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      )}

      {step === "making" && (
        <section className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
          <WritingEnvelope />
          <h1 className="mt-6 font-brand text-4xl font-bold sm:text-5xl">{x.makingTitle}</h1>
          <p className="mt-2 min-h-6 opacity-70">
            <RotatingLine lines={x.making} />
          </p>
          <div className="mt-5 h-2 w-full max-w-sm overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${Math.min(92, 8 + progress.length * 12)}%` }} />
          </div>
          <div className="mt-8 w-full rounded-3xl border border-line bg-panel p-5 text-start shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide opacity-50">{x.yourIdea}</p>
            <p dir="auto" className="mt-1 line-clamp-4 font-hand text-xl leading-snug">“{idea.trim()}”</p>
            <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm font-semibold" aria-live="polite">
              {progress.map((type, i) => (
                <li key={i} className="flex animate-screen-in items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[11px] text-white">✓</span>
                  {t.labels.screens[type]}
                </li>
              ))}
              <li className="flex items-center gap-2 opacity-50">
                <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />…
              </li>
            </ul>
          </div>
          <button onClick={() => making.current?.abort()} className="mt-6 text-sm font-semibold opacity-60 hover:opacity-100">
            {x.back}
          </button>
        </section>
      )}

      {step === "occasion" && (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <button onClick={() => setStep("choose")} className="text-sm font-semibold opacity-70">
            {x.back}
          </button>
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
          <button onClick={() => setStep(mode === "custom" && !chosen ? "describe" : "design")} className="text-sm font-semibold opacity-70">
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
        <div className={`mx-auto grid gap-8 px-4 py-6 sm:px-6 ${view === "computer" ? "max-w-7xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" : "max-w-6xl lg:grid-cols-[minmax(0,1fr)_380px]"}`}>
          <div className="min-w-0 space-y-6 pb-28 lg:pb-10">
            <div>
              <h1 className="font-brand text-3xl font-bold">{c.editTitle}</h1>
              <p className="mt-1 opacity-70">{c.editIntro}</p>
            </div>

            {mode === "custom" ? (
              <section className="space-y-3 rounded-2xl border-2 border-brand/40 bg-panel p-4">
                <h2 className="font-brand text-xl font-bold">✨ {x.changeTitle}</h2>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    changeByTyping();
                  }}
                >
                  <textarea
                    value={ask}
                    onChange={(e) => {
                      setAsk(e.target.value);
                      setAiDone(false);
                    }}
                    rows={2}
                    maxLength={1000}
                    dir="auto"
                    aria-label={x.changeTitle}
                    placeholder={x.changePlaceholder}
                    className="w-full resize-y rounded-xl border border-line bg-background px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button disabled={busy !== null || ask.trim().length < 3} className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                      {busy === "change" ? <Making lines={[x.changing]} /> : x.change}
                    </button>
                    {undo && busy === null && (
                      <button
                        type="button"
                        onClick={() => {
                          setCard(undo);
                          setUndo(null);
                          setAiDone(false);
                        }}
                        className="text-sm font-semibold underline underline-offset-4"
                      >
                        {x.undo}
                      </button>
                    )}
                    {aiDone && <span className="text-sm opacity-70">{x.changed}</span>}
                  </div>
                  {aiError && <p className="text-sm font-semibold text-red-600">{aiError}</p>}
                </form>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm opacity-60">{x.quickTitle}</span>
                  {x.quick.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        setAsk(q);
                        changeByTyping(q);
                      }}
                      className="rounded-full border border-line bg-background px-3 py-1.5 text-sm font-semibold transition hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-line p-4 text-sm">
                <p className="opacity-70">{x.premadeNote}</p>
                <button onClick={() => setMode("custom")} className="mt-2 text-start font-semibold text-brand underline-offset-4 hover:underline">
                  {fmt(x.unlock, { price: price("custom", currency) })}
                </button>
              </div>
            )}

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
                      {mode === "custom" && (
                        <>
                          <IconButton label={c.moveUp} onClick={() => moveScreen(s.id, -1)} disabled={i === 0}>↑</IconButton>
                          <IconButton label={c.moveDown} onClick={() => moveScreen(s.id, 1)} disabled={i === card.screens.length - 1}>↓</IconButton>
                          <IconButton label={c.remove} onClick={() => removeScreen(s.id)} disabled={card.screens.length <= 1}>✕</IconButton>
                        </>
                      )}
                    </div>
                    {open && (
                      <div className="space-y-4 border-t border-line px-4 py-4">
                        <ScreenEditor screen={s} onChange={(update) => updateScreen(s.id, update)} />
                      </div>
                    )}
                  </div>
                );
              })}
              {mode === "premade" ? null : card.screens.length < MAX_SCREENS ? (
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
                {saving ? c.adding : fmt(c.addToBasket, { price: formatMoney(tierPrice(cardTier(card)), currency) })}
              </button>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-3">
              <div role="tablist" aria-label={c.preview} className="mx-auto flex w-fit gap-1 rounded-full border border-line bg-panel p-1">
                {(["phone", "computer"] as const).map((v) => (
                  <button
                    key={v}
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${view === v ? "bg-foreground text-background" : "opacity-70 hover:opacity-100"}`}
                  >
                    {v === "phone" ? t.product.onPhone : t.product.onComputer}
                  </button>
                ))}
              </div>
              <ScreenAsk
                card={card}
                viewing={viewing}
                value={screenAsk}
                onChange={setScreenAsk}
                busy={busy !== null}
                premade={mode === "premade"}
                onSubmit={(id) => changeByTyping(screenAsk, id)}
              />
              <div className="relative">
                {view === "phone" ? (
                  <PhoneFrame className="mx-auto h-[560px] w-[280px]">
                    <CardPlayer key="phone" card={card} preview sound focusScreenId={selected} focusNonce={nudge} onScreenChange={setViewing} />
                  </PhoneFrame>
                ) : (
                  <BrowserFrame className="h-[520px]">
                    <CardPlayer key="computer" card={card} preview sound focusScreenId={selected} focusNonce={nudge} onScreenChange={setViewing} />
                  </BrowserFrame>
                )}
                {busy === "change" && (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="rounded-full bg-black/75 px-5 py-3 text-sm font-semibold text-white shadow-lg">
                      <Making lines={[x.changing]} />
                    </span>
                  </div>
                )}
              </div>
              <p className="text-center text-xs opacity-60">{c.livePreview}</p>
            </div>
          </aside>
        </div>
      )}

      {showPreview && card && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="relative min-h-0 flex-1">
            <CardPlayer card={card} preview sound focusScreenId={selected} focusNonce={nudge} onScreenChange={setViewing} />
            <button onClick={() => setShowPreview(false)} className="absolute start-4 top-4 z-50 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
              {c.closePreview}
            </button>
            {busy === "change" && (
              <div className="absolute inset-0 z-40 grid place-items-center">
                <span className="rounded-full bg-black/75 px-5 py-3 text-sm font-semibold text-white shadow-lg">
                  <Making lines={[x.changing]} />
                </span>
              </div>
            )}
          </div>
          <div className="border-t border-line p-3">
            <ScreenAsk
              card={card}
              viewing={viewing}
              value={screenAsk}
              onChange={setScreenAsk}
              busy={busy !== null}
              premade={mode === "premade"}
              onSubmit={(id) => changeByTyping(screenAsk, id)}
            />
          </div>
        </div>
      )}

    </div>
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

type ScreenAskProps = {
  card: CardData;
  viewing?: string;
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  premade: boolean;
  onSubmit: (screenId: string) => void;
};

// Type a change to whichever screen the preview is showing.
function ScreenAsk({ card, viewing, value, onChange, busy, premade, onSubmit }: ScreenAskProps) {
  const { t, currency } = useI18n();
  const x = t.custom;
  const i = Math.max(card.screens.findIndex((s) => s.id === viewing), 0);
  const screen = card.screens[i];
  if (!screen) return null;
  return (
    <form
      className="rounded-2xl border-2 border-brand/40 bg-panel p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim().length >= 3) onSubmit(screen.id);
      }}
    >
      <label htmlFor="screen-ask" className="block text-sm font-bold">
        ✨ {fmt(x.thisScreen, { name: `${i + 1}. ${t.labels.screens[screen.type]}` })}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="screen-ask"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={1000}
          dir="auto"
          placeholder={x.thisScreenPlaceholder}
          className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button disabled={busy || value.trim().length < 3} className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {x.go}
        </button>
      </div>
      {premade && <p className="mt-2 text-xs opacity-60">{fmt(x.typingMakesCustom, { price: price("custom", currency) })}</p>}
    </form>
  );
}

type ChoiceProps = {
  title: string;
  easy: string;
  body: string;
  points: readonly string[];
  price: string;
  perCard: string;
  cta: string;
  visual: React.ReactNode;
  featured?: boolean;
  onClick: () => void;
};

// One of the two ways to make a card, on the first screen.
function Choice({ title, easy, body, points, price, perCard, cta, visual, featured, onClick }: ChoiceProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`${title}. ${easy}. ${price}`}
      className={`group flex flex-col overflow-hidden rounded-3xl border-2 bg-panel text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${featured ? "border-brand" : "border-line hover:border-brand"}`}
    >
      <div className="grid h-44 place-items-center overflow-hidden border-b border-line bg-background px-6">{visual}</div>
      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-brand text-3xl font-bold leading-tight">{title}</h2>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-brand">{easy}</p>
        <p className="mt-3 leading-relaxed opacity-75">{body}</p>
        <ul className="mt-4 flex-1 space-y-1.5 text-sm">
          {points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="font-bold text-brand">✓</span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-5 font-brand text-3xl font-black">
          {price} <span className="font-sans text-sm font-semibold opacity-60">{perCard}</span>
        </p>
        <span className={`mt-4 block rounded-full py-3 text-center font-brand text-lg font-semibold ${featured ? "bg-brand text-white" : "border-2 border-foreground/80"}`}>{cta} →</span>
      </div>
    </button>
  );
}

// A message box that types out an example, for the custom choice.
function TypingDemo({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setShown((n) => (n >= text.length + 40 ? 0 : n + 1)), 45);
    return () => clearInterval(timer);
  }, [text]);
  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-3 text-start text-sm leading-snug shadow-sm" aria-hidden>
      <span dir="auto">{text.slice(0, shown)}</span>
      <span className="ms-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-brand" />
    </div>
  );
}

// Three design fronts fanned out, for the premade choice.
function ThumbFan({ slugs }: { slugs: string[] }) {
  return (
    <div className="relative h-40 w-72" aria-hidden>
      {slugs.map((slug, i) => {
        const tpl = getTemplate(slug);
        return (
          tpl && (
            <div key={slug} className="absolute top-1 w-28 shadow-md transition duration-300 group-hover:-translate-y-1" style={{ left: `${i * 28}%`, rotate: `${(i - 1) * 8}deg`, zIndex: i === 1 ? 2 : 1 }}>
              <ProductThumb template={tpl} />
            </div>
          )
        );
      })}
    </div>
  );
}

// An envelope with a card rising out of it while its lines are written.
function WritingEnvelope() {
  return (
    <svg viewBox="0 0 200 170" className="w-56 text-brand sm:w-64" aria-hidden>
      {[
        [26, 40, 0],
        [176, 30, 0.6],
        [160, 96, 1.2],
        [36, 104, 0.9],
      ].map(([cx, cy, delay]) => (
        <path
          key={`${cx}-${cy}`}
          d={`M${cx} ${cy - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z`}
          fill="currentColor"
          className="animate-twinkle"
          style={{ animationDelay: `${delay}s`, transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
      <path d="M40 78 L100 40 L160 78 Z" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" strokeLinejoin="round" opacity="0.9" />
      <g className="animate-letter">
        <rect x="56" y="44" width="88" height="74" rx="4" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" />
        {[60, 72, 84].map((y, i) => (
          <path
            key={y}
            d={`M68 ${y} H${i === 2 ? 112 : 132}`}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            className="animate-write"
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}
        <path d="M118 98 c0-5 7-5 7 0 c0-5 7-5 7 0 c0 5-7 9-7 9 s-7-4-7-9z" fill="currentColor" />
      </g>
      <path d="M40 78 V150 H160 V78 L100 116 Z" fill="var(--panel)" stroke="var(--foreground)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40 150 L88 108 M160 150 L112 108" stroke="var(--foreground)" strokeWidth="2" opacity="0.35" />
    </svg>
  );
}

// Shows one line at a time, moving on every few seconds and stopping on the last.
function RotatingLine({ lines }: { lines: readonly string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 4000);
    return () => clearInterval(timer);
  }, [lines.length]);
  return (
    <span key={i} className="inline-block animate-screen-in" aria-live="polite">
      {lines[i]}
    </span>
  );
}

// Cycles through what's happening while a card is being made, stopping on the last line.
function Making({ lines }: { lines: readonly string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 3500);
    return () => clearInterval(timer);
  }, [lines.length]);
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      <span aria-live="polite">{lines[i]}</span>
    </span>
  );
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
