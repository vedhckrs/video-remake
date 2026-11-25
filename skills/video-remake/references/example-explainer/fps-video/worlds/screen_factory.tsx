// S02 - Two machines. A perspective factory floor (CSS 3D): the graphics chip is a frame FACTORY (die with glowing
// cores, a laser draws a frame card, cards ride a conveyor) feeding a SCREEN drawn as a window whose refresh shutter
// blinks. Two gauges on posts: FPS by the chip, Hz by the screen.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {wordAt, Burst, Ripple} from '../../../src/kit/explainer/world';
import {sp} from '../../../src/kit/explainer/tokens';
import {clamp01, lerp, smooth, rnd, tri, rampInt, decay, CY, MG, VIO, INK, AM, MONO,
        Stage3, L3, t3, rX, Defs, FrameArt, FrameCard, Gauge, CW, CH} from './screen_kit';

const id = 's02';
const WW = 2600, WH = 3200;
const TH = 56, CS = Math.cos((TH * Math.PI) / 180), SN = Math.sin((TH * Math.PI) / 180);
const PERSP = 2600, OX = 1300, OY = 1250;
const FX = 100, FY = 3000, FW = 2400, FL = 2700;
/** layer lying on the floor (or `h` above it): local (0,0) = floor point (sx0, dFar), x right, y toward the viewer */
const flat = (sx0: number, dFar: number, h = 0) => `${t3(FX + sx0, FY - h, 0)} ${rX(TH)} ${t3(0, -dFar, 0)}`;
/** upright billboard standing on floor point (sx, d), `h` above the floor */
const up = (sx: number, d: number, h = 0) => t3(FX + sx, FY - d * CS - h, -d * SN);
/** where a floor point lands in flat world px */
const pj = (sx: number, d: number, h = 0): [number, number, number] => {
  const k = PERSP / (PERSP + d * SN);
  return [OX + (FX + sx - OX) * k, OY + (FY - d * CS - h - OY) * k, k];
};
const NF = 14;
const frameP = (n: number) => tri(n / NF);
const frameDir = (n: number) => ((((n % (2 * NF)) + 2 * NF) % (2 * NF)) < NF ? 1 : -1);

const DIE = {sx: 1200, d: 520, half: 330, h: 70};
const BELT = {sx: 1200, hw: 190, d0: 880, d1: 2180};
const SCR = {sx: 1200, d: 2260};
const GF = {sx: 520, d: 1120, h: 440, R: 240};
const GH = {sx: 1960, d: 1480, h: 400, R: 290};
const SPACING = 260, NC = 5;
const FY_ = (d: number) => FL - d;   // floor svg y for a depth

/** top face of the graphics-chip die (660 x 660): 3 x 3 glowing cores */
export const DieTop: React.FC<{id: string; t: number; cores: number; flash: number; lit: number}> = ({id, t, cores, flash: flashC, lit}) => (
          <svg width={660} height={660} style={{display: 'block', overflow: 'visible'}}>
            <rect width={660} height={660} rx={34} fill={`url(#${id}-die)`} stroke={CY} strokeWidth={4} strokeOpacity={0.35 + 0.65 * Math.max(lit, flashC)} />
            <rect x={14} y={14} width={632} height={632} rx={24} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.15} />
            {Array.from({length: 9}).map((_, i) => {
              const cx = 60 + (i % 3) * 190, cy = 60 + Math.floor(i / 3) * 190;
              const g = clamp01(cores * (0.55 + 0.45 * Math.sin(t * 0.55 + i * 1.9)) + flashC);
              return (
                <g key={i} transform={`translate(${cx},${cy})`}>
                  <rect width={160} height={160} rx={16} fill="#06102A" stroke={CY} strokeWidth={3} strokeOpacity={0.3 + 0.7 * g} />
                  <rect x={10} y={10} width={140} height={140} rx={10} fill={CY} opacity={0.08 + 0.55 * g} />
                  {[0, 1, 2].map((k) => <line key={k} x1={18} y1={44 + k * 36} x2={142} y2={44 + k * 36} stroke="#FFFFFF" strokeWidth={5} opacity={0.15 + 0.6 * g} />)}
                  <rect x={56} y={56} width={48} height={48} rx={8} fill="#FFFFFF" opacity={0.25 + 0.75 * g} />
                </g>
              );
            })}
            <polygon points="330,0 470,0 190,660 50,660" fill="#FFFFFF" opacity={0.05} />
          </svg>
);

const S02Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tTwo = wordAt(beats, 'two', 8), tNum = wordAt(beats, 'numbers', 14), tDec = wordAt(beats, 'decide', 23.5), tSmooth = wordAt(beats, 'smooth', 40), tFeels = wordAt(beats, 'feels', 52);
  const tFrames = wordAt(beats, 'frames', 83), tPer = wordAt(beats, 'per', 95), tSec = wordAt(beats, 'second', 99.5), tFast = wordAt(beats, 'fast', 137.5);
  const tChip = wordAt(beats, 'chip', 150.5), tDraws = wordAt(beats, 'draws', 156.5), tPict = wordAt(beats, 'pictures', 163.5);
  const tHz = wordAt(beats, 'hertz', 196.5), tOften = wordAt(beats, 'often', 237), tScreen = wordAt(beats, 'screen', 251), tRef = wordAt(beats, 'refreshes', 261);
  const tHow1 = 33.5, tHow2 = tFast - 6, tHow3 = tOften - 6.5;

  const gA = sp(t, tTwo, 'bouncy'), gB = sp(t, tNum, 'bouncy');
  const lit = sp(t, tFrames, 'settle'), scrLit = sp(t, tHz, 'settle');
  const S = (tt: number) => 2.2 * tt + 5 * rampInt(tt, tFrames, 10) + 6 * rampInt(tt, tFast, 10);
  const trav = S(t);
  const dip = (at: number) => smooth((t - at) / 4) * (1 - smooth((t - at - 4) / 5));
  const fpsVal = 34 + 30 * sp(t, tDec, 'bouncy') + 26 * lit - 30 * dip(tHow2) + 54 * sp(t, tFast, 'bouncy') + 12 * dip(tHow1) + 3 * Math.sin(t * 0.7);
  const hzVal = 30 + 30 * sp(t, tDec + 3, 'bouncy') + 12 * dip(tHow1 + 3) - 22 * dip(tHow3) + 60 * sp(t, tOften, 'bouncy') + 1.5 * Math.sin(t * 0.5 + 1);
  const fpsLit = (0.4 + 0.6 * lit) * (1 - 0.45 * scrLit) + 0.5 * decay(t, tFeels, 8), hzLit = 0.4 + 0.6 * scrLit + 0.5 * decay(t, tFeels, 8);
  const fpsSweep = clamp01((t - tPer) / (tSec - tPer + 5)), hzSweep = clamp01((t - tHow3) / (tOften - tHow3 + 8));

  // the hero card: rises on 'chip', is drawn by the laser on 'draws', done on 'pictures', then rides away
  const rise = sp(t, tChip, 'settle'), drawn = clamp01((t - tDraws) / Math.max(1, tPict - tDraws - 0.5));
  const go = smooth((t - tPict - 5) / 14), heroD = lerp(DIE.d, BELT.d0 + 60, go), heroH = DIE.h * (1 - go) + 20 + Math.sin(go * Math.PI) * 130;
  const heroO = rise * (1 - smooth((t - tPict - 15) / 6)), heroS = lerp(0.56, 0.42, go);
  // refresh shutter
  const blinkT = t - tRef, ph = ((blinkT % 12) + 12) % 12;
  const shut = blinkT < 0 ? 0.1 + 0.06 * Math.sin(t * 0.3) : ph < 2.5 ? ph / 2.5 : ph < 5 ? 1 - (ph - 2.5) / 2.5 : 0;
  const tShown = blinkT < 2.5 ? Math.min(t, tRef) : tRef + Math.floor((blinkT - 2.5) / 12) * 12 + 2.5;
  const shownN = Math.floor(S(tShown) / SPACING);
  const cores = Math.max(lit, 0.18 + 0.1 * Math.sin(t * 0.25)), flashC = Math.max(decay(t, tChip, 7), decay(t, tDraws, 6), decay(t, tPict, 8));

  const [gfx, gfy, gfk] = pj(GF.sx, GF.d, GF.h), [ghx, ghy, ghk] = pj(GH.sx, GH.d, GH.h);
  const [dx, dy] = pj(DIE.sx, DIE.d, DIE.h + 200), [sx, sy] = pj(SCR.sx, SCR.d, 700);
  const wave = clamp01((t - tSmooth) / 12) * (1 - smooth((t - tFrames + 6) / 10));

  // stream of cards on the conveyor (far first)
  const stream = Array.from({length: NC}).map((_, j) => {
    const A = trav / SPACING + j, u = (((A % NC) + NC) % NC) * SPACING;
    return {j, u, n: Math.floor(trav / SPACING) + Math.ceil((NC * SPACING - u) / SPACING)};
  }).sort((a, b) => b.u - a.u);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: WH}}>
      <Defs id={id} />
      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#040A1E" /><stop offset="0.6" stopColor="#0A1840" /><stop offset="1" stopColor="#0C2052" /></linearGradient>
          <linearGradient id={`${id}-die`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2A3350" /><stop offset="0.4" stopColor="#0D1124" /><stop offset="0.7" stopColor="#090B18" /><stop offset="1" stopColor="#1C2440" /></linearGradient>
          <linearGradient id={`${id}-pcb`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#14508A" /><stop offset="1" stopColor="#0A2348" /></linearGradient>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7C5C1A" /><stop offset="0.4" stopColor="#F5DC8E" /><stop offset="1" stopColor="#B4842A" /></linearGradient>
          <linearGradient id={`${id}-slat`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A6688" /><stop offset="0.2" stopColor="#1B2242" /><stop offset="1" stopColor="#0A0E22" /></linearGradient>
        </defs>
        <circle cx={sx} cy={sy} r={1200} fill={`url(#${id}-gm)`} opacity={0.18 + 0.4 * scrLit} />
        <circle cx={dx} cy={dy} r={1100} fill={`url(#${id}-gc)`} opacity={0.2 + 0.3 * lit} />
      </svg>

      <Stage3 w={WW} h={WH} ox={OX} oy={OY} persp={PERSP}>
        {/* ---------------- floor ---------------- */}
        <L3 tf={flat(0, FL)} w={FW} h={FL}>
          <svg width={FW} height={FL} style={{display: 'block', overflow: 'visible'}}>
            <rect width={FW} height={FL} rx={60} fill={`url(#${id}-floor)`} />
            {Array.from({length: 17}).map((_, i) => <line key={`v${i}`} x1={i * 150} y1={0} x2={i * 150} y2={FL} stroke="#5C8CFF" strokeWidth={3} opacity={0.13} />)}
            {Array.from({length: 19}).map((_, i) => <line key={`h${i}`} x1={0} y1={i * 150} x2={FW} y2={i * 150} stroke="#5C8CFF" strokeWidth={3} opacity={0.13} />)}
            <ellipse cx={DIE.sx} cy={FY_(DIE.d)} rx={900} ry={760} fill={`url(#${id}-gc)`} opacity={0.25 + 0.45 * lit} />
            <ellipse cx={SCR.sx} cy={FY_(SCR.d - 200)} rx={1000} ry={520} fill={`url(#${id}-gm)`} opacity={0.2 + 0.6 * scrLit} />
            {/* traces out of the chip */}
            {Array.from({length: 18}).map((_, i) => {
              const side = i % 2 ? 1 : -1, k = Math.floor(i / 2), y0 = FY_(DIE.d) - 300 + k * 75, x0 = DIE.sx + side * 420, x1 = x0 + side * (120 + k * 46), y1 = y0 - 260 - k * 60;
              const d = `M${x0},${y0} H${x1} L${x1 + side * 90},${y0 - 90} V${y1}`;
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke="#1B4A9A" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke={CY} strokeWidth={5} strokeLinecap="round" strokeDasharray="60 420" strokeDashoffset={-(t * 14 + k * 53)} opacity={0.25 + 0.75 * lit} />
                  <circle cx={x1 + side * 90} cy={y1} r={13} fill="#0A1840" stroke={CY} strokeWidth={4} opacity={0.5 + 0.5 * lit} />
                </g>
              );
            })}
            {/* conveyor */}
            <rect x={BELT.sx - BELT.hw - 40} y={FY_(BELT.d1) - 20} width={BELT.hw * 2 + 80} height={BELT.d1 - BELT.d0 + 60} rx={30} fill="#000" opacity={0.5} />
            <rect x={BELT.sx - BELT.hw} y={FY_(BELT.d1)} width={BELT.hw * 2} height={BELT.d1 - BELT.d0} fill="#080B1A" />
            {Array.from({length: 15}).map((_, i) => {
              const y = FY_(BELT.d0 + ((i * 90 + trav) % (BELT.d1 - BELT.d0 - 40)) + 20);
              return <polyline key={i} points={`${BELT.sx - 150},${y + 26} ${BELT.sx},${y - 26} ${BELT.sx + 150},${y + 26}`} fill="none" stroke={CY} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={0.12 + 0.3 * lit} />;
            })}
            {[-1, 1].map((s) => (
              <g key={s}>
                <rect x={BELT.sx + s * BELT.hw - 14} y={FY_(BELT.d1)} width={28} height={BELT.d1 - BELT.d0} rx={8} fill={`url(#${id}-metal)`} />
                {Array.from({length: 14}).map((_, i) => {
                  const on = Math.floor(trav / 40) % 14 === i;
                  return <circle key={i} cx={BELT.sx + s * BELT.hw} cy={FY_(BELT.d0 + 50 + i * 92)} r={on ? 12 : 8} fill={on ? '#FFFFFF' : CY} opacity={on ? 1 : 0.35 + 0.4 * lit} />;
                })}
              </g>
            ))}
            {/* chip package: substrate, gold pins, silk */}
            <rect x={DIE.sx - 430} y={FY_(DIE.d) - 430} width={860} height={860} rx={46} fill="#000" opacity={0.55} transform="translate(14,22)" />
            <rect x={DIE.sx - 430} y={FY_(DIE.d) - 430} width={860} height={860} rx={46} fill={`url(#${id}-pcb)`} stroke="#3E8CFF" strokeWidth={5} />
            {Array.from({length: 18}).map((_, i) => (
              <g key={i}>
                <rect x={DIE.sx - 414 + i * 46 + 6} y={FY_(DIE.d) + 392} width={26} height={30} rx={4} fill={`url(#${id}-gold)`} />
                <rect x={DIE.sx - 414 + i * 46 + 6} y={FY_(DIE.d) - 422} width={26} height={30} rx={4} fill={`url(#${id}-gold)`} />
                <rect x={DIE.sx - 422} y={FY_(DIE.d) - 414 + i * 46 + 6} width={30} height={26} rx={4} fill={`url(#${id}-gold)`} />
                <rect x={DIE.sx + 392} y={FY_(DIE.d) - 414 + i * 46 + 6} width={30} height={26} rx={4} fill={`url(#${id}-gold)`} />
              </g>
            ))}
            {/* "GRAPHICS CHIP" floor label removed 25 Nov 2026: with the Shorts/Reels safe-area framing it sat under the
                app's @username / description rows (safe_check.py); the voice names the chip, the glowing die shows it */}
            <text x={BELT.sx + BELT.hw + 60} y={FY_(1500)} fontFamily={MONO} fontWeight={600} fontSize={46} fill="#9CC8FF" letterSpacing={10} opacity={0.4} transform={`rotate(-90 ${BELT.sx + BELT.hw + 60} ${FY_(1500)})`}>FRAMES &gt;&gt;&gt;</text>
            {/* pads */}
            <ellipse cx={GF.sx} cy={FY_(GF.d)} rx={130} ry={130} fill="#060C22" stroke={CY} strokeWidth={6} opacity={0.9 * gA} />
            <ellipse cx={GH.sx} cy={FY_(GH.d)} rx={150} ry={150} fill="#060C22" stroke={MG} strokeWidth={6} opacity={0.9 * gB} />
            <rect x={SCR.sx - 560} y={FY_(SCR.d) - 110} width={1120} height={220} rx={110} fill="#060C22" stroke={MG} strokeWidth={6} opacity={0.8} />
          </svg>
        </L3>

        {/* ---------------- the screen: a window with a refresh shutter ---------------- */}
        <L3 tf={up(SCR.sx, SCR.d)}>
          <svg width={10} height={10} style={{overflow: 'visible', display: 'block'}}>
            <defs><clipPath id={`${id}-wclip`}><rect x={-700} y={-1150} width={1400} height={900} rx={26} /></clipPath></defs>
            <rect x={-60} y={-220} width={120} height={200} fill={`url(#${id}-metal)`} /><rect x={-330} y={-40} width={660} height={44} rx={22} fill={`url(#${id}-metal)`} />
            <rect x={-770} y={-1220} width={1540} height={1040} rx={56} fill={MG} opacity={0.25 + 0.5 * Math.max(scrLit * 0.6, decay(t, tScreen, 8), blinkT > 0 ? decay(ph, 2.5, 3) * 0.8 : 0)} />
            <rect x={-750} y={-1200} width={1500} height={1000} rx={46} fill={`url(#${id}-ti)`} />
            <rect x={-744} y={-1194} width={1488} height={988} rx={42} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.4} />
            <rect x={-722} y={-1172} width={1444} height={944} rx={34} fill="#02030A" />
            <g clipPath={`url(#${id}-wclip)`}>
              <g transform="translate(-700,-1150)">
                <FrameArt id={id} w={1400} h={900} p={frameP(shownN)} dir={frameDir(shownN)} ghosts={scrLit > 0.5 ? 2 : 0} gstep={1 / NF} />
                <rect width={1400} height={900} fill={INK} opacity={0.62 * (1 - scrLit)} />
                {/* shutter slats (blinds) */}
                {Array.from({length: 9}).map((_, i) => <rect key={i} y={i * 100} width={1400} height={Math.max(0, 100 * shut + 1)} fill={`url(#${id}-slat)`} />)}
                {blinkT > 0 && ph < 6 ? <rect y={900 * (ph / 6) - 12} width={1400} height={24} fill="#FFFFFF" opacity={0.85 * (1 - ph / 6)} /> : null}
                <rect width={1400} height={900} fill={`url(#${id}-refl)`} />
              </g>
            </g>
            <circle cx={690} cy={-214} r={9} fill={blinkT > 0 && ph < 5 ? '#FFFFFF' : MG} />
            <text x={-700} y={-204} fontFamily={MONO} fontWeight={600} fontSize={26} fill="#C9D4FF" opacity={0.7} letterSpacing={6}>SCREEN</text>
          </svg>
        </L3>

        {/* ---------------- Hz gauge ---------------- */}
        <L3 tf={up(GH.sx, GH.d)}>
          <svg width={10} height={10} style={{overflow: 'visible', display: 'block'}}>
            <g opacity={Math.min(1, gB * 1.5)}>
              <rect x={-12} y={-GH.h} width={24} height={GH.h} fill={`url(#${id}-metal)`} />
              <g transform={`translate(0,${-GH.h}) scale(${0.4 + 0.6 * gB})`}><Gauge id={id} R={GH.R} color={MG} label="Hz" val={hzVal} lit={hzLit} sweep={hzSweep} /></g>
            </g>
          </svg>
        </L3>

        {/* ---------------- cards on the conveyor ---------------- */}
        {stream.map(({j, u, n}) => {
          const d = BELT.d0 + u, o = smooth(u / 120) * (1 - smooth((u - (NC * SPACING - 150)) / 150));
          if (o < 0.01) return null;
          return (
            <L3 key={j} tf={`${up(BELT.sx, d, 14)} scale(0.42) ${t3(-CW / 2, -CH)}`} w={CW} h={CH} o={o}>
              <FrameCard id={id} p={frameP(n)} dir={frameDir(n)} pip={n} blank={0.86 * (1 - lit)} hot={lit} />
            </L3>
          );
        })}

        {/* ---------------- FPS gauge ---------------- */}
        <L3 tf={up(GF.sx, GF.d)}>
          <svg width={10} height={10} style={{overflow: 'visible', display: 'block'}}>
            <g opacity={Math.min(1, gA * 1.5)}>
              <rect x={-11} y={-GF.h} width={22} height={GF.h} fill={`url(#${id}-metal)`} />
              <g transform={`translate(0,${-GF.h}) scale(${0.4 + 0.6 * gA})`}><Gauge id={id} R={GF.R} color={CY} label="FPS" val={fpsVal} lit={fpsLit} sweep={fpsSweep} /></g>
            </g>
          </svg>
        </L3>

        {/* ---------------- the die ---------------- */}
        {[1, 2, 3, 4, 5].map((k) => (
          <L3 key={k} tf={flat(DIE.sx - DIE.half, DIE.d + DIE.half, (k * (DIE.h - 4)) / 5)} w={DIE.half * 2} h={DIE.half * 2}>
            <div style={{width: DIE.half * 2, height: DIE.half * 2, borderRadius: 34, background: 'linear-gradient(90deg,#3A4468,#0B0E1E 30%,#141A32 70%,#05060E)', boxSizing: 'border-box', borderBottom: `3px solid rgba(43,228,255,${(0.25 + 0.5 * cores).toFixed(2)})`}} />
          </L3>
        ))}
        <L3 tf={flat(DIE.sx - DIE.half, DIE.d + DIE.half, DIE.h)} w={DIE.half * 2} h={DIE.half * 2}>
          <DieTop id={id} t={t} cores={cores} flash={flashC} lit={lit} />
        </L3>

        {/* ---------------- the hero card being drawn ---------------- */}
        {heroO > 0.01 ? (
          <L3 tf={`${up(DIE.sx, heroD, heroH)} scale(${heroS.toFixed(3)}) ${t3(-CW / 2, -CH * rise)}`} w={CW} h={CH} o={Math.min(1, heroO * 1.4)}>
            <FrameCard id={id} p={frameP(shownN + NC + 1)} dir={1} pip={shownN + NC + 1} blank={0.9} hot={0.4} />
            <div style={{position: 'absolute', left: -12, top: -12, width: CW + 24, height: (CH + 24) * drawn, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: 12, top: 12}}><FrameCard id={id} p={frameP(shownN + NC + 1)} dir={1} pip={shownN + NC + 1} hot={1} /></div>
            </div>
            {drawn > 0 && drawn < 1 ? <div style={{position: 'absolute', left: -30, top: CH * drawn - 7, width: CW + 60, height: 14, borderRadius: 7, background: '#FFFFFF', boxShadow: `0 0 40px 14px ${CY}`}} /> : null}
          </L3>
        ) : null}
      </Stage3>

      {/* ---------------- 2D effects on top ---------------- */}
      <svg width={WW} height={WH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* 'smooth': a ribbon links the two numbers */}
        {wave > 0.01 ? (() => {
          const N = 40, pts = Array.from({length: N + 1}).map((_, i) => {
            const q = i / N, x = lerp(gfx, ghx, q), y = lerp(gfy, ghy, q) + Math.sin(q * Math.PI * 4 - t * 0.35) * 70 * Math.sin(q * Math.PI);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          const shown = Math.max(2, Math.round((N + 1) * clamp01((t - tSmooth) / 10)));
          return (
            <g opacity={wave}>
              <polyline points={pts.slice(0, shown).join(' ')} fill="none" stroke={VIO} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
              <polyline points={pts.slice(0, shown).join(' ')} fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })() : null}
        {/* laser from the cores up to the card */}
        {drawn > 0 && drawn < 1 ? [-1, 1].map((s) => {
          const [lx, ly] = pj(DIE.sx + s * 250, DIE.d - 80, DIE.h), [cx, cy, ck] = pj(DIE.sx, DIE.d, DIE.h + 20 + CH * 0.56 * (1 - drawn));
          return <line key={s} x1={lx} y1={ly} x2={cx + s * 150 * ck} y2={cy} stroke={CY} strokeWidth={7} strokeLinecap="round" opacity={0.75 + 0.25 * Math.sin(t * 3)} />;
        }) : null}
        <Burst t={t} at={tTwo} x={gfx} y={gfy} color={CY} n={14} r={gfk * 420} />
        <Burst t={t} at={tNum} x={ghx} y={ghy} color={MG} n={14} r={ghk * 480} />
        <Burst t={t} at={tFrames} x={gfx} y={gfy} color={CY} n={16} r={gfk * 460} />
        <Ripple t={t} at={tSec} x={gfx} y={gfy} color="#FFFFFF" r={gfk * 480} />
        <Burst t={t} at={tFast} x={gfx} y={gfy} color="#FFFFFF" n={12} r={gfk * 420} />
        <Ripple t={t} at={tChip} x={pj(DIE.sx, DIE.d, DIE.h)[0]} y={pj(DIE.sx, DIE.d, DIE.h)[1]} color={CY} r={620} />
        <Burst t={t} at={tPict} x={dx} y={dy} color={AM} n={22} r={420} />
        <Burst t={t} at={tHz} x={ghx} y={ghy} color={MG} n={18} r={ghk * 520} />
        <Burst t={t} at={tOften} x={ghx} y={ghy} color="#FFFFFF" n={12} r={ghk * 460} />
        <Ripple t={t} at={tScreen} x={sx} y={sy} color={MG} r={900} />
        <Burst t={t} at={tRef} x={sx} y={sy} color="#FFFFFF" n={20} r={520} />
        {/* sparks rising off the working die */}
        {lit > 0.2 ? Array.from({length: 12}).map((_, i) => {
          const q = (t * (0.03 + 0.02 * rnd(i)) + rnd(i * 3)) % 1, [x, y] = pj(DIE.sx - 300 + rnd(i * 5) * 600, DIE.d - 250 + rnd(i * 7) * 500, DIE.h + q * 420);
          return <circle key={i} cx={x} cy={y} r={5 * (1 - q) + 2} fill={i % 3 ? CY : '#FFFFFF'} opacity={(1 - q) * 0.8 * lit} />;
        }) : null}
      </svg>
    </div>
  );
};

const A = (p: [number, number, number], zoom: number, dx = 0, dy = 0) => ({x: p[0] + dx, y: p[1] + dy, zoom});

export const S02: WorldDef = {
  id: 'S02-machines', home: 'home',
  anchors: {
    home: {x: 1300, y: 1650, zoom: 0.68},
    chip: A(pj(DIE.sx, DIE.d, 0), 0.92, -235, -400),
    screen: A(pj(SCR.sx, SCR.d, 500), 0.86, 175, 40),
  },
  aliases: {frames: 'chip', hertz: 'screen'},
  palette: {bg0: '#020714', bg1: '#0B2A5C', particles: '#9CD8FF', glow: '#2B9CFF'},
  Draw: S02Draw,
};
