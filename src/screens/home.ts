import { raccoonSvg } from '../art/characters';
import { box, h } from '../engine/dom';
import { sfx } from '../engine/sound';
import { store } from '../engine/store';
import type { Beat } from '../engine/types';
import { nav } from './nav';
import { nightCity, snackRaid } from './scenes';
import { soundToggle, voiceToggle } from './ui';

export const INTRO: Beat[] = [
  { who: 'mystery', text: 'Psst! Look at the city... Watch the snacks!', scene: snackRaid },
  { who: 'baron', mood: 'laugh', text: 'ALL the snacks are MINE! Mwa-ha-ha!', scene: snackRaid },
  { who: 'mystery', text: 'You are raccoons. You were BORN for this. Get them back!', scene: nightCity },
];

export function home(el: HTMLElement) {
  nightCity(el);
  const crew = h('div', { class: 'home-crew' },
    h('div', { class: 'peek p1' }, raccoonSvg('tophat')),
    h('div', { class: 'peek p2' }, raccoonSvg(store.get().hat)),
    h('div', { class: 'peek p3' }, raccoonSvg('crown')),
  );
  const play = h('button', {
    class: 'btn btn-go btn-play',
    'aria-label': 'Play',
    onclick: () => {
      sfx.fanfare();
      if (!store.get().seenIntro) nav.go('story', { beats: INTRO, next: 'hats', params: { first: true } });
      else nav.go('tower');
    },
  }, '▶');
  el.append(
    h('div', { class: 'logo' }, h('div', { class: 'logo-1' }, 'RACCOON'), h('div', { class: 'logo-2' }, 'HEIST')),
    h('div', { class: 'tagline' }, '🍪 Get the snacks back! 🍩'),
    play,
    crew,
    box('corner-btns', 1090, 720, 180, 70, voiceToggle(), soundToggle()),
  );
}
