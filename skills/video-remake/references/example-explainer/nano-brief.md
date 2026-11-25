# Nano brief - S03 "Every flash chip is a grid of cells..." as ONE continuous nanoscopic zoom

Read WORLD_BRIEF.md (same folder) for the general rules, quality bar and sandbox workflow. This brief replaces
its camera part, because the client reviewed v2 and said:
- "camera jump too much ... I don't want the camera to jump every frame, only where required ... camera smoothly,
  not frame jiggle and hand-like camera jump".
- "I want nanoscopic zoom continue inside the chip world and make visual more powerful".

## The engine: src/kit/explainer/nano.tsx (read it)
`<NanoZoom levels={[...]} keys={[{t, depth}, ...]} t beats W H />`
- Each level is drawn in CENTRED coordinates (0,0 = screen centre; native visible frame x -540..540, y -960..960).
- Level i+1 lives inside level i at `portal` and is 10x smaller there (one decade per level). A single depth value
  (log10) drives one continuous zoom; the camera glides to each portal while the next level fades in at exactly
  the matching scale - so DRAW each level so that its region around the portal looks like a blurred/low-detail
  version of the next level (continuity of colour, shape and position across the hand-off).
- `keys`: depth keyframes in design frames; ease only at the first and last key, so a multi-level dive runs at a
  constant, smooth speed. NO camera jumps, no shake: the zoom is the only camera move in this scene.
- Draw gets `{t, beats, W, H, u, scale, active, step}`: `scale` = how magnified the level currently is (use it for
  level-of-detail: add finer detail as scale grows), `active` = it is the main level now.

## The dive (scene S03, design frames from project.json; key words with their beat frames)
"Every(9.5) flash(18) chip(27.5) is a grid(39.5) of cells(52). Think(85) of each(94.5) cell(99.5) as a tiny(112.5)
bucket(121) with a gate(135). Push(171.5) electrons(178.5) in, and they stay(209) trapped(215.5), even with the
power(246) off(254.5). A full(294.5) bucket and an empty(317) bucket mean one(339) and zero(348.5)."

Levels (depth = log10 magnification):
0. NAND PACKAGE (depth 0): the glossy black epoxy package filling the frame, laser-etched "3D NAND / 512 Gb",
   gold BGA balls peeking at the edges, a soft studio light sweep. Portal near its centre.
1. SILICON DIE (depth 1): under the lid - an iridescent die (blue/violet/gold interference), memory planes, page
   buffers, bond pads, fine routing. Portal in one plane.
2. MEMORY ARRAY (depth 2): a vast grid of cells with word lines and bit lines - a glowing city grid with depth
   fog. Portal on one cell column.
3. 3D NAND STRING (depth 3): a cross-section - dozens of stacked word-line layers (alternating metal/oxide bands)
   pierced by a vertical channel hole; each layer around the hole is one cell (rings). Truly nanoscopic: scan-like
   detail, a "~20 nm" scale bar. Portal on one ring.
4. ONE CELL (depth 4): the cell as the glass bucket with the gold gate (reuse/upgrade the bucket art you made in
   worlds/cells.tsx) - the rest of the scene happens HERE with world animation, no camera moves:
   gate highlight on "gate"; "push electrons" electrons stream in; "trapped" gate slams shut (sparks, padlock);
   "power off" the power line cuts, the world dims, electrons keep glowing ("STILL STORED"); "full ... empty" a
   second empty bucket slides in beside it (draw both inside this level - the camera may slowly pull back by
   adding a final key with slightly LOWER depth, e.g. 4 -> 3.85, eased); "one / zero" big glowing 1 and 0.
Timing: start zooming on "flash" (18), reach the die around "chip" (~32), the array on "grid" (~44), the string
around "think/each" (~92), arrive at the cell on "bucket" (~121). Keep every level on screen long enough to read
(at least ~0.8 s each); the dive should feel like one smooth, accelerating-then-settling journey.

## Make it powerful
Each level is a full-bleed, richly lit world (no empty black): strong lighting, glow/bloom on emissive parts, god
rays or light shafts where it fits, depth fog, macro depth-of-field (blurred near/far bands), a coherent colour
progression (package: cool steel; die: iridescent; array: electric blue; string: deep violet with copper; cell:
blue glass + gold). Words should still visibly change something in the world (pulses, highlights, labels,
counters) - but the CAMERA only does the one continuous dive (and the gentle pull-back near the end).

## Deliverable
`projects/ssd-explainer/worlds/nano.tsx` exporting `export const NanoS03: React.FC<SceneProps>` (scenes.tsx
already wires S03 to it). You may import from `./cells` if you factor shared bucket art there. Type-check, render
stills across S03 (include frames during each hand-off), look, fix, at least two rounds; also render a short
motion check of the dive (e.g. `npx.cmd remotion render src/index.ts ssd-explainer out/nano_dive.mp4
--frames=<S03 from>-<S03 from + 260> --scale=0.4 --muted` and a 6 fps contact sheet of it) to confirm the
hand-offs are seamless and the zoom is smooth. Report as WORLD_BRIEF.md says.
