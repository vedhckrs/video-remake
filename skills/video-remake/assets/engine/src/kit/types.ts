import type React from 'react';

export type Bg = 'dark' | 'light';
export type TransitionType = 'cut' | 'dissolve' | 'iris' | 'zoom' | 'slide' | 'push' | 'portal';

export type Palette = {bg: string; fg: string; mute: string; grid: string; card: string; cardBorder: string};

export type Theme = {
  dark: Palette;
  light: Palette;
  accent: string;        // the one accent colour (ticks, highlights)
  accent2: string;       // secondary accent (warnings, red X)
  select: {fill: string; border: string}; // keyword selection box
  fontSans: string;
  fontSerif: string;
  fontMono: string;
};

export type CaptionWord = {w: string; frame: number; style: 'normal' | 'bold' | 'select'};
export type CaptionPage = {from: number; to: number; words: CaptionWord[]};

export type SceneSpec = {
  id: string;            // key into the project's scenes map (scenes.tsx)
  from: number;          // nominal first frame (the transition into it is centred here)
  to: number;            // nominal end frame (exclusive) = next scene's from
  bg: Bg;
  transitionIn: {type: TransitionType; frames: number; origin?: [number, number]; color?: string};
  props?: Record<string, unknown>;
  cues?: Record<string, number>; // named frames inside the scene, relative to `from` (word hits etc.)
  /** word beats from plan_timeline (design frames relative to `from`): drive the World camera director */
  beats?: {t: number; w: string; word: string; kind: 'number' | 'action' | 'state' | 'object' | 'drift'; s: number; camera?: string; action?: string; target?: string}[];
};

export type Project = {
  id: string;
  title: string;
  canvas: {width: number; height: number; fps: number};
  /** Design frame rate: scene code, cues and kit timings are written in these units (the reference's fps).
   *  When canvas.fps is higher (e.g. 60), scenes receive fractional `t` and are simply sampled more often. */
  baseFps?: number;
  /** Final output size; render.py renders the canvas with --scale = output.width / canvas.width. */
  output?: {width: number; height: number};
  durationInFrames: number;
  theme: Theme;
  handle?: string;
  audio: {
    vo?: string;
    voVolume?: number;
    music?: {src: string; volume: number; fadeOutFrames?: number};
    sfx: {src: string; frame: number; volume: number; type?: string}[];
  };
  /** 'line' = the original remake caption line; 'explainer' = kit/explainer/captions (phrases + travelling keyword box). */
  captions: {y: number; size: number; pages: CaptionPage[]; mode?: 'line' | 'explainer'};
  /** 'explainer' = keyframes-explainer style: grid backdrop, screen-locked presenter, explainer captions, rail. */
  style?: 'remake' | 'explainer';
  /** Presenter track, all times in DESIGN frames (baseFps). Poses: kit/explainer/presenter.tsx POSES. */
  presenter?: {
    cues: {t: number; pose: string}[];
    talk?: [number, number][];
    enter?: number;
    anchor?: 'center' | 'left' | 'right';
    widthFrac?: number;
    shift?: {t: number; anchor: 'center' | 'left' | 'right'}[];
    hide?: [number, number][];
  };
  /** Progress rail (videos > 60 s), times in design frames. */
  rail?: {chapters: {t: number; label: string}[]};
  /** Shorts/Reels safe area (Ved, 25 Nov 2026): world cameras land their anchor at `focusY` of the height (default
   *  0.53; NanoZoom centre = focusY - 0.03) and draw everything `zoom` x smaller (default 1), so key content stays
   *  clear of the app's bottom overlay (username, description, music) and below the captions. */
  safe?: {focusY?: number; zoom?: number};
  scenes: SceneSpec[];
};

export type SceneProps = {
  /** frames since this scene's nominal start (negative during the incoming transition) */
  t: number;
  dur: number;
  fps: number;
  spec: SceneSpec;
  theme: Theme;
  pal: Palette;
  W: number;
  H: number;
};

export type ProjectEntry = {
  id: string;
  project: Project;
  scenes: Record<string, React.FC<SceneProps>>;
};
