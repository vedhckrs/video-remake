// S04 "levels" world - a violet metrology lab. The bucket is a measuring vessel beside a steel level ruler: it fills with
// glowing amber charge, 4 / 8 / 16 notches appear with their binary labels (crowded on purpose at 16), then the camera
// pulls back to a 2 x 2 shelf of vessels SLC / MLC / TLC / QLC and the price tags drop and fall.
import React from 'react';
import {Burst, Ripple, type Beat, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';

const WW = 2600, WH = 3400;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const h2 = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7 + 5.1) * 43758.5453;
  return v - Math.floor(v);
};
const cleanW = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const at = (beats: Beat[], word: string, n = 0, d = 9999) => beats.filter((b) => cleanW(b.word || b.w) === word)[n]?.t ?? d;

// layout: 2 x 2 shelf. The hero vessel is the bottom-right one (it becomes QLC).
const COLX = [970, 1630], ROWY = [1480, 2420];
const MAIN = {x: COLX[1], base: ROWY[1]};
const GROUP_X = MAIN.x + 165; // centre of vessel + ruler + labels
const VH = 600;
const hwV = (y: number) => 175 + 55 * (-y / VH);
const yOf = (f: number) => -26 - f * 520;
const fOf = (i: number, n: number) => 0.05 + (0.9 * i) / (n - 1);
const SILV = `M-230 ${-VH} L-175 0 A175 37 0 0 0 175 0 L230 ${-VH} A230 48 0 0 1 -230 ${-VH} Z`;
const RUL = {x0: 262, x1: 326};

const AMBER = '#FFB52E', MINT = '#8CF5D2', LILAC = '#D9C6FF';

/** level arc on the front of the glass at local height y */
const arc = (y: number, inset = 6) => {
  const w = hwV(y) - inset;
  return `M${-w} ${y} A${w} ${w * 0.21} 0 0 0 ${w} ${y}`;
};

type VesselProps = {
  cx: number; base: number; L: number; t: number; seed?: number; lines?: number; linesA?: number; hot?: number; glow?: number; pour?: number;
  dy?: number; a?: number;
};
const Vessel: React.FC<VesselProps> = ({cx, base, L, t, seed = 1, lines = 0, linesA = 1, hot = -1, glow = 0, dy = 0, a = 1}) => {
  const yL = yOf(L) + Math.sin(t * 0.22 + seed) * 2.5;
  const wL = hwV(yL) - 5;
  const has = L > 0.006;
  return (
    <g transform={`translate(${cx},${base + dy})`} opacity={a}>
      {/* light pool on the shelf + contact shadow */}
      <ellipse cx={0} cy={8} rx={330} ry={62} fill="url(#lw-pool)" opacity={0.5 + 0.5 * clamp01(L + glow)} />
      <ellipse cx={0} cy={6} rx={190} ry={36} fill="#06010F" opacity={0.6} />
      {/* interior */}
      <path d={SILV} fill="url(#lw-glassBack)" />
      <ellipse cx={0} cy={-VH} rx={230} ry={48} fill="#12062A" opacity={0.7} />
      <path d={`M-230 ${-VH} A230 48 0 0 1 230 ${-VH}`} fill="none" stroke="#C9B0FF" strokeWidth={3.5} opacity={0.55} />
      {/* liquid charge */}
      {has ? (
        <g>
          <ellipse cx={0} cy={(yL + 0) / 2} rx={300} ry={(-yL) * 0.7 + 90} fill="url(#lw-halo)" opacity={0.5 + 0.3 * glow} />
          <path d={`M${-wL} ${yL} L-171 0 A171 35 0 0 0 171 0 L${wL} ${yL} A${wL} ${wL * 0.21} 0 0 1 ${-wL} ${yL} Z`} fill="url(#lw-liquid)" />
          {Array.from({length: 11}).map((_, i) => {
            const ph = (t * (0.012 + 0.012 * h2(i, seed)) + h2(i, seed + 3)) % 1;
            const y = -8 + (yL + 20) * ph;
            if (y < yL + 12) return null;
            const x = (h2(i, seed + 7) - 0.5) * 2 * (hwV(y) - 40) + Math.sin(t * 0.2 + i) * 6;
            const r = 5 + 9 * h2(i, seed + 9);
            return (
              <g key={i} opacity={Math.sin(ph * Math.PI)}>
                <circle cx={x} cy={y} r={r * 2.2} fill="#FFF3C4" opacity={0.22} />
                <circle cx={x} cy={y} r={r} fill="#FFF8DC" opacity={0.9} />
              </g>
            );
          })}
          <ellipse cx={0} cy={yL} rx={wL} ry={wL * 0.21} fill="url(#lw-surface)" stroke="#FFF6D0" strokeWidth={3} />
          <ellipse cx={-wL * 0.3} cy={yL - 2} rx={wL * 0.42} ry={wL * 0.07} fill="#FFFFFF" opacity={0.45} />
        </g>
      ) : null}
      {/* level lines engraved on the glass */}
      {lines > 1 && linesA > 0.01 ? Array.from({length: lines}).map((_, i) => {
        const y = yOf(fOf(i, lines));
        const on = i === hot;
        return <path key={i} d={arc(y)} fill="none" stroke={on ? '#FFFFFF' : MINT} strokeWidth={on ? 6 : lines > 8 ? 2.5 : 3.5} strokeDasharray={on ? undefined : '12 9'} opacity={(on ? 1 : 0.75) * linesA} />;
      }) : null}
      {/* front glass */}
      <path d={SILV} fill="url(#lw-glassFront)" stroke="#E4D6FF" strokeWidth={4} strokeOpacity={0.85} strokeLinejoin="round" />
      <path d={`M-205 ${-VH + 44} L-166 -50 L-148 -50 L-178 ${-VH + 44} Z`} fill="url(#lw-streak)" />
      <path d={`M-168 ${-VH + 70} L-140 -130 L-132 -130 L-156 ${-VH + 70} Z`} fill="#FFFFFF" opacity={0.15} />
      <path d={`M188 ${-VH + 90} L156 -80 L164 -80 L200 ${-VH + 90} Z`} fill="#FFFFFF" opacity={0.22} />
      <path d="M-160 3 A175 37 0 0 0 50 35" fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      <path d="M-175 0 A175 37 0 0 0 175 0 L171 18 A171 35 0 0 1 -171 18 Z" fill="#D9C6FF" opacity={0.25} />
      {/* gold rim */}
      <path d={`M-230 ${-VH} A230 48 0 0 0 230 ${-VH} L227 ${-VH + 26} A227 47 0 0 1 -227 ${-VH + 26} Z`} fill="url(#lw-goldBand)" stroke="#FFF1B8" strokeWidth={2} />
      <path d={`M-230 ${-VH} A230 48 0 0 0 230 ${-VH}`} fill="none" stroke="#FFF8E0" strokeWidth={5} opacity={0.9} />
      {glow > 0.02 ? <path d={SILV} fill="none" stroke="#FFE7A8" strokeWidth={14} opacity={0.4 * glow} strokeLinejoin="round" /> : null}
    </g>
  );
};

const Tag: React.FC<{x: number; y: number; text: string; a: number; color?: string; size?: number; fill?: string}> = ({x, y, text, a, color = MINT, size = 30, fill = '#12062A'}) => {
  if (a < 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.8;
  return (
    <g opacity={clamp01(a * 1.4)} transform={`translate(${x},${y}) scale(${0.7 + 0.3 * a})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={size * 0.09} opacity={0.96} />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={size} fill={color} letterSpacing={size * 0.06}>{text}</text>
    </g>
  );
};

const Shelf: React.FC<{y: number; lit: number}> = ({y, lit}) => (
  <g>
    <rect x={120} y={y + 44} width={2400} height={90} fill="url(#lw-underShelf)" opacity={0.7 * lit} />
    <path d={`M150 ${y - 26} L2490 ${y - 26} L2540 ${y + 8} L100 ${y + 8} Z`} fill="url(#lw-shelfTop)" />
    <rect x={100} y={y + 8} width={2440} height={36} fill="url(#lw-shelfFront)" />
    <rect x={100} y={y + 8} width={2440} height={3} fill="#F0E4FF" opacity={0.55} />
    <rect x={100} y={y + 38} width={2440} height={6} fill="#FF7BE5" opacity={0.35 + 0.55 * lit} />
    {[320, 1300, 2280].map((x) => (
      <g key={x}>
        <path d={`M${x - 16} ${y + 44} L${x + 16} ${y + 44} L${x + 16} ${y + 170} L${x - 16} ${y + 120} Z`} fill="#1E0F3E" stroke="#5A3C9E" strokeWidth={2} />
        <circle cx={x} cy={y + 64} r={5} fill="#8E6FD8" />
      </g>
    ))}
  </g>
);

const NAMES = ['SLC', 'MLC', 'TLC', 'QLC'];
const POS: [number, number][] = [[COLX[0], ROWY[0]], [COLX[1], ROWY[0]], [COLX[0], ROWY[1]], [COLX[1], ROWY[1]]];

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tModern = at(beats, 'modern', 0, 14), tDrives = at(beats, 'drives', 0, 22), tGreedy = at(beats, 'greedy', 0, 38);
  const tFill = at(beats, 'fill', 0, 69), tBucket = at(beats, 'bucket', 0, 78), tFour = at(beats, 'four', 0, 90), tDiff = at(beats, 'different', 0, 97);
  const tLev = [at(beats, 'levels', 0, 106), at(beats, 'levels', 1, 185), at(beats, 'levels', 2, 248)];
  const tOne = at(beats, 'one', 0, 121), tCell = at(beats, 'cell', 0, 128), tHolds = at(beats, 'holds', 0, 136), tTwo = at(beats, 'two', 0, 144);
  const tBits = [at(beats, 'bits', 0, 149), at(beats, 'bits', 1, 206), at(beats, 'bits', 2, 269)];
  const tEight = at(beats, 'eight', 0, 179), tThree = at(beats, 'three', 0, 199), tSixteen = at(beats, 'sixteen', 0, 236), tFour2 = at(beats, 'four', 1, 263);
  const tQlc = at(beats, 'qlc', 0, 307), tWhy = at(beats, 'why', 0, 333), tBig = at(beats, 'big', 0, 340), tDrives2 = at(beats, 'drives', 1, 345), tGot = at(beats, 'got', 0, 353), tCheap = at(beats, 'cheap', 0, 362);
  const decay = (a: number, d = 7) => (t >= a ? Math.exp(-(t - a) / d) : 0);

  // ---- the fill script: [time, level] --------------------------------------------------------------------------------
  const script: [number, number][] = [
    [tFill, 0.5], [tBucket, 0.95],
    [tDiff, fOf(1, 4)], [tLev[0], fOf(2, 4)], [tLev[0] + 8, fOf(3, 4)], [tOne, fOf(0, 4)], [tCell, fOf(1, 4)], [tHolds, fOf(3, 4)], [tBits[0], fOf(2, 4)], [tBits[0] + 10, fOf(1, 4)], [tBits[0] + 19, fOf(3, 4)],
    [tEight + 3, fOf(5, 8)], [tLev[1], fOf(2, 8)], [tLev[1] + 7, fOf(6, 8)], [tThree, fOf(3, 8)], [tBits[1], fOf(5, 8)], [tBits[1] + 8, fOf(1, 8)], [tBits[1] + 16, fOf(4, 8)], [tBits[1] + 23, fOf(7, 8)],
    [tSixteen + 3, fOf(9, 16)], [tLev[2], fOf(10, 16)], [tLev[2] + 7, fOf(4, 16)], [tFour2, fOf(13, 16)], [tBits[2], fOf(6, 16)], [tBits[2] + 8, fOf(7, 16)], [tBits[2] + 16, fOf(11, 16)], [tBits[2] + 24, fOf(10, 16)],
  ];
  const levelAt = (tt: number) => {
    let L = 0;
    for (const [a, v] of script) if (tt > a) L = lerp(L, v, sp(tt, a, 'settle'));
    return L;
  };
  const shaky = sp(t, tSixteen + 6, 'settle') * (1 - sp(t, tQlc, 'settle'));
  const wob = shaky * (Math.sin(t * 0.9) * 0.011 + Math.sin(t * 2.3) * 0.007);
  const L = clamp01(levelAt(t) + wob);
  const dL = levelAt(t) - levelAt(t - 1.2);

  // ---- which notch set is live ----------------------------------------------------------------------------------------
  const sets = [{n: 4, at: tFour, bits: tBits[0], fs: 76}, {n: 8, at: tEight, bits: tBits[1], fs: 50}, {n: 16, at: tSixteen, bits: tBits[2], fs: 27}];
  const cur = t >= tSixteen ? 2 : t >= tEight ? 1 : t >= tFour ? 0 : -1;
  const q = sp(t, tQlc, 'settle'); // shelf phase
  const lit = sp(t, tModern, 'settle');
  const greedy = decay(tGreedy, 10);
  const hotIdx = (n: number) => Math.max(0, Math.min(n - 1, Math.round(((L - 0.05) / 0.9) * (n - 1))));

  const mx = MAIN.x, mb = MAIN.base;
  const yLw = mb + yOf(L);

  return (
    <svg width={WW} height={WH} viewBox={`0 0 ${WW} ${WH}`} style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <linearGradient id="lw-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C0B3E" /><stop offset="0.55" stopColor="#2A1060" /><stop offset="1" stopColor="#12062A" /></linearGradient>
        <radialGradient id="lw-wallGlow"><stop offset="0" stopColor="#C04DFF" stopOpacity={0.55} /><stop offset="0.5" stopColor="#7A2BD6" stopOpacity={0.22} /><stop offset="1" stopColor="#7A2BD6" stopOpacity={0} /></radialGradient>
        <radialGradient id="lw-warmGlow"><stop offset="0" stopColor="#FFB52E" stopOpacity={0.4} /><stop offset="1" stopColor="#FF6A3D" stopOpacity={0} /></radialGradient>
        <linearGradient id="lw-bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FF7BE5" stopOpacity={0} /><stop offset="0.5" stopColor="#FFD6FA" stopOpacity={1} /><stop offset="1" stopColor="#FF7BE5" stopOpacity={0} /></linearGradient>
        <linearGradient id="lw-shelfTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B2378" /><stop offset="1" stopColor="#6B4AC0" /></linearGradient>
        <linearGradient id="lw-shelfFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A2E96" /><stop offset="0.5" stopColor="#24104E" /><stop offset="1" stopColor="#150830" /></linearGradient>
        <linearGradient id="lw-underShelf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF7BE5" stopOpacity={0.35} /><stop offset="1" stopColor="#FF7BE5" stopOpacity={0} /></linearGradient>
        <radialGradient id="lw-pool"><stop offset="0" stopColor="#FFC766" stopOpacity={0.55} /><stop offset="1" stopColor="#FF7BE5" stopOpacity={0} /></radialGradient>
        <radialGradient id="lw-halo"><stop offset="0" stopColor="#FFB52E" stopOpacity={0.45} /><stop offset="1" stopColor="#FFB52E" stopOpacity={0} /></radialGradient>
        <linearGradient id="lw-glassBack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2A1466" stopOpacity={0.85} /><stop offset="0.5" stopColor="#120630" stopOpacity={0.82} /><stop offset="1" stopColor="#261060" stopOpacity={0.85} /></linearGradient>
        <linearGradient id="lw-glassFront" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F0E4FF" stopOpacity={0.42} /><stop offset="0.12" stopColor="#C9B0FF" stopOpacity={0.12} /><stop offset="0.5" stopColor="#C9B0FF" stopOpacity={0.03} /><stop offset="0.86" stopColor="#C9B0FF" stopOpacity={0.1} /><stop offset="1" stopColor="#F0E4FF" stopOpacity={0.36} /></linearGradient>
        <linearGradient id="lw-streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75} /><stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.3} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.02} /></linearGradient>
        <linearGradient id="lw-liquid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD24A" stopOpacity={0.95} /><stop offset="0.45" stopColor="#FF9A2E" stopOpacity={0.92} /><stop offset="1" stopColor="#E0403C" stopOpacity={0.92} /></linearGradient>
        <radialGradient id="lw-surface" cx="40%" cy="40%" r="70%"><stop offset="0" stopColor="#FFFBE6" /><stop offset="0.6" stopColor="#FFDF70" /><stop offset="1" stopColor="#FFB52E" /></radialGradient>
        <linearGradient id="lw-goldBand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFE9A0" /><stop offset="0.2" stopColor="#C9941A" /><stop offset="0.5" stopColor="#8A6410" /><stop offset="0.8" stopColor="#D9A21E" /><stop offset="1" stopColor="#FFE9A0" /></linearGradient>
        <linearGradient id="lw-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.4" stopColor="#F2C445" /><stop offset="1" stopColor="#A87608" /></linearGradient>
        <linearGradient id="lw-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F4F0FF" /><stop offset="0.18" stopColor="#B9AEDD" /><stop offset="0.55" stopColor="#DCD4F5" /><stop offset="1" stopColor="#7C6FA8" /></linearGradient>
        <linearGradient id="lw-funnel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8E72E0" /><stop offset="0.25" stopColor="#3A2180" /><stop offset="0.7" stopColor="#1B0C44" /><stop offset="1" stopColor="#5A3CB0" /></linearGradient>
        <linearGradient id="lw-stream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FF9A2E" stopOpacity={0.3} /><stop offset="0.5" stopColor="#FFF6D0" /><stop offset="1" stopColor="#FF9A2E" stopOpacity={0.3} /></linearGradient>
        <linearGradient id="lw-plaque" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2B1560" /><stop offset="1" stopColor="#120630" /></linearGradient>
        <linearGradient id="lw-tag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF4D6" /><stop offset="1" stopColor="#F2C98A" /></linearGradient>
      </defs>

      {/* ---------- the lab wall ---------- */}
      <rect x={-1200} y={-800} width={WW + 2400} height={WH + 1600} fill="url(#lw-wall)" />
      {/* wall panels + peg dots */}
      {Array.from({length: 7}).map((_, i) => (
        <rect key={i} x={-100 + i * 420} y={300} width={400} height={2900} rx={14} fill="#FFFFFF" opacity={0.022 + 0.014 * (i % 2)} />
      ))}
      {Array.from({length: 13}).map((_, r) => Array.from({length: 13}).map((__, c) => (
        <circle key={`${r}-${c}`} cx={160 + c * 190} cy={620 + r * 190} r={5} fill="#0B0320" opacity={0.7} />
      )))}
      <ellipse cx={1300} cy={1700} rx={1500} ry={1300} fill="url(#lw-wallGlow)" opacity={0.25 + 0.75 * lit} />
      <ellipse cx={GROUP_X} cy={mb - 300} rx={760} ry={700} fill="url(#lw-warmGlow)" opacity={(0.25 + 0.75 * clamp01(L * 1.3)) * (1 - q * 0.5)} />
      {/* vertical light bars */}
      {[300, 1300, 2300].map((x, i) => (
        <g key={x} opacity={lit * (0.75 + 0.25 * Math.sin(t * 0.07 + i))}>
          <rect x={x - 70} y={380} width={140} height={2760} fill="url(#lw-bar)" opacity={0.16} />
          <rect x={x - 7} y={420} width={14} height={2680} rx={7} fill="#FFE3FB" />
        </g>
      ))}
      <Shelf y={ROWY[0]} lit={lit} />
      <Shelf y={ROWY[1]} lit={lit} />

      {/* ---------- hero rig: hopper + ruler + labels + plaque (fades when the camera pulls back) ---------- */}
      {q < 0.99 ? (
        <g opacity={1 - q}>
          {/* hopper / feed funnel above the vessel */}
          <g transform={`translate(${mx},${mb})`}>
            <rect x={-16} y={-1500} width={32} height={600} fill="url(#lw-funnel)" />
            <path d="M-150 -905 L150 -905 L44 -740 L-44 -740 Z" fill="url(#lw-funnel)" stroke="#A58CF0" strokeWidth={3} />
            <ellipse cx={0} cy={-905} rx={150} ry={26} fill="#2A1466" stroke="#C9B0FF" strokeWidth={3} />
            <ellipse cx={0} cy={-905} rx={120} ry={19} fill="url(#lw-surface)" opacity={0.35 + 0.65 * Math.max(greedy, clamp01(dL * 40))} />
            <path d="M-128 -872 L-52 -752 L-40 -752 L-108 -872 Z" fill="#FFFFFF" opacity={0.25} />
            <rect x={-46} y={-744} width={92} height={22} rx={6} fill="url(#lw-gold)" stroke="#FFF1B8" strokeWidth={2} />
            <rect x={-30} y={-722} width={60} height={34} fill="url(#lw-funnel)" />
            <rect x={-34} y={-692} width={68} height={12} rx={4} fill="url(#lw-gold)" />
            {/* pour stream */}
            {dL > 0.002 ? (
              <g opacity={clamp01(dL * 60)}>
                <rect x={-34} y={-680} width={68} height={yOf(L) + 680} fill="#FFB52E" opacity={0.18} />
                <rect x={-13} y={-680} width={26} height={yOf(L) + 680} fill="url(#lw-stream)" />
                {[0, 1, 2, 3, 4].map((i) => {
                  const ph = (t * 0.11 + i / 5) % 1;
                  return <circle key={i} cx={(h2(i, 2) - 0.5) * 40} cy={lerp(-680, yOf(L), ph)} r={9} fill="#FFF6D0" opacity={0.9} />;
                })}
                <ellipse cx={0} cy={yOf(L)} rx={70} ry={16} fill="none" stroke="#FFFBE6" strokeWidth={5} opacity={0.8} />
              </g>
            ) : null}
          </g>
        </g>
      ) : null}

      {/* ---------- the other three vessels (drop onto the shelves on "QLC") ---------- */}
      {q > 0.001 ? [0, 1, 2].map((i) => {
        const a = sp(t, tQlc - 2 + i * 2.2, 'bouncy');
        const n = [2, 4, 8][i];
        const lv = [fOf(1, 2), fOf(2, 4), fOf(5, 8)][i];
        return <Vessel key={i} cx={POS[i][0]} base={POS[i][1]} L={lv * clamp01(a)} t={t} seed={i + 4} lines={n} hot={[1, 2, 5][i]} dy={-(1 - a) * 260} a={clamp01(a * 2.5)} glow={decay(tQlc + i * 2.2 + 4, 6)} />;
      }) : null}

      {/* ---------- hero vessel ---------- */}
      <Vessel cx={mx} base={mb} L={L} t={t} seed={1} lines={16} linesA={q} hot={hotIdx(16)}
              glow={Math.max(greedy, decay(tBucket, 8), decay(tHolds, 8), decay(tCell, 8) * 0.7)} />
      {/* ghost level lines on "greedy": it wants more levels */}
      {greedy > 0.03 ? (
        <g transform={`translate(${mx},${mb})`} opacity={greedy}>
          {Array.from({length: 12}).map((_, i) => (
            <path key={i} d={arc(yOf(0.04 + i * 0.083))} fill="none" stroke={i % 3 === 0 ? AMBER : MINT} strokeWidth={4} strokeDasharray="14 10"
                  opacity={0.3 + 0.7 * (Math.floor(t * 1.5 + i * 1.7) % 3 === 0 ? 1 : 0.2)} />
          ))}
        </g>
      ) : null}
      <Tag x={mx} y={mb - 300} text="WANTS MORE BITS" a={sp(t, tGreedy, 'pop') * (1 - sp(t, tFill - 6, 'settle'))} color={AMBER} size={34} />
      <Ripple t={t} at={tHolds} x={mx} y={yLw} color="#FFF6D0" r={300} />
      <Ripple t={t} at={tFill + 6} x={mx} y={mb - 40} color="#FFD24A" r={260} />

      {q < 0.99 ? (
        <g opacity={1 - q}>
          {/* "one cell" bracket */}
          {(() => {
            const a = sp(t, tOne, 'pop') * (1 - sp(t, tTwo, 'settle'));
            if (a < 0.01) return null;
            const x0 = mx - 262, x1 = mx + 250, y0 = mb - VH - 40, y1 = mb + 46, g = (1 - a) * 60, Lg = 70;
            return (
              <g opacity={a}>
                {[[x0 - g, y0 - g, 1, 1], [x1 + g, y0 - g, -1, 1], [x0 - g, y1 + g, 1, -1], [x1 + g, y1 + g, -1, -1]].map(([x, y, sx, sy], i) => (
                  <path key={i} d={`M${x + sx * Lg} ${y} L${x} ${y} L${x} ${y + sy * Lg}`} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
                ))}
                <Tag x={mx} y={y0 - 4} text="1 CELL" a={a} color="#FFFFFF" size={34} />
              </g>
            );
          })()}

          {/* steel ruler */}
          <g transform={`translate(${mx},${mb})`}>
            <rect x={RUL.x0 + 8} y={-VH - 44} width={RUL.x1 - RUL.x0} height={VH + 74} rx={8} fill="#06010F" opacity={0.5} />
            <rect x={RUL.x0} y={-VH - 50} width={RUL.x1 - RUL.x0} height={VH + 74} rx={8} fill="url(#lw-steel)" stroke="#F4F0FF" strokeWidth={2} />
            <circle cx={(RUL.x0 + RUL.x1) / 2} cy={-VH - 30} r={7} fill="#2A1466" />
            {Array.from({length: 53}).map((_, i) => {
              const y = -6 - i * 10.4;
              const big = i % 5 === 0;
              return <line key={i} x1={RUL.x0} x2={RUL.x0 + (big ? 26 : 14)} y1={y} y2={y} stroke="#2A1466" strokeWidth={big ? 3 : 1.8} opacity={0.8} />;
            })}
            {/* live level pointer riding the ruler */}
            {L > 0.01 ? (
              <g transform={`translate(0,${yOf(L)})`}>
                <path d={`M${RUL.x0 - 30} 0 L${RUL.x0 - 4} -15 L${RUL.x0 - 4} 15 Z`} fill={shaky > 0.5 ? '#FF6B7E' : '#FFFFFF'} stroke="#12062A" strokeWidth={2} />
                <rect x={RUL.x0 - 4} y={-4} width={RUL.x1 - RUL.x0 + 8} height={8} rx={4} fill={shaky > 0.5 ? '#FF6B7E' : AMBER} opacity={0.9} />
              </g>
            ) : null}
            {/* notch sets + binary labels */}
            {sets.map((s, si) => {
              const next = sets[si + 1];
              const out = next ? sp(t, next.at, 'settle') : 0;
              if (t < s.at || out > 0.99) return null;
              const bitsN = Math.log2(s.n);
              const hot = hotIdx(s.n);
              return (
                <g key={si} opacity={1 - out}>
                  {Array.from({length: s.n}).map((_, i) => {
                    const a = sp(t, s.at + i * (4.5 / s.n) * 1.6, 'bouncy');
                    if (a < 0.01) return null;
                    const y = yOf(fOf(i, s.n));
                    const on = i === hot && si === cur;
                    const la = sp(t, s.bits + i * (5 / s.n), 'pop');
                    const label = i.toString(2).padStart(bitsN, '0');
                    const lw = s.fs * 0.62 * bitsN + s.fs * 0.5, lh = s.fs * 1.12;
                    return (
                      <g key={i}>
                        <path d={arc(y)} fill="none" stroke={on ? '#FFFFFF' : MINT} strokeWidth={on ? 6 : s.n > 8 ? 2.6 : 4} strokeDasharray={on ? undefined : '14 10'} opacity={(on ? 1 : 0.8) * a} />
                        <g transform={`translate(${RUL.x0},${y}) scale(${a},1)`}>
                          <rect x={0} y={s.n > 8 ? -3 : -5} width={RUL.x1 - RUL.x0} height={s.n > 8 ? 6 : 10} fill={on ? '#FF3D8B' : '#5B1FD0'} />
                          <path d={`M${RUL.x1 - RUL.x0 + 2} 0 l${s.n > 8 ? 12 : 20} ${s.n > 8 ? -8 : -13} l0 ${s.n > 8 ? 16 : 26} Z`} fill={on ? '#FF3D8B' : MINT} />
                        </g>
                        {la > 0.01 ? (
                          <g transform={`translate(${RUL.x1 + (s.n > 8 ? 22 : 34) + (1 - la) * 60},${y})`} opacity={clamp01(la * 1.5)}>
                            {on ? <rect x={-s.fs * 0.2} y={-lh / 2} width={lw} height={lh} rx={lh * 0.24} fill={AMBER} /> : null}
                            <text x={0} y={s.fs * 0.35} fontFamily={MONO} fontWeight={600} fontSize={s.fs} fill={on ? '#1A0B00' : LILAC} letterSpacing={s.fs * 0.02}>{label}</text>
                          </g>
                        ) : null}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
          <Burst t={t} at={tFour} x={mx + 294} y={mb - 300} color={MINT} n={14} r={200} />
          <Burst t={t} at={tEight} x={mx + 294} y={mb - 300} color={MINT} n={16} r={240} />
          <Burst t={t} at={tSixteen} x={mx + 294} y={mb - 300} color="#FF7BE5" n={20} r={280} />

          {/* readout plaque under the shelf: LEVELS | BITS */}
          {(() => {
            const px = GROUP_X, py = mb + 112, pw = 700, ph = 124;
            const levelsTxt = cur < 0 ? '–' : String(sets[cur].n);
            const bitsTxt = t >= tFour2 ? '4' : t >= tThree ? '3' : t >= tTwo ? '2' : t >= tFour ? '?' : '–';
            const lp = Math.max(decay(tFour, 6), decay(tEight, 6), decay(tSixteen, 6));
            const bp = Math.max(decay(tTwo, 6), decay(tThree, 6), decay(tFour2, 6));
            const on = sp(t, tDrives, 'pop');
            return (
              <g transform={`translate(${px},${py})`}>
                <line x1={-pw / 2 + 60} y1={-ph / 2} x2={-pw / 2 + 60} y2={-ph / 2 - 26} stroke="#8E6FD8" strokeWidth={5} />
                <line x1={pw / 2 - 60} y1={-ph / 2} x2={pw / 2 - 60} y2={-ph / 2 - 26} stroke="#8E6FD8" strokeWidth={5} />
                <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} rx={22} fill="url(#lw-plaque)" stroke="#A58CF0" strokeWidth={3.5} />
                <rect x={-pw / 2 + 10} y={-ph / 2 + 10} width={pw - 20} height={ph - 20} rx={14} fill="#0B0320" stroke="#3B2378" strokeWidth={2} />
                {cur < 0 ? (
                  <g opacity={0.25 + 0.75 * on}>
                    <rect x={-pw / 2 + 40} y={-22} width={86} height={44} rx={6} fill="#24322E" stroke={MINT} strokeWidth={2.5} />
                    {[0, 1, 2].map((i) => <rect key={i} x={-pw / 2 + 50 + i * 24} y={-13} width={18} height={26} rx={3} fill="#0B0320" stroke="#5FD0B0" strokeWidth={1.5} />)}
                    <text x={30} y={17} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={46} fill="#F0E4FF" letterSpacing={4}>MODERN SSD CELL</text>
                  </g>
                ) : (
                  <g>
                    <line x1={20} y1={-ph / 2 + 22} x2={20} y2={ph / 2 - 22} stroke="#3B2378" strokeWidth={3} />
                    <g transform={`translate(${-pw / 4 + 10},0)`}>
                      <text x={-18} y={30} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={88 * (1 + 0.25 * lp)} fill={MINT}>{levelsTxt}</text>
                      <text x={0} y={22} fontFamily={MONO} fontWeight={600} fontSize={36} fill="#F0E4FF" letterSpacing={3}>LEVELS</text>
                    </g>
                    <g transform={`translate(${pw / 4 - 10},0)`}>
                      <text x={-18} y={30} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={88 * (1 + 0.25 * bp)} fill={AMBER}>{bitsTxt}</text>
                      <text x={0} y={22} fontFamily={MONO} fontWeight={600} fontSize={36} fill="#F0E4FF" letterSpacing={3}>BITS</text>
                    </g>
                  </g>
                )}
              </g>
            );
          })()}
          <Tag x={mx + 400} y={mb - VH - 86} text="PRECISION GETS HARD" a={sp(t, tBits[2] + 5, 'pop')} color="#FF8FA0" size={24} fill="#2A0614" />
        </g>
      ) : null}

      {/* ---------- shelf phase: name plates, capacity, price tags ---------- */}
      {q > 0.01 ? POS.map(([x, y], i) => {
        const a = sp(t, tQlc + 2 + i * 2.2, 'bouncy');
        if (a < 0.01) return null;
        const hi = i === 3 ? decay(tQlc + 8, 10) : 0;
        const big = sp(t, tBig + i * 1.2, 'bouncy'), drv = sp(t, tDrives2 + i * 0.8, 'pop');
        // price tag: drops in on "why", sways on "got", string snaps on "cheap" and it falls
        const ta = sp(t, tWhy + i * 1.4, 'bouncy');
        const fallAt = tCheap + (3 - i) * 1.6;
        const fd = Math.max(0, t - fallAt);
        const sway = Math.sin(t * 0.25 + i) * 4 + decay(tGot, 9) * Math.sin((t - tGot) * 0.8) * 22 + (1 - ta) * 30;
        const tx = x + 168, ty = y + 44;
        return (
          <g key={i}>
            {/* name plate hanging under the shelf */}
            <g transform={`translate(${x - 70},${y + 44}) scale(${a})`} opacity={clamp01(a * 2)}>
              <line x1={-90} y1={0} x2={-90} y2={22} stroke="#8E6FD8" strokeWidth={5} />
              <line x1={90} y1={0} x2={90} y2={22} stroke="#8E6FD8" strokeWidth={5} />
              <rect x={-150} y={20} width={300} height={196} rx={22} fill="url(#lw-plaque)" stroke={i === 3 ? AMBER : '#A58CF0'} strokeWidth={i === 3 ? 6 : 3.5} />
              {hi > 0.02 ? <rect x={-162} y={8} width={324} height={220} rx={30} fill="none" stroke={AMBER} strokeWidth={10} opacity={0.5 * hi} /> : null}
              <text x={0} y={100} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={94} fill={i === 3 ? '#FFE7A8' : '#FFFFFF'} letterSpacing={2}>{NAMES[i]}</text>
              <text x={0} y={152} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={46} fill={MINT}>{i + 1} {i ? 'bits' : 'bit'}</text>
              {/* capacity blocks: more bits per cell = more data in the same cell ("big drives") */}
              {Array.from({length: i + 1}).map((_, b) => (
                <rect key={b} x={-112 + b * 58} y={170} width={50 * big} height={26} rx={6} fill={drv > 0.5 ? AMBER : '#7C5AE0'} opacity={0.35 + 0.65 * big} />
              ))}
            </g>
            {/* price tag */}
            {ta > 0.01 && fd < 40 ? (
              <g transform={`translate(${tx + fd * (2 + i)},${ty + 0.9 * fd * fd}) rotate(${sway + fd * (5 + 3 * i)})`} opacity={clamp01(ta * 2) * (1 - clamp01((fd - 22) / 14))}>
                {fd <= 0 ? <line x1={0} y1={0} x2={0} y2={50 * ta} stroke="#F2E6FF" strokeWidth={3} /> : <line x1={0} y1={26} x2={6} y2={50} stroke="#F2E6FF" strokeWidth={3} />}
                <g transform={`translate(0,${50 * ta})`}>
                  <path d="M0 0 L62 34 L62 182 L-62 182 L-62 34 Z" fill="#06010F" opacity={0.45} transform="translate(8,10)" />
                  <path d="M0 0 L62 34 L62 182 L-62 182 L-62 34 Z" fill="url(#lw-tag)" stroke="#8A5A14" strokeWidth={3} strokeLinejoin="round" />
                  <circle cx={0} cy={28} r={9} fill="#2A1060" stroke="#8A5A14" strokeWidth={2.5} />
                  <text x={0} y={104} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={[36, 44, 56, 76][3 - i]} fill="#1F7A3E">{'$'.repeat(4 - i)}</text>
                  <text x={0} y={152} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill="#5A3A0A">per GB</text>
                </g>
              </g>
            ) : null}
            {fd > 0 ? <Burst t={t} at={fallAt} x={tx} y={ty + 30} color="#FFF4D6" n={8} r={90} /> : null}
          </g>
        );
      }) : null}
      <Tag x={MAIN.x} y={MAIN.base - 330} text="CHEAPEST PER GB" a={sp(t, tCheap + 2, 'bouncy')} color="#5FF0A8" size={44} fill="#0B2A18" />
      <Burst t={t} at={tCheap} x={MAIN.x} y={MAIN.base - 330} color="#5FF0A8" n={18} r={300} />
      <Burst t={t} at={tQlc + 8} x={MAIN.x - 70} y={MAIN.base + 160} color={AMBER} n={16} r={260} />
    </svg>
  );
};

export const levelsWorld: WorldDef = {
  id: 'levels',
  home: 'vessel',
  anchors: {
    bucket: {x: GROUP_X, y: 1990, zoom: 1.05},
    vessel: {x: MAIN.x + 40, y: 2040, zoom: 1.3},
    fill: {x: MAIN.x + 30, y: 1900, zoom: 1.2},
    levels: {x: MAIN.x + 250, y: 2050, zoom: 1.45},
    bits: {x: MAIN.x + 330, y: 2050, zoom: 1.55},
    readout: {x: GROUP_X, y: 2330, zoom: 1.4},
    qlc: {x: 1300, y: 1575, zoom: 0.56},
  },
  aliases: {
    greedy: 'vessel', one: 'bucket', cell: 'vessel', holds: 'vessel',
    eight: 'bucket', sixteen: 'bucket',
    two: 'readout', three: 'readout',
  },
  palette: {bg0: '#0A0318', bg1: '#35146E', particles: '#EBC8FF', glow: '#C04DFF'},
  Draw,
};
