"use client";

import { useEffect, useState } from "react";
import { MUSIC_LABELS, playMusic, unlockAudio } from "@/components/card/sound";
import type { Music } from "@/lib/card";

const TUNES: Music[] = ["birthday", "love", "jingle", "joy", "spooky"];

// Lets people hear the card music on the homepage. Nothing plays until they tap.
export function MusicDemo() {
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
        {TUNES.map((t) => (
          <button
            key={t}
            onClick={() => {
              unlockAudio();
              setPlaying((p) => (p === t ? null : t));
            }}
            aria-pressed={playing === t}
            className={`rounded-full px-3.5 py-2 text-sm font-bold transition ${playing === t ? "bg-white text-ink shadow" : "bg-white/15 text-white hover:bg-white/25"}`}
          >
            {playing === t ? "■" : "▶"} {MUSIC_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
