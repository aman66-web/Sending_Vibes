"use client";

import { useEffect, useState } from "react";
import { playMusic, unlockAudio } from "@/components/card/sound";
import { useI18n } from "@/i18n/client";
import type { Music } from "@/lib/card";

const TUNES: Music[] = ["birthday", "love", "jingle", "joy", "spooky"];

// Lets people hear the card music on the homepage. Nothing plays until they tap.
export function MusicDemo() {
  const { t } = useI18n();
  const [playing, setPlaying] = useState<Music | null>(null);

  useEffect(() => {
    if (!playing) return;
    const stop = playMusic(playing);
    const timer = setTimeout(() => setPlaying(null), 12000);
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, [playing]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-16 items-end justify-center gap-1.5" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className={`w-2.5 origin-bottom rounded-full bg-white/80 ${playing ? "animate-equalise" : ""}`}
            style={{ height: `${30 + ((i * 37) % 60)}%`, animationDelay: `${(i % 5) * -0.18}s`, opacity: playing ? 1 : 0.4 }}
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {TUNES.map((tune) => (
          <button
            key={tune}
            onClick={() => {
              unlockAudio();
              setPlaying((p) => (p === tune ? null : tune));
            }}
            aria-pressed={playing === tune}
            className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition ${playing === tune ? "border-ink bg-paper text-ink" : "border-white/45 text-white hover:bg-white/15"}`}
          >
            {playing === tune ? "■" : "▶"} {t.labels.music[tune]}
          </button>
        ))}
      </div>
    </div>
  );
}
