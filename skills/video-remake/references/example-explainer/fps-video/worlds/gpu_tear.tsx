// S08 "Tear" + S09 "Sync": ONE world on one continuous timeline G.
// A neon gaming corner: a wall-mounted 144 Hz monitor above, a generic graphics card on a full-bleed mainboard below,
// a frame lane between them. The card prints frame cards (90 FPS); the monitor's scan line sweeps faster than frames
// arrive, so one refresh catches half of one frame and half of the next (tearing). S09 continues the same timeline:
// variable refresh makes the monitor wait for each frame and refresh the moment it lands.
// Everything is a pure function of G (S08: G = t, S09: G = S08 duration + t), so the S08 -> S09 dissolve is seamless.
import React from 'react';
import type {Beat, WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {Burst, Ripple, camState, direct} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import project from '../project.json';
import {FrameThumb, GameDefs, GameFrame, lerpFr, type Fr} from './gpu_game';
import {BOARD_TOP, CARD, CardDefs, GraphicsCard, Mainboard} from './gpu_card';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const outC = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const inOut = (q: number) => {
  const x = clamp01(q);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const mod1 = (x: number) => x - Math.floor(x);
const decay = (G: number, at: number, d = 8) => (G >= at ? Math.exp(-(G - at) / d) : 0);

const CYAN = '#5CF0FF', MAG = '#FF4FD8', VIO = '#8B6CFF', AMB = '#FFB648', RED = '#FF3B4E', GREEN = '#3DFFA2', INK = '#0B0920';

// ---- timeline from the project's own beats (design frames) ------------------------------------------------------------
type Sc = {id: string; from: number; to: number; beats?: Beat[]};
const P = project as unknown as {scenes: Sc[]; baseFps?: number; canvas?: {fps?: number}};
const KF = (P.canvas?.fps ?? 60) / (P.baseFps ?? 30);
const scn = (id: string) => P.scenes.find((s) => s.id === id);
const beatsOf = (id: string) => (scn(id)?.beats ?? []) as Beat[];
const durOf = (id: string, d: number) => {
  const s = scn(id);
  return s ? (s.to - s.from) / KF : d;
};
const cl = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const at = (beats: Beat[], word: string, d: number, nth = 0) => beats.filter((b) => cl(b.word || b.w || '') === word)[nth]?.t ?? d;

const B8 = beatsOf('S08'), B9 = beatsOf('S09');
const D8 = durOf('S08', 309), D9 = durOf('S09', 221);
const T8 = {
  pc: at(B8, 'pc', 15), graphics: at(B8, 'graphics', 29.5), card: at(B8, 'card', 40), must: at(B8, 'must', 47.5), keep: at(B8, 'keep', 55),
  say: at(B8, 'say', 82), makes: at(B8, 'makes', 91), n90: at(B8, '90', 99.5), frames: at(B8, 'frames', 108), n144: at(B8, '144', 123.5),
  hertz: at(B8, 'hertz', 147.5), monitor: at(B8, 'monitor', 154.5), screen: at(B8, 'screen', 188.5), catches: at(B8, 'catches', 196),
  half1: at(B8, 'half', 205.5), one: at(B8, 'one', 217), frame: at(B8, 'frame', 223.5), half2: at(B8, 'half', 237, 1), next: at(B8, 'next', 247.5),
  tearing: at(B8, 'tearing', 286.5),
};
const T9 = {
  fix: D8 + at(B9, 'fix', 11), variable: D8 + at(B9, 'variable', 23.5), refresh: D8 + at(B9, 'refresh', 37), like: D8 + at(B9, 'like', 51.5),
  gsync: D8 + at(B9, 'gsync', 63.5), freesync: D8 + at(B9, 'freesync', 85.5), monitor: D8 + at(B9, 'monitor', 125), waits: D8 + at(B9, 'waits', 134.5),
  each: D8 + at(B9, 'each', 145.5), neu: D8 + at(B9, 'new', 152), frame: D8 + at(B9, 'frame', 157), refreshes: D8 + at(B9, 'refreshes', 171),
  moment: D8 + at(B9, 'moment', 187), lands: D8 + at(B9, 'lands', 198.5),
};

// ---- the simulation (slow motion of 144 Hz vs 90 fps: 20 design frames per refresh, 32 per new frame = 1.6 : 1) --------
const SP = 20, FP = 32, TRAVEL = 40, VS = 14, HEAL = 14;
const SWAP = T8.frame;                 // the hero swap: a new frame lands while the scan line is half-way down
const PASS0 = SWAP - SP / 2;           // that refresh started here
const HERO_END = T8.next + 2;          // the bottom half is painted (slowed for the explanation) until here
const FIXG = T9.fix;
const PRE = [SWAP - 3 * FP, SWAP - 2 * FP, SWAP - FP];                                    // earlier frames landing (fixed refresh)
const VRR = [FIXG + FP, D8 + 70, D8 + 96, D8 + 122, T9.frame, T9.lands];                   // frames landing under variable refresh
/** pipeline time: frozen between the hero swap and "the fix" (the picture is paused for inspection) */
const worldT = (G: number) => (G <= SWAP ? G : G <= FIXG ? SWAP : SWAP + (G - FIXG));
const ARR_T = [...PRE, SWAP, ...VRR.map((v) => worldT(v))];                              // every frame card's landing (pipeline time)
const REF_T = [...Array.from({length: 14}).map((_, i) => PASS0 - SP * (13 - i)), ...VRR.map((v) => worldT(v))];

/** frame n of the game: -3..0 before the hero swap (0 = "one frame"), 1 = "the next", 2.. under variable refresh */
const frameOf = (n: number): Fr => (n <= 1
  ? {shipX: 580 + 100 * n, shipY: 425, scroll: 60 * (n + 3)}
  : {shipX: 680, shipY: 425 + 7 * Math.sin(n * 1.9), scroll: 240 + 70 * (n - 1)});

type Band = {y0: number; y1: number; fr: Fr};
type Screen = {bands: Band[]; scan: number | null; scanOp: number; mode: 'fixed' | 'hero' | 'frozen' | 'heal' | 'wait' | 'pass'; tears: number[]; lastLand: number};
const screenAt = (G: number): Screen => {
  if (G < SWAP) {
    const s = mod1((G - PASS0) / SP);
    const idxAt = (time: number) => -3 + PRE.filter((p) => p <= time).length;
    const cuts = [0, s, 1];
    for (const p of PRE) if (p > G - SP && p <= G) cuts.push(mod1((p - PASS0) / SP));
    cuts.sort((a, b) => a - b);
    const bands: Band[] = [], tears: number[] = [];
    let prev: number | null = null;
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i], b = cuts[i + 1];
      if (b - a < 1e-4) continue;
      const y = (a + b) / 2, ty = y <= s ? G - (s - y) * SP : G - (s - y + 1) * SP, n = idxAt(ty);
      if (prev !== null && prev !== n && Math.abs(a - s) > 1e-4) tears.push(a);
      bands.push({y0: a, y1: b, fr: frameOf(n)});
      prev = n;
    }
    return {bands, scan: s, scanOp: 1, mode: 'fixed', tears, lastLand: -999};
  }
  if (G < HERO_END) {
    const s = 0.5 + 0.5 * ((G - SWAP) / (HERO_END - SWAP));
    return {bands: [{y0: 0, y1: 0.5, fr: frameOf(0)}, {y0: 0.5, y1: s, fr: frameOf(1)}, {y0: s, y1: 1, fr: frameOf(0)}], scan: s, scanOp: 1, mode: 'hero', tears: [0.5], lastLand: SWAP};
  }
  if (G < FIXG) return {bands: [{y0: 0, y1: 0.5, fr: frameOf(0)}, {y0: 0.5, y1: 1, fr: frameOf(1)}], scan: 1, scanOp: clamp01(1 - (G - HERO_END) / 8), mode: 'frozen', tears: [0.5], lastLand: SWAP};
  if (G < FIXG + HEAL) {
    const q = inOut((G - FIXG) / HEAL);
    return {bands: [{y0: 0, y1: 0.5, fr: lerpFr(frameOf(0), frameOf(1), q)}, {y0: 0.5, y1: 1, fr: frameOf(1)}], scan: null, scanOp: 0, mode: 'heal', tears: [0.5], lastLand: SWAP};
  }
  const landed = VRR.filter((v) => v <= G).length;
  const last = landed ? VRR[landed - 1] : -999;
  if (landed && G < last + VS) {
    const s = (G - last) / VS;
    return {bands: [{y0: 0, y1: s, fr: frameOf(1 + landed)}, {y0: s, y1: 1, fr: frameOf(landed)}], scan: s, scanOp: 1, mode: 'pass', tears: [], lastLand: last};
  }
  return {bands: [{y0: 0, y1: 1, fr: frameOf(1 + landed)}], scan: 0, scanOp: clamp01((G - FIXG - HEAL) / 8), mode: 'wait', tears: [], lastLand: last};
};

// ---- layout (world px) ------------------------------------------------------------------------------------------------
const MX = 580, MY = 500, MW = 1440, MH = 960;      // monitor body
const SX = 620, SY = 536, SW = 1360, SH = 850;      // its screen
const CXM = SX + SW / 2, CYM = SY + SH / 2;
const LX = 1300, LANE_TOP = MY + MH, LANE_BOT = CARD.y + 4;
const RA = 1500, RA2 = 1680, RB = 1850;             // rows between the monitor and the card
const PL = 590, PR = 1470, PW = 540;                // left / right panel x and width

const Panel: React.FC<{x: number; y: number; w: number; h: number; color: string; glow?: number; dim?: number; children?: React.ReactNode}> = ({x, y, w, h, color, glow = 0, dim = 0, children}) => (
  <g transform={`translate(${x},${y})`} opacity={1 - 0.45 * dim}>
    <rect x={8} y={14} width={w} height={h} rx={24} fill="#000" opacity={0.5} />
    {glow > 0.01 ? <rect x={-10} y={-10} width={w + 20} height={h + 20} rx={32} fill="none" stroke={color} strokeWidth={14} opacity={0.3 * glow} /> : null}
    <rect width={w} height={h} rx={24} fill="#0E0C26" stroke={color} strokeWidth={3.5} />
    <rect x={3} y={3} width={w - 6} height={Math.min(h * 0.5, 90)} rx={22} fill="url(#tw-gloss)" />
    <path d={`M18,44 V30 A12,12 0 0 1 30,18 H44 M${w - 18},${h - 44} V${h - 30} A12,12 0 0 1 ${w - 30},${h - 18} H${w - 44}`} fill="none" stroke={color} strokeWidth={4} opacity={0.8} />
    {children}
  </g>
);

/** a plate that flips (scaleY) from content A to content B */
const flipY = (G: number, at0: number) => {
  const q = clamp01((G - at0) / 9);
  return {sy: Math.max(0.05, Math.abs(Math.cos(q * Math.PI))), b: q > 0.5};
};

const TearScene: React.FC<{G: number}> = ({G}) => {
  const scr = screenAt(G);
  const T = worldT(G);
  const s9 = G >= D8;

  // ---- S08 word reactions
  const pcOn = sp(G, T8.pc, 'settle');
  const gfx = sp(G, T8.graphics, 'settle'), nameP = sp(G, T8.card, 'pop');
  const must = sp(G, T8.must, 'settle'), keep = sp(G, T8.keep, 'settle');
  const say = sp(G, T8.say, 'settle'), makes = sp(G, T8.makes, 'pop');
  const n90 = Math.round(90 * outC((G - T8.n90) / 11)), p90 = sp(G, T8.n90, 'bouncy'), fpsP = sp(G, T8.frames, 'bouncy');
  const n144 = Math.round(144 * outC((G - T8.n144) / 12)), p144 = sp(G, T8.n144, 'bouncy'), hzP = sp(G, T8.hertz, 'bouncy'), monP = sp(G, T8.monitor, 'pop');
  const catches = sp(G, T8.catches, 'pop'), half1 = sp(G, T8.half1, 'pop'), oneP = sp(G, T8.one, 'bouncy'), half2 = sp(G, T8.half2, 'pop'), nextP = sp(G, T8.next, 'bouncy');
  const tearP = sp(G, T8.tearing, 'bouncy');
  // ---- S09 word reactions
  const likeP = sp(G, T9.like, 'pop'), gsP = sp(G, T9.gsync, 'bouncy'), fsP = sp(G, T9.freesync, 'bouncy');
  const waits = sp(G, T9.waits, 'bouncy'), landsP = sp(G, T9.lands, 'bouncy');
  const tagFlip = flipY(G, T9.variable), modeFlip = flipY(G, T9.refresh);
  const vrrOn = sp(G, T9.variable, 'settle');

  // fans: speed up on "must keep up"
  const r1 = Math.max(0, G - T8.must), r2 = Math.max(0, G - T8.keep);
  const fanAng = 5 * G + 5 * (r1 - 10 * (1 - Math.exp(-r1 / 10))) + 6 * (r2 - 10 * (1 - Math.exp(-r2 / 10)));
  const load = 0.15 + 0.4 * must + 0.4 * keep;
  const glow = clamp01(0.12 + 0.2 * pcOn + 0.68 * gfx);

  // frame cards on the lane
  const cards = ARR_T.map((a, i) => ({i, p: 1 - (a - T) / TRAVEL})).filter((c) => c.p > -0.02 && c.p < 1.02);
  const lastLand = [...PRE, SWAP, ...VRR].filter((v) => v <= G).pop() ?? -999;
  const landFlash = decay(G, lastLand, 7);
  const lastEmit = ARR_T.map((a) => a - TRAVEL).filter((e) => e <= T).pop() ?? -999;
  const emitFlash = G > SWAP && G <= FIXG ? decay(G, SWAP, 6) * decay(T, lastEmit, 6) : decay(T, lastEmit, 6);
  const laneOn = clamp01(0.25 + 0.75 * say);
  const cardY = (p: number) => LANE_BOT - 20 - (LANE_BOT - LANE_TOP + 30) * clamp01(p);

  // monitor light
  const syncGreen = s9 ? clamp01(vrrOn) : 0;
  const landGreen = s9 && G >= FIXG + HEAL ? decay(G, scr.lastLand, 10) : 0;
  const rim = Math.max(decay(G, T8.monitor, 9), decay(G, T8.screen, 9), decay(G, T9.monitor, 9), decay(G, T8.n144, 9) * 0.6);
  const scanCol = scr.mode === 'pass' ? GREEN : scr.mode === 'wait' ? AMB : '#EFFFFF';
  const tearY = SY + SH * 0.5;
  const showTear = G >= SWAP && G < FIXG + HEAL;
  const tearFade = G >= FIXG ? clamp01(1 - (G - FIXG) / HEAL) : 1;
  const redK = tearP * tearFade;
  const paused = G >= SWAP && G < FIXG + 6 ? sp(G, SWAP, 'pop') * clamp01(1 - (G - FIXG) / 6) : 0;

  // timing strip
  const stripW = 440, PXT = 7;
  const tickX = (tau: number) => stripW - (T - tau) * PXT;

  // S09 status chip on the screen
  const chip = !s9 || G < T9.waits ? null
    : G >= T9.lands ? {text: 'IN SYNC', col: GREEN, k: landsP}
    : scr.mode === 'pass' ? {text: 'REFRESH', col: GREEN, k: 1}
    : {text: 'WAITING FOR FRAME', col: AMB, k: waits};
  const nextCard = cards.filter((c) => c.p < 1).sort((a, b) => b.p - a.p)[0];
  const eachHot = s9 ? Math.max(sp(G, T9.each, 'pop') * clamp01(1 - (G - T9.frame) / 4), sp(G, T9.moment, 'pop') * clamp01(1 - (G - T9.lands) / 4)) : 0;
  const newTag = s9 && G >= T9.neu && G < T9.frame;
  const green = s9 && vrrOn > 0.5;

  return (
    <svg width={2600} height={4200} style={{overflow: 'visible'}}>
      <defs>
        <GameDefs />
        <CardDefs />
        <linearGradient id="tw-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#07061A" /><stop offset="0.55" stopColor="#15103A" /><stop offset="1" stopColor="#0A0822" /></linearGradient>
        <radialGradient id="tw-biasM"><stop offset="0" stopColor={MAG} stopOpacity="0.5" /><stop offset="1" stopColor={MAG} stopOpacity="0" /></radialGradient>
        <radialGradient id="tw-biasC"><stop offset="0" stopColor={CYAN} stopOpacity="0.42" /><stop offset="1" stopColor={CYAN} stopOpacity="0" /></radialGradient>
        <radialGradient id="tw-biasG"><stop offset="0" stopColor={GREEN} stopOpacity="0.5" /><stop offset="1" stopColor={GREEN} stopOpacity="0" /></radialGradient>
        <radialGradient id="tw-biasR"><stop offset="0" stopColor={RED} stopOpacity="0.5" /><stop offset="1" stopColor={RED} stopOpacity="0" /></radialGradient>
        <linearGradient id="tw-gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id="tw-bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2C2F3C" /><stop offset="0.08" stopColor="#12131A" /><stop offset="1" stopColor="#07080C" /></linearGradient>
        <linearGradient id="tw-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={scanCol} stopOpacity="0" /><stop offset="1" stopColor={scanCol} stopOpacity="0.5" /></linearGradient>
        <linearGradient id="tw-lane" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={green ? GREEN : CYAN} stopOpacity="0.5" /><stop offset="1" stopColor={VIO} stopOpacity="0.16" /></linearGradient>
        <linearGradient id="tw-glint" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.85" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <pattern id="tw-hex" width={120} height={104} patternUnits="userSpaceOnUse">
          <path d="M30,0 L90,0 L120,52 L90,104 L30,104 L0,52 Z" fill="none" stroke="#8B6CFF" strokeWidth={2} opacity={0.16} />
        </pattern>
      </defs>

      {/* ---------------- the wall ---------------- */}
      <rect x={-900} y={-900} width={4400} height={BOARD_TOP + 900} fill="url(#tw-wall)" />
      <rect x={-900} y={-900} width={4400} height={BOARD_TOP + 900} fill="url(#tw-hex)" />
      {[-180, 250, 2350, 2780].map((x, i) => (
        <g key={x}>
          <rect x={x - 46} y={120} width={92} height={1980} rx={46} fill={i % 2 ? CYAN : MAG} opacity={0.07} />
          <rect x={x - 9} y={160} width={18} height={1900} rx={9} fill={i % 2 ? CYAN : MAG} opacity={0.55 + 0.25 * pcOn} />
          <rect x={x - 3} y={170} width={6} height={1880} rx={3} fill="#FFFFFF" opacity={0.85} />
        </g>
      ))}
      {Array.from({length: 9}).map((_, i) => <line key={i} x1={-900} x2={3500} y1={i * 280 - 300} y2={i * 280 - 300} stroke="#000" strokeWidth={5} opacity={0.3} />)}
      <ellipse cx={CXM - 520} cy={CYM} rx={1050} ry={900} fill="url(#tw-biasM)" opacity={0.75} />
      <ellipse cx={CXM + 520} cy={CYM} rx={1050} ry={900} fill="url(#tw-biasC)" opacity={0.75} />
      {landGreen > 0.01 || syncGreen > 0.01 ? <ellipse cx={CXM} cy={CYM + 40} rx={1300} ry={950} fill="url(#tw-biasG)" opacity={0.25 * syncGreen + 0.6 * landGreen} /> : null}
      {redK > 0.01 ? <ellipse cx={CXM} cy={CYM} rx={1300} ry={900} fill="url(#tw-biasR)" opacity={0.55 * redK * (0.6 + 0.4 * decay(G, T8.tearing, 14))} /> : null}

      <Mainboard on={pcOn} t={G} />

      {/* ---------------- the frame lane ---------------- */}
      <rect x={LX - 150} y={LANE_TOP - 10} width={300} height={LANE_BOT - LANE_TOP + 20} fill="#06051A" opacity={0.78} />
      <rect x={LX - 150} y={LANE_TOP - 10} width={300} height={LANE_BOT - LANE_TOP + 20} fill="url(#tw-lane)" opacity={0.3 + 0.5 * laneOn} />
      {[-150, 150].map((dx) => <g key={dx}><line x1={LX + dx} x2={LX + dx} y1={LANE_TOP} y2={LANE_BOT} stroke={CYAN} strokeWidth={12} opacity={0.12 * laneOn} /><line x1={LX + dx} x2={LX + dx} y1={LANE_TOP} y2={LANE_BOT} stroke="#C8F8FF" strokeWidth={3.5} opacity={0.35 + 0.6 * laneOn} /></g>)}
      {[-90, 0, 90].map((dx, k) => <line key={dx} x1={LX + dx} x2={LX + dx} y1={LANE_TOP} y2={LANE_BOT} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" strokeDasharray="22 70" strokeDashoffset={T * 9 + k * 31} opacity={0.3 * laneOn} />)}
      <svg x={LX - 150} y={LANE_TOP + 6} width={300} height={LANE_BOT - LANE_TOP - 6} viewBox={`${LX - 150} ${LANE_TOP + 6} 300 ${LANE_BOT - LANE_TOP - 6}`}>
        {cards.map((c) => {
          const hot = Math.max(fpsP * decay(G, T8.frames, 12), nextCard && c.i === nextCard.i ? eachHot : 0);
          return <FrameThumb key={c.i} x={LX} y={cardY(c.p)} hot={hot} green={green ? 1 : 0} tag={newTag && nextCard && c.i === nextCard.i ? 'NEW' : undefined} />;
        })}
      </svg>

      {/* ---------------- the monitor ---------------- */}
      <rect x={MX + 16} y={MY + 30} width={MW} height={MH} rx={30} fill="#000" opacity={0.6} />
      <rect x={MX} y={MY} width={MW} height={MH} rx={30} fill="url(#tw-bezel)" stroke="#3B3F50" strokeWidth={4} />
      <path d={`M${MX + 30},${MY + 3} H${MX + MW - 30}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.45} />
      <rect x={SX - 6} y={SY - 6} width={SW + 12} height={SH + 12} rx={10} fill="#000" />
      {scr.bands.map((b, i) => (
        <svg key={i} x={SX} y={SY + b.y0 * SH} width={SW} height={(b.y1 - b.y0) * SH} viewBox={`0 ${b.y0 * SH} ${SW} ${(b.y1 - b.y0) * SH}`}>
          <GameFrame fr={b.fr} />
        </svg>
      ))}
      {/* small tears before the hero moment */}
      {scr.mode === 'fixed' ? scr.tears.map((y, i) => <rect key={i} x={SX} y={SY + y * SH - 2} width={SW} height={4} fill="#FFFFFF" opacity={0.45} />) : null}
      {/* scan line */}
      {scr.scan !== null && scr.scanOp > 0.01 ? (
        <g opacity={scr.scanOp}>
          {scr.scan > 0.02 ? <rect x={SX} y={SY + scr.scan * SH - Math.min(110, scr.scan * SH)} width={SW} height={Math.min(110, scr.scan * SH)} fill="url(#tw-scan)" /> : null}
          <rect x={SX} y={SY + scr.scan * SH - 5 - 3 * catches} width={SW} height={10 + 6 * catches} fill={scanCol} opacity={0.35} />
          <rect x={SX} y={SY + scr.scan * SH - 2.5 - catches} width={SW} height={5 + 2 * catches} fill="#FFFFFF" />
          {catches > 0.01 && G < HERO_END + 4 ? (
            <g transform={`translate(${SX + SW - 26},${SY + scr.scan * SH - 34}) scale(${catches})`}>
              <rect x={-196} y={-30} width={196} height={54} rx={27} fill="#FFFFFF" />
              <text x={-98} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={28} fill={INK} letterSpacing={4}>SCAN LINE</text>
            </g>
          ) : null}
        </g>
      ) : null}
      {/* glint on "fix" */}
      {s9 && G >= FIXG && G < FIXG + 18 ? (
        <svg x={SX} y={SY} width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`}>
          <rect x={-520 + (SW + 700) * inOut((G - FIXG) / 18)} y={-200} width={340} height={SH + 400} fill="url(#tw-glint)" transform="skewX(-22)" opacity={0.9} />
        </svg>
      ) : null}
      {/* the two halves */}
      {(half1 > 0.01 || half2 > 0.01) && tearFade > 0.01 ? (
        <g opacity={tearFade}>
          {half1 > 0.01 ? (
            <g>
              <path d={`M${SX + 44},${SY + 118} H${SX + 22} V${SY + 118 + (SH / 2 - 136) * half1} H${SX + 44}`} fill="none" stroke={CYAN} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
              <g transform={`translate(${SX + 70},${SY + 250}) scale(${0.6 + 0.4 * half1})`} opacity={Math.min(1, half1 * 1.6)}>
                <rect x={0} y={-44} width={160} height={84} rx={18} fill={CYAN} /><text x={80} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill={INK}>HALF</text>
                <g transform={`translate(176,0) scale(${oneP})`}>
                  <rect x={0} y={-44} width={330} height={84} rx={18} fill="#0E0C26" stroke={CYAN} strokeWidth={4} />
                  <text x={165} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill="#FFFFFF">ONE FRAME</text>
                </g>
              </g>
            </g>
          ) : null}
          {half2 > 0.01 ? (
            <g>
              <path d={`M${SX + 44},${SY + SH / 2 + 18} H${SX + 22} V${SY + SH / 2 + 18 + (SH / 2 - 60) * half2} H${SX + 44}`} fill="none" stroke={MAG} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
              <g transform={`translate(${SX + 70},${SY + SH / 2 + 250}) scale(${0.6 + 0.4 * half2})`} opacity={Math.min(1, half2 * 1.6)}>
                <rect x={0} y={-44} width={160} height={84} rx={18} fill={MAG} /><text x={80} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill={INK}>HALF</text>
                <g transform={`translate(176,0) scale(${nextP})`}>
                  <rect x={0} y={-44} width={330} height={84} rx={18} fill="#0E0C26" stroke={MAG} strokeWidth={4} />
                  <text x={165} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill="#FFFFFF">THE NEXT</text>
                </g>
              </g>
            </g>
          ) : null}
        </g>
      ) : null}
      {/* the tear line */}
      {showTear ? (
        <g opacity={tearFade}>
          <rect x={SX} y={tearY - 26} width={SW} height={52} fill={RED} opacity={0.3 * redK * (0.55 + 0.45 * Math.cos((G - T8.tearing) * 0.5))} />
          <rect x={SX} y={tearY - 3 - 2 * redK} width={SW} height={6 + 4 * redK} fill={redK > 0.3 ? RED : '#FFFFFF'} opacity={0.75 + 0.25 * redK} />
          {redK > 0.01 ? [0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={SX + 90 + i * 215} y={tearY - 16 + (i % 2) * 20} width={120} height={7} fill={i % 2 ? CYAN : '#FFFFFF'} opacity={0.75 * decay(G, T8.tearing, 9)} />) : null}
          {redK > 0.01 ? (
            <g transform={`translate(${SX + SW - 60},${tearY - 78}) scale(${0.5 + 0.5 * redK})`} opacity={Math.min(1, redK * 1.5)}>
              <rect x={-330} y={-52} width={330} height={96} rx={20} fill={RED} stroke="#FFFFFF" strokeWidth={5} />
              <path d="M-90,42 L-60,74 L-30,42 Z" fill={RED} />
              <path d="M-296,-22 L-270,-4 L-296,14 M-296,-4 H-262" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
              <text x={-136} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={52} fill="#FFFFFF" letterSpacing={3}>TEARING</text>
            </g>
          ) : null}
        </g>
      ) : null}
      {/* paused chip / S09 status chip */}
      {paused > 0.01 ? (
        <g transform={`translate(${CXM},${SY + 66}) scale(${paused})`}>
          <rect x={-150} y={-36} width={300} height={72} rx={36} fill="#0B0920" stroke="#FFFFFF" strokeWidth={4} opacity={0.94} />
          <rect x={-112} y={-17} width={12} height={34} rx={3} fill="#FFFFFF" /><rect x={-90} y={-17} width={12} height={34} rx={3} fill="#FFFFFF" />
          <text x={24} y={13} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={34} fill="#FFFFFF" letterSpacing={6}>PAUSED</text>
        </g>
      ) : null}
      {chip ? (
        <g transform={`translate(${CXM},${SY + 66}) scale(${0.5 + 0.5 * chip.k})`} opacity={Math.min(1, chip.k * 1.6)}>
          <rect x={-250} y={-38} width={500} height={76} rx={38} fill="#0B0920" stroke={chip.col} strokeWidth={5} opacity={0.95} />
          <circle cx={-208} cy={0} r={14} fill={chip.col} /><circle cx={-208} cy={0} r={24} fill={chip.col} opacity={0.3} />
          <text x={22} y={13} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={34} fill="#FFFFFF" letterSpacing={4}>{chip.text}</text>
        </g>
      ) : null}
      {/* glass + rim light */}
      <path d={`M${SX},${SY} H${SX + 520} L${SX + 160},${SY + SH} H${SX} Z`} fill="#FFFFFF" opacity={0.035} />
      {rim > 0.01 ? <rect x={MX - 8} y={MY - 8} width={MW + 16} height={MH + 16} rx={36} fill="none" stroke="#FFFFFF" strokeWidth={10} opacity={0.8 * rim} /> : null}
      {landGreen > 0.01 ? <rect x={MX - 8} y={MY - 8} width={MW + 16} height={MH + 16} rx={36} fill="none" stroke={GREEN} strokeWidth={12} opacity={0.9 * landGreen} /> : null}
      {redK > 0.01 ? <rect x={MX - 8} y={MY - 8} width={MW + 16} height={MH + 16} rx={36} fill="none" stroke={RED} strokeWidth={10} opacity={0.75 * decay(G, T8.tearing, 12) * tearFade} /> : null}
      {/* chin: gate + sync light */}
      <text x={MX + 60} y={MY + MH - 26} fontFamily={MONO} fontWeight={600} fontSize={24} fill="#7C8196" letterSpacing={6}>GAMING MONITOR</text>
      {[0, 1, 2, 3].map((i) => <circle key={i} cx={MX + MW - 70 - i * 44} cy={MY + MH - 34} r={9} fill="#2A2D3A" stroke="#4A4E60" strokeWidth={2} />)}
      <rect x={LX - 170} y={MY + MH - 62} width={340} height={72} rx={16} fill="#0B0C12" stroke="#4A4E60" strokeWidth={3} />
      <rect x={LX - 150} y={MY + MH - 6} width={300} height={12} rx={6} fill={syncGreen > 0.5 ? GREEN : CYAN} opacity={0.5 + 0.5 * landFlash} />
      <circle cx={LX} cy={MY + MH - 28} r={46 + 40 * landFlash} fill={syncGreen > 0.5 ? GREEN : AMB} opacity={0.18 + 0.3 * landFlash} />
      <circle cx={LX} cy={MY + MH - 28} r={15} fill={syncGreen > 0.5 ? GREEN : AMB} stroke="#FFFFFF" strokeWidth={3} />
      <text x={LX - 44} y={MY + MH - 18} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={24} fill="#C9CEDF" letterSpacing={4}>FRAME</text>
      <text x={LX + 44} y={MY + MH - 18} fontFamily={MONO} fontWeight={600} fontSize={24} fill="#C9CEDF" letterSpacing={4}>IN</text>
      <Ripple t={G} at={lastLand} x={LX} y={MY + MH - 10} color={syncGreen > 0.5 ? GREEN : '#FFFFFF'} r={260} />

      {/* ---------------- row A: refresh-rate tag (left) and mode (right) ---------------- */}
      <path d={`M${PL + 150},${RA} V${MY + MH + 6}`} stroke={syncGreen > 0.5 ? GREEN : CYAN} strokeWidth={4} strokeDasharray="6 10" opacity={0.7} />
      <g transform={`translate(${PL + PW / 2},${RA + 75}) scale(${1 + 0.06 * p144 * decay(G, T8.n144, 10)},${tagFlip.sy}) translate(${-PL - PW / 2},${-RA - 75})`}>
        <Panel x={PL} y={RA} w={PW} h={150} color={tagFlip.b ? GREEN : CYAN} glow={Math.max(decay(G, T8.n144, 14), decay(G, T8.hertz, 14), tagFlip.b ? 0.5 + 0.5 * decay(G, T9.variable, 14) : 0)} dim={1.6 * (1 - clamp01((G - T8.n144 + 8) / 8))}>
          <text x={36} y={50} fontFamily={MONO} fontWeight={600} fontSize={24} fill="#A9B0C8" letterSpacing={5}>REFRESH RATE</text>
          {tagFlip.b ? (
            <>
              <text x={36} y={128} fontFamily={FONT} fontWeight={800} fontSize={92} fill={GREEN} letterSpacing={4}>VRR</text>
              <path d="M300,96 q24,-44 48,0 t48,0 t48,0" fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" />
              <text x={PW - 36} y={50} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={24} fill={GREEN} letterSpacing={3}>VARIABLE</text>
            </>
          ) : (
            <>
              <text x={36} y={132} fontFamily={FONT} fontWeight={800} fontSize={104} fill="#FFFFFF" letterSpacing={-2} style={{fontVariantNumeric: 'tabular-nums'}}>{G >= T8.n144 ? n144 : '---'}</text>
              <g transform={`translate(330,130) scale(${G >= T8.hertz ? 0.4 + 0.6 * hzP : 1})`} opacity={G >= T8.hertz ? 1 : 0.3}>
                <rect x={0} y={-74} width={150} height={84} rx={18} fill={CYAN} /><text x={75} y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={60} fill={INK}>Hz</text>
              </g>
            </>
          )}
        </Panel>
      </g>
      <g transform={`translate(${PR + PW / 2},${RA + 75}) scale(1,${modeFlip.sy}) translate(${-PR - PW / 2},${-RA - 75})`}>
        <Panel x={PR} y={RA} w={PW} h={150} color={modeFlip.b ? GREEN : AMB} glow={Math.max(decay(G, T8.monitor, 14), modeFlip.b ? 0.5 + 0.5 * decay(G, T9.refresh, 14) : 0)} dim={1.6 * (1 - clamp01((G - T8.n144 + 8) / 8)) + 0.5 * (1 - clamp01((G - T8.monitor + 4) / 6))}>
          <text x={36} y={50} fontFamily={MONO} fontWeight={600} fontSize={24} fill="#A9B0C8" letterSpacing={5}>MODE</text>
          <g transform={`translate(36,118) scale(${G < T8.monitor ? 1 : 0.7 + 0.3 * monP})`}>
            <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={modeFlip.b ? 48 : 56} fill={modeFlip.b ? GREEN : AMB} letterSpacing={1}>{modeFlip.b ? 'VARIABLE REFRESH' : 'FIXED REFRESH'}</text>
          </g>
        </Panel>
      </g>

      {/* ---------------- row A2 (S09): the two names ---------------- */}
      {[{x: PL, k: gsP, at0: T9.gsync, text: 'G-SYNC'}, {x: PR, k: fsP, at0: T9.freesync, text: 'FREESYNC'}].map((b) => (
        <g key={b.text}>
          {likeP > 0.01 ? <rect x={b.x + 8} y={RA2 + 8} width={PW - 16} height={104} rx={52} fill="none" stroke={GREEN} strokeWidth={4} strokeDasharray="14 12" opacity={0.6 * likeP * (1 - 0.8 * clamp01(b.k))} /> : null}
          {b.k > 0.01 ? (
            <g transform={`translate(${b.x + PW / 2},${RA2 + 60}) scale(${0.4 + 0.6 * b.k})`} opacity={Math.min(1, b.k * 1.6)}>
              <rect x={-PW / 2 + 8} y={-40} width={PW} height={104} rx={52} fill="#000" opacity={0.5} />
              <rect x={-PW / 2} y={-52} width={PW} height={104} rx={52} fill="#FFFFFF" stroke={GREEN} strokeWidth={7} />
              <circle cx={-PW / 2 + 56} cy={0} r={28} fill={GREEN} /><path d={`M${-PW / 2 + 43},1 l9,10 l17,-20`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
              <text x={30} y={24} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={66} fill={INK} letterSpacing={3}>{b.text}</text>
            </g>
          ) : null}
          <Burst t={G} at={b.at0} x={b.x + PW / 2} y={RA2 + 60} color={GREEN} n={14} r={230} />
        </g>
      ))}

      {/* ---------------- row B left: timing strip ---------------- */}
      <Panel x={PL} y={RB} w={PW} h={350} color={green ? GREEN : VIO} glow={Math.max(decay(G, T8.keep, 14), landGreen)}>
        <text x={36} y={56} fontFamily={MONO} fontWeight={600} fontSize={26} fill="#A9B0C8" letterSpacing={6}>TIMING</text>
        <text x={PW - 36} y={56} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={24} fill={green ? GREEN : G >= T8.monitor ? AMB : '#5F6480'} letterSpacing={3}>{green ? 'IN STEP' : 'OUT OF STEP'}</text>
        {[{y: 112, label: 'SCREEN REFRESH', list: REF_T, col: green ? GREEN : CYAN}, {y: 224, label: 'NEW FRAME', list: ARR_T, col: green ? GREEN : MAG}].map((row) => (
          <g key={row.label} transform={`translate(50,${row.y})`}>
            <text x={0} y={-12} fontFamily={MONO} fontWeight={600} fontSize={22} fill={row.col} letterSpacing={4}>{row.label}</text>
            <rect x={0} y={0} width={stripW} height={64} rx={12} fill="#06051A" stroke="#3A3660" strokeWidth={2.5} />
            {row.list.filter((tau) => tau <= T && tickX(tau) > 10).map((tau, i) => {
              const age = T - tau, pop = 1 + 0.9 * Math.exp(-age / 4);
              return <rect key={i} x={tickX(tau) - 7} y={32 - 22 * pop} width={14} height={44 * pop} rx={7} fill={row.col} opacity={0.5 + 0.5 * Math.exp(-age / 30)} />;
            })}
            <rect x={stripW - 4} y={-6} width={4} height={76} fill="#FFFFFF" opacity={0.8} />
          </g>
        ))}
        <text x={50} y={326} fontFamily={MONO} fontSize={22} fill="#7C8196" letterSpacing={3}>slow motion</text>
      </Panel>

      {/* ---------------- row B right: output counter ---------------- */}
      <Panel x={PR} y={RB} w={PW} h={350} color={MAG} glow={Math.max(decay(G, T8.say, 14), decay(G, T8.n90, 16))} dim={1 - say}>
        <text x={36} y={56} fontFamily={MONO} fontWeight={600} fontSize={26} fill="#A9B0C8" letterSpacing={6}>CARD OUTPUT</text>
        <circle cx={PW - 50} cy={46} r={11} fill={MAG} opacity={0.3 + 0.7 * Math.max(emitFlash, makes * 0.4)} />
        <g transform={`translate(40,232) scale(${0.85 + 0.15 * p90})`}>
          <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={190} fill={G >= T8.n90 ? '#FFFFFF' : '#3A3660'} letterSpacing={-4} style={{fontVariantNumeric: 'tabular-nums'}}>{G >= T8.n90 ? n90 : '00'}</text>
        </g>
        <g transform={`translate(${PW - 130},176) scale(${G >= T8.frames ? 0.4 + 0.6 * fpsP : 1})`} opacity={G >= T8.frames ? 1 : 0.25}>
          <rect x={-96} y={-52} width={192} height={96} rx={22} fill={MAG} /><text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={64} fill={INK}>FPS</text>
        </g>
        <text x={PW - 34} y={258} textAnchor="end" fontFamily={MONO} fontSize={21} fill="#A9B0C8" letterSpacing={1}>frames / second</text>
        <text x={40} y={300} fontFamily={MONO} fontWeight={600} fontSize={22} fill="#A9B0C8" letterSpacing={4}>LOAD</text>
        {Array.from({length: 12}).map((_, i) => {
          const on = i < Math.round(2 + 4 * must + 5 * keep);
          return <rect key={i} x={130 + i * 31} y={280} width={24} height={26} rx={5} fill={on ? (i > 8 ? AMB : MAG) : '#2A2650'} />;
        })}
      </Panel>
      <path d={`M${PR + 60},${RB + 350} V${CARD.y - 14}`} stroke={MAG} strokeWidth={4} strokeDasharray="6 10" opacity={0.7} />

      {/* ---------------- the graphics card ---------------- */}
      <GraphicsCard ang={fanAng} glow={glow} load={load} name={nameP} flash={decay(G, T8.card, 9) * 0.9 + decay(G, T8.graphics, 9) * 0.5} />
      {/* frame mouth on the card's top edge */}
      <rect x={LX - 176} y={CARD.y - 22} width={352} height={50} rx={14} fill="#0B0C12" stroke="#5A6177" strokeWidth={3} />
      <rect x={LX - 150} y={CARD.y - 8} width={300} height={14} rx={7} fill="#FFFFFF" opacity={0.25 + 0.75 * Math.max(emitFlash, laneOn * 0.3)} />
      <rect x={LX - 170} y={CARD.y - 30} width={340} height={56} rx={20} fill={CYAN} opacity={0.4 * emitFlash} />
      <Burst t={G} at={T8.makes} x={LX} y={CARD.y - 10} color="#C8F8FF" n={14} r={200} />
      <Burst t={G} at={T8.n90} x={PR + 200} y={RB + 170} color={MAG} n={16} r={260} />
      <Ripple t={G} at={T8.card} x={CARD.x + CARD.w / 2} y={CARD.y + CARD.h / 2} color={CYAN} r={900} />
      <Burst t={G} at={T9.lands} x={LX} y={MY + MH - 20} color={GREEN} n={20} r={320} />
    </svg>
  );
};

// ---- world definitions ------------------------------------------------------------------------------------------------
const PALETTE = {bg0: '#06051A', bg1: '#1A1244', particles: '#B7A6FF', glow: '#8B6CFF'};
const mk8 = (screenY: number): WorldDef => ({
  id: 'tear', home: 'card',
  anchors: {
    card: {x: 1300, y: 2590, zoom: 0.63},
    monitor: {x: 1300, y: 1330, zoom: 0.6},
    screen: {x: CXM, y: screenY, zoom: 0.66},
  },
  aliases: {pc: 'card', graphics: 'card', '144': 'monitor', hertz: 'monitor'},
  palette: PALETTE,
  Draw: ({t}: WorldDrawProps) => <TearScene G={t} />,
});
const camEnd = (def: WorldDef, beats: Beat[], dur: number) => camState(dur, direct(beats, def), 1);
// S09 opens on S08's exact final framing: the engine's opening push starts at (home.y + 30, 0.9 x zoom), so the S09 home
// is derived from S08's last camera state. It then only pushes in slowly (no anchor words in S09).
const mk9 = (e8: {x: number; y: number; s: number}): WorldDef => ({
  id: 'sync', home: 'hold',
  anchors: {hold: {x: e8.x, y: e8.y - 30, zoom: e8.s / 0.9}},
  palette: PALETTE,
  Draw: ({t}: WorldDrawProps) => <TearScene G={D8 + t} />,
});
// choose the S08 screen anchor so the monitor centre ends S09 exactly on the frame centre (S10 irises from 0.5, 0.5)
const SCREEN_Y = (() => {
  const guess = CYM + 113;
  const e9 = camEnd(mk9(camEnd(mk8(guess), B8, D8)), B9, D9);
  return guess + (CYM + (1920 * 0.03) / e9.s - e9.y);
})();
export const S08 = mk8(SCREEN_Y);
export const S09 = mk9(camEnd(S08, B8, D8));
