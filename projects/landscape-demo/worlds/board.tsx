// landscape-demo S01 (26 Nov 2026: the old flat kit-hardware board was replaced by the silicon kit). Full-bleed macro of the logic board in the phone chassis; a specular sweep crosses
// it, the camera eases to the SoC on "chip", the package turns to glass on "thinking" and shows the die.
import React from 'react';
import {Callout} from '../../../src/kit/explainer/stage';
import {SiLens} from '../../../src/kit/explainer/silicon';
import {onWord, pulseOn, wordAt, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {BoardShot, originFor, partPx, smooth, type Shot} from './silicon_common';

const U = 30, TILT = 0.58;
const SHOT: Shot = {u: U, tilt: TILT, origin: originFor(U, TILT, 34, 13, 0.8, 960, 520)};
const SOC = partPx(SHOT, 'soc');

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const chip = onWord(t, beats, 'chip', 'settle');
  const think = onWord(t, beats, 'thinking', 'settle');
  const pulse = pulseOn(t, beats);
  const at = wordAt(beats, 'chip', 138);
  // two passes of the light: one as the shot opens, one that lands on the chip
  const sweep = t < at - 20 ? smooth((t + 12) / 105) : smooth((t - at + 26) / 80);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <BoardShot shot={SHOT} id="ld1" sweep={sweep}
                 parts={{soc: {kind: 'lid', glow: 0.5 * chip + 0.25 * pulse * chip, highlight: chip * (1 - think), xray: think * 0.92, dieActive: think > 0.3 ? {pcore1: think, pcore2: think, npu: think * 0.6} : undefined}}} />
    </div>
  );
};

const Overlay: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}> = ({t, beats, W, H, toScreen}) => (
  <>
    <SiLens W={W} H={H} t={t} focus={[0.3, 0.72]} blur={7} dust={16} tint="#6FA8FF" />
    <Callout t={t} at={wordAt(beats, 'chip', 138) + 16} from={toScreen(SOC[0], SOC[1])} to={[W * 0.76, H * 0.19]}
             text="System on a chip" gloss="CPU, graphics, neural engine" W={W} color="#3B8CFF" />
  </>
);

export const boardWorld: WorldDef = {
  id: 'board',
  home: 'home',
  anchors: {home: {x: 960, y: 540, zoom: 1}, chip: {x: SOC[0], y: SOC[1] + 26, zoom: 1.75}},
  aliases: {thinking: 'chip'},
  palette: {bg0: '#030509', bg1: '#0B111C', glow: '#3B8CFF', particles: '#9CC3FF'},
  Draw, Overlay,
};
