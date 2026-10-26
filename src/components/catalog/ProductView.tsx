"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrowserFrame } from "@/components/BrowserFrame";
import { CardPlayer } from "@/components/card/CardPlayer";
import { EFFECT_LABELS, GAME_LABELS, SCREEN_LABELS } from "@/components/create/ScreenEditor";
import { PhoneFrame } from "@/components/PhoneFrame";
import { THEMES, type Screen, type ThemeName } from "@/lib/card";
import { buildTemplateDemo, deviceInfo, templatesBySlug, toneInfo } from "@/lib/catalog";
import { occasions } from "@/lib/templates";
import { themes } from "@/lib/themes";

const SCREEN_ICONS: Record<Screen["type"], string> = {
  intro: "✉️",
  question: "🙅",
  photos: "📸",
  message: "💌",
  game: "🎮",
  quiz: "❓",
  scratch: "🪙",
  typeit: "⌨️",
  finale: "🎆",
};

function describe(s: Screen): string {
  switch (s.type) {
    case "intro":
      return "An envelope they tap to unseal";
    case "question":
      return `"${s.question}" with a No button that runs away`;
    case "photos":
      return "Up to 6 of your photos with captions";
    case "message":
      return `"${s.title}", typed out like a handwritten note`;
    case "game":
      return GAME_LABELS[s.game];
    case "quiz":
      return `${s.questions.length} question${s.questions.length === 1 ? "" : "s"} about you two`;
    case "scratch":
      return "A silver panel they scratch to reveal your message";
    case "typeit":
      return "They have to type a secret password to unlock it";
    case "finale":
      return `${EFFECT_LABELS[s.effect]} and your final words`;
  }
}

export function ProductView({ slug }: { slug: string }) {
  const template = templatesBySlug[slug];
  const [frame, setFrame] = useState<"phone" | "desktop">(template.device === "desktop" ? "desktop" : "phone");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [theme, setTheme] = useState<ThemeName>(template.theme);
  const card = useMemo(() => ({ ...buildTemplateDemo(template, { to: to.trim(), from: from.trim() }), theme }), [template, to, from, theme]);
  const screens = useMemo(() => template.screens("them", "you"), [template]);
  const hasPhotos = screens.some((s) => s.type === "photos");
  const hasQuiz = screens.some((s) => s.type === "quiz");

  const params = new URLSearchParams({ template: slug });
  if (to.trim()) params.set("to", to.trim());
  if (from.trim()) params.set("from", from.trim());
  if (theme !== template.theme) params.set("theme", theme);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* Live preview */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-5 shadow-sm ring-1 ring-ink/5 sm:p-8">
        <div aria-hidden className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-hot/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-grape/15 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6">
          <div role="tablist" className="flex gap-1 rounded-full bg-cream p-1.5 ring-1 ring-ink/5">
            {(["phone", "desktop"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={frame === f}
                onClick={() => setFrame(f)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${frame === f ? "bg-ink text-white shadow" : "text-ink/60 hover:text-ink"}`}
              >
                {f === "phone" ? "📱 On a phone" : "💻 On a computer"}
              </button>
            ))}
          </div>
          {frame === "phone" ? (
            <PhoneFrame>
              <CardPlayer key="phone" card={card} preview />
            </PhoneFrame>
          ) : (
            <BrowserFrame className="h-[520px]">
              <CardPlayer key="desktop" card={card} preview />
            </BrowserFrame>
          )}
          <p className="font-hand text-2xl text-ink/60">it&apos;s live, tap through it ↑</p>
          <a href={`/cards/${slug}/play`} target="_blank" rel="noreferrer" className="text-sm font-bold text-hot underline underline-offset-4">
            Open full screen ↗
          </a>
        </div>
      </div>

      {/* Details */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/10">
            {occasions[template.occasion].emoji} {occasions[template.occasion].label}
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/10">
            {toneInfo[template.tone].emoji} {toneInfo[template.tone].label}
          </span>
          <span className="rounded-full bg-ink px-3 py-1.5 text-white">
            {deviceInfo[template.device].emoji} {deviceInfo[template.device].label}
          </span>
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">{template.name}</h1>
        <p className="mt-3 text-lg text-ink/70">{template.blurb}</p>
        <p className="mt-4 font-display text-2xl font-bold">
          Free <span className="text-base font-semibold text-ink/50">while we launch</span>
        </p>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/5">
          <p className="font-display text-lg font-bold">Try it with your names</p>
          <p className="text-sm text-ink/60">Watch the preview update as you type.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NameInput label="Their name" value={to} onChange={setTo} placeholder={template.demo.to} />
            <NameInput label="Your name" value={from} onChange={setFrom} placeholder={template.demo.from} />
          </div>
          <p className="mt-4 text-sm font-semibold">Colours</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                aria-label={themes[t].label}
                title={themes[t].label}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${theme === t ? "ring-ink" : "ring-transparent hover:ring-ink/20"}`}
                style={{ background: themes[t].background }}
              />
            ))}
          </div>
          <Link
            href={`/create?${params.toString()}`}
            className="mt-5 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-hot to-tangerine py-4 font-display text-lg font-semibold text-white shadow-[0_14px_34px_-10px_rgba(255,46,126,0.8)] transition hover:-translate-y-0.5"
          >
            Customise this card →
          </Link>
          <p className="mt-2 text-center text-xs text-ink/50">No sign-up. Takes about two minutes.</p>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-xl font-bold">What&apos;s inside</h2>
          <ol className="mt-3 space-y-2.5">
            {screens.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-lg ring-1 ring-ink/5">{SCREEN_ICONS[s.type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {i + 1}. {SCREEN_LABELS[s.type]}
                  </p>
                  <p className="text-sm text-ink/60">{describe(s)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-xl font-bold">What you can customise</h2>
          <ul className="mt-3 space-y-2 text-ink/75">
            <li>✓ Their name and yours</li>
            <li>✓ Every word on every screen</li>
            <li>✓ {hasPhotos ? "Up to 6 of your own photos, with captions" : "Add a photo screen with up to 6 of your photos"}</li>
            {hasQuiz && <li>✓ Your own quiz questions and answers</li>}
            <li>✓ Colours ({THEMES.length} themes) and the background effect</li>
            <li>✓ Add, remove or reorder screens: games, quizzes, scratch cards and more</li>
          </ul>
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm ring-1 ring-ink/5">
            <p className="font-bold">
              {deviceInfo[template.device].emoji} {deviceInfo[template.device].label}
            </p>
            <p className="mt-1 text-ink/60">{deviceInfo[template.device].detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NameInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink/60">{label}</span>
      <input
        value={value}
        maxLength={40}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl bg-cream px-3 py-2.5 font-semibold outline-none ring-1 ring-ink/10 placeholder:text-ink/30 focus:ring-2 focus:ring-hot"
      />
    </label>
  );
}
