// Lessons 13, 14 — area and volume with fraction side lengths.
//   kind 'volume' — fill a crate with tiny ½-unit cubes (each is 1/8)
//   kind 'area'   — cut a hole the right size for the loot box
import { box, fracEl, h, mathEl, s } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, flash, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Kit, Mechanic, Scene } from '../engine/types';
import { checkOptions, fracChoices } from './common';

// unit: fill with whole unit cubes (each is 1) instead of ½-unit cubes (each is 1/8).
type CrateRound = { kind: 'volume'; dims: [string, string, string]; unit?: boolean } | { kind: 'area'; side: string; area: string };

export function cratePlan(r: CrateRound) {
  if (r.kind === 'volume') {
    const [l, w, ht] = r.dims.map((d) => F(d));
    const ans = l.mul(w).mul(ht);
    const k = r.unit ? 1 : 2; // cubes per unit of length
    const L = l.mul(k);
    const W = w.mul(k);
    const H = ht.mul(k);
    const cap = L.mul(W).mul(H).value;
    const sa = l.mul(w).add(l.mul(ht)).add(w.mul(ht)).mul(2);
    const cands = r.unit ? [sa, l.add(w).add(ht), ans.add(1)] : [F(cap), l.add(w).add(ht), ans.add(1)];
    const options = makeOptions(ans, cands, (v) => v.mul(k ** 3).isInt);
    return { ans, options, l, w, ht, L, W, H, cap };
  }
  const side = F(r.side);
  const area = F(r.area);
  const ans = area.div(side);
  const options = makeOptions(ans, [area.mul(side), area.sub(side), ans.add(2)], (v) => v.le(10));
  return { ans, options, side, area };
}

const say = (r: CrateRound) =>
  r.kind === 'volume'
    ? r.unit
      ? 'How many sugar cubes fill this crate?'
      : 'How much loot fits in the crate? Each tiny cube is one eighth.'
    : `Cut a hole for the loot box. Its area is ${F(r.area)}. One side is ${F(r.side)}. How long is the other side?`;

export const crate: Mechanic<CrateRound> = {
  id: 'crate',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = cratePlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (r.kind === 'volume') {
      const halves = r.dims.map((d) => F(d).mul(r.unit ? 1 : 2));
      if (!halves.every((x) => x.isInt)) errs.push('sides must be whole or half units');
      else if (halves.reduce((acc, x) => acc * x.value, 1) > 64) errs.push('too many tiny cubes to draw');
    }
    return errs;
  },

  build(r, arena, kit) {
    return r.kind === 'volume' ? buildVolume(r, arena, kit) : buildArea(r, arena, kit);
  },
};

// ───────────── volume ─────────────

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

function buildVolume(r: { kind: 'volume'; dims: [string, string, string]; unit?: boolean }, arena: HTMLElement, kit: Kit): Scene {
  const k = r.unit ? 1 : 2;
  const each = new Frac(1, k ** 3);
  const { ans, options, l, w, ht } = cratePlan(r) as { ans: Frac; options: Frac[]; l: Frac; w: Frac; ht: Frac };
  const L = l.mul(k).value;
  const W = w.mul(k).value;
  const H = ht.mul(k).value;
  const cap = L * W * H;
  arena.classList.add('bg-garage');

  // Leave room under the box for the edge labels.
  const sz = Math.min(48, 520 / ((L + W) * COS), 320 / ((L + W) * SIN + H + 2));
  const oy = 392 - (L + W) * sz * SIN;
  const ox = 470 - ((L - W) * sz * COS) / 2;
  const P = (x: number, y: number, z: number) => `${ox + (x - y) * sz * COS},${oy + (x + y) * sz * SIN - z * sz}`;
  const poly = (pts: string[], fill: string, extra: Record<string, unknown> = {}) => s('polygon', { points: pts.join(' '), fill, stroke: '#1c2333', 'stroke-width': 1.5, ...extra });

  const svg = s('svg', { viewBox: '0 0 1280 470', width: 1280, height: 470, class: 'iso' }) as SVGSVGElement;
  const back = s('g', {});
  back.append(
    poly([P(0, 0, 0), P(L, 0, 0), P(L, W, 0), P(0, W, 0)], '#6b4a2b'),
    poly([P(0, 0, 0), P(0, W, 0), P(0, W, H), P(0, 0, H)], '#8a5f36'),
    poly([P(0, 0, 0), P(L, 0, 0), P(L, 0, H), P(0, 0, H)], '#7a5230'),
  );
  const cubes = s('g', {});
  const front = s('g', {});
  front.append(
    poly([P(L, 0, 0), P(L, W, 0), P(L, W, H), P(L, 0, H)], 'rgba(196,140,84,.28)', { stroke: '#d9a066', 'stroke-width': 3 }),
    poly([P(0, W, 0), P(L, W, 0), P(L, W, H), P(0, W, H)], 'rgba(196,140,84,.22)', { stroke: '#d9a066', 'stroke-width': 3 }),
  );
  const lid = poly([P(0, 0, H), P(L, 0, H), P(L, W, H), P(0, W, H)], '#a8743f', { stroke: '#5a3a1c', 'stroke-width': 3, opacity: 0 });
  svg.append(back, cubes, front, lid);
  arena.append(box('iso-wrap', 0, 0, 1280, 470, svg));

  const at = (pt: string, dx = 0, dy = 0) => {
    const [x, y] = pt.split(',').map(Number);
    return [x + dx, y + dy] as const;
  };
  const lab = (pt: readonly [number, number], f: Frac) => box('edge-lab', pt[0] - 40, pt[1] - 26, 80, 52, fracEl(f));
  const mid = (a: string, b: string) => {
    const [x1, y1] = at(a);
    const [x2, y2] = at(b);
    return [(x1 + x2) / 2, (y1 + y2) / 2] as const;
  };
  const m1 = mid(P(0, W, 0), P(L, W, 0));
  const m2 = mid(P(L, W, 0), P(L, 0, 0));
  const m3 = mid(P(L, 0, 0), P(L, 0, H));
  arena.append(lab([m1[0] - 30, m1[1] + 34], l), lab([m2[0] + 34, m2[1] + 30], w), lab([m3[0] + 52, m3[1]], ht));

  // Legend: one tiny cube is 1/8.
  const mini = s('svg', { viewBox: '-22 -26 44 50', width: 56, height: 60 });
  const q = (x: number, y: number, z: number) => `${(x - y) * 18 * COS},${(x + y) * 18 * SIN - z * 18}`;
  mini.append(
    s('polygon', { points: [q(0, 0, 1), q(1, 0, 1), q(1, 1, 1), q(0, 1, 1)].join(' '), fill: '#7fd8ff', stroke: '#1c2333' }),
    s('polygon', { points: [q(0, 1, 0), q(1, 1, 0), q(1, 1, 1), q(0, 1, 1)].join(' '), fill: '#3aa0d8', stroke: '#1c2333' }),
    s('polygon', { points: [q(1, 0, 0), q(1, 1, 0), q(1, 1, 1), q(1, 0, 1)].join(' '), fill: '#2a7bb0', stroke: '#1c2333' }),
  );
  const legend = box('legend', 960, 30, 260, 80, mini, mathEl(['=', each]));
  const hint = box('count-hint hidden', 900, 140, 340, 80);
  const hero = kit.hero(96).place(1110, 460);
  arena.append(legend, hint, hero.el);

  function cubeEl(i: number, j: number, k: number) {
    const shade = k >= H ? ['#ff9fb8', '#ff5c8a', '#d93a6a'] : ['#7fd8ff', '#3aa0d8', '#2a7bb0'];
    return s('g', {},
      poly([P(i, j, k + 1), P(i + 1, j, k + 1), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)], shade[0]),
      poly([P(i, j + 1, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)], shade[1]),
      poly([P(i + 1, j, k), P(i + 1, j + 1, k), P(i + 1, j + 1, k + 1), P(i + 1, j, k + 1)], shade[2]),
    );
  }
  // Fill order = painter's order: layer by layer, back to front.
  const order: [number, number, number][] = [];
  for (let k = 0; k < H + 2; k++) {
    const layer: [number, number, number][] = [];
    for (let i = 0; i < L; i++) for (let j = 0; j < W; j++) layer.push([i, j, k]);
    layer.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    order.push(...layer);
  }

  return {
    ask: { math: [l, '×', w, '×', ht, '=', '?'], say: say(r) },
    choices: fracChoices(ans, options),

    async play(c) {
      cubes.replaceChildren();
      cubes.setAttribute('opacity', '1');
      lid.setAttribute('opacity', '0');
      hero.clearFx();
      hero.el.style.transform = '';
      const n = (c.value as Frac).mul(k ** 3).value;
      const draw = Math.min(n, order.length);
      const step = Math.min(55, 1500 / draw);
      for (let t = 0; t < draw; t++) {
        cubes.append(cubeEl(...order[t]));
        if (t % 2 === 0) sfx.tick(t % 24);
        await wait(step);
      }
      if (n === cap) {
        lid.setAttribute('opacity', '1');
        sfx.clank();
        await anim(lid, [{ transform: 'translateY(-80px)' }, { transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.3,1.5,.6,1)' });
        burst(arena, 'PACKED!', 470, 110, '#7CFF6B', 60);
        await hero.cheer();
        return;
      }
      if (n < cap) {
        lid.setAttribute('opacity', '1');
        await anim(lid, [{ transform: 'translateY(-80px)' }, { transform: 'none' }], 300);
        sfx.rattle();
        burst(arena, 'RATTLE RATTLE!', 470, 90, '#FFD23F', 54);
        await shake(svg, 9, 700);
        sfx.alarm();
        flash(kit.stage, 'rgba(255,40,60,.35)', 700);
        await wait(500);
        return;
      }
      await shake(svg, 6, 400);
      sfx.boom();
      burst(arena, 'KABOOM!', 470, 140, '#FF4F8B', 76);
      spray(arena, 470, 300, ['#7fd8ff', '#ff5c8a', '#3aa0d8', '🍪'], 28, 420, 36);
      cubes.replaceChildren();
      await anim(hero.el, [{ transform: 'none' }, { transform: 'translateX(120px) rotate(30deg)' }, { transform: 'none' }], 600);
      hero.fx('soot');
    },

    hint() {
      // Clue: show exactly how many tiny cubes the crate holds.
      cubes.replaceChildren(...order.slice(0, cap).map((o) => cubeEl(...o)));
      cubes.setAttribute('opacity', '0.55');
      lid.setAttribute('opacity', '0');
      hint.replaceChildren(mathEl(r.unit ? [cap, mini.cloneNode(true) as SVGElement] : [cap, mini.cloneNode(true) as SVGElement, '×', each]));
      hint.classList.remove('hidden');
      void anim(hint, [{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], 300);
    },
  };
}

// ───────────── area ─────────────

function buildArea(r: { kind: 'area'; side: string; area: string }, arena: HTMLElement, kit: Kit): Scene {
  const { ans, options, side, area } = cratePlan(r) as { ans: Frac; options: Frac[]; side: Frac; area: Frac };
  arena.classList.add('bg-garage');
  const maxLen = Math.max(...options.map((o) => o.value));
  const unit = Math.min(110, 900 / maxLen, 330 / side.value);
  const X = 140;
  const Y = 70;
  const sh = side.value * unit;

  const grid = box('floorgrid', 100, 30, 980, 420);
  grid.style.backgroundSize = `${unit}px ${unit}px`;
  grid.style.backgroundPosition = `${X - 100}px ${Y - 30}px`;
  arena.append(
    grid,
    box('side-mark', X - 6, Y, 8, sh),
    box('edge-lab', X - 100, Y + sh / 2 - 26, 80, 52, fracEl(side)),
    box('edge-lab', X + 20, Y - 62, 80, 52, '?'),
    box('lootbox-tag', 1100, 40, 160, 150, h('div', { class: 'lootbox-ico' }, '📦'), mathEl([area, h('span', { class: 'sq' })])),
  );
  const cut = box('deck', 0, 0, 0, 0);
  const hero = kit.hero(96).place(1140, 450);
  arena.append(cut, hero.el);
  let last = ans;

  return {
    ask: { math: [side, '×', '?', '=', area], say: say(r) },
    choices: fracChoices(ans, options),

    async play(c) {
      cut.replaceChildren();
      hero.clearFx();
      hero.el.style.opacity = '1';
      hero.el.style.transform = '';
      hero.place(1140, 450);
      const v = c.value as Frac;
      last = v;
      const hw = v.value * unit;
      const hole = box('hole', X, Y, 0, sh);
      cut.append(hole);
      sfx.zap();
      await anim(hole, [{ width: '0px' }, { width: `${hw}px` }], { duration: 700, easing: 'linear' });
      const lw = ans.value * unit;
      const loot = box('loot', X, Y, lw, sh, '📦');
      cut.append(loot);
      sfx.whoosh();
      await anim(loot, [{ transform: 'scale(1.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 500, easing: 'ease-in' });
      loot.style.transformOrigin = 'left top';
      const cmp = v.cmp(ans);
      if (cmp === 0) {
        sfx.thud();
        await anim(loot, [{ transform: 'scale(1)', filter: 'brightness(1)' }, { transform: 'scale(.85)', filter: 'brightness(.3)', opacity: 0 }], 500);
        burst(arena, 'THUNK!', X + hw / 2, Y + sh / 2, '#7CFF6B', 60);
        await hero.cheer();
        return;
      }
      if (cmp < 0) {
        sfx.clank();
        burst(arena, 'STUCK!', X + lw / 2, Y + sh / 2, '#FFD23F', 60);
        await shake(loot, 8, 600);
        await hero.walkTo(X + lw + 10, 900);
        await hero.hop(2);
        hero.say('Hnnngh!');
        await wait(500);
        return;
      }
      // Hole too big: the box drops... and so does the raccoon.
      await anim(loot, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.85)', opacity: 0 }], 400);
      await hero.walkTo(X + hw - 30, 900);
      sfx.whistleDown();
      burst(arena, 'AAAH!', X + hw - 10, Y + sh / 2, '#FF4F8B', 60);
      await anim(hero.el, [{ transform: 'none', opacity: 1 }, { transform: 'scale(.3) rotate(200deg)', opacity: 0 }], 600);
      sfx.thud();
      await wait(300);
      hero.el.style.transform = '';
      hero.place(1140, 450);
      hero.fx('dizzy');
      await anim(hero.el, [{ opacity: 0 }, { opacity: 1 }], 300);
    },

    hint() {
      // Clue: compare the hole you cut with the loot box's real footprint.
      const hole = cut.querySelector('.hole') as HTMLElement | null;
      cut.querySelector('.loot')?.remove();
      if (hole) {
        hole.append(h('div', { class: 'hole-lab' }, mathEl([side.mul(last), h('span', { class: 'sq' })])));
      }
      cut.append(box('need', X, Y, ans.value * unit, sh, h('div', { class: 'need-lab' }, mathEl([area, h('span', { class: 'sq' })]))));
    },
  };
}
