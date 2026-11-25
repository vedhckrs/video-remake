# Task: draw the presenter "Juno" as code (React + SVG), reference-quality

You are drawing the on-screen presenter for a series of 9:16 tech explainer videos rendered with Remotion
(React -> headless Chrome, 1080x1920 @ 60 fps). The character is a waist-up bust in the bottom quarter of the
frame. It is animated by an existing rig (2-bone IK arms, springs between poses, blinks, lip motion).
Your job is ONLY the artwork: a TypeScript/React module `juno_art.tsx` whose components the rig places.

## Quality bar
Image 1 shows the presenter of the reference channel. MATCH ITS LEVEL OF FINISH - semi-realistic cartoon
proportions, soft gradient shading on skin and cloth, hair drawn as many layered locks with highlights,
fully formed hands (five fingers, knuckle creases, nails, thumb with a proper base), cloth folds and seams,
clean thin outlines tinted per material (never pure black). Do NOT copy its design: no goggles or glasses,
no red t-shirt, no brown quiff, different face, hair, clothes and colours. Image 2 is our current version
(flat, chibi, sausage arms, mitten hands) - this is what must be replaced. Image 3 shows it in context.

## Juno (original design)
- Young adult, friendly, curious. Warm medium-brown skin (base #C98B62 family), dark brown-black curly hair
  in a voluminous short cut with defined curls (not a quiff), a few freckles across nose and cheeks,
  expressive dark-brown eyes with two catch-lights, natural brows.
- Clothes: a pink hoodie (base #FF4F9A family - this pink is the presenter's colour and must stay pink)
  with a lined hood lying around the neck (darker lining), white drawstrings with metal aglets, a front
  kangaroo-pocket seam, ribbed cuffs and hem, believable folds at shoulders and elbows.
- Accessory: over-ear headphones resting around the neck (graphite #2F3338 band, darker cushions, small
  metallic highlights).
- Style: clean vector illustration, cel shading with one shadow shape and one highlight shape per material
  plus a subtle gradient; outlines 1.5-2.5 px in a darker tint of each material; no textures, no photo.

## Geometry contract (bust coordinates: viewBox 0 0 400 440; y = 440 is the bottom edge of the video frame)
Proportions are semi-realistic (head about 0.36 of shoulder width), NOT chibi.
- Head: skull centre (200,150); face spans about x 145-255; hair top about y 55; chin about y 222.
  Eye centres (178,152) and (222,152); brows about y 130; nose tip about (200,180); mouth centre (200,201).
- Neck x 182-218 from y 205 to 262. The rig tilts the head by rotating the Head group around (200,238).
- Torso/hoodie outline from the bottom corners (52,440) and (348,440) up to the shoulder tops (about y 268 at
  x 95 and 305). Arm pivots (shoulder joints) at (110,292) and (290,292).
- Upper arm length L1 = 118, forearm length L2 = 108. The hand's wrist is at the end of the forearm.

## Module API (exact names and props - the rig imports these)
```ts
export type Hand = 'open' | 'palm' | 'fist' | 'point' | 'thumb' | 'peace' | 'three' | 'four' | 'five' | 'pinch' | 'hold';
export type Brows = 'neutral' | 'up' | 'worried' | 'angry' | 'skeptic' | 'happy';
export type Mouth = 'smile' | 'grin' | 'o' | 'flat' | 'frown' | 'open' | 'smirk';
export const ART: {shoulderL: [number, number]; shoulderR: [number, number]; L1: number; L2: number; neckPivot: [number, number]};
export const Defs: React.FC;        // all <defs> (gradients etc.), rendered once; ids prefixed "juno-"
export const Torso: React.FC;       // hoodie body, hood + lining, drawstrings, pocket seam, neck, headphones (behind arms)
export const Head: React.FC<{look: [number, number]; lidL: number; lidR: number; wide: boolean; brows: Brows; mouth: Mouth; talk: number}>;
   // drawn in bust coordinates around the contract positions. look x,y in -1..1 moves irises (max ~5 px).
   // lidL/lidR 1 = open, 0.08 = closed (blink/wink): eyelids close over the eye, lashes stay.
   // wide = surprised (bigger whites, smaller irises). talk 0..1: when > 0.08 draw an open talking mouth
   // whose opening scales with talk (teeth + tongue), otherwise the `mouth` expression.
export const UpperArm: React.FC<{side: 'L' | 'R'}>; // LOCAL frame: shoulder at (0,0), elbow at (L1,0), sleeve along +x
export const Forearm: React.FC<{side: 'L' | 'R'}>;  // LOCAL frame: elbow at (0,0), wrist at (L2,0), ribbed cuff ending at the wrist
export const HandArt: React.FC<{shape: Hand; prop?: React.ReactNode}>;
   // LOCAL frame: wrist at (0,0), fingers point toward +x, palm faces the viewer, thumb on the -y side.
   // The rig mirrors it with scale(1,-1) for the left arm. Size: wrist to fingertip ~64, palm width ~40.
   // Shapes: open (relaxed spread), palm (flat, fingers together, facing viewer), fist, point (index out),
   // thumb (thumbs-up: thumb along -y, fingers curled), peace (index+middle), three, four, five (all spread),
   // pinch (thumb and index almost touching), hold (cupped, the `prop` node is drawn above the palm at (30,-46)).
```
The sleeves must join smoothly at the elbow (overlapping rounded ends) and at the shoulder (the upper arm's
top end tucks under/over the torso shoulder without a visible seam gap). Arms are drawn ABOVE the torso.

## Hard rules
- Pure function of props: no hooks with side effects, no Math.random, no CSS animation, no external images
  or fonts, no <filter> heavier than one small blur. Only `import React from 'react'`.
- Valid TSX for TypeScript 5 strict mode. All gradient ids static and prefixed `juno-`.
- Every shape you draw for the face must stay inside the head when it tilts +/-10 degrees.

## Output
Reply with exactly one fenced code block: ```tsx ... ``` containing the complete `juno_art.tsx`.
No other text.
