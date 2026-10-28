"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import type { CardData, Screen } from "@/lib/card";
import { LISTS, TEXTS, isList, labelList, labelsOn, type LabelKey, type ListKey } from "@/lib/labels";
import { uploadPhoto } from "./image";

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
type Hit = { kind: "words"; field: Field; el: Element } | { kind: "photo"; index: number | "new"; el: Element };
type Open = { box: Box; area: { width: number; height: number } } & ({ kind: "words"; path: Path } | { kind: "photo"; index: number });

// The most photos a photos screen holds (see lib/card.ts).
const MAX_PHOTOS = 6;

type Props = {
  card: CardData;
  screenId?: string;
  enabled: boolean;
  onChange: (path: Path, value: string) => void;
  // Photos added, swapped or taken out on a photos screen.
  onScreen: (index: number, update: (screen: Screen) => Screen) => void;
  className?: string;
  children: React.ReactNode;
};

export function EditableCard({ card, screenId, enabled, onChange, onScreen, className = "", children }: Props) {
  const { t } = useI18n();
  const x = t.custom;
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const files = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  // Which photo the chosen file replaces, or null to add them.
  const [replacing, setReplacing] = useState<number | null>(null);
  const [uploading, setUploading] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // Tapping something that isn't words or a photo (the envelope, a game) explains what to do.
  const [tip, setTip] = useState(false);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(tipTimer.current), []);
  const screenIndex = card.screens.findIndex((s) => s.id === screenId);
  const screen = card.screens[screenIndex];

  // What's under the pointer, looking through the editing layer: a photo, or some words.
  const under = (clientX: number, clientY: number): Hit | null => {
    const el = root.current;
    if (!el) return null;
    const below = document.elementsFromPoint(clientX, clientY).find((e) => e !== layer.current && el.contains(e) && !e.closest("[data-word-editor]"));
    if (!below) return null;
    const photo = below.closest("[data-photo]");
    if (photo && el.contains(photo)) {
      const index = photo.getAttribute("data-photo");
      return { kind: "photo", index: index === "new" ? "new" : Number(index), el: photo };
    }
    const found = findField(below, el, textFields(card, screenId));
    return found && { kind: "words", ...found };
  };
  const boxOf = (target: Element): Box => {
    const outer = root.current!.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    return { left: r.left - outer.left, top: r.top - outer.top, width: r.width, height: r.height };
  };

  const pickPhotos = (replace: number | null) => {
    setReplacing(replace);
    setPhotoError(null);
    files.current?.click();
  };

  const addPhotos = async (chosen: FileList | null) => {
    if (!chosen?.length || screen?.type !== "photos") return;
    const index = screenIndex;
    const replace = replacing;
    const room = replace !== null ? 1 : MAX_PHOTOS - screen.photos.length;
    const picked = Array.from(chosen).slice(0, Math.max(room, 0));
    if (replace === null && chosen.length > room) setPhotoError(fmt(t.editor.tooManyPhotos, { n: MAX_PHOTOS }));
    setOpen(null);
    if (files.current) files.current.value = "";
    for (const file of picked) {
      setUploading((n) => n + 1);
      try {
        const url = await uploadPhoto(file);
        onScreen(index, (s) => {
          if (s.type !== "photos") return s;
          if (replace !== null && replace < s.photos.length) return { ...s, photos: s.photos.map((p, j) => (j === replace ? url : p)) };
          if (s.photos.length >= MAX_PHOTOS) return s;
          return { ...s, photos: [...s.photos, url], captions: [...s.photos.map((_, j) => s.captions[j] ?? ""), ""] };
        });
      } catch {
        setPhotoError(t.editor.uploadFailed);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const removePhoto = (i: number) => {
    onScreen(screenIndex, (s) => (s.type === "photos" ? { ...s, photos: s.photos.filter((_, j) => j !== i), captions: s.captions.filter((_, j) => j !== i) } : s));
    setOpen(null);
  };

  const words = open?.kind === "words" ? open.path : null;
  const value = words ? getAt(card, words) : "";
  const long = value.length > 50 || value.includes("\n");
  // One line of a list (the No button's excuses, say): show them all, in the order they're said.
  const list = words && labelOf(words) && typeof words.at(-1) === "number" ? words : null;
  const lines = list ? labelList(card.screens[Number(list[1])]?.labels, list[3] as ListKey) : [];
  const popup = (box: Box, area: { width: number; height: number }, tall: boolean) => ({
    left: Math.max(8, Math.min(box.left + box.width / 2 - 140, area.width - 288)),
    top: Math.max(8, Math.min(box.top + box.height + 10, area.height - (tall ? 260 : 130))),
  });

  return (
    <div ref={root} className={`relative ${className}`}>
      {children}
      <input ref={files} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
      {enabled && (
        <div
          ref={layer}
          className="absolute inset-0 z-[45] cursor-text"
          onPointerMove={(e) => {
            const hit = under(e.clientX, e.clientY);
            setHover(hit ? boxOf(hit.el) : null);
          }}
          onPointerLeave={() => setHover(null)}
          onClick={(e) => {
            const hit = under(e.clientX, e.clientY);
            const area = { width: root.current!.offsetWidth, height: root.current!.offsetHeight };
            if (hit?.kind === "photo") {
              if (hit.index === "new") {
                setOpen(null);
                return pickPhotos(null);
              }
              return setOpen({ kind: "photo", index: hit.index, box: boxOf(hit.el), area });
            }
            if (hit) setOpen({ kind: "words", path: hit.field.path, box: boxOf(hit.el), area });
            else {
              setOpen(null);
              setTip(true);
              clearTimeout(tipTimer.current);
              tipTimer.current = setTimeout(() => setTip(false), 3500);
            }
          }}
          onWheel={(e) => {
            // Let long screens still scroll underneath.
            let el = document.elementsFromPoint(e.clientX, e.clientY).find((n) => n !== layer.current) as HTMLElement | undefined;
            while (el && el !== root.current && el.scrollHeight <= el.clientHeight) el = el.parentElement ?? undefined;
            if (el && el !== root.current) el.scrollTop += e.deltaY;
          }}
        />
      )}
      {enabled && hover && !open && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-[46] rounded-md ring-2 ring-brand ring-offset-2 ring-offset-transparent"
          style={{ left: hover.left - 4, top: hover.top - 3, width: hover.width + 8, height: hover.height + 6 }}
        />
      )}
      {enabled && tip && !open && uploading === 0 && !photoError && (
        <p role="status" className="pointer-events-none absolute inset-x-0 bottom-4 z-50 mx-auto w-fit max-w-[90%] rounded-2xl bg-black/80 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg">
          {x.tapWordsTip}
        </p>
      )}
      {(uploading > 0 || photoError) && (
        <p role="status" className="absolute inset-x-0 top-3 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-black/80 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg">
          {uploading > 0 ? t.editor.uploading : photoError}
        </p>
      )}
      {enabled && open?.kind === "photo" && screen?.type === "photos" && (
        <div data-word-editor className="absolute z-50 w-[280px] max-w-[calc(100%-16px)] rounded-2xl border border-line bg-panel p-3 text-foreground shadow-2xl" style={popup(open.box, open.area, false)}>
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">{x.photoTitle}</p>
          <div className="mt-2 grid gap-2">
            <button type="button" onClick={() => pickPhotos(open.index)} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
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
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => setOpen(null)} className="px-2 py-1 text-sm font-semibold opacity-70">
              {x.done}
            </button>
          </div>
        </div>
      )}
      {enabled && open?.kind === "words" && (
        <div data-word-editor className="absolute z-50 w-[280px] max-w-[calc(100%-16px)] rounded-2xl border border-line bg-panel p-3 text-foreground shadow-2xl" style={popup(open.box, open.area, long || lines.length > 1)}>
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">{list ? x.linesTitle : x.wordsTitle}</p>
          {list ? (
            <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
              {lines.map((line, j) => (
                <input
                  key={j}
                  autoFocus={j === list.at(-1)}
                  dir="auto"
                  value={getAt(card, [...list.slice(0, 4), j]) || line}
                  maxLength={80}
                  onChange={(e) => onChange([...list.slice(0, 4), j], e.target.value)}
                  className="w-full rounded-xl border border-line bg-background px-3 py-1.5 text-sm outline-none focus:border-brand"
                />
              ))}
            </div>
          ) : long ? (
            <textarea
              autoFocus
              rows={4}
              dir="auto"
              value={value}
              maxLength={limitFor(card, open.path)}
              onChange={(e) => onChange(open.path, e.target.value)}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          ) : (
            <input
              autoFocus
              dir="auto"
              value={value}
              maxLength={limitFor(card, open.path)}
              onChange={(e) => onChange(open.path, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setOpen(null)}
              className="mt-2 w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          )}
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => setOpen(null)} className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white">
              {x.done}
            </button>
          </div>
        </div>
      )}
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
