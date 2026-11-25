import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Bg, Theme} from './types';

/** Flat page colour + soft centre glow + faint dot grid (the look of most UI-mockup reels). */
export const Backdrop: React.FC<{bg: Bg; theme: Theme; grid?: boolean}> = ({bg, theme, grid = true}) => {
  const pal = theme[bg];
  return (
    <AbsoluteFill style={{background: pal.bg}}>
      <AbsoluteFill
        style={{
          background:
            bg === 'dark'
              ? 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,255,255,0.06), rgba(0,0,0,0) 70%)'
              : 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)',
        }}
      />
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(${pal.grid} 1.2px, transparent 1.3px)`,
            backgroundSize: '28px 28px',
            opacity: 0.55,
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
          }}
        />
      ) : null}
      <AbsoluteFill style={{boxShadow: `inset 0 0 220px ${bg === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(120,118,100,0.18)'}`}} />
    </AbsoluteFill>
  );
};
