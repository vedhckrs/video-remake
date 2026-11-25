// S03 "cells" world - inside the NAND chip. A deep-blue endless city grid of flash cells seen from above (depth fog),
// the camera dives into one cell that becomes a big glass bucket with a gold gate: electrons stream in, the gate slams
// shut, the power line is cut (world dims, electrons keep glowing), then full / empty buckets = 1 / 0.
import React from 'react';
import {Burst, Ripple, type Beat, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp, mix} from '../../../src/kit/explainer/tokens';

const WW = 2400, WH = 3200;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const h2 = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const cleanW = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
/** frame of the n-th occurrence of a word (the kit's wordAt only finds the first) */
export const at = (beats: Beat[], word: string, n = 0, d = 9999) => beats.filter((b) => cleanW(b.word || b.w) === word)[n]?.t ?? d;

// ---- the cell field (perspective ground plane) ---------------------------------------------------------------------
const VPX = 1200, HY = 420, PC = 0.105, RK = 1.09, D0 = 260, NROW = 29, HERO_K = 17;
const rowD = (k: number) => D0 * Math.pow(RK, k);
const gx = (X: number, d: number) => VPX + X * PC * d;
const lift = (h: number, d: number) => h * PC * d * 0.85;
const cellH = (j: number, k: number) => (j === 0 && k === HERO_K ? 0.42 : 0.16 + 0.62 * Math.pow(h2(j, k), 2.2));
const HERO_D = rowD(HERO_K) * 1.045;
const HERO = {x: VPX, y: HY + HERO_D};

const BUCKET = {x: 1200, base: 1800};
const PAIR = {xl: 985, xr: 1415, base: 1560, k: 0.56};
const DIGIT_Y = 1850;

const Field: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const tEvery = at(beats, 'every', 0, 9), tFlash = at(beats, 'flash', 0, 18), tGrid = at(beats, 'grid', 0, 39), tCells = at(beats, 'cells', 0, 52);
  const waveR = t > tCells ? (t - tCells) * 120 : -1;
  const sweepD = t > tFlash && t < tFlash + 14 ? lerp(D0, 3300, (t - tFlash) / 12) : -1;
  const lines = sp(t, tEvery, 'settle');
  const rows: React.ReactNode[] = [];
  for (let k = 0; k < NROW; k++) {
    const d = rowD(k), dF = d * 1.012, dN = d * 1.078, dC = d * 1.045;
    const grow = 0.05 + 0.95 * sp(t, tGrid + k * 0.42, 'bouncy');
    const J = Math.min(70, Math.ceil(1380 / (PC * d)));
    let sides = '', tops = '', lit = '', hot = '';
    for (let j = -J; j <= J; j++) {
      const h = cellH(j, k) * grow;
      const xlF = gx(j - 0.37, dF), xrF = gx(j + 0.37, dF), xlN = gx(j - 0.37, dN), xrN = gx(j + 0.37, dN);
      const yF = HY + dF, yN = HY + dN, hF = lift(h, dF), hN = lift(h, dN);
      const top = `M${r1(xlF)} ${r1(yF - hF)}L${r1(xrF)} ${r1(yF - hF)}L${r1(xrN)} ${r1(yN - hN)}L${r1(xlN)} ${r1(yN - hN)}Z`;
      sides += `M${r1(xlN)} ${r1(yN - hN)}L${r1(xrN)} ${r1(yN - hN)}L${r1(xrN)} ${r1(yN)}L${r1(xlN)} ${r1(yN)}Z`;
      if (j !== 0) {
        const xa = j > 0 ? xlF : xrF, xb = j > 0 ? xlN : xrN;
        sides += `M${r1(xa)} ${r1(yF - hF)}L${r1(xb)} ${r1(yN - hN)}L${r1(xb)} ${r1(yN)}L${r1(xa)} ${r1(yF)}Z`;
      }
      const cx = gx(j, dC), cy = HY + dC;
      const dist = Math.hypot(cx - HERO.x, cy - HERO.y);
      const inWave = waveR > 0 && dist < waveR;
      const twinkle = h2(j * 3.1, k * 1.7) > 0.86 ? Math.floor(t / 5 + h2(j, k * 9) * 7) % 2 === 0 : true;
      const isLit = inWave && h2(j + 40, k + 3) > 0.4 && twinkle;
      const isHot = (sweepD > 0 && Math.abs(dC - sweepD) < 0.1 * sweepD) || (inWave && waveR - dist < 110 && waveR < 2600) || (isLit && h2(j + 9, k + 4) > 0.95);
      if (isHot) hot += top;
      else if (isLit) lit += top;
      else tops += top;
    }
    const near = clamp01(k / 11);
    const op = 0.3 + 0.7 * near;
    const sw = Math.max(0.6, PC * d * 0.018);
    rows.push(
      <g key={k} opacity={op}>
        <path d={sides} fill={mix('#0E3A8F', '#06153A', near)} />
        <path d={tops} fill={mix('#1B4FAE', '#12306F', near)} stroke="#5E9BFF" strokeOpacity={0.55} strokeWidth={sw} />
        {lit ? <path d={lit} fill="#39C6FF" stroke="#39C6FF" strokeOpacity={0.28} strokeWidth={PC * d * 0.2} strokeLinejoin="round" /> : null}
        {lit ? <path d={lit} fill="url(#cw-lit)" stroke="#D8F6FF" strokeWidth={sw} /> : null}
        {hot ? <path d={hot} fill="#F2FCFF" stroke="#8FE2FF" strokeOpacity={0.45} strokeWidth={PC * d * 0.3} strokeLinejoin="round" /> : null}
      </g>,
    );
  }
  // bit lines converge on the vanishing point; word lines run across; data pulses travel down the streets
  const bit: React.ReactNode[] = [];
  for (let j = -15; j <= 14; j++) {
    const X = j + 0.5;
    bit.push(<line key={j} x1={gx(X, D0)} y1={HY + D0} x2={gx(X, 3000)} y2={HY + 3000} stroke="#2F7BFF" strokeWidth={j % 4 === 0 ? 5 : 2.5} opacity={(j % 4 === 0 ? 0.85 : 0.5) * lines} />);
  }
  const pulses: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const X = Math.round((h2(i, 5) - 0.5) * 22) + 0.5;
    const ph = (t * (0.012 + 0.01 * h2(i, 2)) + h2(i, 8)) % 1;
    const d = D0 * Math.exp(ph * Math.log(3000 / D0));
    pulses.push(<line key={i} x1={gx(X, d)} y1={HY + d} x2={gx(X, d * 1.07)} y2={HY + d * 1.07} stroke="#BFF1FF" strokeWidth={PC * d * 0.06} strokeLinecap="round" opacity={0.9 * lines} />);
  }
  return (
    <g>
      <rect x={-400} y={HY} width={WW + 800} height={WH - HY + 400} fill="url(#cw-floor)" />
      <ellipse cx={VPX} cy={HY + 40} rx={1500} ry={300} fill="url(#cw-horizon)" />
      {Array.from({length: NROW}).map((_, k) => (
        <line key={k} x1={-200} x2={WW + 200} y1={HY + rowD(k)} y2={HY + rowD(k)} stroke="#2A6BE0" strokeWidth={Math.max(1, PC * rowD(k) * 0.02)} opacity={0.35 * lines} />
      ))}
      {bit}
      {rows}
      {pulses}
      <rect x={-400} y={HY - 300} width={WW + 800} height={1300} fill="url(#cw-fog)" />
      <ellipse cx={VPX} cy={HY + 10} rx={1100} ry={120} fill="url(#cw-horizon)" opacity={0.8} />
    </g>
  );
};

// ---- electrons ---------------------------------------------------------------------------------------------------
export const E_R = 28;
export const hw = (y: number) => 215 + 85 * (-y / 720); // inner half-width of the bucket at local height y (y <= 0)
export const E_REST: {x: number; y: number}[] = (() => {
  const pts: {x: number; y: number; r: number}[] = [];
  for (let r = 0; r < 6; r++) {
    const y = -44 - r * 54;
    const avail = hw(y) - E_R - 16;
    const n = Math.floor((2 * avail) / 60) + (r % 2 ? 0 : 1);
    for (let i = 0; i < n; i++) pts.push({x: (i - (n - 1) / 2) * 60 + (h2(i, r) - 0.5) * 8, y: y + (h2(i * 3, r + 5) - 0.5) * 8, r});
  }
  // arrival order: bottom rows first, shuffled inside a row
  return pts.map((p, i) => ({...p, o: p.r + h2(i, 77) * 0.9})).sort((a, b) => a.o - b.o).map(({x, y}) => ({x, y}));
})();
export const E_GAP = 0.6, E_FALL = 10;

export const Electrons: React.FC<{t: number; t0: number; kickAt: number; glow?: number}> = ({t, t0, kickAt, glow = 0}) => (
  <g>
    {E_REST.map((p, i) => {
      const st = t0 + i * E_GAP;
      if (t < st) return null;
      const q = clamp01((t - st) / E_FALL), dt = t - st - E_FALL;
      const sx = (h2(i, 3) - 0.5) * 90;
      const spread = clamp01((q - 0.55) / 0.45);
      let x = lerp(sx, p.x, spread * spread * (3 - 2 * spread));
      let y = lerp(-1700, p.y, q * q);
      if (dt > 0) y -= Math.abs(Math.sin(dt * 0.9)) * 16 * Math.exp(-dt / 4);
      if (t > kickAt) {
        const kd = t - kickAt;
        y -= Math.abs(Math.sin(kd * 0.8 + h2(i, 9) * 2)) * (14 + 30 * h2(i, 4)) * Math.exp(-kd / 6);
      }
      x += Math.sin(t * 0.13 + i * 1.7) * 2.2;
      y += Math.cos(t * 0.11 + i * 2.3) * 2.2;
      const tw = 0.82 + 0.18 * Math.sin(t * 0.35 + i * 2.1);
      return (
        <g key={i}>
          {q < 1 ? <line x1={x} y1={y - 20} x2={x} y2={y - 20 - 260 * (1 - q * 0.6)} stroke="url(#cw-trail)" strokeWidth={14} strokeLinecap="round" /> : null}
          <circle cx={x} cy={y} r={E_R * (2.3 + glow * 0.9)} fill="url(#cw-eglow)" opacity={(0.75 + glow * 0.25) * tw} />
          <circle cx={x} cy={y} r={E_R} fill="url(#cw-ecore)" />
          <ellipse cx={x - 8} cy={y - 10} rx={9} ry={6} fill="#FFFFFF" opacity={0.85} />
          <rect x={x - 9} y={y + 3} width={18} height={4.5} rx={2} fill="#0B3C8C" opacity={0.75} />
        </g>
      );
    })}
  </g>
);

// ---- the glass bucket ----------------------------------------------------------------------------------------------
export const SIL = 'M-300 -720 L-215 0 A215 46 0 0 0 215 0 L300 -720 A300 62 0 0 1 -300 -720 Z';
export const GATE = {y: -752, rx: 322, ry: 66, th: 36};

const GateHalf: React.FC<{side: -1 | 1; shift: number; hi: number}> = ({side, shift, hi}) => {
  const {rx, ry, th} = GATE;
  const s = side, f0 = s < 0 ? 0 : 1, f1 = s < 0 ? 1 : 0;
  // top face: half ellipse; side wall: the front quarter arc extruded down
  const topD = `M0 ${-ry} A${rx} ${ry} 0 0 ${f0} ${s * rx} 0 A${rx} ${ry} 0 0 ${f0} 0 ${ry} Z`;
  const sideD = `M${s * rx} 0 A${rx} ${ry} 0 0 ${f0} 0 ${ry} L0 ${ry + th} A${rx} ${ry} 0 0 ${f1} ${s * rx} ${th} Z`;
  return (
    <g transform={`translate(${s * shift},${GATE.y})`}>
      <path d={sideD} fill={`url(#cw-goldSide${s < 0 ? 'L' : 'R'})`} />
      {[0.2, 0.42, 0.62, 0.8].map((f, i) => {
        const a = (f * Math.PI) / 2, x = s * rx * Math.cos(a), y = ry * Math.sin(a);
        return <line key={i} x1={x} y1={y + 5} x2={x} y2={y + th - 5} stroke="#5A3F08" strokeWidth={3} opacity={0.55} />;
      })}
      <path d={`M0 ${ry} L0 ${ry + th}`} stroke="#3A2A06" strokeWidth={4} />
      <path d={topD} fill="url(#cw-goldTop)" stroke="#FFF1B8" strokeWidth={3} />
      <path d={`M${s * 14} ${-ry + 12} A${rx - 26} ${ry - 13} 0 0 ${f0} ${s * (rx - 26)} 0 A${rx - 26} ${ry - 13} 0 0 ${f0} ${s * 14} ${ry - 12}`}
            fill="none" stroke="#8A6410" strokeWidth={3} opacity={0.8} />
      <path d={`M${s * 14} ${-ry + 15} A${rx - 26} ${ry - 13} 0 0 ${f0} ${s * (rx - 26)} 3`} fill="none" stroke="#FFF6CC" strokeWidth={2} opacity={0.7} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <ellipse cx={s * rx * (0.3 + 0.2 * i)} cy={(i - 1) * 30} rx={9} ry={5} fill="#7A5A10" />
          <ellipse cx={s * rx * (0.3 + 0.2 * i) - 1.5} cy={(i - 1) * 30 - 1.5} rx={6} ry={3.2} fill="#FFE9A0" />
        </g>
      ))}
      {/* handle bar */}
      <rect x={s < 0 ? -rx * 0.22 : rx * 0.06} y={-7} width={rx * 0.16} height={18} rx={9} fill="#6B4E0C" />
      <rect x={s < 0 ? -rx * 0.22 : rx * 0.06} y={-11} width={rx * 0.16} height={14} rx={7} fill="#FFE08A" />
      {hi > 0.01 ? <path d={topD} fill="#FFFFFF" opacity={0.55 * hi} /> : null}
    </g>
  );
};

type BucketProps = {
  x: number; base: number; k: number; gate: number; layer: 'back' | 'front'; charge?: number; rim?: number; lock?: number; gateHi?: number;
  children?: React.ReactNode;
};
/** Glass bucket, local origin = centre of the base, y up is negative. Drawn in two layers so electrons sit inside the glass. */
export const Bucket: React.FC<BucketProps> = ({x, base, k, gate, layer, charge = 0, rim = 0, lock = 0, gateHi = 0, children}) => {
  const tr = `translate(${x},${base}) scale(${k})`;
  if (layer === 'back') {
    return (
      <g transform={tr}>
        {/* light pool + pedestal */}
        <ellipse cx={0} cy={96} rx={520} ry={120} fill="url(#cw-pool)" />
        <path d="M-292 44 A292 60 0 0 0 292 44 L292 96 A292 60 0 0 1 -292 96 Z" fill="url(#cw-pedSide)" />
        <ellipse cx={0} cy={44} rx={292} ry={60} fill="url(#cw-pedTop)" stroke="#5E82C8" strokeWidth={2.5} />
        <ellipse cx={0} cy={44} rx={254} ry={51} fill="none" stroke="url(#cw-goldLine)" strokeWidth={7} />
        <ellipse cx={0} cy={44} rx={236} ry={47} fill="none" stroke="#2A4E96" strokeWidth={2} />
        {Array.from({length: 14}).map((_, i) => {
          const a = Math.PI * (0.08 + (0.84 * i) / 13);
          return <rect key={i} x={Math.cos(a) * 292 - 3} y={44 + Math.sin(a) * 60 + 14} width={6} height={22} rx={2} fill="#7FB4FF" opacity={0.25 + 0.5 * charge} />;
        })}
        {/* interior */}
        <path d={SIL} fill="url(#cw-glassBack)" />
        <ellipse cx={0} cy={-720} rx={300} ry={62} fill="#06163C" opacity={0.75} />
        <ellipse cx={0} cy={0} rx={215} ry={46} fill="url(#cw-floorGlow)" opacity={0.35 + 0.65 * charge} />
        <ellipse cx={0} cy={0} rx={215} ry={46} fill="none" stroke="#7CC4FF" strokeWidth={3} opacity={0.6} />
        {/* back rim */}
        <path d="M-300 -720 A300 62 0 0 1 300 -720" fill="none" stroke="#9CD0FF" strokeWidth={4} opacity={0.55} />
        {charge > 0.02 ? <ellipse cx={0} cy={-170} rx={250} ry={230} fill="url(#cw-charge)" opacity={0.55 * charge} /> : null}
        {children}
      </g>
    );
  }
  return (
    <g transform={tr}>
      {/* front glass */}
      <path d={SIL} fill="url(#cw-glassFront)" stroke="#BFE4FF" strokeWidth={4} strokeOpacity={0.85} strokeLinejoin="round" />
      <path d="M-270 -672 L-212 -60 L-190 -60 L-236 -672 Z" fill="url(#cw-streak)" />
      <path d="M-222 -640 L-180 -150 L-170 -150 L-208 -640 Z" fill="#FFFFFF" opacity={0.16} />
      <path d="M246 -600 L196 -90 L206 -90 L262 -600 Z" fill="#FFFFFF" opacity={0.2} />
      <path d="M150 -610 L128 -250 L176 -250 L208 -610 Z" fill="#BFE4FF" opacity={0.06} />
      <path d="M-200 2 A215 46 0 0 0 60 44" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
      {/* thick base */}
      <path d="M-215 0 A215 46 0 0 0 215 0 L210 22 A210 44 0 0 1 -210 22 Z" fill="#8FC6FF" opacity={0.28} />
      {/* gold collar under the rim */}
      <path d="M-300 -720 A300 62 0 0 0 300 -720 L296 -686 A296 61 0 0 1 -296 -686 Z" fill="url(#cw-goldBand)" stroke="#FFF1B8" strokeWidth={2} />
      <path d="M-300 -720 A300 62 0 0 0 300 -720" fill="none" stroke="#E9FAFF" strokeWidth={6} opacity={0.9} />
      {rim > 0.01 ? <ellipse cx={0} cy={-720} rx={300} ry={62} fill="none" stroke="#9CEBFF" strokeWidth={16} opacity={0.5 * rim} /> : null}
      {/* gate: two sliding gold shutters */}
      <ellipse cx={0} cy={GATE.y + GATE.th + 14} rx={GATE.rx} ry={GATE.ry} fill="#020A20" opacity={0.45 * (1 - gate)} />
      <GateHalf side={-1} shift={gate * 236} hi={gateHi} />
      <GateHalf side={1} shift={gate * 236} hi={gateHi} />
      {lock > 0.01 ? (
        <g transform={`translate(0,${GATE.y + GATE.ry + GATE.th * 0.5}) scale(${lock})`}>
          <rect x={-40} y={-30} width={80} height={62} rx={12} fill="url(#cw-goldTop)" stroke="#5A3F08" strokeWidth={4} />
          <rect x={-33} y={-24} width={66} height={10} rx={5} fill="#FFF4C2" opacity={0.8} />
          <circle cx={0} cy={-2} r={10} fill="#3A2A06" />
          <rect x={-4.5} y={0} width={9} height={20} rx={3} fill="#3A2A06" />
        </g>
      ) : null}
    </g>
  );
};

export const Tag: React.FC<{x: number; y: number; text: string; a: number; color?: string; from?: [number, number]; size?: number}> = ({x, y, text, a, color = '#7FE0FF', from, size = 34}) => {
  if (a < 0.01) return null;
  const w = text.length * size * 0.66 + size * 1.5, h = size * 1.8;
  return (
    <g opacity={clamp01(a * 1.4)}>
      {from ? <line x1={from[0]} y1={from[1]} x2={lerp(from[0], x, a)} y2={lerp(from[1], y, a)} stroke={color} strokeWidth={size * 0.09} /> : null}
      {from ? <circle cx={from[0]} cy={from[1]} r={size * 0.22} fill={color} /> : null}
      <g transform={`translate(${x},${y}) scale(${0.7 + 0.3 * a})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill="#04112E" stroke={color} strokeWidth={size * 0.09} opacity={0.95} />
        <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={size} fill={color} letterSpacing={size * 0.08}>{text}</text>
      </g>
    </g>
  );
};

export const BigDigit: React.FC<{x: number; y: number; ch: string; a: number; color: string; core: string; pulse: number}> = ({x, y, ch, a, color, core, pulse}) => {
  if (a < 0.01) return null;
  const fs = 400;
  const common = {x: 0, y: fs * 0.355, textAnchor: 'middle' as const, fontFamily: FONT, fontWeight: 800, fontSize: fs};
  return (
    <g transform={`translate(${x},${y}) scale(${0.5 + 0.5 * a})`} opacity={clamp01(a * 1.5)}>
      <ellipse cx={0} cy={0} rx={260} ry={230} fill="url(#cw-digitGlow)" opacity={0.55 + 0.4 * pulse} />
      <text {...common} fill="none" stroke={color} strokeWidth={46} strokeLinejoin="round" opacity={0.16 + 0.1 * pulse}>{ch}</text>
      <text {...common} fill="none" stroke={color} strokeWidth={22} strokeLinejoin="round" opacity={0.4}>{ch}</text>
      <text {...common} fill={core} stroke={color} strokeWidth={5}>{ch}</text>
      <ellipse cx={0} cy={fs * 0.44} rx={170} ry={22} fill={color} opacity={0.3} />
    </g>
  );
};

/** shared gradients for the bucket art (ids cw-*); render once inside the <svg> that draws Bucket / Electrons / BigDigit */
export const CellDefs: React.FC = () => (
  <defs>
    <linearGradient id="cw-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A2A70" /><stop offset="0.3" stopColor="#051642" /><stop offset="1" stopColor="#020A22" /></linearGradient>
    <radialGradient id="cw-horizon"><stop offset="0" stopColor="#6FC2FF" stopOpacity={0.75} /><stop offset="0.5" stopColor="#2E7BFF" stopOpacity={0.3} /><stop offset="1" stopColor="#2E7BFF" stopOpacity={0} /></radialGradient>
    <linearGradient id="cw-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B2E78" stopOpacity={1} /><stop offset="0.3" stopColor="#0E3A92" stopOpacity={0.92} /><stop offset="0.62" stopColor="#0C3284" stopOpacity={0.4} /><stop offset="1" stopColor="#0A2A70" stopOpacity={0} /></linearGradient>
    <linearGradient id="cw-lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9F2FF" /><stop offset="1" stopColor="#35B9FF" /></linearGradient>
    <radialGradient id="cw-eglow"><stop offset="0" stopColor="#7FE6FF" stopOpacity={0.85} /><stop offset="0.45" stopColor="#3BA8FF" stopOpacity={0.3} /><stop offset="1" stopColor="#3BA8FF" stopOpacity={0} /></radialGradient>
    <radialGradient id="cw-ecore" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.4" stopColor="#A9F0FF" /><stop offset="1" stopColor="#1E8BFF" /></radialGradient>
    <linearGradient id="cw-trail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#BFF4FF" stopOpacity={0.9} /><stop offset="1" stopColor="#3BA8FF" stopOpacity={0} /></linearGradient>
    <linearGradient id="cw-glassBack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0B2A66" stopOpacity={0.85} /><stop offset="0.5" stopColor="#051338" stopOpacity={0.8} /><stop offset="1" stopColor="#0A2458" stopOpacity={0.85} /></linearGradient>
    <linearGradient id="cw-glassFront" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#D6F0FF" stopOpacity={0.42} /><stop offset="0.12" stopColor="#9CCBFF" stopOpacity={0.12} /><stop offset="0.5" stopColor="#7FB4FF" stopOpacity={0.03} /><stop offset="0.86" stopColor="#9CCBFF" stopOpacity={0.1} /><stop offset="1" stopColor="#D6F0FF" stopOpacity={0.36} /></linearGradient>
    <linearGradient id="cw-streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.75} /><stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0.3} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.02} /></linearGradient>
    <radialGradient id="cw-floorGlow"><stop offset="0" stopColor="#8FE8FF" stopOpacity={0.9} /><stop offset="1" stopColor="#1B5FD0" stopOpacity={0.35} /></radialGradient>
    <radialGradient id="cw-charge"><stop offset="0" stopColor="#58D6FF" stopOpacity={0.7} /><stop offset="1" stopColor="#58D6FF" stopOpacity={0} /></radialGradient>
    <radialGradient id="cw-pool"><stop offset="0" stopColor="#4FB4FF" stopOpacity={0.5} /><stop offset="1" stopColor="#4FB4FF" stopOpacity={0} /></radialGradient>
    <linearGradient id="cw-pedTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2B4C8E" /><stop offset="0.5" stopColor="#0E2250" /><stop offset="1" stopColor="#1C3A78" /></linearGradient>
    <linearGradient id="cw-pedSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#12306E" /><stop offset="0.3" stopColor="#081A44" /><stop offset="0.7" stopColor="#040F2C" /><stop offset="1" stopColor="#0C2458" /></linearGradient>
    <linearGradient id="cw-goldLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFE08A" /><stop offset="0.5" stopColor="#B8860B" /><stop offset="1" stopColor="#FFE9A0" /></linearGradient>
    <linearGradient id="cw-goldTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.28" stopColor="#F7CB52" /><stop offset="0.55" stopColor="#D9A21E" /><stop offset="0.8" stopColor="#F6D46A" /><stop offset="1" stopColor="#B07C10" /></linearGradient>
    <linearGradient id="cw-goldSideL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#E9B93A" /><stop offset="0.5" stopColor="#9A6C0C" /><stop offset="1" stopColor="#6E4B06" /></linearGradient>
    <linearGradient id="cw-goldSideR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6E4B06" /><stop offset="0.5" stopColor="#B07C10" /><stop offset="1" stopColor="#F2C445" /></linearGradient>
    <linearGradient id="cw-goldBand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFE9A0" /><stop offset="0.2" stopColor="#C9941A" /><stop offset="0.5" stopColor="#8A6410" /><stop offset="0.8" stopColor="#D9A21E" /><stop offset="1" stopColor="#FFE9A0" /></linearGradient>
    <linearGradient id="cw-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FE6FF" stopOpacity={0} /><stop offset="0.5" stopColor="#7FE6FF" stopOpacity={0.5} /><stop offset="1" stopColor="#BFF4FF" stopOpacity={0.75} /></linearGradient>
    <linearGradient id="cw-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9CD0FF" stopOpacity={0.3} /><stop offset="1" stopColor="#9CD0FF" stopOpacity={0} /></linearGradient>
    <radialGradient id="cw-digitGlow"><stop offset="0" stopColor="#3BB6FF" stopOpacity={0.5} /><stop offset="1" stopColor="#3BB6FF" stopOpacity={0} /></radialGradient>
    <radialGradient id="cw-heroGlow"><stop offset="0" stopColor="#FFE08A" stopOpacity={0.85} /><stop offset="1" stopColor="#FFB020" stopOpacity={0} /></radialGradient>
    <linearGradient id="cw-cable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A5FA8" /><stop offset="1" stopColor="#0A1C48" /></linearGradient>
    <clipPath id="cw-gateClip"><ellipse cx={0} cy={GATE.y} rx={GATE.rx} ry={GATE.ry} /></clipPath>
  </defs>
);

// ---- the world -----------------------------------------------------------------------------------------------------
const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tChip = at(beats, 'chip', 0, 27), tGrid = at(beats, 'grid', 0, 39), tCells = at(beats, 'cells', 0, 52);
  const tThink = at(beats, 'think', 0, 85), tEach = at(beats, 'each', 0, 94), tCell = at(beats, 'cell', 0, 99), tTiny = at(beats, 'tiny', 0, 112);
  const tBucket = at(beats, 'bucket', 0, 121), tGate = at(beats, 'gate', 0, 135), tPush = at(beats, 'push', 0, 171), tElec = at(beats, 'electrons', 0, 178);
  const tStay = at(beats, 'stay', 0, 209), tTrap = at(beats, 'trapped', 0, 215), tEven = at(beats, 'even', 0, 232), tPower = at(beats, 'power', 0, 246), tOff = at(beats, 'off', 0, 254);
  const tFull = at(beats, 'full', 0, 293), tEmpty = at(beats, 'empty', 0, 316), tMean = at(beats, 'mean', 0, 331), tOne = at(beats, 'one', 0, 338), tZero = at(beats, 'zero', 0, 347);
  const tPair = tFull - 9;

  const aB = sp(t, tBucket, 'settle');
  const m = sp(t, tPair, 'settle');
  const dim = sp(t, tOff, 'settle') * (1 - sp(t, tPair - 2, 'settle'));
  const decay = (a: number, d = 7) => (t >= a ? Math.exp(-(t - a) / d) : 0);

  // hero cell
  const heroOn = sp(t, tThink, 'pop') * (1 - aB);
  const hD = rowD(HERO_K), hF = hD * 1.012, hN = hD * 1.078, hh = 0.42 * (0.05 + 0.95 * sp(t, tGrid + HERO_K * 0.42, 'bouncy'));
  const hx0 = gx(-0.37, hF), hx1 = gx(0.37, hF), hx2 = gx(0.37, hN), hx3 = gx(-0.37, hN);
  const hyF = HY + hF - lift(hh, hF), hyN = HY + hN - lift(hh, hN);
  const hcx = VPX, hcy = (hyF + hyN) / 2;

  // bucket transform (grows out of the hero cell, later slides left to become the "full" bucket)
  const bx = lerp(lerp(hcx, BUCKET.x, aB), PAIR.xl, m);
  const bBase = lerp(lerp(hcy + 20, BUCKET.base, aB), PAIR.base, m);
  const bk = lerp(lerp(0.1, 1, aB), PAIR.k, m);

  // gate
  const slam = clamp01((t - (tTrap - 3)) / 3);
  const gOpen = sp(t, tPush, 'settle') * (1 - 0.3 * sp(t, tStay, 'settle')) * (1 - slam * slam);
  const gateHop = decay(tGate, 5);
  const gateHi = Math.max(decay(tGate, 9), decay(tTrap, 4) * 0.9);
  const shineP = clamp01((t - tGate) / 14);
  const charge = clamp01((t - tElec - E_FALL) / (E_REST.length * E_GAP));
  const lock = sp(t, tTrap + 1, 'bouncy');
  const beam = sp(t, tPush, 'settle') * (1 - slam);

  const electrons = <Electrons t={t} t0={tElec} kickAt={tTrap} glow={Math.max(dim, decay(tFull, 8), decay(tOne, 8))} />;
  const tfB = `translate(${bx},${bBase}) scale(${bk})`;

  // power line
  const cut = sp(t, tOff, 'pop');
  const pw = (1 - m) * aB;
  const live = 1 - clamp01((t - tOff) / 2);
  const powHi = Math.max(decay(tPower, 10), decay(tEven, 8) * 0.6);
  const dash = -t * 9;
  const cablePath = 'M330 2390 C640 2390 640 2110 880 2110 L960 2110';
  const plugX = -150 * cut;

  const eB = sp(t, tPair + 4, 'bouncy');

  return (
    <svg width={WW} height={WH} viewBox={`0 0 ${WW} ${WH}`} style={{overflow: 'visible', display: 'block'}}>
      <CellDefs />

      {/* ---------- the cell field ---------- */}
      <g opacity={(1 - 0.66 * aB) * (1 - 0.55 * dim)}>
        <Field t={t} beats={beats} />
      </g>

      {/* HUD on the die: frame brackets + silkscreen labels */}
      {(() => {
        const a = sp(t, tChip, 'pop') * (1 - sp(t, tThink, 'settle'));
        if (a < 0.01) return null;
        const x0 = 560, x1 = 1840, y0 = 860, y1 = 2380, L = 110, g = (1 - a) * 80;
        const cnt = sp(t, tCells, 'pop'), grd = sp(t, tGrid, 'pop');
        return (
          <g opacity={a}>
            {[[x0 - g, y0 - g, 1, 1], [x1 + g, y0 - g, -1, 1], [x0 - g, y1 + g, 1, -1], [x1 + g, y1 + g, -1, -1]].map(([x, y, sx, sy], i) => (
              <path key={i} d={`M${x + sx * L} ${y} L${x} ${y} L${x} ${y + sy * L}`} fill="none" stroke="#DDF6FF" strokeWidth={7} strokeLinecap="round" />
            ))}
            <rect x={x0 + 28} y={y1 - 96} width={520} height={70} rx={10} fill="#04112E" opacity={0.85} stroke="#5FD0FF" strokeWidth={2.5} />
            <circle cx={x0 + 62} cy={y1 - 61} r={11} fill="#5FF0A8" opacity={0.6 + 0.4 * Math.sin(t * 0.5)} />
            <text x={x0 + 90} y={y1 - 46} fontFamily={MONO} fontWeight={600} fontSize={40} fill="#DDF6FF" letterSpacing={3}>NAND FLASH CHIP</text>
            <g opacity={grd} transform={`translate(${x1 - 28},${y1 - 61})`}>
              <rect x={-470} y={-35} width={470} height={70} rx={10} fill="#04112E" opacity={0.85} stroke="#5FD0FF" strokeWidth={2.5} />
              <text x={-235} y={15} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={40} fill={cnt > 0.5 ? '#FFFFFF' : '#7FE0FF'} letterSpacing={3}>
                {cnt > 0.5 ? 'BILLIONS OF CELLS' : 'GRID · ROWS × COLS'}
              </text>
            </g>
          </g>
        );
      })()}

      {/* hero cell: reticle, gold top, dimension */}
      {heroOn > 0.01 ? (
        <g opacity={heroOn}>
          <ellipse cx={hcx} cy={hcy} rx={150} ry={110} fill="url(#cw-heroGlow)" opacity={0.6 + 0.3 * Math.sin(t * 0.4)} />
          <path d={`M${hx3} ${hyN} L${hx2} ${hyN} L${hx2} ${HY + hN} L${hx3} ${HY + hN} Z`} fill="#8A6410" />
          <path d={`M${hx0} ${hyF} L${hx1} ${hyF} L${hx2} ${hyN} L${hx3} ${hyN} Z`} fill="url(#cw-goldTop)" stroke="#FFF6CC" strokeWidth={2} />
          <path d={`M${hx0 + 14} ${hyF + 12} L${hx1 - 14} ${hyF + 12} L${hx2 - 16} ${hyN - 12} L${hx3 + 16} ${hyN - 12} Z`} fill="#BFF4FF" opacity={0.85} stroke="#FFFFFF" strokeWidth={1.5} />
          {/* reticle */}
          <g transform={`translate(${hcx},${hcy}) scale(${1.8 - 0.8 * sp(t, tThink, 'settle')})`}>
            <ellipse cx={0} cy={0} rx={86} ry={64} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="14 10" strokeDashoffset={t * 2} />
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
              <path key={i} d={`M${sx * 104} ${sy * 56} L${sx * 104} ${sy * 78} L${sx * 80} ${sy * 78}`} fill="none" stroke="#FFE08A" strokeWidth={4} strokeLinecap="round" />
            ))}
          </g>
          {/* "each": blips hop along the row */}
          {[-3, -2, -1, 1, 2, 3].map((j, i) => {
            const a = t >= tEach + i * 0.9 ? Math.exp(-(t - tEach - i * 0.9) / 5) : 0;
            return a > 0.02 ? <ellipse key={j} cx={gx(j, HERO_D)} cy={hcy} rx={52} ry={38} fill="none" stroke="#BFF4FF" strokeWidth={4} opacity={a} /> : null;
          })}
          {/* "cell" tag + "tiny" dimension */}
          <Tag x={hcx + 84} y={hcy - 100} text="1 CELL" a={sp(t, tCell, 'pop')} color="#FFE08A" from={[hx1 - 4, hyF + 4]} size={15} />
          {(() => {
            const a = sp(t, tTiny, 'pop');
            if (a < 0.01) return null;
            const y = HY + hN + 16, w = (hx2 - hx3) * a;
            return (
              <g opacity={a}>
                <line x1={hcx - w / 2} x2={hcx + w / 2} y1={y} y2={y} stroke="#FFFFFF" strokeWidth={2} />
                <line x1={hcx - w / 2} x2={hcx - w / 2} y1={y - 7} y2={y + 7} stroke="#FFFFFF" strokeWidth={2} />
                <line x1={hcx + w / 2} x2={hcx + w / 2} y1={y - 7} y2={y + 7} stroke="#FFFFFF" strokeWidth={2} />
                <rect x={hcx - 46} y={y + 9} width={92} height={24} rx={12} fill="#04112E" stroke="#FFFFFF" strokeWidth={1.5} />
                <text x={hcx} y={y + 26.5} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={14} fill="#FFFFFF">~20 nm</text>
              </g>
            );
          })()}
        </g>
      ) : null}

      {/* ---------- bucket stage ---------- */}
      {aB > 0.01 ? (
        <g opacity={clamp01(aB * 3)}>
          {/* god ray from above */}
          <path d={`M${BUCKET.x - 120} 300 L${BUCKET.x + 120} 300 L${BUCKET.x + 470} 1900 L${BUCKET.x - 470} 1900 Z`} fill="url(#cw-ray)" opacity={0.8 * (1 - m) * (1 - dim)} />

          {/* power line + breaker box (under the pedestal) */}
          {pw > 0.01 ? (
            <g opacity={pw}>
              <rect x={1176} y={1880} width={48} height={150} fill="url(#cw-pedSide)" stroke="#3E63B0" strokeWidth={2} />
              <path d={cablePath} fill="none" stroke="#020A20" strokeWidth={46} strokeLinecap="round" opacity={0.5} transform="translate(0,16)" />
              <g transform={`translate(${plugX},${cut * 26})`}>
                <path d={cablePath} fill="none" stroke="url(#cw-cable)" strokeWidth={34} strokeLinecap="round" />
                <path d={cablePath} fill="none" stroke="#7FA6E8" strokeWidth={5} strokeLinecap="round" opacity={0.6} transform="translate(0,-9)" />
                {live > 0.01 ? <path d={cablePath} fill="none" stroke="#FFE66B" strokeWidth={9 + 8 * powHi} strokeLinecap="round" strokeDasharray="34 46" strokeDashoffset={dash} opacity={(0.75 + 0.25 * powHi) * live} /> : null}
                {live > 0.01 && powHi > 0.02 ? <path d={cablePath} fill="none" stroke="#FFE66B" strokeWidth={60} strokeLinecap="round" opacity={0.22 * powHi} /> : null}
                {/* plug */}
                <rect x={946} y={2076} width={84} height={68} rx={12} fill="#1C3A78" stroke="#7FA6E8" strokeWidth={3} />
                <rect x={1030} y={2090} width={34} height={12} rx={3} fill="url(#cw-goldLine)" />
                <rect x={1030} y={2118} width={34} height={12} rx={3} fill="url(#cw-goldLine)" />
              </g>
              {/* breaker box */}
              <rect x={1060} y={2030} width={330} height={170} rx={20} fill="#020A20" opacity={0.5} transform="translate(8,14)" />
              <rect x={1060} y={2030} width={330} height={170} rx={20} fill="url(#cw-pedTop)" stroke="#6C93DC" strokeWidth={3.5} />
              <rect x={1074} y={2044} width={302} height={142} rx={12} fill="#061538" stroke="#274A92" strokeWidth={2} />
              <rect x={1064} y={2082} width={16} height={56} rx={4} fill="#01060F" />
              {[[1092, 2062], [1358, 2062], [1092, 2168], [1358, 2168]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#6C93DC" />)}
              {/* bolt */}
              <path d="M1150 2068 L1118 2122 L1142 2122 L1128 2166 L1172 2106 L1146 2106 Z" fill={live > 0.5 ? '#FFE66B' : '#33466E'} stroke={live > 0.5 ? '#FFF7C2' : '#22335A'} strokeWidth={2.5} />
              {live > 0.5 ? <circle cx={1145} cy={2116} r={70 + 30 * powHi} fill="#FFE66B" opacity={0.14 + 0.3 * powHi} /> : null}
              <text x={1196} y={2108} fontFamily={MONO} fontWeight={600} fontSize={36} fill={live > 0.5 ? '#EAF6FF' : '#5A6E9A'} letterSpacing={3}>POWER</text>
              <rect x={1196} y={2126} width={150} height={40} rx={20} fill={live > 0.5 ? '#0E4A2C' : '#4A0E16'} stroke={live > 0.5 ? '#5FF0A8' : '#FF5A6E'} strokeWidth={2.5} />
              <circle cx={live > 0.5 ? 1326 : 1216} cy={2146} r={14} fill={live > 0.5 ? '#5FF0A8' : '#FF5A6E'} />
              <text x={live > 0.5 ? 1262 : 1284} y={2156} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={live > 0.5 ? '#5FF0A8' : '#FF5A6E'}>{live > 0.5 ? 'ON' : 'OFF'}</text>
              {/* conduit current up to the pedestal */}
              {live > 0.01 ? <line x1={1200} y1={2030} x2={1200} y2={1884} stroke="#FFE66B" strokeWidth={7} strokeDasharray="16 20" strokeDashoffset={-dash} opacity={0.85 * live} /> : null}
              <Burst t={t} at={tOff} x={1050} y={2110} color="#FFE66B" n={20} r={190} />
              <Burst t={t} at={tOff + 1.5} x={1030} y={2110} color="#FFFFFF" n={10} r={110} />
            </g>
          ) : null}

          {/* empty bucket (right) */}
          {eB > 0.01 ? (
            <g opacity={clamp01(eB * 2)} transform={`translate(0,${(1 - eB) * 160})`}>
              <Bucket layer="back" x={PAIR.xr} base={PAIR.base} k={PAIR.k} gate={0} charge={0} />
              {t >= tEmpty && t < tEmpty + 22 ? (
                <g transform={`translate(${PAIR.xr},${PAIR.base}) scale(${PAIR.k})`}>
                  {(() => {
                    const q = (t - tEmpty) / 22, y = -40 - 620 * q;
                    return <ellipse cx={0} cy={y} rx={hw(y) - 6} ry={40 + 16 * q} fill="none" stroke="#9CEBFF" strokeWidth={8} opacity={1 - q} />;
                  })()}
                </g>
              ) : null}
              <Bucket layer="front" x={PAIR.xr} base={PAIR.base} k={PAIR.k} gate={0} rim={decay(tEmpty, 8)} gateHi={decay(tEmpty, 6) * 0.6} />
            </g>
          ) : null}

          {/* main bucket */}
          <Bucket layer="back" x={bx} base={bBase} k={bk} gate={gOpen} charge={charge}>
            {beam > 0.01 ? <path d="M-74 -1900 L74 -1900 L96 -40 L-96 -40 Z" fill="url(#cw-beam)" opacity={0.55 * beam} /> : null}
            {electrons}
          </Bucket>
          <g transform={`translate(0,${-gateHop * 14 * Math.abs(Math.sin((t - tGate) * 0.9))})`}>
            <Bucket layer="front" x={bx} base={bBase} k={bk} gate={gOpen} gateHi={gateHi} lock={lock} rim={Math.max(decay(tFull, 8), decay(tBucket, 8))} />
          </g>
          {/* gate shine sweep */}
          {shineP > 0 && shineP < 1 ? (
            <g transform={tfB} clipPath="url(#cw-gateClip)">
              <path d={`M${-420 + 840 * shineP} ${GATE.y - 80} l70 0 l-60 160 l-70 0 Z`} fill="#FFFFFF" opacity={0.75} />
              <path d={`M${-320 + 840 * shineP} ${GATE.y - 80} l22 0 l-60 160 l-22 0 Z`} fill="#FFFFFF" opacity={0.55} />
            </g>
          ) : null}
          {/* gate slam impact */}
          <g transform={tfB}>
            <Burst t={t} at={tTrap} x={0} y={GATE.y} color="#FFE08A" n={24} r={380} />
            <Ripple t={t} at={tTrap} x={0} y={GATE.y} color="#FFF6CC" r={520} />
            <Ripple t={t} at={tTrap + 2} x={0} y={GATE.y + 30} color="#7FE6FF" r={380} />
            <Ripple t={t} at={tBucket + 2} x={0} y={60} color="#7FE6FF" r={520} />
          </g>
          {/* push: pressure chevrons above the gate */}
          {t >= tPush && t < tTrap ? (
            <g transform={tfB} opacity={beam}>
              {[0, 1, 2].map((i) => {
                const q = ((t - tPush) * 0.09 + i / 3) % 1;
                return <path key={i} d={`M-70 ${-1010 + q * 170} L0 ${-960 + q * 170} L70 ${-1010 + q * 170}`} fill="none" stroke="#DDF6FF" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(q * Math.PI) * 0.9} />;
              })}
            </g>
          ) : null}

          {/* tags */}
          <Tag x={BUCKET.x + 280} y={BUCKET.base - 600} text="GATE" a={sp(t, tGate, 'pop') * (1 - sp(t, tPush, 'settle'))} color="#FFE08A" from={[BUCKET.x + 236, BUCKET.base + GATE.y + 40]} size={34} />
          <Tag x={BUCKET.x - 260} y={BUCKET.base - 420} text="ELECTRONS" a={sp(t, tElec + 8, 'pop') * (1 - sp(t, tStay, 'settle'))} color="#7FE6FF" from={[BUCKET.x - 120, BUCKET.base - 150]} size={30} />
        </g>
      ) : null}

      {/* ---------- power off: the world dims, the charge keeps glowing ---------- */}
      {dim > 0.01 ? (
        <g>
          <rect x={-2000} y={-2000} width={WW + 4000} height={WH + 4000} fill="#01040E" opacity={0.74 * dim} />
          <g transform={tfB} opacity={dim}>
            <ellipse cx={0} cy={-190} rx={330} ry={300} fill="url(#cw-charge)" opacity={0.5 + 0.2 * Math.sin(t * 0.3)} />
            {electrons}
            <Ripple t={t} at={tOff + 4} x={0} y={-180} color="#7FE6FF" r={420} />
          </g>
          <g opacity={dim}>
            <Tag x={BUCKET.x} y={BUCKET.base + 330} text="NO POWER" a={sp(t, tOff + 2, 'pop')} color="#FF6B7E" size={38} />
            <Tag x={BUCKET.x + 250} y={BUCKET.base - 330} text="STILL STORED" a={sp(t, tOff + 12, 'pop')} color="#7FE6FF" from={[BUCKET.x + 110, BUCKET.base - 200]} size={28} />
          </g>
        </g>
      ) : null}

      {/* ---------- full = 1, empty = 0 ---------- */}
      {m > 0.01 ? (
        <g>
          {(() => {
            const a = sp(t, tMean, 'pop');
            if (a < 0.01) return null;
            return [PAIR.xl, PAIR.xr].map((x, i) => (
              <g key={i} opacity={a}>
                {[0, 1].map((n) => {
                  const q = ((t - tMean) * 0.08 + n / 2) % 1;
                  return <path key={n} d={`M${x - 26} ${1634 + q * 34} L${x} ${1654 + q * 34} L${x + 26} ${1634 + q * 34}`} fill="none" stroke={i ? '#9FB4FF' : '#7FE6FF'} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(q * Math.PI)} />;
                })}
                <rect x={x - 130} y={DIGIT_Y - 150} width={260} height={300} rx={28} fill="none" stroke={i ? '#9FB4FF' : '#7FE6FF'} strokeWidth={4} strokeDasharray="18 16" opacity={0.5 * (1 - sp(t, i ? tZero : tOne, 'pop'))} />
              </g>
            ));
          })()}
          <Tag x={PAIR.xl} y={1100} text="FULL" a={sp(t, tFull, 'pop')} color="#7FE6FF" size={30} />
          <Tag x={PAIR.xr} y={1100} text="EMPTY" a={sp(t, tEmpty, 'pop')} color="#9FB4FF" size={30} />
          <BigDigit x={PAIR.xl} y={DIGIT_Y} ch="1" a={sp(t, tOne, 'bouncy')} color="#39C6FF" core="#F2FCFF" pulse={decay(tOne, 8)} />
          <BigDigit x={PAIR.xr} y={DIGIT_Y} ch="0" a={sp(t, tZero, 'bouncy')} color="#6F8CFF" core="#0A1E55" pulse={decay(tZero, 8)} />
          <Burst t={t} at={tOne} x={PAIR.xl} y={DIGIT_Y} color="#7FE6FF" n={18} r={260} />
          <Burst t={t} at={tZero} x={PAIR.xr} y={DIGIT_Y} color="#9FB4FF" n={18} r={260} />
        </g>
      ) : null}
    </svg>
  );
};

export const cellsWorld: WorldDef = {
  id: 'cells',
  home: 'field',
  anchors: {
    field: {x: 1200, y: 1500, zoom: 0.78},
    grid: {x: 1200, y: 1330, zoom: 0.95},
    cell: {x: HERO.x, y: HERO.y - 30, zoom: 2.7},
    bucket: {x: BUCKET.x, y: 1500, zoom: 1.1},
    gate: {x: BUCKET.x, y: 1140, zoom: 1.4},
    electrons: {x: BUCKET.x, y: 1340, zoom: 1.08},
    power: {x: 1130, y: 2010, zoom: 1.45},
    full: {x: PAIR.xl, y: 1330, zoom: 1.9},
    empty: {x: PAIR.xr, y: 1330, zoom: 1.9},
    one: {x: PAIR.xl, y: 1700, zoom: 1.45},
  },
  aliases: {
    flash: 'field', chip: 'field', cells: 'field', think: 'field',
    each: 'cell', tiny: 'cell',
    push: 'gate', stay: 'electrons', trapped: 'electrons',
    off: 'bucket', zero: 'bucket',
  },
  palette: {bg0: '#01061A', bg1: '#0A2A70', particles: '#8FD8FF', glow: '#2E7BFF'},
  Draw,
};
