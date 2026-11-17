// Lessons 4, 8 — "How many in ONE group?"
// Part of a jar holds some snacks; how many fill the whole jar?
import { box, fracEl, h } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices } from './common';

interface JarRound {
  part: string;
  amount: number;
  item: string;
}

const JW = 150;
const JH = 290;
const TOP = 120;
const FLOOR = TOP + JH;

export function jarPlan(r: JarRound) {
  const part = F(r.part);
  const amount = F(r.amount);
  const ans = amount.div(part);
  const per = amount.div(part.n); // snacks in each band
  const ok = (v: Frac) => v.isInt && v.le(ans.mul(2));
  const options = makeOptions(ans, [amount, amount.mul(part), ans.add(per), ans.sub(per)], ok);
  return { part, amount, ans, per, bands: part.d, jars: Math.ceil(part.value), options };
}

function jarEl(x: number, bands: number) {
  const body = h('div', { class: 'jar-body' });
  const bandEls: HTMLElement[] = [];
  for (let i = 0; i < bands; i++) {
    const b = h('div', { class: 'band', style: { height: `${(JH - 26) / bands}px` } });
    bandEls.push(b);
    body.append(b);
  }
  const lid = h('div', { class: 'jar-lid' });
  const el = box('jar', x, TOP, JW, JH, lid, body);
  return { el, body, lid, bandEls };
}

function fillBand(band: HTMLElement, n: number, per: number, item: string) {
  const rows = per > 4 ? 2 : 1;
  const cols = Math.ceil(per / rows);
  const bh = parseFloat(band.style.height);
  const size = Math.min(((bh - 6) / rows) * 0.85, ((JW - 18) / cols) * 0.85, 44);
  const items: HTMLElement[] = [];
  for (let i = 0; i < n; i++) {
    const it = h('span', { class: 'item', style: { fontSize: `${size}px`, width: `${(JW - 18) / cols}px` } }, item);
    band.append(it);
    items.push(it);
  }
  return items;
}

const say = (r: JarRound) => `${F(r.part)} of a jar holds ${r.amount}. How many fill the whole jar?`;

export const jar: Mechanic<JarRound> = {
  id: 'jar',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = jarPlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (!p.per.isInt) errs.push(`each band must hold a whole number of snacks (got ${p.per})`);
    if (p.per.gt(8)) errs.push('too many snacks per band to draw');
    if (p.jars > 3) errs.push('too many jars');
    return errs;
  },

  build(r, arena, kit) {
    const { part, ans, per, bands, jars, options } = jarPlan(r);
    const perN = per.value;
    arena.classList.add('bg-pantry');
    arena.append(box('shelf', 40, FLOOR, 1200, 22));

    // Evidence: the partly filled jar(s).
    const evidence = Array.from({ length: jars }, (_, j) => jarEl(70 + j * (JW + 50), bands));
    evidence.forEach((jr, j) =>
      jr.bandEls.forEach((b, k) => {
        if (j * bands + k < part.n) fillBand(b, perN, perN, r.item);
      }),
    );
    const evW = jars * (JW + 50) - 50;
    arena.append(box('jar-tag', 70, 40, evW, 60, fracEl(part)), ...evidence.map((e) => e.el));

    // Target: one whole empty jar.
    const TX = 960;
    arena.append(box('jar-tag', TX, 40, JW, 60, fracEl(1)));
    let target = jarEl(TX, bands);
    arena.append(target.el);
    arena.append(box('arrow', 640, 230, 120, 80, '➜'));

    const hero = kit.hero(100).place(760, FLOOR);
    arena.append(hero.el);

    function fresh() {
      target.el.remove();
      target = jarEl(TX, bands);
      arena.append(target.el);
      arena.querySelectorAll('.overflow, .pile').forEach((e) => e.remove());
      hero.clearFx();
      return target;
    }

    return {
      ask: {
        math: [part, h('span', { class: 'jar-ico' }), '=', F(r.amount), r.item, h('span', { class: 'gap' }), 1, h('span', { class: 'jar-ico' }), '=', '?'],
        say: say(r),
      },
      choices: fracChoices(ans, options),

      async play(c) {
        const t = fresh();
        const g = (c.value as Frac).value;
        let left = g;
        for (const b of t.bandEls) {
          const n = Math.min(perN, left);
          if (n <= 0) break;
          left -= n;
          const items = fillBand(b, n, perN, r.item);
          items.forEach((it, i) => void anim(it, [{ transform: 'translateY(-200px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 250, delay: i * 40 }));
          sfx.tick(t.bandEls.indexOf(b) * 3);
          await wait(160 + n * 40);
        }
        const diff = g - ans.value;

        if (diff === 0) {
          sfx.clank();
          await anim(t.lid, [{ transform: 'translateY(-120px) rotate(-20deg)' }, { transform: 'none' }], { duration: 350, easing: 'cubic-bezier(.3,1.5,.6,1)' });
          burst(arena, 'CLICK!', TX + JW / 2, TOP - 10, '#7CFF6B', 50);
          await hero.cheer();
          return;
        }
        if (diff < 0) {
          // Not full: the lid won't stay on. It lands on the raccoon instead.
          t.bandEls.forEach((b) => b.childElementCount < perN && b.classList.add('short'));
          sfx.wrong();
          await anim(t.lid, [{ transform: 'none' }, { transform: 'translate(-170px,-90px) rotate(-200deg)' }], 450);
          await anim(t.lid, [{ transform: 'translate(-170px,-90px) rotate(-200deg)' }, { transform: `translate(-${TX - hero.x - 20}px,${FLOOR - 100 - TOP - 20}px) rotate(-360deg)` }], { duration: 350, easing: 'ease-in' });
          sfx.thud();
          burst(arena, 'BONK!', hero.x + 34, FLOOR - 120, '#FFD23F', 56);
          hero.fx('dizzy');
          await shake(hero.el, 6);
          return;
        }
        // Too many: snacks pile up over the top and the jar bursts.
        const pile = box('overflow', TX - 10, TOP - 70, JW + 20, 70);
        for (let i = 0; i < Math.min(diff, 14); i++) pile.append(h('span', { class: 'item', style: { fontSize: '30px' } }, r.item));
        arena.append(pile);
        await anim(pile, [{ transform: 'translateY(-100px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 300);
        await shake(t.el, 7, 600);
        sfx.boom();
        burst(arena, 'KRAK!', TX + JW / 2, TOP + 120, '#FF4F8B', 80);
        spray(arena, TX + JW / 2, TOP + 150, [r.item, '💥', r.item], 22, 380, 36);
        t.el.style.opacity = '0';
        pile.remove();
        const buried = box('pile', hero.x - 20, FLOOR - 80, 120, 80, ...Array.from({ length: 9 }, () => h('span', { class: 'item' }, r.item)));
        arena.append(buried);
        await anim(buried, [{ transform: 'translateY(-300px)' }, { transform: 'none' }], { duration: 400, easing: 'ease-in' });
        hero.say('Mmmf!');
        await wait(600);
      },

      hint() {
        fresh();
        arena.querySelectorAll('.band-badge').forEach((e) => e.remove());
        // Clue: how many snacks are in each band (badges sit just right of the jar).
        const bandH = (JH - 26) / bands;
        const badge = (jarBox: HTMLElement, k: number, dashed: boolean) =>
          jarBox.append(box(`band-badge ${dashed ? 'dashed' : ''}`, JW + 8, 26 + (bands - 1 - k) * bandH + bandH / 2 - 17, 34, 34, String(perN)));
        evidence.forEach((e) => e.bandEls.forEach((b, k) => b.childElementCount && badge(e.el, k, false)));
        target.bandEls.forEach((_, k) => badge(target.el, k, true));
      },
    };
  },
};
