// Unit 3, lessons 4–5 — unit rates and speed. Bet on the fastest robot racer.
import { box, h, mathEl } from '../engine/dom';
import { Frac } from '../engine/frac';
import { anim, burst, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import type { Mechanic } from '../engine/types';
import { numEl } from './common';

interface RaceRound {
  /** [icon, distance, time] for each racer. */
  racers: [string, number, number][];
  dist?: string; // distance unit, default "m"
  time?: string; // time unit, default "s"
}

const SAY = 'Which racer is fastest? Bet on the winner!';
const speed = (r: [string, number, number]) => new Frac(r[1], r[2]);

export const race: Mechanic<RaceRound> = {
  id: 'race',
  lines: () => [{ who: 'narrator', text: SAY }],

  validate(r) {
    const s = r.racers.map(speed);
    const best = s.reduce((a, b) => (b.gt(a) ? b : a));
    const errs: string[] = [];
    if (s.filter((x) => x.eq(best)).length > 1) errs.push('two racers tie for fastest');
    if (r.racers.length < 2 || r.racers.length > 3) errs.push('2 or 3 racers');
    return errs;
  },

  build(r, arena, kit) {
    arena.classList.add('bg-track');
    const du = r.dist ?? 'm';
    const tu = r.time ?? 's';
    const s = r.racers.map(speed);
    const best = s.reduce((a, b) => (b.gt(a) ? b : a));
    const n = r.racers.length;
    const laneH = 360 / n;
    const START = 170;
    const FINISH = 1180;
    arena.append(box('finish-line', FINISH, 30, 14, 380));
    const runners = r.racers.map(([icon, d, t], i) => {
      const y = 40 + i * laneH;
      arena.append(
        box('lane-strip', 0, y, 1280, laneH - 8),
        box('lane-card', 10, y + laneH / 2 - 40, 150, 72, mathEl([d, du]), h('div', { class: 'lane-time' }, mathEl([t, tu]))),
      );
      const el = box('racer', START, y + laneH / 2 - 44, 80, 80, icon);
      arena.append(el);
      return el;
    });
    const hints = box('deck', 0, 0, 0, 0);
    arena.append(hints);
    const hero = kit.hero(80).place(1080, 470);
    arena.append(hero.el);

    const label = (i: number) => h('div', { class: 'racer-choice' }, h('span', { class: 'racer-ico' }, r.racers[i][0]), mathEl([r.racers[i][1], du, '/', r.racers[i][2], tu]));

    return {
      ask: { math: ['🏁', '⚡', '?'], say: SAY },
      fixedOrder: true,
      choices: r.racers.map((_, i) => ({ label: label(i), value: i, correct: s[i].eq(best) })),

      async play(c) {
        hero.clearFx();
        const pick = c.value as number;
        runners.forEach((el) => el.classList.remove('picked', 'won'));
        runners[pick].classList.add('picked');
        // Everyone runs for the same time; faster racers go farther.
        const dur = 2400;
        const maxS = best.value;
        sfx.whoosh();
        await Promise.all(
          runners.map((el, i) => anim(el, [{ left: `${START}px` }, { left: `${START + ((FINISH - START - 40) * s[i].value) / maxS}px` }], { duration: dur, easing: 'linear' })),
        );
        const winner = s.findIndex((x) => x.eq(best));
        runners[winner].classList.add('won');
        if (c.correct) {
          sfx.right();
          burst(arena, 'WINNER!', 640, 60, '#7CFF6B', 60);
          await hero.cheer();
        } else {
          sfx.wrong();
          burst(arena, 'YOU LOST THE BET!', 640, 60, '#FF4F8B', 50);
          await anim(runners[pick], [{ transform: 'none' }, { transform: 'rotate(80deg)' }], 300);
          await wait(400);
        }
        await wait(300);
        runners.forEach((el) => {
          el.style.left = `${START}px`;
          el.style.transform = '';
        });
      },

      hint() {
        // Clue: how far does each one go in 1 second?
        hints.replaceChildren();
        r.racers.forEach((_, i) => {
          const y = 40 + i * laneH + laneH / 2 - 26;
          hints.append(box('per-sec', 640, y, 300, 52, mathEl([numEl(s[i], s[i].toDecimal(2) ? 'dec' : 'frac'), du, 'per', 1, tu])));
        });
      },
    };
  },
};
