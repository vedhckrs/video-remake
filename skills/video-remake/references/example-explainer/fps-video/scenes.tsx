// fps-explainer wiring: every scene is a World (no presenter). Worlds live in ./worlds/*.tsx.
import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {World, type WorldDef} from '../../src/kit/explainer/world';
import {screenWorlds} from './worlds/screen';   // S01 S02 S11 S12 (agent A)
import {lanesWorld} from './worlds/lanes';      // S03 (agent B)
import {NanoS04} from './worlds/nano';          // S04 NanoZoom (agent B)
import {phoneWorlds} from './worlds/phones';    // S05 S06 S07 (agent C)
import {gpuWorlds} from './worlds/gpu';         // S08 S09 S10 (agent D)

const scene = (def: WorldDef): React.FC<SceneProps> => {
  const C: React.FC<SceneProps> = ({t, dur, W, H, spec}) => <World def={def} t={t} dur={dur} beats={spec.beats ?? []} W={W} H={H} />;
  return C;
};

export const SCENES = {
  S01: scene(screenWorlds.S01), S02: scene(screenWorlds.S02), S03: scene(lanesWorld), S04: NanoS04,
  S05: scene(phoneWorlds.S05), S06: scene(phoneWorlds.S06), S07: scene(phoneWorlds.S07),
  S08: scene(gpuWorlds.S08), S09: scene(gpuWorlds.S09), S10: scene(gpuWorlds.S10),
  S11: scene(screenWorlds.S11), S12: scene(screenWorlds.S12),
};
