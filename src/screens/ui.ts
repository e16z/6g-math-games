import { portrait } from '../art/characters';
import { h } from '../engine/dom';
import { SAY } from '../engine/lines';
import { sfx } from '../engine/sound';
import { store } from '../engine/store';
import type { Beat, UnitDef } from '../engine/types';
import { hush, speak } from '../engine/voice';

export function iconBtn(icon: string, label: string, onClick: () => void, cls = '') {
  return h('button', {
    class: `btn-icon ${cls}`,
    'aria-label': label,
    title: label,
    onclick: () => {
      sfx.tap();
      onClick();
    },
  }, icon);
}

export function voiceToggle() {
  const b = iconBtn(store.get().voice ? '🗣️' : '🤐', 'Read aloud on/off', () => {
    const on = !store.get().voice;
    store.set({ voice: on });
    b.textContent = on ? '🗣️' : '🤐';
    if (!on) hush();
    else void speak(SAY.okay);
  });
  return b;
}

export function soundToggle() {
  const b = iconBtn(store.get().sound ? '🔊' : '🔇', 'Sound on/off', () => {
    const on = !store.get().sound;
    store.set({ sound: on });
    b.textContent = on ? '🔊' : '🔇';
  });
  return b;
}

/** One story panel: who's talking, what they say, a big ▶ to continue. */
export function beatCard(b: Beat, onNext: () => void) {
  const card = h('div', { class: `beat beat-${b.who}` },
    b.hidePortrait ? null : h('div', { class: 'beat-who' }, portrait(b.who, b.mood ?? 'smug', store.get().hat)),
    h('div', { class: 'bubble' }, h('div', { class: 'bubble-text' }, b.text),
      h('button', { class: 'bubble-say', 'aria-label': 'Say it again', onclick: (e: Event) => { e.stopPropagation(); void speak(b.text, b.who); } }, '🔊')),
    h('button', { class: 'btn btn-go next', 'aria-label': 'Next', onclick: (e: Event) => { e.stopPropagation(); sfx.tap(); onNext(); } }, '▶'),
  );
  void speak(b.text, b.who);
  return card;
}

/** The unit's mystery picture, covered by one tile per unfinished level. */
export function secretEl(unit: UnitDef, highlight = -1) {
  const wrap = h('div', { class: 'secret' });
  if (!unit.secret) return wrap;
  const pic = unit.secret();
  pic.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  wrap.append(pic);
  const tiles = h('div', { class: 'secret-tiles' });
  unit.levels.forEach((lvl, i) => {
    const done = store.stars(lvl.id) > 0;
    const t = h('div', { class: `tile ${done && i !== highlight ? 'gone' : ''} ${i === highlight ? 'pop' : ''}` }, '?');
    tiles.append(t);
  });
  wrap.append(tiles);
  return wrap;
}
