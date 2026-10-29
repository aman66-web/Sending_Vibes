"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { Motif } from "@/components/card/motifs";
import { Logo } from "@/components/Logo";
import { BrowserFrame } from "@/components/BrowserFrame";
import { PhoneFrame } from "@/components/PhoneFrame";
import { addToBasket } from "@/lib/basket";
import { OCCASIONS, type CardData, type Occasion, type Screen, type ScreenType, type ThemeName } from "@/lib/card";
import { stagesOf } from "@/lib/stages";
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
import { Field } from "./ScreenEditor";
import { openChat } from "@/components/open-chat";
import { AtComputerSize, AtPhoneSize } from "./AtPhoneSize";
import { STUDIO_TABS, ScreenStrip, StudioPanel, type Tab } from "./Studio";
import { useWide } from "./use-wide";
import { AllWords, EditableCard, setAt, type Path } from "./WordEditing";
import { stageFor, stillToWrite } from "@/lib/blanks";

const DRAFT_KEY = "sv-draft-v1";
const MODE_KEY = "sv-draft-mode";
// The questions in progress, kept while they sign in with Google (which leaves the site).
const QUIZ_KEY = "sv-quiz-v1";
// The designs shown next to each example description, in the same order as t.custom.examples.
const EXAMPLE_SLUGS = ["be-my-valentine", "birthday-bash", "festival-of-lights", "naughty-or-nice", "please-forgive-me", "for-the-best-mum"];

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
  // The full-screen preview on a phone covers the page, which mustn't scroll behind it.
  useEffect(() => {
    if (!showPreview) return;
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = was;
    };
  }, [showPreview]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Making a card by typing, and changing one by typing.
  const [idea, setIdea] = useState(saved?.idea ?? "");
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState<"make" | "change" | null>(null);
  const [aiError, setAiError] = useState<string | null>(signInFailed ? t.account.signInFailed : null);
  const [aiDone, setAiDone] = useState(false);
  // What the AI says it changed (or couldn't), shown after a typed change.
  const [aiNote, setAiNote] = useState<string | null>(null);
  // How many typed changes their account has left (see lib/allowance.ts), once known.
  const [changesLeft, setChangesLeft] = useState<number | null>(null);
  // Every change can be undone (and redone), like any design app.
  const [past, setPast] = useState<CardData[]>([]);
  const [future, setFuture] = useState<CardData[]>([]);
  // The screens written so far while a card is being made, and a way to stop it.
  const [progress, setProgress] = useState<ScreenType[]>([]);
  const making = useRef<AbortController | null>(null);
  // The live preview: on a phone or a computer, which screen it's showing, and a nudge
  // that makes it jump back to a screen after that screen changes.
  // It starts as the device they're on (see `shown` below); the other is a tap away.
  const [view, setView] = useState<"phone" | "computer" | null>(null);
  const [viewing, setViewing] = useState<string | undefined>();
  const [nudge, setNudge] = useState(0);
  const [screenAsk, setScreenAsk] = useState("");
  // The eight-question quiz. Names from a product page and a design's occasion are filled in already.
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? { ...NO_ANSWERS, to: initialTo ?? "", from: initialFrom ?? "", occasion: chosen?.occasion ?? "" });
  const [question, setQuestion] = useState(saved?.question ?? 0);
  // Signing up comes before a new card is made, for anyone not signed in when they start.
  const [auth, setAuth] = useState<{ google: boolean; email: boolean; account: SignedIn | null; needed: boolean } | null>(null);
  // Clicking words on the preview edits them; Play lets the card react as it will for them.
  // The card starts out playing as it will for them; Edit mode is for changing words.
  // Like a presentation app: the screens are being designed (Edit mode) unless they
  // press Preview mode to see the card react as it will for them.
  const [wordMode, setWordMode] = useState<"edit" | "play">("edit");
  const wide = useWide();
  const shown = view ?? (wide ? "computer" : "phone");
  const [pickOccasion, setPickOccasion] = useState<Occasion | "all">(initialOccasion ?? "all");
  const design = mode === "premade" ? getTemplate(templateSlug) : undefined;
  const ideaBox = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { enabled: boolean; google: boolean; email: boolean; account: SignedIn | null; left?: { change: number } }) => {
        setAuth({ google: s.google, email: s.email, account: s.account, needed: s.enabled && !s.account });
        if (s.left) setChangesLeft(s.left.change);
      })
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
    setPast([]);
    setFuture([]);
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
  ): Promise<{ card: CardData; note?: string; left?: number }> => {
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
        else if (event.type === "card")
          return { card: event.card as CardData, note: typeof event.note === "string" ? event.note : undefined, left: typeof event.left === "number" ? event.left : undefined };
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
      const { card: written } = await callAi(template ? { prompt, template, keepDesign: true } : { prompt }, names, setProgress, controller.signal);
      // A colour picked on the product page carries over, but only for that design.
      const coloured = template && initialTheme && template === initialTemplate ? { ...written, theme: initialTheme } : written;
      const made = withPhotos(coloured, album, t.labels.screens.photos, !template);
      setCard(made);
      setSelected(made.screens[0]?.id);
      setMode(template ? "premade" : "custom");
      setStep("edit");
      setWelcome(true);
      setPast([]);
      setFuture([]);
      window.scrollTo({ top: 0 });
    } catch (e) {
      if (!controller.signal.aborted) setAiError(e instanceof Error ? e.message : x.errors.failed);
      setStep(source);
    }
    making.current = null;
    setBusy(null);
  };

  const remember = () => {
    if (!card) return;
    setPast((p) => [...p.slice(-39), card]);
    setFuture([]);
  };
  const undoLast = () => {
    const prev = past.at(-1);
    if (!prev || !card) return;
    setFuture((f) => [card, ...f]);
    setPast(past.slice(0, -1));
    setCard(prev);
  };
  const redoNext = () => {
    const next = future[0];
    if (!next || !card) return;
    setPast((p) => [...p, card]);
    setFuture(future.slice(1));
    setCard(next);
  };
  // A change from the design panel or the screens strip.
  const change = (update: (c: CardData) => CardData) => {
    remember();
    setCard((c) => c && update(c));
  };
  // The design panel's tab, and something just added for the card to select.
  const [tab, setTab] = useState<Tab>("text");
  const [pick, setPick] = useState<{ key: string; nonce: number } | undefined>();
  // Bumped to open the settings of the screen being looked at.
  const [settings, setSettings] = useState(0);
  // The card filling the whole screen, as they'll see it (on a computer; phones have their own).
  const [bigView, setBigView] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const cardBox = useRef<HTMLDivElement>(null);
  const onAdded = (added: { key: string } | { screenId: string }) => {
    if ("screenId" in added) {
      goToScreen(added.screenId);
      // On a phone the panel is below the card, so bring the new screen into view.
      if (!wide) requestAnimationFrame(() => cardBox.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    setWordMode("edit");
    setPick((p) => ({ key: added.key, nonce: (p?.nonce ?? 0) + 1 }));
  };
  // Shown once, when the card has just been made.
  const [welcome, setWelcome] = useState(false);

  // Words typed straight onto the preview.
  const editWords = (path: Path, value: string) => setCard((c) => c && setAt(c, path, value));
  // Photos swapped, added or taken out by tapping them on the preview.
  const editScreen = (index: number, update: (screen: Screen) => Screen) =>
    setCard((c) => c && { ...c, screens: c.screens.map((s, j) => (j === index ? update(s) : s)) });
  // The moment within a screen the arrows last went to (see lib/stages.ts).
  const [moment, setMoment] = useState<{ id: string; stage: number } | null>(null);
  const goToScreen = (id: string, stage = 0) => {
    setSelected(id);
    setMoment({ id, stage });
    setNudge((n) => n + 1);
  };
  const stageShown = moment && moment.id === viewing ? moment.stage : 0;
  const focusStage = moment && moment.id === selected ? moment.stage : 0;

  // A change to the whole card, or (with focus) to the screen showing in the preview.
  const changeByTyping = async (prompt = ask, focus?: string) => {
    if (!card || prompt.trim().length < 3) return setAiError(x.errors.describe);
    setBusy("change");
    setAiError(null);
    setAiDone(false);
    // Typing changes are a custom-card thing.
    setMode("custom");
    try {
      const { card: changed, note, left } = await callAi({ prompt: prompt.trim(), card, focus }, { to: card.to, from: card.from });
      setAiNote(note ?? null);
      if (left !== undefined) setChangesLeft(left);
      remember();
      setCard(changed);
      if (!focus || prompt === ask) setAsk("");
      if (prompt === screenAsk) setScreenAsk("");
      if (focus) {
        // Show that screen again from the start, with the change.
        setSelected(focus);
        setNudge((n) => n + 1);
      }
      setAiDone(true);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : x.errors.failed);
    }
    setBusy(null);
  };

  // Screens still saying what to write there ("Type your question here"), checked before
  // the card goes in the basket.
  // Whether that reminder is up. What it lists is worked out from the card as it is now, so
  // a change landing while it's open (an AI change, say) can't leave it out of date.
  const [askToWrite, setAskToWrite] = useState(false);
  const basketButton = useRef<HTMLButtonElement>(null);
  const publish = async (anyway = false) => {
    if (!card) return;
    if (!card.to.trim() || !card.from.trim()) return setError(c.needNames);
    if (!anyway && stillToWrite(card).length) return setAskToWrite(true);
    setAskToWrite(false);
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
        <div className="flex items-center gap-4">
          {step === "edit" && (
            <button onClick={startOver} className="text-sm font-semibold opacity-70 hover:opacity-100">
              {c.startOver}
            </button>
          )}
          {/* On phones the help chat opens from here rather than floating over the page. */}
          <button onClick={openChat} className="flex items-center gap-1.5 rounded-full border-2 border-foreground/80 px-3 py-1.5 text-sm font-bold lg:hidden">
            <span aria-hidden>💬</span> {t.chat.help}
          </button>
        </div>
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
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6 pb-28 lg:pb-10">
            <div>
              <h1 className="font-brand text-3xl font-bold">{c.editTitle}</h1>
              <p className="mt-1 opacity-70">{c.editIntro}</p>
            </div>

            <div ref={panel} className="scroll-mt-4">
              <StudioPanel
                card={card}
                screenIndex={Math.max(card.screens.findIndex((sc) => sc.id === viewing), 0)}
                tab={tab}
                setTab={setTab}
                change={change}
                onAdded={onAdded}
                ai={
            <section className="space-y-3 rounded-2xl border-2 border-brand/40 bg-panel p-4">
                <h2 className="font-brand text-xl font-bold">✨ {x.changeTitle}</h2>
                <p className="text-sm leading-relaxed opacity-80">{x.changeHow}</p>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    // About the screen they're looking at, unless it's clearly about the whole card.
                    changeByTyping(ask, viewing);
                  }}
                >
                  <textarea
                    value={ask}
                    onChange={(e) => {
                      setAsk(e.target.value);
                      setAiDone(false);
                    }}
                    rows={4}
                    maxLength={1000}
                    dir="auto"
                    aria-label={x.changeTitle}
                    placeholder={x.changePlaceholder}
                    className="w-full resize-y rounded-xl border border-line bg-background px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <LookingAt card={card} viewing={viewing} />
                  <div className="flex flex-wrap items-center gap-3">
                    <button disabled={busy !== null || ask.trim().length < 3} className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                      {busy === "change" ? <Making lines={[x.changing]} /> : x.change}
                    </button>
                    {past.length > 0 && busy === null && (
                      <button
                        type="button"
                        onClick={() => {
                          undoLast();
                          setAiDone(false);
                        }}
                        className="text-sm font-semibold underline underline-offset-4"
                      >
                        {x.undo}
                      </button>
                    )}
                  </div>
                  {changesLeft !== null && <p className="text-xs font-semibold opacity-60">{fmt(x.changesLeft, { n: changesLeft })}</p>}
                  {aiDone && (
                    <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200">
                      ✓ {aiNote || x.changed}
                    </p>
                  )}
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
                }
              />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-line bg-background/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
              <button onClick={() => setShowPreview(true)} className="flex-1 rounded-full border-2 border-line py-3.5 font-semibold lg:hidden">
                {c.fullScreen}
              </button>
              <button ref={basketButton} onClick={() => publish()} disabled={saving} className="flex-[2] rounded-full bg-brand py-3.5 font-brand text-lg font-semibold text-white shadow-lg disabled:opacity-50 lg:w-full">
                {saving ? c.adding : fmt(c.addToBasket, { price: formatMoney(tierPrice(cardTier(card), currency), currency) })}
              </button>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          </div>

          {/* The card itself. On a phone it's first on the page, before the typing box; it never grows wider than the screen, so the screens strip scrolls instead. */}
          <aside className="order-first min-w-0 lg:order-none">
            {/* On a phone the card comes straight after the mode switch, with the arrows under it. */}
            <div className="flex flex-col gap-3 lg:sticky lg:top-4">
              <div className="order-1 flex flex-wrap items-center justify-between gap-2 lg:order-none">
                <div className="flex flex-wrap items-center gap-2">
                  <ModeSwitch wordMode={wordMode} setWordMode={setWordMode} />
                  {/* On a phone, as icons so it fits beside the mode switch. */}
                  <div className="lg:hidden">
                    <DeviceSwitch view={shown} setView={setView} compact />
                  </div>
                  {/* Only while designing, so in Preview mode the card sits higher on a phone. */}
                  {wordMode === "edit" && (
                    <>
                      <button type="button" onClick={undoLast} disabled={!past.length} className="rounded-full border-2 border-line px-3 py-2 text-sm font-bold disabled:opacity-35">
                        {t.studio.undo}
                      </button>
                      <button type="button" onClick={redoNext} disabled={!future.length} className="rounded-full border-2 border-line px-3 py-2 text-sm font-bold disabled:opacity-35">
                        {t.studio.redo}
                      </button>
                    </>
                  )}
                </div>
                <div className="hidden items-center gap-2 lg:flex">
                <DeviceSwitch view={shown} setView={setView} />
                <button type="button" onClick={() => setBigView(true)} className="rounded-full border-2 border-foreground/80 px-4 py-1.5 text-sm font-bold">
                  {c.fullScreen}
                </button>
                </div>
              </div>
              <div className="order-3 space-y-3 lg:order-none">
                <PreviewControls card={card} viewing={viewing} stage={stageShown} onGo={goToScreen} wordMode={wordMode} />
                {/* On a phone the design panel is further down the page; these jump to it. */}
                <div className="lg:hidden">
                  <p className="text-sm font-semibold opacity-70">{t.studio.addTitle}</p>
                  <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                    {STUDIO_TABS.map(({ key, icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setTab(key);
                          panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className="flex flex-col items-center gap-1 rounded-2xl border-2 border-line bg-panel py-2.5 text-sm font-bold"
                      >
                        <span aria-hidden className="text-xl leading-none">
                          {icon}
                        </span>
                        {t.studio.tabs[key]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Its own layer: stickers on the card stay under the bar at the bottom of a phone, and
                  the controls for what's selected can hang over the screens strip. */}
              <div ref={cardBox} className="relative z-10 order-2 scroll-mt-4 lg:order-none">
                <EditableCard card={card} screenId={viewing} enabled={wordMode === "edit"} onChange={editWords} onScreen={editScreen} onBegin={remember} pick={pick} openSettings={settings}>
                  {!wide && shown === "computer" ? (
                    // On a phone, the card laid out as on a laptop and shrunk to fit.
                    <BrowserFrame className="aspect-[16/10]">
                      {!showPreview && (
                        <AtComputerSize>
                          <CardPlayer key="here-computer" card={card} preview sound editing={wordMode === "edit"} focusScreenId={selected} focusNonce={nudge} focusStage={focusStage} onScreenChange={setViewing} />
                        </AtComputerSize>
                      )}
                    </BrowserFrame>
                  ) : !wide ? (
                    // On a phone, the card as it'll look on their phone, without a frame around it. It
                    // grows to fit a long screen rather than scrolling inside, so swipes scroll the page.
                    <div className="flex min-h-[min(68dvh,620px)] flex-col overflow-hidden rounded-3xl border-2 border-line">
                      {!showPreview && (
                        <CardPlayer key="here" card={card} preview grow sound editing={wordMode === "edit"} focusScreenId={selected} focusNonce={nudge} focusStage={focusStage} onScreenChange={setViewing} />
                      )}
                    </div>
                  ) : shown === "phone" ? (
                    <PhoneFrame className="mx-auto h-[600px] w-[290px]" notch="h-5 w-20">
                      <AtPhoneSize>
                        <CardPlayer key="phone" card={card} preview sound editing={wordMode === "edit"} focusScreenId={selected} focusNonce={nudge} focusStage={focusStage} onScreenChange={setViewing} />
                      </AtPhoneSize>
                    </PhoneFrame>
                  ) : (
                    <BrowserFrame className="h-[480px]">
                      <CardPlayer key="computer" card={card} preview sound editing={wordMode === "edit"} focusScreenId={selected} focusNonce={nudge} focusStage={focusStage} onScreenChange={setViewing} />
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
              {/* The card's screens, like a presentation's slides. */}
              <div className="order-4 space-y-3 lg:order-none">
                <ScreenStrip
                  card={card}
                  screenIndex={Math.max(card.screens.findIndex((sc) => sc.id === viewing), 0)}
                  onGo={(id) => goToScreen(id)}
                  change={change}
                  onAdd={() => {
                    setTab("screens");
                    panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onSettings={() => {
                    setWordMode("edit");
                    setSettings((n) => n + 1);
                  }}
                />
                {wordMode === "edit" && <AllWords card={card} screenId={viewing} onChange={editWords} />}
              </div>
            </div>
          </aside>
        </div>
      )}

      {welcome && card && step === "edit" && (
        <Welcome
          card={card}
          onClose={() => setWelcome(false)}
          onWatch={() => {
            setWelcome(false);
            setWordMode("play");
            goToScreen(card.screens[0].id);
          }}
        />
      )}

      {askToWrite && card && stillToWrite(card).length > 0 && (
        <StillToWrite
          card={card}
          onClose={() => {
            setAskToWrite(false);
            requestAnimationFrame(() => basketButton.current?.focus());
          }}
          onAnyway={() => publish(true)}
          onGo={(id, stage) => {
            setAskToWrite(false);
            setShowPreview(false);
            setWordMode("edit");
            goToScreen(id, stage);
            requestAnimationFrame(() => cardBox.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
        />
      )}

      {bigView && card && <FullScreenView card={card} startAt={viewing} closeLabel={c.closePreview} onClose={() => setBigView(false)} />}

      {showPreview && card && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="relative min-h-0 flex-1">
            <EditableCard card={card} screenId={viewing} enabled={wordMode === "edit"} onChange={editWords} onScreen={editScreen} onBegin={remember} pick={pick} className="h-full">
              <CardPlayer card={card} preview sound editing={wordMode === "edit"} focusScreenId={selected} focusNonce={nudge} focusStage={focusStage} onScreenChange={setViewing} />
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
            <ModeSwitch wordMode={wordMode} setWordMode={setWordMode} />
            <PreviewControls card={card} viewing={viewing} stage={stageShown} onGo={goToScreen} wordMode={wordMode} />
            {wordMode === "edit" && <AllWords card={card} screenId={viewing} onChange={editWords} />}
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

// Before the basket: the screens whose words still say what to write there, to go and
// write them, or add the card anyway.
function StillToWrite({ card, onGo, onAnyway, onClose }: { card: CardData; onGo: (id: string, stage: number) => void; onAnyway: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const c = t.create;
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      // Tab stays within the reminder.
      const buttons = panel.current?.querySelectorAll<HTMLButtonElement>("button");
      if (e.key !== "Tab" || !buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const blanks = stillToWrite(card);
  // One row per screen, with the first couple of its unwritten bits.
  const screens = [...new Set(blanks.map((b) => b.index))];
  // A second tap of a double-tap lands on whatever has just opened under the finger; it
  // mustn't close this or add the card anyway.
  const once = (act: () => void) => (e: React.MouseEvent) => e.detail < 2 && act();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="to-write-title" className="fixed inset-0 z-[70] overflow-y-auto bg-black/50" onClick={once(onClose)}>
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <div ref={panel} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border-2 border-foreground bg-background p-5 shadow-2xl">
          <h2 id="to-write-title" className="font-brand text-2xl font-bold">
            {c.toWriteTitle}
          </h2>
          <p className="mt-1 opacity-75">{c.toWriteIntro}</p>
          <div className="mt-4 space-y-2">
            {screens.map((index) => {
              const screen = card.screens[index];
              const name = screen.type === "game" ? t.labels.games[screen.game] : t.labels.screens[screen.type];
              const own = blanks.filter((b) => b.index === index);
              const words = own.map((b) => `“${b.text}”`);
              return (
                <button
                  key={screen.id}
                  type="button"
                  autoFocus={index === screens[0]}
                  // To the moment its first blank shows (a box picked, a note out of the jar).
                  onClick={once(() => onGo(screen.id, stageFor(screen, own[0].path)))}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-line px-4 py-3 text-start transition hover:border-brand"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{fmt(c.toWriteScreen, { n: index + 1, name })}</span>
                    <span className="block truncate text-sm opacity-65">
                      {words.slice(0, 2).join(", ")}
                      {words.length > 2 ? "…" : ""}
                    </span>
                  </span>
                  <span aria-hidden className="text-xl text-brand">
                    ✎
                  </span>
                </button>
              );
            })}
          </div>
          {/* On a phone, Go back is at the bottom, where the Add to basket button was. */}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row-reverse">
            <button type="button" onClick={once(onClose)} className="flex-1 rounded-full bg-brand py-3 font-semibold text-white">
              {c.toWriteBack}
            </button>
            <button type="button" onClick={once(onAnyway)} className="flex-1 rounded-full border-2 border-line py-3 font-semibold">
              {c.toWriteAnyway}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// When the card has just been made: the card, playing, and how to make it their own.
function Welcome({ card, onClose, onWatch }: { card: CardData; onClose: () => void; onWatch: () => void }) {
  const { t } = useI18n();
  const s = t.studio;
  return (
    // Centred while it fits; on a small phone it starts at the top and scrolls, never cut off.
    <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="fixed inset-0 z-[70] overflow-y-auto bg-black/50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-3xl border-2 border-foreground bg-background p-5 shadow-2xl sm:p-8">
          <h2 id="welcome-title" className="font-brand text-3xl font-bold sm:text-4xl">
            {s.welcomeTitle}
          </h2>
          <p className="mt-2 text-lg opacity-80">{fmt(s.welcomeIntro, { name: card.to })}</p>
          <div className="mt-5 grid items-center gap-6 sm:grid-cols-[240px_1fr]">
            <div className="mx-auto h-[300px] w-[185px] overflow-hidden rounded-[2rem] border-4 border-foreground shadow-xl sm:h-[360px] sm:w-[220px]">
              <AtPhoneSize>
                <CardPlayer card={card} preview bare />
              </AtPhoneSize>
            </div>
            <ol className="space-y-3">
              {s.welcomeSteps.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-lg">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                  <span>{fmt(step, { name: card.to })}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onWatch} className="rounded-full border-2 border-foreground px-6 py-3 text-lg font-semibold">
              ▶ {t.custom.play.replace(/^▶\s*/, "")}
            </button>
            <button type="button" autoFocus onClick={onClose} className="rounded-full bg-brand px-8 py-3 font-brand text-xl font-semibold text-white shadow-lg">
              {s.startDesigning} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// The card filling the whole screen, as the person getting it will see it. Uses the
// browser's own full screen where it can; Escape or the button closes it.
function FullScreenView({ card, startAt, closeLabel, onClose }: { card: CardData; startAt?: string; closeLabel: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const el = box.current;
    el?.requestFullscreen?.().catch(() => {});
    // Leaving the browser's full screen (Escape, or its own button) closes the view too.
    const onChange = () => !document.fullscreenElement && close.current();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    document.addEventListener("fullscreenchange", onChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);
  return (
    <div ref={box} role="dialog" aria-modal="true" aria-label={closeLabel} className="fixed inset-0 z-[80] flex flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        <CardPlayer card={card} preview sound focusScreenId={startAt} />
      </div>
      <button type="button" onClick={() => close.current()} className="absolute start-4 top-4 z-50 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white">
        ✕ {closeLabel}
      </button>
    </div>
  );
}

type PreviewControlsProps = {
  card: CardData;
  viewing?: string;
  stage: number;
  onGo: (screenId: string, stage: number) => void;
  wordMode: "edit" | "play";
};

// Step through the card's screens, with a hint for the mode it's in.
// The arrows step through every screen and, within each, every moment worth seeing
// on its own: the envelope closed then open, the question then "yes", and so on.
function PreviewControls({ card, viewing, stage, onGo, wordMode }: PreviewControlsProps) {
  const { t } = useI18n();
  const x = t.custom;
  const i = Math.max(card.screens.findIndex((s) => s.id === viewing), 0);
  const steps = card.screens.flatMap((s) => stagesOf(s).map((_, k) => ({ id: s.id, stage: k })));
  const at = Math.max(
    steps.findIndex((p) => p.id === card.screens[i]?.id && p.stage === stage),
    steps.findIndex((p) => p.id === card.screens[i]?.id),
    0,
  );
  const go = (move: number) => {
    const target = steps[at + move];
    if (target) onGo(target.id, target.stage);
  };
  const stages = card.screens[i] ? stagesOf(card.screens[i]) : [];
  const current = stages[Math.min(stage, stages.length - 1)];
  const arrow = "grid h-9 w-9 place-items-center rounded-full border border-line bg-panel font-bold transition hover:border-brand disabled:opacity-30";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <p className="text-xs opacity-60">{wordMode === "edit" ? x.clickHint : t.create.livePreview}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => go(-1)} disabled={at === 0} aria-label={x.prevScreen} className={arrow}>
          <span className="rtl:rotate-180">←</span>
        </button>
        <span className="min-w-12 text-center text-sm font-semibold tabular-nums opacity-70">
          {i + 1} / {card.screens.length}
        </span>
        <button onClick={() => go(1)} disabled={at === steps.length - 1} aria-label={x.nextScreen} className={arrow}>
          <span className="rtl:rotate-180">→</span>
        </button>
      </div>
      {stages.length > 1 && current && (
        <p data-stage className="flex w-full items-center justify-end gap-1.5 text-xs font-semibold opacity-70">
          {stages.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all ${k === Math.min(stage, stages.length - 1) ? "w-4 bg-brand" : "w-1.5 bg-current opacity-30"}`} />
          ))}
          <span className="ms-1">{fmt(x.stages[current.name], { n: current.n ?? "" })}</span>
        </p>
      )}
    </div>
  );
}

// Edit mode (tap any words to change them) or preview mode (the card reacts as it will for them).
function ModeSwitch({ wordMode, setWordMode }: { wordMode: "edit" | "play"; setWordMode: (mode: "edit" | "play") => void }) {
  const { t } = useI18n();
  const x = t.custom;
  return (
    <div role="tablist" className="flex w-fit gap-1 rounded-full border-2 border-foreground/80 bg-panel p-1">
      {(["edit", "play"] as const).map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={wordMode === m}
          onClick={() => setWordMode(m)}
          // A little narrower on a phone, so the 📱/💻 switch fits beside it.
          className={`rounded-full px-2.5 py-2 text-sm font-bold transition sm:px-4 ${wordMode === m ? "bg-foreground text-background" : "opacity-70 hover:opacity-100"}`}
        >
          {m === "edit" ? x.editWords : x.play}
        </button>
      ))}
    </div>
  );
}

// The card as it'll look on a phone or on a computer. Compact is just the icons, with the
// words for screen readers and on hover.
function DeviceSwitch({ view, setView, compact = false }: { view: "phone" | "computer"; setView: (view: "phone" | "computer") => void; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div role="tablist" aria-label={t.create.preview} className={`flex w-fit gap-1 rounded-full bg-panel p-1 ${compact ? "border-2 border-foreground/80" : "border border-line"}`}>
      {(["computer", "phone"] as const).map((v) => {
        const label = v === "phone" ? t.product.onPhone : t.product.onComputer;
        // The labels start with their icon, e.g. "📱 On a phone".
        const [icon, ...words] = label.split(" ");
        return (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            aria-label={compact ? words.join(" ") : undefined}
            title={compact ? words.join(" ") : undefined}
            onClick={() => setView(v)}
            // Compact, it's as tall as the mode switch beside it.
            className={`rounded-full text-sm font-semibold transition ${compact ? "grid h-9 w-8 place-items-center text-base leading-none" : "px-4 py-1.5"} ${view === v ? "bg-foreground text-background" : "opacity-70 hover:opacity-100"}`}
          >
            {compact ? icon : label}
          </button>
        );
      })}
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
// Which screen a typed change goes on.
function LookingAt({ card, viewing }: { card: CardData; viewing: string | undefined }) {
  const { t } = useI18n();
  const i = Math.max(card.screens.findIndex((s) => s.id === viewing), 0);
  const screen = card.screens[i];
  if (!screen) return null;
  return <p className="text-sm opacity-70">{fmt(t.custom.lookingAt, { n: i + 1, name: t.labels.screens[screen.type] })}</p>;
}

// On a phone the preview covers the typing box, so it has its own box for the screen showing.
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

