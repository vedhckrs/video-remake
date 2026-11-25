// v2 wiring: every scene is a World (no presenter). Worlds live in ./worlds/*.tsx.
import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {World, type WorldDef} from '../../src/kit/explainer/world';
import {ssdWorlds} from './worlds/ssd';
import {cellsWorld} from './worlds/cells';
import {levelsWorld} from './worlds/levels';
import {towersWorld} from './worlds/towers';
import {controllerWorld} from './worlds/controller';
import {wearWorlds} from './worlds/wear';
import {proofWorld} from './worlds/proof';
import {ctaWorld} from './worlds/cta';

const scene = (def: WorldDef): React.FC<SceneProps> => {
  const C: React.FC<SceneProps> = ({t, dur, W, H, spec}) => <World def={def} t={t} dur={dur} beats={spec.beats ?? []} W={W} H={H} />;
  return C;
};

export const SCENES = {
  S01: scene(ssdWorlds.S01), S02: scene(ssdWorlds.S02), S03: scene(cellsWorld), S04: scene(levelsWorld), S05: scene(towersWorld),
  S06: scene(controllerWorld), S07: scene(wearWorlds.S07), S08: scene(wearWorlds.S08), S09: scene(proofWorld), S10: scene(ssdWorlds.S10),
  S11: scene(ctaWorld),
};
