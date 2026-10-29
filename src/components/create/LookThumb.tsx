import { lookStyle, type Look } from "@/lib/looks";
import { FONT_VARS, screenLook } from "@/lib/screen-style";
import { themes } from "@/lib/themes";

// A look drawn small with plain CSS, for picking from: its background and pattern, an
// opened envelope in its colours with the letter peeking out ("For Lily" in its heading
// font) and two of its stickers. No card player in each tile, so a page of them stays
// quick on an old phone. The tile is card artwork, so it's in English like the cards.
export function LookThumb({ look, name, className = "" }: { look: Look; name: string; className?: string }) {
  // The same colours a screen in this look gets, words kept readable (lib/screen-style.ts).
  const { theme, pattern, envelope } = screenLook(themes[look.theme], lookStyle(look));
  const paper = envelope?.paper ?? "#f6efe0";
  const shade = envelope?.shade ?? "#ebe1cb";
  const accent = theme.accent;
  const [first, second] = look.stickers;
  return (
    <div
      aria-hidden
      lang="en"
      dir="ltr"
      className={`@container relative aspect-[4/5] select-none overflow-hidden ${className}`}
      style={{ background: theme.background, color: theme.text }}
    >
      {pattern && <div className="absolute inset-0" style={{ backgroundImage: pattern.image, backgroundSize: pattern.size }} />}
      {/* A printed border, like the cards. */}
      <div className="absolute inset-[4%] rounded-[3cqw] border border-current opacity-[0.18]" />

      {/* The envelope, opened: its flap folded back, airmail lining inside, the letter
          coming out and the front pocket over it. */}
      <div
        className="absolute inset-x-[13%] top-[20%] h-[30.5%] [clip-path:polygon(0_100%,50%_0,100%_100%)]"
        style={{ background: `color-mix(in srgb, ${accent} 82%, black)` }}
      />
      <div
        className="absolute inset-x-[13%] bottom-[12%] top-[50%] rounded-[1.5cqw] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.5)]"
        style={{ background: `repeating-linear-gradient(135deg, ${accent} 0 2.4cqw, color-mix(in srgb, ${accent} 72%, white) 2.4cqw 4.8cqw)` }}
      />
      <div className="absolute inset-x-[19%] bottom-[16%] top-[25%] flex flex-col items-center rounded-[1cqw] bg-[#fffdf8] px-[5%] pt-[6%] text-[#2b2318] shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
        <span className="text-[4.6cqw] font-semibold uppercase leading-none tracking-[0.25em] opacity-60" style={{ fontFamily: `var(${FONT_VARS[look.body]})` }}>
          For
        </span>
        <span
          className="mt-[4%] max-w-full truncate text-[9.5cqw] font-semibold italic leading-[1.3]"
          style={{ fontFamily: `var(${FONT_VARS[look.heading]})`, fontSynthesis: "none" }}
        >
          {name}
        </span>
      </div>
      <div className="absolute inset-x-[13%] bottom-[12%] top-[50%] drop-shadow-[0_-1px_1px_rgba(0,0,0,0.16)]">
        <div
          className="h-full w-full rounded-[1.5cqw] [clip-path:polygon(0_0,50%_45%,100%_0,100%_100%,0_100%)]"
          style={{ background: `linear-gradient(180deg, ${paper} 0%, ${shade} 100%)` }}
        />
      </div>
      {/* The wax seal, at the point of the pocket. */}
      <div
        className="absolute left-1/2 top-[67%] grid aspect-square w-[12%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        style={{ background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${accent} 65%, white) 0%, ${accent} 45%, color-mix(in srgb, ${accent} 55%, black) 100%)` }}
      >
        <div className="h-[68%] w-[68%] rounded-full ring-1 ring-white/40" />
      </div>

      {first && <span className="absolute bottom-[4%] left-[4%] -rotate-12 text-[14cqw] leading-none drop-shadow-sm">{first}</span>}
      {second && <span className="absolute right-[5%] top-[44%] rotate-12 text-[12cqw] leading-none drop-shadow-sm">{second}</span>}
    </div>
  );
}
