// Silicon kit (26 Nov 2026) - high-detail hardware for macro product shots, drawn in code (SVG, no 3D engine).
// One import for everything:  import {SiScene, LogicBoard, SiChip, DieFloorplan, NanosheetFET, SiLens} from '.../silicon';
//   silicon_core.tsx   SiScene (projection + light), SI materials, SiPrism / SiExtrude / SiTop / SiText / SiGlow,
//                      SiStack + stackZ (exploded stacks), SiLens (depth of field, vignette, grain, dust), sweepAcross
//   silicon_chips.tsx  SiChip (+ SI_ROLES markings), PackageStack, SiPassives, SiConnector, SiWall, SiStandoff, SiClip, SiPatch
//   silicon_board.tsx  LogicBoard (+ iphoneBoard layout, boardPartPoint anchors), SiChassis
//   silicon_die.tsx    DieFloorplan (+ SOC_FLOORPLAN), CellFabric, NanosheetFET (+ fetPoint), NanosheetField
// API reference: video-remake skill, references/kit.md "Silicon kit".
export * from './silicon_core';
export * from './silicon_chips';
export * from './silicon_board';
export * from './silicon_die';
