// S02 PROMISE (design frames @30).
// one board world: gold trace on the logic board (0-94) -> the camera glides down to three pedestals on the battery (94-222)
// | $125,000,000 / day (220-352) | the REAL phone (cine3d): back glass turns to ghost glass and lifts, board + battery inside
// (350-394) | ONE continuous dive: into the A20 Pro on the board -> package -> die -> cells (2D) -> zoom-through into the 3D
// nanosheet transistor, which switches ON on "transistor" (394-492)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../../src/kit/types';
import {NanoZoom, depthAt, type NanoKey, type NanoLevel, type NanoLevelProps} from '../../../src/kit/explainer/nano';
import {PhoneInnards, PhoneShot, Transistor3D, fetSwitch, fetView, innardsPoint, phoneView, xrayShell, type OrbitKey, type V3} from '../../../src/kit/cine3d';
import {CellFabric, DieFloorplan, LogicBoard, SiChassis, SiChip, SiGlow, SiLens, SiScene, SiTop, boardLayout, boardPartTop, siPoint, sweepAcross} from '../../../src/kit/explainer/silicon';
import {siApple} from 'simple-icons';
import {Callout, FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp} from '../../../src/kit/explainer/tokens';
import {SafeFrame, onWord, pulseOn, wordAt, type Beat} from '../../../src/kit/explainer/world';
import {Drums, GOLD, GREEN, Persp, Studio, Tag, cl, io, lerp, out3, q5, rollPos, seg, sm} from './phone_kit';

const LAYOUT = boardLayout(7);
const svg0 = (node: React.ReactNode) => <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{node}</svg>;
const Frame: React.FC<{W: number; children: React.ReactNode}> = ({W, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${W / 1920})`, transformOrigin: '0 0'}}>{children}</div>
);

// ============================================ board + pedestals: one world, one camera glide ===============================
const U1 = 30, T1 = 0.58;
const o1 = siPoint(U1, T1, [0, 0], ...boardPartTop('soc', LAYOUT));
const ORG1: [number, number] = [960 - o1[0], 520 - o1[1]];
const pp = (id: string) => siPoint(U1, T1, ORG1, ...boardPartTop(id, LAYOUT));
const P_SOC = pp('soc'), P_MOD = pp('modem'), P_WL = pp('wireless');
// the board shot runs on a global time that starts in S01 (its last ~1.3 s are this same component at t < 0): one camera
// ease and one light-sweep phase straight through the cut
const zoomIn = (t: number) => 1 + 0.22 * q5(seg(t, -42, 100));
const BAT_Z = 3.0, PED_R = 7.4, PED_H = 3.2;
const PEDC: [number, number][] = [[45.4, 48.8], [62, 42], [78.6, 35.2]];
const o2 = siPoint(U1, T1, [0, 0], PEDC[1][0], PEDC[1][1], BAT_Z + PED_H);
const ORG2: [number, number] = [960 - o2[0], 500 - o2[1]];
const TILE = ['#FF5A5F', '#37C8FF', '#FFB020', '#35E08A', '#9D7BFF', '#FF8FB1', '#5B6CFF', '#0FB6A8', '#FFD36B'];
const OWN = [132, 160, 190];
const SOCP = LAYOUT.parts.find((p) => p.id === 'soc')!;
const PDIST = LAYOUT.parts.filter((p) => p.id !== 'soc' && p.type === 'chip').map((p) => ({id: p.id, cx: p.x + p.w / 2, cy: p.y + p.d / 2, r: Math.max(p.w, p.d) * 0.95, d: Math.hypot(p.x + p.w / 2 - (SOCP.x + SOCP.w / 2), p.y + p.d / 2 - (SOCP.y + SOCP.d / 2))}));
const bump = (x: number) => (x < 0 ? 0 : Math.min(1, x / 2.5) * Math.exp(-x / 9));
export const BoardShot: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const luck = onWord(t, beats, 'luck', 'settle'), mk = onWord(t, beats, 'make', 'settle'), sc = sp(t, 70, 'settle'), smo = onWord(t, beats, 'smooth', 'settle'), pulse = pulseOn(t, beats);
  const d1 = io(seg(t, 2, 30)), gold = sm(seg(t, 0, 16));
  const cam = q5(seg(t, 88, 128)), des = onWord(t, beats, 'designed', 'settle');
  const org: [number, number] = [lerp(ORG1[0], ORG2[0], cam), lerp(ORG1[1], ORG2[1], cam)];
  const up = [sp(t, wordAt(beats, 'chips', 139), 'bouncy'), sp(t, wordAt(beats, 'modem', 164), 'bouncy'), sp(t, wordAt(beats, 'software', 196), 'bouncy')];
  const own = OWN.map((a) => sp(t, a - 3, 'pop')), rise = [0, 1, 2].map((i) => sp(t, 100 + i * 5, 'bouncy'));
  const scr = (i: number, z = BAT_Z + PED_H) => siPoint(U1, T1, org, PEDC[i][0], PEDC[i][1], z);
  const wave: Record<string, {highlight: number; highlightColor: string}> = {};
  PDIST.forEach(({id, d}) => {
    const gl = (0.8 * bump(t - 27 - d / 1.15) + bump(t - 61 - d / 1.9) + bump(t - 86 - d / 1.9)) * (1 - cam);
    if (gl > 0.02) wave[id] = {highlight: Math.min(1, gl * 1.3), highlightColor: '#FFE1A0'};
  });
  const answer = Math.min(1, bump(t - 61) + bump(t - 86));
  const zoom = 1 + (zoomIn(t) - 1) * (1 - cam) + 0.04 * io(seg(t, 122, 222));
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `50% ${lerp(48.15, 50, cam)}%`}}>
      <SiScene id="s02b" width={1920} height={1080} u={U1} tilt={T1} origin={org} sweep={t < 100 ? sweepAcross(t < 62 ? sm(seg(t, -30, 60)) : sm(seg(t, 64, 100)), 0, 0, 72, 40) : sweepAcross(sm(seg(t, 112, 215)), 20, 20, 110, 70)}>
        <SiChassis layer="back" />
        <LogicBoard layout={LAYOUT} focus={['soc', 'modem', 'wireless']} dim={0.3 * luck * (1 - cam) + 0.35 * cam}
          parts={{...wave, soc: {glow: (0.16 * luck + 0.14 * answer) * (1 - cam), glowColor: GOLD, highlight: Math.min(1, 0.75 * luck + 0.4 * answer + 0.25 * pulse * luck) * (1 - cam), highlightColor: GOLD}}} />
        <SiChassis layer="front" />
        {cam > 0.01 ? (
          <>
            {/* contact shadows + warm pools on the stage floor */}
            <SiTop z={BAT_Z + 0.02}>
              {PEDC.map(([x, y], i) => <circle key={i} cx={x + 1.2} cy={y + 1.6} r={PED_R + 1.6} fill="#000" opacity={0.6 * rise[i]} />)}
            </SiTop>
            {PEDC.map(([x, y], i) => <SiGlow key={i} x={x} y={y + 1.5} r={PED_R * 3.2} z={BAT_Z + 0.05} color="#FFD58A" strength={rise[i] * (0.2 + 0.6 * own[i])} />)}
            {[0, 1, 2].map((i) => {
              const [x, y] = PEDC[i], s = up[i], H = PED_H * rise[i], z = BAT_Z + H + 0.1;
              return rise[i] > 0.01 ? (
                <g key={i}>
                  {Array.from({length: 14}).map((_, k) => <SiTop key={k} z={BAT_Z + (k / 13) * H}><circle cx={x} cy={y} r={PED_R + (k === 0 ? 0.5 : k === 13 ? 0 : k > 10 ? 0.25 : 0)} fill={k === 13 ? '#2B2F38' : k === 0 ? '#4A4F5A' : k > 10 ? '#565C68' : k % 4 === 0 ? '#343944' : '#15171C'} /></SiTop>)}
                  <SiTop z={BAT_Z + H}>
                    <circle cx={x} cy={y} r={PED_R - 0.5} fill="none" stroke="#FFD58A" strokeOpacity={0.12 + 0.3 * own[i]} strokeWidth={1.5} /><circle cx={x} cy={y} r={PED_R - 0.5} fill="none" stroke="#FFF1CF" strokeOpacity={0.3 + 0.7 * own[i]} strokeWidth={0.5} />
                    <circle cx={x} cy={y} r={PED_R - 1.1} fill="#0C0E12" stroke="#fff" strokeOpacity={0.14} strokeWidth={0.08} />
                    <circle cx={x} cy={y} r={PED_R - 1.1} fill={GOLD} opacity={0.1 * own[i]} />
                  </SiTop>
                  {s > 0.01 && i === 0 ? <SiChip x={x - 4.8} y={y - 4.8} w={9.6} d={9.6} z={z} role="soc" lift={0.8 + 6 * (1 - s)} glow={0.55 * s} glowColor={GOLD} opacity={Math.min(1, s * 1.5)} /> : null}
                  {s > 0.01 && i === 1 ? <SiChip x={x - 4.8} y={y - 3.8} w={9.6} d={7.6} z={z} role="modem" mark={{logo: 'apple', title: 'Modem', top: [], lines: [], layout: 'center'}} lift={0.8 + 6 * (1 - s)} glow={0.45 * s} opacity={Math.min(1, s * 1.5)} /> : null}
                  {s > 0.01 && i === 2 ? [0, 1, 2, 3].map((k) => (
                    <SiTop key={k} z={z + 0.6 + k * 2.0 * s + 5 * (1 - s)} opacity={Math.min(1, s * 1.5)}>
                      <rect x={x - 4.8} y={y - 4.8} width={9.6} height={9.6} rx={2} fill={k === 3 ? '#1B2B55' : '#9CC8FF'} fillOpacity={k === 3 ? 0.88 : 0.14} stroke="#CFE4FF" strokeOpacity={0.75} strokeWidth={0.1} />
                      {k === 3 ? Array.from({length: 9}).map((_, j) => <g key={j}><rect x={x - 3.9 + (j % 3) * 2.75} y={y - 3.9 + Math.floor(j / 3) * 2.75} width={2.2} height={2.2} rx={0.55} fill={TILE[j]} /><rect x={x - 3.9 + (j % 3) * 2.75} y={y - 3.9 + Math.floor(j / 3) * 2.75} width={2.2} height={1} rx={0.5} fill="#fff" opacity={0.22} /></g>) : null}
                      {k === 2 ? Array.from({length: 6}).map((_, j) => <rect key={j} x={x - 3.6 + j * 1.25} y={y - 0.2} width={0.8} height={1.6} rx={0.2} fill={GREEN} />) : null}
                      {k === 1 ? Array.from({length: 4}).map((_, j) => <rect key={j} x={x - 3.8} y={y - 3.4 + j * 1.8} width={7.6 - j * 1.2} height={0.7} rx={0.3} fill="#CFE4FF" opacity={0.5} />) : null}
                    </SiTop>
                  )) : null}
                </g>
              ) : null;
            })}
          </>
        ) : null}
      </SiScene>
      {smo > 0 && cam < 0.9 ? <Tag size={30} color={GREEN} style={{position: 'absolute', left: 300, top: 250, padding: '10px 20px', borderRadius: 10, background: 'rgba(4,9,14,0.74)', border: `2px solid ${GREEN}88`, opacity: smo * (1 - sm(cam * 2))}}>every frame on time</Tag> : null}
      {cam > 0.01 ? (
        <>
          <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', filter: 'blur(34px)', opacity: cam}}>
            {[0, 1, 2].map((i) => { const [x, y] = scr(i); return <div key={i} style={{position: 'absolute', left: x - 340, top: -120, width: 680, height: y + 260, clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)', background: 'linear-gradient(180deg, rgba(255,243,208,0.6) 0%, rgba(255,243,208,0.24) 62%, rgba(255,243,208,0.05) 100%)', opacity: 0.1 + 0.9 * own[i]}} />; })}
          </div>
          {[0, 1, 2].map((i) => { const [x, y] = scr(i, BAT_Z); return <div key={i} style={{position: 'absolute', left: x - 210, top: y + 30, width: 420, height: 250, mixBlendMode: 'screen', background: 'radial-gradient(ellipse 50% 50% at 50% 30%, rgba(255,220,150,0.34) 0%, rgba(255,220,150,0.1) 45%, transparent 72%)', opacity: up[i]}} />; })}
          {['Its own chips', 'Its own modem', 'Its own software'].map((s, i) => (
            <div key={i} style={{position: 'absolute', left: scr(i, BAT_Z)[0] - 300, top: scr(i, BAT_Z)[1] + 178, width: 600, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 42, color: '#fff', opacity: up[i], transform: `translateY(${20 * (1 - up[i])}px)`, textShadow: '0 4px 24px #000, 0 0 12px #000'}}>{s}</div>
          ))}
        </>
      ) : null}
    </div>
  );
};

// ============================================ $125,000,000 / day ==========================================================
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const Blueprint = React.memo(() => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, perspective: 1500, perspectiveOrigin: '50% 30%'}}>
    <div style={{position: 'absolute', left: -340, top: 300, width: 2600, height: 1625, transform: 'rotateX(62deg) rotateZ(-8deg)', transformOrigin: '50% 30%', WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 45%, black 30%, transparent 78%)', maskImage: 'radial-gradient(ellipse 60% 70% at 50% 45%, black 30%, transparent 78%)'}}>
      <svg width={2600} height={1625}><DieFloorplan id="s02bp" x={0} y={0} w={2600} h={1625} detail={1} dim={0.05} /></svg>
    </div>
  </div>
));
const CountP: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const a125 = wordAt(beats, '125', 232), aMil = wordAt(beats, 'million', 258), aDay = wordAt(beats, 'day', 280);
  const posAt = (tt: number) => {
    const hi = rollPos(125 * out3(seg(tt, a125, a125 + 18)), 3);
    const lo = Array.from({length: 6}).map((_, i) => (20 + 10 * i) * (1 - out3(seg(tt, aMil - 4, aMil + 12 + i * 2.5))));
    return [...hi, ...lo];
  };
  const mil = t >= aMil - 4, dol = onWord(t, beats, 'dollars', 'bouncy'), day = sp(t, aDay, 'bouncy'), res = onWord(t, beats, 'research', 'settle'), yr = seg(t, wordAt(beats, 'last', 312), wordAt(beats, 'year', 320) + 10);
  const inn = sp(t, 215, 'settle'), flip = Math.max(0, (t - 224) / 9), fi = Math.floor(flip), ff = io(cl((flip - fi) * 1.5));
  const scan = ((t - 220) / 120) % 1;
  return (
    <>
      <Studio t={t} glow={GOLD} glowA={0.12 + 0.1 * dol} gy={38} floor={0.62} />
      <div style={{position: 'absolute', inset: 0, opacity: 0.9}}><Blueprint /></div>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(3,5,10,0.0) 40%, rgba(3,5,10,0.75) 100%)'}} />
      {/* calendar: on screen from the first frame, a page flips away every few frames, pops on "day" */}
      <Persp x={1566} y={352} p={1400} s={0.9 + 0.1 * inn + 0.1 * day}>
        <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `rotateY(${-24 + 6 * day}deg) rotateX(9deg)`, opacity: inn}}>
          {[5, 4, 3, 2].map((k) => <div key={k} style={{position: 'absolute', left: -170 + k * 5, top: -150 + k * 6, width: 340, height: 330, borderRadius: 22, background: k % 2 ? '#B5BAC6' : '#DADDE6', transform: `translateZ(${-k * 6}px)`, boxShadow: k === 5 ? '0 40px 80px rgba(0,0,0,0.7)' : undefined}} />)}
          {[1, 0].map((k) => (
            <div key={k} style={{position: 'absolute', left: -170, top: -150, width: 340, height: 330, borderRadius: 22, background: 'linear-gradient(180deg,#F4F5F8,#C9CEDA)', overflow: 'hidden', transformOrigin: '50% 0%', backfaceVisibility: 'hidden',
                                 transform: k === 0 ? `rotateX(${-170 * ff}deg)` : undefined, filter: k === 0 ? `brightness(${1 - 0.5 * ff})` : undefined, boxShadow: `0 0 ${60 * day}px ${GOLD}88`}}>
              <div style={{height: 84, background: 'linear-gradient(180deg,#FF5A5F,#D93A45)', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 40, lineHeight: '84px', textAlign: 'center', letterSpacing: '0.2em'}}>DAY</div>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 118, color: '#15171C', textAlign: 'center', lineHeight: '230px'}}>{DAYS[(fi + k) % 7]}</div>
              {[70, 270].map((x) => <div key={x} style={{position: 'absolute', left: x - 9, top: 12, width: 18, height: 18, borderRadius: 9, background: '#7A1A22', boxShadow: 'inset 0 2px 4px #0008'}} />)}
            </div>
          ))}
        </div>
      </Persp>
      <div style={{position: 'absolute', left: 110, top: 205, opacity: inn}}><Tag size={30} color={GOLD}>Research and development</Tag></div>
      <div style={{position: 'absolute', left: 96, top: 290, transform: `translateY(${40 * (1 - inn)}px) scale(${0.9 + 0.1 * inn})`, transformOrigin: '0 50%', opacity: inn}}>
        <Drums pos={posAt(t)} prev={posAt(t - 0.6)} dim={Array.from({length: 9}).map((_, i) => (i < 3 ? t < a125 : !mil))} size={150} prefix="$" group accent={GOLD} lit={Math.max(dol, pulseOn(t, beats) * 0.6)} />
      </div>
      <div style={{position: 'absolute', left: 1400, top: 590, fontFamily: FONT, fontWeight: 800, fontSize: 124, color: '#fff', opacity: day, transform: `scale(${1.6 - 0.6 * day})`, transformOrigin: '30% 50%', textShadow: `0 0 50px ${GOLD}88`, whiteSpace: 'nowrap'}}>/ DAY</div>
      <div style={{position: 'absolute', left: 110, top: 640, display: 'flex', gap: 14, opacity: inn}}>
        {'JFMAMJJASOND'.split('').map((m, i) => { const on = yr * 12 > i; return <div key={i} style={{width: 66, height: 66, borderRadius: 14, background: on ? GOLD : '#1A1D24', color: on ? '#15171C' : '#6A7180', fontFamily: FONT, fontWeight: 700, fontSize: 30, lineHeight: '66px', textAlign: 'center', boxShadow: on ? `0 0 24px ${GOLD}88` : 'inset 0 0 0 1px #fff2'}}>{m}</div>; })}
      </div>
      <div style={{position: 'absolute', left: 110, top: 742, opacity: res, transform: `translateX(${-30 * (1 - res)}px)`}}><Tag size={30} color="#E6E9EE">Apple FY2026 R&D: $45.77 billion</Tag></div>
    </>
  );
};

// ============================================ the real phone opens -> one continuous dive ==================================
// One depth value D = log10(board px-per-mm on screen / U0) drives everything from the wide phone shot to the cell fabric:
// the 3D camera's distance while the phone is on screen, then NanoZoom (2D). The hand-over happens top-down over the A20 Pro,
// where the phone's inside plane and the 2D package level are the same picture.
const U0 = 66;
const SOCD = LAYOUT.parts.find((p) => p.id === 'soc')!;
const SOC_C: [number, number] = [SOCD.x + SOCD.w / 2, SOCD.y + SOCD.d / 2];
const DIE_MM = SOCD.w * 0.76, DIE_PX = 1160, DIE_H = DIE_PX / 1.5, D1 = Math.log10(DIE_PX / (DIE_MM * U0)), D2 = D1 + Math.log10(20);
const FOV = 22, KD = (540 / Math.tan(((FOV / 2) * Math.PI) / 180)) * (17 / 300);   // camera distance = KD / (board px per mm)
const DIST0 = 26.5, DW0 = Math.log10(KD / DIST0 / U0), DHAND = -0.16;
// ONE zoom for the whole dive, in log space: a slow settle of the wide shot plus a single quintic ease from the wide phone
// to the transistor. The 3D phone camera, the 2D NanoZoom levels and the 3D transistor camera all read this one value, so
// scale and zoom velocity are continuous at every hand-over.
const GA = Math.log10(KD / 32 / U0), GF0 = D2 + 0.25, FD1 = 15.2, GE = GF0 + Math.log10(100 / FD1);
// velocity profile of the dive: a smooth ramp up, a long stretch at ONE constant zoom rate (so every hand-over happens at
// the same velocity), a smooth ramp down. `trapI` is its integral.
const rampI = (x: number) => { const c = cl(x); return c * c * c - (c * c * c * c) / 2; };
const trapI = (t: number, a: number, b: number, c: number, d: number) =>
  (t <= a ? 0 : t < b ? (b - a) * rampI((t - a) / (b - a)) : (b - a) * 0.5 + (Math.min(t, c) - b)) + (t <= c ? 0 : (d - c) * (cl((t - c) / (d - c)) - rampI((t - c) / (d - c))));
const T_REF = 372, T_DIVE = 384, TD: [number, number, number, number] = [T_DIVE, 402, 468, 484], TD_AREA = (TD[1] - TD[0]) / 2 + (TD[2] - TD[1]) + (TD[3] - TD[2]) / 2;
const GD = (t: number) => lerp(GA, DW0, sm(seg(t, 346, 404))) + ((GE - DW0) * trapI(t, ...TD)) / TD_AREA;
const NKEYS: NanoKey[] = Array.from({length: 56}).map((_, i) => ({t: 376 + i * 2, depth: GD(376 + i * 2)}));
const CHIP: V3 = innardsPoint('soc');
const WIDE_TGT: V3 = [4.5, -0.25, 0];
const camOpen = (t: number): OrbitKey[] => {
  const D = GD(t), f = q5(seg(t, T_REF, 410)), w = sm(seg(t, 346, 404));   // re-centre on the chip: one ease, done before the hand-over
  return [{t: 0, yaw: lerp(lerp(40, 29, w), 0, f), pitch: lerp(lerp(12, 9, w), 0, f), dist: KD / (U0 * Math.pow(10, D)), fov: FOV,
           tgt: [lerp(WIDE_TGT[0], CHIP[0], f), lerp(WIDE_TGT[1], CHIP[1], f), lerp(WIDE_TGT[2], CHIP[2], f)], focus: [lerp(0, CHIP[0], f), lerp(0, CHIP[1], f), CHIP[2]]}];
};
const OPEN_LIFT = 3.3, CARD_X = 1050, CARD_W = 770, CARD_H = 146;
const LAYERS: {s: string; sub: string; at: number; p: V3; lift?: boolean; y: number; hot?: boolean; k: number}[] = [
  {s: 'Back glass', sub: 'lifts off first', at: 364, p: [1.3, -3.3, 0.13], lift: true, y: 168, k: 0},
  {s: 'Logic board', sub: 'where the chips live', at: 380, p: innardsPoint('modem'), y: 334, k: 1},
  {s: 'Battery', sub: 'takes most of the room', at: 386, p: [0.9, -1.9, -0.16], y: 500, k: 2},
  {s: 'A20 Pro', sub: 'the chip Apple designed', at: 394, p: CHIP, y: 666, hot: true, k: 3},
];
const LayerIcon = React.memo<{k: number}>(({k}) => (
  <svg width={102} height={102} viewBox="0 0 102 102">
    <defs>
      <linearGradient id={`s02ic${k}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={['#CFE4FF', '#1E2A3C', '#555B66', '#3A3F48'][k]} /><stop offset="1" stopColor={['#5E7FB8', '#0A0F18', '#23262C', '#15171C'][k]} /></linearGradient>
    </defs>
    <rect x={3} y={3} width={96} height={96} rx={22} fill="#0A0D14" stroke="#fff" strokeOpacity={0.16} strokeWidth={2} />
    {k === 0 ? <g><rect x={30} y={14} width={42} height={74} rx={10} fill="url(#s02ic0)" opacity={0.5} /><rect x={30} y={14} width={42} height={74} rx={10} fill="none" stroke="#E6F1FF" strokeWidth={2.5} /><path d="M38 22L62 22L40 50Z" fill="#fff" opacity={0.35} /></g> : null}
    {k === 1 ? <g><path d="M16 26H86V62H44V80H16Z" fill="url(#s02ic1)" stroke="#6FA8FF" strokeOpacity={0.7} strokeWidth={2} /><rect x={36} y={32} width={22} height={22} rx={3} fill="#3A3F48" stroke={GOLD} strokeWidth={2} /><rect x={64} y={34} width={14} height={18} rx={2} fill="#AEB5BF" /><rect x={20} y={32} width={10} height={10} fill="#AEB5BF" /><rect x={20} y={66} width={18} height={8} fill="#C98B4E" /></g> : null}
    {k === 2 ? <g><rect x={24} y={16} width={54} height={72} rx={8} fill="url(#s02ic2)" stroke="#fff" strokeOpacity={0.3} strokeWidth={2} /><rect x={42} y={10} width={18} height={7} rx={2} fill="#AEB5BF" /><rect x={32} y={54} width={38} height={26} rx={4} fill={GREEN} opacity={0.85} /><rect x={32} y={26} width={38} height={6} rx={3} fill="#fff" opacity={0.25} /></g> : null}
    {k === 3 ? <g><rect x={22} y={22} width={58} height={58} rx={7} fill="url(#s02ic3)" stroke={GOLD} strokeWidth={3} />{Array.from({length: 7}).map((_, i) => <g key={i}><rect x={27 + i * 7.4} y={14} width={3.6} height={6} fill={GOLD} /><rect x={27 + i * 7.4} y={82} width={3.6} height={6} fill={GOLD} /><rect x={14} y={27 + i * 7.4} width={6} height={3.6} fill={GOLD} /><rect x={82} y={27 + i * 7.4} width={6} height={3.6} fill={GOLD} /></g>)}<g transform="translate(37 36) scale(1.15)"><path d={siApple.path} fill="#E9ECF0" /></g></g> : null}
  </svg>
));
const OpenP: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const cam = camOpen(t), v = phoneView({t, cam, W: 1920, H: 1080});
  const D = GD(t), g = cl((D - DW0) / (DHAND - DW0));
  const x = sm(seg(t, 354, 366)), open = io(seg(t, wordAt(beats, 'open', 360) - 1, 384)), l2 = sp(t, 394, 'settle'), pulse = pulseOn(t, beats);
  const off = 1 - sm(cl(g * 2.6)), close = sm(seg(g, 0.55, 0.95));
  const shell = xrayShell(x, open, OPEN_LIFT);
  const ref = (vv: typeof v) => { const a = vv.point([0, 4.5, 0]), b = vv.point([0, -4.5, 0]); return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, l: Math.hypot(a.x - b.x, a.y - b.y)}; };
  const M0 = ref(phoneView({t: T_REF, cam: camOpen(T_REF), W: 1920, H: 1080})), Mm = t > T_REF ? ref(v) : M0, kz = Mm.l / M0.l;
  return (
    <>
      <Studio t={t} glow="#3B8CFF" glowA={0.26} gx={30} gy={46} floor={2} />
      <div style={{position: 'absolute', inset: 0, background: '#05070C', opacity: sm(seg(g, 0.5, 0.9))}} />
      <PhoneShot t={t} W={1920} H={1080} cam={cam} shell={{...shell, backGlass: {...shell.backGlass, opacity: 1 - sm(seg(t, T_DIVE - 2, T_DIVE + 9))}}} fx={{dof: false}}
        interior={<PhoneInnards light={Math.max(x, 0.001)} sweep={sm(seg(t, 364, 412))} dim={0.3 * l2 * (1 - close)} focus="soc"
          parts={{soc: {glow: lerp(0.55 * l2 * (0.6 + 0.4 * pulse), 0.4, close), glowColor: GOLD, highlight: l2 * (1 - close), highlightColor: GOLD}}} />} />
      {/* the layer stack: one large card per layer, lighting as its layer is named. Once the dive starts the stack is left
          behind WITH the phone (same pan and zoom as the phone on screen), so the picture moves as one */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${Mm.x - M0.x * kz}px, ${Mm.y - M0.y * kz}px) scale(${kz})`}}>
      <div style={{position: 'absolute', left: CARD_X, top: 98, opacity: sp(t, 354, 'settle') * off}}><Tag size={28} color="#9CC3FF">iPhone 18 Pro · layer by layer</Tag></div>
      {LAYERS.map((L, i) => {
        const base = sp(t, 353 + i * 2.5, 'settle'), lit = sp(t, L.at, 'pop'), hot = t >= L.at ? Math.exp(-(t - L.at) / 16) : 0;
        const a = base * (0.34 + 0.66 * lit) * off;
        if (a < 0.01) return null;
        const qs = v.point(L.p, L.lift ? open * OPEN_LIFT : 0), q = {x: M0.x + (qs.x - Mm.x) / kz, y: M0.y + (qs.y - Mm.y) / kz}, col = L.hot ? GOLD : '#9CC8FF', cy = L.y + CARD_H / 2;
        return (
          <React.Fragment key={i}>
            {lit > 0.01 ? <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: lit * off}}><path d={`M${q.x} ${q.y}L${CARD_X - 60} ${cy}H${CARD_X}`} stroke={col} strokeOpacity={0.8} strokeWidth={2.5} fill="none" /><circle cx={q.x} cy={q.y} r={8} fill={col} /><circle cx={q.x} cy={q.y} r={18 + 10 * hot} fill="none" stroke={col} strokeOpacity={0.55} strokeWidth={2.5} /></svg> : null}
            <div style={{position: 'absolute', left: CARD_X, top: L.y, width: CARD_W, height: CARD_H, boxSizing: 'border-box', borderRadius: 24, opacity: a, transform: `translateX(${50 * (1 - base)}px) scale(${1 + 0.035 * hot})`, transformOrigin: '0 50%',
                         background: 'linear-gradient(135deg, rgba(40,50,72,0.94) 0%, rgba(14,18,28,0.94) 60%, rgba(22,28,42,0.94) 100%)', border: `2.5px solid ${lit > 0.5 ? col : 'rgba(255,255,255,0.18)'}`,
                         boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 ${50 * hot + (L.hot ? 26 * lit : 0)}px ${col}${L.hot ? 'AA' : '88'}, inset 0 1px 0 rgba(255,255,255,0.22)`}}>
              <div style={{position: 'absolute', left: 22, top: 20}}><LayerIcon k={L.k} /></div>
              <div style={{position: 'absolute', left: 150, top: 22, fontFamily: FONT, fontWeight: 700, fontSize: 50, lineHeight: '58px', color: L.hot ? GOLD : '#fff', whiteSpace: 'nowrap'}}>{L.s}</div>
              <div style={{position: 'absolute', left: 152, top: 84, fontFamily: FONT, fontWeight: 500, fontSize: 30, lineHeight: '38px', color: '#AEB9CC', whiteSpace: 'nowrap'}}>{L.sub}</div>
              <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: '46%', borderRadius: '22px 22px 0 0', background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))'}} />
            </div>
          </React.Fragment>
        );
      })}
      </div>
    </>
  );
};

// the dive levels (2D): package (top-down, the same board as inside the phone) -> die -> cell fabric
const NPackage: React.FC<NanoLevelProps> = ({scale}) => (
  <>
    <div style={{position: 'absolute', left: -6000, top: -4000, width: 12000, height: 8000, background: '#0C0E12'}} />
    <SiScene id="s02x" width={1} height={1} u={U0} tilt={0} origin={[-SOC_C[0] * U0, -SOC_C[1] * U0]}>
      <LogicBoard layout={LAYOUT} parts={{soc: {xray: sm((scale - 1.04) / 0.7), glow: 0.4, glowColor: GOLD}}} />
    </SiScene>
  </>
);
const NDie: React.FC<NanoLevelProps> = ({t}) => svg0(
  <g><rect x={-1500} y={-1000} width={3000} height={2000} fill="#07090C" />
    <DieFloorplan id="s02n1" x={-DIE_PX / 2} y={-DIE_H / 2} w={DIE_PX} h={DIE_H} detail={2} active={{pcore1: 1}} dim={0.4} shift={0.15 + t / 900} />
    <text x={DIE_PX / 2} y={DIE_H / 2 + 44} textAnchor="end" fontFamily={FONT} fontSize={28} fill="#9AA6B8">illustration</text></g>,
);
const NFab: React.FC<NanoLevelProps> = ({t}) => svg0(<CellFabric id="s02n2" w={3000} h={1700} rowH={66} t={t} pulse={0.9} />);
const P_CORE: [number, number] = [-DIE_PX / 2 + (717 / 1600) * DIE_PX, -DIE_H / 2 + (235 / 1000) * DIE_H];
const NLEVELS: NanoLevel[] = [{id: 'package', depth: 0, portal: [0, 0], bg: '#05070C', Draw: NPackage}, {id: 'die', depth: D1, portal: [0, 0], bg: '#05070C', Draw: NDie}, {id: 'fabric', depth: D2, bg: '#060B14', Draw: NFab}];
const SAFE = {focusY: 0.5, zoom: 1, fadeTo: 0, landscape: true};

// the 3D transistor: the camera keeps falling out of the cell fabric, onto one device in its row
const FET_CUT = 0.52;
const camFet = (t: number): OrbitKey[] => {
  const D = GD(t), s = sm(seg(D, GF0 - 0.1, GE));
  return [{t: 0, yaw: lerp(46, 26, s), pitch: lerp(34, 22, s), dist: FD1 * Math.pow(10, GE - D), fov: 24, tgt: [0.1, 1.25, 0.2], focus: [0, 1.4, 1.2]}];
};
const FetP: React.FC<{t: number; beats: Beat[]}> = ({t, beats}) => {
  const at = wordAt(beats, 'transistor', 460), gate = fetSwitch(t, [at + 1], 12), cam = camFet(t);
  const v = fetView({t, cam, W: 1920, H: 1080, cut: FET_CUT}), c = v.point('centre');
  const P = (n: string): [number, number] => { const q = v.point(n); return [q.x, q.y]; };
  const hit = t >= at ? Math.exp(-(t - at) / 10) : 0;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#03050A'}} />
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 62% 70% at 50% 42%, #1B2D52 0%, #0C1528 42%, rgba(3,5,10,0) 78%)'}} />
      <Transistor3D t={t} W={1920} H={1080} cam={cam} gate={gate} cut={FET_CUT * sm(seg(GD(t), GF0, GE - 0.08))} fx={{dof: {range: 2.6, blur: 14}}} />
      <div style={{position: 'absolute', left: 86, top: 64, opacity: sm(seg(t, 458, 466))}}><Tag size={26} color="#C9D6EA" style={{padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(8,12,20,0.6)'}}>illustration · not to scale</Tag></div>
      <Callout t={t} at={466} from={P('gate')} to={[1920 * 0.7, 1080 * 0.16]} text="Gate" gloss="switches the current on" W={1920} color="#E7C27A" />
      <Callout t={t} at={473} from={P('sheets')} to={[1920 * 0.2, 1080 * 0.64]} text="Nanosheets" gloss="stacked silicon channels" W={1920} color="#9CC3FF" />
    </>
  );
};

/** lens of the board shot (shared with the end of S01) */
export const BoardLens: React.FC<{W: number; H: number; t: number}> = ({W, H, t}) => {
  const c = q5(seg(t, 88, 128));
  return <SiLens W={W} H={H} t={t} focus={t < 220 ? [0.2 - 0.12 * (1 - c), 0.92] : [0.08, 0.92]} blur={t < 220 ? 2.5 + 3.5 * c : t >= 352 ? 0 : 2.5} vignette={0.55} dust={10} tint="#6FA8FF" seed={5} />;
};
export const S02: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const beats = spec.beats ?? [];
  const D = GD(t), nz = sm(seg(D, DHAND - 0.08, DHAND)), fet = sm(seg(D, GF0, GF0 + 0.22));
  return (
    <AbsoluteFill style={{background: '#03050A', overflow: 'hidden'}}>
      <Frame W={W}>
        {t < 220 ? <BoardShot t={t} beats={beats} /> : t < 352 ? <CountP t={t} beats={beats} /> : nz < 1 ? <OpenP t={t} beats={beats} /> : null}
      </Frame>
      {nz > 0 && fet < 1 ? <div style={{position: 'absolute', inset: 0, opacity: nz}}><SafeFrame.Provider value={SAFE}><NanoZoom levels={NLEVELS} keys={NKEYS} t={t} beats={beats} W={W} H={H} top="#03060C" /></SafeFrame.Provider></div> : null}
      {fet > 0 ? <Frame W={W}><div style={{position: 'absolute', inset: 0, opacity: fet}}><FetP t={t} beats={beats} /></div></Frame> : null}
      <BoardLens W={W} H={H} t={t} />
    </AbsoluteFill>
  );
};
