// macbook-demo scenes: the code-built MacBook Air M1 (cine3d MacShot) in the 2D studio world.
import React from 'react';
import {Callout} from '../../../src/kit/explainer/stage';
import {MacInnards, MacShot, macView, macXray, type CamKey, type OrbitKey} from '../../../src/kit/cine3d';
import {Lens, StudioWorld, ease, smooth} from '../../cine3d-demo/worlds/common';

type P = {t: number; W: number; H: number};

// ---- 11: 3/4 from above, open, screen lit (reference 04, gold) ---------------------------------------------------
const C11: OrbitKey[] = [{t: -10, yaw: -5, pitch: 47, dist: 78, fov: 22, tgt: [0, 4.1, -2.2]}, {t: 130, yaw: 5, pitch: 44, dist: 74, fov: 22, tgt: [0, 4.1, -2.2]}];
const S11: React.FC<P> = ({t, W, H}) => (
  <StudioWorld W={W} H={H} glow={[0.5, 0.42]}>
    <MacShot t={t} W={W} H={H} cam={C11} lid={108} finish="gold" fx={{dof: {range: 16, blur: 6}}} />
    <Lens W={W} H={H} t={t} seed={21} />
  </StudioWorld>
);

// ---- 12: front, open (reference 03, silver) --------------------------------------------------------------------------
const C12: OrbitKey[] = [{t: -10, yaw: -3, pitch: 1.6, dist: 60, fov: 22, tgt: [0, 6.6, -7]}, {t: 130, yaw: 3, pitch: 1.6, dist: 57, fov: 22, tgt: [0, 6.6, -7]}];
const S12: React.FC<P> = ({t, W, H}) => {
  const v = macView({t, cam: C12, lid: 97, W, H});
  return (
    <StudioWorld W={W} H={H} pool={{x: W / 2, y: v.point('front').y + 20}} glow={[0.5, 0.4]}>
      <MacShot t={t} W={W} H={H} cam={C12} lid={97} finish="silver" fx={{dof: {range: 14, blur: 7}}} />
      <Lens W={W} H={H} t={t} seed={22} />
    </StudioWorld>
  );
};

// ---- 13: top view (reference 01, space grey) ------------------------------------------------------------------------
const C13: OrbitKey[] = [{t: -10, yaw: 0, pitch: 86, dist: 64, fov: 22, tgt: [0, 0.6, -0.9]}, {t: 130, yaw: 0, pitch: 86, dist: 61, fov: 22, tgt: [0, 0.6, -0.9]}];
const S13: React.FC<P> = ({t, W, H}) => (
  <StudioWorld W={W} H={H} glow={[0.5, 0.5]}>
    <MacShot t={t} W={W} H={H} cam={C13} lid={96} fx={{dof: false}} />
    <Lens W={W} H={H} t={t} seed={23} />
  </StudioWorld>
);

// ---- 14: keyboard corner macro (reference 02): the detail test -----------------------------------------------------
const C14: CamKey[] = [
  {t: -10, pos: [6.2, 17.2, 0.4], tgt: [6.2, 0.7, -2.9], fov: 30},
  {t: 130, pos: [6.6, 16.2, 0.6], tgt: [6.6, 0.7, -2.8], fov: 30},
];
const S14: React.FC<P> = ({t, W, H}) => (
  <StudioWorld W={W} H={H} glow={[0.5, 0.5]}>
    <MacShot t={t} W={W} H={H} cam={C14} lid={96} fx={{dof: {range: 7, blur: 9, taps: 200}}} />
    <Lens W={W} H={H} t={t} seed={24} vignette={0.5} />
  </StudioWorld>
);

// ---- 15: lid closed, the mirror logo ----------------------------------------------------------------------------------
const C15: OrbitKey[] = [{t: -10, yaw: 152, pitch: 34, dist: 60, fov: 22, tgt: [0, 0.6, 0]}, {t: 130, yaw: 164, pitch: 31, dist: 56, fov: 22, tgt: [0, 0.6, 0]}];
const S15: React.FC<P> = ({t, W, H}) => (
  <StudioWorld W={W} H={H} glow={[0.5, 0.45]}>
    <MacShot t={t} W={W} H={H} cam={C15} lid={0} fx={{dof: {range: 12, blur: 8}}} light={{main: 0.7, fill: 0.8}} />
    <Lens W={W} H={H} t={t} seed={25} />
  </StudioWorld>
);

// ---- 16: x-ray, the board inside with the M1 glowing, callout from the chip anchor -----------------------------------
const C16: OrbitKey[] = [{t: -10, yaw: -14, pitch: 46, dist: 80, fov: 22, tgt: [1.5, 3.6, -2.6]}, {t: 130, yaw: -6, pitch: 43, dist: 74, fov: 22, tgt: [1.5, 3.6, -2.6]}];
const S16: React.FC<P> = ({t, W, H}) => {
  const v = macView({t, cam: C16, lid: 108, W, H});
  const x = smooth((t - 6) / 40), on = smooth((t - 40) / 24), chip = v.point('chip');
  return (
    <StudioWorld W={W} H={H} glow={[0.5, 0.45]}>
      <MacShot t={t} W={W} H={H} cam={C16} lid={108} shell={macXray(x)} fx={{dof: {range: 16, blur: 6}}}
        interior={<MacInnards t={t} light={x} lit={on} sweep={smooth((t - 20) / 80)} m1={{glow: 0.8 * on, highlight: on}} />} />
      <Lens W={W} H={H} t={t} seed={26} />
      <Callout t={t} at={56} from={[chip.x, chip.y]} to={[W * 0.74, H * 0.5]} text="Apple M1" gloss="under the keyboard, no fan" W={W} color="#62E0FF" />
    </StudioWorld>
  );
};

// ---- 17: the lid opens on its hinge while the camera orbits slowly ---------------------------------------------------
const C17: OrbitKey[] = [{t: -10, yaw: -42, pitch: 24, dist: 76, fov: 22, tgt: [0, 4.2, -2.5]}, {t: 130, yaw: -16, pitch: 20, dist: 72, fov: 22, tgt: [0, 4.6, -3]}];
const S17: React.FC<P> = ({t, W, H}) => {
  const lid = 112 * ease((t - 8) / 80), on = smooth((t - 52) / 26);
  const v = macView({t, cam: C17, lid, W, H});
  return (
    <StudioWorld W={W} H={H} pool={{x: W / 2, y: v.point('front').y + 30}} glow={[0.5, 0.42]}>
      <MacShot t={t} W={W} H={H} cam={C17} lid={lid} screenOn={on} shell={{backlight: on}} fx={{dof: {range: 16, blur: 7}}} />
      <Lens W={W} H={H} t={t} seed={27} />
    </StudioWorld>
  );
};

// ---- 18: closed, from the left side: the wedge and the two USB-C ports -----------------------------------------------
const C18: OrbitKey[] = [{t: -10, yaw: -78, pitch: 5, dist: 46, fov: 22, tgt: [0, 0.5, 0]}, {t: 130, yaw: -66, pitch: 7, dist: 44, fov: 22, tgt: [0, 0.5, 0]}];
const S18: React.FC<P> = ({t, W, H}) => (
  <StudioWorld W={W} H={H} pool={{x: W / 2, y: H * 0.56}} glow={[0.5, 0.42]}>
    <MacShot t={t} W={W} H={H} cam={C18} lid={0} fx={{dof: {range: 12, blur: 8}}} light={{fill: 1.6}} />
    <Lens W={W} H={H} t={t} seed={28} />
  </StudioWorld>
);

// ---- 19: from behind, open: hinge barrel, lid back, upright logo; the keys' backlight on ------------------------------
const C19: OrbitKey[] = [{t: -10, yaw: 150, pitch: 14, dist: 70, fov: 22, tgt: [0, 5.5, -5]}, {t: 130, yaw: 40, pitch: 30, dist: 66, fov: 22, tgt: [0, 4.6, -3]}];
const S19: React.FC<P> = ({t, W, H}) => (
  <StudioWorld W={W} H={H} glow={[0.5, 0.42]}>
    <MacShot t={t} W={W} H={H} cam={C19} lid={110} shell={{backlight: 1}} fx={{dof: {range: 16, blur: 7}}} light={{main: 0.5, fill: 0.5, top: 0.5}} />
    <Lens W={W} H={H} t={t} seed={29} />
  </StudioWorld>
);

export const SCENES = [S11, S12, S13, S14, S15, S16, S17, S18, S19];
