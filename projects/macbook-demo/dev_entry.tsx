// macbook-demo: proof scenes for cine3d MacShot (the code-built MacBook Air M1). Its own small bundle
// (node projects/macbook-demo/stills.mjs <frames> [scale] [prefix] [gl] [outDir]); every scene is 120 design frames
// = 240 output frames at 60 fps, so scene n starts at output frame n * 240.
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {setFrame} from '../../src/kit/explainer/tokens';
import {SCENES} from './worlds/mac';

const LEN = 240;
const C: React.FC = () => {
  setFrame(1920, 1080);
  const f = useCurrentFrame();
  const i = Math.min(SCENES.length - 1, Math.floor(f / LEN));
  const S = SCENES[i];
  return <AbsoluteFill style={{background: '#03050A'}}><S t={(f - i * LEN) / 2} W={1920} H={1080} /></AbsoluteFill>;
};
registerRoot(() => <Composition id="macbook-demo" component={C} width={1920} height={1080} fps={60} durationInFrames={SCENES.length * LEN} />);
