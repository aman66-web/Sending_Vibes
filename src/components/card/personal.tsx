"use client";

import { createContext, useContext, useMemo } from "react";
import type { CardData, Crop } from "@/lib/card";

// Who the card is for and from, and the photos the sender put on it, so the games can
// pipe their name in icing or deal their photos in a memory game. CardPlayer provides it
// for the whole card; anywhere without it gets blanks, and the games play as they always have.
export type PersonalPhoto = { src: string; crop?: Crop | null };
export type Personal = { to: string; from: string; photos: PersonalPhoto[] };

export const PersonalContext = createContext<Personal>({ to: "", from: "", photos: [] });

export const usePersonal = () => useContext(PersonalContext);

// As many as a memory game can pair up.
const MAX_PHOTOS = 6;

// The card's photos in the order they come: each photo screen's, then any placed on a
// screen, without repeats.
export function cardPhotos(screens: CardData["screens"]): PersonalPhoto[] {
  const out: PersonalPhoto[] = [];
  const add = (src: string, crop?: Crop | null) => {
    if (src && out.length < MAX_PHOTOS && !out.some((p) => p.src === src)) out.push({ src, crop });
  };
  for (const s of screens) if (s.type === "photos") s.photos.forEach((src, i) => add(src, s.crops?.[i]));
  for (const s of screens) for (const img of s.style?.images ?? []) add(img.src, img.crop);
  return out;
}

export function PersonalProvider({ card, children }: { card: Pick<CardData, "to" | "from" | "screens">; children: React.ReactNode }) {
  const { to, from, screens } = card;
  const value = useMemo(() => ({ to: to.trim(), from: from.trim(), photos: cardPhotos(screens) }), [to, from, screens]);
  return <PersonalContext.Provider value={value}>{children}</PersonalContext.Provider>;
}

// A name's length in letters (an emoji or accented letter counts once).
const letters = (name: string) => [...name].length;

// Picks a size for a name by its length: up to 8 letters, up to 14, or longer. Where a
// name is shown, anything still too long is cut short with "…".
export function bySize<T>(name: string, [short, medium, long]: [T, T, T]): T {
  const n = letters(name);
  return n <= 8 ? short : n <= 14 ? medium : long;
}

// A name cut to so many letters, for places CSS can't trim (an SVG's text).
export function shortName(name: string, max: number) {
  const all = [...name];
  return all.length <= max ? name : `${all.slice(0, max - 1).join("").trimEnd()}…`;
}

// Whether a name is written right to left (Arabic, Urdu, Hebrew), from its first letter.
// For SVG text, which can't work it out with dir="auto".
export const isRtl = (name: string) => /^[^\p{L}]*[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufefc]/u.test(name);

// The first letter of their name, for the back of a memory card.
export const initialOf = (name: string) => ([...name.trim()][0] ?? "").toUpperCase();
