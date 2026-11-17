import { baronSvg } from '../art/characters';
import { box, h } from '../engine/dom';
import { shake } from '../engine/fx';
import { SAY } from '../engine/lines';
import { sfx } from '../engine/sound';
import { store } from '../engine/store';
import { speak } from '../engine/voice';
import { isReady, UNITS } from '../units';
import { nav } from './nav';
import { iconBtn, voiceToggle } from './ui';

/** Baron's tower: one floor per unit. Tap a lit floor. */
export function tower(el: HTMLElement) {
  el.classList.add('bg-night');
  const t = h('div', { class: 'big-tower' });
  for (const u of [...UNITS].reverse()) {
    const ready = isReady(u);
    const got = u.levels.reduce((n, l) => n + store.stars(l.id), 0);
    const done = ready && u.levels.every((l) => store.stars(l.id) > 0);
    const row = h('button', {
      class: `floor ${ready ? 'ready' : 'locked'} ${done ? 'done' : ''}`,
      style: { '--c': u.color },
      'aria-label': `Floor ${u.num}: ${u.title}`,
      onclick: () => {
        if (ready) {
          sfx.whoosh();
          nav.go('map', { unit: u.num });
        } else {
          sfx.wrong();
          void shake(row, 6);
          void speak(SAY.locked);
        }
      },
    },
      h('span', { class: 'floor-num' }, String(u.num)),
      h('span', { class: 'floor-ico' }, u.icon),
      h('span', { class: 'floor-title' }, u.title),
      h('span', { class: 'floor-end' }, ready ? `⭐ ${got}` : '🔒'),
    );
    t.append(row);
  }
  el.append(
    box('tower-top', 470, 6, 340, 90, baronSvg('smug')),
    t,
    box('topleft', 20, 20, 200, 70, iconBtn('🏠', 'Home', () => nav.go('home'))),
    box('corner-btns', 1090, 20, 180, 70, voiceToggle(), iconBtn(hatEmoji(), 'Change hat', () => nav.go('hats'))),
  );
  void speak(SAY.pickFloor);
}

const hatEmoji = () => ({ tophat: '🎩', crown: '👑', chef: '👨‍🍳', party: '🥳', propeller: '🧢', beanie: '🧶' } as Record<string, string>)[store.get().hat] ?? '🎩';
