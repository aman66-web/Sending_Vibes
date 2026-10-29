import type { CardData, Screen, ScreenStyle, ThemeName } from "./card";

// Every design sets its own colours screen by screen, so a theme picked from the swatches
// would barely show. Picking one that isn't the card's own takes those colours off, so the
// theme shows through; fonts, stickers, bursts, transitions, words and tunes all stay.
// Text boxes keep their words but lose their own colour, which was chosen for the old
// background and could be hard to read on the new one.
const COLOURS = ["background", "gradient", "pattern", "text", "accent", "envelope"] as const satisfies readonly (keyof ScreenStyle)[];

function uncoloured(screen: Screen): Screen {
  if (!screen.style) return screen;
  const style: ScreenStyle = { ...screen.style };
  for (const key of COLOURS) delete style[key];
  if (style.texts) {
    style.texts = style.texts.map((box) => {
      const plain = { ...box };
      delete plain.color;
      return plain;
    });
  }
  const rest = { ...screen };
  delete rest.style;
  return Object.keys(style).length ? { ...rest, style } : rest;
}

export function withTheme<T extends Pick<CardData, "theme" | "screens">>(card: T, theme: ThemeName): T {
  if (card.theme === theme) return card;
  return { ...card, theme, screens: card.screens.map(uncoloured) };
}
