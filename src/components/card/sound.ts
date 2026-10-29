"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Music } from "@/lib/card";

// Every sound is synthesised in the browser with the Web Audio API, so there are
// no audio files to load and nothing to license. Browsers only allow audio after
// the person taps something, so the card calls unlockAudio() on their first tap.

export type Sfx = "tap" | "pop" | "chime" | "win" | "whoosh" | "wrong" | "tick" | "boom" | "sparkle" | "stamp" | "unlock" | "boing" | "crack";

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
  // While muted, let go of the phone's media playback, so their own music or podcast carries on.
  if (ctx && (value || users > 0)) holdPlayback(!value);
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
  // Suspended, or "interrupted" on an iPhone after a call.
  if (ctx.state !== "running" && ctx.state !== "closed") ctx.resume().catch(() => {});
  if (!muted) holdPlayback(true);
  // Let go again if nothing turns out to be using it (see retainAudio).
  settle();
}

// What on the page may make sound right now: a card being played (with its sound on), or a
// tune playing. The phone's media playback is only held while there's at least one, so once
// they leave the card (to make one back, say) their own music or podcast is left alone, even
// when they come back to the tab.
let users = 0;
let settleTimer: ReturnType<typeof setTimeout> | undefined;

export function retainAudio(): () => void {
  users += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    users -= 1;
    settle();
  };
}

// A moment's grace, so a tune's fade-out finishes and a player that's only being swapped
// for another (the editor's phone and computer views) doesn't let go and grab it again.
function settle() {
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => {
    if (users > 0 || !ctx) return;
    holdPlayback(false);
    ctx.suspend().catch(() => {});
  }, 1000);
}

// iPhones treat web audio like a ringtone: the ring/silent switch mutes it, and very many
// phones are on silent. Asking to be media playback instead (like a video) lets the card be
// heard: through the Audio Session API in recent Safari, or on older iPhones by quietly
// playing a silent clip on a loop, which switches the page into playback. The card's own
// mute button and the phone's volume buttons still work as usual.
type WithAudioSession = Navigator & { audioSession?: { type: string } };
let silence: HTMLAudioElement | null = null;

function holdPlayback(on: boolean) {
  const session = (navigator as WithAudioSession).audioSession;
  if (session) {
    const type = on ? "playback" : "auto";
    try {
      if (session.type !== type) session.type = type;
    } catch {}
    return;
  }
  const iPhone = navigator.maxTouchPoints > 0 && "webkitAudioContext" in window;
  if (!iPhone) return;
  if (!on) return silence?.pause();
  if (!silence) {
    silence = document.createElement("audio");
    // Keeps it off the lock screen's and Control Centre's media controls.
    silence.setAttribute("x-webkit-airplay", "deny");
    silence.loop = true;
    silence.src = silentClip(ctx?.sampleRate ?? 44100);
  }
  if (silence.paused) silence.play().catch(() => {});
}

// A tenth of a second of silence as a WAV file, at the card's own sample rate so the phone
// doesn't switch rates (and distort the sound) going between the two.
function silentClip(rate: number) {
  const samples = Math.round(rate / 10);
  const wav = new DataView(new ArrayBuffer(44 + samples));
  const text = (at: number, s: string) => [...s].forEach((ch, i) => wav.setUint8(at + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  wav.setUint32(4, 36 + samples, true);
  text(8, "WAVE");
  text(12, "fmt ");
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true); // plain PCM
  wav.setUint16(22, 1, true); // mono
  wav.setUint32(24, rate, true);
  wav.setUint32(28, rate, true); // bytes a second
  wav.setUint16(32, 1, true);
  wav.setUint16(34, 8, true); // 8-bit, where silence is the middle value
  text(36, "data");
  wav.setUint32(40, samples, true);
  new Uint8Array(wav.buffer, 44).fill(128);
  return URL.createObjectURL(new Blob([wav.buffer], { type: "audio/wav" }));
}

// Nothing plays while they're in another app or tab (replying on WhatsApp, say), where the
// music would otherwise carry on in their pocket. It picks up again when they come back, if
// the card (or a tune) is still there.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) {
      ctx.suspend().catch(() => {});
      silence?.pause();
    } else if (!muted && users > 0) {
      ctx.resume().catch(() => {});
      holdPlayback(true);
    }
  });
}

// A context that's still resuming from the tap that unlocked it queues sounds
// and plays them the moment it starts, so only a closed one is skipped.
function ready() {
  return !!ctx && !!sfxBus && ctx.state !== "closed" && !muted;
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
  // A wax seal snapping.
  crack: () => {
    noise(0.06, 0.45, "highpass", 1800);
    noise(0.05, 0.3, "bandpass", 900, 0.03);
    tone(240, 0.08, "triangle", 0.2, 0, 120);
  },
};

// ---------- Haptics ----------

// The big moments, felt in the hand too: a seal cracking, a win, fireworks. Kept short, as
// longer buzzes feel like a phone call. Most other sounds (ticks, taps) have none.
const BUZZ: Partial<Record<Sfx, number | number[]>> = {
  crack: [14, 40, 22],
  win: [18, 60, 18, 60, 40],
  boom: 30,
  stamp: 16,
  unlock: [10, 40, 14],
  pop: 10,
  wrong: 20,
};

// A buzz on Android phones (iPhones don't let web pages vibrate, so they just get the
// sound). Off with the card's mute button, like the sound.
export function buzz(pattern: number | number[]) {
  if (muted || typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  // Chrome refuses (and complains) until they've tapped the page.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  try {
    navigator.vibrate(pattern);
  } catch {}
}

export function sfx(name: Sfx) {
  const pattern = BUZZ[name];
  if (pattern) buzz(pattern);
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

function musicNote(out: AudioNode, t: number, freq: number, length: number, wave: Tune["wave"], gain: number) {
  if (!ctx) return;
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
    o.connect(g).connect(out);
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
  // Each playback gets its own volume knob, so stopping one tune fades out
  // exactly its notes, even ones already scheduled, without touching the next.
  const out = audio.createGain();
  out.connect(musicBus);
  const start = audio.currentTime + 0.15;
  tracks.forEach((tr) => (tr.at = start));

  const schedule = () => {
    // If the tab was asleep, skip ahead instead of playing a burst of missed
    // notes. Every track moves by the same amount so melody and bass stay together.
    const behind = audio.currentTime + 0.05 - Math.min(...tracks.map((tr) => tr.at));
    if (behind > 0) tracks.forEach((tr) => (tr.at += behind));
    for (const tr of tracks) {
      while (tr.at < audio.currentTime + 0.5) {
        const ev = tr.events[tr.i];
        for (const f of ev.freqs) musicNote(out, tr.at, f, ev.beats * beat, tune.wave, tr.gain * (ev.freqs.length > 1 ? 0.6 : 1));
        tr.at += ev.beats * beat;
        tr.i = (tr.i + 1) % tr.events.length;
      }
    }
  };
  schedule();
  const timer = setInterval(schedule, 120);
  const release = retainAudio();
  return () => {
    clearInterval(timer);
    out.gain.setTargetAtTime(0.0001, audio.currentTime, 0.15);
    setTimeout(() => out.disconnect(), 4000);
    release();
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
