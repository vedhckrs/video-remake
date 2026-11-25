// Worlds S07 (the caveat: a flash cell wears out) and S08 (the fix: wear levelling).
// S07 "WEAR LAB": one giant glass flash-cell bucket with a gold gate on a hazard plinth, alarm-red.
// S08 "HEAT-MAP TERRAIN": a landscape of cells coloured by wear, with the controller chip hovering as overseer.
// Everything is hand-drawn 2.5D SVG, a pure function of t and the word beats.
import React from 'react';
import type {WorldDef, WorldDrawProps, Beat} from '../../../src/kit/explainer/world';
import {pulseOn, Burst, Ripple} from '../../../src/kit/explainer/world';
import {sp, mix, alpha, shade, tint} from '../../../src/kit/explainer/tokens';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

// ---------------------------------------------------------------------------------------------- shared helpers
type P2 = [number, number];
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (x: number) => {
  const q = clamp01(x);
  return q * q * (3 - 2 * q);
};
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const frac = (x: number) => x - Math.floor(x);
const K = 0.866;
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
/** frame of the n-th beat whose word matches (n from 0); 99999 if missing */
const wt = (beats: Beat[], word: string, n = 0, d = 99999) => beats.filter((b) => clean(b.word || b.w) === word)[n]?.t ?? d;
type Proj = (x: number, y: number, z?: number) => P2;
const mkProj = (ox: number, oy: number, U: number): Proj => (x, y, z = 0) => [ox + (x - y) * K * U, oy + (x + y) * 0.5 * U - z * U];
const pp = (a: P2[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const fTop = (pr: Proj, x0: number, y0: number, x1: number, y1: number, z: number) => pp([pr(x0, y0, z), pr(x1, y0, z), pr(x1, y1, z), pr(x0, y1, z)]);
const fL = (pr: Proj, x0: number, x1: number, y: number, z0: number, z1: number) => pp([pr(x0, y, z1), pr(x1, y, z1), pr(x1, y, z0), pr(x0, y, z0)]);
const fR = (pr: Proj, x: number, y0: number, y1: number, z0: number, z1: number) => pp([pr(x, y1, z1), pr(x, y0, z1), pr(x, y0, z0), pr(x, y1, z0)]);
const mat = (o: P2, a: P2, b: P2, cw: number, ch: number) =>
  `matrix(${((a[0] - o[0]) / cw).toFixed(4)},${((a[1] - o[1]) / cw).toFixed(4)},${((b[0] - o[0]) / ch).toFixed(4)},${((b[1] - o[1]) / ch).toFixed(4)},${o[0].toFixed(1)},${o[1].toFixed(1)})`;
const mTop = (pr: Proj, x0: number, y0: number, x1: number, y1: number, z: number, cw = 100, ch = 100) => mat(pr(x0, y0, z), pr(x1, y0, z), pr(x0, y1, z), cw, ch);
const mL = (pr: Proj, x0: number, x1: number, y: number, z0: number, z1: number, cw = 100, ch = 100) => mat(pr(x0, y, z1), pr(x1, y, z1), pr(x0, y, z0), cw, ch);
const mR = (pr: Proj, x: number, y0: number, y1: number, z0: number, z1: number, cw = 100, ch = 100) => mat(pr(x, y1, z1), pr(x, y0, z1), pr(x, y1, z0), cw, ch);
const bez = (a: P2, c: P2, b: P2, q: number): P2 => [(1 - q) * (1 - q) * a[0] + 2 * (1 - q) * q * c[0] + q * q * b[0], (1 - q) * (1 - q) * a[1] + 2 * (1 - q) * q * c[1] + q * q * b[1]];

const Grad: React.FC<{id: string; c: string; core?: number}> = ({id, c, core = 0.9}) => (
  <radialGradient id={id}><stop offset="0" stopColor={c} stopOpacity={core} /><stop offset="0.45" stopColor={c} stopOpacity={core * 0.32} /><stop offset="1" stopColor={c} stopOpacity={0} /></radialGradient>
);
const Halo: React.FC<{id: string; x: number; y: number; r: number; o?: number; ry?: number}> = ({id, x, y, r, o = 1, ry}) =>
  o <= 0.004 ? null : <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${id})`} opacity={o} />;

// =============================================================================================== S07  WEAR LAB
const A7 = 'w7';
const PR7 = mkProj(1200, 1820, 52);
const ZF = -2.2; // floor level
const CRACKS: {p: number[][]; a: number; b: number; w: number}[] = [
  {p: [[100, 38], [86, 41], [78, 36], [66, 45], [55, 47], [50, 52]], a: 0.02, b: 0.26, w: 2.8},
  {p: [[50, 52], [42, 60], [36, 58], [30, 70], [24, 78], [30, 100]], a: 0.22, b: 0.44, w: 2.6},
  {p: [[66, 45], [62, 30], [68, 20], [64, 10], [70, 0]], a: 0.4, b: 0.6, w: 2.2},
  {p: [[36, 58], [24, 52], [14, 56], [0, 48]], a: 0.5, b: 0.72, w: 2.2},
  {p: [[55, 47], [58, 62], [66, 70], [64, 84], [72, 100]], a: 0.62, b: 0.84, w: 2.4},
  {p: [[42, 60], [46, 72], [40, 82], [44, 90]], a: 0.78, b: 0.94, w: 1.8},
  {p: [[78, 36], [84, 24], [94, 20], [100, 12]], a: 0.84, b: 1, w: 1.8},
  {p: [[62, 30], [50, 26], [44, 16]], a: 0.7, b: 0.9, w: 1.6},
  {p: [[30, 70], [16, 74], [8, 86]], a: 0.86, b: 1, w: 1.6},
];
const LEAKS = [[50, 52], [66, 45], [36, 58], [58, 62], [30, 70], [62, 30], [78, 36], [24, 52], [42, 60], [64, 84]];

const Drum: React.FC<{x: number; y: number; w: number; h: number; pos: number; blur: number; color: string; id: string}> = ({x, y, w, h, pos, blur, color, id}) => {
  const d0 = Math.floor(pos), f = pos - d0;
  const digit = (n: number, off: number, o = 1) => (
    <text key={`${n}-${off}`} x={x + w / 2} y={y + h * 0.5 + h * 0.3 + off} fontFamily={FONT} fontWeight={700} fontSize={h * 0.84} fill={color} textAnchor="middle" opacity={o}>
      {((n % 10) + 10) % 10}
    </text>
  );
  return (
    <g>
      <clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={10} /></clipPath>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="#07080B" />
      <g clipPath={`url(#${id})`}>
        {blur > 0.5 ? (
          <g opacity={0.75}>
            {[-1, 0, 1, 2].map((k) => digit(d0 + k, (k - f) * h * 0.92, 0.42))}
            {[0.2, 0.36, 0.5, 0.64, 0.8].map((q, k) => <rect key={k} x={x + w * q - 5} y={y} width={10} height={h} fill={color} opacity={0.12 + 0.06 * (k % 2)} />)}
          </g>
        ) : (
          <>{digit(d0, -f * h * 0.92)}{digit(d0 + 1, (1 - f) * h * 0.92)}</>
        )}
        <rect x={x} y={y} width={w} height={h} fill={`url(#${A7}-drum)`} />
        <rect x={x} y={y + h * 0.47} width={w} height={2} fill="#000" opacity={0.5} />
      </g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={2} />
    </g>
  );
};

const Draw07: React.FC<WorldDrawProps> = ({t, beats}) => {
  const pr = PR7;
  const tCatch = wt(beats, 'catch'), tEvery = wt(beats, 'every'), tTime = wt(beats, 'time');
  const tEmpt = wt(beats, 'emptied'), tRef = wt(beats, 'refilled'), tWears = wt(beats, 'wears'), tLittle = wt(beats, 'little');
  const tOne = wt(beats, 'one'), tThree = wt(beats, 'three'), tThou = wt(beats, 'thousand'), tRew = wt(beats, 'rewrites');
  const tStarts = wt(beats, 'starts'), tLeak = wt(beats, 'leak'), tGate = wt(beats, 'gate');
  const A = sp(t, tCatch, 'pop'); // alarm amount
  const aFlash = t >= tCatch ? Math.exp(-(t - tCatch) / 7) : 0;
  const beatP = pulseOn(t, beats);
  // ---- fill cycle
  const tCyc = tRef + 10.5, tStop = tStarts - 6;
  const phase = (tt: number) => {
    const tau = Math.max(0, Math.min(tt, tStop + 6) - tCyc), T = 70, f0 = 1 / 13, f1 = 1 / 4.6;
    return tau < T ? f0 * tau + ((f1 - f0) * tau * tau) / (2 * T) : f0 * T + ((f1 - f0) * T) / 2 + f1 * (tau - T);
  };
  const fillAt = (tt: number) => {
    if (tt < tEmpt) return 0.82;
    if (tt < tRef) return lerp(0.82, 0.06, smooth((tt - tEmpt) / 7));
    if (tt < tCyc) return lerp(0.06, 0.86, smooth((tt - tRef) / 7));
    const f = 0.46 + 0.4 * Math.cos(2 * Math.PI * phase(tt));
    return lerp(f, 0.8, smooth((tt - tStop) / 6)) - 0.3 * smooth((tt - tStarts) / 26);
  };
  const fill = fillAt(t);
  const rate = (fill - fillAt(t - 0.5)) * 2;
  const mb = clamp01(Math.abs(rate) * 7);
  const cycling = t >= tCyc && t < tStop + 6;
  const ph = phase(t);
  const gateHit = t >= tRef && t < tStop + 6 ? Math.pow(Math.max(0, rate * 5), 1.2) : 0; // electrons punching through the gate on refill
  // ---- gate wear 0..1
  const g = clamp01(0.28 * sp(t, tWears, 'pop') + 0.16 * sp(t, tLittle, 'pop') + 0.38 * smooth((t - tLittle - 10) / (tThou - tLittle - 10)) + 0.1 * sp(t, tStarts, 'pop') + 0.08 * sp(t, tLeak, 'pop'));
  const leakOn = sp(t, tStarts, 'settle'), leakBig = sp(t, tLeak, 'pop');
  // ---- counter value
  const cyc = (tt: number) => (tt < tRef ? 0 : tt < tCyc ? smooth((tt - tRef - 2) / 6) : 1 + Math.floor(phase(tt)) + smooth((frac(phase(tt)) - 0.72) / 0.28));
  const val = (tt: number) => {
    if (tt < tOne) return cyc(tt);
    if (tt < tThree) return lerp(cyc(tOne), 1000, smooth((tt - tOne) / 6.5));
    return lerp(1000, 3000, smooth((tt - tThree) / 8));
  };
  const v = val(t), vSpeed = Math.abs(v - val(t - 0.25)) * 4;
  const locked = sp(t, tThou + 1.5, 'pop');
  const rewOn = sp(t, tRew, 'pop');

  // colours
  const floorC = mix('#0B1E40', '#3B0A10', A), lineC = mix('#4D8DFF', '#FF4A3D', A);
  const rim = mix('#CFE2FF', '#FFB0A6', A * 0.8);
  const gHi = mix('#FFF3C2', '#B39A70', g * 0.85), gMid = mix('#E8B84E', '#7A5A2E', g * 0.8), gLo = mix('#A9791F', '#46321A', g * 0.75);
  const liqTop = mix('#8FD0FF', '#B9C8FF', 0.2), liq = '#2F7BFF';

  // ---- floor
  const grid: React.ReactNode[] = [];
  for (let k = -30; k <= 30; k += 2) {
    const o = 0.04 + 0.12 * (1 - Math.abs(k) / 30);
    const a1 = pr(k, -30, ZF), b1 = pr(k, 30, ZF), a2 = pr(-30, k, ZF), b2 = pr(30, k, ZF);
    grid.push(<line key={`a${k}`} x1={a1[0]} y1={a1[1]} x2={b1[0]} y2={b1[1]} stroke={lineC} strokeWidth={k % 4 === 0 ? 2.4 : 1.2} opacity={o} />);
    grid.push(<line key={`b${k}`} x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} stroke={lineC} strokeWidth={k % 4 === 0 ? 2.4 : 1.2} opacity={o} />);
  }
  // charge pulses racing along the 4 floor buses (out when emptying, in when refilling)
  const pulses: React.ReactNode[] = [];
  const flowO = clamp01(mb * 1.4 + 0.12);
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy], li) => {
    const s0 = pr(dx * 4.6, dy * 4.6, ZF), s1 = pr(dx * 20, dy * 20, ZF);
    pulses.push(<line key={`l${li}`} x1={s0[0]} y1={s0[1]} x2={s1[0]} y2={s1[1]} stroke={lineC} strokeWidth={7} opacity={0.22 + 0.25 * mb} strokeLinecap="round" />);
    pulses.push(<line key={`m${li}`} x1={s0[0]} y1={s0[1]} x2={s1[0]} y2={s1[1]} stroke="#fff" strokeWidth={1.6} opacity={0.25 + 0.3 * mb} />);
    for (let k = 0; k < 5; k++) {
      const q = frac(k / 5 + (1 - fill) * 1.25 + li * 0.07), d = 4.6 + q * 15.4, p = pr(dx * d, dy * d, ZF);
      pulses.push(<Halo key={`p${li}-${k}`} id={`${A7}-gB`} x={p[0]} y={p[1]} r={34} ry={20} o={flowO * (1 - q * 0.7)} />);
      pulses.push(<ellipse key={`c${li}-${k}`} cx={p[0]} cy={p[1]} rx={7} ry={4} fill="#EAF4FF" opacity={flowO * (1 - q * 0.7)} />);
    }
  });
  // alarm sweep wedges
  const sweep: React.ReactNode[] = [];
  if (A > 0.01) {
    [0, Math.PI].forEach((off, i) => {
      const th = t * 0.17 + off;
      [0.34, 0.14].forEach((wd, k) => {
        const pts: P2[] = [pr(0, 0, ZF)];
        for (let s = -4; s <= 4; s++) pts.push(pr(Math.cos(th + (s / 4) * wd) * 19, Math.sin(th + (s / 4) * wd) * 19, ZF));
        sweep.push(<polygon key={`${i}-${k}`} points={pp(pts)} fill="#FF3B30" opacity={(k ? 0.16 : 0.1) * A} />);
      });
    });
  }
  // ---- neighbour cells ("one of billions")
  const neigh = (a: number, b: number, key: string) => {
    const cx = a * 7.4, cy = b * 7.4, dist = Math.hypot(a, b), o = Math.max(0.14, 0.7 - 0.15 * dist);
    const hh = 4.2, lf = (0.2 + 0.7 * rnd(a * 7.1 + b * 3.3)) * hh, s = 1.45, ls = 1.75;
    const wornN = rnd(a * 3.7 + b * 9.1) * A;
    const lidC = mix('#D9AB45', '#6E4F2A', wornN * 0.7);
    return (
      <g key={key} opacity={o}>
        <polygon points={fTop(pr, cx - s - 0.5, cy - s - 0.5, cx + s + 0.5, cy + s + 0.5, ZF + 0.02)} fill="#000" opacity={0.45} />
        <polygon points={fL(pr, cx - s + 0.2, cx + s - 0.2, cy + s - 0.2, ZF, ZF + lf)} fill={shade(liq, 0.55)} />
        <polygon points={fR(pr, cx + s - 0.2, cy - s + 0.2, cy + s - 0.2, ZF, ZF + lf)} fill={shade(liq, 0.38)} />
        <polygon points={fTop(pr, cx - s + 0.2, cy - s + 0.2, cx + s - 0.2, cy + s - 0.2, ZF + lf)} fill={liqTop} opacity={0.75} />
        <polygon points={fL(pr, cx - s, cx + s, cy + s, ZF, ZF + hh)} fill="rgba(190,215,255,0.10)" stroke={alpha(rim, 0.35)} strokeWidth={1.5} />
        <polygon points={fR(pr, cx + s, cy - s, cy + s, ZF, ZF + hh)} fill="rgba(190,215,255,0.05)" stroke={alpha(rim, 0.3)} strokeWidth={1.5} />
        <polygon points={fL(pr, cx - ls, cx + ls, cy + ls, ZF + hh, ZF + hh + 0.5)} fill={shade(lidC, 0.62)} />
        <polygon points={fR(pr, cx + ls, cy - ls, cy + ls, ZF + hh, ZF + hh + 0.5)} fill={shade(lidC, 0.4)} />
        <polygon points={fTop(pr, cx - ls, cy - ls, cx + ls, cy + ls, ZF + hh + 0.5)} fill={lidC} stroke={tint(lidC, 0.4)} strokeWidth={1.5} />
      </g>
    );
  };
  const back: React.ReactNode[] = [], front: React.ReactNode[] = [];
  for (let s = -6; s <= 6; s++) for (let a = -3; a <= 3; a++) {
    const b = s - a;
    if (b < -3 || b > 3 || (a === 0 && b === 0)) continue;
    if (a >= 0 && b >= 0 && a + b <= 4 && Math.abs(a - b) <= 1) continue; // keep the plinth front and the counter clear
    (s <= 0 ? back : front).push(neigh(a, b, `${a}_${b}`));
  }
  // ---- cycle ring on the floor
  const ringO = sp(t, tEvery, 'pop') * (1 - 0.55 * smooth((t - tGate) / 10));
  const ring: React.ReactNode[] = [];
  if (ringO > 0.01) {
    const rr = 7.6, rot = t * 0.05 + ph * Math.PI * 2 * 0.5 + sp(t, tTime, 'bouncy') * 1.2;
    [0, Math.PI].forEach((off, i) => {
      const pts: P2[] = [];
      for (let k = 0; k <= 26; k++) {
        const th = rot + off + (k / 26) * Math.PI * 0.82;
        pts.push(pr(Math.cos(th) * rr, Math.sin(th) * rr, ZF));
      }
      const thE = rot + off + Math.PI * 0.82;
      const tip = pr(Math.cos(thE + 0.16) * rr, Math.sin(thE + 0.16) * rr, ZF), e1 = pr(Math.cos(thE) * (rr - 0.8), Math.sin(thE) * (rr - 0.8), ZF), e2 = pr(Math.cos(thE) * (rr + 0.8), Math.sin(thE) * (rr + 0.8), ZF);
      ring.push(<polyline key={`g${i}`} points={pp(pts)} fill="none" stroke={lineC} strokeWidth={22} opacity={0.22 * ringO} strokeLinecap="round" />);
      ring.push(<polyline key={`r${i}`} points={pp(pts)} fill="none" stroke={mix('#BFE0FF', '#FFD2CC', A)} strokeWidth={6} opacity={0.95 * ringO} strokeLinecap="round" />);
      ring.push(<polygon key={`t${i}`} points={pp([tip, e1, e2])} fill={mix('#BFE0FF', '#FFD2CC', A)} opacity={ringO} />);
    });
  }
  // ---- bucket internals
  const B = 3, HH = 9, LZ = 0.15 + Math.max(0.02, fill) * 8.55;
  const ghosts = [1, 2, 3].map((k) => 0.15 + Math.max(0.02, fillAt(t - k * 0.45)) * 8.55);
  const zMax = Math.max(LZ, ...ghosts);
  const electrons: React.ReactNode[] = [];
  const NE = 26, leaked = Math.floor(clamp01((t - tStarts) / 28) * 12);
  for (let i = 0; i < NE; i++) {
    if ((i + 0.5) / NE > fill * 1.22 || i < leaked) continue;
    const ex = (rnd(i * 12.7 + 3) - 0.5) * 4.7, ey = (rnd(i * 45.1 + 9) - 0.5) * 4.7;
    const ez = 0.5 + rnd(i * 91.3 + 5) * Math.max(0.3, LZ - 1) + Math.sin(t * 0.2 + i) * 0.14;
    const p = pr(ex + Math.sin(t * 0.11 + i * 2) * 0.12, ey, ez), r = 13 + 5 * rnd(i * 2.2);
    electrons.push(<Halo key={`h${i}`} id={`${A7}-gB`} x={p[0]} y={p[1]} r={r * 3.2} o={0.85} />);
    electrons.push(<circle key={`e${i}`} cx={p[0]} cy={p[1]} r={r} fill={`url(#${A7}-el)`} />);
    if (mb > 0.25) electrons.push(<line key={`s${i}`} x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] + rate * 260} stroke="#CFE6FF" strokeWidth={r * 1.2} strokeLinecap="round" opacity={0.3 * mb} />);
  }
  const streaks: React.ReactNode[] = [];
  if (mb > 0.12) for (let i = 0; i < 14; i++) {
    const sx = (rnd(i * 4.4 + 9) - 0.5) * 5, sy = (rnd(i * 6.1 + 4) - 0.5) * 5;
    const z0 = Math.min(LZ, ghosts[2]) - 0.6 * rnd(i), z1 = Math.max(LZ, ghosts[2]) + 0.8 * rnd(i * 3);
    const a = pr(sx, sy, Math.max(0.2, z0)), b = pr(sx, sy, Math.min(8.8, z1));
    streaks.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#D6EAFF" strokeWidth={3 + 4 * rnd(i * 8)} strokeLinecap="round" opacity={0.45 * mb * (0.4 + 0.6 * rnd(i * 2))} />);
  }
  // electrons hammering in through the gate on each refill
  const inflow: React.ReactNode[] = [];
  if (gateHit > 0.05) for (let i = 0; i < 9; i++) {
    const sx = (rnd(i * 2.9 + 5) - 0.5) * 4.6, sy = (rnd(i * 7.7 + 1) - 0.5) * 4.6, q = frac(t * 0.33 + rnd(i * 1.7));
    const a = pr(sx, sy, 13.2 - q * 3.4), b = pr(sx, sy, 14.4 - q * 3.4);
    inflow.push(<line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#BFE0FF" strokeWidth={7} strokeLinecap="round" opacity={clamp01(gateHit) * 0.8 * (1 - q * 0.3)} />);
    inflow.push(<circle key={`c${i}`} cx={a[0]} cy={a[1]} r={7} fill="#fff" opacity={clamp01(gateHit) * 0.9} />);
  }
  // ---- gate lid top-face art
  const LS = 3.5, LZ0 = HH, LZ1 = HH + 0.95;
  const topPt = (u: number, vv: number): P2 => pr(-LS + (2 * LS * u) / 100, -LS + (2 * LS * vv) / 100, LZ1);
  const glowK = clamp01(0.25 + 0.2 * gateHit + 0.9 * leakOn) * (0.8 + 0.2 * Math.sin(t * 0.8));
  const crackEls = CRACKS.map((c, i) => {
    const p = clamp01((g - c.a) / (c.b - c.a));
    if (p <= 0) return null;
    const d = 'M' + c.p.map((q) => q.join(',')).join(' L');
    const common = {d, fill: 'none', pathLength: 1, strokeDasharray: `${p} 1`, strokeLinejoin: 'bevel' as const};
    return (
      <g key={i}>
        <path {...common} stroke="#FF3B1E" strokeWidth={c.w * 3.4} opacity={0.4 * glowK} />
        <path {...common} stroke="#170803" strokeWidth={c.w} />
        <path {...common} stroke="#FFB199" strokeWidth={c.w * 0.3} opacity={glowK} />
      </g>
    );
  });
  // ---- leaking electrons
  const leaks: React.ReactNode[] = [];
  if (t >= tStarts) for (let i = 0; i < 34; i++) {
    const st = i < 9 ? tStarts + i * 1.25 : tLeak + (i - 9) * 0.5;
    const q = (t - st) / (i < 9 ? 30 : 22);
    if (q <= 0 || q >= 1) continue;
    const src = LEAKS[i % LEAKS.length], o = topPt(src[0], src[1]);
    const dir = (rnd(i * 3.3 + 7) - 0.5) * 2;
    const x = o[0] + dir * 300 * q + Math.sin(q * 7 + i) * 18, y = o[1] - Math.pow(q, 0.8) * (360 + 240 * rnd(i * 5.1));
    const op = Math.min(1, q * 9) * (1 - q * q), r = 13 - 3 * q;
    leaks.push(<line key={`t${i}`} x1={x} y1={y} x2={lerp(x, o[0], 0.25)} y2={lerp(y, o[1], 0.25)} stroke="#FF5A4A" strokeWidth={5} strokeLinecap="round" opacity={0.35 * op} />);
    leaks.push(<Halo key={`h${i}`} id={`${A7}-gR`} x={x} y={y} r={r * 4.2} o={op} />);
    leaks.push(<circle key={`e${i}`} cx={x} cy={y} r={r} fill={mix('#EAF4FF', '#FFD0C6', clamp01(q * 2.5))} opacity={op} />);
  }
  // ---- warning sign
  const signIn = sp(t, tCatch, 'bouncy'), signOut = 1 - smooth((t - tTime) / 8);
  const SX = 1200, SY = 900;
  // ---- counter module
  const MX = 900, MY = 2262, MW = 600, MH = 216;
  const digC = mix('#F3F6FB', '#FF6A5A', locked);
  const place = (p: number) => {
    const base = Math.pow(10, p), q = v / base, whole = Math.floor(q), fr = q - whole;
    const fast = clamp01(vSpeed / (0.3 * base));
    return {pos: whole + (p === 0 ? fr : lerp(clamp01(fr * base - (base - 1)), Math.pow(fr, 3), fast)), blur: vSpeed / base};
  };
  const dx = [961, 1103, 1219, 1335];
  const hitShake = cycling ? Math.sin(ph * Math.PI * 2) * 2.5 * clamp01(mb) : 0;
  const lidCrackL = clamp01((g - 0.42) / 0.1), lidCrackR = clamp01((g - 0.04) / 0.1);

  return (
    <svg width={2400} height={3000} style={{overflow: 'visible'}}>
      <defs>
        <Grad id={`${A7}-gB`} c="#58A6FF" /><Grad id={`${A7}-gR`} c="#FF3B30" /><Grad id={`${A7}-gW`} c="#FFFFFF" /><Grad id={`${A7}-gG`} c="#FFC861" />
        <radialGradient id={`${A7}-el`} cx="38%" cy="34%" r="70%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.5" stopColor="#BFE0FF" /><stop offset="1" stopColor="#3B8CFF" /></radialGradient>
        <radialGradient id={`${A7}-floor`} gradientUnits="userSpaceOnUse" cx={1200} cy={1960} r={1250}>
          <stop offset="0" stopColor={tint(floorC, 0.12)} /><stop offset="0.35" stopColor={floorC} /><stop offset="1" stopColor={shade(floorC, 0.18)} />
        </radialGradient>
        <linearGradient id={`${A7}-lidT`} gradientUnits="userSpaceOnUse" x1={880} y1={1300} x2={1520} y2={1340}>
          <stop offset="0" stopColor={gHi} /><stop offset="0.42" stopColor={gMid} /><stop offset="0.6" stopColor={tint(gMid, 0.22 * (1 - g))} /><stop offset="1" stopColor={gLo} />
        </linearGradient>
        <linearGradient id={`${A7}-lidL`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={shade(gMid, 0.95)} /><stop offset="1" stopColor={shade(gLo, 0.8)} /></linearGradient>
        <linearGradient id={`${A7}-lidR`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={shade(gLo, 0.7)} /><stop offset="1" stopColor={shade(gLo, 0.42)} /></linearGradient>
        <linearGradient id={`${A7}-glL`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#DCEAFF" stopOpacity={0.3} /><stop offset="0.3" stopColor="#BCD4FF" stopOpacity={0.07} /><stop offset="1" stopColor="#DCEAFF" stopOpacity={0.16} /></linearGradient>
        <linearGradient id={`${A7}-glR`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#BCD4FF" stopOpacity={0.12} /><stop offset="0.6" stopColor="#9DB9F0" stopOpacity={0.04} /><stop offset="1" stopColor={mix('#DCEAFF', '#FF6A5A', A)} stopOpacity={0.24} /></linearGradient>
        <linearGradient id={`${A7}-liqL`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5BA8FF" stopOpacity={0.95} /><stop offset="1" stopColor="#123E9C" stopOpacity={0.92} /></linearGradient>
        <linearGradient id={`${A7}-liqR`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A82F0" stopOpacity={0.95} /><stop offset="1" stopColor="#0B2A70" stopOpacity={0.92} /></linearGradient>
        <linearGradient id={`${A7}-plT`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4A5262" /><stop offset="1" stopColor="#1C2029" /></linearGradient>
        <linearGradient id={`${A7}-plL`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A4150" /><stop offset="1" stopColor="#161920" /></linearGradient>
        <linearGradient id={`${A7}-plR`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#252A35" /><stop offset="1" stopColor="#0C0E13" /></linearGradient>
        <linearGradient id={`${A7}-drum`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0.88} /><stop offset="0.3" stopColor="#000" stopOpacity={0} /><stop offset="0.7" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.88} /></linearGradient>
        <linearGradient id={`${A7}-mod`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A404D" /><stop offset="0.12" stopColor="#262A34" /><stop offset="1" stopColor="#0E1015" /></linearGradient>
        <linearGradient id={`${A7}-inj`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2A2F3A" /><stop offset="0.3" stopColor="#6B7486" /><stop offset="0.55" stopColor="#3A404D" /><stop offset="1" stopColor="#101218" /></linearGradient>
        <clipPath id={`${A7}-hz`}><rect x={0} y={62} width={100} height={26} /></clipPath>
      </defs>

      {/* calm blue cover before "catch", then the alarm */}
      <rect x={-5000} y={-5000} width={12400} height={13000} fill="#04122B" opacity={(1 - A) * 0.9} />
      <rect x={-5000} y={-5000} width={12400} height={13000} fill="#FF2A1E" opacity={0.28 * aFlash} />

      {/* floor */}
      <polygon points={fTop(pr, -44, -44, 44, 44, ZF)} fill={`url(#${A7}-floor)`} />
      {grid}
      {sweep}
      <Halo id={A > 0.5 ? `${A7}-gR` : `${A7}-gB`} x={1200} y={1950} r={900} ry={520} o={0.3 + 0.12 * beatP} />
      {pulses}
      {back}
      {ring}

      {/* plinth */}
      <polygon points={fTop(pr, -5.6, -5.6, 5.6, 5.6, ZF + 0.01)} fill="#000" opacity={0.55} />
      <polygon points={fL(pr, -4.6, 4.6, 4.6, ZF, 0)} fill={`url(#${A7}-plL)`} />
      <polygon points={fR(pr, 4.6, -4.6, 4.6, ZF, 0)} fill={`url(#${A7}-plR)`} />
      <g transform={mL(pr, -4.6, 4.6, 4.6, ZF, 0)}>
        <rect x={3} y={8} width={94} height={40} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.6} />
        {Array.from({length: 14}).map((_, i) => <rect key={i} x={7 + i * 6.4} y={16} width={3.4} height={24} rx={1.2} fill="#07080B" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />)}
        <g clipPath={`url(#${A7}-hz)`} opacity={0.2 + 0.8 * A}>
          <rect x={0} y={62} width={100} height={26} fill="#16181D" />
          {Array.from({length: 13}).map((_, i) => <polygon key={i} points={`${i * 9 - 6},88 ${i * 9 + 4},62 ${i * 9 + 8.5},62 ${i * 9 - 1.5},88`} fill={mix('#3B8CFF', '#FFC233', A)} />)}
        </g>
        <rect x={0} y={0} width={100} height={3} fill="#fff" opacity={0.22} />
      </g>
      <g transform={mR(pr, 4.6, -4.6, 4.6, ZF, 0)}>
        <rect x={6} y={14} width={88} height={10} rx={5} fill={mix('#3B8CFF', '#FF3B30', A)} opacity={0.55 + 0.45 * Math.max(beatP, mb)} />
        <rect x={6} y={14} width={88} height={10} rx={5} fill="none" stroke="#fff" strokeWidth={0.5} opacity={0.4} />
        {Array.from({length: 6}).map((_, i) => <rect key={i} x={8 + i * 15} y={40} width={10} height={44} rx={2} fill="#090A0D" stroke="rgba(255,255,255,0.08)" strokeWidth={0.4} />)}
        <rect x={0} y={0} width={100} height={3} fill="#fff" opacity={0.12} />
      </g>
      <polygon points={fTop(pr, -4.6, -4.6, 4.6, 4.6, 0)} fill={`url(#${A7}-plT)`} stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
      <polygon points={fTop(pr, -3.6, -3.6, 3.6, 3.6, 0)} fill="none" stroke={lineC} strokeWidth={5} opacity={0.5 + 0.5 * mb} />
      <Halo id={`${A7}-gB`} x={1200} y={1820} r={420} ry={240} o={0.35 + 0.5 * fill} />

      {/* bucket: back walls, floor, charge, electrons, glass */}
      <g transform={`translate(${hitShake.toFixed(2)},0)`}>
        <polygon points={fTop(pr, -B, -B, B, B, 0.02)} fill="#060B16" stroke={alpha(rim, 0.3)} strokeWidth={2} />
        <polygon points={pp([pr(-B, -B, 0), pr(-B, B, 0), pr(-B, B, HH), pr(-B, -B, HH)])} fill="rgba(120,160,230,0.07)" stroke={alpha(rim, 0.22)} strokeWidth={2} />
        <polygon points={pp([pr(-B, -B, 0), pr(B, -B, 0), pr(B, -B, HH), pr(-B, -B, HH)])} fill="rgba(120,160,230,0.045)" stroke={alpha(rim, 0.22)} strokeWidth={2} />
        {/* charge volume with a motion-blurred surface */}
        <polygon points={fL(pr, -2.75, 2.75, 2.75, 0.12, zMax)} fill={`url(#${A7}-liqL)`} opacity={0.35 + 0.5 * (1 - mb * 0.6)} />
        <polygon points={fR(pr, 2.75, -2.75, 2.75, 0.12, zMax)} fill={`url(#${A7}-liqR)`} opacity={0.35 + 0.5 * (1 - mb * 0.6)} />
        {ghosts.map((z, k) => <polygon key={k} points={fTop(pr, -2.75, -2.75, 2.75, 2.75, z)} fill={liqTop} opacity={mb * (0.34 - k * 0.09)} />)}
        <polygon points={fTop(pr, -2.75, -2.75, 2.75, 2.75, LZ)} fill={liqTop} opacity={0.82} stroke="#fff" strokeWidth={2.5} strokeOpacity={0.75} />
        <Halo id={`${A7}-gW`} x={pr(0, 0, LZ)[0]} y={pr(0, 0, LZ)[1]} r={210} ry={110} o={0.3 + 0.4 * mb} />
        {streaks}
        {electrons}
        {/* glass front */}
        <polygon points={fL(pr, -B, B, B, 0, HH)} fill={`url(#${A7}-glL)`} />
        <polygon points={fR(pr, B, -B, B, 0, HH)} fill={`url(#${A7}-glR)`} />
        <g transform={mL(pr, -B, B, B, 0, HH, 100, 150)}>
          <rect x={7} y={4} width={9} height={142} fill="#fff" opacity={0.17} />
          <rect x={19} y={4} width={2.2} height={142} fill="#fff" opacity={0.2} />
          {Array.from({length: 9}).map((_, k) => <rect key={k} x={78} y={150 - (k + 1) * 14.2} width={k % 2 ? 9 : 15} height={1.3} fill="#EAF2FF" opacity={0.6} />)}
        </g>
        <g transform={mR(pr, B, -B, B, 0, HH, 100, 150)}>
          <rect x={80} y={4} width={6} height={142} fill={mix('#FFFFFF', '#FF7A6A', A)} opacity={0.16 + 0.1 * A} />
          <polygon points="8,150 30,150 62,0 40,0" fill="#fff" opacity={0.045} />
        </g>
        {[[-B, B], [B, B], [B, -B]].map(([x, y], i) => {
          const a = pr(x, y, 0), b = pr(x, y, HH);
          return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={i === 1 ? '#FFFFFF' : rim} strokeWidth={i === 1 ? 4.5 : 3} opacity={i === 1 ? 0.9 : 0.6} strokeLinecap="round" />;
        })}
        <polyline points={pp([pr(-B, B, 0), pr(B, B, 0), pr(B, -B, 0)])} fill="none" stroke={rim} strokeWidth={3} opacity={0.6} />
        {inflow}

        {/* the gold gate */}
        <polygon points={fTop(pr, -LS, -LS, LS, LS, LZ0 - 0.12)} fill="#000" opacity={0.45} />
        <polygon points={fL(pr, -LS, LS, LS, LZ0, LZ1)} fill={`url(#${A7}-lidL)`} />
        <polygon points={fR(pr, LS, -LS, LS, LZ0, LZ1)} fill={`url(#${A7}-lidR)`} />
        <g transform={mL(pr, -LS, LS, LS, LZ0, LZ1, 100, 14)}>
          <rect x={0} y={0} width={100} height={1.6} fill="#fff" opacity={0.5 * (1 - g * 0.6)} />
          <rect x={0} y={9} width={100} height={5} fill="#000" opacity={0.22} />
          {lidCrackL > 0 ? <path d="M30,0 L28,5 L32,9 L30,14" fill="none" stroke="#170803" strokeWidth={1.3} pathLength={1} strokeDasharray={`${lidCrackL} 1`} /> : null}
          {g > 0.66 ? <path d="M72,0 L74,6 L71,14" fill="none" stroke="#170803" strokeWidth={1.2} /> : null}
        </g>
        <g transform={mR(pr, LS, -LS, LS, LZ0, LZ1, 100, 14)}>
          <rect x={0} y={0} width={100} height={1.4} fill="#fff" opacity={0.3 * (1 - g * 0.6)} />
          {lidCrackR > 0 ? <path d="M62,0 L64,5 L60,9 L62,14" fill="none" stroke="#120602" strokeWidth={1.4} pathLength={1} strokeDasharray={`${lidCrackR} 1`} /> : null}
        </g>
        <polygon points={fTop(pr, -LS, -LS, LS, LS, LZ1)} fill={`url(#${A7}-lidT)`} />
        <g transform={mTop(pr, -LS, -LS, LS, LS, LZ1)}>
          {Array.from({length: 11}).map((_, i) => <line key={i} x1={4} x2={96} y1={8 + i * 8.4} y2={8 + i * 8.4} stroke="#fff" strokeWidth={0.5} opacity={0.1} />)}
          <polygon points="0,58 0,82 82,0 58,0" fill="#fff" opacity={0.3 * (1 - g * 0.75)} />
          <polygon points="0,90 0,95 95,0 90,0" fill="#fff" opacity={0.22 * (1 - g * 0.75)} />
          <rect x={5} y={5} width={90} height={90} fill="none" stroke={tint(gHi, 0.3)} strokeWidth={0.9} opacity={0.6} />
          <rect x={7} y={7} width={86} height={86} fill="none" stroke={shade(gLo, 0.7)} strokeWidth={0.6} opacity={0.6} />
          <circle cx={50} cy={50} r={15} fill={shade(gMid, 0.82)} stroke={tint(gHi, 0.2)} strokeWidth={0.8} />
          <circle cx={50} cy={50} r={10} fill={gMid} stroke={shade(gLo, 0.7)} strokeWidth={0.6} />
          {[[14, 14], [86, 14], [14, 86], [86, 86]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={shade(gLo, 0.75)} stroke={gHi} strokeWidth={0.5} />)}
          {/* tarnish */}
          {Array.from({length: 9}).map((_, i) => (
            <ellipse key={i} cx={10 + rnd(i * 3.1) * 80} cy={10 + rnd(i * 7.7) * 80} rx={8 + rnd(i * 2.3) * 14} ry={6 + rnd(i * 5.9) * 10}
                     fill={i % 3 === 0 ? '#3D4A2E' : '#2A1A0C'} opacity={clamp01((g - i * 0.07) * 1.3) * (0.3 + 0.3 * rnd(i))} />
          ))}
          <rect x={0} y={0} width={100} height={100} fill="#fff" opacity={clamp01(gateHit) * 0.4} />
          {crackEls}
        </g>
        <polyline points={pp([pr(-LS, LS, LZ1), pr(LS, LS, LZ1), pr(LS, -LS, LZ1)])} fill="none" stroke="#FFF6D6" strokeWidth={3} opacity={0.8 * (1 - g * 0.6)} />
        <Halo id={`${A7}-gG`} x={1200} y={pr(0, 0, LZ1)[1]} r={380} ry={210} o={0.28 * (1 - g) + 0.35 * clamp01(gateHit)} />
        {t >= tWears && t < tWears + 24 ? <Burst t={t} at={tWears} x={topPt(78, 36)[0]} y={topPt(78, 36)[1]} color="#FFD27A" n={14} r={150} /> : null}
        {t >= tLittle && t < tLittle + 24 ? <Burst t={t} at={tLittle} x={topPt(36, 58)[0]} y={topPt(36, 58)[1]} color="#FFD27A" n={12} r={130} /> : null}
      </g>

      {/* program-voltage injector hanging over the gate */}
      <g>
        <rect x={1140} y={-900} width={120} height={1770} fill={`url(#${A7}-inj)`} />
        {[-300, 60, 420, 700].map((y, i) => <rect key={i} x={1128} y={y} width={144} height={34} rx={8} fill={`url(#${A7}-inj)`} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />)}
        <rect x={1150} y={-900} width={10} height={1770} fill="#fff" opacity={0.16} />
        <polygon points="1118,870 1282,870 1238,958 1162,958" fill={`url(#${A7}-inj)`} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
        <rect x={1118} y={846} width={164} height={26} rx={6} fill={mix('#3B8CFF', '#FF3B30', A)} opacity={0.5 + 0.5 * Math.max(clamp01(gateHit), beatP * 0.6)} />
        <ellipse cx={1200} cy={960} rx={40} ry={12} fill="#EAF4FF" opacity={0.35 + 0.65 * clamp01(gateHit)} />
        <Halo id={`${A7}-gB`} x={1200} y={965} r={170} o={0.25 + 0.75 * clamp01(gateHit)} />
        {gateHit > 0.1 ? <polygon points={`1166,962 1234,962 ${topPt(70, 30)[0]},${topPt(50, 50)[1]} ${topPt(30, 70)[0]},${topPt(50, 50)[1]}`} fill="#8FC4FF" opacity={0.22 * clamp01(gateHit)} /> : null}
      </g>

      {/* leak */}
      <Halo id={`${A7}-gR`} x={1200} y={pr(0, 0, LZ1)[1] - 40} r={560} ry={420} o={0.45 * leakOn + 0.45 * leakBig} />
      {leaks}
      {t >= tLeak ? <Burst t={t} at={tLeak} x={1200} y={pr(0, 0, LZ1)[1]} color="#FF6A5A" n={22} r={330} /> : null}

      {/* warning sign on "catch" */}
      {signIn > 0.01 && signOut > 0.01 ? (
        <g transform={`translate(${SX},${SY}) scale(${(0.4 + 0.6 * signIn) * (1 + 0.04 * Math.sin(t * 0.7))})`} opacity={signOut * Math.min(1, signIn * 2)}>
          <ellipse cx={0} cy={10} rx={330} ry={300} fill={`url(#${A7}-gR)`} opacity={0.75} />
          <polygon points="0,-150 165,125 -165,125" fill="#1A0507" stroke="#FF3B30" strokeWidth={30} strokeLinejoin="round" />
          <polygon points="0,-150 165,125 -165,125" fill="none" stroke="#FFD0CA" strokeWidth={5} strokeLinejoin="round" opacity={0.9} />
          <rect x={-15} y={-70} width={30} height={105} rx={15} fill="#FFE2DD" />
          <circle cx={0} cy={76} r={19} fill="#FFE2DD" />
        </g>
      ) : null}

      {front}

      {/* rewrite counter module */}
      <g>
        <path d={`M${MX + 30},${MY + 150} C ${MX - 190},${MY + 170} ${MX - 150},${MY - 40} ${pr(-4.6, 4.6, ZF)[0] + 40},${pr(-4.6, 4.6, ZF)[1] - 6}`} fill="none" stroke="#0A0B0E" strokeWidth={16} strokeLinecap="round" />
        <path d={`M${MX + 30},${MY + 150} C ${MX - 190},${MY + 170} ${MX - 150},${MY - 40} ${pr(-4.6, 4.6, ZF)[0] + 40},${pr(-4.6, 4.6, ZF)[1] - 6}`} fill="none" stroke={lineC} strokeWidth={3} opacity={0.5 + 0.5 * mb} strokeDasharray="14 18" strokeDashoffset={-t * 6} />
        <ellipse cx={MX + MW / 2} cy={MY + MH + 16} rx={MW * 0.6} ry={40} fill="#000" opacity={0.6} />
        <Halo id={`${A7}-gR`} x={MX + MW / 2} y={MY + MH / 2} r={520} ry={300} o={0.5 * locked + 0.2 * rewOn} />
        <polygon points={`${MX},${MY} ${MX + MW},${MY} ${MX + MW - 34},${MY - 30} ${MX + 34},${MY - 30}`} fill="#4B5260" />
        <rect x={MX} y={MY} width={MW} height={MH} rx={18} fill={`url(#${A7}-mod)`} stroke="rgba(255,255,255,0.25)" strokeWidth={2.5} />
        <rect x={MX + 10} y={MY + 10} width={MW - 20} height={MH - 20} rx={12} fill="none" stroke={mix('#000000', '#FF3B30', locked)} strokeWidth={3} opacity={0.4 + 0.6 * locked} />
        {[[22, 22], [MW - 22, 22], [22, MH - 22], [MW - 22, MH - 22]].map(([x, y], i) => <circle key={i} cx={MX + x} cy={MY + y} r={6} fill="#0B0C10" stroke="#5B6372" strokeWidth={1.5} />)}
        <text x={MX + 48} y={MY + 44} fontFamily={MONO} fontWeight={600} fontSize={27} letterSpacing={7} fill={mix('#7C8698', '#FFD9D4', rewOn)}>REWRITES</text>
        <rect x={MX + 44} y={MY + 51} width={186 * rewOn} height={3} fill="#FF5A4A" />
        <text x={MX + MW - 78} y={MY + 44} fontFamily={MONO} fontWeight={600} fontSize={22} letterSpacing={3} fill="#7C8698" textAnchor="end">CELL 0x3F</text>
        <circle cx={MX + MW - 52} cy={MY + 36} r={9} fill={mix('#3B8CFF', '#FF3B30', A)} opacity={0.5 + 0.5 * Math.max(mb, locked)} />
        {[3, 2, 1, 0].map((p, i) => {
          const pl = place(p);
          return <Drum key={p} id={`${A7}-dc${p}`} x={dx[i]} y={MY + 60} w={104} h={122} pos={pl.pos} blur={pl.blur} color={digC} />;
        })}
        <text x={1084} y={MY + 176} fontFamily={FONT} fontWeight={700} fontSize={84} fill={digC} textAnchor="middle" opacity={0.9}>,</text>
        {Array.from({length: 24}).map((_, i) => (
          <rect key={i} x={961 + i * 20} y={MY + 190} width={14} height={9} rx={2} fill={i / 24 < g ? mix('#FFC233', '#FF3B30', i / 24) : '#1B1E26'} />
        ))}
      </g>
    </svg>
  );
};

const Overlay07: React.FC<WorldDrawProps> = ({t, beats, W, H}) => {
  const tCatch = wt(beats, 'catch'), tLeak = wt(beats, 'leak');
  if (t < tCatch) return null;
  const A = sp(t, tCatch, 'pop');
  const k = 0.35 * A * (0.55 + 0.45 * Math.sin((t - tCatch) * 0.42)) + 0.5 * Math.exp(-(t - tCatch) / 8) + (t >= tLeak ? 0.45 * Math.exp(-(t - tLeak) / 10) : 0);
  return <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, pointerEvents: 'none', boxShadow: `inset 0 0 ${W * 0.2}px ${W * 0.03}px rgba(255,40,28,${clamp01(k).toFixed(3)})`}} />;
};

const S07: WorldDef = {
  id: 'S07-wear', home: 'home',
  anchors: {
    home: {x: 1200, y: 1800, zoom: 0.74}, catch: {x: 1200, y: 1200, zoom: 0.92}, time: {x: 1200, y: 1830, zoom: 0.76},
    bucket: {x: 1200, y: 1600, zoom: 1.0}, emptied: {x: 1200, y: 1840, zoom: 1.22}, refilled: {x: 1200, y: 1400, zoom: 1.18},
    gate: {x: 1200, y: 1330, zoom: 1.15}, one: {x: 1200, y: 2350, zoom: 1.2}, rewrites: {x: 1200, y: 1830, zoom: 0.72},
    leak: {x: 1200, y: 1210, zoom: 1.0},
  },
  aliases: {"here's": 'home', heres: 'home', every: 'time', wears: 'gate', little: 'gate', after: 'one', three: 'one', thousand: 'one', starts: 'gate'},
  palette: {bg0: '#0A0305', bg1: '#32090E', particles: '#FF9A8A', glow: '#FF3B30'},
  Draw: Draw07,
  Overlay: Overlay07,
};

// =============================================================================================== S08  HEAT-MAP TERRAIN
const A8 = 'w8';
const N8 = 12;
const T8 = (i: number, j: number, h = 0): P2 => [1300 + (i - j) * 86.6, 1150 + (i + j) * 50 - h];
const HEAT: [number, string][] = [[0, '#1F5BFF'], [0.3, '#19B8E6'], [0.5, '#2ED8A6'], [0.66, '#F2C037'], [0.82, '#FF7A2B'], [1, '#FF2A2A']];
const heat = (w: number) => {
  const x = clamp01(w);
  for (let k = 1; k < HEAT.length; k++) if (x <= HEAT[k][0]) return mix(HEAT[k - 1][1], HEAT[k][1], (x - HEAT[k - 1][0]) / (HEAT[k][0] - HEAT[k - 1][0]));
  return HEAT[HEAT.length - 1][1];
};
const wear0 = (i: number, j: number) => {
  if (i === 8 && j === 3) return 1;
  const gss = (ci: number, cj: number, s: number) => Math.exp(-((i - ci) * (i - ci) + (j - cj) * (j - cj)) / s);
  return Math.max(0.04, Math.min(0.97, 0.1 + 0.16 * rnd(i * 7.3 + j * 13.1) + 0.9 * gss(8.4, 3.2, 7) + 0.78 * gss(9.3, 9.2, 3.2) + 0.45 * gss(1.5, 1.6, 3) - 0.14 * gss(4, 7.8, 6)));
};
const HOT: [number, number] = [8, 3];
const LAND: [number, number][] = [[4, 7], [3, 8], [5, 8], [4, 9]];
const PK_A: [number, number, number, number][] = [[9, 9, 5, 6], [10, 9, 3, 6], [9, 10, 2, 8], [8, 10, 5, 9], [10, 8, 6, 7]];
const PK_B: [number, number, number, number][] = [[9, 3, 5, 0], [8, 4, 11, 6], [7, 3, 6, 6], [9, 2, 2, 5], [8, 2, 0, 6], [7, 4, 11, 11], [9, 4, 6, 11], [1, 1, 1, 9], [2, 1, 0, 10], [1, 2, 4, 4], [10, 10, 11, 1], [7, 2, 3, 3], [10, 3, 2, 10], [9, 8, 0, 3]];

const Cube: React.FC<{x: number; y: number; s: number; c: string; o?: number; ghost?: number}> = ({x, y, s, c, o = 1, ghost = 0}) => {
  const a = s * K, b = s * 0.5, h = s;
  const fo = lerp(1, 0.3, ghost);
  return (
    <g opacity={o}>
      <polygon points={pp([[x - a, y - h], [x, y + b - h], [x, y + b], [x - a, y]])} fill={shade(c, 0.7)} fillOpacity={fo} stroke={tint(c, 0.6)} strokeWidth={2} />
      <polygon points={pp([[x, y + b - h], [x + a, y - h], [x + a, y], [x, y + b]])} fill={shade(c, 0.48)} fillOpacity={fo} stroke={tint(c, 0.6)} strokeWidth={2} />
      <polygon points={pp([[x - a, y - h], [x, y - b - h], [x + a, y - h], [x, y + b - h]])} fill={tint(c, 0.25)} fillOpacity={lerp(1, 0.5, ghost)} stroke="#fff" strokeWidth={2} />
      <line x1={x - a * 0.7} y1={y - h * 0.55} x2={x - a * 0.2} y2={y - h * 0.55 + b * 0.5} stroke="#fff" strokeWidth={2} opacity={0.7} />
      <line x1={x - a * 0.7} y1={y - h * 0.3} x2={x - a * 0.2} y2={y - h * 0.3 + b * 0.5} stroke="#fff" strokeWidth={2} opacity={0.5} />
    </g>
  );
};

const Draw08: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tCtrl = wt(beats, 'controller'), tCheats = wt(beats, 'cheats'), tNever = wt(beats, 'never'), tRew = wt(beats, 'rewrites'), tSame = wt(beats, 'same');
  const tCell = wt(beats, 'cell', 0), tEvery = wt(beats, 'every'), tNew = wt(beats, 'new'), tWrite = wt(beats, 'write');
  const tLeast = wt(beats, 'least'), tWorn = wt(beats, 'worn'), tCell2 = wt(beats, 'cell', 1), tOld = wt(beats, 'old'), tData = wt(beats, 'data');
  const tGets = wt(beats, 'gets'), tMoved = wt(beats, 'moved'), tQuiet = wt(beats, 'quietly'), tBg = wt(beats, 'background');
  const beatP = pulseOn(t, beats);
  const ctrlOn = sp(t, tCtrl, 'pop'), cheat = sp(t, tCheats, 'pop');
  const quiet = sp(t, tQuiet, 'settle') * (1 - 0.5 * sp(t, tBg, 'settle'));
  const level = sp(t, tBg, 'settle');
  const landT = [tLeast, tWorn, tCell2, tCell2 + 14];
  const launchT = [tWrite, tLeast - 8.5, tWorn - 7.5, tCell2 + 0.5];

  // ---- packets (old data moved from hot cells to cool ones)
  type Pk = {si: number; sj: number; di: number; dj: number; lift: number; go: number; dur: number; faint: boolean};
  const pks: Pk[] = [
    ...PK_A.map(([si, sj, di, dj], k) => ({si, sj, di, dj, lift: tData + k * 1.4, go: tMoved + k * 1.8, dur: 20, faint: false})),
    ...PK_B.map(([si, sj, di, dj], k) => ({si, sj, di, dj, lift: tQuiet + k * 1.1, go: tQuiet + 5 + k * 1.5, dur: 24, faint: true})),
  ];
  // ---- per-cell wear with everything that happens to it
  const wearAt = (i: number, j: number) => {
    let w = wear0(i, j);
    LAND.forEach(([a, b], k) => { if (a === i && b === j) w += 0.07 * sp(t, landT[k], 'pop'); });
    for (const p of pks) {
      if (p.si === i && p.sj === j) w -= 0.3 * smooth((t - p.go) / 14);
      if (p.di === i && p.dj === j) w += 0.08 * smooth((t - p.go - p.dur) / 6);
    }
    return clamp01(lerp(w, 0.4 + (w - 0.4) * 0.58, level));
  };
  const reveal = (i: number, j: number) => smooth((t - tCheats - (i + j) * 0.75) / 7);
  const hOf = (i: number, j: number) => lerp(26, 34 + wearAt(i, j) * 200, reveal(i, j)) * (0.3 + 0.7 * sp(t, -6 + (i + j) * 0.5, 'settle'));
  const topC = (i: number, j: number): P2 => T8(i + 0.5, j + 0.5, hOf(i, j));

  // ---- terrain
  const cells: React.ReactNode[] = [];
  const glows: React.ReactNode[] = [];
  const E0 = 0.07, E1 = 0.93;
  for (let s = 0; s <= 2 * (N8 - 1); s++) for (let i = 0; i < N8; i++) {
    const j = s - i;
    if (j < 0 || j >= N8) continue;
    const w = wearAt(i, j), r = reveal(i, j), h = hOf(i, j);
    const front = 1 - smooth((t - tCheats - (i + j) * 0.75 - 2) / 6);
    const waveF = r > 0 && r < 1 ? 1 : r >= 1 ? front : 0;
    let c = mix('#2B3B55', heat(w), r);
    c = mix(c, '#0A2233', (1 - s / 22) * 0.34);
    let flash = waveF * 0.55;
    LAND.forEach(([a, b], k) => { if (a === i && b === j && t >= landT[k]) flash = Math.max(flash, Math.exp(-(t - landT[k]) / 5)); });
    for (const p of pks) if (p.di === i && p.dj === j && t >= p.go + p.dur) flash = Math.max(flash, 0.8 * Math.exp(-(t - p.go - p.dur) / 5));
    const isHot = i === HOT[0] && j === HOT[1];
    if (isHot && t >= tNever) flash = Math.max(flash, 0.5 * Math.exp(-(t - tNever) / 5), 0.6 * Math.exp(-Math.max(0, t - tCell) / 6) * (t >= tCell ? 1 : 0));
    const cc = mix(c, '#FFFFFF', clamp01(flash) * 0.75);
    const p00 = T8(i + E0, j + E0, h), p10 = T8(i + E1, j + E0, h), p11 = T8(i + E1, j + E1, h), p01 = T8(i + E0, j + E1, h);
    const b10 = T8(i + E1, j + E0, 0), b11 = T8(i + E1, j + E1, 0), b01 = T8(i + E0, j + E1, 0);
    const cen = T8(i + 0.5, j + 0.5, h);
    cells.push(
      <g key={`${i}_${j}`}>
        <polygon points={pp([p01, p11, b11, b01])} fill={`url(#${A8}-sideL)`} />
        <polygon points={pp([p01, p11, b11, b01])} fill={shade(cc, 0.62)} opacity={0.82} />
        <polygon points={pp([p11, p10, b10, b11])} fill={shade(cc, 0.36)} />
        <polygon points={pp([p00, p10, p11, p01])} fill={cc} stroke={tint(cc, 0.45)} strokeWidth={2} />
        <polygon points={pp([T8(i + 0.26, j + 0.26, h), T8(i + 0.74, j + 0.26, h), T8(i + 0.74, j + 0.74, h), T8(i + 0.26, j + 0.74, h)])} fill={tint(cc, 0.3)} opacity={0.6} stroke={shade(cc, 0.7)} strokeWidth={1.2} />
        <line x1={p01[0]} y1={p01[1]} x2={p11[0]} y2={p11[1]} stroke="#fff" strokeWidth={2} opacity={0.35} />
      </g>,
    );
    if (r > 0.5 && w > 0.66) glows.push(<Halo key={`g${i}_${j}`} id={`${A8}-gH`} x={cen[0]} y={cen[1] - 8} r={150} ry={100} o={(w - 0.6) * 1.5 * r * (0.75 + 0.25 * Math.sin(t * 0.3 + i + j))} />);
    if (r > 0.5 && w < 0.2) glows.push(<Halo key={`g${i}_${j}`} id={`${A8}-gC`} x={cen[0]} y={cen[1] - 4} r={90} ry={56} o={0.28 * r} />);
  }
  // floor grid around the terrain
  const floor: React.ReactNode[] = [];
  for (let k = -9; k <= 21; k++) {
    const o = 0.05 + 0.12 * (1 - Math.abs(k - 6) / 15);
    const a1 = T8(k, -9), b1 = T8(k, 21), a2 = T8(-9, k), b2 = T8(21, k);
    floor.push(<line key={`a${k}`} x1={a1[0]} y1={a1[1]} x2={b1[0]} y2={b1[1]} stroke="#38E0D0" strokeWidth={k % 3 === 0 ? 2.5 : 1.2} opacity={o} />);
    floor.push(<line key={`b${k}`} x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} stroke="#38E0D0" strokeWidth={k % 3 === 0 ? 2.5 : 1.2} opacity={o} />);
  }
  // embers over the hot ridge
  const embers: React.ReactNode[] = [];
  if (cheat > 0.5) for (let k = 0; k < 16; k++) {
    const hot = k % 3 === 2 ? [9.3, 9.2] : [8.4, 3.2];
    const q = frac(t * 0.022 + rnd(k * 3.3)), base = T8(hot[0] + (rnd(k * 1.9) - 0.5) * 3, hot[1] + (rnd(k * 4.3) - 0.5) * 3, 200);
    embers.push(<circle key={k} cx={base[0] + Math.sin(q * 9 + k) * 12} cy={base[1] - q * 240} r={3 + 3 * rnd(k)} fill="#FFB36B" opacity={(1 - q) * 0.8 * (1 - 0.5 * level)} />);
  }

  // ---- controller chip (the overseer)
  const bob = Math.sin(t * 0.09) * 10;
  const cp = mkProj(1300, 800 + bob, 50);
  const CS = 3.3, CT = 0.95;
  const E: P2 = [1300, 800 + bob + CS * 50 + 14]; // emitter under the chip's front corner
  // where the eye looks
  let look: P2 = [0, 0];
  const hotTop = topC(HOT[0], HOT[1]);
  if (t >= tNever - 12 && t < tEvery) look = [3.2, -2.2];
  else if (t >= tEvery && t < tOld) look = [-2.2, 3.4];
  else if (t >= tOld && t < tBg) look = [1.6, 3.6];
  const lookK = sp(t, t >= tOld ? tOld : t >= tEvery ? tEvery : tNever - 12, 'settle');
  const eyeFlare = Math.max(Math.exp(-Math.max(0, t - tCheats) / 8) * (t >= tCheats ? 1 : 0), Math.exp(-Math.max(0, t - tNew) / 8) * (t >= tNew ? 1 : 0), 0.5 * beatP);
  const pins: React.ReactNode[] = [];
  for (let k = 0; k < 11; k++) {
    const q = -CS + 0.45 + k * ((2 * CS - 0.9) / 10);
    const a = cp(q, CS, -0.02), b = cp(CS, q, -0.02);
    pins.push(<ellipse key={`l${k}`} cx={a[0]} cy={a[1] + 9} rx={11} ry={10} fill={`url(#${A8}-ball)`} />);
    pins.push(<ellipse key={`r${k}`} cx={b[0]} cy={b[1] + 9} rx={11} ry={10} fill={`url(#${A8}-ball)`} opacity={0.75} />);
  }
  const scanQ = clamp01((t - tCheats) / 20);

  // ---- write drops
  const dropAt = (from: P2, to: P2, q: number, lift = 150): P2 => bez(from, [lerp(from[0], to[0], 0.5), Math.min(from[1], to[1]) - lift], to, q);
  const Drop = (key: string, from: P2, to: P2, q: number, col: string, lift = 150) => {
    if (q <= 0 || q >= 1) return null;
    const e = q * q * (3 - 2 * q), p = dropAt(from, to, e, lift);
    return (
      <g key={key}>
        {Array.from({length: 9}).map((_, k) => {
          const pq = dropAt(from, to, Math.max(0, e - (k + 1) * 0.03), lift);
          return <circle key={k} cx={pq[0]} cy={pq[1]} r={12 - k * 1.1} fill={col} opacity={0.5 - k * 0.05} />;
        })}
        <Halo id={`${A8}-gC`} x={p[0]} y={p[1]} r={95} />
        <circle cx={p[0]} cy={p[1]} r={17} fill="#fff" />
        <circle cx={p[0]} cy={p[1]} r={26} fill="none" stroke={col} strokeWidth={4} opacity={0.8} />
      </g>
    );
  };
  const shieldPt: P2 = [hotTop[0], hotTop[1] - 92];
  const hit1 = tNever, hit2 = tRew + 8;
  const shieldFlash = Math.max(t >= hit1 ? Math.exp(-(t - hit1) / 6) : 0, t >= hit2 ? Math.exp(-(t - hit2) / 6) : 0, t >= tCell ? Math.exp(-(t - tCell) / 7) : 0);
  const shieldBase = t >= hit1 && t < tEvery + 10 ? 0.3 * (1 - smooth((t - tEvery) / 10)) : 0;
  const x1 = clamp01((t - tNever) / 3.5), x2 = clamp01((t - tNever - 2.2) / 3.5);
  const xScale = (0.72 + 0.28 * sp(t, tNever, 'bouncy')) * (1 + 0.32 * sp(t, tCell, 'bouncy'));
  const xOut = 1 - 0.55 * smooth((t - tEvery) / 10);
  const XC: P2 = [hotTop[0], hotTop[1] - 96];
  const tagIn = sp(t, tRew, 'pop'), blockIn = sp(t, tCell, 'bouncy');
  const sameK = sp(t, tSame, 'pop');
  const candidates = sp(t, tEvery, 'pop') * (1 - smooth((t - tOld) / 10));
  const wearNum = [12, 9, 14, 11];

  const packetEls: React.ReactNode[] = [];
  const routeEls: React.ReactNode[] = [];
  const oldOn = sp(t, tOld, 'pop');
  pks.forEach((p, k) => {
    const s = topC(p.si, p.sj), d = topC(p.di, p.dj);
    const liftK = smooth((t - p.lift) / 7), q = clamp01((t - p.go) / p.dur), e = q * q * (3 - 2 * q);
    const landK = smooth((t - p.go - p.dur) / 5);
    const sz = p.faint ? 26 : 34;
    const from: P2 = [s[0], s[1] - 52], to: P2 = [d[0], d[1] - 52], ctl: P2 = [lerp(from[0], to[0], 0.5), Math.min(from[1], to[1]) - (p.faint ? 190 : 130)];
    const pos: P2 = q <= 0 ? [s[0], s[1] - 52 * liftK] : q < 1 ? bez(from, ctl, to, e) : [d[0], d[1] - 52 * (1 - landK)];
    const ghost = q >= 1 ? 1 - landK : liftK;
    const baseO = p.faint ? oldOn * 0.8 : oldOn;
    if (baseO < 0.01) return;
    const col = mix('#FFB23E', '#9CF6FF', q >= 1 ? 1 : liftK);
    if (liftK > 0 && q < 1) {
      const dPath = `M${from[0].toFixed(1)},${from[1].toFixed(1)} Q${ctl[0].toFixed(1)},${ctl[1].toFixed(1)} ${to[0].toFixed(1)},${to[1].toFixed(1)}`;
      const rv = p.faint ? clamp01((t - p.lift) / 6) : clamp01((t - tGets - k * 1.2) / 7);
      routeEls.push(<path key={`r${k}`} d={dPath} fill="none" stroke="#9CF6FF" strokeWidth={p.faint ? 2.5 : 3.5} strokeDasharray="4 12" strokeLinecap="round" opacity={(p.faint ? 0.4 : 0.7) * rv * (1 - q * 0.6)} />);
      if (rv > 0.5) routeEls.push(<ellipse key={`d${k}`} cx={d[0]} cy={d[1]} rx={40} ry={23} fill="none" stroke="#9CF6FF" strokeWidth={3} opacity={(p.faint ? 0.4 : 0.8) * (0.6 + 0.4 * Math.sin(t * 0.5 + k))} />);
    }
    if (q > 0 && q < 1) for (let m = 1; m <= 7; m++) {
      const pq = bez(from, ctl, to, Math.max(0, e - m * 0.035));
      packetEls.push(<rect key={`t${k}-${m}`} x={pq[0] - 9 + m} y={pq[1] - 26 + m} width={18 - m * 2} height={18 - m * 2} fill="#9CF6FF" opacity={(0.42 - m * 0.05) * (p.faint ? 0.7 : 1)} transform={`rotate(45 ${pq[0]} ${pq[1] - 17})`} />);
    }
    if (liftK > 0) packetEls.push(<Halo key={`h${k}`} id={`${A8}-gC`} x={pos[0]} y={pos[1] - sz * 0.5} r={p.faint ? 70 : 105} o={0.75 * (q >= 1 ? 1 - landK * 0.6 : liftK)} />);
    packetEls.push(<Cube key={`c${k}`} x={pos[0]} y={pos[1]} s={sz} c={col} o={baseO} ghost={ghost * 0.85} />);
  });

  const LG: P2 = [1300, 2560];
  return (
    <svg width={2600} height={3200} style={{overflow: 'visible'}}>
      <defs>
        <Grad id={`${A8}-gC`} c="#6FF3FF" /><Grad id={`${A8}-gH`} c="#FF5A2A" core={0.7} /><Grad id={`${A8}-gR`} c="#FF2A2A" /><Grad id={`${A8}-gT`} c="#2EE6C8" core={0.6} />
        <radialGradient id={`${A8}-ball`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#FFF3C2" /><stop offset="0.5" stopColor="#D9AB45" /><stop offset="1" stopColor="#6B4C17" /></radialGradient>
        <linearGradient id={`${A8}-sideL`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0C1A26" /><stop offset="1" stopColor="#03080D" /></linearGradient>
        <radialGradient id={`${A8}-floor`} gradientUnits="userSpaceOnUse" cx={1300} cy={1800} r={1500}><stop offset="0" stopColor="#0E3A48" /><stop offset="0.5" stopColor="#082531" /><stop offset="1" stopColor="#020A10" /></radialGradient>
        <linearGradient id={`${A8}-slabL`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14323C" /><stop offset="1" stopColor="#050F14" /></linearGradient>
        <linearGradient id={`${A8}-cone`} gradientUnits="userSpaceOnUse" x1={1300} y1={900} x2={1300} y2={2200}><stop offset="0" stopColor="#7CF5FF" stopOpacity={0.42} /><stop offset="0.5" stopColor="#2EE6C8" stopOpacity={0.1} /><stop offset="1" stopColor="#2EE6C8" stopOpacity={0} /></linearGradient>
        <linearGradient id={`${A8}-chipT`} gradientUnits="userSpaceOnUse" x1={1010} y1={760} x2={1590} y2={840}><stop offset="0" stopColor="#4A5466" /><stop offset="0.45" stopColor="#1E232D" /><stop offset="0.62" stopColor="#2C3442" /><stop offset="1" stopColor="#10131A" /></linearGradient>
        <linearGradient id={`${A8}-chipL`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A303C" /><stop offset="1" stopColor="#0C0E13" /></linearGradient>
        <linearGradient id={`${A8}-chipR`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#171B23" /><stop offset="1" stopColor="#06070A" /></linearGradient>
        <radialGradient id={`${A8}-eye`}><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor="#8FF7FF" /><stop offset="0.75" stopColor="#12B5C9" /><stop offset="1" stopColor="#064A5A" /></radialGradient>
        <linearGradient id={`${A8}-legend`} x1="0" y1="0" x2="1" y2="0">{HEAT.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}</linearGradient>
      </defs>

      {/* floor */}
      <polygon points={pp([T8(-11, -11), T8(23, -11), T8(23, 23), T8(-11, 23)])} fill={`url(#${A8}-floor)`} />
      {floor}
      {/* neighbouring blocks of cells fading into the distance */}
      {[[-14, 0], [0, -14], [14, 0], [0, 14], [-14, 14], [14, -14], [14, 14]].map(([oi, oj], n) => (
        <g key={n} opacity={0.5}>
          <polygon points={pp([T8(oi - 0.5, oj - 0.5), T8(oi + 12.5, oj - 0.5), T8(oi + 12.5, oj + 12.5), T8(oi - 0.5, oj + 12.5)])} fill="#051018" stroke="#2EE6C8" strokeWidth={2} strokeOpacity={0.35} />
          {Array.from({length: 36}).map((_, k) => {
            const i = oi + (k % 6) * 2 + 0.5, j = oj + Math.floor(k / 6) * 2 + 0.5, w = rnd(n * 31 + k * 1.7), h = 16 + w * 40;
            const c = mix('#12384A', heat(w * 0.9), 0.3 * cheat);
            return (
              <g key={k}>
                <polygon points={pp([T8(i, j + 1.5, h), T8(i + 1.5, j + 1.5, h), T8(i + 1.5, j + 1.5), T8(i, j + 1.5)])} fill={shade(c, 0.55)} />
                <polygon points={pp([T8(i + 1.5, j + 1.5, h), T8(i + 1.5, j, h), T8(i + 1.5, j), T8(i + 1.5, j + 1.5)])} fill={shade(c, 0.35)} />
                <polygon points={pp([T8(i, j, h), T8(i + 1.5, j, h), T8(i + 1.5, j + 1.5, h), T8(i, j + 1.5, h)])} fill={c} stroke={tint(c, 0.3)} strokeWidth={1.5} />
              </g>
            );
          })}
        </g>
      ))}
      {/* base slab */}
      <polygon points={pp([T8(-0.5, 12.5, 0), T8(12.5, 12.5, 0), T8(12.5, 12.5, -70), T8(-0.5, 12.5, -70)])} fill={`url(#${A8}-slabL)`} />
      <polygon points={pp([T8(12.5, 12.5, 0), T8(12.5, -0.5, 0), T8(12.5, -0.5, -70), T8(12.5, 12.5, -70)])} fill="#04090D" />
      <polygon points={pp([T8(-0.5, -0.5), T8(12.5, -0.5), T8(12.5, 12.5), T8(-0.5, 12.5)])} fill="#06141B" stroke="#2EE6C8" strokeWidth={3} strokeOpacity={0.55} />
      <polyline points={pp([T8(-0.5, 12.5, -22), T8(12.5, 12.5, -22), T8(12.5, -0.5, -22)])} fill="none" stroke="#2EE6C8" strokeWidth={5} opacity={0.35 + 0.4 * beatP} />
      {Array.from({length: 13}).map((_, k) => {
        const a0 = T8(0.25 + k, 12.5, -34), a1 = T8(0.75 + k, 12.5, -34), b0 = T8(12.5, 0.25 + k, -34), b1 = T8(12.5, 0.75 + k, -34);
        return (
          <g key={k}>
            <polygon points={pp([a0, a1, [a1[0], a1[1] + 26], [a0[0], a0[1] + 26]])} fill="#D9AB45" opacity={0.8} />
            <polygon points={pp([b0, b1, [b1[0], b1[1] + 26], [b0[0], b0[1] + 26]])} fill="#8A6A28" opacity={0.75} />
          </g>
        );
      })}

      {/* overseer light cone (behind the terrain) */}
      <polygon points={pp([[E[0] - 70, E[1] - 30], [E[0] + 70, E[1] - 30], T8(13, 1.5, 60), T8(12, 12, 0), T8(1.5, 13, 60)])} fill={`url(#${A8}-cone)`} opacity={(0.25 + 0.75 * cheat) * ctrlOn * (1 - 0.4 * quiet)} />

      {cells}
      {glows}
      {embers}
      {/* scan line of the "cheat": sweeps the terrain and reveals the heat map */}
      {scanQ > 0 && scanQ < 1 ? (() => {
        const sPos = scanQ * 23, a = T8(Math.min(12, sPos), Math.max(0, sPos - 12), 150), b = T8(Math.max(0, sPos - 12), Math.min(12, sPos), 150);
        return <g><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#7CF5FF" strokeWidth={26} opacity={0.3 * (1 - scanQ)} strokeLinecap="round" /><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#fff" strokeWidth={5} opacity={0.95 * (1 - scanQ * 0.6)} strokeLinecap="round" /></g>;
      })() : null}

      {/* legend */}
      <g opacity={cheat * (1 - 0.6 * quiet)}>
        <rect x={LG[0] - 330} y={LG[1] - 44} width={660} height={96} rx={20} fill="#04121A" opacity={0.85} stroke="#2EE6C8" strokeOpacity={0.4} strokeWidth={2} />
        <rect x={LG[0] - 190} y={LG[1] - 9} width={380} height={22} rx={11} fill={`url(#${A8}-legend)`} />
        <text x={LG[0] - 210} y={LG[1] + 13} fontFamily={MONO} fontWeight={600} fontSize={28} letterSpacing={3} fill="#8FD0FF" textAnchor="end">FRESH</text>
        <text x={LG[0] + 210} y={LG[1] + 13} fontFamily={MONO} fontWeight={600} fontSize={28} letterSpacing={3} fill="#FF8A6A">WORN</text>
      </g>

      {/* dim the world for "quietly" */}
      <rect x={-4000} y={-4000} width={10600} height={11200} fill="#010508" opacity={0.36 * quiet} />

      {/* ---- controller chip */}
      <g opacity={0.55 + 0.45 * ctrlOn}>
        <Halo id={`${A8}-gT`} x={1300} y={820 + bob} r={620} ry={420} o={0.35 + 0.5 * ctrlOn + 0.3 * eyeFlare} />
        {pins}
        <polygon points={fL(cp, -CS, CS, CS, 0, CT)} fill={`url(#${A8}-chipL)`} />
        <polygon points={fR(cp, CS, -CS, CS, 0, CT)} fill={`url(#${A8}-chipR)`} />
        <polyline points={pp([cp(-CS, CS, 0.12), cp(CS, CS, 0.12), cp(CS, -CS, 0.12)])} fill="none" stroke="#2EE6C8" strokeWidth={5} opacity={(0.3 + 0.7 * ctrlOn) * (0.7 + 0.3 * beatP)} />
        <polygon points={fTop(cp, -CS, -CS, CS, CS, CT)} fill={`url(#${A8}-chipT)`} stroke="#8A96AA" strokeWidth={2.5} />
        <g transform={mTop(cp, -CS, -CS, CS, CS, CT)}>
          <rect x={4} y={4} width={92} height={92} rx={3} fill="none" stroke="#fff" strokeWidth={0.5} opacity={0.22} />
          <polygon points="0,52 0,70 70,0 52,0" fill="#fff" opacity={0.09} />
          <circle cx={11} cy={11} r={2.6} fill="#C9D2E0" opacity={0.8} />
          {Array.from({length: 8}).map((_, k) => <line key={k} x1={50} y1={50} x2={50 + Math.cos((k * Math.PI) / 4) * 44} y2={50 + Math.sin((k * Math.PI) / 4) * 44} stroke="#2EE6C8" strokeWidth={0.7} opacity={0.2 + 0.5 * ctrlOn} strokeDasharray="2 3" strokeDashoffset={-t * 0.6} />)}
          <circle cx={50} cy={50} r={27} fill="#05080C" stroke="#D9AB45" strokeWidth={1.6} />
          <circle cx={50} cy={50} r={23} fill="none" stroke="#2EE6C8" strokeWidth={1} opacity={0.8} strokeDasharray="5 3" transform={`rotate(${t * 3} 50 50)`} />
          <circle cx={50 + look[0] * lookK * 1.6} cy={50 + look[1] * lookK * 1.6} r={17 * (0.25 + 0.75 * ctrlOn)} fill={`url(#${A8}-eye)`} />
          <circle cx={50 + look[0] * lookK * 3.2} cy={50 + look[1] * lookK * 3.2} r={6.5 * ctrlOn * (1 + 0.5 * eyeFlare)} fill="#fff" />
          <text x={50} y={90} fontFamily={MONO} fontWeight={600} fontSize={6.4} letterSpacing={1.6} fill="#B8C4D6" textAnchor="middle" opacity={0.85}>CONTROLLER</text>
          <text x={50} y={15} fontFamily={MONO} fontSize={4} letterSpacing={1} fill="#7C8698" textAnchor="middle">WEAR-LEVELLING · WL8</text>
        </g>
        <Halo id={`${A8}-gC`} x={1300} y={cp(0, 0, CT)[1]} r={230} ry={130} o={0.5 * ctrlOn + 0.5 * eyeFlare} />
        <Halo id={`${A8}-gC`} x={E[0]} y={E[1]} r={70 + 90 * (t >= tNew && t < tWrite + 4 ? sp(t, tNew, 'bouncy') : 0)} o={0.6 * ctrlOn} />
        <circle cx={E[0]} cy={E[1]} r={9 + (t >= tNew && t < tWrite + 2 ? 14 * sp(t, tNew, 'bouncy') : 0)} fill="#fff" opacity={ctrlOn} />
      </g>
      {t >= tCtrl ? <Ripple t={t} at={tCtrl} x={1300} y={820} color="#2EE6C8" r={520} /> : null}
      {t >= tCheats ? <Ripple t={t} at={tCheats} x={1300} y={820} color="#7CF5FF" r={760} /> : null}

      {/* ---- the blocked write on the worn-out cell */}
      {Drop('b0', E, shieldPt, (t - (tNever - 12)) / 12, '#7CF5FF', 60)}
      {Drop('b1', E, shieldPt, (t - tRew) / 8, '#7CF5FF', 60)}
      {t >= tNever - 12 && t < tEvery ? <line x1={E[0]} y1={E[1]} x2={shieldPt[0]} y2={shieldPt[1]} stroke="#FF5A4A" strokeWidth={3} strokeDasharray="10 14" strokeDashoffset={-t * 5} opacity={0.55 * (1 - smooth((t - tEvery + 10) / 10))} /> : null}
      {shieldBase + shieldFlash > 0.01 ? (
        <g opacity={clamp01(shieldBase + shieldFlash)}>
          <Halo id={`${A8}-gR`} x={hotTop[0]} y={hotTop[1] - 50} r={230} o={0.6 * shieldFlash + 0.3} />
          <path d={`M${hotTop[0] - 112},${hotTop[1]} A112,128 0 0 1 ${hotTop[0] + 112},${hotTop[1]}`} fill="rgba(255,60,48,0.10)" stroke="#FF6A5A" strokeWidth={4 + 5 * shieldFlash} />
          <ellipse cx={hotTop[0]} cy={hotTop[1]} rx={112} ry={62} fill="none" stroke="#FF6A5A" strokeWidth={3} />
          <path d={`M${hotTop[0] - 80},${hotTop[1] - 88} A80,40 0 0 0 ${hotTop[0] + 80},${hotTop[1] - 88}`} fill="none" stroke="#FFB0A6" strokeWidth={2} opacity={0.7} />
        </g>
      ) : null}
      {t >= hit1 ? <Burst t={t} at={hit1} x={shieldPt[0]} y={shieldPt[1]} color="#9CF6FF" n={16} r={170} /> : null}
      {t >= hit2 ? <Burst t={t} at={hit2} x={shieldPt[0]} y={shieldPt[1]} color="#9CF6FF" n={14} r={150} /> : null}
      {t >= tCell ? <Burst t={t} at={tCell} x={XC[0]} y={XC[1]} color="#FF5A4A" n={20} r={240} /> : null}
      {sameK > 0.01 && t < tEvery + 10 ? (
        <g opacity={xOut}>
          {[0, 1].map((k) => {
            const e = 0.16 + 0.1 * k + 0.05 * Math.sin(t * 0.5), h = hOf(HOT[0], HOT[1]);
            return <polygon key={k} points={pp([T8(HOT[0] - e, HOT[1] - e, h), T8(HOT[0] + 1 + e, HOT[1] - e, h), T8(HOT[0] + 1 + e, HOT[1] + 1 + e, h), T8(HOT[0] - e, HOT[1] + 1 + e, h)])} fill="none" stroke={k ? '#FF6A5A' : '#FFFFFF'} strokeWidth={k ? 3 : 5} strokeDasharray={k ? '18 12' : undefined} opacity={sameK * (k ? 0.7 : 0.95)} />;
          })}
          <Ripple t={t} at={tSame} x={hotTop[0]} y={hotTop[1]} color="#FFFFFF" r={230} />
          <Ripple t={t} at={tSame + 5} x={hotTop[0]} y={hotTop[1]} color="#FF6A5A" r={230} />
        </g>
      ) : null}
      {x1 > 0 ? (
        <g transform={`translate(${XC[0]},${XC[1]}) scale(${xScale})`} opacity={xOut}>
          {([[36, '#FF2A2A', 0.3], [21, '#FF3B30', 1], [6, '#FFE2DD', 0.95]] as [number, string, number][]).map(([sw, col, o], k) => (
            <g key={k} stroke={col} strokeWidth={sw} strokeLinecap="round" opacity={o}>
              <line x1={-62} y1={-62} x2={-62 + 124 * x1} y2={-62 + 124 * x1} />
              {x2 > 0 ? <line x1={62} y1={-62} x2={62 - 124 * x2} y2={-62 + 124 * x2} /> : null}
            </g>
          ))}
        </g>
      ) : null}
      {tagIn > 0.01 ? (
        <g transform={`translate(${hotTop[0]},${hotTop[1] - 262 - 14 * (1 - tagIn)}) scale(${0.7 + 0.3 * tagIn})`} opacity={Math.min(1, tagIn * 1.5) * xOut}>
          <rect x={-178} y={-44} width={356} height={84} rx={18} fill="#180608" stroke="#FF5A4A" strokeWidth={3} />
          <text x={-150} y={16} fontFamily={FONT} fontWeight={800} fontSize={54} fill="#FFE2DD">3,000</text>
          <text x={20} y={10} fontFamily={MONO} fontWeight={600} fontSize={26} letterSpacing={3} fill="#FF8A7A">REWRITES</text>
          <line x1={0} y1={40} x2={0} y2={78} stroke="#FF5A4A" strokeWidth={3} />
        </g>
      ) : null}
      {blockIn > 0.01 ? (
        <g transform={`translate(${hotTop[0]},${hotTop[1] + 118}) rotate(-7) scale(${1.5 - 0.5 * blockIn})`} opacity={Math.min(1, blockIn * 2) * xOut}>
          <rect x={-142} y={-38} width={284} height={76} rx={10} fill="#1A0507" stroke="#FF3B30" strokeWidth={6} />
          <text x={0} y={17} fontFamily={FONT} fontWeight={800} fontSize={48} letterSpacing={5} fill="#FF4A3D" textAnchor="middle">BLOCKED</text>
        </g>
      ) : null}

      {/* ---- new writes land on the least-worn cells */}
      {LAND.map(([i, j], k) => {
        const c = topC(i, j), h = hOf(i, j), landed = t >= landT[k];
        const e = 0.1 + 0.04 * Math.sin(t * 0.45 + k);
        const up = landed ? sp(t, landT[k], 'bouncy') : 0;
        return (
          <g key={k}>
            {candidates > 0.01 ? <polygon points={pp([T8(i - e, j - e, h), T8(i + 1 + e, j - e, h), T8(i + 1 + e, j + 1 + e, h), T8(i - e, j + 1 + e, h)])} fill="none" stroke="#9CF6FF" strokeWidth={5} opacity={candidates * (0.65 + 0.35 * Math.sin(t * 0.5 + k * 1.3))} /> : null}
            {t >= launchT[k] && !landed ? <line x1={E[0]} y1={E[1]} x2={c[0]} y2={c[1]} stroke="#7CF5FF" strokeWidth={2} strokeDasharray="6 14" opacity={0.4} /> : null}
            {Drop(`w${k}`, E, c, (t - launchT[k]) / (landT[k] - launchT[k]), '#7CF5FF', 130)}
            {landed ? <><Ripple t={t} at={landT[k]} x={c[0]} y={c[1]} color="#9CF6FF" r={210} /><Burst t={t} at={landT[k]} x={c[0]} y={c[1] - 10} color="#DFFBFF" n={14} r={150} />
              <Halo id={`${A8}-gC`} x={c[0]} y={c[1]} r={170} ry={110} o={0.9 * Math.exp(-(t - landT[k]) / 9) + 0.3 * candidates} /></> : null}
            {candidates > 0.01 ? (
              <g transform={`translate(${c[0]},${c[1] - 58 - 8 * up})`} opacity={candidates}>
                <rect x={-38} y={-30} width={76} height={42} rx={12} fill="#04121A" stroke={landed ? '#DFFBFF' : '#3FD6E6'} strokeWidth={2.5} />
                <text x={0} y={5} fontFamily={MONO} fontWeight={600} fontSize={30} fill={landed ? '#FFFFFF' : '#9CF6FF'} textAnchor="middle">{wearNum[k] + (landed ? 1 : 0)}</text>
              </g>
            ) : null}
            {landed && t < landT[k] + 22 ? <text x={c[0]} y={c[1] - 110 - (t - landT[k]) * 4.5} fontFamily={FONT} fontWeight={800} fontSize={50} fill="#DFFBFF" textAnchor="middle" opacity={1 - clamp01((t - landT[k] - 8) / 14)}>+1</text> : null}
          </g>
        );
      })}

      {/* ---- old data glides from hot cells to cool ones */}
      {routeEls}
      {packetEls}
    </svg>
  );
};

const S08: WorldDef = {
  id: 'S08-level', home: 'home',
  anchors: {
    home: {x: 1300, y: 1580, zoom: 0.55}, controller: {x: 1300, y: 840, zoom: 1.05}, terrain: {x: 1300, y: 1640, zoom: 0.6},
    same: {x: 1733, y: 1470, zoom: 1.5}, write: {x: 1190, y: 1330, zoom: 0.82}, least: {x: 1040, y: 1710, zoom: 1.2},
    old: {x: 1300, y: 1900, zoom: 1.25}, data: {x: 1300, y: 1860, zoom: 1.5}, moved: {x: 1150, y: 1780, zoom: 0.92},
    background: {x: 1300, y: 1580, zoom: 0.56},
  },
  aliases: {cheats: 'terrain', never: 'same', rewrites: 'same', every: 'terrain', goes: 'least', worn: 'least', quietly: 'moved'},
  palette: {bg0: '#02080D', bg1: '#0A2A38', particles: '#8FE6FF', glow: '#2EE6C8'},
  Draw: Draw08,
};

export const wearWorlds: Record<string, WorldDef> = {S07, S08};
