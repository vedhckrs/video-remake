// six-agents / agent A: the four "frame" scenes. Each world lives in its own frame_*.tsx; frame_kit.tsx holds the shared bits.
import {s01World} from './frame_wall';    // S01 hook: agent wall over the bedroom (day -> night -> price tags)
import {s02World} from './frame_cloud';   // S02 cloud (four) vs your own computer (two)
import {s09World} from './frame_board';   // S09 pick board
import {s10World} from './frame_cta';     // S10 CTA, loops back to the wall

export const frameWorlds = {
  S01: s01World,
  S02: s02World,
  S09: s09World,
  S10: s10World,
};
