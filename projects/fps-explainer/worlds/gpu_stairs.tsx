// S10 "Diminishing stairs" - the LIGHT act. A porcelain evidence card on a lilac lab table: three pillars drawn to
// scale (height = frame time: 60 Hz 16.7 ms, 120 Hz 8.3 ms, 144 Hz 6.9 ms; 60 px per ms). The step 60 -> 120 is
// huge (-8.3 ms), the step 120 -> 144 is tiny (-1.4 ms). On "esports monitors now hit 600" a sleek generic monitor
// rises from behind the card with a 600 Hz badge and ends on the frame centre (S11 opens with a portal from there).
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {Burst} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const outC = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const decay = (t: number, at: number, d = 8) => (t >= at ? Math.exp(-(t - at) / d) : 0);
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const cl = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

const INK = '#141B33', MUTE = '#66708C', MARK = '#FFD84D', BLUE = '#2F6BFF', VIO = '#7A4DFF', TEAL = '#0FB5A2';
const id = 's10';

// ---- geometry: 60 px per millisecond ----
const BY = 3000, MS = 80, PX0 = 500, PWD = 530, DX = 64, DY = -46;
const PILLARS = [
  {hz: '60', ms: '16.7', v: 16.7, col: BLUE},
  {hz: '120', ms: '8.3', v: 8.3, col: VIO},
  {hz: '144', ms: '6.9', v: 6.9, col: TEAL},
].map((p, i) => ({...p, x: PX0 + i * PWD, top: BY - p.v * MS}));
const [PA, PB, PC] = PILLARS;
const PLX = 380, PLY = 1330, PLW = 1840, PLH = 2150;      // the evidence card
const MON = {x: 480, y: 400, w: 1640, h: 880};            // the esports monitor (final position)
const MCX = MON.x + MON.w / 2, MCY = MON.y + MON.h / 2;
// ball rests on each pillar's top face
const rest = (p: {x: number; top: number}) => [p.x + PWD / 2 + DX / 2, p.top + DY / 2 - 40] as const;

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const W = (word: string, d: number, nth = 0) => beats.filter((b) => cl(b.word || b.w || '') === word)[nth]?.t ?? d;
  const tEach = W('each', 8.5), tJump = W('jump', 15), tGives = W('gives', 21.5), tLess = W('less', 29);
  const t60 = W('60', 58.5), t120 = W('120', 72.5), tSaves = W('saves', 87), t8 = W('8', 97.5), tMs = W('milliseconds', 103), tFrame = W('frame', 120.5);
  const t120b = W('120', 139.5, 1), t144 = W('144', 161), tUnder = W('under', 192), tOne = W('one', 199), tHalf = W('half', 208.5);
  const tYet = W('yet', 238), tEsp = W('esports', 244.5), tMon = W('monitors', 257.5), tNow = W('now', 267.5), tHit = W('hit', 272), t600 = W('600', 277);

  // pillars light on their words
  const lit = [Math.max(sp(t, t60, 'settle'), 0.4 + 0.3 * sp(t, tEach, 'settle')), Math.max(sp(t, t120, 'settle'), 0.4 + 0.3 * sp(t, tEach + 2.5, 'settle')), Math.max(sp(t, t144, 'settle'), 0.4 + 0.3 * sp(t, tEach + 5, 'settle'))];
  const flash = [Math.max(decay(t, t60, 9), decay(t, tEach, 7)), Math.max(decay(t, t120, 9), decay(t, t120b, 9), decay(t, tEach + 2.5, 7)), Math.max(decay(t, t144, 9), decay(t, tEach + 5, 7))];

  // the ball hops down the steps: "jump" (big drop) and "less" (tiny drop)
  const [ax, ay] = rest(PA), [bx, by] = rest(PB), [cx, cy] = rest(PC);
  const q1 = clamp01((t - tJump) / 12), q2 = clamp01((t - tLess) / 9);
  const hop = (x0: number, y0: number, x1: number, y1: number, h: number, q: number) => [lerp(x0, x1, q), lerp(y0, y1, q * q) - 4 * h * q * (1 - q)] as const;
  const [ballX, ballY] = q2 > 0 ? hop(bx, by, cx, cy, 70, q2) : hop(ax, ay, bx, by, 190, q1);
  const land1 = decay(t, tJump + 12, 5), land2 = decay(t, tLess + 9, 5), squash = Math.max(land1, land2) * 0.28;
  const trail = (x0: number, y0: number, x1: number, y1: number, h: number, q: number, col: string) =>
    Array.from({length: 13}).map((_, i) => {
      const u = (i + 0.5) / 13;
      if (u > q) return null;
      const [x, y] = hop(x0, y0, x1, y1, h, u);
      return <circle key={i} cx={x} cy={y} r={7} fill={col} opacity={0.5 * clamp01(1 - (t - tLess - 14) / 12)} />;
    });

  // big step
  const saves = sp(t, tSaves, 'settle'), p8 = sp(t, t8, 'bouncy'), msP = sp(t, tMs, 'bouncy'), frameP = sp(t, tFrame, 'bouncy');
  const v8 = (8.3 * outC((t - t8) / 9)).toFixed(1);
  const sweep1 = outC((t - tMs) / 12);
  // small step
  const under = sp(t, tUnder, 'settle'), pOne = sp(t, tOne, 'bouncy'), pHalf = sp(t, tHalf, 'bouncy');
  const v1 = (1.4 * outC((t - tOne) / 8)).toFixed(1);
  const sweep2 = outC((t - tHalf) / 10);
  // esports monitor
  const rise = ((q: number) => (q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2))(clamp01((t - tEsp - 8) / 40)), power = sp(t, tMon, 'settle'), nowP = sp(t, tNow, 'pop'), hit = sp(t, tHit, 'pop'), p600 = sp(t, t600, 'bouncy');
  // "yet": the ball does a little surprised hop on the last step
  const yetHop = t > tYet && t < tYet + 10 ? 90 * Math.sin(((t - tYet) / 10) * Math.PI) : 0;
  const n600 = Math.round(lerp(144, 600, outC((t - t600) / 9)));
  const monDy = (1 - rise) * 1080;

  const dimX1 = PB.x + DX + 44, dimX2 = PC.x + DX + 44;
  const barX = 800, barS = 120;

  return (
    <svg width={2600} height={3700} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${id}-sh`}><stop offset="0" stopColor="#1B2244" stopOpacity="0.34" /><stop offset="1" stopColor="#1B2244" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-halo`}><stop offset="0" stopColor="#FFFFFF" stopOpacity="1" /><stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.5" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E6EAF4" /></linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B9C2D8" /><stop offset="1" stopColor="#D5DBEA" /></linearGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor="#8D95AA" /><stop offset="0.55" stopColor="#E3E7F0" /><stop offset="1" stopColor="#6B7286" /></linearGradient>
        <radialGradient id={`${id}-ball`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.25" stopColor="#8FB2FF" /><stop offset="1" stopColor="#1E4FE0" /></radialGradient>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A3F52" /><stop offset="0.1" stopColor="#171A26" /><stop offset="1" stopColor="#0B0D16" /></linearGradient>
        <linearGradient id={`${id}-scr`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1B0F4A" /><stop offset="0.5" stopColor="#3C1B8F" /><stop offset="1" stopColor="#0F2C7A" /></linearGradient>
        <radialGradient id={`${id}-rgb`}><stop offset="0" stopColor="#8B6CFF" stopOpacity="0.55" /><stop offset="0.6" stopColor="#FF6FD8" stopOpacity="0.18" /><stop offset="1" stopColor="#FF6FD8" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-bar1`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={BLUE} /><stop offset="1" stopColor={VIO} /></linearGradient>
        {PILLARS.map((p, i) => (
          <linearGradient key={i} id={`${id}-tint${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.col} stopOpacity="0.2" /><stop offset="1" stopColor={p.col} stopOpacity="0" /></linearGradient>
        ))}
      </defs>

      {/* ---------------- lab table ---------------- */}
      <ellipse cx={1300} cy={2200} rx={2100} ry={2300} fill={`url(#${id}-halo)`} opacity={0.8} />
      {Array.from({length: 24}).map((_, i) => <line key={`h${i}`} x1={-900} x2={3500} y1={i * 200 - 500} y2={i * 200 - 500} stroke="#7C83B5" strokeWidth={2} opacity={0.15} />)}
      {Array.from({length: 23}).map((_, i) => <line key={`v${i}`} y1={-700} y2={4200} x1={i * 200 - 900} x2={i * 200 - 900} stroke="#7C83B5" strokeWidth={2} opacity={0.15} />)}
      {Array.from({length: 36}).map((_, i) => {
        const x = Math.round(rnd(i * 1.7) * 20) * 200 - 700, y = Math.round(rnd(i * 3.9 + 2) * 22) * 200 - 500;
        return <g key={`r${i}`} opacity={0.4}><line x1={x - 16} x2={x + 16} y1={y} y2={y} stroke="#5E6699" strokeWidth={3} /><line x1={x} x2={x} y1={y - 16} y2={y + 16} stroke="#5E6699" strokeWidth={3} /></g>;
      })}
      <circle cx={MCX} cy={MCY} r={900} fill="none" stroke="#7C83B5" strokeWidth={2} strokeDasharray="6 14" opacity={0.35} />

      {/* ---------------- esports monitor (rises from behind the card) ---------------- */}
      {rise > 0.005 ? (
        <g transform={`translate(0,${monDy})`}>
          <ellipse cx={MCX} cy={MCY} rx={1150} ry={760} fill={`url(#${id}-rgb)`} opacity={0.35 + 0.65 * power} />
          {/* neck */}
          <path d={`M${MCX - 70},${MON.y + MON.h - 10} L${MCX - 110},${MON.y + MON.h + 900} H${MCX + 110} L${MCX + 70},${MON.y + MON.h - 10} Z`} fill={`url(#${id}-chrome)`} stroke="#59607A" strokeWidth={3} />
          <rect x={MCX - 24} y={MON.y + MON.h} width={48} height={900} fill={BLUE} opacity={0.5 * power} />
          <rect x={MON.x + 20} y={MON.y + 34} width={MON.w} height={MON.h} rx={30} fill="#1B2244" opacity={0.3} />
          <rect x={MON.x} y={MON.y} width={MON.w} height={MON.h} rx={30} fill={`url(#${id}-bezel)`} stroke="#4A5068" strokeWidth={4} />
          <path d={`M${MON.x + 30},${MON.y + 3} H${MON.x + MON.w - 30}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
          <svg x={MON.x + 22} y={MON.y + 22} width={MON.w - 44} height={MON.h - 80} viewBox={`0 0 ${MON.w - 44} ${MON.h - 80}`}>
            <rect width={MON.w - 44} height={MON.h - 80} fill="#080A14" />
            <g opacity={0.15 + 0.85 * power}>
              <rect width={MON.w - 44} height={MON.h - 80} fill={`url(#${id}-scr)`} />
              {/* speed streaks */}
              {Array.from({length: 26}).map((_, i) => {
                const y = 20 + rnd(i * 2.7) * (MON.h - 120), len = 120 + rnd(i * 5.3) * 380, sp0 = 22 + rnd(i * 9.1) * 40 + 30 * nowP;
                const x = ((rnd(i * 7.7) * 1800 - t * sp0) % 1800 + 1800) % 1800 - 300;
                return <rect key={i} x={x} y={y} width={len} height={3 + rnd(i) * 5} rx={3} fill={i % 3 ? '#9DC2FF' : '#FF8FE0'} opacity={0.25 + 0.5 * rnd(i * 3)} />;
              })}
              {/* arena floor lines */}
              {Array.from({length: 9}).map((_, i) => <line key={i} x1={(MON.w - 44) / 2} y1={250} x2={(i - 4) * 420 + (MON.w - 44) / 2} y2={MON.h - 80} stroke="#7DA2FF" strokeWidth={3} opacity={0.3} />)}
              {/* crosshair */}
              <g transform={`translate(${(MON.w - 44) / 2},${(MON.h - 80) / 2}) scale(${1.5 - 0.5 * hit})`} opacity={(1 - 0.85 * p600) * (0.5 + 0.5 * hit)}>
                <circle r={120} fill="none" stroke="#FFFFFF" strokeWidth={6} /><circle r={8} fill="#FF4F6D" />
                <path d="M-170,0H-70M70,0H170M0,-170V-70M0,70V170" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
              </g>
              <text x={36} y={56} fontFamily={MONO} fontWeight={600} fontSize={30} fill="#C9D6FF" letterSpacing={6}>ESPORTS MODE</text>
              <rect x={MON.w - 44 - 250} y={30} width={214} height={14} rx={7} fill="#2B2F66" /><rect x={MON.w - 44 - 250} y={30} width={214 * (0.3 + 0.7 * nowP)} height={14} rx={7} fill="#5CF0FF" />
            </g>
            {/* 600 Hz badge */}
            {p600 > 0.01 ? (
              <g transform={`translate(${(MON.w - 44) / 2},${(MON.h - 80) / 2}) scale(${1.8 - 0.8 * p600})`} opacity={Math.min(1, p600 * 1.6)}>
                <rect x={-470} y={-170} width={940} height={340} rx={60} fill="#FFFFFF" />
                <rect x={-470} y={-170} width={940} height={340} rx={60} fill="none" stroke={MARK} strokeWidth={14} />
                <text x={-430} y={100} fontFamily={FONT} fontWeight={800} fontSize={290} fill={INK} letterSpacing={-8} style={{fontVariantNumeric: 'tabular-nums'}}>{n600}</text>
                <rect x={170} y={-90} width={250} height={190} rx={40} fill={BLUE} />
                <text x={295} y={48} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={130} fill="#FFFFFF">Hz</text>
              </g>
            ) : null}
            <path d={`M0,0 H460 L140,${MON.h - 80} H0 Z`} fill="#FFFFFF" opacity={0.05} />
          </svg>
          <text x={MCX} y={MON.y + MON.h - 22} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill="#8A91AC" letterSpacing={8}>ESPORTS MONITOR</text>
          <circle cx={MON.x + MON.w - 60} cy={MON.y + MON.h - 30} r={8} fill={power > 0.5 ? '#3DFFA2' : '#4A5068'} />
          {decay(t, t600, 10) > 0.01 ? <rect x={MON.x - 10} y={MON.y - 10} width={MON.w + 20} height={MON.h + 20} rx={38} fill="none" stroke={MARK} strokeWidth={14} opacity={decay(t, t600, 10)} /> : null}
        </g>
      ) : null}
      {/* ---------------- the evidence card ---------------- */}
      <ellipse cx={PLX + PLW / 2 + 30} cy={PLY + PLH + 50} rx={PLW * 0.56} ry={110} fill={`url(#${id}-sh)`} />
      <rect x={PLX + 20} y={PLY + 20} width={PLW} height={PLH} rx={56} fill="#9DA5C2" />
      <rect x={PLX + 10} y={PLY + 10} width={PLW} height={PLH} rx={56} fill="#C3C9DC" />
      <rect x={PLX} y={PLY} width={PLW} height={PLH} rx={56} fill="#FBFCFF" stroke="#FFFFFF" strokeWidth={4} />
      <rect x={PLX + 4} y={PLY + 4} width={PLW - 8} height={300} rx={54} fill={`url(#${id}-gloss)`} />
      {/* title: on the card's right, below the caption band at every framing */}
      <rect x={2120 - 150} y={1836} width={158 * outC((t - tLess) / 8)} height={64} rx={10} fill={MARK} />
      <text x={2120} y={1816} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={60} fill={INK}>Each jump</text>
      <text x={2120} y={1886} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={60} fill={INK}>gives less</text>
      <text x={PLX + PLW - 80} y={BY + 62} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={26} fill={MUTE} letterSpacing={5}>DRAWN TO SCALE</text>
      {/* axis */}
      <line x1={452} y1={BY} x2={452} y2={BY - 17.6 * MS} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d={`M440,${BY - 17.6 * MS + 20} L452,${BY - 17.6 * MS - 6} L464,${BY - 17.6 * MS + 20}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      {Array.from({length: 17}).map((_, i) => <line key={i} x1={i % 5 === 0 ? 432 : 440} x2={452} y1={BY - i * MS} y2={BY - i * MS} stroke={INK} strokeWidth={i % 5 === 0 ? 5 : 3} opacity={0.75} />)}
      <text transform={`translate(424,${BY - 520}) rotate(-90)`} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={MUTE} letterSpacing={5}>TIME PER FRAME (ms)</text>
      {/* floor */}
      <ellipse cx={1340} cy={BY + 26} rx={1000} ry={70} fill={`url(#${id}-sh)`} opacity={0.8} />
      <line x1={452} y1={BY} x2={2200} y2={BY} stroke={INK} strokeWidth={5} strokeLinecap="round" />

      {/* ---------------- the pillars (to scale) ---------------- */}
      {PILLARS.map((p, i) => {
        const nextTop = i < 2 ? PILLARS[i + 1].top : BY;
        const L = lit[i], F = flash[i];
        return (
          <g key={p.hz}>
            {/* riser (right side) */}
            <path d={`M${p.x + PWD},${p.top} L${p.x + PWD + DX},${p.top + DY} V${nextTop + DY} L${p.x + PWD},${nextTop} Z`} fill={`url(#${id}-side)`} stroke="#AEB6CC" strokeWidth={2} />
            {/* top */}
            <path d={`M${p.x},${p.top} H${p.x + PWD} L${p.x + PWD + DX},${p.top + DY} H${p.x + DX} Z`} fill="#FFFFFF" stroke="#C9CFE0" strokeWidth={2} />
            <path d={`M${p.x},${p.top} H${p.x + PWD} L${p.x + PWD + DX},${p.top + DY} H${p.x + DX} Z`} fill={p.col} opacity={0.1 + 0.3 * L} />
            {/* front */}
            <rect x={p.x} y={p.top} width={PWD} height={BY - p.top} fill={`url(#${id}-face)`} stroke="#C9CFE0" strokeWidth={2} />
            <rect x={p.x} y={p.top} width={PWD} height={Math.min(BY - p.top, 420)} fill={`url(#${id}-tint${i})`} opacity={0.3 + 0.7 * L} />
            <rect x={p.x} y={p.top} width={PWD} height={12} fill={p.col} opacity={0.35 + 0.65 * L} />
            <rect x={p.x} y={p.top + 12} width={46} height={BY - p.top - 12} fill="#FFFFFF" opacity={0.7} />
            {Array.from({length: Math.floor(p.v)}).map((_, k) => <line key={k} x1={p.x + PWD - 30} x2={p.x + PWD - 8} y1={BY - (k + 1) * MS} y2={BY - (k + 1) * MS} stroke={p.col} strokeWidth={3} opacity={0.45} />)}
            {F > 0.01 ? <rect x={p.x} y={p.top} width={PWD} height={BY - p.top} fill={p.col} opacity={0.22 * F} /> : null}
            {F > 0.01 ? <rect x={p.x - 6} y={p.top - 6} width={PWD + 12} height={BY - p.top + 6} fill="none" stroke={p.col} strokeWidth={10} opacity={0.7 * F} /> : null}
            {/* labels */}
            <g transform={`translate(${p.x + 56},${p.top + 170}) scale(${1 + 0.08 * F})`}>
              <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={148} fill={L > 0.55 ? INK : '#A9B1C8'} letterSpacing={-4}>{p.hz}</text>
              <text x={p.hz.length * 86 + 12} y={0} fontFamily={FONT} fontWeight={700} fontSize={56} fill={L > 0.55 ? p.col : '#A9B1C8'}>Hz</text>
            </g>
            <g transform={`translate(${p.x + 56},${p.top + 214})`}>
              <rect width={280} height={84} rx={18} fill={L > 0.55 ? p.col : '#E3E7F2'} />
              <text x={140} y={58} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={48} fill={L > 0.55 ? '#FFFFFF' : '#8E97B2'}>{p.ms} ms</text>
            </g>
          </g>
        );
      })}
      {/* formula + compare strip fade out as the camera leaves the big step (safe area: in the later, wider framings
          they sat under the app's @username / description rows) */}
      <g opacity={1 - clamp01((t - (t144 - 6)) / 10)}>
        <text x={PX0} y={BY + 62} fontFamily={MONO} fontWeight={600} fontSize={34} fill={INK} letterSpacing={2}>frame time = 1000 / Hz</text>
        <rect x={PX0 - 6} y={BY + 74} width={476 * outC((t - tGives) / 12)} height={10} rx={5} fill={MARK} />
      </g>

      {/* ---------------- big step: 60 -> 120 saves 8.3 ms ---------------- */}
      <line x1={PB.x + DX + 10} x2={PB.x + PWD + DX} y1={PA.top + DY} y2={PA.top + DY} stroke={MUTE} strokeWidth={3} strokeDasharray="10 10" opacity={0.7 * saves} />
      {saves > 0.01 ? (
        <g>
          <line x1={dimX1} x2={dimX1} y1={PA.top + DY + 14} y2={PA.top + DY + 14 + (PB.top - PA.top - 28) * saves} stroke={BLUE} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${dimX1 - 20},${PA.top + DY + 40} L${dimX1},${PA.top + DY + 12} L${dimX1 + 20},${PA.top + DY + 40}`} fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M${dimX1 - 20},${PB.top + DY - 40} L${dimX1},${PB.top + DY - 12} L${dimX1 + 20},${PB.top + DY - 40}`} fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={saves > 0.9 ? 1 : 0} />
          <g transform={`translate(${dimX1 + 44},${PA.top + 150}) scale(${0.6 + 0.4 * saves})`} opacity={Math.min(1, saves * 1.6)}>
            <rect x={0} y={-46} width={210} height={64} rx={32} fill={BLUE} /><text x={105} y={-2} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={34} fill="#FFFFFF" letterSpacing={5}>SAVES</text>
          </g>
        </g>
      ) : null}
      <g transform={`translate(${dimX1 + 40},${PA.top + 400})`}>
        <rect x={-8} y={-30} width={500 * sweep1} height={60} rx={10} fill={MARK} />
        {p8 > 0.01 ? (
          <g transform={`scale(${0.6 + 0.4 * p8})`} opacity={Math.min(1, p8 * 1.6)}>
            <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={210} fill={INK} letterSpacing={-6} style={{fontVariantNumeric: 'tabular-nums'}}>−{v8}</text>
          </g>
        ) : null}
        <g transform={`translate(0,112) scale(${msP})`} opacity={msP > 0.01 ? 1 : 0}>
          <rect x={0} y={-58} width={150} height={78} rx={18} fill={INK} /><text x={75} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={58} fill="#FFFFFF">ms</text>
        </g>
        <g transform={`translate(170,112) scale(${frameP})`} opacity={frameP > 0.01 ? 1 : 0}>
          <text x={0} y={-2} fontFamily={FONT} fontWeight={700} fontSize={52} fill={INK}>per frame</text>
        </g>
      </g>

      {/* ---------------- small step: 120 -> 144 saves 1.4 ms ---------------- */}
      <line x1={PC.x + DX + 10} x2={PC.x + PWD + DX} y1={PB.top + DY} y2={PB.top + DY} stroke={MUTE} strokeWidth={3} strokeDasharray="10 10" opacity={0.7 * under} />
      {under > 0.01 ? (
        <g>
          <line x1={dimX2} x2={dimX2} y1={PB.top + DY + 4} y2={PB.top + DY + 4 + (PC.top - PB.top - 8) * under} stroke={TEAL} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${dimX2 - 22},${PB.top + DY} H${dimX2 + 22} M${dimX2 - 22},${PC.top + DY} H${dimX2 + 22}`} stroke={TEAL} strokeWidth={9} strokeLinecap="round" opacity={under} />
          <path d={`M${dimX2 + 30},${(PB.top + PC.top) / 2 + DY} C${dimX2 + 90},${(PB.top + PC.top) / 2 + DY} ${dimX2 + 60},${PB.top - 110} ${dimX2 + 110},${PB.top - 120}`} fill="none" stroke={TEAL} strokeWidth={5} strokeDasharray="8 9" opacity={under} />
          <g transform={`translate(${dimX2 + 60},${PB.top - 300}) scale(${0.6 + 0.4 * under})`} opacity={Math.min(1, under * 1.6)}>
            <rect x={0} y={-46} width={210} height={64} rx={32} fill={TEAL} /><text x={105} y={-2} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={34} fill="#FFFFFF" letterSpacing={5}>UNDER</text>
          </g>
        </g>
      ) : null}
      <g transform={`translate(${dimX2 + 60},${PB.top - 110})`}>
        <rect x={-8} y={-26} width={376 * sweep2} height={46} rx={10} fill={MARK} />
        {pOne > 0.01 ? (
          <g transform={`scale(${0.6 + 0.4 * pOne})`} opacity={Math.min(1, pOne * 1.6)}>
            <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={128} fill={INK} letterSpacing={-4} style={{fontVariantNumeric: 'tabular-nums'}}>−{v1}</text>
          </g>
        ) : null}
        <g transform={`translate(262,0) scale(${pHalf})`} opacity={pHalf > 0.01 ? 1 : 0}>
          <rect x={0} y={-62} width={118} height={70} rx={16} fill={INK} /><text x={59} y={-10} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill="#FFFFFF">ms</text>
        </g>
      </g>

      {/* ---------------- the hopping ball ---------------- */}
      {trail(ax, ay, bx, by, 190, q1, BLUE)}
      {trail(bx, by, cx, cy, 70, q2, TEAL)}
      <ellipse cx={ballX + 8} cy={(q2 > 0 ? lerp(by, cy, q2) : lerp(ay, by, q1 * q1)) + 42} rx={50} ry={12} fill="#1B2244" opacity={0.25} />
      <g transform={`translate(${ballX},${ballY + 40 * squash - yetHop}) scale(${1 + squash},${1 - squash})`}>
        <circle r={42} fill={`url(#${id}-ball)`} stroke="#FFFFFF" strokeWidth={4} />
        <ellipse cx={-14} cy={-18} rx={12} ry={7} fill="#FFFFFF" opacity={0.9} />
      </g>
      {land1 > 0.05 ? <ellipse cx={bx} cy={by + 42} rx={60 + 120 * (1 - land1)} ry={(60 + 120 * (1 - land1)) * 0.28} fill="none" stroke={BLUE} strokeWidth={6 * land1} opacity={land1} /> : null}
      {land2 > 0.05 ? <ellipse cx={cx} cy={cy + 42} rx={60 + 70 * (1 - land2)} ry={(60 + 70 * (1 - land2)) * 0.28} fill="none" stroke={TEAL} strokeWidth={6 * land2} opacity={land2} /> : null}

      {/* ---------------- compare strip: time saved per frame, same scale ---------------- */}
      {/* (fades out with the formula as the camera leaves the big step - safe area) */}
      <g opacity={1 - clamp01((t - (t144 - 6)) / 10)}>
      <line x1={PLX + 70} x2={PLX + PLW - 70} y1={BY + 120} y2={BY + 120} stroke="#D5DBEA" strokeWidth={3} />
      <text x={PX0} y={BY + 178} fontFamily={MONO} fontWeight={600} fontSize={26} fill={MUTE} letterSpacing={6}>TIME SAVED PER FRAME</text>
      {[{y: BY + 250, a: '60', b: '120', v: 8.3, k: Math.max(saves * 0.02, outC((t - t8) / 12)), col: `url(#${id}-bar1)`, lab: '−8.3 ms', on: p8},
        {y: BY + 360, a: '120', b: '144', v: 1.4, k: outC((t - tOne) / 10), col: TEAL, lab: '−1.4 ms', on: pOne}].map((r) => (
        <g key={r.a}>
          <text x={PX0} y={r.y + 16} fontFamily={FONT} fontWeight={700} fontSize={46} fill={INK}>{r.a}</text>
          <path d={`M${PX0 + r.a.length * 28 + 14},${r.y} h44 m-14,-12 l14,12 l-14,12`} fill="none" stroke={MUTE} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          <text x={PX0 + r.a.length * 28 + 76} y={r.y + 16} fontFamily={FONT} fontWeight={700} fontSize={46} fill={INK}>{r.b}</text>
          <rect x={barX} y={r.y - 28} width={8.3 * barS} height={56} rx={28} fill="#EDF0F7" stroke="#D5DBEA" strokeWidth={2.5} />
          {r.k > 0.005 ? <rect x={barX} y={r.y - 28} width={Math.max(56, r.v * barS * r.k)} height={56} rx={28} fill={r.col} /> : null}
          <g transform={`translate(${barX + r.v * barS + 26},${r.y + 16}) scale(${r.on})`} opacity={r.on > 0.01 ? 1 : 0}>
            <text x={0} y={0} fontFamily={FONT} fontWeight={800} fontSize={46} fill={INK}>{r.lab}</text>
          </g>
        </g>
      ))}
      </g>

      {/* props on the table */}
      <g transform="translate(2300,2700) rotate(8)">
        <rect x={10} y={14} width={120} height={900} rx={14} fill="#1B2244" opacity={0.18} />
        <rect width={120} height={900} rx={14} fill="#FFFFFF" stroke="#C3C9DC" strokeWidth={3} />
        {Array.from({length: 30}).map((_, i) => <line key={i} x1={0} x2={i % 5 === 0 ? 56 : 32} y1={20 + i * 29} y2={20 + i * 29} stroke={INK} strokeWidth={3} opacity={0.7} />)}
      </g>
      <g transform="translate(560,3600) rotate(-7)">
        <rect x={8} y={12} width={560} height={64} rx={32} fill="#1B2244" opacity={0.18} />
        <rect width={560} height={64} rx={32} fill={MARK} stroke="#D9B21F" strokeWidth={3} /><rect x={400} width={160} height={64} rx={32} fill={INK} />
        <path d="M0,14 L-46,26 L-46,38 L0,50 Z" fill="#3A3F52" /><rect x={60} y={10} width={300} height={10} rx={5} fill="#FFFFFF" opacity={0.6} />
      </g>
      <Burst t={t} at={t600} x={MCX} y={MCY} color={MARK} n={22} r={620} />
      <Burst t={t} at={t8} x={dimX1 + 220} y={PA.top + 280} color={BLUE} n={14} r={260} />
    </svg>
  );
};

export const stairsWorld: WorldDef = {
  id: 'stairs', home: 'stairs',
  anchors: {
    stairs: {x: 1300, y: 2235, zoom: 0.57},
    big: {x: 1285, y: 2190, zoom: 0.6},
    small: {x: 1602, y: 2250, zoom: 0.955},   // y 2150 -> 2250: safe area, pillar labels above the 85 % line
    // + 0.03 of the frame more (safe area, 25 Nov): the pillar labels end above the 85 % line; the monitor centre then
    // lands at ~45 % of the height, so S11's portal origin is [0.5, 0.45] in script.json
    esports: {x: MCX, y: MCY + (1920 * 0.03) / 0.48 + (1920 * 0.03) / (0.48 * 0.82), zoom: 0.48},
  },
  aliases: {'60': 'big', '120': 'big', '144': 'small', esports: 'esports', monitors: 'esports'},
  palette: {bg0: '#CBCDE2', bg1: '#FFFFFF', particles: '#8E93D6', glow: '#FFFFFF'},
  Draw,
};
