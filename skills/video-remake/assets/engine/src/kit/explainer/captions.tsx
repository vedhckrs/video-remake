// Explainer captions (style_system 7): 2-4-word phrases in the top band (y 15-25 %, x 18-82 %), max 2 lines.
// Active word = bold, full contrast; spoken words = regular grey; upcoming words are not shown.
// Word in: blur 12 -> 0, opacity, scale 0.96 -> 1 over 3.5 design frames. Phrase out: 2.5-frame blur.
// Keyword box (style 'select'): original corner-bracket skin, drawn in 4.5 frames, and it SPRINGS from the
// previous keyword to the next instead of re-spawning when they are < 1.5 s apart.
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';
import {measureText} from '@remotion/layout-utils';
import {loadFont as loadPoppins} from '@remotion/google-fonts/Poppins';
import type {CaptionPage, Project} from '../types';
import {C, alpha, pal, sp} from './tokens';

const poppins = loadPoppins('normal', {weights: ['400', '500', '600', '700', '800'], subsets: ['latin']});
const FAMILY = poppins.fontFamily;

const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('caption fonts'));
  useEffect(() => {
    poppins.waitUntilDone().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};

type Rect = {x: number; y: number; w: number; h: number};
type Placed = {rect: Rect; text: string; frame: number; select: boolean};

const layoutCache = new Map<string, Placed[]>();

const layoutPage = (page: CaptionPage, size: number, left: number, maxW: number, top: number): Placed[] => {
  const key = `${page.from}|${size}|${maxW}|${top}`;
  const hit = layoutCache.get(key);
  if (hit) return hit;
  const gap = size * 0.28;
  const ws = page.words.map((w) => measureText({text: w.w, fontFamily: FAMILY, fontSize: size, fontWeight: '700'}).width);
  const lines: number[][] = [[]];
  let cur = 0;
  ws.forEach((wd, i) => {
    const line = lines[lines.length - 1];
    if (line.length && cur + gap + wd > maxW) {
      lines.push([i]);
      cur = wd;
    } else {
      line.push(i);
      cur += (line.length > 1 ? gap : 0) + wd;
    }
  });
  const lh = size * 1.24;
  const out: Placed[] = [];
  lines.forEach((line, li) => {
    const total = line.reduce((a, i, k) => a + ws[i] + (k ? gap : 0), 0);
    let x = left + (maxW - total) / 2;
    for (const i of line) {
      out[i] = {rect: {x, y: top + li * lh, w: ws[i], h: lh}, text: page.words[i].w, frame: page.words[i].frame, select: page.words[i].style === 'select'};
      x += ws[i] + gap;
    }
  });
  layoutCache.set(key, out);
  return out;
};

export const ExplainerCaptions: React.FC<{project: Project}> = ({project}) => {
  const frame = useCurrentFrame();
  const ready = useFontsReady();
  if (!ready) return null;
  const {captions, canvas} = project;
  const W = canvas.width, H = canvas.height;
  const k = canvas.fps / (project.baseFps ?? canvas.fps);
  const size = captions.size;
  const left = W * 0.18, maxW = W * 0.64, top = H * captions.y;
  const pages = captions.pages;
  const pi = pages.findIndex((p) => frame >= p.from - 1 && frame < p.to + 2.5 * k);
  if (pi < 0) return null;
  const page = pages[pi];
  const placed = layoutPage(page, size, left, maxW, top);
  const scene = project.scenes.find((s) => frame >= s.from && frame < s.to) ?? project.scenes[0];
  const P = pal(scene.bg);
  const out = Math.max(0, Math.min(1, (frame - page.to) / (2.5 * k)));
  const visible = placed.filter((w) => frame >= w.frame);
  const active = visible.length - 1;

  // ---- keyword box
  const kw = [...visible].reverse().find((w) => w.select);
  let box: React.ReactNode = null;
  if (kw) {
    // previous keyword (this page or earlier pages) for the travelling spring
    let prev: Placed | null = null;
    for (let j = pi; j >= 0 && !prev; j--) {
      const pl = j === pi ? placed : layoutPage(pages[j], size, left, maxW, top);
      const cands = pl.filter((w) => w.select && w.frame < kw.frame);
      if (cands.length) prev = cands[cands.length - 1];
      if (j < pi && pages[j].to < kw.frame - 45 * k) break;
    }
    const near = prev && kw.frame - prev.frame < 45 * k;
    const tt = (frame - kw.frame) / k;
    const pad = size * 0.14;
    let r: Rect = {x: kw.rect.x - pad, y: kw.rect.y + size * 0.06, w: kw.rect.w + 2 * pad, h: kw.rect.h - size * 0.1};
    let o = 1, grow = 1;
    if (near && prev) {
      const pr = {x: prev.rect.x - pad, y: prev.rect.y + size * 0.06, w: prev.rect.w + 2 * pad, h: prev.rect.h - size * 0.1};
      const s = sp(tt, 0, 'settle');
      r = {x: pr.x + (r.x - pr.x) * s, y: pr.y + (r.y - pr.y) * s, w: pr.w + (r.w - pr.w) * s, h: pr.h + (r.h - pr.h) * s};
    } else {
      grow = sp(tt, 0, 'pop');
      o = Math.min(1, tt / 2.5);
    }
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const bw = r.w * (0.7 + 0.3 * grow), bh = r.h * (0.7 + 0.3 * grow);
    const L = Math.min(bw, bh) * 0.32, sw = Math.max(3, size * 0.055);
    const col = C.info;
    const x0 = cx - bw / 2, y0 = cy - bh / 2, x1 = cx + bw / 2, y1 = cy + bh / 2;
    box = (
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o}}>
        <rect x={x0} y={y0} width={bw} height={bh} rx={size * 0.08} fill={alpha(col, 0.16)} />
        <path d={`M${x0},${y0 + L} V${y0} H${x0 + L} M${x1 - L},${y0} H${x1} V${y0 + L} M${x1},${y1 - L} V${y1} H${x1 - L} M${x0 + L},${y1} H${x0} V${y1 - L}`}
              fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 1000, opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined, pointerEvents: 'none'}}>
      {box}
      {visible.map((w, i) => {
        const p = Math.min(1, Math.max(0, (frame - w.frame) / (3.5 * k)));
        const e = 1 - Math.pow(1 - p, 3);
        const isActive = i === active;
        const bold = isActive || w.select;
        return (
          <div key={i} style={{position: 'absolute', left: w.rect.x, top: w.rect.y, width: w.rect.w, height: w.rect.h, textAlign: 'center',
                               fontFamily: FAMILY, fontSize: size, lineHeight: `${w.rect.h}px`, fontWeight: bold ? 700 : 400,
                               color: bold ? P.fg : P.mute, opacity: e, filter: e < 1 ? `blur(${(1 - e) * 12}px)` : undefined,
                               transform: `scale(${0.96 + 0.04 * e})`, whiteSpace: 'nowrap', letterSpacing: bold ? '0' : '0.005em'}}>
            {w.text}
          </div>
        );
      })}
    </div>
  );
};
