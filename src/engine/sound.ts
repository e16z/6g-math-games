// Tiny synth for sound effects — no audio files to load.
import { store } from './store';

let ac: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (!store.get().sound) return null;
  try {
    if (!ac) ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  to?: number;
  delay?: number;
}

function tone(freq: number, dur: number, o: ToneOpts = {}) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + (o.delay ?? 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.vol ?? 0.2, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(dur: number, freq: number, o: { to?: number; vol?: number; delay?: number; type?: BiquadFilterType } = {}) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + (o.delay ?? 0);
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = o.type ?? 'lowpass';
  f.frequency.setValueAtTime(freq, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.35, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  tap: () => tone(700, 0.07, { type: 'triangle', vol: 0.15 }),
  pop: () => tone(380, 0.12, { to: 900, vol: 0.18 }),
  tick: (i = 0) => tone(500 + i * 18, 0.05, { type: 'square', vol: 0.05 }),
  right: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, { type: 'triangle', delay: i * 0.08, vol: 0.18 })),
  wrong: () => tone(260, 0.3, { type: 'sawtooth', to: 130, vol: 0.1 }),
  splash: () => {
    noise(0.7, 900, { to: 150, vol: 0.45 });
    tone(220, 0.25, { to: 90, vol: 0.2 });
  },
  boom: () => {
    noise(0.9, 500, { to: 50, vol: 0.6 });
    tone(110, 0.6, { to: 35, vol: 0.45 });
  },
  boing: () => {
    tone(140, 0.45, { to: 520, type: 'square', vol: 0.07 });
    tone(150, 0.45, { to: 560, type: 'triangle', vol: 0.12, delay: 0.02 });
  },
  zap: () => tone(1400, 0.35, { to: 70, type: 'sawtooth', vol: 0.12 }),
  whoosh: () => noise(0.45, 2000, { to: 300, type: 'bandpass', vol: 0.5 }),
  whistleUp: () => tone(300, 0.7, { to: 1600, type: 'sine', vol: 0.15 }),
  whistleDown: () => tone(1600, 0.7, { to: 250, type: 'sine', vol: 0.15 }),
  thud: () => tone(120, 0.18, { to: 55, vol: 0.4 }),
  clank: () => {
    tone(900, 0.15, { type: 'square', vol: 0.07 });
    tone(1250, 0.2, { type: 'square', vol: 0.05, delay: 0.03 });
    noise(0.15, 3000, { type: 'highpass', vol: 0.2 });
  },
  click: () => tone(1600, 0.04, { type: 'square', vol: 0.08 }),
  alarm: () => {
    for (let i = 0; i < 4; i++) tone(i % 2 ? 620 : 860, 0.18, { type: 'square', delay: i * 0.2, vol: 0.06 });
  },
  squeak: () => tone(1300, 0.18, { to: 2400, vol: 0.12 }),
  nom: () => {
    for (let i = 0; i < 3; i++) noise(0.08, 700, { delay: i * 0.13, vol: 0.4 });
  },
  rattle: () => {
    for (let i = 0; i < 8; i++) noise(0.05, 2500, { delay: i * 0.07, type: 'bandpass', vol: 0.5 });
  },
  flip: () => noise(0.25, 4000, { to: 900, type: 'bandpass', vol: 0.4 }),
  star: (i: number) => tone(660 + i * 220, 0.3, { type: 'triangle', vol: 0.18 }),
  ring: () => {
    for (let i = 0; i < 6; i++) tone(i % 2 ? 1320 : 1180, 0.09, { type: 'square', delay: i * 0.1, vol: 0.05 });
  },
  fanfare: () =>
    [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) =>
      tone(f, i === 7 ? 0.6 : 0.15, { type: 'triangle', delay: [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.9, 1.05][i], vol: 0.18 }),
    ),
};

export type SfxName = keyof typeof sfx;
