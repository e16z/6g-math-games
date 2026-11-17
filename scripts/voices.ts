// Pre-record every spoken line with ElevenLabs.
//
//   npm run voices             record lines that don't have a clip yet
//   npm run voices -- --force  re-record everything
//   npm run voices -- --dry    just list what would be recorded
//
// Needs ELEVENLABS_API_KEY (in .env or the environment). Clips go to
// public/voice/<key>.mp3 and src/voice-manifest.json lists them. Clips for
// lines the game no longer says are deleted.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { speakable, VOICE_IDS, voiceKey } from '../src/engine/voicekey';
import { allVoiceLines } from '../src/voice-lines';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'public', 'voice');
const MANIFEST = join(ROOT, 'src', 'voice-manifest.json');
const MODEL = process.env.VOICE_MODEL ?? 'eleven_v3';
const args = new Set(process.argv.slice(2));

function apiKey(): string {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const env = join(ROOT, '.env');
  if (existsSync(env)) {
    for (const line of readFileSync(env, 'utf8').split('\n')) {
      const m = line.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.*)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('No ELEVENLABS_API_KEY in .env or the environment.');
}

async function record(key: string, voiceId: string, text: string, tries = 4): Promise<number> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey(), 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: MODEL }),
  });
  if ((res.status === 429 || res.status >= 500) && tries > 1) {
    await new Promise((r) => setTimeout(r, 2000 * (5 - tries)));
    return record(key, voiceId, text, tries - 1);
  }
  if (!res.ok) throw new Error(`ElevenLabs ${res.status} for "${text}": ${(await res.text()).slice(0, 300)}`);
  writeFileSync(join(OUT, `${key}.mp3`), Buffer.from(await res.arrayBuffer()));
  return Number(res.headers.get('x-character-count') ?? text.length);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const lines = allVoiceLines();
  const old = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { clips: {} };
  const clips: Record<string, { who: string; text: string }> = {};
  const todo: { key: string; who: string; text: string }[] = [];

  for (const l of lines) {
    const key = voiceKey(l.who, l.text);
    clips[key] = { who: l.who, text: l.text };
    const have = existsSync(join(OUT, `${key}.mp3`)) && old.clips?.[key];
    if (!have || args.has('--force')) todo.push({ key, who: l.who, text: l.text });
  }

  console.log(`${lines.length} lines · ${lines.length - todo.length} already recorded · ${todo.length} to record (model ${MODEL})`);
  if (args.has('--dry')) {
    for (const t of todo) console.log(`  [${t.who}] ${speakable(t.text)}`);
    return;
  }

  let chars = 0;
  let done = 0;
  const queue = [...todo];
  const worker = async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      chars += await record(t.key, VOICE_IDS[t.who as keyof typeof VOICE_IDS], speakable(t.text));
      done++;
      console.log(`  ✓ ${done}/${todo.length} [${t.who}] ${speakable(t.text)}`);
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  // Drop clips for lines that no longer exist.
  for (const f of readdirSync(OUT)) {
    if (f.endsWith('.mp3') && !clips[f.slice(0, -4)]) {
      unlinkSync(join(OUT, f));
      console.log(`  ✗ removed unused ${f}`);
    }
  }
  const sorted = Object.fromEntries(Object.entries(clips).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, JSON.stringify({ model: MODEL, clips: sorted }, null, 2) + '\n');
  console.log(`Done. ${done} recorded, ~${chars} characters used.`);
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
});
