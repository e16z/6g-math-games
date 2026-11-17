// UNIT 1 — Area and Surface Area (Amplify Desmos Math, Grade 6)
// Floor 1 of Baron's tower: laser floors and wrapped snack boxes.
// Change a puzzle by changing its numbers: answers and wrong options are computed.
import { s } from '../engine/dom';
import type { UnitDef } from '../engine/types';
import { vaultBurst } from '../screens/scenes';

export const unit1: UnitDef = {
  num: 1,
  title: 'Area & Surface Area',
  icon: '📐',
  color: '#4cc9f0',
  levels: [
    {
      id: 'u1-1',
      name: 'Floor Tiles',
      icon: '🟪',
      lessons: [1, 2],
      mechanic: 'area',
      intro: [{ who: 'baron', mood: 'smug', text: 'My floors are lasers! Step wrong and... ZAP!' }],
      rounds: [
        { kind: 'grid', pieces: [[[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]]] },
        { kind: 'grid', pieces: [[[0, 0], [4, 0], [4, 3], [2, 5], [0, 3]]] },
        { kind: 'grid', pieces: [[[0, 1], [3, 1], [3, 0], [5, 2], [3, 4], [3, 3], [0, 3]]] },
        { kind: 'grid', pieces: [[[2, 0], [4, 2], [2, 4], [0, 2]]] },
        { kind: 'grid', pieces: [[[0, 0], [6, 0], [6, 1], [5, 1], [5, 2], [4, 2], [4, 3], [0, 3]]] },
      ],
    },
    {
      id: 'u1-2',
      name: 'Slanty Floors',
      icon: '▱',
      lessons: [3, 4, 5],
      mechanic: 'area',
      intro: [{ who: 'baron', mood: 'laugh', text: 'My floors LEAN. Bet you can’t paint them!' }],
      rounds: [
        { kind: 'para', base: 4, height: 3, shift: 2 },
        { kind: 'para', base: 6, height: 4, shift: 2 },
        { kind: 'para', base: 5, height: 3, shift: 3 },
        { kind: 'para', base: 7, height: 2, shift: 3 },
        { kind: 'para', base: 6, height: 3, shift: -2 },
      ],
    },
    {
      id: 'u1-3',
      name: 'Triangles',
      icon: '🔺',
      lessons: [6, 7, 8],
      mechanic: 'area',
      intro: [{ who: 'baron', mood: 'smug', text: 'Triangle floors. Even sneakier. Ha!' }],
      rounds: [
        { kind: 'tri', base: 6, height: 4, shift: 2 },
        { kind: 'tri', base: 6, height: 5, shift: 3 },
        { kind: 'tri', base: 4, height: 6, shift: 0 },
        { kind: 'tri', base: 5, height: 4, shift: 7 },
        { kind: 'tri', base: 7, height: 4, shift: 2 },
      ],
    },
    {
      id: 'u1-4',
      name: 'Weird Rooms',
      icon: '🏚️',
      lessons: [9],
      mechanic: 'area',
      intro: [{ who: 'mystery', text: 'Weird rooms! Break them into shapes you know.' }],
      rounds: [
        { kind: 'poly', pieces: [[[0, 0], [6, 0], [6, 3], [0, 3]], [[0, 3], [6, 3], [3, 6]]] },
        { kind: 'poly', pieces: [[[0, 0], [4, 0], [4, 3], [0, 3]], [[4, 0], [6, 0], [4, 3]]] },
        { kind: 'poly', pieces: [[[0, 0], [5, 0], [5, 2], [0, 2]], [[0, 2], [2, 2], [2, 5], [0, 5]], [[2, 2], [5, 2], [2, 5]]] },
        { kind: 'poly', pieces: [[[0, 2], [4, 0], [4, 4]], [[4, 0], [7, 2], [4, 4]]] },
        { kind: 'poly', pieces: [[[2, 0], [6, 0], [6, 4], [2, 4]], [[0, 2], [2, 0], [2, 4]], [[6, 0], [8, 2], [6, 4]]] },
      ],
    },
    {
      // Halfway: the deeper rule. After this, the 📦 Unfold button shows up.
      id: 'u1-5',
      name: 'Unfold!',
      icon: '📦',
      lessons: [10, 11, 12],
      mechanic: 'wrap',
      intro: [{ who: 'mystery', text: 'Wrap Baron’s snack boxes like presents. Nobody will notice!' }],
      rounds: [
        { dims: [2, 3, 4] },
        { dims: [1, 2, 3] },
        { dims: [2, 2, 3], reveal: true },
        { dims: [3, 4, 5] },
        { dims: [2, 5, 4] },
      ],
    },
    {
      id: 'u1-6',
      name: 'Gift Wrap',
      icon: '🎁',
      lessons: [12, 13],
      mechanic: 'wrap',
      intro: [{ who: 'baron', mood: 'angry', text: 'Who is wrapping my snacks?! Stop it!' }],
      rounds: [{ dims: [3, 3, 3] }, { dims: [4, 2, 1] }, { dims: [2, 2, 2] }, { dims: [5, 4, 2] }, { dims: [4, 4, 4] }],
    },
    {
      id: 'u1-7',
      name: 'Fill or Wrap?',
      icon: '🧊',
      lessons: [10, 13, 14],
      mechanic: 'wrap',
      intro: [{ who: 'baron', mood: 'laugh', text: 'Fill it or wrap it? You’ll mix them up!' }],
      rounds: [
        { mechanic: 'crate', kind: 'volume', dims: ['3', '2', '2'], unit: true },
        { dims: [3, 2, 2] },
        { mechanic: 'crate', kind: 'volume', dims: ['4', '3', '2'], unit: true },
        { dims: [4, 3, 2] },
        { mechanic: 'crate', kind: 'volume', dims: ['3', '3', '3'], unit: true },
      ],
    },
    {
      id: 'u1-8',
      name: 'The Vault',
      icon: '👑',
      lessons: [14],
      mechanic: 'area',
      boss: true,
      intro: [{ who: 'baron', mood: 'angry', text: 'My Floor 1 vault has SIX locks. Good luck!' }],
      rounds: [
        { kind: 'grid', pieces: [[[0, 0], [3, 0], [5, 2], [3, 4], [0, 4]]] },
        { kind: 'para', base: 5, height: 4, shift: 2 },
        { mechanic: 'wrap', dims: [2, 3, 5] },
        { kind: 'tri', base: 8, height: 3, shift: 2 },
        { mechanic: 'crate', kind: 'volume', dims: ['2', '3', '4'], unit: true },
        { kind: 'poly', pieces: [[[0, 0], [4, 0], [4, 4], [0, 4]], [[0, 4], [4, 4], [2, 6]]] },
      ],
    },
  ],

  // Mystery picture: Baron's robot blueprint... with a "?" where his brain should be.
  secret: () => {
    const st = { stroke: '#dff3ff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    return s('svg', { viewBox: '0 0 400 280', class: 'secret-svg' },
      s('defs', {}, s('pattern', { id: 'bp1', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, s('path', { d: 'M20 0 H0 V20', fill: 'none', stroke: 'rgba(255,255,255,.14)', 'stroke-width': 1 }))),
      s('rect', { width: 400, height: 280, fill: '#1d4f91' }),
      s('rect', { width: 400, height: 280, fill: 'url(#bp1)' }),
      s('rect', { x: 165, y: 12, width: 70, height: 34, rx: 3, ...st }),
      s('path', { d: 'M140 48 H260', ...st, 'stroke-width': 5 }),
      s('rect', { x: 140, y: 52, width: 120, height: 92, rx: 22, ...st }),
      s('circle', { cx: 225, cy: 82, r: 13, ...st }),
      s('text', { x: 200, y: 128, 'text-anchor': 'middle', 'font-size': 64, 'font-weight': 700, fill: '#ffd23f', 'font-family': 'Fredoka, sans-serif' }, '?'),
      s('rect', { x: 248, y: 96, width: 12, height: 22, rx: 2, fill: '#ff4f8b' }),
      s('circle', { cx: 251, cy: 107, r: 2, fill: '#fff' }),
      s('path', { d: 'M262 106 Q300 90 318 60', stroke: '#ffd23f', 'stroke-width': 2, fill: 'none', 'stroke-dasharray': '5 5' }),
      s('text', { x: 300, y: 50, 'font-size': 18, fill: '#ffd23f', 'font-family': 'Fredoka, sans-serif' }, 'tiny door?!'),
      s('rect', { x: 150, y: 150, width: 100, height: 80, rx: 14, ...st }),
      s('path', { d: 'M150 165 L110 205 M250 165 L290 205 M175 230 V266 M225 230 V266', ...st }),
      s('text', { x: 14, y: 30, fill: '#dff3ff', 'font-size': 20, 'font-weight': 700, 'font-family': 'Fredoka, sans-serif' }, 'TOP SECRET'),
    );
  },

  finale: [
    { who: 'baron', mood: 'shock', text: 'NO! My snacks! My beautiful snacks!', scene: vaultBurst },
    { who: 'baron', mood: 'angry', text: 'Fine! But you will NEVER beat Floor 2!' },
    { who: 'mystery', text: 'Did you hear that? Something inside Baron just squeaked...' },
  ],
};
