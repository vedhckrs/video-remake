// S07 "Touch grid" - a hot magenta/orange gaming bay. A generic gaming phone in landscape (chamfered body, vents, RGB edge,
// shoulder triggers) runs a neon racer; a big angular plate shows 144 Hz then 165 Hz. Under it lies the magnified touch
// layer: on "touch sensors" the capacitive diamond grid powers on, scan bars sweep it, a fingertip lands and rings pulse
// outward, and the scan counter rolls and lands on THOUSANDS / SEC. World px == screen px at the home framing.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';
import {at, clamp01, flash, lerp, outC, ramp, rnd} from './phones_util';

const id = 's07';
const MAG = '#FF2D78', ORG = '#FF7A2D', CY = '#35F2FF', LIME = '#B6FF3C', INK = '#0A0206', HOT = '#FFE3D0';
// phone (landscape)
const PX = 40, PY = 770, PW = 1000, PH = 470, CH = 50;
const SX = 132, SY = 802, SW = 816, SH = 406;
// touch-layer panel
const QX = 40, QY = 1300, QW = 1000, QH = 470;
const GX = 84, GY = 1384, PITCH = 76, COLS = 12, ROWS = 5;
const F: [number, number] = [GX + PITCH * 7, GY + PITCH * 2.5];        // where the finger lands (an electrode crossing)
const cham = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x + c},${y} H${x + w - c} L${x + w},${y + c} V${y + h - c} L${x + w - c},${y + h} H${x + c} L${x},${y + h - c} V${y + c} Z`;
const diamond = (cx: number, cy: number, r: number) => `M${cx},${cy - r} L${cx + r},${cy} L${cx},${cy + r} L${cx - r},${cy} Z`;

const Plate: React.FC<{text: string; a: number; x: number; y: number; s: number; dim: number; hot: number}> = ({text, a, x, y, s, dim, hot}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={a * (1 - 0.55 * dim)}>
    <path d="M-296,-74 H330 L296,96 H-330 Z" fill="#000" opacity={0.5} />
    <path d="M-306,-90 H320 L286,80 H-340 Z" fill={`url(#${id}-plate)`} stroke={HOT} strokeWidth={4} />
    <path d="M-300,-84 H312 L302,-36 H-310 Z" fill="#FFFFFF" opacity={0.28} />
    <path d="M-306,-90 H-262 L-296,80 H-340 Z" fill={INK} opacity={0.85} />
    {[0, 1, 2].map((i) => <path key={i} d={`M${-292 + i * 0},${-64 + i * 44} h14 l-6,28 h-14 Z`} fill={i === 1 ? LIME : MAG} />)}
    <text x={-6} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={142} fill={INK} letterSpacing={-4}>{text}</text>
    <text x={236} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={62} fill={INK}>Hz</text>
    {hot > 0.01 ? <path d="M-306,-90 H320 L286,80 H-340 Z" fill="#FFFFFF" opacity={0.7 * hot} /> : null}
  </g>
);

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tGaming = at(beats, 'gaming', 0, 7.5), tPhones = at(beats, 'phones', 0, 16), tPush = at(beats, 'push', 0, 27), t144 = at(beats, '144', 0, 38);
  const t165 = at(beats, '165', 0, 70), tHz = at(beats, 'hertz', 0, 96.5), tTouch = at(beats, 'touch', 0, 119), tSens = at(beats, 'sensors', 0, 125.5);
  const tCheck = at(beats, 'checking', 0, 135.5), tFinger = at(beats, 'finger', 0, 148.5), tThou = at(beats, 'thousands', 0, 157), tTimes = at(beats, 'times', 0, 173), tSecond = at(beats, 'second', 0, 183.5);

  const on = sp(t, tGaming, 'settle'), rgb = sp(t, tPhones, 'settle'), push = sp(t, tPush, 'pop');
  const p144 = sp(t, t144, 'bouncy'), p165 = sp(t, t165, 'bouncy'), move = ramp(t, t165 - 2, 12);
  const touch = sp(t, tTouch, 'settle'), sens = sp(t, tSens, 'settle'), check = ramp(t, tCheck, 8);
  const hue = (o: number) => `hsl(${(t * 5 + o) % 360}, 100%, 60%)`;
  // game speed: one eased boost on "push", faster again at 165
  const road = t * 0.05 + 1.6 * ramp(t, tPush, 60) + 1.2 * ramp(t, t165, 70) + t * 0.035 * clamp01((t - tPush) / 20);
  const boost = 0.25 + 0.75 * clamp01(push - 0.25 * (1 - p144));
  // finger: travels in, lands on the word
  const fq = outC((t - tFinger + 7) / 8), landed = t >= tFinger + 0.5;
  const fx = F[0] + (1 - fq) * 240, fy = F[1] + (1 - fq) * 300;
  const since = t - tFinger;
  // counter
  const rolling = t >= tThou && t < tThou + 9, done = t >= tThou + 9;
  const thou = sp(t, tThou + 9, 'bouncy'), per = sp(t, tTimes, 'bouncy');
  const scanX = ((t - tSens) * 0.42) % 1, scanY = ((t - tSens) * 0.29 + 0.4) % 1;

  return (
    <svg width={1080} height={1920} style={{overflow: 'visible'}}>
      <defs>
        <clipPath id={`${id}-clip`}><rect x={SX} y={SY} width={SW} height={SH} rx={26} /></clipPath>
        <clipPath id={`${id}-pclip`}><path d={cham(QX, QY, QW, QH, 40)} /></clipPath>
        <radialGradient id={`${id}-pool`}><stop offset="0" stopColor="#FF3D7A" stopOpacity="0.6" /><stop offset="0.55" stopColor="#A3122E" stopOpacity="0.22" /><stop offset="1" stopColor="#A3122E" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-heat`}><stop offset="0" stopColor={ORG} stopOpacity="0.75" /><stop offset="1" stopColor={ORG} stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-cyg`}><stop offset="0" stopColor={CY} stopOpacity="0.8" /><stop offset="1" stopColor={CY} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD23C" /><stop offset="0.5" stopColor={ORG} /><stop offset="1" stopColor={MAG} /></linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A3340" /><stop offset="0.12" stopColor="#15121A" /><stop offset="0.9" stopColor="#0B090E" /><stop offset="1" stopColor="#2A2430" /></linearGradient>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#12022E" /><stop offset="0.55" stopColor="#6A0F6E" /><stop offset="1" stopColor="#FF5A3C" /></linearGradient>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE66B" /><stop offset="1" stopColor={MAG} /></linearGradient>
        <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A0540" /><stop offset="1" stopColor="#07010F" /></linearGradient>
        <linearGradient id={`${id}-rgb`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={hue(0)} /><stop offset="0.33" stopColor={hue(90)} /><stop offset="0.66" stopColor={hue(180)} /><stop offset="1" stopColor={hue(270)} /></linearGradient>
        <linearGradient id={`${id}-panel`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C0A22" /><stop offset="1" stopColor="#090310" /></linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.3" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B8704F" /><stop offset="0.45" stopColor="#F4BE9C" /><stop offset="1" stopColor="#C98562" /></linearGradient>
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={CY} stopOpacity="0.45" /><stop offset="1" stopColor={CY} stopOpacity="0.04" /></linearGradient>
      </defs>

      {/* ---------------- the bay: neon slashes, hex floor lines, RGB rails ---------------- */}
      <ellipse cx={540} cy={1010} rx={900} ry={760} fill={`url(#${id}-pool)`} opacity={0.6 + 0.4 * on} />
      {[[-200, 700, MAG], [120, 420, ORG], [760, 380, MAG], [980, 820, ORG], [300, 1500, MAG], [860, 1640, ORG]].map(([x, y, c], i) => (
        <g key={i} opacity={0.2 + 0.1 * Math.sin(t / 9 + i)}>
          <path d={`M${x},${Number(y) + 420} l150,-420 h70 l-150,420 Z`} fill={String(c)} />
          <path d={`M${Number(x) + 110},${Number(y) + 420} l150,-420 h18 l-150,420 Z`} fill={String(c)} opacity={0.6} />
        </g>
      ))}
      {Array.from({length: 26}).map((_, i) => <line key={i} x1={-400} x2={1480} y1={-200 + i * 90} y2={-200 + i * 90 - 260} stroke="#FF6A9A" strokeWidth={1.5} opacity={0.07} />)}
      {[10, 1070].map((x) => <g key={x}><rect x={x - 24} y={430} width={48} height={1500} fill={MAG} opacity={0.12} /><rect x={x - 4} y={430} width={8} height={1500} rx={4} fill={`url(#${id}-rgb)`} opacity={0.4 + 0.6 * rgb} /></g>)}
      {/* vent heat at both ends of the phone */}
      {[PX - 10, PX + PW + 10].map((x, i) => <ellipse key={i} cx={x} cy={PY + PH / 2} rx={130 + 20 * Math.sin(t / 6 + i)} ry={250} fill={`url(#${id}-heat)`} opacity={0.35 + 0.5 * boost} />)}

      {/* ---------------- Hz plate ---------------- */}
      {p144 < 0.99 ? (
        <g opacity={(1 - p144) * 0.9}>
          <path d="M234,520 H860 L826,690 H200 Z" fill="none" stroke={ORG} strokeWidth={4} strokeDasharray="18 12" strokeDashoffset={-t * 3} />
          <text x={530} y={596} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={28} fill={HOT} letterSpacing={8} opacity={0.4 + 0.6 * on}>GAMING PHONE</text>
          <text x={530} y={646} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={ORG} letterSpacing={8}>REFRESH RATE</text>
        </g>
      ) : null}
      <Plate text="144" a={clamp01(p144 * 1.4)} x={lerp(540, 160, move)} y={lerp(610 + (1 - p144) * 40, 528, move)} s={lerp(0.7 + 0.3 * p144, 0.3, move)} dim={move} hot={flash(t, t144, 4)} />
      {p165 > 0.01 ? <Plate text="165" a={clamp01(p165 * 1.4)} x={580 + (1 - p165) * 260} y={624} s={0.72 + 0.28 * p165} dim={0} hot={flash(t, t165, 4)} /> : null}
      {move > 0.01 ? <path d={`M${226},${580} v${40 * move} m-12,-14 l12,14 l12,-14`} fill="none" stroke={HOT} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={move} /> : null}
      {t > tHz ? <rect x={250} y={716} width={600 * outC((t - tHz) / 10)} height={10} rx={5} fill={`url(#${id}-rgb)`} /> : null}
      {[t144, t165].map((a, i) => t > a && t - a < 14 ? <path key={i} d="M-306,-90 H320 L286,80 H-340 Z" transform={`translate(${540 + 40 * i},${617}) scale(${1 + (t - a) * 0.03})`} fill="none" stroke={HOT} strokeWidth={6} opacity={1 - (t - a) / 14} /> : null)}

      {/* ---------------- the gaming phone ---------------- */}
      <ellipse cx={540} cy={PY + PH + 26} rx={520} ry={30} fill="#000" opacity={0.35} />
      {/* shoulder triggers */}
      {[PX + 110, PX + PW - 290].map((x, i) => (
        <g key={i}>
          <rect x={x - 16} y={PY - 40} width={212} height={60} rx={20} fill={i ? MAG : ORG} opacity={0.2 + 0.5 * push * (0.6 + 0.4 * Math.sin(t / 3 + i * 2))} />
          <rect x={x} y={PY - 16 + 6 * flash(t, tPush, 5)} width={180} height={24} rx={8} fill="#2A2430" stroke={i ? MAG : ORG} strokeWidth={3} />
          <rect x={x + 10} y={PY - 12 + 6 * flash(t, tPush, 5)} width={160} height={6} rx={3} fill={i ? MAG : ORG} opacity={0.5 + 0.5 * push} />
        </g>
      ))}
      <path d={cham(PX + 6, PY + 12, PW, PH, CH)} fill="#040206" />
      <path d={cham(PX - 5, PY - 5, PW + 10, PH + 10, CH + 4)} fill="none" stroke={`url(#${id}-rgb)`} strokeWidth={10} opacity={0.25 + 0.6 * rgb} />
      <path d={cham(PX, PY, PW, PH, CH)} fill={`url(#${id}-body)`} stroke="#5A5262" strokeWidth={3} />
      {/* armour lines + vents */}
      <path d={`M${PX + 20},${PY + 80} L${PX + 78},${PY + 22} M${PX + PW - 20},${PY + 80} L${PX + PW - 78},${PY + 22} M${PX + 20},${PY + PH - 80} L${PX + 78},${PY + PH - 22} M${PX + PW - 20},${PY + PH - 80} L${PX + PW - 78},${PY + PH - 22}`} stroke={MAG} strokeWidth={4} opacity={0.5 + 0.5 * rgb} />
      {[PX + 30, PX + PW - 76].map((x, i) => (
        <g key={i}>
          {Array.from({length: 8}).map((_, j) => <path key={j} d={`M${x},${PY + 124 + j * 30} h46 l-8,12 h-46 Z`} fill="#000" stroke={ORG} strokeOpacity={0.5 + 0.5 * boost} strokeWidth={1.5} />)}
          {Array.from({length: 8}).map((_, j) => <rect key={`g${j}`} x={x + 4} y={PY + 128 + j * 30} width={34} height={4} rx={2} fill={ORG} opacity={(0.3 + 0.7 * boost) * (0.5 + 0.5 * Math.sin(t / 2.5 - j * 0.8 + i))} />)}
        </g>
      ))}
      <circle cx={PX + PW - 53} cy={PY + 76} r={11} fill="#000" stroke="#5A5262" strokeWidth={2} /><circle cx={PX + PW - 56} cy={PY + 73} r={3} fill="#7C8CFF" />
      {/* RGB strip along the bottom edge */}
      <rect x={PX + 110} y={PY + PH - 20} width={PW - 220} height={8} rx={4} fill={`url(#${id}-rgb)`} opacity={0.35 + 0.65 * rgb} />
      <rect x={PX + 110} y={PY + PH - 4} width={PW - 220} height={60} fill={`url(#${id}-rgb)`} opacity={0.1 * rgb} />
      {/* screen: neon racer */}
      <rect x={SX - 6} y={SY - 6} width={SW + 12} height={SH + 12} rx={30} fill="#000" />
      <g clipPath={`url(#${id}-clip)`}>
        <g opacity={0.25 + 0.75 * on}>
          <rect x={SX} y={SY} width={SW} height={SH} fill={`url(#${id}-sky)`} />
          {Array.from({length: 22}).map((_, i) => <circle key={i} cx={SX + rnd(i) * SW} cy={SY + rnd(i * 3) * 140} r={1.5 + rnd(i * 7) * 2} fill="#FFFFFF" opacity={0.4 + 0.5 * rnd(i * 5)} />)}
          <circle cx={SX + SW / 2} cy={SY + 186} r={104} fill={`url(#${id}-sun)`} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={SX + SW / 2 - 110} y={SY + 122 + i * 19} width={220} height={4 + i * 2} fill="#6A0F6E" />)}
          <path d={`M${SX},${SY + 190} l90,-70 l60,40 l80,-90 l90,110 h${SW - 640} l90,-100 l70,60 l80,-50 l80,100 v10 H${SX} Z`} fill="#1A0432" />
          <rect x={SX} y={SY + 190} width={SW} height={SH - 190} fill={`url(#${id}-road)`} />
          {Array.from({length: 15}).map((_, i) => {
            const k = (i - 7) / 7;
            return <line key={i} x1={SX + SW / 2 + k * 40} y1={SY + 190} x2={SX + SW / 2 + k * 1500} y2={SY + SH + 40} stroke={i === 7 ? '#FFE66B' : MAG} strokeWidth={i === 7 ? 4 : 2.5} opacity={0.85} strokeDasharray={i === 7 ? '26 20' : undefined} strokeDashoffset={i === 7 ? -road * 300 : 0} />;
          })}
          {Array.from({length: 9}).map((_, i) => {
            const z = ((i + (road * 6) % 1) / 9), y = SY + 190 + (SH - 190) * z * z;
            return <line key={i} x1={SX} x2={SX + SW} y1={y} y2={y} stroke={CY} strokeWidth={1.5 + 3 * z} opacity={0.25 + 0.6 * z} />;
          })}
          {/* speed streaks on boost */}
          {Array.from({length: 12}).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 + 0.3, ph = (t * 0.09 + rnd(i * 4)) % 1, r0 = 60 + ph * 300;
            return <line key={i} x1={SX + SW / 2 + Math.cos(a) * r0 * 1.6} y1={SY + 200 + Math.sin(a) * r0 * 0.7} x2={SX + SW / 2 + Math.cos(a) * (r0 + 90) * 1.6} y2={SY + 200 + Math.sin(a) * (r0 + 90) * 0.7} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.6 * boost * ph} />;
          })}
          {/* the racer */}
          <g transform={`translate(${SX + SW / 2 + 46 * Math.sin(t / 11)},${SY + 330}) rotate(${6 * Math.cos(t / 11)})`}>
            <ellipse cx={0} cy={34} rx={84} ry={12} fill="#000" opacity={0.5} />
            <path d={`M-16,26 L0,${60 + 46 * boost + 8 * Math.sin(t * 1.7)} L16,26 Z`} fill="#FFE66B" /><path d={`M-30,26 L0,${48 + 60 * boost} L30,26 Z`} fill={ORG} opacity={0.55} />
            <path d="M0,-44 L22,-6 L74,22 L26,26 L0,34 L-26,26 L-74,22 L-22,-6 Z" fill="#F4F0FF" stroke={CY} strokeWidth={3} strokeLinejoin="round" />
            <path d="M0,-30 L12,-4 L0,8 L-12,-4 Z" fill="#35174F" />
          </g>
          {/* HUD */}
          <rect x={SX + 22} y={SY + 20} width={210} height={16} rx={8} fill="#000" opacity={0.5} /><rect x={SX + 22} y={SY + 20} width={210 * (0.35 + 0.6 * boost)} height={16} rx={8} fill={LIME} />
          <text x={SX + 22} y={SY + 62} fontFamily={MONO} fontWeight={600} fontSize={19} fill="#FFFFFF" letterSpacing={3}>BOOST</text>
          <g transform={`translate(${SX + SW - 150},${SY + 18})`}>
            <rect width={128} height={46} rx={12} fill="#000" opacity={0.55} stroke={LIME} strokeWidth={2} />
            <text x={64} y={32} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={24} fill={LIME}>{t >= t165 ? '165' : t >= t144 ? '144' : '---'} Hz</text>
          </g>
          <circle cx={SX + 104} cy={SY + 300} r={58} fill="#FFFFFF" opacity={0.1} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={3} />
          <circle cx={SX + 104 + 16 * Math.sin(t / 11)} cy={SY + 300 - 8} r={26} fill="#FFFFFF" opacity={0.45} />
          {[[SX + SW - 86, SY + 322, MAG], [SX + SW - 166, SY + 350, CY]].map(([x, y, c], i) => <circle key={i} cx={Number(x)} cy={Number(y)} r={32} fill={String(c)} opacity={0.35 + 0.3 * flash(t, tPush, 6)} stroke="#FFFFFF" strokeWidth={3} />)}
        </g>
        {/* touch layer over the game */}
        {touch > 0.01 ? (
          <g opacity={touch}>
            <rect x={SX} y={SY} width={SW} height={SH} fill="#03000A" opacity={0.5} />
            {Array.from({length: 17}).map((_, i) => <line key={`c${i}`} x1={SX + i * 51} x2={SX + i * 51} y1={SY} y2={SY + SH} stroke={CY} strokeWidth={2} opacity={0.55} />)}
            {Array.from({length: 9}).map((_, i) => <line key={`r${i}`} y1={SY + i * 51 - 1} y2={SY + i * 51 - 1} x1={SX} x2={SX + SW} stroke={MAG} strokeWidth={2} opacity={0.6} />)}
            <rect x={SX + scanX * SW - 30} y={SY} width={60} height={SH} fill={CY} opacity={0.3 * check} />
            <rect x={SX + 9 * 51} y={SY + 3 * 51 - 1} width={102} height={102} fill={CY} opacity={0.2} stroke="#FFFFFF" strokeWidth={3} />
            {landed ? <circle cx={SX + 10 * 51} cy={SY + 4 * 51} r={14 + ((since * 2.2) % 30)} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={1 - ((since * 2.2) % 30) / 30} /> : null}
          </g>
        ) : null}
        <path d={`M${SX},${SY} h${SW * 0.46} l-150,${SH} H${SX} Z`} fill="#FFFFFF" opacity={0.05} />
      </g>
      <rect x={SX} y={SY} width={SW} height={SH} rx={26} fill="none" stroke={touch > 0.3 ? CY : '#3A3340'} strokeWidth={3} opacity={0.9} />

      {/* ---------------- zoom cone: screen patch -> touch-layer panel ---------------- */}
      {touch > 0.01 ? (
        <g opacity={touch * 0.9}>
          <path d={`M${SX + 9 * 51},${SY + 5 * 51} L${QX + 40},${QY} H${QX + QW - 40} L${SX + 11 * 51},${SY + 5 * 51} Z`} fill={`url(#${id}-cone)`} />
          <line x1={SX + 9 * 51} y1={SY + 5 * 51} x2={QX + 40} y2={QY} stroke={CY} strokeWidth={2.5} strokeDasharray="8 8" />
          <line x1={SX + 11 * 51} y1={SY + 5 * 51} x2={QX + QW - 40} y2={QY} stroke={CY} strokeWidth={2.5} strokeDasharray="8 8" />
        </g>
      ) : null}

      {/* ---------------- the touch layer, magnified ---------------- */}
      <path d={cham(QX + 8, QY + 12, QW, QH, 40)} fill="#030106" />
      <path d={cham(QX, QY, QW, QH, 40)} fill={`url(#${id}-panel)`} stroke={touch > 0.3 ? CY : '#6A2A4A'} strokeWidth={4} />
      <g clipPath={`url(#${id}-pclip)`}>
        <ellipse cx={F[0]} cy={F[1]} rx={620} ry={300} fill={`url(#${id}-cyg)`} opacity={0.1 + 0.25 * touch} />
        {/* row / column traces */}
        {Array.from({length: COLS + 1}).map((_, c) => <line key={`tc${c}`} x1={GX + c * PITCH} x2={GX + c * PITCH} y1={GY - 6} y2={GY + ROWS * PITCH + 6} stroke={CY} strokeWidth={3} opacity={0.12 + 0.3 * sens} />)}
        {Array.from({length: ROWS + 1}).map((_, r) => <line key={`tr${r}`} y1={GY + r * PITCH} y2={GY + r * PITCH} x1={GX - 6} x2={GX + COLS * PITCH + 6} stroke={MAG} strokeWidth={3} opacity={0.12 + 0.3 * sens} />)}
        {/* diamond electrodes: drive (magenta, on rows) and sense (cyan, on columns) */}
        {Array.from({length: COLS * ROWS}).map((_, i) => {
          const c = i % COLS, r = Math.floor(i / COLS), cx = GX + (c + 0.5) * PITCH, cy = GY + (r + 0.5) * PITCH;
          const born = clamp01((t - tTouch) / 6 - (c + r) * 0.07);
          const sc = check * Math.max(0, 1 - Math.abs((c + 0.5) / COLS - scanX) * 5);
          const d = Math.hypot(cx - F[0], cy - F[1]);
          const hit = landed ? Math.exp(-(d * d) / 26000) : 0;
          const wave = landed ? Math.max(0, 1 - Math.abs(d - ((since * 22) % 520)) / 60) * 0.7 : 0;
          const a = 0.16 + 0.34 * born + 0.4 * sc + 0.5 * hit + 0.4 * wave;
          return (
            <g key={i}>
              <path d={diamond(cx, cy, 31)} fill={hit > 0.4 ? '#FFFFFF' : CY} opacity={clamp01(a)} stroke={CY} strokeWidth={2} />
              <path d={diamond(cx, cy, 13)} fill="#030106" opacity={0.55} />
            </g>
          );
        })}
        {Array.from({length: (COLS - 1) * (ROWS - 1)}).map((_, i) => {
          const c = i % (COLS - 1), r = Math.floor(i / (COLS - 1)), cx = GX + (c + 1) * PITCH, cy = GY + (r + 1) * PITCH;
          const born = clamp01((t - tSens) / 6 - (c + r) * 0.07);
          const sr = check * Math.max(0, 1 - Math.abs((r + 1) / ROWS - scanY) * 4);
          const d = Math.hypot(cx - F[0], cy - F[1]);
          const hit = landed ? Math.exp(-(d * d) / 26000) : 0;
          return <path key={i} d={diamond(cx, cy, 31)} fill={hit > 0.5 ? HOT : MAG} opacity={clamp01(0.14 + 0.3 * born + 0.4 * sr + 0.55 * hit)} stroke={MAG} strokeWidth={2} />;
        })}
        {/* scan bars */}
        {check > 0.01 ? <rect x={GX + scanX * COLS * PITCH - 26} y={GY - 10} width={52} height={ROWS * PITCH + 20} fill={CY} opacity={0.4 * check} /> : null}
        {check > 0.01 ? <rect x={GX - 10} y={GY + scanY * ROWS * PITCH - 5} width={COLS * PITCH + 20} height={10} fill="#FFFFFF" opacity={0.5 * check} /> : null}
        {/* touch point: crosshair + rings */}
        {landed ? (
          <g>
            <line x1={F[0]} x2={F[0]} y1={GY - 10} y2={GY + ROWS * PITCH + 10} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="10 8" opacity={0.8} />
            <line y1={F[1]} y2={F[1]} x1={GX - 10} x2={GX + COLS * PITCH + 10} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="10 8" opacity={0.8} />
            {[0, 1, 2].map((k) => {
              const ph = ((since + k * 6) % 18) / 18;
              return <circle key={k} cx={F[0]} cy={F[1]} r={40 + ph * 330} fill="none" stroke={k === 1 ? CY : '#FFFFFF'} strokeWidth={9 * (1 - ph)} opacity={1 - ph} />;
            })}
            <circle cx={F[0]} cy={F[1]} r={90} fill={`url(#${id}-cyg)`} />
          </g>
        ) : null}
        <path d={`M${QX},${QY} h${QW} v80 h${-QW} Z`} fill={`url(#${id}-gloss)`} opacity={0.3} />
      </g>
      {/* panel header */}
      <rect x={QX + 34} y={QY - 24} width={410} height={50} rx={12} fill={INK} stroke={touch > 0.3 ? CY : '#6A2A4A'} strokeWidth={3} />
      <circle cx={QX + 62} cy={QY + 1} r={8} fill={touch > 0.3 ? CY : '#6A2A4A'} opacity={0.5 + 0.5 * Math.sin(t / 2) ** 2} />
      <text x={QX + 84} y={QY + 10} fontFamily={MONO} fontWeight={600} fontSize={23} fill={touch > 0.3 ? '#FFFFFF' : '#B07A92'} letterSpacing={3}>{touch > 0.3 ? 'TOUCH SENSOR GRID' : 'UNDER THE GLASS'}</text>

      {/* fingertip */}
      {fq > 0.01 ? (
        <g transform={`translate(${fx - 30},${fy - 46}) rotate(-33)`} opacity={clamp01(fq * 2)}>
          <path d="M-74,74 A74,74 0 0 1 74,74 V760 H-74 Z" fill="#000" opacity={0.35} transform="translate(22,26)" />
          <path d="M-74,74 A74,74 0 0 1 74,74 V760 H-74 Z" fill={`url(#${id}-skin)`} stroke={MAG} strokeWidth={4} strokeOpacity={0.8} />
          <path d="M-46,64 A46,50 0 0 1 46,64 V128 A46,26 0 0 1 -46,128 Z" fill="#FFE2D2" opacity={0.75} stroke="#D99A7C" strokeWidth={2.5} />
          <path d="M-34,58 A34,36 0 0 1 10,26" fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
          <path d="M-52,236 Q0,252 52,236 M-50,262 Q0,276 50,262" fill="none" stroke="#B8704F" strokeWidth={3} opacity={0.6} />
          <path d="M66,90 V700" stroke={CY} strokeWidth={5} opacity={0.5} />
        </g>
      ) : null}

      {/* ---------------- scan counter ---------------- */}
      <g transform={`translate(${QX + QW - 20},${QY - 2})`} opacity={0.5 + 0.5 * sens}>
        <rect x={-486} y={-36} width={492} height={98} rx={18} fill="#000" opacity={0.5} />
        <rect x={-492} y={-44} width={492} height={98} rx={18} fill={INK} stroke={done ? LIME : CY} strokeWidth={4} />
        <rect x={-488} y={-40} width={484} height={34} rx={15} fill="#FFFFFF" opacity={0.08} />
        <text x={-470} y={-12} fontFamily={MONO} fontWeight={600} fontSize={17} fill={done ? LIME : CY} letterSpacing={4}>SCANS</text>
        {done ? (
          <g>
            <text x={-470 + 0} y={38} fontFamily={FONT} fontWeight={800} fontSize={44 + 6 * (1 - thou)} fill="#FFFFFF" letterSpacing={0}>THOUSANDS</text>
            <g transform={`translate(-82,8) scale(${per})`}>
              <rect x={-66} y={-30} width={140} height={60} rx={14} fill={LIME} />
              <text x={4} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={INK}>/ SEC</text>
            </g>
          </g>
        ) : (
          <g>
            {Array.from({length: 7}).map((_, i) => {
              // non-numeric scan activity: blocks streaming through each cell while the counter "rolls"
              return (
                <g key={i} transform={`translate(${-470 + i * 62},0)`}>
                  <rect x={0} y={-2} width={54} height={46} rx={8} fill="#1C0A22" stroke={rolling ? CY : '#6A2A4A'} strokeWidth={2} />
                  {rolling ? [0, 1, 2, 3].map((k) => {
                    const on = rnd(Math.floor(t * 2) * 7.3 + i * 3.1 + k * 1.7) > 0.35;
                    return <rect key={k} x={7} y={3 + k * 10} width={40 * (0.45 + 0.55 * rnd(Math.floor(t * 2) * 3.9 + i * 5.3 + k))} height={7} rx={3.5} fill={k % 2 ? '#FFFFFF' : CY} opacity={on ? 0.9 : 0.2} />;
                  }) : <rect x={15} y={19} width={24} height={5} rx={2.5} fill={sens > 0.3 ? CY : '#6A2A4A'} opacity={0.4 + 0.6 * Math.sin(t / 3 + i) ** 2} />}
                </g>
              );
            })}
          </g>
        )}
        {t > tThou + 9 && t - tThou - 9 < 14 ? <rect x={-492 - (t - tThou - 9) * 3} y={-44 - (t - tThou - 9) * 2} width={492 + (t - tThou - 9) * 6} height={98 + (t - tThou - 9) * 4} rx={24} fill="none" stroke={LIME} strokeWidth={5} opacity={1 - (t - tThou - 9) / 14} /> : null}
        {t > tSecond && t - tSecond < 14 ? <rect x={-492 - (t - tSecond) * 3} y={-44 - (t - tSecond) * 2} width={492 + (t - tSecond) * 6} height={98 + (t - tSecond) * 4} rx={24} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={1 - (t - tSecond) / 14} /> : null}
      </g>
      {/* floor rail */}
      <rect x={-400} y={1800} width={1880} height={6} fill={`url(#${id}-rgb)`} opacity={0.5 + 0.5 * rgb} />
      <rect x={-400} y={1806} width={1880} height={400} fill="#070108" opacity={0.8} />
      {Array.from({length: 30}).map((_, i) => <path key={i} d={`M${-100 + i * 46},1830 l16,0 l-12,26 l-16,0 Z`} fill={i % 5 === Math.floor(t / 3) % 5 ? ORG : '#3A0A1E'} />)}
    </svg>
  );
};

export const S07: WorldDef = {
  id: 'touchgrid', home: 'phone',
  anchors: {phone: {x: 540, y: 1018, zoom: 1}},
  palette: {bg0: '#0A0206', bg1: '#3A0A1E', particles: '#FF9A6A', glow: '#FF2D6B'},
  Draw,
};
