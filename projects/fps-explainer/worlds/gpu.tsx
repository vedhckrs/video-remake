// S08 "Tear" + S09 "Sync" (one world, one continuous timeline: gpu_tear.tsx, art in gpu_card.tsx / gpu_game.tsx)
// and S10 "Diminishing stairs" (light act: gpu_stairs.tsx).
import {S08, S09} from './gpu_tear';
import {stairsWorld} from './gpu_stairs';

export const gpuWorlds = {S08, S09, S10: stairsWorld};
