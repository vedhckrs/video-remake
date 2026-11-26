// silicon-demo S04: the neighbours. Upper board: the modem module and the wireless chip light up and send RF rings
// when the voice names them; the camera eases modem -> wireless.
import React from 'react';
import {Callout} from '../../../src/kit/explainer/stage';
import {SiLens, SiTop, boardPartTop} from '../../../src/kit/explainer/silicon';
import {onWord, wordAt, type WorldDef, type WorldDrawProps} from '../../../src/kit/explainer/world';
import {BoardShot, LAYOUT, originFor, partPx, smooth, type Shot} from './common';

const U = 46, TILT = 0.58;
const SHOT: Shot = {u: U, tilt: TILT, origin: originFor(U, TILT, 57.5, 11.5, 2.3, 960, 500)};
const MODEM = partPx(SHOT, 'modem'), WIFI = partPx(SHOT, 'wireless');

/** RF rings on the plane of a part's top (true circles in plan = foreshortened on screen) */
const Rings: React.FC<{id: string; t: number; amt: number; color: string; r: number}> = ({id, t, amt, color, r}) => {
  if (amt <= 0.01) return null;
  const [x, y, z] = boardPartTop(id, LAYOUT);
  return (
    <SiTop z={z + 0.05} style={{mixBlendMode: 'screen'}}>
      {[0, 1, 2, 3].map((k) => {
        const q = ((t / 46 + k / 4) % 1 + 1) % 1;
        return <circle key={k} cx={x} cy={y} r={r * (0.35 + q * 1.5)} fill="none" stroke={color} strokeWidth={0.28 * (1 - q) + 0.05} opacity={amt * 0.9 * Math.sin(q * Math.PI)} />;
      })}
    </SiTop>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const m = onWord(t, beats, 'modem', 'settle'), w = onWord(t, beats, 'wireless', 'settle'), c = onWord(t, beats, 'connected', 'settle');
  const sweep = t < 130 ? smooth((t + 10) / 110) : smooth((t - 150) / 90);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <BoardShot shot={SHOT} id="s4" sweep={sweep}
                 parts={{modem: {glow: 0.7 * m, glowColor: '#FFB347', highlight: m * (1 - c * 0.4), highlightColor: '#FFB347'},
                         wireless: {glow: 0.7 * w, glowColor: '#62E0FF', highlight: w * (1 - c * 0.4), highlightColor: '#62E0FF'},
                         transceiver: {glow: 0.45 * c, glowColor: '#FFB347'}, rf1: {glow: 0.45 * c, glowColor: '#FFB347'}}}>
        <Rings id="modem" t={t} amt={m} color="#FFB347" r={7} />
        <Rings id="wireless" t={t + 17} amt={w} color="#62E0FF" r={6} />
      </BoardShot>
    </div>
  );
};

const Overlay: React.FC<WorldDrawProps & {toScreen: (x: number, y: number) => [number, number]}> = ({t, beats, W, H, toScreen}) => (
  <>
    <SiLens W={W} H={H} t={t} focus={[0.24, 0.74]} blur={7} dust={14} tint="#6FA8FF" seed={21} />
    <Callout t={t} at={wordAt(beats, 'modem', 69) + 8} from={toScreen(MODEM[0], MODEM[1])} to={[W * 0.2, H * 0.2]} text="5G modem" gloss="cellular radio" W={W} color="#FFB347" />
    <Callout t={t} at={wordAt(beats, 'wireless', 119) + 8} from={toScreen(WIFI[0], WIFI[1])} to={[W * 0.8, H * 0.24]} text="Wireless chip" gloss="Wi-Fi, Bluetooth, Thread" W={W} color="#62E0FF" />
  </>
);

export const rfWorld: WorldDef = {
  id: 'sirf',
  home: 'home',
  anchors: {home: {x: 960, y: 520, zoom: 1}, modem: {x: MODEM[0] + 60, y: MODEM[1] + 40, zoom: 1.3}, wireless: {x: WIFI[0] - 40, y: WIFI[1] + 10, zoom: 1.3}, all: {x: 960, y: 510, zoom: 1.08}},
  aliases: {connected: 'all'},
  palette: {bg0: '#030509', bg1: '#0B111C', glow: '#3B8CFF', particles: '#9CC3FF'},
  Draw, Overlay,
};
