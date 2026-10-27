"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import type { CardData } from "@/lib/card";

// Click the words on the live preview to change them, like editing a design.
// While editing, a see-through layer sits over the card so its games and buttons
// don't react. Each click finds the text under the pointer and matches it to the
// card field it came from, so this works for every kind of screen without each one
// having to know about editing.

export type Path = (string | number)[];
type Field = { path: Path; value: string };

const SKIP = new Set(["id", "type", "game", "effect", "photos"]);

// Every piece of text on one screen, plus the two names, with where each lives in the card.
function textFields(card: CardData, screenId?: string): Field[] {
  const out: Field[] = [
    { path: ["to"], value: card.to },
    { path: ["from"], value: card.from },
  ];
  const i = card.screens.findIndex((s) => s.id === screenId);
  if (i < 0) return out;
  const walk = (value: unknown, path: Path) => {
    if (typeof value === "string") {
      if (value.trim()) out.push({ path, value });
    } else if (Array.isArray(value)) {
      value.forEach((item, j) => walk(item, [...path, j]));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) if (!SKIP.has(k)) walk(v, [...path, k]);
    }
  };
  walk(card.screens[i], ["screens", i]);
  return out;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

// The field whose text is on the element under the pointer (or the nearest parent
// that has some). An exact match wins; a message still typing itself out matches the
// start of its text; text with a quote mark or emoji around it still counts.
function findField(target: Element | null, root: HTMLElement, fields: Field[]): { field: Field; el: Element } | null {
  for (let el = target; el && el !== root; el = el.parentElement) {
    const text = norm(el.textContent ?? "");
    if (!text || text.length > 1600) continue;
    let best: { field: Field; score: number; length: number } | null = null;
    for (const field of fields) {
      const value = norm(field.value);
      if (!value) continue;
      const score = value === text ? 3 : text.length >= 4 && value.startsWith(text) ? 2 : value.length >= 3 && text.includes(value) && text.length <= value.length + 6 ? 1 : 0;
      if (score && (!best || score > best.score || (score === best.score && value.length > best.length))) best = { field, score, length: value.length };
    }
    if (best) return { field: best.field, el };
  }
  return null;
}

export function getAt(card: CardData, path: Path): string {
  let value: unknown = card;
  for (const key of path) value = (value as Record<string | number, unknown>)?.[key];
  return typeof value === "string" ? value : "";
}

export function setAt<T>(obj: T, path: Path, value: string): T {
  const [key, ...rest] = path;
  const copy = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string | number, unknown>;
  copy[key] = rest.length ? setAt(copy[key], rest, value) : value;
  return copy as T;
}

// The most each field can hold, so an edit never makes the card fail to save.
const LIMITS: Record<string, number> = {
  to: 40, from: 40, title: 120, subtitle: 200, button: 40, question: 140, yes: 30, no: 30, afterYes: 140, instructions: 200, winText: 140,
  hidden: 200, phrase: 40, low: 30, high: 30, when: 40, what: 160, captions: 120, coupons: 80, reasons: 160, prizes: 80,
};

function limitFor(card: CardData, path: Path) {
  const key = typeof path.at(-1) === "number" ? String(path.at(-2)) : String(path.at(-1));
  const type = path[0] === "screens" ? card.screens[Number(path[1])]?.type : undefined;
  if (key === "body") return type === "finale" ? 600 : 1500;
  if (key === "options") return type === "wheel" ? 40 : 60;
  if (key === "title" && type === "finale") return 140;
  return LIMITS[key] ?? 200;
}

type Box = { left: number; top: number; width: number; height: number };
type Open = { path: Path; box: Box; area: { width: number; height: number } };

type Props = {
  card: CardData;
  screenId?: string;
  enabled: boolean;
  onChange: (path: Path, value: string) => void;
  // A click on something that isn't text (a photo, a game) opens that screen's settings.
  onOther: () => void;
  className?: string;
  children: React.ReactNode;
};

export function EditableCard({ card, screenId, enabled, onChange, onOther, className = "", children }: Props) {
  const { t } = useI18n();
  const x = t.custom;
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [open, setOpen] = useState<Open | null>(null);

  // What's under the pointer, looking through the editing layer.
  const under = (clientX: number, clientY: number) => {
    const el = root.current;
    if (!el) return null;
    const below = document.elementsFromPoint(clientX, clientY).find((e) => e !== layer.current && el.contains(e) && !e.closest("[data-word-editor]"));
    return below ? findField(below, el, textFields(card, screenId)) : null;
  };
  const boxOf = (target: Element): Box => {
    const outer = root.current!.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    return { left: r.left - outer.left, top: r.top - outer.top, width: r.width, height: r.height };
  };

  const value = open ? getAt(card, open.path) : "";
  const long = value.length > 50 || value.includes("\n");

  return (
    <div ref={root} className={`relative ${className}`}>
      {children}
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
            if (hit) setOpen({ path: hit.field.path, box: boxOf(hit.el), area: { width: root.current!.offsetWidth, height: root.current!.offsetHeight } });
            else {
              setOpen(null);
              onOther();
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
      {enabled && open && (
        <div
          data-word-editor
          className="absolute z-50 w-[280px] max-w-[calc(100%-16px)] rounded-2xl border border-line bg-panel p-3 text-foreground shadow-2xl"
          style={{
            left: Math.max(8, Math.min(open.box.left + open.box.width / 2 - 140, open.area.width - 288)),
            top: Math.max(8, Math.min(open.box.top + open.box.height + 10, open.area.height - (long ? 210 : 130))),
          }}
        >
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">{x.wordsTitle}</p>
          {long ? (
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
            <button onClick={() => setOpen(null)} className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white">
              {x.done}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
