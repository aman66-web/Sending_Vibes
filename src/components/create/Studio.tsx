"use client";

import { useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardData, Font, Screen, ScreenStyle } from "@/lib/card";
import { FONT_VARS } from "@/lib/screen-style";
import { uploadPhoto } from "./image";
import { useFreshTap } from "./one-tap";
import { copyScreen } from "./screen-kit";
import { ScreenEditor } from "./ScreenEditor";
import { ScreenPreview } from "./ScreenPreview";
import { ScreensTab } from "./ScreensTab";
import { useWide } from "./use-wide";
import { AllWords, type Path } from "./WordEditing";

// The card designer's panel, like a presentation app's: change the words, add text, add
// screens (ready-made layouts), add photos and stickers, or ask for a change. Everything is
// added to the screen being looked at, then tapped on the card to change it.

export type Tab = "words" | "text" | "upload" | "screens" | "elements" | "ai";

type Change = (update: (card: CardData) => CardData) => void;

type Props = {
  card: CardData;
  // The screen being looked at.
  screenIndex: number;
  tab: Tab;
  setTab: (tab: Tab) => void;
  // Changes the card (remembering it for Undo).
  change: Change;
  // Changes one screen, found by its id, and one piece of words, without remembering them:
  // the Words tab remembers once per box, so Undo takes back a whole box, not a letter.
  editScreen: (id: string, update: (screen: Screen) => Screen) => void;
  editWords: (path: Path, value: string) => void;
  remember: () => void;
  // A ready-made design keeps its games and finale; only their words change.
  keepDesign: boolean;
  // Shows something just added: selects a sticker, text or photo, or goes to a new screen.
  onAdded: (added: { key: string } | { screenId: string }) => void;
  // The typing box, for the Ask for a change tab.
  ai: React.ReactNode;
};

// Words first: changing the words is what most people come to do.
export const STUDIO_TABS: { key: Tab; icon: string }[] = [
  { key: "words", icon: "✏️" },
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

export function StudioPanel({ card, screenIndex, tab, setTab, change, editScreen, editWords, remember, keepDesign, onAdded, ai }: Props) {
  const { t } = useI18n();
  const s = t.studio;
  const screen = card.screens[screenIndex];
  const files = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fresh = useFreshTap();
  // In the Words tab, each box is one step for Undo: remembered at its first change, and
  // again once another box (or button) is used.
  const begun = useRef(false);
  const newStep = () => {
    begun.current = false;
  };
  const step = () => {
    if (begun.current) return;
    begun.current = true;
    remember();
  };
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
  const heading = "text-sm font-bold opacity-75";
  const screenName = screen ? (screen.type === "game" ? t.labels.games[screen.game] : t.labels.screens[screen.type]) : "";
  // Words added on top of the screen (the Add text tab), changed here too, or taken out.
  const texts = screen?.style?.texts ?? [];
  const setAdded = (id: string, i: number, text: string | null) =>
    editScreen(id, (sc) => {
      const list = sc.style?.texts;
      if (!list?.[i]) return sc;
      return { ...sc, style: { ...sc.style, texts: text === null ? list.filter((_, j) => j !== i) : list.map((box, j) => (j === i ? { ...box, text } : box)) } };
    });
  // What a box said when they went into it: a box can't be saved empty, so one left empty
  // goes back to that (✕ takes it out).
  const before = useRef("");

  return (
    <section className="space-y-4">
      {/* Two rows of three big buttons on a phone, so every name fits and is easy to hit. */}
      <div role="tablist" aria-label={s.howTitle} className="grid grid-cols-3 gap-2">
        {STUDIO_TABS.map(({ key, icon }) => (
          <button
            key={key}
            id={`studio-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            aria-controls="studio-panel"
            // The second tap of a double-tap on something just above (a screen being put in
            // place, say) mustn't switch the tab under the finger.
            onClick={(e) => {
              if (e.detail > 1) return;
              setTab(key);
              setNote(null);
            }}
            className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 py-2 text-center text-base font-bold leading-tight transition ${tab === key ? "border-foreground bg-foreground text-background" : "border-line bg-panel hover:border-foreground/50"}`}
          >
            <span aria-hidden className="text-xl leading-none">
              {icon}
            </span>
            {s.tabs[key]}
          </button>
        ))}
      </div>
      <div id="studio-panel" role="tabpanel" aria-labelledby={`studio-tab-${tab}`} className="space-y-4">
        {screen && tab !== "ai" && tab !== "words" && (
          <p className="text-base font-semibold opacity-75">{fmt(s.onScreen, { n: screenIndex + 1, name: screenName })}</p>
        )}
        {note && (
          <p role="status" className="text-base font-semibold text-red-700 dark:text-red-300">
            {note}
          </p>
        )}

        {tab === "words" && screen && (
          // Every word on the screen showing, as a labelled form; the card changes as they type.
          <div className="space-y-4" onFocusCapture={newStep} onBlurCapture={newStep}>
            <div>
              <h2 className="font-brand text-xl font-bold">{fmt(s.wordsOn, { n: screenIndex + 1, name: screenName })}</h2>
              <p className="mt-1 text-base opacity-75">{s.wordsHint}</p>
            </div>
            <ScreenEditor
              key={screen.id}
              screen={screen}
              keepDesign={keepDesign}
              onChange={(update) => {
                step();
                editScreen(screen.id, update);
              }}
              // A photo landing is a step of its own, apart from a box being typed in meanwhile.
              onUploaded={(update) => {
                remember();
                begun.current = false;
                editScreen(screen.id, update);
              }}
            />
            {texts.length > 0 && (
              <div className="space-y-3 border-t-2 border-line pt-4">
                <p className="text-base font-bold">{s.addedTexts}</p>
                {texts.map((box, i) => (
                  <div key={i}>
                    <label htmlFor={`added-${i}`} className="text-base font-bold">
                      {fmt(s.addedText, { n: i + 1 })}
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        id={`added-${i}`}
                        value={box.text}
                        maxLength={120}
                        dir="auto"
                        onFocus={() => {
                          before.current = box.text;
                        }}
                        onChange={(e) => {
                          step();
                          setAdded(screen.id, i, e.target.value);
                        }}
                        onBlur={() => !box.text.trim() && setAdded(screen.id, i, before.current.trim() || s.smallText)}
                        className="min-w-0 flex-1 rounded-xl border-2 border-line bg-panel px-3 py-3 text-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                        style={{ fontFamily: box.font ? `var(${FONT_VARS[box.font]})` : undefined }}
                      />
                      <button
                        type="button"
                        aria-label={`${s.delete}: ${fmt(s.addedText, { n: i + 1 })}`}
                        onClick={(e) => {
                          if (!fresh(e)) return;
                          remember();
                          setAdded(screen.id, i, null);
                        }}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg opacity-75 transition hover:bg-brand-soft hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <AllWords
              card={card}
              screenId={screen.id}
              builtIn
              onChange={(path, value) => {
                step();
                editWords(path, value);
              }}
            />
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-3">
            <button type="button" onClick={(e) => fresh(e) && addText(s.headingText, { size: 9 })} className={`${big} font-brand text-2xl`}>
              {s.addHeading}
            </button>
            <button type="button" onClick={(e) => fresh(e) && addText(s.subheadingText, { size: 6 })} className={`${big} text-xl`}>
              {s.addSubheading}
            </button>
            <button type="button" onClick={(e) => fresh(e) && addText(s.smallText, { size: 4, font: "modern" })} className={`${big} text-base`}>
              {s.addText}
            </button>
            <p className={heading}>{s.fancyTitle}</p>
            <div className="grid grid-cols-2 gap-2">
              {s.fancy.map((words, i) => (
                <button
                  key={words}
                  type="button"
                  onClick={(e) => fresh(e) && addText(words, FANCY[i])}
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
            <p className="text-base leading-relaxed opacity-75">{s.photosHint}</p>
            <button type="button" disabled={busy} onClick={() => files.current?.click()} className={`${big} text-center text-lg disabled:opacity-60`}>
              {busy ? t.editor.uploading : `⬆ ${s.addPhotos}`}
            </button>
            <input ref={files} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            <p className={heading}>{s.photosTitle}</p>
            {gallery.length ? (
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((src) => (
                  <button key={src} type="button" aria-label={s.putOnCard} onClick={(e) => fresh(e) && placePhoto(src)} className="aspect-square overflow-hidden rounded-xl border-2 border-line transition hover:-translate-y-0.5 hover:border-brand">
                    {/* eslint-disable-next-line @next/next/no-img-element -- their own photos, already resized on upload */}
                    <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-base opacity-75">{s.noUploads}</p>
            )}
          </div>
        )}

        {tab === "elements" && (
          <div className="space-y-4">
            <p className={heading}>{s.iconsTitle}</p>
            {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((group) => (
              <div key={group}>
                <p className="mb-1 text-base font-semibold">{s.iconGroups[group]}</p>
                <div className="grid grid-cols-6 gap-1">
                  {ICONS[group].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={emoji}
                      onClick={(e) => fresh(e) && add("stickers", { emoji, x: spot.x, y: spot.y, size: 14, motion: "none" }, 10)}
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
      </div>
    </section>
  );
}

// The card's screens in a row, like a presentation's slides: tap one to work on it;
// the one you're on can be copied, moved or deleted. On a phone those are behind More,
// so the row under the card stays short.
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
  const wide = useWide();
  const [more, setMore] = useState(false);
  const fresh = useFreshTap();
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
  const action = "flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 border-line bg-panel px-4 py-2 text-center text-base font-semibold leading-tight transition hover:border-foreground/50 disabled:opacity-40";
  const current = card.screens[screenIndex];
  const actions = current && (
    <>
      <button
        type="button"
        className={action}
        disabled={card.screens.length >= MAX_SCREENS}
        onClick={(e) => {
          if (!fresh(e)) return;
          const copy = copyScreen(current);
          change((c) => ({ ...c, screens: [...c.screens.slice(0, screenIndex + 1), copy, ...c.screens.slice(screenIndex + 1)] }));
          onGo(copy.id);
        }}
      >
        ⧉ {s.copyScreen}
      </button>
      <button type="button" className={action} aria-label={s.moveLeft} disabled={screenIndex === 0} onClick={(e) => fresh(e) && move(screenIndex, screenIndex - 1)}>
        ← {s.moveLeft}
      </button>
      <button type="button" className={action} aria-label={s.moveRight} disabled={screenIndex === card.screens.length - 1} onClick={(e) => fresh(e) && move(screenIndex, screenIndex + 1)}>
        {s.moveRight} →
      </button>
      <button
        type="button"
        className={`${action} text-red-700 dark:text-red-300`}
        disabled={card.screens.length <= 1}
        onClick={(e) => {
          if (!fresh(e)) return;
          const next = card.screens[screenIndex + 1] ?? card.screens[screenIndex - 1];
          change((c) => ({ ...c, screens: c.screens.filter((_, i) => i !== screenIndex) }));
          if (next) onGo(next.id);
        }}
      >
        🗑 {s.deleteScreen}
      </button>
    </>
  );
  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-2" aria-label={s.screens}>
        {/* Each screen as it looks, numbered in order. */}
        {card.screens.map((screen, i) => (
          <button
            key={screen.id}
            type="button"
            onClick={() => onGo(screen.id)}
            aria-current={i === screenIndex}
            aria-label={`${i + 1}. ${t.labels.screens[screen.type]}`}
            className={`relative w-16 shrink-0 rounded-lg shadow-sm transition ${i === screenIndex ? "ring-[3px] ring-brand ring-offset-2" : "ring-1 ring-black/15 hover:-translate-y-0.5"}`}
          >
            <ScreenPreview card={card} screen={screen} className="w-full rounded-lg border-0" />
            <span aria-hidden className="absolute bottom-1 start-1 rounded-full bg-black/75 px-2 text-xs font-bold leading-5 text-white">
              {i + 1}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="grid aspect-[3/4] w-16 shrink-0 place-items-center rounded-lg border-2 border-dashed border-foreground/50 text-center text-xs font-bold leading-tight"
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
          {wide ? (
            actions
          ) : (
            <button type="button" className={action} aria-expanded={more} aria-controls="screen-actions" onClick={(e) => fresh(e) && setMore((m) => !m)}>
              {more ? `✕ ${s.closeActions}` : `⋯ ${s.moreActions}`}
            </button>
          )}
        </div>
      )}
      {current && !wide && more && (
        <div id="screen-actions" className="grid grid-cols-2 gap-2 rounded-2xl border-2 border-line bg-panel p-2">
          {actions}
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
