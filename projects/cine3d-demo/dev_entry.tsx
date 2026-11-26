// Sandbox entry for cine3d-demo stills (node projects/cine3d-demo/stills.mjs): only this project is bundled, so
// work in progress here can never break another project's render. The real entry stays src/index.ts.
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Remake} from '../../src/kit/Remake';
import type {Project} from '../../src/kit/types';
import pj from './project.json';
import {SCENES} from './scenes';

const project = pj as unknown as Project;
const C: React.FC = () => <Remake project={project} scenes={SCENES} />;
registerRoot(() => (
  <Composition id={project.id} component={C} width={project.canvas.width} height={project.canvas.height} fps={project.canvas.fps} durationInFrames={project.durationInFrames} />
));
