// road group: S06 the turn (road_s06), S07 the chip road (road_s07), S08 the chips around it (road_s08); helpers in road_kit
import {scene} from './_scene';
import {s06World} from './road_s06';
import {s07World} from './road_s07';
import {s08World} from './road_s08';

export const S06 = scene(s06World);
export const S07 = scene(s07World);
export const S08 = scene(s08World);
