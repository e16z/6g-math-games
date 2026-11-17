// Unit 3, lessons 1–2 — units of measure.
//   kind 'best'   — pick the best unit to measure something
//   kind 'longer' — which rope is longer (different units)? Escape out the window.
import { box, h, mathEl } from '../engine/dom';
import { anim, burst, shake, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';

/** Size of each unit in a common base (mm, mL or g). */
const SIZE: Record<string, number> = {
  mm: 1, cm: 10, in: 25.4, ft: 304.8, yd: 914.4, m: 1000, km: 1e6, mi: 1609344,
  mL: 1, 'fl oz': 29.57, cup: 236.6, qt: 946.4, L: 1000, gal: 3785,
  g: 1, oz: 28.35, lb: 453.6, kg: 1000, ton: 907185,
};
const WORD: Record<string, string> = {
  mm: 'millimeters', cm: 'centimeters', in: 'inches', ft: 'feet', yd: 'yards', m: 'meters', km: 'kilometers', mi: 'miles',
  mL: 'milliliters', 'fl oz': 'fluid ounces', cup: 'cups', qt: 'quarts', L: 'liters', gal: 'gallons',
  g: 'grams', oz: 'ounces', lb: 'pounds', kg: 'kilograms', ton: 'tons',
};

type UnitsRound =
  | { kind: 'best'; item: string; name: string; units: [string, string, string]; answer: string }
  | { kind: 'longer'; a: [number, string]; b: [number, string] };

const say = (r: UnitsRound) =>
  r.kind === 'best'
    ? `What is the best unit to measure ${r.name}?`
    : `Which rope is longer? Rope A is ${r.a[0]} ${WORD[r.a[1]]}. Rope B is ${r.b[0]} ${WORD[r.b[1]]}.`;

export function unitsTruth(r: UnitsRound) {
  if (r.kind === 'best') return r.answer;
  const la = r.a[0] * SIZE[r.a[1]];
  const lb = r.b[0] * SIZE[r.b[1]];
  return Math.abs(la - lb) < 1e-6 ? 'same' : la > lb ? 'A' : 'B';
}

export const units: Mechanic<UnitsRound> = {
  id: 'units',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    if (r.kind === 'best') {
      const errs = r.units.filter((u) => !(u in SIZE)).map((u) => `unknown unit ${u}`);
      if (!r.units.includes(r.answer)) errs.push('answer must be one of the units');
      return errs;
    }
    return [r.a[1], r.b[1]].filter((u) => !(u in SIZE)).map((u) => `unknown unit ${u}`);
  },

  build(r, arena, kit) {
    return r.kind === 'best' ? buildBest(r, arena, kit) : buildLonger(r, arena, kit);
  },
};

function buildBest(r: Extract<UnitsRound, { kind: 'best' }>, arena: HTMLElement, kit: Parameters<Mechanic['build']>[2]) {
  arena.classList.add('bg-lab');
  const item = box('measure-item', 120, 80, 300, 300, r.item);
  const ruler = box('big-ruler hidden', 60, 360, 0, 50);
  const counter = box('count-up hidden', 520, 60, 500, 120);
  const hero = kit.hero(110).place(760, 455);
  const beard = box('beard hidden', 0, 0);
  arena.append(item, ruler, counter, hero.el, beard, box('ground', 0, 455, 1280, 20));
  const label = (u: string) => h('div', { class: 'unit-choice' }, u);

  return {
    ask: { math: [h('span', { class: 'ask-item' }, r.item), '📏', '?'], say: say(r) },
    choices: r.units.map((u) => ({ label: label(u), value: u, correct: u === r.answer, solved: () => h('span', { class: 'fr num solved' }, u) })),

    async play(c: { value: unknown; correct: boolean }) {
      hero.clearFx();
      beard.classList.add('hidden');
      counter.classList.add('hidden');
      item.style.transform = '';
      const u = c.value as string;
      const ratio = SIZE[u] / SIZE[r.answer];
      ruler.classList.remove('hidden');
      ruler.textContent = u;
      if (c.correct) {
        await anim(ruler, [{ width: '0px' }, { width: '360px' }], 600);
        sfx.right();
        burst(arena, 'JUST RIGHT!', 600, 120, '#7CFF6B', 56);
        await hero.cheer();
        return;
      }
      if (ratio > 1) {
        // Unit way too big: the ruler zooms off-screen and the thing is a speck.
        await anim(ruler, [{ width: '0px' }, { width: '1300px' }], 600);
        await anim(item, [{ transform: 'scale(1)' }, { transform: 'scale(.06)' }], 600);
        burst(arena, '0.0001?!', 300, 200, '#FFD23F', 64);
        hero.say('🔍 Where is it?');
        sfx.wrong();
        await wait(900);
        return;
      }
      // Unit way too small: count, count, count... grow a beard.
      await anim(ruler, [{ width: '0px' }, { width: '360px' }], 400);
      counter.classList.remove('hidden');
      for (const n of ['1', '2', '3', '4', '5', '...', '...', 'So many!']) {
        counter.textContent = n;
        sfx.tick(3);
        await wait(220);
      }
      beard.className = 'beard';
      beard.style.left = `${hero.x + 6}px`;
      beard.style.top = `${hero.y + 60}px`;
      burst(arena, 'STILL COUNTING...', 760, 140, '#B388FF', 46);
      await shake(hero.el, 3);
    },

    hint() {
      // Clue: units from tiny to huge, with this thing's size marked.
      const sizes = [...r.units].sort((a, b) => SIZE[a] - SIZE[b]);
      arena.querySelector('.unit-ladder')?.remove();
      arena.append(box('unit-ladder', 480, 220, 760, 90, ...sizes.map((u, i) => h('div', { class: `rung ${u === r.answer ? 'fit' : ''}`, style: { fontSize: `${26 + i * 10}px` } }, u))));
    },
  };
}

function buildLonger(r: Extract<UnitsRound, { kind: 'longer' }>, arena: HTMLElement, kit: Parameters<Mechanic['build']>[2]) {
  arena.classList.add('bg-night');
  const truth = unitsTruth(r);
  const la = r.a[0] * SIZE[r.a[1]];
  const lb = r.b[0] * SIZE[r.b[1]];
  const max = Math.max(la, lb);
  const DROP = 330; // window to ground, in px
  const ropeLen = (l: number) => (l / max) * (DROP + 40) * (Math.min(la, lb) / max < 0.85 ? 1 : 0.95);
  arena.append(box('tower-wall', 840, 0, 440, 470), box('window', 900, 30, 120, 110), box('ground', 0, 455, 1280, 20));
  const coil = (name: string, v: [number, string], x: number) =>
    box('rope-coil', x, 60, 280, 150, h('div', { class: 'can-name' }, name), h('div', { class: 'coil' }, '🪢'), mathEl([v[0], v[1]]));
  arena.append(coil('A', r.a, 80), coil('B', r.b, 420));
  const rope = box('rope hidden', 955, 120, 10, 0);
  const hero = kit.hero(90).place(915, 125);
  arena.append(rope, hero.el);
  const label = (txt: string) => h('div', { class: 'sort-choice' }, h('div', { class: 'sort-sym' }, txt), h('div', { class: 'sort-icon' }, txt === '=' ? '🪢🪢' : '🪢'));

  return {
    ask: { math: [h('span', { class: 'chip' }, 'A'), r.a[0], r.a[1], 'vs', h('span', { class: 'chip' }, 'B'), r.b[0], r.b[1]], say: say(r) },
    fixedOrder: true,
    choices: [
      { label: label('A'), value: 'A', correct: truth === 'A' },
      { label: label('='), value: 'same', correct: truth === 'same' },
      { label: label('B'), value: 'B', correct: truth === 'B' },
    ],

    async play(c: { value: unknown; correct: boolean }) {
      hero.clearFx();
      hero.el.style.transform = '';
      hero.place(915, 125);
      const pick = c.value as string;
      const len = pick === 'B' ? ropeLen(lb) : ropeLen(la);
      rope.classList.remove('hidden');
      sfx.whoosh();
      await anim(rope, [{ height: '0px' }, { height: `${len}px` }], 500);
      rope.style.height = `${len}px`;
      await anim(hero.el, [{ top: '35px' }, { top: `${Math.min(125 + len - 90, 365)}px` }], { duration: 900, easing: 'ease-in' });
      if (c.correct) {
        hero.place(915, 455);
        burst(arena, 'ESCAPED!', 960, 260, '#7CFF6B', 56);
        sfx.right();
        await hero.cheer();
        return;
      }
      // The rope runs out. Long way down.
      sfx.whistleDown();
      burst(arena, 'AAAH!', 1000, 260, '#FF4F8B', 60);
      await anim(hero.el, [{ top: hero.el.style.top }, { top: '365px' }], { duration: 400, easing: 'ease-in' });
      sfx.thud();
      burst(arena, '🌿 CRUNCH!', 960, 420, '#7CFF6B', 48);
      hero.fx('dizzy');
      await wait(500);
    },

    hint() {
      // Clue: measure both ropes in the same unit.
      arena.querySelector('.rope-hint')?.remove();
      const cm = (v: number) => Math.round(v / 10);
      arena.append(box('rope-hint', 80, 250, 680, 120,
        h('div', { class: 'cmp-row' }, h('span', { class: 'chip' }, 'A'), mathEl([r.a[0], r.a[1], '≈', cm(la), 'cm'])),
        h('div', { class: 'cmp-row' }, h('span', { class: 'chip' }, 'B'), mathEl([r.b[0], r.b[1], '≈', cm(lb), 'cm'])),
      ));
    },
  };
}
