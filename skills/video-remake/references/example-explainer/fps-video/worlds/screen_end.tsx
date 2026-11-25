// S11 payoff (callback: phone flipbook + FPS / Hz gauges + the chip; the gauges LOCK on 'match') and
// S12 CTA (phone profile: Follow -> Following, then the 'Part 2: Input lag' card). Art from screen_kit / screen_factory.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, Burst, Ripple} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {clamp01, lerp, smooth, easeIO, outC, rnd, tri, decay, CY, MG, VIO, GRN, INK, AM, FONT, MONO,
        Stage3, L3, t3, rX, rY, rZ, Defs, FrameArt, FrameCard, Phone3D, Gauge, Finger, CW, CH} from './screen_kit';
import {DieTop} from './screen_factory';

const WW = 2600, WH = 3200;
const OXW = 760, OYW = 582;                       // frame px (1080 x 1920 at zoom 1) -> world px
const PW = 780, PH = 1600, BZ = 22, SW = PW - 2 * BZ, SH = PH - 2 * BZ;
const NF = 14;
const frameP = (n: number) => tri(n / NF);
const frameDir = (n: number) => ((((n % (2 * NF)) + 2 * NF) % (2 * NF)) < NF ? 1 : -1);

// =====================================================================================================================
// S11 - payoff
// =====================================================================================================================
const a = 's11';
const PHN = {x: 610 + OXW, y: 915 + OYW, s: 0.57};
const G1 = {x: 275 + OXW, y: 1535 + OYW, R: 200}, G2 = {x: 805 + OXW, y: 1535 + OYW, R: 200};
const CHIP = {x: 196 + OXW, y: 1175 + OYW, s: 0.4};
const LOCK = {x: 540 + OXW, y: 1535 + OYW};

const S11Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tFrames = wordAt(beats, 'frames', 24.5), tPer = wordAt(beats, 'per', 35), tSec = wordAt(beats, 'second', 42);
  const tFast1 = 70.5, tPict = wordAt(beats, 'pictures', 80), tMade = wordAt(beats, 'made', 93.5), tHz = wordAt(beats, 'hertz', 114), tFast2 = 140.5;
  const tThey = wordAt(beats, "they're", 147.5), tShown = wordAt(beats, 'shown', 153), tSmooth = wordAt(beats, 'smooth', 177.5), tWhen = wordAt(beats, 'when', 191), tMatch = wordAt(beats, 'match', 200);
  const locked = t >= tMatch, lock = sp(t, tMatch, 'pop');
  const dip = (at: number) => smooth((t - at + 6) / 5) * (1 - smooth((t - at - 1) / 7));
  const m = easeIO((t - tWhen) / Math.max(1, tMatch - tWhen));
  const fpsVal = lerp(90, 120, m) + (locked ? 0 : 44 * dip(tFast1) + 2.5 * Math.sin(t * 0.9));
  const hzVal = lerp(144, 120, m) + (locked ? 0 : -50 * dip(tFast2 - 3) * (1 - smooth((t - tFast2) / 5)) + 1.5 * Math.sin(t * 0.6 + 2));
  const fpsLit = 0.35 + 0.65 * sp(t, tFrames, 'settle'), hzLit = 0.35 + 0.65 * sp(t, tHz, 'settle');
  const fpsSweep = clamp01((t - tPer) / (tSec - tPer + 4));

  // the picture on the phone: torn + stuttering until the lock, then perfectly smooth
  const vn = t / 2.3;
  const stut = Math.floor(vn / 2.6) * 2.6 + (rnd(Math.floor(vn / 2.6)) > 0.5 ? 0.9 : 0);
  const pic = locked ? vn : stut;
  const tearY = 380 + ((t * 23) % 700), tear = locked ? 0 : 46 + 20 * Math.sin(t * 0.8);
  const sm = sp(t, tSmooth, 'settle');
  // the frame card: made by the chip, shown by the screen
  const born = sp(t, tPict, 'settle'), made = sp(t, tMade, 'bouncy'), fly = easeIO((t - tThey) / Math.max(1, tShown - tThey + 1.5));
  const cx = lerp(CHIP.x, PHN.x, fly), cy = lerp(CHIP.y - 60 - 150 * born - 30 * made, PHN.y - 30, fly) - Math.sin(fly * Math.PI) * 160;
  const cs = lerp(0.12 + 0.14 * born + 0.08 * made, 0.5, fly), co = Math.min(1, born * 2) * (1 - smooth((t - tShown) / 3));
  const cores = 0.3 + 0.7 * Math.max(sp(t, tFrames, 'settle') * 0.5, decay(t, tPict, 14), decay(t, tMade, 10), lock);
  const phoneTf = `${t3(PHN.x, PHN.y)} ${rZ(-3)} ${rX(6)} ${rY(-13 + 3 * Math.sin(t / 37))} scale(${PHN.s}) ${t3(-PW / 2, -PH / 2)}`;
  const rimC = locked ? GRN : MG;
  const rimO = Math.max(0.25 + 0.3 * hzLit, decay(t, tShown, 8), lock);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}}>
      <Defs id={a} />
      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`${a}-die`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2A3350" /><stop offset="0.4" stopColor="#0D1124" /><stop offset="0.7" stopColor="#090B18" /><stop offset="1" stopColor="#1C2440" /></linearGradient>
        </defs>
        <circle cx={PHN.x} cy={PHN.y} r={1100} fill={`url(#${a}-${locked ? 'gg' : 'gv'})`} opacity={0.75} />
        <circle cx={G1.x} cy={G1.y} r={700} fill={`url(#${a}-gc)`} opacity={0.25 + 0.2 * fpsLit} />
        <circle cx={G2.x} cy={G2.y} r={700} fill={`url(#${a}-gm)`} opacity={0.2 + 0.25 * hzLit} />
        {[0, 1, 2, 3].map((k) => <ellipse key={k} cx={LOCK.x} cy={LOCK.y + 250} rx={380 + k * 200} ry={(380 + k * 200) * 0.18} fill="none" stroke={locked ? GRN : k % 2 ? MG : CY} strokeWidth={3} opacity={0.36 - k * 0.07} />)}
        {/* the hook's frame cards, fanned behind the phone - they riffle in a smooth wave after the lock */}
        {Array.from({length: 9}).map((_, i) => {
          const k = i - 4, wv = locked ? 0.5 + 0.5 * Math.sin(t * 0.5 - i * 0.7) : 0.25 + 0.1 * Math.sin(t * 0.13 + i);
          const pp = frameP(i * 1.5 + (locked ? t / 3 : Math.floor(t / 9)));
          return (
            <g key={i} transform={`translate(${PHN.x + 10},${PHN.y + 420}) rotate(${k * 13 + (locked ? Math.sin(t * 0.25) * 2 : 0)}) translate(-150,${-1050 - wv * 40})`} opacity={0.3 + 0.5 * wv}>
              <rect width={300} height={360} rx={24} fill="#1A1668" stroke={locked ? GRN : i % 2 ? MG : CY} strokeWidth={5} />
              <line x1={0} y1={270} x2={300} y2={270} stroke={CY} strokeWidth={3} opacity={0.7} />
              <circle cx={50 + pp * 200} cy={245 - Math.abs(Math.sin(pp * Math.PI * 3)) * 170} r={24} fill={CY} />
            </g>
          );
        })}
        <ellipse cx={PHN.x} cy={PHN.y + 520} rx={420} ry={80} fill={`url(#${a}-sh)`} />
        <ellipse cx={CHIP.x + 10} cy={CHIP.y + 60} rx={230} ry={90} fill={`url(#${a}-sh)`} />
      </svg>

      <Stage3 w={WW} h={WH} ox={PHN.x} oy={PHN.y} persp={2600}>
        <Phone3D id={a} tf={phoneTf} w={PW} h={PH} rim={rimC} rimO={rimO}>
          <g>
            <FrameArt id={a} w={SW} h={SH} p={frameP(pic)} dir={frameDir(pic)} trail={locked ? 14 : Math.round(4 * sm)} ghosts={locked ? 0 : 2} gstep={2.6 / NF} />
            {tear > 0 ? (
              <g>
                <clipPath id={`${a}-tear`}><rect y={tearY} width={SW} height={150} /></clipPath>
                <g clipPath={`url(#${a}-tear)`}><g transform={`translate(${tear},0)`}><FrameArt id={a} w={SW} h={SH} p={frameP(pic + 1.3)} dir={frameDir(pic)} /></g></g>
                <rect y={tearY - 3} width={SW} height={6} fill="#FFFFFF" opacity={0.8} /><rect y={tearY + 147} width={SW} height={5} fill={MG} opacity={0.8} />
              </g>
            ) : null}
            {t > tShown && t < tShown + 12 ? <rect width={SW} height={SH} fill="#FFFFFF" opacity={0.7 * (1 - (t - tShown) / 12)} /> : null}
            {locked ? <rect width={SW} height={SH} fill={GRN} opacity={0.35 * decay(t, tMatch, 8)} /> : null}
            {/* status pill */}
            <g transform={`translate(${SW / 2},190)`}>
              <rect x={-190} y={-44} width={380} height={88} rx={44} fill={locked ? GRN : 'rgba(6,8,24,0.75)'} stroke={locked ? '#FFFFFF' : MG} strokeWidth={4} />
              <text y={17} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={46} fill={locked ? INK : '#FFFFFF'} letterSpacing={3}>{locked ? 'SMOOTH' : 'TEARING'}</text>
            </g>
          </g>
        </Phone3D>
        {/* the chip (frame factory) */}
        {[1, 2, 3, 4].map((k) => (
          <L3 key={k} tf={`${t3(CHIP.x, CHIP.y - k * 7)} ${rX(56)} scale(${CHIP.s}) ${t3(-330, -330)}`} w={660} h={660}>
            <div style={{width: 660, height: 660, borderRadius: 34, background: k === 1 ? 'linear-gradient(135deg,#14508A,#0A2348)' : 'linear-gradient(90deg,#3A4468,#0B0E1E 30%,#141A32 70%,#05060E)', boxSizing: 'border-box', border: k === 1 ? '10px dashed #D9B45A' : 'none', transform: k === 1 ? 'scale(1.22)' : undefined}} />
          </L3>
        ))}
        <L3 tf={`${t3(CHIP.x, CHIP.y - 34)} ${rX(56)} scale(${CHIP.s}) ${t3(-330, -330)}`} w={660} h={660}>
          <DieTop id={a} t={t} cores={cores} flash={Math.max(decay(t, tMade, 6), lock * decay(t, tMatch, 8))} lit={cores} />
        </L3>
      </Stage3>

      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* link between the gauges: unequal -> equal -> locked */}
        <line x1={G1.x + G1.R} y1={LOCK.y} x2={G2.x - G2.R} y2={LOCK.y} stroke={locked ? GRN : '#FFFFFF'} strokeWidth={locked ? 16 : 6} strokeDasharray={locked ? undefined : '10 14'} opacity={locked ? 1 : 0.35 + 0.4 * m} />
        {sm > 0.01 ? (() => {
          const N = 36, n = Math.max(2, Math.round((N + 1) * clamp01((t - tSmooth) / 10)));
          const pts = Array.from({length: N + 1}).map((_, i) => {
            const q = i / N;
            return `${lerp(G1.x - 60, G2.x + 60, q).toFixed(1)},${(G1.y - 262 + Math.sin(q * Math.PI * 3 - t * 0.4) * 30 * (locked ? 1 : 1 + 0.6 * Math.sin(q * 40 + t))).toFixed(1)}`;
          });
          return <g opacity={sm}><polyline points={pts.slice(0, n).join(' ')} fill="none" stroke={locked ? GRN : VIO} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} /><polyline points={pts.slice(0, n).join(' ')} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /></g>;
        })() : null}
        <g transform={`translate(${G1.x - 22 * lock * 0},${G1.y})`}><Gauge id={a} R={G1.R} color={CY} label="FPS" val={fpsVal} lit={fpsLit} lock={lock} readout={locked ? '120' : '90'} sweep={fpsSweep} /></g>
        <g transform={`translate(${G2.x},${G2.y})`}><Gauge id={a} R={G2.R} color={MG} label="Hz" val={hzVal} lit={hzLit} lock={lock} readout={locked ? '120' : '144'} /></g>
        {/* the lock */}
        <g transform={`translate(${LOCK.x},${LOCK.y}) scale(${1 + 0.35 * decay(t, tMatch, 5) + 0.06 * m * (1 - lock)})`}>
          <circle r={150} fill={`url(#${a}-${locked ? 'gg' : 'gv'})`} opacity={0.5 + 0.5 * lock} />
          <circle r={74} fill={locked ? GRN : '#0B0E26'} stroke={locked ? '#FFFFFF' : '#8E96C8'} strokeWidth={6} />
          {locked ? (
            <g>
              <rect x={-30} y={-8} width={60} height={46} rx={10} fill={INK} /><path d="M-18,-8 V-22 A18,18 0 0 1 18,-22 V-8" fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" />
              <circle cx={0} cy={14} r={7} fill={GRN} />
            </g>
          ) : (
            <g stroke="#FFFFFF" strokeWidth={11} strokeLinecap="round" opacity={0.6 + 0.4 * m}><line x1={-28} y1={-13} x2={28} y2={-13} /><line x1={-28} y1={13} x2={28} y2={13} /><line x1={18} y1={-36} x2={-18} y2={36} opacity={1 - m} /></g>
          )}
        </g>
        {locked && t < tMatch + 22 ? <circle cx={LOCK.x} cy={LOCK.y} r={80 + (t - tMatch) * 46} fill="none" stroke={GRN} strokeWidth={12 * (1 - (t - tMatch) / 22)} opacity={1 - (t - tMatch) / 22} /> : null}
        <Burst t={t} at={tMatch} x={LOCK.x} y={LOCK.y} color={GRN} n={26} r={620} />
        {/* the frame card */}
        {co > 0.01 ? (
          <g transform={`translate(${cx},${cy}) rotate(${lerp(-8, -3, fly)}) scale(${cs}) translate(${-CW / 2},${-CH / 2})`} opacity={co}>
            <FrameCard id={a} p={frameP(5)} dir={1} pip={5} hot={1} />
          </g>
        ) : null}
        <Burst t={t} at={tMade} x={CHIP.x} y={CHIP.y - 240} color={CY} n={18} r={300} />
        <Burst t={t} at={tShown} x={PHN.x} y={PHN.y - 30} color={MG} n={22} r={520} />
        <Ripple t={t} at={tSec} x={G1.x} y={G1.y} color="#FFFFFF" r={330} />
        <Burst t={t} at={tFrames} x={G1.x} y={G1.y} color={CY} n={14} r={330} />
        <Burst t={t} at={tHz} x={G2.x} y={G2.y} color={MG} n={14} r={330} />
        {/* MADE / SHOWN tags */}
        {[['MADE', tMade, CHIP.x + 14, CHIP.y + 118, CY], ['SHOWN', tShown, PHN.x + 268, PHN.y + 372, MG]].map(([w, at, x, y, c]) => {
          const p = sp(t, at as number, 'bouncy');
          return p > 0.01 ? (
            <g key={w as string} transform={`translate(${x},${y}) scale(${p})`}>
              <rect x={-92} y={-32} width={184} height={64} rx={32} fill={locked ? GRN : (c as string)} stroke="#FFFFFF" strokeWidth={3} />
              <text y={13} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={36} fill={INK} letterSpacing={3}>{w}</text>
            </g>
          ) : null;
        })}
      </svg>
    </div>
  );
};

export const S11: WorldDef = {
  id: 'S11-payoff', home: 'home',
  anchors: {home: {x: 1300, y: 1600, zoom: 1}},
  palette: {bg0: '#030516', bg1: '#1A1C66', particles: '#B8C8FF', glow: '#5C7CFF'},
  Draw: S11Draw,
};

// =====================================================================================================================
// S12 - CTA
// =====================================================================================================================
const c = 's12';
const P12 = {x: 540 + OXW, y: 1290 + OYW};
const BTN = {x: 46, y: 490, w: SW - 92, h: 112};
const BTNW: [number, number] = [P12.x + BTN.x + BTN.w / 2 + BZ - PW / 2, P12.y + BTN.y + BTN.h / 2 + BZ - PH / 2];
const CARD = {x: 80 + OXW, y: 1262 + OYW, w: 920, h: 440};

const Thumb: React.FC<{k: number; w: number; h: number; t: number}> = ({k, w, h, t}) => (
  <g>
    <rect width={w} height={h} rx={20} fill={['#1A1668', '#141A5C', '#2A1470', '#0B2C63', '#231262', '#10245A'][k % 6]} stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
    {k % 3 === 0 ? (
      <>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={w * (0.18 + i * 0.16)} cy={h * 0.55 - Math.abs(Math.sin((i / 4) * Math.PI * 2)) * h * 0.3} r={i === 4 ? 16 : 9} fill={CY} opacity={i === 4 ? 1 : 0.25 + i * 0.12} />)}<line x1={12} y1={h * 0.62} x2={w - 12} y2={h * 0.62} stroke={VIO} strokeWidth={3} /></>
    ) : k % 3 === 1 ? (
      <><circle cx={w / 2} cy={h * 0.44} r={w * 0.26} fill="none" stroke={MG} strokeWidth={9} strokeDasharray={`${w * 1.1} ${w}`} transform={`rotate(140 ${w / 2} ${h * 0.44})`} /><line x1={w / 2} y1={h * 0.44} x2={w / 2 + w * 0.17 * Math.cos(-0.9 + 0.1 * Math.sin(t * 0.2 + k))} y2={h * 0.44 + w * 0.17 * Math.sin(-0.9)} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" /></>
    ) : (
      <><rect x={w * 0.26} y={h * 0.22} width={w * 0.48} height={w * 0.48} rx={10} fill="#06102A" stroke={CY} strokeWidth={5} />{[0, 1, 2, 3].map((i) => <rect key={i} x={w * 0.3 + (i % 2) * w * 0.22} y={h * 0.22 + w * 0.05 + Math.floor(i / 2) * w * 0.22} width={w * 0.17} height={w * 0.17} rx={5} fill={CY} opacity={0.35 + 0.3 * ((i + k) % 2)} />)}</>
    )}
    <rect x={14} y={h - 46} width={w * 0.6} height={11} rx={5.5} fill="#FFFFFF" opacity={0.6} /><rect x={14} y={h - 26} width={w * 0.38} height={9} rx={4.5} fill="#FFFFFF" opacity={0.28} />
  </g>
);

const S12Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tFol = wordAt(beats, 'follow', 7), tPart = wordAt(beats, 'part', 19), tTwo = wordAt(beats, 'two', 25), tWhat = wordAt(beats, 'what', 42.5);
  const tInput = wordAt(beats, 'input', 49.5), tLag = wordAt(beats, 'lag', 59.5), tReally = wordAt(beats, 'really', 66.5);
  const following = t > tFol + 1.5;
  const flip = clamp01((t - tFol - 0.5) / 4), flipS = Math.abs(Math.cos(flip * Math.PI));
  const press = smooth((t - tFol + 4) / 4) * (1 - smooth((t - tFol - 3) / 6));
  const fingerIn = smooth((t + 4) / 9), fingerOut = smooth((t - tFol - 5) / 9);
  const calm = Math.exp(-t / 45);
  const phoneTf = `${t3(P12.x, P12.y)} ${rZ(-1.5 * calm)} ${rX(5)} ${rY(-6 + 4 * Math.sin(t / 16) * calm)} ${t3(-PW / 2, -PH / 2)}`;
  const next = sp(t, tPart, 'pop'), two = sp(t, tTwo, 'bouncy'), what = sp(t, tWhat, 'bouncy') * (1 - smooth((t - tInput - 2) / 5));
  const card = sp(t, tInput, 'settle'), lag = sp(t, tLag, 'pop'), really = clamp01((t - tReally) / 12);
  const TW = (SW - 92 - 28) / 3;
  // the lag demo: tap now ... the screen answers late
  const lp = ((t - tLag) % 34 + 34) % 34, tap = t > tLag ? decay(lp, 0, 5) : 0, ans = t > tLag ? smooth((lp - 13) / 3) * (1 - smooth((lp - 27) / 5)) : 0;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}}>
      <Defs id={c} />
      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <circle cx={P12.x} cy={P12.y - 200} r={1300} fill={`url(#${c}-gv)`} opacity={0.85} />
        <circle cx={P12.x + 500} cy={P12.y + 300} r={900} fill={`url(#${c}-gm)`} opacity={0.22 + 0.2 * card} />
        <circle cx={P12.x - 500} cy={P12.y - 500} r={800} fill={`url(#${c}-gc)`} opacity={0.2} />
        {Array.from({length: 14}).map((_, i) => {
          const x = OXW - 80 + rnd(i * 2.1) * 1240, y = OYW + 420 + rnd(i * 4.3) * 1500 + Math.sin(t * 0.05 + i) * 16 * (0.3 + calm), s = 0.6 + rnd(i * 7) * 0.8, kind = i % 3;
          return (
            <g key={i} transform={`translate(${x},${y}) scale(${s}) rotate(${(rnd(i) - 0.5) * 30})`} opacity={0.2}>
              {kind === 0 ? <path d="M0,18 C-40,-10 -22,-46 0,-22 C22,-46 40,-10 0,18 Z" fill={MG} />
                : kind === 1 ? <><rect x={-30} y={-36} width={60} height={72} rx={10} fill="none" stroke={CY} strokeWidth={6} /><circle cx={0} cy={6} r={9} fill={CY} /></>
                : <><circle r={26} fill="none" stroke={VIO} strokeWidth={7} /><polygon points="-8,-12 -8,12 14,0" fill={VIO} /></>}
            </g>
          );
        })}
      </svg>

      <Stage3 w={WW} h={WH} ox={P12.x} oy={P12.y - 300} persp={3200}>
        <Phone3D id={c} tf={phoneTf} w={PW} h={PH} rim={GRN} rimO={decay(t, tFol + 1, 10)}>
          {/* cover */}
          <rect width={SW} height={250} fill={`url(#${c}-edge)`} opacity={0.9} />
          {Array.from({length: 8}).map((_, i) => <circle key={i} cx={rnd(i * 3.1) * SW} cy={rnd(i * 5.3) * 250} r={30 + rnd(i) * 80} fill="#FFFFFF" opacity={0.08} />)}
          {/* avatar: the series' bouncing ball */}
          <circle cx={150} cy={250} r={110} fill="#0B0C26" />
          <circle cx={150} cy={250} r={98} fill={`url(#${c}-face)`} stroke={`url(#${c}-edge)`} strokeWidth={7} />
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={100 + i * 26} cy={270 - Math.abs(Math.sin((i / 3) * Math.PI)) * 46} r={8 + i * 2} fill={CY} opacity={0.25 + i * 0.15} />)}
          <circle cx={196} cy={262} r={24} fill={`url(#${c}-ball)`} stroke={MG} strokeWidth={4} />
          {/* name + bio as grey bars (no name, no handle, no counts) */}
          <rect x={282} y={282} width={300} height={32} rx={16} fill="#FFFFFF" opacity={0.85} />
          <rect x={282} y={330} width={196} height={18} rx={9} fill="#FFFFFF" opacity={0.35} />
          <rect x={46} y={400} width={520} height={16} rx={8} fill="#FFFFFF" opacity={0.25} /><rect x={46} y={432} width={390} height={16} rx={8} fill="#FFFFFF" opacity={0.16} />
          {/* follow button */}
          <g transform={`translate(${BTN.x + BTN.w / 2},${BTN.y + BTN.h / 2}) scale(${1 - 0.06 * press},${(1 - 0.06 * press) * Math.max(0.08, flipS)})`}>
            <rect x={-BTN.w / 2 + 6} y={-BTN.h / 2 + 10} width={BTN.w} height={BTN.h} rx={BTN.h / 2} fill="#000" opacity={0.45} />
            {following ? (
              <>
                <rect x={-BTN.w / 2} y={-BTN.h / 2} width={BTN.w} height={BTN.h} rx={BTN.h / 2} fill="#141633" stroke={GRN} strokeWidth={5} />
                <circle cx={-136} cy={0} r={29} fill={GRN} /><path d="M-150,0 L-139,11 L-121,-10" fill="none" stroke="#0B2415" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                <text x={28} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={52} fill="#FFFFFF">Following</text>
              </>
            ) : (
              <>
                <rect x={-BTN.w / 2} y={-BTN.h / 2} width={BTN.w} height={BTN.h} rx={BTN.h / 2} fill={`url(#${c}-btn)`} />
                <rect x={-BTN.w / 2 + 8} y={-BTN.h / 2 + 6} width={BTN.w - 16} height={BTN.h * 0.42} rx={BTN.h * 0.21} fill="#FFFFFF" opacity={0.18} />
                <text x={0} y={19} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={54} fill="#FFFFFF">Follow</text>
              </>
            )}
          </g>
          {/* tabs + grid */}
          {[0, 1, 2].map((i) => <rect key={i} x={SW * (0.2 + i * 0.3) - 60} y={664} width={120} height={18} rx={9} fill="#FFFFFF" opacity={i === 0 ? 0.8 : 0.25} />)}
          <rect x={SW * 0.2 - 70} y={700} width={140} height={6} rx={3} fill={VIO} /><rect y={714} width={SW} height={2} fill="#FFFFFF" opacity={0.08} />
          {Array.from({length: 9}).map((_, i) => <g key={i} transform={`translate(${46 + (i % 3) * (TW + 14)},${744 + Math.floor(i / 3) * 264})`}><Thumb k={i} w={TW} h={250} t={t} /></g>)}
          {/* the next video in the grid */}
          {next > 0.01 ? (
            <g transform={`translate(${46 + TW + 14},744)`}>
              <rect x={-5} y={-5} width={TW + 10} height={260} rx={24} fill="none" stroke={AM} strokeWidth={7} opacity={next} />
              <g transform={`translate(${TW / 2},40) scale(${0.6 + 0.4 * next + 0.25 * decay(t, tTwo, 5)})`}>
                <rect x={-88} y={-26} width={176} height={52} rx={26} fill={AM} />
                <text y={12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={INK} letterSpacing={2}>{two > 0.3 ? 'PART 2' : 'PART'}</text>
              </g>
              {what > 0.01 ? <g transform={`translate(${TW / 2},140) scale(${what})`}><circle r={56} fill="#FFFFFF" /><text y={30} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={84} fill={VIO}>?</text></g> : null}
            </g>
          ) : null}
        </Phone3D>
      </Stage3>

      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* press ripple + hearts */}
        {t > tFol && t < tFol + 22 ? (() => {
          const q = (t - tFol) / 22, e = outC(q);
          return (
            <g>
              <circle cx={BTNW[0]} cy={BTNW[1]} r={60 + 520 * e} fill="none" stroke={GRN} strokeWidth={10 * (1 - q)} opacity={1 - q} />
              <circle cx={BTNW[0]} cy={BTNW[1]} r={420} fill={`url(#${c}-gg)`} opacity={(1 - q) * 0.8} />
              {Array.from({length: 14}).map((_, i) => {
                const an = -Math.PI / 2 + (rnd(i * 2.3) - 0.5) * 2.6, d = (160 + rnd(i * 3.7) * 400) * e;
                return <path key={i} d="M0,18 C-40,-10 -22,-46 0,-22 C22,-46 40,-10 0,18 Z" fill={i % 3 ? MG : '#FFFFFF'} opacity={1 - q} transform={`translate(${BTNW[0] + Math.cos(an) * d},${BTNW[1] + Math.sin(an) * d - 80 * q}) scale(${(0.6 + rnd(i) * 0.9) * (1 - q * 0.4)}) rotate(${(rnd(i * 5) - 0.5) * 60})`} />;
              })}
            </g>
          );
        })() : null}
        {fingerOut < 1 ? (
          <g transform={`translate(${BTNW[0] + 70 + (1 - fingerIn) * 300 + fingerOut * 380},${BTNW[1] + 44 + (1 - fingerIn) * 520 + fingerOut * 640 - press * 26}) rotate(-24) scale(${1 - 0.05 * press})`} opacity={1 - fingerOut}>
            <Finger id={c} press={press} />
          </g>
        ) : null}

        {/* ---------------- Part 2 card ---------------- */}
        {card > 0.01 ? (
          <g transform={`translate(${CARD.x},${CARD.y + (1 - card) * 760})`} opacity={Math.min(1, card * 1.8)}>
            <ellipse cx={CARD.w / 2 + 20} cy={CARD.h + 40} rx={CARD.w * 0.55} ry={70} fill={`url(#${c}-sh)`} />
            <rect x={14} y={18} width={CARD.w} height={CARD.h} rx={56} fill="#05040F" />
            <rect x={-5} y={-5} width={CARD.w + 10} height={CARD.h + 10} rx={61} fill={`url(#${c}-edge)`} />
            <rect width={CARD.w} height={CARD.h} rx={56} fill={`url(#${c}-glass)`} />
            <clipPath id={`${c}-cc`}><rect width={CARD.w} height={CARD.h} rx={56} /></clipPath>
            <g clipPath={`url(#${c}-cc)`}>
              <rect width={CARD.w} height={CARD.h * 0.45} fill={`url(#${c}-refl)`} />
              {really > 0 && really < 1 ? <polygon points={`${-300 + really * 1500},0 ${-120 + really * 1500},0 ${-320 + really * 1500},${CARD.h} ${-500 + really * 1500},${CARD.h}`} fill="#FFFFFF" opacity={0.22} /> : null}
            </g>
            <rect x={56} y={48} width={212} height={56} rx={28} fill={AM} /><text x={162} y={86} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={32} fill={INK} letterSpacing={4}>NEXT UP</text>
            <text x={56} y={196} fontFamily={FONT} fontWeight={800} fontSize={86} fill="#FFFFFF">Part 2: <tspan fill={CY}>Input</tspan> <tspan fill={lag > 0.5 ? MG : '#FFFFFF'}>lag</tspan></text>
            {/* tap ... (lag) ... the screen reacts */}
            <g transform="translate(0,318)">
              <rect x={56} y={-74} width={CARD.w - 112} height={148} rx={36} fill="#06071C" stroke="rgba(255,255,255,0.16)" strokeWidth={3} />
              <circle cx={150} cy={0} r={34 + 40 * (1 - tap)} fill="none" stroke={CY} strokeWidth={6} opacity={tap} />
              <circle cx={150} cy={0} r={30 - 6 * tap} fill={CY} /><circle cx={150} cy={0} r={12} fill="#FFFFFF" />
              {Array.from({length: 9}).map((_, i) => {
                const on = t > tLag && lp > i * 1.4 && lp < 13 + i * 0.2;
                return <rect key={i} x={220 + i * 48} y={-6} width={30} height={12} rx={6} fill={on ? MG : '#FFFFFF'} opacity={on ? 1 : 0.22} />;
              })}
              <g transform={`translate(${CARD.w - 190},0) scale(${1 + 0.12 * ans})`}>
                <rect x={-84} y={-52} width={168} height={104} rx={18} fill={ans > 0.4 ? '#123A2A' : '#0B0E26'} stroke={ans > 0.4 ? GRN : '#8E96C8'} strokeWidth={6} />
                <circle cx={0} cy={0} r={20 + 8 * ans} fill={ans > 0.4 ? GRN : '#3A4070'} />
              </g>
              {lag > 0.01 ? <text x={220 + 4 * 48 + 15} y={-28} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={30} fill={MG} letterSpacing={6} opacity={lag}>LAG</text> : null}
            </g>
          </g>
        ) : null}
      </svg>
    </div>
  );
};

export const S12: WorldDef = {
  id: 'S12-cta', home: 'home',
  anchors: {home: {x: 1300, y: 1600, zoom: 1}},
  palette: {bg0: '#07031A', bg1: '#3A1670', particles: '#E0C8FF', glow: '#B36BFF'},
  Draw: S12Draw,
};
