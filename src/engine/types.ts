import type { Frac } from './frac';
import type { MathPart } from './dom';
import type { VoiceLine, Who } from './voicekey';
import type { Hero } from '../art/characters';

export type Mood = 'smug' | 'laugh' | 'shock' | 'angry' | 'dizzy' | 'happy';

/** One panel of story: a character says a short line. */
export interface Beat {
  who: Who;
  text: string;
  mood?: Mood;
  /** Optional animated backdrop. Return a cleanup function if it runs timers. */
  scene?: (el: HTMLElement) => void | (() => void);
  /** Hide the speaker's portrait (when the scene already shows them). */
  hidePortrait?: boolean;
}

/** The question shown above the scene (and read aloud). */
export interface Ask {
  math: MathPart[];
  say: string;
}

export interface Choice {
  label: Node | string;
  value: unknown;
  correct: boolean;
  /** What replaces the "?" when solved (defaults to the value as a fraction). */
  solved?: () => HTMLElement;
}

/**
 * What a mechanic builds for one round. The level screen owns the answer
 * buttons; the scene only draws the picture and plays what happens.
 */
export interface Scene {
  ask: Ask;
  choices: Choice[];
  /** Keep choice order (e.g. "> 1 / = 1 / < 1"); otherwise they're shuffled. */
  fixedOrder?: boolean;
  /** Something happening before the kid answers (a bridge collapses...). */
  intro?(): Promise<void>;
  /** Animate the consequence of a choice, right or wrong. */
  play(c: Choice): Promise<void>;
  /** After a wrong choice: leave a visual clue in the scene. */
  hint?(c: Choice): void | Promise<void>;
  /** After the right choice, before moving on (used for big reveals). */
  after?(c: Choice): Promise<void>;
  /** A power button in the question bar (shown once the kid has unlocked `item`). */
  power?: { item: string; icon: string; label: string; use(): void | Promise<void> };
}

/** Tools the level screen hands to a mechanic. */
export interface Kit {
  hero(height?: number): Hero;
  /** Baron reacts; with a line he also says it (resolves when he's done talking). */
  baron(mood: Mood, line?: string): Promise<void>;
  has(item: string): boolean;
  give(item: string): void;
  /** Flip the divisor in the question bar (the Flip Trick). */
  flipAsk(): Promise<void>;
  /** Scratch space shared by all rounds of one level run. */
  memo: Record<string, unknown>;
  /** The whole stage (for full-screen effects). */
  stage: HTMLElement;
  /** Redraw the question bar (e.g. to show a power button just unlocked). */
  refreshAsk(): void;
}

export interface Mechanic<R = any> {
  id: string;
  build(round: R, arena: HTMLElement, kit: Kit): Scene;
  /** Pure checks used by `npm test` — return a list of problems. */
  validate(round: R): string[];
  /** Everything this round can say out loud, so `npm run voices` can pre-record it. */
  lines(round: R): VoiceLine[];
}

export interface Round {
  /** Use a different mechanic than the level default (boss levels mix them). */
  mechanic?: string;
  [key: string]: unknown;
}

export interface LevelDef {
  id: string;
  name: string;
  icon: string;
  /** Curriculum lessons covered, for teachers. */
  lessons: number[];
  mechanic: string;
  intro: Beat[];
  rounds: Round[];
  boss?: boolean;
}

export interface UnitDef {
  num: number;
  title: string;
  icon: string;
  color: string;
  levels: LevelDef[];
  /** Mystery picture uncovered one tile per finished level. */
  secret?: () => SVGElement;
  /** Story shown the first time the last level is beaten. */
  finale?: Beat[];
}

export type { Frac };
