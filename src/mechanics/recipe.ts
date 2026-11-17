// Unit 2, lessons 1–3 — equivalent ratios as a smoothie recipe.
// Recipe: a 🍓 for every b 🍌. The order has some 🍌 — how many 🍓?
import { box, h } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices, icons, plural, said } from './common';

interface RecipeRound {
  /** Recipe: `a` of icon A for every `b` of icon B. */
  a: [string, number];
  b: [string, number];
  /** How many of B we have; the question is how many of A. */
  have: number;
}

export function recipePlan(r: RecipeRound) {
  const [, a] = r.a;
  const [, b] = r.b;
  const k = new Frac(r.have, b); // batches
  const ans = k.mul(a);
  const additive = F(r.have + (a - b)); // "add the difference" mistake
  const options = makeOptions(ans, [additive, F(r.have * a), new Frac(r.have * b, a), ans.add(a)], (v) => v.le(40));
  return { a, b, k, ans, options };
}

const say = (r: RecipeRound) => `The recipe uses ${said(r.a[1], r.a[0])} for every ${said(r.b[1], r.b[0])}. We have ${said(r.have, r.b[0])}. How many ${plural(r.a[0])} do we need?`;

export const recipe: Mechanic<RecipeRound> = {
  id: 'recipe',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    const p = recipePlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (p.ans.gt(30) || r.have > 30) errs.push('too many items to draw');
    if (!p.ans.mul(2).isInt) errs.push('answer should be whole or a half');
    return errs;
  },

  build(r, arena, kit) {
    const { a, b, k, ans, options } = recipePlan(r);
    const [ia] = r.a;
    const [ib] = r.b;
    arena.classList.add('bg-kitchen');

    // Recipe card
    arena.append(box('recipe-card', 30, 24, 300, 190,
      h('div', { class: 'recipe-title' }, '📜'),
      h('div', { class: 'recipe-row' }, icons(ia, a, 30), h('span', { class: 'recipe-n' }, String(a))),
      h('div', { class: 'recipe-row' }, icons(ib, b, 30), h('span', { class: 'recipe-n' }, String(b))),
    ));
    // The order on the counter: what we have of B, and "?" of A.
    const counter = box('counter', 380, 24, 520, 190,
      h('div', { class: 'recipe-row' }, h('span', { class: 'q-chip' }, '?'), h('span', { class: 'recipe-n' }, ia)),
      h('div', { class: 'recipe-row wrap' }, icons(ib, r.have, 28)),
    );
    arena.append(counter);
    const blender = box('blender', 980, 70, 200, 330, h('div', { class: 'blender-jar' }, h('div', { class: 'blender-fill' })), h('div', { class: 'blender-base' }));
    const fill = blender.querySelector('.blender-fill') as HTMLElement;
    const hero = kit.hero(100).place(820, 460);
    const groups = box('deck', 0, 0, 0, 0);
    arena.append(blender, hero.el, groups, box('ground kitchen-floor', 0, 460, 1280, 20));

    return {
      ask: { math: [F(a), ia, ':', F(b), ib, h('span', { class: 'gap' }), '?', ia, ':', F(r.have), ib], say: say(r) },
      choices: fracChoices(ans, options),

      async play(c) {
        hero.clearFx();
        groups.replaceChildren();
        fill.className = 'blender-fill';
        fill.style.height = '0%';
        const v = c.value as Frac;
        // Drop the chosen amount of A plus the B we have into the blender.
        const drop = box('drop-row', 960, 230, 240, 120, icons(ia, Math.ceil(v.value), 26), icons(ib, r.have, 26));
        arena.append(drop);
        sfx.whoosh();
        await anim(drop, [{ transform: 'translateY(-200px)', opacity: 0 }, { transform: 'none', opacity: 1 }], 400);
        await anim(drop, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.4)' }], 300);
        drop.remove();
        sfx.rattle();
        await shake(blender, 6, 700);
        const cmp = v.cmp(ans);
        fill.classList.add(cmp === 0 ? 'good' : cmp > 0 ? 'too-much' : 'too-little');
        await anim(fill, [{ height: '0%' }, { height: cmp > 0 ? '100%' : '70%' }], 500);
        fill.style.height = cmp > 0 ? '100%' : '70%';
        if (cmp === 0) {
          sfx.nom();
          burst(arena, 'YUM!', 1080, 60, '#7CFF6B', 60);
          await hero.cheer();
          return;
        }
        if (cmp > 0) {
          // Way too much: it erupts.
          sfx.boom();
          burst(arena, 'BLORP!', 1080, 60, '#FF4F8B', 70);
          spray(arena, 1080, 90, ['#ff6b8b', '#ff9fb8', ia], 22, 380, 34);
          hero.fx('goo');
          await shake(hero.el, 8);
          return;
        }
        // Too little: it tastes like nothing.
        await hero.walkTo(900, 400);
        burst(arena, 'BLEH!', hero.x + 40, hero.y - 30, '#B388FF', 60);
        sfx.wrong();
        hero.fx('goo');
        await shake(hero.el, 6);
        await hero.walkTo(820, 400);
      },

      hint() {
        // Clue: split what we have into batches; each batch needs a full recipe.
        groups.replaceChildren();
        const n = Math.ceil(k.value);
        const row = box('batch-row', 30, 236, 920, 200);
        for (let i = 0; i < n; i++) {
          const part = i < k.floor() ? 1 : k.sub(k.floor()).value;
          row.append(h('div', { class: 'batch' },
            h('div', {}, icons(ia, Math.round(a * part), 22)),
            h('div', {}, icons(ib, Math.round(b * part), 22)),
            h('div', { class: 'batch-n' }, part < 1 ? '½' : String(i + 1)),
          ));
        }
        groups.append(row);
      },
    };
  },
};
