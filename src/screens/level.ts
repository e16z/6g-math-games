// The one screen every level uses:
//   top: home · level name · progress · read-aloud · Baron
//   question bar (read aloud automatically)
//   the scene (picture)
//   three big answer buttons
// Tap an answer → watch what happens. Wrong = funny consequence + a clue.
import { baronSvg, Hero, setBaronMood } from '../art/characters';
import { fracEl, h, mathEl, pick, shuffle } from '../engine/dom';
import { F, Frac, type FracLike } from '../engine/frac';
import { anim, confetti, wait } from '../engine/fx';
import { sfx } from '../engine/sound';
import { store } from '../engine/store';
import type { Ask, Beat, Choice, Kit, Mood, Scene } from '../engine/types';
import { BARON_LOSES, BARON_WINS, SAY } from '../engine/lines';
import { preloadVoices, speak, type VoiceLine } from '../engine/voice';
import { getMechanic } from '../mechanics';
import { getUnit } from '../units';
import { nav } from './nav';
import { beatCard, iconBtn, secretEl, voiceToggle } from './ui';


export function level(el: HTMLElement, p: { unit: number; index: number }) {
  const unit = getUnit(p.unit)!;
  const lvl = unit.levels[p.index];
  let alive = true;

  // Download this level's recorded voices up front.
  preloadVoices([
    ...lvl.intro,
    ...lvl.rounds.flatMap((r) => getMechanic(r.mechanic ?? lvl.mechanic).lines(r)),
    ...[...BARON_WINS, ...BARON_LOSES].map((text): VoiceLine => ({ who: 'baron', text })),
  ]);

  // ── layout ──
  const baron = baronSvg('smug');
  const quip = h('div', { class: 'quip hidden' });
  const dots = h('div', { class: `dots ${lvl.boss ? 'locks' : ''}` }, lvl.rounds.map(() => h('span', { class: 'dot' }, lvl.boss ? '🔒' : '')));
  const top = h('div', { class: 'topbar' },
    iconBtn('🏠', 'Back to map', () => nav.go('map', { unit: unit.num })),
    h('div', { class: 'lvl-name' }, h('span', { class: 'lvl-ico' }, lvl.icon), lvl.name),
    dots,
    voiceToggle(),
    h('div', { class: 'top-baron' }, baron),
    quip,
  );
  const askBar = h('div', { class: 'ask' });
  const arena = h('div', { class: 'arena' });
  const bar = h('div', { class: 'choices' });
  el.append(top, askBar, arena, bar);

  // ── Baron's reactions ──
  let quipTimer = 0;
  let lastQuip: Promise<void> = Promise.resolve();
  function baronSay(mood: Mood, line?: string): Promise<void> {
    setBaronMood(baron, mood);
    void anim(baron, [{ transform: 'scale(1)' }, { transform: 'scale(1.2) rotate(-6deg)' }, { transform: 'scale(1)' }], 350);
    clearTimeout(quipTimer);
    if (line) {
      quip.textContent = line;
      quip.classList.remove('hidden');
    }
    quipTimer = window.setTimeout(() => {
      quip.classList.add('hidden');
      setBaronMood(baron, 'smug');
    }, 1800);
    lastQuip = line ? speak(line, 'baron') : Promise.resolve();
    return lastQuip;
  }

  // ── question bar, with the Flip Trick button once it's unlocked ──
  let flipState: { op: HTMLElement; card: HTMLElement; divisor: Frac; flipped: boolean; busy: boolean } | null = null;
  let current: { ask: Ask; math: HTMLElement } | null = null;

  async function toggleFlip() {
    const f = flipState;
    if (!f || f.busy) return;
    f.busy = true;
    sfx.flip();
    await anim(f.card, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(90deg)' }], 200);
    f.flipped = !f.flipped;
    f.card.replaceChildren(fracEl(f.flipped ? f.divisor.recip() : f.divisor));
    f.op.textContent = f.flipped ? '×' : '÷';
    f.op.classList.toggle('times', f.flipped);
    await anim(f.card, [{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0)' }], 200);
    f.busy = false;
  }

  function renderAsk(a: Ask, power?: Scene['power']) {
    const math = mathEl(a.math, 'ask-math');
    flipState = null;
    let flipBtn: HTMLElement | null = null;
    const i = a.math.indexOf('÷');
    if (i >= 0 && kit.has('flip')) {
      const card = math.children[i + 1] as HTMLElement;
      card.classList.add('flip-card');
      flipState = { op: math.children[i] as HTMLElement, card, divisor: F(a.math[i + 1] as FracLike), flipped: false, busy: false };
      flipBtn = iconBtn('🔄', 'Flip it', () => void toggleFlip(), 'flip-btn');
    }
    let powerBtn: HTMLElement | null = null;
    if (power && kit.has(power.item)) {
      let busy = false;
      powerBtn = iconBtn(power.icon, power.label, async () => {
        if (busy) return;
        busy = true;
        sfx.flip();
        await power.use();
        busy = false;
      }, 'flip-btn');
    }
    askBar.replaceChildren(math, flipBtn ?? '', powerBtn ?? '', iconBtn('🔊', 'Read it again', () => speak(a.say), 'say-btn'));
    current = { ask: a, math };
  }

  function markSolved(c: Choice) {
    if (!current) return;
    const qi = current.ask.math.indexOf('?');
    if (qi >= 0 && (c.solved || c.value instanceof Frac)) {
      const done = c.solved ? c.solved() : fracEl(c.value as Frac, 'solved');
      current.math.children[qi].replaceWith(done);
      void anim(done, [{ transform: 'scale(2)' }, { transform: 'scale(1)' }], 350);
    } else {
      current.math.append(h('span', { class: 'op solved' }, '✓'));
    }
  }

  // ── the kit handed to mechanics ──
  const kit: Kit = {
    hero: (height = 110) => new Hero(store.get().hat, height),
    baron: (mood, line) => baronSay(mood, line),
    has: (item) => store.has(item),
    give: (item) => store.give(item),
    flipAsk: async () => {
      if (flipState && !flipState.flipped) await toggleFlip();
    },
    memo: {},
    stage: el,
    refreshAsk: () => {},
  };

  // ── answering: same for every level ──
  function answer(scene: Scene): Promise<number> {
    return new Promise((resolve) => {
      let mistakes = 0;
      let busy = true;
      const buttons: HTMLButtonElement[] = [];
      const list = scene.fixedOrder ? scene.choices : shuffle(scene.choices);
      bar.classList.toggle('two', list.length === 2);
      for (const c of list) {
        const b = h('button', { class: 'choice' }, c.label) as HTMLButtonElement;
        b.addEventListener('click', async () => {
          if (busy || b.disabled) return;
          busy = true;
          sfx.tap();
          buttons.forEach((x) => x.classList.add('waiting'));
          b.classList.add('picked');
          await scene.play(c);
          if (!alive) return;
          buttons.forEach((x) => x.classList.remove('waiting'));
          b.classList.remove('picked');
          if (c.correct) {
            b.classList.add('right');
            buttons.forEach((x) => x !== b && x.classList.add('fade'));
            markSolved(c);
            sfx.right();
            confetti(arena, 640, 140, 36);
            void baronSay(pick(['shock', 'angry'] as Mood[]), pick(BARON_LOSES));
            if (scene.after) await scene.after(c);
            resolve(mistakes);
            return;
          }
          mistakes++;
          b.classList.add('wrong');
          b.disabled = true;
          sfx.wrong();
          void baronSay('laugh', pick(BARON_WINS));
          await scene.hint?.(c);
          busy = false;
        });
        buttons.push(b);
      }
      bar.replaceChildren(...buttons);
      buttons.forEach((b, i) => void anim(b, [{ transform: 'translateY(200px)' }, { transform: 'none' }], { duration: 350, delay: i * 80, easing: 'cubic-bezier(.3,1.4,.6,1)' }));
      // Let the scene's opening moment play out, then read the question.
      const start = scene.intro ? scene.intro() : Promise.resolve();
      void start.then(() => {
        busy = false;
        if (alive) void speak(scene.ask.say);
      });
    });
  }

  function storyOverlay(beats: Beat[]): Promise<void> {
    return new Promise((resolve) => {
      const ov = h('div', { class: 'overlay' });
      let i = 0;
      const show = () => ov.replaceChildren(beatCard(beats[i], next));
      const next = () => {
        i++;
        if (i < beats.length) return show();
        ov.remove();
        resolve();
      };
      el.append(ov);
      show();
    });
  }

  function finish(mistakes: number) {
    const stars = mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1;
    const firstWin = store.stars(lvl.id) === 0;
    store.setStars(lvl.id, stars);
    const hasNext = p.index + 1 < unit.levels.length;
    const showFinale = lvl.boss && firstWin && unit.finale;
    sfx.fanfare();
    confetti(el, 640, 300, 80);

    const starEls = [1, 2, 3].map((n) => h('span', { class: 'big-star' }, '★'));
    const card = h('div', { class: 'done-card' },
      h('div', { class: 'done-title' }, lvl.boss ? 'VAULT CRACKED!' : 'NICE!'),
      h('div', { class: 'done-stars' }, starEls),
      unit.secret ? h('div', { class: 'done-secret' }, secretEl(unit, p.index)) : null,
      h('div', { class: 'done-btns' },
        iconBtn('🔁', 'Play again', () => nav.go('level', p), 'wide'),
        iconBtn('🗺️', 'Map', () => nav.go('map', { unit: unit.num }), 'wide'),
        showFinale
          ? iconBtn('▶', 'Next', () => nav.go('story', { beats: unit.finale, next: 'map', params: { unit: unit.num } }), 'wide go')
          : hasNext
            ? iconBtn('▶', 'Next level', () => nav.go('level', { unit: unit.num, index: p.index + 1 }), 'wide go')
            : null,
      ),
    );
    el.append(h('div', { class: 'overlay' }, card));
    void anim(card, [{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.3,1.5,.6,1)' });
    starEls.forEach((s, i) =>
      setTimeout(() => {
        if (i < stars) {
          s.classList.add('on');
          sfx.star(i);
        }
      }, 500 + i * 350),
    );
    setTimeout(() => card.querySelector('.tile.pop')?.classList.add('gone'), 1700);
    void speak(SAY.stars[stars - 1]).then(() => {
      if (alive) void baronSay('angry', 'Grrr!');
    });
  }

  async function run() {
    if (lvl.intro.length) await storyOverlay(lvl.intro);
    let mistakes = 0;
    for (let i = 0; i < lvl.rounds.length; i++) {
      if (!alive) return;
      const round = lvl.rounds[i];
      arena.className = 'arena';
      arena.replaceChildren();
      bar.replaceChildren();
      const scene = getMechanic(round.mechanic ?? lvl.mechanic).build(round, arena, kit);
      renderAsk(scene.ask, scene.power);
      kit.refreshAsk = () => renderAsk(scene.ask, scene.power);
      mistakes += await answer(scene);
      if (!alive) return;
      const dot = dots.children[i] as HTMLElement;
      dot.classList.add('on');
      if (lvl.boss) dot.textContent = '🔓';
      await Promise.all([wait(900), lastQuip]);
    }
    if (alive) finish(mistakes);
  }

  void run();
  return () => {
    alive = false;
    clearTimeout(quipTimer);
  };
}
