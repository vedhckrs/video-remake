import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {CaptionWord, Project} from './types';
import {EASE, clamp01} from './motion';
import {SANS, SERIF} from './fonts';

/**
 * One caption line at the top, built word by word on the voice (each word's frame is already
 * `leadMs` before it is spoken - set by plan_timeline.py). The newest plain word is full colour,
 * earlier plain words fade to the muted colour, keywords keep their style:
 *   bold   - heavy sans in the page colour
 *   select - italic serif inside a text-selection box with corner handles
 */
export const Captions: React.FC<{project: Project}> = ({project}) => {
  const frame = useCurrentFrame();
  const {captions, theme, canvas} = project;
  const k = project.canvas.fps / (project.baseFps ?? project.canvas.fps); // same feel at 30 or 60 fps
  const page = captions.pages.find((p) => frame >= p.from - 1 && frame < p.to + 6 * k);
  if (!page) return null;
  const scene = project.scenes.find((s) => frame >= s.from && frame < s.to) ?? project.scenes[0];
  const pal = theme[scene.bg];
  const size = captions.size;
  const out = clamp01((frame - page.to) / (6 * k));
  const visible = page.words.filter((w) => frame >= w.frame);
  const newest = visible.length - 1;
  return (
    <div
      style={{
        position: 'absolute', left: canvas.width * 0.07, right: canvas.width * 0.07, top: canvas.height * captions.y,
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', columnGap: size * 0.26,
        rowGap: size * 0.15, zIndex: 1000, opacity: 1 - out, filter: `blur(${out * 10}px)`,
      }}
    >
      {visible.map((w, i) => (
        <Word key={i} w={w} frame={frame} size={size} fg={pal.fg} mute={pal.mute} newest={i === newest}
              select={theme.select} k={k} />
      ))}
    </div>
  );
};

const Word: React.FC<{
  w: CaptionWord; frame: number; size: number; fg: string; mute: string; newest: boolean;
  select: {fill: string; border: string}; k: number;
}> = ({w, frame, size, fg, mute, newest, select, k}) => {
  const p = EASE.out(clamp01((frame - w.frame) / (6 * k)));
  const base: React.CSSProperties = {
    display: 'inline-block', opacity: p, filter: `blur(${(1 - p) * 8}px)`,
    transform: `translateX(${(1 - p) * size * 0.35}px)`, lineHeight: 1.15, whiteSpace: 'nowrap',
  };
  if (w.style === 'select') {
    const hs = Math.max(6, size * 0.16);
    const handle = (pos: React.CSSProperties): React.CSSProperties => ({
      position: 'absolute', width: hs, height: hs, borderRadius: hs, background: '#fff',
      border: `2px solid ${select.border}`, ...pos,
    });
    return (
      <span style={{...base, position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontSize: size * 1.12,
                    color: '#14213D', padding: `0 ${size * 0.12}px`}}>
        <span style={{position: 'absolute', inset: `${size * 0.1}px 0 ${size * 0.02}px 0`, background: select.fill,
                      border: `2px solid ${select.border}`, opacity: 0.85, zIndex: -1}} />
        <span style={handle({left: -hs / 2, top: size * 0.1 - hs / 2})} />
        <span style={handle({right: -hs / 2, bottom: size * 0.02 - hs / 2})} />
        {w.w}
      </span>
    );
  }
  return (
    <span style={{...base, fontFamily: SANS, fontSize: size, fontWeight: w.style === 'bold' ? 750 : 450,
                  color: w.style === 'bold' || newest ? fg : mute, transition: 'none'}}>
      {w.w}
    </span>
  );
};
