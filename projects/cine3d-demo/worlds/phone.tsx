// cine3d-demo S01-S05: the real iPhone 18 Pro (cine3d PhoneShot) inside the 2D explainer world.
import React from 'react';
import type {SceneProps} from '../../../src/kit/types';
import {Callout} from '../../../src/kit/explainer/stage';
import {PHONE_POINTS, PhoneInnards, PhoneShot, add3, phoneView, xrayShell, type CamKey, type OrbitKey, type PoseKey} from '../../../src/kit/cine3d';
import {Feed, Lens, StudioWorld, ease, smooth} from './common';

const FLOOR = -5.02;

// ---- S01: 3/4 front, live feed --------------------------------------------------------------------------------
const C1: OrbitKey[] = [
  {t: -10, yaw: 144, pitch: 5, dist: 39, fov: 22, tgt: [0, -1.6, 0]},
  {t: 200, yaw: 161, pitch: 7, dist: 36, fov: 22, tgt: [0, -1.6, 0]},
];
export const S01: React.FC<SceneProps> = ({t, W, H}) => {
  const v = phoneView({t, cam: C1, W, H});
  const foot = v.point([0, FLOOR, 0]);
  return (
    <StudioWorld W={W} H={H} pool={foot} glow={[0.5, 0.4]}>
      <PhoneShot t={t} W={W} H={H} cam={C1} screen={<Feed t={t} />} floor={{y: FLOOR, shadow: 0.7, reflect: 0.3}} fx={{dof: {range: 7, blur: 9}}} light={{main: 1.3, fill: 1.6}} />
      <Lens W={W} H={H} t={t} />
    </StudioWorld>
  );
};

// ---- S02: the phone turns from its edge to a 3/4 back ----------------------------------------------------------
const C2: OrbitKey[] = [
  {t: -10, yaw: 0, pitch: 6, dist: 40, fov: 22, tgt: [0, -1.6, 0]},
  {t: 200, yaw: 0, pitch: 9, dist: 36, fov: 22, tgt: [0, -1.6, 0]},
];
const P2: PoseKey[] = [{t: -10, yaw: 118}, {t: 110, yaw: 30}, {t: 200, yaw: 22}];
export const S02: React.FC<SceneProps> = ({t, W, H}) => {
  const v = phoneView({t, cam: C2, pose: P2, W, H});
  const foot = v.point([0, FLOOR, 0]);
  return (
    <StudioWorld W={W} H={H} pool={{x: W / 2, y: foot.y}} glow={[0.5, 0.4]}>
      <PhoneShot t={t} W={W} H={H} cam={C2} pose={P2} screen={<Feed t={t + 190} />} floor={{y: FLOOR, shadow: 0.7, reflect: 0.3}} fx={{dof: {range: 7, blur: 9}, exposure: 1.12}} light={{main: 1.2, rim: 1.7, fill: 2.4}} />
      <Lens W={W} H={H} t={t} seed={7} />
    </StudioWorld>
  );
};

// ---- S03: macro on the plateau ---------------------------------------------------------------------------------
const L = PHONE_POINTS.lensMain;
const C3: CamKey[] = [
  {t: -10, pos: add3(L, [3.6, -2.6, 4.6]), tgt: add3(L, [0.75, -0.75, 0]), fov: 24, focus: PHONE_POINTS.lens3},
  {t: 180, pos: add3(L, [1.5, -1.9, 3.3]), tgt: add3(L, [0.35, -0.55, 0]), fov: 24, focus: L},
];
export const S03: React.FC<SceneProps> = ({t, W, H}) => (
  <StudioWorld W={W} H={H} glow={[0.42, 0.45]}>
    <PhoneShot t={t} W={W} H={H} cam={C3} fx={{dof: {range: 0.55, blur: 20, taps: 220}, bloom: {intensity: 0.5}}} light={{main: 0.5, fill: 0.6, rim: 1.4}} />
    <Lens W={W} H={H} t={t} seed={9} vignette={0.75} />
  </StudioWorld>
);

// ---- S04: x-ray, the board inside, callout on the chip ---------------------------------------------------------
const C4: OrbitKey[] = [
  {t: -10, yaw: 24, pitch: 10, dist: 40, fov: 22, tgt: [0.6, -1.4, 0]},
  {t: 80, yaw: 14, pitch: 8, dist: 33, fov: 22, tgt: [0.9, -1.2, 0]},
  {t: 200, yaw: 9, pitch: 7, dist: 31, fov: 22, tgt: [1.0, -1.1, 0]},
];
export const S04: React.FC<SceneProps> = ({t, W, H}) => {
  const v = phoneView({t, cam: C4, W, H});
  const x = smooth((t - 22) / 46);
  const chip = v.point('chip');
  const soc = smooth((t - 84) / 20);
  return (
    <StudioWorld W={W} H={H} glow={[0.5, 0.45]}>
      <PhoneShot t={t} W={W} H={H} cam={C4} shell={xrayShell(x)} fx={{dof: {range: 8, blur: 8}}}
        interior={<PhoneInnards light={x} sweep={smooth((t - 40) / 90)} parts={{soc: {glow: 0.55 * soc, highlight: soc}}} />} />
      <Lens W={W} H={H} t={t} seed={11} />
      <Callout t={t} at={96} from={[chip.x, chip.y]} to={[W * 0.68, H * 0.3]} text="A20 Pro sits here" gloss="under the back glass" W={W} color="#3B8CFF" />
    </StudioWorld>
  );
};

// ---- S05: the back glass lifts away, the camera moves in on the board -----------------------------------------
const CH = PHONE_POINTS.chip;
const C5: CamKey[] = [
  {t: -10, pos: [5.5, 3.2, 25], tgt: [0, 0, 0], fov: 22},
  {t: 90, pos: [6.8, 3.4, 17], tgt: [0, 0.6, 0], fov: 22, focus: CH},
  {t: 200, pos: [3.4, 0.2, 9.5], tgt: [CH[0] + 0.2, CH[1] + 0.1, 0], fov: 22, focus: CH},
];
export const S05: React.FC<SceneProps> = ({t, W, H}) => {
  const open = ease((t - 8) / 80);
  return (
    <StudioWorld W={W} H={H} glow={[0.5, 0.45]}>
      <PhoneShot t={t} W={W} H={H} cam={C5} shell={xrayShell(1, open, 3.4)} fx={{dof: {range: 2.2, blur: 16}}}
        interior={<PhoneInnards sweep={smooth((t - 60) / 120)} parts={{soc: {glow: 0.5, highlight: 1}}} />} />
      <Lens W={W} H={H} t={t} seed={13} />
    </StudioWorld>
  );
};
