import { h } from '../engine/dom';
import { preloadVoices } from '../engine/voice';
import type { Beat } from '../engine/types';
import { nav } from './nav';
import { beatCard } from './ui';

interface StoryParams {
  beats: Beat[];
  next: string;
  params?: unknown;
  onDone?: () => void;
}

/** Plays story beats full-screen, then moves on. */
export function story(el: HTMLElement, p: StoryParams) {
  preloadVoices(p.beats);
  let i = 0;
  let stopScene: (() => void) | void;
  const backdrop = h('div', { class: 'story-bg' });
  const front = h('div', { class: 'story-front' });
  el.append(backdrop, front);

  const show = () => {
    const b = p.beats[i];
    if (b.scene || i === 0) {
      if (typeof stopScene === 'function') stopScene();
      backdrop.replaceChildren();
      stopScene = b.scene?.(backdrop);
    }
    front.replaceChildren(beatCard(b, next));
  };
  const next = () => {
    i++;
    if (i < p.beats.length) return show();
    p.onDone?.();
    nav.go(p.next, p.params);
  };
  show();
  return () => {
    if (typeof stopScene === 'function') stopScene();
  };
}
