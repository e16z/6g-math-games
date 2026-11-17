import { h } from './dom';

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Web Animations helper: runs, then bakes the final frame into inline style. */
export async function anim(el: Element, frames: Keyframe[], opts: number | KeyframeAnimationOptions): Promise<void> {
  const o = typeof opts === 'number' ? { duration: opts } : opts;
  const a = el.animate(frames, { fill: 'forwards', easing: 'ease-in-out', ...o });
  try {
    await a.finished;
    a.commitStyles();
  } catch {
    /* element removed mid-animation: fine */
  }
  a.cancel();
}

/** Comic-book word ("SPLOOSH!") that pops and fades. */
export function burst(parent: HTMLElement, text: string, x: number, y: number, color = '#FFD23F', size = 64) {
  const el = h('div', { class: 'burst', style: { left: `${x}px`, top: `${y}px`, color, fontSize: `${size}px` } }, text);
  parent.append(el);
  const rot = Math.random() * 16 - 8;
  el.animate(
    [
      { transform: `translate(-50%,-50%) scale(0) rotate(${rot}deg)`, opacity: 1 },
      { transform: `translate(-50%,-50%) scale(1.25) rotate(${rot}deg)`, opacity: 1, offset: 0.2 },
      { transform: `translate(-50%,-50%) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.75 },
      { transform: `translate(-50%,-70%) scale(1) rotate(${rot}deg)`, opacity: 0 },
    ],
    { duration: 1300, easing: 'ease-out', fill: 'forwards' },
  ).finished.then(() => el.remove(), () => el.remove());
}

/** Things flying out of a point: emoji, or colored dots when given CSS colors. */
export function spray(parent: HTMLElement, x: number, y: number, items: string[], n = 16, power = 260, size = 34) {
  for (let i = 0; i < n; i++) {
    const item = items[i % items.length];
    const isColor = item.startsWith('#');
    const el = h(
      'div',
      {
        class: 'particle',
        style: isColor
          ? { left: `${x}px`, top: `${y}px`, width: `${size * 0.5}px`, height: `${size * 0.5}px`, background: item, borderRadius: '50%' }
          : { left: `${x}px`, top: `${y}px`, fontSize: `${size}px` },
      },
      isColor ? '' : item,
    );
    parent.append(el);
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const v = power * (0.5 + Math.random() * 0.7);
    const dx = Math.cos(ang) * v;
    const dy = Math.sin(ang) * v;
    el.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx * 1.5}px), calc(-50% + ${dy + 300}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' },
    ).finished.then(() => el.remove(), () => el.remove());
  }
}

const CONFETTI = ['#FFD23F', '#FF4F8B', '#3EE6FF', '#7CFF6B', '#B388FF', '#FF9F1C'];
export function confetti(parent: HTMLElement, x = 640, y = 200, n = 40) {
  spray(parent, x, y, CONFETTI, n, 420, 30);
}

export function shake(el: Element, px = 10, ms = 450) {
  return anim(
    el,
    [
      { translate: '0 0' },
      { translate: `${-px}px 0` },
      { translate: `${px}px 0` },
      { translate: `${-px * 0.6}px 0` },
      { translate: `${px * 0.6}px 0` },
      { translate: '0 0' },
    ],
    { duration: ms, easing: 'linear' },
  );
}

/** Full-screen colored flash (red alarm, white zap...). */
export function flash(parent: HTMLElement, color = 'rgba(255,40,60,.45)', ms = 600) {
  const el = h('div', { class: 'flash', style: { background: color } });
  parent.append(el);
  el.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: ms }).finished.then(
    () => el.remove(),
    () => el.remove(),
  );
}
