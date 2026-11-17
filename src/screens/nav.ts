import { h } from '../engine/dom';
import { hush } from '../engine/voice';

type Cleanup = (() => void) | void;
type Screen = (el: HTMLElement, params?: any) => Cleanup;

const screens: Record<string, Screen> = {};
let root: HTMLElement;
let cleanup: Cleanup;

export const nav = {
  init(stage: HTMLElement) {
    root = stage;
  },
  register(name: string, fn: Screen) {
    screens[name] = fn;
  },
  go(name: string, params?: unknown) {
    if (typeof cleanup === 'function') cleanup();
    hush();
    root.replaceChildren();
    const el = h('div', { class: `screen screen-${name}` });
    root.append(el);
    cleanup = screens[name](el, params);
  },
};

/** Fixed 1280×800 stage, scaled to fit any screen (Chromebook, iPad, laptop). */
export function createStage(host: HTMLElement): HTMLElement {
  const stage = h('div', { class: 'stage' });
  host.append(stage);
  const fit = () => {
    const sc = Math.min(window.innerWidth / 1280, window.innerHeight / 800);
    stage.style.transform = `translate(-50%, -50%) scale(${sc})`;
  };
  window.addEventListener('resize', fit);
  fit();
  return stage;
}
