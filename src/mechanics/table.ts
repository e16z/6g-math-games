// Unit 2 lessons 6, 10–12 · Unit 3 lessons 4–8 — ratio tables and unit rates.
// Halfway trick (Unit 2): 1️⃣ PER-1 — divide down to 1, then multiply up.
import { box, h, mathEl } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, shake, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Kit, Mechanic } from '../engine/types';
import { checkOptions, fmtText, fracChoices, icons, numEl, revealPanel, type Fmt } from './common';

interface TableRound {
  /** Column headers: emoji or short unit ("lb", "$"). */
  cols: string[];
  /** Values as strings ("2.5", "1 1/2"); exactly one "?". */
  rows: string[][];
  /** Number format per column (default fraction). */
  fmt?: Fmt[];
  /** Spoken question. */
  say: string;
  /** 'predict': hide the per-1 idea, then reveal it after a correct answer. */
  kind?: 'predict';
}

const PER1 = 'Per one trick! Divide down to one. Then multiply up to anything.';

export function tablePlan(r: TableRound) {
  const ri = r.rows.findIndex((row) => row.includes('?'));
  const ci = r.rows[ri].indexOf('?');
  const base = r.rows.find((row) => !row.includes('?'))!.map((v) => F(v));
  const row = r.rows[ri];
  const cj = row.findIndex((v, j) => j !== ci && v !== '');
  const known = F(row[cj]);
  const k = known.div(base[cj]);
  const ans = k.mul(base[ci]);
  const fmt = r.fmt?.[ci] ?? 'frac';
  const additive = base[ci].add(known.sub(base[cj]));
  const swapped = known.mul(base[cj]).div(base[ci]);
  const ok = (v: Frac) => (fmt === 'money' ? v.mul(100).isInt : !ans.isInt || v.isInt);
  const options = makeOptions(ans, [additive, swapped, ans.add(base[ci]), ans.sub(base[ci])], ok);
  return { ri, ci, cj, base, known, k, ans, fmt, options };
}

export const table: Mechanic<TableRound> = {
  id: 'table',
  lines: (r) => [{ who: 'narrator', text: r.say }, ...(r.kind === 'predict' ? [{ who: 'mystery' as const, text: PER1 }] : [])],

  validate(r) {
    const errs: string[] = [];
    const qs = r.rows.flat().filter((v) => v === '?').length;
    if (qs !== 1) return [`needs exactly one "?" (has ${qs})`];
    const p = tablePlan(r);
    errs.push(...checkOptions(p.ans, p.options));
    // Every complete row must be a multiple of the first complete row.
    for (const row of r.rows) {
      if (row.includes('?')) continue;
      const vals = row.map((v) => F(v));
      const kk = vals[0].div(p.base[0]);
      if (!vals.every((v, j) => v.eq(p.base[j].mul(kk)))) errs.push(`row ${row.join(':')} isn't an equivalent ratio`);
    }
    return errs;
  },

  build(r, arena, kit: Kit) {
    const { ri, ci, cj, base, ans, fmt, options } = tablePlan(r);
    arena.classList.add('bg-party');
    const fmtOf = (j: number) => r.fmt?.[j] ?? 'frac';

    const grid = h('div', { class: 'rtable', style: { gridTemplateColumns: `repeat(${r.cols.length}, 1fr)` } });
    r.cols.forEach((c) => grid.append(h('div', { class: 'rt-head' }, c)));
    const rowEls: HTMLElement[][] = [];
    r.rows.forEach((row, i) => {
      rowEls.push(row.map((v, j) => {
        const cell = h('div', { class: `rt-cell ${i === ri ? 'asked' : ''}` }, v === '?' ? h('span', { class: 'q-chip' }, '?') : v === '' ? '' : numEl(v, fmtOf(j)));
        grid.append(cell);
        return cell;
      }));
    });
    const tableBox = box('rtable-wrap', 40, 20, 560, 430, grid);
    const notes = box('deck', 0, 0, 0, 0);
    const dump = box('dump', 700, 40, 360, 300);
    const hero = kit.hero(100).place(1120, 455);
    arena.append(tableBox, notes, dump, hero.el, box('ground', 600, 455, 680, 20));

    let per1Row: HTMLElement[] | null = null;
    const showPer1 = () => {
      if (per1Row) {
        per1Row.forEach((e) => e.remove());
        per1Row = null;
        return;
      }
      const unit = base.map((v) => v.div(base[cj]));
      per1Row = unit.map((v, j) => h('div', { class: 'rt-cell per1' }, numEl(v, fmtOf(j))));
      grid.append(...per1Row);
      per1Row.forEach((e) => void anim(e, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)' }, { transform: 'none' }], 350));
    };

    const icon = r.cols[ci];
    const itemIcon = fmt === 'money' ? '💵' : icon.length <= 2 ? icon : '📦';

    return {
      ask: { math: [numEl(r.rows[ri][cj], fmtOf(cj)), ...(fmtOf(cj) === 'money' ? [] : [r.cols[cj]]), '→', '?', ...(fmt === 'money' ? [] : [r.cols[ci]])], say: r.say },
      choices: fracChoices(ans, options, fmt),
      power: { item: 'per1', icon: '1️⃣', label: 'Per-1 row', use: showPer1 },

      async play(c) {
        hero.clearFx();
        dump.replaceChildren();
        const v = c.value as Frac;
        const count = Math.min(30, Math.max(1, Math.round(v.value)));
        dump.append(h('div', { class: 'dump-n' }, numEl(v, fmt)), icons(itemIcon, count, count > 18 ? 26 : 34));
        sfx.whoosh();
        await anim(dump, [{ transform: 'translateY(-300px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.3,1.4,.6,1)' });
        sfx.thud();
        const cmp = v.cmp(ans);
        if (cmp === 0) {
          sfx.right();
          burst(arena, 'PERFECT!', 880, 30, '#7CFF6B', 56);
          await hero.cheer();
          return;
        }
        if (cmp > 0) {
          // Too much: avalanche!
          const pile = box('pile', hero.x - 30, hero.y - 20, 140, 120, icons(itemIcon, 12, 30));
          arena.append(pile);
          sfx.boom();
          burst(arena, 'TOO MUCH!', 1000, 260, '#FF4F8B', 56);
          await anim(pile, [{ transform: 'translateY(-300px)' }, { transform: 'none' }], { duration: 400, easing: 'ease-in' });
          hero.say('Mmmf!');
          await wait(700);
          pile.remove();
          return;
        }
        // Too little: the crowd is not happy.
        burst(arena, 'MORE!', 900, 260, '#FFD23F', 64);
        sfx.wrong();
        for (let i = 0; i < 3; i++) {
          const tomato = box('tomato', 640, 200 + i * 40, 50, 50, '🍅');
          arena.append(tomato);
          void anim(tomato, [{ left: '640px' }, { left: `${hero.x + 10}px`, transform: 'rotate(360deg)' }], { duration: 450, delay: i * 120 }).then(() => tomato.remove());
        }
        await wait(800);
        sfx.splash();
        hero.fx('goo');
        await shake(hero.el, 6);
      },

      hint() {
        // Clue: jump from a full row to our row — same × for every column.
        // Start from the row that gives the friendliest jump (often the 1-row).
        notes.replaceChildren();
        const full = r.rows.map((row, i) => i).filter((i) => !r.rows[i].includes('?'));
        const kOf = (i: number) => F(r.rows[ri][cj]).div(F(r.rows[i][cj]));
        const from = full.find((i) => kOf(i).isInt) ?? full.find((i) => kOf(i).recip().isInt) ?? full[0];
        const kk = kOf(from);
        const op = kk.ge(1) ? ['×', kk] : ['÷', kk.recip()];
        const mid = (i: number) => 20 + rowEls[i][0].offsetTop + rowEls[i][0].offsetHeight / 2;
        const y0 = Math.min(mid(from), mid(ri));
        const y1 = Math.max(mid(from), mid(ri));
        notes.append(box('rt-arrow', 604, y0, 120, Math.max(40, y1 - y0), mathEl(op)));
        if (kit.has('per1') && !per1Row) showPer1();
      },

      async after() {
        if (r.kind !== 'predict') return;
        const unit = base.map((v) => v.div(base[cj]));
        const rowMath = (vals: Frac[]) => mathEl(vals.flatMap((v, j) => (j ? [':', numEl(v, fmtOf(j))] : [numEl(v, fmtOf(j))])));
        const steps = h('div', { class: 'per1-steps' },
          rowMath(base),
          h('div', { class: 'per1-op' }, `÷ ${fmtText(base[cj])}`),
          rowMath(unit),
          h('div', { class: 'per1-op' }, `× ${fmtText(r.rows[ri][cj])}`),
          rowMath(unit.map((v) => v.mul(F(r.rows[ri][cj])))),
        );
        await revealPanel(arena, kit, { item: 'per1', title: '1️⃣ PER-1 TRICK!', say: PER1, visual: steps });
      },
    };
  },
};
