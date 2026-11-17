import { Hero } from '../art/characters';
import { box, h, s } from '../engine/dom';
import { shake } from '../engine/fx';
import { SAY } from '../engine/lines';
import { sfx } from '../engine/sound';
import { store, unlockAll } from '../engine/store';
import { speak } from '../engine/voice';
import { getUnit } from '../units';
import { nav } from './nav';
import { iconBtn, secretEl, voiceToggle } from './ui';

// Snake path: left→right on top, right→left on the bottom.
const POS = [
  [120, 270], [320, 270], [520, 270], [720, 270],
  [720, 560], [520, 560], [320, 560], [120, 560],
];

export function map(el: HTMLElement, p: { unit: number }) {
  const unit = getUnit(p.unit)!;
  el.classList.add('bg-floor');
  const open = (i: number) => unlockAll || i === 0 || store.stars(unit.levels[i - 1].id) > 0;
  const current = unit.levels.findIndex((l, i) => open(i) && store.stars(l.id) === 0);

  const pts = POS.slice(0, unit.levels.length);
  const d = pts.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : i === 4 ? `C ${pts[3][0] + 160} ${pts[3][1]}, ${x + 160} ${y}, ${x} ${y}` : `L${x} ${y}`)).join(' ');
  el.append(box('path-wrap', 0, 0, 900, 800, s('svg', { width: 900, height: 800, viewBox: '0 0 900 800' }, s('path', { d, class: 'trail' }))));

  unit.levels.forEach((lvl, i) => {
    const [x, y] = POS[i];
    const ok = open(i);
    const stars = store.stars(lvl.id);
    const node = h('button', {
      class: `node ${ok ? '' : 'locked'} ${i === current ? 'current' : ''} ${lvl.boss ? 'boss' : ''}`,
      style: { left: `${x - 70}px`, top: `${y - 70}px`, '--c': unit.color },
      'aria-label': lvl.name,
      onclick: () => {
        if (!ok) {
          sfx.wrong();
          void shake(node, 6);
          void speak(SAY.finishFirst);
          return;
        }
        sfx.tap();
        nav.go('level', { unit: unit.num, index: i });
      },
    },
      h('span', { class: 'node-ico' }, ok ? lvl.icon : '🔒'),
      h('span', { class: 'node-num' }, String(i + 1)),
    );
    el.append(
      node,
      box('node-name', x - 100, y + 76, 200, 34, lvl.name),
      box('node-stars', x - 100, y + 108, 200, 34, ok ? [1, 2, 3].map((n) => h('span', { class: n <= stars ? 'on' : '' }, '★')) : null),
    );
    if (i === current) {
      const hero = new Hero(store.get().hat, 90);
      hero.place(x + 62, y + 40);
      hero.el.classList.add('idle');
      el.append(hero.el);
    }
  });

  // Powers unlocked by each floor's halfway trick.
  const POWERS: [string, string, string][] = [['unfold', '📦', 'Unfold'], ['per1', '1️⃣', 'Per-1'], ['decoder', '🔍', 'Decoder'], ['flip', '🔄', 'Flip']];
  const powers = h('div', { class: 'powers' }, POWERS.filter(([id]) => store.has(id)).map(([, ico, name]) => h('div', { class: 'power' }, ico, h('span', {}, name))));
  el.append(
    box('map-head', 160, 14, 700, 80, h('span', { class: 'map-ico' }, unit.icon), h('span', { class: 'map-floor' }, `Floor ${unit.num}`), h('span', { class: 'map-title' }, unit.title)),
    box('secret-panel', 900, 140, 360, 300, secretEl(unit)),
    box('secret-cap', 900, 450, 360, 50, '🧩 Who is Baron, really?'),
    box('powers-wrap', 900, 520, 360, 80, powers),
    box('topleft', 20, 20, 140, 70, iconBtn('🏢', 'Back to the tower', () => nav.go('tower'))),
    box('corner-btns', 1090, 20, 180, 70, voiceToggle(), iconBtn('🎩', 'Change hat', () => nav.go('hats', { back: 'map', unit: unit.num }))),
  );
  if (current === -1 && unit.finale) {
    el.append(box('replay-finale', 940, 640, 280, 70, iconBtn('🎬', 'Watch the ending', () => nav.go('story', { beats: unit.finale, next: 'map', params: { unit: unit.num } }), 'wide')));
  }
}
