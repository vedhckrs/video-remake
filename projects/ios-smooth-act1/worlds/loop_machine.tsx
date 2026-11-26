// S04 THE RACE + S05 THE CLEVER PART (v2): one machine on one long floor, filmed at the silicon kit's 3/4 angle.
// Five stations along the plan x axis (Event -> Commit -> Render prepare -> Render execute -> Display), a lit rail in
// front of them with one glass cartridge (the frame), the real iPhone 18 Pro (cine3d PhoneShot) at TOUCH and DISPLAY.
// Both scenes own their camera (one eased move per phrase), so S05 starts exactly on S04's last framing.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../../src/kit/types';
import {PhoneShot, type OrbitKey, type PoseKey} from '../../../src/kit/cine3d';
import {PackageStack, SI, SiGlow, SiLens, SiPassives, SiPrism, SiScene, SiText, SiTop, rr, siView, useSi, type Passive} from '../../../src/kit/explainer/silicon';
import {sp} from '../../../src/kit/explainer/tokens';
import {Burst, Ripple, wordAt, type Beat} from '../../../src/kit/explainer/world';
import {COL, FONT, FeedDefs, FeedPic, SvgStamp, clamp01, ease, hash, lerp, outCubic, ramp} from './loop_kit';

// ---- projection (silicon kit view: plan units -> world px) -----------------------------------------------------------
const U = 5.6, T = 0.58, V = siView(U, T);
const AX = V.a, ZP = V.zk, SK = V.b / V.a;
const G = (i: number): [number, number] => V.P(100 * i, 0, 0);
const pt = (i: number, x: number, y: number, z = 0): [number, number] => { const g = G(i), p = V.P(x, y, z); return [g[0] + p[0], g[1] + p[1]]; };
const q = (x: number, y: number, z = 0) => { const p = V.P(x, y, z); return `${p[0].toFixed(1)},${p[1].toFixed(1)}`; };
/** group transform for the face y = const: local px, X along +x, Y down from zTop */
const faceY = (x: number, y: number, zTop: number) => { const p = V.P(x, y, zTop); return `matrix(1 ${SK.toFixed(4)} 0 1 ${p[0].toFixed(2)} ${p[1].toFixed(2)})`; };
const NAMES = ['TOUCH', 'APP', 'RENDER SERVER', 'GPU', 'DISPLAY'], STAGES = ['Event', 'Commit', 'Render prepare', 'Render execute', 'Display'];
const RY = 38;
const LIGHT = {envX: 0, envY: -6, envR: 62};
const decay = (t: number, at: number, d = 8) => (t >= at ? Math.exp(-(t - at) / d) : 0);

// ---- state ----------------------------------------------------------------------------------------------------------
type M = {
  t: number; lit: number; px: number; pOn: number; seen: number[]; power: number[]; flash: number[]; appP: number;
  fd: number; fu: number; ftouch: number;
  s1: number; s2: number; what: number; hand: number; anim: number; lifted: number; busy: number; busyAt: number;
  fence: number; boot: number; proc: number; tree: number; stack: number; fr: number; holo: number;
  gon: number; paint: number; dlit: number; dscroll: number; dial: number; pm: number; slow: number; batt: number; level: number; tick: number; srv: number; nxt: number;
};
const k4 = (beats: Beat[]) => {
  const w = (s: string, d: number) => wordAt(beats, s, d);
  return {race: w('race', 21), finger: w('finger', 58), moves: w('moves', 66), touch: w('touch', 92), goes: w('goes', 101), app: w('app', 114), works: w('works', 153),
    what: w('what', 166), change: w('change', 178), hands: w('hands', 205), sep: w('separate', 248), system: w('system', 258), process: w('process', 268), render: w('render', 286), server: w('server', 295),
    prepares: w('prepares', 311), frame: w('frame', 328), graphics: w('graphics', 354), paints: w('paints', 379), display: w('display', 417), shows: w('shows', 430), next: w('next', 456), tick: w('tick', 464)};
};
type K4 = ReturnType<typeof k4>;
const w2 = (k: K4) => k.works - 5;
const mstate = (t: number, k: K4): M => {
  const leg = (a: number, b: number) => ease(ramp(t, a, b));
  const px = 100 * (leg(k.goes, k.app) + leg(k.hands + 4, k.sep + 6) + leg(k.frame + 4, k.graphics) + leg(k.paints + 24, k.display));
  const at = [k.touch, k.app, k.sep + 6, k.graphics, k.display];
  return {
    t, lit: lerp(-30, 432, ramp(t, k.race - 2, k.race + 24)), px, pOn: sp(t, k.touch, 'pop'), seen: at.map((a) => sp(t, a, 'pop')), power: [0, 1, 2, 3, 4].map((i) => 0.45 + 0.55 * sp(t, 2 + i * 4, 'settle')), flash: [0, 1, 2, 3, 4].map((i) => decay(t, k.race + i * 4, 7)), appP: decay(t, w2(k), 9),
    fd: sp(t, k.finger, 'settle'), fu: ease(ramp(t, k.moves, k.touch)), ftouch: k.touch,
    s1: sp(t, k.works, 'settle'), s2: sp(t, k.change, 'settle'), what: decay(t, k.what, 12), hand: ramp(t, k.hands, k.hands + 10), anim: 0, lifted: 0, busy: 0, busyAt: 1e6,
    fence: sp(t, k.sep, 'settle'), boot: ramp(t, k.system, k.system + 12), proc: sp(t, k.process, 'pop'), tree: ramp(t, k.render, k.render + 12), stack: sp(t, k.prepares, 'settle'), fr: sp(t, k.frame, 'settle'), holo: 0,
    gon: sp(t, k.graphics, 'settle'), paint: ramp(t, k.paints, k.paints + 24), dlit: ease(ramp(t, k.display, k.shows + 4)), dscroll: 30,
    dial: 0.28 + 0.72 * sp(t, k.display, 'bouncy'), pm: 0, slow: -1, batt: 0, level: 0, tick: k.tick, srv: decay(t, k.server, 10), nxt: decay(t, k.next, 9),
  };
};
const FINAL = mstate(9999, k4([]));

// ---- shared defs (one copy; every svg of the machine refers to these ids) ------------------------------------------------
const Defs: React.FC = React.memo(() => (
  <defs>
    <FeedDefs g="mc" />
    <linearGradient id="mc-floor" gradientUnits="userSpaceOnUse" x1={0} y1={-260} x2={0} y2={300}><stop offset="0" stopColor="#04060C" /><stop offset="0.4" stopColor="#0D131F" /><stop offset="0.66" stopColor="#101826" /><stop offset="1" stopColor="#05080F" /></linearGradient>
    <radialGradient id="mc-pool"><stop offset="0" stopColor="#7FA8FF" stopOpacity={0.42} /><stop offset="0.5" stopColor="#4C7DE0" stopOpacity={0.14} /><stop offset="1" stopColor="#4C7DE0" stopOpacity={0} /></radialGradient>
    <linearGradient id="mc-metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#AEB6C4" /><stop offset="0.35" stopColor="#4A5160" /><stop offset="0.75" stopColor="#1E232D" /><stop offset="1" stopColor="#6B7382" /></linearGradient>
    <linearGradient id="mc-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#BFE0FF" stopOpacity={0.42} /><stop offset="0.45" stopColor="#6FA8FF" stopOpacity={0.12} /><stop offset="1" stopColor="#BFE0FF" stopOpacity={0.3} /></linearGradient>
    <linearGradient id="mc-win" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stopColor="#22304F" stopOpacity={0.97} /><stop offset="0.5" stopColor="#0F172B" stopOpacity={0.97} /><stop offset="1" stopColor="#070B16" stopOpacity={0.97} /></linearGradient>
    <linearGradient id="mc-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} /><stop offset="0.3" stopColor="#9CC3FF" stopOpacity={0.5} /><stop offset="0.7" stopColor="#6FA8FF" stopOpacity={0.2} /><stop offset="1" stopColor="#DCEBFF" stopOpacity={0.7} /></linearGradient>
    <linearGradient id="mc-towerF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#59616F" /><stop offset="0.16" stopColor="#2B313C" /><stop offset="0.6" stopColor="#171B23" /><stop offset="1" stopColor="#0C0F15" /></linearGradient>
    <linearGradient id="mc-towerS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1B2740" /><stop offset="0.25" stopColor="#0B0E15" /><stop offset="1" stopColor="#06080C" /></linearGradient>
    <linearGradient id="mc-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFF" stopOpacity={0} /><stop offset="0.5" stopColor="#FFF" stopOpacity={0.5} /><stop offset="1" stopColor="#FFF" stopOpacity={0} /></linearGradient>
    <linearGradient id="mc-beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={COL.cyan} stopOpacity={0.5} /><stop offset="1" stopColor={COL.cyan} stopOpacity={0.04} /></linearGradient>
    <linearGradient id="mc-trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={COL.cyan} stopOpacity={0} /><stop offset="1" stopColor="#FFFFFF" stopOpacity={0.95} /></linearGradient>
    <radialGradient id="mc-gc"><stop offset="0" stopColor={COL.cyan} stopOpacity={0.7} /><stop offset="1" stopColor={COL.cyan} stopOpacity={0} /></radialGradient>
    <radialGradient id="mc-ga"><stop offset="0" stopColor={COL.amber} stopOpacity={0.8} /><stop offset="1" stopColor={COL.amber} stopOpacity={0} /></radialGradient>
    <radialGradient id="mc-gg"><stop offset="0" stopColor={COL.green} stopOpacity={0.7} /><stop offset="1" stopColor={COL.green} stopOpacity={0} /></radialGradient>
    <radialGradient id="mc-gw"><stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} /><stop offset="0.25" stopColor={COL.cyan} stopOpacity={0.55} /><stop offset="1" stopColor={COL.cyan} stopOpacity={0} /></radialGradient>
    <pattern id="mc-ito" patternUnits="userSpaceOnUse" width={22} height={22}><rect width={22} height={22} fill="#081417" /><path d="M11 1L21 11L11 21L1 11Z" fill="#0F2A33" stroke="#2FA7B8" strokeWidth={1} /><path d="M0 0L3 0L0 3ZM22 0L19 0L22 3ZM0 22L3 22L0 19ZM22 22L19 22L22 19Z" fill="#B8793C" /></pattern>
    <pattern id="mc-ito2" patternUnits="userSpaceOnUse" width={40} height={40}><path d="M20 2L38 20L20 38L2 20Z" fill="#62E0FF" fillOpacity={0.08} stroke="#62E0FF" strokeOpacity={0.75} strokeWidth={1.4} /><circle cx={0} cy={0} r={3} fill="#FFB347" /><circle cx={40} cy={0} r={3} fill="#FFB347" /><circle cx={0} cy={40} r={3} fill="#FFB347" /><circle cx={40} cy={40} r={3} fill="#FFB347" /></pattern>
    <pattern id="mc-wire" patternUnits="userSpaceOnUse" width={9} height={9}><rect width={9} height={9} fill="#0B1224" /><path d="M0 0H9M0 0V9" stroke="#3B8CFF" strokeOpacity={0.5} strokeWidth={0.9} /></pattern>
    <pattern id="mc-haz" patternUnits="userSpaceOnUse" width={12} height={12} patternTransform="rotate(45)"><rect width={12} height={12} fill="#2A2108" /><rect width={6} height={12} fill="#FFB347" /></pattern>
    <pattern id="mc-hazu" patternUnits="userSpaceOnUse" width={3} height={3} patternTransform="rotate(45)"><rect width={3} height={3} fill="#1E1806" /><rect width={1.5} height={3} fill="#D9952F" /></pattern>
    <pattern id="mc-perf" patternUnits="userSpaceOnUse" width={2.4} height={2.4}><circle cx={1.2} cy={1.2} r={0.55} fill="#000" /><circle cx={1.3} cy={1.35} r={0.55} fill="none" stroke="#8FB4FF" strokeOpacity={0.18} strokeWidth={0.12} /></pattern>
    <pattern id="mc-brushv" patternUnits="userSpaceOnUse" width={7} height={120}><rect x={1} width={0.6} height={120} fill="#FFF" opacity={0.05} /><rect x={4.2} width={0.5} height={120} fill="#000" opacity={0.16} /><rect x={5.6} width={0.4} height={120} fill="#FFF" opacity={0.035} /></pattern>
  </defs>
));

// ---- small parts (inside a SiScene) -------------------------------------------------------------------------------------
const Slab: React.FC<{x: number; y: number; w: number; d: number; z?: number; h: number; color: string; top?: string; r?: number; env?: number; shadow?: number; edge?: number; rim?: number}> = ({x, y, w, d, z = 0, h, color, top, r = 0.6, env = 0.4, shadow = 0, edge = 0.3, rim = 0.3}) => {
  const {id} = useSi();
  return (
    <g>
      {shadow > 0 ? <SiTop z={z}><path d={rr(x + 0.8, y + 1.2, w + 2.4, d + 1.6, r + 1)} fill="#000" opacity={shadow} filter={`url(#${id}-soft3)`} /></SiTop> : null}
      <SiPrism x={x} y={y} w={w} d={d} z={z} h={h} color={color} edge={edge} />
      <SiTop z={z + h}>
        <path d={rr(x, y, w, d, r)} fill={top ?? color} />
        <path d={rr(x, y, w, d, r)} fill={`url(#${id}-brush)`} opacity={0.8} />
        <path d={rr(x, y, w, d, r)} fill={`url(#${id}-env)`} opacity={env} />
        <path d={rr(x + 0.2, y + 0.2, w - 0.4, d - 0.4, r)} fill="none" stroke="#DCE8FF" strokeOpacity={rim} strokeWidth={0.3} />
      </SiTop>
    </g>
  );
};

const Plinth: React.FC<{x0?: number; x1?: number}> = React.memo(({x0 = -34, x1 = 34}) => {
  const y0 = -30, w = x1 - x0, d = 60;
  return (
    <g>
      <Slab x={x0 - 1.5} y={y0 - 1.5} w={w + 3} d={d + 3} h={1.3} color="#59616F" top="#434A57" r={1.6} shadow={0.75} env={0.5} />
      <Slab x={x0} y={y0} w={w} d={d} z={1.3} h={3.7} color="#1A1F29" top="#1E242F" r={1.2} env={0.55} edge={0.45} rim={0.4} />
      <SiTop z={5}>
        <path d={rr(x0 + 2.2, y0 + 2.2, w - 4.4, d - 4.4, 0.8)} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={0.45} />
        <path d={rr(x0 + 2.5, y0 + 2.5, w - 5, d - 5, 0.8)} fill="none" stroke="#9FB8E8" strokeOpacity={0.16} strokeWidth={0.2} />
        {[[x0 + 1.2, y0 + 1.2], [x1 - 1.2, y0 + 1.2], [x0 + 1.2, y0 + d - 1.2], [x1 - 1.2, y0 + d - 1.2]].map(([a, b], i) => <g key={i}><circle cx={a} cy={b} r={0.55} fill="#07090D" /><circle cx={a - 0.1} cy={b - 0.12} r={0.3} fill="#9AA5B8" /></g>)}
      </SiTop>
    </g>
  );
});

/** light pool on the floor, the lit edge of the plinth, the floor inlay sign */
const StationLight: React.FC<{i: number; seen: number; power: number; flash?: number; x0?: number; x1?: number}> = ({i, seen: seen0, power, flash = 0, x0 = -34, x1 = 34}) => {
  const seen = Math.max(seen0, flash), lit = seen > 0.5, col = lit ? COL.cyan : '#5E79B0', w = Math.max(78, STAGES[i].length * 5.5 + 12);
  return (
    <g>
      <SiTop z={0}>
        <ellipse cx={2} cy={6} rx={74} ry={60} fill="url(#mc-pool)" opacity={power} />
        <path d={rr(-w / 2 - 0.6, 41.4, w + 1.2, 21.2, 2.4)} fill="#000" opacity={0.7} />
        <path d={rr(-w / 2, 42, w, 20, 2)} fill="#0B0F17" stroke="#56627A" strokeWidth={0.3} />
        <path d={rr(-w / 2 + 1, 43, w - 2, 18, 1.4)} fill={lit ? '#0A2230' : '#080B11'} stroke={col} strokeOpacity={0.25 + 0.6 * seen} strokeWidth={0.25} />
        {seen > 0.02 ? <ellipse cx={0} cy={52} rx={w * 0.6} ry={18} fill="url(#mc-gc)" opacity={0.45 * seen} /> : null}
        <SiText x={0} y={48.2} size={4.2} font={FONT} weight={700} spacing={16} fill={lit ? '#9FE6FF' : '#7286AC'}>{NAMES[i]}</SiText>
        <SiText x={0} y={58.4} size={8.4} font={FONT} weight={700} spacing={1} fill={lit ? '#FFFFFF' : '#93A2C4'}>{STAGES[i]}</SiText>
        <path d={`M${-w / 2 + 4} 50.4H${w / 2 - 4}`} stroke={col} strokeOpacity={0.5} strokeWidth={0.22} />
      </SiTop>
      <g transform={faceY(x0 + 3, 30.05, 3.9)}>
        <rect x={-4} y={-5} width={(x1 - x0 - 6) * AX + 8} height={16} fill={lit ? COL.cyan : '#6F8FD0'} opacity={0.05 + 0.2 * seen} />
        <rect width={(x1 - x0 - 6) * AX} height={3.4} rx={1.7} fill={lit ? '#DFF8FF' : '#42557E'} opacity={0.55 + 0.45 * seen} />
      </g>
      <SiGlow x={0} y={36} r={30} color={COL.cyan} strength={0.5 * seen} />
    </g>
  );
};

/** upright glass panel in the plane y: frame, thickness, content drawn by children in local px (w x h) */
const Glass: React.FC<{x: number; y: number; z0: number; z1: number; w: number; stroke?: string; glow?: number; fill?: string; children?: React.ReactNode}> = ({x, y, z0, z1, w, stroke = '#CFE0FF', glow = 0.6, fill = 'url(#mc-win)', children}) => {
  const pw = w * AX, ph = (z1 - z0) * ZP, s = V.P(0, -1.4, 0);
  return (
    <g>
      <g transform={faceY(x, y, z1)}>
        <rect x={s[0]} y={s[1]} width={pw} height={ph} rx={9} fill="#05080F" stroke="#7FA2E0" strokeOpacity={0.35} />
        <rect width={pw} height={ph} rx={9} fill={fill} />
        {children}
        <path d={`M9 1H${pw * 0.46}L${pw * 0.22} ${ph - 1}H1V9Q1 1 9 1Z`} fill="#FFFFFF" opacity={0.045} />
        <rect width={pw} height={ph} rx={9} fill="none" stroke={stroke} strokeOpacity={glow} strokeWidth={2} />
        <rect x={1.5} y={1.5} width={pw - 3} height={ph - 3} rx={8} fill="none" stroke="url(#mc-edge)" strokeWidth={1.2} opacity={0.6} />
      </g>
    </g>
  );
};
const Post: React.FC<{x: number; y: number; z0: number; z1: number; s?: number}> = ({x, y, z0, z1, s = 1.6}) => (
  <g><SiPrism x={x - s / 2} y={y - s / 2} w={s} d={s} z={z0} h={z1 - z0} color="#8D96A6" edge={0.5} /><SiTop z={z1}><rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill="#C9D1DE" /></SiTop></g>
);
const Tag: React.FC<{x: number; y: number; z: number; text: string; size?: number; color?: string; fill?: string; italic?: boolean; opacity?: number; scale?: number}> = ({x, y, z, text, size = 18, color = '#EAF1FF', fill = '#0A0F1C', italic = false, opacity = 1, scale = 1}) => {
  const w = text.length * size * 0.66 + size * 1.2, h = size * 1.7;
  return (
    <g transform={faceY(x, y, z)} opacity={opacity}>
      <g transform={`translate(${w / 2} ${h / 2}) scale(${scale}) translate(${-w / 2} ${-h / 2})`}>
        <rect x={3} y={-3} width={w} height={h} rx={h * 0.26} fill="#000" opacity={0.6} />
        <rect width={w} height={h} rx={h * 0.26} fill={fill} stroke={color} strokeOpacity={0.75} strokeWidth={1.4} />
        <text x={w / 2} y={h / 2 + size * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={italic ? 500 : 700} fontStyle={italic ? 'italic' : 'normal'} fontSize={size} letterSpacing={italic ? 0 : size * 0.05} fill={color}>{text}</text>
      </g>
    </g>
  );
};

// ---- floor, far racks, near silhouettes ---------------------------------------------------------------------------------
const Floor: React.FC = React.memo(() => {
  const {id} = useSi();
  let seams = '';
  for (let x = -700; x <= 1300; x += 50) seams += `M${x} -700V700`;
  for (let y = -700; y <= 700; y += 50) seams += `M-700 ${y}H1300`;
  let bolts = '';
  for (let x = -60; x <= 460; x += 20) bolts += `M${x - 0.5} -41.5h1v1h-1ZM${x - 0.5} 70.5h1v1h-1Z`;
  return (
    <g>
      <SiTop z={0}>
        <rect x={-700} y={-700} width={2000} height={1400} fill="url(#mc-floor)" />
        <path d={seams} stroke="#000" strokeOpacity={0.6} strokeWidth={0.55} fill="none" />
        <path d={seams} stroke="#8FB4FF" strokeOpacity={0.07} strokeWidth={0.22} fill="none" transform="translate(0.45 0.45)" />
        {/* cable trench behind the machine */}
        <rect x={-120} y={-66} width={700} height={12} fill="#020306" /><rect x={-120} y={-66} width={700} height={0.5} fill="#8FB4FF" opacity={0.3} />
        {['#2E6BD6', '#C98A2B', '#3A4252', '#1FA37A'].map((c, i) => <path key={i} d={`M-120 ${-63.5 + i * 2.4}H580`} stroke={c} strokeOpacity={0.55} strokeWidth={1.3} />)}
        {Array.from({length: 18}).map((_, i) => <rect key={i} x={-110 + i * 38} y={-66.5} width={2.2} height={13} fill="#39414F" />)}
      </SiTop>
      {[84, 90.5].map((y, i) => <g key={y}><Slab x={-260} y={y} w={900} d={4.6} h={3.2} color="#2B3340" top="#39424F" r={2} shadow={0.6} env={0.5} /><SiTop z={3.25}><rect x={-260} y={y + 1.9} width={900} height={0.7} fill={i ? COL.amber : COL.cyan} opacity={0.75} /></SiTop></g>)}
      {Array.from({length: 16}).map((_, i) => <Slab key={i} x={-250 + i * 56} y={82.5} w={5} d={14} h={4} color="#59616F" top="#727B8B" r={0.8} />)}
      {[[-118, -24, 30, 40, 46], [-112, 26, 22, 20, 18], [486, -34, 34, 30, 54], [500, 12, 24, 22, 20]].map(([x, y, w, d, h], i) => (
        <g key={i}><Slab x={x} y={y} w={w} d={d} h={h} color="#1C2330" top="#2A3342" r={1.2} shadow={0.7} edge={0.6} />
          <g transform={faceY(x, y + d + 0.02, h)}>{Array.from({length: Math.floor((h * ZP - 14) / 20)}).map((__, j) => <g key={j}><rect x={10} y={10 + j * 20} width={w * AX - 20} height={13} rx={2} fill="#0A0F1A" stroke="#8FB4FF" strokeOpacity={0.25} /><circle cx={19} cy={16.5 + j * 20} r={2.6} fill={(i + j) % 3 ? '#3FE08A' : '#FFB347'} /><rect x={28} y={14.5 + j * 20} width={w * AX * (0.3 + 0.3 * hash(i * 7 + j))} height={4} rx={2} fill="#3B8CFF" opacity={0.6} /></g>)}</g></g>
      ))}
      {/* the deck: one long anodised bed under all five stations */}
      <Slab x={-72} y={-46} w={546} d={122} h={1.1} color="#2B313C" top="#0E131C" r={5} env={0.0} shadow={0.6} edge={0.5} rim={0.3} />
      <SiTop z={1.1}>
        <path d={rr(-72, -46, 546, 122, 5)} fill={`url(#${id}-env)`} opacity={0.12} />
        <rect x={-66} y={-43.5} width={534} height={3.6} fill="url(#mc-perf)" /><rect x={-66} y={69} width={534} height={3.6} fill="url(#mc-perf)" />
        <path d={bolts} fill="#7C8799" opacity={0.7} />
        {[50, 150, 250, 350].map((x) => <g key={x} opacity={0.5}>{[0, 1, 2].map((j) => <path key={j} d={`M${x - 5 + j * 4} 6l3 3l-3 3`} fill="none" stroke="#8FB4FF" strokeOpacity={0.5 - j * 0.12} strokeWidth={0.7} />)}</g>)}
      </SiTop>
    </g>
  );
});
const Racks: React.FC = React.memo(() => (
  <g>
    {Array.from({length: 12}).map((_, k) => {
      const x = -190 + k * 62, y = -90 - (k % 3) * 8, h = 60 + 34 * hash(k * 3.1), w = 42, d = 24;
      return (
        <g key={k}>
          <SiTop z={0}><rect x={x + 2} y={y + 2} width={w + 6} height={d + 4} fill="#000" opacity={0.6} /></SiTop>
          <SiPrism x={x} y={y} w={w} d={d} z={0} h={h} color="#232E44" edge={0.7} />
          <SiTop z={h}><rect x={x} y={y} width={w} height={d} fill="#222C40" /></SiTop>
          <g transform={faceY(x, y + d, h)}>
            {Array.from({length: Math.floor((h * ZP - 16) / 22)}).map((__, j) => (
              <g key={j}><rect x={10} y={10 + j * 22} width={w * AX - 20} height={15} rx={2} fill="#0A0F1A" stroke="#8FB4FF" strokeOpacity={0.2} />
                <circle cx={20} cy={17.5 + j * 22} r={2.6} fill={hash(k * 11 + j) > 0.72 ? '#FFB347' : '#3FE08A'} /><rect x={30} y={15.5 + j * 22} width={40 + 90 * hash(k * 5 + j * 3)} height={4} rx={2} fill="#3B8CFF" opacity={0.55} /></g>
            ))}
          </g>
        </g>
      );
    })}
  </g>
));
const Near: React.FC = React.memo(() => (
  <g>
    {[[-90, 118, 46, 22], [30, 132, 60, 26], [150, 122, 40, 30], [262, 136, 64, 22], [390, 124, 44, 26]].map(([x, y, w, h], k) => (
      <g key={k}>
        <SiPrism x={x} y={y} w={w} d={24} z={0} h={h} color="#0E1320" edge={0.7} />
        <SiTop z={h}><rect x={x} y={y} width={w} height={24} fill="#182033" /><circle cx={x + 6} cy={y + 6} r={1.6} fill={k % 2 ? COL.amber : COL.cyan} /></SiTop>
      </g>
    ))}
  </g>
));

// ---- rail + cartridge -----------------------------------------------------------------------------------------------
const RailBase: React.FC = React.memo(() => (
  <g>
    <SiTop z={1.1}><rect x={-34} y={RY - 2.2} width={470} height={7} fill="#000" opacity={0.55} /></SiTop>
    {Array.from({length: 38}).map((_, i) => <SiPrism key={i} x={-30 + i * 12.5 - 1.4} y={RY - 3} w={2.8} d={6} z={1.1} h={0.9} color="#59616F" edge={0.4} ao={false} />)}
    <SiPrism x={-32} y={RY - 1.7} w={466} d={3.4} z={2} h={1.5} color="#3C4452" edge={0.6} />
    <SiTop z={3.5}>
      <rect x={-32} y={RY - 1.7} width={466} height={3.4} fill="#2A303B" /><rect x={-32} y={RY - 1.7} width={466} height={0.35} fill="#C9D6EE" opacity={0.55} />
      <rect x={-31} y={RY - 0.55} width={464} height={1.1} fill="#04060A" />
    </SiTop>
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i}>
        <SiTop z={1.1}><rect x={100 * i - 2} y={30} width={4} height={RY - 33} fill="#05070B" stroke="#56627A" strokeWidth={0.25} /></SiTop>
        <Slab x={100 * i - 8} y={RY - 4.2} w={16} d={8.4} z={1.1} h={2.9} color="#262C38" top="#2F3644" r={1.2} shadow={0.5} />
      </g>
    ))}
  </g>
));
const Rail: React.FC<{m: M}> = ({m}) => {
  const x = m.px;
  return (
    <g>
      <RailBase />
      <SiTop z={3.55}>
        <rect x={-31} y={RY - 2.6} width={m.lit + 31} height={5.2} fill={COL.cyan} opacity={0.1} />
        <rect x={-31} y={RY - 0.5} width={m.lit + 31} height={1} fill={COL.cyan} opacity={0.85} />
        {m.lit < 431 && m.lit > -29 ? <ellipse cx={m.lit} cy={RY} rx={9} ry={3.4} fill="url(#mc-gw)" /> : null}
      </SiTop>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <SiTop z={1.15}><rect x={100 * i - 1.2} y={30.4} width={2.4} height={RY - 34} fill={COL.cyan} opacity={0.12 + 0.8 * m.seen[i]} /></SiTop>
          <SiTop z={4.05}>
            <path d={rr(100 * i - 6.4, RY - 3, 12.8, 6, 1)} fill="none" stroke={COL.cyan} strokeOpacity={0.3 + 0.7 * m.seen[i]} strokeWidth={0.4} />
            <ellipse cx={100 * i} cy={RY} rx={15} ry={9} fill="url(#mc-gc)" opacity={0.75 * m.seen[i]} />
          </SiTop>
        </g>
      ))}
      {m.pOn > 0.01 ? (
        <g opacity={m.pOn}>
          <SiTop z={3.6}><rect x={x - 46} y={RY - 0.9} width={46} height={1.8} fill="url(#mc-trail)" /><ellipse cx={x} cy={RY} rx={24} ry={12} fill="url(#mc-gw)" opacity={0.8} /></SiTop>
          <SiPrism x={x - 6.5} y={RY - 3.4} w={13} d={6.8} z={4.3} h={5.4} color="#BFEFFF" front="#D8F5FF" side="#6FCBEA" edge={0.9} ao={false} />
          <g transform={faceY(x - 6.5, RY + 3.42, 9.7)}><rect x={5} y={2.6} width={13 * AX - 10} height={5.4 * ZP - 5.2} rx={2} fill="url(#mc-f1)" /><path d={`M5 ${5.4 * ZP - 2.6}l16 -8l10 5l8 -4l${13 * AX - 44} 7z`} fill="#FFF" opacity={0.5} /></g>
          <SiTop z={9.7}><path d={rr(x - 6.5, RY - 3.4, 13, 6.8, 0.8)} fill="#F4FCFF" /><path d={rr(x - 5.2, RY - 2.3, 10.4, 4.6, 0.5)} fill="url(#mc-f1)" opacity={0.9} /></SiTop>
          <SiGlow x={x} y={RY} z={7} r={26} color={COL.cyan} strength={0.9} />
        </g>
      ) : null}
    </g>
  );
};

// ---- station 0: TOUCH -----------------------------------------------------------------------------------------------
const TouchStatic: React.FC = React.memo(() => (
  <g>
    <Plinth />
    <Post x={-31} y={-27} z0={5} z1={52} /><Post x={31} y={-27} z0={5} z1={52} />
    <Slab x={-19} y={-23} w={38} d={50} z={5} h={0.9} color="#0B0E14" top="#10141C" r={3} env={0.3} shadow={0.5} />
  </g>
));
const touchXY = (m: M): [number, number] => [205 + 20 * Math.sin(m.fu * Math.PI), lerp(650, 290, m.fu)];
const Touch: React.FC<{m: M}> = ({m}) => {
  const [tx, ty] = touchXY(m), on = m.fd, pw = 58 * AX, ph = 40 * ZP;
  const hx = 14 + (pw - 28) * (1 - ty / 874), hy = 30 + (ph - 40) * (tx / 402);
  return (
    <g>
      <TouchStatic />
      <Glass x={-29} y={-27} z0={11} z1={51} w={58} stroke={on > 0.5 ? COL.amber : '#CFE0FF'}>
        <clipPath id="mc0-cp"><rect x={8} y={30} width={pw - 16} height={ph - 38} rx={5} /></clipPath>
        <text x={12} y={22} fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={1.4} fill="#EAF1FF">CAPACITIVE SENSOR</text>
        <circle cx={pw - 18} cy={16} r={5} fill={on > 0.5 ? COL.amber : '#2D3443'} />
        <g clipPath="url(#mc0-cp)">
          <rect x={8} y={30} width={pw - 16} height={ph - 38} fill="url(#mc-ito)" />
          <rect x={hx - 11} y={30} width={22} height={ph} fill={COL.amber} opacity={0.4 * on} /><rect x={8} y={hy - 11} width={pw} height={22} fill={COL.amber} opacity={0.4 * on} />
          <circle cx={hx} cy={hy} r={50} fill="url(#mc-ga)" opacity={on} /><rect x={hx - 11} y={hy - 11} width={22} height={22} fill="#FFE8B8" opacity={on} />
        </g>
      </Glass>
      <SiGlow x={0} y={2} z={6} r={34} color={COL.amber} strength={0.5 * on} />
    </g>
  );
};
const TouchScreen: React.FC<{m: M}> = ({m}) => {
  const [tx, ty] = touchXY(m), on = m.fd;
  return (
    <svg width={402} height={874} viewBox="0 0 402 874" style={{position: 'absolute', left: 0, top: 0}}>
      <FeedPic id="mcts" g="mc" x={0} y={0} w={402} h={874} scroll={30 + (360 / 2.01) * m.fu} tall />
      <rect width={402} height={874} fill="#02050B" opacity={0.3 + 0.25 * on} />
      <rect width={402} height={874} fill="url(#mc-ito2)" opacity={0.25 + 0.5 * on} />
      <rect x={tx - 20} y={0} width={40} height={874} fill={COL.amber} opacity={0.35 * on} /><rect x={0} y={ty - 20} width={402} height={40} fill={COL.amber} opacity={0.35 * on} />
      <circle cx={tx} cy={ty} r={150} fill="url(#mc-ga)" opacity={on} />
      {[0, 1, 2].map((r) => { const f = ((m.t - m.ftouch) / 16 + r / 3 + 10) % 1; return on > 0.5 ? <circle key={r} cx={tx} cy={ty} r={40 + 190 * f} fill="none" stroke="#FFE2A8" strokeWidth={9 * (1 - f)} opacity={1 - f} /> : null; })}
      <circle cx={tx} cy={ty} r={44 * on} fill="#FFF6E0" opacity={0.92} /><circle cx={tx} cy={ty} r={62 * on} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.8} />
    </svg>
  );
};

// ---- station 1: APP ---------------------------------------------------------------------------------------------------
const BOXES: [number, number, number, number][][] = [
  [[12, 10, 265, 62], [12, 82, 127, 44], [150, 82, 127, 44], [12, 136, 265, 10], [12, 154, 110, 20]],
  [[12, 10, 265, 44], [12, 64, 265, 30], [12, 104, 127, 62], [150, 104, 127, 10], [150, 124, 100, 22]],
  [[12, 10, 127, 90], [150, 10, 127, 40], [150, 60, 127, 40], [12, 112, 265, 10], [12, 132, 265, 34]],
];
const WIN = {x: -28, w: 56, z0: 15, z1: 79};
const AppStatic: React.FC = React.memo(() => (
  <g>
    <Plinth />
    <Slab x={-14} y={-9} w={28} d={18} z={5} h={2} color="#727B8B" top="#59616F" r={3} shadow={0.6} env={0.7} />
    <Slab x={-2.2} y={-2.2} w={4.4} d={3} z={7} h={8.6} color="#9AA3B2" top="#C9D1DE" r={0.4} env={0.6} />
    <SiPrism x={WIN.x} y={-1.6} w={WIN.w} d={3} z={WIN.z0} h={WIN.z1 - WIN.z0} color="#3A5488" side="#9CC3FF" edge={0.9} ao={false} />
    <SiTop z={WIN.z1}><rect x={WIN.x} y={-1.6} width={WIN.w} height={3} fill="#CFE4FF" opacity={0.85} /></SiTop>
  </g>
));
const AppWin: React.FC<{m: M}> = ({m}) => {
  const t = m.t, on = m.seen[1], pw = WIN.w * AX, ph = (WIN.z1 - WIN.z0) * ZP;
  const box = BOXES[0].map((b, i) => b.map((v, j) => lerp(lerp(v, BOXES[1][i][j], m.s1), BOXES[2][i][j], m.s2)));
  const fills = ['url(#mc-f1)', '#22305A', '#22305A', '#C9D3EE', COL.blue];
  const ph2 = (((t - 64) / 44) % 1 + 1) % 1, o = m.busy > 0.5 ? 0 : ease(ph2 < 0.5 ? ph2 * 2.4 : (1 - ph2) * 2.4);
  const jam = Math.floor(t / 7) * 47 + (t % 7 < 1 ? (t % 7) * 47 : 47), amber = m.busy > 0.3;
  return (
    <g>
      <AppStatic />
      <SiGlow x={0} y={10} z={5.1} r={36} color={amber ? COL.amber : COL.blue} strength={0.35 + 0.35 * on} />
      <g transform={faceY(WIN.x, 1.42, WIN.z1)}>
        <rect width={pw} height={ph} rx={10} fill="url(#mc-win)" />
        <rect width={pw} height={24} rx={10} fill="#2A3558" /><rect y={14} width={pw} height={10} fill="#2A3558" />{['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => <circle key={i} cx={16 + i * 15} cy={12} r={4.6} fill={c} />)}
        <rect x={pw / 2 - 50} y={7} width={100} height={10} rx={5} fill="#141C33" />
        <g transform="translate(0 24)" opacity={0.4 + 0.6 * Math.max(on, m.anim)}>
          {m.anim < 0.5 ? box.map((b, i) => (
            <g key={i}>
              <rect x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx={7} fill={fills[i]} />
              {i === 0 ? <><circle cx={b[0] + b[2] - 26} cy={b[1] + 20} r={11} fill="#FFF" opacity={0.75} /><path d={`M${b[0]} ${b[1] + b[3]}l${b[2] * 0.3} ${-b[3] * 0.55}l${b[2] * 0.2} ${b[3] * 0.3}l${b[2] * 0.14} ${-b[3] * 0.2}l${b[2] * 0.36} ${b[3] * 0.45}z`} fill="#FFF" opacity={0.25} /></> : null}
              {i === 1 || i === 2 ? <path d={`M${b[0] + 10} ${b[1] + 14}h${b[2] * 0.6}M${b[0] + 10} ${b[1] + 27}h${b[2] * 0.4}`} stroke="#8FA0C2" strokeWidth={5} strokeLinecap="round" /> : null}
              {m.what > 0.03 && i < 3 ? <rect x={b[0] - 4} y={b[1] - 4} width={b[2] + 8} height={b[3] + 8} rx={10} fill="none" stroke={COL.amber} strokeWidth={2.5} strokeDasharray="7 5" opacity={m.what} /> : null}
            </g>
          )) : (
            <g>
              {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={12 + (i % 3) * 91.5} y={10 + Math.floor(i / 3) * 58} width={82} height={50} rx={7} fill={i === 0 ? '#1A2440' : `url(#mc-f${i})`} opacity={i === 0 ? 1 : 0.85 - 0.35 * m.busy} />)}
              {[0, 1, 2].map((i) => <rect key={`b${i}`} x={12} y={132 + i * 14} width={265 - i * 50} height={7} rx={3.5} fill="#C9D3EE" opacity={0.7} />)}
              {m.lifted < 0.5 ? <rect x={12} y={10} width={lerp(82, 265, o)} height={lerp(50, 160, o)} rx={9} fill="url(#mc-f0)" stroke="#FFFFFF" strokeWidth={2} /> : <rect x={12} y={10} width={82} height={50} rx={7} fill="none" stroke={COL.cyan} strokeWidth={2} strokeDasharray="6 5" />}
            </g>
          )}
          {m.hand > 0 && m.hand < 1 ? <rect x={0} y={(ph - 24) * m.hand - 5} width={pw} height={7} fill="#FFFFFF" opacity={0.85} /> : null}
        </g>
        {m.busy > 0.01 ? (
          <g opacity={m.busy}>
            <rect width={pw} height={ph} rx={10} fill={COL.amber} opacity={0.2} />
            <rect x={12} y={ph - 22} width={pw - 24} height={11} rx={3} fill="url(#mc-haz)" />
            <circle cx={pw * 0.32} cy={ph * 0.56} r={27} fill="#0A0F1C" stroke="#4A3A18" strokeWidth={8} /><path d="M0 -27A27 27 0 0 1 27 0" transform={`translate(${pw * 0.32} ${ph * 0.56}) rotate(${jam})`} fill="none" stroke={COL.amber} strokeWidth={8} strokeLinecap="round" />
            <g transform={`translate(${pw * 0.68} ${ph * 0.57}) rotate(${Math.sin(t * 2.6) * 5})`}>
              {Array.from({length: 8}).map((_, i) => <rect key={i} x={-7} y={-38} width={14} height={18} rx={3} fill="#C9A24A" transform={`rotate(${i * 45})`} />)}
              <circle r={26} fill="#C9A24A" stroke="#7A5E1E" strokeWidth={3} /><circle r={9} fill="#0A0F1C" />
            </g>
          </g>
        ) : null}
        <path d={`M10 1H${pw * 0.46}L${pw * 0.2} ${ph - 1}H1V10Q1 1 10 1Z`} fill="#FFFFFF" opacity={0.05} />
        <rect width={pw} height={ph} rx={10} fill="none" stroke={amber ? COL.amber : '#CFE0FF'} strokeOpacity={0.5 + 0.4 * on} strokeWidth={2.2 + 5 * m.appP} />
        <rect x={1.6} y={1.6} width={pw - 3.2} height={ph - 3.2} rx={9} fill="none" stroke="url(#mc-edge)" strokeWidth={1.2} opacity={0.7} />
      </g>
      {/* BUSY: a warning tag on a stalk above the window, never over it */}
      {t >= m.busyAt ? (() => { const s = sp(t, m.busyAt, 'bouncy'); return (
        <g>
          <Post x={-47} y={4} z0={5} z1={48} s={1.4} />
          <Tag x={-60} y={4.8} z={66} text="BUSY" size={34} color={COL.amber} fill="#1E1503" scale={2 - s} opacity={Math.min(1, s * 2)} />
          <g transform={faceY(-60, 4.8, 66)} opacity={0.5 + 0.5 * Math.sin(t * 0.6)}><circle cx={66} cy={-16} r={8} fill={COL.amber} /><circle cx={66} cy={-16} r={30} fill="url(#mc-ga)" /></g>
        </g>
      ); })() : null}
    </g>
  );
};

// ---- station 2: RENDER SERVER -----------------------------------------------------------------------------------------
const TREE: [number, number][] = [[72, 26], [36, 68], [108, 68], [18, 112], [54, 112], [90, 112], [126, 112]];
const TW = {x: 4, y: -14, w: 30, d: 28, z1: 85};
const HOLO = {x: -34, y: 6, w: 28, z0: 18, z1: 68};
const fenceP = (x0: number, y0: number, x1: number, y1: number, h: number) => `${q(x0, y0, 5)} ${q(x1, y1, 5)} ${q(x1, y1, 5 + h)} ${q(x0, y0, 5 + h)}`;
const ServerStatic: React.FC = React.memo(() => {
  const fw = TW.w * AX, fh = (TW.z1 - 5) * ZP;
  return (
    <g>
      <Plinth x0={-40} x1={40} />
      <SiTop z={5.05}><path d={rr(-37.5, -27.5, 75, 55, 1)} fill="none" stroke="url(#mc-hazu)" strokeWidth={2.2} /></SiTop>
      <Slab x={HOLO.x} y={HOLO.y - 4} w={HOLO.w} d={8} z={5} h={2.4} color="#3C4452" top="#262C38" r={1} shadow={0.5} />
      <SiTop z={5}><rect x={TW.x + 1} y={TW.y + 2} width={TW.w + 8} height={TW.d + 3} rx={2} fill="#000" opacity={0.7} /></SiTop>
      <SiPrism x={TW.x} y={TW.y} w={TW.w} d={TW.d} z={5} h={TW.z1 - 5} color="#232833" side="#0B0E15" edge={0.7} />
      <polygon points={`${q(TW.x + TW.w, TW.y + TW.d, TW.z1)} ${q(TW.x + TW.w, TW.y, TW.z1)} ${q(TW.x + TW.w, TW.y, 5)} ${q(TW.x + TW.w, TW.y + TW.d, 5)}`} fill="url(#mc-towerS)" />
      {Array.from({length: 9}).map((_, i) => <polyline key={i} points={`${q(TW.x + TW.w, TW.y + 4 + i * 2.5, TW.z1 - 8)} ${q(TW.x + TW.w, TW.y + 4 + i * 2.5, TW.z1 - 30)}`} stroke="#000" strokeWidth={2.4} opacity={0.8} />)}
      <polyline points={`${q(TW.x + TW.w, TW.y, TW.z1)} ${q(TW.x + TW.w, TW.y, 5)}`} stroke="#8FB8FF" strokeWidth={2} opacity={0.75} />
      <SiTop z={TW.z1}>
        <rect x={TW.x} y={TW.y} width={TW.w} height={TW.d} fill="#3D4654" /><rect x={TW.x} y={TW.y} width={TW.w} height={TW.d} fill="url(#mc-perf)" opacity={0.9} />
        <rect x={TW.x + 0.3} y={TW.y + 0.3} width={TW.w - 0.6} height={TW.d - 0.6} fill="none" stroke="#DCE8FF" strokeOpacity={0.5} strokeWidth={0.5} />
      </SiTop>
      <g transform={faceY(TW.x, TW.y + TW.d + 0.02, TW.z1)}>
        <rect width={fw} height={fh} fill="url(#mc-towerF)" /><rect width={fw} height={fh} fill="url(#mc-brushv)" />
        <rect width={fw} height={2.2} fill="#E6EEFA" opacity={0.75} /><rect width={2} height={fh} fill="#DCE8FF" opacity={0.3} />
        <rect x={34} y={12} width={110} height={98} rx={4} fill="#090B10" stroke="#3A4252" />
        {Array.from({length: 10}).map((_, i) => <g key={i}><rect x={40} y={18 + i * 9} width={98} height={4} rx={2} fill="#000" /><rect x={40} y={22.2 + i * 9} width={98} height={0.9} fill="#9AA5B8" opacity={0.35} /></g>)}
        {[0, 1, 2].map((i) => (
          <g key={i}><rect x={10} y={122 + i * 43} width={fw - 20} height={36} rx={5} fill="#0A0C12" stroke="#4A5262" /><rect x={10} y={122 + i * 43} width={fw - 20} height={1.4} fill="#C9D6EE" opacity={0.3} />
            <rect x={18} y={129 + i * 43} width={62} height={5} rx={2} fill="#2D3443" /><rect x={fw - 46} y={128 + i * 43} width={22} height={7} rx={3.5} fill="#1A1F29" stroke="#59616F" /></g>
        ))}
        {Array.from({length: 14}).map((_, i) => <rect key={i} x={12 + i * 9.6} y={fh - 12} width={5} height={6} rx={1} fill="#000" />)}
      </g>
    </g>
  );
});
const Server: React.FC<{m: M; extra?: React.ReactNode}> = ({m, extra}) => {
  const t = m.t, fw = TW.w * AX, hw = HOLO.w * AX, hh = (HOLO.z1 - HOLO.z0) * ZP, fh = 34 * m.fence;
  const ph = (((t - 64) / 44) % 1 + 1) % 1, o = ease(ph < 0.5 ? ph * 2.4 : (1 - ph) * 2.4);
  const beacon = (x: number, y: number, k: number) => { const p = V.P(x, y, 5 + fh); return <g key={k} opacity={m.fence}><circle cx={p[0]} cy={p[1]} r={20} fill="url(#mc-ga)" /><circle cx={p[0]} cy={p[1] - 1} r={4.6} fill="#FFE2A8" /></g>; };
  const rail = (x0: number, y0: number, x1: number, y1: number, k: string) => (
    <g key={k} opacity={m.fence}>
      <polygon points={fenceP(x0, y0, x1, y1, fh)} fill={COL.amber} opacity={0.055} />
      <polyline points={`${q(x0, y0, 5 + fh)} ${q(x1, y1, 5 + fh)}`} stroke="#FFD08A" strokeWidth={2.4} opacity={0.9} /><polyline points={`${q(x0, y0, 5 + fh * 0.5)} ${q(x1, y1, 5 + fh * 0.5)}`} stroke={COL.amber} strokeWidth={1.2} opacity={0.5} />
    </g>
  );
  return (
    <g>
      <ServerStatic />
      <SiGlow x={0} y={4} z={5.1} r={46} color={COL.amber} strength={0.3 * m.fence} />
      {rail(-38, -28, 38, -28, 'b')}{rail(-38, -28, -38, 28, 'l')}
      {[[-38, -28], [38, -28]].map(([x, y], i) => <g key={i}><Post x={x} y={y} z0={5} z1={5.4 + fh} />{beacon(x, y, i)}</g>)}
      {/* tower lights */}
      <g transform={faceY(TW.x, TW.y + TW.d + 0.04, TW.z1)}>
        {Array.from({length: 8}).map((_, i) => { const l = clamp01(m.boot * 8 - i), c = i % 3 === 0 && Math.sin(t * 0.9 + i) > 0 ? COL.amber : COL.green; return <g key={i}><circle cx={18} cy={20 + i * 11.5} r={3.6} fill={l > 0.5 ? c : '#1D2430'} />{l > 0.5 ? <circle cx={18} cy={20 + i * 11.5} r={9} fill={c} opacity={0.22} /> : null}</g>; })}
        {[0, 1, 2].map((i) => <g key={i}><rect x={18} y={140 + i * 43} width={fw - 36} height={12} rx={3} fill="url(#mc-wire)" opacity={0.35 + 0.6 * m.boot} /><rect x={18 + ((t * 2.2 + i * 31) % (fw - 60))} y={140 + i * 43} width={22} height={12} rx={3} fill={COL.cyan} opacity={0.5 * m.boot} />
          <circle cx={fw - 35} cy={131.5 + i * 43} r={2.6} fill={m.boot >= 1 ? COL.cyan : '#1D2430'} opacity={0.5 + 0.5 * Math.sin(t * 0.7 + i * 2)} /></g>)}
        <rect x={-3} y={-3} width={fw + 6} height={(TW.z1 - 5) * ZP + 6} fill="none" stroke={COL.cyan} strokeWidth={3.5} opacity={m.srv} />
        <rect width={fw} height={(TW.z1 - 5) * ZP} fill={COL.cyan} opacity={0.12 * m.srv + 0.03 * m.boot} />
      </g>
      <SiGlow x={TW.x + 15} y={TW.y + TW.d + 10} z={5.1} r={30} color={COL.cyan} strength={(0.25 + 0.5 * m.srv) * m.boot} />
      {/* hologram plate: layer tree -> tile stack -> one frame (S05: the lifted animation keeps playing) */}
      <polygon points={`${q(HOLO.x + 6, HOLO.y, 7.4)} ${q(HOLO.x + HOLO.w - 6, HOLO.y, 7.4)} ${q(HOLO.x + HOLO.w, HOLO.y, HOLO.z0)} ${q(HOLO.x, HOLO.y, HOLO.z0)}`} fill="url(#mc-beam)" opacity={0.35 + 0.5 * m.tree} />
      <Glass x={HOLO.x} y={HOLO.y} z0={HOLO.z0} z1={HOLO.z1} w={HOLO.w} stroke={COL.cyan} glow={0.35 + 0.5 * m.tree} fill="#0A1326">
        {Array.from({length: 13}).map((_, i) => <rect key={i} x={4} y={8 + i * 12} width={hw - 8} height={1} fill={COL.cyan} opacity={0.12} />)}
        {m.holo < 0.5 ? (
          <g opacity={m.tree}>
            {TREE.slice(1).map((p, i) => { const a = TREE[i < 2 ? 0 : i < 4 ? 1 : 2]; return <path key={i} d={`M${a[0]} ${a[1] + 8}V${(a[1] + p[1]) / 2}H${p[0]}V${p[1] - 8}`} fill="none" stroke={COL.cyan} strokeWidth={1.6} opacity={(1 - m.stack) * ramp(m.tree, i / 8, i / 8 + 0.3)} />; })}
            {TREE.map((p, i) => {
              const sy = lerp(lerp(p[1], 134 - i * 15, m.stack), 80, m.fr), x = lerp(p[0], 72, m.stack), w = lerp(30, 96, m.stack), h = lerp(16, 11, m.stack) + m.fr * (i === 6 ? 66 : 0);
              return <rect key={i} x={x - w / 2} y={sy - h / 2} width={w} height={h} rx={4} fill={`url(#mc-f${i % 6})`} stroke="#FFFFFF" strokeOpacity={0.7} opacity={ramp(m.tree, i / 9, i / 9 + 0.25) * (m.fr > 0.5 && i < 6 ? 2 - 2 * m.fr : 1)} transform={`skewX(${-24 * m.stack * (1 - m.fr)})`} style={{transformOrigin: `${x}px ${sy}px`}} />;
            })}
          </g>
        ) : (
          <g>
            {[0, 1, 2, 3].map((i) => <rect key={i} x={10} y={12 + i * 37} width={38} height={30} rx={5} fill={i === 0 ? '#16203A' : `url(#mc-f${i + 1})`} opacity={0.6} />)}
            <rect x={10} y={12} width={lerp(38, hw - 20, o)} height={lerp(30, hh - 24, o)} rx={8} fill="url(#mc-f0)" stroke="#FFFFFF" strokeWidth={2} />
            <circle cx={10 + lerp(38, hw - 20, o) - 20} cy={30} r={lerp(5, 11, o)} fill="#FFF" opacity={0.75} />
          </g>
        )}
      </Glass>
      {extra}
      {rail(-38, 28, 38, 28, 'f')}{rail(38, -28, 38, 28, 'r')}
      {[[-38, 28], [38, 28]].map(([x, y], i) => <g key={i}><Post x={x} y={y} z0={5} z1={5.4 + fh} />{beacon(x, y, i)}</g>)}
      {m.proc > 0.01 ? <Tag x={-36} y={28.1} z={5 + 25} text="SEPARATE PROCESS" size={24} color={COL.amber} fill="#1A1305" opacity={m.proc} scale={0.6 + 0.4 * m.proc} /> : null}
    </g>
  );
};

// ---- station 3: GPU (A20 Pro die on a board, painting tiles into a framebuffer) -------------------------------------------
const GU = 19, GV = siView(GU, T);
const GO = (): [number, number] => pt(3, 0, 1, 5.1);
const FB = {x: -27, y: -28, w: 54, z0: 24, z1: 82};
const GpuBoard: React.FC = React.memo(() => {
  const {id} = useSi();
  const caps: Passive[] = [], res: Passive[] = [];
  for (let i = 0; i < 12; i++) { caps.push({x: -8.4 + i * 1.42, y: -8.3, l: 0.9, w: 0.5, along: 'x'}); res.push({x: -8.4 + i * 1.42, y: 7.7, l: 0.7, w: 0.4, along: 'x'}); }
  for (let i = 0; i < 9; i++) { caps.push({x: -9.4, y: -6.4 + i * 1.5, l: 0.9, w: 0.5, along: 'y'}); res.push({x: 8.9, y: -6.4 + i * 1.5, l: 0.7, w: 0.4, along: 'y'}); }
  let tr = '';
  for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); tr += `M${(c * 7.9).toFixed(2)} ${(s * 7.9).toFixed(2)}L${(c * 11).toFixed(2)} ${(s * 9.6).toFixed(2)}`; }
  return (
    <g>
      <SiTop z={0}><path d={rr(-10.3, -9, 21.6, 19.4, 1)} fill="#000" opacity={0.7} filter={`url(#${id}-soft2)`} /></SiTop>
      <SiPrism x={-10.6} y={-9.6} w={21.2} d={19.2} z={0} h={0.8} color={SI.fr4} edge={0.5} />
      <SiTop z={0.8}>
        <clipPath id="mcg-cp"><path d={rr(-10.6, -9.6, 21.2, 19.2, 0.7)} /></clipPath>
        <path d={rr(-10.6, -9.6, 21.2, 19.2, 0.7)} fill={SI.maskHi} />
        <g clipPath="url(#mcg-cp)"><path d={tr} stroke="#2C3646" strokeWidth={0.09} fill="none" /><path d={tr} stroke="#5A6C8C" strokeWidth={0.03} fill="none" transform="translate(0.05 0.05)" /></g>
        <path d={rr(-10.6, -9.6, 21.2, 19.2, 0.7)} fill={`url(#${id}-env)`} opacity={0.35} />
        <path d={rr(-10.45, -9.45, 20.9, 18.9, 0.7)} fill="none" stroke={SI.copper} strokeOpacity={0.8} strokeWidth={0.1} />
        {[[-9.6, -8.6], [9.6, -8.6], [-9.6, 8.6], [9.6, 8.6]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={0.55} fill={`url(#${id}-gold)`} /><circle cx={x} cy={y} r={0.24} fill="#07090D" /></g>)}
      </SiTop>
      <SiPassives items={caps} type="cap" h={0.45} z={0.8} /><SiPassives items={res} type="res" h={0.3} z={0.8} />
    </g>
  );
});
const GpuStatic: React.FC = React.memo(() => (
  <g>
    <Plinth />
    <Post x={-30} y={-28} z0={5} z1={FB.z1 + 1} /><Post x={30} y={-28} z0={5} z1={FB.z1 + 1} />
  </g>
));
const Gpu: React.FC<{m: M}> = ({m}) => {
  const n = Math.floor(m.paint * 24), cur = Math.min(23, n), pw = FB.w * AX, ph = (FB.z1 - FB.z0) * ZP, tw = (pw - 24) / 6, th = (ph - 44) / 4;
  const tile = (i: number): [number, number] => [12 + (i % 6) * tw, 32 + Math.floor(i / 6) * th];
  return (
    <g>
      <Glass x={FB.x} y={FB.y} z0={FB.z0} z1={FB.z1} w={FB.w} stroke={m.gon > 0.5 ? COL.cyan : '#CFE0FF'} glow={0.5 + 0.3 * m.gon}>
        <text x={12} y={22} fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={1.4} fill="#EAF1FF">FRAME BUFFER</text>
        <FeedPic id="mcgp" g="mc" x={12} y={32} w={pw - 24} h={ph - 44} scroll={30} />
        {Array.from({length: 24}).map((_, i) => (i >= n ? <rect key={i} x={tile(i)[0]} y={tile(i)[1]} width={tw} height={th} fill="url(#mc-wire)" stroke="#3B8CFF" strokeOpacity={0.5} strokeWidth={0.7} /> : i === n - 1 && m.paint < 1 ? <rect key={i} x={tile(i)[0]} y={tile(i)[1]} width={tw} height={th} fill="#FFFFFF" opacity={0.65} /> : null))}
      </Glass>
    </g>
  );
};
const GpuFront: React.FC<{m: M}> = ({m}) => {
  const n = Math.floor(m.paint * 24), cur = Math.min(23, n), pw = FB.w * AX, ph = (FB.z1 - FB.z0) * ZP, tw = (pw - 24) / 6, th = (ph - 44) / 4;
  const tile = (i: number): [number, number] => [12 + (i % 6) * tw, 32 + Math.floor(i / 6) * th];
  return (
    <g>
      {m.paint > 0 && m.paint < 1 ? (() => { const g = V.P(FB.x, FB.y, FB.z1), [tx, ty] = tile(cur), a: [number, number] = [g[0] + tx + tw / 2, g[1] + (tx + tw / 2) * SK + ty + th / 2];
        const gp = GV.P(-3.45, -1.37, 1.7), o = V.P(0, 1, 5.1), b: [number, number] = [o[0] + gp[0], o[1] + gp[1]];
        return <g style={{mixBlendMode: 'screen'}}><polygon points={`${b[0] - 26},${b[1]} ${b[0] + 26},${b[1]} ${a[0] + tw / 2},${a[1]} ${a[0] - tw / 2},${a[1]}`} fill={COL.cyan} opacity={0.28} /><circle cx={a[0]} cy={a[1]} r={30} fill="url(#mc-gw)" /></g>; })() : null}
      <Tag x={-62} y={31} z={22} text="A20 Pro · 7-core GPU" size={18} color="#DCE8FF" opacity={0.5 + 0.5 * m.gon} />
      <g transform={faceY(-62, 31, 22)}><rect x={30} y={30} width={3} height={60} fill="url(#mc-metal)" /><text x={46} y={62} fontFamily={FONT} fontStyle="italic" fontWeight={500} fontSize={18} fill="#AFC0E2">illustration</text></g>
    </g>
  );
};
const GpuChip: React.FC<{gon: number; sweep: number}> = ({gon, sweep}) => {
  const g = Math.round(gon * 40) / 40;
  const stack = React.useMemo(() => <PackageStack x={-7.5} y={-7.5} w={15} d={15} z={0.8} h={1.2} spread={0.34} gap={0.5} layerOpacity={{memory: 0, lid: 0}} dieActive={g > 0.05 ? {gpu: g} : undefined} glow={g} glowColor={COL.cyan} dieDetail={1} />, [g]);
  return (
    <SiScene id="mcg" width={10} height={10} u={GU} tilt={T} origin={GO()} light={{envX: 0, envY: 0, envR: 16}} sweep={sweep}>
      <GpuBoard />{stack}
    </SiScene>
  );
};

// ---- station 4: DISPLAY -------------------------------------------------------------------------------------------------
const DIALX = 22;
const DisplayStatic: React.FC = React.memo(() => (
  <g>
    <Plinth />
    <Slab x={-16} y={-21} w={32} d={12} z={5} h={20} color="#1C212B" top="#2A313D" r={1.5} shadow={0.6} edge={0.5} />
    <Slab x={-18} y={-4} w={36} d={16} z={5} h={2.2} color="#59616F" top="#39414E" r={2} shadow={0.5} env={0.7} />
    <Slab x={30} y={10} w={5} d={5} z={5} h={1.4} color="#727B8B" top="#59616F" r={1} />
    <Post x={32.5} y={12.5} z0={6.4} z1={30} s={2} />
  </g>
));
const DisplayRig: React.FC<{m: M}> = ({m}) => {
  const dx = 57, dy = 60, a = ((150 + 240 * m.dial) * Math.PI) / 180;
  const arc = (v0: number, v1: number, r: number) => { const p = (v: number) => { const g = ((150 + 240 * v) * Math.PI) / 180; return `${dx + Math.cos(g) * r} ${dy + Math.sin(g) * r}`; }; return `M${p(v0)}A${r} ${r} 0 ${v1 - v0 > 0.75 ? 1 : 0} 1 ${p(v1)}`; };
  const col = m.dial > 0.6 ? COL.cyan : COL.green;
  return (
    <g>
      <g transform={`${faceY(DIALX + 1, 12.6, 78)} scale(1.3)`}>
        <circle cx={dx + 5} cy={dy - 4} r={56} fill="#05070B" /><circle cx={dx} cy={dy} r={56} fill="url(#mc-metal)" /><circle cx={dx} cy={dy} r={50} fill="#0A0F1C" />
        <circle cx={dx} cy={dy} r={78} fill="url(#mc-gc)" opacity={0.3 * Math.max(m.pm, m.nxt * 2, m.dlit * 0.5)} />
        <path d={arc(0, 1, 40)} fill="none" stroke="#263150" strokeWidth={8} strokeLinecap="round" /><path d={arc(0, Math.max(0.02, m.dial), 40)} fill="none" stroke={col} strokeWidth={8} strokeLinecap="round" />
        {Array.from({length: 13}).map((_, i) => { const g = ((150 + 20 * i) * Math.PI) / 180; return <path key={i} d={`M${dx + Math.cos(g) * 27} ${dy + Math.sin(g) * 27}L${dx + Math.cos(g) * 32} ${dy + Math.sin(g) * 32}`} stroke="#8FA0C2" strokeWidth={1.6} />; })}
        <path d={`M${dx - Math.cos(a) * 8} ${dy - Math.sin(a) * 8}L${dx + Math.cos(a) * 37} ${dy + Math.sin(a) * 37}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" /><circle cx={dx} cy={dy} r={6.5} fill="#EAF1FF" />
        <text x={dx} y={dy + 30} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={16} fill="#EAF1FF">Hz</text>
        <path d={`M${dx - 34} ${dy - 36}A50 50 0 0 1 ${dx + 10} ${dy - 49}`} fill="none" stroke="#FFF" strokeOpacity={0.25} strokeWidth={3} />
        <rect x={dx - 72} y={dy + 62} width={144} height={30} rx={8} fill="#0A0F1C" stroke="#CFE0FF" strokeOpacity={0.45} />
        <text x={dx} y={dy + 84} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={19} fill="#EAF1FF">up to 120 Hz</text>
        {m.pm > 0.01 ? <g opacity={m.pm} transform={`translate(${dx} ${dy - 80}) scale(${0.6 + 0.4 * m.pm})`}><rect x={-66} y={-17} width={132} height={34} rx={9} fill="#06202A" stroke={COL.cyan} strokeWidth={1.5} /><text y={7} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={COL.cyan}>ProMotion</text></g> : null}
        {m.batt > 0.01 ? (
          <g transform={`translate(${dx - 52} ${dy + 112}) scale(${m.batt})`} style={{transformOrigin: `${dx}px ${dy + 136}px`}}>
            <circle cx={50} cy={24} r={70} fill="url(#mc-gg)" opacity={0.45 * m.level} />
            <rect width={98} height={48} rx={11} fill="#0A0F1C" stroke="#EAF1FF" strokeWidth={3.2} /><rect x={100} y={15} width={8} height={18} rx={3} fill="#EAF1FF" />
            <rect x={7} y={7} width={84 * m.level} height={34} rx={6} fill={COL.green} /><rect x={7} y={7} width={84 * m.level} height={12} rx={6} fill="#FFF" opacity={0.25} /><path d="M52 9L38 26H48L44 40L60 22H50Z" fill="#FFFFFF" opacity={0.92} />
          </g>
        ) : null}
      </g>
    </g>
  );
};
const DisplayScreen: React.FC<{m: M}> = ({m}) => {
  const lh = 874 * m.dlit, sy = m.slow >= 0 && m.slow < 1 ? 874 * m.slow : -1;
  return (
    <svg width={402} height={874} viewBox="0 0 402 874" style={{position: 'absolute', left: 0, top: 0}}>
      <rect width={402} height={874} fill="#020305" />
      <clipPath id="mc-dl"><rect width={402} height={lh} /></clipPath>
      <g clipPath="url(#mc-dl)"><FeedPic id="mcdp" g="mc" x={0} y={0} w={402} h={874} scroll={m.dscroll} tall /></g>
      {m.dlit > 0 && m.dlit < 1 ? <><rect y={lh - 70} width={402} height={70} fill={COL.cyan} opacity={0.25} /><rect y={lh - 5} width={402} height={10} fill="#FFFFFF" /></> : null}
      {m.nxt > 0.02 ? <rect width={402} height={874} fill="#FFFFFF" opacity={0.45 * m.nxt} /> : null}
      {sy > 0 ? <rect y={sy} width={402} height={7} fill="#FFFFFF" opacity={0.7} /> : null}
    </svg>
  );
};

// ---- the two real phones ------------------------------------------------------------------------------------------------
const PC = 560, PSS = 1.6, PW = PC * PSS;
const pcam = (pxu: number): OrbitKey[] => { const d = (PW / 2) / (pxu * PSS * Math.tan((4 * Math.PI) / 180)); return [{t: -100, yaw: 203, pitch: 46, dist: d, fov: 8, tgt: [0, 0, 0]}, {t: 2000, yaw: 203, pitch: 46, dist: d, fov: 8, tgt: [0, 0, 0]}]; };
const CAM_FLAT = pcam(42), CAM_UP = pcam(43);
const POSE_FLAT: PoseKey[] = [{t: -100, pitch: 90, yaw: -13}, {t: 2000, pitch: 90, yaw: -13}];
const POSE_UP: PoseKey[] = [{t: -100, pitch: 24, yaw: 4}, {t: 2000, pitch: 24, yaw: 4}];
const Phone: React.FC<{t: number; at: [number, number]; cam: OrbitKey[]; pose: PoseKey[]; floorY: number; screen: React.ReactNode; reflect?: number}> = ({t, at, cam, pose, floorY, screen, reflect = 0}) => (
  <div style={{position: 'absolute', left: at[0] - PC / 2, top: at[1] - PC / 2, width: PC, height: PC}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: PW, transformOrigin: '0 0', transform: `scale(${1 / PSS})`}}>
      <PhoneShot t={t} W={PW} H={PW} cam={cam} pose={pose} screen={screen} floor={{y: floorY, shadow: 0.75, reflect}} fx={{dof: false}} light={{main: 1.25, fill: 1.5, rim: 1.3}} />
    </div>
  </div>
);
const P0 = (): [number, number] => { const p = pt(0, 0, 2, 5.9); return [p[0], p[1] - 13]; };
const P4 = (): [number, number] => { const p = pt(4, 0, 3, 7.2); return [p[0], p[1] - 136]; };

// ---- camera + stage -------------------------------------------------------------------------------------------------
type C = {x: number; y: number; s: number};
const FY = 0.41;
const mixC = (p: C, r: C, f: number): C => ({x: lerp(p.x, r.x, f), y: lerp(p.y, r.y, f), s: Math.exp(lerp(Math.log(p.s), Math.log(r.s), f))});
const ZS = 1.4;
const ST = (i: number): C => (i === 4 ? {x: G(4)[0] + 60, y: G(4)[1] - 62, s: 1.3} : {x: G(i)[0] + 60, y: G(i)[1] + 4, s: ZS});
const focusOf = (c: C) => (c.x - 60) / G(1)[0];
const svgStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible'};
const At0: React.FC<{id: string; children: React.ReactNode; i?: number}> = ({id, children, i = 0}) => <SiScene id={id} width={10} height={10} u={U} tilt={T} origin={G(i)} light={LIGHT}>{children}</SiScene>;

const Machine: React.FC<{m: M; cam: C; W: number; H: number; dim?: number; mid?: React.ReactNode; srvExtra?: React.ReactNode; st4?: React.ReactNode; top?: React.ReactNode; sweep?: number}> = ({m, cam, W, H, dim = 0.3, mid, srvExtra, st4, top, sweep = -99}) => {
  const f = focusOf(cam), k = ramp(cam.s, 0.85, 1.25);
  const wrap = (i: number, node: React.ReactNode) => {
    const far = clamp01(Math.abs(i - f) - 0.72), blur = k * far * 4.2, br = m.power[i] * (1 - dim * k * far);
    const fl = `${br < 0.985 ? `brightness(${br.toFixed(3)}) ` : ''}${blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : ''}`.trim();
    return <div key={i} style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, filter: fl || undefined}}>{node}</div>;
  };
  const vis = (p: [number, number]) => Math.abs((p[0] - cam.x) * cam.s) < W / 2 + PC * 0.5 * cam.s && Math.abs((p[1] - cam.y) * cam.s + H * (FY - 0.5)) < H / 2 + PC * 0.5 * cam.s;
  const p0 = P0(), p4 = P4();
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: `translate(${W / 2 - cam.x * cam.s}px,${H * FY - cam.y * cam.s}px) scale(${cam.s})`}}>
      <svg width={10} height={10} style={svgStyle}><Defs /></svg>
      <At0 id="mcfl"><Floor /></At0>
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, filter: 'blur(2.5px)'}}><At0 id="mcbg"><Racks /></At0></div>
      {wrap(0, <><At0 id="mc0" i={0}><StationLight i={0} seen={m.seen[0]} power={m.power[0]} flash={m.flash[0]} /><Touch m={m} /></At0>{vis(p0) ? <Phone t={m.t} at={p0} cam={CAM_FLAT} pose={POSE_FLAT} floorY={-0.47} screen={<TouchScreen m={m} />} /> : null}</>)}
      {wrap(1, <At0 id="mc1" i={1}><StationLight i={1} seen={m.seen[1]} power={m.power[1]} flash={m.flash[1]} /><AppWin m={m} /></At0>)}
      {mid}
      {wrap(2, <At0 id="mc2" i={2}><StationLight i={2} seen={m.seen[2]} power={m.power[2]} flash={m.flash[2]} x0={-40} x1={40} /><Server m={m} extra={srvExtra} /></At0>)}
      {wrap(3, <><At0 id="mc3" i={3}><StationLight i={3} seen={m.seen[3]} power={m.power[3]} flash={m.flash[3]} /><GpuStatic /><Gpu m={m} /></At0><GpuChip gon={m.gon} sweep={sweep} /><At0 id="mc3b" i={3}><GpuFront m={m} /></At0></>)}
      {wrap(4, <><At0 id="mc4" i={4}><StationLight i={4} seen={m.seen[4]} power={m.power[4]} flash={m.flash[4]} /><DisplayStatic /></At0>{vis(p4) ? <Phone t={m.t} at={p4} cam={CAM_UP} pose={POSE_UP} floorY={-4.72} screen={<DisplayScreen m={m} />} reflect={0.2} /> : null}<At0 id="mc4b" i={4}><DisplayRig m={m} />{st4}</At0></>)}
      <At0 id="mcr"><Rail m={m} /></At0>
      <svg width={10} height={10} style={svgStyle}>{top}</svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, filter: 'blur(7px)'}}><At0 id="mcfg"><Near /></At0></div>
    </div>
  );
};

const Stage: React.FC<{W: number; H: number; t: number; seed: number; children: React.ReactNode; overlay?: React.ReactNode}> = ({W, H, t, seed, children, overlay}) => (
  <AbsoluteFill style={{background: '#02030A', overflow: 'hidden'}}>
    {children}
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', background: 'radial-gradient(ellipse 46% 50% at 18% 6%, rgba(255,236,214,0.10) 0%, rgba(255,236,214,0) 70%)'}} />
    <SiLens W={W} H={H} t={t} focus={[0.14, 0.8]} blur={5} dust={10} tint="#6FA8FF" seed={seed} vignette={0.7} />
    {overlay}
  </AbsoluteFill>
);

const Hud: React.FC<{W: number; H: number; left: number; done: number; inn: number}> = ({W, H, left, done, inn}) => {
  const col = done > 0.5 ? COL.green : left < 0.3 ? COL.amber : COL.cyan;
  return (
    <div style={{position: 'absolute', right: W * 0.04, top: H * 0.06, width: 540, fontFamily: FONT, padding: '16px 26px 20px', borderRadius: 22, opacity: inn, transform: `translateX(${(1 - inn) * 80}px)`,
                 background: 'linear-gradient(160deg,rgba(30,40,66,0.94),rgba(6,9,16,0.95))', boxShadow: '0 16px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(143,180,255,0.22)'}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
        <div style={{fontSize: 44, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', lineHeight: 1}}>8.3 ms</div>
        <div style={{fontWeight: 500, color: '#9FB0D2', fontSize: 27, flex: 1}}>deadline</div>
        <div style={{fontSize: 27, fontWeight: 800, letterSpacing: '0.06em', color: done > 0.5 ? COL.green : '#9FB0D2', whiteSpace: 'nowrap'}}>{done > 0.5 ? 'ON TIME' : 'time left'}</div>
      </div>
      <div style={{marginTop: 14, height: 18, borderRadius: 9, background: '#0A0F1C', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${left * 100}%`, borderRadius: 9, background: `linear-gradient(90deg,${col}66,${col})`, boxShadow: `0 0 18px ${col}`}} />
        {[0.2, 0.4, 0.6, 0.8].map((p) => <div key={p} style={{position: 'absolute', left: `${p * 100}%`, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.28)'}} />)}
      </div>
    </div>
  );
};

// ---- S04 ----------------------------------------------------------------------------------------------------------
const OPEN: C = {x: G(1)[0] + 40, y: G(1)[1] + 10, s: 1.12}, WIDE: C = {x: G(2)[0] + 40, y: G(2)[1] - 10, s: 0.66};
const cam4 = (t: number, k: K4): C => {
  let c = mixC(OPEN, WIDE, outCubic(ramp(t, -6, 50)));
  c = mixC(c, ST(0), ease(ramp(t, k.finger - 10, k.finger + 22)));
  c = mixC(c, ST(1), ease(ramp(t, k.goes - 3, k.app + 14)));
  c = mixC(c, ST(2), ease(ramp(t, k.hands + 2, k.sep + 4)));
  c = mixC(c, ST(3), ease(ramp(t, k.frame + 6, k.graphics + 8)));
  return mixC(c, ST(4), ease(ramp(t, k.paints + 22, k.display + 6)));
};
export const S04: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const beats = (spec.beats ?? []) as Beat[], k = k4(beats), m = mstate(t, k), cam = cam4(t, k);
  const d0 = pt(0, 0, RY, 4), on = pt(4, -44, 24, 34);
  return (
    <Stage W={W} H={H} t={t} seed={6} overlay={<Hud W={W} H={H} left={1 - 0.8 * ramp(t, k.touch, k.shows)} done={t >= k.tick ? 1 : 0} inn={sp(t, k.race + 4, 'settle')} />}>
      <Machine m={m} cam={cam} W={W} H={H} sweep={lerp(-30, 30, ramp(t, wordAt(beats, 'chip', 368) - 3, wordAt(beats, 'chip', 368) + 15))}
        top={<>
          <Ripple t={t} at={k.touch} x={d0[0]} y={d0[1]} color={COL.cyan} r={150} />
          <Burst t={t} at={k.tick} x={on[0]} y={on[1]} color={COL.green} n={20} r={200} />
          <SvgStamp t={t} at={k.tick} x={on[0]} y={on[1]} text="ON TIME" color={COL.green} size={40} />
        </>} />
    </Stage>
  );
};

// ---- S05 ----------------------------------------------------------------------------------------------------------
const k5 = (beats: Beat[]) => {
  const w = (s: string, d: number) => wordAt(beats, s, d);
  return {clever: w('clever', 26), part: w('part', 35), animations: w('animations', 64), run: w('run', 84), inside: w('inside', 92), server: w('server', 120), outside: w('outside', 138),
    even: w('even', 189), busy: w('busy', 214), motion: w('motion', 239), keep: w('keep', 268), going: w('going', 275), nothing: w('nothing', 310), moves: w('moves', 320), promotion: w('promotion', 336),
    slows: w('slows', 354), right: w('right', 378), down: w('down', 386), save: w('save', 394), battery: w('battery', 402)};
};
type K5 = ReturnType<typeof k5>;
const SPLIT: C = {x: G(1.5)[0] - 40, y: G(1.5)[1] - 30, s: 1.08};
const END: C = {x: G(4)[0] + 118, y: G(4)[1] - 20, s: 1.5};
const cam5 = (t: number, K: K5): C => mixC(mixC(ST(4), SPLIT, ease(ramp(t, K.clever - 16, K.clever + 34))), END, ease(ramp(t, K.nothing - 28, K.nothing + 16)));
const dialAt = (t: number, K: K5) =>
  Math.min(1, 1 - 0.5 * sp(t, K.slows, 'settle') - 0.25 * sp(t, K.right, 'settle') - 0.19 * sp(t, K.down, 'settle') + (t < K.slows ? 0.03 * Math.sin(t * 0.8) * ramp(t, K.nothing - 30, K.nothing - 20) : 0));
/** glass panel right of the display: every screen refresh is one tick; the comb thins out as ProMotion slows down */
const TR = {x: 52, y: 4, w: 50, z0: 14, z1: 60};
const Trace: React.FC<{t: number; K: K5}> = ({t, K}) => {
  const o = ramp(t, K.nothing - 26, K.nothing - 6);
  if (o <= 0) return null;
  const w = TR.w * AX, ticks: number[] = [];
  let ph = 0, last = 0;
  for (let u = K.nothing - 90; u <= t; u += 0.25) { ph += 0.25 * (0.12 + 1.6 * dialAt(u, K)); const f = Math.floor(ph); if (f !== last) { last = f; if (t - u <= 60) ticks.push(u); } }
  const d = dialAt(t, K), col = d > 0.6 ? COL.cyan : COL.green, pw = 0.16 + 0.84 * d;
  return (
    <g opacity={o}>
      <Slab x={TR.x + 16} y={TR.y - 5} w={18} d={10} z={1.1} h={1.6} color="#727B8B" top="#59616F" r={2} shadow={0.6} />
      <Post x={TR.x + 25} y={TR.y} z0={2.7} z1={TR.z0 + 1} s={2} />
      <Glass x={TR.x} y={TR.y} z0={TR.z0} z1={TR.z1} w={TR.w} stroke={col}>
        <text x={14} y={27} fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={1.2} fill="#EAF1FF">SCREEN REFRESHES</text>
        <rect x={12} y={38} width={w - 24} height={62} rx={7} fill="#04070E" stroke={col} strokeOpacity={0.5} />
        {ticks.map((u) => { const x = 18 + (w - 40) * (1 - (t - u) / 60), a = clamp01((60 - (t - u)) / 12); return <rect key={u} x={x} y={45} width={2.4} height={48} rx={1} fill={col} opacity={0.35 + 0.65 * a * (t - u < 3 ? 1 : 0.8)} />; })}
        <rect x={w - 22} y={40} width={3} height={58} fill="#FFFFFF" opacity={0.85} />
        <text x={14} y={129} fontFamily={FONT} fontWeight={700} fontSize={18} letterSpacing={1.2} fill="#EAF1FF">POWER</text>
        <rect x={96} y={112} width={w - 110} height={22} rx={11} fill="#04070E" stroke="#CFE0FF" strokeOpacity={0.3} />
        <rect x={99} y={115} width={(w - 116) * pw} height={16} rx={8} fill={d > 0.6 ? COL.amber : COL.green} /><rect x={99} y={115} width={(w - 116) * pw} height={6} rx={3} fill="#FFFFFF" opacity={0.25} />
      </Glass>
    </g>
  );
};
export const S05: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const beats = (spec.beats ?? []) as Beat[], K = k5(beats), cam = cam5(t, K);
  const lift = ease(ramp(t, K.run, K.server)), wall = sp(t, K.clever, 'settle'), lab = sp(t, K.part, 'pop');
  const scr = 30 + 330 * (1 - Math.pow(1 - ramp(t, K.nothing - 30, K.moves + 6), 2.4));
  const m: M = {...FINAL, t, fd: 1 - ease(ramp(t, K.clever - 12, K.clever + 10)), anim: t >= K.animations - 14 ? 1 : 0, lifted: t >= K.run ? 1 : 0, busy: sp(t, K.even, 'settle'), busyAt: K.busy, srv: decay(t, K.server, 10) + decay(t, wordAt(beats, 'render', 111), 9), appP: decay(t, wordAt(beats, 'app', 154), 9), holo: t >= K.server - 2 ? 1 : 0, tree: t >= K.server - 2 ? 1 : 1 - ramp(t, K.animations, K.run),
    dscroll: scr, dial: Math.min(1, dialAt(t, K)), pm: sp(t, K.promotion, 'pop'), slow: ramp(t, K.slows + 8, K.slows + 40), batt: sp(t, K.save, 'bouncy'), level: 0.3 + 0.62 * ease(ramp(t, K.battery, K.battery + 16))};
  // the lifted animation: a glowing card that arcs over the wall into the tower's plate
  const A = pt(1, WIN.x + 10, 1.5, WIN.z1 - 16), B = pt(2, HOLO.x + 7, HOLO.y, HOLO.z1 - 10), Cc = pt(0, 150, 0, 122);
  const u = lift, bx = (1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * Cc[0] + u * u * B[0], by = (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * Cc[1] + u * u * B[1];
  const n = Math.floor((t - K.server) / 5), fr = ((t - K.server) / 5) % 1, hot = ramp(t, K.motion, K.motion + 6);
  const wh = 96 * wall, hw = HOLO.w * AX, wt = pt(0, 150, 2, wh), a1 = pt(1, 20, 1.5, WIN.z1 + 6), a2 = pt(2, HOLO.x + 14, HOLO.y, HOLO.z1 + 14), bt = pt(4, DIALX + 11, 12.6, 14), g5 = pt(2, HOLO.x + 14, HOLO.y, 44);
  return (
    <Stage W={W} H={H} t={t} seed={7}>
      <Machine m={m} cam={cam} W={W} H={H} dim={0.42}
        mid={(
          <At0 id="mcw">
            {/* glass wall between the two processes */}
            <SiPrism x={148.6} y={-44} w={2.8} d={78} z={1.1} h={1.6} color="#727B8B" edge={0.6} />
            <polygon points={`${q(151.4, -44, 2.7)} ${q(151.4, 34, 2.7)} ${q(151.4, 34, 2.7 + wh)} ${q(151.4, -44, 2.7 + wh)}`} fill="url(#mc-glass)" stroke="#E6F2FF" strokeOpacity={0.75} strokeWidth={1.6} />
            <polygon points={`${q(148.6, 34, 2.7)} ${q(151.4, 34, 2.7)} ${q(151.4, 34, 2.7 + wh)} ${q(148.6, 34, 2.7 + wh)}`} fill="#CFE6FF" opacity={0.6} />
            <polyline points={`${q(151.4, 30, 8)} ${q(151.4, 14, wh - 4)}`} stroke="#FFFFFF" strokeOpacity={0.22} strokeWidth={9} />
            <polyline points={`${q(151.4, -44, 2.7 + wh)} ${q(151.4, 34, 2.7 + wh)}`} stroke={COL.cyan} strokeWidth={4} strokeLinecap="round" opacity={lab} />
            <SiGlow x={150} y={4} z={1.2} r={40} color={COL.cyan} strength={0.35 * wall} />
          </At0>
        )}
        srvExtra={t >= K.server ? (
          <g>
            <g transform={faceY(HOLO.x, HOLO.y, HOLO.z1 + 10)}>
              <rect width={hw} height={26} rx={7} fill="#0A0F1C" stroke={COL.green} strokeOpacity={0.35 + 0.6 * hot} strokeWidth={1.5} />
              {Array.from({length: 10}).map((_, i) => { const x = hw - 14 - (i + fr) * 14; return i < n + 1 && x > 4 ? <rect key={i} x={x} y={5} width={8} height={16} rx={2} fill={COL.green} opacity={(0.55 + 0.45 * hot) * (i === 0 ? fr : 1)} /> : null; })}
            </g>
            <Tag x={HOLO.x + 3} y={HOLO.y} z={HOLO.z1 + 24} text="ON TIME" size={26} color={COL.green} fill="#06180E" opacity={sp(t, K.keep, 'pop')} scale={0.6 + 0.4 * sp(t, K.keep, 'pop')} />
          </g>
        ) : null}
        st4={<Trace t={t} K={K} />}
        top={<>
          <Ripple t={t} at={K.inside + 6} x={wt[0]} y={wt[1] - 20} color={COL.cyan} r={90} />
          {t >= K.run && u < 1 ? (
            <g><circle cx={bx} cy={by} r={86} fill="url(#mc-gw)" opacity={0.75} /><rect x={bx - 44} y={by - 31} width={88} height={62} rx={9} fill="url(#mc-f0)" stroke="#FFFFFF" strokeWidth={3} /><circle cx={bx + 24} cy={by - 13} r={9} fill="#FFF" opacity={0.8} />
              <path d={`M${bx - 30} ${by + 18}C${bx - 8} ${by + 18} ${bx - 4} ${by - 6} ${bx + 12} ${by + 6}`} fill="none" stroke="#FFFFFF" strokeWidth={3} /></g>
          ) : null}
          {t >= K.outside ? <path d={`M${a1[0]} ${a1[1]}Q${Cc[0]} ${Cc[1] - 30} ${a2[0]} ${a2[1]}`} fill="none" stroke={COL.cyan} strokeWidth={3} strokeDasharray="6 8" strokeDashoffset={-t * 1.5} opacity={0.85 * sp(t, K.outside, 'pop')} /> : null}
          <Burst t={t} at={K.going} x={g5[0]} y={g5[1]} color={COL.green} n={16} r={140} />
          <Burst t={t} at={K.battery} x={bt[0]} y={bt[1]} color={COL.green} n={14} r={100} />
        </>} />
    </Stage>
  );
};
