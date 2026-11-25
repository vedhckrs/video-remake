// Original presenter rig ("Juno"): waist-up bust, screen-locked in the bottom band, above the stage, below captions.
// Pure function of t (design frames @30): pose cues spring between poses (12-16 frames @60, ~6 % overshoot,
// 2-frame anticipation), idle breathing, blinks every 3-5 s, mouth driven by voice word timings, eye-line per pose.
// The ARTWORK lives in juno_art.tsx (drawn as code by Claude Fable 5.2 against the contract in
// D:\VideoBlueprint\jobs\juno\brief.md); this file is the rig. Garment pink = C.brand, used by nothing else.
import React from 'react';
import {sp} from './tokens';
import {ART, Defs, Forearm, HandArt, Head, Torso, UpperArm, type Brows, type Hand, type Mouth} from './juno_art';

type Arm = {to: [number, number]; hand: Hand; ha?: number; bend?: 'out' | 'in'};
export type PoseDef = {L: Arm; R: Arm; tilt?: number; look?: [number, number]; brows?: Brows; mouth?: Mouth; lean?: number; eyes?: 'open' | 'wink' | 'closed' | 'wide'};

// Bust box 400 x 440 (y = 440 is the frame's bottom edge). Head centre (200,150), chin ~222, shoulders (110,292)/(290,292).
// `to` = WRIST target; the hand extends ~64 px further along `ha` (absolute degrees, 0 = right, -90 = up).
const DOWN_L: Arm = {to: [66, 560], hand: 'open'};
const DOWN_R: Arm = {to: [334, 560], hand: 'open'};

export const POSES: Record<string, PoseDef> = {
  idle: {L: DOWN_L, R: DOWN_R, mouth: 'smile', brows: 'neutral'},
  listen: {L: DOWN_L, R: DOWN_R, mouth: 'smile', brows: 'happy', tilt: -4},
  // Point
  point_up_left: {L: {to: [-30, 120], hand: 'point'}, R: DOWN_R, look: [-1, -0.6], brows: 'up', mouth: 'open', tilt: -5},
  point_up_right: {L: DOWN_L, R: {to: [430, 120], hand: 'point'}, look: [1, -0.6], brows: 'up', mouth: 'open', tilt: 5},
  point_left: {L: {to: [-90, 280], hand: 'point'}, R: DOWN_R, look: [-1, 0], mouth: 'smile'},
  point_right: {L: DOWN_L, R: {to: [490, 280], hand: 'point'}, look: [1, 0], mouth: 'smile'},
  point_up: {L: DOWN_L, R: {to: [300, 130], hand: 'point', ha: -90}, look: [0.2, -1], brows: 'up', mouth: 'open'},
  // Address
  point_viewer: {L: DOWN_L, R: {to: [252, 300], hand: 'point', ha: -80}, look: [0, 0], brows: 'up', mouth: 'grin'},
  open_palm: {L: DOWN_L, R: {to: [320, 272], hand: 'palm', ha: -80}, mouth: 'smile', brows: 'happy', tilt: 3},
  // Count
  count_1: {L: DOWN_L, R: {to: [318, 212], hand: 'point', ha: -90}, look: [0.3, -0.2], brows: 'up', mouth: 'open'},
  count_2: {L: DOWN_L, R: {to: [318, 212], hand: 'peace', ha: -90}, look: [0.3, -0.2], brows: 'up', mouth: 'open'},
  count_3: {L: DOWN_L, R: {to: [318, 212], hand: 'three', ha: -90}, look: [0.3, -0.2], brows: 'up', mouth: 'open'},
  count_4: {L: DOWN_L, R: {to: [318, 212], hand: 'four', ha: -90}, look: [0.3, -0.2], brows: 'up', mouth: 'open'},
  count_5: {L: DOWN_L, R: {to: [318, 212], hand: 'five', ha: -90}, look: [0.3, -0.2], brows: 'up', mouth: 'open'},
  // Size
  pinch: {L: DOWN_L, R: {to: [312, 244], hand: 'pinch', ha: -60}, look: [0.6, -0.4], brows: 'skeptic', mouth: 'smirk'},
  arms_wide: {L: {to: [-70, 222], hand: 'palm', ha: -120}, R: {to: [470, 222], hand: 'palm', ha: -60}, brows: 'up', mouth: 'o'},
  // Approve
  thumbs_up: {L: DOWN_L, R: {to: [312, 292], hand: 'thumb', ha: 0}, mouth: 'grin', brows: 'happy', tilt: 4},
  double_thumbs: {L: {to: [88, 292], hand: 'thumb', ha: 180}, R: {to: [312, 292], hand: 'thumb', ha: 0}, mouth: 'grin', brows: 'happy'},
  fist_pump: {L: DOWN_L, R: {to: [330, 128], hand: 'fist', ha: -90}, mouth: 'grin', brows: 'happy', tilt: 6, eyes: 'closed'},
  // Block
  stop_palm: {L: DOWN_L, R: {to: [286, 252], hand: 'palm', ha: -90}, brows: 'angry', mouth: 'flat'},
  arms_crossed: {L: {to: [262, 352], hand: 'fist', bend: 'out'}, R: {to: [138, 352], hand: 'fist', bend: 'out'}, brows: 'skeptic', mouth: 'flat', tilt: -3},
  // Doubt
  chin_rub: {L: DOWN_L, R: {to: [222, 282], hand: 'fist', ha: -112}, look: [0.7, -0.7], brows: 'skeptic', mouth: 'flat', tilt: 4},
  head_scratch: {L: DOWN_L, R: {to: [288, 122], hand: 'fist', ha: -135}, look: [-0.5, -0.5], brows: 'worried', mouth: 'smirk', tilt: -6},
  shrug: {L: {to: [40, 290], hand: 'palm', ha: -150}, R: {to: [360, 290], hand: 'palm', ha: -30}, brows: 'up', mouth: 'flat', tilt: -7},
  // Alarm
  hands_on_head: {L: {to: [128, 122], hand: 'open', ha: -55}, R: {to: [272, 122], hand: 'open', ha: -125}, brows: 'worried', mouth: 'o', eyes: 'wide'},
  hands_on_cheeks: {L: {to: [140, 238], hand: 'open', ha: -75}, R: {to: [260, 238], hand: 'open', ha: -105}, brows: 'up', mouth: 'o', eyes: 'wide'},
  // Fail
  facepalm: {L: DOWN_L, R: {to: [234, 232], hand: 'open', ha: -120}, brows: 'worried', mouth: 'frown', tilt: 8, eyes: 'closed'},
  wipe_brow: {L: DOWN_L, R: {to: [252, 150], hand: 'open', ha: -170}, brows: 'worried', mouth: 'grin', tilt: -4},
  grimace: {L: DOWN_L, R: DOWN_R, brows: 'worried', mouth: 'frown', tilt: -5, eyes: 'wide'},
  // Hide
  cover_eyes: {L: {to: [150, 202], hand: 'open', ha: -60}, R: {to: [250, 202], hand: 'open', ha: -120}, mouth: 'flat', eyes: 'closed'},
  // Time
  wrist_tap: {L: {to: [168, 352], hand: 'fist', ha: 0, bend: 'out'}, R: {to: [190, 335], hand: 'point', ha: 160}, look: [-0.4, 1], brows: 'skeptic', mouth: 'flat'},
  // Explain
  level_hand: {L: DOWN_L, R: {to: [318, 322], hand: 'palm', ha: -10}, brows: 'neutral', mouth: 'open'},
  chop: {L: {to: [160, 322], hand: 'palm', ha: -90}, R: {to: [240, 322], hand: 'palm', ha: -90}, brows: 'angry', mouth: 'open'},
  typing: {L: {to: [150, 430], hand: 'fist'}, R: {to: [250, 430], hand: 'fist'}, look: [0, 1], brows: 'neutral', mouth: 'flat'},
  // Hold prop
  hold_prop: {L: DOWN_L, R: {to: [320, 252], hand: 'hold', ha: -80}, look: [0.7, -0.3], brows: 'up', mouth: 'smile'},
  // Close
  wave: {L: DOWN_L, R: {to: [340, 150], hand: 'palm', ha: -90}, mouth: 'grin', brows: 'happy', tilt: 4},
  wink: {L: DOWN_L, R: {to: [312, 292], hand: 'thumb', ha: 0}, mouth: 'grin', brows: 'happy', eyes: 'wink'},
};
export type PoseName = keyof typeof POSES;

export type PoseCue = {t: number; pose: PoseName | string; prop?: React.ReactNode};

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerp2 = (a: [number, number], b: [number, number], p: number): [number, number] => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const angLerp = (a: number, b: number, p: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * p;
};
const deg = (r: number) => (r * 180) / Math.PI;

/** 2-bone IK: elbow + wrist for a target. Elbow goes away from the body centre unless bend = 'in'. */
const ik = (S: [number, number], T: [number, number], bend: 'out' | 'in' = 'out') => {
  const {L1, L2} = ART;
  const dx = T[0] - S[0], dy = T[1] - S[1];
  const dist = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1), L1 + L2 - 0.5);
  const phi = Math.atan2(dy, dx);
  const a = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist))));
  const cand = [1, -1].map((s) => [S[0] + L1 * Math.cos(phi + s * a), S[1] + L1 * Math.sin(phi + s * a)] as [number, number]);
  const outward = (e: [number, number]) => Math.abs(e[0] - 200) + e[1] * 0.35;
  cand.sort((p, q) => outward(q) - outward(p));
  const E = bend === 'out' ? cand[0] : cand[1];
  const W: [number, number] = [S[0] + dist * Math.cos(phi), S[1] + dist * Math.sin(phi)];
  return {E, W};
};

const ArmView: React.FC<{side: 'L' | 'R'; arm: Arm & {haAbs: number}; prop?: React.ReactNode}> = ({side, arm, prop}) => {
  const S = side === 'L' ? ART.shoulderL : ART.shoulderR;
  const {E, W} = ik(S, arm.to, arm.bend);
  const a1 = deg(Math.atan2(E[1] - S[1], E[0] - S[0]));
  const a2 = deg(Math.atan2(W[1] - E[1], W[0] - E[0]));
  return (
    <g>
      <g transform={`translate(${S[0]},${S[1]}) rotate(${a1})`}><UpperArm side={side} /></g>
      <g transform={`translate(${E[0]},${E[1]}) rotate(${a2})`}><Forearm side={side} /></g>
      <g transform={`translate(${W[0]},${W[1]}) rotate(${arm.haAbs})${side === 'L' ? ' scale(1,-1)' : ''}`}>
        <HandArt shape={arm.hand} prop={side === 'R' ? prop : undefined} />
      </g>
    </g>
  );
};

/** Blink times: deterministic, every 3-5 s (design frames @30). */
const blinkAmount = (t: number) => {
  let at = 40;
  for (let i = 0; i < 400 && at < t + 10; i++) {
    const dur = 3;
    if (t >= at && t < at + dur * 2) {
      const q = (t - at) / dur;
      return Math.max(0.08, q < 1 ? 1 - q : q - 1);
    }
    const r = Math.sin((i + 1) * 91.7) * 43758.5453;
    at += 90 + (r - Math.floor(r)) * 60;
  }
  return 1;
};

export type PresenterProps = {
  t: number;                  // design frames @30 (fractional ok)
  cues: PoseCue[];            // sorted by t
  talk?: [number, number][];  // word spans (design frames) for lip motion
  enter?: number;             // design frame of the pop-in (absent before)
  W: number;                  // frame width (px)
  H: number;
  anchor?: 'center' | 'left' | 'right';
  widthFrac?: number;         // 0.30-0.45 of frame width
  shift?: {t: number; anchor: 'center' | 'left' | 'right'}[]; // re-anchor moments
};

export const Presenter: React.FC<PresenterProps> = ({t, cues, talk = [], enter = 0, W, H, anchor = 'center', widthFrac = 0.56, shift = []}) => {
  if (t < enter - 0.01) return null;
  // ---- pose blend
  const idx = cues.reduce((acc, c, i) => (c.t <= t ? i : acc), -1);
  const cur = idx >= 0 ? cues[idx] : {t: 0, pose: 'idle'};
  const prev = idx > 0 ? cues[idx - 1] : {t: 0, pose: 'idle'};
  const P0 = POSES[prev.pose] ?? POSES.idle, P1 = POSES[cur.pose] ?? POSES.idle;
  const since = t - cur.t;
  const antic = since < 2 ? -0.05 * Math.sin((since / 2) * Math.PI) : 0;
  const p = idx >= 0 ? Math.min(1.12, sp(t, cur.t + 1.2, 'pose') + antic) : 1;
  const arm = (a: Arm, b: Arm, side: 'L' | 'R'): Arm & {haAbs: number} => {
    const to = lerp2(a.to, b.to, p);
    const shoulder = side === 'L' ? ART.shoulderL : ART.shoulderR;
    const defA = (x: Arm) => {
      const {E, W: w} = ik(shoulder, x.to, x.bend);
      return x.ha ?? deg(Math.atan2(w[1] - E[1], w[0] - E[0]));
    };
    return {to, hand: p < 0.5 ? a.hand : b.hand, bend: p < 0.5 ? a.bend : b.bend, haAbs: angLerp(defA(a), defA(b), Math.min(1, Math.max(0, p)))};
  };
  const aL = arm(P0.L, P1.L, 'L');
  const aR = arm(P0.R, P1.R, 'R');
  const pick = <K extends keyof PoseDef>(k: K, d: NonNullable<PoseDef[K]>) => ((p < 0.5 ? P0[k] : P1[k]) ?? d) as NonNullable<PoseDef[K]>;
  const tilt = lerp(P0.tilt ?? 0, P1.tilt ?? 0, p);
  const look = lerp2(P0.look ?? [0, 0], P1.look ?? [0, 0], Math.min(1, p * 1.4));
  // ---- idle life
  const breath = Math.sin((t / 105) * Math.PI * 2) * 2.2;
  const blink = blinkAmount(t);
  const eyes = pick('eyes', 'open');
  let talkAmt = 0;
  for (const [a, b] of talk) {
    if (t >= a && t < b) {
      const len = Math.max(2, b - a);
      const syl = Math.max(1, Math.round(len / 5));
      talkAmt = 0.3 + 0.7 * Math.abs(Math.sin(((t - a) / len) * Math.PI * syl));
      break;
    }
  }
  if (cur.pose === 'wave') aR.haAbs += Math.sin(since * 0.55) * 14;
  // ---- entrance pop (from below, spring with overshoot)
  const e = sp(t, enter, 'bouncy');
  const width = W * widthFrac;
  const height = 440 * (width / 400);
  const ax = (a: 'center' | 'left' | 'right') => (a === 'center' ? (W - width) / 2 : a === 'left' ? W * 0.0 : W - width);
  let x = ax(anchor);
  for (const s of shift) {
    if (t >= s.t) x = lerp(x, ax(s.anchor), sp(t, s.t, 'settle'));
  }
  const prop = cur.prop ?? prev.prop;
  const lidL = eyes === 'closed' ? 0.08 : blink;
  const lidR = eyes === 'closed' || eyes === 'wink' ? 0.08 : blink;
  return (
    <svg width={width} height={height} viewBox="0 0 400 440"
         style={{position: 'absolute', left: x, top: H - height, overflow: 'visible', zIndex: 800,
                 transform: `translateY(${(1 - e) * height * 0.9}px) scale(${0.85 + 0.15 * e})`, transformOrigin: '50% 100%',
                 opacity: Math.min(1, e * 2)}}>
      <Defs />
      <g transform={`translate(0,${breath})`}>
        <Torso />
        <g transform={`rotate(${tilt} ${ART.neckPivot[0]} ${ART.neckPivot[1]})`}>
          <Head look={look} lidL={lidL} lidR={lidR} wide={eyes === 'wide'} brows={pick('brows', 'neutral')} mouth={pick('mouth', 'smile')} talk={talkAmt} />
        </g>
        <ArmView side="L" arm={aL} />
        <ArmView side="R" arm={aR} prop={prop} />
      </g>
    </svg>
  );
};

/** Pose from a keyword (plan_timeline.py has the same rules - keep in sync). */
export const autoPose = (word: string): PoseName | null => {
  const w = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(you|your|yours)$/.test(w)) return 'point_viewer';
  if (/^(why|how|what|really)$/.test(w)) return 'chin_rub';
  if (/^(huge|massive|hundreds|thousands|millions|billions|everything|all)$/.test(w)) return 'arms_wide';
  if (/^(tiny|small|just|only|little)$/.test(w)) return 'pinch';
  if (/^(no|never|stop|zero|nothing|cant|cannot)$/.test(w)) return 'stop_palm';
  if (/^(works|yes|win|wins|done|faster|better|free)$/.test(w)) return 'thumbs_up';
  if (/^(slow|wait|seconds|years|time|latency)$/.test(w)) return 'wrist_tap';
  if (/^(crash|crashes|fails|broken|useless|lost)$/.test(w)) return 'facepalm';
  if (/^(one|first)$/.test(w)) return 'count_1';
  if (/^(two|second)$/.test(w)) return 'count_2';
  if (/^(three|third)$/.test(w)) return 'count_3';
  if (/^(wow|insane|crazy|shocking)$/.test(w)) return 'hands_on_cheeks';
  return null;
};
