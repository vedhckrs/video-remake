// landscape-demo: shared board shot (silicon kit) + helpers. World px 1:1 on the 1920x1080 frame, centre (960, 540).
import React from 'react';
import {LogicBoard, SiChassis, SiScene, boardLayout, boardPartTop, siPoint, sweepAcross, type BoardPartState, type SiLight} from '../../../src/kit/explainer/silicon';

export const LAYOUT = boardLayout(7);
export type Shot = {u: number; tilt: number; origin: [number, number]};
/** origin that puts plan point (x, y, z) on world px (px, py) */
export const originFor = (u: number, tilt: number, x: number, y: number, z: number, px: number, py: number): [number, number] => {
  const p = siPoint(u, tilt, [0, 0], x, y, z);
  return [px - p[0], py - p[1]];
};
export const partPx = (shot: Shot, id: string, explode = 0, lift = 0): [number, number] => {
  const [x, y, z] = boardPartTop(id, LAYOUT, explode, lift);
  return siPoint(shot.u, shot.tilt, shot.origin, x, y, z);
};
export const smooth = (q: number) => { const c = Math.max(0, Math.min(1, q)); return c * c * (3 - 2 * c); };

export const BoardShot: React.FC<{
  shot: Shot; id: string; sweep?: number; light?: Partial<SiLight>; parts?: Record<string, BoardPartState>; explode?: number;
  focus?: string | string[]; dim?: number; chassis?: boolean; children?: React.ReactNode;
}> = ({shot, id, sweep, light, parts, explode, focus, dim, chassis = true, children}) => (
  <SiScene id={id} width={1920} height={1080} u={shot.u} tilt={shot.tilt} origin={shot.origin} light={light}
           sweep={sweep === undefined ? undefined : sweepAcross(sweep, 0, 0, 72, 40, light)}>
    {chassis ? <SiChassis layer="back" /> : null}
    <LogicBoard layout={LAYOUT} parts={parts} explode={explode} focus={focus} dim={dim}>{children}</LogicBoard>
    {chassis ? <SiChassis layer="front" /> : null}
  </SiScene>
);
