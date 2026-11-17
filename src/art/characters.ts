import { h, s } from '../engine/dom';
import { anim, wait } from '../engine/fx';
import type { Mood } from '../engine/types';

// ───────────────────────── Raccoon ─────────────────────────

const C = { fur: '#9aa3ad', dark: '#363b44', light: '#eef1f4', belly: '#d9dfe6' };

export const HATS = ['beanie', 'tophat', 'crown', 'propeller', 'party', 'chef'] as const;

export function hatSvg(hat: string): SVGElement {
  switch (hat) {
    case 'tophat':
      return s('g', {},
        s('rect', { x: 32, y: -10, width: 36, height: 40, rx: 3, fill: '#22222e' }),
        s('rect', { x: 32, y: 16, width: 36, height: 7, fill: '#e63946' }),
        s('ellipse', { cx: 50, cy: 30, rx: 31, ry: 6, fill: '#22222e' }));
    case 'crown':
      return s('g', {},
        s('polygon', { points: '26,34 28,6 39,20 50,0 61,20 72,6 74,34', fill: '#ffd23f', stroke: '#c99700', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
        s('circle', { cx: 50, cy: 24, r: 4, fill: '#e63946' }),
        s('circle', { cx: 36, cy: 27, r: 3, fill: '#3a86ff' }),
        s('circle', { cx: 64, cy: 27, r: 3, fill: '#2ec4b6' }));
    case 'propeller':
      return s('g', {},
        s('path', { d: 'M22 38 Q22 10 50 10 Q78 10 78 38 Z', fill: '#3a86ff' }),
        s('path', { d: 'M42 10.5 Q50 10 58 10.5 L56 38 L44 38 Z', fill: '#ffbe0b' }),
        s('rect', { x: 48.5, y: -2, width: 3, height: 13, fill: '#555' }),
        s('g', { class: 'prop' },
          s('ellipse', { cx: 37, cy: -3, rx: 13, ry: 3.5, fill: '#e63946' }),
          s('ellipse', { cx: 63, cy: -3, rx: 13, ry: 3.5, fill: '#e63946' })),
        s('circle', { cx: 50, cy: -3, r: 3.5, fill: '#333' }));
    case 'party':
      return s('g', {},
        s('polygon', { points: '33,34 50,-16 67,34', fill: '#ff4f8b' }),
        s('path', { d: 'M38 22 L62 22 M42 10 L58 10 M46 -2 L54 -2', stroke: '#ffe066', 'stroke-width': 4 }),
        s('circle', { cx: 50, cy: -17, r: 6, fill: '#7cff6b' }));
    case 'chef':
      return s('g', {},
        s('circle', { cx: 35, cy: 8, r: 13, fill: '#fff' }),
        s('circle', { cx: 50, cy: 1, r: 15, fill: '#fff' }),
        s('circle', { cx: 65, cy: 8, r: 13, fill: '#fff' }),
        s('rect', { x: 30, y: 10, width: 40, height: 22, rx: 3, fill: '#fff', stroke: '#d9dde3', 'stroke-width': 2 }));
    case 'beanie':
    default:
      return s('g', {},
        s('path', { d: 'M18 42 Q18 4 50 4 Q82 4 82 42 Z', fill: '#e63946' }),
        s('path', { d: 'M30 10 L30 40 M42 5 L42 40 M58 5 L58 40 M70 10 L70 40', stroke: '#c1121f', 'stroke-width': 3 }),
        s('rect', { x: 15, y: 33, width: 70, height: 12, rx: 6, fill: '#a4161a' }),
        s('circle', { cx: 50, cy: 3, r: 8, fill: '#fff' }));
  }
}

export function raccoonSvg(hat: string): SVGSVGElement {
  return s('svg', { viewBox: '0 -26 100 158', class: 'raccoon-svg' },
    // gag: frizzed fur (drawn behind the head)
    s('path', { class: 'fx fx-frizz', d: 'M16 44 L2 34 L16 32 L8 16 L24 24 L26 6 L38 20 L46 2 L52 18 L60 2 L64 20 L76 6 L76 24 L92 16 L84 32 L98 34 L84 44', fill: '#c9ced6', stroke: C.dark, 'stroke-width': 2 }),
    s('g', { class: 'tail' },
      s('ellipse', { cx: 77, cy: 106, rx: 10, ry: 9, fill: C.fur }),
      s('ellipse', { cx: 84, cy: 97, rx: 9.5, ry: 8.5, fill: C.dark }),
      s('ellipse', { cx: 89, cy: 87, rx: 9, ry: 8, fill: C.fur }),
      s('ellipse', { cx: 92, cy: 77, rx: 8, ry: 7.5, fill: C.dark })),
    s('ellipse', { cx: 38, cy: 126, rx: 9, ry: 5, fill: C.dark }),
    s('ellipse', { cx: 62, cy: 126, rx: 9, ry: 5, fill: C.dark }),
    s('ellipse', { cx: 50, cy: 104, rx: 24, ry: 23, fill: C.fur }),
    s('ellipse', { cx: 50, cy: 108, rx: 14, ry: 15, fill: C.belly }),
    s('ellipse', { cx: 27, cy: 103, rx: 6, ry: 11, fill: C.dark, transform: 'rotate(18 27 103)' }),
    s('ellipse', { cx: 73, cy: 103, rx: 6, ry: 11, fill: C.dark, transform: 'rotate(-18 73 103)' }),
    s('ellipse', { cx: 25, cy: 32, rx: 11, ry: 13, fill: C.fur }),
    s('ellipse', { cx: 25, cy: 33, rx: 6, ry: 8, fill: C.dark }),
    s('ellipse', { cx: 75, cy: 32, rx: 11, ry: 13, fill: C.fur }),
    s('ellipse', { cx: 75, cy: 33, rx: 6, ry: 8, fill: C.dark }),
    s('ellipse', { cx: 50, cy: 56, rx: 33, ry: 28, fill: C.fur }),
    s('ellipse', { cx: 50, cy: 69, rx: 19, ry: 13, fill: C.light }),
    s('path', { d: 'M16 54 Q22 40 36 45 Q50 52 64 45 Q78 40 84 54 Q78 64 64 61 Q50 58 36 61 Q22 64 16 54 Z', fill: C.dark }),
    // gag: soot smudges
    s('g', { class: 'fx fx-soot' },
      s('ellipse', { cx: 50, cy: 60, rx: 30, ry: 22, fill: '#1c1c1c', opacity: 0.75 }),
      s('ellipse', { cx: 50, cy: 104, rx: 20, ry: 18, fill: '#1c1c1c', opacity: 0.6 }),
      s('circle', { cx: 30, cy: 10, r: 8, fill: '#777', opacity: 0.8 }),
      s('circle', { cx: 44, cy: 0, r: 10, fill: '#888', opacity: 0.7 }),
      s('circle', { cx: 62, cy: -8, r: 8, fill: '#999', opacity: 0.6 })),
    s('g', { class: 'eyes' },
      s('circle', { cx: 37, cy: 53, r: 6.5, fill: '#fff' }),
      s('circle', { cx: 63, cy: 53, r: 6.5, fill: '#fff' }),
      s('circle', { cx: 38.5, cy: 54, r: 3.6, fill: '#111' }),
      s('circle', { cx: 64.5, cy: 54, r: 3.6, fill: '#111' }),
      s('circle', { cx: 40, cy: 52.5, r: 1.3, fill: '#fff' }),
      s('circle', { cx: 66, cy: 52.5, r: 1.3, fill: '#fff' })),
    s('ellipse', { cx: 50, cy: 64, rx: 5.5, ry: 3.8, fill: '#1b1b1b' }),
    s('path', { d: 'M43 70 Q50 77 57 70', stroke: '#1b1b1b', 'stroke-width': 2.2, fill: 'none', 'stroke-linecap': 'round' }),
    // gag: covered in green goo
    s('g', { class: 'fx fx-goo' },
      s('path', { d: 'M18 44 Q24 18 50 20 Q76 18 82 44 Q80 54 76 46 Q72 60 67 46 Q62 56 57 44 Q51 62 45 44 Q39 56 34 45 Q28 58 24 46 Q20 54 18 44 Z', fill: '#7cff6b', opacity: 0.92 }),
      s('ellipse', { cx: 40, cy: 100, rx: 9, ry: 6, fill: '#7cff6b', opacity: 0.9 }),
      s('ellipse', { cx: 62, cy: 114, rx: 7, ry: 5, fill: '#7cff6b', opacity: 0.9 }),
      s('circle', { cx: 70, cy: 30, r: 3, fill: '#c6ffbe' })),
    s('g', { class: 'hat' }, hatSvg(hat)),
    // gag: dizzy stars
    s('g', { class: 'fx fx-dizzy' },
      s('g', { class: 'spin' },
        s('text', { x: 22, y: 12, 'font-size': 18, fill: '#ffd23f' }, '★'),
        s('text', { x: 66, y: 8, 'font-size': 16, fill: '#ffd23f' }, '★'),
        s('text', { x: 44, y: -14, 'font-size': 14, fill: '#ffd23f' }, '★'))),
  ) as SVGSVGElement;
}

export type HeroFx = 'goo' | 'soot' | 'frizz' | 'dizzy';

/** The player's raccoon, placed by its feet: (x = left edge, y = floor line). */
export class Hero {
  el: HTMLElement;
  constructor(public hat: string, public height = 110) {
    this.el = h('div', { class: 'hero abs', style: { height: `${height}px`, width: `${height * 0.66}px` } }, raccoonSvg(hat));
  }
  get width() {
    return this.height * 0.66;
  }
  place(x: number, floorY: number) {
    this.el.style.left = `${x}px`;
    this.el.style.top = `${floorY - this.height}px`;
    return this;
  }
  get x() {
    return parseFloat(this.el.style.left);
  }
  get y() {
    return parseFloat(this.el.style.top);
  }
  fx(kind: HeroFx, on = true) {
    this.el.classList.toggle(`is-${kind}`, on);
  }
  clearFx() {
    this.el.classList.remove('is-goo', 'is-soot', 'is-frizz', 'is-dizzy');
  }
  async walkTo(x: number, ms = 700) {
    this.el.classList.add('walking');
    await anim(this.el, [{ left: `${this.x}px` }, { left: `${x}px` }], { duration: ms, easing: 'linear' });
    this.el.classList.remove('walking');
  }
  async hop(times = 1) {
    for (let i = 0; i < times; i++) {
      await anim(this.el, [{ translate: '0 0' }, { translate: '0 -40px' }, { translate: '0 0' }], { duration: 380, easing: 'ease-out' });
    }
  }
  async cheer() {
    this.el.classList.add('cheer');
    await this.hop(2);
    this.el.classList.remove('cheer');
  }
  say(text: string, ms = 1400) {
    const b = h('div', { class: 'hero-say' }, text);
    this.el.append(b);
    setTimeout(() => b.remove(), ms);
  }
}

// ───────────────────────── Baron Grab ─────────────────────────

function baronFace(mood: Mood): SVGElement {
  const cyan = mood === 'angry' ? '#ff5a5f' : '#6ef3ff';
  const st = { stroke: cyan, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  switch (mood) {
    case 'laugh':
      return s('g', {},
        s('path', { d: 'M50 98 L62 86 L74 98', ...st }),
        s('path', { d: 'M88 98 L100 86 L112 98', ...st }),
        s('path', { d: 'M62 106 Q81 132 100 106 Z', fill: cyan }));
    case 'shock':
      return s('g', {},
        s('circle', { cx: 62, cy: 92, r: 11, ...st, 'stroke-width': 4 }),
        s('circle', { cx: 100, cy: 92, r: 11, ...st, 'stroke-width': 4 }),
        s('circle', { cx: 62, cy: 92, r: 3.5, fill: cyan }),
        s('circle', { cx: 100, cy: 92, r: 3.5, fill: cyan }),
        s('circle', { cx: 81, cy: 118, r: 7, ...st, 'stroke-width': 4 }));
    case 'angry':
      return s('g', {},
        s('path', { d: 'M48 78 L74 88', ...st }),
        s('path', { d: 'M114 78 L88 88', ...st }),
        s('circle', { cx: 62, cy: 96, r: 6, fill: cyan }),
        s('circle', { cx: 100, cy: 96, r: 6, fill: cyan }),
        s('path', { d: 'M64 122 Q81 110 98 122', ...st }));
    case 'dizzy':
      return s('g', {},
        s('path', { d: 'M54 92 a8 8 0 1 0 16 0 a6 6 0 1 0 -12 0 a3 3 0 1 0 6 0', ...st, 'stroke-width': 3.5 }),
        s('path', { d: 'M92 92 a8 8 0 1 0 16 0 a6 6 0 1 0 -12 0 a3 3 0 1 0 6 0', ...st, 'stroke-width': 3.5 }),
        s('path', { d: 'M62 120 q5 -7 10 0 t10 0 t10 0 t10 0', ...st, 'stroke-width': 4 }));
    case 'happy':
      return s('g', {},
        s('circle', { cx: 62, cy: 92, r: 7, fill: cyan }),
        s('circle', { cx: 100, cy: 92, r: 7, fill: cyan }),
        s('path', { d: 'M64 112 Q81 126 98 112', ...st }));
    case 'smug':
    default:
      return s('g', {},
        s('path', { d: 'M50 90 A12 9 0 0 0 74 90 Z', fill: cyan }),
        s('path', { d: 'M88 90 A12 9 0 0 0 112 90 Z', fill: cyan }),
        s('path', { d: 'M47 89 H77 M85 89 H115', ...st, 'stroke-width': 4 }),
        s('path', { d: 'M66 116 Q84 123 98 108', ...st }));
  }
}

export function baronSvg(mood: Mood = 'smug'): SVGSVGElement {
  return s('svg', { viewBox: '0 0 162 168', class: 'baron-svg' },
    s('g', { class: 'baron-hat' },
      s('rect', { x: 47, y: 2, width: 68, height: 46, rx: 4, fill: '#1d1d2b' }),
      s('rect', { x: 47, y: 34, width: 68, height: 10, fill: '#8a2be2' }),
      s('rect', { x: 29, y: 44, width: 104, height: 10, rx: 5, fill: '#1d1d2b' })),
    s('circle', { cx: 15, cy: 104, r: 9, fill: '#8a95a3' }),
    s('circle', { cx: 147, cy: 104, r: 9, fill: '#8a95a3' }),
    s('rect', { x: 19, y: 52, width: 124, height: 106, rx: 26, fill: '#c3ccd6', stroke: '#5b6675', 'stroke-width': 4 }),
    s('rect', { x: 27, y: 58, width: 50, height: 8, rx: 4, fill: '#fff', opacity: 0.5 }),
    s('rect', { x: 33, y: 68, width: 96, height: 64, rx: 14, fill: '#0d1b2a' }),
    s('g', { class: 'baron-face' }, baronFace(mood)),
    s('circle', { cx: 100, cy: 92, r: 18, stroke: '#ffd23f', 'stroke-width': 4, fill: 'rgba(255,255,255,.08)' }),
    s('path', { d: 'M117 99 Q132 122 126 156', stroke: '#ffd23f', 'stroke-width': 2.5, fill: 'none' }),
    s('path', {
      d: 'M81 138 C73 128 57 126 47 136 C41 142 33 140 31 132 C31 150 57 156 81 146 C105 156 131 150 131 132 C129 140 121 142 115 136 C105 126 89 128 81 138 Z',
      fill: '#2b1d14',
    }),
  ) as SVGSVGElement;
}

export function setBaronMood(svg: SVGSVGElement, mood: Mood) {
  const g = svg.querySelector('.baron-face');
  if (!g) return;
  g.replaceChildren(baronFace(mood));
}

// ───────────────────────── Others ─────────────────────────

export function mysterySvg(): SVGSVGElement {
  return s('svg', { viewBox: '0 0 140 180', class: 'mystery-svg' },
    s('path', { d: 'M70 8 C28 8 16 60 22 100 C26 140 14 160 8 178 L132 178 C126 160 114 140 118 100 C124 60 112 8 70 8 Z', fill: '#2a1f4a', stroke: '#4b3a80', 'stroke-width': 3 }),
    s('ellipse', { cx: 70, cy: 70, rx: 31, ry: 35, fill: '#0b0718' }),
    s('g', { class: 'blink' },
      s('ellipse', { cx: 57, cy: 70, rx: 7, ry: 4.5, fill: '#ffe066' }),
      s('ellipse', { cx: 83, cy: 70, rx: 7, ry: 4.5, fill: '#ffe066' })),
    s('text', { x: 70, y: 150, 'text-anchor': 'middle', 'font-size': 44, 'font-weight': 700, fill: '#ffd23f', 'font-family': 'Fredoka, sans-serif' }, '?'),
  ) as SVGSVGElement;
}

export function hamsterSvg(): SVGSVGElement {
  return s('svg', { viewBox: '0 0 120 120', class: 'hamster-svg' },
    s('circle', { cx: 30, cy: 36, r: 11, fill: '#e76f51' }),
    s('circle', { cx: 90, cy: 36, r: 11, fill: '#e76f51' }),
    s('circle', { cx: 30, cy: 37, r: 6, fill: '#ffc4b0' }),
    s('circle', { cx: 90, cy: 37, r: 6, fill: '#ffc4b0' }),
    s('ellipse', { cx: 60, cy: 72, rx: 42, ry: 38, fill: '#f4a261' }),
    s('ellipse', { cx: 60, cy: 86, rx: 25, ry: 22, fill: '#fde8d0' }),
    s('rect', { x: 20, y: 38, width: 80, height: 8, rx: 4, fill: '#6c584c' }),
    s('circle', { cx: 45, cy: 42, r: 10, fill: '#9ad1ff', stroke: '#6c584c', 'stroke-width': 3 }),
    s('circle', { cx: 75, cy: 42, r: 10, fill: '#9ad1ff', stroke: '#6c584c', 'stroke-width': 3 }),
    s('circle', { cx: 46, cy: 63, r: 5, fill: '#111' }),
    s('circle', { cx: 74, cy: 63, r: 5, fill: '#111' }),
    s('circle', { cx: 47.5, cy: 61.5, r: 1.6, fill: '#fff' }),
    s('circle', { cx: 75.5, cy: 61.5, r: 1.6, fill: '#fff' }),
    s('ellipse', { cx: 34, cy: 76, rx: 9, ry: 7, fill: '#ffb4a2' }),
    s('ellipse', { cx: 86, cy: 76, rx: 9, ry: 7, fill: '#ffb4a2' }),
    s('ellipse', { cx: 60, cy: 72, rx: 4, ry: 3, fill: '#d1495b' }),
    s('rect', { x: 57, y: 78, width: 6, height: 6, rx: 1, fill: '#fff' }),
    s('ellipse', { cx: 44, cy: 104, rx: 7, ry: 5, fill: '#e76f51' }),
    s('ellipse', { cx: 76, cy: 104, rx: 7, ry: 5, fill: '#e76f51' }),
  ) as SVGSVGElement;
}

export function guardSvg(): SVGSVGElement {
  return s('svg', { viewBox: '0 0 60 120', class: 'guard-svg', preserveAspectRatio: 'none' },
    s('line', { x1: 30, y1: 2, x2: 30, y2: 12, stroke: '#5c677d', 'stroke-width': 3 }),
    s('circle', { cx: 30, cy: 3, r: 3.5, fill: '#ff3b3b', class: 'blink-fast' }),
    s('rect', { x: 12, y: 10, width: 36, height: 28, rx: 8, fill: '#5c677d' }),
    s('rect', { x: 16, y: 18, width: 28, height: 10, rx: 5, fill: '#ff3b3b' }),
    s('rect', { x: 0, y: 44, width: 8, height: 34, rx: 4, fill: '#5c677d' }),
    s('rect', { x: 52, y: 44, width: 8, height: 34, rx: 4, fill: '#5c677d' }),
    s('rect', { x: 8, y: 40, width: 44, height: 50, rx: 10, fill: '#7d8597' }),
    s('circle', { cx: 30, cy: 56, r: 6, fill: '#ffd23f' }),
    s('rect', { x: 14, y: 90, width: 11, height: 28, rx: 3, fill: '#5c677d' }),
    s('rect', { x: 35, y: 90, width: 11, height: 28, rx: 3, fill: '#5c677d' }),
  ) as SVGSVGElement;
}

/** Character portrait for story beats. */
export function portrait(who: string, mood: Mood = 'smug', hat = 'beanie'): SVGSVGElement {
  if (who === 'baron') return baronSvg(mood);
  if (who === 'mystery') return mysterySvg();
  if (who === 'hamster') return hamsterSvg();
  return raccoonSvg(hat);
}

export async function blinkIn(el: Element) {
  await anim(el, [{ transform: 'scale(0.4)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], 380);
  await wait(10);
}
