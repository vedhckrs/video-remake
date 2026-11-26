// helper: turn a WorldDef into a scene component
import React from 'react';
import type {SceneProps} from '../../../src/kit/types';
import {World, type WorldDef} from '../../../src/kit/explainer/world';

export const scene = (def: WorldDef): React.FC<SceneProps> => {
  const C: React.FC<SceneProps> = ({t, dur, W, H, spec}) => <World def={def} t={t} dur={dur} beats={spec.beats ?? []} W={W} H={H} />;
  return C;
};
