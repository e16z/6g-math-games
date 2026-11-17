// Lessons 11, 12 — "How many times as tall?" The grow ray multiplies the
// raccoon's height; match the guard exactly to sneak past.
import { box, fracEl, h } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, flash, shake, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import { guardSvg } from '../art/characters';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices } from './common';

interface RayRound {
  from: string;
  to: string;
  /** Ask "what percent?" and show answers as percents. */
  pct?: boolean;
}

const UNIT = 100;
const FLOOR = 455;
const HX = 190;
const GX = 840;

export function rayPlan(r: RayRound) {
  const from = F(r.from);
  const to = F(r.to);
  const ans = to.div(from);
  const ok = (v: Frac) => from.mul(v).value <= 10 && (!r.pct || v.mul(100).isInt);
  const cands = r.pct ? [from.div(to), ans.add(F('1/2')), ans.sub(F('1/4')), ans.mul(2)] : [from.div(to), to.sub(from), ans.add(1), to.mul(from)];
  const options = makeOptions(ans, cands, ok);
  return { from, to, ans, options };
}

const askSay = (r: RayRound) =>
  r.pct
    ? `What percent of ${F(r.from)} is ${F(r.to)}? Zap the raccoon to the guard's size.`
    : `Make the raccoon as tall as the guard. ${F(r.from)} times what equals ${F(r.to)}?`;

export const ray: Mechanic<RayRound> = {
  id: 'ray',
  lines: (r) => [{ who: 'narrator', text: askSay(r) }],

  validate(r) {
    const p = rayPlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (p.from.gt(4) || p.to.gt(4)) errs.push('heights must be 4 or less to fit');
    if (p.from.lt(F('1/2'))) errs.push('raccoon too small to see');
    return errs;
  },

  build(r, arena, kit) {
    const { from, to, ans, options } = rayPlan(r);
    arena.classList.add('bg-hall');

    const ruler = box('vruler', 40, FLOOR - 4 * UNIT, 40, 4 * UNIT);
    for (let i = 0; i <= 4; i++) {
      ruler.append(h('div', { class: 'vtick', style: { top: `${(4 - i) * UNIT}px` } }), h('div', { class: 'vtick-lab', style: { top: `${(4 - i) * UNIT}px` } }, String(i)));
    }
    const ty = FLOOR - to.value * UNIT;
    arena.append(
      box('ground', 0, FLOOR, 1280, 20),
      ruler,
      box('target-line', 100, ty, 1080, 0),
      box('h-lab gold', 1190, ty - 30, 80, 60, fracEl(to)),
    );

    const gh = to.value * UNIT;
    const guard = box('guard', GX, FLOOR - gh, gh * 0.5, gh, guardSvg());
    const guardSay = box('guard-say hidden', GX + gh * 0.25 - 30, FLOOR - gh - 70, 60, 60);
    arena.append(guard, guardSay);

    const hero = kit.hero(from.value * UNIT).place(HX, FLOOR);
    const heroLab = box('h-lab', 100, FLOOR - from.value * UNIT - 30, 80, 60, fracEl(from));
    const gun = box('raygun', 580, 300, 150, 70, h('div', { class: 'raygun-tip' }));
    const stack = box('deck', 0, 0, 0, 0);
    arena.append(hero.el, heroLab, gun, stack);

    function say(txt: string) {
      guardSay.textContent = txt;
      guardSay.classList.remove('hidden');
      void anim(guardSay, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], 300);
    }

    async function unzap() {
      await anim(hero.el, [{ transform: hero.el.style.transform || 'none' }, { transform: 'none' }], 400);
      hero.el.style.transform = '';
      hero.place(HX, FLOOR);
    }

    return {
      ask: { math: r.pct ? ['?', 'of', from, '=', to] : [from, '×', '?', '=', to], say: askSay(r) },
      choices: fracChoices(ans, options, r.pct ? 'pct' : 'frac'),

      async play(c) {
        guardSay.classList.add('hidden');
        hero.clearFx();
        if (hero.el.style.transform) await unzap();
        const v = c.value as Frac;
        const beam = box('ray-beam', HX + hero.width / 2, FLOOR - (from.value * UNIT) / 2 - 6, 580 - HX - hero.width / 2, 12);
        arena.append(beam);
        sfx.zap();
        await anim(beam, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0 }], 450);
        beam.remove();
        hero.el.style.transformOrigin = 'bottom left';
        await anim(hero.el, [{ transform: 'scale(1)' }, { transform: `scale(${v.value})` }], { duration: 700, easing: 'cubic-bezier(.3,1.4,.6,1)' });
        const newH = from.mul(v);
        const cmp = newH.cmp(to);

        if (cmp === 0) {
          say('?');
          await wait(300);
          hero.say('😎');
          const w = hero.width * v.value;
          await anim(hero.el, [{ left: `${HX}px` }, { left: `${1290}px` }], { duration: 1300, easing: 'linear' });
          hero.place(1290 - w, FLOOR);
          burst(arena, 'SNEAKY!', 1050, 150, '#7CFF6B', 56);
          sfx.right();
          return;
        }
        if (cmp > 0) {
          if (newH.value * UNIT > FLOOR) {
            sfx.thud();
            burst(arena, 'BONK!', HX + 80, 40, '#FFD23F', 70);
            await shake(arena, 10, 500);
            hero.fx('dizzy');
          } else {
            say('!');
            sfx.alarm();
            flash(kit.stage, 'rgba(255,40,60,.4)', 900);
            burst(arena, 'TOO BIG!', 640, 120, '#FF4F8B', 60);
            await wait(800);
          }
        } else {
          // Too tiny: a pigeon mistakes the raccoon for a snack.
          say('?');
          hero.say('eep!');
          sfx.squeak();
          const bird = box('bird', 1300, 40, 80, 80, '🐦');
          arena.append(bird);
          const hx = HX;
          const hy = FLOOR - newH.value * UNIT - 70;
          await anim(bird, [{ left: '1300px', top: '40px' }, { left: `${hx}px`, top: `${hy}px` }], { duration: 700, easing: 'ease-in' });
          sfx.whoosh();
          await Promise.all([
            anim(bird, [{ left: `${hx}px`, top: `${hy}px` }, { left: '-200px', top: '-150px' }], 800),
            anim(hero.el, [{ translate: '0 0' }, { translate: `${-hx - 200}px ${-hy - 220}px` }], 800),
          ]);
          bird.remove();
          await wait(250);
          hero.el.style.translate = '';
          sfx.whistleDown();
          await anim(hero.el, [{ translate: '0 -500px' }, { translate: '0 0' }], { duration: 500, easing: 'ease-in' });
          sfx.thud();
          hero.fx('dizzy');
        }
        await unzap();
      },

      hint() {
        stack.replaceChildren();
        if (r.pct) {
          // Clue: cut the raccoon's height into equal percent pieces and stack them.
          const pctN = ans.mul(100).value;
          const k = pctN % 25 === 0 ? 4 : pctN % 20 === 0 ? 5 : 10;
          const ph = (from.value * UNIT) / k;
          const n = Math.round((pctN * k) / 100);
          for (let i = 0; i < n; i++) {
            stack.append(box('stack-box', GX - 100, FLOOR - (i + 1) * ph, 76, ph));
            stack.append(box('stack-lab small', GX - 100, FLOOR - (i + 1) * ph + ph / 2 - 14, 76, 28, `${100 / k}%`));
          }
          return;
        }
        // Clue: stack copies of the raccoon's height next to the guard.
        const bh = from.value * UNIT;
        const n = Math.ceil(ans.value);
        for (let i = 0; i < n; i++) {
          stack.append(box('stack-box', GX - 90, FLOOR - (i + 1) * bh, 60, bh));
        }
        const full = ans.floor();
        for (let i = 0; i < full; i++) stack.append(box('stack-lab', GX - 90, FLOOR - (i + 1) * bh + bh / 2 - 18, 60, 36, String(i + 1)));
        const rem = ans.sub(full);
        stack.append(box('stack-fill', GX - 90, ty, 60, FLOOR - ty));
        if (rem.n) stack.append(box('stack-lab', GX - 90, FLOOR - (full + rem.value / 2) * bh - 22, 60, 44, fracEl(rem)));
      },
    };
  },
};
