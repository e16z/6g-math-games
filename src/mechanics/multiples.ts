// Unit 2, lessons 7–8 — least common multiple (trains) and greatest common factor (bags).
import { box, h } from '../engine/dom';
import { F, Frac, gcd, lcm, makeOptions } from '../engine/frac';
import { anim, burst, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices, icons } from './common';

interface MultRound {
  kind: 'lcm' | 'gcf';
  a: number;
  b: number;
  /** gcf: what goes in the bags. */
  items?: [string, string];
}

const NAMES: Record<string, string> = { '🍪': 'cookies', '🧁': 'cupcakes', '🍩': 'donuts', '🍬': 'candies', '🥨': 'pretzels', '🍫': 'chocolates' };

export function multPlan(r: MultRound) {
  if (r.kind === 'lcm') {
    const ans = F(lcm(r.a, r.b));
    return { ans, options: makeOptions(ans, [F(r.a * r.b), F(r.a + r.b), F(Math.max(r.a, r.b)), ans.mul(2)]) };
  }
  const g = gcd(r.a, r.b);
  let smaller = 1;
  for (let f = g - 1; f >= 1; f--) if (r.a % f === 0 && r.b % f === 0) { smaller = f; break; }
  const ans = F(g);
  return { ans, options: makeOptions(ans, [F(smaller), F(Math.min(r.a, r.b)), F(g + 1)], (v) => v.le(12)) };
}

const say = (r: MultRound) =>
  r.kind === 'lcm'
    ? `The red train comes every ${r.a} minutes. The blue train comes every ${r.b} minutes. When do they both come?`
    : `Share ${r.a} ${NAMES[r.items?.[0] ?? '🍪']} and ${r.b} ${NAMES[r.items?.[1] ?? '🧁']} into matching bags. What is the most bags?`;

export const multiples: Mechanic<MultRound> = {
  id: 'multiples',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = multPlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (r.kind === 'lcm' && Math.max(...p.options.map((o) => o.value)) > 40) errs.push('times too big for the track');
    if (r.kind === 'gcf' && (r.a > 24 || r.b > 24 || Math.max(...p.options.map((o) => o.value)) > 12)) errs.push('too many to bag');
    return errs;
  },

  build(r, arena, kit) {
    return r.kind === 'lcm' ? buildTrains(r, arena, kit) : buildBags(r, arena, kit);
  },
};

function buildTrains(r: MultRound, arena: HTMLElement, kit: Parameters<Mechanic['build']>[2]) {
  const { ans, options } = multPlan(r);
  const N = Math.max(...options.map((o) => o.value)) + 2;
  arena.classList.add('bg-station');
  const X0 = 100;
  const gap = 1080 / N;
  const lanes = { a: 110, b: 210 };
  arena.append(
    box('lane red', X0 - 10, lanes.a + 34, 1100, 8),
    box('lane blue', X0 - 10, lanes.b + 34, 1100, 8),
    box('lane-lab', 10, lanes.a, 80, 60, h('span', { class: 'train-red' }, '🚂'), h('b', {}, String(r.a))),
    box('lane-lab', 10, lanes.b, 80, 60, h('span', { class: 'train-blue' }, '🚃'), h('b', {}, String(r.b))),
    box('platform', 0, 400, 1280, 70),
  );
  const marks = box('deck', 0, 0, 0, 0);
  const nums = box('deck', 0, 0, 0, 0);
  const cursor = box('time-cursor hidden', X0, 70, 4, 260);
  const clock = box('clock', 1110, 10, 150, 80, '⏰ ', h('b', {}, '0'));
  arena.append(marks, nums, cursor, clock);
  for (let t = 1; t <= N; t++) arena.append(box('time-tick', X0 + t * gap - 1, 300, 2, 14));
  const hero = kit.hero(80).place(14, 405);
  arena.append(hero.el);

  return {
    ask: { math: [h('span', { class: 'train-red' }, '🚂'), r.a, h('span', { class: 'gap' }), h('span', { class: 'train-blue' }, '🚃'), r.b, h('span', { class: 'gap' }), '⏰', '=', '?'], say: say(r) },
    choices: fracChoices(ans, options),

    async play(c: { value: unknown; correct: boolean }) {
      hero.clearFx();
      marks.replaceChildren();
      arena.querySelectorAll('.escape').forEach((e) => e.remove());
      const v = (c.value as Frac).value;
      cursor.classList.remove('hidden');
      const step = Math.min(160, 2200 / v);
      for (let t = 1; t <= v; t++) {
        cursor.style.left = `${X0 + t * gap}px`;
        (clock.lastChild as HTMLElement).textContent = String(t);
        if (t % r.a === 0) marks.append(box('train-mark red', X0 + t * gap - 18, lanes.a, 36, 36, '🚂'));
        if (t % r.b === 0) marks.append(box('train-mark blue', X0 + t * gap - 18, lanes.b, 36, 36, '🚃'));
        if (t % r.a === 0 || t % r.b === 0) sfx.tick(t);
        await wait(step);
      }
      const both = v % r.a === 0 && v % r.b === 0;
      if (both && v === ans.value) {
        sfx.right();
        burst(arena, 'ALL ABOARD!', X0 + v * gap, 60, '#7CFF6B', 52);
        await hero.cheer();
        return;
      }
      if (both) {
        // A common time — but not the first one. Baron already left with the snacks.
        const at = X0 + ans.value * gap;
        arena.append(box('escape', at - 40, 14, 80, 80, '🦹'), box('escape-arrow escape', at - 4, 90, 8, 240));
        burst(arena, 'TOO LATE!', at, 60, '#FF4F8B', 54);
        sfx.wrong();
        await shake(hero.el, 6);
        return;
      }
      // Only one train (or none): the raccoon waits on the wrong platform. WHOOSH.
      sfx.whoosh();
      burst(arena, 'WHOOSH!', 640, 340, '#3EE6FF', 60);
      await anim(hero.el, [{ transform: 'none' }, { transform: 'rotate(-25deg) translateX(-30px)' }, { transform: 'none' }], 500);
      hero.fx('frizz');
    },

    hint() {
      // Clue: number every minute so the matching ones are easy to spot.
      nums.replaceChildren();
      for (let t = 1; t <= N; t++) {
        const red = t % r.a === 0;
        const blue = t % r.b === 0;
        nums.append(box(`time-num ${red ? 'r' : ''} ${blue ? 'b' : ''}`, X0 + t * gap - 20, 318, 40, 40, String(t)));
      }
    },
  };
}

function buildBags(r: MultRound, arena: HTMLElement, kit: Parameters<Mechanic['build']>[2]) {
  const { ans, options } = multPlan(r);
  const [ia, ib] = r.items ?? ['🍪', '🧁'];
  arena.classList.add('bg-kitchen');
  arena.append(box('pile-row', 40, 20, 1200, 60, icons(ia, r.a, 36)), box('pile-row', 40, 84, 1200, 60, icons(ib, r.b, 36)));
  const bags = box('bags', 40, 170, 1000, 220);
  const chart = box('deck', 0, 0, 0, 0);
  const hero = kit.hero(90).place(1110, 455);
  arena.append(bags, chart, hero.el, box('ground kitchen-floor', 0, 455, 1280, 20));

  return {
    ask: { math: [r.a, ia, h('span', { class: 'gap' }), r.b, ib, '→', '?', '👜'], say: say(r) },
    choices: fracChoices(ans, options),

    async play(c: { value: unknown; correct: boolean }) {
      hero.clearFx();
      bags.replaceChildren();
      arena.querySelectorAll('.leftover').forEach((e) => e.remove());
      const v = (c.value as Frac).value;
      const pa = Math.floor(r.a / v);
      const pb = Math.floor(r.b / v);
      for (let i = 0; i < v; i++) {
        const bag = h('div', { class: 'bag' }, h('div', {}, icons(ia, pa, 20)), h('div', {}, icons(ib, pb, 20)), h('div', { class: 'bag-ico' }, '👜'));
        bags.append(bag);
        sfx.pop();
        await anim(bag, [{ transform: 'translateY(-120px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 200);
      }
      const leftA = r.a - pa * v;
      const leftB = r.b - pb * v;
      if (v === ans.value) {
        sfx.right();
        burst(arena, 'PERFECT BAGS!', 540, 160, '#7CFF6B', 54);
        await hero.cheer();
        return;
      }
      if (leftA || leftB) {
        // Leftovers fall out... and the pigeons take them.
        const left = box('leftover', 1060, 200, 200, 120, icons(ia, leftA, 26), icons(ib, leftB, 26));
        arena.append(left);
        sfx.squeak();
        burst(arena, 'LEFTOVERS!', 1150, 170, '#FFD23F', 50);
        const bird = box('bird', 1300, 120, 80, 80, '🐦');
        arena.append(bird);
        await anim(bird, [{ left: '1300px' }, { left: '1120px' }], 500);
        await Promise.all([anim(bird, [{ left: '1120px', top: '120px' }, { left: '1400px', top: '-80px' }], 600), anim(left, [{ transform: 'none' }, { transform: 'translate(280px,-260px)' }], 600)]);
        bird.remove();
        hero.say('HEY!');
        return;
      }
      // Fair bags, but too few: each one is too heavy to carry.
      await hero.walkTo(980, 400);
      burst(arena, 'OOF!', 1020, 330, '#FF4F8B', 60);
      sfx.thud();
      await anim(hero.el, [{ transform: 'none' }, { transform: 'scaleY(.6)', transformOrigin: 'bottom' }, { transform: 'none' }], 500);
      hero.fx('dizzy');
      spray(arena, 1020, 400, ['💦'], 6, 160, 30);
      await hero.walkTo(1110, 400);
    },

    hint() {
      // Clue: which numbers split BOTH piles evenly?
      chart.replaceChildren();
      const max = Math.max(r.a, r.b);
      const row = box('factor-row', 40, 395, 1000, 56);
      for (let n = 1; n <= Math.min(max, 12); n++) {
        const fa = r.a % n === 0;
        const fb = r.b % n === 0;
        row.append(h('div', { class: `factor ${fa ? 'fa' : ''} ${fb ? 'fb' : ''}` }, String(n)));
      }
      chart.append(row);
    },
  };
}
