"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrowserFrame } from "@/components/BrowserFrame";
import { CardPlayer } from "@/components/card/CardPlayer";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Dict } from "@/i18n/en";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StickyMakeBar } from "@/components/StickyMakeBar";
import { THEMES, type Screen, type ThemeName } from "@/lib/card";
import { buildTemplateDemo, templatesBySlug, toneInfo } from "@/lib/catalog";
import { price } from "@/lib/pricing";
import { withTheme } from "@/lib/recolour";
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

function describe(s: Screen, t: Dict): string {
  const d = t.product.describe;
  switch (s.type) {
    case "intro":
      return d.intro;
    case "question":
      return fmt(d.question, { q: s.question });
    case "photos":
      return d.photos;
    case "message":
      return fmt(d.message, { title: s.title });
    case "game":
      return t.labels.games[s.game];
    case "quiz":
      return s.questions.length === 1 ? d.quizOne : fmt(d.quiz, { n: s.questions.length });
    case "scratch":
      return d.scratch;
    case "typeit":
      return d.typeit;
    case "wheel":
      return fmt(s.landOn >= 0 ? d.wheelRigged : d.wheel, { n: s.options.length });
    case "coupons":
      return s.coupons.length === 1 ? d.couponsOne : fmt(d.coupons, { n: s.coupons.length });
    case "reasons":
      return fmt(d.reasons, { n: s.reasons.length });
    case "slider":
      return fmt(d.slider, { title: s.title });
    case "timeline":
      return fmt(d.timeline, { n: s.events.length });
    case "boxes":
      return fmt(d.boxes, { n: s.prizes.length });
    case "finale":
      return fmt(d.finale, { effect: t.labels.effects[s.effect] });
  }
}

export function ProductView({ slug }: { slug: string }) {
  const template = templatesBySlug[slug];
  const { t, currency } = useI18n();
  const p = t.product;
  const [frame, setFrame] = useState<"phone" | "desktop">("desktop");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [theme, setTheme] = useState<ThemeName>(template.theme);
  // Another colour takes the design's own screen colours off, so the picked one shows.
  const card = useMemo(() => withTheme(buildTemplateDemo(template, { to: to.trim(), from: from.trim() }), theme), [template, to, from, theme]);
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
            {(["desktop", "phone"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={frame === f}
                onClick={() => setFrame(f)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${frame === f ? "bg-ink text-paper" : "text-ink/65 hover:text-ink"}`}
              >
                {f === "phone" ? p.onPhone : p.onComputer}
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
          <p className="font-hand text-2xl text-ink/60">{p.live}</p>
          {card.music && card.music !== "none" && (
            <p className="-mt-4 text-sm font-semibold text-ink/50">{fmt(p.soundOn, { tune: t.labels.music[card.music] })}</p>
          )}
          {/* Same tab: a new one loses older visitors, and the full-screen page has its own Back button. */}
          <Link href={`/cards/${slug}/play`} className="btn btn-paper px-5 py-2.5 text-base">
            {p.fullScreen}
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full border-2 border-ink/15 bg-paper px-3 py-1">
            {occasions[template.occasion].emoji} {t.occasions[template.occasion].label}
          </span>
          <span className="rounded-full border-2 border-ink/15 bg-paper px-3 py-1">
            {toneInfo[template.tone].emoji} {t.tones[template.tone]}
          </span>
          <span className="rounded-full border-2 border-ink bg-ink px-3 py-1 text-paper">✨ {t.devices.everywhere.label}</span>
        </div>
        <h1 dir="auto" className="mt-4 font-brand text-4xl font-bold leading-tight sm:text-5xl">{template.name}</h1>
        <p dir="auto" className="mt-3 text-lg text-ink/70">{template.blurb}</p>
        <p className="mt-4 font-brand text-3xl font-black text-hot">
          <bdi dir="ltr">{price("card", currency)}</bdi> <span className="text-base font-semibold text-ink/50">{p.perCard}</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-ink/60">🌍 {t.common.worldwide}</p>

        <div className="sheet mt-6 p-5">
          <p className="font-brand text-lg font-bold">{p.tryNames}</p>
          <p className="text-sm text-ink/60">{p.tryNamesHint}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NameInput label={p.theirName} value={to} onChange={setTo} placeholder={template.demo.to} />
            <NameInput label={p.yourName} value={from} onChange={setFrom} placeholder={template.demo.from} />
          </div>
          <p className="mt-4 text-sm font-semibold">{p.colours}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {THEMES.map((x) => (
              <button
                key={x}
                onClick={() => setTheme(x)}
                aria-label={t.themes[x]}
                title={t.themes[x]}
                aria-pressed={theme === x}
                className={`h-11 w-11 rounded-full ring-2 ring-offset-2 transition ${theme === x ? "ring-ink" : "ring-transparent hover:ring-ink/20"}`}
                style={{ background: themes[x].background }}
              />
            ))}
          </div>
          <Link id="product-cta" href={`/create?${params.toString()}`} className="btn btn-red mt-5 w-full py-3.5 text-lg">
            {p.customise}
          </Link>
          <p className="mt-2 text-center text-xs text-ink/50">{p.noSignup}</p>
        </div>

        <div className="mt-8">
          <h2 className="font-brand text-xl font-bold">{p.inside}</h2>
          <ol className="mt-3 space-y-2.5">
            {screens.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border-2 border-ink/15 bg-paper text-lg">{SCREEN_ICONS[s.type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">
                    {i + 1}. {t.labels.screens[s.type]}
                  </p>
                  <p className="text-sm text-ink/60">{describe(s, t)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8">
          <h2 className="font-brand text-xl font-bold">{p.canChange}</h2>
          <ul className="mt-3 space-y-2 text-ink/75">
            <li>✓ {p.changes.names}</li>
            <li>✓ {p.changes.words}</li>
            <li>✓ {hasPhotos ? p.changes.photos : p.changes.addPhotos}</li>
            {hasQuiz && <li>✓ {p.changes.quiz}</li>}
            <li>✓ {fmt(p.changes.colours, { n: THEMES.length })}</li>
            <li>✓ {p.changes.screens}</li>
          </ul>
          <div className="mt-6 rounded-xl border-2 border-dashed border-ink/25 p-4 text-sm">
            <p className="font-bold">✨ {t.devices.everywhere.label}</p>
            <p className="mt-1 text-ink/60">{t.devices.everywhere.detail}</p>
          </div>
        </div>
      </div>
      {/* On phones, a way on to making it stays in reach once "Customise" has scrolled away. */}
      <StickyMakeBar href={`/create?${params.toString()}`} label={fmt(p.stickyCta, { price: price("card", currency) })} watchId="product-cta" />
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
