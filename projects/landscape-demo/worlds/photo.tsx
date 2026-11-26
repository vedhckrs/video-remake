// landscape-demo S03: PhotoStage - one real photograph as an editorial spread (lit glass print + typography).
// Photo: the Apple A4 on an iPhone 4 logic board, Raimond Spekking / Wikimedia Commons, CC BY-SA 4.0 (unaltered).
import React from 'react';
import type {SceneProps} from '../../../src/kit/types';
import {PhotoStage} from '../../../src/kit/explainer/photostage';

export const PhotoS03: React.FC<SceneProps> = ({t, dur, W, H}) => (
  <PhotoStage src="landscape-demo/img/a4.jpg" t={t} W={W} H={H} dur={dur} at={0}
              eyebrow={'Real photo \u00b7 2010'} title="Apple A4"
              lines={['The first chip Apple designed itself.', 'Seen here on the iPhone 4 logic board.']}
              from={{scale: 1.02, x: 0.5, y: 0.55}} to={{scale: 1.1, x: 0.5, y: 0.55}} />
);
