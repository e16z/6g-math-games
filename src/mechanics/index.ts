// Every reusable challenge type. New units can reuse these with new numbers,
// or add a new file here and list it below.
import type { Mechanic } from '../engine/types';
import { area } from './area';
import { bridge } from './bridge';
import { crate } from './crate';
import { dnl } from './dnl';
import { flip } from './flip';
import { guards } from './guards';
import { jar } from './jar';
import { multiples } from './multiples';
import { paint } from './paint';
import { race } from './race';
import { ray } from './ray';
import { recipe } from './recipe';
import { scale } from './scale';
import { slicer } from './slicer';
import { sort } from './sort';
import { table } from './table';
import { tape } from './tape';
import { units } from './units';
import { wrap } from './wrap';

const ALL: Mechanic[] = [
  // Unit 1 · area & surface area
  area, wrap,
  // Unit 2 · ratios
  recipe, scale, dnl, multiples, paint, table, tape,
  // Unit 3 · rates & percents
  units, race,
  // Unit 4 · dividing fractions
  sort, bridge, jar, slicer, flip, ray, crate, guards,
];

export const MECHANICS: Record<string, Mechanic> = Object.fromEntries(ALL.map((m) => [m.id, m]));

export function getMechanic(id: string): Mechanic {
  const m = MECHANICS[id];
  if (!m) throw new Error(`Unknown mechanic "${id}"`);
  return m;
}
