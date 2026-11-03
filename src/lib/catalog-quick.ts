import type { Screen, ScreenStyle } from "./card";
import type { Template } from "./catalog";

// Quick asks: three screens and one runaway question, with a photo of what's being asked
// for above it. Short enough to send on a whim ("get me a coffee?") and made to be filmed:
// these are the cards in the shop's own videos. Unlike the fuller designs they have no
// photos screen or games, so they aren't held to the house standard in catalog-more.ts.

// Their snapshots come with the site (public/designs), so they work wherever it runs. Each
// buyer can swap theirs for a photo of their own in the editor.
const snap = (name: string) => `/designs/${name}`;

type Question = Extract<Screen, { type: "question" }>;

const intro = (title: string, subtitle: string, button: string, style: ScreenStyle, gotMail?: string): Screen => ({
  id: "intro",
  type: "intro",
  title,
  subtitle,
  button,
  style,
  ...(gotMail && { labels: { gotMail } }),
});

const ask = (q: Omit<Question, "id" | "type" | "labels">, noLines: string[]): Question => ({ id: "question", type: "question", ...q, labels: { noLines } });

const finale = (title: string, body: string, effect: Extract<Screen, { type: "finale" }>["effect"], style: ScreenStyle): Screen => ({
  id: "finale",
  type: "finale",
  title,
  body,
  effect,
  style,
});

export const QUICK_DESIGNS: Template[] = [
  {
    slug: "caramel-latte-run",
    name: "Caramel Latte Run",
    occasion: "friendship",
    tone: "funny",
    theme: "party",
    ambient: "confetti",
    emoji: "☕",
    headline: "Will you get me a caramel iced latte?",
    blurb: "For when they ask if you want anything. The No button runs off saying \"Large, please\" and \"Extra caramel\" until they give in, then a thank-you for the treat.",
    screens: (to, from) => [
      intro(`${to}, quick question`, `${from} has a very important request.`, "Open it", {
        background: ["#fbfaf6", "#efece2"], gradient: "glow", pattern: "grid", text: "#1f1d1a", accent: "#c62828", envelope: "#e6d3a8",
        heading: "typewriter", body: "typewriter", burst: "confetti", transition: "drop",
        stickers: [
          { emoji: "🥤", x: 9, y: 9, size: 11, rotate: 30, motion: "sway" },
          { emoji: "🧋", x: 9, y: 91, size: 11, rotate: 0, motion: "float" },
          { emoji: "☕", x: 91, y: 91, size: 11, rotate: 0, motion: "bounce" },
        ],
      }),
      {
        ...ask(
          { question: "Will you get me a caramel iced latte? ☕", yes: "Obviously", no: "No", afterYes: "Large, please. You're the best 🥰", photo: snap("caramel-latte.jpg") },
          ["Not an option", "Large, please", "Tap yes", "It's on your way", "Extra caramel", "Wrong button"],
        ),
        style: {
          background: ["#fff9cf", "#fff0a0"], gradient: "down", text: "#1f1d1a", accent: "#c62828",
          heading: "typewriter", body: "typewriter", burst: "confetti", transition: "zoom",
          stickers: [
            { emoji: "🙅", x: 9, y: 15, size: 11, rotate: 0, motion: "bounce" },
            { emoji: "☕", x: 9, y: 91, size: 10, rotate: -20, motion: "none" },
            { emoji: "🥤", x: 91, y: 91, size: 11, rotate: 15, motion: "sway" },
          ],
        },
      },
      finale("You're the best ☕", `Caramel iced latte, large. See you soon! ${from}`, "confetti", {
        background: ["#efece2", "#ddd6c4"], gradient: "glow", text: "#1f1d1a", accent: "#c62828",
        heading: "typewriter", body: "typewriter", transition: "zoom",
        stickers: [
          { emoji: "👋", x: 9, y: 15, size: 12, rotate: -10, motion: "sway" },
          { emoji: "🎉", x: 9, y: 91, size: 11, rotate: 0, motion: "bounce" },
          { emoji: "🥤", x: 91, y: 91, size: 11, rotate: 30, motion: "sway" },
          { emoji: "☕", x: 30, y: 13, size: 8, rotate: 0, motion: "float" },
        ],
      }),
    ],
    demo: { to: "Maya", from: "Josh" },
  },
  {
    slug: "sorry-i-fell-asleep",
    name: "Sorry, I Fell Asleep",
    occasion: "sorry",
    tone: "funny",
    theme: "lavender",
    ambient: "hearts",
    emoji: "😴",
    headline: "I fell asleep. Forgive me?",
    blurb: "For the eight-hour gap before you replied. Your excuse, a No button that keeps offering boba, and a make-up date at the end.",
    screens: (to, from) => [
      intro(`${to}, about those 8 hours…`, `${from} has an explanation.`, "Go on…", {
        background: ["#f5f1ff", "#ded4ff"], gradient: "glow", text: "#271a4f", accent: "#6439e6", envelope: "#6439e6",
        heading: "marker", body: "rounded", burst: "hearts", transition: "drop",
        stickers: [
          { emoji: "🥺", x: 9, y: 8, size: 11, rotate: -12, motion: "bounce" },
          { emoji: "🙏", x: 91, y: 91, size: 12, rotate: 10, motion: "sway" },
          { emoji: "💐", x: 9, y: 92, size: 10, rotate: 8, motion: "bounce" },
        ],
      }),
      {
        ...ask(
          { question: "I fell asleep. Forgive me?", yes: "Fine 🙄", no: "No", afterYes: "Thank you! Boba's on me 🧋", photo: snap("fell-asleep.jpg") },
          ["Come on, I'll get us boba", "I said I'm sorry", "Pretty please?", "Look at my sad face", "Wrong button"],
        ),
        style: {
          background: ["#edf1ff", "#d3defc"], gradient: "diagonal", pattern: "dots", text: "#1c2552", accent: "#4447cf",
          heading: "marker", body: "rounded", burst: "hearts", transition: "drop",
          stickers: [
            { emoji: "🥺", x: 10, y: 16, size: 9, rotate: 10, motion: "bounce" },
            { emoji: "🙏", x: 9, y: 90, size: 11, rotate: -8, motion: "sway" },
            { emoji: "🍕", x: 90, y: 92, size: 9, rotate: -12, motion: "bounce" },
          ],
        },
      },
      finale("Boba date?", `Tomorrow, my treat. I'll reply faster. Promise. ${from}`, "hearts", {
        background: ["#edf1ff", "#d3defc"], gradient: "diagonal", pattern: "dots", text: "#1c2552", accent: "#4447cf",
        heading: "marker", body: "rounded", transition: "drop",
        stickers: [
          { emoji: "🍕", x: 10, y: 16, size: 11, rotate: 10, motion: "bounce" },
          { emoji: "🍫", x: 9, y: 90, size: 13, rotate: -8, motion: "sway" },
          { emoji: "💐", x: 90, y: 92, size: 11, rotate: -12, motion: "bounce" },
          { emoji: "🥺", x: 95, y: 55, size: 9, rotate: 8, motion: "sway" },
          { emoji: "💜", x: 5, y: 66, size: 9, rotate: -10, motion: "bounce" },
        ],
      }),
    ],
    demo: { to: "Maya", from: "Jake" },
  },
  {
    slug: "coming-home-for-diwali",
    name: "Coming Home for Diwali?",
    occasion: "diwali",
    tone: "funny",
    theme: "marigold",
    ambient: "sparkles",
    emoji: "🪔",
    headline: "Are you coming home for Diwali?",
    blurb: "From home to whoever's away. Every time they reach for No it reminds them nani is already cooking and their room is ready, then fireworks and a \"see you Saturday\".",
    screens: (to, from) => [
      intro(
        `${to}, a message from home 🪔`,
        `From ${from}, to the family group chat.`,
        "Open it",
        {
          background: ["#2a0c22", "#4a1a3c"], gradient: "glow", text: "#fdf0d5", accent: "#f4a300", envelope: "#c2410c",
          heading: "classic", body: "modern", burst: "sparkles", transition: "fade",
          stickers: [
            { emoji: "🪔", x: 8, y: 9, size: 12, motion: "pulse" },
            { emoji: "🌼", x: 8, y: 90, size: 12, motion: "spin" },
            { emoji: "✨", x: 92, y: 90, size: 10, motion: "pulse" },
          ],
        },
        "A little festival of lights",
      ),
      {
        ...ask(
          {
            question: "Are you coming home for Diwali? 🪔",
            // "Yes Mum", "Yes Dad"; anything longer would crowd the button.
            yes: from && from.length <= 12 ? `Yes ${from}` : "Yes!",
            no: "No",
            afterYes: "Good. Your nani is making your favourite 🥰",
            photo: snap("diwali-diyas.jpg"),
          },
          ["Your nani is already cooking", "Your room is ready", "I'll call your dad", "I've told everyone you're coming", "Wrong button, beta"],
        ),
        style: {
          background: ["#5c0b3b", "#80124f"], gradient: "diagonal", text: "#fde8c0", accent: "#f2a93b",
          heading: "script", body: "storybook", burst: "petals", transition: "bounce",
          stickers: [
            { emoji: "🎀", x: 9, y: 91, size: 11, rotate: 10, motion: "sway" },
            { emoji: "✨", x: 9, y: 15, size: 9, rotate: 0, motion: "pulse" },
            { emoji: "🌼", x: 91, y: 91, size: 11, rotate: 0, motion: "spin" },
          ],
        },
      },
      finale("Happy Diwali ✨", `See you Saturday. Bring your washing. Love, ${from}`, "fireworks", {
        background: ["#2a0c22", "#4a1a3c"], gradient: "glow", text: "#fdf0d5", accent: "#f4a300",
        heading: "classic", body: "modern", transition: "zoom",
        stickers: [
          { emoji: "🪔", x: 8, y: 14, size: 12, motion: "pulse" },
          { emoji: "🎆", x: 8, y: 90, size: 12 },
          { emoji: "✨", x: 92, y: 90, size: 10, motion: "pulse" },
        ],
      }),
    ],
    demo: { to: "Maya", from: "Mum" },
  },
];
