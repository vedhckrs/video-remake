// S07 OpenClaw "Lobster lab" + S08 Hermes "Hermes atelier" (world artist D). The worlds live in claw_world.tsx and
// hermes_world.tsx; shared parts (GitHub proof panel, drum counter, logo chips) in claw_kit.tsx.
import {clawWorld} from './claw_world';
import {hermesWorld} from './hermes_world';

export const clawHermesWorlds = {
  S07: clawWorld,
  S08: hermesWorld,
};
