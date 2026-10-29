import type { CardData } from "@/lib/card";
import { cardTier } from "@/lib/catalog";
import { inBasket, readMade, type Made } from "@/lib/basket";
import type { Tier } from "@/lib/pricing";
import { NO_ANSWERS, type Answers } from "./Quiz";

// Someone's work, kept in this browser, so a refresh, a tab the phone closed while they
// were in their email, or a link that starts a new card never loses it.

// The card being made or changed. Written on every change while it's open in the editor.
const DRAFT_KEY = "sv-draft-v1";
const MODE_KEY = "sv-draft-mode";
// The basket card the draft is a change to, if it's one.
const EDIT_KEY = "sv-draft-edit";
// Unfinished cards set aside while another card was made or changed. The newest comes back
// as the draft once the card that took its place is in the basket or thrown away.
const PARKED_KEY = "sv-draft-parked";
const MAX_PARKED = 3;
// The questions in progress, in this tab: kept while Google signs them in (which leaves the
// site), and in case the page reloads while they fetch a code from their email.
const QUIZ_KEY = "sv-quiz-v1";
// The card this tab last put in the basket, so coming back here offers to change it.
const ADDED_KEY = "sv-added";

export type Draft = { card: CardData; mode: Tier; editing?: string };

export type SavedQuiz = {
  step: "quiz" | "describe";
  answers: Answers;
  question: number;
  mode: Tier;
  templateSlug?: string;
  idea: string;
  to: string;
  from: string;
  at: number;
  // The page's address when it was kept: the same address again means the page reloaded.
  search?: string;
  // Kept just before leaving for Google's sign-in page.
  signingIn?: boolean;
};

// What can be carried on with, offered before starting something new.
export type Waiting = { draft?: Draft; quiz?: SavedQuiz; added?: Made; cantOpen?: boolean };

const isCard = (card: unknown): card is CardData => {
  const c = card as Partial<CardData> | null;
  return Boolean(c && typeof c === "object" && Array.isArray(c.screens) && c.screens.length > 0 && typeof c.to === "string" && typeof c.from === "string");
};
const isTier = (mode: unknown): mode is Tier => mode === "premade" || mode === "custom";

export function loadDraft(): Draft | null {
  try {
    const card: unknown = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    if (!isCard(card)) return null;
    const mode = localStorage.getItem(MODE_KEY);
    const editing = localStorage.getItem(EDIT_KEY);
    return { card, mode: isTier(mode) ? mode : cardTier(card), ...(editing ? { editing } : {}) };
  } catch {
    return null;
  }
}

export function saveDraft({ card, mode, editing }: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(card));
    localStorage.setItem(MODE_KEY, mode);
    if (editing) localStorage.setItem(EDIT_KEY, editing);
    else localStorage.removeItem(EDIT_KEY);
  } catch {}
}

function readParked(): Draft[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(PARKED_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((d) => d && isCard(d.card) && isTier(d.mode)) : [];
  } catch {
    return [];
  }
}

function writeParked(list: Draft[]) {
  try {
    if (list.length) localStorage.setItem(PARKED_KEY, JSON.stringify(list.slice(0, MAX_PARKED)));
    else localStorage.removeItem(PARKED_KEY);
  } catch {}
}

// Sets an unfinished card aside, rather than writing over it.
export function park(draft: Draft) {
  const json = JSON.stringify(draft.card);
  // A change to a basket card that changed nothing: the basket has it already.
  if (draft.editing && JSON.stringify(readMade(draft.editing)?.card) === json) return;
  const others = readParked().filter((d) => JSON.stringify(d.card) !== json && !(draft.editing && d.editing === draft.editing));
  writeParked([draft, ...others]);
}

// Forgets the card that was being made or changed. The card most recently set aside for it,
// if there is one, becomes the draft again and is returned so it can be offered.
export function dropDraft(): Draft | null {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(MODE_KEY);
    localStorage.removeItem(EDIT_KEY);
  } catch {}
  const [back, ...rest] = readParked();
  if (!back) return null;
  writeParked(rest);
  // A change to a basket card that's since been paid for or taken out is just a card now.
  const draft = back.editing && !inBasket(back.editing) ? { card: back.card, mode: back.mode } : back;
  saveDraft(draft);
  return draft;
}

export function loadQuiz(): SavedQuiz | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(QUIZ_KEY) ?? "null") as SavedQuiz | null;
    if (!saved || typeof saved.at !== "number" || !saved.answers || Date.now() - saved.at > 24 * 60 * 60_000) return null;
    // Answers kept by an older version of the questions may be missing newer ones.
    return { ...saved, answers: { ...NO_ANSWERS, ...saved.answers } };
  } catch {
    return null;
  }
}

export function saveQuiz(quiz: SavedQuiz) {
  try {
    sessionStorage.setItem(QUIZ_KEY, JSON.stringify(quiz));
  } catch {}
}

export function clearQuiz() {
  try {
    sessionStorage.removeItem(QUIZ_KEY);
  } catch {}
}

// Whether there's anything in the questions worth offering back.
const started = (q: SavedQuiz) => q.question > 0 || Boolean(q.answers.to.trim() || q.answers.describe.trim() || q.idea.trim());

export function markAdded(id: string) {
  try {
    sessionStorage.setItem(ADDED_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {}
}

export function clearAdded() {
  try {
    sessionStorage.removeItem(ADDED_KEY);
  } catch {}
}

// The card this tab just put in the basket, while it's still there waiting to be paid for.
function loadAdded(): Made | null {
  try {
    const added = JSON.parse(sessionStorage.getItem(ADDED_KEY) ?? "null") as { id?: unknown; at?: unknown } | null;
    if (typeof added?.id !== "string" || typeof added.at !== "number" || Date.now() - added.at > 60 * 60_000) return null;
    const made = readMade(added.id);
    return made && inBasket(made.id) ? made : null;
  } catch {
    return null;
  }
}

export type Begin = {
  // A card to open in the editor straight away.
  open?: Draft;
  // The questions to carry on with.
  quiz?: SavedQuiz;
  // An unfinished card to set aside once the opened one is saved over it.
  park?: Draft;
  waiting: Waiting;
};

// Where the card maker begins. A card from the basket opens to be changed; questions part-way
// through come back after a reload or signing in with Google; an unfinished card opens
// straight away unless the link asked for something new, when it's offered instead.
export function resumeFrom({ edit, resume, fresh, search }: { edit?: string; resume?: boolean; fresh: boolean; search: string }): Begin {
  const draft = loadDraft();
  const quiz = loadQuiz();
  if (edit) {
    const made = readMade(edit);
    if (!made) return { waiting: { cantOpen: true, ...(draft ? { draft } : {}) } };
    // Already being changed (the page reloaded, or Back from the basket): carry on with that.
    if (draft?.editing === made.id) return { open: draft, waiting: {} };
    return { open: { card: made.card, mode: made.mode, editing: made.id }, ...(draft ? { park: draft } : {}), waiting: {} };
  }
  const added = loadAdded() ?? undefined;
  if (quiz && (resume || quiz.search === search)) return { quiz, waiting: { draft: draft ?? undefined, added } };
  if (draft && !fresh && !added) return { open: draft, waiting: {} };
  return { waiting: { draft: draft ?? undefined, quiz: quiz && started(quiz) ? quiz : undefined, added } };
}
