// Unit 2, lesson 9 — comparing ratios. Which paint mix is darker?
// Dip in the darker one to hide in the shadows.
import { box, h, mathEl } from '../engine/dom';
import { Frac, lcm } from '../engine/frac';
import { anim, burst, flash, shake, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';

interface PaintRound {
  /** [black, white] parts of each mix. */
  a: [number, number];
  b: [number, number];
}
type Pick = 'A' | 'B' | 'same';

export function paintTruth(r: PaintRound): Pick {
  const d = r.a[0] * r.b[1] - r.b[0] * r.a[1]; // compare black per white
  return d > 0 ? 'A' : d < 0 ? 'B' : 'same';
}
const SAY = 'Which paint is darker? A, B, or are they the same?';
const shade = (m: [number, number]) => Math.round(250 * (m[1] / (m[0] + m[1])) ** 1.3);
const dots = (n: number, cls: string) => h('span', { class: 'pdots' }, Array.from({ length: n }, () => h('span', { class: `pdot ${cls}` })));

export const paint: Mechanic<PaintRound> = {
  id: 'paint',
  lines: () => [{ who: 'narrator', text: SAY }],

  validate(r) {
    const all = [...r.a, ...r.b];
    return all.every((n) => Number.isInteger(n) && n >= 1 && n <= 12) ? [] : ['paint parts must be whole numbers 1–12'];
  },

  build(r, arena, kit) {
    const truth = paintTruth(r);
    arena.classList.add('bg-hall');
    const can = (name: string, m: [number, number], x: number) => {
      const el = box('paint-can-big', x, 30, 300, 250,
        h('div', { class: 'can-name' }, name),
        h('div', { class: 'can-row' }, dots(m[0], 'black'), h('b', {}, String(m[0]))),
        h('div', { class: 'can-row' }, dots(m[1], 'white'), h('b', {}, String(m[1]))),
      );
      const mix = box('mix-blob hidden', x + 200, 10, 90, 90);
      mix.style.background = `rgb(${shade(m)},${shade(m)},${shade(m)})`;
      arena.append(el, mix);
      return { el, mix };
    };
    const A = can('A', r.a, 80);
    const B = can('B', r.b, 480);
    const shadow = box('shadow-zone', 900, 0, 380, 470);
    const light = box('spotlight hidden', 940, 230, 300, 240);
    const hint = box('compare-hint hidden', 80, 290, 700, 150);
    const hero = kit.hero(100).place(780, 455);
    arena.append(shadow, light, hint, hero.el, box('ground', 0, 455, 1280, 20));

    const label = (txt: string) => h('div', { class: 'sort-choice' }, h('div', { class: 'sort-sym' }, txt), h('div', { class: 'sort-icon' }, txt === '=' ? '🎨🎨' : '🎨'));

    return {
      ask: { math: [h('span', { class: 'chip' }, 'A'), 'vs', h('span', { class: 'chip' }, 'B'), '→', '🌑', '?'], say: SAY },
      fixedOrder: true,
      choices: [
        { label: label('A'), value: 'A', correct: truth === 'A' },
        { label: label('='), value: 'same', correct: truth === 'same' },
        { label: label('B'), value: 'B', correct: truth === 'B' },
      ],

      async play(c) {
        hero.clearFx();
        hero.el.style.filter = '';
        hero.el.style.opacity = '1';
        light.classList.add('hidden');
        hero.place(780, 455);
        // Stir both cans and show the real shades.
        sfx.rattle();
        await Promise.all([shake(A.el, 5, 500), shake(B.el, 5, 500)]);
        A.mix.classList.remove('hidden');
        B.mix.classList.remove('hidden');
        const pick = c.value as Pick;
        const mine = pick === 'B' ? r.b : r.a;
        const target = pick === 'B' ? B : A;
        const tx = parseFloat(target.el.style.left) + 120;
        await hero.walkTo(tx, 600);
        sfx.splash();
        const dark = 1 - shade(mine) / 255;
        hero.el.style.filter = `brightness(${1 - dark * 0.8})`;
        await wait(300);
        await hero.walkTo(1040, 900);
        if (c.correct) {
          await anim(hero.el, [{ opacity: 1 }, { opacity: 0.25 }], 500);
          burst(arena, 'HIDDEN!', 1080, 160, '#7CFF6B', 56);
          sfx.right();
          return;
        }
        light.classList.remove('hidden');
        sfx.alarm();
        flash(kit.stage, 'rgba(255,240,150,.35)', 700);
        burst(arena, truth === 'same' ? 'SAME SHADE!' : 'SPOTTED!', 1080, 160, '#FF4F8B', 56);
        await shake(hero.el, 8);
        await wait(300);
        await hero.walkTo(780, 700);
      },

      hint() {
        // Clue: make the white parts match, then compare the black parts.
        const W = lcm(r.a[1], r.b[1]);
        const ka = W / r.a[1];
        const kb = W / r.b[1];
        const row = (name: string, m: [number, number], k: number) =>
          h('div', { class: 'cmp-row' }, h('span', { class: 'chip' }, name), mathEl([m[0], '⚫', m[1], '⚪', `×${k}`, '→', m[0] * k, '⚫', W, '⚪']));
        hint.replaceChildren(row('A', r.a, ka), row('B', r.b, kb));
        if (kit.has('per1')) {
          hint.append(h('div', { class: 'cmp-row' }, mathEl(['A', new Frac(r.a[0], r.a[1]), '⚫', 'per', 1, '⚪', h('span', { class: 'gap' }), 'B', new Frac(r.b[0], r.b[1]), '⚫'])));
        }
        hint.classList.remove('hidden');
      },
    };
  },
};
