// S06 "controller" world: top-down drive board as an air-traffic interchange. A photo flies up the host bus into the
// controller hub, the 8-core processor lights, the photo is cut into 8 pages that race down 8 gold data highways to
// 8 NAND chips, all written in parallel, then the flow reverses and a speed counter lands on 7,450 MB/s.
// Mood: deep emerald PCB, gold traces, amber data, mint "written". Everything is a pure function of t.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, pulseOn, Burst, Ripple} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp, mix} from '../../../src/kit/explainer/tokens';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const inOut = (q: number) => {
  const x = clamp01(q);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const outCubic = (q: number) => 1 - Math.pow(1 - clamp01(q), 3);

const HX = 1200, HY = 1600;
const AMB = '#FFC857', GOLD = '#C9A24A', MINT = '#5CFFC2', HOT = '#FFF1C9';
const CW = 400, CHH = 290;                     // NAND package size
const PW = 320, PH = 400, TW = 160, TH = 100;  // photo and page tile size

type Chip = {k: number; x: number; y: number; d: [number, number]; S: [number, number]; E: [number, number]; P: [number, number]};
const CHIPS: Chip[] = Array.from({length: 8}).map((_, k) => {
  const a = ((22.5 + 45 * k) * Math.PI) / 180;
  const x = HX + 800 * Math.cos(a), y = HY + 1050 * Math.sin(a);
  const L = Math.hypot(x - HX, y - HY), d: [number, number] = [(x - HX) / L, (y - HY) / L];
  const edge = Math.min(CW / 2 / Math.abs(d[0]), CHH / 2 / Math.abs(d[1]));
  return {k, x, y, d, S: [HX + d[0] * 262, HY + d[1] * 262], E: [x - d[0] * (edge - 10), y - d[1] * (edge - 10)], P: [HX + d[0] * 400, HY + d[1] * 400]};
});
const TILE2CHIP = [5, 6, 4, 7, 3, 0, 2, 1];    // tile (row*2+col) -> chip, so pages fly out without crossing

const T0 = (beats: WorldDrawProps['beats']) => {
  const ph = beats.filter((b) => b.word === 'photo').map((b) => b.t);
  return {
    photo: ph[0] ?? 17.5, reaches: wordAt(beats, 'reaches', 25), ctrl: wordAt(beats, 'controller', 36.5), drives: wordAt(beats, "drive's", 57),
    own: wordAt(beats, 'own', 67.5), tiny: wordAt(beats, 'tiny', 75), proc: wordAt(beats, 'processor', 83.5), splits: wordAt(beats, 'splits', 125.5),
    photo2: ph[1] ?? 137.5, pages: wordAt(beats, 'pages', 152), spreads: wordAt(beats, 'spreads', 172), across: wordAt(beats, 'across', 186),
    every: wordAt(beats, 'every', 196.5), chip: wordAt(beats, 'chip', 205), once: wordAt(beats, 'once', 214.5), writes: wordAt(beats, 'writes', 236),
    parallel: wordAt(beats, 'parallel', 251.5), how: wordAt(beats, 'how', 297.5), fast: wordAt(beats, 'fast', 304), reads: wordAt(beats, 'reads', 319.5),
    n7000: wordAt(beats, '7000', 338.5), mb: wordAt(beats, 'megabytes', 356), per: wordAt(beats, 'per', 368.5), second: wordAt(beats, 'second', 374),
  };
};

/** the photo: a sunset over a mountain lake, 320 x 400 */
const PhotoArt: React.FC = () => (
  <g>
    <rect width={PW} height={PH} fill="url(#ct-sky)" />
    <circle cx={206} cy={176} r={92} fill="#FFE9A8" opacity={0.25} />
    <circle cx={206} cy={176} r={50} fill="#FFF6D6" />
    <path d="M0 250L60 170L104 214L170 120L236 206L276 168L320 226V300H0Z" fill="#5A3C9E" />
    <path d="M170 120L196 154L176 150L160 168L150 146Z" fill="#F3D9FF" opacity={0.8} />
    <path d="M0 290L50 236L96 268L150 220L214 276L270 240L320 280V320H0Z" fill="#2B1F66" />
    <rect y={300} width={PW} height={100} fill="url(#ct-lake)" />
    <rect x={176} y={308} width={60} height={5} rx={2.5} fill="#FFE9A8" opacity={0.9} />
    <rect x={160} y={326} width={92} height={5} rx={2.5} fill="#FFE9A8" opacity={0.6} />
    <rect x={186} y={346} width={44} height={5} rx={2.5} fill="#FFE9A8" opacity={0.4} />
    <rect x={150} y={368} width={110} height={5} rx={2.5} fill="#FFE9A8" opacity={0.25} />
  </g>
);

/** a data highway: dark channel, gold rails, lanes and flowing light */
const Highway: React.FC<{a: [number, number]; b: [number, number]; w: number; lanes: number; flow: number; flowOp: number; glow: number; id: string}> = ({a, b, w, lanes, flow, flowOp, glow}) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / L, dy = (b[1] - a[1]) / L, nx = -dy, ny = dx;
  const off = (o: number) => ({x1: a[0] + nx * o, y1: a[1] + ny * o, x2: b[0] + nx * o, y2: b[1] + ny * o});
  const ls: React.ReactNode[] = [];
  for (let i = 0; i < lanes; i++) {
    const o = (i - (lanes - 1) / 2) * (w * 0.72 / (lanes - 1));
    ls.push(<line key={'l' + i} {...off(o)} stroke="#D9B45E" strokeWidth={4.5} opacity={0.8} />);
    ls.push(<line key={'h' + i} {...off(o - 1.2)} stroke="#F6E2A6" strokeWidth={1.2} opacity={0.45} />);
    if (flowOp > 0.02) ls.push(<line key={'f' + i} {...off(o)} stroke={i % 2 ? HOT : AMB} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${26 + (i % 3) * 14} ${96 + (i % 2) * 40}`}
                                     strokeDashoffset={-flow * (1 + (i % 3) * 0.22) - i * 37} opacity={flowOp} />);
  }
  return (
    <g>
      <line {...off(0)} stroke="#000" strokeWidth={w + 26} opacity={0.35} />
      <line {...off(0)} stroke="#04140F" strokeWidth={w + 10} />
      <line {...off(0)} stroke={AMB} strokeWidth={w + 10} opacity={0.06 + 0.22 * glow} />
      <line {...off(w / 2 + 5)} stroke="#E7CB7C" strokeWidth={3} opacity={0.85} />
      <line {...off(-w / 2 - 5)} stroke="#E7CB7C" strokeWidth={3} opacity={0.85} />
      {ls}
    </g>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const T = T0(beats);
  const pulse = pulseOn(t, beats);
  const procP = sp(t, T.proc, 'pop');
  const ctrlFlash = t >= T.ctrl ? Math.exp(-(t - T.ctrl) / 8) : 0;
  const boardOn = sp(t, T.drives, 'settle');

  // ---- highway flow (integral of a piecewise speed, + = hub -> chip) ---------------------------------------------
  const segs: [number, number, number][] = [[T.spreads, T.writes, 11], [T.writes, T.parallel + 10, 15], [T.how, T.fast, -9], [T.fast, T.reads, -17], [T.reads, 9999, -27]];
  let flow = 0;
  for (const [a, b, v] of segs) if (t > a) flow += (Math.min(t, b) - a) * v;
  const outOp = sp(t, T.spreads, 'settle') * (1 - sp(t, T.parallel + 8, 'settle'));
  const inOp = sp(t, T.how, 'settle');
  const flowOp = Math.max(outOp, inOp);
  const hostUp = clamp01((t - T.reaches) / 4) * clamp01(1 - (t - T.ctrl - 4) / 10);
  const hostDown = sp(t, T.reads, 'settle');
  const hostFlow = t < T.how ? -(t - T.reaches) * 26 : (t - T.reads) * 30;

  // ---- photo card ------------------------------------------------------------------------------------------------------
  const enter = outCubic((t - 1) / 13), popP = sp(t, T.photo, 'bouncy');
  const fly = inOut((t - T.reaches) / (T.ctrl - T.reaches + 1.5));
  const absorb = clamp01((t - T.ctrl - 3) / 9);
  const photoY = lerp(lerp(3500, 2740, enter), HY, fly);
  const photoS = lerp(1.12 + 0.12 * popP, 0.92, fly) * (1 - 0.85 * absorb);
  const photoOp = 1 - absorb;
  const emerge = sp(t, T.splits - 7, 'pop');
  const splitP = sp(t, T.splits, 'pop'), split2 = sp(t, T.photo2, 'pop'), pageP = sp(t, T.pages, 'bouncy');
  const travel = inOut((t - T.spreads - 1) / 31);
  const writeQ = clamp01((t - T.writes) / 15);
  const doneP = sp(t, T.parallel, 'bouncy');
  const readOut = sp(t, T.how, 'settle');

  const tiles = t >= T.splits - 7 ? Array.from({length: 8}).map((_, n) => {
    const col = n % 2, row = Math.floor(n / 2), c = CHIPS[TILE2CHIP[n]];
    const gap = 1 + 0.16 * splitP + 0.2 * split2;
    const gx = HX + (col - 0.5) * TW * gap, gy = HY + (row - 1.5) * TH * gap;
    const px = lerp(lerp(gx, c.P[0], pageP), c.x, travel), py = lerp(lerp(gy, c.P[1], pageP), c.y - 4, travel);
    const s = (0.2 + 0.8 * emerge) * lerp(1, 1.0, pageP) * (1 + 0.45 * Math.sin(Math.PI * Math.min(travel, 0.5)) - 0.1 * travel);
    const rot = (rnd(n * 3.1) - 0.5) * 10 * splitP * (1 - pageP);
    const op = clamp01(emerge * 1.5) * (1 - 0.9 * writeQ);
    const moving = Math.sin(Math.PI * travel);
    return {n, col, row, c, px, py, s, rot, op, moving};
  }) : [];

  return (
    <svg width={2400} height={3800} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="ct-board" gradientUnits="userSpaceOnUse" cx={HX} cy={HY} r={1700}>
          <stop offset="0" stopColor="#1A6351" /><stop offset="0.45" stopColor="#0F4337" /><stop offset="1" stopColor="#07251E" />
        </radialGradient>
        <pattern id="ct-traces" width={220} height={220} patternUnits="userSpaceOnUse">
          <path d="M0 30H60L90 60H150L180 30H220M0 110H40L70 140H130L160 110H220M0 190H100L130 160H220M30 0V50L60 80V150L30 180V220M110 0V20L140 50V110M190 0V90L160 120V220" fill="none" stroke={GOLD} strokeWidth={3} opacity={0.6} />
          <path d="M0 70H30M80 100H120L140 120M150 200H200" fill="none" stroke="#1F6B58" strokeWidth={6} opacity={0.6} />
          {[[60, 30], [150, 60], [70, 140], [130, 160], [140, 50], [30, 180], [190, 90], [110, 20]].map(([x, y], i) => (
            <g key={i}><circle cx={x} cy={y} r={7} fill="#E0BD67" /><circle cx={x} cy={y} r={3} fill="#06201A" /></g>
          ))}
        </pattern>
        <pattern id="ct-cells" width={13} height={12.4} patternUnits="userSpaceOnUse"><rect x={1.5} y={1.5} width={10} height={9.4} rx={2} fill={MINT} /></pattern>
        <pattern id="ct-cellsdim" width={13} height={12.4} patternUnits="userSpaceOnUse"><rect x={1.5} y={1.5} width={10} height={9.4} rx={2} fill="#123A31" /></pattern>
        <pattern id="ct-die" width={14} height={14} patternUnits="userSpaceOnUse"><path d="M0 0.5H14M0.5 0V14" stroke="#1A0E02" strokeWidth={1} /><rect x={5} y={5} width={3} height={3} fill="#FFE2A0" opacity={0.5} /></pattern>
        <pattern id="ct-brush" width={8} height={5} patternUnits="userSpaceOnUse"><rect width={8} height={1} fill="#FFFFFF" opacity={0.07} /></pattern>
        <linearGradient id="ct-lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#DCE6E2" /><stop offset="0.3" stopColor="#8B9A95" /><stop offset="0.55" stopColor="#B9C6C1" /><stop offset="1" stopColor="#4B5955" /></linearGradient>
        <linearGradient id="ct-epoxy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#343A3B" /><stop offset="0.45" stopColor="#1A1E1F" /><stop offset="1" stopColor="#0A0C0D" /></linearGradient>
        <linearGradient id="ct-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBE7AE" /><stop offset="0.5" stopColor="#D1AB52" /><stop offset="1" stopColor="#7A5E1E" /></linearGradient>
        <linearGradient id="ct-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A2B9C" /><stop offset="0.38" stopColor="#D85C9A" /><stop offset="0.62" stopColor="#FF9A5C" /><stop offset="0.78" stopColor="#FFD37A" /></linearGradient>
        <linearGradient id="ct-lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E0709A" /><stop offset="0.3" stopColor="#5B3FA8" /><stop offset="1" stopColor="#1E1A5C" /></linearGradient>
        <radialGradient id="ct-pool" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={AMB} stopOpacity={0.55} /><stop offset="0.4" stopColor="#FF9D3C" stopOpacity={0.16} /><stop offset="1" stopColor="#FF9D3C" stopOpacity={0} /></radialGradient>
        <radialGradient id="ct-mintpool" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={MINT} stopOpacity={0.5} /><stop offset="1" stopColor={MINT} stopOpacity={0} /></radialGradient>
        <radialGradient id="ct-core" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.4" stopColor={AMB} /><stop offset="1" stopColor="#FF8A1F" /></radialGradient>
        <linearGradient id="ct-trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={AMB} stopOpacity={0} /><stop offset="1" stopColor={HOT} stopOpacity={0.9} /></linearGradient>
        <clipPath id="ct-tileclip"><rect width={TW} height={TH} rx={9} /></clipPath>
        <clipPath id="ct-photoclip"><rect width={PW} height={PH} rx={14} /></clipPath>
      </defs>

      {/* host side: socket + host traces below the board (where the photo comes from) */}
      <g>
        {Array.from({length: 13}).map((_, i) => {
          const x = 760 + i * 73.3;
          return (
            <g key={i}>
              <line x1={x} y1={3180} x2={x + (i - 6) * 26} y2={3900} stroke="#0D3A30" strokeWidth={14} />
              <line x1={x} y1={3180} x2={x + (i - 6) * 26} y2={3900} stroke={GOLD} strokeWidth={4} opacity={0.5} />
              <line x1={x} y1={3180} x2={x + (i - 6) * 26} y2={3900} stroke={HOT} strokeWidth={5} strokeLinecap="round" strokeDasharray="30 130" strokeDashoffset={(t < T.how ? t * 16 : -t * 26) + i * 53} opacity={0.75} />
            </g>
          );
        })}
        <rect x={610} y={3096} width={1180} height={150} rx={18} fill="#000" opacity={0.5} transform="translate(10,16)" />
        <rect x={610} y={3096} width={1180} height={150} rx={18} fill="url(#ct-epoxy)" stroke="#59625F" strokeWidth={3} />
        <rect x={640} y={3120} width={1120} height={40} rx={8} fill="#050707" />
        {Array.from({length: 30}).map((_, i) => <rect key={i} x={652 + i * 37} y={3170} width={20} height={56} rx={3} fill="url(#ct-gold)" opacity={0.9} />)}
        <text x={1200} y={3290} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={30} fill="#7FA89B" letterSpacing={10}>HOST · PCIe x4</text>
      </g>

      {/* the board */}
      <rect x={120} y={300} width={2160} height={2760} rx={70} fill="#000" opacity={0.55} transform="translate(18,30)" />
      <rect x={120} y={300} width={2160} height={2760} rx={70} fill="url(#ct-board)" stroke="#2C8A72" strokeWidth={5} />
      <rect x={120} y={300} width={2160} height={2760} rx={70} fill="url(#ct-traces)" />
      <rect x={146} y={326} width={2108} height={2708} rx={52} fill="none" stroke="#E7CB7C" strokeWidth={2} opacity={0.3 + 0.5 * boardOn * (0.6 + 0.4 * Math.sin(t * 0.3))} />
      {/* gold fingers into the socket */}
      <rect x={690} y={3050} width={1020} height={90} fill="#0A2A23" />
      {Array.from({length: 24}).map((_, i) => <rect key={i} x={704 + i * 41.5} y={3056} width={26} height={78} rx={4} fill="url(#ct-gold)" />)}
      {/* mount holes + silk */}
      {[[230, 410], [2170, 410], [230, 2950], [2170, 2950]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r={46} fill="url(#ct-gold)" /><circle cx={x} cy={y} r={30} fill="#020807" /><circle cx={x} cy={y} r={46} fill="none" stroke="#FFF2C4" strokeWidth={2} opacity={0.5} /></g>
      ))}
      <text x={330} y={430} fontFamily={MONO} fontWeight={600} fontSize={34} fill="#CFE6DD" opacity={0.6} letterSpacing={6}>SSD-2280 · REV 4.1</text>
      <text x={2070} y={430} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={34} fill="#CFE6DD" opacity={0.6} letterSpacing={6}>8 CH NAND BUS</text>

      {/* radar rings + sweep around the hub (air-traffic control) */}
      <g transform={`translate(${HX},${HY}) scale(1,1.3125)`} opacity={0.5 + 0.3 * boardOn}>
        {[400, 600, 800].map((r, i) => <circle key={i} r={r} fill="none" stroke={i === 2 ? AMB : '#7FE0C0'} strokeWidth={2.5} strokeDasharray={i === 2 ? '4 16' : '2 12'} opacity={0.5} />)}
        <g transform={`rotate(${t * 4.2})`}>
          {Array.from({length: 9}).map((_, i) => <line key={i} x1={0} y1={0} x2={800} y2={0} transform={`rotate(${-i * 3})`} stroke={AMB} strokeWidth={5} opacity={0.3 * (1 - i / 9)} />)}
        </g>
      </g>
      <circle cx={HX} cy={HY} r={760} fill="url(#ct-pool)" opacity={0.3 + 0.3 * procP + 0.4 * ctrlFlash + 0.12 * pulse} />

      {/* host bus (bottom) + 8 data highways */}
      <Highway id="host" a={[HX, 3052]} b={[HX, HY + 262]} w={108} lanes={7} flow={hostFlow} flowOp={Math.max(hostUp, hostDown)} glow={Math.max(hostUp, hostDown * 0.7)} />
      {CHIPS.map((c) => <Highway key={c.k} id={'h' + c.k} a={c.S} b={c.E} w={66} lanes={5} flow={flow} flowOp={flowOp} glow={flowOp * (0.5 + 0.5 * pulse)} />)}
      {CHIPS.map((c) => {
        const mx = lerp(c.S[0], c.E[0], 0.6) - c.d[1] * 62, my = lerp(c.S[1], c.E[1], 0.6) + c.d[0] * 62;
        return <text key={c.k} x={mx} y={my + 9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill="#CFE6DD" opacity={0.65}>CH{c.k}</text>;
      })}

      {/* NAND chips */}
      {CHIPS.map((c) => {
        const on = sp(t, T.drives + c.k * 1.4, 'pop');
        const arrive = clamp01((travel - 0.9) / 0.1);
        const busy = arrive * (1 - doneP);
        const every = t >= T.every ? Math.exp(-(t - T.every) / 7) : 0, once = t >= T.once ? Math.exp(-(t - T.once) / 7) : 0;
        const rd = readOut * (0.6 + 0.4 * Math.sin(t * 0.9 + c.k));
        return (
          <g key={c.k} transform={`translate(${c.x},${c.y})`}>
            <circle r={330} fill="url(#ct-mintpool)" opacity={0.5 * doneP * (1 - 0.5 * readOut) + 0.25 * rd} />
            <circle r={330} fill="url(#ct-pool)" opacity={0.5 * busy + 0.6 * every + 0.7 * once} />
            {/* decoupling caps */}
            {[[-150, -190], [-90, -190], [90, 190], [150, 190]].map(([x, y], i) => (
              <g key={i}><rect x={x - 22} y={y - 13} width={44} height={26} rx={3} fill="#C9B38A" /><rect x={x - 22} y={y - 13} width={11} height={26} rx={2} fill="#E9EEF0" /><rect x={x + 11} y={y - 13} width={11} height={26} rx={2} fill="#E9EEF0" /></g>
            ))}
            <rect x={-CW / 2 + 12} y={-CHH / 2 + 18} width={CW} height={CHH} rx={16} fill="#000" opacity={0.55} />
            {/* pads */}
            {Array.from({length: 11}).map((_, i) => (
              <g key={i}>
                <rect x={-CW / 2 - 14} y={-CHH / 2 + 22 + i * 23} width={22} height={13} rx={2} fill="url(#ct-gold)" />
                <rect x={CW / 2 - 8} y={-CHH / 2 + 22 + i * 23} width={22} height={13} rx={2} fill="url(#ct-gold)" />
              </g>
            ))}
            <rect x={-CW / 2 - 7} y={-CHH / 2 - 7} width={CW + 14} height={CHH + 14} rx={21} fill="none" stroke={doneP > 0.5 ? MINT : AMB} strokeWidth={5} opacity={Math.max(0.55 * on * (1 - arrive), busy, 0.8 * doneP)} />
            <rect x={-CW / 2} y={-CHH / 2} width={CW} height={CHH} rx={16} fill="url(#ct-epoxy)" stroke="#7C8784" strokeWidth={2.5} />
            <path d={`M${-CW / 2 + 16} ${-CHH / 2 + 6}H${CW / 2 - 16}`} stroke="#FFFFFF" strokeWidth={2} opacity={0.3} />
            <polygon points={`${-CW / 2 + 10},${-CHH / 2 + 10} ${-CW / 2 + 190},${-CHH / 2 + 10} ${-CW / 2 + 60},${CHH / 2 - 10} ${-CW / 2 + 10},${CHH / 2 - 10}`} fill="#FFFFFF" opacity={0.045} />
            <circle cx={-CW / 2 + 30} cy={CHH / 2 - 30} r={9} fill="#0A0C0D" stroke="#6B7572" strokeWidth={2} />
            <text x={-CW / 2 + 26} y={-CHH / 2 + 46} fontFamily={MONO} fontWeight={600} fontSize={27} fill="#AEB8B5" letterSpacing={3}>3D NAND</text>
            <text x={CW / 2 - 58} y={CHH / 2 - 22} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={22} fill="#7B8683" letterSpacing={2}>U{c.k + 1} · 512Gb</text>
            {/* status LED */}
            <circle cx={CW / 2 - 34} cy={-CHH / 2 + 36} r={22} fill={doneP > 0.5 ? MINT : AMB} opacity={0.25 * Math.max(on * 0.5, busy, doneP)} />
            <circle cx={CW / 2 - 34} cy={-CHH / 2 + 36} r={9} fill={doneP > 0.5 ? MINT : busy > 0.3 || on > 0.5 ? AMB : '#2A3432'} />
            {/* cell array window */}
            <rect x={-136} y={-70} width={272} height={136} rx={10} fill="#040908" stroke={mix('#3D4744', doneP > 0.5 ? MINT : AMB, Math.max(busy, doneP))} strokeWidth={3} />
            <rect x={-130} y={-62} width={260} height={124} fill="url(#ct-cellsdim)" />
            {writeQ > 0 ? <rect x={-130} y={-62} width={260 * writeQ} height={124} fill="url(#ct-cells)" opacity={0.95 - 0.25 * readOut * Math.sin(t * 0.8 + c.k)} /> : null}
            {writeQ > 0 && writeQ < 1 ? <rect x={-130 + 260 * writeQ - 5} y={-66} width={8} height={132} fill="#FFFFFF" /> : null}
            {/* done check */}
            {doneP > 0.01 ? (
              <g transform={`translate(${CW / 2 - 8},${CHH / 2 - 8}) scale(${doneP})`}>
                <circle r={36} fill="#06251C" stroke={MINT} strokeWidth={5} /><path d="M-16 0L-4 12L17 -12" fill="none" stroke={MINT} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : null}
          </g>
        );
      })}

      {/* the controller hub */}
      <g transform={`translate(${HX},${HY})`}>
        <rect x={-270} y={-270} width={540} height={540} rx={34} fill="#000" opacity={0.6} transform="translate(16,24)" />
        <rect x={-270} y={-270} width={540} height={540} rx={34} fill="#0A211C" stroke="#2C8A72" strokeWidth={3} />
        {Array.from({length: 4}).map((_, s) => (
          <g key={s} transform={`rotate(${s * 90})`}>
            {Array.from({length: 17}).map((_, i) => <circle key={i} cx={-232 + i * 29} cy={-246} r={8} fill="url(#ct-gold)" />)}
          </g>
        ))}
        <rect x={-222} y={-222} width={444} height={444} rx={26} fill={AMB} opacity={0.25 + 0.6 * ctrlFlash + 0.3 * procP} transform="scale(1.03)" />
        <rect x={-216} y={-216} width={432} height={432} rx={24} fill="url(#ct-lid)" stroke="#EEF5F2" strokeWidth={2} />
        <rect x={-216} y={-216} width={432} height={432} rx={24} fill="url(#ct-brush)" />
        {[[-186, -186], [186, -186], [-186, 186], [186, 186]].map(([x, y], i) => (
          <g key={i}><circle cx={x} cy={y} r={15} fill="#5A6863" stroke="#E6EFEC" strokeWidth={2} /><path d={`M${x - 8} ${y - 8}L${x + 8} ${y + 8}M${x + 8} ${y - 8}L${x - 8} ${y + 8}`} stroke="#2E3936" strokeWidth={3} /></g>
        ))}
        <text x={0} y={-166} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={25} fill="#1E2A27" letterSpacing={7} opacity={0.85 * (1 - procP)}>NVMe · 8-CHANNEL</text>
        <text x={0} y={190} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={37} fill="#1E2A27" letterSpacing={7} opacity={0.9}>CONTROLLER</text>
        {/* processor die window: grows when "processor" is said, 8 cores light in sequence */}
        {(() => {
          const w = lerp(250, 348, procP), h = lerp(190, 300, procP), cy = lerp(-10, -24, procP);
          const cw = (w - 30) / 4, ch = (h - 30) / 2;
          return (
            <g transform={`translate(0,${cy})`}>
              <rect x={-w / 2 - 12} y={-h / 2 - 12} width={w + 24} height={h + 24} rx={14} fill="#2A3431" stroke="#F1F7F5" strokeWidth={2} />
              {Array.from({length: 44}).map((_, i) => {
                const side = i % 4, q = Math.floor(i / 4), f = (q + 0.5) / 11;
                const x = side < 2 ? lerp(-w / 2, w / 2, f) : side === 2 ? -w / 2 - 6 : w / 2 + 6, y = side < 2 ? (side ? h / 2 + 6 : -h / 2 - 6) : lerp(-h / 2, h / 2, f);
                return <rect key={i} x={x - (side < 2 ? 3 : 5)} y={y - (side < 2 ? 5 : 3)} width={side < 2 ? 6 : 10} height={side < 2 ? 10 : 6} fill="url(#ct-gold)" />;
              })}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="#04100D" stroke={GOLD} strokeWidth={3} />
              {Array.from({length: 8}).map((_, m) => {
                const col = m % 4, row = Math.floor(m / 4);
                const x = -w / 2 + 9 + col * (cw + 4), y = -h / 2 + 9 + row * (ch + 4);
                const seq = sp(t, T.proc + m * 1.4, 'pop');
                const act = flowOp * (0.55 + 0.45 * Math.sin(t * 1.1 + m * 1.7));
                const lit = clamp01(0.1 + 0.5 * ctrlFlash + 0.75 * seq * (0.75 + 0.25 * Math.sin(t * 0.6 + m)) + 0.3 * act);
                return (
                  <g key={m}>
                    <rect x={x} y={y} width={cw} height={ch} rx={5} fill={mix('#0C211C', '#B55A0E', lit)} stroke={mix('#1F5A4A', HOT, lit)} strokeWidth={2} />
                    <rect x={x + cw * 0.2} y={y + ch * 0.2} width={cw * 0.6} height={ch * 0.6} rx={4} fill="url(#ct-core)" opacity={lit} />
                    <path d={`M${x + 5} ${y + ch * 0.12}H${x + cw - 5}M${x + 5} ${y + ch * 0.88}H${x + cw - 5}`} stroke={HOT} strokeWidth={1.5} opacity={0.25 + 0.5 * lit} />
                  </g>
                );
              })}
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill="url(#ct-die)" opacity={0.5} />
              <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={8} fill={AMB} opacity={0.05 * procP + 0.25 * ctrlFlash} />
              <polygon points={`${-w / 2 + 4},${-h / 2 + 4} ${-w / 2 + w * 0.42},${-h / 2 + 4} ${-w / 2 + w * 0.2},${h / 2 - 4} ${-w / 2 + 4},${h / 2 - 4}`} fill="#FFFFFF" opacity={0.07} />
              {procP > 0.01 ? <rect x={-w / 2 - 22} y={-h / 2 - 22} width={w + 44} height={h + 44} rx={20} fill="none" stroke={HOT} strokeWidth={4} strokeDasharray="26 18" strokeDashoffset={-t * 6} opacity={0.8 * procP} /> : null}
            </g>
          );
        })()}
        {/* "own": the hub is boxed out as the drive's own computer; "tiny": size ticks close in */}
        {(() => {
          const own = sp(t, T.own, 'pop') * clamp01(1 - (t - T.proc - 2) / 6), tiny = sp(t, T.tiny, 'pop');
          if (own <= 0.01) return null;
          const r = lerp(360, 292, own) - 22 * tiny;
          return (
            <g opacity={own}>
              {[0, 1, 2, 3].map((q) => <path key={q} transform={`rotate(${q * 90})`} d={`M${-r} ${-r + 70}V${-r}H${-r + 70}`} fill="none" stroke={HOT} strokeWidth={7} strokeLinecap="round" />)}
              <path d={`M${-r} ${r + 44}H${r}M${-r} ${r + 26}V${r + 62}M${r} ${r + 26}V${r + 62}`} stroke={AMB} strokeWidth={4} opacity={tiny} />
            </g>
          );
        })()}
      </g>
      <Ripple t={t} at={T.ctrl} x={HX} y={HY} color={AMB} r={520} />
      <Ripple t={t} at={T.proc} x={HX} y={HY} color={HOT} r={330} />
      <Ripple t={t} at={T.once} x={HX} y={HY} color={AMB} r={1300} />
      <Ripple t={t} at={T.parallel} x={HX} y={HY} color={MINT} r={1500} />
      <Burst t={t} at={T.ctrl} x={HX} y={HY} color={HOT} n={20} r={380} />

      {/* the photo card: flies up the host bus into the hub */}
      {photoOp > 0.01 ? (
        <g transform={`translate(${HX},${photoY}) scale(${photoS}) rotate(${-4 * (1 - fly) + 3 * Math.sin(t * 0.15) * (1 - fly)})`} opacity={clamp01(photoOp * 1.6)}>
          {fly > 0 && fly < 1 ? <rect x={-PW / 2 + 30} y={PH / 2 - 20} width={PW - 60} height={520 * Math.sin(Math.PI * fly)} fill={AMB} opacity={0.22} /> : null}
          <rect x={-PW / 2 - 14} y={-PH / 2 - 14} width={PW + 28} height={PH + 28} rx={24} fill="#000" opacity={0.5} transform="translate(14,22)" />
          <rect x={-PW / 2 - 14} y={-PH / 2 - 14} width={PW + 28} height={PH + 28} rx={24} fill="#F7F4EC" />
          <g transform={`translate(${-PW / 2},${-PH / 2})`} clipPath="url(#ct-photoclip)"><PhotoArt /><polygon points="0,0 150,0 40,400 0,400" fill="#FFFFFF" opacity={0.12} /></g>
          <rect x={-PW / 2 - 14} y={-PH / 2 - 14} width={PW + 28} height={PH + 28} rx={24} fill="none" stroke={AMB} strokeWidth={6} opacity={0.9 * Math.max(popP * (1 - fly), 0.3)} />
          <g opacity={popP * (1 - fly)}>
            <rect x={-150} y={PH / 2 + 34} width={300} height={62} rx={31} fill="#06201A" stroke={AMB} strokeWidth={3} />
            <text x={0} y={PH / 2 + 76} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={30} fill="#FFFFFF">IMG_0412.JPG</text>
          </g>
        </g>
      ) : null}

      {/* the photo re-emerges, is cut into 8 pages, and the pages race to the chips */}
      {tiles.map((q) => (
        <g key={'tr' + q.n}>
          {q.moving > 0.03 ? <line x1={q.px - q.c.d[0] * 380 * q.moving} y1={q.py - q.c.d[1] * 380 * q.moving} x2={q.px} y2={q.py} stroke={HOT} strokeWidth={56} strokeLinecap="butt" opacity={0.28 * q.moving} /> : null}
          {q.moving > 0.03 ? <line x1={q.px - q.c.d[0] * 520 * q.moving} y1={q.py - q.c.d[1] * 520 * q.moving} x2={q.px} y2={q.py} stroke={AMB} strokeWidth={14} strokeLinecap="round" opacity={0.6 * q.moving} /> : null}
        </g>
      ))}
      {tiles.map((q) => q.op > 0.02 ? (
        <g key={q.n} transform={`translate(${q.px},${q.py}) scale(${q.s}) rotate(${q.rot}) translate(${-TW / 2},${-TH / 2})`} opacity={q.op}>
          <rect x={6} y={10} width={TW} height={TH} rx={9} fill="#000" opacity={0.5} />
          <g clipPath="url(#ct-tileclip)"><g transform={`translate(${-q.col * TW},${-q.row * TH})`}><PhotoArt /></g></g>
          <rect width={TW} height={TH} rx={9} fill="none" stroke={mix('#F7F4EC', HOT, pageP)} strokeWidth={4 + 2 * pageP} />
          {splitP > 0.01 ? (
            <g opacity={clamp01(split2 + pageP)}>
              <rect x={-8} y={-12} width={58} height={36} rx={8} fill="#06201A" stroke={AMB} strokeWidth={2.5} />
              <text x={21} y={15} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={25} fill="#FFFFFF">P{q.n + 1}</text>
            </g>
          ) : null}
        </g>
      ) : null)}
      {/* cut lines flash on "splits" */}
      {t >= T.splits && t < T.splits + 9 ? (
        <g opacity={1 - (t - T.splits) / 9}>
          <line x1={HX} y1={HY - 300} x2={HX} y2={HY + 300} stroke="#FFFFFF" strokeWidth={7} />
          {[-1, 0, 1].map((r) => <line key={r} x1={HX - 250} y1={HY + r * TH * 1.1} x2={HX + 250} y2={HY + r * TH * 1.1} stroke="#FFFFFF" strokeWidth={7} />)}
        </g>
      ) : null}
      {t >= T.every ? CHIPS.map((c) => <Ripple key={c.k} t={t} at={T.every} x={c.x} y={c.y} color={AMB} r={330} />) : null}
      {t >= T.chip ? CHIPS.map((c) => <Burst key={c.k} t={t} at={T.chip - 1} x={c.x} y={c.y} color={HOT} n={10} r={230} />) : null}
    </svg>
  );
};

const Overlay: NonNullable<WorldDef['Overlay']> = ({t, beats, W, H, u}) => {
  const T = T0(beats);
  if (t < T.reads) return null;
  const inP = sp(t, T.n7000 - 2, 'pop');
  const streak = sp(t, T.reads, 'settle');
  const q = outCubic((t - T.n7000) / 22);
  const val = Math.round(7450 * q);
  const txt = val >= 1000 ? `${Math.floor(val / 1000)},${String(val % 1000).padStart(3, '0')}` : String(val);
  const land = t >= T.n7000 + 22 ? Math.exp(-(t - T.n7000 - 22) / 5) : 0;
  const mbP = sp(t, T.mb, 'bouncy'), perP = sp(t, T.per, 'pop'), secQ = clamp01((t - T.per) / (T.second - T.per + 4)), secP = sp(t, T.second + 3, 'bouncy');
  const secFlash = t >= T.second ? Math.exp(-(t - T.second) / 6) : 0;
  const cy = H * 0.455, pw = 930 * u, ph = 500 * u;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 90% 34% at 50% 45%, rgba(1,10,8,${0.72 * inP}) 0%, rgba(1,10,8,${0.5 * inP}) 60%, rgba(1,10,8,0) 100%)`}} />
      {/* speed streaks */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs><linearGradient id="ct-streak" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={HOT} stopOpacity={0} /><stop offset="0.8" stopColor={AMB} stopOpacity={0.9} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={1} /></linearGradient></defs>
        {Array.from({length: 34}).map((_, i) => {
          const len = (160 + rnd(i * 3.3) * 420) * u, sp0 = (60 + rnd(i * 7.1) * 90) * u * (0.5 + 0.9 * q + 0.3 * inP);
          const span = W + len * 2;
          const x = ((rnd(i * 1.7) * span + t * sp0) % span) - len;
          const band = i % 3 === 0 ? 0.24 + rnd(i * 5.9) * 0.44 : rnd(i * 5.9) < 0.5 ? 0.25 + rnd(i * 2.9) * 0.07 : 0.6 + rnd(i * 2.9) * 0.1;
          return <rect key={i} x={x} y={H * band} width={len} height={(2 + rnd(i * 9.3) * 5) * u} rx={3 * u} fill="url(#ct-streak)" opacity={streak * (0.25 + 0.6 * rnd(i * 4.4)) * (i % 3 === 0 ? 0.5 : 1)} />;
        })}
      </svg>
      {inP > 0.01 ? (
        <div style={{position: 'absolute', left: W / 2 - pw / 2, top: cy - ph / 2, width: pw, height: ph, opacity: clamp01(inP * 1.5),
                     transform: `scale(${(0.7 + 0.3 * inP) * (1 + 0.05 * land + 0.04 * secFlash)})`, borderRadius: 46 * u,
                     background: 'linear-gradient(160deg, rgba(20,58,48,0.94) 0%, rgba(5,22,18,0.96) 55%, rgba(12,40,33,0.94) 100%)',
                     border: `${3 * u}px solid rgba(255,200,87,${0.55 + 0.45 * Math.max(land, secFlash)})`,
                     boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.7), 0 0 ${(60 + 90 * Math.max(land, secFlash)) * u}px rgba(255,170,60,${0.3 + 0.4 * Math.max(land, secFlash)}), inset 0 ${2 * u}px 0 rgba(255,255,255,0.18)`}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 34 * u, textAlign: 'center', fontFamily: MONO, fontWeight: 600, fontSize: 30 * u, letterSpacing: `${0.3}em`, color: '#8FE8C8'}}>SEQUENTIAL READ</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 78 * u, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 236 * u, lineHeight: `${250 * u}px`,
                       fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', transform: `skewX(-7deg) translateX(${-10 * u}px)`,
                       background: 'linear-gradient(180deg,#FFFFFF 18%,#FFE7A6 50%,#FFB13B 86%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                       filter: `drop-shadow(0 0 ${(18 + 30 * land) * u}px rgba(255,176,59,0.75))${q < 0.98 ? ` blur(${(1 - q) * 3 * u}px)` : ''}`}}>{txt}</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 318 * u, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 16 * u, fontFamily: FONT, fontWeight: 800}}>
            <span style={{fontSize: 74 * u, color: mbP > 0.5 ? '#FFFFFF' : '#9DB5AD', transform: `scale(${1 + 0.18 * Math.sin(Math.PI * clamp01((t - T.mb) / 9))})`, display: 'inline-block', textShadow: `0 0 ${24 * u * mbP}px rgba(255,200,87,0.9)`}}>MB</span>
            <span style={{fontSize: 74 * u, color: perP > 0.5 ? AMB : '#56706A'}}>/</span>
            <span style={{fontSize: 74 * u, color: secP > 0.5 ? '#FFFFFF' : '#9DB5AD', transform: `scale(${1 + 0.25 * secFlash})`, display: 'inline-block', textShadow: `0 0 ${24 * u * secP}px rgba(255,200,87,0.9)`}}>s</span>
          </div>
          {/* speed bar */}
          <div style={{position: 'absolute', left: 60 * u, right: 60 * u, bottom: 46 * u, height: 22 * u, borderRadius: 11 * u, background: '#03100D', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)', overflow: 'hidden'}}>
            <div style={{width: `${q * 93}%`, height: '100%', borderRadius: 11 * u, background: `linear-gradient(90deg,#2FD6A0,${AMB} 70%,#FFFFFF)`, boxShadow: `0 0 ${20 * u}px ${AMB}`}} />
          </div>
          {/* one-second stopwatch ring */}
          {perP > 0.01 ? (
            <svg width={130 * u} height={130 * u} viewBox="-65 -65 130 130" style={{position: 'absolute', right: 44 * u, top: 300 * u, opacity: perP, transform: `scale(${1 + 0.2 * secFlash})`}}>
              <circle r={50} fill="#03100D" stroke="#2C6B5B" strokeWidth={8} />
              <circle r={50} fill="none" stroke={AMB} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${314 * secQ} 400`} transform="rotate(-90)" />
              <line x1={0} y1={0} x2={0} y2={-36} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" transform={`rotate(${360 * secQ})`} />
              <text x={0} y={34} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill="#FFFFFF" opacity={secP}>1s</text>
            </svg>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export const controllerWorld: WorldDef = {
  id: 'controller',
  home: 'entry',
  anchors: {
    entry: {x: 1200, y: 2760, zoom: 1.08},
    approach: {x: 1200, y: 2150, zoom: 0.85},
    controller: {x: 1200, y: 1600, zoom: 1.2},
    drive: {x: 1200, y: 1480, zoom: 0.54},
    tiny: {x: 1200, y: 1590, zoom: 1.7},
    processor: {x: 1200, y: 1560, zoom: 2.25},
    split: {x: 1200, y: 1580, zoom: 1.4},
    pages: {x: 1200, y: 1590, zoom: 1.0},
    chip: {x: 1506, y: 700, zoom: 1.45},
    write: {x: 640, y: 1600, zoom: 0.92},
    parallel: {x: 1200, y: 1490, zoom: 0.56},
    fast: {x: 1200, y: 1600, zoom: 1.0},
    read: {x: 1200, y: 2300, zoom: 0.8},
    speed: {x: 1200, y: 1120, zoom: 0.82},
  },
  aliases: {reaches: 'approach', "drive's": 'drive', splits: 'split', spreads: 'drive', writes: 'write', reads: 'read', '7000': 'speed', hub: 'controller', page: 'pages'},
  palette: {bg0: '#010806', bg1: '#0A2B23', particles: '#A8FFDC', glow: '#FFB648'},
  Draw,
  Overlay,
};
