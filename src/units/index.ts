// All 8 floors of Baron's tower = the 8 units of Grade 6.
// To add a unit: write src/units/unitN.ts (copy unit4.ts) and swap it in below.
import type { UnitDef } from '../engine/types';
import { unit1 } from './unit1';
import { unit2 } from './unit2';
import { unit3 } from './unit3';
import { unit4 } from './unit4';

const soon = (num: number, title: string, icon: string, color: string): UnitDef => ({ num, title, icon, color, levels: [] });

export const UNITS: UnitDef[] = [
  unit1,
  unit2,
  unit3,
  unit4,
  soon(5, 'Decimals', '🔢', '#4361ee'),
  soon(6, 'Equations', '⚖️', '#2ec4b6'),
  soon(7, 'Negative Numbers', '🌡️', '#90be6d'),
  soon(8, 'Data', '📊', '#f9c74f'),
];

export const getUnit = (num: number) => UNITS.find((u) => u.num === num);
export const isReady = (u: UnitDef) => u.levels.length > 0;
