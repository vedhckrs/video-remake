// "Why iOS feels so smooth" - Act 1 "The feeling" (1920x1080 @ 60). Each world file exports one scene component per id.
// phone: S01 hook, S02 promise, S09 handoff · loop: S03 deadline, S04 race, S05 clever part · road: S06 turn, S07 chip
// road, S08 chips around it. v2 (26 Nov 2026): real iPhone 18 Pro model + 3D transistor (kit/cine3d), project gl = angle.
import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {SourceCredit} from '../../src/kit/explainer/media';
import {S01, S02, S09} from './worlds/phone';
import {S03, S04, S05} from './worlds/loop';
import {S06 as S06Road, S07 as S07Road, S08} from './worlds/road';

// Real photographs (PhotoStage) are credited for exactly the span they are on screen (design frames of the scene).
// S06 214-270: the first iPhone, file s6_iphone2007_b_commons.jpg.
const S06: React.FC<SceneProps> = (p) => (
  <>
    <S06Road {...p} />
    <SourceCredit text="Pavel Ševela / Wikimedia Commons, CC BY-SA 3.0" t={p.t} W={p.W} H={p.H} from={216} to={268} fade={6} />
  </>
);
// S07 230-306: the Apple A4 on an iPhone 4 logic board, file s5_a4_on-iphone4-board-closeup_commons.jpg.
const S07: React.FC<SceneProps> = (p) => (
  <>
    <S07Road {...p} />
    <SourceCredit text="Raimond Spekking / Wikimedia Commons, CC BY-SA 4.0" t={p.t} W={p.W} H={p.H} from={233} to={303} fade={6} />
  </>
);

export const SCENES = {S01, S02, S03, S04, S05, S06, S07, S08, S09};
