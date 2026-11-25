// S05 "Slow time" - a cool cyan time-lab. The honest demo: this video is 60 fps, so time is slowed 8x. A chrome lab clock
// spins, then slows inside time-warp rings; it docks into the header and two glass lanes rise: on the 60 Hz lane the ball
// holds for 8 video frames per refresh (big jumps), on the 120 Hz lane for 4 (half the step, twice the dots - exactly 2:1).
// On "smoother" the 120 Hz dots melt into one fluid light trail. World px == screen px at the home framing.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';
import {at, clamp01, flash, lerp, outC, ramp, rnd} from './phones_util';

const id = 's05';
const AMB = '#FFB238', CY = '#4FE3FF', ICE = '#D6F4FF', MINT = '#7CFFD6', DEEP = '#03121E';

// ---- lane geometry (local to a lane: 1000 x 450) ----
const LW = 1000, LH = 450;
const X = (p: number) => 110 + 780 * p;
const Y = (p: number) => 340 - 190 * 4 * p * (1 - p);
const TRAVEL = 32, PERIOD = 48;      // design frames: one crossing, and the loop
const N60 = 8, N120 = 16;            // refreshes per crossing: 4 design frames (= 8 video frames) vs 2 (= 4 video frames)

type LaneProps = {
  t: number; n: number; hz: string; ms: string; color: string; lit: number; sub: number; first: number; ballIn: number; glow: number;
  bracket: number; tag: string; tagA: number; melt: number; hot: number; k: string;
};
const Lane: React.FC<LaneProps> = ({t, n, hz, ms, color, lit, sub, first, ballIn, glow, bracket, tag, tagA, melt, hot, k}) => {
  const stepF = TRAVEL / n;
  const e0 = t - first;
  const pass = e0 < 0 ? -1 : Math.floor(e0 / PERIOD);
  const e = e0 < 0 ? -1 : e0 - pass * PERIOD;
  const idx = e < 0 ? 0 : Math.min(n, Math.floor(e / stepF));
  const laid = e0 < 0 ? -1 : Math.min(n, Math.floor(e0 / stepF));      // dots laid on the first pass stay
  // the ball: holds, then jumps to the next refresh position
  let bp = idx / n, bo = ballIn;
  if (e >= 0 && e > TRAVEL + 2) {
    const q = e - TRAVEL - 2;
    if (q < 8) bo = 1 - clamp01((q - 2) / 5);
    else { bp = 0; bo = clamp01((q - 8) / 5); }
  }
  const sinceStep = e >= 0 && e <= TRAVEL + 2 ? e - idx * stepF : 99;
  const tick = Math.exp(-Math.max(0, sinceStep) / 1.6);                 // refresh blink
  const dim = 0.35 + 0.65 * lit;
  const pathD = Array.from({length: 41}).map((_, i) => `${i ? 'L' : 'M'}${X(i / 40).toFixed(1)} ${Y(i / 40).toFixed(1)}`).join(' ');
  const b0 = X(1 / 8), b1 = X(1 / 8 + 1 / n);
  return (
    <g opacity={dim}>
      {/* glass slab with depth */}
      <rect x={10} y={16} width={LW} height={LH} rx={40} fill="#000C16" opacity={0.75} />
      <rect width={LW} height={LH} rx={40} fill={`url(#${id}-lane)`} stroke={color} strokeOpacity={0.35 + 0.5 * lit} strokeWidth={3} />
      <rect x={3} y={3} width={LW - 6} height={150} rx={38} fill={`url(#${id}-gloss)`} opacity={0.5} />
      <ellipse cx={LW / 2} cy={330} rx={520} ry={170} fill={`url(#${id}-pool${k})`} opacity={0.25 + 0.55 * lit + 0.3 * glow} />
      {/* inner graph grid */}
      {Array.from({length: 5}).map((_, i) => <line key={`g${i}`} x1={70} x2={LW - 50} y1={150 + i * 47.5} y2={150 + i * 47.5} stroke={ICE} strokeWidth={1.5} opacity={0.08} />)}
      {Array.from({length: n + 1}).map((_, i) => <line key={`v${i}`} x1={X(i / n)} x2={X(i / n)} y1={130} y2={388} stroke={color} strokeWidth={1.5} strokeDasharray="3 9" opacity={0.2 + 0.25 * lit} />)}
      {/* header: Hz plate, frame time, refresh blinker */}
      <g transform={`translate(30,24) scale(${0.92 + 0.08 * lit})`}>
        <rect width={252} height={88} rx={22} fill={color} opacity={0.14 + 0.86 * lit} />
        <rect x={3} y={3} width={246} height={40} rx={19} fill="#FFFFFF" opacity={0.22 * lit} />
        <text x={126} y={64} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={60} fill={lit > 0.4 ? DEEP : color} letterSpacing={-1}>{hz}</text>
      </g>
      <g opacity={sub}>
        <text x={306} y={58} fontFamily={MONO} fontWeight={600} fontSize={30} fill={ICE}>{ms}</text>
        <text x={306} y={92} fontFamily={MONO} fontSize={21} fill={color} letterSpacing={3}>PER FRAME</text>
      </g>
      <g transform={`translate(${LW - 300},30)`}>
        <text x={0} y={22} fontFamily={MONO} fontSize={19} fill={ICE} opacity={0.6} letterSpacing={3}>REFRESH</text>
        <circle cx={254} cy={15} r={11} fill={color} opacity={0.25 + 0.75 * tick * lit} />
        <circle cx={254} cy={15} r={20} fill="none" stroke={color} strokeWidth={2.5} opacity={0.6 * tick * lit} />
        {Array.from({length: n}).map((_, i) => {
          const w = 264 / n;
          const on = e >= 0 && i < idx;
          return <rect key={i} x={i * w} y={40} width={w - 4} height={22} rx={5} fill={on ? color : '#0E2A3C'} stroke={color} strokeOpacity={0.4} strokeWidth={1.2} opacity={on ? 0.95 : 0.8} />;
        })}
      </g>
      {/* the true (continuous) motion */}
      <path d={pathD} fill="none" stroke={ICE} strokeWidth={2.5} strokeDasharray="5 11" opacity={0.3 * lit * (1 - melt)} />
      {/* rail with one tick per refresh */}
      <rect x={84} y={384} width={832} height={8} rx={4} fill="#0A2233" stroke={ICE} strokeOpacity={0.25} strokeWidth={1.5} />
      {Array.from({length: n + 1}).map((_, i) => <rect key={`t${i}`} x={X(i / n) - 2.5} y={374} width={5} height={28} rx={2.5} fill={i <= laid ? color : '#4C7088'} opacity={i <= laid ? 1 : 0.7} />)}
      {/* the melted trail (120 Hz on "smoother") */}
      {melt > 0.01 ? (
        <g opacity={melt}>
          <path d={pathD} fill="none" stroke={color} strokeWidth={46} strokeLinecap="round" opacity={0.16} />
          <path d={pathD} fill="none" stroke={`url(#${id}-trail)`} strokeWidth={22} strokeLinecap="round" />
          <path d={pathD} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeDasharray="70 190" strokeDashoffset={-t * 16} opacity={0.9} />
        </g>
      ) : null}
      {/* ghost dots: one per refresh */}
      {Array.from({length: n + 1}).map((_, i) => {
        if (i > laid) return null;
        const born = outC((t - (first + i * stepF)) / 3.5);
        const now = e >= 0 && e <= TRAVEL + 2 && i === idx ? tick : 0;
        const r = (n === N60 ? 17 : 11.5) * born * (1 + 0.25 * hot) * (1 - 0.35 * melt);
        return (
          <g key={`d${i}`} opacity={1 - 0.75 * melt}>
            <circle cx={X(i / n)} cy={Y(i / n)} r={r * 2.3} fill={color} opacity={0.16 + 0.25 * now + 0.2 * hot} />
            <circle cx={X(i / n)} cy={Y(i / n)} r={r} fill={DEEP} stroke={color} strokeWidth={n === N60 ? 5 : 4} />
            <circle cx={X(i / n)} cy={Y(i / n)} r={r * 0.42} fill={color} opacity={0.75 + 0.25 * now} />
          </g>
        );
      })}
      {/* jump arrows between the 60 Hz dots / step bracket */}
      {bracket > 0.01 ? (
        <g opacity={clamp01(bracket * 1.5)}>
          <path d={`M${b0} ${410} v14 H${lerp(b0, b1, bracket)} v-14`} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinejoin="round" />
          <rect x={b1 + 12} y={404} width={ms.length * 15 + 128} height={36} rx={18} fill={color} />
          <text x={b1 + 26} y={430} fontFamily={MONO} fontWeight={600} fontSize={24} fill={DEEP}>{ms} / step</text>
        </g>
      ) : null}
      {tagA > 0.01 ? (
        <g transform={`translate(${LW - 40},${132}) scale(${0.6 + 0.4 * tagA})`} opacity={clamp01(tagA * 1.6)}>
          <rect x={-tag.length * 19 - 44} y={-24} width={tag.length * 19 + 44} height={48} rx={24} fill={DEEP} stroke={color} strokeWidth={3} />
          <text x={-22} y={9} textAnchor="end" fontFamily={MONO} fontWeight={600} fontSize={26} fill={color} letterSpacing={3}>{tag}</text>
        </g>
      ) : null}
      {/* the ball */}
      {bo > 0.01 ? (
        <g transform={`translate(${X(bp)},${Y(bp)})`} opacity={bo}>
          <circle r={74 + 26 * tick} fill={`url(#${id}-ballglow${k})`} opacity={0.8} />
          <circle r={27 + 3 * glow} fill={`url(#${id}-ball${k})`} stroke="#FFFFFF" strokeWidth={2.5} />
          <ellipse cx={-8} cy={-10} rx={10} ry={6} fill="#FFFFFF" opacity={0.85} />
        </g>
      ) : null}
      <ellipse cx={X(bp)} cy={398} rx={30} ry={6} fill={color} opacity={0.35 * bo * lit} />
    </g>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tVideo = at(beats, 'video', 0, 16.5), tOnly = at(beats, 'only', 0, 25.5), tPlays = at(beats, 'plays', 0, 32.5), t60 = at(beats, '60', 0, 43.5);
  const tSlow = at(beats, 'slow', 0, 68), tTime = at(beats, 'time', 0, 76), tDown = at(beats, 'down', 0, 83);
  const t60b = at(beats, '60', 1, 117.5), tHz = at(beats, 'hertz', 0, 128.5), tMoving = at(beats, 'moving', 0, 148.5), tBall = at(beats, 'ball', 0, 157.5);
  const tJumps = at(beats, 'jumps', 0, 164), tBig = at(beats, 'big', 0, 176), tSteps = at(beats, 'steps', 0, 183.5);
  const t120 = at(beats, '120', 0, 221.5), tSteps2 = at(beats, 'steps', 1, 242), tHalf = at(beats, 'half', 0, 254), tBig2 = at(beats, 'big', 1, 264.5);
  const tMotion = at(beats, 'motion', 0, 283.5), tLooks = at(beats, 'looks', 0, 291.5), tSmooth = at(beats, 'smoother', 0, 300);

  // ---- clock time: runs fast, then eases down to 1/8 speed (closed-form integral, so it never jumps) ----
  const W0 = 12, L = 20;
  const x = clamp01((t - tSlow) / L);
  const ang = t <= tSlow ? W0 * t : W0 * (tSlow + L * (x - (7 / 8) * (x * x * x - (x * x * x * x) / 2))) + (W0 / 8) * Math.max(0, t - tSlow - L);
  const speed = 1 - (7 / 8) * (x * x * (3 - 2 * x));          // 1 -> 1/8
  // ---- choreography: the clock docks and the lanes rise (one eased move, before "moving ball") ----
  const q = ramp(t, t60b - 12, 30);
  const video = sp(t, tVideo, 'settle'), only = sp(t, tOnly, 'bouncy'), plays = sp(t, tPlays, 'pop'), n60 = sp(t, t60, 'bouncy');
  const slow = sp(t, tSlow, 'settle'), time = sp(t, tTime, 'settle'), down = sp(t, tDown, 'bouncy');
  const cS = lerp(1.12, 0.4, q), cX = lerp(540, 838, q), cY = lerp(1150, 648, q);
  const laneOff = (1 - q) * 1280;
  const lane0 = sp(t, t60b, 'settle'), lane1 = sp(t, t120, 'settle');
  const first0 = tMoving, first1 = first0 + 2 * PERIOD;
  const melt = ramp(t, tSmooth - 3, 9);
  const half = sp(t, tHalf, 'settle');

  return (
    <svg width={1080} height={1920} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${id}-pool`}><stop offset="0" stopColor="#2CC9FF" stopOpacity="0.55" /><stop offset="0.5" stopColor="#0E6FA8" stopOpacity="0.22" /><stop offset="1" stopColor="#0E6FA8" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-poola`}><stop offset="0" stopColor={AMB} stopOpacity="0.5" /><stop offset="1" stopColor={AMB} stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-poolb`}><stop offset="0" stopColor={CY} stopOpacity="0.5" /><stop offset="1" stopColor={CY} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-lane`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E3048" /><stop offset="0.5" stopColor="#071C2C" /><stop offset="1" stopColor="#04121E" /></linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F4FBFF" /><stop offset="0.3" stopColor="#7E99AC" /><stop offset="0.5" stopColor="#E6F3FA" /><stop offset="0.72" stopColor="#4A6578" /><stop offset="1" stopColor="#C6DAE6" /></linearGradient>
        <radialGradient id={`${id}-face`} cx="42%" cy="36%" r="75%"><stop offset="0" stopColor="#134462" /><stop offset="0.6" stopColor="#06202F" /><stop offset="1" stopColor="#020D16" /></radialGradient>
        <radialGradient id={`${id}-balla`} cx="38%" cy="32%" r="70%"><stop offset="0" stopColor="#FFF6DA" /><stop offset="0.5" stopColor={AMB} /><stop offset="1" stopColor="#C2600A" /></radialGradient>
        <radialGradient id={`${id}-ballb`} cx="38%" cy="32%" r="70%"><stop offset="0" stopColor="#F2FDFF" /><stop offset="0.5" stopColor={CY} /><stop offset="1" stopColor="#0A7FB4" /></radialGradient>
        <radialGradient id={`${id}-ballglowa`}><stop offset="0" stopColor={AMB} stopOpacity="0.75" /><stop offset="1" stopColor={AMB} stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-ballglowb`}><stop offset="0" stopColor={CY} stopOpacity="0.75" /><stop offset="1" stopColor={CY} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-trail`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1B9BD8" /><stop offset="0.5" stopColor={CY} /><stop offset="1" stopColor="#E9FBFF" /></linearGradient>
        <linearGradient id={`${id}-card`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#12405C" /><stop offset="1" stopColor="#061B2A" /></linearGradient>
        <linearGradient id={`${id}-thumb`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2CC9FF" /><stop offset="1" stopColor="#1B4DD8" /></linearGradient>
      </defs>

      {/* ---------------- the lab: floor grid, light pools, range rings, side rulers, console ---------------- */}
      <ellipse cx={540} cy={1080} rx={1050} ry={1050} fill={`url(#${id}-pool)`} opacity={0.85} />
      {Array.from({length: 22}).map((_, i) => <line key={`gv${i}`} x1={-405 + i * 90} x2={-405 + i * 90} y1={-300} y2={2300} stroke="#6FD6FF" strokeWidth={1.5} opacity={0.07} />)}
      {Array.from({length: 29}).map((_, i) => <line key={`gh${i}`} y1={-240 + i * 90} y2={-240 + i * 90} x1={-420} x2={1500} stroke="#6FD6FF" strokeWidth={1.5} opacity={0.07} />)}
      {[600, 760, 940].map((r, i) => <circle key={r} cx={540} cy={1110} r={r} fill="none" stroke="#7FE0FF" strokeWidth={2} strokeDasharray={i === 1 ? '2 14' : '14 10'} opacity={0.16} transform={`rotate(${(i % 2 ? -1 : 1) * ang * 0.02} 540 1110)`} />)}
      {[14, 1066].map((rx) => (
        <g key={rx} opacity={0.5}>
          <line x1={rx} x2={rx} y1={420} y2={1900} stroke="#8BE4FF" strokeWidth={18} strokeDasharray="2.5 27.5" />
          <line x1={rx} x2={rx} y1={420} y2={1900} stroke="#D6F4FF" strokeWidth={30} strokeDasharray="3 147" />
        </g>
      ))}
      {/* console strip along the floor */}
      <g>
        <rect x={-400} y={1792} width={1880} height={420} fill="#031320" />
        <rect x={-400} y={1792} width={1880} height={5} fill={CY} opacity={0.55} />
        <rect x={-400} y={1800} width={1880} height={60} fill={`url(#${id}-gloss)`} opacity={0.25} />
        {Array.from({length: 44}).map((_, i) => {
          const on = Math.floor(ang / 45 + i * 0.37) % 5 === 0;
          return <rect key={i} x={-140 + i * 31} y={1826} width={19} height={10} rx={3} fill={on ? (i % 7 === 0 ? AMB : CY) : '#0F3348'} opacity={on ? 0.95 : 0.8} />;
        })}
        <text x={40} y={1884} fontFamily={MONO} fontSize={20} fill="#9FDCF2" letterSpacing={5}>TIME LAB · PLAYBACK SCALE</text>
        <text x={1040} y={1884} textAnchor="end" fontFamily={MONO} fontSize={20} fill="#6FB9D6" letterSpacing={5}>{speed < 0.2 ? 'SLOW-MO ON' : 'REAL TIME'}</text>
      </g>

      {/* ---------------- time-warp rings + the clock ---------------- */}
      <g transform={`translate(${cX},${cY}) scale(${cS})`}>
        {[350, 392, 436, 480].map((r, i) => {
          const a = Math.max(slow - i * 0.08, 0) * (i > 1 ? 1 - q : 1);
          if (a < 0.01) return null;
          const sc = 1 + (1 - slow) * 0.35 + (1 - time) * 0.05 * (i + 1);
          return (
            <g key={r} transform={`rotate(${(i % 2 ? -1 : 1) * ang * (0.5 + i * 0.22)}) scale(${sc})`} opacity={clamp01(a)}>
              <circle r={r} fill="none" stroke={i % 2 ? MINT : CY} strokeWidth={i === 0 ? 7 : 4} strokeDasharray={['150 40 12 40', '8 22', '260 60', '3 18'][i]} opacity={0.75 - i * 0.12} strokeLinecap="round" />
              <circle cx={r} cy={0} r={9} fill="#FFFFFF" opacity={0.9} />
              <circle cx={-r} cy={0} r={6} fill={CY} />
            </g>
          );
        })}
        {/* warp streaks pulled toward the clock on "time" */}
        {time > 0.01 ? Array.from({length: 18}).map((_, i) => {
          const a = (i / 18) * Math.PI * 2 + (ang * Math.PI) / 1400;
          const r0 = 330 + 22 * rnd(i), r1 = r0 + 60 + 120 * rnd(i * 3) * time;
          return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a + 0.16) * r1} y2={Math.sin(a + 0.16) * r1} stroke={ICE} strokeWidth={3} strokeLinecap="round" opacity={0.3 * time * (1 - q)} />;
        }) : null}
        {/* body */}
        <ellipse cx={14} cy={330} rx={300} ry={38} fill="#000" opacity={0.4 * (1 - q)} />
        <circle r={322} fill={`url(#${id}-chrome)`} />
        <circle r={322} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
        <circle r={296} fill="#02101A" />
        <circle r={288} fill={`url(#${id}-face)`} />
        <circle r={268} fill="none" stroke="#9FE3FF" strokeWidth={22} strokeDasharray="2.2 25.87" opacity={0.75} />
        {Array.from({length: 12}).map((_, i) => <rect key={i} x={-5} y={-282} width={10} height={i % 3 === 0 ? 54 : 34} rx={5} fill={i % 3 === 0 ? '#FFFFFF' : '#BFEAFF'} transform={`rotate(${i * 30})`} />)}
        <circle r={150} fill="none" stroke={CY} strokeWidth={2} strokeDasharray="4 8" opacity={0.4} />
        <text x={0} y={-150} textAnchor="middle" fontFamily={MONO} fontSize={24} fill="#8FD9F5" letterSpacing={6}>TIME</text>
        {/* speed window */}
        <rect x={-92} y={120} width={184} height={54} rx={12} fill="#010A12" stroke="#2D6C8C" strokeWidth={2.5} />
        <rect x={-84} y={128} width={168 * speed} height={38} rx={8} fill={speed < 0.2 ? AMB : CY} opacity={0.9} />
        <text x={0} y={206} textAnchor="middle" fontFamily={MONO} fontSize={20} fill="#8FD9F5" letterSpacing={4}>SPEED</text>
        {/* hands: motion-blur fan that collapses as time slows */}
        <rect x={-7} y={-150} width={14} height={170} rx={7} fill="#E9F8FF" transform={`rotate(${ang / 12 + 40})`} />
        {Array.from({length: 6}).map((_, i) => <rect key={i} x={-4} y={-250} width={8} height={300} rx={4} fill={AMB} opacity={0.34 - i * 0.05} transform={`rotate(${ang - (i + 1) * 9 * speed})`} />)}
        <g transform={`rotate(${ang})`}>
          <rect x={-5} y={-254} width={10} height={310} rx={5} fill={AMB} />
          <circle cx={0} cy={-232} r={13} fill="#FFF3D0" />
          <circle cx={0} cy={-232} r={30} fill={AMB} opacity={0.3} />
        </g>
        <circle r={24} fill={`url(#${id}-chrome)`} /><circle r={9} fill="#02101A" />
        {/* glass */}
        <path d="M-250,-120 A280,280 0 0 1 120,-250 A330,330 0 0 0 -250,-120 Z" fill="#FFFFFF" opacity={0.14} />
        <circle r={300 + 30 * flash(t, tSlow, 6)} fill="none" stroke={AMB} strokeWidth={10} opacity={0.7 * flash(t, tSlow, 6)} />
        <circle r={300 + 60 * flash(t, tTime, 6)} fill="none" stroke={CY} strokeWidth={8} opacity={0.6 * flash(t, tTime, 6)} />
        {/* crown */}
        <rect x={-34} y={-362} width={68} height={44} rx={10} fill={`url(#${id}-chrome)`} /><rect x={-50} y={-378} width={100} height={24} rx={10} fill={`url(#${id}-chrome)`} />
      </g>

      {/* ---------------- badge: this video = 60 fps ---------------- */}
      <g transform={`translate(${lerp(540, 320, q)},${lerp(604, 590, q)}) scale(${lerp(1.5, 1, q) * (0.86 + 0.14 * video)})`} opacity={0.35 + 0.65 * video}>
        <rect x={-274} y={-57} width={560} height={130} rx={30} fill="#000C16" opacity={0.7} />
        <rect x={-280} y={-65} width={560} height={130} rx={30} fill={`url(#${id}-card)`} stroke={CY} strokeOpacity={0.5 + 0.5 * flash(t, t60, 8)} strokeWidth={3} />
        <rect x={-277} y={-62} width={554} height={56} rx={27} fill={`url(#${id}-gloss)`} opacity={0.6} />
        {/* player thumbnail */}
        <rect x={-262} y={-45} width={112} height={90} rx={16} fill={`url(#${id}-thumb)`} />
        <path d="M-262,20 L-232,-6 L-212,10 L-186,-18 L-150,20 V29 A16,16 0 0 1 -166,45 H-246 A16,16 0 0 1 -262,29 Z" fill="#06283C" opacity={0.55} />
        <circle cx={-206} cy={0} r={26 + 5 * flash(t, tPlays, 5)} fill="#FFFFFF" opacity={0.2 + 0.75 * plays} />
        <path d="M-214,-13 L-193,0 L-214,13 Z" fill={plays > 0.5 ? '#0A3A58' : '#FFFFFF'} />
        {plays > 0.01 ? <circle cx={-206} cy={0} r={26 + 34 * (1 - flash(t, tPlays, 6))} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={flash(t, tPlays, 6)} /> : null}
        <text x={-130} y={-20} fontFamily={MONO} fontWeight={600} fontSize={25} fill={ICE} letterSpacing={3}>THIS VIDEO</text>
        <g transform={`translate(52,-28) scale(${only})`}>
          <rect x={-2} y={-17} width={82} height={34} rx={9} fill={AMB} />
          <text x={39} y={8} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={21} fill={DEEP} letterSpacing={2}>ONLY</text>
        </g>
        {/* scrubber running at the video's real 60 fps */}
        <rect x={-130} y={10} width={236} height={10} rx={5} fill="#031320" stroke="#2D6C8C" strokeWidth={1.5} />
        <rect x={-130} y={10} width={236 * clamp01(0.12 + 0.76 * (t / 324)) * plays} height={10} rx={5} fill={CY} />
        <circle cx={-130 + 236 * clamp01(0.12 + 0.76 * (t / 324)) * plays} cy={15} r={10} fill="#FFFFFF" />
        {Array.from({length: 12}).map((_, i) => <rect key={i} x={-130 + i * 20} y={32} width={15} height={11} rx={3} fill={i <= Math.floor(t * 2) % 12 && plays > 0.5 ? CY : '#12405C'} opacity={0.9} />)}
        <g transform={`translate(196,0) scale(${0.7 + 0.3 * n60})`}>
          <text x={-6} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={86} fill={n60 > 0.3 ? '#FFFFFF' : '#2D6C8C'} letterSpacing={-3}>60</text>
          <text x={-6} y={52} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill={n60 > 0.3 ? CY : '#2D6C8C'} letterSpacing={5}>FPS</text>
        </g>
      </g>

      {/* ---------------- tag: real time -> slowed 8x ---------------- */}
      <g transform={`translate(${lerp(540, 320, q)},${lerp(1650, 724, q)}) scale(${lerp(1.2, 1, q)})`}>
        <g transform={`scale(1,${Math.max(0.05, Math.abs(1 - 2 * clamp01((t - tDown) / 6)))})`}>
          <rect x={-254} y={-40} width={520} height={96} rx={48} fill="#000C16" opacity={0.6} />
          {t < tDown + 3 ? (
            <g opacity={0.75}>
              <rect x={-260} y={-48} width={520} height={96} rx={48} fill="#06202F" stroke="#3D86A8" strokeWidth={3} />
              <path d="M-200,-16 L-172,0 L-200,16 Z" fill="#8FD9F5" />
              <text x={24} y={14} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={38} fill="#8FD9F5" letterSpacing={6}>REAL TIME</text>
            </g>
          ) : (
            <g>
              <rect x={-260} y={-48} width={520} height={96} rx={48} fill={AMB} stroke="#FFF3D0" strokeWidth={4} />
              <rect x={-254} y={-43} width={508} height={40} rx={36} fill="#FFFFFF" opacity={0.28} />
              {/* hourglass */}
              <path d="M-214,-26 H-170 L-186,-2 L-170,26 H-214 L-198,-2 Z" fill="none" stroke={DEEP} strokeWidth={5} strokeLinejoin="round" />
              <path d="M-203,14 H-181 L-192,2 Z" fill={DEEP} />
              <text x={34} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={54} fill={DEEP} letterSpacing={2}>SLOWED 8×</text>
            </g>
          )}
        </g>
        {down > 0.01 && t - tDown < 16 ? <rect x={-260 - (t - tDown) * 5} y={-48 - (t - tDown) * 3} width={520 + (t - tDown) * 10} height={96 + (t - tDown) * 6} rx={60} fill="none" stroke={AMB} strokeWidth={6} opacity={1 - (t - tDown) / 16} /> : null}
      </g>

      {/* ---------------- the two lanes ---------------- */}
      {/* lanes stay invisible until they rise (safe area: the zoomed-out frame showed them waiting below the 85 % line) */}
      <g transform={`translate(40,${830 + laneOff})`} opacity={clamp01(q * 4)}>
        <Lane t={t} n={N60} hz="60 Hz" ms="16.7 ms" color={AMB} k="a" lit={lane0} sub={sp(t, tHz, 'settle')} first={first0} ballIn={sp(t, tHz, 'bouncy')}
              glow={flash(t, tBall, 6) + flash(t, tJumps, 6)} bracket={sp(t, tBig, 'settle')} tag="BIG STEPS" tagA={sp(t, tSteps, 'bouncy')} melt={0} hot={flash(t, tBig, 7) + flash(t, tJumps, 6)} />
      </g>
      <g transform={`translate(40,${1310 + laneOff * 1.12})`} opacity={clamp01(q * 4)}>
        <Lane t={t} n={N120} hz="120 Hz" ms="8.3 ms" color={CY} k="b" lit={lane1} sub={lane1} first={first1} ballIn={lane1}
              glow={flash(t, t120, 6) + flash(t, tMotion, 6)} bracket={half} tag={melt > 0.5 ? 'SMOOTHER' : 'HALF THE STEP'} tagA={Math.max(sp(t, tBig2, 'bouncy') * (1 - clamp01((t - tSmooth + 3) / 3)), sp(t, tSmooth, 'bouncy'))}
              melt={melt} hot={flash(t, tSteps2, 7) + flash(t, tHalf, 7)} />
      </g>
      {/* 2 : 1 guides: every 60 Hz dot lands on every second 120 Hz dot */}
      {half > 0.01 ? (
        <g opacity={clamp01(half * 1.4) * (1 - 0.6 * melt)}>
          {Array.from({length: N60 + 1}).map((_, i) => {
            const gx = 40 + X(i / N60), y0 = 830 + 404, yTop = 1310 - 5, yHead = 1310 + 126, y1 = 1310 + Y(i / N60) - 16;
            const d = clamp01(half * 1.3 - i * 0.03);
            // two pieces: lane gap only, then below the 120 Hz header (never across its text)
            return (
              <g key={i}>
                <line x1={gx} x2={gx} y1={y0} y2={lerp(y0, yTop, d)} stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="6 8" opacity={0.4} />
                {y1 > yHead + 4 ? <line x1={gx} x2={gx} y1={yHead} y2={lerp(yHead, y1, d)} stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="6 8" opacity={0.4} /> : null}
              </g>
            );
          })}
          <g transform={`translate(${40 + 800},${830 + 422}) scale(${0.6 + 0.4 * half})`}>
            <rect x={-150} y={-17} width={300} height={34} rx={17} fill="#FFFFFF" />
            <text x={0} y={7.5} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={21} fill={DEEP} letterSpacing={1.5}>TWICE THE REFRESHES</text>
          </g>
        </g>
      ) : null}
      {t > tLooks && t - tLooks < 14 ? <rect x={40 - (t - tLooks) * 2} y={1310 - (t - tLooks) * 2} width={LW + (t - tLooks) * 4} height={LH + (t - tLooks) * 4} rx={44} fill="none" stroke={CY} strokeWidth={6} opacity={1 - (t - tLooks) / 14} /> : null}
    </svg>
  );
};

export const S05: WorldDef = {
  id: 'slowtime', home: 'lab',
  anchors: {lab: {x: 540, y: 1018, zoom: 1}},
  palette: {bg0: '#020B14', bg1: '#0B3550', particles: '#9FE8FF', glow: '#3FD8FF'},
  Draw,
};
