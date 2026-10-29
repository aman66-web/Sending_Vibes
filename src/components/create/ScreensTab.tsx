"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardData, Screen } from "@/lib/card";
import { ScreenPreview } from "./ScreenPreview";
import { KIT_GROUPS, type KitItem } from "./screen-kit";

// The Screens tab: ready-made screens grouped by what they're for. Each group opens to show
// its screens as they'll really look on this card, and tapping one asks where it should go.

const GROUP_EMOJI = { start: "💌", words: "✉️", fun: "🎁", games: "🎮", end: "🎆" } as const;

type Props = {
  card: CardData;
  // The screen being looked at, offered first as where to put a new one.
  screenIndex: number;
  // Puts a new screen at this position (0 is before the first).
  onAdd: (screen: Screen, at: number) => void;
  // The card already has as many screens as it can; says so instead of adding.
  full: boolean;
  onFull: () => void;
};

export function ScreensTab({ card, screenIndex, onAdd, full, onFull }: Props) {
  const { t } = useI18n();
  const s = t.studio;
  const [open, setOpen] = useState<string | null>(null);
  const [placing, setPlacing] = useState<KitItem | null>(null);
  const nameOf = (item: KitItem) => (item.game ? t.labels.games[item.game] : t.labels.screens[item.type]);
  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">{s.screensIntro}</p>
      {KIT_GROUPS.map((group) => {
        const isOpen = open === group.key;
        return (
          <div key={group.key} className="overflow-hidden rounded-2xl border-2 border-line bg-panel">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : group.key)} className="flex w-full items-center gap-3 px-4 py-3 text-start">
              <span aria-hidden className="text-2xl">
                {GROUP_EMOJI[group.key]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{s.groups[group.key]}</span>
                <span className="block text-xs opacity-60">{group.items.length === 1 ? s.oneScreen : fmt(s.screenCount, { n: group.items.length })}</span>
              </span>
              <span aria-hidden className={`text-xl leading-none transition ${isOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {isOpen && (
              <div className="grid grid-cols-2 gap-3 border-t border-line p-3">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => (full ? onFull() : setPlacing(item))}
                    className="group rounded-2xl p-1.5 text-start transition hover:bg-brand-soft"
                  >
                    <KitPreview card={card} item={item} />
                    <span className="mt-1.5 block px-0.5 text-sm font-bold leading-tight">{nameOf(item)}</span>
                    {!item.game && <span className="block px-0.5 text-xs leading-snug opacity-60">{s.kit[item.type]}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {placing && (
        <WherePicker
          card={card}
          current={screenIndex}
          name={nameOf(placing)}
          onCancel={() => setPlacing(null)}
          onChoose={(at) => {
            onAdd(placing.make({ to: card.to, from: card.from }), at);
            setPlacing(null);
          }}
        />
      )}
    </div>
  );
}

// A ready-made screen as it'll look on this card.
function KitPreview({ card, item }: { card: CardData; item: KitItem }) {
  const screen = useMemo(() => item.make({ to: card.to, from: card.from }), [item, card.to, card.from]);
  return <ScreenPreview card={card} screen={screen} />;
}

// Where a new screen goes: the card's screens in order, each as it looks, with a "Put it
// here" place before the first and after each one. After the screen they're on is picked out.
function WherePicker({ card, current, name, onChoose, onCancel }: { card: CardData; current: number; name: string; onChoose: (at: number) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const s = t.studio;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  // What's on each screen, so they can tell them apart.
  const words = (sc: Screen) => {
    const text = "title" in sc && typeof sc.title === "string" ? sc.title : "question" in sc && typeof sc.question === "string" ? sc.question : "";
    return text.length > 40 ? `${text.slice(0, 38)}…` : text;
  };
  const nameOf = (sc: Screen) => (sc.type === "game" ? t.labels.games[sc.game] : t.labels.screens[sc.type]);
  // The place after the screen they're on is the one they most likely want.
  const suggested = Math.min(current + 1, card.screens.length);
  const place = (at: number) => (
    <button
      type="button"
      autoFocus={at === suggested}
      aria-label={at === 0 ? s.atStart : fmt(s.afterScreen, { n: at, name: nameOf(card.screens[at - 1]) })}
      onClick={() => onChoose(at)}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-2.5 font-bold transition hover:border-brand hover:bg-brand-soft hover:text-brand ${at === suggested ? "border-brand bg-brand-soft text-brand" : "border-line text-foreground/70"}`}
    >
      <span aria-hidden className="text-lg leading-none">
        ＋
      </span>
      {s.putHere}
    </button>
  );
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="where-title" className="fixed inset-0 z-[70] overflow-y-auto bg-black/50" onClick={onCancel}>
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border-2 border-foreground bg-background p-5 shadow-2xl">
          <h2 id="where-title" className="font-brand text-2xl font-bold">
            {s.whereTitle}
          </h2>
          <p className="mt-1 opacity-70">{fmt(s.whereIntro, { name })}</p>
          <ol className="mt-4 space-y-2">
            <li>{place(0)}</li>
            {card.screens.map((sc, i) => (
              <Fragment key={sc.id}>
                <li className={`flex items-center gap-3 rounded-2xl border-2 bg-panel p-2 ${i === current ? "border-brand" : "border-line"}`}>
                  <ScreenPreview card={card} screen={sc} className="w-16 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {i + 1}. {nameOf(sc)}
                    </span>
                    {words(sc) && <span className="block truncate text-sm opacity-60">{words(sc)}</span>}
                  </span>
                  {i === current && <span className="shrink-0 pe-1 text-xs font-bold text-brand">{s.youAreHere}</span>}
                </li>
                <li>{place(i + 1)}</li>
              </Fragment>
            ))}
          </ol>
          <button type="button" onClick={onCancel} className="mt-4 w-full rounded-full border-2 border-line py-3 font-semibold">
            {s.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
