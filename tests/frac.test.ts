import { describe, expect, it } from 'vitest';
import { F, Frac, makeOptions } from '../src/engine/frac';

describe('Frac', () => {
  it('parses and simplifies', () => {
    expect(F('6/8').toString()).toBe('3/4');
    expect(F('2 1/3').n).toBe(7);
    expect(F('4').isInt).toBe(true);
    expect(F(0.25).eq('1/4')).toBe(true);
  });

  it('divides fractions (Unit 4 examples)', () => {
    expect(F('2').div('3/4').toString()).toBe('2 2/3'); // lesson 5
    expect(F('3/4').div('2/3').toString()).toBe('1 1/8'); // lesson 6
    expect(F('5/6').div('2/3').toString()).toBe('1 1/4'); // lesson 10
    expect(F('3 3/4').div('1 1/2').toString()).toBe('2 1/2'); // lesson 12
    expect(F('89 1/4').div('10 1/2').toString()).toBe('8 1/2'); // lesson 13
  });

  it('dividing = multiplying by the reciprocal', () => {
    for (const [a, b] of [['4/7', '5/3'], ['9/10', '3/4'], ['7', '1/8']]) {
      expect(F(a).div(b).eq(F(a).mul(F(b).recip()))).toBe(true);
    }
  });

  it('makeOptions keeps the answer, drops bad distractors', () => {
    const opts = makeOptions(F(3), [F(3), F(-1), F('1/3')]);
    expect(opts.length).toBe(3);
    expect(opts[0].eq(3)).toBe(true);
    expect(opts.filter((o) => o.eq(3)).length).toBe(1);
    expect(opts.every((o) => o.n > 0)).toBe(true);
  });

  it('rejects bad input', () => {
    expect(() => new Frac(1, 0)).toThrow();
    expect(() => F('banana')).toThrow();
  });
});
