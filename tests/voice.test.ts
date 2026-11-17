import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../src/voice-manifest.json';
import { speakable, voiceKey } from '../src/engine/voicekey';
import { allVoiceLines } from '../src/voice-lines';

describe('voices', () => {
  it('every spoken line has a recording (if not: npm run voices)', () => {
    const clips = (manifest as { clips: Record<string, unknown> }).clips;
    const missing = allVoiceLines()
      .filter((l) => {
        const key = voiceKey(l.who, l.text);
        return !(key in clips) || !existsSync(join(import.meta.dirname, '..', 'public', 'voice', `${key}.mp3`));
      })
      .map((l) => `[${l.who}] ${l.text}`);
    expect(missing).toEqual([]);
  });

  it('turns math into words', () => {
    expect(speakable('2 ÷ 3/4 = ?')).toBe('2 divided by 3 fourths equals what?');
    expect(speakable('1/2 of 2 1/3 🍪')).toBe('one half of 2 and one third');
  });

  it('keys are stable and per-voice', () => {
    expect(voiceKey('baron', 'HA!')).toBe(voiceKey('baron', 'HA!'));
    expect(voiceKey('baron', 'HA!')).not.toBe(voiceKey('hamster', 'HA!'));
    expect(voiceKey('raccoon', 'Hi')).toBe(voiceKey('narrator', 'Hi')); // same voice → same clip
  });
});
