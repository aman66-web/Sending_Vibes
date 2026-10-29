import { getI18n } from "@/i18n/server";

// The three promises people want to read before they pay: who takes the money, that
// they can try the card first, and what happens if it doesn't work. Each is already
// promised in the terms and help, so nothing here is new or made up.
export async function TrustStrip({ className = "" }: { className?: string }) {
  const { t } = await getI18n();
  const { secure, play, fix } = t.home.trust;
  const items = [
    {
      ...secure,
      // A padlock.
      icon: (
        <>
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
          <path d="M12 14.5v2.5" />
        </>
      ),
    },
    {
      ...play,
      // A play button.
      icon: <path d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l9.8-6.2a.8.8 0 0 0 0-1.4L9.7 5.1a.8.8 0 0 0-1.2.7Z" />,
    },
    {
      ...fix,
      // Arrows going round: put right, or money back.
      icon: (
        <>
          <path d="M19.5 12a7.5 7.5 0 0 1-13 5.1" />
          <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1" />
          <path d="M17.8 3.6v3.6h-3.6" />
          <path d="M6.2 20.4v-3.6h3.6" />
        </>
      ),
    },
  ];
  return (
    <ul className={`grid gap-5 sm:grid-cols-3 sm:gap-6 ${className}`}>
      {items.map((item) => (
        <li key={item.title} className="flex gap-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper text-hot">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {item.icon}
            </svg>
          </span>
          <div>
            <p className="font-brand text-lg font-bold leading-tight">{item.title}</p>
            <p className="mt-1 text-sm leading-snug text-ink/70">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
