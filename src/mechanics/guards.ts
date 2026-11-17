// Two guards, one always lies. Compare their answers; the clue checks each one.
//   kind 'div' (default) — a ÷ b. Check: answer × b = a?
//   kind 'pct'           — p% of w. Check: answer ÷ w = p%?
//   kind 'ratio'         — a : b = c : ?. Check: both sides scaled by the same number?
import { box, h, mathEl, type MathPart } from '../engine/dom';
import { F, Frac } from '../engine/frac';
import { anim, burst, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import { guardSvg } from '../art/characters';
import type { Mechanic } from '../engine/types';
import { checkOptions, fmtText, numEl, type Fmt } from './common';

type GuardsRound =
  | { kind?: 'div'; a: string; b: string; lie: string }
  | { kind: 'pct'; p: number; w: string; lie: string; fmt?: Fmt }
  | { kind: 'ratio'; a: number; b: number; c: number; lie: string };

const FLOOR = 450;
const GH = 230;
const SPOTS = [230, 870];
const SAY = 'One guard always lies! Which guard tells the truth?';

export function guardsPlan(r: GuardsRound) {
  const lie = F(r.lie);
  if (r.kind === 'pct') {
    const w = F(r.w);
    const fmt = r.fmt ?? 'frac';
    const ans = w.mul(new Frac(r.p, 100));
    return {
      ans, lie, fmt,
      ask: (): MathPart[] => [`${r.p}%`, 'of', numEl(w, fmt), '=', '?'],
      claim: (v: Frac): MathPart[] => [`${r.p}%`, 'of', numEl(w, fmt), '=', numEl(v, fmt)],
      check: (v: Frac) => {
        const pct = v.div(w);
        return { ok: pct.eq(new Frac(r.p, 100)), math: [numEl(v, fmt), '÷', numEl(w, fmt), '=', fmtText(pct, 'pct')] as MathPart[] };
      },
    };
  }
  if (r.kind === 'ratio') {
    const k = new Frac(r.c, r.a);
    const ans = k.mul(r.b);
    return {
      ans, lie, fmt: 'frac' as Fmt,
      ask: (): MathPart[] => [r.a, ':', r.b, '=', r.c, ':', '?'],
      claim: (v: Frac): MathPart[] => [r.a, ':', r.b, '=', r.c, ':', v],
      check: (v: Frac) => ({ ok: v.eq(ans), math: [r.b, '×', k, '=', k.mul(r.b)] as MathPart[] }),
    };
  }
  const a = F(r.a);
  const b = F(r.b);
  return {
    ans: a.div(b), lie, fmt: 'frac' as Fmt,
    ask: (): MathPart[] => [a, '÷', b, '=', '?'],
    claim: (v: Frac): MathPart[] => [a, '÷', b, '=', v],
    check: (v: Frac) => ({ ok: v.mul(b).eq(a), math: [v, '×', b, '=', v.mul(b)] as MathPart[] }),
  };
}

export const guards: Mechanic<GuardsRound> = {
  id: 'guards',
  lines: () => [{ who: 'narrator', text: SAY }],

  validate(r) {
    const p = guardsPlan(r);
    return checkOptions(p.ans, [p.ans, p.lie], 2);
  },

  build(r, arena, kit) {
    const p = guardsPlan(r);
    arena.classList.add('bg-vault');
    const truthLeft = Math.random() < 0.5;
    const values = truthLeft ? [p.ans, p.lie] : [p.lie, p.ans];

    const guardEls = SPOTS.map((x, i) => {
      const door = box('door', x - 30, FLOOR - 300, 180, 300, h('div', { class: 'door-inside' }, '🍪🍩'));
      const g = box('guard', x, FLOOR - GH, GH * 0.5, GH, guardSvg());
      const sign = box('guard-sign', x - 90, 30, 300, undefined, mathEl(p.claim(values[i])));
      arena.append(door, g, sign);
      return { door, g, sign, x };
    });
    arena.append(box('ground', 0, FLOOR, 1280, 20));
    const hero = kit.hero(100).place(600, FLOOR);
    arena.append(hero.el);

    const label = (i: number) => h('div', { class: 'guard-choice' }, h('span', { class: 'mini-guard' }, guardSvg()), numEl(values[i], p.fmt));

    return {
      ask: { math: p.ask(), say: SAY },
      fixedOrder: true,
      choices: [0, 1].map((i) => ({ label: label(i), value: i, correct: values[i].eq(p.ans), solved: () => numEl(values[i], p.fmt, 'solved') })),

      async play(c) {
        hero.clearFx();
        hero.el.style.transform = '';
        hero.el.style.opacity = '1';
        const i = c.value as number;
        const spot = guardEls[i];
        const tx = i === 0 ? spot.x + GH * 0.5 + 20 : spot.x - 90;
        await hero.walkTo(tx, 700);
        if (c.correct) {
          sfx.clank();
          await anim(spot.g, [{ transform: 'none' }, { transform: `translateX(${i === 0 ? -220 : 220}px)` }], 500);
          spot.door.classList.add('open');
          burst(arena, 'OPEN!', spot.x + 60, FLOOR - 320, '#7CFF6B', 56);
          await hero.cheer();
          return;
        }
        // The liar laughs. The floor opens.
        spot.sign.classList.add('liar');
        sfx.wrong();
        const trap = box('trapdoor', tx - 20, FLOOR, 110, 18);
        arena.append(trap);
        await anim(trap, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.1)' }], 200);
        sfx.whistleDown();
        burst(arena, 'WHOOPS!', tx + 30, FLOOR - 150, '#FF4F8B', 60);
        await anim(hero.el, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(240px) rotate(30deg)', opacity: 0 }], { duration: 500, easing: 'ease-in' });
        sfx.thud();
        await wait(400);
        trap.remove();
        hero.el.style.transform = '';
        hero.place(600, FLOOR);
        hero.fx('dizzy');
        await anim(hero.el, [{ opacity: 0, transform: 'translateY(-200px)' }, { opacity: 1, transform: 'none' }], 450);
      },

      hint() {
        // Clue: check each guard's answer.
        guardEls.forEach((g, i) => {
          g.sign.querySelector('.check')?.remove();
          const { ok, math } = p.check(values[i]);
          g.sign.append(h('div', { class: `check ${ok ? 'ok' : 'bad'}` }, mathEl([...math, ok ? '✓' : '✗'])));
        });
      },
    };
  },
};
