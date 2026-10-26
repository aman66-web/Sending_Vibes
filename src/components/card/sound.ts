"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Music } from "@/lib/card";

// Every sound is synthesised in the browser with the Web Audio API, so there are
// no audio files to load and nothing to license. Browsers only allow audio after
// the person taps something, so the card calls unlockAudio() on their first tap.

export type Sfx = "tap" | "pop" | "chime" | "win" | "whoosh" | "wrong" | "tick" | "boom" | "sparkle" | "stamp" | "unlock" | "boing";

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;

// ---------- Mute switch (remembered between cards) ----------

const MUTE_KEY = "sv-muted";
let muted = false;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch {}
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

export function useMuted() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => muted,
    () => false,
  );
}

// Whether this card player makes sound at all. Previews (homepage, product
// pages, the creator) stay silent; the real card and full-screen demos don't.
export const SoundEnabled = createContext(false);

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.5;
    sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.16;
    musicBus.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

function ready() {
  return !!ctx && !!sfxBus && ctx.state === "running" && !muted;
}

// ---------- Building blocks ----------

function tone(freq: number, dur: number, type: OscillatorType, gain: number, at = 0, slideTo?: number, bus = sfxBus) {
  if (!ctx || !bus) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuffer: AudioBuffer | null = null;

function noise(dur: number, gain: number, filter: BiquadFilterType, freq: number, at = 0, freqTo?: number) {
  if (!ctx || !sfxBus) return;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (freqTo) f.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(sfxBus);
  src.start(t);
  src.stop(t + dur + 0.05);
}

const PLAYERS: Record<Sfx, () => void> = {
  tap: () => tone(660, 0.07, "triangle", 0.25),
  pop: () => {
    tone(520, 0.1, "sine", 0.5, 0, 160);
    noise(0.03, 0.25, "highpass", 2000);
  },
  chime: () => {
    tone(1047, 0.5, "sine", 0.22);
    tone(1568, 0.7, "sine", 0.14, 0.07);
  },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.6 : 0.16, "triangle", 0.28, i * 0.09)),
  whoosh: () => noise(0.45, 0.35, "bandpass", 400, 0, 2600),
  wrong: () => tone(220, 0.2, "square", 0.09, 0, 150),
  tick: () => noise(0.02, 0.18, "highpass", 3500),
  boom: () => {
    noise(0.7, 0.5, "lowpass", 1200, 0, 150);
    tone(110, 0.45, "sine", 0.45, 0, 40);
  },
  sparkle: () => [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, 0.25, "sine", 0.07, i * 0.06)),
  stamp: () => {
    noise(0.09, 0.5, "lowpass", 700);
    tone(130, 0.1, "sine", 0.35);
  },
  unlock: () => {
    tone(880, 0.08, "square", 0.08);
    tone(1320, 0.18, "square", 0.08, 0.08);
  },
  boing: () => tone(180, 0.28, "sine", 0.35, 0, 520),
};

export function sfx(name: Sfx) {
  if (ready()) PLAYERS[name]();
}

const silent = () => {};

// Screens call this, so a silent preview never needs to know about audio.
export function useSfx(): (name: Sfx) => void {
  return useContext(SoundEnabled) ? sfx : silent;
}

// ---------- Music box ----------

// Notes are written "E5:1" (note and length in beats), "C4+E4:2" for chords
// and "r:1" for a rest. The tunes are either our own or traditional melodies
// that are long out of copyright.
type Tune = { bpm: number; wave: "bell" | "soft"; melody: string; bass?: string };

const TUNES: Record<Exclude<Music, "none">, Tune> = {
  love: {
    bpm: 84,
    wave: "bell",
    melody:
      "E5:1.5 D5:0.5 C5:1 G4:1 A4:1.5 C5:0.5 E5:2 F5:1.5 E5:0.5 D5:1 C5:1 D5:3 r:1 E5:1.5 D5:0.5 C5:1 G4:1 A4:1.5 C5:0.5 E5:1 A5:1 G5:1 F5:1 E5:1 D5:1 C5:3 r:1",
    bass: "C3+G3:4 A2+E3:4 F2+C3:4 G2+D3:4 C3+G3:4 A2+E3:4 F2+C3:2 G2+D3:2 C3+G3:4",
  },
  birthday: {
    bpm: 100,
    wave: "bell",
    melody:
      "G4:0.75 G4:0.25 A4:1 G4:1 C5:1 B4:2 G4:0.75 G4:0.25 A4:1 G4:1 D5:1 C5:2 G4:0.75 G4:0.25 G5:1 E5:1 C5:1 B4:1 A4:2 F5:0.75 F5:0.25 E5:1 C5:1 D5:1 C5:2 r:3",
  },
  jingle: {
    bpm: 150,
    wave: "bell",
    melody:
      "E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:0.5 E5:4 F5:1 F5:1 F5:1.5 F5:0.5 F5:1 E5:1 E5:1 E5:0.5 E5:0.5 E5:1 D5:1 D5:1 E5:1 D5:2 G5:2 E5:1 E5:1 E5:2 E5:1 E5:1 E5:2 E5:1 G5:1 C5:1.5 D5:0.5 E5:4 F5:1 F5:1 F5:1.5 F5:0.5 F5:1 E5:1 E5:1 E5:0.5 E5:0.5 G5:1 G5:1 F5:1 D5:1 C5:4",
  },
  festive: {
    bpm: 118,
    wave: "bell",
    melody:
      "C5:0.5 D5:0.5 E5:0.5 G5:0.5 A5:1 G5:1 E5:0.5 G5:0.5 A5:0.5 C6:0.5 A5:1 G5:1 E5:0.5 D5:0.5 C5:0.5 D5:0.5 E5:1 G5:1 D5:2 r:2 C5:0.5 D5:0.5 E5:0.5 G5:0.5 A5:1 G5:1 E5:0.5 G5:0.5 A5:0.5 C6:0.5 D6:1 C6:1 A5:0.5 G5:0.5 E5:0.5 D5:0.5 E5:1 D5:1 C5:2 r:2",
    bass: "C3:1 G3:1 C3:1 G3:1 F2:1 C3:1 F2:1 C3:1 C3:1 G3:1 C3:1 G3:1 G2:1 D3:1 G2:1 D3:1 C3:1 G3:1 C3:1 G3:1 F2:1 C3:1 F2:1 C3:1 A2:1 E3:1 G2:1 D3:1 C3:1 G3:1 C3:2",
  },
  lullaby: {
    bpm: 72,
    wave: "bell",
    melody:
      "E5:0.5 E5:0.5 G5:2 E5:0.5 E5:0.5 G5:2 E5:0.5 G5:0.5 C6:1 B5:1.5 A5:0.5 A5:1 G5:1 D5:0.5 E5:0.5 F5:1 D5:1 D5:0.5 E5:0.5 F5:2 D5:0.5 F5:0.5 B5:0.5 A5:0.5 G5:1 B5:1 C6:2 r:1",
  },
  spooky: {
    bpm: 92,
    wave: "soft",
    melody:
      "A4:1 C5:1 E5:1 D#5:1 E5:1 C5:1 A4:2 F4:1 A4:1 C5:1 B4:1 G#4:3 r:1 A4:1 C5:1 E5:1 F5:1 E5:1 C5:1 A4:1 G#4:1 A4:1 E4:1 F4:1 G#4:1 A4:3 r:1",
    bass: "A2:4 A2:4 F2:4 E2:4 A2:4 A2:4 D2:2 E2:2 A2:4",
  },
  joy: {
    bpm: 112,
    wave: "bell",
    melody:
      "E5:1 E5:1 F5:1 G5:1 G5:1 F5:1 E5:1 D5:1 C5:1 C5:1 D5:1 E5:1 E5:1.5 D5:0.5 D5:2 E5:1 E5:1 F5:1 G5:1 G5:1 F5:1 E5:1 D5:1 C5:1 C5:1 D5:1 E5:1 D5:1.5 C5:0.5 C5:2 r:2",
  },
  auld: {
    bpm: 80,
    wave: "bell",
    melody:
      "G4:1 C5:1.5 C5:0.5 C5:1 E5:1 D5:1.5 C5:0.5 D5:1 E5:0.5 D5:0.5 C5:1.5 C5:0.5 E5:1 G5:1 A5:3 A5:1 G5:1.5 E5:0.5 E5:1 C5:1 D5:1.5 C5:0.5 D5:1 E5:0.5 D5:0.5 C5:1.5 A4:0.5 A4:1 G4:1 C5:3 r:2",
  },
};

const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function frequency(note: string) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(note);
  if (!m) return 0;
  const midi = 12 * (Number(m[3]) + 1) + SEMITONES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

type NoteEvent = { freqs: number[]; beats: number };

function parse(track: string): NoteEvent[] {
  return track
    .trim()
    .split(/\s+/)
    .map((token) => {
      const [notes, beats] = token.split(":");
      return { freqs: notes === "r" ? [] : notes.split("+").map(frequency), beats: Number(beats) };
    });
}

function musicNote(t: number, freq: number, length: number, wave: Tune["wave"], gain: number) {
  if (!ctx || !musicBus) return;
  const ring = Math.max(0.5, length * 1.4);
  const voices: [OscillatorType, number, number][] =
    wave === "bell"
      ? [
          ["sine", 1, gain],
          ["sine", 2.005, gain * 0.25],
          ["sine", 3.01, gain * 0.06],
        ]
      : [["triangle", 1, gain * 0.9]];
  for (const [type, ratio, level] of voices) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq * ratio;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + (wave === "bell" ? 0.006 : 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + ring + 0.05);
  }
}

// Plays a tune on loop until stopped, scheduling a little ahead of time so it stays in rhythm.
export function playMusic(name: Music): () => void {
  if (name === "none" || !ctx || !musicBus) return () => {};
  const tune = TUNES[name];
  const beat = 60 / tune.bpm;
  const tracks = [
    { events: parse(tune.melody), gain: 0.9, i: 0, at: 0 },
    ...(tune.bass ? [{ events: parse(tune.bass), gain: 0.45, i: 0, at: 0 }] : []),
  ];
  const audio = ctx;
  const bus = musicBus;
  const start = audio.currentTime + 0.15;
  tracks.forEach((tr) => (tr.at = start));
  bus.gain.cancelScheduledValues(audio.currentTime);
  bus.gain.setValueAtTime(0.16, audio.currentTime);

  const schedule = () => {
    for (const tr of tracks) {
      // If the tab was asleep, skip ahead instead of playing a burst of missed notes.
      if (tr.at < audio.currentTime) tr.at = audio.currentTime + 0.05;
      while (tr.at < audio.currentTime + 0.5) {
        const ev = tr.events[tr.i];
        for (const f of ev.freqs) musicNote(tr.at, f, ev.beats * beat, tune.wave, tr.gain * (ev.freqs.length > 1 ? 0.6 : 1));
        tr.at += ev.beats * beat;
        tr.i = (tr.i + 1) % tr.events.length;
      }
    }
  };
  schedule();
  const timer = setInterval(schedule, 120);
  return () => {
    clearInterval(timer);
    bus.gain.setTargetAtTime(0.0001, audio.currentTime, 0.15);
  };
}

export const MUSIC_LABELS: Record<Music, string> = {
  none: "No music",
  love: "Soft and sweet",
  birthday: "Happy Birthday",
  jingle: "Jingle Bells",
  festive: "Festive and bouncy",
  lullaby: "Lullaby",
  spooky: "Spooky",
  joy: "Ode to Joy",
  auld: "Auld Lang Syne",
};
