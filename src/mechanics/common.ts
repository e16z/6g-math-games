import { mysterySvg } from '../art/characters';
import { box, fracEl, h } from '../engine/dom';
import { F, type Frac, type FracLike } from '../engine/frac';
import { anim, confetti, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Choice, Kit } from '../engine/types';
import { speak } from '../engine/voice';

/** How a number is shown: fraction (2⅓), money ($2.50), decimal (2.5) or percent (40%). */
export type Fmt = 'frac' | 'money' | 'dec' | 'pct';

/** Text form (for speech and labels). Percent takes a fraction of 1: 2/5 → "40%". */
export function fmtText(x: FracLike, fmt: Fmt = 'frac'): string {
  const f = F(x);
  if (fmt === 'pct') return f.mul(100).toDecimal(2) != null ? `${f.mul(100).toDecimal(2)}%` : `≈${Math.round(f.value * 100)}%`;
  const dec = f.toDecimal(2);
  if (fmt === 'money') {
    if (dec == null) return `$${f}`;
    return f.isInt ? `$${dec}` : `$${Number(dec).toFixed(2)}`;
  }
  if (fmt === 'dec' && dec != null) return dec;
  return f.toString();
}

/** A number on screen in the chosen format. */
export function numEl(x: FracLike, fmt: Fmt = 'frac', cls = ''): HTMLElement {
  if (fmt === 'frac') return fracEl(x, cls);
  return h('span', { class: `fr num ${cls}` }, fmtText(x, fmt));
}

export function fracChoices(correct: Frac, options: Frac[], fmt: Fmt = 'frac'): Choice[] {
  return options.map((v) => ({ label: numEl(v, fmt), value: v, correct: v.eq(correct), solved: () => numEl(v, fmt, 'solved') }));
}

/** Shared validation: options must be distinct, positive and include the answer. */
export function checkOptions(correct: Frac, options: Frac[], want = 3): string[] {
  const errs: string[] = [];
  if (options.length !== want) errs.push(`expected ${want} options, got ${options.length}`);
  if (!options.some((o) => o.eq(correct))) errs.push('correct answer missing from options');
  options.forEach((o, i) => {
    if (o.n <= 0) errs.push(`option ${o} is not positive`);
    if (options.findIndex((p) => p.eq(o)) !== i) errs.push(`duplicate option ${o}`);
  });
  return errs;
}

/** A row of the same emoji, e.g. 🍓🍓🍓. */
export function icons(icon: string, n: number, size = 34, cls = ''): HTMLElement {
  const el = h('span', { class: `icons ${cls}`, style: { fontSize: `${size}px` } });
  for (let i = 0; i < n; i++) el.append(h('span', { class: 'ic' }, icon));
  return el;
}

/**
 * The halfway "deeper rule" moment, shared by every unit:
 * a big picture, the ghost names the trick, the power is unlocked, ▶ to go on.
 */
export async function revealPanel(
  arena: HTMLElement,
  kit: Kit,
  o: { item: string; title: string; say: string; visual: HTMLElement; animate?: () => Promise<void> },
) {
  const panel = box('reveal', 140, 20, 1000, 430, h('div', { class: 'reveal-visual' }, o.visual));
  arena.append(panel);
  await anim(panel, [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], 350);
  await wait(500);
  if (o.animate) await o.animate();
  sfx.fanfare();
  confetti(arena, 640, 160, 60);
  kit.give(o.item);
  const who = h('div', { class: 'reveal-who' }, mysterySvg());
  panel.append(who, h('div', { class: 'reveal-bubble' }, o.title));
  void anim(who, [{ transform: 'translateY(200px)' }, { transform: 'none' }], 400);
  void speak(o.say, 'mystery');
  await wait(900);
  const go = h('button', { class: 'btn btn-go reveal-go', 'aria-label': 'Continue' }, '▶');
  panel.append(go);
  await new Promise<void>((res) => go.addEventListener('click', () => res(), { once: true }));
  sfx.tap();
  panel.remove();
}

// ── spoken names for icons and units (the voice can't read emoji) ──
const NAMES: Record<string, string> = {
  '🍊': 'oranges', '🥭': 'mangoes', '🍎': 'apples', '🍉': 'watermelons', '🍌': 'bananas', '🍍': 'pineapples',
  '🍓': 'strawberries', '🍈': 'melons', '🍇': 'grapes', '🍋': 'lemons', '🚗': 'cars', '🛞': 'wheels',
  '🧁': 'cupcakes', '🍫': 'chocolate bars', '🐝': 'bees', '🌼': 'flowers', '🍪': 'cookies', '🥛': 'glasses of milk',
  mm: 'millimeters', cm: 'centimeters', m: 'meters', km: 'kilometers', in: 'inches', ft: 'feet', yd: 'yards', mi: 'miles',
  s: 'seconds', min: 'minutes', qt: 'quarts', gal: 'gallons', lb: 'pounds', oz: 'ounces',
};
const SINGULAR: Record<string, string> = { feet: 'foot', inches: 'inch', mangoes: 'mango', 'glasses of milk': 'glass of milk', 'chocolate bars': 'chocolate bar', strawberries: 'strawberry' };

/** "12 inches", "1 foot", "3 mangoes" — for read-aloud text. */
export function said(n: number, label: string): string {
  const plural = NAMES[label] ?? label;
  return `${n} ${n === 1 ? SINGULAR[plural] ?? plural.replace(/s$/, '') : plural}`;
}
export const plural = (label: string) => NAMES[label] ?? label;
