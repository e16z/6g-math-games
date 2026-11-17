// A real 3D box (any l × w × h) projected to the screen, so kids can spin it.
// Faces are listed in the order wrapping paper covers them.

export type V3 = [number, number, number];
export type FaceKey = 'top' | 'front' | 'right' | 'back' | 'left' | 'bottom';

export interface BoxFace {
  key: FaceKey;
  /** corner, and the two edge vectors from it */
  o: V3;
  u: V3;
  v: V3;
  /** unit squares along u and v */
  nu: number;
  nv: number;
  /** outward normal */
  n: V3;
  color: string;
  area: number;
}

/** Matching faces share a color: top/bottom, front/back, left/right. */
export const PAIR = { top: '#ffd166', front: '#ef8354', side: '#4d96ff' };

export function boxFaces(l: number, w: number, h: number): BoxFace[] {
  const a = l / 2;
  const b = w / 2;
  const c = h / 2;
  return [
    { key: 'top', o: [-a, -b, c], u: [l, 0, 0], v: [0, w, 0], nu: l, nv: w, n: [0, 0, 1], color: PAIR.top, area: l * w },
    { key: 'front', o: [-a, -b, -c], u: [l, 0, 0], v: [0, 0, h], nu: l, nv: h, n: [0, -1, 0], color: PAIR.front, area: l * h },
    { key: 'right', o: [a, -b, -c], u: [0, w, 0], v: [0, 0, h], nu: w, nv: h, n: [1, 0, 0], color: PAIR.side, area: w * h },
    { key: 'back', o: [a, b, -c], u: [-l, 0, 0], v: [0, 0, h], nu: l, nv: h, n: [0, 1, 0], color: PAIR.front, area: l * h },
    { key: 'left', o: [-a, b, -c], u: [0, -w, 0], v: [0, 0, h], nu: w, nv: h, n: [-1, 0, 0], color: PAIR.side, area: w * h },
    { key: 'bottom', o: [-a, b, -c], u: [l, 0, 0], v: [0, -w, 0], nu: l, nv: w, n: [0, 0, -1], color: PAIR.top, area: l * w },
  ];
}

const LIGHT: V3 = (() => {
  const v: V3 = [-0.45, -0.75, 0.5];
  const m = Math.hypot(...v);
  return [v[0] / m, v[1] / m, v[2] / m];
})();

/** Turntable camera: yaw spins around the vertical axis, pitch tilts up/down. */
export class BoxView {
  yaw = 0.6;
  pitch = 0.5;
  readonly sc: number;

  constructor(l: number, w: number, h: number, public cx: number, public cy: number, maxW: number, maxH: number) {
    // Fit for ANY angle, so the box never jumps in size while spinning.
    const R = Math.hypot(l, w) / 2;
    this.sc = Math.min(maxW / (2 * R), maxH / Math.hypot(2 * R, h), 60);
  }

  rot([x, y, z]: V3): V3 {
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    const x1 = x * cy - y * sy;
    const y1 = x * sy + y * cy;
    const cp = Math.cos(this.pitch);
    const sp = Math.sin(this.pitch);
    return [x1, y1 * cp - z * sp, y1 * sp + z * cp];
  }

  /** Screen point; depth < 0 is toward the viewer. */
  proj(p: V3): [number, number] {
    const r = this.rot(p);
    return [this.cx + r[0] * this.sc, this.cy - r[2] * this.sc];
  }

  depth(p: V3): number {
    return this.rot(p)[1];
  }

  visible(f: BoxFace): boolean {
    return this.rot(f.n)[1] < -1e-6;
  }

  /** Simple lighting so turning the box reads as 3D. */
  shade(f: BoxFace, hex: string): string {
    const n = this.rot(f.n);
    const d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    const k = 0.62 + 0.38 * d;
    const c = parseInt(hex.slice(1), 16);
    const ch = (sh: number) => Math.round(((c >> sh) & 255) * k);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
}

/** Point on a face at fractions (s, t) along its two edges. */
export const facePoint = (f: BoxFace, s: number, t: number): V3 => [
  f.o[0] + f.u[0] * s + f.v[0] * t,
  f.o[1] + f.u[1] * s + f.v[1] * t,
  f.o[2] + f.u[2] * s + f.v[2] * t,
];
