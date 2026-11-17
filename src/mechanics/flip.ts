// Lessons 8–10 — the halfway discovery: dividing by 1/d is multiplying by d,
// and dividing by a fraction is multiplying by it flipped.
//   kind 'see'     — count pieces in a picture; results pile up on a board
//   kind 'predict' — the picture is covered; predict from the pattern → REVEAL
//   kind 'flip'    — too big to draw: use the Flip Trick
import { box, fracEl, h, mathEl } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, confetti, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import { FLIP_REVEAL } from '../engine/lines';
import { speak, type VoiceLine } from '../engine/voice';
import { mysterySvg } from '../art/characters';
import type { Kit, Mechanic, Scene } from '../engine/types';
import { checkOptions, fracChoices } from './common';

type FlipRound = { kind: 'see' | 'predict'; a: number; d: number } | { kind: 'flip'; a: string; b: string };

export function flipPlan(r: FlipRound) {
  if (r.kind === 'flip') {
    const a = F(r.a);
    const b = F(r.b);
    const ans = a.div(b);
    return { a, b, ans, options: makeOptions(ans, [a.mul(b), b.div(a), ans.add(1)]) };
  }
  const a = F(r.a);
  const b = new Frac(1, r.d);
  const ans = a.mul(r.d);
  return { a, b, ans, options: makeOptions(ans, [F(r.a + r.d), new Frac(r.a, r.d), ans.add(r.d)]) };
}

interface Row {
  a: number;
  d: number;
}

function boardEl(rows: Row[], tagged: boolean) {
  const el = box('board', 870, 16, 380, 440, h('div', { class: 'board-title' }, '📋'));
  for (const r of rows) {
    el.append(
      h('div', { class: 'board-row' }, mathEl([r.a, '÷', new Frac(1, r.d), '=', r.a * r.d]), tagged ? h('span', { class: 'board-tag' }, `× ${r.d}`) : null),
    );
  }
  return el;
}

const NO_PEEK = 'No peeking! Ha!';
const seeSay = (a: number, d: number) => `How many ${new Frac(1, d)} pieces are in ${a}?`;
const flipSay = (a: Frac, b: Frac, unlocked: boolean) => (unlocked ? `${a} ÷ ${b}. Too hard to draw! Tap the flip button.` : `${a} ÷ ${b}`);
const flipTaunt = (a: Frac, b: Frac) => (b.recip().mul(a).gt(40) ? 'Too many to count! Ha!' : 'Crack THIS!');

export const flip: Mechanic<FlipRound> = {
  id: 'flip',
  lines(r) {
    if (r.kind === 'flip') {
      const a = F(r.a);
      const b = F(r.b);
      return [
        { who: 'narrator', text: flipSay(a, b, true) },
        { who: 'narrator', text: flipSay(a, b, false) },
        { who: 'baron', text: flipTaunt(a, b) },
      ];
    }
    const out: VoiceLine[] = [{ who: 'narrator', text: seeSay(r.a, r.d) }];
    if (r.kind === 'predict') out.push({ who: 'baron', text: NO_PEEK }, { who: 'mystery', text: FLIP_REVEAL });
    return out;
  },

  validate(r) {
    const p = flipPlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (r.kind !== 'flip' && r.a * r.d > 60) errs.push('too many pieces to draw');
    return errs;
  },

  build(r, arena, kit) {
    return r.kind === 'flip' ? buildFlip(r, arena, kit) : buildSee(r, arena, kit);
  },
};

function buildSee(r: { kind: 'see' | 'predict'; a: number; d: number }, arena: HTMLElement, kit: Kit): Scene {
  const { b, ans, options } = flipPlan(r);
  const rows = (kit.memo.board ??= []) as Row[];
  arena.classList.add('bg-lab');

  const X = 60;
  const W = 760;
  const whole = W / r.a;
  const sw = whole / r.d;
  const total = r.a * r.d;
  const bar = box('choco', X, 110, W, 90);
  bar.style.backgroundImage = `repeating-linear-gradient(90deg, transparent 0 ${whole - 5}px, #2b140a ${whole - 5}px ${whole}px), repeating-linear-gradient(90deg, transparent 0 ${sw - 2}px, rgba(255,255,255,.55) ${sw - 2}px ${sw}px)`;
  const ruler = box('ruler below', X, 214, W, 30);
  for (let i = 0; i <= r.a; i++) ruler.append(h('div', { class: 'tick', style: { left: `${i * whole}px` } }), h('div', { class: 'tick-lab', style: { left: `${i * whole}px` } }, String(i)));
  const nums = box('deck', X, 110, 0, 0);
  let board = boardEl(rows, false);
  const hero = kit.hero(96).place(80, 460);
  arena.append(bar, ruler, nums, board, hero.el);

  let curtain: HTMLElement | null = null;
  if (r.kind === 'predict') {
    curtain = box('curtain', X - 10, 90, W + 20, 160, h('div', { class: 'curtain-face' }, '🙈'), h('div', { class: 'curtain-text' }, 'NO PEEKING!'));
    arena.append(curtain);
  }

  async function count(upTo: number, fast = false) {
    nums.replaceChildren();
    const n = Math.min(upTo, total);
    const step = fast ? 12 : Math.min(90, 1400 / Math.max(1, n));
    const fs = Math.min(26, sw * 0.6);
    for (let i = 0; i < n; i++) {
      nums.append(box('slice-num on', i * sw, 30, sw, 30, String(i + 1)));
      (nums.lastChild as HTMLElement).style.fontSize = `${fs}px`;
      if (!fast || i % 4 === 0) sfx.tick(i % 30);
      await wait(step);
    }
    return n;
  }

  async function glove() {
    const g = box('glove', -140, 300, 120, 100, '🥊');
    arena.append(g);
    sfx.boing();
    await anim(g, [{ left: '-140px' }, { left: `${hero.x - 70}px` }], { duration: 260, easing: 'ease-in' });
    burst(arena, 'BOING!', hero.x + 40, 300, '#FF4F8B', 60);
    await anim(hero.el, [{ transform: 'none' }, { transform: 'translateX(60px) rotate(15deg)' }, { transform: 'none' }], 500);
    hero.fx('dizzy');
    await anim(g, [{ left: `${hero.x - 70}px` }, { left: '-160px' }], 300);
    g.remove();
  }

  return {
    ask: { math: [r.a, '÷', b, '=', '?'], say: seeSay(r.a, r.d) },
    choices: fracChoices(ans, options),

    async intro() {
      if (r.kind === 'predict') await kit.baron('smug', NO_PEEK);
    },

    async play(c) {
      hero.clearFx();
      nums.querySelectorAll('.extra').forEach((e) => e.remove());
      const v = (c.value as Frac).floor();
      if (c.correct) {
        if (curtain) {
          sfx.whoosh();
          await anim(curtain, [{ transform: 'none' }, { transform: 'translateY(-400px)' }], 450);
        }
        await count(total, r.kind === 'predict');
        nums.querySelectorAll('.slice-num').forEach((e) => e.classList.add('good'));
        rows.push({ a: r.a, d: r.d });
        board.replaceWith((board = boardEl(rows, false)));
        void anim(board.lastElementChild as Element, [{ transform: 'scale(1.4)', background: '#ffd23f' }, { transform: 'none' }], 500);
        await hero.cheer();
        return;
      }
      if (!curtain) {
        const n = await count(v);
        if (v < total) {
          for (let i = n; i < total; i++) nums.append(box('slice-num bad', i * sw, 30, sw, 30, '?'));
        } else if (v > total) {
          nums.append(box('slice-num bad extra', W + 6, 30, 80, 30, `+${v - total}`));
        }
        await wait(300);
      }
      await glove();
    },

    hint() {
      if (curtain) {
        // Clue: look at what happened to each number on the board.
        board.replaceWith((board = boardEl(rows, true)));
        board.querySelectorAll('.board-tag').forEach((t, i) => void anim(t, [{ transform: 'scale(0)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400, delay: i * 250 }));
      }
    },

    async after() {
      if (r.kind !== 'predict') return;
      await reveal(arena, kit, r.a, r.d);
      board.replaceWith((board = boardEl(rows, true)));
    },
  };
}

/** The big moment: ÷ 1/8 flips into × 8. */
async function reveal(arena: HTMLElement, kit: Kit, a: number, d: number) {
  const card = h('span', { class: 'flip-card' }, fracEl(new Frac(1, d)));
  const op = h('span', { class: 'op flip-op' }, '÷');
  const panel = box('reveal', 140, 20, 1000, 430,
    h('div', { class: 'reveal-math' }, fracEl(a), op, card, h('span', { class: 'op' }, '='), fracEl(a * d)),
  );
  arena.append(panel);
  await anim(panel, [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], 350);
  await wait(700);
  sfx.flip();
  await anim(card, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(90deg)' }], 300);
  card.replaceChildren(fracEl(d));
  op.textContent = '×';
  op.classList.add('times');
  await anim(card, [{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0)' }], 300);
  sfx.fanfare();
  confetti(arena, 640, 160, 60);
  kit.give('flip');

  const who = h('div', { class: 'reveal-who' }, mysterySvg());
  const bubble = h('div', { class: 'reveal-bubble' }, '🔄 FLIP TRICK!');
  panel.append(who, bubble);
  void anim(who, [{ transform: 'translateY(200px)' }, { transform: 'none' }], 400);
  void speak(FLIP_REVEAL, 'mystery');
  await wait(900);
  const go = h('button', { class: 'btn btn-go reveal-go', 'aria-label': 'Continue' }, '▶');
  panel.append(go);
  await new Promise<void>((res) => go.addEventListener('click', () => res(), { once: true }));
  sfx.tap();
  panel.remove();
}

function buildFlip(r: { kind: 'flip'; a: string; b: string }, arena: HTMLElement, kit: Kit): Scene {
  const { a, b, ans, options } = flipPlan(r);
  arena.classList.add('bg-vault');
  const door = box('safe-door', 0, 0, 380, 380, h('div', { class: 'safe-dial' }), h('div', { class: 'safe-math' }, mathEl([a, '÷', b])));
  const safe = box('safe', 160, 40, 380, 380, h('div', { class: 'safe-inside' }, '🍪🍩🧁'), door);
  const hero = kit.hero(100).place(700, 460);
  arena.append(safe, hero.el);

  // Ridiculous: a picture with way too many pieces to count.
  const pieces = b.recip().mul(a);
  if (pieces.gt(40)) {
    const sw = 560 / pieces.value;
    const dense = box('choco', 660, 90, 560, 70);
    dense.style.backgroundImage = `repeating-linear-gradient(90deg, transparent 0 ${Math.max(0.5, sw - 1)}px, rgba(255,255,255,.7) ${Math.max(0.5, sw - 1)}px ${sw}px)`;
    arena.append(dense, box('dizzy-face', 900, 170, 100, 80, '😵‍💫'));
  }
  const helper = box('flip-helper hidden', 160, 425, 380, 40);
  arena.append(helper);

  return {
    ask: { math: [a, '÷', b, '=', '?'], say: flipSay(a, b, kit.has('flip')) },
    choices: fracChoices(ans, options),

    async intro() {
      await kit.baron('smug', flipTaunt(a, b));
    },

    async play(c) {
      hero.clearFx();
      hero.el.style.transform = '';
      const dial = door.querySelector('.safe-dial')!;
      sfx.click();
      await anim(dial, [{ transform: 'rotate(0)' }, { transform: 'rotate(720deg)' }], 700);
      if (c.correct) {
        sfx.clank();
        door.style.transformOrigin = 'left center';
        await anim(door, [{ transform: 'perspective(800px) rotateY(0)' }, { transform: 'perspective(800px) rotateY(-105deg)' }], 600);
        spray(arena, 350, 230, ['🍪', '🍩', '🧁', '🍫', '🍬'], 24, 380, 40);
        await hero.cheer();
        return;
      }
      // Wrong combo: a tiny safe falls on the raccoon. Classic.
      sfx.alarm();
      const mini = box('mini-safe', hero.x - 10, -120, 90, 80);
      arena.append(mini);
      sfx.whistleDown();
      await anim(mini, [{ top: '-120px' }, { top: `${hero.y - 50}px` }], { duration: 500, easing: 'ease-in' });
      sfx.thud();
      burst(arena, 'CLONK!', hero.x + 40, hero.y - 40, '#FFD23F', 60);
      hero.el.style.transformOrigin = 'bottom center';
      await anim(hero.el, [{ transform: 'none' }, { transform: 'scaleY(.35) scaleX(1.4)' }], 120);
      await anim(mini, [{ opacity: 1 }, { opacity: 0, transform: 'translateX(120px) rotate(40deg)' }], 400);
      mini.remove();
      await wait(300);
      await anim(hero.el, [{ transform: 'scaleY(.35) scaleX(1.4)' }, { transform: 'scaleY(1.15)' }, { transform: 'none' }], 350);
      hero.fx('dizzy');
      await shake(safe, 4);
    },

    async hint() {
      helper.replaceChildren(mathEl([a, '×', b.recip(), '=', '?']));
      helper.classList.remove('hidden');
      await kit.flipAsk();
    },
  };
}
