// Kept outside the client component so the server can read it too.
export const SHOWCASE = ["valentine", "birthday", "diwali", "halloween", "christmas"] as const;
export type ShowcaseOccasion = (typeof SHOWCASE)[number];
