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
import { TEMPLATES, cardTier, getTemplate, toneInfo } from "@/lib/catalog";
import { occasions } from "@/lib/templates";
import { formatMoney, tierPrice } from "@/lib/pricing";
import { themes } from "@/lib/themes";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { SignIn, type SignedIn } from "@/components/SignIn";
import { TwoWays } from "@/components/TwoWays";
import { NO_ANSWERS, Quiz, quizPrompt, type Answers } from "./Quiz";
import { Field, ScreenEditor, Select } from "./ScreenEditor";
import { EditableCard, setAt, type Path } from "./WordEditing";

const DRAFT_KEY = "sv-draft-v1";
const MODE_KEY = "sv-draft-mode";
// The questions in progress, kept while they sign in with Google (which leaves the site).
const QUIZ_KEY = "sv-quiz-v1";
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

type Album = { photos: string[]; captions: string[] };

// Puts photos added before the card was written into its photos screen. A card made
// from scratch gets one before the message (or finale) if the writer didn't include
// one; a ready-made design keeps its screens as they are.
function withPhotos(card: CardData, album: Album | undefined, title: string, addScreen: boolean): CardData {
  if (!album?.photos.length) return card;
  const { photos, captions } = album;
  const at = card.screens.findIndex((s) => s.type === "photos");
  if (at >= 0) return { ...card, screens: card.screens.map((s, i) => (i === at && s.type === "photos" ? { ...s, photos, captions } : s)) };
  if (!addScreen) return card;
  const before = card.screens.findIndex((s) => s.type === "message" || s.type === "finale");
  const screens = [...card.screens];
  screens.splice(before > 0 ? before : screens.length, 0, { id: uid(), type: "photos", title, photos, captions });
  return { ...card, screens };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Choose a way, pick a design (ready-made only), answer the questions, then edit.
type Step = "choose" | "pick" | "quiz" | "describe" | "making" | "edit";
// Premade (a ready-made design) keeps its screens as they are; custom (personalised) can change anything, including by typing.
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

type SavedQuiz = { step: "quiz" | "describe"; answers: Answers; question: number; mode: Mode; templateSlug?: string; idea: string; to: string; from: string; at: number };

function loadQuiz(): SavedQuiz | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(QUIZ_KEY) ?? "null") as SavedQuiz | null;
    return saved && Date.now() - saved.at < 2 * 60 * 60_000 ? saved : null;
  } catch {
    return null;
  }
}

function clearQuiz() {
  try {
    sessionStorage.removeItem(QUIZ_KEY);
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
type CreatorProps = {
  initialOccasion?: Occasion;
  initialTemplate?: string;
  initialTo?: string;
  initialFrom?: string;
  initialTheme?: ThemeName;
  initialStart?: Start;
  // Back from signing in with Google, to carry on with the questions.
  resume?: boolean;
  signInFailed?: boolean;
};

export function Creator({ initialOccasion, initialTemplate, initialTo, initialFrom, initialTheme, initialStart, resume, signInFailed }: CreatorProps) {
  const { t, currency } = useI18n();
  const c = t.create;
  const x = t.custom;
  const router = useRouter();
  // Fireworks only work as a finale effect, so they're not offered as a background.
  const ambientOptions = Object.fromEntries(
    EFFECTS.filter((x) => x !== "fireworks").map((x) => [x, x === "confetti" ? t.labels.partyEmoji : t.labels.effects[x]]),
  ) as Record<Exclude<Effect, "fireworks">, string>;
  const chosen = getTemplate(initialTemplate);
  const [saved] = useState(() => (resume ? loadQuiz() : null));
  const [draft] = useState(() => (initialOccasion || chosen || initialStart || saved ? null : loadDraft()));
  // A design picked elsewhere goes straight to the questions; an occasion opens the designs for it.
  const [step, setStep] = useState<Step>(
    saved ? saved.step : draft ? "edit" : chosen ? "quiz" : initialOccasion || initialStart === "premade" ? "pick" : initialStart === "custom" ? "quiz" : "choose",
  );
  const [mode, setMode] = useState<Mode>(() =>
    saved ? saved.mode : draft ? loadMode(draft) : chosen || initialOccasion || initialStart === "premade" ? "premade" : "custom",
  );
  const [templateSlug, setTemplateSlug] = useState<string | undefined>(saved ? saved.templateSlug : chosen?.slug);
  const [to, setTo] = useState(saved?.to ?? draft?.to ?? initialTo ?? "");
  const [from, setFrom] = useState(saved?.from ?? draft?.from ?? initialFrom ?? "");
  const [card, setCard] = useState<CardData | null>(draft);
  const [selected, setSelected] = useState<string | undefined>(draft?.screens[0]?.id);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Making a card by typing, and changing one by typing.
  const [idea, setIdea] = useState(saved?.idea ?? "");
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState<"make" | "change" | null>(null);
  const [aiError, setAiError] = useState<string | null>(signInFailed ? t.account.signInFailed : null);
  const [aiDone, setAiDone] = useState(false);
  const [undo, setUndo] = useState<CardData | null>(null);
  // The screens written so far while a card is being made, and a way to stop it.
  const [progress, setProgress] = useState<ScreenType[]>([]);
  const making = useRef<AbortController | null>(null);
  // The live preview: on a phone or a computer, which screen it's showing, and a nudge
  // that makes it jump back to a screen after that screen changes.
  // The computer view comes first; the phone is a tap away.
  const [view, setView] = useState<"phone" | "computer">("computer");
  const [viewing, setViewing] = useState<string | undefined>();
  const [nudge, setNudge] = useState(0);
  const [screenAsk, setScreenAsk] = useState("");
  // The eight-question quiz. Names from a product page and a design's occasion are filled in already.
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? { ...NO_ANSWERS, to: initialTo ?? "", from: initialFrom ?? "", occasion: chosen?.occasion ?? "" });
  const [question, setQuestion] = useState(saved?.question ?? 0);
  // Signing up comes before a new card is made, for anyone not signed in when they start.
  const [auth, setAuth] = useState<{ google: boolean; email: boolean; account: SignedIn | null; needed: boolean } | null>(null);
  // Clicking words on the preview edits them; Play lets the card react as it will for them.
  const [wordMode, setWordMode] = useState<"edit" | "play">("edit");
  const [pickOccasion, setPickOccasion] = useState<Occasion | "all">(initialOccasion ?? "all");
  const design = mode === "premade" ? getTemplate(templateSlug) : undefined;
  const ideaBox = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { enabled: boolean; google: boolean; email: boolean; account: SignedIn | null }) =>
        setAuth({ google: s.google, email: s.email, account: s.account, needed: s.enabled && !s.account }),
      )
      .catch(() => {});
  }, []);

  // Keeps the questions (or the description) while Google signs them in.
  const saveQuiz = () => {
    try {
      const keep: SavedQuiz = { step: step === "describe" ? "describe" : "quiz", answers, question, mode, templateSlug, idea, to, from, at: Date.now() };
      sessionStorage.setItem(QUIZ_KEY, JSON.stringify(keep));
    } catch {}
  };
  const signUp = auth?.needed
    ? {
        google: auth.google,
        email: auth.email,
        account: auth.account,
        onSignedIn: (account: SignedIn) => {
          setAuth((a) => a && { ...a, account });
          setAiError(null);
        },
        onGoogle: saveQuiz,
      }
    : undefined;
  const mustSignUp = Boolean(signUp && !signUp.account);

  useEffect(() => {
    try {
      if (card && step === "edit") {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(card));
        localStorage.setItem(MODE_KEY, mode);
      }
    } catch {}
  }, [card, step, mode]);

  // The two ways: personalised goes to the questions, ready-made to the designs first.
  const chooseWay = (way: Mode) => {
    setMode(way);
    setQuestion(0);
    setStep(way === "premade" ? "pick" : "quiz");
    window.scrollTo({ top: 0 });
  };

  // From the designs to the questions, with the design's occasion filled in.
  const toQuestions = () => {
    const tpl = getTemplate(templateSlug);
    if (!tpl) return;
    setAnswers((a) => (a.occasion || a.occasionOther ? a : { ...a, occasion: tpl.occasion }));
    setQuestion(0);
    setStep("quiz");
    window.scrollTo({ top: 0 });
  };

  const startOver = () => {
    clearDraft();
    setCard(null);
    setTo("");
    setFrom("");
    setUndo(null);
    setAiDone(false);
    setAnswers(NO_ANSWERS);
    setQuestion(0);
    setTemplateSlug(undefined);
    setMode("custom");
    setStep("choose");
  };

  // Asks for a new card from a description, or for a change to the current one. The
  // reply streams in: a line for each screen as it's written, then the finished card.
  const callAi = async (
    body: { prompt: string; card?: CardData; focus?: string; template?: string; keepDesign?: boolean },
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

  const makeFromIdea = () => {
    if (mustSignUp) return setAiError(x.errors.signIn);
    if (idea.trim().length < 3) return setAiError(x.errors.describe);
    if (!to.trim() || !from.trim()) return setAiError(c.needNames);
    makeCard(idea.trim(), { to, from }, "describe");
  };

  const makeFromQuiz = () => {
    const prompt = quizPrompt(answers, t, { design: Boolean(design) });
    setTo(answers.to.trim());
    setFrom(answers.from.trim());
    setIdea(prompt);
    makeCard(prompt, { to: answers.to, from: answers.from }, "quiz", { photos: answers.photos, captions: answers.captions }, design?.slug);
  };

  // Writes a new card, showing the loading screen; going back returns to where it was asked for.
  // With a design, only its words are written and everything else stays as the design has it.
  const makeCard = async (prompt: string, names: { to: string; from: string }, source: "quiz" | "describe", album?: Album, template?: string) => {
    const controller = new AbortController();
    making.current = controller;
    clearQuiz();
    setBusy("make");
    setAiError(null);
    setProgress([]);
    setStep("making");
    window.scrollTo({ top: 0 });
    try {
      const written = await callAi(template ? { prompt, template, keepDesign: true } : { prompt }, names, setProgress, controller.signal);
      // A colour picked on the product page carries over, but only for that design.
      const coloured = template && initialTheme && template === initialTemplate ? { ...written, theme: initialTheme } : written;
      const made = withPhotos(coloured, album, t.labels.screens.photos, !template);
      setCard(made);
      setSelected(made.screens[0]?.id);
      setMode(template ? "premade" : "custom");
      setStep("edit");
      window.scrollTo({ top: 0 });
    } catch (e) {
      if (!controller.signal.aborted) setAiError(e instanceof Error ? e.message : x.errors.failed);
      setStep(source);
    }
    making.current = null;
    setBusy(null);
  };

  // Words typed straight onto the preview.
  const editWords = (path: Path, value: string) => setCard((c) => c && setAt(c, path, value));
  const goToScreen = (id: string) => {
    setSelected(id);
    setNudge((n) => n + 1);
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
      const changed = await callAi({ prompt: prompt.trim(), card, focus }, { to: card.to, from: card.from });
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

      {step === "quiz" && (
        <>
          <Quiz
            answers={answers}
            setAnswers={setAnswers}
            index={question}
            setIndex={setQuestion}
            onGenerate={makeFromQuiz}
            onBack={() => setStep(design ? "pick" : "choose")}
            onDescribe={design ? undefined : () => setStep("describe")}
            design={design}
            onChangeDesign={() => setStep("pick")}
            signUp={signUp}
          />
          {aiError && <p className="mx-auto -mt-6 max-w-2xl px-4 pb-8 text-sm font-semibold text-red-600">{aiError}</p>}
        </>
      )}

      {step === "describe" && (
        <section className="mx-auto max-w-3xl px-4 py-10">
          <button onClick={() => setStep("quiz")} className="text-sm font-semibold opacity-70">
            {x.back}
          </button>
          <div className="mt-4">
            <div>
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
                {signUp && mustSignUp && (
                  <div className="rounded-2xl border border-line bg-background p-4">
                    <p className="mb-3 font-brand text-lg font-bold">{t.quiz.signupTitle}</p>
                    <SignIn google={signUp.google} email={signUp.email} next="/create?resume=1" onSignedIn={signUp.onSignedIn} onGoogle={signUp.onGoogle} />
                  </div>
                )}
                <button disabled={busy !== null || mustSignUp} className="w-full rounded-full bg-brand py-3.5 font-brand text-lg font-semibold text-white shadow-lg disabled:opacity-70">
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

      {step === "choose" && (
        <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <h1 className="text-center font-brand text-4xl font-bold sm:text-5xl">{c.chooseTitle}</h1>
          <p className="mx-auto mt-3 max-w-xl text-center opacity-70">{c.chooseIntro}</p>
          <div className="mt-10">
            <TwoWays onPick={chooseWay} />
          </div>
        </section>
      )}

      {step === "pick" && (
        <section className="mx-auto max-w-6xl px-4 pb-32 pt-10">
          <button onClick={() => setStep("choose")} className="text-sm font-semibold opacity-70">
            {x.back}
          </button>
          <h1 className="mt-4 font-brand text-4xl font-bold sm:text-5xl">{c.pickTitle}</h1>
          <p className="mt-2 max-w-2xl opacity-70">{c.pickIntro}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(["all", ...OCCASIONS] as const).map((o) => (
              <button
                key={o}
                onClick={() => setPickOccasion(o)}
                aria-pressed={pickOccasion === o}
                className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition ${pickOccasion === o ? "border-brand bg-brand text-white" : "border-line bg-panel hover:border-brand"}`}
              >
                {o === "all" ? x.allOccasions : `${occasions[o].emoji} ${t.occasions[o].label}`}
              </button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TEMPLATES.filter((tpl) => pickOccasion === "all" || tpl.occasion === pickOccasion).map((tpl) => {
              const on = tpl.slug === templateSlug;
              return (
                <div
                  key={tpl.slug}
                  className={`relative overflow-hidden rounded-3xl border-2 bg-panel shadow-sm transition ${on ? "border-brand ring-4 ring-brand/20" : "border-line hover:-translate-y-1 hover:border-brand hover:shadow-md"}`}
                >
                  <button onClick={() => setTemplateSlug(tpl.slug)} aria-pressed={on} className="block w-full text-start">
                    <ProductThumb template={tpl} />
                    <div className="p-3">
                      <p className="font-brand font-bold leading-tight">{tpl.name}</p>
                      <p className="mt-1 text-xs opacity-70">
                        {occasions[tpl.occasion].emoji} {t.occasions[tpl.occasion].label} · {toneInfo[tpl.tone].emoji} {t.tones[tpl.tone]}
                      </p>
                    </div>
                  </button>
                  {on && <span className="pointer-events-none absolute start-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">✓ {c.chosen}</span>}
                  <a href={`/cards/${tpl.slug}`} target="_blank" rel="noreferrer" className="block border-t border-line px-3 py-2 text-xs font-semibold text-brand">
                    {c.previewIt}
                  </a>
                </div>
              );
            })}
          </div>
          {/* Always in reach while scrolling the designs. Kept to the left, clear of the chat button. */}
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-4">
              <button
                onClick={toQuestions}
                disabled={!getTemplate(templateSlug)}
                className="shrink-0 rounded-full bg-brand px-6 py-3 font-brand text-lg font-semibold text-white shadow-lg disabled:opacity-40"
              >
                {c.pickNext} →
              </button>
              <p className="min-w-0 truncate text-sm font-semibold opacity-70">{getTemplate(templateSlug)?.name ?? c.pickHint}</p>
            </div>
          </div>
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
                  {x.unlock}
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
                {(["computer", "phone"] as const).map((v) => (
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
                onSubmit={(id) => changeByTyping(screenAsk, id)}
              />
              <PreviewControls card={card} viewing={viewing} onGo={goToScreen} wordMode={wordMode} setWordMode={setWordMode} />
              <div className="relative">
                <EditableCard card={card} screenId={viewing} enabled={wordMode === "edit"} onChange={editWords} onOther={() => setSelected(viewing)}>
                  {view === "phone" ? (
                    <PhoneFrame className="mx-auto h-[520px] w-[260px]">
                      <CardPlayer key="phone" card={card} preview sound focusScreenId={selected} focusNonce={nudge} onScreenChange={setViewing} />
                    </PhoneFrame>
                  ) : (
                    <BrowserFrame className="h-[480px]">
                      <CardPlayer key="computer" card={card} preview sound focusScreenId={selected} focusNonce={nudge} onScreenChange={setViewing} />
                    </BrowserFrame>
                  )}
                </EditableCard>
                {busy === "change" && (
                  <div className="absolute inset-0 z-50 grid place-items-center">
                    <span className="rounded-full bg-black/75 px-5 py-3 text-sm font-semibold text-white shadow-lg">
                      <Making lines={[x.changing]} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {showPreview && card && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="relative min-h-0 flex-1">
            <EditableCard card={card} screenId={viewing} enabled={wordMode === "edit"} onChange={editWords} onOther={() => {}} className="h-full">
              <CardPlayer card={card} preview sound focusScreenId={selected} focusNonce={nudge} onScreenChange={setViewing} />
            </EditableCard>
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
          <div className="space-y-3 border-t border-line p-3">
            <PreviewControls card={card} viewing={viewing} onGo={goToScreen} wordMode={wordMode} setWordMode={setWordMode} />
            <ScreenAsk
              card={card}
              viewing={viewing}
              value={screenAsk}
              onChange={setScreenAsk}
              busy={busy !== null}
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

type PreviewControlsProps = {
  card: CardData;
  viewing?: string;
  onGo: (screenId: string) => void;
  wordMode: "edit" | "play";
  setWordMode: (mode: "edit" | "play") => void;
};

// Edit the words or play the card, and step through its screens.
function PreviewControls({ card, viewing, onGo, wordMode, setWordMode }: PreviewControlsProps) {
  const { t } = useI18n();
  const x = t.custom;
  const i = Math.max(card.screens.findIndex((s) => s.id === viewing), 0);
  const go = (step: number) => {
    const screen = card.screens[i + step];
    if (screen) onGo(screen.id);
  };
  const arrow = "grid h-9 w-9 place-items-center rounded-full border border-line bg-panel font-bold transition hover:border-brand disabled:opacity-30";
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" className="flex gap-1 rounded-full border border-line bg-panel p-1">
          {(["edit", "play"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={wordMode === m}
              onClick={() => setWordMode(m)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${wordMode === m ? "bg-foreground text-background" : "opacity-70 hover:opacity-100"}`}
            >
              {m === "edit" ? x.editWords : x.play}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => go(-1)} disabled={i === 0} aria-label={x.prevScreen} className={arrow}>
            <span className="rtl:rotate-180">←</span>
          </button>
          <span className="min-w-12 text-center text-sm font-semibold tabular-nums opacity-70">
            {i + 1} / {card.screens.length}
          </span>
          <button onClick={() => go(1)} disabled={i === card.screens.length - 1} aria-label={x.nextScreen} className={arrow}>
            <span className="rtl:rotate-180">→</span>
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-xs opacity-60">{wordMode === "edit" ? x.clickHint : t.create.livePreview}</p>
    </div>
  );
}

type ScreenAskProps = {
  card: CardData;
  viewing?: string;
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  onSubmit: (screenId: string) => void;
};

// Type a change to whichever screen the preview is showing.
function ScreenAsk({ card, viewing, value, onChange, busy, onSubmit }: ScreenAskProps) {
  const { t } = useI18n();
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
    </form>
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
