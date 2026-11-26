// landscape-demo wiring (1920x1080 @ 60, engine test for the landscape mode, 26 Nov 2026).
import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {World, type WorldDef} from '../../src/kit/explainer/world';
import {boardWorld} from './worlds/board';   // S01 World (kit hardware)
import {NanoS02} from './worlds/nano';       // S02 NanoZoom
import {PhotoS03} from './worlds/photo';     // S03 Photo + scene credit

const scene = (def: WorldDef): React.FC<SceneProps> => {
  const C: React.FC<SceneProps> = ({t, dur, W, H, spec}) => <World def={def} t={t} dur={dur} beats={spec.beats ?? []} W={W} H={H} />;
  return C;
};

export const SCENES = {S01: scene(boardWorld), S02: NanoS02, S03: PhotoS03};
