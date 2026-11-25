// Juno presenter artwork, drawn as code by Claude Fable 5.2 (Ved's API) against the contract in
// D:\VideoBlueprint\jobs\juno\brief.md: juno_head.tsx (head + torso) and juno_arms.tsx (arms + hands).
// The rig (presenter.tsx) imports only from this file.
import React from 'react';
import {DefsHead, Head, Torso, type Brows, type Mouth} from './juno_head';
import {DefsArms, Forearm, HandArt, UpperArm, type Hand} from './juno_arms';

export const ART = {
  shoulderL: [115, 305] as [number, number],
  shoulderR: [285, 305] as [number, number],
  L1: 118,
  L2: 108,
  neckPivot: [200, 238] as [number, number],
};

export const Defs: React.FC = () => (
  <>
    <DefsHead />
    <DefsArms />
  </>
);

export {Head, Torso, UpperArm, Forearm, HandArt};
export type {Brows, Mouth, Hand};
