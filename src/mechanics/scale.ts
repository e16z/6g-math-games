// Unit 2, lesson 4 — equivalent ratios on a balance seesaw.
// a 🍊 balance b 🥭. With `have` 🍊, how many 🥭 keep it balanced?
import { box, h } from '../engine/dom';
import { F, Frac, gcd, makeOptions } from '../engine/frac';
import { anim, burst, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices, icons, plural, said } from './common';

interface ScaleRound {
  a: [string, number];
  b: [string, number];
  have: number;
}

export function scalePlan(r: ScaleRound) {
  const a = r.a[1];
  const b = r.b[1];
  const k = new Frac(r.have, a);
  const ans = k.mul(b);
  const options = makeOptions(ans, [F(b - (a - r.have)), F(b + (r.have - a)), new Frac(r.have * a, b), ans.add(b)], (v) => v.le(40) && v.isInt);
  return { a, b, k, ans, options };
}

const say = (r: ScaleRound) => `${said(r.a[1], r.a[0])} balance ${said(r.b[1], r.b[0])}. How many ${plural(r.b[0])} balance ${said(r.have, r.a[0])}?`;

export const scale: Mechanic<ScaleRound> = {
  id: 'scale',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = scalePlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (!p.ans.isInt) errs.push('answer must be a whole number');
    if (Math.max(p.a, p.b, r.have, p.ans.value) > 24) errs.push('too many to draw');
    if (r.have % (p.a / gcd(p.a, p.b)) !== 0) errs.push('have must split into whole balanced groups');
    return errs;
  },

  build(r, arena, kit) {
    const { a, b, ans, options } = scalePlan(r);
    const [ia] = r.a;
    const [ib] = r.b;
    arena.classList.add('bg-hall');

    // Reference: a balanced scale.
    const ref = box('seesaw small', 40, 40, 520, 180,
      h('div', { class: 'pan left' }, icons(ia, a, 22)),
      h('div', { class: 'pan right' }, icons(ib, b, 22)),
      h('div', { class: 'beam' }),
      h('div', { class: 'fulcrum' }),
      h('div', { class: 'balanced' }, '⚖️ ✓'),
    );
    // The real one: our pile vs "?".
    const pile = h('div', { class: 'pan left' }, icons(ia, r.have, 26));
    const right = h('div', { class: 'pan right' }, h('span', { class: 'q-chip' }, '?'));
    const beam = h('div', { class: 'beam big' });
    const rig = box('seesaw', 600, 150, 620, 260, h('div', { class: 'tilt' }, pile, right, beam), h('div', { class: 'fulcrum big' }));
    const tilt = rig.querySelector('.tilt') as HTMLElement;
    // The raccoon rides the right end of the seesaw (it tips with the beam).
    const hero = kit.hero(84).place(520, 186);
    tilt.append(hero.el);
    const groups = box('deck', 0, 0, 0, 0);
    arena.append(ref, rig, groups, box('ground', 0, 455, 1280, 20));

    const setTilt = (deg: number, ms = 500) => anim(tilt, [{ transform: tilt.style.transform || 'rotate(0deg)' }, { transform: `rotate(${deg}deg)` }], { duration: ms, easing: 'cubic-bezier(.3,1.6,.6,1)' });

    return {
      ask: { math: [F(a), ia, '=', F(b), ib, h('span', { class: 'gap' }), F(r.have), ia, '=', '?', ib], say: say(r) },
      choices: fracChoices(ans, options),

      async play(c) {
        hero.clearFx();
        hero.el.style.transform = '';
        hero.place(520, 186);
        await setTilt(0, 200);
        const v = (c.value as Frac).value;
        right.replaceChildren(icons(ib, v, 26));
        sfx.thud();
        await anim(right, [{ transform: 'translateY(-160px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 350);
        const cmp = Math.sign(v - ans.value);
        if (cmp === 0) {
          await setTilt(4, 250);
          await setTilt(-3, 250);
          await setTilt(0, 300);
          burst(arena, 'BALANCED!', 910, 110, '#7CFF6B', 56);
          await hero.cheer();
          return;
        }
        if (cmp > 0) {
          // Too heavy on the right: CRASH, the raccoon gets squished.
          sfx.boom();
          await setTilt(14, 400);
          burst(arena, 'CRASH!', 1100, 300, '#FF4F8B', 64);
          hero.fx('dizzy');
          await anim(hero.el, [{ transform: 'none' }, { transform: 'scaleY(.5)', transformOrigin: 'bottom' }, { transform: 'none' }], 600);
          return;
        }
        // Too light: the right side flings up — and the raccoon with it.
        sfx.boing();
        await setTilt(-14, 300);
        sfx.whistleUp();
        burst(arena, 'WHEEE!', 1000, 80, '#3EE6FF', 64);
        await anim(hero.el, [{ transform: 'none' }, { transform: 'translate(-200px,-500px) rotate(-540deg)' }], { duration: 800, easing: 'ease-out' });
        await wait(250);
        hero.el.style.transform = '';
        sfx.whistleDown();
        await anim(hero.el, [{ transform: 'translateY(-500px)' }, { transform: 'none' }], { duration: 500, easing: 'ease-in' });
        sfx.thud();
        hero.fx('dizzy');
      },

      hint() {
        // Clue: split into the smallest balanced groups, then make enough groups for our pile.
        groups.replaceChildren();
        const d = gcd(a, b);
        const row = box('batch-row', 40, 240, 540, 200);
        for (let i = 0; i < r.have / (a / d); i++) {
          row.append(h('div', { class: 'batch' }, h('div', {}, icons(ia, a / d, 20)), h('div', {}, icons(ib, b / d, 20))));
        }
        groups.append(row);
      },
    };
  },
};
