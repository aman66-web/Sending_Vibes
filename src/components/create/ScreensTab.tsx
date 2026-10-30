"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { stillToWrite } from "@/lib/blanks";
import type { CardData, Screen } from "@/lib/card";
import { occasions } from "@/lib/templates";
import { useFreshTap } from "./one-tap";
import { ScreenPreview } from "./ScreenPreview";
import { FAMILY, FESTIVE, LOVE } from "./kit/parts";
import {
  KIT,
  KIT_FILTERS,
  KIT_GROUPS,
  inFilter,
  matches,
  ranked,
  type KitFilter,
  type KitGroupKey,
  type KitItem,
} from "./screen-kit";

// The Screens tab: over two hundred ready-made screens in the usual groups, to browse by
// occasion or search by name. Each group shows the six that suit this card best, as they'll
// really look on it, with the rest a tap away; tapping one asks where it should go. Previews
// only play while they're on screen (see ScreenPreview), so a long list stays quick.

const GROUP_EMOJI = {
  start: "💌",
  words: "✉️",
  fun: "🎁",
  games: "🎮",
  end: "🎆",
} as const;
const FILTER_EMOJI = {
  birthday: "🎂",
  love: "❤️",
  festive: "🎆",
  family: "🏡",
  fun: "😄",
  all: "✨",
} as const;
// How many of each group show before "Show all".
const FIRST = 6;

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
  const k = t.kit;
  const [filter, setFilter] = useState<KitFilter>("card");
  const [query, setQuery] = useState("");
  // Groups start folded, like a list of drawers: tapping one's heading drops it open. A
  // search opens every group with something found, so the results are in view.
  const [dropped, setDropped] = useState<KitGroupKey[]>([]);
  // Groups showing all their screens, for the filter or search they were opened under.
  const [opened, setOpened] = useState<{ view: string; groups: KitGroupKey[] }>(
    { view: "", groups: [] },
  );
  const [placing, setPlacing] = useState<KitItem | null>(null);
  // A double tap on a screen mustn't also tap the question that opens under the finger.
  const fresh = useFreshTap();
  const searchBox = useRef<HTMLInputElement>(null);
  const searching = query.trim() !== "";
  const view = searching ? `search:${query.trim()}` : filter;
  const open = opened.view === view ? opened.groups : [];
  const nameOf = (item: KitItem) =>
    k.items[item.key]?.name ??
    (item.game ? t.labels.games[item.game] : t.labels.screens[item.type]);

  // Everything a screen can be found by: its name, what it is, its group and its occasions.
  const findBy = useMemo(() => {
    const words = (item: KitItem) => {
      const own = k.items[item.key];
      const group = KIT_GROUPS.find((g) => g.items.includes(item))?.key;
      const tags = item.tags.flatMap((tag) =>
        tag === "any"
          ? []
          : tag === "fun"
            ? [k.filters.fun]
            : [t.occasions[tag].label],
      );
      const kinds = [
        item.tags.includes("birthday") && k.filters.birthday,
        LOVE.some((o) => item.tags.includes(o)) && k.filters.love,
        FESTIVE.some((o) => item.tags.includes(o)) && k.filters.festive,
        FAMILY.some((o) => item.tags.includes(o)) && k.filters.family,
      ];
      return [
        own?.name,
        own?.about,
        t.labels.screens[item.type],
        item.game && t.labels.games[item.game],
        group && s.groups[group],
        ...tags,
        ...kinds,
      ]
        .filter(Boolean)
        .join(" ");
    };
    return new Map(KIT.map((item) => [item, words(item)]));
  }, [k, s, t.labels, t.occasions]);

  const groups = useMemo(
    () =>
      KIT_GROUPS.map((group) => {
        const items = group.items.filter((item) =>
          searching
            ? matches(findBy.get(item) ?? "", query)
            : inFilter(item, filter, card.occasion),
        );
        return { key: group.key, items: ranked(items, card.occasion, FIRST) };
      }).filter((group) => group.items.length > 0),
    [searching, query, filter, card.occasion, findBy],
  );
  const found = groups.reduce((n, g) => n + g.items.length, 0);

  const clearSearch = () => {
    setQuery("");
    searchBox.current?.focus();
  };

  const drop = (key: KitGroupKey) =>
    setDropped((d) =>
      d.includes(key) ? d.filter((g) => g !== key) : [...d, key],
    );

  const toggle = (key: KitGroupKey) => {
    const isOpen = open.includes(key);
    setOpened({
      view,
      groups: isOpen ? open.filter((g) => g !== key) : [...open, key],
    });
    // Folding a long group away would leave them further down the page; bring its heading back.
    if (isOpen)
      requestAnimationFrame(() =>
        document
          .getElementById(`kit-${key}`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-70">{s.screensIntro}</p>

      <div className="relative">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M15.5 15.5 21 21" />
        </svg>
        <input
          type="search"
          value={query}
          ref={searchBox}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={k.searchLabel}
          placeholder={k.searchPlaceholder}
          enterKeyHint="search"
          autoComplete="off"
          className="min-h-12 w-full rounded-2xl border-2 border-line bg-panel py-2.5 pe-12 ps-11 text-base outline-none transition placeholder:opacity-70 focus:border-brand [&::-webkit-search-cancel-button]:hidden"
        />
        {searching && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label={k.clearSearch}
            className="absolute end-0.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-lg opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label={k.filtersLabel}
        className="flex flex-wrap gap-2"
      >
        {KIT_FILTERS.map((f) => {
          const on = !searching && filter === f;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setFilter(f);
                setQuery("");
              }}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold transition ${on ? "border-brand bg-brand text-on-brand" : "border-line bg-panel hover:border-brand"}`}
            >
              <span aria-hidden>
                {f === "card"
                  ? occasions[card.occasion].emoji
                  : FILTER_EMOJI[f]}
              </span>
              {k.filters[f]}
            </button>
          );
        })}
      </div>

      {/* Says how many were found as they type, for screen readers. */}
      <p role="status" className="sr-only">
        {searching
          ? found === 1
            ? k.foundOne
            : fmt(k.found, { n: found })
          : ""}
      </p>

      {groups.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-line p-5 text-center">
          <p className="font-semibold">
            {searching ? fmt(k.noMatch, { q: query.trim() }) : k.noneHere}
          </p>
          {searching && (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-3 min-h-11 rounded-full border-2 border-line bg-panel px-5 font-bold transition hover:border-brand"
            >
              {k.clearSearch}
            </button>
          )}
        </div>
      )}

      {groups.map((group) => {
        const isOpen = open.includes(group.key);
        const isDropped = searching || dropped.includes(group.key);
        const shown = isOpen ? group.items : group.items.slice(0, FIRST);
        return (
          <section
            key={group.key}
            aria-labelledby={`kit-${group.key}`}
            className="scroll-mt-4 overflow-hidden rounded-2xl border-2 border-line bg-panel"
          >
            <h3 id={`kit-${group.key}`} className="scroll-mt-4">
              <button
                type="button"
                aria-expanded={isDropped}
                aria-controls={`kit-${group.key}-list`}
                disabled={searching}
                onClick={() => drop(group.key)}
                className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-background disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span aria-hidden className="text-2xl">
                  {GROUP_EMOJI[group.key]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{s.groups[group.key]}</span>
                  <span className="block text-xs opacity-75">
                    {group.items.length === 1
                      ? s.oneScreen
                      : fmt(s.screenCount, { n: group.items.length })}
                  </span>
                </span>
                {!searching && (
                  <span
                    aria-hidden
                    className={`text-xl leading-none transition ${isDropped ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                )}
              </button>
            </h3>
            {isDropped && (
              <>
                <ul
                  id={`kit-${group.key}-list`}
                  className="grid grid-cols-2 gap-3 border-t border-line p-3"
                >
                  {shown.map((item) => (
                    <li key={item.key}>
                      <KitTile
                        card={card}
                        item={item}
                        name={nameOf(item)}
                        about={k.items[item.key]?.about ?? ""}
                        onPick={(e) =>
                          fresh(e) && (full ? onFull() : setPlacing(item))
                        }
                      />
                    </li>
                  ))}
                </ul>
                {group.items.length > FIRST && (
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggle(group.key)}
                      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-line bg-background px-4 py-2 font-bold transition hover:border-brand"
                    >
                      {isOpen
                        ? k.showFewer
                        : fmt(k.showAll, { n: group.items.length })}
                      <span
                        aria-hidden
                        className={`text-lg leading-none transition ${isOpen ? "rotate-180" : ""}`}
                      >
                        ▾
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
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

// A ready-made screen as it'll look on this card, its name, what it's for, and whether
// it's ready as it is or has words (or photos) for them to add.
function KitTile({
  card,
  item,
  name,
  about,
  onPick,
}: {
  card: CardData;
  item: KitItem;
  name: string;
  about: string;
  onPick: (e: React.MouseEvent) => void;
}) {
  const { t } = useI18n();
  const screen = useMemo(
    () => item.make({ to: card.to, from: card.from }),
    [item, card.to, card.from],
  );
  // A photos screen without photos is skipped when the card plays, so it always needs some.
  const needs = useMemo(
    () =>
      screen.type === "photos"
        ? "photos"
        : stillToWrite({ screens: [screen] }).length
          ? "words"
          : null,
    [screen],
  );
  return (
    <button
      type="button"
      onClick={onPick}
      className="group block w-full rounded-2xl p-1.5 text-start transition hover:bg-brand-soft"
    >
      <ScreenPreview card={card} screen={screen} />
      <span className="mt-1.5 block px-0.5 text-sm font-bold leading-tight">
        {name}
      </span>
      {about && (
        <span className="mt-0.5 block px-0.5 text-xs leading-snug opacity-70">
          {about}
        </span>
      )}
      <span
        className={`mt-1 block px-0.5 text-xs font-semibold ${needs ? "text-brand" : "opacity-75"}`}
      >
        <span aria-hidden>
          {needs === "photos" ? "📷 " : needs ? "✏️ " : "✓ "}
        </span>
        {needs === "photos"
          ? t.kit.addPhotos
          : needs
            ? t.kit.writeYours
            : t.kit.ready}
      </span>
    </button>
  );
}

// Where a new screen goes: the card's screens in order, each as it looks, with a "Put it
// here" place before the first and after each one. After the screen they're on is picked out.
function WherePicker({
  card,
  current,
  name,
  onChoose,
  onCancel,
}: {
  card: CardData;
  current: number;
  name: string;
  onChoose: (at: number) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const s = t.studio;
  // Opened by a tap, so the second tap of a double tap lands in here: it doesn't count.
  const fresh = useFreshTap();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  // What's on each screen, so they can tell them apart.
  const words = (sc: Screen) => {
    const text =
      "title" in sc && typeof sc.title === "string"
        ? sc.title
        : "question" in sc && typeof sc.question === "string"
          ? sc.question
          : "";
    return text.length > 40 ? `${text.slice(0, 38)}…` : text;
  };
  const nameOf = (sc: Screen) =>
    sc.type === "game" ? t.labels.games[sc.game] : t.labels.screens[sc.type];
  // The place after the screen they're on is the one they most likely want.
  const suggested = Math.min(current + 1, card.screens.length);
  const place = (at: number) => (
    <button
      type="button"
      autoFocus={at === suggested}
      aria-label={
        at === 0
          ? s.atStart
          : fmt(s.afterScreen, { n: at, name: nameOf(card.screens[at - 1]) })
      }
      onClick={(e) => fresh(e) && onChoose(at)}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-2.5 font-bold transition hover:border-brand hover:bg-brand-soft hover:text-on-brand-soft ${at === suggested ? "border-brand bg-brand-soft text-on-brand-soft" : "border-line text-foreground/70"}`}
    >
      <span aria-hidden className="text-lg leading-none">
        ＋
      </span>
      {s.putHere}
    </button>
  );
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="where-title"
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/50"
      onClick={(e) => fresh(e) && onCancel()}
    >
      <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl border-2 border-foreground bg-background p-5 shadow-2xl"
        >
          <h2 id="where-title" className="font-brand text-2xl font-bold">
            {s.whereTitle}
          </h2>
          <p className="mt-1 opacity-70">{fmt(s.whereIntro, { name })}</p>
          <ol className="mt-4 space-y-2">
            <li>{place(0)}</li>
            {card.screens.map((sc, i) => (
              <Fragment key={sc.id}>
                <li
                  className={`flex items-center gap-3 rounded-2xl border-2 bg-panel p-2 ${i === current ? "border-brand" : "border-line"}`}
                >
                  <ScreenPreview
                    card={card}
                    screen={sc}
                    className="w-16 rounded-lg"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {i + 1}. {nameOf(sc)}
                    </span>
                    {words(sc) && (
                      <span className="block truncate text-sm opacity-75">
                        {words(sc)}
                      </span>
                    )}
                  </span>
                  {i === current && (
                    <span className="shrink-0 pe-1 text-xs font-bold text-brand">
                      {s.youAreHere}
                    </span>
                  )}
                </li>
                <li>{place(i + 1)}</li>
              </Fragment>
            ))}
          </ol>
          <button
            type="button"
            onClick={(e) => fresh(e) && onCancel()}
            className="mt-4 w-full rounded-full border-2 border-line py-3 font-semibold"
          >
            {s.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
