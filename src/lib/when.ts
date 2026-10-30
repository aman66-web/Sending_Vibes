// The day, time and time zone a card is booked to arrive at. Shared by the basket (which offers
// the choices), the checkout (which works the moment out again for itself) and the pages and
// emails that say when it's coming. Nothing here is server-only.

// Where people most often send cards to, with the country each time zone is in, so it can be
// named in the visitor's own language. The buyer's own zone is offered too if it isn't here.
export const ZONES: { zone: string; region: string }[] = [
  { zone: "Europe/London", region: "GB" },
  { zone: "Europe/Dublin", region: "IE" },
  { zone: "Europe/Lisbon", region: "PT" },
  { zone: "Europe/Madrid", region: "ES" },
  { zone: "Europe/Paris", region: "FR" },
  { zone: "Europe/Amsterdam", region: "NL" },
  { zone: "Europe/Berlin", region: "DE" },
  { zone: "Europe/Rome", region: "IT" },
  { zone: "Europe/Warsaw", region: "PL" },
  { zone: "Europe/Athens", region: "GR" },
  { zone: "Europe/Istanbul", region: "TR" },
  { zone: "Africa/Lagos", region: "NG" },
  { zone: "Africa/Cairo", region: "EG" },
  { zone: "Africa/Nairobi", region: "KE" },
  { zone: "Africa/Johannesburg", region: "ZA" },
  { zone: "Asia/Riyadh", region: "SA" },
  { zone: "Asia/Dubai", region: "AE" },
  { zone: "Asia/Karachi", region: "PK" },
  { zone: "Asia/Kolkata", region: "IN" },
  { zone: "Asia/Kathmandu", region: "NP" },
  { zone: "Asia/Dhaka", region: "BD" },
  { zone: "Asia/Singapore", region: "SG" },
  { zone: "Asia/Kuala_Lumpur", region: "MY" },
  { zone: "Asia/Hong_Kong", region: "HK" },
  { zone: "Asia/Shanghai", region: "CN" },
  { zone: "Asia/Tokyo", region: "JP" },
  { zone: "Australia/Perth", region: "AU" },
  { zone: "Australia/Sydney", region: "AU" },
  { zone: "Pacific/Auckland", region: "NZ" },
  { zone: "America/Toronto", region: "CA" },
  { zone: "America/Vancouver", region: "CA" },
  { zone: "America/New_York", region: "US" },
  { zone: "America/Chicago", region: "US" },
  { zone: "America/Denver", region: "US" },
  { zone: "America/Los_Angeles", region: "US" },
  { zone: "America/Mexico_City", region: "MX" },
  { zone: "America/Sao_Paulo", region: "BR" },
];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isTime = (time: string) => TIME.test(time);

// The time a card arrives when nobody's picked one: the morning, as it always was.
export const DEFAULT_TIME = "09:00";

export function isZone(zone: string) {
  if (!zone || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

// The visitor's own time zone, as their device has it.
export function ownZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && isZone(zone) ? zone : "UTC";
  } catch {
    return "UTC";
  }
}

// How far `zone` is ahead of UTC at the moment `at`, in milliseconds.
function offset(at: number, zone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(at)
      .map((p) => [p.type, Number(p.value)]),
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(at / 1000) * 1000;
}

// The moment it's `time` (HH:MM) on `day` (YYYY-MM-DD) in `zone`, in milliseconds, or NaN if
// any of them isn't right. Worked out twice so a day the clocks change still comes out right.
export function zonedMoment(day: string, time: string, zone: string) {
  if (!DAY.test(day) || !isTime(time) || !isZone(zone)) return NaN;
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  if (Number.isNaN(wall)) return NaN;
  const first = wall - offset(wall, zone);
  return wall - offset(first, zone);
}

// What a time zone is called in the visitor's language: the country, and where a country has
// more than one, which part ("United States – Pacific Time"). A zone not in the list goes by
// its own name ("Western European Time").
export function zoneName(zone: string, tag: string) {
  const generic = () => {
    try {
      return (
        new Intl.DateTimeFormat(tag, {
          timeZone: zone,
          timeZoneName: "longGeneric",
        })
          .formatToParts(Date.now())
          .find((p) => p.type === "timeZoneName")?.value ?? zone
      );
    } catch {
      return zone.split("/").pop()!.replace(/_/g, " ");
    }
  };
  const known = ZONES.find((z) => z.zone === zone);
  if (!known) return generic();
  let country = known.region;
  try {
    country = new Intl.DisplayNames([tag], { type: "region" }).of(known.region) ?? known.region;
  } catch {}
  return ZONES.filter((z) => z.region === known.region).length > 1 ? `${country} – ${generic()}` : country;
}

// "09:00" written the way the visitor's language writes times ("9:00 am", "09:00").
export function clockTime(time: string, tag: string) {
  const [hh, mm] = (isTime(time) ? time : DEFAULT_TIME).split(":").map(Number);
  return new Intl.DateTimeFormat(tag, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(Date.UTC(2000, 0, 1, hh, mm));
}

// The time it is right now in `zone`, for "It's 3:42 pm there now".
export function timeThereNow(zone: string, tag: string) {
  try {
    return new Intl.DateTimeFormat(tag, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: zone,
    }).format(Date.now());
  } catch {
    return "";
  }
}

// The day, written out in the visitor's language ("31 October 2026").
export function longDay(day: string, tag: string) {
  if (!DAY.test(day)) return "";
  return new Intl.DateTimeFormat(tag, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

// The zones to choose from, the buyer's own first, the rest in alphabetical order.
export function zoneChoices(tag: string, own: string) {
  const names = ZONES.filter((z) => z.zone !== own).map((z) => ({
    zone: z.zone,
    name: zoneName(z.zone, tag),
  }));
  names.sort((a, b) => a.name.localeCompare(b.name, tag));
  return [{ zone: own, name: zoneName(own, tag) }, ...names];
}
