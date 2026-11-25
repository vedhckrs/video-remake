// Pure motion helpers: every value is a function of the frame number (Remotion's one law).
import {Easing, interpolate, spring} from 'remotion';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** 0->1 progress of an animation that starts at `at` and lasts `dur` frames, eased. */
export const prog = (t: number, at: number, dur: number, ease: (x: number) => number = EASE.out) =>
  ease(clamp01((t - at) / Math.max(1, dur)));

export const EASE = {
  linear: (x: number) => x,
  out: Easing.bezier(0.16, 1, 0.3, 1),       // fast start, soft landing (UI entrances)
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),  // slight overshoot (pops)
};

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Physical spring 0->1 starting at frame `at` (pure: Remotion's spring is deterministic). */
export const springAt = (t: number, at: number, fps: number, cfg = {damping: 14, stiffness: 160, mass: 0.7}) =>
  t < at ? 0 : spring({frame: t - at, fps, config: cfg});

/** Standard UI entrance: blur + rise + fade. Returns style props. */
export const enter = (t: number, at: number, dur = 10, rise = 24, blur = 10) => {
  const p = prog(t, at, dur);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * rise}px)`,
    filter: `blur(${(1 - p) * blur}px)`,
  } as const;
};

/** Pop-in with overshoot (badges, ticks, chips). */
export const pop = (t: number, at: number, fps: number) => {
  const s = springAt(t, at, fps, {damping: 11, stiffness: 220, mass: 0.6});
  return {opacity: clamp01(s * 1.5), transform: `scale(${0.6 + 0.4 * s})`} as const;
};

/** Exit: blur + fade out. */
export const exit = (t: number, at: number, dur = 8, blur = 12) => {
  const p = prog(t, at, dur, EASE.in);
  return {opacity: 1 - p, filter: `blur(${p * blur}px)`} as const;
};

export const map = (t: number, inR: [number, number], outR: [number, number], ease = EASE.inOut) =>
  interpolate(t, inR, outR, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** Rolling counter value with ease-out (count-ups). */
export const countUp = (t: number, at: number, dur: number, from: number, to: number) =>
  lerp(from, to, prog(t, at, dur, Easing.bezier(0.22, 1, 0.36, 1)));

/** Deterministic pseudo-random (seeded) - never Math.random. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
