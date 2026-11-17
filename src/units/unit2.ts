// UNIT 2 — Introducing Ratios (Amplify Desmos Math, Grade 6)
// Floor 2 of Baron's tower: the smoothie lab, the seesaw, the train station.
import { s } from '../engine/dom';
import type { UnitDef } from '../engine/types';
import { vaultBurst } from '../screens/scenes';

export const unit2: UnitDef = {
  num: 2,
  title: 'Ratios',
  icon: '🍹',
  color: '#f72585',
  levels: [
    {
      id: 'u2-1',
      name: 'Smoothie Lab',
      icon: '🍓',
      lessons: [1, 2, 3],
      mechanic: 'recipe',
      intro: [{ who: 'baron', mood: 'laugh', text: 'My smoothies need EXACT recipes. Mess up and... BLORP!' }],
      rounds: [
        { a: ['🍓', 3], b: ['🍌', 2], have: 6 },
        { a: ['🍇', 4], b: ['🍎', 1], have: 3 },
        { a: ['🍓', 2], b: ['🍌', 3], have: 9 },
        { a: ['🍊', 5], b: ['🍋', 2], have: 4 },
        { a: ['🍓', 3], b: ['🍌', 2], have: 1 },
      ],
    },
    {
      id: 'u2-2',
      name: 'Seesaw',
      icon: '⚖️',
      lessons: [4],
      mechanic: 'scale',
      intro: [{ who: 'baron', mood: 'smug', text: 'My scales must stay balanced. Or else!' }],
      rounds: [
        { a: ['🍊', 14], b: ['🥭', 8], have: 7 },
        { a: ['🍊', 6], b: ['🥭', 4], have: 9 },
        { a: ['🍎', 4], b: ['🍉', 1], have: 12 },
        { a: ['🍌', 10], b: ['🍍', 4], have: 15 },
        { a: ['🍓', 9], b: ['🍈', 6], have: 6 },
      ],
    },
    {
      id: 'u2-3',
      name: 'Twin Tracks',
      icon: '🛤️',
      lessons: [5],
      mechanic: 'dnl',
      intro: [{ who: 'mystery', text: 'Two tracks that count together. Ride to the cookie!' }],
      rounds: [
        { top: ['🍈', 3], bottom: ['🍓', 5], ticks: 6, at: 3, ask: 'bottom' },
        { top: ['🚗', 1], bottom: ['🛞', 4], ticks: 6, at: 5, ask: 'bottom' },
        { top: ['🧁', 4], bottom: ['🍫', 3], ticks: 6, at: 4, ask: 'top' },
        { top: ['🐝', 5], bottom: ['🌼', 2], ticks: 8, at: 6, ask: 'bottom' },
        { top: ['🍪', 6], bottom: ['🥛', 1], ticks: 5, at: 4, ask: 'top' },
      ],
    },
    {
      id: 'u2-4',
      name: 'Train Station',
      icon: '🚂',
      lessons: [7, 8],
      mechanic: 'multiples',
      intro: [{ who: 'baron', mood: 'smug', text: 'My trains never stop together. Ha!' }],
      rounds: [
        { kind: 'lcm', a: 2, b: 3 },
        { kind: 'lcm', a: 4, b: 6 },
        { kind: 'gcf', a: 8, b: 12, items: ['🍪', '🧁'] },
        { kind: 'lcm', a: 3, b: 5 },
        { kind: 'gcf', a: 12, b: 18, items: ['🍩', '🍬'] },
        { kind: 'lcm', a: 4, b: 10 },
      ],
    },
    {
      // Halfway: the deeper rule. After this, the 1️⃣ Per-1 button shows up.
      id: 'u2-5',
      name: 'Per-1 Trick',
      icon: '1️⃣',
      lessons: [6, 11],
      mechanic: 'table',
      intro: [{ who: 'mystery', text: 'Baron’s tables hide a trick. Watch the row with a 1!' }],
      rounds: [
        { cols: ['🎈', '🐸'], rows: [['6', '3'], ['2', '1'], ['?', '8']], say: '6 balloons lift 3 frogs. How many balloons lift 8 frogs?' },
        { cols: ['lb', '$'], fmt: ['frac', 'money'], rows: [['4', '10'], ['1', '2.5'], ['3', '?']], say: '4 pounds of apples cost 10 dollars. How much do 3 pounds cost?' },
        { cols: ['🧃', '$'], fmt: ['frac', 'money'], rows: [['3', '7.5'], ['8', '?']], kind: 'predict', say: '3 juices cost 7 dollars and 50 cents. How much do 8 juices cost?' },
        { cols: ['🎈', '🐸'], rows: [['10', '4'], ['?', '6']], say: '10 balloons lift 4 frogs. How many balloons lift 6 frogs?' },
        { cols: ['🍪', '$'], fmt: ['frac', 'money'], rows: [['5', '2'], ['12', '?']], say: '5 cookies cost 2 dollars. How much do 12 cookies cost?' },
      ],
    },
    {
      id: 'u2-6',
      name: 'Paint Shades',
      icon: '🎨',
      lessons: [9],
      mechanic: 'paint',
      intro: [{ who: 'mystery', text: 'Paint yourself dark to hide in the shadows!' }],
      rounds: [
        { a: [2, 1], b: [3, 2] },
        { a: [5, 3], b: [7, 4] },
        { a: [1, 2], b: [2, 4] },
        { a: [3, 5], b: [2, 3] },
        { a: [4, 3], b: [5, 4] },
      ],
    },
    {
      id: 'u2-7',
      name: 'Party Planner',
      icon: '🎉',
      lessons: [10, 11, 12],
      mechanic: 'table',
      intro: [{ who: 'baron', mood: 'laugh', text: 'Plan my party. Too little food? TOMATOES!' }],
      rounds: [
        { cols: ['👥', '🍕', '🧃'], rows: [['50', '10', '15'], ['200', '?', '60']], say: '50 guests need 10 pizzas. How many pizzas for 200 guests?' },
        { cols: ['👥', '🍕', '🧃'], rows: [['50', '10', '15'], ['10', '2', '?']], say: '50 guests need 15 juices. How many juices for 10 guests?' },
        { cols: ['👥', '🌮'], rows: [['50', '125'], ['?', '25']], say: '50 guests eat 125 tacos. How many guests eat 25 tacos?' },
        { cols: ['🚚', '⏰'], rows: [['15', '2'], ['45', '?']], say: '15 deliveries take 2 hours. How many hours for 45 deliveries?' },
        { cols: ['🎈', '🐸'], rows: [['6', '3'], ['?', '7']], say: '6 balloons lift 3 frogs. How many balloons lift 7 frogs?' },
      ],
    },
    {
      id: 'u2-8',
      name: 'The Vault',
      icon: '👑',
      lessons: [13, 14, 15],
      mechanic: 'tape',
      boss: true,
      intro: [{ who: 'baron', mood: 'angry', text: 'My ratio vault has SIX locks!' }],
      rounds: [
        { kind: 'ratio', parts: [['🌳', 2, 'parks'], ['🏢', 5, 'buildings']], total: 35, ask: 1 },
        { mechanic: 'guards', kind: 'ratio', a: 3, b: 2, c: 9, lie: '8' },
        { mechanic: 'recipe', a: ['🍓', 4], b: ['🍌', 3], have: 9 },
        { kind: 'ratio', parts: [['🟡', 2, 'cups of yellow'], ['🔵', 4, 'cups of blue']], total: 18, ask: 0 },
        { mechanic: 'paint', a: [2, 5], b: [3, 7] },
        { mechanic: 'guards', kind: 'ratio', a: 4, b: 5, c: 12, lie: '13' },
      ],
    },
  ],

  // Mystery picture: Baron's shopping list. Who needs THAT many sunflower seeds?
  secret: () => {
    const txt = (y: number, t: string, col = '#2b2b3a', size = 22) => s('text', { x: 90, y, 'font-size': size, fill: col, 'font-family': 'Fredoka, sans-serif', 'font-weight': 600 }, t);
    return s('svg', { viewBox: '0 0 400 280', class: 'secret-svg' },
      s('rect', { width: 400, height: 280, fill: '#3b2a1d' }),
      s('rect', { x: 60, y: 14, width: 280, height: 256, rx: 8, fill: '#fff8dc', transform: 'rotate(-3 200 140)' }),
      s('g', { transform: 'rotate(-3 200 140)' },
        [60, 96, 132, 168, 204, 240].map((y) => s('line', { x1: 70, y1: y + 6, x2: 330, y2: y + 6, stroke: '#cfe0f5', 'stroke-width': 2 })),
        txt(52, 'SHOPPING LIST', '#e63946', 22),
        txt(88, '• snacks × 1000'),
        txt(124, '• monocle polish'),
        txt(160, '• mustache wax'),
        txt(196, '• SUNFLOWER SEEDS', '#c1121f'),
        txt(222, '   × 9000 !!!', '#c1121f'),
      ),
      s('g', { transform: 'translate(300 220) rotate(15)', fill: '#7a4a2a' },
        s('ellipse', { cx: 0, cy: 8, rx: 12, ry: 10 }),
        s('circle', { cx: -12, cy: -8, r: 5 }),
        s('circle', { cx: -3, cy: -14, r: 5 }),
        s('circle', { cx: 7, cy: -13, r: 5 }),
        s('circle', { cx: 15, cy: -5, r: 5 }),
      ),
    );
  },

  finale: [
    { who: 'baron', mood: 'shock', text: 'My smoothies! My recipes! NOOO!', scene: vaultBurst },
    { who: 'baron', mood: 'angry', text: 'Floor 3 will stop you. It’s full of numbers!' },
    { who: 'mystery', text: 'Baron dropped a shopping list... Nine thousand sunflower seeds? Hmm.' },
  ],
};
