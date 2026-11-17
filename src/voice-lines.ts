// Every line the game can say out loud. `npm run voices` records each one;
// `npm test` checks none are missing a recording.
import { BARON_LOSES, BARON_WINS, FLIP_REVEAL, SAY } from './engine/lines';
import { voiceKey, type VoiceLine } from './engine/voicekey';
import { getMechanic } from './mechanics';
import { INTRO } from './screens/home';
import { UNITS } from './units';

export function allVoiceLines(): VoiceLine[] {
  const lines: VoiceLine[] = [
    ...INTRO,
    ...[SAY.okay, SAY.pickFloor, SAY.locked, SAY.finishFirst, SAY.pickHat, ...SAY.stars].map((text): VoiceLine => ({ who: 'narrator', text })),
    ...[...BARON_WINS, ...BARON_LOSES].map((text): VoiceLine => ({ who: 'baron', text })),
    { who: 'mystery', text: FLIP_REVEAL },
  ];
  for (const unit of UNITS) {
    for (const lvl of unit.levels) {
      lines.push(...lvl.intro);
      for (const r of lvl.rounds) lines.push(...getMechanic(r.mechanic ?? lvl.mechanic).lines(r));
    }
    lines.push(...(unit.finale ?? []));
  }
  // One recording per (voice, words).
  const seen = new Set<string>();
  return lines
    .map(({ who, text }) => ({ who, text }))
    .filter((l) => {
      const k = voiceKey(l.who, l.text);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}
