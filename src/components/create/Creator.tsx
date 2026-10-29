"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { Motif } from "@/components/card/motifs";
import { Logo } from "@/components/Logo";
import { BrowserFrame } from "@/components/BrowserFrame";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MAX_BASKET, addToBasket, inBasket, readMade, replaceInBasket, saveMade, type Made } from "@/lib/basket";
import type { CardData, Occasion, Screen, ThemeName } from "@/lib/card";
import { stagesOf } from "@/lib/stages";
import { DesignPicker } from "@/components/catalog/DesignPicker";
import { cardTier, getTemplate } from "@/lib/catalog";
import { formatMoney, tierPrice } from "@/lib/pricing";
import { withTheme } from "@/lib/recolour";
import { themes } from "@/lib/themes";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { SignIn, type SignedIn } from "@/components/SignIn";
import { TwoWays } from "@/components/TwoWays";
import { NO_ANSWERS, Quiz, briefFrom, quizPrompt, withSuggestions, type Answers } from "./Quiz";
import { Field } from "./ScreenEditor";
import { openChat } from "@/components/open-chat";
import { AtComputerSize, AtPhoneSize } from "./AtPhoneSize";
import { ScreenStrip, StudioPanel, type Tab } from "./Studio";
import { useFreshTap } from "./one-tap";
import { useWide } from "./use-wide";
import { AllWords, EditableCard, setAt, type Path } from "./WordEditing";
import { stageFor, stillToWrite } from "@/lib/blanks";
import type { Brief } from "@/lib/brief";
import { recentLooks, rememberLook } from "@/lib/recent-looks";
import { newSeed, restyle } from "@/lib/vary";
import { AiError, MakingScreen, NO_PROGRESS, keepScreenOn, type Progress } from "./MakingScreen";
import { FirstLook } from "./FirstLook";
import { CarryOn } from "./CarryOn";
import { ConfirmDialog } from "./ConfirmDialog";
import { ErrorNotice, canRetry } from "./ErrorNotice";
import { UndoToast } from "./UndoToast";
import { clearAdded, clearQuiz, dropDraft, forgetChanges, loadQuiz, markAdded, park, resumeFrom, saveDraft, saveQuiz, started, type Draft, type SavedQuiz, type Waiting } from "./drafts";

// The designs shown next to each example description, in the same order as t.custom.examples.
const EXAMPLE_SLUGS = ["be-my-valentine", "birthday-bash", "festival-of-lights", "naughty-or-nice", "please-forgive-me", "for-the-best-mum"];

type Album = { photos: string[]; captions: string[] };
// A new card being asked for: everything makeCard was given, and which try this is.
type MakeJob = { prompt: string; names: { to: string; from: string }; source: "quiz" | "describe"; album?: Album; template?: string; brief?: Brief; attempt: number };
// A colour picked for a design on its product page.
type Picked = { slug: string; theme: ThemeName };
const pickedIn = (quiz: SavedQuiz | null | undefined): Picked | undefined =>
  quiz?.templateSlug && typeof quiz.theme === "string" && Object.prototype.hasOwnProperty.call(themes, quiz.theme) ? { slug: quiz.templateSlug, theme: quiz.theme } : undefined;

// Puts photos added before the card was written into its photos screen. Without one,
// a card made from scratch gets one before the message (or finale), and a ready-made
// design gets one just before its finale, so the rest of it stays in its own order.
function withPhotos(card: CardData, album: Album | undefined, title: string, fromScratch: boolean): CardData {
  if (!album?.photos.length) return card;
  const { photos, captions } = album;
  const at = card.screens.findIndex((s) => s.type === "photos");
  if (at >= 0) return { ...card, screens: card.screens.map((s, i) => (i === at && s.type === "photos" ? { ...s, photos, captions } : s)) };
  // A card can't hold more screens than this (lib/card.ts), and wouldn't save.
  if (card.screens.length >= 12) return card;
  const before = card.screens.findIndex((s) => (fromScratch ? s.type === "message" || s.type === "finale" : s.type === "finale"));
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

// The most screens a card can have (see lib/card.ts).
const MAX_SCREENS = 12;

// Added text boxes left empty would stop the card saving, and show nothing anyway.
function withoutEmptyTexts(card: CardData): CardData {
  return { ...card, screens: card.screens.map((s) => (s.style?.texts?.some((t) => !t.text.trim()) ? { ...s, style: { ...s.style, texts: s.style.texts.filter((t) => t.text.trim()) } } : s)) };
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
  // A card in the basket to change.
  initialEdit?: string;
};

export function Creator({ initialOccasion, initialTemplate, initialTo, initialFrom, initialTheme, initialStart, resume, signInFailed, initialEdit }: CreatorProps) {
  const { t, currency } = useI18n();
  const c = t.create;
  const x = t.custom;
  const router = useRouter();
  // Fireworks only work as a finale effect, so they're not offered as a background.
  const chosen = getTemplate(initialTemplate);
  // Where to begin: a card or questions to carry on with, or what the link asks for.
  const [begin] = useState(() => resumeFrom({ edit: initialEdit, resume, fresh: Boolean(initialOccasion || chosen || initialStart), search: window.location.search }));
  const saved = begin.quiz;
  const draft = begin.open;
  // The basket card being changed, if it's one.
  const [editingId, setEditingId] = useState(draft?.editing);
  // What's offered to carry on with, until they pick something.
  const [waiting, setWaiting] = useState<Waiting>(begin.waiting);
  // An unfinished card that would otherwise be written over by the next one: it's set
  // aside instead, and offered again once that one's done.
  const keep = useRef<Draft | null>(begin.park ?? begin.waiting.draft ?? null);
  // A set-aside change to a basket card that's been opened again, to take out of that list.
  const taken = useRef(begin.take ? begin.open?.editing : undefined);
  // A design picked elsewhere goes straight to the questions; an occasion opens the designs
  // for it, unless it came with a personalised start (then it's filled in on the questions).
  const [step, setStep] = useState<Step>(
    saved ? saved.step : draft ? "edit" : chosen || initialStart === "custom" ? "quiz" : initialOccasion || initialStart === "premade" ? "pick" : "choose",
  );
  const [mode, setMode] = useState<Mode>(() =>
    saved ? saved.mode : draft ? draft.mode : chosen || initialStart === "premade" || (initialOccasion && initialStart !== "custom") ? "premade" : "custom",
  );
  const [templateSlug, setTemplateSlug] = useState<string | undefined>(saved ? saved.templateSlug : chosen?.slug);
  // The colour picked for a design on its product page. It's kept with the questions, so it
  // survives signing in with Google (which comes back to a plain link) and carrying on later.
  const [picked, setPicked] = useState<Picked | undefined>(() => pickedIn(saved) ?? (chosen && initialTheme ? { slug: chosen.slug, theme: initialTheme } : undefined));
  const [to, setTo] = useState(saved?.to ?? draft?.card.to ?? initialTo ?? "");
  const [from, setFrom] = useState(saved?.from ?? draft?.card.from ?? initialFrom ?? "");
  const [card, setCard] = useState<CardData | null>(draft?.card ?? null);
  const [selected, setSelected] = useState<string | undefined>(draft?.card.screens[0]?.id);
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
  // Why the card couldn't go in the basket, and the screen to fix if the server said which
  // (with the screens' order then, since the message names it by its number).
  const [error, setError] = useState<{ text: string; screenId?: string; order?: string; retry?: boolean } | null>(null);
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
  const [progress, setProgress] = useState<Progress>(NO_PROGRESS);
  const making = useRef<AbortController | null>(null);
  // The card being made, kept so "Try again" can ask for exactly the same again; its big
  // idea once the writer has one; and how it ended ("ready" for a moment, or why it didn't).
  const [job, setJob] = useState<MakeJob | null>(null);
  const [concept, setConcept] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"ready" | { error: string } | null>(null);
  // Leaving the page (Back, say) stops a card being made, so its use of the allowance is given back.
  useEffect(() => () => making.current?.abort(), []);
  // The live preview: on a phone or a computer, which screen it's showing, and a nudge
  // that makes it jump back to a screen after that screen changes.
  // It starts as the device they're on (see `shown` below); the other is a tap away.
  const [view, setView] = useState<"phone" | "computer" | null>(null);
  const [viewing, setViewing] = useState<string | undefined>();
  const [nudge, setNudge] = useState(0);
  const [screenAsk, setScreenAsk] = useState("");
  // The questions. Names from a product page, the occasion (a design's, or one asked for),
  // and the suggestions that follow from it are filled in already. A quiz saved before
  // the questions last changed is topped up with the newer answers' blanks.
  const [answers, setAnswers] = useState<Answers>(() =>
    saved
      ? { ...NO_ANSWERS, ...saved.answers }
      : withSuggestions(
          { ...NO_ANSWERS, to: initialTo ?? "", from: initialFrom ?? "", occasion: chosen?.occasion ?? (initialStart === "custom" ? (initialOccasion ?? "") : "") },
          t.quiz.relations,
          chosen,
        ),
  );
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

  // Back from signing in with Google, the card is made straight away (see afterGoogle).
  const afterGoogle = useRef(() => {});
  const wentOn = useRef(false);
  useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { enabled: boolean; google: boolean; email: boolean; account: SignedIn | null; left?: { change: number } }) => {
        setAuth({ google: s.google, email: s.email, account: s.account, needed: s.enabled && !s.account });
        if (s.left) setChangesLeft(s.left.change);
        if (s.account && !wentOn.current) {
          wentOn.current = true;
          afterGoogle.current();
        }
      })
      .catch(() => {});
  }, []);

  // The questions (or the description) as they are now, kept in this tab.
  const quizNow = (): SavedQuiz => ({
    step: step === "describe" ? "describe" : "quiz",
    answers,
    question,
    mode,
    templateSlug,
    theme: picked && picked.slug === templateSlug ? picked.theme : undefined,
    idea,
    to,
    from,
    at: Date.now(),
    search: window.location.search,
  });
  // Kept as they go, so a reload while they fetch a code from their email loses nothing.
  // Questions from before that are on offer aren't written over until they've moved on.
  useEffect(() => {
    if ((step === "quiz" || step === "describe") && !(waiting.quiz && step === "quiz" && question === 0)) saveQuiz(quizNow());
  });
  // Signing up is the last thing asked, so once it's done the card is made, with nothing more to press.
  const carryOnSignedIn = () => {
    if (step === "quiz") makeFromQuiz();
    else if (step === "describe" && idea.trim().length >= 3 && to.trim() && from.trim()) makeCard(idea.trim(), { to, from }, "describe");
  };
  useEffect(() => {
    afterGoogle.current = () => {
      if (saved?.signingIn && !signInFailed && Date.now() - saved.at < 30 * 60_000) carryOnSignedIn();
    };
  });
  const signUp = auth?.needed
    ? {
        google: auth.google,
        email: auth.email,
        account: auth.account,
        onSignedIn: (account: SignedIn) => {
          setAuth((a) => a && { ...a, account });
          setAiError(null);
          carryOnSignedIn();
        },
        // Kept while Google signs them in, which leaves the site.
        onGoogle: () => saveQuiz({ ...quizNow(), signingIn: true }),
      }
    : undefined;
  const mustSignUp = Boolean(signUp && !signUp.account);

  useEffect(() => {
    if (!card || step !== "edit") return;
    if (keep.current) {
      if (JSON.stringify(keep.current.card) !== JSON.stringify(card)) park(keep.current);
      keep.current = null;
    }
    saveDraft({ card, mode, editing: editingId });
    if (taken.current) {
      forgetChanges(taken.current);
      taken.current = undefined;
    }
    // From now on a reload comes back to this card, whatever the link first asked for, and
    // the card put in the basket earlier is no longer the one to offer.
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    clearAdded();
  }, [card, step, mode, editingId]);

  // The two ways: personalised goes to the questions, ready-made to the designs first.
  const chooseWay = (way: Mode) => {
    setAiError(null);
    setMode(way);
    setQuestion(0);
    setStep(way === "premade" ? "pick" : "quiz");
    window.scrollTo({ top: 0 });
  };

  // From the designs to the questions. The design sets the occasion (so it isn't asked)
  // and suggests its own feeling, unless they've already picked one. A design used straight
  // from its preview comes as `slug`.
  const toQuestions = (slug = templateSlug) => {
    const tpl = getTemplate(slug);
    if (!tpl) return;
    setAiError(null);
    setTemplateSlug(tpl.slug);
    setAnswers((a) => withSuggestions({ ...a, occasion: tpl.occasion, occasionOther: "" }, t.quiz.relations, tpl));
    setQuestion(0);
    setStep("quiz");
    window.scrollTo({ top: 0 });
  };

  // Only after they've said yes (see ConfirmDialog). A card that was set aside for this one
  // comes back, and is offered.
  const startOver = () => {
    setConfirmStart(false);
    const back = dropDraft();
    // Questions started meanwhile are newer work, offered rather than thrown away with this card.
    const quiz = loadQuiz();
    keep.current = back;
    setWaiting({ ...(back ? { draft: back } : {}), ...(quiz && started(quiz) ? { quiz } : {}) });
    setEditingId(undefined);
    setDeleted(null);
    setError(null);
    setCard(null);
    setTo("");
    setFrom("");
    setPast([]);
    setFuture([]);
    setAiDone(false);
    setAiError(null);
    setAiNote(null);
    setAsk("");
    setScreenAsk("");
    setPicked(undefined);
    setAnswers(NO_ANSWERS);
    setQuestion(0);
    setTemplateSlug(undefined);
    setMode("custom");
    setStep("choose");
    window.scrollTo({ top: 0 });
  };
  const [confirmStart, setConfirmStart] = useState(false);

  // Back into the editor with a card from before.
  const openCard = (open: Draft) => {
    setCard(open.card);
    setMode(open.mode);
    setEditingId(open.editing);
    setSelected(open.card.screens[0]?.id);
    setPast([]);
    setFuture([]);
    setAiError(null);
    setWaiting({});
    clearQuiz();
    setStep("edit");
    window.scrollTo({ top: 0 });
  };
  const carryOnDraft = (open: Draft) => {
    // It's the card now, so there's nothing to set aside.
    keep.current = null;
    openCard(open);
  };
  const carryOnAdded = (made: Made) => {
    openCard({ card: made.card, mode: made.mode, editing: made.id });
  };
  const carryOnQuiz = (quiz: SavedQuiz) => {
    setAnswers(quiz.answers);
    setQuestion(quiz.question);
    setMode(quiz.mode);
    setTemplateSlug(quiz.templateSlug);
    setPicked(pickedIn(quiz));
    setIdea(quiz.idea);
    setTo(quiz.to);
    setFrom(quiz.from);
    setWaiting({});
    setStep(quiz.step);
    window.scrollTo({ top: 0 });
  };
  // A new one: an unfinished card stays until the new card takes its place, and is set aside then.
  const startNew = () => {
    setWaiting({});
    clearQuiz();
    clearAdded();
  };

  // Asks for a new card from a description, or for a change to the current one. The
  // reply streams in: the card's big idea, a line for each screen as it's written, then
  // the finished card. Whatever goes wrong comes out as an AiError in plain words, never
  // the browser's own "Failed to fetch".
  const callAi = async (
    body: { prompt: string; card?: CardData; focus?: string; template?: string; keepDesign?: boolean; brief?: Brief; avoid?: string[] },
    names: { to: string; from: string },
    on?: { progress?: (progress: Progress) => void; idea?: (idea: string) => void },
    signal?: AbortSignal,
  ): Promise<{ card: CardData; note?: string; left?: number; direction?: string }> => {
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, to: names.to.trim(), from: names.from.trim() }),
        signal,
      });
      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        // Worth another go when the server had a bad moment; not for a limit, signing in or a switched-off service.
        throw new AiError(typeof json.error === "string" ? json.error : x.errors.failed, res.status >= 500 && res.status !== 503);
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
          // A garbled line, or a kind of event this page doesn't know yet, is passed over.
          let event;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          if (!event || typeof event !== "object") continue;
          if (event.type === "idea") {
            if (typeof event.idea === "string" && event.idea.trim()) on?.idea?.(event.idea.trim().slice(0, 200));
          } else if (event.type === "progress") {
            if (!Array.isArray(event.screens)) continue;
            const screens = event.screens.map((s: unknown) => (typeof s === "string" ? s : ""));
            const titles: unknown[] = Array.isArray(event.titles) ? event.titles : [];
            on?.progress?.({ screens, titles: screens.map((_: string, i: number) => (typeof titles[i] === "string" && titles[i].trim() ? titles[i].trim().slice(0, 80) : null)) });
          } else if (event.type === "card") {
            if (!Array.isArray(event.card?.screens) || !event.card.screens.length) throw new AiError(x.errors.failed, true);
            return {
              card: event.card as CardData,
              note: typeof event.note === "string" ? event.note : undefined,
              left: typeof event.left === "number" ? event.left : undefined,
              direction: typeof event.direction === "string" ? event.direction : undefined,
            };
          } else if (event.type === "error") {
            const error = typeof event.error === "string" ? event.error : x.errors.failed;
            throw new AiError(error, error !== x.errors.refused);
          }
        }
      }
      // It ended without the card: the connection went part-way through.
      throw new AiError(x.errors.connection, true);
    } catch (e) {
      if (e instanceof AiError || signal?.aborted) throw e;
      // "Failed to fetch", "Load failed" and the like: the connection dropped.
      throw new AiError(x.errors.connection, true);
    }
  };

  const makeFromIdea = () => {
    if (mustSignUp) return setAiError(x.errors.signIn);
    if (idea.trim().length < 3) return setAiError(x.errors.describe);
    if (!to.trim() || !from.trim()) return setAiError(c.needNames);
    makeCard(idea.trim(), { to, from }, "describe");
  };

  const makeFromQuiz = () => {
    const prompt = quizPrompt(answers, t, { design: Boolean(design) });
    // The names carry over to "describe it in your own words"; the prompt itself is for the
    // writer, so it isn't put in that box.
    setTo(answers.to.trim());
    setFrom(answers.from.trim());
    makeCard(prompt, { to: answers.to, from: answers.from }, "quiz", { photos: answers.photos, captions: answers.captions }, design?.slug, briefFrom(answers, { design: Boolean(design) }));
  };

  // Writes a new card, showing the loading screen; going back returns to where it was asked for.
  // With a design, only its words are written and everything else stays as the design has it.
  const makeCard = async (prompt: string, names: { to: string; from: string }, source: "quiz" | "describe", album?: Album, template?: string, brief?: Brief) => {
    const controller = new AbortController();
    making.current = controller;
    setJob((j) => ({ prompt, names, source, album, template, brief, attempt: (j?.attempt ?? 0) + 1 }));
    setBusy("make");
    setAiError(null);
    setProgress(NO_PROGRESS);
    setConcept(null);
    setOutcome(null);
    setStep("making");
    window.scrollTo({ top: 0 });
    // Straight from the tap, as some phones only allow it then.
    const letGo = keepScreenOn();
    try {
      // The looks of their last few cards, for the writer to steer away from.
      const avoid = recentLooks();
      const { card: written, direction } = await callAi(
        { ...(template ? { prompt, template, keepDesign: true, brief } : { prompt, brief }), ...(avoid.length ? { avoid } : {}) },
        names,
        {
          // The list only grows: if the writer has a second go, it starts again from nothing.
          progress: (p) => setProgress((was) => (p.screens.length >= was.screens.length ? p : was)),
          idea: setConcept,
        },
        controller.signal,
      );
      rememberLook(direction);
      // A colour picked on the product page carries over, but only for that design.
      const coloured = template && picked?.slug === template ? withTheme(written, picked.theme) : written;
      const filled = withPhotos(coloured, album, t.labels.screens.photos, !template);
      // A ready-made design gets a gentle look of its own (new button and envelope colours,
      // stickers, a font of the same kind), so no two people's copies look the same. Its theme
      // and words stay as picked, and the shop's previews of it stay as designed.
      const made = template ? restyle(filled, newSeed(), { gentle: true, favourite: brief?.accent ?? null }) : filled;
      // A moment to say it's ready, with the envelope sealed, before it plays for them.
      setOutcome("ready");
      await new Promise((done) => setTimeout(done, 1200));
      // Only now are the questions done with: until the card is here, a reload or Back brings them back.
      clearQuiz();
      setCard(made);
      setSelected(made.screens[0]?.id);
      setMode(template ? "premade" : "custom");
      setStep("edit");
      setWelcome(true);
      setPast([]);
      setFuture([]);
      window.scrollTo({ top: 0 });
    } catch (e) {
      if (controller.signal.aborted) setStep(source);
      // Another go could work, so they stay here with a big button to try again.
      else if (e instanceof AiError && e.retry) setOutcome({ error: e.message });
      else {
        setAiError(e instanceof Error ? e.message : x.errors.failed);
        setStep(source);
      }
    } finally {
      letGo();
    }
    making.current = null;
    setBusy(null);
  };
  // The same card asked for again, after it didn't come through.
  const makeAgain = () => job && makeCard(job.prompt, job.names, job.source, job.album, job.template, job.brief);
  // Their favourite colour from the questions, which every new look keeps (null if they didn't
  // pick one). Not known for a card made on an earlier visit.
  const favourite = job?.brief ? (job.brief.accent ?? null) : undefined;

  // The card as it is now, for undo steps begun by something that finishes later (a photo
  // uploading, a typed change coming back), which would otherwise keep the card from when it started.
  const cardNow = useRef(card);
  useLayoutEffect(() => {
    cardNow.current = card;
  });
  const remember = () => {
    const now = cardNow.current;
    if (!now) return;
    setPast((p) => [...p.slice(-39), now]);
    setFuture([]);
  };
  const undoLast = () => {
    const prev = past.at(-1);
    const now = cardNow.current;
    if (!prev || !now) return;
    setFuture((f) => [now, ...f]);
    setPast(past.slice(0, -1));
    setCard(prev);
  };
  const redoNext = () => {
    const next = future[0];
    const now = cardNow.current;
    if (!next || !now) return;
    setPast((p) => [...p, now]);
    setFuture(future.slice(1));
    setCard(next);
  };
  // A change from the design panel or the screens strip.
  const change = (update: (c: CardData) => CardData) => {
    remember();
    setCard((c) => c && update(c));
  };
  // A screen just deleted from the strip, offered back for a few seconds.
  const [deleted, setDeleted] = useState<{ screen: Screen; index: number; n: number } | null>(null);
  const stripChange = (update: (c: CardData) => CardData) => {
    if (card) {
      const after = update(card);
      const index = card.screens.findIndex((sc) => !after.screens.some((a) => a.id === sc.id));
      if (after.screens.length < card.screens.length && index >= 0) setDeleted((d) => ({ screen: card.screens[index], index, n: (d?.n ?? 0) + 1 }));
    }
    change(update);
  };
  // Puts it back where it was, even if other things have changed since.
  const restoreDeleted = () => {
    if (!deleted) return;
    const { screen, index } = deleted;
    setDeleted(null);
    if (!card || card.screens.length >= MAX_SCREENS) return;
    change((c) => (c.screens.some((sc) => sc.id === screen.id) ? c : { ...c, screens: [...c.screens.slice(0, index), screen, ...c.screens.slice(index)] }));
    goToScreen(screen.id);
  };
  const screenName = (screen: Screen) => (screen.type === "game" ? t.labels.games[screen.game] : t.labels.screens[screen.type]);
  // The design panel's tab, and something just added for the card to select. It opens on
  // the words, as a plain form: changing them is what most people come to do.
  const [tab, setTab] = useState<Tab>("words");
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
  // In the phone preview's list of words, each box is one step for Undo, as in the Words tab.
  const listBegun = useRef(false);
  const editListWords = (path: Path, value: string) => {
    if (!listBegun.current) {
      listBegun.current = true;
      remember();
    }
    editWords(path, value);
  };
  // Anything else on one screen (its look, photos, the Words tab's boxes), by the screen's id,
  // so a photo still uploading lands on its own screen even if the screens are moved about meanwhile.
  const editScreenById = (id: string, update: (screen: Screen) => Screen) =>
    setCard((c) => c && { ...c, screens: c.screens.map((s) => (s.id === id ? update(s) : s)) });
  // What a typed change did, shown over the card for a few seconds as it lands.
  const [landed, setLanded] = useState<string | null>(null);
  // A typed change that came back after the card had been changed by hand, so it wasn't used.
  const [aiHeld, setAiHeld] = useState(false);
  const fresh = useFreshTap();
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
    const sent = card;
    setBusy("change");
    setAiError(null);
    setAiDone(false);
    setAiHeld(false);
    setLanded(null);
    // On a phone the typing box is below the card: bring the card up to watch the change land.
    if (!wide && !showPreview) cardBox.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Typing changes are a custom-card thing.
    setMode("custom");
    try {
      const { card: changed, note, left } = await callAi({ prompt: prompt.trim(), card, focus }, { to: card.to, from: card.from });
      if (left !== undefined) setChangesLeft(left);
      // They changed the card while it was being worked on: their changes stay, and they're told.
      if (cardNow.current !== sent) {
        setAiHeld(true);
        setBusy(null);
        return;
      }
      setAiNote(note ?? null);
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
      const said = `✓ ${note || x.changed}`;
      setLanded(said);
      setTimeout(() => setLanded((now) => (now === said ? null : now)), 4000);
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
  // Straight to the screen the server said has something missing, ready to change it.
  const fixScreen = (id: string) => {
    setError(null);
    setShowPreview(false);
    setWordMode("edit");
    goToScreen(id);
    requestAnimationFrame(() => cardBox.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const screenOrder = (of: CardData) => of.screens.map((sc) => sc.id).join(" ");
  const fixFor = (id?: string) => {
    const at = card && id ? card.screens.findIndex((sc) => sc.id === id) : -1;
    return card && id && at >= 0 ? { label: fmt(c.fixScreen, { n: at + 1, name: screenName(card.screens[at]) }), onClick: () => fixScreen(id) } : undefined;
  };
  const publish = async (anyway = false) => {
    if (!card) return;
    if (!card.to.trim() || !card.from.trim()) return setError({ text: c.needNames });
    if (!anyway && stillToWrite(card).length) return setAskToWrite(true);
    setAskToWrite(false);
    const ready = withoutEmptyTexts(card);
    // A basket card changed back to just how it was: it's in the basket already.
    if (editingId && inBasket(editingId) && JSON.stringify(readMade(editingId)?.card) === JSON.stringify(ready)) {
      markAdded(editingId);
      dropDraft();
      return router.push("/basket");
    }
    setSaving(true);
    setError(null);
    let json: { id?: string; error?: string; screen?: unknown };
    try {
      const res = await fetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ready) });
      json = await res.json().catch(() => ({}));
      if (!res.ok || typeof json.id !== "string") {
        // The server may say which screen has the problem, to go straight there.
        const screen = typeof json.screen === "number" && Number.isInteger(json.screen) && json.screen >= 0 && json.screen < ready.screens.length ? ready.screens[json.screen] : undefined;
        setError({ text: json.error ?? c.failed, ...(screen ? { screenId: screen.id, order: screenOrder(ready) } : {}), retry: res.ok || res.status >= 500 });
        return setSaving(false);
      }
    } catch {
      setError({ text: c.saveOffline, retry: true });
      return setSaving(false);
    }
    const id = json.id;
    // Saved but locked until it's paid for; the basket takes it from here. A changed card
    // takes the old one's place.
    const item = { id, to: ready.to, from: ready.from, occasion: ready.occasion, theme: ready.theme, template: ready.template, tier: cardTier(ready), delivery: "self" as const };
    if (editingId) replaceInBasket(editingId, item);
    else addToBasket(item);
    // A copy stays in this browser, so it can be changed from the basket. Any change to it
    // that was set aside is done with now.
    saveMade(id, ready, mode, editingId);
    if (editingId) forgetChanges(id);
    // A full basket (or full storage) can't take it: the card stays here rather than vanishing.
    if (!inBasket(id)) {
      setError({ text: fmt(c.basketFull, { n: MAX_BASKET }) });
      return setSaving(false);
    }
    markAdded(id);
    dropDraft();
    router.push("/basket");
  };

  // The design panel: beside the card on a computer, under the card and its screens on a phone.
  const studio = card && (
    <div ref={panel} className="scroll-mt-4">
      <StudioPanel
        card={card}
        screenIndex={Math.max(card.screens.findIndex((sc) => sc.id === viewing), 0)}
        tab={tab}
        setTab={setTab}
        change={stripChange}
        editScreen={editScreenById}
        editWords={editWords}
        remember={remember}
        keepDesign={mode === "premade"}
        onAdded={onAdded}
        ai={
          <section className="space-y-3 rounded-2xl border-2 border-brand/40 bg-panel p-4">
            <h2 className="font-brand text-xl font-bold">✨ {t.studio.askTitle}</h2>
            <p className="text-base leading-relaxed opacity-80">{t.studio.askHow}</p>
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
                aria-label={t.studio.askTitle}
                placeholder={x.changePlaceholder}
                className="w-full resize-y rounded-xl border-2 border-line bg-background px-3 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <LookingAt card={card} viewing={viewing} />
              <div className="flex flex-wrap items-center gap-3">
                <button disabled={busy !== null || ask.trim().length < 3} className="min-h-12 rounded-full bg-brand px-6 py-3 text-base font-semibold text-on-brand disabled:opacity-50">
                  {busy === "change" ? <Making lines={[x.changing]} /> : t.studio.askButton}
                </button>
                {past.length > 0 && busy === null && (
                  <button
                    type="button"
                    onClick={() => {
                      undoLast();
                      setAiDone(false);
                    }}
                    className="min-h-11 px-2 text-base font-semibold underline underline-offset-4"
                  >
                    {x.undo}
                  </button>
                )}
              </div>
              {changesLeft !== null && <p className="text-sm font-semibold opacity-75">{fmt(x.changesLeft, { n: changesLeft })}</p>}
              {aiDone && (
                <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-base font-semibold text-emerald-900 ring-1 ring-emerald-200">
                  ✓ {aiNote || x.changed}
                </p>
              )}
              {aiHeld && !showPreview && (
                <p role="status" className="rounded-xl bg-background px-3 py-2.5 text-base font-semibold ring-1 ring-line">
                  {c.changedMeanwhile}
                </p>
              )}
              {/* On a phone's full-screen preview it shows there instead. */}
              {aiError && !showPreview && <ErrorNotice message={aiError} onRetry={canRetry(aiError, t) && ask.trim().length >= 3 ? () => changeByTyping(ask, viewing) : undefined} />}
            </form>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base opacity-75">{x.quickTitle}</span>
              {x.quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={busy !== null}
                  onClick={(e) => {
                    if (!fresh(e)) return;
                    setAsk(q);
                    changeByTyping(q);
                  }}
                  className="min-h-11 rounded-full border-2 border-line bg-background px-4 py-2 text-base font-semibold transition hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </section>
        }
      />
    </div>
  );

  return (
    <div className="min-h-dvh">
      <div aria-hidden className="airmail h-1.5" />
      <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <Logo textClass="text-foreground" />
        <div className="flex items-center gap-4">
          {/* On a phone it's at the bottom of the page instead, away from Help. */}
          {step === "edit" && (
            <button onClick={() => setConfirmStart(true)} className="hidden min-h-11 items-center px-2 text-sm font-semibold opacity-70 hover:opacity-100 lg:inline-flex">
              {c.startOver}
            </button>
          )}
          {/* On phones the help chat opens from here rather than floating over the page. */}
          <button onClick={openChat} className="flex items-center gap-1.5 rounded-full border-2 border-foreground/80 px-3 py-1.5 text-sm font-bold lg:hidden">
            <span aria-hidden>💬</span> {t.chat.help}
          </button>
        </div>
      </header>

      {(waiting.draft || waiting.quiz || waiting.added || waiting.cantOpen) && (step === "choose" || step === "pick" || step === "describe" || (step === "quiz" && question === 0)) && (
        <CarryOn waiting={waiting} onDraft={carryOnDraft} onAdded={carryOnAdded} onQuiz={carryOnQuiz} onNew={startNew} />
      )}

      {step === "quiz" && (
        <>
          {/* At the top, where they'll be looking when they come back from the making screen. */}
          {aiError && (
            <div className="mx-auto max-w-2xl px-4 pt-6">
              <ErrorNotice message={aiError} onRetry={canRetry(aiError, t) && !mustSignUp ? makeFromQuiz : undefined} />
            </div>
          )}
          <Quiz
            answers={answers}
            setAnswers={setAnswers}
            index={question}
            setIndex={setQuestion}
            onGenerate={makeFromQuiz}
            onBack={() => setStep(design ? "pick" : "choose")}
            onDescribe={
              design
                ? undefined
                : () => {
                    // The names typed on the first question come too.
                    setTo((v) => answers.to.trim() || v);
                    setFrom((v) => answers.from.trim() || v);
                    setStep("describe");
                  }
            }
            design={design}
            onChangeDesign={() => setStep("pick")}
            signUp={signUp}
          />
        </>
      )}

      {step === "describe" && (
        <section className="mx-auto max-w-3xl px-4 py-10">
          <button
            onClick={() => {
              // And names typed here go back to the questions.
              setAnswers((a) => ({ ...a, to: to.trim() || a.to, from: from.trim() || a.from }));
              setStep("quiz");
            }}
            className="text-sm font-semibold opacity-70"
          >
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
                <button disabled={busy !== null || mustSignUp} className="w-full rounded-full bg-brand py-3.5 font-brand text-lg font-semibold text-on-brand shadow-lg disabled:opacity-70">
                  {x.make} ✨
                </button>
                <p className="text-center text-sm opacity-75">{x.takesAMoment}</p>
                {aiError && <ErrorNotice message={aiError} onRetry={canRetry(aiError, t) && !mustSignUp ? makeFromIdea : undefined} />}
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

      {step === "making" && job && (
        <MakingScreen
          key={job.attempt}
          to={job.names.to}
          from={job.names.from}
          brief={job.brief}
          template={job.template}
          theme={job.template && picked?.slug === job.template ? picked.theme : undefined}
          typed={job.source === "describe" ? job.prompt : undefined}
          photos={job.album?.photos.length ?? 0}
          concept={concept}
          progress={progress}
          outcome={outcome}
          onStop={() => making.current?.abort()}
          onRetry={makeAgain}
          onBack={() => {
            setOutcome(null);
            setStep(job.source);
          }}
        />
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
        <DesignPicker
          occasion={pickOccasion}
          onOccasion={setPickOccasion}
          chosen={templateSlug}
          onChoose={setTemplateSlug}
          onNext={toQuestions}
          onBack={() => setStep("choose")}
          onScratch={() => chooseWay("custom")}
          to={answers.to.trim() || undefined}
          from={answers.from.trim() || undefined}
        />
      )}

      {step === "edit" && card && (
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className={`min-w-0 space-y-6 lg:pb-10 ${error && (!error.order || error.order === screenOrder(card)) ? "pb-64" : "pb-28"}`}>
            {/* On a phone the welcome has said this and the card comes first, so it's only for screen readers there. */}
            <div className="sr-only lg:not-sr-only">
              <h1 className="font-brand text-3xl font-bold">{c.editTitle}</h1>
              <p className="mt-1 opacity-75">{t.studio.intro}</p>
            </div>

            {/* On a computer the design panel is beside the card; on a phone it's under the card (below). */}
            {wide && studio}

            {/* On a phone, starting again is down here, well away from Help. */}
            <button type="button" onClick={() => setConfirmStart(true)} className="mx-auto block min-h-11 px-4 text-base font-semibold underline underline-offset-4 opacity-70 lg:hidden">
              {c.startDifferent}
            </button>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-background/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
              {/* Right above the button they pressed: in the bar along the bottom of a phone, in the column on a computer. */}
              {/* A problem with a screen, named by its number, no longer fits once the screens are
                  moved or deleted: Add to basket again says what's wrong now. */}
              {error && (!error.order || error.order === screenOrder(card)) && (
                <div className="mb-3">
                  <ErrorNotice
                    compact={!wide}
                    message={error.text}
                    onClose={() => setError(null)}
                    onRetry={error.retry ? () => publish(true) : undefined}
                    fix={fixFor(error.screenId)}
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowPreview(true)} className="flex-1 rounded-full border-2 border-line py-3.5 font-semibold lg:hidden">
                  {c.fullScreen}
                </button>
                <button ref={basketButton} onClick={() => publish()} disabled={saving} className="flex-[2] rounded-full bg-brand py-3.5 font-brand text-lg font-semibold text-on-brand shadow-lg disabled:opacity-50 lg:w-full">
                  {saving ? c.adding : fmt(c.addToBasket, { price: formatMoney(tierPrice(cardTier(card), currency), currency) })}
                </button>
              </div>
            </div>
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
                  {/* In both modes, so there's always a way back after a change. */}
                  <button type="button" onClick={undoLast} disabled={!past.length} className="min-h-11 rounded-full border-2 border-line px-4 py-2 text-base font-bold disabled:opacity-35">
                    {t.studio.undo}
                  </button>
                  <button type="button" onClick={redoNext} disabled={!future.length} className="min-h-11 rounded-full border-2 border-line px-4 py-2 text-base font-bold disabled:opacity-35">
                    {t.studio.redo}
                  </button>
                </div>
                <div className="hidden items-center gap-2 lg:flex">
                <DeviceSwitch view={shown} setView={setView} />
                <button type="button" onClick={() => setBigView(true)} className="rounded-full border-2 border-foreground/80 px-4 py-1.5 text-sm font-bold">
                  {c.fullScreen}
                </button>
                </div>
              </div>
              <div className="order-3 lg:order-none">
                <PreviewControls card={card} viewing={viewing} stage={stageShown} onGo={goToScreen} wordMode={wordMode} />
              </div>
              {/* Its own layer: stickers on the card stay under the bar at the bottom of a phone, and
                  the controls for what's selected can hang over the screens strip. */}
              <div ref={cardBox} className="relative z-10 order-2 scroll-mt-4 lg:order-none">
                <EditableCard card={card} screenId={viewing} enabled={wordMode === "edit"} onChange={editWords} onScreen={editScreenById} onBegin={remember} pick={pick} openSettings={settings} stage={stageShown} onNewLook={(next) => change(() => next)} favourite={favourite}>
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
                    <span className="rounded-full bg-black/75 px-5 py-3 text-base font-semibold text-white shadow-lg">
                      <Making lines={[x.changing]} />
                    </span>
                  </div>
                )}
                {/* What a typed change did, as it lands. */}
                {landed && busy === null && (
                  <p role="status" className="pointer-events-none absolute inset-x-0 bottom-4 z-50 mx-auto w-fit max-w-[90%] rounded-2xl bg-black/80 px-5 py-3 text-center text-base font-semibold text-white shadow-lg">
                    {landed}
                  </p>
                )}
              </div>
              {/* The card's screens, like a presentation's slides, then (on a phone) the design panel. */}
              <div className="order-4 space-y-4 lg:order-none">
                <ScreenStrip
                  card={card}
                  screenIndex={Math.max(card.screens.findIndex((sc) => sc.id === viewing), 0)}
                  onGo={(id) => goToScreen(id)}
                  change={stripChange}
                  onAdd={() => {
                    setTab("screens");
                    panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  onSettings={() => {
                    setWordMode("edit");
                    setSettings((n) => n + 1);
                  }}
                />
                {!wide && studio}
              </div>
            </div>
          </aside>
        </div>
      )}

      {welcome && card && step === "edit" && (
        <FirstLook
          card={card}
          onFinish={() => {
            setWelcome(false);
            publish();
          }}
          onEdit={() => {
            setWelcome(false);
            setWordMode("edit");
            goToScreen(card.screens[0].id);
          }}
          onNewLook={(restyled) => {
            remember();
            setCard(restyled);
          }}
          onUndo={past.length ? undoLast : undefined}
          favourite={favourite}
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

      {confirmStart && card && step === "edit" && (
        <ConfirmDialog
          title={c.startOverTitle}
          body={fmt(editingId && inBasket(editingId) ? c.startOverEditBody : c.startOverBody, { name: card.to.trim() || t.quiz.them })}
          keep={c.startOverKeep}
          yes={c.startOverYes}
          onKeep={() => setConfirmStart(false)}
          onYes={startOver}
        />
      )}

      {deleted && card && step === "edit" && !card.screens.some((sc) => sc.id === deleted.screen.id) && (
        <UndoToast
          key={deleted.n}
          text={fmt(c.deleted, { n: deleted.index + 1, name: screenName(deleted.screen) })}
          undo={t.studio.undo}
          closeLabel={c.dismiss}
          onUndo={restoreDeleted}
          onClose={() => setDeleted(null)}
        />
      )}

      {showPreview && card && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="relative min-h-0 flex-1">
            <EditableCard card={card} screenId={viewing} enabled={wordMode === "edit"} onChange={editWords} onScreen={editScreenById} onBegin={remember} pick={pick} stage={stageShown} onNewLook={(next) => change(() => next)} favourite={favourite} className="h-full">
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
            {wordMode === "edit" && (
              <div onFocusCapture={() => (listBegun.current = false)} onBlurCapture={() => (listBegun.current = false)}>
                <AllWords card={card} screenId={viewing} onChange={editListWords} />
              </div>
            )}
            {aiHeld && (
              <p role="status" className="rounded-xl bg-panel px-3 py-2.5 text-base font-semibold ring-1 ring-line">
                {c.changedMeanwhile}
              </p>
            )}
            {aiError && (
              <ErrorNotice compact message={aiError} onClose={() => setAiError(null)} onRetry={canRetry(aiError, t) && screenAsk.trim().length >= 3 ? () => changeByTyping(screenAsk, viewing) : undefined} />
            )}
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
            <button type="button" onClick={once(onClose)} className="flex-1 rounded-full bg-brand py-3 font-semibold text-on-brand">
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
  const arrow = "grid h-12 w-12 place-items-center rounded-full border-2 border-line bg-panel text-xl font-bold transition hover:border-brand disabled:opacity-30";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
      <p className="text-sm opacity-80">{wordMode === "edit" ? x.clickHint : t.studio.watchHint}</p>
      <div className="flex items-center gap-1.5">
        <button onClick={() => go(-1)} disabled={at === 0} aria-label={x.prevScreen} className={arrow}>
          <span className="rtl:rotate-180">←</span>
        </button>
        <span className="min-w-12 text-center text-base font-semibold tabular-nums opacity-80">
          {i + 1} / {card.screens.length}
        </span>
        <button onClick={() => go(1)} disabled={at === steps.length - 1} aria-label={x.nextScreen} className={arrow}>
          <span className="rtl:rotate-180">→</span>
        </button>
      </div>
      {stages.length > 1 && current && (
        <p data-stage className="flex w-full items-center justify-end gap-1.5 text-sm font-semibold opacity-80">
          {stages.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all ${k === Math.min(stage, stages.length - 1) ? "w-4 bg-brand" : "w-1.5 bg-current opacity-30"}`} />
          ))}
          <span className="ms-1">{fmt(x.stages[current.name], { n: current.n ?? "" })}</span>
        </p>
      )}
    </div>
  );
}

// Change it (tap anything to change it) or Watch it (the card reacts as it will for them).
function ModeSwitch({ wordMode, setWordMode }: { wordMode: "edit" | "play"; setWordMode: (mode: "edit" | "play") => void }) {
  const { t } = useI18n();
  return (
    <div role="tablist" className="flex w-fit gap-1 rounded-full border-2 border-foreground/80 bg-panel p-1">
      {(["edit", "play"] as const).map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={wordMode === m}
          onClick={() => setWordMode(m)}
          // A little narrower on a phone, so the 📱/💻 switch fits beside it.
          className={`min-h-11 rounded-full px-2.5 py-2 text-base font-bold transition sm:px-4 ${wordMode === m ? "bg-foreground text-background" : "opacity-75 hover:opacity-100"}`}
        >
          {t.studio.modes[m]}
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
            className={`rounded-full text-sm font-semibold transition ${compact ? "grid h-11 w-9 place-items-center text-lg leading-none" : "px-4 py-1.5"} ${view === v ? "bg-foreground text-background" : "opacity-75 hover:opacity-100"}`}
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
  return <p className="text-sm opacity-75">{fmt(t.custom.lookingAt, { n: i + 1, name: t.labels.screens[screen.type] })}</p>;
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
          className="min-w-0 flex-1 rounded-full border-2 border-line bg-background px-4 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button disabled={busy || value.trim().length < 3} className="min-h-11 shrink-0 rounded-full bg-brand px-5 py-2.5 text-base font-semibold text-on-brand disabled:opacity-50">
          {x.go}
        </button>
      </div>
    </form>
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

