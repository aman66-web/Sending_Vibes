import type { Occasion } from "./card";

// When each occasion next comes round, for the "coming up" strip and occasion pages.

export type DatedOccasion = { occasion: Occasion; name: string; date: Date; approx: boolean };

// Festivals that follow the moon move every year, so they're listed by hand.
// Eid and Raksha Bandhan depend on the moon and can shift by a day.
// Add the next year's dates before the list runs out (it ends with 2028).
const LUNAR: { occasion: Occasion; name: string; date: string; approx?: boolean }[] = [
  { occasion: "diwali", name: "Diwali", date: "2026-11-08" },
  { occasion: "eid", name: "Eid al-Fitr", date: "2027-03-09", approx: true },
  { occasion: "holi", name: "Holi", date: "2027-03-22" },
  { occasion: "eid", name: "Eid al-Adha", date: "2027-05-16", approx: true },
  { occasion: "rakhi", name: "Raksha Bandhan", date: "2027-08-17", approx: true },
  { occasion: "diwali", name: "Diwali", date: "2027-10-29" },
  { occasion: "eid", name: "Eid al-Fitr", date: "2028-02-27", approx: true },
  { occasion: "holi", name: "Holi", date: "2028-03-10", approx: true },
  { occasion: "eid", name: "Eid al-Adha", date: "2028-05-05", approx: true },
  { occasion: "rakhi", name: "Raksha Bandhan", date: "2028-08-04", approx: true },
  { occasion: "diwali", name: "Diwali", date: "2028-10-17" },
];

const FIXED: { occasion: Occasion; name: string; month: number; day: number }[] = [
  { occasion: "newyear", name: "New Year", month: 1, day: 1 },
  { occasion: "valentine", name: "Valentine's Day", month: 2, day: 14 },
  { occasion: "halloween", name: "Halloween", month: 10, day: 31 },
  { occasion: "christmas", name: "Christmas", month: 12, day: 25 },
];

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

// Easter Sunday (Gregorian), via the anonymous computus.
function easter(y: number) {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(y, month, day);
}

const DAY = 86_400_000;

function datesFor(year: number): DatedOccasion[] {
  const thirdSundayOfJune = (() => {
    const first = utc(year, 6, 1);
    const firstSunday = 1 + ((7 - first.getUTCDay()) % 7);
    return utc(year, 6, firstSunday + 14);
  })();
  return [
    ...FIXED.map((f) => ({ occasion: f.occasion, name: f.name, date: utc(year, f.month, f.day), approx: false })),
    // UK dates: Mothering Sunday is three weeks before Easter; Father's Day is the third Sunday in June.
    { occasion: "mothersday", name: "Mother's Day (UK)", date: new Date(easter(year).getTime() - 21 * DAY), approx: false },
    { occasion: "fathersday", name: "Father's Day", date: thirdSundayOfJune, approx: false },
  ];
}

// Today's date as it is in the UK, where most people sending cards are.
function today(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return utc(part("year"), part("month"), part("day"));
}

export function upcoming(now = new Date(), count = 4): (DatedOccasion & { days: number })[] {
  const start = today(now);
  const year = start.getUTCFullYear();
  const all: DatedOccasion[] = [
    ...datesFor(year),
    ...datesFor(year + 1),
    ...LUNAR.map((l) => ({ occasion: l.occasion, name: l.name, date: new Date(`${l.date}T00:00:00Z`), approx: !!l.approx })),
  ];
  return all
    .filter((d) => d.date >= start)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count)
    .map((d) => ({ ...d, days: Math.round((d.date.getTime() - start.getTime()) / DAY) }));
}

export function nextDate(occasion: Occasion, now = new Date()) {
  return upcoming(now, 50).find((d) => d.occasion === occasion);
}

export function whenLabel(days: number) {
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  if (days < 60) return `In ${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? "" : "s"}`;
  return `In ${Math.round(days / 30)} months`;
}

export function formatDay(date: Date, approx = false) {
  const s = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  return approx ? `around ${s}` : s;
}
