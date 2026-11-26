// S01 HOOK v3 - built round the REAL iPhone 18 Pro (cine3d PhoneShot). One full-frame picture per phrase (design frames @30):
// A -1..49 the real phone, feed scrolling, touch point | B 49..84 frames peel off the real screen into a strip, one red frame
// lags | C 84..137 frame-time graph, 8 ms, LATE, graph tilts and the spike punches out | D 137..186 two frames side by side,
// scan finds nothing | E 186..245 macro across the real glass, red shock ripple, the feed hitches | F 245..312 hero turn,
// the graph flattens into the green line -> point
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../../src/kit/types';
import {PhoneShot, phoneView, type CamKey, type OrbitKey, type PoseKey} from '../../../src/kit/cine3d';
import {SiLens} from '../../../src/kit/explainer/silicon';
import {BoardShot, BoardLens} from './phone_s02';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';
import {Drums, Feed, FloorPool, GREEN, OnTimeBars, Persp, RED, SCR_H, SCR_W, ScreenFeed, Studio, Tag, TouchFx, bellS, bellV, cl, hash, io, lerp, out3, q5, scrPt, seg, sm} from './phone_kit';

const W = 1920, H = 1080, FLOOR = -5.02;
// a flick as the finger makes it: the feed's speed rises smoothly while the finger drags, then coasts down (no velocity step)
const scrollA = (t: number) => 380 + 4 * (t + 2) + bellS(t, 11, 58, 5) + bellS(t, 29, 54, 5);
const velA = (t: number) => bellV(t, 11, 58, 5) + bellV(t, 29, 54, 5);
const STREAK = ['#FF7A3D', '#37C8FF', '#0FB6A8', '#FF4F8B', '#6C5BFF', '#FFB020', '#FFD36B', '#B8FFEA'];
const SCREEN = {x0: -2.2175, x1: 2.2175, y0: -4.824, y1: 4.824, z: -0.455};

// ---- A + B: one real phone, one camera path ------------------------------------------------------------------------------
const FOCUS: [number, number, number] = [0, 0, -0.455];
// A: one eased push toward the screen (two keys = one ease, at rest at both ends). B: a hard cut to a wider camera that
// drifts slowly on its own path.
const CAM_A: OrbitKey[] = [
  {t: -10, yaw: 131, pitch: 12, dist: 23.5, fov: 24, tgt: [0.3, 1.1, 0], focus: FOCUS},
  {t: 56, yaw: 161, pitch: 5, dist: 19.5, fov: 24, tgt: [0, 0.1, 0], focus: FOCUS},
];
const CAM_B: OrbitKey[] = [
  {t: 40, yaw: 127.6, pitch: 7, dist: 41.6, fov: 24, tgt: [-5.7, 0.1, -7.5], focus: FOCUS},
  {t: 96, yaw: 123, pitch: 7, dist: 38.5, fov: 24, tgt: [-5.9, 0.1, -7.3], focus: FOCUS},
];
const CUT_B = 49;
// touch: lands, drags up with the flick, lifts - twice
const touchA = (t: number) => {
  const two = t > 24, land = two ? 27.5 : 9.5, drag = two ? 29 : 11, up = two ? 36.5 : 18.5;
  const f = out3(seg(t, drag, up)), a = sm(seg(t, land, land + 2)) * (1 - sm(seg(t, up, up + 3)));
  return {x: lerp(262, 244, f), y: lerp(two ? 640 : 610, two ? 330 : 300, f), a, age: t - land};
};
const PITCHL = 3.6, RK = 3, NFR = 12;
const ShotAB: React.FC<{t: number}> = ({t}) => {
  const cam = t < CUT_B ? CAM_A : CAM_B, v = phoneView({t, cam, W, H});
  const k = cl(velA(t) / 60), foot = v.point([0, FLOOR, 0]), tc = touchA(t);
  const tp = v.point(scrPt(tc.x, tc.y));
  const b = t >= CUT_B ? 1 : 0;                                   // strip phase (hard cut)
  const travel = 20 + 0.25 * (t - CUT_B);                         // the strip is already running at the cut: a steady flow
  const one = sp(t, 49, 'pop'), red = sp(t, 56, 'pop'), lag = io(seg(t, 71, 83));
  const base = scrollA(CUT_B);
  const scroll = t < CUT_B ? scrollA(t) : base + 58 * (travel / PITCHL);
  const frames: React.ReactNode[] = [];
  const liftOf = (i: number) => travel - i * PITCHL;
  if (b > 0) {
    for (let i = 0; i < NFR; i++) {                                 // i = 0 is the first frame out (farthest from the phone)
      const isR = i === RK, slot = liftOf(i);
      if (slot < 0.12 || slot > 31) continue;
      const L = isR ? slot - lag * 1.9 : slot, drop = isR ? lag * 2.5 : 0;
      const c = v.point([0, -drop, SCREEN.z], -L);
      if (c.behind) continue;
      const a = sm(seg(slot, 0.12, 1.6)) * (1 - sm(seg(slot, 27, 31)));
      const m = v.planeMatrix({...SCREEN, y0: SCREEN.y0 - drop, y1: SCREEN.y1 - drop}, SCR_W, SCR_H, -1, -L);
      frames.push(
        <React.Fragment key={i}>
          {isR && lag > 0.01 ? <div style={{position: 'absolute', left: 0, top: 0, width: SCR_W, height: SCR_H, transformOrigin: '0 0', transform: v.planeMatrix(SCREEN, SCR_W, SCR_H, -1, -slot), borderRadius: 54, border: `5px dashed ${RED}`, boxSizing: 'border-box', background: `${RED}18`, opacity: lag * 0.95}} /> : null}
          <div style={{position: 'absolute', left: 0, top: 0, width: SCR_W, height: SCR_H, transformOrigin: '0 0', transform: m, borderRadius: 54, overflow: 'hidden', opacity: a, background: '#000',
                       boxShadow: isR ? `0 0 0 ${4 + 4 * red}px ${red > 0.5 ? RED : '#fff'}, 0 0 ${90 * Math.max(one, red)}px ${red > 0.5 ? RED : '#9CC8FF'}` : '0 0 0 2.5px rgba(255,255,255,0.42), 0 30px 70px rgba(0,0,0,0.6)'}}>
            <Feed id={`s01b${i}`} w={SCR_W} h={SCR_H} scroll={base + 58 * i} tint={RED} tintA={isR ? red * 0.85 : 0} />
            {isR ? <div style={{position: 'absolute', inset: 0, background: RED, opacity: 0.3 * red, mixBlendMode: 'screen'}} /> : <div style={{position: 'absolute', inset: 0, background: '#02040A', opacity: 0.42 * one}} />}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.2) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.07) 100%)'}} />
          </div>
        </React.Fragment>,
      );
    }
    frames.reverse();                                               // far ones first... nearest to the camera last
  }
  // a dot above every slot of the strip: every frame owns one
  const rail = (L: number, y: number) => v.point([0, y, SCREEN.z], -L);
  const rp = rail(liftOf(RK) - lag * 1.9, 5.3 - lag * 2.5);
  return (
    <>
      <Studio t={t} glow={b > 0.5 ? '#3B8CFF' : STREAK[Math.floor(scrollA(t) / 466) % 6]} glowA={lerp(0.16 + 0.3 * k, 0.22, b)} gx={lerp(50, 46, b)} gy={50} floor={2} />
      <FloorPool x={foot.x} y={foot.y} w={lerp(560, 420, b)} />
      {/* light streaks thrown behind the phone while the feed flies */}
      {k > 0.02 && t < CUT_B ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 700, height: 1500, transformOrigin: '0 0', transform: v.planeMatrix({x0: -5.2, x1: 5.2, y0: -11, y1: 11, z: 1.4}, 700, 1500, -1), opacity: 0.85 * k,
                     WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 35%, black 65%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, black 35%, black 65%, transparent 100%)'}}>
          {Array.from({length: 9}).map((_, i) => <div key={i} style={{position: 'absolute', left: i * 76 - 50 + hash(i) * 30, top: 0, width: 150 + hash(i * 3.3) * 110, height: 1500, background: `linear-gradient(90deg, transparent, ${STREAK[i % 8]}, transparent)`, opacity: 0.22 + 0.34 * hash(i * 7.7)}} />)}
        </div>
      ) : null}
      <PhoneShot t={t} W={W} H={H} cam={cam} floor={{y: FLOOR, shadow: 0.7, reflect: 0.3}} fx={{dof: {range: 7, blur: 9}}} light={{main: 1.3, fill: 1.6}}
        screen={
          <ScreenFeed id="s01af" scroll={scroll} vblur={t < CUT_B ? Math.min(30, velA(t) * 0.45) : 0}>
            {t < CUT_B ? <TouchFx x={tc.x} y={tc.y} a={tc.a} ripples={[{age: tc.age, speed: 11, life: 13}, {age: tc.age - 3, speed: 11, life: 13, w: 4}]} /> : null}
            <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0}} />
          </ScreenFeed>
        } />
      {b > 0 ? (
        <>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: b}}>
            {Array.from({length: NFR}).map((_, i) => {
              const L = liftOf(i);
              if (L < 0.4 || L > 30) return null;
              const p0 = rail(L, 5.6), c = i === RK && red > 0.5 ? RED : GREEN;
              return <g key={i}><circle cx={p0.x} cy={p0.y} r={20} fill={c} opacity={0.22} /><circle cx={p0.x} cy={p0.y} r={10} fill={c} /></g>;
            })}
          </svg>
          {frames}
          <div style={{position: 'absolute', left: rp.x - 300, top: rp.y - 118 - 20 * (1 - one), width: 600, textAlign: 'center', opacity: one * (1 - sm(seg(t, 82, 85)))}}>
            <Tag size={36} color={red > 0.5 ? RED : '#fff'} style={{display: 'inline-block', padding: '8px 22px', borderRadius: 12, background: 'rgba(4,7,14,0.78)', border: `2px solid ${red > 0.5 ? RED : 'rgba(255,255,255,0.5)'}`}}>{t < 72 ? 'one frame' : 'missed its slot'}</Tag>
          </div>
        </>
      ) : null}
    </>
  );
};

// ---- frame-time bars (C and F) ---------------------------------------------------------------------------------------
const NB = 44, BP = 41.4, BW = 27, SPIKE = 28, BASE = 640, DEAD = 300;
const BARH = Array.from({length: NB}).map((_, i) => (i === SPIKE ? 548 : 112 + hash(i * 1.7) * 84));
const Bars: React.FC<{id: string; h: number[]; glow?: number}> = ({id, h, glow = 1}) => {
  const dx = 10, dy = 8;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8CFFC4" /><stop offset="0.25" stopColor={GREEN} /><stop offset="1" stopColor="#0C6B3F" /></linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB0B8" /><stop offset="0.2" stopColor={RED} /><stop offset="1" stopColor="#7A0A1A" /></linearGradient>
        <linearGradient id={`${id}-rf`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={0.3} /><stop offset="1" stopColor="#fff" stopOpacity={0} /></linearGradient>
        <filter id={`${id}-bl`} x="-0.1" y="-0.3" width="1.2" height="1.6"><feGaussianBlur stdDeviation={16} /></filter>
        <mask id={`${id}-mk`}><rect x={-40} y={BASE} width={1920} height={240} fill={`url(#${id}-rf)`} /></mask>
      </defs>
      <g filter={`url(#${id}-bl)`} opacity={0.6 * glow}>{h.map((v, i) => (v > 2 ? <rect key={i} x={22 + i * BP - 4} y={BASE - v - 4} width={BW + 8} height={v + 8} fill={i === SPIKE ? RED : GREEN} /> : null))}</g>
      <g mask={`url(#${id}-mk)`}>{h.map((v, i) => <rect key={i} x={22 + i * BP} y={BASE + 3} width={BW} height={v * 0.55} fill={i === SPIKE ? RED : GREEN} />)}</g>
      {h.map((v, i) => {
        const x = 22 + i * BP, y = BASE - v, r = i === SPIKE;
        return v > 1 ? (
          <g key={i}>
            <path d={`M${x + BW} ${y}l${dx} ${-dy}V${BASE - dy}l${-dx} ${dy}Z`} fill={r ? '#8E1224' : '#0B5A36'} />
            <path d={`M${x} ${y}l${dx} ${-dy}h${BW}l${-dx} ${dy}Z`} fill={r ? '#FFD0D5' : '#C9FFE3'} />
            <rect x={x} y={y} width={BW} height={v} fill={`url(#${id}-${r ? 'r' : 'g'})`} />
            <rect x={x} y={y} width={3} height={v} fill="#fff" opacity={0.35} />
          </g>
        ) : null;
      })}
    </g>
  );
};

// ---- C: "8 milliseconds late" ----------------------------------------------------------------------------------------
// three pictures: (1) the full-width graph slams in, the red spike rises on "8" and the drum rolls to 8 ms; (2) the camera
// pushes in on the spike and its +8 ms bracket; (3) on "late" the graph swings into steep
// perspective, the camera runs down the bars and the red spike punches out toward the lens under the LATE stamp
const ShotC: React.FC<{t: number}> = ({t}) => {
  const late = sp(t, 109, 'bouncy'), ms = sp(t, 91, 'pop'), flash = t >= 109 ? Math.exp(-(t - 109) / 5) : 0;
  const h = BARH.map((v, i) => {
    const wave = t >= 109 ? Math.exp(-Math.pow(Math.abs(i - SPIKE) - (t - 109) * 1.5, 2) / 5) * 46 * Math.exp(-(t - 109) / 14) : 0;
    return v * sp(t, 78.5 + (i === SPIKE ? 6 : i * 0.07), 'bouncy') + (i === SPIKE ? 0 : wave);
  });
  const slam = 1, swing = q5(seg(t, 85, 136)), p1 = swing, punch = sp(t, 109, 'bouncy');
  const sx = 22 + SPIKE * BP + BW / 2, top = BASE - h[SPIKE];
  const v8 = 8 * out3(seg(t, 84, 94)), p8 = 8 * out3(seg(t - 0.6, 84, 94));
  return (
    <>
      <Studio t={t} glow={RED} glowA={0.1 + 0.25 * flash + 0.1 * swing} gx={62} gy={40} floor={0.74} />
      <Persp x={lerp(960, 900, swing)} y={lerp(560, 690, swing)} s={lerp(1, 1.16, swing)} p={2400}>
        <div style={{position: 'absolute', width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateX(${lerp(7, 13, swing)}deg) rotateY(${lerp(-9, -45, swing)}deg) translateX(${-300 * swing}px)`}}>
          <svg width={1860} height={900} style={{position: 'absolute', left: -930, top: -470, overflow: 'visible'}}>
            {[100, 200, 300, 400, 500, 600].map((g) => <line key={g} x1={-1400} x2={2060} y1={BASE - g} y2={BASE - g} stroke="#9CC3FF" strokeOpacity={g === 300 ? 0 : 0.09} strokeWidth={2} />)}
            {Array.from({length: 36}).map((_, i) => <line key={i} x1={-1400 + i * 100} x2={-1400 + i * 100} y1={0} y2={BASE} stroke="#9CC3FF" strokeOpacity={0.05} strokeWidth={2} />)}
            <line x1={-1400} x2={2060} y1={BASE} y2={BASE} stroke="#CFE0FF" strokeOpacity={0.5} strokeWidth={3} />
            <Bars id="s01c" h={h} glow={0.8 + 0.5 * flash} />
            <line x1={-1400} x2={2060} y1={BASE - DEAD} y2={BASE - DEAD} stroke="#fff" strokeOpacity={0.85} strokeWidth={3} strokeDasharray="18 12" />
            <text x={30} y={BASE - DEAD - 18} fontFamily={FONT} fontWeight={600} fontSize={30} fill="#fff" letterSpacing="0.12em" opacity={1 - sm(seg(swing, 0.15, 0.5))}>DEADLINE · 8.3 ms</text>
            <g opacity={ms}>
              <path d={`M${sx + 44} ${BASE - DEAD}h22M${sx + 55} ${BASE - DEAD}V${top}M${sx + 44} ${top}h22`} stroke={RED} strokeWidth={5} fill="none" />
              <text x={sx + 84} y={BASE - DEAD - 24} fontFamily={FONT} fontWeight={700} fontSize={46} fill={RED}>+8 ms</text>
            </g>
            {t >= 87 && t < 110 ? <ellipse cx={sx} cy={top} rx={(t - 87) * 22} ry={(t - 87) * 7} fill="none" stroke={RED} strokeWidth={6 * cl(1 - (t - 87) / 20)} opacity={cl(1 - (t - 87) / 20)} /> : null}
          </svg>
          {/* the late frame punches out of the graph plane */}
          {punch > 0.01 ? Array.from({length: 9}).map((_, i) => (
            <div key={i} style={{position: 'absolute', left: sx - 930 - BW / 2 - (i === 8 ? 3 : 0), top: -470 + top - (i === 8 ? 3 : 0), width: BW + (i === 8 ? 6 : 0), height: h[SPIKE] + (i === 8 ? 3 : 0), transform: `translateZ(${150 * punch * ((i + 1) / 9)}px)`,
                                 background: i === 8 ? 'linear-gradient(180deg,#FFD0D5 0%,#FF3B4E 12%,#C2182B 100%)' : i % 2 ? '#A3122A' : '#C2182B', boxShadow: i === 8 ? `0 0 ${70 + 60 * flash}px ${RED}` : undefined, borderRadius: 3}} />
          )) : null}
          {late > 0 ? <div style={{position: 'absolute', left: sx - 930 + 70, top: -470 + 40 + 150 * swing, transform: `translateZ(${60 + 100 * swing}px) rotateY(${34 * swing}deg) rotate(-9deg) scale(${2.6 - 1.6 * late})`, opacity: Math.min(1, late * 2), padding: '0px 34px', border: `9px solid ${RED}`, borderRadius: 22,
                                    color: RED, fontFamily: FONT, fontWeight: 800, fontSize: 132, lineHeight: '160px', letterSpacing: '0.08em', background: 'rgba(255,59,78,0.14)', boxShadow: `0 0 80px ${RED}66`}}>LATE</div> : null}
        </div>
      </Persp>
      <div style={{position: 'absolute', left: 0, top: 0, width: 760, height: 400, background: 'radial-gradient(ellipse 60% 60% at 30% 35%, rgba(3,5,10,0.85) 30%, rgba(3,5,10,0) 100%)', opacity: swing}} />
      <div style={{position: 'absolute', left: 96, top: 70, transformOrigin: '0 0'}}>
        <Tag size={28} color="#C9D3E4" style={{marginBottom: 16}}>one frame arrived</Tag>
        <Drums pos={[0, v8]} prev={[0, p8]} dim={[true, false]} size={170} accent={RED} lit={Math.max(ms * 0.6, flash)} suffix="ms" />
      </div>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 40%, ${RED}00 30%, ${RED} 100%)`, opacity: 0.4 * flash}} />
    </>
  );
};

// ---- D: "You can't see it" - two consecutive FRAMES OF VIDEO on a film strip; the scan finds nothing ----------------------
const FRW = 900, FRH = 760, FRY = 112, DSCROLL = 1044 + 150, EDGE = '#FFC56B';
const SPOTS: [number, number][] = [[0.24, 0.2], [0.7, 0.36], [0.3, 0.56], [0.66, 0.78]];
const Sprockets = React.memo<{y: number}>(({y}) => (
  <svg width={5200} height={44} style={{position: 'absolute', left: -1600, top: y}}>
    {Array.from({length: 68}).map((_, i) => <g key={i}><rect x={i * 76 + 20} y={2} width={36} height={40} rx={7} fill="#03050A" stroke="#fff" strokeOpacity={0.16} strokeWidth={1.5} /><rect x={i * 76 + 62} y={18} width={8} height={8} fill={EDGE} opacity={i % 4 ? 0.18 : 0.6} /></g>)}
  </svg>
));
const ShotD: React.FC<{t: number}> = ({t}) => {
  const tint = cl(1 - (t - 142) / 5), scan = seg(t, 144.5, 160.5), merge = io(seg(t, 160, 171)), stamp = sp(t, 170, 'bouncy');
  const scanY = lerp(0, FRH, scan), scanOn = scan > 0 && scan < 1 ? 1 : 0, flip = Math.floor((t - 160) / 2.5) % 2, slide = 0;
  const frame = (side: 0 | 1) => {
    const late = side === 1, x = side ? 980 : 40, hot = late ? tint : 0, col = late ? RED : GREEN, sel = merge > 0.5 && flip === side ? 1 : 0;
    const hide = false;
    return (
      <React.Fragment key={side}>
        <div style={{position: 'absolute', left: x, top: FRY, width: FRW, height: FRH, overflow: 'hidden', background: '#000', opacity: hide ? 0 : 1, boxShadow: `0 0 0 ${2 + 4 * hot + 6 * sel}px ${hot > 0.3 ? RED : sel ? '#fff' : 'rgba(255,255,255,0.55)'}, 0 0 ${36 * hot}px ${RED}`}}>
          <Feed id={`s01d${side}`} w={FRW} h={FRH} scroll={DSCROLL} chrome={false} tint={RED} tintA={hot * 0.8} />
          {late ? <div style={{position: 'absolute', inset: 0, background: RED, opacity: 0.3 * hot, mixBlendMode: 'screen'}} /> : null}
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
          {scan > 0 ? <div style={{position: 'absolute', left: 0, top: 0, width: FRW, height: scanY, background: 'linear-gradient(180deg, rgba(120,190,255,0) 70%, rgba(120,190,255,0.24) 100%)', opacity: scanOn}} /> : null}
          {scanOn ? <div style={{position: 'absolute', left: 0, top: scanY - 3, width: FRW, height: 6, background: '#E6F4FF', boxShadow: '0 0 30px 8px rgba(120,190,255,0.9)'}} /> : null}
          {SPOTS.map(([fx, fy], i) => {
            const a = sp(t, 144.5 + fy * 16, 'pop') * (1 - merge);
            return a > 0.01 ? <div key={i} style={{position: 'absolute', left: fx * FRW - 62, top: fy * FRH - 62, width: 124, height: 124, borderRadius: '50%', border: '4px solid #fff', boxSizing: 'border-box', opacity: a, transform: `scale(${1.6 - 0.6 * a})`, boxShadow: '0 0 24px rgba(160,210,255,0.9), inset 0 0 18px rgba(160,210,255,0.5)'}} /> : null;
          })}
          <div style={{position: 'absolute', left: 26, top: 24}}>
            <Tag size={30} color="#fff" style={{display: 'inline-block', padding: '10px 22px', borderRadius: 6, background: 'rgba(4,7,14,0.85)', border: `2px solid ${col}`}}>
              <span style={{display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: col, marginRight: 14, boxShadow: `0 0 12px ${col}`}} />{late ? '8 ms late' : 'on time'}
            </Tag>
          </div>
        </div>
        {/* edge print in the film margin */}
        <div style={{position: 'absolute', left: x + 6, top: 44, height: 52, padding: '0 18px', background: '#0B0D12', opacity: hide ? 0 : 1, fontFamily: MONO, fontWeight: 700, fontSize: 32, lineHeight: '52px', letterSpacing: '0.16em', color: EDGE, textShadow: `0 0 14px ${EDGE}88`, whiteSpace: 'nowrap'}}>{late ? 'FRAME n+1' : 'FRAME n'}</div>
        <div style={{position: 'absolute', left: x + FRW - 150, top: 888, height: 52, padding: '0 14px', background: '#0B0D12', opacity: hide ? 0 : 0.8, fontFamily: MONO, fontWeight: 600, fontSize: 26, lineHeight: '52px', letterSpacing: '0.16em', color: EDGE, whiteSpace: 'nowrap'}}>{late ? '▸ n+1' : '▸ n'}</div>
      </React.Fragment>
    );
  };
  return (
    <>
      <Studio t={t} glow="#3B8CFF" glowA={0.2 + 0.1 * stamp} gy={44} floor={2} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${1 + 0.035 * seg(t, 134, 186)})`, transformOrigin: '50% 45%'}}>
        {/* the film base */}
        <div style={{position: 'absolute', left: -200, top: 30, width: 2320, height: 926, background: 'linear-gradient(180deg, #14171E 0%, #0B0D12 8%, #0B0D12 92%, #14171E 100%)', boxShadow: '0 0 0 2px rgba(255,255,255,0.14), 0 40px 120px rgba(0,0,0,0.8)'}} />
        <div style={{position: 'absolute', left: slide % 76, top: 0, width: 0, height: 0}}><Sprockets y={48} /><Sprockets y={892} /></div>
        {frame(0)}{frame(1)}
        {SPOTS.map(([, fy], i) => {
          const y = FRY + fy * FRH, a = sp(t, 146 + fy * 16, 'bouncy') * (1 - sm(merge * 2.5));
          return a > 0.01 ? (
            <div key={i} style={{position: 'absolute', left: 960 - 46, top: y - 46, width: 92, height: 92, borderRadius: 46, background: 'rgba(6,12,22,0.94)', border: `3px solid ${GREEN}`, boxSizing: 'border-box', color: GREEN, fontFamily: FONT, fontWeight: 800, fontSize: 64, lineHeight: '80px', textAlign: 'center', opacity: a, transform: `scale(${0.5 + 0.5 * a})`, boxShadow: `0 0 30px ${GREEN}66`}}>=</div>
          ) : null;
        })}
        {merge > 0.5 ? (
          <div style={{position: 'absolute', left: 960 - 250, top: 716, width: 500, opacity: sm(seg(merge, 0.6, 1)), display: 'flex', gap: 20, justifyContent: 'center'}}>
            {['n', 'n+1'].map((s, i) => <div key={s} style={{width: 230, height: 110, borderRadius: 10, fontFamily: MONO, fontWeight: 700, fontSize: 54, lineHeight: '110px', textAlign: 'center', color: flip === i ? '#05070C' : '#8E97A8', background: flip === i ? '#fff' : 'rgba(255,255,255,0.08)', boxShadow: flip === i ? '0 0 40px rgba(160,210,255,0.8)' : 'inset 0 0 0 2px rgba(255,255,255,0.2)'}}>{s}</div>)}
          </div>
        ) : null}
      </div>
      {stamp > 0.01 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', opacity: Math.min(1, stamp * 2), transform: `rotate(-5deg) scale(${1.5 - 0.5 * stamp})`}}>
          <div style={{display: 'inline-block', padding: '6px 40px', border: '8px solid #E6F1FF', borderRadius: 22, color: '#E6F1FF', fontFamily: FONT, fontWeight: 800, fontSize: 92, lineHeight: '128px', letterSpacing: '0.06em', background: 'rgba(5,9,18,0.9)', boxShadow: '0 0 80px rgba(120,170,255,0.6), 0 30px 80px rgba(0,0,0,0.7)'}}>NO VISIBLE DIFFERENCE</div>
        </div>
      ) : null}
    </>
  );
};

// ---- E: "But your thumb can feel it" - macro across the real glass --------------------------------------------------------
// the phone lies on its back; low camera; a touch point on the glass, a red shock ripple across the display, the feed hitches
const POSE_E: PoseKey[] = [{t: 0, pitch: 90}];
const TE: [number, number] = [206, 560];
const TW: [number, number, number] = [scrPt(TE[0], TE[1])[0], 0.455, scrPt(TE[0], TE[1])[1]];   // world point of the touch (pose: pitch 90)
const CAM_E: CamKey[] = [
  {t: 181, pos: [3.9, 2.0, -7.4], tgt: [0.1, 0.3, -0.6], fov: 26, focus: TW},
  {t: 250, pos: [2.7, 1.3, -5.6], tgt: [0.0, 0.35, -0.5], fov: 26, focus: TW},
];
const ShotE: React.FC<{t: number}> = ({t}) => {
  const v = phoneView({t, cam: CAM_E, pose: POSE_E, W, H});
  const land = sm(seg(t, 184.5, 188)), feel = t - 200, feel2 = t - 222;
  const hit = (feel >= 0 ? Math.exp(-feel / 8) : 0) + (feel2 >= 0 ? 0.55 * Math.exp(-feel2 / 8) : 0);
  // the feed under the finger: steady drag, then it sticks for a moment and jumps to catch up (felt, not seen)
  const drag = (x: number) => 2300 + 3 * (x - 184);
  const stick = (x: number, at: number, n: number) => (x < at ? 0 : x < at + n ? x - at : n * (1 - sm(seg(x, at + n, at + n + 3))));
  const scroll = drag(t - stick(t, 200, 3) - stick(t, 222, 2));
  const ty = TE[1] - 4 * (t - 200) * 0.0, tp = v.point(scrPt(TE[0], ty));
  const rip = [0, 4, 8].map((d) => ({age: feel - d, color: RED, speed: 20, life: 30, w: 16, r0: 30}))
    .concat([0, 4].map((d) => ({age: feel2 - d, color: RED, speed: 18, life: 24, w: 10, r0: 30})))
    .concat([{age: t - 186, color: '#DCEBFF', speed: 10, life: 14, w: 5, r0: 30}]);
  const face = (id: string) => (
    <ScreenFeed id={id} scroll={scroll} tint={RED} tintA={0.5 * Math.min(1, hit)}>
      <TouchFx x={TE[0]} y={ty} a={land} r={34} color={hit > 0.25 ? '#FF9AA4' : '#CFE6FF'} ripples={rip} />
      <div style={{position: 'absolute', inset: 0, background: RED, opacity: 0.2 * Math.min(1, hit), mixBlendMode: 'screen'}} />
    </ScreenFeed>
  );
  // the lens, faked on the mapped screen (the 3D depth of field cannot reach this 2D layer): copies of the screen with a
  // growing CSS blur, masked into depth bands toward the far (top) edge, and one at the near edge
  const band = (id: string, blur: number, mask: string) => (
    <div key={id} style={{position: 'absolute', left: 0, top: 0, width: SCR_W, height: SCR_H, overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: SCR_W, height: SCR_H, filter: `blur(${blur}px)`}}>{face(id)}</div>
    </div>
  );
  const nearMask = 'linear-gradient(180deg, transparent 78%, black 100%)';
  return (
    <>
      <Studio t={t} glow="#3B6CE0" glowA={0.2} gx={56} gy={30} floor={2} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,5,10,0) 30%, rgba(2,3,6,0.85) 78%)'}} />
      <PhoneShot t={t} W={W} H={H} cam={CAM_E} pose={POSE_E} fx={{dof: {range: 2.6, blur: 14, taps: 200}, bloom: {intensity: 0.45}}} light={{main: 0.9, fill: 1.2, rim: 1.5}}
        screen={<>{face('s01ef')}{band('s01eg', 2.4, 'linear-gradient(180deg, black 0%, black 30%, transparent 48%)')}{band('s01eh', 5, 'linear-gradient(180deg, black 0%, black 15%, transparent 31%)')}{band('s01ei', 9, 'linear-gradient(180deg, black 0%, black 4%, transparent 17%)')}{band('s01ej', 3.2, 'linear-gradient(180deg, transparent 80%, black 97%)')}</>} />
      <div style={{position: 'absolute', inset: 0, background: RED, opacity: 0.13 * Math.min(1, hit), mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', inset: 0, backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)', WebkitMaskImage: nearMask, maskImage: nearMask}} />
    </>
  );
};

// ---- F: "On an iPhone, that almost never happens" ------------------------------------------------------------------------
// the frame-time bars settle into one calm, even green row behind the real phone (the red spike sinks back and turns green);
// every slot ticks "on time" in a steady rhythm; then the logic-board world rises full-bleed - no glow, no line
// hero orbit: the camera swings from the back, past the edge, to the front (the phone stays under its lights, so the back
// keeps its burgundy key light)
const CAM_F: OrbitKey[] = [{t: 240, yaw: 24, pitch: 7, dist: 25, fov: 22, tgt: [0, -0.2, 0], focus: [0, 0, 0]}, {t: 268, yaw: 194, pitch: 5, dist: 27, fov: 22, tgt: [0, -0.2, 0], focus: [0, 0, 0]}, {t: 300, yaw: 203, pitch: 4, dist: 29, fov: 22, tgt: [0, -0.2, 0], focus: [0, 0, 0]}];
const EVEN = 150, FBASE = 640, S01_LEN = 311.5;   // S01 is 623 output frames = 311.5 design frames: its last frame is global time -0.5
const ShotF: React.FC<{t: number}> = ({t}) => {
  const flat = io(seg(t, 246, 262)), away = io(seg(t, 270, 288)), world = io(seg(t, 272, 290)), barsOut = io(seg(t, 274, 288));
  const almost = t >= 266 ? Math.exp(-(t - 266) / 7) : 0;
  // "almost": one bright wave runs down the whole row; then the steady tick carries on
  const h = BARH.map((v, i) => lerp(v, EVEN, flat) + 38 * almost * Math.exp(-Math.pow(i - (t - 266) * 4.2, 2) / 10));
  return (
    <>
      <Studio t={t} glow={GREEN} glowA={(0.08 + 0.14 * flat) * (1 - world)} gy={50} floor={0.86} />
      {/* "never happens": the phone and the bars give way to the logic-board world, lit only by its own light; a specular
          sweep crosses the parts on "happens" while the camera eases in on the A20 Pro (the framing S02 opens on) */}
      {world > 0.003 ? <div style={{position: 'absolute', inset: 0, opacity: world}}><BoardShot t={t - S01_LEN} beats={[]} /></div> : null}
      <OnTimeBars id="s01f" h={h} base={FBASE} tick={(t - 252) / 1.1} redI={SPIKE} redK={1 - io(seg(t, 245, 258))} a={1 - barsOut} dots={flat} />
      <div style={{position: 'absolute', left: 110, top: 150, opacity: sm(seg(t, 256, 264)) * (1 - barsOut)}}><Tag size={34} color={GREEN} style={{padding: '10px 20px', borderRadius: 10, background: 'rgba(4,9,14,0.7)', border: `2px solid ${GREEN}88`}}>every frame on time</Tag></div>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: 1 - away}}>
        {away < 0.995 ? (
          <PhoneShot t={t} W={W} H={H} cam={CAM_F} fx={{dof: {range: 7, blur: 9}, exposure: 1.1}} light={{main: 1.25, rim: 1.6, fill: 2.0}}
            screen={
              <ScreenFeed id="s01ff" scroll={900 + (t - 245) * 15}>
                <TouchFx x={250} y={600 - 230 * (0.5 - 0.5 * Math.cos((t - 262) / 5.5))} a={sm(seg(t, 262, 267))} ripples={[{age: t - 262, speed: 11, life: 13}]} />
              </ScreenFeed>
            } />
        ) : null}
      </div>
    </>
  );
};

export const S01: React.FC<SceneProps> = ({t, W: FW, H: FH}) => {
  const k = FW / 1920;
  return (
    <AbsoluteFill style={{background: '#03050A', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: '0 0'}}>
        {t < 84 ? <ShotAB t={t} /> : t < 137 ? <ShotC t={t} /> : t < 186 ? <ShotD t={t} /> : t < 245 ? <ShotE t={t} /> : <ShotF t={t} />}
      </div>
      {t < 245 ? <SiLens W={FW} H={FH} t={t} focus={[0.06, 0.94]} blur={2} vignette={0.5} dust={8} tint="#6FA8FF" seed={2} /> : <BoardLens W={FW} H={FH} t={t - S01_LEN} />}
    </AbsoluteFill>
  );
};
