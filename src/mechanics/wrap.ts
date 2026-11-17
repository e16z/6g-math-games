// Unit 1, lessons 10–13 — surface area. Wrap Baron's box with exactly enough paper.
// Halfway trick: 📦 UNFOLD shows the box as a flat net, every face at once.
import { box, fracEl, h, mathEl, s } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, flash, shake, wait } from '../engine/fx';
import { boxFaces, BoxView, facePoint, PAIR, type FaceKey, type V3 } from '../art/box3d';
import { sfx } from '../engine/sound';
import type { Kit, Mechanic } from '../engine/types';
import { checkOptions, fracChoices, revealPanel } from './common';

interface WrapRound {
  dims: [number, number, number];
  /** This round teaches the UNFOLD trick. */
  reveal?: boolean;
}

const TAUNT = 'You can’t see the back! Ha!';
const UNFOLD = 'Unfold it! Then you can see every side of the box at once.';

export function wrapPlan(r: WrapRound) {
  const [l, w, ht] = r.dims;
  const ans = F(2 * (l * w + l * ht + w * ht));
  const options = makeOptions(ans, [F(l * w * ht), F(l * w + l * ht + w * ht), F(l * w)]);
  return { l, w, ht, ans, options };
}

const say = (r: WrapRound) => `How much wrapping paper covers this box? It is ${r.dims[0]} by ${r.dims[1]} by ${r.dims[2]}.`;

/** Flat net of an l×w×h box (top, front, bottom, back in a column; sides left/right). */
export function netSvg(l: number, w: number, ht: number, maxW: number, maxH: number, areas: boolean) {
  const W = 2 * w + l;
  const H = 2 * w + 2 * ht;
  const u = Math.min(maxW / W, maxH / H, 40);
  const faces: [number, number, number, number, string][] = [
    [w, 0, l, w, PAIR.top],
    [w, w, l, ht, PAIR.front],
    [w, w + ht, l, w, PAIR.top],
    [w, 2 * w + ht, l, ht, PAIR.front],
    [0, w, w, ht, PAIR.side],
    [w + l, w, w, ht, PAIR.side],
  ];
  const svg = s('svg', { width: W * u + 8, height: H * u + 8, viewBox: `-4 -4 ${W * u + 8} ${H * u + 8}`, class: 'net-svg' });
  for (const [x, y, fw, fh, col] of faces) {
    const g = s('g', {}, s('rect', { x: x * u, y: y * u, width: fw * u, height: fh * u, fill: col, class: 'net-face' }));
    for (let i = 1; i < fw; i++) g.append(s('line', { x1: (x + i) * u, y1: y * u, x2: (x + i) * u, y2: (y + fh) * u, class: 'net-grid' }));
    for (let j = 1; j < fh; j++) g.append(s('line', { x1: x * u, y1: (y + j) * u, x2: (x + fw) * u, y2: (y + j) * u, class: 'net-grid' }));
    if (areas) g.append(s('text', { x: (x + fw / 2) * u, y: (y + fh / 2) * u + 9, class: 'net-area' }, String(fw * fh)));
    svg.append(g);
  }
  return svg;
}

export const wrap: Mechanic<WrapRound> = {
  id: 'wrap',
  lines: (r) => [{ who: 'narrator', text: say(r) }, ...(r.reveal ? [{ who: 'baron' as const, text: TAUNT }, { who: 'mystery' as const, text: UNFOLD }] : [])],

  validate(r) {
    const p = wrapPlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (r.dims.some((d) => !Number.isInteger(d) || d < 1 || d > 6)) errs.push('box sides must be whole numbers 1–6');
    return errs;
  },

  build(r, arena, kit: Kit) {
    const { l, w, ht, ans, options } = wrapPlan(r);
    arena.classList.add('bg-garage');

    // ── the box: real 3D, drag (or tap ⟲ ⟳) to spin it ──
    const faces = boxFaces(l, w, ht);
    const view = new BoxView(l, w, ht, 300, 196, 400, 280);
    const cover: Record<FaceKey, number> = { top: 0, front: 0, right: 0, back: 0, left: 0, bottom: 0 };
    const g = s('g', {});
    const pid = `gift-${Math.random().toString(36).slice(2, 8)}`;
    const defs = s('defs', {},
      s('pattern', { id: pid, width: 18, height: 18, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
        s('rect', { width: 18, height: 18, fill: '#e63946' }),
        s('rect', { width: 7, height: 18, fill: '#fff' })));
    const svg = s('svg', { width: 600, height: 470, viewBox: '0 0 600 470', class: 'iso box3d' }, defs, g);
    const spinArea = box('iso-wrap spin-area', 0, 0, 600, 470, svg);
    arena.append(spinArea);
    const labs = [l, w, ht].map((v) => box('edge-lab', 0, 0, 68, 48, fracEl(v)));
    arena.append(...labs);
    let hintOn = false;
    let bowOn = false;
    const faceLabs: HTMLElement[] = [];
    const bow = box('face-lab bow hidden', 0, 0, 80, 80, '🎀');
    arena.append(bow);

    const pts = (ps: [number, number][]) => ps.map((p) => p.join(',')).join(' ');
    function draw() {
      g.replaceChildren();
      faceLabs.forEach((e) => e.remove());
      faceLabs.length = 0;
      for (const f of faces) {
        if (!view.visible(f)) continue;
        const P = (a: number, b: number) => view.proj(facePoint(f, a, b));
        g.append(s('polygon', { points: pts([P(0, 0), P(1, 0), P(1, 1), P(0, 1)]), fill: view.shade(f, f.color), class: 'face-fill' }));
        for (let i = 1; i < f.nu; i++) g.append(s('line', { x1: P(i / f.nu, 0)[0], y1: P(i / f.nu, 0)[1], x2: P(i / f.nu, 1)[0], y2: P(i / f.nu, 1)[1], class: 'net-grid' }));
        for (let j = 1; j < f.nv; j++) g.append(s('line', { x1: P(0, j / f.nv)[0], y1: P(0, j / f.nv)[1], x2: P(1, j / f.nv)[0], y2: P(1, j / f.nv)[1], class: 'net-grid' }));
        const cv = cover[f.key];
        if (cv > 0) g.append(s('polygon', { points: pts([P(0, 0), P(cv, 0), P(cv, 1), P(0, 1)]), fill: `url(#${pid})`, class: 'paper' }));
        // Clue labels only on faces big enough on screen to read.
        const quad = [P(0, 0), P(1, 0), P(1, 1), P(0, 1)];
        const onScreen = Math.abs(quad.reduce((acc, [x1, y1], i) => acc + x1 * quad[(i + 1) % 4][1] - quad[(i + 1) % 4][0] * y1, 0)) / 2;
        if (hintOn && onScreen > 6500) {
          const [x, y] = P(0.5, 0.5);
          const lab = box('face-lab', x - 44, y - 22, 88, 44, mathEl([f.area, '×', 2]));
          faceLabs.push(lab);
          arena.append(lab);
        }
      }
      // Edge labels: nearest length and width edges, outermost height edge, pushed outward.
      const [ccx, ccy] = view.proj([0, 0, 0]);
      const a = l / 2;
      const b = w / 2;
      const c = ht / 2;
      const xs: [V3, V3][] = [[-b, -c], [-b, c], [b, -c], [b, c]].map(([y, z]) => [[-a, y, z], [a, y, z]]);
      const ys: [V3, V3][] = [[-a, -c], [-a, c], [a, -c], [a, c]].map(([x, z]) => [[x, -b, z], [x, b, z]]);
      const zs: [V3, V3][] = [[-a, -b], [-a, b], [a, -b], [a, b]].map(([x, y]) => [[x, y, -c], [x, y, c]]);
      const mid = (e: [V3, V3]): V3 => [(e[0][0] + e[1][0]) / 2, (e[0][1] + e[1][1]) / 2, (e[0][2] + e[1][2]) / 2];
      // The lowest edge on screen is always on the box's outline, so its label never covers a face.
      const lowest = (es: [V3, V3][]) => es.reduce((best, e) => (view.proj(mid(e))[1] > view.proj(mid(best))[1] ? e : best));
      const rightmost = (es: [V3, V3][]) => es.reduce((best, e) => (view.proj(mid(e))[0] > view.proj(mid(best))[0] ? e : best));
      [lowest(xs), lowest(ys), rightmost(zs)].forEach((e, i) => {
        const [mx, my] = view.proj(mid(e));
        const dx = mx - ccx;
        const dy = my - ccy;
        const len = Math.hypot(dx, dy) || 1;
        labs[i].style.left = `${mx + (dx / len) * 46 - 34}px`;
        labs[i].style.top = `${my + (dy / len) * 46 - 24}px`;
      });
      bow.classList.toggle('hidden', !bowOn);
      if (bowOn) {
        const [bx, by] = view.proj([0, 0, c]);
        bow.style.left = `${bx - 40}px`;
        bow.style.top = `${by - 70}px`;
      }
    }

    // Drag to spin (left/right) and tilt (up/down).
    let drag: { x: number; y: number } | null = null;
    let queued = false;
    const redraw = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        draw();
      });
    };
    spinArea.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY };
      spinArea.setPointerCapture(e.pointerId);
      spinArea.classList.add('dragging');
    });
    spinArea.addEventListener('pointermove', (e) => {
      if (!drag) return;
      view.yaw -= (e.clientX - drag.x) * 0.012;
      view.pitch = Math.max(-0.9, Math.min(1.25, view.pitch + (e.clientY - drag.y) * 0.008));
      drag = { x: e.clientX, y: e.clientY };
      redraw();
    });
    const endDrag = () => {
      drag = null;
      spinArea.classList.remove('dragging');
    };
    spinArea.addEventListener('pointerup', endDrag);
    spinArea.addEventListener('pointercancel', endDrag);

    let spinning = false;
    const spin = (by: number, ms: number, each?: (t: number) => void) =>
      new Promise<void>((done) => {
        spinning = true;
        const from = view.yaw;
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms);
          const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
          view.yaw = from + by * e;
          each?.(t);
          draw();
          if (t < 1) requestAnimationFrame(step);
          else {
            spinning = false;
            done();
          }
        };
        requestAnimationFrame(step);
      });
    const rotBtn = (icon: string, x: number, dir: number) =>
      h('button', { class: 'rot-btn', style: { left: `${x}px` }, 'aria-label': 'Turn the box', onclick: () => { if (!spinning) { sfx.whoosh(); void spin(dir * Math.PI / 2, 450); } } }, icon);
    arena.append(rotBtn('↺', 190, 1), rotBtn('↻', 346, -1));
    draw();

    // ── the net (shown by UNFOLD) ──
    const netWrap = box('net-panel hidden', 690, 20, 560, 440);
    arena.append(netWrap);
    const showNet = (areas: boolean) => {
      netWrap.replaceChildren(netSvg(l, w, ht, 520, 400, areas));
      if (netWrap.classList.contains('hidden')) {
        netWrap.classList.remove('hidden');
        void anim(netWrap, [{ transform: 'scale(.2) rotate(-20deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], 450);
      }
    };

    const hero = kit.hero(100).place(590, 460);
    arena.append(hero.el);
    let mummy: HTMLElement | null = null;

    function reset() {
      (Object.keys(cover) as FaceKey[]).forEach((k) => (cover[k] = 0));
      hintOn = false;
      bowOn = false;
      mummy?.remove();
      hero.clearFx();
      draw();
    }

    return {
      ask: { math: [h('span', { class: 'gift-ico' }, '🎁'), '=', '?', h('span', { class: 'sq' })], say: say(r) },
      choices: fracChoices(ans, options),
      power: { item: 'unfold', icon: '📦', label: 'Unfold the box', use: () => (netWrap.classList.contains('hidden') ? showNet(false) : netWrap.classList.add('hidden')) },

      async intro() {
        if (!r.reveal) return;
        await kit.baron('smug', TAUNT);
        await revealPanel(arena, kit, {
          item: 'unfold',
          title: '📦 UNFOLD!',
          say: UNFOLD,
          visual: h('div', { class: 'reveal-net' }, h('span', { class: 'reveal-box' }, '📦'), h('span', { class: 'op' }, '➜'), netSvg(l, w, ht, 300, 240, false)),
          animate: async () => {
            sfx.flip();
            const n = arena.querySelector('.reveal-net .net-svg');
            if (n) await anim(n, [{ transform: 'scale(.1) rotate(90deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], 700);
          },
        });
        kit.refreshAsk();
        showNet(false);
      },

      async play(c) {
        reset();
        const v = (c.value as Frac).value;
        // Paper goes on face by face while the box spins once, so every side shows.
        const amount = Math.min(v, ans.value);
        let lastFull = -1;
        await spin(Math.PI * 2, 1900, (t) => {
          let left = amount * t;
          faces.forEach((f, i) => {
            const used = Math.min(f.area, Math.max(0, left));
            cover[f.key] = used / f.area;
            left -= used;
            if (cover[f.key] >= 1 && i > lastFull) {
              lastFull = i;
              sfx.flip();
            }
          });
        });
        if (Math.abs(v - ans.value) < 1e-9) {
          bowOn = true;
          draw();
          sfx.right();
          burst(arena, 'WRAPPED!', 300, 60, '#7CFF6B', 56);
          await hero.cheer();
          return;
        }
        if (v < ans.value) {
          sfx.alarm();
          flash(kit.stage, 'rgba(255,40,60,.35)', 700);
          burst(arena, 'SEEN!', 300, 60, '#FF4F8B', 64);
          await shake(svg, 8, 600);
          return;
        }
        // Too much paper: it keeps going... around the raccoon.
        mummy = box('mummy', hero.x - 6, hero.y + 6, hero.width + 12, hero.height - 6);
        arena.append(mummy);
        sfx.whoosh();
        await anim(mummy, [{ transform: 'scaleY(0)', transformOrigin: 'bottom' }, { transform: 'scaleY(1)', transformOrigin: 'bottom' }], 600);
        burst(arena, 'MMMPH!', hero.x + 40, hero.y - 20, '#FFD23F', 56);
        await shake(hero.el, 6);
        await wait(300);
      },

      hint() {
        if (kit.has('unfold')) {
          showNet(true);
          return;
        }
        // Before UNFOLD: label each face you can see — its twin on the far side matches (×2).
        hintOn = true;
        draw();
      },
    };
  },
};
