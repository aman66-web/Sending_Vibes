// Cards bought in this browser (saved by the thank-you page), so the buyer tapping their own
// plain link to check it isn't counted as the card being opened (components/card/OpenedBeacon.tsx).
// Only kept on this device; storage that's blocked just means nothing is skipped.

const KEY = "sv-mine";
// Plenty for anyone's cards, without growing for ever.
const KEEP = 200;

function read(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberMine(ids: string[]) {
  try {
    const kept = read().filter((id) => !ids.includes(id));
    localStorage.setItem(KEY, JSON.stringify([...kept, ...ids].slice(-KEEP)));
  } catch {}
}

export const isMine = (id: string) => read().includes(id);
