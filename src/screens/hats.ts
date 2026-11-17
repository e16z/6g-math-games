import { HATS, raccoonSvg } from '../art/characters';
import { h } from '../engine/dom';
import { anim } from '../engine/fx';
import { SAY } from '../engine/lines';
import { sfx } from '../engine/sound';
import { store } from '../engine/store';
import { speak } from '../engine/voice';
import { nav } from './nav';

/** Pick a hat. One tap. That's the whole screen. */
export function hats(el: HTMLElement, p: { first?: boolean; back?: string; unit?: number } = {}) {
  if (p.first) store.set({ seenIntro: true });
  const preview = h('div', { class: 'hat-preview' }, raccoonSvg(store.get().hat));
  const grid = h('div', { class: 'hat-grid' });
  for (const hat of HATS) {
    const b = h('button', {
      class: `hat-btn ${store.get().hat === hat ? 'on' : ''}`,
      'aria-label': `${hat} hat`,
      onclick: () => {
        sfx.pop();
        store.set({ hat });
        grid.querySelectorAll('.hat-btn').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        preview.replaceChildren(raccoonSvg(hat));
        void anim(preview, [{ transform: 'translateY(0)' }, { transform: 'translateY(-50px)' }, { transform: 'translateY(0)' }], { duration: 400, easing: 'ease-out' });
      },
    }, raccoonSvg(hat));
    grid.append(b);
  }
  el.append(
    h('div', { class: 'title' }, '🎩 Pick your hat!'),
    preview,
    grid,
    h('button', {
      class: 'btn btn-go go-hats',
      'aria-label': 'Go',
      onclick: () => {
        sfx.tap();
        if (p.back === 'map') nav.go('map', { unit: p.unit });
        else nav.go('tower');
      },
    }, 'GO ▶'),
  );
  void speak(SAY.pickHat);
}
