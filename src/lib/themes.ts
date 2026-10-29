import type { ThemeName } from "./card";

export type Theme = {
  label: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  secondary: string;
  // A simpler background for share images, where layered gradients don't render.
  og?: string;
};

// Palettes in the spirit of good stationery: deep jewel tones with gold, or soft
// paper colours with ink. Every card also gets a paper grain and a printed border.
// The muted ink and the button's words are at least 4.5:1 on every part of the
// background, so older eyes can read the small print on a phone.
export const themes: Record<ThemeName, Theme> = {
  rose: {
    label: "Rose",
    background: "radial-gradient(130% 90% at 50% 0%, #fbece8 0%, #f4d6d1 55%, #ebc3bf 100%)",
    og: "linear-gradient(170deg, #fbece8 0%, #ebc3bf 100%)",
    surface: "rgba(255,252,250,0.62)",
    text: "#4a1626",
    muted: "#7c4554",
    accent: "#8e2a43",
    accentText: "#fff8f5",
    secondary: "#fffaf7",
  },
  marigold: {
    label: "Marigold",
    background: "radial-gradient(130% 90% at 50% 0%, #4a1a3c 0%, #2a0c22 58%, #170613 100%)",
    og: "linear-gradient(170deg, #4a1a3c 0%, #170613 100%)",
    surface: "rgba(255,235,200,0.07)",
    text: "#f8ead0",
    muted: "#d9b36c",
    accent: "#d6a548",
    accentText: "#2a0c22",
    secondary: "rgba(255,235,200,0.1)",
  },
  party: {
    label: "Party",
    background: "radial-gradient(130% 90% at 50% 0%, #fdf8ee 0%, #f3e7cf 60%, #e8d6b2 100%)",
    og: "linear-gradient(170deg, #fdf8ee 0%, #e8d6b2 100%)",
    surface: "rgba(255,253,248,0.66)",
    text: "#2e2415",
    muted: "#6d5a3d",
    accent: "#8e6c31",
    accentText: "#fffdf7",
    secondary: "#fffdf8",
  },
  noel: {
    label: "Noel",
    background: "radial-gradient(130% 90% at 50% 0%, #21503e 0%, #123024 62%, #0a1d15 100%)",
    og: "linear-gradient(170deg, #21503e 0%, #0a1d15 100%)",
    surface: "rgba(255,245,225,0.07)",
    text: "#f7f0e2",
    muted: "#d9c08a",
    accent: "#b4342f",
    accentText: "#fff8ef",
    secondary: "rgba(255,245,225,0.1)",
  },
  crescent: {
    label: "Crescent",
    background: "radial-gradient(130% 90% at 70% 0%, #19524f 0%, #0c2e2e 62%, #061b1b 100%)",
    og: "linear-gradient(170deg, #19524f 0%, #061b1b 100%)",
    surface: "rgba(240,230,205,0.07)",
    text: "#f4ecd8",
    muted: "#ddbd78",
    accent: "#d3ae62",
    accentText: "#0c2e2e",
    secondary: "rgba(240,230,205,0.1)",
  },
  gold: {
    label: "Black & gold",
    background: "radial-gradient(130% 90% at 50% 0%, #2e2924 0%, #171411 62%, #0d0b09 100%)",
    og: "linear-gradient(170deg, #2e2924 0%, #0d0b09 100%)",
    surface: "rgba(255,240,210,0.06)",
    text: "#f5ecd8",
    muted: "#caa96a",
    accent: "#c9a24a",
    accentText: "#171411",
    secondary: "rgba(255,240,210,0.09)",
  },
  lavender: {
    label: "Lavender",
    background: "radial-gradient(130% 90% at 50% 0%, #f6f2f8 0%, #e7ddee 58%, #d9cbe4 100%)",
    og: "linear-gradient(170deg, #f6f2f8 0%, #d9cbe4 100%)",
    surface: "rgba(255,254,255,0.62)",
    text: "#2f2341",
    muted: "#5e5272",
    accent: "#5f4583",
    accentText: "#fbf8ff",
    secondary: "#fdfbff",
  },
  mint: {
    label: "Mint",
    background: "radial-gradient(130% 90% at 50% 0%, #f1f4ec 0%, #dfe7d7 58%, #cdd9c2 100%)",
    og: "linear-gradient(170deg, #f1f4ec 0%, #cdd9c2 100%)",
    surface: "rgba(254,255,252,0.62)",
    text: "#22301f",
    muted: "#4f5f49",
    accent: "#46663f",
    accentText: "#f8fbf5",
    secondary: "#fcfdfa",
  },
  sunset: {
    label: "Sunset",
    background: "radial-gradient(130% 90% at 50% 0%, #fbeee4 0%, #f1d6c3 58%, #e6bfa6 100%)",
    og: "linear-gradient(170deg, #fbeee4 0%, #e6bfa6 100%)",
    surface: "rgba(255,252,248,0.62)",
    text: "#3d2116",
    muted: "#6c4938",
    accent: "#a9502f",
    accentText: "#fff8f2",
    secondary: "#fffbf7",
  },
  spooky: {
    label: "Spooky",
    background: "radial-gradient(130% 90% at 50% 0%, #2e2540 0%, #17121f 62%, #0c0910 100%)",
    og: "linear-gradient(170deg, #2e2540 0%, #0c0910 100%)",
    surface: "rgba(255,235,210,0.06)",
    text: "#f2eadc",
    muted: "#c9a675",
    accent: "#d07a2d",
    accentText: "#17121f",
    secondary: "rgba(255,235,210,0.09)",
  },
  holi: {
    label: "Holi",
    background:
      "radial-gradient(60% 45% at 8% 12%, rgba(226,92,145,0.22) 0%, transparent 70%), radial-gradient(55% 40% at 95% 20%, rgba(233,182,62,0.24) 0%, transparent 70%), radial-gradient(60% 45% at 15% 95%, rgba(62,160,128,0.2) 0%, transparent 70%), radial-gradient(60% 45% at 90% 90%, rgba(80,120,210,0.2) 0%, transparent 70%), #fbf6ef",
    og: "linear-gradient(135deg, #f6d4e1 0%, #f7e5b8 35%, #d3eadf 65%, #d7e0f4 100%)",
    surface: "rgba(255,253,250,0.72)",
    text: "#341a3a",
    muted: "#7b5a7e",
    accent: "#b42a66",
    accentText: "#fff8fb",
    secondary: "#fffdfb",
  },
  baby: {
    label: "Baby",
    background: "radial-gradient(130% 90% at 50% 0%, #f5f7fa 0%, #e4eaf2 58%, #d5deea 100%)",
    og: "linear-gradient(170deg, #f5f7fa 0%, #d5deea 100%)",
    surface: "rgba(255,255,255,0.64)",
    text: "#25324a",
    muted: "#546078",
    accent: "#506f9c",
    accentText: "#f7f9fc",
    secondary: "#fdfdff",
  },
  ivory: {
    label: "Ivory",
    background: "radial-gradient(130% 90% at 50% 0%, #fcfaf4 0%, #f2ebdb 58%, #e6dbc3 100%)",
    og: "linear-gradient(170deg, #fcfaf4 0%, #e6dbc3 100%)",
    surface: "rgba(255,254,250,0.64)",
    text: "#2f2a21",
    muted: "#665d4b",
    accent: "#896d3b",
    accentText: "#fffdf8",
    secondary: "#fffefa",
  },
  sky: {
    label: "Sky",
    background: "radial-gradient(130% 90% at 50% 0%, #f0f4f8 0%, #dbe5ef 58%, #c7d6e6 100%)",
    og: "linear-gradient(170deg, #f0f4f8 0%, #c7d6e6 100%)",
    surface: "rgba(255,255,255,0.62)",
    text: "#1c2a43",
    muted: "#4c5b74",
    accent: "#2e4d7c",
    accentText: "#f6f9fd",
    secondary: "#fcfdff",
  },
  midnight: {
    label: "Midnight",
    background: "radial-gradient(130% 90% at 40% 0%, #232a52 0%, #11152e 62%, #080a18 100%)",
    og: "linear-gradient(170deg, #232a52 0%, #080a18 100%)",
    surface: "rgba(235,235,255,0.07)",
    text: "#eeedf8",
    muted: "#b8b2dc",
    accent: "#c9a6c8",
    accentText: "#11152e",
    secondary: "rgba(235,235,255,0.1)",
  },
};
