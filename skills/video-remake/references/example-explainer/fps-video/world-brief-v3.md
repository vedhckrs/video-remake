# World brief - "How 60, 120 & 144 fps actually work" (fps-explainer, 25 Nov 2026)

You design WORLDS for one 9:16 tech explainer rendered with Remotion (React + SVG in headless Chrome,
1080x1920 @ 60 fps; scene code works in DESIGN frames @30, fractional at 60). Everything is drawn in code:
SVG/CSS that reads as 3D (2.5D). No 3D engine, no three.js/WebGL, no bitmap images, no new fonts.

## The client and the quality bar
Ved is a senior graphic designer. His standing notes on this series:
- "remove presenter" - the world fills the whole frame; captions sit on top (y 15-25 %), never draw there.
- "each word spoken I want a visual change ... animation and new world design" - something in the world must
  visibly react to MOST spoken words (light up, build, count, move, transform).
- "camera jump too much ... only where required ... camera smoothly, not frame jiggle" - see Camera below.
- "make visual more powerful" - and an earlier demo "looks cheap" (small objects floating in black, flat colours).
  The bar: full-bleed, rich, premium hardware/UI illustration; real materials (glass, glossy black, brushed metal,
  gold, emissive OLED colour), dense micro-detail (pins, traces, bezels, labels, tick marks), real lighting
  (glows, light pools, beams, bloom, rim light), depth (foreground/background layers, depth of field), and
  NOTHING flat or empty. Look at the approved SSD v3 worlds for the level and the code patterns:
  `C:\Users\VED\.claude\skills\video-remake\references\example-explainer\ssd-video-v3\worlds\*.tsx`
  (and its `contact_sheet.jpg`). Read 2-3 of them before you start.

## How a world works (read `src/kit/explainer/world.tsx` in your sandbox)
- A scene renders `<World def={myWorld} t={t} dur={dur} beats={spec.beats} W={W} H={H} />`.
- `spec.beats`: one beat per spoken content word, from `projects/fps-explainer/project.json` (each scene's
  `beats`): `{t, w, word, kind: number|action|state|object|drift, s: 1..3}`, t in DESIGN frames from scene start.
- `WorldDef = {id, home, anchors: {name: {x, y, zoom}}, aliases?, palette?, Draw, Overlay?}` - Draw draws in
  WORLD px inside one big `<svg>` (e.g. 2600x3200, absolutely positioned at 0,0). Anchor zoom 1 = 1 world px per
  screen px; the anchor point lands at screen (540, 0.53*1920). `home` = the framing the scene starts on.
- **Camera (Ved's rules, the director already enforces them):** the camera moves ONLY when the voice names an
  anchor (a word equal to an anchor name, its plural, or an `aliases` entry), at most one move per phrase (anchor
  words < 1.2 s apart merge into one move to the last one), each move a 1-1.8 s ease-in-out, then a slow dolly.
  No shake, no jitter. So: give each scene 1-3 anchors named after the key nouns it should frame (e.g. `screen`,
  `pixel`, `monitor`), not one per word, and pick zooms that keep the subject big (fill 80-90 % of the width).
- **The per-word change comes from YOUR Draw**: `onWord(t, beats, 'word')` (0..1 spring), `wordAt(beats,'word')`
  (frame), `pulseOn`, `countOn`, `nthBeat`, `step` (index of the last fired word), `Burst`, `Ripple`. Never fake a
  camera with a word-triggered whole-world scale (that was the v2 jiggle); an inner zoom must be ONE smooth eased
  (log) ramp across a phrase.
- `Overlay` (optional) draws screen-locked labels/counters with `toScreen(x, y)`.
- The engine adds: palette gradient, parallax particles, foreground bokeh, a soft light pulse on beats, volumetric
  light shafts, contrast/saturation grade, caption gradient, vignette (soft on light palettes). Set `palette`
  (`bg0`, `bg1`, `particles`, `glow`) so each world has its own mood.
- Kit helpers (read, never edit anything under `src/kit`): `iso.tsx` (IsoScene, IsoBox lit/gloss/glass/emissive,
  IsoChip, IsoBoard, IsoLaptop, IsoPanel, ExplodedStack, IsoCylinder, project), `hardware.tsx` (MAT materials,
  EpoxyChip, SmdArray, GoldFingers, TracePattern, Silk, CellField, Beam, StageLight), `premium.tsx` (DrumCounter,
  HeroNumber, GlassCard, IsoTileField, IsoBarChart, MacroDie, Pedestal), `stage.tsx` (Callout, Stamp, Badge, Meter,
  FlowPath, Footnote, FONT, MONO), `tokens.ts` (C colours, springs, shade/tint/mix/alpha), `nano.tsx` (NanoZoom).
  Missing helper? Write it inside YOUR world file(s).

## Facts and labels (use exactly these numbers; nothing else numeric)
60 Hz = 16.7 ms per frame · 120 Hz = 8.3 ms · 144 Hz = 6.9 ms · 60->120 saves 8.3 ms · 120->144 saves 1.4 ms ·
phones: LTPO screens 120 Hz when scrolling, lower when reading, 1 Hz on the always-on lock screen · gaming phones
144 Hz and 165 Hz screens, touch sampled "thousands of times a second" (no exact touch number) · PC example: 90 fps
on a 144 Hz monitor -> tearing · fix: variable refresh "G-Sync" / "FreeSync" (text badges only - NO NVIDIA/AMD/
Apple/Samsung or any other brand logo or product name) · esports monitors up to 600 Hz · formula "frame time =
1000 / Hz". All phones/monitors/cards are generic and unbranded. No creator handle, channel name or follower counts.

## Rules
- Pure functions of `t`: no Math.random (sin-hash seeds), no hooks with side effects, no CSS animation, no timers.
- TypeScript strict must pass. Unique SVG ids (prefix with your scene id, e.g. `s05-glow`).
- Safe area (Ved, 25 Nov): the engine already lifts + zooms worlds out (focusY 0.50, zoom 0.82) - in YOUR stills keep text, numbers and hero objects between 26 % and 84 % of the frame (the bottom 15 % carries the app's username/description; captions own 15-24 %), and avoid key text in the right 14 % below the middle (like/comment/share buttons).
- Each world is a DIFFERENT PLACE (colour mood, environment, scale) in the same premium art direction.
- Performance: a frame must render well under a second - a few hundred SVG elements, at most one or two small
  blur filters; no blur on huge groups.
- Seams: transitions are listed per scene (`transitionIn` in project.json). A `portal` grows the new scene out of
  `origin` (screen fraction) - the OUTGOING scene should have its key element there at its end. A `dissolve`
  between two scenes of the same world must start on the previous scene's final framing.

## Your sandbox (only yours)
- `D:\VideoBlueprint\remakes\sbx-<x>\` - a full engine copy (node_modules/public are shared junctions); registry
  has only `fps-explainer`. Write ONLY your own world file(s) in `projects/fps-explainer/worlds/` (names below);
  keep the export names (scenes.tsx imports them). Other world files there are placeholders - leave them.
- Type-check: `npx.cmd tsc --noEmit -p .` in the sandbox folder.
- Still: `npx.cmd remotion still src/index.ts fps-explainer out/<name>.png --frame=<F> --scale=0.5` where
  F (OUTPUT frame @60) = scene `from` + 2 * design_frame. Render 8-12 stills across your scenes - including
  frames right after key words and during camera moves - LOOK at them (Read the png), fix what is weak, repeat at
  least twice. Contact sheet: `magick montage out/<prefix>*.png -tile 5x -geometry 270x480+4+4 out/<prefix>_sheet.jpg`.
- Motion check (short, low-res, muted - allowed): `npx.cmd remotion render src/index.ts fps-explainer
  out/<prefix>_motion.mp4 --frames=<from>-<to> --scale=0.4 --muted`, then a 6 fps strip:
  `ffmpeg -v error -y -i out/<prefix>_motion.mp4 -vf fps=6,scale=216:-1,tile=8x3 -frames:v 1 out/<prefix>_strip.jpg`.
  Check the motion is smooth (no jumps between consecutive tiles except at intended cuts).
- Do NOT run full video renders, do not touch other sandboxes or `D:\VideoBlueprint\remakes\engine`.

## Report back (short)
Files written, anchors/aliases per scene, what animates on which words, the final contact sheet + motion strip
paths, and anything you could not get right.
