"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrowserFrame } from "@/components/BrowserFrame";
import { CardPlayer } from "@/components/card/CardPlayer";
import { MUSIC_LABELS } from "@/components/card/sound";
import { EFFECT_LABELS, GAME_LABELS, SCREEN_LABELS } from "@/components/create/ScreenEditor";
import { PhoneFrame } from "@/components/PhoneFrame";
import { THEMES, type Screen, type ThemeName } from "@/lib/card";
import { buildTemplateDemo, deviceInfo, templatesBySlug, toneInfo } from "@/lib/catalog";
import { PRICES } from "@/lib/pricing";
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
  wheel: "🎡",
  coupons: "🎟️",
  reasons: "🫙",
  slider: "📈",
  timeline: "🗓️",
  boxes: "🎁",
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
    case "wheel":
      return `A prize wheel with ${s.options.length} slices${s.landOn >= 0 ? " (secretly rigged)" : ""}`;
    case "coupons":
      return `${s.coupons.length} coupon${s.coupons.length === 1 ? "" : "s"} they tap to redeem`;
    case "reasons":
      return `A jar of ${s.reasons.length} notes they pull out one by one`;
    case "slider":
      return `"${s.title}" on a slider that only goes up`;
    case "timeline":
      return `${s.events.length} moments from your story, one at a time`;
    case "boxes":
      return `${s.prizes.length} mystery boxes to choose from`;
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
      <div className="sheet relative overflow-hidden p-5 sm:p-8">
        <div className="relative flex flex-col items-center gap-6">
          <div role="tablist" className="flex gap-1 rounded-full border-2 border-ink bg-cream p-1">
            {(["phone", "desktop"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={frame === f}
                onClick={() => setFrame(f)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${frame === f ? "bg-ink text-paper" : "text-ink/65 hover:text-ink"}`}
              >
                {f === "phone" ? "📱 On a phone" : "💻 On a computer"}
              </button>
            ))}
          </div>
          {frame === "phone" ? (
            <PhoneFrame>
              <CardPlayer key="phone" card={card} preview sound />
            </PhoneFrame>
          ) : (
            <BrowserFrame className="h-[520px]">
              <CardPlayer key="desktop" card={card} preview sound />
            </BrowserFrame>
          )}
          <p className="font-hand text-2xl text-ink/60">it&apos;s live, tap through it ↑</p>
          {card.music && card.music !== "none" && (
            <p className="-mt-4 text-sm font-semibold text-ink/50">🔊 Sound on: it plays {MUSIC_LABELS[card.music]} when you open it</p>
          )}
          <a href={`/cards/${slug}/play`} target="_blank" rel="noreferrer" className="text-sm font-bold underline decoration-hot decoration-2 underline-offset-4">
            Open full screen ↗
          </a>
        </div>
      </div>

      {/* Details */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full border-2 border-ink/15 bg-paper px-3 py-1">
            {occasions[template.occasion].emoji} {occasions[template.occasion].label}
          </span>
          <span className="rounded-full border-2 border-ink/15 bg-paper px-3 py-1">
            {toneInfo[template.tone].emoji} {toneInfo[template.tone].label}
          </span>
          <span className="rounded-full border-2 border-ink bg-ink px-3 py-1 text-paper">
            {deviceInfo[template.device].emoji} {deviceInfo[template.device].label}
          </span>
        </div>
        <h1 className="mt-4 font-brand text-4xl font-bold leading-tight sm:text-5xl">{template.name}</h1>
        <p className="mt-3 text-lg text-ink/70">{template.blurb}</p>
        <p className="mt-4 font-brand text-3xl font-black text-hot">
          {PRICES.card.label} <span className="text-base font-semibold text-ink/50">per card</span>
        </p>

        <div className="sheet mt-6 p-5">
          <p className="font-brand text-lg font-bold">Try it with your names</p>
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
            className="btn btn-red mt-5 w-full py-3.5 text-lg"
          >
            Customise this card →
          </Link>
          <p className="mt-2 text-center text-xs text-ink/50">No sign-up. Takes about two minutes.</p>
        </div>

        <div className="mt-8">
          <h2 className="font-brand text-xl font-bold">What&apos;s inside</h2>
          <ol className="mt-3 space-y-2.5">
            {screens.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink/15 bg-paper text-lg">{SCREEN_ICONS[s.type]}</span>
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
          <h2 className="font-brand text-xl font-bold">What you can change</h2>
          <ul className="mt-3 space-y-2 text-ink/75">
            <li>✓ Their name and yours</li>
            <li>✓ Every word on every screen</li>
            <li>✓ {hasPhotos ? "Up to 6 of your own photos, with captions" : "Add a photo screen with up to 6 of your photos"}</li>
            {hasQuiz && <li>✓ Your own quiz questions and answers</li>}
            <li>✓ Colours ({THEMES.length} themes) and the background effect</li>
            <li>✓ Add, remove or reorder screens: games, quizzes, scratch cards and more</li>
          </ul>
          <div className="mt-6 rounded-xl border-2 border-dashed border-ink/25 p-4 text-sm">
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
        className="mt-1 w-full border-b-2 border-dashed border-ink/30 bg-transparent px-1 py-1 font-hand text-2xl leading-none outline-none placeholder:text-ink/25 focus:border-solid focus:border-hot"
      />
    </label>
  );
}
