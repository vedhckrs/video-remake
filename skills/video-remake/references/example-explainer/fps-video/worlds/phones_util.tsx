// shared maths for the S05-S07 worlds (pure functions only)
import type {Beat} from '../../../src/kit/explainer/world';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const easeIO = (q: number) => {
  const x = clamp01(q);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const outC = (q: number) => 1 - Math.pow(1 - clamp01(q), 3);
export const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const cleanW = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
/** design frame of the n-th beat whose word is `word` (fallback d) */
export const at = (beats: Beat[], word: string, n = 0, d = 9999) => beats.filter((b) => cleanW(b.word || b.w) === word)[n]?.t ?? d;
/** 1 -> 0 exponential flash after frame a */
export const flash = (t: number, a: number, d = 7) => (t >= a ? Math.exp(-(t - a) / d) : 0);
/** eased 0..1 ramp from a over len frames */
export const ramp = (t: number, a: number, len: number) => easeIO((t - a) / len);
/** value following keyframes [frame, value] with an eased move of `len` frames starting at each key */
export const keyed = (t: number, keys: [number, number][], len = 12) => {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) break;
    v = lerp(v, keys[i][1], easeIO((t - keys[i][0]) / len));
  }
  return v;
};
