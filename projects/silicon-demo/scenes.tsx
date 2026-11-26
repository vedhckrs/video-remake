// silicon-demo wiring (1920x1080 @ 60): proof scenes for the silicon kit (src/kit/explainer/silicon.tsx).
import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {World, type WorldDef} from '../../src/kit/explainer/world';
import {boardWorld} from './worlds/board';       // S01 board hero
import {packageWorld} from './worlds/package';   // S02 SoC package macro -> exploded stack
import {NanoS03} from './worlds/nano';           // S03 NanoZoom package -> die -> cells -> transistor
import {rfWorld} from './worlds/rf';             // S04 modem + wireless

const scene = (def: WorldDef): React.FC<SceneProps> => {
  const C: React.FC<SceneProps> = ({t, dur, W, H, spec}) => <World def={def} t={t} dur={dur} beats={spec.beats ?? []} W={W} H={H} />;
  return C;
};

export const SCENES = {S01: scene(boardWorld), S02: scene(packageWorld), S03: NanoS03, S04: scene(rfWorld)};
