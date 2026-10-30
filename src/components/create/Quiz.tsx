"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { ClientDict } from "@/i18n/en";
import type { Brief } from "@/lib/brief";
import { dateName, upcoming, whenLabel } from "@/lib/calendar";
import { MUSIC, OCCASIONS, type Music, type Occasion } from "@/lib/card";
import type { Template } from "@/lib/catalog";
import { getLook } from "@/lib/looks";
import { price } from "@/lib/pricing";
import { occasions } from "@/lib/templates";
import { AGES, FEELINGS, RELATIONS, suggest, type Age, type Feeling } from "@/lib/vibe-defaults";
import { ProductThumb } from "@/components/catalog/ProductThumb";
import { SignIn, type SignedIn } from "@/components/SignIn";
import { LookStep } from "./LookStep";
import { PhotoField } from "./ScreenEditor";
import { VibePreview } from "./VibePreview";
import { AGE_EMOJI, AboutStep, COLOURS, isColour } from "./quiz-about";
import { FEELING_EMOJI, FeelingStep, MAX_FEELINGS } from "./quiz-feelings";
import { ALL_PICKS, InsideStep, LENGTHS, pickName, type Length } from "./quiz-inside";
import { OtherChip, OtherInput, chip, field, subhead } from "./quiz-parts";
import { Recap, type RecapLine } from "./quiz-recap";
import { useWide } from "./use-wide";

// The questions a card is written from: a personalised one from scratch, or a
// ready-made design with their words written into it. Nearly every answer is a tap,
// most come suggested from the occasion and who it's for, and anything that isn't
// needed can be skipped. Then photos, a look over everything, and signing up before
// it's made. Each answer goes to the card writer as a choice (lib/brief.ts) as well as
// in words.

export type Answers = {
  to: string;
  from: string;
  relation: string;
  occasion: Occasion | "";
  occasionOther: string;
  vibes: Feeling[];
  vibeOther: string;
  // A look from lib/looks.ts and a tune; empty leaves them to us.
  look: string;
  music: Music | "";
  // Screens and games to include, by screen-kit key. None is "Choose for me".
  include: string[];
  length: Length | "";
  // How it should look, in their own words (a card made from scratch).
  describe: string;
  // What a ready-made design should say. Kept apart from `describe`, so switching
  // between the two ways never turns one into the other.
  say: string;
  // A little about them, in their words.
  about: string;
  age: Age | "";
  gentle: boolean;
  // Their favourite colour, by name (see COLOURS).
  colour: string;
  photos: string[];
  captions: string[];
  // Suggested answers they've changed themselves, which suggestions then leave alone.
  touched: Partial<Record<"vibes" | "look" | "music" | "age" | "gentle", true>>;
};

export const NO_ANSWERS: Answers = {
  to: "",
  from: "",
  relation: "",
  occasion: "",
  occasionOther: "",
  vibes: [],
  vibeOther: "",
  look: "",
  music: "",
  include: [],
  length: "",
  describe: "",
  say: "",
  about: "",
  age: "",
  gentle: false,
  colour: "",
  photos: [],
  captions: [],
  touched: {},
};

type Step = "names" | "relation" | "occasion" | "vibe" | "look" | "inside" | "about" | "photos" | "signup";

// A design already has its occasion, look and screens, so those aren't asked.
function stepsFor(design: boolean, signUp: boolean): Step[] {
  return [
    "names",
    "relation",
    ...(design ? [] : (["occasion"] as const)),
    "vibe",
    ...(design ? [] : (["look", "inside"] as const)),
    "about",
    "photos",
    ...(signUp ? (["signup"] as const) : []),
  ];
}

// Only who it's for and what for are needed; the rest is suggested or can be skipped.
function answered(step: Step, a: Answers, relations: string[]) {
  const long = (text: string, min = 1) => text.trim().length >= min;
  switch (step) {
    case "names":
      return long(a.to) && long(a.from);
    case "relation":
      return relations.includes(a.relation) || long(a.relation, 2);
    case "occasion":
      return Boolean(a.occasion) || long(a.occasionOther, 2);
    default:
      return true;
  }
}

// Whether a step that can be skipped has anything on it, for "Next" rather than "Skip".
function filledIn(step: Step, a: Answers, design: boolean) {
  switch (step) {
    case "vibe":
      return a.vibes.length > 0 || Boolean(a.vibeOther.trim());
    case "look":
      return Boolean(a.look || a.music);
    case "about":
      return Boolean((design ? a.say : a.about).trim() || a.age || a.colour);
    case "photos":
      return a.photos.length > 0;
    default:
      return true;
  }
}

const isFeeling = (v: string): v is Feeling => (FEELINGS as readonly string[]).includes(v);
const relationKey = (relation: string, relations: string[]) => RELATIONS[relations.indexOf(relation)] as (typeof RELATIONS)[number] | undefined;

// Fills in the suggested answers for the occasion and who it's for (or the design),
// leaving alone anything they've chosen themselves. Called when an answer changes,
// never from an effect.
export function withSuggestions(a: Answers, relations: string[], design?: Pick<Template, "tone">): Answers {
  const s = suggest({ occasion: a.occasion, relation: relationKey(a.relation, relations), design, chosen: a.touched.vibes ? a.vibes : undefined });
  const age = a.touched.age ? a.age : s.age;
  return {
    ...a,
    vibes: a.touched.vibes ? a.vibes : s.vibes,
    look: a.touched.look ? a.look : s.look,
    music: a.touched.music ? a.music : s.music,
    age,
    gentle: a.touched.gentle ? a.gentle : age === "little" || age === "older",
  };
}

const LENGTH_SCREENS: Record<Length, number> = { short: 5, medium: 7, long: 10 };

const AGE_LINES: Record<Age, string> = {
  little: "They're a young child (under 7): use short, simple words a young child can follow.",
  child: "They're a child: keep the words simple and fun.",
  teen: "They're a teenager.",
  adult: "They're a grown-up.",
  older: "They're older (70 or over) and may not be used to phones: keep it clear and easy to follow.",
};

// The answers written out for the card writer. Labels are in the visitor's language.
// With a ready-made design the words are what it should say, and the design keeps its
// own screens; otherwise the card is built around the screens and look they chose.
export function quizPrompt(a: Answers, t: ClientDict, { design = false } = {}) {
  const q = t.quiz;
  const to = a.to.trim();
  const relation = a.relation.trim();
  const feelings = a.vibes.filter(isFeeling).map((v) => q.feelings[v].label);
  const feel = [...feelings, a.vibeOther.trim()].filter(Boolean);
  const lines = [
    `Occasion: ${a.occasion ? t.occasions[a.occasion].label : a.occasionOther.trim()}`,
    `It's for ${to}${relation ? ` (${relation})` : ""}, from ${a.from.trim()}.`,
    `How it should feel: ${feel.length ? feel.join(", ") : "you choose"}${feelings.length > 1 ? ` (mostly ${feelings[0]})` : ""}`,
  ];
  if (a.age && a.age in AGE_LINES) lines.push(AGE_LINES[a.age]);
  if (!design && a.gentle) lines.push("Keep the games gentle and easy: slower, bigger and quick to win.");
  if (isColour(a.colour)) lines.push(`${to}'s favourite colour is ${q.colours[a.colour]} (${COLOURS[a.colour]}). Use it as the card's main accent colour.`);
  if (design) {
    lines.push(`What the card should say: ${a.say.trim() || "write it however you think they'd love it most."}`);
    return lines.join("\n");
  }
  const look = getLook(a.look);
  const tune = a.music && (MUSIC as readonly string[]).includes(a.music) ? t.labels.music[a.music] : "";
  if (look || tune) lines.push([look && `Look: ${look.name}`, tune && `Music: ${tune}`].filter(Boolean).join(" · "));
  const picks = a.include.filter((k) => ALL_PICKS.includes(k));
  if (picks.length) lines.push(`Screens to include: ${picks.map((k) => pickName(k, t)).join(", ")}`);
  else if (!a.describe.trim()) lines.push("Screens: you choose.");
  if (a.length && a.length in LENGTH_SCREENS) lines.push(`Length: about ${LENGTH_SCREENS[a.length]} screens in all, counting the envelope and the finale.`);
  if (a.about.trim()) lines.push(`About ${to}, in my words (work these into the card): ${a.about.trim()}`);
  if (a.describe.trim()) lines.push(`My own notes on how it should look (if I've described screens, build them in this order): ${a.describe.trim()}`);
  if (a.photos.length)
    lines.push(`I've added ${a.photos.length} photo${a.photos.length > 1 ? "s" : ""}. If I haven't said where they go, add a photos screen where it fits.`);
  return lines.join("\n");
}

// The answers as choices the card writer can act on directly, alongside the prompt.
// Anything left out of date by an older saved quiz is dropped rather than sent.
export function briefFrom(a: Answers, { design = false } = {}): Brief {
  const relation = a.relation.trim().slice(0, 40);
  const tones = a.vibes.filter(isFeeling).slice(0, 6);
  const age = (AGES as readonly string[]).includes(a.age) ? a.age || undefined : undefined;
  const brief: Brief = {
    occasion: a.occasion || undefined,
    relation: relation || undefined,
    tones: tones.length ? tones : undefined,
    age,
    accent: isColour(a.colour) ? COLOURS[a.colour] : undefined,
  };
  // A design keeps its own look, screens and games.
  if (design) return brief;
  const include = a.include.filter((k) => ALL_PICKS.includes(k)).slice(0, 10);
  const about = a.about.trim().slice(0, 600);
  return {
    ...brief,
    look: a.look.slice(0, 30) || undefined,
    music: (MUSIC as readonly string[]).includes(a.music) ? a.music || undefined : undefined,
    include: include.length ? include : undefined,
    length: (LENGTHS as readonly string[]).includes(a.length) ? a.length || undefined : undefined,
    gentle: a.gentle || undefined,
    about: about || undefined,
    // "Choose for me", and nothing written about how it should look.
    surprise: !include.length && !a.describe.trim() ? true : undefined,
  };
}

// The next few occasions, so the one coming up is a tap away.
function comingUp() {
  const seen = new Set<Occasion>();
  return upcoming(new Date(), 8)
    .filter((d) => !seen.has(d.occasion) && Boolean(seen.add(d.occasion)))
    .slice(0, 3);
}

type Props = {
  answers: Answers;
  setAnswers: (update: (a: Answers) => Answers) => void;
  index: number;
  setIndex: (i: number) => void;
  onGenerate: () => void;
  // Back from the first question.
  onBack: () => void;
  // A personalised card can be described in their own words instead.
  onDescribe?: () => void;
  // The ready-made design their words go into, and a way to pick another.
  design?: Template;
  onChangeDesign?: () => void;
  // Signing up before the card is made, when they aren't signed in already.
  signUp?: { google: boolean; email: boolean; account: SignedIn | null; onSignedIn: (account: SignedIn) => void; onGoogle: () => void };
};

export function Quiz({ answers, setAnswers, index, setIndex, onGenerate, onBack, onDescribe, design, onChangeDesign, signUp }: Props) {
  const { t, currency } = useI18n();
  const q = t.quiz;
  const wide = useWide();
  const name = answers.to.trim() || q.them;
  const steps = stepsFor(Boolean(design), Boolean(signUp));
  const at = Math.min(index, steps.length - 1);
  const step = steps[at];
  // The last step makes the card.
  const last = at === steps.length - 1;
  const total = steps.length;
  // Photos still uploading would be left out of the card (or lost leaving for Google), so
  // nothing moves on until they're in.
  const [uploading, setUploading] = useState(0);
  const waiting = uploading > 0 && (step === "photos" || step === "signup");
  const ready = !waiting && (step === "signup" ? Boolean(signUp?.account) : answered(step, answers, q.relations));
  const toInput = useRef<HTMLInputElement>(null);
  const fromInput = useRef<HTMLInputElement>(null);
  // Which questions have their "Other" box open.
  const [other, setOther] = useState<{ relation?: boolean; occasion?: boolean }>({});
  const customRelation = Boolean(answers.relation && !q.relations.includes(answers.relation));
  const [soon] = useState(comingUp);
  // Photos go into the design's photos screen, or a new one just before its ending.
  const designPhotos = !design || design.screens("", "").some((s) => s.type === "photos");
  // What suits the occasion and who it's for, shown first among the feelings.
  const suggestion = suggest({ occasion: answers.occasion, relation: relationKey(answers.relation, q.relations), design });

  // When this question appeared, and whether a tap is already moving on from it, so the
  // second tap of a double tap can't land on the next question too (Next sits just where
  // "Make {name}'s card" appears, and chips move on by themselves).
  const shownAt = useRef(0);
  const leaving = useRef(false);
  useEffect(() => {
    shownAt.current = performance.now();
    leaving.current = false;
    if (step === "names") toInput.current?.focus({ preventScroll: true });
  }, [step]);
  // A new question (not the first, which Creator scrolls to itself) is brought into view
  // and its title focused, so screen readers say it. On the names the box keeps the focus.
  const heading = useRef<HTMLHeadingElement>(null);
  const before = useRef<Step | null>(null);
  useEffect(() => {
    const moved = before.current !== null && before.current !== step;
    before.current = step;
    const h1 = heading.current;
    if (!moved || !h1) return;
    // After a tap far down a long question, the next one would open part-way down. Back
    // to the top, as Creator does, so the progress bar shows too.
    if (h1.getBoundingClientRect().top < 0) window.scrollTo({ top: 0 });
    if (step !== "names") h1.focus({ preventScroll: true });
  }, [step]);
  const tooSoon = (e: { detail: number }) => e.detail > 1 || performance.now() - shownAt.current < 500;

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [key]: value }));
  // An answer that suggestions follow from, with the suggestions brought up to date.
  const choose = (update: (a: Answers) => Answers) => setAnswers((a) => withSuggestions(update(a), q.relations, design));

  const next = () => {
    // Enter on their name moves on to yours.
    if (step === "names" && answers.to.trim() && !answers.from.trim()) return fromInput.current?.focus();
    if (!ready) return;
    if (last) return onGenerate();
    // An answer that was already filled in (say, after coming from a design) still
    // brings its suggestions up to date.
    if (step === "relation" || step === "occasion") choose((a) => a);
    setIndex(at + 1);
  };
  const go = (to: Step) => {
    const i = steps.indexOf(to);
    if (i >= 0) setIndex(i);
  };
  // Single choices move on by themselves, after a beat so the tap registers.
  const pickAndGo = (apply: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    apply();
    setTimeout(() => setIndex(at + 1), 220);
  };
  const pickOccasion = (o: Occasion) => {
    setOther((x) => ({ ...x, occasion: false }));
    pickAndGo(() => choose((a) => ({ ...a, occasion: o, occasionOther: "" })));
  };

  const titles: Record<Step, { title: string; hint: string }> = {
    names: { title: q.questions.to.title, hint: q.questions.to.hint },
    relation: { title: fmt(q.questions.relation.title, { name }), hint: q.questions.relation.hint },
    occasion: { title: q.questions.occasion.title, hint: q.questions.occasion.hint },
    vibe: { title: q.questions.vibe.title, hint: fmt(q.questions.vibe.hint, { n: MAX_FEELINGS }) },
    look: { title: fmt(q.questions.look.title, { name }), hint: q.questions.look.hint },
    inside: { title: fmt(q.questions.inside.title, { name }), hint: q.questions.inside.hint },
    about: design ? { title: q.questions.say.title, hint: q.questions.say.hint } : { title: fmt(q.questions.about.title, { name }), hint: q.questions.about.hint },
    photos: { title: fmt(q.photosTitle, { name }), hint: designPhotos ? q.photosHint : q.photosHintAdd },
    signup: { title: signUp?.account ? fmt(q.signedInTitle, { name }) : q.signupTitle, hint: signUp?.account ? fmt(q.signedIn, { email: signUp.account.email ?? signUp.account.name ?? "" }) : q.signupHint },
  };
  const { title, hint } = titles[step];
  const skip = !last && !filledIn(step, answers, Boolean(design));
  const label = waiting
    ? q.waitingPhotos
    : last
      ? `${answers.to.trim() ? fmt(q.makeFor, { name: answers.to.trim() }) : q.generate} ✨`
      : `${skip ? q.skip : q.next} →`;

  const preview = (className: string) =>
    design ? null : <VibePreview to={answers.to} from={answers.from} occasion={answers.occasion} look={answers.look} className={className} />;

  return (
    <div className="mx-auto max-w-2xl px-4 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <section className="flex min-h-[calc(100dvh-4.5rem)] min-w-0 flex-col py-8 sm:py-12">
        <div className="flex items-center gap-4">
          {!wide && preview("w-16 shrink-0")}
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${((at + 1) / total) * 100}%` }} />
          </div>
          <span className="shrink-0 text-sm font-semibold opacity-75">{fmt(q.progress, { n: at + 1, total })}</span>
        </div>
        {at === 0 && <p className="mt-6 text-lg opacity-70">{design ? q.readyIntro : q.intro}</p>}
        {at === 0 && design && !wide && <DesignChip design={design} onChange={onChangeDesign} />}

        <form
          key={step}
          className="mt-8 flex flex-1 animate-screen-in flex-col"
          // Every tap on the question (its chips, Back, Next) goes through this first.
          onClickCapture={(e) => {
            if (!tooSoon(e)) return;
            e.preventDefault();
            e.stopPropagation();
          }}
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <h1 ref={heading} tabIndex={-1} dir="auto" className="font-brand text-4xl font-bold leading-tight sm:text-5xl">
            {title}
          </h1>
          {hint && <p className="mt-3 text-lg opacity-70">{hint}</p>}

          <div className="mt-8">
            {step === "names" && (
              <>
                <input
                  ref={toInput}
                  value={answers.to}
                  maxLength={40}
                  dir="auto"
                  autoComplete="off"
                  enterKeyHint="next"
                  onChange={(e) => set("to", e.target.value)}
                  placeholder={q.questions.to.placeholder}
                  aria-label={title}
                  className={field}
                />
                <label className="mt-10 block">
                  <span className={subhead}>{q.questions.from.title}</span>
                  <span className="mt-2 block text-lg opacity-70">{q.questions.from.hint}</span>
                  <input
                    ref={fromInput}
                    value={answers.from}
                    maxLength={40}
                    dir="auto"
                    enterKeyHint="next"
                    onChange={(e) => set("from", e.target.value)}
                    placeholder={q.questions.from.placeholder}
                    className={`${field} mt-4`}
                  />
                </label>
              </>
            )}
            {step === "relation" && (
              <>
                <div className="flex flex-wrap gap-2">
                  {q.relations.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={answers.relation === r}
                      onClick={() => {
                        setOther((o) => ({ ...o, relation: false }));
                        pickAndGo(() => choose((a) => ({ ...a, relation: r })));
                      }}
                      className={chip(answers.relation === r)}
                    >
                      {r}
                    </button>
                  ))}
                  <OtherChip label={q.other} on={Boolean(other.relation) || customRelation} onClick={() => setOther((o) => ({ ...o, relation: true }))} className={chip} />
                </div>
                {(other.relation || customRelation) && (
                  <OtherInput
                    value={customRelation ? answers.relation : ""}
                    max={40}
                    onChange={(v) => choose((a) => ({ ...a, relation: v }))}
                    placeholder={q.questions.relation.placeholder}
                  />
                )}
              </>
            )}
            {step === "occasion" && (
              <>
                {soon.length > 0 && (
                  <>
                    <h2 className="mb-3 font-semibold opacity-70">{q.comingUp}</h2>
                    <div className="mb-8 grid gap-2 sm:grid-cols-3">
                      {soon.map((d) => (
                        <button
                          key={`${d.key}-${d.days}`}
                          type="button"
                          aria-pressed={answers.occasion === d.occasion}
                          onClick={() => pickOccasion(d.occasion)}
                          className={`${chip(answers.occasion === d.occasion, "rounded-2xl")} flex items-center gap-3`}
                        >
                          <span aria-hidden className="text-2xl">
                            {occasions[d.occasion].emoji}
                          </span>
                          <span className="min-w-0">
                            <span className="block">{dateName(d, t)}</span>
                            <span className={`block text-sm font-normal ${answers.occasion === d.occasion ? "text-on-brand" : "opacity-70"}`}>{whenLabel(d.days, t)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <h2 className="mb-3 font-semibold opacity-70">{q.allOccasions}</h2>
                  </>
                )}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {OCCASIONS.map((o) => (
                    <button key={o} type="button" aria-pressed={answers.occasion === o} onClick={() => pickOccasion(o)} className={chip(answers.occasion === o, "rounded-2xl")}>
                      <span aria-hidden className="me-1.5">
                        {occasions[o].emoji}
                      </span>
                      {t.occasions[o].label}
                    </button>
                  ))}
                  <OtherChip
                    label={q.other}
                    on={Boolean(other.occasion || answers.occasionOther)}
                    onClick={() => setOther((x) => ({ ...x, occasion: true }))}
                    className={(on) => chip(on, "rounded-2xl")}
                  />
                </div>
                {(other.occasion || answers.occasionOther) && (
                  <OtherInput
                    value={answers.occasionOther}
                    max={60}
                    onChange={(v) => choose((a) => ({ ...a, occasionOther: v, occasion: "" }))}
                    placeholder={q.questions.occasion.placeholder}
                  />
                )}
              </>
            )}
            {step === "vibe" && (
              <FeelingStep
                occasion={answers.occasion}
                vibes={answers.vibes}
                vibeOther={answers.vibeOther}
                suggested={suggestion.vibes}
                isSuggestion={!answers.touched.vibes}
                note={design ? q.suggestedDesign : q.suggested}
                onToggle={(f) =>
                  choose((a) => ({ ...a, vibes: a.vibes.includes(f) ? a.vibes.filter((v) => v !== f) : [...a.vibes, f], touched: { ...a.touched, vibes: true } }))
                }
                onOther={(v) => set("vibeOther", v)}
              />
            )}
            {step === "look" && (
              <LookStep
                name={name}
                occasion={answers.occasion}
                tones={answers.vibes}
                look={answers.look}
                music={answers.music}
                onLook={(key) => setAnswers((a) => ({ ...a, look: key, touched: { ...a.touched, look: true } }))}
                onMusic={(music) => setAnswers((a) => ({ ...a, music, touched: { ...a.touched, music: true } }))}
              />
            )}
            {step === "inside" && (
              <InsideStep
                name={name}
                occasion={answers.occasion}
                gentle={answers.gentle}
                include={answers.include}
                length={answers.length}
                describe={answers.describe}
                onInclude={(include) => set("include", include)}
                onLength={(length) => set("length", length)}
                onDescribe={(text) => set("describe", text)}
              />
            )}
            {step === "about" && (
              <AboutStep
                name={name}
                occasion={answers.occasion}
                design={Boolean(design)}
                text={design ? answers.say : answers.about}
                onText={(text) => set(design ? "say" : "about", text)}
                age={answers.age}
                onAge={(age) => choose((a) => ({ ...a, age, touched: { ...a.touched, age: true } }))}
                gentle={answers.gentle}
                onGentle={(gentle) => setAnswers((a) => ({ ...a, gentle, touched: { ...a.touched, gentle: true } }))}
                colour={answers.colour}
                onColour={(colour) => set("colour", colour)}
              />
            )}
            {step === "signup" && signUp && !signUp.account && (
              <div inert={waiting} className={`max-w-md ${waiting ? "opacity-50" : ""}`}>
                <SignIn google={signUp.google} email={signUp.email} next="/create?resume=1" onSignedIn={signUp.onSignedIn} onGoogle={signUp.onGoogle} />
              </div>
            )}
            {step === "photos" && (
              <PhotoField
                screen={{ id: "quiz-photos", type: "photos", title: "", photos: answers.photos, captions: answers.captions }}
                onChange={(update) =>
                  setAnswers((a) => {
                    const next = update({ id: "quiz-photos", type: "photos", title: "", photos: a.photos, captions: a.captions });
                    return next.type === "photos" ? { ...a, photos: next.photos, captions: next.captions } : a;
                  })
                }
                onBusy={(change) => setUploading((n) => Math.max(0, n + change))}
              />
            )}
            {last && <Recap lines={recapLines({ answers, t, design, steps, go, onChangeDesign })} />}
          </div>

          <div className="mt-auto flex items-center gap-3 pt-10">
            <button type="button" onClick={() => (at > 0 ? setIndex(at - 1) : onBack())} className="min-h-12 rounded-full border-2 border-line px-5 py-3 font-semibold hover:border-foreground/40">
              ← {q.back}
            </button>
            <button
              disabled={!ready}
              // Waiting for photos is a message, so it's drawn readable rather than faded.
              className={`ms-auto min-h-12 rounded-full px-7 py-3.5 text-center font-brand text-lg font-semibold shadow-lg ${waiting ? "bg-panel text-foreground ring-2 ring-line" : "bg-brand text-on-brand disabled:opacity-40"}`}
            >
              {label}
            </button>
          </div>
          {last && (
            <p className="mt-3 text-end text-sm opacity-75">{design ? fmt(q.readyPrice, { price: price("card", currency) }) : fmt(q.price, { price: price("custom", currency) })}</p>
          )}
        </form>

        {at === 0 && onDescribe && (
          <div className="mt-10 border-t border-line pt-5 font-semibold">
            <button onClick={onDescribe} className="min-h-11 text-brand underline-offset-4 hover:underline">
              {q.describeLink}
            </button>
          </div>
        )}
      </section>

      {/* Beside the questions on a computer, so they can see the card take shape. */}
      {wide && (
        <aside className="py-12">
          <div className="sticky top-8">{design ? <DesignChip design={design} onChange={onChangeDesign} big /> : preview("w-full")}</div>
        </aside>
      )}
    </div>
  );
}

// The design their words go into, with a way to pick another.
function DesignChip({ design, onChange, big = false }: { design: Template; onChange?: () => void; big?: boolean }) {
  const q = useI18n().t.quiz;
  return (
    <div className={`mt-4 rounded-2xl border border-line bg-panel p-2 ${big ? "space-y-3 pb-4" : "flex items-center gap-3 pe-4"}`}>
      <div className={`${big ? "w-full" : "w-12"} shrink-0 overflow-hidden rounded-md`}>
        <ProductThumb template={design} />
      </div>
      <p className={`min-w-0 flex-1 font-semibold ${big ? "px-2" : "truncate text-sm"}`}>{fmt(q.yourDesign, { name: design.name })}</p>
      {onChange && (
        <button type="button" onClick={onChange} className={`min-h-11 font-semibold text-brand underline-offset-4 hover:underline ${big ? "px-2" : "text-sm"}`}>
          {q.changeDesign}
        </button>
      )}
    </div>
  );
}

// One line for each answer on the "Your card" check before it's made.
function recapLines({
  answers: a,
  t,
  design,
  steps,
  go,
  onChangeDesign,
}: {
  answers: Answers;
  t: ClientDict;
  design?: Template;
  steps: Step[];
  go: (step: Step) => void;
  onChangeDesign?: () => void;
}): RecapLine[] {
  const q = t.quiz;
  const r = q.recap;
  const feelings = [...a.vibes.filter(isFeeling).map((v) => q.feelings[v].label), a.vibeOther.trim()].filter(Boolean);
  const look = getLook(a.look);
  const picks = a.include.filter((k) => ALL_PICKS.includes(k));
  const words = (design ? a.say : a.about).trim();
  const lines: (RecapLine | false)[] = [
    { key: "names", emoji: "💌", text: fmt(r.names, { to: a.to.trim(), from: a.from.trim() }), onChange: () => go("names") },
    { key: "relation", emoji: "💞", text: a.relation.trim(), onChange: () => go("relation") },
    design
      ? Boolean(onChangeDesign) && { key: "design", emoji: "🖼️", text: fmt(q.yourDesign, { name: design.name }), onChange: () => onChangeDesign?.() }
      : {
          key: "occasion",
          emoji: a.occasion ? occasions[a.occasion].emoji : "📅",
          text: a.occasion ? t.occasions[a.occasion].label : a.occasionOther.trim(),
          onChange: () => go("occasion"),
        },
    {
      key: "vibe",
      emoji: a.vibes.length && isFeeling(a.vibes[0]) ? FEELING_EMOJI[a.vibes[0]] : "✨",
      text: feelings.join(", ") || r.weChoose,
      onChange: () => go("vibe"),
    },
    !design && {
      key: "look",
      emoji: "🎨",
      text: [look?.name ?? r.anyLook, a.music && (MUSIC as readonly string[]).includes(a.music) && `🎵 ${t.labels.music[a.music]}`].filter(Boolean).join(" · "),
      onChange: () => go("look"),
    },
    !design && {
      key: "inside",
      emoji: "🎮",
      text: [picks.length ? picks.map((k) => pickName(k, t)).join(", ") : r.anyScreens, a.length && q.lengths[a.length]?.label].filter(Boolean).join(" · "),
      onChange: () => go("inside"),
    },
    {
      key: "about",
      emoji: "✏️",
      text:
        [
          words && `“${words.length > 70 ? `${words.slice(0, 70).trimEnd()}…` : words}”`,
          a.age && `${AGE_EMOJI[a.age]} ${q.age[a.age]}`,
          !design && a.gentle && r.gentle,
          isColour(a.colour) && fmt(r.colour, { colour: q.colours[a.colour] }),
        ]
          .filter(Boolean)
          .join(" · ") || r.nothing,
      onChange: () => go("about"),
    },
    // Photos are on their own step, unless signing up comes after it.
    steps.at(-1) !== "photos" && {
      key: "photos",
      emoji: "📸",
      text: a.photos.length === 1 ? r.onePhoto : a.photos.length ? fmt(r.photos, { n: a.photos.length }) : r.noPhotos,
      onChange: () => go("photos"),
    },
  ];
  return lines.filter((line): line is RecapLine => Boolean(line));
}
