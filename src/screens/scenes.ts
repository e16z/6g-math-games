// Animated backdrops for story beats. Each returns a cleanup function.
import { baronSvg, hamsterSvg } from '../art/characters';
import { box, h, pick } from '../engine/dom';
import { anim, spray } from '../engine/fx';

const SNACKS = ['🍪', '🍩', '🧁', '🍫', '🍬', '🥨', '🍭', '🍰'];

function city(el: HTMLElement) {
  const sky = h('div', { class: 'sky' });
  for (let i = 0; i < 40; i++) sky.append(h('span', { class: 'star', style: { left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%`, animationDelay: `${Math.random() * 3}s` } }));
  const skyline = h('div', { class: 'skyline' });
  for (let i = 0; i < 14; i++) {
    const b = h('div', { class: 'bldg', style: { height: `${90 + ((i * 53) % 140)}px`, width: `${60 + ((i * 37) % 50)}px` } });
    skyline.append(b);
  }
  el.append(sky, h('div', { class: 'moon' }), skyline);
}

export function tower(el: HTMLElement, x = 1000) {
  const t = box('tower', x, 120, 170, 680);
  for (let i = 0; i < 8; i++) t.append(h('div', { class: 'tower-win' }));
  const hat = box('tower-hat', x - 25, 40, 220, 90);
  el.append(t, hat, box('claw', x + 40, 0, 90, 70, '🧲'));
}

/** Snacks get sucked out of the city into Baron's tower. */
export function snackRaid(el: HTMLElement) {
  city(el);
  tower(el, 1010);
  const id = setInterval(() => {
    const s = box('flying-snack', 200 + Math.random() * 600, 760, 60, 60, pick(SNACKS));
    el.append(s);
    s.animate(
      [
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${1080 - parseFloat(s.style.left)}px, -720px) rotate(${Math.random() > 0.5 ? 540 : -540}deg) scale(.4)`, opacity: 1 },
      ],
      { duration: 1600 + Math.random() * 600, easing: 'cubic-bezier(.5,0,.8,.6)' },
    ).finished.then(() => s.remove(), () => s.remove());
  }, 160);
  return () => clearInterval(id);
}

export function nightCity(el: HTMLElement) {
  city(el);
  tower(el, 1010);
}

/** Vault door blown open, snacks everywhere. */
export function vaultBurst(el: HTMLElement) {
  el.append(h('div', { class: 'vault-bg' }), box('vault-hole', 760, 300, 360, 360), box('vault-door open', 760, 300, 360, 360));
  const id = setInterval(() => spray(el, 940, 480, SNACKS, 6, 560, 46), 350);
  return () => clearInterval(id);
}

/** Baron's head pops open... someone is driving him. */
export function hamsterReveal(el: HTMLElement) {
  el.append(h('div', { class: 'vault-bg' }));
  const baron = baronSvg('dizzy');
  const holder = box('reveal-baron', 740, 330, 360, 374, baron);
  const ham = box('reveal-hamster', 845, 450, 150, 150, hamsterSvg());
  el.append(ham, holder);
  const hat = baron.querySelector('.baron-hat') as SVGGElement;
  void anim(hat, [{ transform: 'none' }, { transform: 'translate(160px,-260px) rotate(120deg)', opacity: 0 }], { duration: 700, delay: 300, easing: 'ease-out' });
  void anim(ham, [{ transform: 'none' }, { transform: 'translateY(-165px)' }], { duration: 600, delay: 700, easing: 'cubic-bezier(.3,1.6,.6,1)' });
}

/** The hamster escapes with a jetpack. */
export function hamsterFly(el: HTMLElement) {
  city(el);
  const ham = box('reveal-hamster jet', 700, 420, 160, 160, hamsterSvg(), h('div', { class: 'jet-flame' }));
  el.append(ham);
  void anim(ham, [{ transform: 'none' }, { transform: 'translate(360px,-640px) rotate(20deg) scale(.5)' }], { duration: 2600, delay: 400, easing: 'ease-in' });
}
