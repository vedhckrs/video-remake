// S03 - ONE continuous nanoscopic dive: NAND package -> silicon die -> memory array -> 3D NAND string -> one cell.
// Engine: src/kit/explainer/nano.tsx (NanoZoom). Every portal is the level centre (0,0), so the camera never pans:
// the only camera move is the zoom itself. Each level also draws a low-detail copy of the NEXT level inside its
// portal (at the exact hand-off scale), so the engine's cross-fade is between two matching pictures.
import React from 'react';
import type {SceneProps} from '../../../src/kit/types';
import {NanoZoom, type NanoKey, type NanoLevel, type NanoLevelProps} from '../../../src/kit/explainer/nano';
import {Burst, Ripple, type Beat} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp, mix} from '../../../src/kit/explainer/tokens';
import {at, Bucket, Electrons, Tag, BigDigit, CellDefs, E_REST, E_GAP, E_FALL, GATE, hw, SIL} from './cells';

// ---- maths ---------------------------------------------------------------------------------------------------------
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const h2 = (a: number, b: number) => {
  const v = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const ss = (x: number, a: number, b: number) => {
  const q = clamp01((x - a) / (b - a));
  return q * q * (3 - 2 * q);
};
/** smooth 0..1 as the level's magnification goes from a to b (log space) - used for level-of-detail fades */
const ramp = (scale: number, a: number, b: number) => ss(Math.log(scale), Math.log(a), Math.log(b));
const decayAt = (t: number, a: number, d = 7) => (t >= a ? Math.exp(-(t - a) / d) : 0);

// ---- the dive: depth (log10 magnification) over design frames ------------------------------------------------------
const DEPTH = {pkg: 0, die: 1, arr: 2, str: 3.3, cell: 4.15};
const D_CELL = 4.3; // where the camera settles for the bucket story (cell level shown at 1.41x)
const KNOTS: [number, number][] = [[-200, 0], [17, 0], [34, 1], [51, 2], [91, 3.3], [119, D_CELL], [283, D_CELL], [305, DEPTH.cell], [2000, DEPTH.cell]];
const rawDepth = (t: number) => {
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const [ta, da] = KNOTS[i], [tb, db] = KNOTS[i + 1];
    if (t <= tb) return da + (db - da) * clamp01((t - ta) / (tb - ta));
  }
  return KNOTS[KNOTS.length - 1][1];
};
/** piecewise-linear dive smoothed with a wide Hann window: speed and acceleration are continuous, no stops at the levels */
const SMOOTH_R = 9;
const smoothDepth = (t: number) => {
  let sum = 0, wsum = 0;
  const N = 24;
  for (let k = -N; k <= N; k++) {
    const w = 0.5 + 0.5 * Math.cos((Math.PI * k) / N);
    sum += w * rawDepth(t + (SMOOTH_R * k) / N);
    wsum += w;
  }
  return sum / wsum;
};
// The engine eases every key-to-key segment; sampling our own curve every quarter frame makes it follow the curve exactly.
const KEYS: NanoKey[] = Array.from({length: 4 * 420 + 1}, (_, i) => ({t: i / 4, depth: smoothDepth(i / 4)}));

// ---- shared drawing helpers ----------------------------------------------------------------------------------------
const BX = 1500, BY = 2600; // every level paints this far around its centre (it is seen zoomed out while it fades in)
const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={2 * BX} height={2 * BY} viewBox={`${-BX} ${-BY} ${2 * BX} ${2 * BY}`}
       style={{position: 'absolute', left: -BX, top: -BY, display: 'block', overflow: 'visible'}}>
    {children}
  </svg>
);
type ArtProps = {t: number; beats: Beat[]; /** effective on-screen magnification of this art */ s: number; lite?: boolean};

const GoldDefs: React.FC = () => (
  <>
    <linearGradient id="nz-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.3" stopColor="#F7CB52" /><stop offset="0.6" stopColor="#C9941A" /><stop offset="1" stopColor="#8A6410" /></linearGradient>
    <radialGradient id="nz-ball" cx="36%" cy="30%" r="80%"><stop offset="0" stopColor="#FFF6CC" /><stop offset="0.35" stopColor="#F2C445" /><stop offset="0.8" stopColor="#9A6C0C" /><stop offset="1" stopColor="#5A3F08" /></radialGradient>
    <radialGradient id="nz-soft"><stop offset="0" stopColor="#FFFFFF" stopOpacity={1} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient>
  </>
);

// ---- HUD: a depth gauge locked to the screen (drawn identically by every level, so it never changes in a hand-off) --
const HUD_STOPS = [{d: DEPTH.pkg, name: 'PACKAGE'}, {d: DEPTH.die, name: 'SILICON DIE'}, {d: DEPTH.arr, name: 'CELL ARRAY'}, {d: DEPTH.str, name: 'NAND STRING'}, {d: D_CELL, name: 'ONE CELL'}];
const fmtZoom = (v: number) => {
  if (v < 10) return v.toFixed(1);
  const p = Math.pow(10, Math.floor(Math.log10(v)) - 1);
  return (Math.round(v / p) * p).toLocaleString('en-US');
};
const Hud: React.FC<{t: number; scale: number; depth: number}> = ({t, scale, depth}) => {
  const a = ss(t, 3, 11) * (1 - ss(t, 128, 140));
  if (a < 0.01) return null;
  const D = Math.min(D_CELL, depth + Math.log10(scale));
  const x = -484, y0 = -290, y1 = 520;
  const yy = (d: number) => y0 + ((y1 - y0) * d) / D_CELL;
  const py = yy(D);
  return (
    <g transform={`scale(${1 / scale})`} opacity={a}>
      <rect x={x - 22} y={y0 - 34} width={44} height={y1 - y0 + 128} rx={22} fill="#02060F" opacity={0.5} />
      <line x1={x} y1={y0} x2={x} y2={y1} stroke="#DCEBFF" strokeWidth={2} opacity={0.5} />
      <line x1={x} y1={y0} x2={x} y2={py} stroke="#7FE6FF" strokeWidth={4} strokeLinecap="round" />
      {Array.from({length: 44}).map((_, i) => (
        <line key={i} x1={x - (i % 5 === 0 ? 9 : 5)} x2={x} y1={yy(i * 0.1)} y2={yy(i * 0.1)} stroke="#DCEBFF" strokeWidth={1.5} opacity={i * 0.1 <= D ? 0.9 : 0.35} />
      ))}
      {HUD_STOPS.map((st, i) => {
        const near = clamp01(1 - Math.abs(D - st.d) / 0.55), on = D >= st.d - 0.02;
        return (
          <g key={i}>
            <circle cx={x} cy={yy(st.d)} r={7} fill={on ? '#7FE6FF' : '#0A1830'} stroke="#DCEBFF" strokeWidth={2} />
            <text x={x + 30} y={yy(st.d) + 7} fontFamily={MONO} fontWeight={600} fontSize={20} letterSpacing={2} fill={on ? '#EAF6FF' : '#9FB4D8'}
                  stroke="#02060F" strokeWidth={5} paintOrder="stroke" opacity={0.3 + 0.7 * near}>{st.name}</text>
          </g>
        );
      })}
      <circle cx={x} cy={py} r={20} fill="url(#nz-soft)" opacity={0.55} />
      <path d={`M${x + 8} ${py} l14 -9 l0 18 Z`} fill="#FFE08A" />
      <circle cx={x} cy={py} r={5} fill="#FFFFFF" />
      <text x={x - 14} y={y1 + 62} fontFamily={MONO} fontWeight={600} fontSize={24} fill="#FFE08A" stroke="#02060F" strokeWidth={5} paintOrder="stroke">
        {`×${fmtZoom(Math.pow(10, 1.325 * D))}`}
      </text>
    </g>
  );
};

// =====================================================================================================================
// LEVEL 4 (declared first because level 3 embeds it) - ONE CELL: the glass bucket with the gold gate, inside the channel
// =====================================================================================================================
const K34 = Math.pow(10, -(DEPTH.cell - DEPTH.str)); // one cell-level px = K34 string-level px (1 / 7.08)
const G4 = 'translate(0,250) scale(0.68) translate(-1200,-1800)'; // "stage" coords (the v2 bucket world) -> cell-level px
const BK = {x: 1200, base: 1800};
const PAIR = {xl: 825, xr: 1575, base: 1726, k: 1};
const DIGIT_Y = 2262;
const NB = 1082; // neighbour cells of the string sit one layer above / below (stage px)

/** the resting bucket exactly as the string level shows it (closed gate, empty) */
const RestBucket: React.FC<{y?: number; charge?: number}> = ({y = 0, charge = 0}) => (
  <g>
    <Bucket layer="back" x={BK.x} base={BK.base + y} k={1} gate={0} charge={charge} />
    <Bucket layer="front" x={BK.x} base={BK.base + y} k={1} gate={0} />
  </g>
);

const ScaleBar: React.FC<{a: number}> = ({a}) => (
  <g opacity={a}>
    <line x1={BK.x - 322} x2={BK.x + 322} y1={2030} y2={2030} stroke="#FFFFFF" strokeWidth={6} />
    <line x1={BK.x - 322} x2={BK.x - 322} y1={2008} y2={2052} stroke="#FFFFFF" strokeWidth={6} />
    <line x1={BK.x + 322} x2={BK.x + 322} y1={2008} y2={2052} stroke="#FFFFFF" strokeWidth={6} />
    <rect x={BK.x - 150} y={2062} width={300} height={84} rx={42} fill="#04112E" stroke="#FFFFFF" strokeWidth={4} />
    <text x={BK.x} y={2124} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={56} fill="#FFFFFF">~20 nm</text>
  </g>
);

const CellStage: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const tTiny = at(beats, 'tiny', 0, 112.5), tBucket = at(beats, 'bucket', 0, 121), tGate = at(beats, 'gate', 0, 135), tPush = at(beats, 'push', 0, 171.5), tElec = at(beats, 'electrons', 0, 178.5);
  const tStay = at(beats, 'stay', 0, 209), tTrap = at(beats, 'trapped', 0, 215.5), tEven = at(beats, 'even', 0, 232.5), tPower = at(beats, 'power', 0, 246), tOff = at(beats, 'off', 0, 254.5);
  const tFull = at(beats, 'full', 0, 293.5), tEmpty = at(beats, 'empty', 0, 316), tMean = at(beats, 'mean', 0, 331.5), tOne = at(beats, 'one', 0, 338), tZero = at(beats, 'zero', 0, 347.5);
  const tPair = tFull - 9;

  const m = sp(t, tPair, 'settle');
  const dim = sp(t, tOff, 'settle') * (1 - sp(t, tPair - 2, 'settle'));
  const bx = lerp(BK.x, PAIR.xl, m), bBase = lerp(BK.base, PAIR.base, m), bk = lerp(1, PAIR.k, m);

  const slam = clamp01((t - (tTrap - 3)) / 3);
  const gOpen = 0.72 * sp(t, tPush, 'settle') * (1 - 0.3 * sp(t, tStay, 'settle')) * (1 - slam * slam);
  const gateHop = decayAt(t, tGate, 5);
  const gateHi = Math.max(decayAt(t, tGate, 9), decayAt(t, tTrap, 4) * 0.9);
  const shineP = clamp01((t - tGate) / 14);
  const charge = clamp01((t - tElec - E_FALL) / (E_REST.length * E_GAP));
  const lock = sp(t, tTrap + 1, 'bouncy');
  const beam = sp(t, tPush, 'settle') * (1 - slam);
  const electrons = <Electrons t={t} t0={tElec} kickAt={tTrap} glow={Math.max(dim, decayAt(t, tFull, 8), decayAt(t, tOne, 8))} />;
  const tfB = `translate(${bx},${bBase}) scale(${bk})`;

  const cut = sp(t, tOff, 'pop');
  const pw = (1 - m) * ss(t, tEven - 3, tEven + 7);
  const live = 1 - clamp01((t - tOff) / 2);
  const powHi = Math.max(decayAt(t, tPower, 10), decayAt(t, tEven, 8) * 0.6);
  const dash = -t * 9;
  const cablePath = 'M330 2390 C640 2390 640 2110 880 2110 L960 2110';
  const plugX = -150 * cut;
  const eB = sp(t, tPair + 4, 'bouncy');
  const nb = 1 - ss(t, tBucket - 5, tBucket + 5);
  const bar = ss(t, tTiny, tTiny + 3) * (1 - ss(t, tBucket + 6, tBucket + 14));

  return (
    <g transform={G4}>
      {/* the two neighbour cells of the string, still there when we arrive, then they melt out of focus */}
      {nb > 0.01 ? <g opacity={nb}><RestBucket y={-NB} /><RestBucket y={NB} /></g> : null}

      {/* light shaft down the channel + floor glow */}
      <path d={`M${BK.x - 150} 0 L${BK.x + 150} 0 L${BK.x + 520} 1900 L${BK.x - 520} 1900 Z`} fill="url(#nz-c-ray)" opacity={(0.55 + 0.25 * decayAt(t, tBucket, 12)) * (1 - 0.8 * m) * (1 - dim)} />
      <ellipse cx={BK.x} cy={1900} rx={760} ry={210} fill="url(#nz-c-pool)" opacity={0.7 * (1 - m) * (1 - nb)} />

      {/* "tiny": the scale bar the string level started (same place, same size) */}
      {bar > 0.01 ? <ScaleBar a={bar} /> : null}

      {/* power line + breaker box (slides up on "even") */}
      {pw > 0.01 ? (
        <g opacity={pw} transform={`translate(0,${(1 - pw) * 70})`}>
          <rect x={1176} y={1880} width={48} height={150} fill="url(#cw-pedSide)" stroke="#3E63B0" strokeWidth={2} />
          <path d={cablePath} fill="none" stroke="#020A20" strokeWidth={46} strokeLinecap="round" opacity={0.5} transform="translate(0,16)" />
          <g transform={`translate(${plugX},${cut * 26})`}>
            <path d={cablePath} fill="none" stroke="url(#cw-cable)" strokeWidth={34} strokeLinecap="round" />
            <path d={cablePath} fill="none" stroke="#7FA6E8" strokeWidth={5} strokeLinecap="round" opacity={0.6} transform="translate(0,-9)" />
            {live > 0.01 ? <path d={cablePath} fill="none" stroke="#FFE66B" strokeWidth={9 + 8 * powHi} strokeLinecap="round" strokeDasharray="34 46" strokeDashoffset={dash} opacity={(0.75 + 0.25 * powHi) * live} /> : null}
            {live > 0.01 && powHi > 0.02 ? <path d={cablePath} fill="none" stroke="#FFE66B" strokeWidth={60} strokeLinecap="round" opacity={0.22 * powHi} /> : null}
            <rect x={946} y={2076} width={84} height={68} rx={12} fill="#1C3A78" stroke="#7FA6E8" strokeWidth={3} />
            <rect x={1030} y={2090} width={34} height={12} rx={3} fill="url(#cw-goldLine)" />
            <rect x={1030} y={2118} width={34} height={12} rx={3} fill="url(#cw-goldLine)" />
          </g>
          <rect x={1060} y={2030} width={330} height={170} rx={20} fill="#020A20" opacity={0.5} transform="translate(8,14)" />
          <rect x={1060} y={2030} width={330} height={170} rx={20} fill="url(#cw-pedTop)" stroke="#6C93DC" strokeWidth={3.5} />
          <rect x={1074} y={2044} width={302} height={142} rx={12} fill="#061538" stroke="#274A92" strokeWidth={2} />
          <rect x={1064} y={2082} width={16} height={56} rx={4} fill="#01060F" />
          {[[1092, 2062], [1358, 2062], [1092, 2168], [1358, 2168]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#6C93DC" />)}
          <path d="M1150 2068 L1118 2122 L1142 2122 L1128 2166 L1172 2106 L1146 2106 Z" fill={live > 0.5 ? '#FFE66B' : '#33466E'} stroke={live > 0.5 ? '#FFF7C2' : '#22335A'} strokeWidth={2.5} />
          {live > 0.5 ? <circle cx={1145} cy={2116} r={70 + 30 * powHi} fill="#FFE66B" opacity={0.14 + 0.3 * powHi} /> : null}
          <text x={1196} y={2108} fontFamily={MONO} fontWeight={600} fontSize={36} fill={live > 0.5 ? '#EAF6FF' : '#5A6E9A'} letterSpacing={3}>POWER</text>
          <rect x={1196} y={2126} width={150} height={40} rx={20} fill={live > 0.5 ? '#0E4A2C' : '#4A0E16'} stroke={live > 0.5 ? '#5FF0A8' : '#FF5A6E'} strokeWidth={2.5} />
          <circle cx={live > 0.5 ? 1326 : 1216} cy={2146} r={14} fill={live > 0.5 ? '#5FF0A8' : '#FF5A6E'} />
          <text x={live > 0.5 ? 1262 : 1284} y={2156} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={live > 0.5 ? '#5FF0A8' : '#FF5A6E'}>{live > 0.5 ? 'ON' : 'OFF'}</text>
          {live > 0.01 ? <line x1={1200} y1={2030} x2={1200} y2={1884} stroke="#FFE66B" strokeWidth={7} strokeDasharray="16 20" strokeDashoffset={-dash} opacity={0.85 * live} /> : null}
          <Burst t={t} at={tOff} x={1050} y={2110} color="#FFE66B" n={20} r={190} />
          <Burst t={t} at={tOff + 1.5} x={1030} y={2110} color="#FFFFFF" n={10} r={110} />
        </g>
      ) : null}

      {/* empty bucket (right) */}
      {eB > 0.01 ? (
        <g opacity={clamp01(eB * 2)} transform={`translate(${(1 - eB) * 240},0)`}>
          <Bucket layer="back" x={PAIR.xr} base={PAIR.base} k={PAIR.k} gate={0} charge={0} />
          {t >= tEmpty && t < tEmpty + 22 ? (
            <g transform={`translate(${PAIR.xr},${PAIR.base}) scale(${PAIR.k})`}>
              {(() => {
                const q = (t - tEmpty) / 22, y = -40 - 620 * q;
                return <ellipse cx={0} cy={y} rx={hw(y) - 6} ry={40 + 16 * q} fill="none" stroke="#9CEBFF" strokeWidth={8} opacity={1 - q} />;
              })()}
            </g>
          ) : null}
          <Bucket layer="front" x={PAIR.xr} base={PAIR.base} k={PAIR.k} gate={0} rim={decayAt(t, tEmpty, 8)} gateHi={decayAt(t, tEmpty, 6) * 0.6} />
        </g>
      ) : null}

      {/* main bucket */}
      <Bucket layer="back" x={bx} base={bBase} k={bk} gate={gOpen} charge={charge}>
        {beam > 0.01 ? <path d="M-74 -1900 L74 -1900 L96 -40 L-96 -40 Z" fill="url(#cw-beam)" opacity={0.55 * beam} /> : null}
        {electrons}
      </Bucket>
      <g transform={`translate(0,${-gateHop * 14 * Math.abs(Math.sin((t - tGate) * 0.9))})`}>
        <Bucket layer="front" x={bx} base={bBase} k={bk} gate={gOpen} gateHi={gateHi} lock={lock} rim={Math.max(decayAt(t, tFull, 8), decayAt(t, tBucket, 10))} />
      </g>
      {shineP > 0 && shineP < 1 ? (
        <g transform={tfB} clipPath="url(#cw-gateClip)">
          <path d={`M${-420 + 840 * shineP} ${GATE.y - 80} l70 0 l-60 160 l-70 0 Z`} fill="#FFFFFF" opacity={0.75} />
          <path d={`M${-320 + 840 * shineP} ${GATE.y - 80} l22 0 l-60 160 l-22 0 Z`} fill="#FFFFFF" opacity={0.55} />
        </g>
      ) : null}
      <g transform={tfB}>
        <Burst t={t} at={tTrap} x={0} y={GATE.y} color="#FFE08A" n={24} r={380} />
        <Ripple t={t} at={tTrap} x={0} y={GATE.y} color="#FFF6CC" r={520} />
        <Ripple t={t} at={tTrap + 2} x={0} y={GATE.y + 30} color="#7FE6FF" r={380} />
        <Ripple t={t} at={tBucket + 1} x={0} y={60} color="#7FE6FF" r={520} />
      </g>
      {t >= tPush && t < tTrap ? (
        <g transform={tfB} opacity={beam}>
          {[0, 1, 2].map((i) => {
            const q = ((t - tPush) * 0.09 + i / 3) % 1;
            return <path key={i} d={`M-70 ${-1010 + q * 170} L0 ${-960 + q * 170} L70 ${-1010 + q * 170}`} fill="none" stroke="#DDF6FF" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(q * Math.PI) * 0.9} />;
          })}
        </g>
      ) : null}

      <Tag x={BK.x + 270} y={BK.base - 600} text="GATE" a={sp(t, tGate, 'pop') * (1 - sp(t, tPush, 'settle'))} color="#FFE08A" from={[BK.x + 236, BK.base + GATE.y + 40]} size={34} />
      <Tag x={BK.x - 250} y={BK.base - 420} text="ELECTRONS" a={sp(t, tElec + 8, 'pop') * (1 - sp(t, tStay, 'settle'))} color="#7FE6FF" from={[BK.x - 120, BK.base - 150]} size={30} />
      <Tag x={BK.x} y={BK.base + 260} text="TRAPPED" a={sp(t, tTrap + 2, 'pop') * (1 - ss(t, tEven - 8, tEven - 2))} color="#FFE08A" size={40} />

      {/* power off: the world dims, the charge keeps glowing */}
      {dim > 0.01 ? (
        <g>
          <rect x={-9000} y={-9000} width={20000} height={20000} fill="#01040E" opacity={0.74 * dim} />
          <g transform={tfB} opacity={dim}>
            <ellipse cx={0} cy={-190} rx={330} ry={300} fill="url(#cw-charge)" opacity={0.5 + 0.2 * Math.sin(t * 0.3)} />
            {electrons}
            <Ripple t={t} at={tOff + 4} x={0} y={-180} color="#7FE6FF" r={420} />
          </g>
          <g opacity={dim}>
            <Tag x={BK.x} y={BK.base + 470} text="NO POWER" a={sp(t, tOff + 2, 'pop')} color="#FF6B7E" size={38} />
            <Tag x={BK.x + 240} y={BK.base - 330} text="STILL STORED" a={sp(t, tOff + 12, 'pop')} color="#7FE6FF" from={[BK.x + 110, BK.base - 200]} size={28} />
          </g>
        </g>
      ) : null}

      {/* full = 1, empty = 0 */}
      {m > 0.01 ? (
        <g>
          {(() => {
            const a = sp(t, tMean, 'pop');
            if (a < 0.01) return null;
            return [PAIR.xl, PAIR.xr].map((x, i) => (
              <g key={i} opacity={a}>
                {[0, 1].map((n) => {
                  const q = ((t - tMean) * 0.08 + n / 2) % 1;
                  return <path key={n} d={`M${x - 34} ${PAIR.base + 190 + q * 40} L${x} ${PAIR.base + 216 + q * 40} L${x + 34} ${PAIR.base + 190 + q * 40}`} fill="none" stroke={i ? '#9FB4FF' : '#7FE6FF'} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(q * Math.PI)} />;
                })}
                <rect x={x - 180} y={DIGIT_Y - 225} width={360} height={450} rx={38} fill="none" stroke={i ? '#9FB4FF' : '#7FE6FF'} strokeWidth={5} strokeDasharray="22 18" opacity={0.5 * (1 - sp(t, i ? tZero : tOne, 'pop'))} />
              </g>
            ));
          })()}
          <Tag x={PAIR.xl} y={PAIR.base - 900} text="FULL" a={sp(t, tFull, 'pop')} color="#7FE6FF" size={44} />
          <Tag x={PAIR.xr} y={PAIR.base - 900} text="EMPTY" a={sp(t, tEmpty, 'pop')} color="#9FB4FF" size={44} />
          <g transform={`translate(${PAIR.xl},${DIGIT_Y}) scale(1.45)`}><BigDigit x={0} y={0} ch="1" a={sp(t, tOne, 'bouncy')} color="#39C6FF" core="#F2FCFF" pulse={decayAt(t, tOne, 8)} /></g>
          <g transform={`translate(${PAIR.xr},${DIGIT_Y}) scale(1.45)`}><BigDigit x={0} y={0} ch="0" a={sp(t, tZero, 'bouncy')} color="#6F8CFF" core="#0A1E55" pulse={decayAt(t, tZero, 8)} /></g>
          <Burst t={t} at={tOne} x={PAIR.xl} y={DIGIT_Y} color="#7FE6FF" n={18} r={260} />
          <Burst t={t} at={tZero} x={PAIR.xr} y={DIGIT_Y} color="#9FB4FF" n={18} r={260} />
        </g>
      ) : null}
    </g>
  );
};

// =====================================================================================================================
// LEVEL 3 - 3D NAND STRING: a cross-section of one tower. Word-line metal / oxide layers, the channel hole, one cell per layer.
// =====================================================================================================================
const SP = 104, WLH = 60, TUBE = 70, WALL = 18, NL = 9; // layer pitch, word-line thickness, channel radius, wall, layers each way
const hwS = (y: number) => 677 - 0.128 * y; // half-width of the tower face (it widens towards the roof: we look down on it)
const TOUT = TUBE + WALL;

const StringDefs: React.FC = () => (
  <defs>
    <GoldDefs />
    <linearGradient id="nz-s-cu" gradientUnits="userSpaceOnUse" x1={-820} y1={0} x2={820} y2={0}>
      <stop offset="0" stopColor="#2A1009" /><stop offset="0.16" stopColor="#7A3D20" /><stop offset="0.36" stopColor="#D98A52" /><stop offset="0.5" stopColor="#FFD2A0" /><stop offset="0.64" stopColor="#D98A52" /><stop offset="0.84" stopColor="#7A3D20" /><stop offset="1" stopColor="#2A1009" />
    </linearGradient>
    <linearGradient id="nz-s-ox" gradientUnits="userSpaceOnUse" x1={-820} y1={0} x2={820} y2={0}>
      <stop offset="0" stopColor="#0C0528" /><stop offset="0.3" stopColor="#2A176E" /><stop offset="0.5" stopColor="#4A2FB8" /><stop offset="0.7" stopColor="#2A176E" /><stop offset="1" stopColor="#0C0528" />
    </linearGradient>
    <linearGradient id="nz-s-wall" gradientUnits="userSpaceOnUse" x1={-TOUT} y1={0} x2={TOUT} y2={0}>
      <stop offset="0" stopColor="#EAF4FF" /><stop offset="0.035" stopColor="#49D6C6" /><stop offset="0.07" stopColor="#F2C063" /><stop offset="0.1" stopColor="#0E0A3F" />
      <stop offset="0.3" stopColor="#1E2BA0" /><stop offset="0.5" stopColor="#4352EC" /><stop offset="0.7" stopColor="#1E2BA0" />
      <stop offset="0.9" stopColor="#0E0A3F" /><stop offset="0.93" stopColor="#F2C063" /><stop offset="0.965" stopColor="#49D6C6" /><stop offset="1" stopColor="#EAF4FF" />
    </linearGradient>
    <linearGradient id="nz-s-shaft" gradientUnits="userSpaceOnUse" x1={-34} y1={0} x2={34} y2={0}>
      <stop offset="0" stopColor="#BFE9FF" stopOpacity={0} /><stop offset="0.5" stopColor="#BFE9FF" stopOpacity={0.42} /><stop offset="1" stopColor="#BFE9FF" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="nz-s-spill" gradientUnits="userSpaceOnUse" x1={-460} y1={0} x2={460} y2={0}>
      <stop offset="0" stopColor="#8C7BFF" stopOpacity={0} /><stop offset="0.5" stopColor="#9C8CFF" stopOpacity={0.42} /><stop offset="1" stopColor="#8C7BFF" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="nz-s-fog" gradientUnits="userSpaceOnUse" x1={0} y1={-960} x2={0} y2={960}>
      <stop offset="0" stopColor="#0A0530" stopOpacity={0.72} /><stop offset="0.3" stopColor="#0A0530" stopOpacity={0} /><stop offset="0.68" stopColor="#0A0530" stopOpacity={0} /><stop offset="1" stopColor="#050218" stopOpacity={0.82} />
    </linearGradient>
    <linearGradient id="nz-s-roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B78F0" /><stop offset="1" stopColor="#1A4FCB" /></linearGradient>
    <linearGradient id="nz-s-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B78F0" stopOpacity={0} /><stop offset="0.03" stopColor="#8FC2FF" stopOpacity={0.9} /><stop offset="0.05" stopColor="#3B78F0" /><stop offset="1" stopColor="#1A4FCB" /></linearGradient>
    <linearGradient id="nz-s-street" gradientUnits="userSpaceOnUse" x1={0} y1={-960} x2={0} y2={960}><stop offset="0" stopColor="#0A2470" /><stop offset="0.5" stopColor="#061548" /><stop offset="1" stopColor="#020A26" /></linearGradient>
    <linearGradient id="nz-s-collar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF3B8" /><stop offset="0.4" stopColor="#E9B93A" /><stop offset="1" stopColor="#8A6410" /></linearGradient>
    <pattern id="nz-s-grain" width={7} height={60} patternUnits="userSpaceOnUse"><rect x={0} y={4} width={1} height={52} fill="#2A0F06" opacity={0.35} /><rect x={3.5} y={10} width={0.8} height={40} fill="#FFE3C4" opacity={0.22} /></pattern>
    <radialGradient id="nz-s-mote"><stop offset="0" stopColor="#EAF8FF" stopOpacity={0.9} /><stop offset="0.4" stopColor="#8FD0FF" stopOpacity={0.35} /><stop offset="1" stopColor="#8FD0FF" stopOpacity={0} /></radialGradient>
    <linearGradient id="nz-c-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE0FF" stopOpacity={0.34} /><stop offset="1" stopColor="#9CD0FF" stopOpacity={0} /></linearGradient>
    <radialGradient id="nz-c-pool"><stop offset="0" stopColor="#6FC2FF" stopOpacity={0.5} /><stop offset="1" stopColor="#4FB4FF" stopOpacity={0} /></radialGradient>
  </defs>
);

/** simplified resting cell for the far layers of the string (same silhouette and materials as the real bucket) */
const MiniCell: React.FC<{full: boolean; glow: number}> = ({full, glow}) => (
  <g transform={`scale(${K34})`}>
    <g transform={G4}>
      <g transform={`translate(${BK.x},${BK.base})`}>
        <ellipse cx={0} cy={44} rx={292} ry={60} fill="url(#cw-pedTop)" stroke="#5E82C8" strokeWidth={6} />
        <path d={SIL} fill="url(#cw-glassBack)" />
        {full ? <ellipse cx={0} cy={-250} rx={250} ry={330} fill="url(#cw-charge)" opacity={0.95} /> : null}
        {full ? [[-90, -90], [70, -110], [-10, -200], [110, -260], [-120, -300], [20, -380], [-60, -470], [90, -480]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={34} fill="#BFF4FF" />) : null}
        <path d={SIL} fill="url(#cw-glassFront)" stroke="#BFE4FF" strokeWidth={10} strokeOpacity={0.85} />
        <path d={`M${-GATE.rx} ${GATE.y} A${GATE.rx} ${GATE.ry} 0 0 0 ${GATE.rx} ${GATE.y} L${GATE.rx} ${GATE.y + GATE.th + 40} A${GATE.rx} ${GATE.ry} 0 0 1 ${-GATE.rx} ${GATE.y + GATE.th + 40} Z`} fill="url(#cw-goldBand)" />
        <ellipse cx={0} cy={GATE.y} rx={GATE.rx} ry={GATE.ry} fill="url(#cw-goldTop)" stroke="#FFF1B8" strokeWidth={6} />
        {glow > 0.02 ? <ellipse cx={0} cy={-360} rx={420} ry={520} fill="url(#nz-soft)" opacity={0.5 * glow} /> : null}
      </g>
    </g>
  </g>
);

const StringArt: React.FC<ArtProps & {bare?: boolean}> = ({t, beats, s, lite, bare}) => {
  const tThink = at(beats, 'think', 0, 85), tEach = at(beats, 'each', 0, 94.5), tCell = at(beats, 'cell', 0, 99.5), tTiny = at(beats, 'tiny', 0, 112.5), tBucket = at(beats, 'bucket', 0, 121);
  const vy = Math.min(BY, 960 / s + 80);
  const lod = ramp(s, 1.6, 3.6);
  let cu = '', hi = '', lo = '', oxl = '';
  const ns: number[] = [];
  for (let n = -NL; n <= NL; n++) {
    const y = n * SP;
    if (y < -vy - SP || y > vy + SP) continue;
    ns.push(n);
    const y0 = y - WLH / 2, y1 = y + WLH / 2;
    cu += `M${r1(-hwS(y0))} ${y0}L${r1(hwS(y0))} ${y0}L${r1(hwS(y1))} ${y1}L${r1(-hwS(y1))} ${y1}Z`;
    hi += `M${r1(-hwS(y0))} ${y0 + 2.5}L${r1(hwS(y0))} ${y0 + 2.5}`;
    lo += `M${r1(-hwS(y1))} ${y1 - 3}L${r1(hwS(y1))} ${y1 - 3}`;
    oxl += `M${r1(-hwS(y1 + 22))} ${y1 + 22}L${r1(hwS(y1 + 22))} ${y1 + 22}`;
  }
  const scanY = t >= tThink - 2 && t < tThink + 16 ? lerp(-960, 960, (t - tThink + 2) / 18) : null;
  const eachWave = (n: number) => decayAt(t, tEach + (n + NL) * 0.55, 3.2);
  const heroHi = Math.max(decayAt(t, tCell, 9), 0.55 * ss(t, tCell, tCell + 3) * (1 - ss(t, tBucket, tBucket + 8)));
  const bar = ss(t, tTiny, tTiny + 3) * (1 - ss(t, tBucket + 6, tBucket + 14));
  return (
    <g>
      {/* the street between towers, the roof above (far) and the next roof below (near, out of focus) */}
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="url(#nz-s-street)" />
      {[-1, 1].map((sd) => <line key={sd} x1={sd * 1100} x2={sd * 1100} y1={-BY} y2={BY} stroke="#2F7BFF" strokeWidth={60} opacity={0.4} />)}
      <rect x={-800} y={-2560} width={1600} height={1600} fill="url(#nz-s-roof)" stroke="#8FC2FF" strokeWidth={44} />
      <rect x={-30} y={-BY} width={60} height={BY - 960} fill="#5EEBFF" opacity={0.5} />
      <circle cx={0} cy={-1760} r={300} fill="#061538" stroke="#5E9BFF" strokeWidth={30} />
      {/* the stack */}
      <path d={`M${-hwS(-960)} -960 L${hwS(-960)} -960 L${hwS(960)} 960 L${-hwS(960)} 960 Z`} fill="url(#nz-s-ox)" />
      <path d={oxl} stroke="#9C8CFF" strokeWidth={2} opacity={0.3} fill="none" />
      <path d={cu} fill="url(#nz-s-cu)" />
      {lod > 0.01 ? ns.filter((n) => Math.abs(n) <= 3).map((n) => <rect key={n} x={-330} y={n * SP - WLH / 2} width={660} height={WLH} fill="url(#nz-s-grain)" opacity={lod} />) : null}
      <path d={hi} stroke="#FFE9CF" strokeWidth={3} opacity={0.75} fill="none" />
      <path d={lo} stroke="#1E0A04" strokeWidth={5} opacity={0.6} fill="none" />
      {/* light spilling out of the channel onto the metal, then fog top and bottom (macro depth of field) */}
      <rect x={-460} y={-960} width={920} height={1920} fill="url(#nz-s-spill)" />
      <rect x={-BX} y={-960} width={2 * BX} height={1920} fill="url(#nz-s-fog)" />
      {/* stack edges: rim light */}
      <path d={`M${-hwS(-960)} -960 L${-hwS(960)} 960 M${hwS(-960)} -960 L${hwS(960)} 960`} stroke="#8FC2FF" strokeWidth={5} opacity={0.5} fill="none" />
      {/* the channel hole */}
      <rect x={-TOUT} y={-960} width={2 * TOUT} height={1920} fill="url(#nz-s-wall)" />
      <rect x={-34} y={-960} width={68} height={1920} fill="url(#nz-s-shaft)" />
      {Array.from({length: 16}).map((_, i) => {
        const y = ((t * (5 + 5 * h2(i, 1)) + i * 137) % 1920) - 960;
        if (y < -vy || y > vy) return null;
        return <circle key={i} cx={(h2(i, 4) - 0.5) * 96} cy={y} r={6 + 6 * h2(i, 7)} fill="url(#nz-s-mote)" opacity={0.6} />;
      })}
      {/* one ring (= one cell) per word line: gold collar where the metal wraps the hole */}
      {ns.map((n) => {
        const y = n * SP, w = Math.max(eachWave(n), n === 0 ? heroHi : 0);
        return (
          <g key={n}>
            <rect x={-TOUT - 16} y={y - WLH / 2} width={16} height={WLH} fill="url(#nz-s-collar)" />
            <rect x={TOUT} y={y - WLH / 2} width={16} height={WLH} fill="url(#nz-s-collar)" />
            <path d={`M${-TOUT - 16} ${y - WLH / 2} A${TOUT + 16} 13 0 0 0 ${TOUT + 16} ${y - WLH / 2}`} fill="none" stroke="#FFE9A0" strokeWidth={3} opacity={0.85} />
            <path d={`M${-TOUT - 16} ${y + WLH / 2} A${TOUT + 16} 13 0 0 0 ${TOUT + 16} ${y + WLH / 2}`} fill="none" stroke="#C9941A" strokeWidth={3} opacity={0.45} />
            {w > 0.02 ? <rect x={-hwS(y)} y={y - WLH / 2} width={hwS(y) - TOUT - 16} height={WLH} fill="#FFE9A0" opacity={0.42 * w} /> : null}
            {w > 0.02 ? <rect x={TOUT + 16} y={y - WLH / 2} width={hwS(y) - TOUT - 16} height={WLH} fill="#FFE9A0" opacity={0.42 * w} /> : null}
            {w > 0.02 ? <rect x={-TOUT - 16} y={y - WLH / 2} width={16} height={WLH} fill="#FFFFFF" opacity={0.7 * w} /> : null}
            {w > 0.02 ? <rect x={TOUT} y={y - WLH / 2} width={16} height={WLH} fill="#FFFFFF" opacity={0.7 * w} /> : null}
          </g>
        );
      })}
      {/* the cells themselves: one tiny glass bucket per layer (the centre one is the cell we dive into) */}
      {!bare ? ns.map((n) => (
        <g key={n} transform={`translate(0,${n * SP})`}>
          {Math.abs(n) <= 1 ? <g transform={`scale(${K34})`}><g transform={G4}><RestBucket /></g></g> : <MiniCell full={h2(n, 5) > 0.45} glow={eachWave(n)} />}
        </g>
      )) : null}
      {/* scan line on "think" */}
      {scanY !== null ? (
        <g>
          <rect x={-hwS(scanY)} y={scanY - 60} width={2 * hwS(scanY)} height={60} fill="#BFF4FF" opacity={0.12} />
          <line x1={-hwS(scanY)} x2={hwS(scanY)} y1={scanY} y2={scanY} stroke="#E9FBFF" strokeWidth={5} opacity={0.9} />
        </g>
      ) : null}
      {/* roof lip (far) and the neighbour roof (near) */}
      <path d={`M${-hwS(-960)} -960 L${hwS(-960)} -960`} stroke="#DDF1FF" strokeWidth={8} opacity={0.9} />
      <ellipse cx={0} cy={-966} rx={TOUT + 30} ry={20} fill="#061538" stroke="#9CEBFF" strokeWidth={5} />
      <rect x={-800} y={900} width={1600} height={1660} fill="url(#nz-s-near)" />
      <rect x={-30} y={966} width={60} height={BY - 966} fill="#5EEBFF" opacity={0.5} />
      <circle cx={0} cy={1760} r={300} fill="#061538" stroke="#5E9BFF" strokeWidth={30} />
      {!bare && !lite ? (
        <g>
          {/* microscope read-outs (only readable while the string fills the frame) */}
          <g opacity={0.9}>
            <text x={-250} y={836} fontFamily={MONO} fontWeight={600} fontSize={22} fill="#EAF6FF" letterSpacing={2} stroke="#050218" strokeWidth={5} paintOrder="stroke">3D NAND STRING · CROSS-SECTION</text>
            <line x1={300} x2={470} y1={826} y2={826} stroke="#FFFFFF" strokeWidth={4} />
            <line x1={300} x2={300} y1={816} y2={836} stroke="#FFFFFF" strokeWidth={4} />
            <line x1={470} x2={470} y1={816} y2={836} stroke="#FFFFFF" strokeWidth={4} />
            <text x={385} y={812} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill="#FFFFFF" stroke="#050218" strokeWidth={5} paintOrder="stroke">100 nm</text>
          </g>
          {/* word-line numbers etched on the metal; "cell": the tag */}
          {ns.filter((n) => Math.abs(n) <= 8).map((n) => (
            <text key={n} x={-hwS(n * SP) + 26} y={n * SP + 8} fontFamily={MONO} fontWeight={600} fontSize={22} fill="#2A0F06" opacity={0.75}>{`WL${String(n + 118).padStart(3, '0')}`}</text>
          ))}
          <Tag x={128} y={-34} text="1 CELL" a={sp(t, tCell, 'pop') * (1 - ss(t, tBucket - 6, tBucket))} color="#FFE08A" from={[TOUT + 18, -6]} size={13} />
          {bar > 0.01 ? <g transform={`scale(${K34})`}><g transform={G4}><ScaleBar a={bar} /></g></g> : null}
        </g>
      ) : null}
    </g>
  );
};

// =====================================================================================================================
// LEVEL 2 - MEMORY ARRAY: a city of towers seen from above (one-point perspective: roofs lean away from the nadir)
// =====================================================================================================================
const AP = 110, AA = 25, AH = 0.6, NAD = 264, AK = 1 + AH; // pitch, half footprint, height factor, nadir y
const FS = 1 / Math.pow(10, DEPTH.str - DEPTH.arr); // string level inside the array (1/20)

const ArrayDefs: React.FC = () => (
  <defs>
    <GoldDefs />
    <radialGradient id="nz-a-ground" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1500}><stop offset="0" stopColor="#5FB4FF" stopOpacity={0.95} /><stop offset="0.3" stopColor="#1E5BE0" stopOpacity={0.6} /><stop offset="1" stopColor="#020A26" stopOpacity={0} /></radialGradient>
    <linearGradient id="nz-a-roof" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B78F0" /><stop offset="1" stopColor="#1A4FCB" /></linearGradient>
    <linearGradient id="nz-a-lit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#D8F6FF" /><stop offset="1" stopColor="#35B9FF" /></linearGradient>
    <radialGradient id="nz-a-vig" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={2400}><stop offset="0.22" stopColor="#0E2E86" stopOpacity={0} /><stop offset="0.66" stopColor="#0E2E86" stopOpacity={0.5} /><stop offset="1" stopColor="#0B2470" stopOpacity={0.85} /></radialGradient>
    <clipPath id="nz-a-face"><path d="M-40 -48 L40 -48 L27.7 48 L-27.7 48 Z" /></clipPath>
  </defs>
);

type Ring = {xl: string; xm: string; xh: string; yl: string; ym: string; yh: string; st: string; roof: string; lit: string; hot: string; hole: string; holeLit: string};

const ArrayArt: React.FC<ArtProps> = ({t, beats, s, lite}) => {
  const tCells = at(beats, 'cells', 0, 52);
  const vx = Math.min(BX, 540 / s + 30), vy = Math.min(BY, 960 / s + 30);
  const iMax = Math.floor((vx + AA) / AP), jMax = Math.max(0, Math.floor((vy - NAD + AA) / AP)), jMin = -Math.floor((vy + NAD + AA) / AP);
  const rMax = Math.max(iMax, jMax, -jMin);
  const rings: Ring[] = Array.from({length: rMax + 1}, () => ({xl: '', xm: '', xh: '', yl: '', ym: '', yh: '', st: '', roof: '', lit: '', hot: '', hole: '', holeLit: ''}));
  const waveR = t > tCells ? (t - tCells) * 62 : -1;
  const F = [0, 0.4, 0.75, 1].map((f) => 1 + AH * f);
  const quad = (ax: number, ay: number, bx: number, by: number, ka: number, kb: number) =>
    `M${r1(ax * ka)} ${r1(ay * ka)}L${r1(bx * ka)} ${r1(by * ka)}L${r1(bx * kb)} ${r1(by * kb)}L${r1(ax * kb)} ${r1(ay * kb)}Z`;
  for (let j = jMin; j <= jMax; j++) {
    for (let i = -iMax; i <= iMax; i++) {
      const R = rings[Math.max(Math.abs(i), Math.abs(j))];
      const cx = AP * i, cy = AP * j, x0 = cx - AA, x1 = cx + AA, y0 = cy - AA, y1 = cy + AA;
      if (x0 > 0 || x1 < 0) {
        const xe = x0 > 0 ? x0 : x1;
        R.xl += quad(xe, y0, xe, y1, F[0], F[1]); R.xm += quad(xe, y0, xe, y1, F[1], F[2]); R.xh += quad(xe, y0, xe, y1, F[2], F[3]);
        for (let k = 1; k <= 5; k++) { const kf = 1 + (AH * k) / 6; R.st += `M${r1(xe * kf)} ${r1(y0 * kf)}L${r1(xe * kf)} ${r1(y1 * kf)}`; }
      }
      if (y0 > 0 || y1 < 0) {
        const ye = y0 > 0 ? y0 : y1;
        R.yl += quad(x0, ye, x1, ye, F[0], F[1]); R.ym += quad(x0, ye, x1, ye, F[1], F[2]); R.yh += quad(x0, ye, x1, ye, F[2], F[3]);
        for (let k = 1; k <= 5; k++) { const kf = 1 + (AH * k) / 6; R.st += `M${r1(x0 * kf)} ${r1(ye * kf)}L${r1(x1 * kf)} ${r1(ye * kf)}`; }
      }
      const rx = cx * AK, ry = cy * AK, ra = AA * AK;
      const roof = `M${r1(rx - ra)} ${r1(ry - ra)}h${r1(2 * ra)}v${r1(2 * ra)}h${r1(-2 * ra)}Z`;
      const hole = `M${r1(rx - 15)} ${r1(ry)}a15 15 0 1 0 30 0a15 15 0 1 0 -30 0Z`;
      const dist = Math.hypot(cx, cy + 2 * AP);
      const inWave = waveR > 0 && dist < waveR;
      const tw = h2(i * 3.1, j * 1.7) > 0.8 ? Math.floor(t / 6 + h2(i, j * 9) * 7) % 2 === 0 : true;
      const calm = i === 0 && j >= -3 && j <= -1; // the hero tower and its neighbours stay quiet so the dive target reads
      const isLit = !calm && h2(i + 40, j + 3) > (inWave ? 0.5 : 0.78) && tw;
      const isHot = !calm && inWave && waveR - dist < 90 && waveR < 2600;
      if (isHot) { R.hot += roof; R.holeLit += hole; }
      else if (isLit) { R.lit += roof; R.holeLit += hole; }
      else { R.roof += roof; R.hole += hole; }
    }
  }
  const lodS = ramp(s, 1.8, 4.2);
  const lock = ss(t, 60, 68) * (1 - ss(t, 74, 82));
  const pulses: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const col = Math.round((h2(i, 5) - 0.5) * 2 * iMax);
    const ph = (t * (0.008 + 0.01 * h2(i, 2)) + h2(i, 8)) % 1;
    const y = lerp(-vy - NAD, vy - NAD, ph);
    pulses.push(<line key={i} x1={col * AP * AK} x2={col * AP * AK} y1={y} y2={y + 110} stroke="#E9FBFF" strokeWidth={6} strokeLinecap="round" opacity={0.85} />);
  }
  return (
    <g>
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="#020A26" />
      <g transform={`translate(0,${NAD})`}>
        <rect x={-BX} y={-BY - NAD} width={2 * BX} height={2 * BY} fill="url(#nz-a-ground)" />
        {/* word lines on the ground, seen down the streets */}
        {Array.from({length: 9}).map((_, k) => <line key={k} x1={-900} x2={900} y1={(k - 4) * AP + AP / 2} y2={(k - 4) * AP + AP / 2} stroke="#39C6FF" strokeWidth={5} opacity={0.5} />)}
        {Array.from({length: 9}).map((_, k) => <line key={k} y1={-900} y2={900} x1={(k - 4) * AP + AP / 2} x2={(k - 4) * AP + AP / 2} stroke="#2F7BFF" strokeWidth={3} opacity={0.4} />)}
        {rings.map((_, idx) => {
          const r = rMax - idx, R = rings[r];
          const fog = clamp01((r - 3) / 15);
          return (
            <g key={r} opacity={1 - 0.5 * fog}>
              <path d={R.xl} fill="#061A52" /><path d={R.xm} fill="#0B2C80" /><path d={R.xh} fill="#1444B4" />
              <path d={R.yl} fill="#08226A" /><path d={R.ym} fill="#1140B8" /><path d={R.yh} fill="#2A6CF2" />
              <path d={R.st} stroke="#020A26" strokeWidth={1.6} opacity={0.55} fill="none" />
              <path d={R.roof} fill="url(#nz-a-roof)" stroke="#8FC2FF" strokeWidth={2.2} />
              <path d={R.hole} fill="#061538" stroke="#5E9BFF" strokeWidth={1.5} />
              {R.lit ? <path d={R.lit} fill="#39C6FF" stroke="#39C6FF" strokeOpacity={0.3} strokeWidth={22} strokeLinejoin="round" /> : null}
              {R.lit ? <path d={R.lit} fill="url(#nz-a-lit)" stroke="#E9FBFF" strokeWidth={2.2} /> : null}
              {R.hot ? <path d={R.hot} fill="#F2FCFF" stroke="#8FE2FF" strokeOpacity={0.5} strokeWidth={30} strokeLinejoin="round" /> : null}
              {R.holeLit ? <path d={R.holeLit} fill="#FFFFFF" stroke="#0B3C8C" strokeWidth={2} /> : null}
            </g>
          );
        })}
        {/* bit lines run over the roofs through every channel hole */}
        {Array.from({length: 2 * iMax + 1}).map((_, k) => {
          const x = (k - iMax) * AP * AK;
          return <line key={k} x1={x} x2={x} y1={-vy - NAD} y2={vy - NAD} stroke="#5EEBFF" strokeWidth={3} opacity={0.42} />;
        })}
        {pulses}
        <rect x={-BX} y={-BY - NAD} width={2 * BX} height={2 * BY} fill="url(#nz-a-vig)" />
      </g>
      {/* hero tower: its near face already shows the string cross-section (low detail copy of the next level) */}
      {lodS > 0.01 ? (
        <g clipPath="url(#nz-a-face)" opacity={lodS}>
          <g transform={`scale(${FS})`}><StringArt t={t} beats={beats} s={s * FS} lite /></g>
        </g>
      ) : null}
      {!lite ? (
        <g>
          {lock > 0.01 ? (
            <g opacity={lock}>
              <path d="M-40 -128 L40 -128 L40 -48 L27.7 48 L-27.7 48 L-40 -48 Z" fill="none" stroke="#FFE08A" strokeWidth={2.2} />
              <path d="M-40 -128 L40 -128 L40 -48 L27.7 48 L-27.7 48 L-40 -48 Z" fill="none" stroke="#FFE08A" strokeWidth={9} opacity={0.25} />
              {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => {
                const g = (1 - ss(t, 60, 70)) * 30;
                const x = sx * (50 + g), y = sy > 0 ? 58 + g : -138 - g;
                return <path key={i} d={`M${x - sx * 14} ${y} L${x} ${y} L${x} ${y - sy * 14}`} fill="none" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" />;
              })}
            </g>
          ) : null}
          <Tag x={0} y={430} text="BILLIONS OF CELLS" a={sp(t, tCells, 'pop')} color="#7FE6FF" size={30} />
        </g>
      ) : null}
    </g>
  );
};

// =====================================================================================================================
// LEVEL 1 - SILICON DIE under the lid: iridescent planes, page buffers, decoders, periphery, bond pads and wires
// =====================================================================================================================
const DW = 440, DHh = 800; // die half size
const PLANES = [{y0: -700, y1: -250}, {y0: -170, y1: 280}];
const PADS = Array.from({length: 13}, (_, i) => -390 + 65 * i);

/** epoxy material; k = how many px one package-level px is in the level that uses it (ids differ per k) */
const EpoxyDefs: React.FC<{k: number}> = ({k}) => (
  <>
    <linearGradient id={`nz-epoxy-${k}`} gradientUnits="userSpaceOnUse" x1={-500 * k} y1={-880 * k} x2={500 * k} y2={880 * k}>
      <stop offset="0" stopColor="#465368" /><stop offset="0.35" stopColor="#252D3A" /><stop offset="0.7" stopColor="#161B23" /><stop offset="1" stopColor="#0D1016" />
    </linearGradient>
    <radialGradient id={`nz-espec-${k}`} gradientUnits="userSpaceOnUse" cx={-240 * k} cy={-420 * k} r={900 * k}><stop offset="0" stopColor="#C8DCFF" stopOpacity={0.4} /><stop offset="0.5" stopColor="#8FB0E8" stopOpacity={0.1} /><stop offset="1" stopColor="#8FB0E8" stopOpacity={0} /></radialGradient>
    <pattern id={`nz-speck-${k}`} width={64} height={64} patternUnits="userSpaceOnUse" patternTransform={`scale(${k})`}>
      {Array.from({length: 14}).map((_, i) => <circle key={i} cx={h2(i, 1) * 64} cy={h2(i, 2) * 64} r={0.5 + h2(i, 3) * 1.1} fill={h2(i, 4) > 0.5 ? '#C8D4E6' : '#000000'} opacity={0.1 + 0.16 * h2(i, 5)} />)}
    </pattern>
  </>
);

/** fine laser raster + micro text around the window (package-level px); the die level repeats it 10x so the hand-off matches */
const WindowMarks: React.FC = () => (
  <g>
    {Array.from({length: 40}).map((_, i) => <line key={i} x1={-200} x2={200} y1={-200 + i * 10} y2={-200 + i * 10} stroke="#AEBBD0" strokeWidth={0.5} opacity={0.22} />)}
    <text x={-73} y={-126} fontFamily={MONO} fontWeight={600} fontSize={8} fill="#AEBBD0" letterSpacing={1}>DECAP WINDOW 01</text>
    <text x={73} y={128} textAnchor="end" fontFamily={MONO} fontWeight={400} fontSize={6.5} fill="#8C98A8" letterSpacing={1}>DIE ATTACH · Au WIRE 18 µm</text>
  </g>
);

const DieDefs: React.FC<{sh: number}> = ({sh}) => (
  <defs>
    <GoldDefs />
    <EpoxyDefs k={10} />
    <linearGradient id="nz-d-irid" gradientUnits="userSpaceOnUse" x1={-520} y1={-900} x2={380} y2={500} spreadMethod="reflect" gradientTransform={`translate(${r1(sh)},${r1(sh * 1.5)})`}>
      <stop offset="0" stopColor="#2B6BFF" stopOpacity={0.34} /><stop offset="0.2" stopColor="#7A2BFF" stopOpacity={0.36} /><stop offset="0.4" stopColor="#FF3FA8" stopOpacity={0.24} /><stop offset="0.58" stopColor="#FFB52A" stopOpacity={0.34} /><stop offset="0.78" stopColor="#1FD8C0" stopOpacity={0.3} /><stop offset="1" stopColor="#2B6BFF" stopOpacity={0.34} />
    </linearGradient>
    <linearGradient id="nz-d-plane" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1E56F0" /><stop offset="0.5" stopColor="#1430A8" /><stop offset="1" stopColor="#3A1FA0" /></linearGradient>
    <linearGradient id="nz-d-sub" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#123038" /><stop offset="1" stopColor="#07151A" /></linearGradient>
    <linearGradient id="nz-d-bevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6B7A8E" /><stop offset="0.5" stopColor="#262D38" /><stop offset="1" stopColor="#05070A" /></linearGradient>
    <radialGradient id="nz-d-spec" gradientUnits="userSpaceOnUse" cx={-200} cy={-520} r={900}><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.2} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></radialGradient>
    <radialGradient id="nz-d-vig" gradientUnits="userSpaceOnUse" cx={0} cy={60} r={1400}><stop offset="0.35" stopColor="#02040A" stopOpacity={0} /><stop offset="1" stopColor="#02040A" stopOpacity={0.75} /></radialGradient>
    <pattern id="nz-d-dots" width={11} height={11} patternUnits="userSpaceOnUse" patternTransform="translate(-4,0.9)"><rect x={1.5} y={1.5} width={8} height={8} rx={1} fill="#7FC4FF" opacity={0.6} /><rect x={4.3} y={4.3} width={2.4} height={2.4} fill="#061538" opacity={0.7} /></pattern>
    <pattern id="nz-d-hatch" width={6} height={12} patternUnits="userSpaceOnUse"><rect x={0} y={0} width={3} height={12} fill="#5EEBD8" opacity={0.75} /></pattern>
    <pattern id="nz-d-stair" width={44} height={11} patternUnits="userSpaceOnUse"><rect x={0} y={0} width={44} height={5} fill="#FFD98A" opacity={0.7} /><rect x={0} y={5} width={22} height={6} fill="#B07C10" opacity={0.6} /></pattern>
    <pattern id="nz-d-logic" width={18} height={12} patternUnits="userSpaceOnUse"><rect x={1} y={1} width={10} height={4} fill="#9C8CFF" opacity={0.8} /><rect x={13} y={1} width={4} height={4} fill="#5EEBD8" opacity={0.8} /><rect x={1} y={7} width={5} height={4} fill="#FFC24A" opacity={0.7} /><rect x={8} y={7} width={9} height={4} fill="#6FB6FF" opacity={0.8} /></pattern>
    <clipPath id="nz-d-block"><rect x={-150} y={-168} width={300} height={404} /></clipPath>
    <clipPath id="nz-d-dieclip"><rect x={-DW} y={-DHh} width={2 * DW} height={2 * DHh} rx={10} /></clipPath>
  </defs>
);

const DieArt: React.FC<ArtProps> = ({t, beats, s, lite}) => {
  const tChip = at(beats, 'chip', 0, 27.5), tGrid = at(beats, 'grid', 0, 39.5);
  const D = DEPTH.die + Math.log10(s);
  const lodA = ramp(s, 1.25, 2.6);
  const chip = decayAt(t, tChip, 10), grid = decayAt(t, tGrid, 9), gridOn = ss(t, tGrid, tGrid + 4);
  const shim = t >= tChip - 2 && t < tChip + 16 ? lerp(-1300, 1300, (t - tChip + 2) / 18) : null;
  return (
    <g>
      <DieDefs sh={160 * D + t * 2.2} />
      {/* epoxy around the opened window (same material as the package level, 10x) */}
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="url(#nz-epoxy-10)" />
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="url(#nz-speck-10)" />
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="url(#nz-espec-10)" />
      <g transform="scale(10)"><WindowMarks /></g>
      <rect x={-730} y={-1150} width={1460} height={2300} rx={80} fill="none" stroke="#000000" strokeWidth={30} opacity={0.6} />
      {/* cavity: bevelled wall, substrate, gold fingers */}
      <rect x={-722} y={-1142} width={1444} height={2284} rx={70} fill="url(#nz-d-bevel)" />
      <rect x={-690} y={-1110} width={1380} height={2220} rx={46} fill="url(#nz-d-sub)" stroke="#000000" strokeOpacity={0.6} strokeWidth={6} />
      {[-1, 1].map((sd) => PADS.map((_, i) => {
        const fx = -468 + 78 * i, fy = sd * 905;
        return (
          <g key={`${sd}${i}`}>
            <path d={`M${fx} ${fy + sd * 30} L${fx + (i - 6) * 9} ${sd * 1105}`} stroke="#C9941A" strokeWidth={7} opacity={0.75} fill="none" />
            <rect x={fx - 15} y={fy - 34} width={30} height={68} rx={6} fill="url(#nz-gold)" stroke="#5A3F08" strokeWidth={2} />
          </g>
        );
      }))}
      {[-1, 1].map((sd) => Array.from({length: 9}).map((_, i) => (
        <g key={`${sd}${i}`}>
          <rect x={sd * 590 - 22} y={-760 + i * 190 - 34} width={44} height={68} rx={5} fill="#3A2A22" stroke="#7A6A5A" strokeWidth={2} />
          <rect x={sd * 590 - 22} y={-760 + i * 190 - 34} width={44} height={14} fill="#C8D0DC" />
          <rect x={sd * 590 - 22} y={-760 + i * 190 + 20} width={44} height={14} fill="#C8D0DC" />
        </g>
      )))}
      {/* the die */}
      <rect x={-DW + 18} y={-DHh + 24} width={2 * DW} height={2 * DHh} rx={12} fill="#000000" opacity={0.55} />
      <rect x={-DW} y={-DHh} width={2 * DW} height={2 * DHh} rx={10} fill="#0B1236" />
      {PLANES.map((p, k) => (
        <g key={k}>
          <rect x={-372} y={p.y0} width={744} height={p.y1 - p.y0} fill="url(#nz-d-plane)" />
          <rect x={-372} y={p.y0} width={744} height={p.y1 - p.y0} fill="url(#nz-d-dots)" />
          {Array.from({length: 7}).map((_, i) => <rect key={i} x={-372} y={p.y0 + 55 + i * 56.3 - 1.5} width={744} height={3} fill="#061538" opacity={0.8} />)}
          {Array.from({length: 5}).map((_, i) => <rect key={i} x={-372 + 124 * (i + 1) - 2} y={p.y0} width={4} height={p.y1 - p.y0} fill="#0A1E5A" opacity={0.85} />)}
          <rect x={-372} y={p.y0} width={744} height={p.y1 - p.y0} fill="none" stroke="#8FC2FF" strokeWidth={2.5} opacity={0.8} />
          {/* row decoders (the word-line staircase) */}
          <rect x={-430} y={p.y0} width={46} height={p.y1 - p.y0} fill="#3A2A08" /><rect x={-430} y={p.y0} width={46} height={p.y1 - p.y0} fill="url(#nz-d-stair)" />
          <rect x={384} y={p.y0} width={46} height={p.y1 - p.y0} fill="#3A2A08" /><rect x={384} y={p.y0} width={46} height={p.y1 - p.y0} fill="url(#nz-d-stair)" />
          {/* page buffer strip under the plane */}
          <rect x={-372} y={p.y1 + 12} width={744} height={48} fill="#0A2E36" /><rect x={-372} y={p.y1 + 12} width={744} height={48} fill="url(#nz-d-hatch)" />
          <rect x={-372} y={p.y1 + 32} width={744} height={5} fill="#0B1236" />
        </g>
      ))}
      {/* periphery: charge pumps, logic, I/O */}
      {[[-372, 372, 210, 150], [-372, 540, 210, 150]].map(([x, y, w, h], k) => (
        <g key={k}>
          <rect x={x} y={y} width={w} height={h} fill="#101A4A" stroke="#6F8CFF" strokeWidth={2} />
          {Array.from({length: 24}).map((_, i) => <rect key={i} x={x + 10 + (i % 6) * 33} y={y + 10 + Math.floor(i / 6) * 34} width={26} height={27} rx={3} fill={h2(i, k) > 0.5 ? '#D9A21E' : '#2BE0C8'} opacity={0.75} />)}
        </g>
      ))}
      <rect x={-146} y={372} width={310} height={318} fill="#150F45" stroke="#6F8CFF" strokeWidth={2} /><rect x={-140} y={378} width={298} height={306} fill="url(#nz-d-logic)" />
      {[0, 1, 2].map((i) => <rect key={i} x={-146} y={372 + 78 + i * 80} width={310} height={7} fill="#0B1236" />)}
      <rect x={180} y={372} width={192} height={318} fill="#101A4A" stroke="#6F8CFF" strokeWidth={2} />
      {Array.from({length: 12}).map((_, i) => <rect key={i} x={190 + (i % 2) * 90} y={382 + Math.floor(i / 2) * 51} width={80} height={41} rx={4} fill={i % 3 === 0 ? '#D9A21E' : '#4A63D8'} opacity={0.85} />)}
      {/* metal buses */}
      {[-436, 436].map((x, i) => <line key={i} x1={x} x2={x} y1={-740} y2={740} stroke="#FFD98A" strokeWidth={3} opacity={0.6} />)}
      <line x1={-430} x2={430} y1={352} y2={352} stroke="#FFD98A" strokeWidth={4} opacity={0.6} />
      <line x1={-430} x2={430} y1={-212} y2={-212} stroke="#5EEBD8" strokeWidth={3} opacity={0.5} />
      {/* thin-film interference + specular */}
      <rect x={-DW} y={-DHh} width={2 * DW} height={2 * DHh} rx={10} fill="url(#nz-d-irid)" />
      <rect x={-DW} y={-DHh} width={2 * DW} height={2 * DHh} rx={10} fill="url(#nz-d-spec)" />
      {shim !== null ? <path d={`M${shim - 160} ${-DHh} L${shim + 60} ${-DHh} L${shim - 240} ${DHh} L${shim - 460} ${DHh} Z`} fill="#FFFFFF" opacity={0.14} clipPath="url(#nz-d-dieclip)" /> : null}
      {/* seal ring, corner marks, pads and bond wires */}
      <rect x={-DW + 8} y={-DHh + 8} width={2 * DW - 16} height={2 * DHh - 16} rx={6} fill="none" stroke="#FFD98A" strokeWidth={2.5} opacity={0.7} />
      <rect x={-DW} y={-DHh} width={2 * DW} height={2 * DHh} rx={10} fill="none" stroke="#DDE8FF" strokeWidth={3} opacity={0.75} />
      {[-1, 1].map((sd) => PADS.map((px, i) => {
        const py = sd * 762, fx = -468 + 78 * i, fy = sd * 890;
        const d = `M${px} ${py} C${px} ${py + sd * 70} ${fx} ${fy - sd * 90} ${fx} ${fy}`;
        return (
          <g key={`${sd}${i}`}>
            <rect x={px - 21} y={py - 17} width={42} height={34} rx={4} fill="url(#nz-gold)" stroke="#5A3F08" strokeWidth={2} />
            <path d={d} stroke="#000000" strokeWidth={7} opacity={0.45} fill="none" transform="translate(7,9)" />
            <path d={d} stroke="#C9941A" strokeWidth={7} fill="none" strokeLinecap="round" />
            <path d={d} stroke="#FFF3B8" strokeWidth={2} fill="none" strokeLinecap="round" transform="translate(-1.5,-1.5)" />
            <circle cx={px} cy={py} r={12} fill="url(#nz-ball)" />
            {chip > 0.02 ? <circle cx={px} cy={py} r={34} fill="url(#nz-soft)" opacity={0.7 * chip * (0.5 + 0.5 * Math.sin(t * 0.9 + i))} /> : null}
          </g>
        );
      }))}
      <text x={-DW + 22} y={DHh - 22} fontFamily={MONO} fontWeight={600} fontSize={15} fill="#FFD98A" opacity={0.85} letterSpacing={2}>V9 512G TLC · 236L · ©2026</text>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => <path key={i} d={`M${sx * (DW - 16)} ${sy * (DHh - 46)} L${sx * (DW - 16)} ${sy * (DHh - 16)} L${sx * (DW - 46)} ${sy * (DHh - 16)}`} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.8} />)}
      {/* "grid": the plane's rows and columns light up */}
      {grid > 0.02 ? (
        <g opacity={grid}>
          {Array.from({length: 9}).map((_, i) => <line key={i} x1={-372} x2={372} y1={PLANES[1].y0 + i * 56.3} y2={PLANES[1].y0 + i * 56.3} stroke="#BFF4FF" strokeWidth={4} />)}
          {Array.from({length: 7}).map((_, i) => <line key={i} x1={-372 + 124 * i} x2={-372 + 124 * i} y1={PLANES[1].y0} y2={PLANES[1].y1} stroke="#BFF4FF" strokeWidth={4} />)}
          <rect x={-372} y={PLANES[1].y0} width={744} height={450} fill="#7FE6FF" opacity={0.22} />
        </g>
      ) : null}
      {/* inside the plane: the cell array resolves (low detail copy of the next level) */}
      {lodA > 0.01 ? (
        <g clipPath="url(#nz-d-block)" opacity={lodA}>
          <g transform="scale(0.1)"><ArrayArt t={t} beats={beats} s={s * 0.1} lite /></g>
        </g>
      ) : null}
      <rect x={-150} y={-168} width={300} height={404} fill="none" stroke="#BFF4FF" strokeWidth={2} opacity={0.7 * Math.max(lodA, gridOn)} />
      {!lite ? (
        <g>
          <Tag x={150} y={318} text="NAND FLASH DIE" a={sp(t, tChip, 'pop') * (1 - ss(t, tGrid - 5, tGrid + 1))} color="#FFE08A" size={30} />
          <Tag x={96} y={-128} text="MEMORY PLANE" a={sp(t, tGrid, 'pop') * (1 - ramp(s, 2.7, 3.8))} color="#7FE6FF" from={[40, -60]} size={12} />
        </g>
      ) : null}
    </g>
  );
};

// =====================================================================================================================
// LEVEL 0 - NAND PACKAGE: glossy black epoxy, laser marking, gold BGA balls at the edges, a window lasered open
// =====================================================================================================================
const PkgDraw: React.FC<NanoLevelProps> = ({t, beats, scale}) => {
  const tEvery = at(beats, 'every', 0, 9.5), tFlash = at(beats, 'flash', 0, 18);
  const open = ss(t, tFlash - 5, tFlash + 4);
  const glint = ss(t, tEvery, tEvery + 3) * decayAt(t, tEvery, 10);
  const sweep = lerp(-1300, 1300, clamp01((t - (tEvery - 9)) / 30));
  const lod = ramp(scale, 1.5, 3.5);
  const etched = {fontFamily: FONT, fontWeight: 800, textAnchor: 'middle' as const};
  const lidY = lerp(-118, 118, open);
  return (
    <Stage>
      <defs>
        <GoldDefs />
        <EpoxyDefs k={1} />
        <linearGradient id="nz-p-pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#12303A" /><stop offset="1" stopColor="#06141A" /></linearGradient>
        <linearGradient id="nz-p-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9FB0C8" /><stop offset="0.4" stopColor="#3A4454" /><stop offset="1" stopColor="#05070A" /></linearGradient>
        <linearGradient id="nz-p-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0} /><stop offset="0.5" stopColor="#EAF2FF" stopOpacity={0.3} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0} /></linearGradient>
        <radialGradient id="nz-p-vig" gradientUnits="userSpaceOnUse" cx={0} cy={40} r={1150}><stop offset="0.45" stopColor="#02040A" stopOpacity={0} /><stop offset="1" stopColor="#02040A" stopOpacity={0.7} /></radialGradient>
        <clipPath id="nz-p-body"><rect x={-500} y={-880} width={1000} height={1760} rx={30} /></clipPath>
        <clipPath id="nz-p-win"><rect x={-73} y={-115} width={146} height={230} rx={8} /></clipPath>
      </defs>
      {/* the board under the package */}
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="url(#nz-p-pcb)" />
      {Array.from({length: 26}).map((_, i) => {
        const y = -860 + i * 69;
        return (
          <g key={i}>
            <path d={`M-516 ${y} L-560 ${y} L-640 ${y + (i % 2 ? 40 : -40)}`} stroke="#C9941A" strokeWidth={6} fill="none" opacity={0.7} />
            <path d={`M516 ${y} L560 ${y} L640 ${y + (i % 2 ? -40 : 40)}`} stroke="#C9941A" strokeWidth={6} fill="none" opacity={0.7} />
            <circle cx={-512} cy={y} r={25} fill="url(#nz-ball)" /><circle cx={512} cy={y} r={25} fill="url(#nz-ball)" />
          </g>
        );
      })}
      {Array.from({length: 14}).map((_, i) => {
        const x = -448 + i * 69;
        return (
          <g key={i}>
            <path d={`M${x} 894 L${x} 960`} stroke="#C9941A" strokeWidth={6} opacity={0.7} /><path d={`M${x} -894 L${x} -960`} stroke="#C9941A" strokeWidth={6} opacity={0.7} />
            <circle cx={x} cy={893} r={25} fill="url(#nz-ball)" /><circle cx={x} cy={-893} r={25} fill="url(#nz-ball)" />
          </g>
        );
      })}
      {/* the package body */}
      <rect x={-486} y={-858} width={1000} height={1760} rx={30} fill="#000000" opacity={0.55} />
      <rect x={-500} y={-880} width={1000} height={1760} rx={30} fill="url(#nz-p-edge)" />
      <rect x={-492} y={-872} width={984} height={1744} rx={24} fill="url(#nz-epoxy-1)" />
      <rect x={-492} y={-872} width={984} height={1744} rx={24} fill="url(#nz-speck-1)" />
      <rect x={-470} y={-850} width={940} height={1700} rx={14} fill="none" stroke="#5A6678" strokeWidth={1.5} opacity={0.7} />
      <rect x={-492} y={-872} width={984} height={1744} rx={24} fill="url(#nz-espec-1)" />
      <g clipPath="url(#nz-p-body)" opacity={0.5}>
        <rect x={-760} y={-1300} width={150} height={2600} fill="url(#nz-p-sweep)" transform="rotate(24)" />
        <rect x={250} y={-1300} width={70} height={2600} fill="url(#nz-p-sweep)" transform="rotate(24)" />
        <rect x={340} y={-1300} width={260} height={2600} fill="url(#nz-p-sweep)" transform="rotate(24)" />
      </g>
      <path d="M-470 -872 L470 -872" stroke="#DCE8FF" strokeWidth={3} opacity={0.55} />
      <path d="M-492 -850 L-492 850" stroke="#DCE8FF" strokeWidth={3} opacity={0.35} />
      {/* laser marking */}
      <g opacity={0.6 + 0.4 * glint}>
        <circle cx={-410} cy={-420} r={24} fill="#07090C" stroke="#566273" strokeWidth={2} />
        <text {...etched} x={0} y={-246} fontSize={150} letterSpacing={6} fill="#000000" opacity={0.6}>3D NAND</text>
        <text {...etched} x={0} y={-250} fontSize={150} letterSpacing={6} fill={mix('#A3AFBF', '#F2F7FF', glint)}>3D NAND</text>
        <text {...etched} x={0} y={344} fontSize={118} letterSpacing={4} fill="#000000" opacity={0.6}>512 Gb</text>
        <text {...etched} x={0} y={340} fontSize={118} letterSpacing={4} fill={mix('#A3AFBF', '#F2F7FF', glint)}>512 Gb</text>
        <line x1={-330} x2={330} y1={-196} y2={-196} stroke="#8C98A8" strokeWidth={3} />
        <text x={0} y={420} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={34} letterSpacing={5} fill="#7D8898">V9 · TLC · 236 LAYERS</text>
        <text x={0} y={474} textAnchor="middle" fontFamily={MONO} fontWeight={400} fontSize={28} letterSpacing={4} fill="#667182">LOT 2611A7 · BGA-132 · KR</text>
        {Array.from({length: 100}).map((_, i) => (h2(i, 31) > 0.45 || i % 10 === 0 || i >= 90 ? <rect key={i} x={300 + (i % 10) * 12} y={590 + Math.floor(i / 10) * 12} width={11} height={11} fill="#8C98A8" /> : null))}
      </g>
      {/* fine laser raster around the window - only resolves when we are close */}
      {lod > 0.01 ? <g opacity={lod}><WindowMarks /></g> : null}
      {/* studio light sweep */}
      <g clipPath="url(#nz-p-body)"><rect x={sweep - 260} y={-1300} width={520} height={2600} fill="url(#nz-p-sweep)" transform={`rotate(24 ${sweep} 0)`} /></g>
      {/* the opened window: the die under the lid (low detail copy of the next level, exact hand-off scale) */}
      <g clipPath="url(#nz-p-win)"><g transform="scale(0.1)"><DieArt t={t} beats={beats} s={scale * 0.1} lite /></g></g>
      <rect x={-73} y={-115} width={146} height={230} rx={8} fill="none" stroke="#000000" strokeWidth={3} opacity={0.6} />
      {/* the lid being lasered open on "flash" */}
      {open < 0.995 ? (
        <g clipPath="url(#nz-p-win)">
          <rect x={-80} y={lidY} width={160} height={240} fill="url(#nz-epoxy-1)" />
          <rect x={-80} y={lidY} width={160} height={240} fill="url(#nz-speck-1)" />
          <rect x={-80} y={lidY} width={160} height={240} fill="url(#nz-espec-1)" />
          {open > 0.01 ? <rect x={-80} y={lidY - 16} width={160} height={30} fill="#7FE6FF" opacity={0.5} /> : null}
          {open > 0.01 ? <rect x={-80} y={lidY - 2} width={160} height={5} fill="#FFFFFF" /> : null}
        </g>
      ) : null}
      {open > 0.01 && open < 0.995 ? <ellipse cx={0} cy={lidY} rx={170} ry={46} fill="url(#nz-soft)" opacity={0.55} /> : null}
      <rect x={-73} y={-115} width={146} height={230} rx={8} fill="none" stroke="#7FE6FF" strokeWidth={2.5} opacity={Math.max(0.9 * decayAt(t, tFlash, 10), 0.55 * sp(t, tEvery, 'pop') * (1 - open))} />
      {/* target brackets on "every" */}
      {(() => {
        const a = sp(t, tEvery, 'pop') * (1 - ss(t, tFlash + 1, tFlash + 7));
        if (a < 0.01) return null;
        const g = (1 - a) * 60;
        return (
          <g opacity={a}>
            {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
              <path key={i} d={`M${sx * (92 + g) - sx * 30} ${sy * (134 + g)} L${sx * (92 + g)} ${sy * (134 + g)} L${sx * (92 + g)} ${sy * (134 + g) - sy * 30}`} fill="none" stroke="#EAF6FF" strokeWidth={5} strokeLinecap="round" />
            ))}
          </g>
        );
      })()}
      <rect x={-BX} y={-BY} width={2 * BX} height={2 * BY} fill="url(#nz-p-vig)" />
      <Hud t={t} scale={scale} depth={DEPTH.pkg} />
    </Stage>
  );
};

const DieDraw: React.FC<NanoLevelProps> = ({t, beats, scale}) => (
  <Stage>
    <ArrayDefs />
    <StringDefs />
    <CellDefs />
    <DieArt t={t} beats={beats} s={scale} />
    <Hud t={t} scale={scale} depth={DEPTH.die} />
  </Stage>
);

const ArrDraw: React.FC<NanoLevelProps> = ({t, beats, scale}) => (
  <Stage>
    <ArrayDefs />
    <StringDefs />
    <CellDefs />
    <ArrayArt t={t} beats={beats} s={scale} />
    <Hud t={t} scale={scale} depth={DEPTH.arr} />
  </Stage>
);

const StrDraw: React.FC<NanoLevelProps> = ({t, beats, scale}) => (
  <Stage>
    <StringDefs />
    <CellDefs />
    <StringArt t={t} beats={beats} s={scale} />
    <Hud t={t} scale={scale} depth={DEPTH.str} />
  </Stage>
);

const CellDraw: React.FC<NanoLevelProps> = ({t, beats, scale}) => (
  <Stage>
    <StringDefs />
    <CellDefs />
    {/* the inside of the channel hole: the same drawing the string level shows, 7x closer */}
    <g transform={`scale(${1 / K34})`}><StringArt t={t} beats={beats} s={scale * K34} bare /></g>
    {/* dust in the light */}
    {Array.from({length: 14}).map((_, i) => {
      const x = (h2(i, 11) - 0.5) * 900 + Math.sin(t * 0.02 + i) * 30, y = (((h2(i, 12) * 1900 - t * (0.6 + h2(i, 13))) % 1900) + 1900) % 1900 - 950;
      return <circle key={i} cx={x} cy={y} r={10 + 26 * h2(i, 14)} fill="url(#nz-s-mote)" opacity={0.25 + 0.2 * h2(i, 15)} />;
    })}
    <CellStage t={t} beats={beats} />
    <Hud t={t} scale={scale} depth={DEPTH.cell} />
  </Stage>
);

const LEVELS: NanoLevel[] = [
  {id: 'pkg', depth: DEPTH.pkg, portal: [0, 0], bg: '#0A0D12', Draw: PkgDraw},
  {id: 'die', depth: DEPTH.die, portal: [0, 0], bg: '#0A0D12', Draw: DieDraw},
  {id: 'arr', depth: DEPTH.arr, portal: [0, 0], bg: '#020A26', Draw: ArrDraw},
  {id: 'str', depth: DEPTH.str, portal: [0, 0], bg: '#061548', Draw: StrDraw},
  {id: 'cell', depth: DEPTH.cell, bg: '#0E0A3F', Draw: CellDraw},
];

export const NanoS03: React.FC<SceneProps> = ({t, W, H, spec}) => (
  <NanoZoom levels={LEVELS} keys={KEYS} t={t} beats={spec.beats ?? []} W={W} H={H} top="#03060C" />
);
