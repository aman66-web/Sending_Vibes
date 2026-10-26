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
};

export const themes: Record<ThemeName, Theme> = {
  rose: {
    label: "Rose",
    background: "linear-gradient(160deg, #ffe4ec 0%, #ffc2d4 45%, #ff9ebb 100%)",
    surface: "rgba(255,255,255,0.72)",
    text: "#4a0d24",
    muted: "#8a3b58",
    accent: "#e11d63",
    accentText: "#ffffff",
    secondary: "#ffffff",
  },
  marigold: {
    label: "Marigold",
    background: "radial-gradient(circle at 50% 0%, #5b1a7a 0%, #2a0b3d 55%, #14051f 100%)",
    surface: "rgba(255,240,210,0.1)",
    text: "#fff4dc",
    muted: "#f3c97a",
    accent: "#f59e0b",
    accentText: "#2a0b3d",
    secondary: "rgba(255,255,255,0.12)",
  },
  party: {
    label: "Party",
    background: "linear-gradient(150deg, #dbeafe 0%, #e9d5ff 50%, #fde68a 100%)",
    surface: "rgba(255,255,255,0.75)",
    text: "#1e1b4b",
    muted: "#4c4a7a",
    accent: "#7c3aed",
    accentText: "#ffffff",
    secondary: "#ffffff",
  },
  midnight: {
    label: "Midnight",
    background: "radial-gradient(circle at 30% 10%, #1e3a8a 0%, #0b1238 60%, #050816 100%)",
    surface: "rgba(255,255,255,0.08)",
    text: "#eef2ff",
    muted: "#a5b4fc",
    accent: "#f472b6",
    accentText: "#ffffff",
    secondary: "rgba(255,255,255,0.12)",
  },
};
