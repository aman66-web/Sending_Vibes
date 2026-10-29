"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { DIRECTIONS, FONTS, FRAMES, TRANSITIONS, type CardData, type Crop, type Font, type Screen, type ScreenStyle, type Tune } from "@/lib/card";
import { CATCHING, USUAL_GOAL } from "@/components/card/tune";
import { FONT_VARS } from "@/lib/screen-style";
import { LISTS, TEXTS, isList, labelList, labelsOn, type LabelKey, type ListKey } from "@/lib/labels";
import { uploadPhoto } from "./image";
import { useWide } from "./use-wide";

// Click the words on the live preview to change them, like editing a design.
// While editing, a see-through layer sits over the card so its games and buttons
// don't react. Each click finds the text under the pointer and matches it to the
// card field it came from, so this works for every kind of screen without each one
// having to know about editing.

export type Path = (string | number)[];
type Field = { path: Path; value: string };

// Words built into a screen (see lib/labels.ts) live at screens[i].labels[key].
const labelOf = (path: Path): LabelKey | null => (path[0] === "screens" && path[2] === "labels" ? (path[3] as LabelKey) : null);

const SKIP = new Set(["id", "type", "game", "effect", "photos", "style"]);

// Every piece of text on one screen, plus the two names, with where each lives in the card.
function textFields(card: CardData, screenId?: string, withEmpty = false): Field[] {
  const out: Field[] = [
    { path: ["to"], value: card.to },
    { path: ["from"], value: card.from },
  ];
  const i = card.screens.findIndex((s) => s.id === screenId);
  if (i < 0) return out;
  const walk = (value: unknown, path: Path) => {
    if (typeof value === "string") {
      if (value.trim() || withEmpty) out.push({ path, value });
    } else if (Array.isArray(value)) {
      value.forEach((item, j) => walk(item, [...path, j]));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) if (!SKIP.has(k)) walk(v, [...path, k]);
    }
  };
  const screen = card.screens[i];
  walk(screen, ["screens", i]);
  // Then the words built into the screen, after its own so those win a tie.
  for (const key of labelsOn(screen)) {
    if (isList(key)) labelList(screen.labels, key).forEach((line, j) => out.push({ path: ["screens", i, "labels", key, j], value: line }));
    else out.push({ path: ["screens", i, "labels", key], value: labelValue(screen.labels?.[key], TEXTS[key]) });
  }
  return out;
}

const labelValue = (own: unknown, usual: string) => (typeof own === "string" && own.trim() ? own : usual);

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

// The field whose text is on the element under the pointer (or the nearest parent
// that has some). An exact match wins; a message still typing itself out matches the
// start of its text; text with a quote mark or emoji around it still counts.
function findField(target: Element | null, root: HTMLElement, fields: Field[]): { field: Field; el: Element } | null {
  for (let el = target; el && el !== root; el = el.parentElement) {
    // Only where words are written (or a button's label), not something that merely holds
    // them like the envelope, which has its own colour to change.
    if (!readable(el)) continue;
    // Words drawn on a canvas, or a box's placeholder, are given as data-text.
    const text = norm(el.getAttribute("data-text") ?? el.textContent ?? "");
    if (!text || text.length > 1600) continue;
    let best: { field: Field; score: number; length: number } | null = null;
    for (const field of fields) {
      const value = norm(field.value);
      if (!value) continue;
      const score =
        value === text || numbered(value)?.test(text)
          ? 3
          : text.length >= 4 && value.startsWith(text)
            ? 2
            : value.length >= 3 && text.includes(value) && text.length <= value.length + 6
              ? 1
              : 0;
      if (score && (!best || score > best.score || (score === best.score && value.length > best.length))) best = { field, score, length: value.length };
    }
    if (best) return { field: best.field, el };
  }
  return null;
}

const readable = (el: Element) =>
  !el.hasAttribute("data-envelope") &&
  (el.hasAttribute("data-text") || el.matches("button, figcaption, text") || [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()));

// A label with numbers in it ("{i} of {n}") matches the words as shown ("2 of 5").
function numbered(value: string) {
  if (!/\{\w+\}/.test(value)) return null;
  const pattern = value
    .split(/\{\w+\}/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\d+");
  return new RegExp(`^${pattern}$`);
}

export function getAt(card: CardData, path: Path): string {
  let value: unknown = card;
  for (const key of path) value = (value as Record<string | number, unknown>)?.[key];
  if (typeof value === "string") return value;
  // Words a screen hasn't changed are its usual ones.
  const label = labelOf(path);
  if (!label) return "";
  return isList(label) ? (LISTS[label][Number(path[4])] ?? "") : TEXTS[label];
}

function put<T>(obj: T, path: Path, value: unknown): T {
  const [key, ...rest] = path;
  const copy = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string | number, unknown>;
  copy[key] = rest.length ? put(copy[key], rest, value) : value;
  return copy as T;
}

export function setAt(card: CardData, path: Path, value: string): CardData {
  const label = labelOf(path);
  // Changing one of a list's lines starts from the usual lines.
  if (label && isList(label) && !Array.isArray(card.screens[Number(path[1])]?.labels?.[label])) card = put(card, path.slice(0, 4), [...LISTS[label]]);
  return put(card, path, value);
}

// The most each field can hold, so an edit never makes the card fail to save.
const LIMITS: Record<string, number> = {
  to: 40, from: 40, title: 120, subtitle: 200, button: 40, question: 140, yes: 30, no: 30, afterYes: 140, instructions: 200, winText: 140,
  hidden: 200, phrase: 40, low: 30, high: 30, when: 40, what: 160, captions: 120, coupons: 80, reasons: 160, prizes: 80,
};

function limitFor(card: CardData, path: Path) {
  if (labelOf(path)) return typeof path.at(-1) === "number" ? 80 : 160;
  const key = typeof path.at(-1) === "number" ? String(path.at(-2)) : String(path.at(-1));
  const type = path[0] === "screens" ? card.screens[Number(path[1])]?.type : undefined;
  if (key === "body") return type === "finale" ? 600 : 1500;
  if (key === "options") return type === "wheel" ? 40 : 60;
  if (key === "title" && type === "finale") return 140;
  return LIMITS[key] ?? 200;
}

type Box = { left: number; top: number; width: number; height: number };
type Deco = "sticker" | "text" | "image";
type Hit =
  | { kind: "words"; field: Field; el: Element }
  | { kind: "photo"; index: number | "new"; el: Element }
  | { kind: "deco"; deco: Deco; index: number; el: Element }
  | { kind: "envelope"; el: Element }
  | { kind: "background"; el: Element };
// What's selected, and where it is on the preview (for drawing around it and placing its controls).
// Where the preview is: its size, how far down the window it starts, and the window's height.
type Area = { width: number; height: number; top: number; view: number };
type Selected = { box: Box; area: Area } & (
  | { kind: "words"; path: Path; heading: boolean; button: boolean }
  | { kind: "photo"; index: number }
  | { kind: "deco"; deco: Deco; index: number }
  | { kind: "envelope" }
  | { kind: "background" }
);
type Gesture = {
  mode: "move" | "resize" | "rotate";
  deco: Deco;
  index: number;
  x: number;
  y: number;
  // Where the item was, its size and turn, and the card's own box, when the gesture began.
  start: { x: number; y: number; size: number; rotate: number };
  card: DOMRect;
  box: Box;
  centre?: { x: number; y: number };
  moved: boolean;
};

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

// The most photos a photos screen holds (see lib/card.ts).
const MAX_PHOTOS = 6;
// How far a finger can wander and still count as a tap, not a swipe.
const TAP_SLOP = 10;

// Colours to pick from, and two-colour blends for backgrounds.
const PALETTE = ["#1f1b16", "#ffffff", "#f6efe0", "#e23d3d", "#ff6fae", "#c026d3", "#8b5cf6", "#2563eb", "#38bdf8", "#16a34a", "#facc15", "#f97316", "#d4af37", "#14213d"];
const BLENDS = [
  ["#ff9a9e", "#fecfef"],
  ["#a18cd1", "#fbc2eb"],
  ["#84fab0", "#8fd3f4"],
  ["#fccb90", "#d57eeb"],
  ["#f6d365", "#fda085"],
  ["#0f2027", "#2c5364"],
];
const SWAPS = ["❤️", "💖", "⭐", "✨", "🎈", "🎉", "🌸", "🌈", "🦋", "🐶", "🍰", "👑"];
const SIZE: Record<Deco, [number, number]> = { sticker: [4, 40], text: [2, 20], image: [10, 90] };
// The most of each a screen holds (see lib/card.ts).
const MOST: Record<Deco, number> = { sticker: 10, text: 8, image: 6 };
// An angle between -180 and 180 degrees, whole, and exactly straight when within 4 degrees of it.
const straight = (deg: number) => {
  const d = Math.round((((deg % 360) + 540) % 360) - 180);
  const nearest = Math.round(d / 90) * 90;
  return Math.abs(d - nearest) <= 4 ? (nearest === -180 ? 180 : nearest) : d;
};

type Props = {
  card: CardData;
  screenId?: string;
  enabled: boolean;
  onChange: (path: Path, value: string) => void;
  // Anything else on a screen: its look, its stickers, text and photos, a photos screen's photos.
  onScreen: (index: number, update: (screen: Screen) => Screen) => void;
  // About to change something, so Undo can bring it back.
  onBegin?: () => void;
  // Selects something just added from the panel, like "text:2".
  pick?: { key: string; nonce: number };
  // Changing this opens the screen's own settings, as if its background were tapped.
  openSettings?: number;
  className?: string;
  children: React.ReactNode;
};

export function EditableCard({ card, screenId, enabled, onChange, onScreen, onBegin, pick, openSettings = 0, className = "", children }: Props) {
  const { t } = useI18n();
  const x = t.custom;
  const s = t.studio;
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [open, setOpen] = useState<Selected | null>(null);
  const gesture = useRef<Gesture | null>(null);
  // Where a touch or click on the card began, so lifting it picks something only if it was a tap.
  const tap = useRef<{ id: number; x: number; y: number } | null>(null);
  // Each selection is one step for Undo, however many changes are made while it's open.
  const begun = useRef(false);
  // Which photo the chosen file replaces (a photos screen's, or a placed one), or null to add them.
  const [replacing, setReplacing] = useState<{ deco: boolean; index: number } | null>(null);
  const [uploading, setUploading] = useState(0);
  // A sticker, text box or photo copied to paste on any screen, and a word to say it's been copied.
  const [clip, setClip] = useState<{ deco: Deco; item: Record<string, unknown> } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const screenIndex = card.screens.findIndex((sc) => sc.id === screenId);
  const screen = card.screens[screenIndex];
  const style = screen?.style ?? {};
  // On a phone the controls come up from the bottom of the screen, so the card stays in view above them.
  const sheet = !useWide();

  const begin = () => {
    if (begun.current) return;
    begun.current = true;
    onBegin?.();
  };
  // The preview's size, for placing the controls; measured when something is selected.
  const areaNow = (): Area => ({
    width: root.current?.offsetWidth ?? 600,
    height: root.current?.offsetHeight ?? 600,
    top: root.current?.getBoundingClientRect().top ?? 0,
    view: window.innerHeight,
  });
  const select = (next: DistributiveOmit<Selected, "area"> | null) => {
    begun.current = false;
    setOpen(next && ({ ...next, area: areaNow() } as Selected));
  };
  // Something tapped or just added. On a phone, scroll so it sits above the controls.
  const choose = (next: DistributiveOmit<Selected, "area">) => {
    select(next);
    const el = root.current;
    if (!sheet || !el || next.kind === "background") return;
    const top = el.getBoundingClientRect().top + next.box.top;
    const middle = top + next.box.height / 2;
    if (top < 8 || middle > window.innerHeight * 0.4) window.scrollBy({ top: middle - window.innerHeight * 0.25, behavior: "smooth" });
  };
  const edit = (path: Path, value: string) => {
    begin();
    onChange(path, value);
  };
  const restyle = (update: (st: ScreenStyle) => ScreenStyle) => {
    begin();
    onScreen(screenIndex, (sc) => ({ ...sc, style: update(sc.style ?? {}) }));
  };
  // How the screen plays (style.tune); a setting back at its usual value is dropped.
  const tune = style.tune ?? {};
  const retune = (change: Partial<Tune>) =>
    restyle((st) => {
      const next = Object.fromEntries(Object.entries({ ...st.tune, ...change }).filter(([, v]) => v !== undefined));
      return { ...st, tune: Object.keys(next).length ? next : undefined };
    });
  const usualGoal = screen?.type === "game" ? (USUAL_GOAL as Partial<Record<string, number>>)[screen.game] : undefined;
  const goal = usualGoal === undefined ? undefined : (tune.goal ?? usualGoal);
  const listOf = (deco: Deco) => (deco === "sticker" ? "stickers" : deco === "text" ? "texts" : "images") as "stickers" | "texts" | "images";
  const changeItem = (deco: Deco, index: number, update: (item: Record<string, unknown>) => Record<string, unknown> | null) =>
    restyle((st) => {
      const key = listOf(deco);
      const list = [...((st[key] as Record<string, unknown>[] | undefined) ?? [])];
      const next = list[index] ? update(list[index]) : null;
      if (next) list[index] = next;
      else list.splice(index, 1);
      return { ...st, [key]: list };
    });

  // What's under the pointer, looking through the editing layer: the topmost thing that
  // can be changed (a sticker, text box or photo, some words, the envelope), or else the
  // screen's background.
  const under = (clientX: number, clientY: number): Hit | null => {
    const el = root.current;
    if (!el) return null;
    const below = document.elementsFromPoint(clientX, clientY).filter((e) => e !== layer.current && el.contains(e) && !e.closest("[data-edit-ui]"));
    const fields = textFields(card, screenId);
    for (const e of below) {
      const deco = e.closest("[data-deco]");
      if (deco) {
        const [kind, index] = deco.getAttribute("data-deco")!.split(":");
        return { kind: "deco", deco: kind as Deco, index: Number(index), el: deco };
      }
      const photo = e.closest("[data-photo]");
      if (photo) {
        const index = photo.getAttribute("data-photo");
        return { kind: "photo", index: index === "new" ? "new" : Number(index), el: photo };
      }
      const found = findField(e, el, fields);
      if (found) return { kind: "words", ...found };
      const envelope = e.closest("[data-envelope]");
      if (envelope) return { kind: "envelope", el: envelope };
    }
    const cardEl = below.find((e) => e.closest(".font-card"))?.closest(".font-card");
    return cardEl ? { kind: "background", el: cardEl } : null;
  };
  const boxOf = (target: Element): Box => {
    const outer = root.current!.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    return { left: r.left - outer.left, top: r.top - outer.top, width: r.width, height: r.height };
  };
  const decoEl = (deco: Deco, index: number) => root.current?.querySelector(`[data-deco="${deco}:${index}"]`);
  // After a change that moves or resizes it, draw around it where it is now.
  const remeasure = (deco: Deco, index: number) =>
    requestAnimationFrame(() => {
      const el = decoEl(deco, index);
      if (el) setOpen((o) => (o?.kind === "deco" && o.deco === deco && o.index === index ? { ...o, box: boxOf(el) } : o));
    });

  // Copy, paste and duplicate. A pasted one lands a little down and to the right, and is selected.
  const itemAt = (deco: Deco, index: number) => (style[listOf(deco)] as Record<string, unknown>[] | undefined)?.[index];
  const say = (words: string) => {
    setFlash(words);
    setTimeout(() => setFlash((f) => (f === words ? null : f)), 2200);
  };
  const copy = (deco: Deco, index: number) => {
    const item = itemAt(deco, index);
    if (!item) return;
    setClip({ deco, item: structuredClone(item) });
    say(s.copied);
  };
  const putDown = (deco: Deco, item: Record<string, unknown>) => {
    const at = (style[listOf(deco)] as unknown[] | undefined)?.length ?? 0;
    if (at >= MOST[deco]) return say(s.full);
    const nudge = (v: unknown) => Math.min(95, Number(v ?? 50) + 6);
    begun.current = false;
    onBegin?.();
    onScreen(screenIndex, (sc) => {
      const st = sc.style ?? {};
      const key = listOf(deco);
      return { ...sc, style: { ...st, [key]: [...((st[key] as unknown[] | undefined) ?? []), { ...structuredClone(item), x: nudge(item.x), y: nudge(item.y) }] } };
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = decoEl(deco, at);
        if (el) choose({ kind: "deco", deco, index: at, box: boxOf(el) });
      }),
    );
  };
  const paste = () => clip && putDown(clip.deco, clip.item);
  const duplicate = (deco: Deco, index: number) => {
    const item = itemAt(deco, index);
    if (item) putDown(deco, item);
  };

  const selectHit = (hit: Hit | null) => {
    if (!hit) return select(null);
    if (hit.kind === "photo") {
      if (hit.index === "new") {
        select(null);
        return pickPhotos(null);
      }
      return choose({ kind: "photo", index: hit.index, box: boxOf(hit.el) });
    }
    if (hit.kind === "words")
      return choose({
        kind: "words",
        path: hit.field.path,
        box: boxOf(hit.el),
        heading: Boolean(hit.el.closest(".font-display")),
        button: Boolean(hit.el.closest("[data-primary], [data-yes], [data-spin]")),
      });
    if (hit.kind === "deco") return choose({ kind: "deco", deco: hit.deco, index: hit.index, box: boxOf(hit.el) });
    choose({ kind: hit.kind, box: boxOf(hit.el) });
  };

  // The screen's settings asked for from outside (the ⚙ button under the card).
  useEffect(() => {
    if (!openSettings) return;
    const frame = requestAnimationFrame(() => {
      const el = root.current?.querySelector(".font-card");
      if (el) choose({ kind: "background", box: boxOf(el) });
    });
    return () => cancelAnimationFrame(frame);
    // Only when asked again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSettings]);

  // Something just added from the panel: select it once it's on the card.
  const [picked, setPicked] = useState(pick?.nonce);
  if (pick && pick.nonce !== picked) setPicked(pick.nonce);
  useEffect(() => {
    if (!pick) return;
    const deco = pick.key.split(":")[0] as Deco;
    const index = Number(pick.key.split(":")[1]);
    const frame = requestAnimationFrame(() => {
      const el = decoEl(deco, index);
      if (el) choose({ kind: "deco", deco, index, box: boxOf(el) });
    });
    // And again once it has finished popping in, at its full size.
    const later = setTimeout(() => remeasure(deco, index), 700);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
    };
    // Only when something new is picked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  // Delete removes the selected sticker, text or photo and Escape lets go of it; Ctrl (⌘ on
  // a Mac) with C copies it, V pastes and D duplicates.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) return;
      const command = e.metaKey || e.ctrlKey;
      if (command && e.key.toLowerCase() === "v" && clip) {
        e.preventDefault();
        return paste();
      }
      if (open?.kind !== "deco") return;
      if (command && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copy(open.deco, open.index);
      } else if (command && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate(open.deco, open.index);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        changeItem(open.deco, open.index, () => null);
        select(null);
      } else if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Dragging a sticker, text box or photo moves it; dragging the corner handle resizes it.
  const startGesture = (mode: Gesture["mode"], deco: Deco, index: number, e: React.PointerEvent, el: Element) => {
    const item = (style[listOf(deco)] as { x: number; y: number; size: number; rotate?: number }[] | undefined)?.[index];
    const cardBox = el.closest("[data-deco-layer]")?.getBoundingClientRect();
    if (!item || !cardBox) return false;
    const r = el.getBoundingClientRect();
    gesture.current = {
      mode,
      deco,
      index,
      x: e.clientX,
      y: e.clientY,
      start: { x: item.x, y: item.y, size: item.size, rotate: item.rotate ?? 0 },
      card: cardBox,
      box: boxOf(el),
      centre: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      moved: false,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    return true;
  };
  const moveGesture = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return false;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.moved && Math.hypot(dx, dy) < 4) return true;
    if (!g.moved) {
      g.moved = true;
      setHover(null);
      // Selected while it moves, so its box follows it.
      select({ kind: "deco", deco: g.deco, index: g.index, box: g.box });
      begin();
    }
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    if (g.mode === "move") {
      const nx = clamp(g.start.x + (dx / g.card.width) * 100, 0, 100);
      const ny = clamp(g.start.y + (dy / g.card.height) * 100, 0, 100);
      onScreen(screenIndex, (sc) => {
        const st = sc.style ?? {};
        const key = listOf(g.deco);
        const list = [...((st[key] as { x: number; y: number }[] | undefined) ?? [])];
        if (list[g.index]) list[g.index] = { ...list[g.index], x: Math.round(nx * 10) / 10, y: Math.round(ny * 10) / 10 };
        return { ...sc, style: { ...st, [key]: list } };
      });
      setOpen((o) => o && { kind: "deco", deco: g.deco, index: g.index, area: o.area, box: { ...g.box, left: g.box.left + dx, top: g.box.top + dy } });
    } else if (g.mode === "rotate") {
      // Turned by the angle the pointer has swept round its middle, settling on straight when close.
      const c = g.centre!;
      const swept = ((Math.atan2(e.clientY - c.y, e.clientX - c.x) - Math.atan2(g.y - c.y, g.x - c.x)) * 180) / Math.PI;
      const turned = straight(g.start.rotate + swept);
      changeItem(g.deco, g.index, (it) => ({ ...it, rotate: turned }));
      remeasure(g.deco, g.index);
    } else {
      const c = g.centre!;
      const factor = Math.hypot(e.clientX - c.x, e.clientY - c.y) / Math.max(Math.hypot(g.x - c.x, g.y - c.y), 1);
      const [min, max] = SIZE[g.deco];
      const size = clamp(Math.round(g.start.size * factor * 10) / 10, min, max);
      const scale = size / g.start.size;
      onScreen(screenIndex, (sc) => {
        const st = sc.style ?? {};
        const key = listOf(g.deco);
        const list = [...((st[key] as { size: number }[] | undefined) ?? [])];
        if (list[g.index]) list[g.index] = { ...list[g.index], size };
        return { ...sc, style: { ...st, [key]: list } };
      });
      const width = g.box.width * scale;
      const height = g.box.height * scale;
      setOpen((o) => o && { kind: "deco", deco: g.deco, index: g.index, area: o.area, box: { left: g.box.left + (g.box.width - width) / 2, top: g.box.top + (g.box.height - height) / 2, width, height } });
    }
    return true;
  };
  const endGesture = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return false;
    if (g.moved) remeasure(g.deco, g.index);
    else {
      const el = decoEl(g.deco, g.index);
      if (el) choose({ kind: "deco", deco: g.deco, index: g.index, box: boxOf(el) });
    }
    return true;
  };
  // The browser took the touch over (to scroll the page, say): stop, keeping any move made so far.
  const cancelGesture = () => {
    const g = gesture.current;
    gesture.current = null;
    tap.current = null;
    if (g?.moved) remeasure(g.deco, g.index);
  };

  const pickPhotos = (replace: { deco: boolean; index: number } | null) => {
    setReplacing(replace);
    setPhotoError(null);
    files.current?.click();
  };

  const addPhotos = async (list: FileList | null) => {
    // Copied first: clearing the input (so the same photo can be picked again) empties its list.
    const chosen = Array.from(list ?? []);
    if (!chosen.length || !screen) return;
    const index = screenIndex;
    const replace = replacing;
    if (files.current) files.current.value = "";
    // Replacing a photo placed on the screen.
    if (replace?.deco) {
      setUploading((n) => n + 1);
      try {
        const url = await uploadPhoto(chosen[0]);
        begin();
        onScreen(index, (sc) => ({ ...sc, style: { ...sc.style, images: (sc.style?.images ?? []).map((img, j) => (j === replace.index ? { ...img, src: url, crop: undefined } : img)) } }));
      } catch {
        setPhotoError(t.editor.uploadFailed);
      } finally {
        setUploading((n) => n - 1);
      }
      return;
    }
    if (screen.type !== "photos") return;
    const room = replace ? 1 : MAX_PHOTOS - screen.photos.length;
    const picked = chosen.slice(0, Math.max(room, 0));
    if (!replace && chosen.length > room) setPhotoError(fmt(t.editor.tooManyPhotos, { n: MAX_PHOTOS }));
    select(null);
    for (const file of picked) {
      setUploading((n) => n + 1);
      try {
        const url = await uploadPhoto(file);
        onBegin?.();
        onScreen(index, (sc) => {
          if (sc.type !== "photos") return sc;
          // A new photo starts whole in its frame.
          if (replace && replace.index < sc.photos.length) return { ...sc, photos: sc.photos.map((p, j) => (j === replace.index ? url : p)), crops: sc.crops?.map((c, j) => (j === replace.index ? null : c)) };
          if (sc.photos.length >= MAX_PHOTOS) return sc;
          return { ...sc, photos: [...sc.photos, url], captions: [...sc.photos.map((_, j) => sc.captions[j] ?? ""), ""] };
        });
      } catch {
        setPhotoError(t.editor.uploadFailed);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const removePhoto = (i: number) => {
    onBegin?.();
    onScreen(screenIndex, (sc) =>
      sc.type === "photos" ? { ...sc, photos: sc.photos.filter((_, j) => j !== i), captions: sc.captions.filter((_, j) => j !== i), crops: sc.crops?.filter((_, j) => j !== i) } : sc,
    );
    select(null);
  };

  const words = open?.kind === "words" ? open.path : null;
  const value = words ? getAt(card, words) : "";
  const long = value.length > 50 || value.includes("\n");
  // One line of a list (the No button's excuses, say): show them all, in the order they're said.
  const list = words && labelOf(words) && typeof words.at(-1) === "number" ? words : null;
  const lines = list ? labelList(card.screens[Number(list[1])]?.labels, list[3] as ListKey) : [];
  const area = open?.area ?? { width: 600, height: 600, top: 0, view: 900 };
  // The controls go under what's selected or above it, wherever they fit in the window
  // without covering it (they may hang over the edge of the preview); else beside it.
  // On a computer the controls sit just left of the card, over the design panel, so they never
  // cover what's being changed: level with it, and kept inside the window.
  const place = (box: Box, tall: number) => ({
    left: -316,
    top: Math.max(12 - area.top, Math.min(box.top - 12, area.view - area.top - tall - 12)),
  });
  const item = open?.kind === "deco" ? (style[listOf(open.deco)] as Record<string, unknown>[] | undefined)?.[open.index] : undefined;
  // The controls for what's selected: beside it on a computer, a sheet at the bottom on a phone.
  const controls = (at: { left: number; top: number }, body: React.ReactNode) =>
    sheet ? (
      createPortal(
        <div
          data-edit-ui
          data-word-editor
          className="fixed inset-x-0 bottom-0 z-[60] max-h-[55dvh] overflow-y-auto rounded-t-3xl border-t-2 border-line bg-panel p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
        >
          <div className="mx-auto max-w-lg space-y-3">{body}</div>
        </div>,
        document.body,
      )
    ) : (
      <div data-edit-ui data-word-editor className="absolute z-50 max-h-[calc(100dvh-24px)] w-[300px] space-y-3 overflow-y-auto rounded-2xl border border-line bg-panel p-3 text-foreground shadow-2xl" style={at}>
        {body}
      </div>
    );
  const label = "text-xs font-bold uppercase tracking-wide opacity-60";
  // The turning handle sits above what's selected, or below it when that's at the very top.
  const turnBelow = open !== null && open.box.top < 44;
  const close = () => select(null);

  return (
    <div ref={root} className={`relative ${className}`}>
      {children}
      <input ref={files} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
      {enabled && (
        // A finger swiping across the card scrolls the page; only a tap picks what's under it.
        // By touch, something is dragged once it's selected (the box over it, below); a mouse
        // can drag a sticker, text box or photo straight away.
        <div
          ref={layer}
          className="absolute inset-0 z-[45] cursor-pointer touch-manipulation"
          onPointerDown={(e) => {
            tap.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
            gesture.current = null;
            if (e.pointerType === "touch") return;
            const hit = under(e.clientX, e.clientY);
            if (hit?.kind === "deco") startGesture("move", hit.deco, hit.index, e, hit.el);
          }}
          onPointerMove={(e) => {
            if (moveGesture(e) || e.pointerType === "touch") return;
            const hit = under(e.clientX, e.clientY);
            setHover(hit && hit.kind !== "background" ? boxOf(hit.el) : null);
          }}
          onPointerUp={(e) => {
            const down = tap.current;
            tap.current = null;
            if (endGesture()) return;
            if (!down || down.id !== e.pointerId || Math.hypot(e.clientX - down.x, e.clientY - down.y) > TAP_SLOP) return;
            selectHit(under(e.clientX, e.clientY));
          }}
          onPointerCancel={cancelGesture}
          onPointerLeave={() => setHover(null)}
          onWheel={(e) => {
            // Let long screens still scroll underneath.
            let el = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n !== layer.current) as HTMLElement | undefined;
            while (el && el !== root.current && el.scrollHeight <= el.clientHeight) el = el.parentElement ?? undefined;
            if (el && el !== root.current) el.scrollTop += e.deltaY;
          }}
        />
      )}
      {enabled && hover && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-[46] rounded-md ring-2 ring-brand/60 ring-offset-2 ring-offset-transparent"
          style={{ left: hover.left - 4, top: hover.top - 3, width: hover.width + 8, height: hover.height + 6 }}
        />
      )}
      {/* What's selected: a box around it, and for stickers, text and photos a handle to resize. */}
      {enabled && open && open.kind !== "background" && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-[47] rounded-md ring-2 ring-brand ring-offset-2 ring-offset-transparent"
          style={{ left: open.box.left - 4, top: open.box.top - 3, width: open.box.width + 8, height: open.box.height + 6 }}
        />
      )}
      {/* A selected sticker, text box or photo can be dragged by touch, not just with a mouse. */}
      {enabled && open?.kind === "deco" && (
        <div
          data-edit-ui
          aria-hidden
          className="absolute z-[47] cursor-move touch-none"
          style={{ left: open.box.left, top: open.box.top, width: open.box.width, height: open.box.height }}
          onPointerDown={(e) => {
            const el = decoEl(open.deco, open.index);
            if (el) startGesture("move", open.deco, open.index, e, el);
          }}
          onPointerMove={(e) => moveGesture(e)}
          onPointerUp={() => endGesture()}
          onPointerCancel={cancelGesture}
        />
      )}
      {enabled && open?.kind === "deco" && (
        <span
          data-edit-ui
          role="slider"
          aria-label={s.bigger}
          aria-valuenow={Number(item?.size ?? 0)}
          className="absolute z-[48] h-6 w-6 cursor-nwse-resize touch-none rounded-full border-[3px] border-white bg-brand shadow-lg"
          style={{ left: open.box.left + open.box.width - 8, top: open.box.top + open.box.height - 8 }}
          onPointerDown={(e) => {
            e.stopPropagation();
            const el = decoEl(open.deco, open.index);
            if (el) startGesture("resize", open.deco, open.index, e, el);
          }}
          onPointerMove={(e) => moveGesture(e)}
          onPointerUp={() => endGesture()}
          onPointerCancel={cancelGesture}
        />
      )}
      {/* A round handle above it (below it, at the very top) to turn it, like a design app. */}
      {enabled && open?.kind === "deco" && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-[47] w-0.5 bg-brand"
          style={{ left: open.box.left + open.box.width / 2 - 1, top: turnBelow ? open.box.top + open.box.height + 3 : open.box.top - 12, height: 9 }}
        />
      )}
      {enabled && open?.kind === "deco" && (
        <span
          data-edit-ui
          role="slider"
          aria-label={s.turn}
          aria-valuenow={Number(item?.rotate ?? 0)}
          className="absolute z-[48] grid h-8 w-8 cursor-grab touch-none place-items-center rounded-full border-2 border-brand bg-white text-lg font-bold text-brand shadow-lg active:cursor-grabbing"
          style={{ left: open.box.left + open.box.width / 2 - 16, top: turnBelow ? open.box.top + open.box.height + 12 : open.box.top - 44 }}
          onPointerDown={(e) => {
            e.stopPropagation();
            const el = decoEl(open.deco, open.index);
            if (el) startGesture("rotate", open.deco, open.index, e, el);
          }}
          onPointerMove={(e) => moveGesture(e)}
          onPointerUp={() => endGesture()}
          onPointerCancel={cancelGesture}
        >
          ↻
        </span>
      )}
      {enabled && clip && (
        <button
          type="button"
          data-edit-ui
          onClick={paste}
          className="absolute bottom-3 start-3 z-[49] rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background shadow-lg"
        >
          📋 {s.paste}
        </button>
      )}
      {flash && uploading === 0 && !photoError && (
        <p role="status" className="pointer-events-none absolute inset-x-0 top-3 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-black/80 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
          {flash}
        </p>
      )}
      {(uploading > 0 || photoError) && (
        <p role="status" className="absolute inset-x-0 top-3 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-black/80 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
          {uploading > 0 ? t.editor.uploading : photoError}
        </p>
      )}

      {enabled &&
        open?.kind === "deco" &&
        item &&
        controls(
          place(open.box, open.deco === "text" ? 520 : open.deco === "image" ? 560 : 380),
          <>
          <p className={label}>{open.deco === "text" ? s.text : open.deco === "image" ? s.photo : s.element}</p>
          <p className="text-xs opacity-60">{s.dragHint}</p>
          {open.deco === "text" && (
            <>
              <textarea
                autoFocus={!sheet}
                rows={2}
                dir="auto"
                value={String(item.text ?? "")}
                maxLength={120}
                aria-label={s.words}
                onChange={(e) => {
                  changeItem("text", open.index, (it) => ({ ...it, text: e.target.value }));
                  remeasure("text", open.index);
                }}
                className="w-full resize-none rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <FontRow
                value={item.font as Font | undefined}
                onPick={(font) => {
                  changeItem("text", open.index, (it) => ({ ...it, font }));
                  remeasure("text", open.index);
                }}
              />
              <Swatches title={s.colour} value={item.color as string | undefined} onPick={(color) => changeItem("text", open.index, (it) => ({ ...it, color }))} />
            </>
          )}
          {open.deco === "sticker" && (
            <div>
              <p className={label}>{s.swap}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {SWAPS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => changeItem("sticker", open.index, (it) => ({ ...it, emoji }))} className="grid h-9 w-9 place-items-center rounded-lg text-xl hover:bg-brand-soft">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          {open.deco === "image" && (
            <div className="space-y-2">
              <button type="button" onClick={() => pickPhotos({ deco: true, index: open.index })} className="w-full rounded-full border-2 border-line px-4 py-2 text-sm font-semibold">
                {s.replace}
              </button>
              <div>
                <p className={label}>{s.frame}</p>
                <div className="mt-1 flex gap-1.5">
                  {FRAMES.map((frame) => (
                    <button
                      key={frame}
                      type="button"
                      aria-pressed={(item.frame ?? "polaroid") === frame}
                      onClick={() => {
                        changeItem("image", open.index, (it) => ({ ...it, frame }));
                        remeasure("image", open.index);
                      }}
                      className={`flex-1 rounded-full border-2 px-2 py-1.5 text-sm font-semibold ${(item.frame ?? "polaroid") === frame ? "border-brand bg-brand-soft" : "border-line"}`}
                    >
                      {s.frames[frame]}
                    </button>
                  ))}
                </div>
              </div>
              <CropControls crop={item.crop as Crop | undefined} onCrop={(crop) => changeItem("image", open.index, (it) => ({ ...it, crop }))} />
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => duplicate(open.deco, open.index)} className="flex-1 rounded-full border-2 border-line px-3 py-1.5 text-sm font-semibold">
              ⧉ {s.duplicate}
            </button>
            <button type="button" onClick={() => copy(open.deco, open.index)} className="flex-1 rounded-full border-2 border-line px-3 py-1.5 text-sm font-semibold">
              📋 {s.copy}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <p className={`${label} me-1`}>{s.turnTitle}</p>
            {([
              [-15, "↺", s.turnLeft],
              [15, "↻", s.turnRight],
            ] as const).map(([by, icon, name]) => (
              <button
                key={by}
                type="button"
                aria-label={name}
                onClick={() => {
                  changeItem(open.deco, open.index, (it) => ({ ...it, rotate: straight(Number(it.rotate ?? 0) + by) }));
                  remeasure(open.deco, open.index);
                }}
                className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-lg font-bold"
              >
                {icon}
              </button>
            ))}
            {Number(item.rotate ?? 0) !== 0 && (
              <button
                type="button"
                onClick={() => {
                  changeItem(open.deco, open.index, (it) => ({ ...it, rotate: 0 }));
                  remeasure(open.deco, open.index);
                }}
                className="ms-auto rounded-full border-2 border-line px-3 py-1.5 text-sm font-semibold"
              >
                {s.straighten}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SizeButtons
              smaller={s.smaller}
              bigger={s.bigger}
              onSize={(factor) => {
                const [min, max] = SIZE[open.deco];
                changeItem(open.deco, open.index, (it) => ({ ...it, size: Math.min(max, Math.max(min, Math.round(Number(it.size) * factor * 10) / 10)) }));
                remeasure(open.deco, open.index);
              }}
            />
            <button
              type="button"
              onClick={() => {
                changeItem(open.deco, open.index, () => null);
                close();
              }}
              className="ms-auto rounded-full border-2 border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
            >
              🗑 {s.delete}
            </button>
          </div>
          <DoneButton label={s.done} onClick={close} />
          </>,
        )}

      {enabled &&
        open?.kind === "photo" &&
        screen?.type === "photos" &&
        controls(
          place(open.box, 340),
          <>
          <p className={label}>{x.photoTitle}</p>
          <div className="grid gap-2">
            <button type="button" onClick={() => pickPhotos({ deco: false, index: open.index })} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
              {x.replacePhoto}
            </button>
            {screen.photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => pickPhotos(null)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold">
                {x.morePhotos}
              </button>
            )}
            <button type="button" onClick={() => removePhoto(open.index)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-red-600">
              {x.removeThisPhoto}
            </button>
          </div>
          <CropControls
            crop={screen.crops?.[open.index] ?? undefined}
            onCrop={(crop) => {
              begin();
              onScreen(screenIndex, (sc) =>
                sc.type === "photos" ? { ...sc, crops: sc.photos.map((_, j) => (j === open.index ? (crop ?? null) : (sc.crops?.[j] ?? null))) } : sc,
              );
            }}
          />
          <DoneButton label={s.done} onClick={close} />
          </>,
        )}

      {enabled &&
        open?.kind === "words" &&
        controls(
          place(open.box, (long || lines.length > 1 ? 120 : 60) + 200 + (open.button ? 80 : 0)),
          <>
          <p className={label}>{list ? x.linesTitle : x.wordsTitle}</p>
          {list ? (
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {lines.map((line, j) => (
                <input
                  key={j}
                  autoFocus={!sheet && j === list.at(-1)}
                  dir="auto"
                  value={getAt(card, [...list.slice(0, 4), j]) || line}
                  maxLength={80}
                  onChange={(e) => edit([...list.slice(0, 4), j], e.target.value)}
                  className="w-full rounded-xl border border-line bg-background px-3 py-1.5 text-sm outline-none focus:border-brand"
                />
              ))}
            </div>
          ) : long ? (
            <textarea
              autoFocus={!sheet}
              rows={4}
              dir="auto"
              value={value}
              maxLength={limitFor(card, open.path)}
              onChange={(e) => edit(open.path, e.target.value)}
              className="w-full resize-y rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          ) : (
            <input
              autoFocus={!sheet}
              dir="auto"
              value={value}
              maxLength={limitFor(card, open.path)}
              onChange={(e) => edit(open.path, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && close()}
              className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          )}
          {/* The colour and font of the words on this screen. */}
          <Swatches title={s.colour} value={style.text} onPick={(text) => restyle((st) => ({ ...st, text }))} />
          <FontRow value={open.heading ? style.heading : style.body} onPick={(font) => restyle((st) => (open.heading ? { ...st, heading: font } : { ...st, body: font }))} />
          {open.button && <Swatches title={s.buttonColour} value={style.accent} onPick={(accent) => restyle((st) => ({ ...st, accent }))} />}
          <DoneButton label={s.done} onClick={close} />
          </>,
        )}

      {enabled &&
        open?.kind === "envelope" &&
        controls(
          place(open.box, 150),
          <>
            <Swatches title={s.envelopeColour} value={style.envelope} onPick={(envelope) => restyle((st) => ({ ...st, envelope }))} />
            <DoneButton label={s.done} onClick={close} />
          </>,
        )}

      {enabled &&
        open?.kind === "background" &&
        controls(
          place({ left: 0, top: 0, width: area.width, height: 0 }, 520),
          <>
          <Swatches title={s.backgroundColour} value={style.background?.length === 1 ? style.background[0] : undefined} onPick={(c) => restyle((st) => ({ ...st, background: [c] }))} />
          <div>
            <p className={label}>{s.blends}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {BLENDS.map((pair) => (
                <button
                  key={pair.join()}
                  type="button"
                  aria-label={pair.join(" → ")}
                  onClick={() => restyle((st) => ({ ...st, background: pair, gradient: "diagonal" }))}
                  className="h-8 w-8 rounded-full ring-1 ring-black/15"
                  style={{ background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})` }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className={label}>{s.comesIn}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {TRANSITIONS.map((tr) => (
                <button key={tr} type="button" aria-pressed={(style.transition ?? "rise") === tr} onClick={() => restyle((st) => ({ ...st, transition: tr }))} className={chip((style.transition ?? "rise") === tr)}>
                  {s.transitions[tr]}
                </button>
              ))}
            </div>
          </div>
          {screen && (screen.type === "game" || screen.type === "message" || screen.type === "wheel") && (
            <div>
              <p className={label}>{s.speed}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {SPEEDS.map(([value, name]) => (
                  <button key={name} type="button" aria-pressed={(tune.speed ?? 1) === value} onClick={() => retune({ speed: value === 1 ? undefined : value })} className={chip((tune.speed ?? 1) === value)}>
                    {s.speeds[name]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {goal !== undefined && (
            <div className="flex items-center gap-2">
              <p className={`${label} flex-1`}>{s.toWin}</p>
              <button type="button" aria-label={s.fewer} disabled={goal <= 1} onClick={() => retune({ goal: goal - 1 })} className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-lg font-bold disabled:opacity-35">
                −
              </button>
              <span className="w-8 text-center text-lg font-bold tabular-nums">{goal}</span>
              <button type="button" aria-label={s.more} disabled={goal >= 40} onClick={() => retune({ goal: goal + 1 })} className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-lg font-bold disabled:opacity-35">
                +
              </button>
            </div>
          )}
          {screen?.type === "game" && (CATCHING.includes(screen.game) || screen.game === "whack-ghosts") && (
            <div className="flex items-center gap-2">
              <p className={`${label} flex-1`}>{s.pieceSize}</p>
              <SizeButtons smaller={s.smaller} bigger={s.bigger} onSize={(factor) => retune({ size: Math.min(2.5, Math.max(0.5, Math.round((tune.size ?? 1) * factor * 100) / 100)) })} />
            </div>
          )}
          {screen?.type === "game" && CATCHING.includes(screen.game) && (
            <div>
              <p className={label}>{s.comesFrom}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {DIRECTIONS.map((d) => {
                  const on = (tune.from ?? (screen.game === "pop-balloons" ? "bottom" : "top")) === d;
                  return (
                    <button key={d} type="button" aria-pressed={on} onClick={() => retune({ from: d })} className={chip(on)}>
                      {s.directions[d]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <DoneButton label={s.done} onClick={close} />
          </>,
        )}
    </div>
  );
}

// The speeds offered for a screen that plays (style.tune.speed).
const SPEEDS = [
  [0.5, "slow"],
  [1, "normal"],
  [1.6, "fast"],
  [2.5, "faster"],
] as const;

const chip = (on: boolean) => `rounded-full border-2 px-3 py-1 text-sm font-semibold ${on ? "border-brand bg-brand-soft" : "border-line"}`;

function DoneButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button type="button" onClick={onClick} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white">
        {label}
      </button>
    </div>
  );
}

// The colours to pick from, and any other colour.
function Swatches({ title, value, onPick }: { title: string; value?: string; onPick: (colour: string) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide opacity-60">{title}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={value?.toLowerCase() === c}
            onClick={() => onPick(c)}
            className={`h-7 w-7 rounded-full ring-1 ring-black/15 ${value?.toLowerCase() === c ? "outline outline-2 outline-offset-2 outline-brand" : ""}`}
            style={{ background: c }}
          />
        ))}
        <label className="relative grid h-7 w-7 cursor-pointer place-items-center rounded-full text-sm ring-1 ring-black/15" style={{ background: "conic-gradient(#f43f5e, #f59e0b, #84cc16, #06b6d4, #8b5cf6, #f43f5e)" }}>
          <span className="sr-only">{t.studio.moreColours}</span>
          <input type="color" value={value ?? "#000000"} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      </div>
    </div>
  );
}

// Each font, written in itself.
function FontRow({ value, onPick }: { value?: Font; onPick: (font: Font) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide opacity-60">{t.studio.font}</p>
      <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1">
        {FONTS.map((font) => (
          <button
            key={font}
            type="button"
            aria-pressed={value === font}
            onClick={() => onPick(font)}
            className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-base ${value === font ? "border-brand bg-brand-soft" : "border-line"}`}
            style={{ fontFamily: `var(${FONT_VARS[font]})` }}
          >
            {t.studio.fonts[font]}
          </button>
        ))}
      </div>
    </div>
  );
}

// Which part of a photo shows in its frame: zoom in, then slide it about. Without a crop it
// shows whole and centred.
function CropControls({ crop, onCrop }: { crop?: Crop; onCrop: (crop: Crop | undefined) => void }) {
  const { t } = useI18n();
  const s = t.studio;
  const now = crop ?? { x: 50, y: 50, zoom: 1 };
  const slider = (name: string, key: keyof Crop, min: number, max: number, step: number) => (
    <label className="flex items-center gap-3 text-sm">
      <span className="w-20 shrink-0 font-semibold">{name}</span>
      <input type="range" min={min} max={max} step={step} value={now[key]} onChange={(e) => onCrop({ ...now, [key]: Number(e.target.value) })} className="min-w-0 flex-1 accent-[var(--color-brand)]" />
    </label>
  );
  return (
    <div className="space-y-1.5 rounded-xl bg-background p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide opacity-60">{s.inFrame}</p>
        {crop && (
          <button type="button" onClick={() => onCrop(undefined)} className="text-xs font-semibold underline underline-offset-2">
            {s.resetCrop}
          </button>
        )}
      </div>
      {slider(s.zoom, "zoom", 1, 4, 0.05)}
      {slider(s.sideways, "x", 0, 100, 1)}
      {slider(s.upDown, "y", 0, 100, 1)}
    </div>
  );
}

function SizeButtons({ smaller, bigger, onSize }: { smaller: string; bigger: string; onSize: (factor: number) => void }) {
  const button = "grid h-9 w-9 place-items-center rounded-full border-2 border-line text-lg font-bold";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label={smaller} onClick={() => onSize(1 / 1.2)} className={button}>
        −
      </button>
      <button type="button" aria-label={bigger} onClick={() => onSize(1.2)} className={button}>
        +
      </button>
    </div>
  );
}

// Every word on the screen showing, as a list: for words that only show for a moment
// (a game's "Keep holding…") or are fiddly to tap.
export function AllWords({ card, screenId, onChange }: { card: CardData; screenId?: string; onChange: (path: Path, value: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const fields = textFields(card, screenId, true).filter((f) => f.path[0] === "screens");
  if (!fields.length) return null;
  return (
    <div className="text-sm">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="font-semibold underline-offset-4 opacity-75 hover:underline hover:opacity-100">
        {open ? "▾" : "▸"} {fmt(t.custom.allWords, { n: fields.length })}
      </button>
      {open && (
        <div data-all-words className="mt-2 max-h-80 space-y-1.5 overflow-y-auto rounded-2xl border border-line bg-panel p-3">
          {fields.map((f) => {
            const value = getAt(card, f.path);
            const label = labelOf(f.path);
            const name = label ? (isList(label) ? LISTS[label][Number(f.path[4])] : TEXTS[label]) : String(f.path.at(-1));
            const props = {
              dir: "auto" as const,
              value,
              "aria-label": name,
              maxLength: limitFor(card, f.path),
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(f.path, e.target.value),
              className: "w-full rounded-xl border border-line bg-background px-3 py-1.5 outline-none focus:border-brand",
            };
            return value.length > 60 || value.includes("\n") ? <textarea key={f.path.join(".")} rows={3} {...props} /> : <input key={f.path.join(".")} {...props} />;
          })}
        </div>
      )}
    </div>
  );
}
