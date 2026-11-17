// Lessons 2, 3, 5 — "How many groups?" as planks across a goo pit.
// gap ÷ plank = number of planks (sometimes with a sawed-off piece).
import { box, fracEl, h } from '../engine/dom';
import { F, Frac, makeOptions } from '../engine/frac';
import { anim, burst, flash, shake, spray, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { checkOptions, fracChoices } from './common';

interface BridgeRound {
  gap: string;
  plank: string;
  intro?: boolean;
}

const X0 = 170;
const X1 = 1110;
const DECK = 250;

export function bridgePlan(r: BridgeRound) {
  const gap = F(r.gap);
  const plank = F(r.plank);
  const ans = gap.div(plank);
  const cands = [gap.mul(plank)];
  if (!ans.isInt) cands.push(new Frac(ans.floor()));
  cands.push(gap.mul(plank.d), ans.add(2), ans.sub(2), ans.add(1));
  const ok = (v: Frac) => v.mul(plank).le(gap.mul(F('11/5'))) && v.le(18);
  return { gap, plank, ans, options: makeOptions(ans, cands, ok) };
}

const say = (r: BridgeRound) => `The gap is ${F(r.gap)}. Each plank is ${F(r.plank)}. How many planks?`;
const OOPS = 'Oops! No bridge!';

export const bridge: Mechanic<BridgeRound> = {
  id: 'bridge',
  lines: (r) => [{ who: 'narrator', text: say(r) }, ...(r.intro ? [{ who: 'baron' as const, text: OOPS }] : [])],

  validate(r) {
    const p = bridgePlan(r);
    const errs = checkOptions(p.ans, p.options);
    if (p.ans.gt(16)) errs.push('too many planks to draw');
    return errs;
  },

  build(r, arena, kit) {
    const { gap, plank, ans, options } = bridgePlan(r);
    const scale = (X1 - X0) / gap.value;
    const pw = plank.value * scale;
    arena.classList.add('bg-goo');

    // Cliffs, goo, ruler
    const goo = box('goo', X0, 300, X1 - X0, 170);
    for (let i = 0; i < 9; i++) goo.append(h('span', { class: 'goo-bub', style: { left: `${40 + i * 100}px`, animationDelay: `${i * 0.37}s` } }));
    arena.append(goo, box('cliff', 0, DECK, X0, 220), box('cliff', X1, DECK, 1280 - X1, 220));

    const ruler = box('ruler', X0, 200, X1 - X0, 30);
    for (let i = 0; i <= gap.floor(); i++) {
      ruler.append(h('div', { class: 'tick', style: { left: `${i * scale}px` } }), h('div', { class: 'tick-lab', style: { left: `${i * scale}px` } }, String(i)));
    }
    if (!gap.isInt) {
      ruler.append(h('div', { class: 'tick', style: { left: `${X1 - X0}px` } }), h('div', { class: 'tick-lab', style: { left: `${X1 - X0}px` } }, fracEl(gap)));
    }
    arena.append(ruler);

    // "1 plank =" sample sign
    arena.append(box('sign', 210, 40, undefined, undefined, h('div', { class: 'plank', style: { width: `${pw}px`, position: 'relative' } }), fracEl(plank)));

    const goal = box('goal', 1160, 160, 90, 90, '🍩');
    const hero = kit.hero(100).place(50, DECK);
    const deck = box('deck', X0, DECK, X1 - X0, 0);
    const ghosts = box('deck', X0, DECK, X1 - X0, 0);
    arena.append(goal, deck, ghosts, hero.el);

    const pieces = (count: Frac) => {
      const full = count.floor();
      const out: { x: number; w: number; cut?: Frac }[] = [];
      for (let i = 0; i < full; i++) out.push({ x: i * pw, w: pw });
      const rem = count.sub(full);
      if (rem.n > 0) out.push({ x: full * pw, w: rem.value * pw, cut: rem });
      return out;
    };

    function reset() {
      deck.replaceChildren();
      ghosts.replaceChildren();
      hero.clearFx();
      hero.el.style.transform = '';
      hero.el.style.opacity = '1';
      hero.place(50, DECK);
    }

    return {
      ask: { math: [gap, '÷', plank, '=', '?'], say: say(r) },
      choices: fracChoices(ans, options),

      async intro() {
        if (!r.intro) return;
        // The old bridge is still here... for now.
        const ow = (X1 - X0) / 6;
        const old = [0, 1, 2, 3, 4, 5].map((i) => {
          const el = box('plank', i * ow, 0, ow - 3, 24);
          deck.append(el);
          return el;
        });
        await wait(500);
        void kit.baron('laugh', OOPS);
        sfx.clank();
        await wait(600);
        sfx.splash();
        await Promise.all(old.map((el, i) => anim(el, [{ transform: 'none' }, { transform: `translateY(260px) rotate(${i % 2 ? 40 : -35}deg)`, opacity: 0 }], { duration: 700, delay: i * 70, easing: 'ease-in' })));
        spray(arena, 640, 310, ['#7cff6b', '#3ddc84'], 18, 240);
        deck.replaceChildren();
      },

      async play(c) {
        reset();
        const v = c.value as Frac;
        const list = pieces(v);
        const step = Math.min(110, 900 / list.length);
        for (const [i, p] of list.entries()) {
          const el = box(`plank ${p.cut ? 'cut' : ''} ${p.x + p.w > X1 - X0 + 1 ? 'over' : ''}`, p.x, 0, Math.max(6, p.w - 3), 24);
          deck.append(el);
          sfx.click();
          void anim(el, [{ transform: 'translateY(-240px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.3,1.4,.6,1)' });
          await wait(i === list.length - 1 ? 300 : step);
        }
        const total = v.mul(plank);
        const cmp = total.cmp(gap);
        const endX = X0 + total.value * scale;

        if (cmp === 0) {
          await hero.walkTo(1170, 1300);
          sfx.nom();
          goal.textContent = '😋';
          await hero.cheer();
          return;
        }
        if (cmp < 0) {
          // Too short: walk off the end. Sploosh.
          await hero.walkTo(endX - hero.width / 2, Math.max(400, (endX - 50) * 1.2));
          await anim(hero.el, [{ transform: 'none' }, { transform: 'translateY(40px) rotate(25deg)' }], 200);
          await anim(hero.el, [{ transform: 'translateY(40px) rotate(25deg)', opacity: 1 }, { transform: 'translateY(260px) rotate(60deg)', opacity: 0 }], { duration: 450, easing: 'ease-in' });
          sfx.splash();
          burst(arena, 'SPLOOSH!', endX, 330, '#7CFF6B', 72);
          spray(arena, endX, 320, ['#7cff6b', '#3ddc84', '#b6ff9e'], 22, 300);
          await wait(700);
          hero.el.style.transform = '';
          hero.place(50, DECK);
          hero.fx('goo');
          await anim(hero.el, [{ opacity: 0, transform: 'translateY(-120px)' }, { opacity: 1, transform: 'none' }], 400);
          hero.say('Ew!');
          return;
        }
        // Too long: the bridge springs like a diving board. Wheee.
        await hero.walkTo(560, 800);
        sfx.boing();
        await shake(deck, 6, 300);
        sfx.whistleUp();
        burst(arena, 'WHEEE!', 640, 120, '#3EE6FF', 70);
        await anim(hero.el, [{ transform: 'none' }, { transform: 'translate(260px,-520px) rotate(720deg)' }], { duration: 800, easing: 'ease-out' });
        await wait(300);
        hero.el.style.transform = '';
        hero.place(50, DECK);
        sfx.whistleDown();
        await anim(hero.el, [{ transform: 'translateY(-520px)' }, { transform: 'none' }], { duration: 550, easing: 'ease-in' });
        sfx.thud();
        flash(kit.stage, 'rgba(255,255,255,.25)', 250);
        hero.fx('dizzy');
      },

      hint() {
        // Clue: the planks that really fit, as a numbered dashed outline.
        ghosts.replaceChildren();
        for (const [i, p] of pieces(ans).entries()) {
          ghosts.append(box('plank ghost', p.x, 0, Math.max(6, p.w - 3), 24), box('pnum', p.x + p.w / 2, 34, undefined, undefined, p.cut ? fracEl(p.cut) : String(i + 1)));
        }
      },
    };
  },
};
