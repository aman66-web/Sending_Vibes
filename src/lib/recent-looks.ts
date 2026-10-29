// The looks (the writer's "direction" for colours, fonts and feel) of the last few cards
// made on this device, newest first. Sent along with a new card so the writer steers away
// from them, and each card comes out different from the last. Only a nicety: if the
// browser won't store it, cards are made just the same.

const KEY = "sv-recent-looks";
const KEEP = 6;

export function recentLooks(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((d): d is string => typeof d === "string" && d.length > 0 && d.length <= 40).slice(0, KEEP);
  } catch {
    return [];
  }
}

export function rememberLook(direction: string | undefined) {
  const look = direction?.trim();
  if (!look || look.length > 40) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([look, ...recentLooks().filter((d) => d !== look)].slice(0, KEEP)));
  } catch {}
}
