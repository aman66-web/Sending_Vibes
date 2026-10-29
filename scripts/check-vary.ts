// Checks restyle (src/lib/vary.ts) over every design and a card styled like the AI's:
// npx tsx scripts/check-vary.ts
// A new look must never change a word, a screen, their order, a game or a list, so the
// card still validates and is priced the same; their photos, text boxes, own stickers and
// favourite colour stay as they were; the words stay readable; and the same seed always
// gives the same look.
import { cardSchema, type CardData, type Screen, type ScreenStyle } from "../src/lib/card";
import { TEMPLATES, buildCard, cardTier } from "../src/lib/catalog";
import { contrast, screenLook } from "../src/lib/screen-style";
import { themes } from "../src/lib/themes";
import { PALETTES, isOurSticker, restyle, toPalette } from "../src/lib/vary";

let failures = 0;
let checks = 0;
function expect(ok: boolean, what: string) {
  checks++;
  if (ok) return;
  failures++;
  if (failures <= 40) console.error(`✗ ${what}`);
}

const json = (v: unknown) => JSON.stringify(v);
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const mid = (bg: string[]) => (bg.length === 1 ? bg[0] : bg[Math.floor(bg.length / 2)]);
const themeHexes = (card: CardData) => themes[card.theme].background.match(/#[0-9a-fA-F]{6}/g) ?? [];
const backgroundOf = (card: CardData, s: Screen) => s.style?.background ?? themeHexes(card);
const worst = (c: string, bg: string[]) => Math.min(...bg.map((b) => contrast(c, b)));

// Everything but the look: the words, screens, order, games, lists, photos, labels, names.
function words(card: CardData) {
  const { theme: _t, ambient: _a, ...rest } = card;
  void _t;
  void _a;
  return {
    ...rest,
    screens: card.screens.map((s) => {
      const copy = { ...s } as Record<string, unknown>;
      delete copy.style;
      if (s.type === "finale") delete copy.effect;
      return copy;
    }),
  };
}

// Their own things on each screen: text boxes, photos, and stickers that aren't ours.
const theirs = (card: CardData) => card.screens.map((s) => ({ texts: s.style?.texts ?? [], images: s.style?.images ?? [], stickers: (s.style?.stickers ?? []).filter((x) => !isOurSticker(x)), tune: s.style?.tune }));

function checkLook(before: CardData, after: CardData, label: string, opts: { gentle?: boolean; favourite?: string } = {}) {
  expect(cardSchema.safeParse(after).success, `${label}: validates (${cardSchema.safeParse(after).error?.issues[0]?.message})`);
  expect(json(after.screens.map((s) => [s.id, s.type])) === json(before.screens.map((s) => [s.id, s.type])), `${label}: same screens in the same order`);
  expect(json(words(after)) === json(words(before)), `${label}: words unchanged`);
  expect(cardTier(after) === cardTier(before), `${label}: same price tier`);
  expect(json(theirs(after)) === json(theirs(before)), `${label}: their text boxes, photos, stickers and tunes kept`);
  expect(after.ambient !== "fireworks", `${label}: no fireworks in the background`);
  for (const [i, s] of after.screens.entries()) {
    const style: ScreenStyle = s.style ?? {};
    const ours = (style.stickers ?? []).filter(isOurSticker);
    expect((style.stickers?.length ?? 0) <= 10, `${label} #${i}: at most 10 stickers`);
    if (s.type === "game") expect(ours.length === 0, `${label} #${i}: no stickers of ours on a game`);
    for (const st of ours) {
      expect(!(st.x > 75 && st.y < 22), `${label} #${i}: top right kept clear (${st.x}, ${st.y})`);
      expect(st.x < 15 || st.x > 85 || st.y < 14 || st.y > 86, `${label} #${i}: sticker near an edge (${st.x}, ${st.y})`);
    }
    // Readable as drawn, and as we picked it (well above screen-style's own minimum).
    const look = screenLook(themes[after.theme], style);
    const bg = backgroundOf(after, s);
    expect(worst(look.theme.text, bg) >= 4.5, `${label} #${i}: words read clearly (${look.theme.text} on ${bg.join(" ")}: ${worst(look.theme.text, bg).toFixed(2)})`);
    if (style.text && style.background) expect(worst(style.text, style.background) >= 4.5, `${label} #${i}: chosen text colour reads (${worst(style.text, style.background).toFixed(2)})`);
    if (style.accent && !opts.favourite) expect(worst(style.accent, bg) >= 2, `${label} #${i}: button colour stands out (${style.accent} ${worst(style.accent, bg).toFixed(2)})`);
    if (opts.favourite && before.screens[i].style?.accent === opts.favourite) expect(style.accent === opts.favourite, `${label} #${i}: favourite colour kept`);
  }
  if (opts.gentle) {
    expect(after.theme === before.theme, `${label}: gentle keeps the theme`);
    expect(after.ambient === before.ambient, `${label}: gentle keeps the background effect`);
    expect(json(after.screens.map((s) => [s.style?.background, s.style?.text, s.style?.body, s.type === "finale" ? s.effect : 0])) === json(before.screens.map((s) => [s.style?.background, s.style?.text, s.style?.body, s.type === "finale" ? s.effect : 0])), `${label}: gentle keeps backgrounds, text colours, body font and finale`);
  }
}

// ---------- The palettes themselves ----------
for (const p of PALETTES) {
  const levels = [p.deep, p.accent, p.soft, p.light].map(lum);
  expect(levels.every((l, i) => i === 0 || l > levels[i - 1]), `${p.key}: deep, accent, soft, light run dark to light`);
  expect(contrast(p.deep, p.soft) >= 7 && contrast(p.deep, p.light) >= 7, `${p.key}: deep words read on pale backgrounds`);
  expect(contrast(p.light, p.deep) >= 7, `${p.key}: light words read on deep backgrounds`);
  // Moving a colour across keeps its lightness, and a palette's own ramp maps onto itself.
  for (const c of ["#000000", "#14213d", "#e94560", "#ffb3c6", "#f6efe0", "#ffffff"]) {
    const moved = toPalette(p, c);
    expect(Math.abs(lum(moved) - lum(c)) < 0.02 || lum(c) < lum(p.deep) * 0.4 || lum(c) > 0.97, `${p.key}: ${c} keeps its lightness (${moved})`);
    expect(toPalette(p, moved) === moved || Math.abs(lum(toPalette(p, moved)) - lum(moved)) < 0.01, `${p.key}: ${c} maps onto itself`);
  }
}
for (const occasion of new Set(TEMPLATES.map((t) => t.occasion))) {
  expect(PALETTES.filter((p) => p.occasions.includes(occasion)).length >= 4, `${occasion}: at least four palettes suit it`);
}

// ---------- Every design ----------
const SEEDS = ["a", "b", "c", "lily-1", "x9z", "2026"];
for (const t of TEMPLATES) {
  const card = buildCard(t, "Lily", "Sam");
  const frozen = json(card);
  for (const seed of SEEDS) {
    const full = restyle(card, seed);
    checkLook(card, full, `${t.slug} new look ${seed}`);
    expect(json(restyle(card, seed)) === json(full), `${t.slug} ${seed}: same seed, same look`);
    const gentle = restyle(card, seed, { gentle: true, favourite: null });
    checkLook(card, gentle, `${t.slug} gentle ${seed}`, { gentle: true });
    expect(gentle.screens.some((s) => s.style?.stickers?.some(isOurSticker)), `${t.slug} gentle ${seed}: some stickers of its own`);
  }
  expect(json(card) === frozen, `${t.slug}: the card passed in isn't changed`);
  // Stepping through looks, as the button does, starting from the gentle one they're given.
  let look = restyle(card, "open", { gentle: true, favourite: null });
  for (let n = 1; n <= 8; n++) {
    const next = restyle(look, `step:${n}`);
    checkLook(card, next, `${t.slug} look ${n}`);
    expect(next.screens.every((s) => (s.style?.stickers ?? []).filter(isOurSticker).length <= 3), `${t.slug} look ${n}: stickers don't pile up`);
    expect(json(next.screens.map((s) => s.style?.background)) !== json(look.screens.map((s) => s.style?.background)), `${t.slug} look ${n}: each tap changes the colours`);
    look = next;
  }
}

// Variety: the same design for different people.
{
  const t = TEMPLATES[0];
  const card = buildCard(t, "Lily", "Sam");
  const seeds = Array.from({ length: 40 }, (_, i) => `person-${i}`);
  const palettes = new Set(seeds.map((s) => restyle(card, s).screens[0].style?.background?.join()));
  const gentle = new Set(seeds.map((s) => json(restyle(card, s, { gentle: true, favourite: null }).screens.map((x) => x.style))));
  expect(palettes.size >= 6, `variety: 40 new looks use ${palettes.size} palettes`);
  expect(gentle.size === seeds.length, `variety: 40 people's copies of ${t.slug} all look different (${gentle.size})`);
}

// A favourite colour on a ready-made design becomes its buttons when it reads well.
{
  const card = buildCard(TEMPLATES[0], "Lily", "Sam");
  const gentle = restyle(card, "fav", { gentle: true, favourite: "#2563eb" });
  checkLook(card, gentle, "favourite on a design", { gentle: true });
  expect(gentle.screens.every((s) => s.style?.accent === "#2563eb"), "favourite on a design: it's the button colour");
  const again = restyle(gentle, "fav-2");
  expect(again.screens.every((s) => s.style?.accent === "#2563eb"), "favourite on a design: a new look keeps it, in case");
}

// ---------- A card styled like the AI's ----------
const photo = "/api/photos/abc123.jpg";
const ai: CardData = {
  occasion: "birthday",
  theme: "midnight",
  to: "Lily",
  from: "Sam",
  ambient: "stars",
  music: "birthday",
  device: "everywhere",
  layout: "standard",
  screens: [
    { id: "intro", type: "intro", title: "Lily!", subtitle: "Open it", button: "Go", style: { background: ["#14213d", "#1f2f5c"], gradient: "glow", text: "#ffffff", accent: "#8b5cf6", envelope: "#f2c6de", heading: "script", body: "modern", effect: "stars", stickers: [{ emoji: "🌙", x: 8, y: 9, size: 12, motion: "float" }, { emoji: "⭐", x: 10, y: 90, size: 10 }], transition: "fade" } },
    { id: "q", type: "question", question: "Cake?", yes: "Yes", no: "No", afterYes: "Good", style: { background: ["#fff1f2"], text: "#4a1626", accent: "#8b5cf6", pattern: "dots", burst: "balloons", texts: [{ text: "Hi Lily", x: 50, y: 20, size: 8, color: "#9d174d", font: "marker" }] } },
    { id: "game", type: "game", game: "pop-balloons", title: "Pop", instructions: "Pop them", winText: "Yay", style: { background: ["#0f172a"], text: "#e2e8f0", accent: "#f59e0b", tune: { speed: 0.5, goal: 5 } } },
    { id: "photos", type: "photos", title: "Us", photos: [photo], captions: ["Beach"], style: { images: [{ src: photo, x: 30, y: 60, size: 40, frame: "polaroid" }] } },
    { id: "msg", type: "message", title: "Dear Lily", body: "Happy birthday.\n\nLove, Sam", style: { background: ["#1e293b", "#0f172a", "#020617"], gradient: "down", text: "#fef3c7", accent: "#8b5cf6", heading: "classic", effect: "sparkles" } },
    { id: "finale", type: "finale", title: "Happy birthday!", body: "x", effect: "fireworks", style: { background: ["#14213d", "#1f2f5c"], text: "#ffffff", accent: "#8b5cf6", stickers: [{ emoji: "🎈", x: 90, y: 88.5, size: 14.2 }] } },
  ],
};
expect(cardSchema.safeParse(ai).success, "the AI-like card itself validates");
const aiFrozen = json(ai);
for (const [favourite, label] of [[undefined, "not known"], ["#8b5cf6", "known"], [null, "none"]] as const) {
  let look = ai;
  for (let n = 1; n <= 6; n++) {
    const next = restyle(look, `ai-${label}-${n}`, favourite === undefined ? {} : { favourite });
    checkLook(ai, next, `AI card (favourite ${label}) look ${n}`, { favourite: favourite ?? undefined });
    // The way it was designed survives: dark screens stay dark, pale ones pale.
    for (const [i, s] of next.screens.entries()) {
      expect(lum(mid(backgroundOf(next, s))) < 0.18 === lum(mid(backgroundOf(ai, ai.screens[i]))) < 0.18, `AI card (${label}) look ${n} #${i}: stays ${lum(mid(backgroundOf(ai, ai.screens[i]))) < 0.18 ? "dark" : "pale"}`);
      const was = ai.screens[i].style?.accent;
      if (was === "#8b5cf6") expect((s.style?.accent === was) === (favourite !== null), `AI card (${label}) look ${n} #${i}: favourite colour ${favourite === null ? "free to change" : "kept"}`);
    }
    look = next;
  }
}
expect(json(ai) === aiFrozen, "AI card: the card passed in isn't changed");

// A card saved before most of these fields existed, and one with stickers they placed.
{
  const old = { occasion: "valentine", theme: "rose", to: "A", from: "B", ambient: "hearts", screens: [{ id: "intro", type: "intro", title: "Hi", subtitle: "x", button: "Open" }, { id: "finale", type: "finale", title: "Bye", body: "x", effect: "hearts" }] } as CardData;
  checkLook(old, restyle(old, "old"), "old saved card");
  checkLook(old, restyle(old, "old", { gentle: true }), "old saved card, gentle", { gentle: true });
  const placed: CardData = { ...old, screens: old.screens.map((s, i) => (i === 0 ? { ...s, style: { stickers: [{ emoji: "💕", x: 50, y: 40, size: 14, motion: "none" }, { emoji: "🌹", x: 12.3, y: 80.5, size: 11.4 }] } } : s)) };
  const relooked = restyle(restyle(placed, "p1"), "p2");
  expect(json(relooked.screens[0].style?.stickers?.filter((s) => !isOurSticker(s))) === json(placed.screens[0].style?.stickers), "stickers they added or dragged are kept");
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures) {
  console.error(`${failures} failed`);
  process.exit(1);
}
