// Exact fraction arithmetic. Every answer in the game is computed with this,
// never typed in by hand, so content can't drift from the math.

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export type FracLike = Frac | number | string;

export class Frac {
  readonly n: number;
  readonly d: number;

  constructor(n: number, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error(`Frac needs integers: ${n}/${d}`);
    if (d === 0) throw new Error('Frac: zero denominator');
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  static from(x: FracLike): Frac {
    if (x instanceof Frac) return x;
    if (typeof x === 'number') {
      if (Number.isInteger(x)) return new Frac(x);
      const places = (x.toString().split('.')[1] ?? '').length;
      const d = 10 ** places;
      return new Frac(Math.round(x * d), d);
    }
    return parse(x);
  }

  add(o: FracLike): Frac {
    const b = F(o);
    return new Frac(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  sub(o: FracLike): Frac {
    const b = F(o);
    return new Frac(this.n * b.d - b.n * this.d, this.d * b.d);
  }
  mul(o: FracLike): Frac {
    const b = F(o);
    return new Frac(this.n * b.n, this.d * b.d);
  }
  div(o: FracLike): Frac {
    const b = F(o);
    if (b.n === 0) throw new Error('Frac: divide by zero');
    return new Frac(this.n * b.d, this.d * b.n);
  }
  recip(): Frac {
    return new Frac(this.d, this.n);
  }
  cmp(o: FracLike): number {
    const b = F(o);
    return Math.sign(this.n * b.d - b.n * this.d);
  }
  eq(o: FracLike): boolean {
    return this.cmp(o) === 0;
  }
  lt(o: FracLike): boolean {
    return this.cmp(o) < 0;
  }
  gt(o: FracLike): boolean {
    return this.cmp(o) > 0;
  }
  le(o: FracLike): boolean {
    return this.cmp(o) <= 0;
  }
  ge(o: FracLike): boolean {
    return this.cmp(o) >= 0;
  }
  get isInt(): boolean {
    return this.d === 1;
  }
  get value(): number {
    return this.n / this.d;
  }
  floor(): number {
    return Math.floor(this.n / this.d);
  }
  /** Mixed-number parts for a non-negative fraction: 7/3 -> {w:2, n:1, d:3}. */
  mixed(): { w: number; n: number; d: number } {
    const w = Math.floor(Math.abs(this.n) / this.d);
    return { w, n: Math.abs(this.n) - w * this.d, d: this.d };
  }
  /** Exact decimal string ("2.5", "0.125") or null if it never ends (1/3). */
  toDecimal(maxPlaces = 6): string | null {
    for (let k = 0; k <= maxPlaces; k++) {
      const scaled = this.n * 10 ** k;
      if (scaled % this.d !== 0) continue;
      const m = Math.abs(scaled / this.d);
      const digits = String(m).padStart(k + 1, '0');
      const s = k ? `${digits.slice(0, -k)}.${digits.slice(-k)}` : digits;
      return (this.n < 0 ? '-' : '') + s;
    }
    return null;
  }
  toString(): string {
    const { w, n, d } = this.mixed();
    const sign = this.n < 0 ? '-' : '';
    if (n === 0) return `${sign}${w}`;
    return w ? `${sign}${w} ${n}/${d}` : `${sign}${n}/${d}`;
  }
}

function parse(str: string): Frac {
  const t = str.trim();
  let m = t.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) {
    const sign = m[1] ? -1 : 1;
    return new Frac(sign * (+m[2] * +m[4] + +m[3]), +m[4]);
  }
  m = t.match(/^(-?\d+)\/(\d+)$/);
  if (m) return new Frac(+m[1], +m[2]);
  if (/^-?\d+$/.test(t)) return new Frac(+t);
  m = t.match(/^(-?)(\d*)\.(\d+)$/);
  if (m) {
    const d = 10 ** m[3].length;
    return new Frac((m[1] ? -1 : 1) * (Number(m[2] || 0) * d + Number(m[3])), d);
  }
  throw new Error(`Not a fraction: "${str}"`);
}

export function F(x: FracLike): Frac {
  return Frac.from(x);
}

/**
 * Build answer options: the correct value first, then the first valid
 * distractors (in the order given), then generic fallbacks. Deterministic so
 * content tests can check it; the level screen shuffles the display order.
 */
export function makeOptions(
  correct: Frac,
  distractors: Frac[],
  ok: (f: Frac) => boolean = () => true,
  count = 3,
): Frac[] {
  const out: Frac[] = [correct];
  const fallback = [correct.add(1), correct.mul(2), correct.add(2), correct.sub(1), correct.mul(new Frac(1, 2))];
  for (const c of [...distractors, ...fallback]) {
    if (out.length >= count) break;
    if (c.n <= 0 || !ok(c) || out.some((o) => o.eq(c))) continue;
    out.push(c);
  }
  return out;
}
