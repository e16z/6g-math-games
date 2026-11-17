// Unit 1, lessons 1–9 — area of grid shapes, parallelograms, triangles, polygons.
// The shape is a glowing laser floor. Paint it with exactly enough stealth paint.
import { box, fracEl, h, mathEl, s } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, flash, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices } from './common';

type Pt = [number, number];
interface AreaRound {
  kind: 'grid' | 'para' | 'tri' | 'poly';
  /** grid/poly: the shape as pieces (polygons on grid points). */
  pieces?: Pt[][];
  /** para/tri: base, height and how far the top leans right. */
  base?: number;
  height?: number;
  shift?: number;
}

// ── geometry ──
function shapeOf(r: AreaRound): Pt[][] {
  const b = r.base ?? 0;
  const ht = r.height ?? 0;
  const sh = r.shift ?? 0;
  if (r.kind === 'para') return [[[0, 0], [b, 0], [b + sh, ht], [sh, ht]]];
  if (r.kind === 'tri') return [[[0, 0], [b, 0], [sh, ht]]];
  return r.pieces ?? [];
}
const area2 = (p: Pt[]) => Math.abs(p.reduce((acc, [x, y], i) => acc + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y, 0));
const areaExact = (p: Pt[]) => new Frac(area2(p), 2);
const areaF = (p: Pt[]) => area2(p) / 2;

function clip(poly: Pt[], inside: (p: Pt) => boolean, cross: (a: Pt, b: Pt) => Pt): Pt[] {
  const out: Pt[] = [];
  poly.forEach((cur, i) => {
    const prev = poly[(i + poly.length - 1) % poly.length];
    if (inside(cur)) {
      if (!inside(prev)) out.push(cross(prev, cur));
      out.push(cur);
    } else if (inside(prev)) out.push(cross(prev, cur));
  });
  return out;
}
const atX = (X: number) => (a: Pt, b: Pt): Pt => [X, a[1] + ((X - a[0]) / (b[0] - a[0])) * (b[1] - a[1])];
const atY = (Y: number) => (a: Pt, b: Pt): Pt => [a[0] + ((Y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]), Y];
function cellCover(pieces: Pt[][], cx: number, cy: number) {
  let sum = 0;
  for (let p of pieces) {
    p = clip(p, (q) => q[0] >= cx, atX(cx));
    p = clip(p, (q) => q[0] <= cx + 1, atX(cx + 1));
    p = clip(p, (q) => q[1] >= cy, atY(cy));
    p = clip(p, (q) => q[1] <= cy + 1, atY(cy + 1));
    if (p.length > 2) sum += areaF(p);
  }
  return sum;
}
const leftOf = (pieces: Pt[][], X: number) => pieces.reduce((acc, p) => acc + (p.length ? areaF(clip(p, (q) => q[0] <= X, atX(X))) : 0), 0);

function bounds(pieces: Pt[][]) {
  const pts = pieces.flat();
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

export function areaPlan(r: AreaRound) {
  const pieces = shapeOf(r);
  const A = pieces.reduce((acc, p) => acc.add(areaExact(p)), F(0));
  const bb = bounds(pieces);
  const boxA = F((bb.x1 - bb.x0) * (bb.y1 - bb.y0));
  const b = r.base ?? 0;
  const ht = r.height ?? 0;
  let touched = 0;
  for (let x = bb.x0; x < bb.x1; x++) for (let y = bb.y0; y < bb.y1; y++) if (cellCover(pieces, x, y) > 1e-9) touched++;
  const cands =
    r.kind === 'para' ? [boxA, A.div(2), A.add(ht)]
    : r.kind === 'tri' ? [F(b * ht), A.add(ht), A.add(1)]
    : r.kind === 'grid' ? [F(touched), boxA, A.add(1)]
    : [boxA, A.add(2), A.sub(2)];
  return { pieces, A, bb, options: makeOptions(A, cands, (v) => v.le(boxA.mul(2))) };
}

const say = (r: AreaRound) =>
  r.kind === 'para' ? `This slanted floor has a base of ${r.base} and a height of ${r.height}. How many squares of paint?`
  : r.kind === 'tri' ? `This triangle floor has a base of ${r.base} and a height of ${r.height}. How many squares of paint?`
  : r.kind === 'grid' ? 'How many squares of paint cover this laser floor?'
  : 'How many squares of paint cover this weird room?';

export const area: Mechanic<AreaRound> = {
  id: 'area',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = areaPlan(r);
    const errs = checkOptions(p.A, p.options);
    const W = p.bb.x1 - p.bb.x0;
    const H = p.bb.y1 - p.bb.y0;
    if (W > 14 || H > 7) errs.push(`shape too big (${W}×${H}, max 14×7)`);
    if (p.A.gt(60)) errs.push('area too big');
    if (r.kind === 'grid') {
      for (let x = p.bb.x0; x < p.bb.x1; x++)
        for (let y = p.bb.y0; y < p.bb.y1; y++) {
          const c = cellCover(p.pieces, x, y);
          if (![0, 0.5, 1].some((k) => Math.abs(c - k) < 1e-9)) errs.push(`grid shapes need whole or half squares (cell ${x},${y} is ${c})`);
        }
    }
    if ((r.kind === 'para' || r.kind === 'tri') && !(r.base && r.height)) errs.push('needs base and height');
    return errs;
  },

  build(r, arena, kit) {
    const { pieces, A, bb, options } = areaPlan(r);
    arena.classList.add('bg-area');
    const W = bb.x1 - bb.x0;
    const H = bb.y1 - bb.y0;
    const u = Math.min(62, 780 / (W + 2), 380 / (H + 2));
    const ox = 60 + (800 - W * u) / 2 - bb.x0 * u;
    const oy = 40 + (400 + H * u) / 2 + bb.y0 * u;
    const X = (x: number) => ox + x * u;
    const Y = (y: number) => oy - y * u;
    const path = (p: Pt[]) => `M${p.map(([x, y]) => `${X(x)},${Y(y)}`).join(' L')} Z`;

    const svg = s('svg', { width: 1280, height: 470, viewBox: '0 0 1280 470', class: 'area-svg' }) as SVGSVGElement;
    const grid = s('g', { class: 'area-grid' });
    for (let k = Math.ceil((60 - ox) / u); X(k) <= 860; k++) grid.append(s('line', { x1: X(k), y1: 30, x2: X(k), y2: 450 }));
    for (let k = Math.ceil((oy - 450) / u); Y(k) >= 30; k++) grid.append(s('line', { x1: 60, y1: Y(k), x2: 860, y2: Y(k) }));
    const outline = s('g', {}, pieces.map((p) => s('path', { d: path(p), class: 'laser-edge' })));
    const floor = s('g', {}, pieces.map((p) => s('path', { d: path(p), class: 'laser-floor' })));
    const clipId = `paint-${Math.random().toString(36).slice(2, 8)}`;
    const clipRect = s('rect', { x: 0, y: 0, width: 0, height: 470 });
    const paint = s('g', { 'clip-path': `url(#${clipId})` }, pieces.map((p) => s('path', { d: path(p), class: 'paint' })));
    const extra = s('g', {});
    const hintG = s('g', {});
    svg.append(s('defs', {}, s('clipPath', { id: clipId }, clipRect)), grid, outline, floor, paint, extra, hintG);
    arena.append(box('svg-wrap', 0, 0, 1280, 470, svg));

    // Base / height labels for parallelograms and triangles.
    if (r.kind === 'para' || r.kind === 'tri') {
      const b = r.base!;
      const ht = r.height!;
      const sh = r.shift ?? 0;
      svg.insertBefore(s('line', { x1: X(sh), y1: Y(ht), x2: X(sh), y2: Y(0), class: 'height-line' }), extra);
      if (sh < 0 || sh > b) svg.insertBefore(s('line', { x1: X(Math.min(0, sh)), y1: Y(0), x2: X(Math.max(b, sh)), y2: Y(0), class: 'height-line' }), extra);
      arena.append(
        box('dim-lab', X(b / 2) - 28, Y(0) + 8, 56, 44, fracEl(b)),
        box('dim-lab', X(sh) + 10, Y(ht / 2) - 22, 56, 44, fracEl(ht)),
      );
    }

    const hero = kit.hero(100).place(1000, 455);
    arena.append(box('paint-can', 1110, 330, 110, 120, h('div', { class: 'can-label' }, '🎨')), hero.el);

    function reset() {
      clipRect.removeAttribute('style');
      clipRect.setAttribute('width', '0');
      extra.replaceChildren();
      floor.classList.remove('exposed');
      hero.clearFx();
      hero.el.style.transform = '';
      hero.place(1000, 455);
    }

    return {
      ask: { math: [h('span', { class: 'laser-ico' }), '=', '?', h('span', { class: 'sq' })], say: say(r) },
      choices: fracChoices(A, options),

      async play(c) {
        reset();
        const v = (c.value as Frac).value;
        const target = Math.min(v, A.value);
        // How far right the paint must reach to cover `target` squares.
        let lo = bb.x0;
        let hi = bb.x1;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2;
          if (leftOf(pieces, mid) < target) lo = mid;
          else hi = mid;
        }
        const reach = v >= A.value ? 1280 : X(hi);
        sfx.whoosh();
        await anim(clipRect, [{ width: '0px' }, { width: `${reach}px` }], { duration: 1100, easing: 'ease-in-out' });
        clipRect.setAttribute('width', String(reach));

        if (Math.abs(v - A.value) < 1e-9) {
          sfx.right();
          burst(arena, 'SNEAKY!', X((bb.x0 + bb.x1) / 2), Y(bb.y1) - 10, '#7CFF6B', 56);
          await hero.walkTo(-120, 1400);
          return;
        }
        if (v < A.value) {
          // Paint ran out: the uncovered laser floor glows and zaps.
          floor.classList.add('exposed');
          await wait(400);
          sfx.zap();
          flash(kit.stage, 'rgba(255,60,90,.35)', 400);
          burst(arena, 'ZAP!', hero.x + 30, hero.y - 20, '#FF4F8B', 64);
          hero.fx('frizz');
          hero.fx('soot');
          await shake(hero.el, 8);
          return;
        }
        // Too much paint: it floods, the raccoon slips.
        const spill = (v - A.value) * u * u;
        const ry = Math.sqrt(spill / (Math.PI * 2.2));
        const puddle = s('ellipse', { cx: X(bb.x1) + 40, cy: Y(bb.y0) + 10, rx: ry * 2.2, ry, class: 'paint puddle' });
        extra.append(puddle);
        await anim(puddle, [{ transform: 'scale(0)', transformOrigin: 'center', transformBox: 'fill-box' }, { transform: 'scale(1)', transformOrigin: 'center', transformBox: 'fill-box' }], 500);
        sfx.boing();
        await hero.walkTo(880, 500);
        burst(arena, 'SPLAT!', 900, 340, '#B388FF', 64);
        spray(arena, 900, 420, ['#20264a', '#3b4a9c'], 16, 260);
        await anim(hero.el, [{ transform: 'none' }, { transform: 'translateX(-120px) rotate(-100deg)' }], 450);
        hero.fx('goo');
        await wait(400);
      },

      async hint() {
        hintG.replaceChildren();
        arena.querySelectorAll('.hint-lab').forEach((e) => e.remove());
        if (r.kind === 'grid') {
          // Clue: count whole squares and half squares.
          for (let x = bb.x0; x < bb.x1; x++)
            for (let y = bb.y0; y < bb.y1; y++) {
              const c = cellCover(pieces, x, y);
              if (c < 1e-9) continue;
              hintG.append(s('text', { x: X(x + 0.5), y: Y(y + 0.5) + 8, class: `cell-lab ${c < 0.99 ? 'half' : ''}` }, c < 0.99 ? '½' : '1'));
            }
        } else if (r.kind === 'para') {
          // Clue: cut off the left triangle and slide it over → a rectangle.
          const b = r.base!;
          const ht = r.height!;
          const sh = r.shift ?? 0;
          const tri = s('path', { d: path([[0, 0], [sh, 0], [sh, ht]]), class: 'cut-piece' });
          hintG.append(tri);
          await wait(200);
          sfx.whoosh();
          await anim(tri, [{ transform: 'translateX(0)' }, { transform: `translateX(${b * u}px)` }], { duration: 900, easing: 'ease-in-out' });
          hintG.append(s('rect', { x: X(sh), y: Y(ht), width: b * u, height: ht * u, class: 'rect-ghost' }));
          arena.append(box('hint-lab piece-math', 880, 60, 300, 80, mathEl([b, '×', ht])));
        } else if (r.kind === 'tri') {
          // Clue: two copies make a parallelogram — the triangle is half of it.
          const b = r.base!;
          const ht = r.height!;
          const sh = r.shift ?? 0;
          hintG.append(s('path', { d: path([[b, 0], [sh, ht], [b + sh, ht]]), class: 'copy-piece' }));
          arena.append(box('hint-lab piece-math', 880, 60, 330, 80, mathEl([b, '×', ht, '÷', 2])));
        } else {
          // Clue: the room split into simple pieces, each with its area.
          const colors = ['#ffd23f', '#3ee6ff', '#7cff6b', '#ff9f1c', '#b388ff', '#ff6b8b'];
          pieces.forEach((p, i) => {
            hintG.append(s('path', { d: path(p), class: 'piece-ghost', style: `fill:${colors[i % colors.length]}` }));
            const cx = p.reduce((a, q) => a + q[0], 0) / p.length;
            const cy = p.reduce((a, q) => a + q[1], 0) / p.length;
            arena.append(box('hint-lab piece-area', X(cx) - 35, Y(cy) - 24, 70, 48, fracEl(areaExact(p))));
          });
        }
      },
    };
  },
};
