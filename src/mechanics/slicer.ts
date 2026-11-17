// Lessons 6, 7 — common denominators. Both bars are cut into same-size
// pieces, so "how many sticks fit in the bar" becomes "pieces ÷ pieces".
import { box, fracEl, h, mathEl } from '../engine/dom';
import { F, Frac, lcm, makeOptions } from '../engine/frac';
import { anim, burst, flash, shake, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices } from './common';

interface SliceRound {
  a: string;
  b: string;
}

const X0 = 170;
const X1 = 1110;
const TOPY = 60;
const BOTY = 200;

export function slicePlan(r: SliceRound) {
  const a = F(r.a);
  const b = F(r.b);
  const ans = a.div(b);
  const L = lcm(a.d, b.d);
  const M = Math.max(1, Math.ceil(Math.max(a.value, b.value)));
  const options = makeOptions(ans, [b.div(a), a.mul(b), ans.add(1)], (v) => v.mul(b).value <= M * 1.6 + 1e-9);
  return { a, b, ans, L, M, options };
}

const slices = (w: number) => `repeating-linear-gradient(90deg, transparent 0 ${w - 2}px, rgba(255,255,255,.6) ${w - 2}px ${w}px)`;

const say = (r: SliceRound) => `How many blue sticks fit in the chocolate bar? ${F(r.a)} ÷ ${F(r.b)}.`;

export const slicer: Mechanic<SliceRound> = {
  id: 'slicer',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = slicePlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (p.L > 24) errs.push(`pieces too small (1/${p.L})`);
    if (p.M > 3) errs.push('bars too long');
    return errs;
  },

  build(r, arena, kit) {
    const { a, b, ans, L, M, options } = slicePlan(r);
    const unit = (X1 - X0) / M;
    const sw = unit / L; // one slice, in px
    arena.classList.add('bg-lab');

    const bar = box('choco', X0, TOPY, a.value * unit, 76);
    bar.style.backgroundImage = slices(sw);
    const stick = box('stick', X0, BOTY, b.value * unit, 50);
    stick.style.backgroundImage = slices(sw);
    arena.append(
      box('bar-lab', 40, TOPY + 6, 110, 64, fracEl(a)),
      box('bar-lab blue', 40, BOTY, 110, 50, fracEl(b)),
      bar,
      stick,
    );

    // Number line
    const line = box('numline', X0, 300, X1 - X0, 4);
    for (let i = 0; i <= M * L; i++) {
      const whole = i % L === 0;
      line.append(h('div', { class: `nl-tick ${whole ? 'big' : ''}`, style: { left: `${i * sw}px` } }));
      if (whole) line.append(h('div', { class: 'nl-lab', style: { left: `${i * sw}px` } }, String(i / L)));
    }
    arena.append(line);

    const hero = kit.hero(96).place(60, 462);
    const overlay = box('deck', X0, TOPY, 0, 0);
    const marks = box('deck', 0, 0, 0, 0);
    arena.append(hero.el, overlay, marks);

    function reset() {
      overlay.replaceChildren();
      bar.classList.remove('snap');
      hero.clearFx();
    }

    return {
      ask: { math: [a, '÷', b, '=', '?'], say: say(r) },
      choices: fracChoices(ans, options),

      async play(c) {
        reset();
        const v = c.value as Frac;
        const bw = b.value * unit;
        const full = v.floor();
        const rem = v.sub(full);
        const n = full + (rem.n ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const w = i < full ? bw : rem.value * bw;
          const over = (i * bw + w) > a.value * unit + 1;
          const cp = box(`stick-copy ${over ? 'over' : ''}`, i * bw, 0, Math.max(4, w - 2), 76);
          overlay.append(cp);
          sfx.pop();
          await anim(cp, [{ transform: `translateY(${BOTY - TOPY}px)`, opacity: 0.2 }, { transform: 'none', opacity: 1 }], 280);
        }
        const total = v.mul(b);
        if (total.eq(a)) {
          bar.classList.add('snap');
          sfx.nom();
          burst(arena, 'NOM!', X0 + a.value * unit + 60, TOPY + 20, '#FFD23F', 56);
          await hero.cheer();
          return;
        }
        if (total.lt(a)) {
          overlay.append(box('gap-mark', total.value * unit, -6, (a.value - total.value) * unit, 88));
        }
        await wait(300);
        // Wrong fit: the laser alarm zaps the raccoon.
        const beam = box('beam', hero.x + 30, 0, 10, hero.y + 30);
        arena.append(beam);
        sfx.zap();
        flash(kit.stage, 'rgba(255,60,90,.35)', 300);
        burst(arena, 'ZAP!', hero.x + 120, hero.y, '#FF4F8B', 60);
        hero.fx('frizz');
        hero.fx('soot');
        await shake(hero.el, 8);
        beam.remove();
      },

      hint() {
        // Clue: number the pieces in each bar, then it's pieces ÷ pieces.
        marks.replaceChildren();
        const A = a.mul(L).value;
        const B = b.mul(L).value;
        const fs = Math.min(22, sw * 0.6);
        for (let i = 0; i < A; i++) marks.append(box('slice-num', X0 + i * sw, TOPY + 80, sw, 24, String(i + 1)));
        for (let i = 0; i < B; i++) marks.append(box('slice-num blue', X0 + i * sw, BOTY + 54, sw, 24, String(i + 1)));
        marks.querySelectorAll<HTMLElement>('.slice-num').forEach((e) => (e.style.fontSize = `${fs}px`));
        marks.append(box('piece-math', 520, 360, 300, 80, mathEl([A, '÷', B])));
      },
    };
  },
};
