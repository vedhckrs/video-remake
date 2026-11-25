# Scene kit (engine/src/kit) - read before writing scenes.tsx

> Explainer-style projects (`"style": "explainer"`) use `src/kit/explainer/` instead - see
> `references/styles/keyframes-explainer.md` (kit table + recipes) and `references/example-explainer/`.

## A scene file

```tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../../src/kit/types';
import {Card, Counter, Glyph, LineChart, Pill, Tick, Window, TypeOn, Terminal, IconGrid, Stepper,
        Notification, Cursor, Strike} from '../../src/kit/ui';
import {enter, exit, pop, prog, springAt, map, EASE, rand} from '../../src/kit/motion';
import {SANS, SERIF, MONO} from '../../src/kit/fonts';

const S01: React.FC<SceneProps> = ({t, dur, fps, spec, theme, pal, W, H}) => {
  const c = spec.cues ?? {};               // c['w:stars'] = frame of the word "stars" (relative to scene start)
  return (
    <AbsoluteFill>
      <Card t={t} at={0} pal={pal} x={W * 0.12} y={H * 0.3} w={W * 0.76} h={H * 0.22}>...</Card>
      <Pill text="FREE" t={t} at={c['w:free'] ?? 6} fps={fps} bg={theme.accent} fg="#fff" />
    </AbsoluteFill>
  );
};
export const SCENES = {S01 /*, S02, ... one per scene id in project.json */};
```

- `t` = frames since the scene's nominal start (negative while the transition into it plays; it is
  already drawn then, so put entrances at `at >= 0`, or at a word cue).
- `pal` = the scene's palette (dark or light act): `bg fg mute grid card cardBorder`.
  `theme.accent` (green), `theme.accent2` (red), `theme.select` (caption box colours).
- Layout safe area for 9:16: keep content between 18 % and 82 % of the height - the caption line
  sits at the recipe's `y` (about 7 % from the top) and the handle at 86 %.
- Units are pixels of the composition (720x1280 for the reference reel); size relative to `W`/`H`.

## Motion (motion.ts)
`enter(t, at, dur=10, rise=24, blur=10)` blur+rise+fade · `exit(t, at)` · `pop(t, at, fps)` spring
scale with overshoot · `prog(t, at, dur, ease)` 0→1 · `springAt(t, at, fps, cfg)` · `map(t, [a,b], [x,y])`
· `countUp` · `rand(seed)` deterministic noise · `EASE.out/inOut/in/back`.

## Components (ui.tsx) - all take `t` and an `at` frame
| Component | Use |
|---|---|
| `Card` | rounded surface; `enterAs` rise / pop / none |
| `Window` | app/browser window with traffic lights + title/URL |
| `Pill` | badge/chip/tag that pops (`icon` optional) |
| `Tick` | round check (or `kind="x"`) badge that pops |
| `Counter` | rolling number (`from`,`to`,`dur`, prefix/suffix, decimals) |
| `TypeOn` | typed text with cursor (`cps`) |
| `Terminal` | dark terminal with lines typing at their `at` frames |
| `LineChart` | area/line drawing left→right with glowing end dot (`points` 0..1) |
| `IconGrid` | cols×rows tiles rippling in from the centre |
| `Stepper` | horizontal steps completing at `doneAt` frames |
| `Notification` | banner dropping from the top (title, body, icon) |
| `Cursor` | pointer moving through `{at,x,y}` keys, ripple on `clicks` |
| `Strike` | line drawing across its parent (relative position) |
| `Glyph` | brand-free icons: star check x doc folder user users search bolt bell link code chat layers play film eye sparkle repo download arrow |

## Real media + fluid motion (fx.tsx)
| Component | Use |
|---|---|
| `Logo icon={siX} size color` | real brand SVG from Simple Icons (`color="brand"` = official hex, or white/black) |
| `LogoTile icon t at fps size bg` | logo on a rounded app-icon tile, spring pop with a small rotation |
| `Shot src aspect t x y w h url dark at focus` | captured screenshot in a browser frame. `aspect` = image h/w (required). `focus=[{at,x,y,scale}]` = a virtual camera: the image point (x,y in 0..1) is CENTRED at that zoom, keys ease into each other, and the view is clamped so the image edge never shows. Use a key with `at: -30` to start already zoomed |
| `Tilt3D t fps path max` | perspective hover-tilt + glare following a pointer path `[{at,x,y}]` (-1..1); give two elements the same path to show identical motion |
| `CompareSlider t a b w h keys labelA labelB` | before/after wipe between two same-size images; divider eases through `keys=[{at,pos}]` |
| `Camera t dur push drift origin` | wrap every scene: continuous slow push-in + drift |
| `Float t amp period phase` | gentle sine bob for hero elements (vary `phase` per item) |
| `Shine t at` | diagonal light sweep across a card (card needs overflow hidden) |
| `MaskReveal t at dir` | wipe-reveal text/element left->right or bottom->top |
| `Underline t at color` | marker line sweeping under text |
| `Particles t n w h color seed` | deterministic drifting dust/sparkles |
| `springTo(t, at, fps, from, to)` | spring a number (position/scale) for layout morphs |

Imports in a scene: `import {Camera, Float, Logo, LogoTile, Shot, Shine} from '../../src/kit/fx';`
and `import {siGithub} from 'simple-icons';`. Images: `IMG = n => '<id>/img/' + n + '.png'`.
60 fps output: keep writing frames in design units (30 fps) - `t` arrives fractional; never assume integer `t`.

## Patterns that match UI-mockup reels
- Every beat = one hero element that enters on its word; secondary bits pop 4-8 frames later.
- Numbers count up (`Counter`) and land on the spoken number.
- In-scene morphs (a card shrinking to make room) are `map(t, [a, b], [1, 0.7])` on scale/position.
- Dark acts: light cards (`#15171B` on `#08090B`); light acts: white cards with soft shadow.
- Do not draw captions, transitions, backdrop or the handle - the engine does.
