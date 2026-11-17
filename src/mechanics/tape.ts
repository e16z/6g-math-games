// Unit 2 lessons 13–14 (part-part-whole) · Unit 3 lessons 9–13 (percents).
// A loot bar. Cut exactly your share. Halfway trick (Unit 3): % DECODER —
// percent means "out of 100", so 25% is ¼ of the bar.
import { box, h, mathEl, type MathPart } from '../engine/dom';
import { F, Frac, gcd, makeOptions } from '../engine/frac';
import { anim, burst, flash, shake, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Kit, Mechanic } from '../engine/types';
import { checkOptions, fmtText, fracChoices, numEl, revealPanel, type Fmt } from './common';

type TapeRound =
  | { kind: 'ratio'; parts: [string, number, string][]; total: number; ask: number }
  | { kind: 'pct'; pct: number; whole?: string; part?: string; ask: 'part' | 'whole' | 'pct'; fmt?: Fmt; reveal?: 'see' | 'predict' };

const TX = 140;
const TW = 1000;
const TY = 170;
const TH = 80;

export function tapePlan(r: TapeRound) {
  if (r.kind === 'ratio') {
    const boxes = r.parts.reduce((a, p) => a + p[1], 0);
    const each = new Frac(r.total, boxes);
    const ans = each.mul(r.parts[r.ask][1]);
    const other = F(r.total).sub(ans);
    const options = makeOptions(ans, [other, F(r.parts[r.ask][1] * r.total).div(r.parts.find((_, i) => i !== r.ask)![1]), ans.add(each)], (v) => v.isInt && v.le(r.total * 2));
    return { boxes, each, ans, fmt: 'frac' as Fmt, partBoxes: r.parts[r.ask][1], whole: F(r.total), part: ans, options };
  }
  const k = 100 / gcd(r.pct, 100);
  const boxes = k <= 10 ? k : 10;
  const p = new Frac(r.pct, 100);
  const fmt = r.fmt ?? 'frac';
  if (r.ask === 'part') {
    const whole = F(r.whole!);
    const ans = whole.mul(p);
    const options = makeOptions(ans, [whole.sub(ans), F(r.pct), ans.mul(2)], (v) => !v.eq(whole));
    return { boxes, each: whole.div(boxes), ans, fmt, partBoxes: p.mul(boxes).value, whole, part: ans, options };
  }
  if (r.ask === 'whole') {
    const part = F(r.part!);
    const ans = part.div(p);
    const options = makeOptions(ans, [part.add(r.pct), part.mul(2), ans.mul(2)], (v) => !v.eq(part));
    return { boxes, each: ans.div(boxes), ans, fmt, partBoxes: p.mul(boxes).value, whole: ans, part, options };
  }
  const whole = F(r.whole!);
  const part = F(r.part!);
  const ans = part.div(whole);
  const options = makeOptions(ans, [part.div(100), whole.sub(part).div(whole), ans.add(new Frac(1, 10))], (v) => v.mul(100).isInt && v.le(2));
  return { boxes, each: whole.div(boxes), ans, fmt: 'pct' as Fmt, partBoxes: ans.mul(boxes).value, whole, part, options };
}

const decoderSay = (pct: number) => {
  const f = new Frac(pct, 100);
  return `Percent decoder! Percent means out of 100. So ${pct}% is ${pct} out of 100. That's ${f}.`;
};
const say = (r: TapeRound) => {
  if (r.kind === 'ratio') {
    const [a, b] = r.parts;
    return `${a[1]} ${a[2]} for every ${b[1]} ${b[2]}. ${r.total} in all. How many ${r.parts[r.ask][2]}?`;
  }
  const fmt = r.fmt ?? 'frac';
  if (r.ask === 'part') return `What is ${r.pct}% of ${fmtText(r.whole!, fmt)}?`;
  if (r.ask === 'whole') return `${fmtText(r.part!, fmt)} is ${r.pct}% of what?`;
  return `What percent of ${fmtText(r.whole!, fmt)} is ${fmtText(r.part!, fmt)}?`;
};

export const tape: Mechanic<TapeRound> = {
  id: 'tape',
  lines: (r) => [{ who: 'narrator', text: say(r) }, ...(r.kind === 'pct' && r.reveal === 'predict' ? [{ who: 'mystery' as const, text: decoderSay(r.pct) }, { who: 'baron' as const, text: 'No peeking! Ha!' }] : [])],

  validate(r) {
    const p = tapePlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (r.kind === 'pct' && 100 / gcd(r.pct, 100) > 10) errs.push(`${r.pct}% can't be split into ≤10 equal boxes`);
    if (r.kind === 'ratio' && p.boxes > 12) errs.push('too many boxes');
    if (!p.each.mul(100).isInt) errs.push('box values should be tidy');
    return errs;
  },

  build(r, arena, kit: Kit) {
    const p = tapePlan(r);
    const { boxes, each, ans, fmt } = p;
    const vf: Fmt = r.kind === 'pct' ? (r.fmt ?? 'frac') : 'frac';
    arena.classList.add('bg-vault');
    const bw = TW / boxes;
    const partW = p.partBoxes * bw;
    const ratioColors = ['#7cff6b', '#9aa6b8', '#ffd23f'];

    // The bar.
    const bar = box('tape-bar', TX, TY, TW, TH);
    const fillPart = h('div', { class: 'tape-part', style: { width: `${partW}px` } });
    bar.append(fillPart);
    if (r.kind === 'ratio') {
      let x = 0;
      r.parts.forEach(([icon, n], i) => {
        bar.append(h('div', { class: 'tape-seg', style: { left: `${x}px`, width: `${n * bw}px`, background: ratioColors[i] } }, h('span', {}, icon)));
        x += n * bw;
      });
      fillPart.remove();
    }
    const dividers = h('div', { class: 'tape-divs hidden' });
    for (let i = 1; i < boxes; i++) dividers.append(h('div', { class: 'tape-div', style: { left: `${i * bw}px` } }));
    bar.append(dividers);
    const labels = box('deck', 0, 0, 0, 0);
    const brackets = box('deck', 0, 0, 0, 0);
    arena.append(bar, labels, brackets);

    // What we know (above) and percents (below).
    const above = (x: number, w: number, content: Node | string, cls = '') =>
      brackets.append(cls === 'low' ? box('tape-brace low', x, TY - 54, w, 48, content) : box('tape-brace', x, TY - 124, w, 58, content));
    if (r.kind === 'ratio') {
      above(TX, TW, mathEl([F(r.total)]));
      let x = TX;
      r.parts.forEach(([, n], i) => {
        if (i === r.ask) above(x, n * bw, h('span', { class: 'q-chip' }, '?'), 'low');
        x += n * bw;
      });
    } else {
      if (r.ask === 'part') {
        above(TX, TW, numEl(p.whole, vf));
        above(TX, partW, h('span', { class: 'q-chip' }, '?'), 'low');
      } else if (r.ask === 'whole') {
        above(TX, TW, h('span', { class: 'q-chip' }, '?'));
        above(TX, partW, numEl(p.part, vf), 'low');
      } else {
        above(TX, TW, numEl(p.whole, vf));
        above(TX, partW, numEl(p.part, vf), 'low');
      }
      const pctLab = r.ask === 'pct' ? h('span', { class: 'q-chip small' }, '?') : `${r.pct}%`;
      arena.append(box('pct-lab', TX - 40, TY + TH + 8, 80, 40, '0%'), box('pct-lab', TX + TW - 40, TY + TH + 8, 80, 40, '100%'), box('pct-lab gold', TX + partW - 40, TY + TH + 8, 80, 40, pctLab));
    }

    let split = r.kind === 'pct' && r.reveal === 'see';
    const showSplit = (values: boolean) => {
      dividers.classList.remove('hidden');
      labels.replaceChildren();
      for (let i = 0; i < boxes; i++) {
        if (r.kind === 'pct') labels.append(box('box-pct', TX + i * bw, TY + TH + 50, bw, 30, `${100 / boxes}%`));
        if (values) labels.append(box('box-val', TX + i * bw, TY + 18, bw, 44, numEl(each, vf)));
      }
    };
    if (split) showSplit(false);

    const cover = r.kind === 'pct' && r.reveal === 'predict' ? box('curtain', TX - 40, TY - 130, TW + 80, TH + 190, h('div', { class: 'curtain-face' }, '🙈'), h('div', { class: 'curtain-text' }, 'NO PEEKING!')) : null;
    if (cover) arena.append(cover);

    const hero = kit.hero(100).place(560, 460);
    const cage = box('cage hidden', 520, 0, 150, 170);
    arena.append(hero.el, cage, box('ground', 0, 460, 1280, 20));

    const askMath: MathPart[] =
      r.kind === 'ratio'
        ? [r.parts[0][1], r.parts[0][0], ':', r.parts[1][1], r.parts[1][0], h('span', { class: 'gap' }), '=', r.total, '→', '?', r.parts[r.ask][0]]
        : r.ask === 'part' ? [`${r.pct}%`, 'of', numEl(p.whole, vf), '=', '?']
        : r.ask === 'whole' ? [`${r.pct}%`, 'of', '?', '=', numEl(p.part, vf)]
        : ['?', 'of', numEl(p.whole, vf), '=', numEl(p.part, vf)];

    return {
      ask: { math: askMath, say: say(r) },
      choices: fracChoices(ans, p.options, fmt),
      power: r.kind === 'pct' ? { item: 'decoder', icon: '🔍', label: 'Percent decoder', use: () => { split = true; showSplit(false); brackets.append(box('decode', TX + TW + 10, TY - 70, 120, 60, mathEl([`${r.pct}%`, '=', new Frac(r.pct, 100)]))); } } : undefined,

      async intro() {
        if (cover) await kit.baron('smug', 'No peeking! Ha!');
      },

      async play(c) {
        hero.clearFx();
        cage.classList.add('hidden');
        arena.querySelectorAll('.cut').forEach((e) => e.remove());
        const v = c.value as Frac;
        // Where the laser cuts: your answer as a share of the bar.
        let share: number;
        if (r.kind === 'ratio') share = v.div(r.total).value;
        else if (r.ask === 'part') share = v.div(p.whole).value;
        else if (r.ask === 'pct') share = v.value;
        else share = p.part.div(v).value; // a bigger whole makes the known part a smaller share
        const cutX = TX + Math.min(1.15, share) * TW;
        const startX = r.kind === 'ratio' ? TX + r.parts.slice(0, r.ask).reduce((a, q) => a + q[1], 0) * bw : TX;
        const cut = box('cut', startX, TY - 6, 0, TH + 12);
        arena.append(cut);
        sfx.zap();
        await anim(cut, [{ width: '0px' }, { width: `${Math.max(4, cutX - startX)}px` }], { duration: 800, easing: 'ease-out' });
        if (v.eq(ans)) {
          sfx.right();
          burst(arena, 'PERFECT CUT!', (startX + cutX) / 2, TY - 100, '#7CFF6B', 52);
          await hero.cheer();
          return;
        }
        const tooBig = r.ask === 'whole' && r.kind === 'pct' ? v.lt(ans) : v.gt(ans);
        if (tooBig) {
          // Took too much: Baron's cage drops.
          cage.classList.remove('hidden');
          sfx.clank();
          await anim(cage, [{ transform: 'translateY(-200px)' }, { transform: 'translateY(285px)' }], { duration: 400, easing: 'ease-in' });
          flash(kit.stage, 'rgba(255,40,60,.35)', 500);
          burst(arena, 'CAUGHT!', 600, 330, '#FF4F8B', 60);
          await shake(cage, 6);
          await wait(400);
          return;
        }
        burst(arena, 'CRUMBS?!', (startX + cutX) / 2, TY - 100, '#FFD23F', 52);
        sfx.wrong();
        hero.say('Is that it?');
        await shake(hero.el, 4);
      },

      hint() {
        // Clue: split the bar into equal boxes and show what each box is worth.
        split = true;
        showSplit(true);
      },

      async after() {
        if (!cover || r.kind !== 'pct') return;
        await anim(cover, [{ transform: 'none' }, { transform: 'translateY(-400px)' }], 450);
        cover.remove();
        const k = boxes;
        const visual = h('div', { class: 'per1-steps' },
          mathEl([`${r.pct}%`, '=', new Frac(r.pct, 100)]),
          h('div', { class: 'decode-bar' }, Array.from({ length: k }, (_, i) => h('div', { class: `db ${i < p.partBoxes ? 'on' : ''}` }, `${100 / k}%`))),
        );
        await revealPanel(arena, kit, { item: 'decoder', title: '🔍 % DECODER!', say: decoderSay(r.pct), visual });
      },
    };
  },
};
