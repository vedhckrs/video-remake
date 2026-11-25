// six-agents wiring: every scene is a World (no presenter). Worlds live in ./worlds/*.tsx.
import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {World, type WorldDef} from '../../src/kit/explainer/world';
import {frameWorlds} from './worlds/frame';         // S01 S02 S09 S10 (agent A)
import {dotsMuseWorlds} from './worlds/dots_muse';   // S03 S04 (agent B)
import {grokDuetWorlds} from './worlds/grok_duet';   // S05 S06 (agent C)
import {clawHermesWorlds} from './worlds/claw_hermes'; // S07 S08 (agent D)

const scene = (def: WorldDef): React.FC<SceneProps> => {
  const C: React.FC<SceneProps> = ({t, dur, W, H, spec}) => <World def={def} t={t} dur={dur} beats={spec.beats ?? []} W={W} H={H} />;
  return C;
};

export const SCENES = {
  S01: scene(frameWorlds.S01), S02: scene(frameWorlds.S02),
  S03: scene(dotsMuseWorlds.S03), S04: scene(dotsMuseWorlds.S04),
  S05: scene(grokDuetWorlds.S05), S06: scene(grokDuetWorlds.S06),
  S07: scene(clawHermesWorlds.S07), S08: scene(clawHermesWorlds.S08),
  S09: scene(frameWorlds.S09), S10: scene(frameWorlds.S10),
};
