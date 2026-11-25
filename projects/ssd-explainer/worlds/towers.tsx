// S05 "towers" world: a flat night map of memory cells that stacks into an isometric neon city of 3D NAND towers,
// a 300-layer ruler on the tallest one, then a far pull-back: the whole city is a chip next to a fingertip.
// Mood: indigo / violet night, cyan + magenta + amber windows. Everything is a pure function of t.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, pulseOn, Burst, Ripple} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp, mix} from '../../../src/kit/explainer/tokens';

const OX = 1400, OY = 900, N = 7, PITCH = 120, PW = 84, OFF = 18, LAYER = 12, DIE = N * PITCH;
const PK0 = -150, PK1 = DIE + 150, PKH = 70;             // chip package around the die (grid units)
const PIV: [number, number] = [1400, 1320];               // pull-back pivot = die centre
const TALL0 = 492, TALL1 = 900;                           // tallest tower: height after "towers" / after the count

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const iso = (x: number, y: number, z = 0): [number, number] => [OX + (x - y), OY + (x + y) / 2 - z];
const pts = (a: [number, number][]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const outCubic = (q: number) => 1 - Math.pow(1 - clamp01(q), 3);

const CY = '#79ECFF', MG = '#FF6FD0', AM = '#FFC872', VIO = '#8C6BFF';

type Tw = {i: number; j: number; x0: number; y0: number; hf: number; dist: number; seed: number; d: number; tall: boolean};
const TOWERS: Tw[] = [];
for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
  const j = s - i;
  if (j < 0 || j >= N) continue;
  const dist = Math.max(Math.abs(i - 3), Math.abs(j - 3));
  const seed = i * 7.31 + j * 3.17 + 1;
  const bias = Math.max(0.62, Math.min(1.15, 1.1 - 0.075 * (i + j - 6)));
  let hf = Math.min(540, [900, 450, 350, 230][dist] * (0.72 + 0.5 * rnd(seed)) * bias);
  if (i === j && i > 3) hf *= 0.62;
  hf = Math.max(132, Math.round(hf / LAYER) * LAYER);
  TOWERS.push({i, j, x0: i * PITCH + OFF, y0: j * PITCH + OFF, hf, dist, seed, d: (i + j) / 12, tall: i === 3 && j === 3});
}

/** one 120 x 120 tile of windows (7 columns x 10 layers) - shared by the left and right face patterns */
const WinTile: React.FC<{seed: number}> = ({seed}) => (
  <>
    {Array.from({length: 70}).map((_, n) => {
      const c = n % 7, r = Math.floor(n / 7), h = rnd(seed * 31 + n * 1.618);
      const fill = h < 0.5 ? CY : h < 0.64 ? AM : h < 0.74 ? MG : h < 0.86 ? '#2C3A86' : '#151B45';
      return <rect key={n} x={c * 12 + 2.5} y={120 - 12 * (r + 1) + 3} width={7.5} height={6.5} rx={0.8} fill={fill} />;
    })}
    {Array.from({length: 10}).map((_, r) => <rect key={'f' + r} x={0} y={120 - 12 * r - 0.8} width={84} height={1.6} fill="#070920" opacity={0.75} />)}
  </>
);

const Box: React.FC<{x: number; y: number; w: number; d: number; h: number; top: string; left: string; right: string}> = ({x, y, w, d, h, top, left, right}) => (
  <g>
    <polygon points={pts([iso(x, y + d), iso(x + w, y + d), iso(x + w, y + d, h), iso(x, y + d, h)])} fill={left} />
    <polygon points={pts([iso(x + w, y + d), iso(x + w, y), iso(x + w, y, h), iso(x + w, y + d, h)])} fill={right} />
    <polygon points={pts([iso(x, y, h), iso(x + w, y, h), iso(x + w, y + d, h), iso(x, y + d, h)])} fill={top} />
  </g>
);

const Tag: React.FC<{x: number; y: number; w: number; h: number; title: string; sub?: string; color: string; p: number; size?: number}> = ({x, y, w, h, title, sub, color, p, size}) => {
  if (p <= 0.01) return null;
  const fs = size ?? h * 0.46;
  return (
    <g transform={`translate(${x + w / 2},${y + h / 2}) scale(${0.6 + 0.4 * p}) translate(${-w / 2},${-h / 2})`} opacity={clamp01(p * 1.4)}>
      <rect x={4} y={8} width={w} height={h} rx={h * 0.22} fill="#000" opacity={0.45} />
      <rect width={w} height={h} rx={h * 0.22} fill="url(#tw-tag)" stroke={color} strokeWidth={2.5} />
      <rect x={3} y={3} width={w - 6} height={h * 0.42} rx={h * 0.18} fill="#FFFFFF" opacity={0.07} />
      <text x={w / 2} y={sub ? h * 0.56 : h * 0.5 + fs * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={fs} fill="#FFFFFF">{title}</text>
      {sub ? <text x={w / 2} y={h * 0.84} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={h * 0.17} fill={color} letterSpacing={h * 0.03}>{sub}</text> : null}
    </g>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const T = {
    eng: wordAt(beats, 'engineers', 19.5), stop: wordAt(beats, 'stopped', 31), build: wordAt(beats, 'building', 39.5), flat: wordAt(beats, 'flat', 49),
    stack: wordAt(beats, 'stack', 86.5), cells: wordAt(beats, 'cells', 98.5), towers: wordAt(beats, 'towers', 112), n300: wordAt(beats, '300', 141.5),
    layers: wordAt(beats, 'layers', 156), high: wordAt(beats, 'high', 163.5), chip: wordAt(beats, 'chip', 187), smaller: wordAt(beats, 'smaller', 194),
    nail: wordAt(beats, 'fingernail', 211),
  };
  const pulse = pulseOn(t, beats);
  const g = outCubic((t - T.n300) / 15);                       // 0..1 while the counter runs
  // one smooth log-speed pull-back over "chip ... smaller" (was two springy steps - Ved: no jumpy camera)
  const pull = (() => { const q = Math.max(0, Math.min(1, (t - T.chip + 2) / Math.max(30, T.smaller - T.chip + 26))); return q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; })();
  const chipP = Math.min(1, pull * 1.6), smallP = Math.max(0, pull * 1.6 - 0.6);
  const k = Math.exp(Math.log(0.36) * pull);                   // world-space pull-back of the whole city (smooth)
  const hud = 1 - chipP;
  const risen = sp(t, T.stack, 'settle');

  const heightAt = (tw: Tw, tt: number) => {
    const s1 = sp(tt, T.stack + (tw.i + tw.j) * 0.5, 'pop');
    const s2 = sp(tt, T.cells + rnd(tw.seed * 3) * 5, 'settle');
    const s3 = sp(tt, T.towers + tw.dist * 2.2 + rnd(tw.seed * 5) * 4, 'bouncy');
    const mid = Math.max(84, tw.hf * 0.3);
    const top = tw.tall ? TALL0 : tw.hf;
    let h = LAYER + (72 - LAYER) * s1 + (mid - 72) * s2 + (top - mid) * s3;
    if (tw.tall) h += (TALL1 - TALL0) * outCubic((tt - T.n300) / 15);
    return Math.max(LAYER, Math.round(h / LAYER) * LAYER);
  };
  const tallH = heightAt(TOWERS.find((w) => w.tall)!, t);
  const tallTopY = 1320 - tallH;

  // ---- towers -------------------------------------------------------------------------------------------------
  const towerEls: React.ReactNode[] = [];
  TOWERS.forEach((tw, n) => {
    const ring = tw.dist === 3;
    const rp = ring ? sp(t, T.eng + rnd(tw.seed * 9) * 9, 'pop') : 1;
    if (rp <= 0.01) return;
    const h = heightAt(tw, t), vel = Math.abs(h - heightAt(tw, t - 1.5));
    const {x0, y0} = tw, x1 = x0 + PW, y1 = y0 + PW;
    const A = iso(x0, y1), B = iso(x1, y1), Cc = iso(x1, y0), D = iso(x0, y0);
    const up = (p: [number, number]): [number, number] => [p[0], p[1] - h];
    const lit = 0.5 + 0.5 * tw.d;
    const pat = n % 3;
    const els: React.ReactNode[] = [
      <polygon key="l" points={pts([A, B, up(B), up(A)])} fill={mix('#1B1552', '#141B58', tw.d)} />,
      <polygon key="lg" points={pts([A, B, up(B), up(A)])} fill="url(#tw-baseglow)" opacity={0.55} />,
      <polygon key="lw" points={pts([A, B, up(B), up(A)])} fill={`url(#tw-winL${pat})`} opacity={(0.8 + 0.2 * pulse) * (0.7 + 0.3 * lit)} />,
      <polygon key="r" points={pts([B, Cc, up(Cc), up(B)])} fill={mix('#100B38', '#0A0E2C', tw.d)} />,
      <polygon key="rw" points={pts([B, Cc, up(Cc), up(B)])} fill={`url(#tw-winR${(pat + 1) % 3})`} opacity={0.6 * (0.7 + 0.3 * lit)} />,
      <g key="t" transform={`translate(0,${-h})`}>
        <polygon points={pts([A, B, Cc, D])} fill={mix('#3A2C96', '#4150BE', tw.d)} />
        <polygon points={pts([A, B, Cc, D])} fill="url(#tw-roof)" opacity={h <= LAYER * 2 ? 1 : 0.75} />
        <polygon points={pts([A, B, Cc, D])} fill={CY} opacity={Math.min(0.8, vel / 60)} />
        <polyline points={pts([A, B, Cc])} fill="none" stroke="#C9D6FF" strokeWidth={1.6} opacity={0.75} />
      </g>,
      <line key="e" x1={B[0]} y1={B[1]} x2={B[0]} y2={B[1] - h} stroke="#9FB2FF" strokeWidth={1.2} opacity={0.35} />,
    ];
    // live "writes": a few windows flash on each tower once it has layers
    if (h >= 48) for (let q = 0; q < 3; q++) {
      const sd = tw.seed * 13 + q * 5.7;
      const rows = h / LAYER, c = Math.floor(rnd(sd) * 7), r = Math.floor(rnd(sd + Math.floor(t / 9 + rnd(sd * 2) * 9) * 0.37) * rows);
      const fl = Math.pow(Math.max(0, Math.sin(t * 0.7 + sd * 3)), 3) * (0.5 + 0.5 * sp(t, T.cells, 'pop'));
      if (fl < 0.05) continue;
      const left = q !== 2;
      const bx = (left ? A[0] : B[0]) + c * 12 + 2, by = (left ? A[1] + (c * 12 + 2) * 0.5 : B[1] - (c * 12 + 2) * 0.5) - r * 12 - 2.5;
      const sl = left ? 4.25 : -4.25;
      els.push(<polygon key={'s' + q} points={pts([[bx, by], [bx + 8.5, by + sl], [bx + 8.5, by + sl - 7.5], [bx, by - 7.5]])} fill="#FFFFFF" opacity={fl} />);
      els.push(<circle key={'sg' + q} cx={bx + 4} cy={by - 2} r={15} fill="url(#tw-spark)" opacity={fl * 0.8} />);
    }
    // a slab dropping onto the stack while it is being stacked
    const dropQ = clamp01((t - (T.stack + (tw.i + tw.j) * 0.5 - 5)) / 9);
    if (dropQ > 0 && dropQ < 1 && !ring) {
      els.push(<g key="drop" transform={`translate(0,${-h - (1 - dropQ) * (1 - dropQ) * 260})`} opacity={dropQ}>
        <polygon points={pts([A, B, Cc, D])} fill={CY} opacity={0.5} stroke="#FFFFFF" strokeWidth={2} /></g>);
    }
    // roof beacon on the tall ones
    if (tw.hf > 380 || tw.tall) {
      const bp = sp(t, T.towers + 10 + tw.dist * 2, 'pop');
      if (bp > 0.01) {
        const c0 = iso(x0 + PW / 2, y0 + PW / 2, h);
        const blink = 0.55 + 0.45 * Math.sin(t * 0.5 + tw.seed * 4);
        els.push(<line key="m" x1={c0[0]} y1={c0[1]} x2={c0[0]} y2={c0[1] - 34 * bp} stroke="#B8C4FF" strokeWidth={3} />);
        els.push(<circle key="bg" cx={c0[0]} cy={c0[1] - 34 * bp} r={26} fill="url(#tw-beacon)" opacity={bp * blink} />);
        els.push(<circle key="b" cx={c0[0]} cy={c0[1] - 34 * bp} r={4.5} fill="#FFE3F6" opacity={bp} />);
      }
    }
    towerEls.push(<g key={n} transform={ring ? `translate(0,${-(1 - rp) * 90})` : undefined} opacity={ring ? clamp01(rp * 1.5) : 1}>{els}</g>);
  });

  // ---- flat-phase graphics --------------------------------------------------------------------------------------
  const stopP = sp(t, T.stop, 'pop'), stopFade = clamp01(1 - (t - T.stack) / 8);
  const stopPulse = 0.55 + 0.45 * Math.sin((t - T.stop) * 0.9);
  const scanQ = clamp01((t - T.build) / 16);
  const flatP = sp(t, T.flat, 'pop') * clamp01(1 - (t - T.stack + 2) / 6);
  const dieOutline = pts([iso(0, 0), iso(DIE, 0), iso(DIE, DIE), iso(0, DIE)]);

  // ---- ruler + counter on the tallest tower -------------------------------------------------------------------------
  const rulP = sp(t, T.n300 - 3, 'pop') * hud;
  const RX = 1540, RB = 1320;
  const layersNow = Math.round(300 * g);
  const lyrQ = clamp01((t - T.layers) / 12);
  const highP = sp(t, T.high, 'bouncy');

  // ---- fingertip ---------------------------------------------------------------------------------------------------
  const fingP = sp(t, T.chip + 4, 'settle');
  const FE: [number, number] = [1816, 1946], fd: [number, number] = [-0.42, -0.9075];
  const fOff = (1 - fingP) * 1900 - 26 * Math.sin(Math.PI * clamp01((t - T.nail) / 8));
  const fx = FE[0] - fd[0] * fOff, fy = FE[1] - fd[1] * fOff;
  const fingerPath = 'M -470 2700 L -482 210 C -482 -150 -300 -470 0 -470 C 300 -470 482 -150 482 210 L 470 2700 Z';
  const nailPath = 'M -300 330 C -312 60 -300 -330 0 -392 C 300 -330 312 60 300 330 C 200 398 -200 398 -300 330 Z';
  const lblP = sp(t, T.nail + 4, 'pop');

  return (
    <svg width={2800} height={3400} style={{overflow: 'visible'}}>
      <defs>
        {[0, 1, 2].map((s) => (
          <pattern key={'L' + s} id={`tw-winL${s}`} width={120} height={120} patternUnits="userSpaceOnUse" patternTransform={`matrix(1,0.5,0,1,${OX - 84},${OY + 102})`}><WinTile seed={s + 1} /></pattern>
        ))}
        {[0, 1, 2].map((s) => (
          <pattern key={'R' + s} id={`tw-winR${s}`} width={120} height={120} patternUnits="userSpaceOnUse" patternTransform={`matrix(1,-0.5,0,1,${OX},${OY + 102})`}><WinTile seed={s + 4} /></pattern>
        ))}
        <pattern id="tw-roof" width={120} height={120} patternUnits="userSpaceOnUse" patternTransform={`matrix(1,0.5,-1,0.5,${OX},${OY})`}>
          {Array.from({length: 49}).map((_, n) => {
            const c = n % 7, r = Math.floor(n / 7), h = rnd(n * 2.7 + 3);
            return <rect key={n} x={OFF + c * 12 + 2} y={OFF + r * 12 + 2} width={8} height={8} rx={1.5} fill={h < 0.55 ? CY : h < 0.7 ? AM : h < 0.8 ? MG : '#2A347E'} />;
          })}
        </pattern>
        <pattern id="tw-lots" width={120} height={120} patternUnits="userSpaceOnUse" patternTransform={`matrix(1,0.5,-1,0.5,${OX},${OY})`}>
          <rect x={OFF} y={OFF} width={PW} height={PW} rx={4} fill="#0D1030" stroke="#3B49B8" strokeWidth={1.5} />
          <path d="M0 0H120M0 0V120" stroke={CY} strokeWidth={2.2} opacity={0.55} />
          <path d="M0 60H10M110 60H120M60 0V10M60 110V120" stroke={AM} strokeWidth={2} opacity={0.6} />
        </pattern>
        <pattern id="tw-pcb" width={120} height={120} patternUnits="userSpaceOnUse" patternTransform={`matrix(1,0.5,-1,0.5,${OX},${OY})`}>
          <path d="M0 0H120M0 0V120" stroke="#6A5BE0" strokeWidth={1.6} opacity={0.5} />
          <path d="M20 40H70L90 60H120M40 120V90L60 70V0" stroke="#C9A24A" strokeWidth={2.4} fill="none" opacity={0.45} />
          <circle cx={70} cy={40} r={5} fill="#D9B45E" opacity={0.6} /><circle cx={40} cy={90} r={5} fill="#D9B45E" opacity={0.6} />
        </pattern>
        <radialGradient id="tw-ground" gradientUnits="userSpaceOnUse" cx={PIV[0]} cy={PIV[1]} r={2300}>
          <stop offset="0" stopColor="#1B1458" /><stop offset="0.45" stopColor="#0F0B36" /><stop offset="1" stopColor="#07051A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="tw-fade" gradientUnits="userSpaceOnUse" cx={PIV[0]} cy={PIV[1]} r={2100}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.95} /><stop offset="0.6" stopColor="#fff" stopOpacity={0.5} /><stop offset="1" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id="tw-gmask" maskUnits="userSpaceOnUse" x={-2000} y={-1500} width={6800} height={6000}><rect x={-2000} y={-1500} width={6800} height={6000} fill="url(#tw-fade)" /></mask>
        <radialGradient id="tw-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={VIO} stopOpacity={0.6} /><stop offset="0.5" stopColor="#5B2BD6" stopOpacity={0.2} /><stop offset="1" stopColor="#5B2BD6" stopOpacity={0} /></radialGradient>
        <radialGradient id="tw-cityglow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={CY} stopOpacity={0.5} /><stop offset="1" stopColor={CY} stopOpacity={0} /></radialGradient>
        <radialGradient id="tw-spark" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} /><stop offset="1" stopColor={CY} stopOpacity={0} /></radialGradient>
        <radialGradient id="tw-beacon" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFD0F0" stopOpacity={1} /><stop offset="0.3" stopColor={MG} stopOpacity={0.6} /><stop offset="1" stopColor={MG} stopOpacity={0} /></radialGradient>
        <linearGradient id="tw-baseglow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={MG} stopOpacity={0} /><stop offset="0.7" stopColor={MG} stopOpacity={0.08} /><stop offset="1" stopColor="#FF8AE0" stopOpacity={0.55} /></linearGradient>
        <linearGradient id="tw-pkgtop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2A2A3C" /><stop offset="0.5" stopColor="#15151F" /><stop offset="1" stopColor="#0A0A12" /></linearGradient>
        <linearGradient id="tw-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5DC9A" /><stop offset="0.5" stopColor="#C9A24A" /><stop offset="1" stopColor="#7A5E1E" /></linearGradient>
        <linearGradient id="tw-tag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2B2470" stopOpacity={0.96} /><stop offset="1" stopColor="#0D0A2C" stopOpacity={0.96} /></linearGradient>
        <linearGradient id="tw-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} /><stop offset="0.25" stopColor={MG} stopOpacity={0.45} /><stop offset="1" stopColor={VIO} stopOpacity={0} /></linearGradient>
        <linearGradient id="tw-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A0624" stopOpacity={0} /><stop offset="0.75" stopColor="#3A1F8F" stopOpacity={0.55} /><stop offset="1" stopColor="#FF6FD0" stopOpacity={0.35} /></linearGradient>
        <linearGradient id="tw-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#120B3C" stopOpacity={0} /><stop offset="1" stopColor="#120B3C" stopOpacity={1} /></linearGradient>
        <linearGradient id="tw-finger" gradientUnits="userSpaceOnUse" x1={-482} y1={0} x2={482} y2={0}>
          <stop offset="0" stopColor="#1B1244" /><stop offset="0.22" stopColor="#4A2F8A" /><stop offset="0.55" stopColor="#5E3BA6" /><stop offset="0.85" stopColor="#33205F" /><stop offset="1" stopColor="#140C30" />
        </linearGradient>
        <linearGradient id="tw-fingertip" gradientUnits="userSpaceOnUse" x1={0} y1={-470} x2={0} y2={500}><stop offset="0" stopColor="#B58CFF" stopOpacity={0.45} /><stop offset="1" stopColor="#B58CFF" stopOpacity={0} /></linearGradient>
        <linearGradient id="tw-rim" gradientUnits="userSpaceOnUse" x1={-482} y1={0} x2={482} y2={0}><stop offset="0" stopColor={CY} /><stop offset="0.5" stopColor="#E9DDFF" /><stop offset="1" stopColor={MG} /></linearGradient>
        <linearGradient id="tw-nail" gradientUnits="userSpaceOnUse" x1={-300} y1={-392} x2={300} y2={398}>
          <stop offset="0" stopColor="#F3EBFF" /><stop offset="0.35" stopColor="#C4AEF7" /><stop offset="0.75" stopColor="#8E72D6" /><stop offset="1" stopColor="#6B4FB8" />
        </linearGradient>
        <radialGradient id="tw-bloom" cx="50%" cy="55%" r="50%"><stop offset="0" stopColor="#4FB8FF" stopOpacity={0.55} /><stop offset="0.5" stopColor="#B04DFF" stopOpacity={0.22} /><stop offset="1" stopColor="#B04DFF" stopOpacity={0} /></radialGradient>
        <clipPath id="tw-nailclip"><path d={nailPath} /></clipPath>
        <filter id="tw-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={26} /></filter>
      </defs>

      {/* everything that scales with the pull-back */}
      <g transform={`translate(${PIV[0]},${PIV[1]}) scale(${k}) translate(${-PIV[0]},${-PIV[1]})`}>
        {/* board under the chip */}
        <polygon points={pts([iso(-2600, -2600), iso(3440, -2600), iso(3440, 3440), iso(-2600, 3440)])} fill="url(#tw-ground)" />
        <g mask="url(#tw-gmask)"><polygon points={pts([iso(-2600, -2600), iso(3440, -2600), iso(3440, 3440), iso(-2600, 3440)])} fill="url(#tw-pcb)" opacity={0.55} /></g>
      {/* far skyline backdrop + horizon glow (fades when the camera leaves the city) */}
      <g opacity={0.9 * (1 - chipP)}>
        <rect x={-600} y={-140} width={4000} height={960} fill="url(#tw-sky)" opacity={0.6} />
        {Array.from({length: 40}).map((_, n) => {
          const x = -260 + n * 84 + rnd(n * 3.3) * 30, w = 46 + rnd(n * 5.1) * 50;
          const hh = 150 + rnd(n * 7.7) * 330 + 240 * Math.exp(-Math.pow((x - 1400) / 700, 2));
          return (
            <g key={n}>
              <rect x={x} y={840 - hh} width={w} height={hh} fill={n % 2 ? '#241A6E' : '#2E2084'} />
              <rect x={x} y={840 - hh} width={w} height={3} fill="#6E5BE8" opacity={0.6} />
              {[0, 1, 2, 3].map((q) => <rect key={q} x={x + 6 + rnd(n + q * 9.1) * (w - 16)} y={840 - hh + 14 + rnd(n * 2 + q * 4.3) * (hh * 0.6)} width={5} height={7}
                                              fill={q % 2 ? AM : CY} opacity={0.35 + 0.3 * Math.sin(t * 0.2 + n + q)} />)}
            </g>
          );
        })}
        <rect x={-600} y={560} width={4000} height={290} fill="url(#tw-fog)" />
      </g>

        <ellipse cx={PIV[0]} cy={PIV[1] + 60} rx={1500} ry={800} fill="url(#tw-halo)" opacity={0.5 + 0.25 * risen + 0.15 * pulse} />
        {/* SMD parts around the package */}
        {Array.from({length: 14}).map((_, n) => {
          const side = n % 2, q = Math.floor(n / 2);
          const x = side ? PK1 + 90 + (q % 2) * 110 : 40 + q * 150, y = side ? 40 + q * 150 : PK1 + 90 + (q % 2) * 110;
          const dark = n % 3 === 0;
          return (
            <g key={n}>
              <Box x={x - 6} y={y - 6} w={side ? 56 : 92} d={side ? 92 : 56} h={3} top="#D9B45E" left="#8E7230" right="#6E5620" />
              <Box x={x + (side ? 0 : 12)} y={y + (side ? 12 : 0)} w={side ? 44 : 56} d={side ? 56 : 44} h={26} top={dark ? '#2B2B3A' : '#B79E7A'} left={dark ? '#1A1A26' : '#8E7A5C'} right={dark ? '#101018' : '#6B5A42'} />
            </g>
          );
        })}
        {/* package: shadow, body, gold pads, silk */}
        <polygon points={pts([iso(PK0 + 60, PK1 + 50, -PKH), iso(PK1 + 60, PK1 + 50, -PKH), iso(PK1 + 60, PK0 + 50, -PKH), iso(PK1 + 160, PK0 + 120, -PKH), iso(PK1 + 160, PK1 + 160, -PKH), iso(PK0 + 120, PK1 + 160, -PKH)])} fill="#000" opacity={0.5} />
        <g transform={`translate(0,${PKH})`}>
          <polygon points={pts([iso(PK0, PK1), iso(PK1, PK1), iso(PK1, PK1, PKH), iso(PK0, PK1, PKH)])} fill="#14141E" />
          <polygon points={pts([iso(PK1, PK1), iso(PK1, PK0), iso(PK1, PK0, PKH), iso(PK1, PK1, PKH)])} fill="#0A0A12" />
          {Array.from({length: 16}).map((_, n) => {
            const a = PK0 + 50 + n * 68;
            return (
              <g key={n}>
                <polygon points={pts([iso(a, PK1, 4), iso(a + 40, PK1, 4), iso(a + 40, PK1, 44), iso(a, PK1, 44)])} fill="url(#tw-gold)" />
                <polygon points={pts([iso(PK1, a, 4), iso(PK1, a + 40, 4), iso(PK1, a + 40, 44), iso(PK1, a, 44)])} fill="#9C7E34" />
              </g>
            );
          })}
          <polygon points={pts([iso(PK0, PK0, PKH), iso(PK1, PK0, PKH), iso(PK1, PK1, PKH), iso(PK0, PK1, PKH)])} fill="url(#tw-pkgtop)" stroke="#4A4A66" strokeWidth={2.5} />
          <polygon points={pts([iso(PK0 + 30, PK0 + 30, PKH), iso(PK0 + 260, PK0 + 30, PKH), iso(PK0 + 30, PK0 + 700, PKH)])} fill="#FFFFFF" opacity={0.05} />
        </g>
        <g transform={`matrix(1,0.5,-1,0.5,${OX},${OY})`}>
          <text x={24} y={DIE + 104} fontFamily={MONO} fontWeight={600} fontSize={74} fill="#8A8AA8" opacity={0.85} letterSpacing={6}>3D NAND  V9  1TB</text>
          <circle cx={PK0 + 60} cy={PK1 - 60} r={22} fill="none" stroke="#8A8AA8" strokeWidth={5} opacity={0.8} />
          <rect x={-22} y={-22} width={DIE + 44} height={DIE + 44} rx={10} fill="#05061A" stroke="#C9A24A" strokeWidth={5} />
        </g>
        {/* the die: lots + streets */}
        <polygon points={dieOutline} fill="#080A22" />
        <polygon points={dieOutline} fill="url(#tw-lots)" />
        <ellipse cx={PIV[0]} cy={PIV[1]} rx={820} ry={410} fill="url(#tw-cityglow)" opacity={0.16 + 0.2 * pulse + 0.14 * risen} />
        {/* traffic on the streets */}
        {Array.from({length: 22}).map((_, n) => {
          const lane = 1 + Math.floor(rnd(n * 2.3) * 6), alongX = n % 2 === 0, sp0 = 3 + rnd(n * 4.1) * 5, dir = rnd(n * 6.7) > 0.5 ? 1 : -1;
          const pos = (((rnd(n * 9.9) * DIE + t * sp0 * dir) % DIE) + DIE) % DIE;
          const p = alongX ? iso(pos, lane * PITCH) : iso(lane * PITCH, pos);
          return <g key={n}><circle cx={p[0]} cy={p[1]} r={9} fill={n % 3 ? CY : AM} opacity={0.25} /><circle cx={p[0]} cy={p[1]} r={3} fill="#FFFFFF" /></g>;
        })}
        {/* "building": a write sweep crosses the flat map */}
        {scanQ > 0 && scanQ < 1 ? (
          <g opacity={Math.sin(scanQ * Math.PI)}>
            <polygon points={pts([iso(scanQ * DIE - 90, 0), iso(scanQ * DIE, 0), iso(scanQ * DIE, DIE), iso(scanQ * DIE - 90, DIE)])} fill={CY} opacity={0.22} />
            <line x1={iso(scanQ * DIE, 0)[0]} y1={iso(scanQ * DIE, 0)[1]} x2={iso(scanQ * DIE, DIE)[0]} y2={iso(scanQ * DIE, DIE)[1]} stroke="#FFFFFF" strokeWidth={5} />
          </g>
        ) : null}

        {towerEls}
        <ellipse cx={PIV[0]} cy={PIV[1] - 180} rx={950} ry={720} fill="url(#tw-bloom)" opacity={0.5 * risen + 0.2 * pulse} style={{mixBlendMode: 'screen'}} />

        {/* "stopped": the die edge turns red - no room left to spread */}
        {stopP > 0.01 && stopFade > 0 ? (
          <g opacity={stopP * stopFade}>
            <polygon points={dieOutline} fill="none" stroke="#FF3B5C" strokeWidth={22} opacity={0.22 * stopPulse} />
            <polygon points={dieOutline} fill="none" stroke="#FF5C7A" strokeWidth={6} strokeDasharray="34 16" opacity={0.6 + 0.4 * stopPulse} />
            {([[DIE, DIE / 2, 1, 0], [DIE / 2, DIE, 0, 1], [0, DIE / 2, -1, 0], [DIE / 2, 0, 0, -1]] as const).map(([x, y, dx, dy], n) => {
              const c = iso(x + dx * 16, y + dy * 16, 0), a = iso(x - dx * (150 - 60 * stopP), y - dy * (150 - 60 * stopP));
              return (
                <g key={n}>
                  <line x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} stroke="#FFD0D8" strokeWidth={5} strokeLinecap="round" opacity={0.9} />
                  <circle cx={c[0]} cy={c[1] - 34} r={30 * stopP} fill="#2A0712" stroke="#FF5C7A" strokeWidth={4} />
                  <path d={`M${c[0] - 11} ${c[1] - 45}L${c[0] + 11} ${c[1] - 23}M${c[0] + 11} ${c[1] - 45}L${c[0] - 11} ${c[1] - 23}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* "flat": thickness callout at the front corner */}
        {flatP > 0.01 ? (
          <g>
            <line x1={1400} y1={1722} x2={1400} y2={1722 - 12} stroke="#FFFFFF" strokeWidth={3} opacity={flatP} />
            <path d={`M1404 ${1722 - 12}H${1404 + 80 * flatP}M1404 1722H${1404 + 80 * flatP}`} stroke={AM} strokeWidth={2.5} opacity={flatP} />
            <path d={`M${1404 + 70 * flatP} ${1722 - 40}V${1722 - 14}M${1404 + 70 * flatP} ${1722 + 30}V${1722 + 2}`} stroke={AM} strokeWidth={2.5} opacity={flatP} />
            <path d="M1474 1700L1560 1662" stroke={AM} strokeWidth={2} opacity={flatP * 0.8} fill="none" />
            <Tag x={1480} y={1560} w={250} h={100} title="1 LAYER" sub="FLAT · 2D" color={AM} p={flatP} />
          </g>
        ) : null}

        {/* "cells": one window = one cell */}
        {(() => {
          const cp = sp(t, T.cells + 3, 'pop') * clamp01(1 - (t - T.towers + 2) / 5);
          if (cp <= 0.01) return null;
          const cx = 1316 + 3 * 12 + 6, cy = 1680 + 21 - 4 * 12 - 6;
          return (
            <g>
              <circle cx={cx} cy={cy} r={13 + 5 * (1 - cp)} fill="none" stroke="#FFFFFF" strokeWidth={2.5} opacity={cp} />
              <circle cx={cx} cy={cy} r={22} fill="url(#tw-spark)" opacity={cp * 0.8} />
              <path d={`M${cx - 10} ${cy - 9}L${cx - 60} ${cy - 62}`} stroke="#FFFFFF" strokeWidth={2} opacity={cp} />
              <Tag x={cx - 250} y={cy - 130} w={200} h={72} title="1 CELL" color={CY} p={cp} size={34} />
            </g>
          );
        })()}

        {/* sky beams from the tall roofs */}
        {TOWERS.filter((w) => w.hf > 430 || w.tall).map((tw, n) => {
          const bp = sp(t, T.towers + 12 + n * 1.5, 'settle') * (0.35 + 0.15 * Math.sin(t * 0.25 + n));
          if (bp <= 0.01) return null;
          const h = heightAt(tw, t), c0 = iso(tw.x0 + PW / 2, tw.y0 + PW / 2, h + 34);
          const lean = (tw.i - tw.j) * 14, hh = tw.tall ? 520 + 380 * highP : 360;
          return <polygon key={n} points={pts([[c0[0] - 3, c0[1]], [c0[0] + 3, c0[1]], [c0[0] + lean + 26, c0[1] - hh], [c0[0] + lean - 26, c0[1] - hh]])} fill="url(#tw-beam)" opacity={bp * (tw.tall ? 1 + highP : 1)} />;
        })}

        {/* height ruler + live layer counter on the tallest tower */}
        {rulP > 0.01 ? (
          <g opacity={clamp01(rulP * 1.3)}>
            <rect x={RX - 5} y={RB - TALL1 * rulP - 16} width={34} height={TALL1 * rulP + 22} rx={6} fill="#0B0930" stroke="#6A5BE0" strokeWidth={2} opacity={0.92} />
            {Array.from({length: 31}).map((_, n) => {
              const y = RB - n * 30, major = n % 10 === 0, mid = n % 5 === 0;
              if (RB - y > TALL1 * rulP) return null;
              const on = RB - y <= tallH + 1;
              const sweep = lyrQ > 0 && lyrQ < 1 ? Math.max(0, 1 - Math.abs(n / 30 - lyrQ) * 6) : 0;
              return (
                <g key={n}>
                  <line x1={RX} y1={y} x2={RX + (major ? 24 : mid ? 17 : 10)} y2={y} stroke={on ? (major ? '#FFFFFF' : CY) : '#4A4FA0'} strokeWidth={major ? 4 : 2.2 + sweep * 3} opacity={on ? 1 : 0.7} />
                  {sweep > 0 ? <line x1={RX - 60} y1={y} x2={RX + 30} y2={y} stroke="#FFFFFF" strokeWidth={3} opacity={sweep * 0.8} /> : null}
                  {major && n > 0 ? <text x={RX + 42} y={y + 11} fontFamily={MONO} fontWeight={600} fontSize={30} fill={on ? '#FFFFFF' : '#6A70C8'}>{n * 10}</text> : null}
                </g>
              );
            })}
            {/* layer ring that climbs the tower on "layers" */}
            {lyrQ > 0 && lyrQ < 1 ? (
              <polygon points={pts([iso(378 - 8, 462 + 8, lyrQ * tallH), iso(462 + 8, 462 + 8, lyrQ * tallH), iso(462 + 8, 378 - 8, lyrQ * tallH)])} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={Math.sin(lyrQ * Math.PI)} />
            ) : null}
            {/* riding counter tag */}
            <line x1={1484} y1={tallTopY} x2={RX + 34} y2={tallTopY} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="8 6" />
            <polygon points={`${RX + 36},${tallTopY} ${RX + 62},${tallTopY - 16} ${RX + 62},${tallTopY + 16}`} fill={MG} />
            <g transform={`translate(${RX + 62},${tallTopY - 78}) scale(${1 + 0.1 * Math.sin(Math.PI * clamp01((t - T.high) / 8))})`}>
              <rect x={5} y={9} width={356} height={156} rx={26} fill="#000" opacity={0.45} />
              <rect width={356} height={156} rx={26} fill="url(#tw-tag)" stroke={MG} strokeWidth={3.5} />
              <rect x={4} y={4} width={348} height={62} rx={22} fill="#FFFFFF" opacity={0.07} />
              <text x={178} y={100} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={104} fill="#FFFFFF" style={{fontVariantNumeric: 'tabular-nums'}}>
                {layersNow}{g >= 1 && t >= T.layers ? '+' : ''}
              </text>
              <text x={178} y={138} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={MG} letterSpacing={7}>LAYERS HIGH</text>
            </g>
          </g>
        ) : null}
        <Burst t={t} at={T.high} x={1400} y={tallTopY - 34} color="#FFD0F0" n={18} r={150} />
        <Ripple t={t} at={T.n300} x={1400} y={1330} color={MG} r={260} />
        <Ripple t={t} at={T.towers} x={1400} y={1320} color={CY} r={900} />
      </g>

      {/* chip label (appears on the pull-back) */}
      {lblP > 0.01 ? (
        <g opacity={lblP}>
          <path d={`M1060 1560V1590H${1060 + 500 * lblP}`} fill="none" stroke={CY} strokeWidth={4} />
          <text x={1066} y={1650} fontFamily={MONO} fontWeight={600} fontSize={50} fill={CY} letterSpacing={6}>NAND CHIP</text>
        </g>
      ) : null}

      {/* the fingertip, for scale */}
      {fingP > 0.01 ? (
        <g>
          <g transform={`translate(${fx + 70},${fy + 90}) rotate(-24.8)`} opacity={0.55} filter="url(#tw-soft)"><path d={fingerPath} fill="#000" /></g>
          <g transform={`translate(${fx},${fy}) rotate(-24.8)`}>
            <path d={fingerPath} fill="url(#tw-finger)" />
            <path d={fingerPath} fill="url(#tw-fingertip)" />
            <path d={fingerPath} fill="none" stroke="url(#tw-rim)" strokeWidth={7} opacity={0.85} />
            {[1180, 1250, 1330].map((y, n) => <path key={n} d={`M${-360 + n * 30} ${y}Q0 ${y + 70 - n * 20} ${360 - n * 30} ${y}`} fill="none" stroke="#1B1244" strokeWidth={9} opacity={0.6} strokeLinecap="round" />)}
            {/* nail */}
            <path d={nailPath} transform="translate(8,12)" fill="#120A30" opacity={0.6} />
            <path d={nailPath} fill="url(#tw-nail)" />
            <g clipPath="url(#tw-nailclip)">
              <ellipse cx={0} cy={420} rx={250} ry={150} fill="#FFFFFF" opacity={0.28} />
              <path d="M -330 -230 C -200 -330 200 -330 330 -230 L 330 -420 L -330 -420 Z" fill="#FFFFFF" opacity={0.55} />
              <path d="M -210 -170 C -235 -20 -230 140 -200 270 L -150 270 C -180 140 -180 -20 -150 -170 Z" fill="#FFFFFF" opacity={0.5} />
              <ellipse cx={120} cy={-40} rx={110} ry={300} fill="#FFFFFF" opacity={0.1} />
            </g>
            <path d={nailPath} fill="none" stroke="#EDE3FF" strokeWidth={5} opacity={0.9} />
            {/* nail width bracket */}
            <g opacity={lblP}>
              <path d={`M-300 500V540H${-300 + 600 * lblP}V500`} fill="none" stroke={MG} strokeWidth={6} />
              <text x={0} y={640} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={66} fill="#FFD0F0" letterSpacing={8}>FINGERNAIL</text>
            </g>
          </g>
          <Ripple t={t} at={T.nail + 3} x={fx + fd[0] * 470} y={fy + fd[1] * 470} color={CY} r={300} />
        </g>
      ) : null}
      <Burst t={t} at={T.nail} x={PIV[0]} y={PIV[1] - 40} color={CY} n={14} r={360} />
    </svg>
  );
};

export const towersWorld: WorldDef = {
  id: 'towers',
  home: 'city',
  anchors: {
    city: {x: 1400, y: 1330, zoom: 0.82},
    edge: {x: 1820, y: 1500, zoom: 1.15},
    flat: {x: 1440, y: 1650, zoom: 1.45},
    stack: {x: 1400, y: 1290, zoom: 1.02},
    cells: {x: 1370, y: 1600, zoom: 2.1},
    towers: {x: 1400, y: 1240, zoom: 0.66},
    counter: {x: 1540, y: 880, zoom: 1.02},
    layers: {x: 1610, y: 640, zoom: 1.4},
    high: {x: 1570, y: 520, zoom: 1.1},
    chip: {x: 1400, y: 1300, zoom: 0.82},
    fingernail: {x: 1610, y: 1690, zoom: 0.74},
  },
  aliases: {stopped: 'edge', building: 'city', '300': 'counter', over: 'counter', nail: 'fingernail', finger: 'fingernail', tower: 'towers', layer: 'layers', cell: 'cells'},
  palette: {bg0: '#04020E', bg1: '#1A1148', particles: '#CBBBFF', glow: '#7C5CFF'},
  Draw,
};
