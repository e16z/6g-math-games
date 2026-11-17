// Checks every round of every unit: it uses a real mechanic, its numbers
// make sense, and its answer options are valid. Run with `npm test`.
import { describe, expect, it } from 'vitest';
import { MECHANICS } from '../src/mechanics';
import { UNITS } from '../src/units';

describe('units', () => {
  it('has 8 floors numbered 1–8', () => {
    expect(UNITS.map((u) => u.num)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('level ids are unique', () => {
    const ids = UNITS.flatMap((u) => u.levels.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

for (const unit of UNITS.filter((u) => u.levels.length)) {
  describe(`Unit ${unit.num}: ${unit.title}`, () => {
    it('has 8 or fewer levels (the secret picture has 8 tiles)', () => {
      expect(unit.levels.length).toBeLessThanOrEqual(8);
    });

    for (const lvl of unit.levels) {
      it(`${lvl.id} "${lvl.name}" has 3–8 rounds and a short intro`, () => {
        expect(lvl.rounds.length).toBeGreaterThanOrEqual(3);
        expect(lvl.rounds.length).toBeLessThanOrEqual(8);
        // Keep the reading light: intro lines stay short.
        for (const b of lvl.intro) expect(b.text.split(/\s+/).length).toBeLessThanOrEqual(12);
      });

      lvl.rounds.forEach((round, i) => {
        const mechId = (round.mechanic as string) ?? lvl.mechanic;
        it(`${lvl.id} round ${i + 1} (${mechId}) is valid`, () => {
          const mech = MECHANICS[mechId];
          expect(mech, `unknown mechanic ${mechId}`).toBeTruthy();
          expect(mech.validate(round)).toEqual([]);
        });
      });
    }
  });
}
