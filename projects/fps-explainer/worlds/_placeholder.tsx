// placeholder world (replaced by the world agents)
import React from 'react';
import type {WorldDef} from '../../../src/kit/explainer/world';

export const placeholder = (id: string, label: string): WorldDef => ({
  id,
  home: 'home',
  anchors: {home: {x: 1300, y: 1600, zoom: 1}},
  palette: {bg0: '#05070D', bg1: '#101828'},
  Draw: () => (
    <svg width={2600} height={3200} viewBox="0 0 2600 3200" style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={0} y={0} width={2600} height={3200} fill="#0B1220" />
      <text x={1300} y={1600} fill="#FFFFFF" fontSize={90} textAnchor="middle" fontFamily="Inter, sans-serif">{label}</text>
    </svg>
  ),
});
