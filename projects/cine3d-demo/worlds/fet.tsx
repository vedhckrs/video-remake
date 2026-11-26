// cine3d-demo S06-S10: the hero nanosheet transistor (cine3d Transistor3D v2) inside the 2D explainer world.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../../src/kit/types';
import {Callout} from '../../../src/kit/explainer/stage';
import {LogicBoard, SiScene, boardLayout, boardPartTop, siPoint, sweepAcross} from '../../../src/kit/explainer/silicon';
import {Transistor3D, fetSwitch, fetView, type CamKey, type OrbitKey} from '../../../src/kit/cine3d';
import {Lens, StudioWorld, smooth} from './common';

const Tag: React.FC<{W: number; H: number; text?: string}> = ({W, H, text = 'ILLUSTRATION · NOT TO SCALE'}) => (
  <div style={{position: 'absolute', left: W * 0.045, top: H * 0.07, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(8,12,20,0.6)', color: '#C9D6EA', fontFamily: 'JetBrains Mono, monospace', fontSize: 17, letterSpacing: 3}}>{text}</div>
);

/** A scale tick between two projected points (the kit's `pitchA` / `pitchB`: one gate pitch on the oxide). */
const ScaleTick: React.FC<{a: {x: number; y: number}; b: {x: number; y: number}; label: string; k: number}> = ({a, b, label, k}) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const ex = a.x + dx * k, ey = a.y + dy * k;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, k * 3)}}>
      <line x1={a.x} y1={a.y} x2={ex} y2={ey} stroke="#DCE8FF" strokeWidth={2} />
      {[[a.x, a.y], [ex, ey]].map(([x, y], i) => <line key={i} x1={x - nx * 9} y1={y - ny * 9} x2={x + nx * 9} y2={y + ny * 9} stroke="#DCE8FF" strokeWidth={2} />)}
      <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 22} textAnchor="middle" fill="#C9D6EA" fontFamily="JetBrains Mono, monospace" fontSize={17} letterSpacing={2.5} opacity={smooth((k - 0.6) / 0.4)}>{label}</text>
    </svg>
  );
};

// ---- S06: hero (off) ------------------------------------------------------------------------------------------
const C6: OrbitKey[] = [
  {t: -10, yaw: 38, pitch: 25, dist: 19.5, fov: 24, tgt: [0.1, 1.2, 0.2], focus: [0, 1.4, 1.2]},
  {t: 190, yaw: 25, pitch: 27, dist: 17, fov: 24, tgt: [0.1, 1.2, 0.2], focus: [0, 1.4, 1.2]},
];
export const S06: React.FC<SceneProps> = ({t, W, H}) => {
  const cut = 0.52 * smooth((t - 16) / 56);
  const v = fetView({t, cam: C6, W, H, cut});
  const P = (n: string): [number, number] => { const p = v.point(n); return [p.x, p.y]; };
  return (
    <StudioWorld W={W} H={H} glow={[0.5, 0.4]}>
      <Transistor3D t={t} W={W} H={H} cam={C6} gate={0} cut={cut} />
      <Lens W={W} H={H} t={t} seed={15} />
      <Tag W={W} H={H} />
      <ScaleTick a={v.point('pitchA')} b={v.point('pitchB')} label="ONE GATE PITCH · TENS OF NANOMETRES" k={smooth((t - 70) / 26)} />
      <Callout t={t} at={84} from={P('gate')} to={[W * 0.66, H * 0.13]} text="Gate" gloss="wraps every sheet on all four sides" W={W} color="#E7C27A" />
      <Callout t={t} at={98} from={P('source')} to={[W * 0.14, H * 0.42]} text="Source" gloss="electrons enter" W={W} color="#39D0B8" />
      <Callout t={t} at={112} from={P('drain')} to={[W * 0.86, H * 0.5]} text="Drain" gloss="electrons leave" W={W} color="#39D0B8" />
      <Callout t={t} at={126} from={P('sheets')} to={[W * 0.17, H * 0.66]} text="Nanosheets" gloss="three stacked silicon channels" W={W} color="#9CC3FF" />
    </StudioWorld>
  );
};

// ---- S07: switching -------------------------------------------------------------------------------------------
const C7: OrbitKey[] = [
  {t: -10, yaw: 26, pitch: 19, dist: 17, fov: 24, tgt: [0.1, 1.5, 0.3], focus: [0, 1.4, 1.2]},
  {t: 210, yaw: 12, pitch: 14, dist: 13.2, fov: 24, tgt: [0.15, 1.45, 0.5], focus: [0, 1.4, 1.2]},
];
export const gate7 = (t: number) => fetSwitch(t, [36, 96, 124, 178], 13);
export const S07: React.FC<SceneProps> = ({t, W, H}) => {
  const g = gate7(t);
  return (
    <StudioWorld W={W} H={H} glow={[0.5, 0.4]}>
      <Transistor3D t={t} W={W} H={H} cam={C7} gate={g} cut={0.52} fx={{dof: {range: 2.2, blur: 16}}} />
      <Lens W={W} H={H} t={t} seed={17} />
      <Tag W={W} H={H} />
      <div style={{position: 'absolute', right: W * 0.05, top: H * 0.07, fontFamily: 'JetBrains Mono, monospace', fontSize: 22, letterSpacing: 4, color: g > 0.5 ? '#8FE8B4' : '#7C8798'}}>
        GATE {g > 0.5 ? 'ON' : 'OFF'}
      </div>
    </StudioWorld>
  );
};

// ---- S08: pull back over many ---------------------------------------------------------------------------------
const C8: CamKey[] = [
  {t: -10, pos: [7, 6.5, 14], tgt: [0, 1.4, 0], fov: 26},
  {t: 90, pos: [20, 20, 40], tgt: [0, 0, -6], fov: 26, focus: [0, 1, 0]},
  {t: 200, pos: [34, 46, 78], tgt: [0, 0, -22], fov: 26, focus: [0, 0, -8]},
];
export const S08: React.FC<SceneProps> = ({t, W, H}) => (
  <AbsoluteFill style={{background: '#04070E'}}>
    <Transistor3D t={t} W={W} H={H} cam={C8} gate={gate7(t + 60)} cut={0.5 * (1 - smooth((t - 10) / 50))} field={{cols: 41, rows: 25, activity: 0.5}}
      background="#04070E" fog={['#04070E', 60, 300]} fx={{dof: {range: 26, blur: 10}, bloom: {threshold: 0.8, intensity: 0.9}, exposure: 1.5}} light={{radius: 30, top: 1.4, fill: 0.8}} />
    <Lens W={W} H={H} t={t} seed={19} vignette={0.8} />
    <Tag W={W} H={H} />
  </AbsoluteFill>
);

// ---- S09: the lite inset inside a round lens over the 2D A20 Pro package --------------------------------------
const LAYOUT = boardLayout(7);
const U9 = 46, TILT9 = 0.58;
const SOC = boardPartTop('soc', LAYOUT);
const p0 = siPoint(U9, TILT9, [0, 0], SOC[0], SOC[1], SOC[2]);
const O9: [number, number] = [760 - p0[0], 600 - p0[1]];
const C9: OrbitKey[] = [{t: -10, yaw: 36, pitch: 20, dist: 13.5, fov: 26, tgt: [0, 1.5, 0.2]}, {t: 200, yaw: 22, pitch: 19, dist: 12.5, fov: 26, tgt: [0, 1.5, 0.2]}];
export const S09: React.FC<SceneProps> = ({t, W, H}) => {
  const R = 235, cx = 1420, cy = 330;
  const k = smooth((t - 10) / 26);
  return (
    <AbsoluteFill style={{background: '#04070E'}}>
      <SiScene id="s9" width={1920} height={1080} u={U9} tilt={TILT9} origin={O9} sweep={sweepAcross(smooth((t + 10) / 110), 0, 0, 72, 40)}>
        <LogicBoard layout={LAYOUT} parts={{soc: {glow: 0.5, highlight: 1}}} focus="soc" dim={0.35} />
      </SiScene>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={760} y1={600} x2={760 + (cx - R * 0.72 - 760) * k} y2={600 + (cy + R * 0.7 - 600) * k} stroke="#9CC3FF" strokeWidth={2} strokeOpacity={0.8} />
        <circle cx={760} cy={600} r={7} fill="#9CC3FF" />
      </svg>
      <div style={{position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: '50%', overflow: 'hidden', transform: `scale(${0.6 + 0.4 * k})`, opacity: k, boxShadow: '0 0 0 3px rgba(156,195,255,0.9), 0 0 0 9px rgba(156,195,255,0.16), 0 30px 80px rgba(0,0,0,0.7)', background: 'radial-gradient(circle at 40% 35%, #14233F, #060B16 75%)'}}>
        <Transistor3D t={t} W={R * 2} H={R * 2} cam={C9} gate={fetSwitch(t, [44, 100, 124], 13)} cut={0.52} lite />
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.14), rgba(255,255,255,0) 42%)', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.75)'}} />
      </div>
      <div style={{position: 'absolute', left: cx - R + 20, top: cy + R + 22, width: R * 2 - 40, padding: '12px 0 14px', borderRadius: 14, background: 'rgba(6,10,18,0.82)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', opacity: k, fontFamily: 'Poppins, sans-serif'}}>
        <div style={{fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: 1}}>TSMC 2 nm</div>
        <div style={{fontSize: 17, color: '#9FB0C8', letterSpacing: 2, marginTop: 4}}>nanosheet transistor · illustration</div>
      </div>
      <Lens W={W} H={H} t={t} seed={21} />
    </AbsoluteFill>
  );
};

// ---- S10: deep cut-away, low three-quarter macro --------------------------------------------------------------
const C10: OrbitKey[] = [
  {t: -10, yaw: 44, pitch: 11, dist: 12.5, fov: 22, tgt: [0.1, 1.45, 0.3], focus: [0, 1.4, 0.2]},
  {t: 210, yaw: 31, pitch: 8, dist: 10.5, fov: 22, tgt: [0.1, 1.45, 0.2], focus: [0, 1.4, 0]},
];
export const S10: React.FC<SceneProps> = ({t, W, H}) => {
  const cut = 0.52 + 0.3 * smooth((t - 10) / 70);
  const v = fetView({t, cam: C10, W, H, cut});
  const P = (n: string): [number, number] => { const p = v.point(n); return [p.x, p.y]; };
  return (
    <StudioWorld W={W} H={H} glow={[0.5, 0.42]}>
      <Transistor3D t={t} W={W} H={H} cam={C10} gate={fetSwitch(t, [150], 14)} cut={cut} metal={1} fx={{dof: {range: 1.5, blur: 18, taps: 200}}} />
      <Lens W={W} H={H} t={t} seed={23} vignette={0.75} />
      <Tag W={W} H={H} />
      <Callout t={t} at={96} from={P('highK')} to={[W * 0.2, H * 0.24]} text="High-k sleeve" gloss="the insulator round each sheet" W={W} color="#9BE8F5" />
      <Callout t={t} at={110} from={P('tungsten')} to={[W * 0.8, H * 0.3]} text="Gate metal" gloss="work-function metal + tungsten fill" W={W} color="#E7C27A" />
    </StudioWorld>
  );
};
