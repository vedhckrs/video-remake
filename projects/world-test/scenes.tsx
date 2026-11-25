import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {NanoZoom, type NanoLevel} from '../../src/kit/explainer/nano';

const mk = (id: string, color: string, label: string, portal: [number, number]): NanoLevel => ({
  id, depth: 0, portal, bg: '#05070B',
  Draw: () => (
    <svg width={1} height={1} style={{overflow: 'visible'}}>
      {Array.from({length: 11}).map((_, r) => Array.from({length: 7}).map((__, k) => (
        <rect key={`${r}-${k}`} x={-490 + k * 140} y={-860 + r * 160} width={120} height={140} rx={10} fill={color} opacity={0.35} />
      )))}
      <circle cx={portal[0]} cy={portal[1]} r={54} fill="none" stroke="#fff" strokeWidth={4} />
      <text x={0} y={-700} fill="#fff" fontSize={90} textAnchor="middle" fontFamily="Poppins">{label}</text>
    </svg>
  ),
});
const levels: NanoLevel[] = [
  {...mk('a', '#3B8CFF', 'PACKAGE', [140, 120]), depth: 0},
  {...mk('b', '#A14ED6', 'DIE', [-200, 260]), depth: 1},
  {...mk('c', '#3FB950', 'ARRAY', [60, -40]), depth: 2},
  {...mk('d', '#F5A623', 'CELL', [0, 0]), depth: 3},
];
const S03: React.FC<SceneProps> = ({t, W, H, spec}) => (
  <NanoZoom levels={levels} keys={[{t: 0, depth: 0}, {t: 20, depth: 0.05}, {t: 160, depth: 3}]} t={t} beats={spec.beats ?? []} W={W} H={H} />
);
export const SCENES = {S03};
