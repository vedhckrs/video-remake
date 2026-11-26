// S09 HANDOFF v3 (design frames @30): A20 Pro hero -> pull back along the 2008-2026 ribbon, counter lands on 18 (0-38) |
// ribbon folds away, the REAL phone (cine3d PhoneShot) faces us: feed, touch point, flat green line (38-108) | the phone turns
// to its back, the back glass turns to ghost glass, the board glows inside, callout A20 Pro (108-199) | the back glass lifts
// off and fades, one eased push into the opening until the board fills the frame (199-263)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../../src/kit/types';
import {PhoneInnards, PhoneShot, innardsPoint, phoneView, xrayShell, type OrbitKey, type V3} from '../../../src/kit/cine3d';
import {LogicBoard, SiChip, SiLens, SiScene, boardLayout, boardPartTop, siPoint, sweepAcross} from '../../../src/kit/explainer/silicon';
import {FONT} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';
import {onWord, pulseOn, wordAt, type Beat} from '../../../src/kit/explainer/world';
import {Drums, GOLD, GREEN, OnTimeBars, ScreenFeed, Studio, Tag, TouchFx, bellS, bellV, io, lerp, out3, q5, rollPos, scrPt, seg, sm, cl} from './phone_kit';

const Frame: React.FC<{W: number; children: React.ReactNode}> = ({W, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${W / 1920})`, transformOrigin: '0 0'}}>{children}</div>
);

// ---- ribbon ------------------------------------------------------------------------------------------------------------
const MILE: [number, string][] = [[2008, 'P.A. Semi'], [2010, 'A4'], [2013, 'A7'], [2017, 'A11 Bionic'], [2020, 'M1'], [2025, 'C1 + N1'], [2026, 'A20 Pro']];
const NX = (i: number) => 262 + i * 233, RY = 650, CHX = NX(6), CHY = 588, Z0 = 2.9;
const pulseAt = (t: number, at: number) => (t >= at ? Math.exp(-(t - at) / 8) : 0);
const RibbonP: React.FC<{t: number}> = ({t}) => {
  const p = q5(seg(t, 0, 56)), head = io(seg(t, 0, 16)), fold = 0;   // one eased pull-back; the phone shot arrives by a hard cut
  const Z = Math.pow(Z0, 1 - p) * (1 - 0.35 * fold), cx = lerp(CHX, 960, p), cy = lerp(CHY, 540, p);
  const gx = lerp(NX(6), NX(0), head), col = fold > 0.5 ? GREEN : GOLD;
  return (
    <>
      <Studio t={t} glow={GOLD} glowA={0.14} gy={56} floor={0.72} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${960 - cx * Z}px, ${540 - cy * Z}px) scale(${Z})`, opacity: 1 - sm(seg(fold, 0.35, 1))}}>
        <div style={{position: 'absolute', inset: 0, perspective: 2200, perspectiveOrigin: '50% 45%'}}>
          <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${-9 * p}deg) rotateX(${5 * p}deg) scaleX(${1 - 0.9 * fold})`, transformOrigin: '50% 56%'}}>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <defs>
                <linearGradient id="s09-rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5A606C" /><stop offset="0.45" stopColor="#23262E" /><stop offset="1" stopColor="#101216" /></linearGradient>
                <linearGradient id="s09-rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B0C10" /><stop offset="1" stopColor="#000" /></linearGradient>
                <linearGradient id="s09-gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col} stopOpacity={0.3} /><stop offset="1" stopColor={col} stopOpacity={0} /></linearGradient>
                <linearGradient id="s09-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2A3040" stopOpacity={0.95} /><stop offset="1" stopColor="#0E1118" stopOpacity={0.95} /></linearGradient>
                <filter id="s09-b" x="-0.2" y="-2" width="1.4" height="5"><feGaussianBlur stdDeviation={18} /></filter>
              </defs>
              {/* floor glow + the rail: a machined slab with an energised gold inlay */}
              <ellipse cx={960} cy={740} rx={900} ry={60} fill={col} opacity={0.12} filter="url(#s09-b)" />
              <path d={`M150 ${RY - 26}H1790L1830 ${RY + 26}H110Z`} fill="url(#s09-rb)" stroke="#fff" strokeOpacity={0.3} strokeWidth={2} />
              <path d={`M110 ${RY + 26}H1830V${RY + 50}H110Z`} fill="url(#s09-rf)" /><path d={`M110 ${RY + 26}H1830`} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
              <path d={`M110 ${RY + 52}H1830V${RY + 150}H110Z`} fill="url(#s09-gl)" opacity={0.5} />
              {Array.from({length: 73}).map((_, i) => <rect key={i} x={166 + i * 22.4} y={RY - 22} width={2} height={i % 4 ? 8 : 15} fill="#fff" opacity={i % 4 ? 0.22 : 0.5} />)}
              <path d={`M170 ${RY}H1750`} stroke="#07080B" strokeWidth={16} strokeLinecap="round" />
              {MILE.map(([yr, lab], i) => {
                const a = sp(t, 1 + (6 - i) * 2.4, 'bouncy'), x = NX(i), hi = i % 2 === 0, top = hi ? 286 : 430, cw = 216, chh = 124, last = i === 6;
                return a > 0 ? (
                  <g key={i} opacity={Math.min(1, a * 2)}>
                    <line x1={x} x2={x} y1={RY - (last ? 150 : 0)} y2={top + chh} stroke={GOLD} strokeWidth={3} strokeOpacity={0.8} />
                    {last ? null : <g><circle cx={x} cy={RY} r={34} fill={GOLD} opacity={0.14} /><circle cx={x} cy={RY} r={17} fill="#15171C" stroke={GOLD} strokeWidth={5} /><circle cx={x} cy={RY} r={6} fill="#FFF3D0" /></g>}
                    <g transform={`translate(${x} ${top + chh / 2}) scale(${0.7 + 0.3 * a}) translate(${-cw / 2} ${-chh / 2})`}>
                      <rect x={5} y={8} width={cw} height={chh} rx={18} fill="#000" opacity={0.5} />
                      <rect width={cw} height={chh} rx={18} fill="url(#s09-card)" stroke={last ? GOLD : '#fff'} strokeOpacity={last ? 0.95 : 0.3} strokeWidth={last ? 3 : 2} />
                      <rect x={18} y={0} width={cw - 36} height={3} fill={GOLD} opacity={0.9} />
                      <text x={cw / 2} y={62} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={50} fill="#fff">{yr}</text>
                      <text x={cw / 2} y={104} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={29} fill={GOLD}>{lab}</text>
                    </g>
                  </g>) : null;
              })}
            </svg>
            <div style={{position: 'absolute', left: CHX - 150, top: CHY - 110, width: 300, height: 240}}>
              <SiScene id="s09c" width={300} height={240} u={19} tilt={0.58} origin={[150, 96]} sweep={sweepAcross(sm(seg(t, 0, 30)), -6, -6, 6, 6)}><SiChip x={-5.5} y={-5.5} w={11} d={11} z={0} role="soc" glow={0.7} glowColor={GOLD} /></SiScene>
            </div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: -200, top: -160, width: 1100, height: 520, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(3,5,10,0.92) 40%, rgba(3,5,10,0) 100%)', opacity: (1 - p) * (1 - fold)}} />
      <div style={{position: 'absolute', left: 110, top: 64, opacity: 1 - sm(seg(fold, 0, 0.5)), transform: `translateY(${-60 * fold}px)`}}>
        <Drums pos={rollPos(18 * out3(seg(t, -3, 9)), 2)} prev={rollPos(18 * out3(seg(t - 0.6, -3, 9)), 2)} size={124} accent={GOLD} lit={Math.max(pulseAt(t, 9), 0.25)} suffix="YEARS" />
      </div>
    </>
  );
};

// ---- the REAL phone (cine3d): front + feed + flat green line -> turns to its back -> ghost glass, board glows -> the back
// glass lifts off and one eased push carries the camera into the opening ------------------------------------------------------
const CHIP: V3 = innardsPoint('soc');
const END_P: V3 = [CHIP[0] + 0.12, CHIP[1] - 0.42, CHIP[2]];
// the phone stays put under the studio lights (so its back is lit like every other back view: burgundy, warm key) and the
// camera orbits it front -> side -> back; on the plain studio this reads as the phone turning in the hand
const R_BACK = 31;
// the magnifier card beside the x-rayed phone: the board region round the A20 Pro (2D silicon kit)
const LAY9 = boardLayout(7), MU = 27, MT = 0.58, MW = 770, MH = 400, MX = 1050, MY = 140;
const mp0 = siPoint(MU, MT, [0, 0], ...boardPartTop('soc', LAY9));
const MORG: [number, number] = [MW / 2 - mp0[0], MH * 0.58 - mp0[1]];
const EVEN9 = Array.from({length: 44}).map(() => 150);
const CUT9 = 62, turn9 = (t: number) => q5(seg(t, 104, 146));
const shot9 = (t: number): {cam: OrbitKey[]; push: number} => {
  const mv = turn9(t), push = q5(seg(t, 201, 263)), f = sm(cl(push * 1.5));
  const yaw = lerp(lerp(166, R_BACK, mv) - 3 * sm(seg(t, 146, 203)), 5, f), r = (yaw * Math.PI) / 180;
  const side = 4.2 * mv * (1 - f);                                  // the phone sits left of centre while the callout shows
  const wide: V3 = [side * Math.cos(r), -0.3, -side * Math.sin(r)];
  const dist = (lerp(28.5, 26.5, sm(seg(t, CUT9 - 20, 108))) - 1.5 * mv - 1.5 * sm(seg(t, 140, 203))) * Math.pow(5.1 / 23.5, push);
  return {push, cam: [{t: 0, yaw, pitch: lerp(lerp(5, 8, mv), 3, push), dist, fov: 22, tgt: [lerp(wide[0], END_P[0], f), lerp(wide[1], END_P[1], f), lerp(wide[2], END_P[2], f)], focus: [0, 0, 0]}]};
};
const PhoneP: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const {cam, push} = shot9(t), v = phoneView({t, cam, W: 1920, H: 1080});
  const thumbW = wordAt(beats, 'thumb', 93), lineP = io(seg(t, 62, 80)), pulse = pulseOn(t, beats), mv = turn9(t);
  const x = sm(seg(t, 134, 152)), act = onWord(t, beats, 'actually', 'settle'), sit = onWord(t, beats, 'sit', 'bouncy');
  const open = io(seg(t, wordAt(beats, 'open', 199) - 1, 232));
  const lineA = 1 - sm(seg(t, 106, 118));
  // touch: lands just before "thumb", drags the feed up, lifts
  const f = out3(seg(t, thumbW - 1, thumbW + 7)), ta = sm(seg(t, thumbW - 4, thumbW - 1)) * (1 - sm(seg(t, thumbW + 8, thumbW + 12)));
  const tx = 250, ty = lerp(640, 330, f), tp = v.point(scrPt(tx, ty));
  const scroll = 600 + t * 2.5 + bellS(t, thumbW - 2, 52, 5);
  const chip = v.point(CHIP), shell = xrayShell(x, open, 3.4);
  const mag = sp(t, wordAt(beats, 'actually', 149) - 3, 'settle') * (1 - sm(seg(t, 197, 207)));
  return (
    <>
      <Studio t={t} glow={mv > 0.5 ? '#37C8FF' : GREEN} glowA={0.14 + 0.08 * pulse} gy={50} floor={2} />
      {/* every frame on time: an even row of frame-time bars behind the phone, each slot ticking in a steady rhythm */}
      <OnTimeBars id="s09b" h={EVEN9.map((v) => v * lineP)} base={690} tick={(t - 72) / 1.1} a={lineA} dots={lineP} />
      <div style={{position: 'absolute', left: 120, top: 250, opacity: sm(seg(t, 66, 74)) * lineA}}><Tag size={44} color="#fff" style={{marginBottom: 14}}>one feeling</Tag><Tag size={28} color={GREEN}>every frame on time</Tag></div>
      <PhoneShot t={t} W={1920} H={1080} cam={cam} shell={{...shell, backGlass: {...shell.backGlass, opacity: 1 - sm(seg(t, 214, 240))}}}
        fx={{dof: push > 0.25 ? false : {range: 7, blur: 9}, exposure: 1.08}} light={{main: 1.25, rim: 1.6, fill: 2.0}}
        screen={
          <ScreenFeed id="s09f" scroll={scroll} vblur={Math.min(26, bellV(t, thumbW - 2, 52, 5) * 0.45)}>
            <TouchFx x={tx} y={ty} a={ta} ripples={[{age: t - (thumbW - 3), speed: 11, life: 13}, {age: t - thumbW, speed: 11, life: 13, w: 4}]} />
          </ScreenFeed>
        }
        interior={<PhoneInnards light={Math.max(x, 0.001)} sweep={t < 214 ? sm(seg(t, 140, 196)) : sm(seg(t, 226, 262))} dim={0.25 * sit * (1 - push)} focus="soc"
          parts={{soc: {glow: sit * (0.7 + 0.3 * pulse) * (1 - 0.6 * push), glowColor: GOLD, highlight: sit * (1 - push), highlightColor: GOLD}, modem: {glow: act * 0.6}, wireless: {glow: act * 0.6}, pmic: {glow: act * 0.4}}} />} />
      {mag > 0.01 ? (
        <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, mag * 1.4)}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <path d={`M${chip.x} ${chip.y}L${MX - 70} ${MY + 230}H${MX}`} stroke={GOLD} strokeWidth={3} fill="none" />
            <circle cx={chip.x} cy={chip.y} r={9} fill={GOLD} /><circle cx={chip.x} cy={chip.y} r={34 + 10 * pulse} fill="none" stroke={GOLD} strokeWidth={4} opacity={0.85} />
          </svg>
          <div style={{position: 'absolute', left: MX, top: MY, width: MW, height: 620, boxSizing: 'border-box', borderRadius: 30, overflow: 'hidden', transform: `translateX(${60 * (1 - mag)}px) scale(${0.92 + 0.08 * mag})`, transformOrigin: '0 40%',
                       background: 'linear-gradient(160deg, #141B2B 0%, #080B12 70%)', border: `3px solid ${sit > 0.5 ? GOLD : 'rgba(156,200,255,0.6)'}`, boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 ${60 * sit}px ${GOLD}66`}}>
            <div style={{position: 'absolute', left: 0, top: 0, width: MW, height: MH, overflow: 'hidden', background: '#05070C'}}>
              <SiScene id="s09m" width={MW} height={MH} u={MU} tilt={MT} origin={MORG} sweep={sweepAcross(sm(seg(t, 150, 200)), 0, 0, 72, 40)}>
                <LogicBoard layout={LAY9} parts={{soc: {glow: sit * (0.6 + 0.4 * pulse), glowColor: GOLD, highlight: sit, highlightColor: GOLD}, modem: {glow: act * 0.5}, wireless: {glow: act * 0.5}}} focus="soc" dim={0.3 * sit} />
              </SiScene>
              <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 80px rgba(0,0,0,0.85)', background: 'radial-gradient(circle at 26% 16%, rgba(255,255,255,0.1), rgba(255,255,255,0) 44%)'}} />
            </div>
            <div style={{position: 'absolute', left: 40, top: MH + 22, fontFamily: FONT, fontWeight: 700, fontSize: 76, lineHeight: '90px', color: GOLD, whiteSpace: 'nowrap', opacity: 0.35 + 0.65 * sit}}>A20 Pro</div>
            <div style={{position: 'absolute', left: 42, top: MH + 120, fontFamily: FONT, fontWeight: 500, fontSize: 36, color: '#E6ECF6', whiteSpace: 'nowrap'}}>sits here, under the back glass</div>
          </div>
        </div>
      ) : null}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, #02040A 100%)', opacity: 0.7 * push}} />
    </>
  );
};
export const S09: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const beats = spec.beats ?? [];
  return (
    <AbsoluteFill style={{background: '#03050A', overflow: 'hidden'}}>
      <Frame W={W}>
        {t < CUT9 ? <RibbonP t={t} /> : <PhoneP t={t} beats={beats} />}
      </Frame>
      <SiLens W={W} H={H} t={t} focus={[0.06, 0.94]} blur={t >= CUT9 ? 0 : 2} vignette={0.5} dust={8} tint="#6FA8FF" seed={7} />
    </AbsoluteFill>
  );
};
