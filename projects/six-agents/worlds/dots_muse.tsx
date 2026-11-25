// S03 "Dots studio" (OpenAI) and S04 "Muse day" (Meta) - world agent B. Worlds live in dots_world.tsx / muse_world.tsx,
// shared SVG helpers in dots_kit.tsx.
import {dotsWorld} from './dots_world';
import {museWorld} from './muse_world';

export const dotsMuseWorlds = {
  S03: dotsWorld,
  S04: museWorld,
};
