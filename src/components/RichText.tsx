import Link from "next/link";

// Dictionary text can carry **bold** and [links](/path) to our own pages.
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g;

export function RichText({ text, linkClass = "font-semibold underline decoration-hot decoration-2 underline-offset-4" }: { text: string; linkClass?: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    parts.push(text.slice(last, match.index));
    parts.push(
      match[1] ? (
        <b key={match.index}>{match[1]}</b>
      ) : (
        <Link key={match.index} href={match[3]} className={linkClass}>
          {match[2]}
        </Link>
      ),
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}
