"use client";

import { useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardData, Font, ScreenStyle } from "@/lib/card";
import { FONT_VARS, screenLook } from "@/lib/screen-style";
import { themes } from "@/lib/themes";
import { uploadPhoto } from "./image";
import { copyScreen, screenEmoji } from "./screen-kit";
import { ScreensTab } from "./ScreensTab";

// The card designer's panel, like a presentation app's: add text, add screens (ready-made
// layouts), add elements (photos and icons), or ask the AI. Everything is added to the
// screen being looked at, then tapped on the card to change it.

export type Tab = "text" | "upload" | "screens" | "elements" | "ai";

type Change = (update: (card: CardData) => CardData) => void;

type Props = {
  card: CardData;
  // The screen being looked at.
  screenIndex: number;
  tab: Tab;
  setTab: (tab: Tab) => void;
  // Changes the card (remembering it for Undo).
  change: Change;
  // Shows something just added: selects a sticker, text or photo, or goes to a new screen.
  onAdded: (added: { key: string } | { screenId: string }) => void;
  // The typing box, for the Ask AI tab.
  ai: React.ReactNode;
};

export const STUDIO_TABS: { key: Tab; icon: string }[] = [
  { key: "text", icon: "T" },
  { key: "upload", icon: "⬆" },
  { key: "screens", icon: "▤" },
  { key: "elements", icon: "★" },
  { key: "ai", icon: "✨" },
];

const MAX_SCREENS = 12;

const ICONS: Record<"love" | "party" | "nature" | "animals" | "food" | "fun", string[]> = {
  love: ["❤️", "💕", "💖", "💘", "💝", "💐", "🌹", "💋", "😍", "🥰", "💌", "💞"],
  party: ["🎉", "🎈", "🎂", "🎁", "🥳", "🎊", "🍰", "🕯️", "🪅", "🎆", "🍾", "🥂"],
  nature: ["🌸", "🌼", "🌻", "🌷", "🍀", "🌈", "⭐", "🌙", "☀️", "❄️", "🌊", "🍁"],
  animals: ["🐶", "🐱", "🦄", "🐻", "🐰", "🦋", "🐝", "🐼", "🦊", "🐧", "🐢", "🦁"],
  food: ["🍕", "🍦", "🍩", "🍓", "🍫", "🍪", "🧁", "🍜", "🍔", "☕", "🍉", "🍿"],
  fun: ["😂", "😎", "🤩", "👑", "💎", "🚀", "⚽", "🎮", "🎵", "✨", "🔥", "💯"],
};

// Ready-styled text, in the order of the words in studio.fancy.
const FANCY: { font: Font; color?: string; size: number }[] = [
  { font: "script", color: "#d4af37", size: 9 },
  { font: "handwritten", color: "#e23d3d", size: 8 },
  { font: "bold", color: "#c026d3", size: 10 },
  { font: "script", size: 7 },
  { font: "bold", color: "#f97316", size: 9 },
  { font: "storybook", color: "#2563eb", size: 7 },
];

// Adds to one of a screen's lists (its stickers, text boxes or photos) and says where it went.
function addTo<K extends "stickers" | "texts" | "images">(card: CardData, index: number, key: K, item: NonNullable<ScreenStyle[K]>[number], max: number) {
  const screen = card.screens[index];
  const list = [...((screen.style?.[key] as unknown[]) ?? [])];
  if (list.length >= max) return null;
  list.push(item);
  const screens = card.screens.map((s, i) => (i === index ? { ...s, style: { ...s.style, [key]: list } } : s));
  return { card: { ...card, screens }, at: list.length - 1 };
}

export function StudioPanel({ card, screenIndex, tab, setTab, change, onAdded, ai }: Props) {
  const { t } = useI18n();
  const s = t.studio;
  const screen = card.screens[screenIndex];
  const files = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Somewhere new each time, so things added one after another don't land on top of each other.
  const count = (screen?.style?.texts?.length ?? 0) + (screen?.style?.stickers?.length ?? 0) + (screen?.style?.images?.length ?? 0);
  const spot = { x: 50 + ((count * 13) % 30) - 15, y: 25 + ((count * 17) % 50) };

  const add = <K extends "stickers" | "texts" | "images">(key: K, item: NonNullable<ScreenStyle[K]>[number], max: number) => {
    const done = addTo(card, screenIndex, key, item, max);
    if (!done) return setNote(s.full);
    change(() => done.card);
    onAdded({ key: `${key === "stickers" ? "sticker" : key === "texts" ? "text" : "image"}:${done.at}` });
  };
  const addText = (text: string, look: { font?: Font; color?: string; size: number }) => add("texts", { text, x: 50, y: spot.y, ...look }, 8);
  // Photos they've uploaded, kept in this browser, plus any already on the card.
  const [uploads, setUploads] = useState<string[]>(readUploads);
  const onCard = card.screens.flatMap((sc) => [...(sc.type === "photos" ? sc.photos : []), ...(sc.style?.images ?? []).map((img) => img.src)]);
  const gallery = [...new Set([...uploads, ...onCard])];
  const upload = async (chosen: FileList | null) => {
    const list = Array.from(chosen ?? []).slice(0, 12);
    if (files.current) files.current.value = "";
    if (!list.length) return;
    setBusy(true);
    setNote(null);
    for (const file of list) {
      try {
        const src = await uploadPhoto(file);
        setUploads((u) => {
          const next = [src, ...u.filter((x) => x !== src)].slice(0, 40);
          saveUploads(next);
          return next;
        });
      } catch {
        setNote(t.editor.uploadFailed);
      }
    }
    setBusy(false);
  };
  // Puts one of their photos on the screen they're on, ready to move, turn and resize.
  const placePhoto = (src: string) => add("images", { src, x: spot.x, y: 45, size: 45, rotate: [-4, 3, -2, 5][count % 4], frame: "polaroid" }, 6);

  const big = "w-full rounded-2xl border-2 border-line bg-panel px-4 py-3 text-start font-semibold transition hover:-translate-y-0.5 hover:border-brand";
  const heading = "text-xs font-bold uppercase tracking-wide opacity-60";

  return (
    <section className="space-y-4">
      <div role="tablist" aria-label={s.howTitle} className="grid grid-cols-5 gap-1.5">
        {STUDIO_TABS.map(({ key, icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setNote(null);
            }}
            className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-2.5 text-sm font-bold transition ${tab === key ? "border-foreground bg-foreground text-background" : "border-line bg-panel hover:border-foreground/50"}`}
          >
            <span aria-hidden className="text-xl leading-none">
              {icon}
            </span>
            {s.tabs[key]}
          </button>
        ))}
      </div>
      {screen && tab !== "ai" && (
        <p className="text-sm font-semibold opacity-70">{fmt(s.onScreen, { n: screenIndex + 1, name: t.labels.screens[screen.type] })}</p>
      )}
      {note && (
        <p role="status" className="text-sm font-semibold text-red-600">
          {note}
        </p>
      )}

      {tab === "text" && (
        <div className="space-y-3">
          <button type="button" onClick={() => addText(s.headingText, { size: 9 })} className={`${big} font-brand text-2xl`}>
            {s.addHeading}
          </button>
          <button type="button" onClick={() => addText(s.subheadingText, { size: 6 })} className={`${big} text-lg`}>
            {s.addSubheading}
          </button>
          <button type="button" onClick={() => addText(s.smallText, { size: 4, font: "modern" })} className={`${big} text-sm`}>
            {s.addText}
          </button>
          <p className={heading}>{s.fancyTitle}</p>
          <div className="grid grid-cols-2 gap-2">
            {s.fancy.map((words, i) => (
              <button
                key={words}
                type="button"
                onClick={() => addText(words, FANCY[i])}
                className="rounded-2xl border-2 border-line bg-panel px-2 py-3 text-xl transition hover:border-brand"
                style={{ fontFamily: `var(${FONT_VARS[FANCY[i].font]})`, color: FANCY[i].color }}
              >
                {words}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "screens" && (
        <ScreensTab
          card={card}
          screenIndex={screenIndex}
          full={card.screens.length >= MAX_SCREENS}
          onFull={() => setNote(fmt(s.tooManyScreens, { n: MAX_SCREENS }))}
          onAdd={(made, at) => {
            change((c) => ({ ...c, screens: [...c.screens.slice(0, at), made, ...c.screens.slice(at)] }));
            onAdded({ screenId: made.id });
          }}
        />
      )}

      {tab === "upload" && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed opacity-70">{s.photosHint}</p>
          <button type="button" disabled={busy} onClick={() => files.current?.click()} className={`${big} text-center text-lg disabled:opacity-60`}>
            {busy ? t.editor.uploading : `⬆ ${s.addPhotos}`}
          </button>
          <input ref={files} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <p className={heading}>{s.photosTitle}</p>
          {gallery.length ? (
            <div className="grid grid-cols-3 gap-2">
              {gallery.map((src) => (
                <button key={src} type="button" aria-label={s.putOnCard} onClick={() => placePhoto(src)} className="aspect-square overflow-hidden rounded-xl border-2 border-line transition hover:-translate-y-0.5 hover:border-brand">
                  {/* eslint-disable-next-line @next/next/no-img-element -- their own photos, already resized on upload */}
                  <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-60">{s.noUploads}</p>
          )}
        </div>
      )}

      {tab === "elements" && (
        <div className="space-y-4">
          <p className={heading}>{s.iconsTitle}</p>
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((group) => (
            <div key={group}>
              <p className="mb-1 text-sm font-semibold">{s.iconGroups[group]}</p>
              <div className="grid grid-cols-6 gap-1">
                {ICONS[group].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={emoji}
                    onClick={() => add("stickers", { emoji, x: spot.x, y: spot.y, size: 14, motion: "none" }, 10)}
                    className="grid aspect-square place-items-center rounded-xl text-3xl transition hover:bg-brand-soft"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "ai" && ai}
    </section>
  );
}

// The card's screens in a row, like a presentation's slides: tap one to work on it;
// the one you're on can be duplicated, moved or deleted.
export function ScreenStrip({
  card,
  screenIndex,
  onGo,
  change,
  onAdd,
  onSettings,
}: {
  card: CardData;
  screenIndex: number;
  onGo: (id: string) => void;
  change: Change;
  onAdd: () => void;
  // Opens this screen's own settings: its background, how it comes in, how its game plays.
  onSettings: () => void;
}) {
  const { t } = useI18n();
  const s = t.studio;
  // The card stays on the screen that moved, at its new place.
  const move = (from: number, to: number) => {
    const id = card.screens[from].id;
    change((c) => {
      const screens = [...c.screens];
      const [moved] = screens.splice(from, 1);
      screens.splice(to, 0, moved);
      return { ...c, screens };
    });
    onGo(id);
  };
  const action = "flex items-center gap-1 rounded-full border-2 border-line bg-panel px-3 py-1.5 text-sm font-semibold transition hover:border-foreground/50 disabled:opacity-40";
  const current = card.screens[screenIndex];
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-2" aria-label={s.screens}>
        {card.screens.map((screen, i) => {
          const look = screenLook(themes[card.theme], screen.style).theme;
          return (
            <button
              key={screen.id}
              type="button"
              onClick={() => onGo(screen.id)}
              aria-current={i === screenIndex}
              aria-label={`${i + 1}. ${t.labels.screens[screen.type]}`}
              className={`relative grid h-20 w-14 shrink-0 place-items-center rounded-lg text-2xl shadow-sm transition ${i === screenIndex ? "ring-[3px] ring-brand ring-offset-2" : "ring-1 ring-black/15 hover:-translate-y-0.5"}`}
              style={{ background: look.background }}
            >
              <span aria-hidden>{screenEmoji(screen)}</span>
              <span className="absolute bottom-0.5 start-1 text-[10px] font-bold" style={{ color: look.text }}>
                {i + 1}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onAdd}
          className="grid h-20 w-14 shrink-0 place-items-center rounded-lg border-2 border-dashed border-foreground/40 text-center text-[11px] font-bold leading-tight opacity-80 hover:opacity-100"
        >
          <span>
            <span aria-hidden className="block text-2xl">
              +
            </span>
            {s.addScreen}
          </span>
        </button>
      </div>
      {current && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={action} onClick={onSettings}>
            ⚙ {s.screenSettings}
          </button>
          <button
            type="button"
            className={action}
            disabled={card.screens.length >= MAX_SCREENS}
            onClick={() => {
              const copy = copyScreen(current);
              change((c) => ({ ...c, screens: [...c.screens.slice(0, screenIndex + 1), copy, ...c.screens.slice(screenIndex + 1)] }));
              onGo(copy.id);
            }}
          >
            ⧉ {s.duplicate}
          </button>
          <button type="button" className={action} aria-label={s.moveLeft} disabled={screenIndex === 0} onClick={() => move(screenIndex, screenIndex - 1)}>
            ← {s.moveLeft}
          </button>
          <button type="button" className={action} aria-label={s.moveRight} disabled={screenIndex === card.screens.length - 1} onClick={() => move(screenIndex, screenIndex + 1)}>
            {s.moveRight} →
          </button>
          <button
            type="button"
            className={`${action} text-red-600`}
            disabled={card.screens.length <= 1}
            onClick={() => {
              const next = card.screens[screenIndex + 1] ?? card.screens[screenIndex - 1];
              change((c) => ({ ...c, screens: c.screens.filter((_, i) => i !== screenIndex) }));
              if (next) onGo(next.id);
            }}
          >
            🗑 {s.deleteScreen}
          </button>
        </div>
      )}
    </div>
  );
}

// Their uploaded photos, remembered in this browser between visits.
const UPLOADS_KEY = "sv-uploads-v1";
function readUploads(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(UPLOADS_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveUploads(list: string[]) {
  try {
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(list));
  } catch {}
}
