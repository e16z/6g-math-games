// Pure voice helpers shared by the game and `npm run voices` (no DOM here).

export type Who = 'baron' | 'mystery' | 'hamster' | 'raccoon' | 'narrator';

export interface VoiceLine {
  who: Who;
  text: string;
}

/** ElevenLabs voice for each character. Change one → `npm run voices` re-records its lines. */
export const VOICE_IDS: Record<Who, string> = {
  baron: 'Nagtyt9MktF8AWSgjotJ',
  hamster: 'zauh4pbY6h1ZRErsRiAJ',
  mystery: 'AocjYzHzWRalprWmBG9m', // the hooded "?" ghost
  narrator: '6IwYbsNENZgAB1dtBZDp',
  raccoon: '6IwYbsNENZgAB1dtBZDp',
};

const ORD: Record<number, string> = {
  2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth',
  10: 'tenth', 12: 'twelfth', 20: 'twentieth', 50: 'fiftieth', 100: 'hundredth',
};

function fracWords(n: number, d: number): string {
  if (d === 1) return String(n);
  const base = ORD[d] ?? `${d}th`;
  if (n === 1) return `one ${base}`;
  return `${n} ${base === 'half' ? 'halves' : base + 's'}`;
}

/** Turn on-screen math into words a voice reads naturally: "2 ÷ 3/4" → "2 divided by 3 fourths". */
export function speakable(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/(\d+)\s+(\d+)\/(\d+)/g, (_, w, n, d) => `${w} and ${fracWords(+n, +d)}`)
    .replace(/(\d+)\/(\d+)/g, (_, n, d) => fracWords(+n, +d))
    .replace(/=\s*\?/g, ' equals what?')
    .replace(/÷/g, ' divided by ')
    .replace(/×/g, ' times ')
    .replace(/=/g, ' equals ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stable 64-bit FNV-1a hash → hex. */
function hash(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ 0x9e3779b9;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x01000197) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/** File name (without .mp3) of the recording for this line. */
export function voiceKey(who: Who, text: string): string {
  return `${who === 'raccoon' ? 'narrator' : who}-${hash(`${VOICE_IDS[who]}|${speakable(text)}`)}`;
}
