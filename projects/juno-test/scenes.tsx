import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {Presenter, POSES} from '../../src/kit/explainer/presenter';

// every pose held 14 frames (sample the last frame of each hold); then 60 frames of talking
const Poses: React.FC<SceneProps> = ({t, W, H}) => {
  const names = Object.keys(POSES);
  const cues = names.map((p, i) => ({t: i * 14, pose: p}));
  cues.push({t: names.length * 14, pose: 'open_palm'});
  const talk: [number, number][] = [];
  for (let k = 0; k < 10; k++) talk.push([names.length * 14 + 4 + k * 6, names.length * 14 + 8 + k * 6]);
  const i = Math.min(names.length - 1, Math.floor(Math.max(0, t) / 14));
  return (
    <>
      <div style={{position: 'absolute', top: 120, width: '100%', textAlign: 'center', color: '#fff', fontSize: 56, fontFamily: 'Poppins'}}>
        {t < names.length * 14 ? names[i] : 'talking'}
      </div>
      <Presenter t={t} cues={cues} enter={-30} W={W} H={H} talk={talk} widthFrac={0.95} />
    </>
  );
};

export const SCENES = {poses: Poses};
