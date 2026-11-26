// silicon-demo S03: one continuous dive - package (top-down macro) -> die floorplan -> the cell fabric of a core ->
// one gate-all-around nanosheet transistor switching. NanoZoom levels are drawn in centred px (frame x -960..960,
// y -540..540); every level is sized so the next one fits exactly where the camera lands.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../../src/kit/types';
import {NanoZoom, type NanoKey, type NanoLevel, type NanoLevelProps} from '../../../src/kit/explainer/nano';
import {CellFabric, DieFloorplan, LogicBoard, NanosheetFET, NanosheetField, SiLens, SiScene, sweepAcross} from '../../../src/kit/explainer/silicon';
import {SafeFrame, onWord, wordAt} from '../../../src/kit/explainer/world';
import {LAYOUT, smooth} from './common';

const svg = (node: React.ReactNode) => <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{node}</svg>;

// ---- level 0: the package from straight above (tilt 0) ----
const U0 = 66;
const SOC = LAYOUT.parts.find((p) => p.id === 'soc')!;
const DIE_MM = SOC.w * 0.76;                                 // SiChip draws the x-ray die 0.76 w wide, aspect 1.5
const DIE_PX = 1160, DIE_H = DIE_PX / 1.5;                   // level 1 size
const D1 = Math.log10(DIE_PX / (DIE_MM * U0));               // depth at which the die reaches its level-1 size
const Package: React.FC<NanoLevelProps> = ({t, scale}) => {
  const xray = smooth((scale - 1.04) / 0.7);
  return (
    <SiScene id="n0" width={1} height={1} u={U0} tilt={0} origin={[-(SOC.x + SOC.w / 2) * U0, -(SOC.y + SOC.d / 2) * U0]}
             sweep={sweepAcross(smooth((t + 6) / 70), 20, 0, 46, 26)}>
      <LogicBoard layout={LAYOUT} parts={{soc: {xray, glow: 0.3 * xray}}} />
    </SiScene>
  );
};

// ---- level 1: the die ----
const K1 = DIE_PX / (DIE_MM * U0);                            // px per level-0 px
const PKG_W = SOC.w * U0 * K1, PKG_D = SOC.d * U0 * K1, PAD = 0.65 * U0 * K1;
const P_CORE: [number, number] = [-DIE_PX / 2 + (717 / 1600) * DIE_PX, -DIE_H / 2 + (235 / 1000) * DIE_H];
const FAB_F = 20;
const D2 = D1 + Math.log10(FAB_F);
const Die: React.FC<NanoLevelProps> = ({t, beats, active}) => {
  const cores = onWord(t, beats, 'cores', 'settle'), cache = onWord(t, beats, 'cache', 'settle'), down = onWord(t, beats, 'down', 'settle');
  const lab = active ? smooth((t - wordAt(beats, 'die', 90) + 4) / 14) * (1 - down) : 0;
  const act = {pcore1: Math.max(cores * (1 - cache), down), pcore2: cores * (1 - cache) * (1 - down), ecores: cores * (1 - cache) * (1 - down),
               l2p: cache * (1 - down), slc: cache * (1 - down), l2e: cache * (1 - down)};
  return svg(
    <g>
      <defs>
        <pattern id="n1-pads" patternUnits="userSpaceOnUse" width={PAD} height={PAD}>
          <circle cx={PAD / 2} cy={PAD / 2} r={PAD * 0.2} fill="#D6AE52" opacity={0.24} />
        </pattern>
        <linearGradient id="n1-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9CC8FF" stopOpacity={0.07} /><stop offset="0.5" stopColor="#9CC8FF" stopOpacity={0.02} /><stop offset="1" stopColor="#000" stopOpacity={0.25} /></linearGradient>
      </defs>
      {/* what is around the die: the package substrate with its pad field, seen through the glass lid */}
      <rect x={-1500} y={-1000} width={3000} height={2000} fill="#07090C" />
      <rect x={-PKG_W / 2} y={-PKG_D / 2} width={PKG_W} height={PKG_D} rx={26} fill="#0B1513" stroke="#CFE4FF" strokeOpacity={0.5} strokeWidth={4} />
      <rect x={-PKG_W / 2 + PAD * 0.4} y={-PKG_D / 2 + PAD * 0.4} width={PKG_W - PAD * 0.8} height={PKG_D - PAD * 0.8} fill="url(#n1-pads)" />
      <rect x={-DIE_PX / 2 - 14} y={-DIE_H / 2 - 14} width={DIE_PX + 28} height={DIE_H + 28} fill="#000" opacity={0.6} />
      <DieFloorplan id="n1" x={-DIE_PX / 2} y={-DIE_H / 2} w={DIE_PX} h={DIE_H} detail={2} labels={['gpu', 'pcore1', 'pcore2', 'ecores', 'l2p', 'slc', 'npu', 'isp', 'media']} labelScale={1.15} labelOpacity={lab} active={act} dim={Math.max(cores, cache) * 0.8}
                    shift={0.15 + 0.5 * smooth(t / 300)} />
      <rect x={-PKG_W / 2} y={-PKG_D / 2} width={PKG_W} height={PKG_D} rx={26} fill="url(#n1-glass)" />
    </g>,
  );
};

// ---- level 2: standard cells + SRAM inside the core ----
const D3 = D2 + 1;
const Fabric: React.FC<NanoLevelProps> = ({t}) => svg(<CellFabric id="n2" w={3000} h={1700} rowH={66} t={t} pulse={0.9} />);

// ---- level 3: one nanosheet transistor ----
const Fet: React.FC<NanoLevelProps> = ({t, beats, active}) => {
  const at = wordAt(beats, 'switching', 367);
  // gate voltage: off, then a clean on / off / on rhythm
  const ph = (t - at) / 36;
  const gate = t < at ? 0 : smooth(Math.sin(ph * Math.PI * 2 - Math.PI / 2) * 1.6 + 0.9);
  const back = smooth((t - at - 44) / 70);        // pull back inside the last level: the neighbours appear
  const k = 1 - 0.42 * back;
  const lab = active ? smooth((t - at + 8) / 12) * (1 - back) : 0;
  return svg(
    <g transform={`translate(0 ${62 * k}) scale(${k})`}>
      <defs>
        <radialGradient id="n3-pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#2A4C8C" stopOpacity={0.5} /><stop offset="1" stopColor="#2A4C8C" stopOpacity={0} /></radialGradient>
      </defs>
      <rect x={-4000} y={-3000} width={8000} height={6000} fill="#04070E" />
      <ellipse cx={0} cy={60} rx={1100} ry={520} fill="url(#n3-pool)" />
      <NanosheetField cols={5} rows={5} scale={2.1} t={t} activity={active ? 0.4 : 0} seed={4} dim={0.6 * back} floor={back}>
        <NanosheetFET id="n3" scale={2.1} gate={gate} t={t} cut={1} floor={1 - back} labels={lab} />
      </NanosheetField>
    </g>,
  );
};

const LEVELS: NanoLevel[] = [
  {id: 'package', depth: 0, portal: [0, 0], bg: '#05070C', Draw: Package},
  {id: 'die', depth: D1, portal: P_CORE, bg: '#05070C', Draw: Die},
  {id: 'fabric', depth: D2, portal: [0, 0], bg: '#060B14', Draw: Fabric},
  {id: 'fet', depth: D3, bg: '#04070E', Draw: Fet},
];
const KEYS: NanoKey[] = [{t: 8, depth: 0}, {t: 96, depth: D1}, {t: 258, depth: D1 + 0.06}, {t: 322, depth: D2 + 0.02}, {t: 374, depth: D3}];
// the dive is centred on 41 % of the height, so the whole die + its labels stay above the lower-third captions
const SAFE = {focusY: 0.41, zoom: 1, fadeTo: 0, landscape: true};

export const NanoS03: React.FC<SceneProps> = ({t, W, H, spec}) => (
  <AbsoluteFill>
    <SafeFrame.Provider value={SAFE}>
      <NanoZoom levels={LEVELS} keys={KEYS} t={t} beats={spec.beats ?? []} W={W} H={H} top="#03060C" />
    </SafeFrame.Provider>
    <SiLens W={W} H={H} t={t} focus={[0.08, 0.9]} blur={2.5} vignette={0.6} dust={10} tint="#6FA8FF" seed={5} />
  </AbsoluteFill>
);
