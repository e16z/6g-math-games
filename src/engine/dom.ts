import { F, Frac, type FracLike } from './frac';

export type Child = Node | string | number | null | undefined | false | Child[];
type Attrs = Record<string, unknown> | null | undefined;

function applyAttrs(el: Element, attrs: Attrs) {
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') {
      const st = (el as HTMLElement).style;
      for (const [p, val] of Object.entries(v as Record<string, string>)) {
        if (p.startsWith('--')) st.setProperty(p, val);
        else (st as unknown as Record<string, string>)[p] = val;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
}

function add(el: Node, kids: Child[]) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) add(el, k);
    else el.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k)));
  }
}

/** Create an HTML element. */
export function h(tag: string, attrs?: Attrs, ...kids: Child[]): HTMLElement {
  const el = document.createElement(tag);
  applyAttrs(el, attrs);
  add(el, kids);
  return el;
}

/** Create an SVG element. */
export function s(tag: string, attrs?: Attrs, ...kids: Child[]): SVGElement {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  applyAttrs(el, attrs);
  add(el, kids);
  return el;
}

/** Absolutely positioned box inside a scene (stage pixels). */
export function box(cls: string, x: number, y: number, w?: number, hgt?: number, ...kids: Child[]): HTMLElement {
  const style: Record<string, string> = { left: `${x}px`, top: `${y}px` };
  if (w != null) style.width = `${w}px`;
  if (hgt != null) style.height = `${hgt}px`;
  return h('div', { class: `abs ${cls}`, style }, ...kids);
}

/** A fraction drawn the way it looks on paper: 2⅔ with a stacked ⅔. */
export function fracEl(x: FracLike, cls = ''): HTMLElement {
  const f = F(x);
  const { w, n, d } = f.mixed();
  const el = h('span', { class: `fr ${cls}` });
  if (w || n === 0) el.append(h('span', { class: 'fr-w' }, String(w)));
  if (n) el.append(h('span', { class: 'fr-st' }, h('span', { class: 'fr-n' }, String(n)), h('span', { class: 'fr-d' }, String(d))));
  return el;
}

export type MathPart = Frac | number | string | Node;
const NUM = /^\d+(\s\d+)?\/\d+$|^\d+$/;

/** A row of math: numbers become fractions, '?' becomes the blank box. */
export function mathEl(parts: MathPart[], cls = ''): HTMLElement {
  const el = h('span', { class: `math ${cls}` });
  for (const p of parts) {
    if (p instanceof Frac || typeof p === 'number') el.append(fracEl(p));
    else if (p instanceof Node) el.append(p);
    else if (NUM.test(p)) el.append(fracEl(p));
    else if (p === '?') el.append(h('span', { class: 'q' }, '?'));
    else el.append(h('span', { class: 'op' }, p));
  }
  return el;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
