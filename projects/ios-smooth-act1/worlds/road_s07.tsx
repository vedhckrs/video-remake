// S07 THE CHIP ROAD: one horizontal world, a stop per year (2008 deal, 2010 A4, 2013 A7, 2017 A11, 2020 M1).
import React from 'react';
import {Img, staticFile} from 'remotion';
import {siApple} from 'simple-icons';
import {PhotoStage} from '../../../src/kit/explainer/photostage';
import {SiChip, SiExtrude, SiGlow, SiLens, SiPrism, SiScene, SiTop, rr, sweepAcross, useSi} from '../../../src/kit/explainer/silicon';
import {MAC_POINTS, MacInnards, MacShot, macMatrices, macXray, orbitPos, type CamKey, type V3} from '../../../src/kit/cine3d';
import {onWord, pulseOn, wordAt, type Beat, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {Drum, FONT, PERIOD, Plate, Socket, TILT, Tag, clamp01, eo, hsh, lerp, originAt, ramp, rrPts, sm, wordFrom, type PlateDef} from './road_kit';

export const GAP = 1900, X = (i: number) => 960 + i * GAP + (i >= 4 ? 500 : 0) + (i >= 5 ? 500 : 0);
export const YEARS = ['2008', '2010', '2013', '2017', '2020', '2025', '2026'], ACC = ['#FFB347', '#62E0FF', '#B58CFF', '#5BE49B', '#62E0FF', '#FFB347', '#62E0FF'];
export const full: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1920, height: 1080};
export type StopP = {t: number; beats: Beat[]};
export const PAL = {bg0: '#030509', bg1: '#0B111C', glow: '#3B8CFF', particles: '#9CC3FF'};

/** the lit road, its year ticks and the big ghost numerals behind each stop (slower parallax) */
export const RoadBase: React.FC<{camX: number; n0: number; n1: number}> = ({camX, n0, n1}) => {
  const x0 = X(n0) - 2600, w = X(n1) - X(n0) + 5200;
  return (
    <>
      {YEARS.map((y, i) => (i < n0 || i > n1 || Math.abs(X(i) - camX) > 3200 ? null : (
        <div key={y} style={{position: 'absolute', left: X(i) - 760 + (camX - X(i)) * 0.3, top: 150, width: 1520, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 600, lineHeight: '600px', letterSpacing: -20,
                             color: 'rgba(90,130,220,0.035)', WebkitTextStroke: `3px ${ACC[i]}26`}}>{y}</div>
      )))}
      <div style={{position: 'absolute', left: x0, top: 822, width: w, height: 400, background: 'linear-gradient(180deg, rgba(22,34,60,0.95) 0%, rgba(8,12,22,0.96) 30%, #030509 100%)'}} />
      <div style={{position: 'absolute', left: x0, top: 822, width: w, height: 60, backgroundImage: 'repeating-linear-gradient(90deg, rgba(150,195,255,0.5) 0 3px, transparent 3px 95px)', opacity: 0.5,
                   WebkitMaskImage: 'linear-gradient(180deg,#000,transparent)'}} />
      <div style={{position: 'absolute', left: x0, top: 818, width: w, height: 6, background: 'linear-gradient(90deg,#62E0FF,#3B8CFF 50%,#B58CFF)', boxShadow: '0 0 26px #3B8CFF, 0 0 80px #3B8CFF88'}} />
      {YEARS.map((y, i) => (i < n0 || i > n1 ? null : (
        <div key={y} style={{position: 'absolute', left: X(i) - 700, top: 700, width: 1400, height: 260, background: `radial-gradient(ellipse at 50% 50%, ${ACC[i]}40, ${ACC[i]}00 68%)`}} />
      )))}
    </>
  );
};

// ---- 2008: the deal ----------------------------------------------------------------------------------------------------
const P0: PlateDef = {w: 24, d: 16, seed: 5, mask: '#0E1722', keep: [8, 4, 8, 8], chips: [{x: 1.5, y: 2, w: 4.4, d: 4.4, role: 'pmic'}, {x: 18.4, y: 9.6, w: 4, d: 4, role: 'audio'}, {x: 18.6, y: 2, w: 3.6, d: 3.6, role: 'rf'}]};
const U0 = 42, O0 = originAt(U0, 12, 8, 1.6, 1440, 385);
const Stop0: React.FC<StopP> = ({t, beats}) => {
  const bought = onWord(t, beats, 'bought', 'settle'), small = onWord(t, beats, 'small', 'settle'), chip = onWord(t, beats, 'chip'), comp = onWord(t, beats, 'company'), pa = onWord(t, beats, 'pa'), semi = wordAt(beats, 'semi', 62);
  const t278 = wordAt(beats, '278', 88), tMil = wordAt(beats, 'million', 120), tDol = wordAt(beats, 'dollars', 132), mil = onWord(t, beats, 'million'), dol = onWord(t, beats, 'dollars');
  // the counter starts on "Semi" and lands exactly on 278,000,000 on the word "278", then holds
  const c0 = semi + 4, val = t <= c0 ? 0 : t >= t278 ? 278e6 : Math.round(278e6 * eo((t - c0) / (t278 - c0)));
  const tSt = tDol + 9, sign = ramp(t, semi, semi + 16), seal = clamp01((t - tSt + 5) / 5), hit = t >= tSt ? Math.exp(-(t - tSt) / 7) : 0, ring = clamp01((t - tSt) / 16), land = pulseOn(t, beats, (b) => b.t === t278 || b.t === tMil || b.t === tDol, 9);
  const card = ramp(t, 0, 12);
  return (
    <div style={full}>
      <SiScene id="r0" width={1920} height={1080} u={U0} tilt={TILT} origin={O0} style={full} sweep={sweepAcross(sm((t - wordAt(beats, 'chip', 33) + 4) / 40), 0, 0, 24, 16)}>
        <Plate def={P0} lit={Math.max(chip * 0.8 * (1 - ramp(t, semi, semi + 10)), 0.2 + 0.35 * dol + 0.45 * ramp(t, tSt, tSt + 8)) * clamp01(chip)} accent="#FFB347" flow={t * 0.15} />
        <Socket x={8} y={4} w={8} d={8} t={t} opacity={1 - small} />
        <SiGlow x={12} y={8} r={11} z={0.85} color="#FFB347" strength={0.25 * small + 0.45 * land + 0.5 * hit} />
        {small > 0.01 ? <SiChip x={8} y={4} w={8} d={8} z={0.8} role="soc" kind="mold" lift={9 * (1 - small)} opacity={clamp01(small * 2)} glow={0.7 * chip + 0.3 * land} glowColor="#FFB347" highlight={chip * (1 - comp)} highlightColor="#FFB347" mark={{title: '', top: ['ENG SAMPLE'], lines: ['REV A']}} /> : null}
      </SiScene>
      <div style={{position: 'absolute', left: 96, top: 226, width: 840, height: 396, perspective: 1800, opacity: card}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 30, transform: `rotateY(${16 - 9 * bought}deg) rotateX(${7 - 3 * bought + 2.2 * hit}deg) rotateZ(-1.5deg) translateY(${(1 - card) * 50 + 7 * hit}px) scale(${0.94 + 0.06 * bought - 0.012 * hit})`,
                     background: 'linear-gradient(135deg, rgba(48,58,80,0.97), rgba(14,18,30,0.98) 55%, rgba(26,30,44,0.98))', border: `2px solid rgba(255,214,150,${0.3 + 0.4 * bought})`,
                     boxShadow: `0 60px 130px rgba(0,0,0,0.8), 0 0 ${60 + 60 * land + 90 * hit}px rgba(255,179,71,${0.12 + 0.2 * land + 0.4 * hit}), inset 0 1px 0 rgba(255,255,255,0.35)`, padding: '34px 48px', boxSizing: 'border-box', fontFamily: FONT, color: '#fff', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: -200 + ((t * 9) % 1500), top: 0, width: 160, height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.07), rgba(255,255,255,0))', transform: 'skewX(-20deg)'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 600, letterSpacing: 6, color: '#FFB347'}}><span>ACQUISITION AGREEMENT</span><span style={{letterSpacing: 2, color: '#C9D6EA', opacity: 0.4 + 0.6 * bought}}>2008</span></div>
          <div style={{fontSize: 128, fontWeight: 800, lineHeight: '136px', marginTop: 6, letterSpacing: -2, opacity: 0.22 + 0.78 * pa, textShadow: `0 0 ${46 * pa}px rgba(255,179,71,0.55)`}}>P.A. Semi</div>
          <div style={{fontSize: 32, fontWeight: 500, color: '#C9D6EA', opacity: 0.3 + 0.7 * comp}}>a <span style={{color: '#fff', fontWeight: 700, opacity: 0.5 + 0.5 * small}}>small</span> chip-design company</div>
          <div style={{position: 'absolute', left: 48, right: 48, bottom: 92, height: 2, background: 'rgba(255,255,255,0.3)'}} />
          <div style={{position: 'absolute', left: 48, bottom: 34, display: 'flex', alignItems: 'center', gap: 14, fontSize: 32, fontWeight: 600, opacity: 0.35 + 0.65 * bought}}>
            <svg width={36} height={36} viewBox="0 0 24 24"><path d={siApple.path} fill="#fff" /></svg>Buyer: Apple
          </div>
          <svg width={300} height={110} style={{position: 'absolute', right: 210, bottom: 26, overflow: 'visible'}}>
            <path d="M6 78C40 10 62 14 54 58S92 20 110 50s22-44 44-8 30-30 52 2 40-10 84-16" fill="none" stroke="#FFE2B0" strokeWidth={5} strokeLinecap="round" strokeDasharray={520} strokeDashoffset={520 * (1 - sign)} />
          </svg>
          <div style={{position: 'absolute', right: 34, bottom: 24, width: 150, height: 150, borderRadius: 75, border: '6px double #FFB347', color: '#FFB347', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                       fontSize: 28, fontWeight: 800, lineHeight: '30px', transform: `rotate(-14deg) scale(${3 - 2 * seal * seal + 0.06 * hit})`, opacity: clamp01(seal * 1.6), background: `rgba(255,179,71,${0.12 + 0.3 * hit})`, boxShadow: `0 0 ${50 * hit}px rgba(255,179,71,${0.8 * hit})`}}>SIGNED<br />2008</div>
          {ring > 0 && ring < 1 ? <div style={{position: 'absolute', right: 34 + 75 - 75 * (1 + 2.6 * eo(ring)), bottom: 24 + 75 - 75 * (1 + 2.6 * eo(ring)), width: 150 * (1 + 2.6 * eo(ring)), height: 150 * (1 + 2.6 * eo(ring)), borderRadius: '50%', border: `${5 * (1 - ring)}px solid #FFD27A`, opacity: 1 - ring, boxSizing: 'border-box'}} /> : null}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, width: 1920, top: 632, textAlign: 'center', opacity: ramp(t, c0 - 8, c0 + 2), transform: `translateY(${(1 - eo((t - c0 + 8) / 14)) * 40}px) scale(${1 + 0.035 * land})`}}>
        <Drum value={val} digits={9} size={134} prefix="$" accent="#FFB347" glow={Math.max(dol, land)} />
      </div>
    </div>
  );
};

// ---- 2010: the A4 drops into the empty socket ---------------------------------------------------------------------------
const O1 = originAt(30, 22, 15, 1.8, 1010, 540);
const Stop1: React.FC<StopP> = ({t, beats}) => {
  const tCame = wordAt(beats, 'came', 197), tA4 = wordAt(beats, 'a4', 210) + 2, q = clamp01((t - tCame - 1) / (tA4 - tCame - 1)), lit = ramp(t, tA4, tA4 + 12);
  return (
    <SiScene id="r1" width={1920} height={1080} u={30} tilt={TILT} origin={O1} style={full} sweep={sweepAcross(sm((t - tA4 + 4) / 30), 8, 2, 36, 28)}>
      <Plate def={PERIOD} lit={lit} flow={t * 0.2} />
      <Socket x={15} y={8} w={14} d={14} t={t} pulse={q} opacity={q < 1 ? 1 : 0.4} />
      <SiGlow x={22} y={15} r={16} z={0.85} color="#62E0FF" strength={0.55 * lit} />
      {q > 0 ? <SiChip x={15} y={8} w={14} d={14} z={0.8} role="soc" lift={18 * (1 - q) * (1 - q)} opacity={clamp01(q * 3)} glow={0.7 * lit} mark={{logo: 'apple', title: 'A4', top: [], lines: ['APPLE SILICON'], layout: 'center'}} /> : null}
    </SiScene>
  );
};

// ---- 2013: A7, the die x-rays, the lanes widen 32 -> 64 ------------------------------------------------------------------
const P2D: PlateDef = {w: 46, d: 30, seed: 23, mask: '#0B1626', keep: [7, 7, 15, 15], chips: [{x: 2, y: 24.4, w: 4, d: 4, role: 'audio'}, {x: 36.5, y: 2.2, w: 7, d: 5, role: 'pmic'}, {x: 36.5, y: 23, w: 7, d: 5, role: 'nand'}, {x: 24, y: 1.6, w: 4, d: 4, role: 'rf'}]};
const O2 = originAt(34, 14.5, 14.5, 1.8, 740, 520);
const Stop2: React.FC<StopP> = ({t, beats}) => {
  const tA7 = wordAt(beats, 'a7', 333), xr = ramp(t, tA7 + 2, wordAt(beats, 'became', 347) + 12), first = eo((t - wordFrom(beats, 'first', 300, 360)) / 9), t64 = wordAt(beats, '64bit', 368), wide = ramp(t, t64, t64 + 16);
  const chip = eo((t - wordFrom(beats, 'chip', 375, 388)) / 8), phone = onWord(t, beats, 'phone', 'settle'), W = lerp(4.4, 9.6, wide);
  return (
    <div style={full}>
      <SiScene id="r2" width={1920} height={1080} u={34} tilt={TILT} origin={O2} style={full} sweep={sweepAcross(sm((t - tA7 + 8) / 40), 4, 4, 26, 26)}>
        <Plate def={P2D} lit={0.5 * wide} accent="#B58CFF" flow={t * 0.2} />
        <SiTop z={0.84} opacity={first}>
          <rect x={22.6} y={14.5 - W / 2 - 0.5} width={23} height={W + 1} fill="#04060C" opacity={0.85} />
          {Array.from({length: 64}).map((_, j) => {
            const y = lerp(14.5 + ((Math.floor(j / 2) + 0.5) / 32 - 0.5) * 4.4, 14.5 + ((j + 0.5) / 64 - 0.5) * 9.6, wide), odd = j % 2 === 1;
            return <line key={j} x1={22.6} y1={y} x2={45.6} y2={y} stroke={odd ? '#B58CFF' : '#FFD27A'} strokeWidth={0.075} opacity={odd ? wide : 1} strokeDasharray={chip > 0.1 ? '2.2 0.5' : undefined} strokeDashoffset={-t * 0.35 - j * 0.7} />;
          })}
        </SiTop>
        <SiChip x={7} y={7} w={15} d={15} z={0.8} role="soc" xray={0.92 * xr} glow={0.4 * xr + 0.4 * wide} glowColor="#B58CFF" dieActive={wide > 0.2 ? {pcore1: wide, pcore2: wide} : undefined} mark={{logo: 'apple', title: 'A7', top: [], lines: ['APPLE SILICON'], layout: 'center'}} />
      </SiScene>
      <div style={{position: 'absolute', left: 1130, top: 96, opacity: first, transform: `translateY(${(1 - first) * 30}px)`}}>
        <Drum value={32 + 32 * eo((t - t64) / 16)} digits={2} size={150} suffix="-BIT" accent="#B58CFF" glow={wide} />
      </div>
      <svg width={1920} height={1080} style={full} opacity={clamp01(phone * 1.5)}>
        <g transform={`translate(1600 ${350 + (1 - phone) * 60}) rotate(8)`}>
          <rect x={-105} y={-10} width={210} height={420} rx={34} fill="#C9CED6" stroke="#fff" strokeWidth={3} /><rect x={-92} y={44} width={184} height={300} rx={4} fill="#0A1024" />
          <rect x={-92} y={44} width={184} height={300} rx={4} fill="#B58CFF" opacity={0.25 + 0.2 * Math.sin(t / 6)} /><circle cx={0} cy={376} r={19} fill="none" stroke="#8D949D" strokeWidth={4} /><rect x={-24} y={16} width={48} height={7} rx={3.5} fill="#5A6068" />
          <text x={0} y={216} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={76} fill="#fff">64</text>
        </g>
      </svg>
    </div>
  );
};

// ---- 2017: A11, a neural block lights and recognises a face -----------------------------------------------------------------
const P3D: PlateDef = {w: 42, d: 30, seed: 37, mask: '#0A0C10', keep: [6, 6, 16, 16], chips: [{x: 28, y: 3, w: 9, d: 7, role: 'nand'}, {x: 29, y: 14, w: 6, d: 6, role: 'pmic'}, {x: 2, y: 24.6, w: 4, d: 4, role: 'rf'}, {x: 30, y: 23.4, w: 5, d: 4.4, role: 'wireless'}]};
const O3 = originAt(40, 14, 14, 1.8, 690, 560);
const NET: [number, number][] = [[1090, 230], [1090, 340], [1090, 450], [1250, 180], [1250, 290], [1250, 400], [1250, 510], [1410, 260], [1410, 420]];
const Net: React.FC<StopP> = ({t, beats}) => {
  const {v} = useSi();
  const added = onWord(t, beats, 'added'), neural = wordAt(beats, 'neural', 503), eng = onWord(t, beats, 'engine'), mach = onWord(t, beats, 'machine', 'settle'), learn = onWord(t, beats, 'learning');
  const n = v.P(6 + 1.92 + (1273 / 1600) * 12.16, 6 + 3.95 + (613 / 1000) * 8.1, 1.9), L = (p: [number, number]): [number, number] => [p[0] - O3[0], p[1] - O3[1]];
  const edges: [number, number][] = [];
  for (let a = 0; a < 3; a++) for (let b = 3; b < 7; b++) edges.push([a, b]);
  for (let a = 3; a < 7; a++) for (let b = 7; b < 9; b++) edges.push([a, b]);
  const fx = 1660 - O3[0], fy = 340 - O3[1], col = learn > 0.5 ? '#5BE49B' : '#62E0FF';
  return (
    <g>
      {[0, 1, 2].map((i) => { const p = L(NET[i]); return <line key={i} x1={n[0]} y1={n[1]} x2={p[0]} y2={p[1]} stroke="#5BE49B" strokeWidth={3} opacity={0.7 * added} strokeDasharray="10 8" strokeDashoffset={-t * 2} />; })}
      {edges.map(([a, b], i) => { const p = L(NET[a]), q = L(NET[b]), on = ramp(t, neural + (a < 3 ? 2 : 8), neural + (a < 3 ? 10 : 16)); return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#5BE49B" strokeWidth={2 + 2 * eng * hsh(i + Math.floor(t / 4))} opacity={on * (0.3 + 0.5 * eng * hsh(i * 3 + Math.floor(t / 4)))} />; })}
      {NET.map((p0, i) => { const p = L(p0), on = eo((t - neural - (i < 3 ? 0 : i < 7 ? 6 : 12)) / 8); return <g key={i} opacity={on}><circle cx={p[0]} cy={p[1]} r={30} fill="#5BE49B" opacity={0.18} /><circle cx={p[0]} cy={p[1]} r={15 + 3 * Math.sin(t / 5 + i)} fill="#0A1A14" stroke="#5BE49B" strokeWidth={4} /></g>; })}
      {[7, 8].map((i) => { const p = L(NET[i]); return <line key={i} x1={p[0]} y1={p[1]} x2={fx - 130} y2={fy} stroke={col} strokeWidth={3} opacity={mach * 0.8} />; })}
      <g opacity={mach}>
        {Array.from({length: 90}).map((_, i) => { const a = hsh(i) * 6.283, r = Math.sqrt(hsh(i * 7.7)); return <circle key={i} cx={fx + Math.cos(a) * r * 92} cy={fy + Math.sin(a) * r * 124} r={3} fill={col} opacity={0.35 + 0.6 * hsh(i + Math.floor(t / 3))} />; })}
        <ellipse cx={fx} cy={fy} rx={98} ry={130} fill="none" stroke={col} strokeWidth={5} strokeDasharray={learn > 0.5 ? undefined : '12 10'} strokeDashoffset={-t * 2} />
        <path d={`M${fx - 44} ${fy - 24}h28M${fx + 16} ${fy - 24}h28M${fx} ${fy - 6}v38h-14M${fx - 36} ${fy + 66}q36 26 72 0`} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" />
        <path d={`M${fx - 150} ${fy - 110}v-50h50M${fx + 150} ${fy - 110}v-50h-50M${fx - 150} ${fy + 110}v50h50M${fx + 150} ${fy + 110}v50h-50`} fill="none" stroke={col} strokeWidth={6} />
        <line x1={fx - 140} x2={fx + 140} y1={fy - 150 + ((t * 9) % 300)} y2={fy - 150 + ((t * 9) % 300)} stroke={col} strokeWidth={3} opacity={0.8 * (1 - learn)} />
        <g opacity={learn} transform={`translate(${fx + 120} ${fy + 130}) scale(${learn})`}><circle r={34} fill="#5BE49B" /><path d="M-15 0l11 12 20-24" fill="none" stroke="#04140C" strokeWidth={8} strokeLinecap="round" /></g>
      </g>
    </g>
  );
};
const Stop3: React.FC<StopP> = ({t, beats}) => {
  const tA = wordAt(beats, 'a11', 478), xr = ramp(t, tA - 12, tA + 8), added = onWord(t, beats, 'added', 'settle'), p = pulseOn(t, beats);
  return (
    <SiScene id="r3" width={1920} height={1080} u={40} tilt={TILT} origin={O3} style={full} sweep={sweepAcross(sm((t - tA + 14) / 44), 2, 2, 26, 26)}>
      <Plate def={P3D} lit={0.6 * added} accent="#5BE49B" flow={t * 0.2} />
      <SiChip x={6} y={6} w={16} d={16} z={0.8} role="soc" xray={0.94 * xr} glow={0.3 * xr + 0.5 * added + 0.15 * p * added} glowColor="#5BE49B" dieActive={added > 0.05 ? {npu: added} : undefined} mark={{logo: 'apple', title: 'A11', top: [], lines: ['APPLE SILICON'], layout: 'center'}} />
      <Net t={t} beats={beats} />
    </SiScene>
  );
};

// ---- 2020: the same idea scaled up = M1; x86 is pushed out of the Mac logic board; then the camera pulls back and the real
// MacBook Air M1 (cine3d MacShot, built in code) forms round the board: deck ghosted, then solid, the lid opens, the screen lights
const P4D: PlateDef = {w: 60, d: 30, seed: 51, mask: '#0D1418', keep: [20, 7, 15, 15], chips: [
  {x: 38, y: 5, w: 8.5, d: 8, role: 'dram'}, {x: 38, y: 15.5, w: 8.5, d: 8, role: 'dram'}, {x: 3, y: 4, w: 10, d: 8, role: 'nand'}, {x: 4, y: 16, w: 6, d: 6, role: 'pmic'},
  {x: 50, y: 5, w: 6, d: 6, role: 'pmic'}, {x: 50, y: 16, w: 5, d: 5, role: 'wireless'}, {x: 12, y: 24.5, w: 4, d: 4, role: 'audio'}, {x: 48, y: 24.5, w: 8, d: 4, role: 'shield', kind: 'shield'}]};
const MW = 124, MD = 66, BX4 = 32, BY4 = 8, SW4 = 15, SX4 = BX4 + 20, SY4 = BY4 + 7, SCX = SX4 + SW4 / 2, SCY = SY4 + SW4 / 2;
const BODY4 = rrPts(0, 0, MW, MD, 6);
const CELLS: [number, number][] = [[6, 27], [35, 26], [63, 26], [91, 27]];
const MacBase = React.memo(() => {
  const {id} = useSi();
  return (
    <g>
      <SiExtrude pts={BODY4} z={-5} h={5} color="#AEB4BC" />
      <SiTop z={0}>
        <path d={rr(0, 0, MW, MD, 6)} fill="#08090C" stroke="#D5D9DE" strokeWidth={1.5} />
        <path d={rr(2.2, 2.2, MW - 4.4, MD - 4.4, 4.4)} fill={`url(#${id}-env)`} opacity={0.35} />
        {/* no fan: the M1 MacBook Air is fanless. A flex runs from the I/O module (left) to the board */}
        <rect x={24} y={19} width={9} height={5} rx={0.6} fill="#B8661C" opacity={0.7} />
        {/* speaker grilles + hinge clutch */}
        {[4, MW - 9].map((x) => <g key={x}>{Array.from({length: 40}).map((_, i) => <circle key={i} cx={x + 0.9 + (i % 4) * 1.1} cy={43 + Math.floor(i / 4) * 1.9} r={0.34} fill="#30343B" />)}</g>)}
        <rect x={30} y={1.2} width={64} height={3.4} rx={1.7} fill="#2A2D33" stroke="#565C65" strokeWidth={0.25} />
      </SiTop>
      <SiChip x={6} y={8} w={19} d={28} z={0} kind="shield" role="shield" perf seed={3} />
      <SiChip x={99} y={8} w={19} d={28} z={0} kind="shield" role="shield" perf />
      <Plate def={P4D} ox={BX4} oy={BY4} lit={0} />
      {CELLS.map(([x, w], i) => (
        <g key={i}>
          <SiPrism x={x} y={43} w={w} d={19} z={0} h={2.4} color="#17191D" />
          <SiTop z={2.4}>
            <rect x={x} y={43} width={w} height={19} rx={1.2} fill="#14161A" stroke="#33373E" strokeWidth={0.2} /><rect x={x} y={43} width={w} height={19} rx={1.2} fill={`url(#${id}-env)`} opacity={0.5} />
            <rect x={x + 2} y={46} width={w * 0.5} height={1} rx={0.5} fill="#6F757D" opacity={0.7} /><rect x={x + 2} y={48.4} width={w * 0.32} height={0.8} rx={0.4} fill="#6F757D" opacity={0.5} />
            <rect x={x} y={43} width={w} height={19} rx={1.2} fill={`url(#${id}-sweep)`} opacity={0.6} />
          </SiTop>
        </g>
      ))}
    </g>
  );
});
// the 3D shot: the camera starts close over the M1 on the board inside the Mac (the 2D board's 3/4 angle) and pulls back
// in one move to the hero 3/4 framing (whole laptop inside y 5-77 %, clear of the year tag on the left)
const CHIPW = ((): V3 => { const c = MAC_POINTS.chip.p, e = macMatrices().base.elements; return [e[0] * c[0] + e[4] * c[1] + e[8] * c[2] + e[12], e[1] * c[0] + e[5] * c[1] + e[9] * c[2] + e[13], e[2] * c[0] + e[6] * c[1] + e[10] * c[2] + e[14]]; })();
const HERO_TGT: V3 = [-4.0, 3.2, -2.6];
/** Ved's wallpaper for this scene (file stays in the engine's public folder), cropped to fill the 1440 x 900 screen */
const WALL = 'ios-smooth-act1/img/macos_wallpaper_light_apple.jpg';
const Screen07 = React.memo(() => <Img src={staticFile(WALL)} style={{position: 'absolute', left: 0, top: 0, width: 1440, height: 900, objectFit: 'cover'}} />);
/** one pull-back: the distance grows in log space (an even zoom), angle and target ease with it; rests at both ends */
const macCam = (t0: number, t1: number): CamKey[] => Array.from({length: 7}, (_, i) => {
  const q = i / 6, e = sm(q), tgt: V3 = [lerp(CHIPW[0], HERO_TGT[0], e), lerp(CHIPW[1], HERO_TGT[1], e), lerp(CHIPW[2], HERO_TGT[2], e)];
  return {t: lerp(t0, t1, q), pos: orbitPos(lerp(0, -33, e), lerp(56, 9, e), Math.exp(lerp(Math.log(11.5), Math.log(65), e)), tgt), tgt, fov: 22, hold: i === 0 || i === 6};
});
export const Stop4: React.FC<StopP> = ({t, beats}) => {
  const tSame = wordAt(beats, 'same', 610), tSc = wordAt(beats, 'scaled', 636), tBe = wordFrom(beats, 'became', 600, 656), tM1 = wordAt(beats, 'm1', 672), tRe = wordAt(beats, 'replaced', 703), tIn = wordAt(beats, 'intel', 716), tIns = wordAt(beats, 'inside', 729), tMac = wordAt(beats, 'mac', 744);
  const show = ramp(t, tSame - 5, tSame + 4), idea = ramp(t, wordAt(beats, 'idea', 618) - 2, wordAt(beats, 'idea', 618) + 8), grow = ramp(t, tSc - 2, tBe + 4), pkg = ramp(t, tBe, tM1 + 2), m1 = ramp(t, tM1 - 2, tM1 + 8);
  const lift86 = ramp(t, tRe - 3, tRe + 6), push = ramp(t, tRe + 3, tIn + 13), drop = ramp(t, tIns - 7, tIns + 7), lit = ramp(t, tIns + 5, tIns + 16);
  // "inside the Mac": the 2D board eases back and dissolves into the same board inside the real machine
  const pull = ramp(t, tIns + 6, tIns + 22), in3 = ramp(t, tIns + 8, tIns + 17), out2 = 1 - ramp(t, tIns + 11, tIns + 20);
  const xr = 1 - ramp(t, tMac + 8, tMac + 22), lidA = lerp(84, 102, ramp(t, tIns + 13, tMac + 24)), scr = ramp(t, tMac + 12, tMac + 26);
  const u = Math.exp(lerp(Math.log(30), Math.log(15), pull)), O = originAt(u, SCX, SCY, 1.8, 960, lerp(610, 548, pull));
  const w = lerp(7, SW4, grow), cx = SCX, cy = SCY - 2 * (1 - drop), hov = 13 * (1 - drop), dx = push * push * 96;
  const sweep = sweepAcross(sm((t - tM1 + 6) / 40), BX4, BY4, BX4 + 60, BY4 + 30);
  const cam = React.useMemo(() => macCam(tIns + 7, tMac + 24), [tIns, tMac]);
  return (
    <div style={full}>
      {out2 > 0.004 ? (
      <div style={{...full, opacity: out2}}>
    <SiScene id="r4" width={1920} height={1080} u={u} tilt={TILT} origin={O} style={full} sweep={sweep}>
      <defs>
        <linearGradient id="r4-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5B9BFF" /><stop offset="0.5" stopColor="#2A62D6" /><stop offset="1" stopColor="#163C92" /></linearGradient>
      </defs>
      <MacBase />
      {lit > 0.01 ? <Plate def={P4D} ox={BX4} oy={BY4} lit={lit} accent="#62E0FF" flow={t * 0.2} /> : null}
      <Socket x={SX4} y={SY4} w={SW4} d={SW4} t={t} pulse={push * (1 - drop)} color="#62E0FF" opacity={lift86 * (1 - drop * 0.6)} />
      <SiGlow x={SCX} y={SCY} r={20} z={0.85} color="#62E0FF" strength={0.7 * lit} />
      {/* the plain blue x86 chip: sits in the CPU seat, then lifts and is pushed out of the frame */}
      {push < 0.995 ? (
        <g opacity={1 - ramp(push, 0.85, 1)}>
          {[3, 2, 1].map((g) => <SiTop key={g} z={0.8 + 1.3 + 3 * lift86} opacity={0.16 * push * (4 - g) / 3}><rect x={SX4 + dx - g * 7 * push} y={SY4} width={SW4} height={SW4} rx={0.6} fill="#3B8CFF" /></SiTop>)}
          <SiTop z={0.84} opacity={0.45 * lift86}><rect x={SX4 + dx + 1.2} y={SY4 + 1.6} width={SW4} height={SW4} rx={1} fill="#000" /></SiTop>
          <SiPrism x={SX4 + dx} y={SY4} w={SW4} d={SW4} z={0.8 + 3 * lift86} h={1.3} color="#1D4FA8" />
          <SiTop z={0.8 + 1.3 + 3 * lift86}>
            <rect x={SX4 + dx} y={SY4} width={SW4} height={SW4} rx={0.6} fill="url(#r4-blue)" stroke="#BFD6FF" strokeOpacity={0.6} strokeWidth={0.12} />
            <rect x={SX4 + dx} y={SY4} width={SW4} height={SW4} rx={0.6} fill="url(#r4-sweep)" opacity={0.6} />
            <circle cx={SX4 + dx + 1.4} cy={SY4 + SW4 - 1.4} r={0.45} fill="#0B2A6E" />
            <text x={SX4 + dx + SW4 / 2} y={SY4 + SW4 / 2 + 1.7} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={4.8} fill="#EAF2FF">x86</text>
            <rect x={SX4 + dx} y={SY4} width={SW4} height={SW4} rx={0.6} fill="none" stroke="#FF4D5E" strokeWidth={0.35} opacity={lift86 * (1 - push)} strokeDasharray="1.4 0.9" />
          </SiTop>
        </g>
      ) : null}
      {/* the phone-chip idea, scaled up into the M1, then dropped into the seat */}
      {show > 0.01 ? (
        <g opacity={clamp01(show * 2)}>
          <SiTop z={0.8 + hov} opacity={(1 - grow) * idea}><rect x={cx - SW4 / 2} y={cy - SW4 / 2} width={SW4} height={SW4} rx={0.8} fill="#62E0FF" fillOpacity={0.05} stroke="#62E0FF" strokeWidth={0.16} strokeDasharray="1.2 0.8" strokeDashoffset={-t * 0.1} /></SiTop>
          <SiChip x={cx - w / 2} y={cy - w / 2} w={w} d={w} z={0.8 + hov} role="soc" bare={drop < 1} xray={0.94 * (1 - pkg)} dieActive={pkg < 0.99 ? {pcore1: idea, pcore2: idea, gpu: idea * grow, npu: idea * grow} : undefined}
                  glow={0.35 * idea + 0.45 * m1 + 0.2 * lit} glowColor="#62E0FF" highlight={m1 * (1 - ramp(t, tRe - 6, tRe + 4))}
                  mark={{logo: 'apple', title: 'M1', top: [], lines: ['APPLE SILICON'], layout: 'center'}} />
        </g>
      ) : null}
    </SiScene>
      </div>
      ) : null}
      {in3 > 0.004 ? (
        <div style={{...full, opacity: in3}}>
          {/* a pool of light and a darker floor so the machine stands on the road */}
          <div style={{position: 'absolute', left: 300, top: 560, width: 1700, height: 420, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(3,5,9,0.72) 0%, rgba(3,5,9,0) 70%)', opacity: 1 - xr * 0.5}} />
          <div style={{position: 'absolute', left: 420, top: 640, width: 1400, height: 300, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(98,224,255,0.22) 0%, rgba(98,224,255,0) 70%)'}} />
          <MacShot t={t} W={1920} H={1080} cam={cam} lid={lidA} screenOn={scr} screen={<Screen07 />} shell={macXray(xr, {backlight: scr})} fx={{dof: false}} light={{main: 1.1, fill: 1.3, rim: 1.3}} floor={{shadow: 0.55}}
            interior={<MacInnards t={t} lit={1} m1={{glow: 0.85, glowColor: '#62E0FF'}} />} />
        </div>
      ) : null}
    </div>
  );
};

/** a stop whose art bleeds past its 1920 box: the left overflow fades out 480 px before the box (never seen from the previous stop) */
export const Bleed: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: -480, top: -500, width: 2900, height: 2100, WebkitMaskImage: 'linear-gradient(90deg, transparent 0px, #000 220px)', maskImage: 'linear-gradient(90deg, transparent 0px, #000 220px)'}}>
    <div style={{position: 'absolute', left: 480, top: 500, width: 1920, height: 1080}}>{children}</div>
  </div>
);
const STOPS = [Stop0, Stop1, Stop2, Stop3, Stop4];
const Draw: React.FC<WorldDrawProps> = ({t, beats, cam}) => (
  <div style={{position: 'absolute', left: 0, top: 0}}>
    <RoadBase camX={cam.x} n0={0} n1={4} />
    {STOPS.map((S, i) => (Math.abs(X(i) - cam.x) > 2500 ? null : <div key={i} style={{...full, left: X(i) - 960}}>{i === 4 ? <Bleed><S t={t} beats={beats} /></Bleed> : <S t={t} beats={beats} />}</div>))}
  </div>
);
/** world-locked layer for the overlay (same transform as the world, drawn above the lens) */
export const Locked: React.FC<{toScreen: (x: number, y: number) => [number, number]; children: React.ReactNode}> = ({toScreen, children}) => {
  const o = toScreen(0, 0), s = toScreen(1, 0)[0] - o[0];
  return <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${o[0]}px,${o[1]}px) scale(${s})`}}>{children}</div>;
};
export const PHOTO_IN = 230, PHOTO_OUT = 306;
const Overlay: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}> = ({t, beats, W, H, toScreen}) => {
  const w = (s: string, n: 'pop' | 'settle' = 'settle') => onWord(t, beats, s, n), L = (i: number) => X(i) - 960 + 90;
  return (
    <>
      <SiLens W={W} H={H} t={t} focus={[0.14, 0.8]} blur={5} dust={12} tint="#6FA8FF" seed={8} />
      <Locked toScreen={toScreen}>
        <Tag x={L(0)} y={56} year="2008" a={eo(t / 14)} accent={ACC[0]} pulse={pulseOn(t, beats, (b) => b.s >= 3)} />
        <Tag x={L(1)} y={60} year="2010" a={w('two')} title="Apple A4" b={w('a4')} accent={ACC[1]} />
        <Tag x={L(2)} y={60} year="2013" a={w('2013')} title="Apple A7" b={w('a7')} line="first 64-bit chip in a phone" c={w('64bit')} accent={ACC[2]} />
        <Tag x={L(3)} y={60} year="2017" a={w('2017')} title="A11 Bionic" b={w('a11')} line="adds the Neural Engine" c={w('neural')} accent={ACC[3]} />
        <Tag x={L(4)} y={60} year="2020" a={w('2020')} title="Apple M1" b={w('m1')} line="Apple silicon replaces Intel in the Mac" c={w('replaced')} accent={ACC[4]} />
      </Locked>
      {t > PHOTO_IN && t < PHOTO_OUT ? (
        <div style={{position: 'absolute', inset: 0, opacity: 1 - ramp(t, PHOTO_OUT - 8, PHOTO_OUT)}}>
          <PhotoStage src="ios-smooth-act1/img/s5_a4_on-iphone4-board-closeup_commons.jpg" t={t} W={W} H={H} dur={PHOTO_OUT} at={PHOTO_IN} aspect={1} eyebrow="Real photo · 2010" title="Apple A4" lines={['The first chip Apple designed itself.']} reveal={[2, 6, 18]} />
        </div>
      ) : null}
    </>
  );
};
export const s07World: WorldDef = {
  id: 'road07', home: 'semi',
  anchors: {semi: {x: X(0), y: 540, zoom: 1}, a4: {x: X(1), y: 540, zoom: 1}, a7: {x: X(2), y: 540, zoom: 1}, a11: {x: X(3), y: 540, zoom: 1}, m1: {x: X(4), y: 540, zoom: 1}},
  aliases: {two: 'a4', '2013': 'a7', '2017': 'a11', '2020': 'm1'},
  palette: PAL, Draw, Overlay,
};
