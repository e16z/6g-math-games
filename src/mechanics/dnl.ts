// Unit 2 lesson 5, Unit 3 lesson 3 — double number lines (and unit conversion).
// Two tracks count up together. The cart rides to your answer; the snack waits
// where the two tracks match.
import { box, fracEl, h } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, shake, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices, plural, said } from './common';

interface DnlRound {
  /** Row label (emoji or unit like "ft") and how much each tick adds. */
  top: [string, number];
  bottom: [string, number];
  ticks: number;
  /** Which tick the question is about, and which row has the "?". */
  at: number;
  ask: 'top' | 'bottom';
  /** Ticks already labeled (besides 0). */
  shown?: number[];
}

const X0 = 170;
const X1 = 1150;
const YT = 120;
const YB = 290;

export function dnlPlan(r: DnlRound) {
  const askStep = r.ask === 'top' ? r.top[1] : r.bottom[1];
  const otherStep = r.ask === 'top' ? r.bottom[1] : r.top[1];
  const ans = F(askStep * r.at);
  const known = otherStep * r.at;
  const options = makeOptions(ans, [F(known + askStep - otherStep), ans.add(askStep), ans.sub(askStep), F(known)], (v) => v.isInt);
  return { askStep, otherStep, ans, known, options };
}

const say = (r: DnlRound) => {
  const [askL, otherL] = r.ask === 'top' ? [r.top[0], r.bottom[0]] : [r.bottom[0], r.top[0]];
  const p = dnlPlan(r);
  return `${said(r.top[1], r.top[0])} ${r.top[1] === 1 ? 'goes' : 'go'} with ${said(r.bottom[1], r.bottom[0])}. How many ${plural(askL)} go with ${said(p.known, otherL)}?`;
};

export const dnl: Mechanic<DnlRound> = {
  id: 'dnl',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = dnlPlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (r.ticks > 10 || r.at > r.ticks || r.at < 2) errs.push('ticks must be ≤ 10 and 2 ≤ at ≤ ticks');
    return errs;
  },

  build(r, arena, kit) {
    const { askStep, ans, known, options } = dnlPlan(r);
    arena.classList.add('bg-mine');
    const gap = (X1 - X0) / r.ticks;
    const yAsk = r.ask === 'top' ? YT : YB;
    const shown = new Set([0, ...(r.shown ?? [1])]);

    const rail = (y: number) => box('rail', X0 - 20, y, X1 - X0 + 60, 6);
    arena.append(rail(YT), rail(YB), box('row-lab', 20, YT - 34, 130, 64, r.top[0]), box('row-lab', 20, YB - 34, 130, 64, r.bottom[0]));
    const labels = box('deck', 0, 0, 0, 0);
    arena.append(labels);
    const label = (i: number, row: 'top' | 'bottom', content: Node | string, cls = '') => {
      const y = row === 'top' ? YT - 58 : YB + 18;
      labels.append(box(`tick-num ${cls}`, X0 + i * gap - 40, y, 80, 40, content));
    };
    for (let i = 0; i <= r.ticks; i++) {
      arena.append(box('rail-tick', X0 + i * gap - 3, YT - 12, 6, 30), box('rail-tick', X0 + i * gap - 3, YB - 12, 6, 30));
      if (shown.has(i)) {
        label(i, 'top', fracEl(r.top[1] * i));
        label(i, 'bottom', fracEl(r.bottom[1] * i));
      }
    }
    // The question: known value on one row, "?" on the other.
    label(r.at, r.ask === 'top' ? 'bottom' : 'top', fracEl(known), 'known');
    label(r.at, r.ask, h('span', { class: 'q-chip' }, '?'), 'asked');
    arena.append(box('station-snack', X0 + r.at * gap - 28, yAsk + (r.ask === 'top' ? -110 : 60), 56, 56, '🍪'));
    arena.append(box('end-wall', X1 + 40, yAsk - 80, 26, 120));

    const cart = box('cart', X0 - 50, yAsk - 96, 100, 100);
    const hero = kit.hero(70);
    hero.el.style.position = 'absolute';
    hero.el.style.left = '15px';
    hero.el.style.top = '-30px';
    cart.append(hero.el, h('div', { class: 'cart-body' }, '🛒'));
    arena.append(cart);

    const xFor = (v: number) => X0 + (v / askStep) * gap;

    return {
      ask: { math: [F(r.top[1]), r.top[0], ':', F(r.bottom[1]), r.bottom[0], h('span', { class: 'gap' }), ...(r.ask === 'top' ? ['?', r.top[0], ':', F(known), r.bottom[0]] : [F(known), r.top[0], ':', '?', r.bottom[0]])], say: say(r) },
      choices: fracChoices(ans, options),

      async play(c) {
        hero.clearFx();
        cart.style.transform = '';
        cart.style.left = `${X0 - 50}px`;
        const v = (c.value as Frac).value;
        const end = X1 + 40;
        const tx = Math.min(xFor(v), end - 50);
        sfx.whoosh();
        cart.classList.add('rolling');
        await anim(cart, [{ left: `${X0 - 50}px` }, { left: `${tx - 50}px` }], { duration: 1200, easing: 'ease-in-out' });
        cart.classList.remove('rolling');
        if (v === ans.value) {
          sfx.nom();
          burst(arena, 'GOT IT!', tx, yAsk - 140, '#7CFF6B', 56);
          await hero.cheer();
          return;
        }
        if (xFor(v) > end - 50) {
          sfx.thud();
          burst(arena, 'BONK!', end, yAsk - 60, '#FFD23F', 64);
          await shake(cart, 10);
        } else {
          burst(arena, 'MISSED!', tx, yAsk - 140, '#FF4F8B', 56);
          sfx.wrong();
        }
        await anim(cart, [{ transform: 'none' }, { transform: 'rotate(160deg) translateY(-20px)' }], 450);
        hero.fx('dizzy');
        await wait(500);
        await anim(cart, [{ transform: 'rotate(160deg) translateY(-20px)' }, { transform: 'none' }], 300);
      },

      hint() {
        // Clue: count up both tracks, tick by tick.
        for (let i = 0; i <= r.ticks; i++) {
          if (shown.has(i) || i === r.at) continue;
          label(i, 'top', fracEl(r.top[1] * i), 'hinted');
          label(i, 'bottom', fracEl(r.bottom[1] * i), 'hinted');
        }
        label(r.at, r.ask === 'top' ? 'bottom' : 'top', fracEl(known), 'known');
      },
    };
  },
};
