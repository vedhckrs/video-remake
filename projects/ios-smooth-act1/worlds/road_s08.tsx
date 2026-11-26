// S08 THE CHIPS AROUND IT (v2): same road, 2025 (C1 + N1 swaps on the modern board, one radio idea at a time) ->
// 2026 (the REAL iPhone 18 Pro, cine3d PhoneShot, board inside) -> A20 Pro package hero -> 3D transistor lens (2 nm).
import React from 'react';
import {LogicBoard, SiChassis, SiChip, SiLens, SiScene, boardLayout, boardPartTop, sweepAcross, type BoardPartState, type ChipMark} from '../../../src/kit/explainer/silicon';
import {onWord, wordAt, type Beat, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {PHONE_POINTS, PhoneInnards, innardsPoint, PhoneShot, phoneView, Transistor3D, add3, fetSwitch, orbitPos, xrayShell, type CamKey, type OrbitKey, type V3} from '../../../src/kit/cine3d';
import {FONT, TILT, Tag, clamp01, eo, hsh, lerp, originAt, planPx, ramp, sm, wordFrom} from './road_kit';
import {ACC, Bleed, Locked, PAL, RoadBase, Stop4, X, full, type StopP} from './road_s07';

const LAYOUT = boardLayout(7), UB = 30, OB = originAt(UB, 34, 13, 0.8, 960, 520);
const part = (id: string) => LAYOUT.parts.find((p) => p.id === id)!;
const topPx = (id: string) => { const [x, y, z] = boardPartTop(id, LAYOUT); return planPx(UB, OB, x, y, z); };
const MODEM = topPx('modem'), WIFI = topPx('wireless');
const BLANK: ChipMark = {logo: null, title: '', top: [], lines: []};
const mk = (s: string): ChipMark => ({logo: 'apple', title: s, top: [], lines: ['APPLE SILICON'], layout: 'center'});
const NEAR = ['pmic', 'charger', 'audio', 'transceiver', 'rf1', 'fem1', 'fem2', 'uwb', 'modem', 'wireless', 'nfc'];
const AMB = '#FFB347', CYA = '#62E0FF';

/** every cue of the scene in one place (design frames) */
const cues = (beats: Beat[]) => {
  const tMo = wordAt(beats, 'modem', 92), tC1 = wordAt(beats, 'c1', 106) + 2, t25 = wordAt(beats, '2025', 128), tOwn2 = wordFrom(beats, 'own', 150, 170);
  const tWi = wordAt(beats, 'wireless', 178), tN1 = wordAt(beats, 'n1', 208) + 2, tSame = wordAt(beats, 'same', 237), tYear = wordAt(beats, 'year', 246), tNow = wordAt(beats, 'now', 280);
  const tIph = wordAt(beats, 'iphone', 304), t18 = wordAt(beats, '18', 317), tPro = wordAt(beats, 'pro', 328), tA = wordAt(beats, 'a20', 346), tFirst = wordAt(beats, 'first', 389), t2 = wordAt(beats, '2', 400);
  // C1 radio: the pulse leaves when the chip lands and reaches the tower on "2025"; the tower answers in the hold
  return {tAr: wordAt(beats, 'chips', 46), tMo, tC1, t25, tOwn2, tWi, tN1, tSame, tYear, tNow, tIph, t18, tPro, tA, tFirst, t2, back0: t25 + 7, back1: t25 + 23};
};

// ---- 2025: the board, the two swaps ----------------------------------------------------------------------------------------
const Stop5: React.FC<StopP> = ({t, beats}) => {
  const c = cues(beats);
  const parts: Record<string, BoardPartState> = {};
  NEAR.forEach((id, i) => { parts[id] = {highlight: ramp(t, c.tAr + i * 3, c.tAr + 8 + i * 3) * (1 - ramp(t, c.tMo - 8, c.tMo)), highlightColor: i % 2 ? CYA : AMB}; });
  const kids: React.ReactNode[] = [];
  const swap = (id: string, tOut: number, tIn: number, name: string, col: string, flash: number) => {
    const out = ramp(t, tOut, tOut + 12), inn = clamp01((t - tIn + 10) / 10), p = part(id), z = boardPartTop(id, LAYOUT)[2];
    if (inn >= 1) parts[id] = {mark: mk(name), kind: 'mold', glow: 0.45 + 0.12 * Math.sin(t / 7) + 0.5 * flash, glowColor: col, highlight: Math.max(1 - ramp(t, tIn, tIn + 26), flash), highlightColor: col};
    else {
      parts[id] = out > 0.99 ? {hide: true} : {mark: BLANK, kind: 'module', lift: 0.03 + 13 * out, opacity: 1 - out * out, highlight: ramp(t, tOut - 10, tOut), highlightColor: col};
      if (inn > 0) kids.push(<SiChip key={id} x={p.x} y={p.y} w={p.w} d={p.d} z={z - p.h} h={p.h} role="modem" kind="mold" mark={mk(name)} lift={14 * (1 - inn) * (1 - inn)} opacity={clamp01(inn * 3)} glow={0.5} glowColor={col} />);
    }
  };
  // the chip flashes when the tower's answer arrives, and both new chips glow together on "the same year"
  const both = t >= c.tYear ? Math.exp(-(t - c.tYear) / 12) : 0;
  swap('modem', c.tMo + 2, c.tC1, 'C1', AMB, Math.max(t >= c.back1 ? Math.exp(-(t - c.back1) / 9) : 0, both));
  swap('wireless', c.tWi + 2, c.tN1, 'N1', CYA, both);
  return (
    <SiScene id="r5" width={1920} height={1080} u={UB} tilt={TILT} origin={OB} style={full} sweep={sweepAcross(sm((t - 30) / 70), 0, 0, 72, 40)}>
      <SiChassis layer="back" />
      <LogicBoard layout={LAYOUT} parts={parts}>{kids}</LogicBoard>
      <SiChassis layer="front" />
    </SiScene>
  );
};

// ---- radio graphics (world px of stop 5, drawn above the lens): ONE idea on screen at a time --------------------------------
const TWX = MODEM[0] + 600, TWY = MODEM[1] + 70, TIP: [number, number] = [TWX, TWY - 214], SRC: [number, number] = [MODEM[0] + 96, MODEM[1] - 44];
const CTL: [number, number] = [(SRC[0] + TIP[0]) / 2 - 20, Math.min(SRC[1], TIP[1]) - 150];
const bez = (q: number): [number, number] => [(1 - q) * (1 - q) * SRC[0] + 2 * q * (1 - q) * CTL[0] + q * q * TIP[0], (1 - q) * (1 - q) * SRC[1] + 2 * q * (1 - q) * CTL[1] + q * q * TIP[1]];
const ARC = `M${SRC[0]} ${SRC[1]}Q${CTL[0]} ${CTL[1]} ${TIP[0]} ${TIP[1]}`;
const Comet: React.FC<{q: number; col: string}> = ({q, col}) => {
  if (q <= 0 || q >= 1) return null;
  const p = bez(q), a = Math.sin(q * Math.PI), len = 0.2;
  return (
    <g opacity={Math.min(1, a * 3)}>
      <path d={ARC} pathLength={1} fill="none" stroke={col} strokeWidth={16} strokeLinecap="round" opacity={0.16} strokeDasharray={`${len} 2`} strokeDashoffset={-(q - len)} />
      <path d={ARC} pathLength={1} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${len} 2`} strokeDashoffset={-(q - len)} />
      <circle cx={p[0]} cy={p[1]} r={22} fill={col} opacity={0.22} /><circle cx={p[0]} cy={p[1]} r={9} fill="#fff" />
    </g>
  );
};
const C1Radio: React.FC<StopP> = ({t, beats}) => {
  const c = cues(beats), a = ramp(t, c.tC1 - 2, c.tC1 + 10) * (1 - ramp(t, c.back1 + 6, c.tOwn2 - 3));
  if (a <= 0.01) return null;
  const go = clamp01((t - c.tC1 - 3) / (c.t25 - c.tC1 - 3)), back = clamp01((t - c.back0) / (c.back1 - c.back0));
  const hit = t >= c.t25 ? Math.exp(-(t - c.t25) / 10) : 0, answer = ramp(t, c.back0 - 6, c.back0) * (1 - ramp(t, c.back1, c.back1 + 8));
  const bars = clamp01((t - c.back1) / 8) * 4;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: a}}>
      <svg width={2600} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><radialGradient id="r5-tw" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#03050A" stopOpacity={0.92} /><stop offset="0.6" stopColor="#03050A" stopOpacity={0.7} /><stop offset="1" stopColor="#03050A" stopOpacity={0} /></radialGradient></defs>
        <ellipse cx={TWX} cy={TWY - 96} rx={230} ry={250} fill="url(#r5-tw)" />
        <path d={ARC} fill="none" stroke={AMB} strokeWidth={2.5} strokeDasharray="3 12" strokeDashoffset={-t * 0.6} strokeLinecap="round" opacity={0.5} />
        {/* the cell tower: lattice mast, antenna, two tidy arcs that light when the pulse arrives */}
        <g transform={`translate(${TWX} ${TWY})`} strokeLinejoin="round" strokeLinecap="round">
          <ellipse cx={0} cy={4} rx={86} ry={15} fill={AMB} opacity={0.14 + 0.2 * hit} />
          <path d="M0 -196L-46 0M0 -196L46 0M-11 -150H11M-23 -98H23M-35 -46H35M-46 0H46M-11 -150L23 -98L-35 -46L46 0M11 -150L-23 -98L35 -46L-46 0" fill="none" stroke="#FFE1B3" strokeWidth={5} />
          <line x1={0} y1={-196} x2={0} y2={-214} stroke="#FFE1B3" strokeWidth={5} />
          <circle cx={0} cy={-214} r={9 + 7 * Math.max(hit, answer)} fill={AMB} opacity={0.35} /><circle cx={0} cy={-214} r={7} fill="#fff" />
          {[1, 2].map((k) => <path key={k} d={`M${-20 * k - 8} ${-214 - 22 * k}a${30 * k + 6} ${30 * k + 6} 0 0 0 0 ${44 * k}M${20 * k + 8} ${-214 - 22 * k}a${30 * k + 6} ${30 * k + 6} 0 0 1 0 ${44 * k}`} fill="none" stroke={AMB} strokeWidth={5} opacity={0.22 + 0.78 * clamp01(Math.max(hit, answer) * (k === 1 ? 1.4 : 1))} />)}
        </g>
        <Comet q={go} col={AMB} /><Comet q={1 - back} col="#FFE7C2" />
      </svg>
      {/* label pill, clear of the chip marking, with signal bars that fill when the tower answers */}
      <div style={{position: 'absolute', left: MODEM[0] - 150, top: MODEM[1] - 236, transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * eo((t - c.tC1) / 10)})`, fontFamily: FONT, whiteSpace: 'nowrap', padding: '10px 26px', borderRadius: 24,
                   background: 'rgba(6,9,15,0.9)', border: `2px solid ${AMB}`, boxShadow: `0 10px 40px rgba(0,0,0,0.7), 0 0 ${26 + 30 * (t > c.back1 + 6 ? Math.exp(-(t - c.back1 - 6) / 10) : 0)}px ${AMB}66`, display: 'flex', alignItems: 'center', gap: 16}}>
        <span style={{fontSize: 42, fontWeight: 800, color: '#fff'}}>C1</span><span style={{fontSize: 30, fontWeight: 500, color: AMB}}>Apple's own modem</span>
        <svg width={50} height={36} style={{marginLeft: 4}}>{[0, 1, 2, 3].map((k) => <rect key={k} x={k * 13} y={27 - k * 8} width={9} height={9 + k * 8} rx={2.5} fill={bars > k + 0.5 ? '#fff' : 'rgba(255,255,255,0.22)'} />)}</svg>
      </div>
    </div>
  );
};
// the N1's three radios: one clean column in the free space right of the board, one row per beat
const COLX = WIFI[0] + 420, COLY = WIFI[1] - 150, ROWH = 94, NPILL: [number, number] = [COLX - 44, COLY - 120];
const ROWS: {name: string; col: string}[] = [{name: 'Wi-Fi 7', col: CYA}, {name: 'Bluetooth 6', col: '#7FA8FF'}, {name: 'Thread', col: '#5BE49B'}];
const Glyph: React.FC<{k: number; col: string; a: number}> = ({k, col, a}) => (
  <svg width={60} height={60} viewBox="-30 -30 60 60" style={{flex: 'none'}}>
    <g fill="none" stroke={col} strokeWidth={4.5} strokeLinecap="round">
      {k === 0 ? <>{[1, 2, 3].map((i) => <path key={i} d={`M${-8.5 * i} ${16 - 8.5 * i}A${12 * i} ${12 * i} 0 0 1 ${8.5 * i} ${16 - 8.5 * i}`} opacity={clamp01(a * 4 - i)} />)}<circle cx={0} cy={16} r={4} fill={col} stroke="none" /></> : null}
      {k === 1 ? <><circle cx={-18} cy={0} r={5} fill={col} stroke="none" /><circle cx={18} cy={0} r={5} fill={col} stroke="none" opacity={clamp01(a * 4 - 2)} />{[1, 2].map((i) => <path key={i} d={`M${-12 + 7 * i} ${-5 * i - 3}A${7 * i + 4} ${7 * i + 4} 0 0 1 ${-12 + 7 * i} ${5 * i + 3}`} opacity={clamp01(a * 4 - i)} />)}</> : null}
      {k === 2 ? <><path d="M0 -17L-18 13H18Z" strokeWidth={3.5} opacity={clamp01(a * 3 - 1)} />{[[0, -17], [-18, 13], [18, 13]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill="#06090F" strokeWidth={4} opacity={clamp01(a * 4 - i * 0.6)} />)}</> : null}
    </g>
  </svg>
);
const N1Radio: React.FC<StopP> = ({t, beats}) => {
  const c = cues(beats), out = 1 - ramp(t, c.tNow - 8, c.tNow - 1), pill = eo((t - c.tN1 - 2) / 10) * out;
  if (pill <= 0.01) return null;
  const at = [c.tN1 + 10, c.tSame, c.tYear], rows = at.map((f) => eo((t - f) / 10)), n = rows.filter((r) => r > 0).length, lead = ramp(t, c.tN1 + 4, c.tN1 + 14);
  const x0 = WIFI[0] + 118, y0 = WIFI[1] - 4, xr = COLX - 34, yTop = COLY + 4, yBot = COLY + ROWH * 2 + 52;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
      <div style={{position: 'absolute', left: COLX - 150, top: COLY - 90, width: 700, height: ROWH * 3 + 250, marginTop: -80, opacity: lead, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(3,5,10,0.9) 0%, rgba(3,5,10,0.78) 55%, rgba(3,5,10,0) 100%)'}} />
      <svg width={2600} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* one thin leader from the chip to the column rail */}
        <path d={`M${x0} ${y0}L${lerp(x0, xr, lead)} ${lerp(y0, COLY + ROWH + 30, lead)}`} stroke={CYA} strokeWidth={2.5} strokeDasharray="3 10" strokeDashoffset={-t * 0.9} strokeLinecap="round" opacity={0.75} />
        <circle cx={x0} cy={y0} r={6} fill={CYA} opacity={lead} />
        <line x1={xr} y1={yTop} x2={xr} y2={lerp(yTop, yBot, clamp01((n - 1 + (rows[n - 1] ?? 0)) / 3))} stroke={CYA} strokeWidth={3} strokeLinecap="round" opacity={0.8 * clamp01(rows[0] * 2)} />
      </svg>
      {ROWS.map((r, i) => (rows[i] <= 0.01 ? null : (
        <div key={r.name} style={{position: 'absolute', left: COLX, top: COLY + i * ROWH, height: 60, display: 'flex', alignItems: 'center', gap: 22, opacity: clamp01(rows[i] * 1.6), transform: `translateX(${(1 - rows[i]) * -26}px)`, fontFamily: FONT, whiteSpace: 'nowrap'}}>
          <Glyph k={i} col={r.col} a={rows[i]} />
          <span style={{fontSize: 44, fontWeight: 700, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)'}}>{r.name}</span>
        </div>
      )))}
      <div style={{position: 'absolute', left: NPILL[0], top: NPILL[1], transformOrigin: '0 50%', transform: `scale(${0.85 + 0.15 * pill})`, opacity: clamp01(pill * 1.5), fontFamily: FONT, whiteSpace: 'nowrap', padding: '10px 26px', borderRadius: 24,
                   background: 'rgba(6,9,15,0.9)', border: `2px solid ${CYA}`, boxShadow: `0 10px 40px rgba(0,0,0,0.7), 0 0 26px ${CYA}55`, display: 'flex', alignItems: 'baseline', gap: 16}}>
        <span style={{fontSize: 42, fontWeight: 800, color: '#fff'}}>N1</span><span style={{fontSize: 28, fontWeight: 500, color: CYA}}>Apple's own wireless chip</span>
      </div>
    </div>
  );
};

// ---- 2026: the real iPhone 18 Pro (cine3d) with the board inside, then the A20 Pro package hero ------------------------------
const CH = PHONE_POINTS.chip, T0 = 276, TGB: V3 = [-0.3, -0.1, 0];
// the camera starts close over the board (matching the 2D board's 3/4 angle), pulls back until the whole phone stands in
// the frame while the back glass closes over the board, holds, then pushes in on the A20 Pro
const NEARV: V3 = [-1.25, -2.9, 4.3], ROLL = 16;
const NW = innardsPoint('wireless');
const PCAM: CamKey[] = [
  {t: T0 + 8, pos: add3(NW, [NEARV[0] * 0.9, NEARV[1] * 0.9, NEARV[2] * 0.9]), tgt: add3(NW, [0.1, -0.1, 0]), fov: 22, roll: ROLL, focus: CH, hold: true},
  {t: 322, pos: orbitPos(15, 7, 27, TGB), tgt: TGB, fov: 22, roll: 24, focus: [0, 0, 0], hold: true},
  {t: 350, pos: orbitPos(11, 6.2, 25.6, TGB), tgt: TGB, fov: 22, roll: 22.5, focus: [0, 0, 0]},
  {t: 378, pos: add3(CH, [NEARV[0] * 0.8, NEARV[1] * 0.8, NEARV[2] * 0.8]), tgt: add3(CH, [0.1, -0.05, 0]), fov: 22, roll: ROLL, focus: CH, hold: true},
];
const UH = 56, OH = originAt(UH, 33.2, 12.7, 1.8, 960, 540), LENS: [number, number] = [1540, 268], LR = 196;
const FCAM: OrbitKey[] = [{t: 380, yaw: 36, pitch: 20, dist: 13.5, fov: 26, tgt: [0, 1.5, 0.2]}, {t: 450, yaw: 26, pitch: 19, dist: 12.6, fov: 26, tgt: [0, 1.5, 0.2]}];
const SWAPPED: Record<string, BoardPartState> = {modem: {mark: mk('C1'), kind: 'mold'}, wireless: {mark: mk('N1'), kind: 'mold'}};
const Stage26: React.FC<StopP & {W: number; H: number}> = ({t, beats, W, H}) => {
  const c = cues(beats);
  if (t < T0) return null;
  const inn = ramp(t, c.tNow - 2, c.tNow + 10), close = eo((t - c.tNow - 14) / (c.tPro - c.tNow - 14)), land = t >= c.tPro ? Math.exp(-(t - c.tPro) / 10) : 0;
  const q = ramp(t, c.tA + 10, c.tA + 28), soc = ramp(t, c.tPro - 2, c.tPro + 10), hl = onWord(t, beats, 'a20') * (1 - ramp(t, c.tA + 40, c.tA + 60));
  const two = ramp(t, c.t2, c.t2 + 12), chip = phoneView({t, cam: PCAM, W, H}).point('chip');
  return (
    <div style={{...full, width: W, height: H}}>
      {/* dark studio behind the phone */}
      <div style={{...full, width: W, height: H, opacity: inn, background: '#03050A'}}>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 62% 74% at 58% 42%, #1B2D52 0%, #0C1528 42%, rgba(3,5,10,0) 78%)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 40% 46% at 18% 6%, rgba(255,236,214,0.1) 0%, rgba(255,236,214,0) 70%)'}} />
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 30% 40% at 58% 44%, rgba(98,224,255,${0.1 * land}) 0%, rgba(98,224,255,0) 70%)`}} />
        {Array.from({length: 26}).map((_, i) => <div key={i} style={{position: 'absolute', left: hsh(i * 3.1) * W, top: ((hsh(i * 7.7) * H - t * (0.2 + 0.5 * hsh(i))) % H + H) % H, width: 3 + 3 * hsh(i * 2.2), height: 3 + 3 * hsh(i * 2.2), borderRadius: 4, background: '#9CC3FF', opacity: 0.1 + 0.25 * hsh(i * 5.5)}} />)}
      </div>
      {q < 0.995 ? (
        <div style={{...full, width: W, height: H, opacity: inn * (1 - ramp(q, 0.25, 0.9))}}>
          <PhoneShot t={t} W={W} H={H} cam={PCAM} shell={xrayShell(1, 1 - close, 3.4)} fx={{dof: {range: 8, blur: 8}}} light={{main: 1.15, rim: 1.5, fill: 1.5}}
            interior={<PhoneInnards sweep={sm((t - c.t18 + 4) / 44)} parts={{...SWAPPED, soc: {glow: 0.55 * soc, highlight: soc * (1 - q)}}} />} />
        </div>
      ) : null}
      {t >= c.tA - 10 && q < 0.5 ? (
        <div style={{...full, width: W, height: H, opacity: eo((t - c.tA + 10) / 10) * (1 - ramp(t, c.tA + 8, c.tA + 16))}}>
          <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
            <path d={`M${chip.x} ${chip.y}L${lerp(chip.x, 1370, eo((t - c.tA + 10) / 10))} ${lerp(chip.y, 356, eo((t - c.tA + 10) / 10))}H${lerp(chip.x, 1420, eo((t - c.tA + 10) / 10))}`} fill="none" stroke="#9CD8FF" strokeWidth={3} />
            <circle cx={chip.x} cy={chip.y} r={9} fill="#62E0FF" /><circle cx={chip.x} cy={chip.y} r={20} fill="none" stroke="#62E0FF" strokeWidth={2.5} opacity={0.6} />
          </svg>
          <div style={{position: 'absolute', left: 1438, top: 318, fontFamily: FONT, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.9)'}}>
            <div style={{fontSize: 58, fontWeight: 800, lineHeight: '64px'}}>A20 Pro</div><div style={{fontSize: 30, fontWeight: 500, color: '#9CD8FF'}}>under the back glass</div>
          </div>
        </div>
      ) : null}
      {q > 0.01 ? (
        <div style={{...full, width: W, height: H, transformOrigin: '960px 540px', transform: `scale(${lerp(0.62, 1, q)})`, opacity: ramp(q, 0.2, 0.8)}}>
          <SiScene id="r6h" width={1920} height={1080} u={UH} tilt={TILT} origin={OH} style={full} sweep={sweepAcross(sm((t - c.tA - 16) / 44), 22, 4, 44, 22)}>
            <SiChassis layer="back" /><LogicBoard layout={LAYOUT} focus="soc" dim={0.3} parts={{...SWAPPED, soc: {glow: 0.35 + 0.3 * hl + 0.25 * two, highlight: Math.max(hl, two * (1 - ramp(t, c.t2 + 20, c.t2 + 34)))}}} /><SiChassis layer="front" />
          </SiScene>
        </div>
      ) : null}
    </div>
  );
};
/** the round lens on one transistor of the A20 Pro: cine3d Transistor3D (lite), gate switches ON on "2 nanometer" */
const FetLens: React.FC<StopP> = ({t, beats}) => {
  const c = cues(beats), k = eo((t - c.tFirst) / 12);
  if (t < c.tFirst) return null;
  const g = fetSwitch(t, [c.t2 + 2], 13), lab = ramp(t, c.tFirst + 6, c.tFirst + 16), R = LR, ax = 1010, ay = 505;
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={ax} y1={ay} x2={lerp(ax, LENS[0] - R * 0.74, k)} y2={lerp(ay, LENS[1] + R * 0.68, k)} stroke="#9CC3FF" strokeWidth={2.5} strokeOpacity={0.85} />
        <circle cx={ax} cy={ay} r={8} fill="#9CC3FF" /><circle cx={ax} cy={ay} r={16 + 6 * Math.sin(t / 5)} fill="none" stroke="#9CC3FF" strokeWidth={2} opacity={0.5} />
      </svg>
      <div style={{position: 'absolute', left: LENS[0] - R, top: LENS[1] - R, width: R * 2, height: R * 2, borderRadius: '50%', overflow: 'hidden', transform: `scale(${0.6 + 0.4 * k})`, opacity: clamp01(k * 2),
                   boxShadow: `0 0 0 3px rgba(156,195,255,0.9), 0 0 0 9px rgba(156,195,255,0.16), 0 30px 80px rgba(0,0,0,0.7), 0 0 ${50 * g}px rgba(98,224,255,${0.5 * clamp01(g)})`, background: 'radial-gradient(circle at 40% 35%, #14233F, #060B16 75%)'}}>
        <Transistor3D t={t} W={R * 2} H={R * 2} cam={FCAM} gate={g} cut={0.52} lite />
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.14), rgba(255,255,255,0) 42%)', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.75)'}} />
      </div>
      <div style={{position: 'absolute', left: LENS[0] - 270, top: LENS[1] + R + 20, width: 540, padding: '10px 0 14px', borderRadius: 16, background: 'rgba(6,10,18,0.86)', border: '1px solid rgba(255,255,255,0.14)', textAlign: 'center',
                   opacity: lab, transform: `translateY(${(1 - lab) * 14}px)`, fontFamily: FONT, boxShadow: '0 16px 50px rgba(0,0,0,0.6)'}}>
        <div style={{fontSize: 46, fontWeight: 800, color: '#fff', letterSpacing: 1, lineHeight: '56px'}}>TSMC 2 nm</div>
        <div style={{fontSize: 26, fontWeight: 500, color: '#9CD8FF', letterSpacing: 0.5}}>nanosheet transistor · illustration</div>
      </div>
    </>
  );
};

const NOBEATS: Beat[] = [];
/** like Bleed, but the art also runs 1600 px past the right of the box (the camera frames the free space right of the board) */
const Wide: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', left: -480, top: -500, width: 4000, height: 2100, WebkitMaskImage: 'linear-gradient(90deg, transparent 0px, #000 220px)', maskImage: 'linear-gradient(90deg, transparent 0px, #000 220px)'}}>
    <div style={{position: 'absolute', left: 480, top: 500, width: 1920, height: 1080}}>{children}</div>
  </div>
);
const Draw: React.FC<WorldDrawProps> = ({t, beats, cam}) => (
  t > wordAt(beats, 'now', 280) + 16 ? null : (
    <div style={{position: 'absolute', left: 0, top: 0}}>
      <RoadBase camX={cam.x} n0={4} n1={5} />
      {/* the Mac of S07's last frame: dropped as soon as it has left the frame (it is a 3D canvas) */}
      {cam.x - X(4) < 960 + 990 / cam.s ? <div style={{...full, left: X(4) - 960}}><Bleed><Stop4 t={772} beats={NOBEATS} /></Bleed></div> : null}
      {Math.abs(X(5) - cam.x) < 2500 ? <div style={{...full, left: X(5) - 960}}><Wide><Stop5 t={t} beats={beats} /></Wide></div> : null}
    </div>
  )
);
const Overlay: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}> = ({t, beats, W, H, toScreen}) => {
  const w = (s: string) => onWord(t, beats, s, 'settle'), L = (i: number) => X(i) - 960, c = cues(beats), out = 1 - ramp(t, c.tNow - 6, c.tNow + 2);
  // the opening push (to zoom 1.13) would slide the 2020 tag off the left edge: it keeps a 40 px margin while the camera
  // pushes in, then stays where the push left it and leaves with the world. Frame 0 is untouched (the seam with S07).
  const o0 = toScreen(0, 0), sc = toScreen(1, 0)[0] - o0[0], tagX = Math.max(L(4) + 90, Math.min((40 - o0[0]) / sc, X(4) - (W / 2 - 40) / 1.13));
  return (
    <>
      <Stage26 t={t} beats={beats} W={W} H={H} />
      <SiLens W={W} H={H} t={t} focus={[0.14, 0.8]} blur={t > c.tNow + 14 && t < c.tA + 20 ? 0 : 5} dust={12} tint="#6FA8FF" seed={12} />
      {t < c.tNow + 4 ? (
        <Locked toScreen={toScreen}>
          <Tag x={tagX} y={60} year="2020" a={1} title="Apple M1" b={1} line="Apple silicon replaces Intel in the Mac" c={1} accent={ACC[4]} />
          <div style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
            <Tag x={L(5) + 90} y={60} year="2025" a={w('went')} title="The chips around it" b={w('around')} accent={ACC[5]} pulse={Math.max(w('2025'), w('year')) * (1 - ramp(t, 260, 280))} />
          </div>
          <div style={{position: 'absolute', left: L(5), top: 0}}><C1Radio t={t} beats={beats} /><N1Radio t={t} beats={beats} /></div>
        </Locked>
      ) : null}
      <Tag x={96} y={64} year="2026" a={eo((t - c.tNow - 6) / 14)} title="iPhone 18 Pro" b={w('18')} line="A20 Pro · Apple's first 2 nm chip" c={w("apple's")} accent={ACC[6]} pulse={t >= c.tPro ? Math.exp(-(t - c.tPro) / 12) : 0} />
      <FetLens t={t} beats={beats} />
    </>
  );
};
export const s08World: WorldDef = {
  id: 'road08', home: 'home',
  anchors: {
    home: {x: X(4), y: 512, zoom: 1.13}, board: {x: X(5), y: 540, zoom: 1},
    modem: {x: X(5) - 960 + MODEM[0] + 230, y: MODEM[1] - 40, zoom: 1.3}, wireless: {x: X(5) - 960 + WIFI[0] + 190, y: WIFI[1] - 10, zoom: 1.3},
    wide: {x: X(5) + 120, y: 560, zoom: 0.9},
  },
  aliases: {apple: 'board', now: 'wide'},
  palette: PAL, Draw, Overlay,
};
