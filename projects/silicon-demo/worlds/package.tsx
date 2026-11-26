// silicon-demo S02: the SoC package. Macro on the etched marking; the package lifts off its pads on "package"
// (solder balls underneath); on "memory" it explodes - lid / memory / redistribution layer / die / substrate / balls -
// while the shot eases to a steeper, wider angle (one smooth ramp of u + tilt) so every layer shows its face.
import React from 'react';
import {Callout} from '../../../src/kit/explainer/stage';
import {SiLens, boardLevelZ, packageZ, siPoint} from '../../../src/kit/explainer/silicon';
import {onWord, wordAt, type Beat, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {BoardShot, LAYOUT, originFor, smooth, type Shot} from './common';

const SOCP = LAYOUT.parts.find((p) => p.id === 'soc')!;
const CX = SOCP.x + SOCP.w / 2, CY = SOCP.y + SOCP.d / 2;
const LIFT = 1.5, GAP = 2.7;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (q: number) => { const c = Math.max(0, Math.min(1, q)); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };

const state = (t: number, beats: Beat[]) => {
  const lift = LIFT * onWord(t, beats, 'package', 'settle');
  const ex = onWord(t, beats, 'memory', 'settle');
  // the camera change is ONE eased ramp (no spring): macro 3/4 view -> wide exploded view
  const cam = ease((t - wordAt(beats, 'memory', 90) + 4) / 34);
  const u = lerp(60, 27.5, cam), tilt = lerp(0.6, 0.96, cam);
  const shot: Shot = {u, tilt, origin: originFor(u, tilt, CX, CY, lerp(1.8, 11.6, cam), 960, lerp(500, 408, cam))};
  return {lift, ex, cam, shot};
};
/** world px of a point on a package layer (id from PACKAGE_LAYERS), dx / dy mm from the package centre */
const layerPx = (shot: Shot, id: string, lift: number, ex: number, dx = 0, dy = 0): [number, number] => {
  const z = packageZ(ex, boardLevelZ(0) + lift, SOCP.h, GAP);
  return siPoint(shot.u, shot.tilt, shot.origin, CX + dx, CY + dy, z[id] + 0.12);
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const {lift, ex, cam, shot} = state(t, beats);
  const si = onWord(t, beats, 'silicon', 'settle');
  const sweep = smooth((((t + 30) % 150) - 10) / 95);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <BoardShot shot={shot} id="s2" sweep={sweep} focus="soc" dim={0.28 + 0.4 * cam}
                 parts={{soc: {lift, explode: ex, explodeGap: GAP, glow: 0.35 * si, dieActive: si > 0.2 ? {pcore1: si, pcore2: si, gpu: si * 0.7, npu: si * 0.5} : undefined}}} />
    </div>
  );
};

const Overlay: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}> = ({t, beats, W, H, toScreen}) => {
  const {lift, ex, shot} = state(t, beats);
  const P = (id: string, dx = 0, dy = 0) => {
    const p = layerPx(shot, id, lift, ex, dx, dy);
    return toScreen(p[0], p[1]);
  };
  const w2 = SOCP.w / 2, d2 = SOCP.d / 2;
  return (
    <>
      <SiLens W={W} H={H} t={t} focus={[0.14, 0.82]} blur={6} dust={12} tint="#6FA8FF" seed={9} />
      <Callout t={t} at={wordAt(beats, 'memory', 90) + 26} from={P('memory', w2 - 1.4, d2 - 3.4)} to={[W * 0.76, H * 0.25]} text="Memory" gloss="two DRAM dies on top" W={W} color="#62E0FF" />
      <Callout t={t} at={wordAt(beats, 'silicon', 150) + 4} from={P('die', -w2 * 0.76 + 2.4, d2 * 0.62 - 1.0)} to={[W * 0.2, H * 0.44]} text="Silicon die" gloss="the processor itself" W={W} color="#FFB347" />
      <Callout t={t} at={wordAt(beats, 'balls', 242) - 8} from={P('balls', w2 - 1.0, d2 - 1.4)} to={[W * 0.78, H * 0.7]} text="Solder balls" gloss="hundreds, under the package" W={W} color="#C5CAD0" />
    </>
  );
};

export const packageWorld: WorldDef = {
  id: 'sipackage',
  home: 'home',
  anchors: {home: {x: 960, y: 530, zoom: 1.12}, package: {x: 960, y: 496, zoom: 1.0}},
  aliases: {memory: 'package'},
  palette: {bg0: '#030509', bg1: '#0B111C', glow: '#3B8CFF', particles: '#9CC3FF'},
  Draw, Overlay,
};
