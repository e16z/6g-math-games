// Read-aloud so kids don't have to read.
// Plays pre-recorded ElevenLabs clips from public/voice/ (made by `npm run voices`).
// If a line has no clip yet, falls back to the browser's built-in voice.
import manifest from '../voice-manifest.json';
import { store } from './store';
import { speakable, voiceKey, type VoiceLine, type Who } from './voicekey';

export { speakable, type VoiceLine, type Who } from './voicekey';

const clips = (manifest as { clips: Record<string, unknown> }).clips;
const cache = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;
let finishCurrent: (() => void) | null = null;

const url = (key: string) => `${import.meta.env.BASE_URL}voice/${key}.mp3`;

export const hasClip = (who: Who, text: string) => voiceKey(who, text) in clips;

function audioFor(key: string): HTMLAudioElement {
  let a = cache.get(key);
  if (!a) {
    a = new Audio(url(key));
    a.preload = 'auto';
    cache.set(key, a);
  }
  return a;
}

/** Start downloading clips we're about to need (e.g. all lines in a level). */
export function preloadVoices(lines: VoiceLine[]) {
  if (typeof Audio === 'undefined') return;
  for (const l of lines) {
    const key = voiceKey(l.who, l.text);
    if (key in clips) audioFor(key);
  }
}

/** Speak a line. Resolves when it finishes (or right away if voice is off). */
export function speak(text: string, who: Who = 'narrator'): Promise<void> {
  hush();
  if (!store.get().voice || !speakable(text)) return Promise.resolve();
  const key = voiceKey(who, text);
  if (key in clips) return playClip(key);
  return browserSpeak(speakable(text), who);
}

function playClip(key: string): Promise<void> {
  const a = audioFor(key);
  current = a;
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      a.removeEventListener('ended', finish);
      a.removeEventListener('error', finish);
      if (finishCurrent === finish) finishCurrent = null;
      resolve();
    };
    finishCurrent = finish;
    a.addEventListener('ended', finish);
    a.addEventListener('error', finish);
    try {
      a.currentTime = 0;
    } catch {
      /* not loaded yet */
    }
    a.play().catch(finish);
    setTimeout(finish, 9000); // never hang the game on audio
  });
}

/** Stop whatever is being said. */
export function hush() {
  if (current) {
    current.pause();
    current = null;
  }
  finishCurrent?.();
  try {
    speechSynthesis.cancel();
  } catch {
    /* no speech engine */
  }
}

// ── fallback: the browser's own voice ──

const STYLE: Record<Who, { pitch: number; rate: number }> = {
  narrator: { pitch: 1.1, rate: 0.95 },
  baron: { pitch: 0.45, rate: 0.9 },
  mystery: { pitch: 0.8, rate: 0.85 },
  hamster: { pitch: 2, rate: 1.3 },
  raccoon: { pitch: 1.6, rate: 1.1 },
};

let english: SpeechSynthesisVoice | null = null;
function englishVoice(): SpeechSynthesisVoice | null {
  if (english) return english;
  const vs = speechSynthesis.getVoices();
  english = vs.find((v) => v.lang === 'en-US') ?? vs.find((v) => v.lang.startsWith('en')) ?? null;
  return english;
}

function browserSpeak(text: string, who: Who): Promise<void> {
  if (typeof speechSynthesis === 'undefined') return Promise.resolve();
  return new Promise<void>((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      const v = englishVoice();
      if (v) u.voice = v;
      u.lang = 'en-US';
      u.pitch = STYLE[who].pitch;
      u.rate = STYLE[who].rate;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
      setTimeout(resolve, 9000);
    } catch {
      resolve();
    }
  });
}
