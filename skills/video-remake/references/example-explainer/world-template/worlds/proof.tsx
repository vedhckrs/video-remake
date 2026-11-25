// STUB - replace with the real world (see D:\VideoBlueprint\jobs\worlds\WORLD_BRIEF.md)
import React from 'react';
import type {WorldDef} from '../../../src/kit/explainer/world';

const stub = (id: string): WorldDef => ({
  id, home: 'home', anchors: {home: {x: 600, y: 600, zoom: 1}},
  Draw: () => <svg width={1200} height={1200}><rect x={300} y={300} width={600} height={600} rx={40} fill="#1B2333" /><text x={600} y={620} fill="#5A6478" fontSize={60} textAnchor="middle">{id}</text></svg>,
});
export const proofWorld: WorldDef = stub('proof');
