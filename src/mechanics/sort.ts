// Lesson 1 — Is the quotient more than 1, exactly 1, or less than 1?
// A loot crate drops; the kid sends it down one of three chutes.
import { box, fracEl, h, mathEl } from '../engine/dom';
import { F } from '../engine/frac';
import { anim, burst, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';

interface SortRound {
  a: string;
  b: string;
}
type Bin = 'more' | 'one' | 'less';

export function sortTruth(r: SortRound): Bin {
  const a = F(r.a);
  const b = F(r.b);
  return a.gt(b) ? 'more' : a.eq(b) ? 'one' : 'less';
}

const say = (r: SortRound) => `${r.a} ÷ ${r.b}. Is it more than 1, exactly 1, or less than 1?`;

const CHUTE_X: Record<Bin, number> = { more: 240, one: 640, less: 1040 };

export const sort: Mechanic<SortRound> = {
  id: 'sort',
  lines: (r) => [{ who: 'narrator', text: say(r) }],

  validate(r) {
    try {
      return F(r.b).n > 0 && F(r.a).n > 0 ? [] : ['numbers must be positive'];
    } catch (e) {
      return [String(e)];
    }
  },

  build(r, arena, kit) {
    const a = F(r.a);
    const b = F(r.b);
    const truth = sortTruth(r);
    arena.classList.add('bg-vault');

    const chutes = (['more', 'one', 'less'] as Bin[]).map((bin) =>
      box(`chute chute-${bin}`, CHUTE_X[bin] - 150, 360, 300, 110, h('div', { class: 'chute-mouth' })),
    );
    arena.append(...chutes);

    const hero = kit.hero(100).place(36, 190);
    arena.append(box('ledge', 0, 190, 150, 18), hero.el);

    // The crate, labeled with the division.
    const crate = box('crate', 470, -160, 340, 130, mathEl([a, '÷', b]));
    arena.append(crate);

    // Clue: two bars on the same scale show which number is bigger.
    const max = Math.max(a.value, b.value);
    const bars = box(
      'compare hidden',
      300,
      190,
      680,
      150,
      h('div', { class: 'cmp-row' }, h('div', { class: 'cmp-lab' }, fracEl(a)), h('div', { class: 'cmp-bar top', style: { width: `${(a.value / max) * 520}px` } })),
      h('div', { class: 'cmp-row' }, h('div', { class: 'cmp-lab' }, fracEl(b)), h('div', { class: 'cmp-bar bot', style: { width: `${(b.value / max) * 520}px` } })),
    );
    arena.append(bars);

    async function dropCrate() {
      crate.style.opacity = '1';
      crate.style.transform = '';
      await anim(crate, [{ left: '470px', top: '-160px' }, { left: '470px', top: '30px' }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.6,1)' });
      sfx.thud();
    }

    const label = (sym: string, icon: string, small = false) =>
      h('div', { class: 'sort-choice' }, h('div', { class: 'sort-sym' }, sym), h('div', { class: `sort-icon ${small ? 'small' : ''}` }, icon));

    return {
      ask: { math: [a, '÷', b], say: say(r) },
      fixedOrder: true,
      choices: [
        { label: label('> 1', '🍪🍪🍪'), value: 'more', correct: truth === 'more' },
        { label: label('= 1', '🍪'), value: 'one', correct: truth === 'one' },
        { label: label('< 1', '🍪', true), value: 'less', correct: truth === 'less' },
      ],
      intro: dropCrate,

      async play(c) {
        bars.classList.add('hidden');
        const bin = c.value as Bin;
        const x = CHUTE_X[bin];
        sfx.whoosh();
        await anim(crate, [{ left: '470px', top: '30px' }, { left: `${x - 170}px`, top: '250px', transform: 'scale(.55)' }], 450);
        await anim(crate, [{ transform: 'scale(.55)', opacity: 1 }, { transform: 'scale(.3) translateY(160px)', opacity: 0 }], 250);
        if (c.correct) {
          spray(arena, x, 380, ['🍪', '🍩', '🧁', '🍫'], 12, 300);
          sfx.pop();
          bars.classList.remove('hidden');
          await hero.cheer();
          await wait(700);
          return;
        }
        // Wrong chute: the crate is spat back out and explodes.
        await wait(150);
        sfx.boing();
        await anim(crate, [{ left: `${x - 170}px`, top: '300px', transform: 'scale(.6)', opacity: 1 }, { left: '150px', top: '60px', transform: 'scale(.6) rotate(-200deg)', opacity: 1 }], 500);
        sfx.boom();
        burst(arena, 'KA-BLAM!', 220, 150, '#FF4F8B', 70);
        spray(arena, 240, 130, ['💨', '💥'], 10, 200, 44);
        crate.style.opacity = '0';
        hero.fx('soot');
        await shake(hero.el, 8);
      },

      async hint() {
        bars.classList.remove('hidden');
        await anim(bars, [{ transform: 'scale(.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], 300);
        crate.style.transform = '';
        await dropCrate();
        setTimeout(() => hero.fx('soot', false), 1200);
      },
    };
  },
};
