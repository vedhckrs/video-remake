// group "loop": S03 the deadline, S04 the race, S05 the clever part
import {scene} from './_scene';
import {deadlineWorld} from './loop_s03';

export const S03 = scene(deadlineWorld);
export {S04, S05} from './loop_machine';
