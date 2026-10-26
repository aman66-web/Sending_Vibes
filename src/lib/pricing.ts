// Every card is paid. One place for prices so the site never disagrees with itself.
export const PRICES = {
  card: { label: "£3.99", pence: 399 },
  aiCustom: { label: "£9.99", pence: 999 },
} as const;
