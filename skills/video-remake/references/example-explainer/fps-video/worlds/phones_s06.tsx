// S06 "Gearbox phone" - a calm plum/champagne phone studio. A generic titanium phone stands on a glossy plinth beside an
// instrument console: refresh-rate dial, battery, and a three-gear lever. The feed scrolls at 120 Hz and the battery drains
// fast; LTPO shifts the lever down (article = lower, lock screen = 1 Hz) and the drain slows with every gear.
// World px == screen px at the home framing.
import React from 'react';
import type {WorldDef, WorldDrawProps} from '../../../src/kit/explainer/world';
import {FONT, MONO} from '../../../src/kit/explainer/stage';
import {sp, mix} from '../../../src/kit/explainer/tokens';
import {at, clamp01, flash, keyed, lerp, ramp, rnd} from './phones_util';

const id = 's06';
const GOLD = '#F2CF94', LAV = '#C9B6FF', INK = '#0B0914', GREEN = '#5BE08A', RED = '#FF5A52', AMBER = '#FFB648', PANEL = '#17132A';
const PX = 60, PY = 540, PW = 530, PH = 1110;            // phone body
const SX = PX + 16, SY = PY + 16, SW = PW - 32, SH = PH - 32;   // screen
const CX0 = 630, CW = 410;                                // console column
const DX = CX0 + CW / 2, DY = 770, DR = 172;              // dial
const BY = 1010;                                          // battery top
const GY = 1250;                                          // gear gate top
const POSTS = ['#FF8FB1', '#7CC4FF', '#FFD27C', '#9BE8B0', '#C9A6FF', '#FF9F7C'];

const ArrowDown: React.FC<{s?: number; c: string}> = ({s = 1, c}) => (
  <path d="M0,-22 V16 M-16,2 L0,20 L16,2" fill="none" stroke={c} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" transform={`scale(${s})`} />
);

const Feed: React.FC<{s: number; v: number}> = ({s, v}) => {
  const base = Math.floor(s / 300), off = s - base * 300;
  return (
    <g>
      <rect width={SW} height={SH} fill="#F4F1FA" />
      {Array.from({length: 5}).map((_, i) => {
        const k = base + i, y = 176 + i * 300 - off, c = POSTS[((k % 6) + 6) % 6];
        return (
          <g key={k} transform={`translate(18,${y})`}>
            <rect width={SW - 36} height={282} rx={26} fill="#FFFFFF" stroke="#E2DCF0" strokeWidth={2} />
            <circle cx={38} cy={38} r={20} fill={c} />
            <rect x={70} y={22} width={150 + 60 * rnd(k)} height={12} rx={6} fill="#2A2440" />
            <rect x={70} y={44} width={90} height={9} rx={4.5} fill="#B9B2CC" />
            <rect x={14} y={72} width={SW - 64} height={150} rx={18} fill={c} />
            <path d={`M14,${200} L${120 + 80 * rnd(k * 3)},${120} L${230},${180} L${300 + 60 * rnd(k * 7)},${110} L${SW - 50},${190} V${204} A18,18 0 0 1 ${SW - 68},222 H32 A18,18 0 0 1 14,204 Z`} fill="#1E1838" opacity={0.28} />
            <circle cx={SW - 110} cy={112} r={20} fill="#FFFFFF" opacity={0.75} />
            {[0, 1, 2].map((j) => <circle key={j} cx={36 + j * 46} cy={252} r={12} fill="none" stroke="#6E6690" strokeWidth={4} />)}
            <rect x={SW - 170} y={244} width={110} height={14} rx={7} fill="#D5CEE6" />
          </g>
        );
      })}
      {/* scroll smear when the feed flies */}
      {v > 0.05 ? Array.from({length: 9}).map((_, i) => <rect key={i} x={30 + i * 52} y={(i * 211 + s * 1.7) % SH - 120} width={5} height={150 + 90 * v} rx={2.5} fill="#FFFFFF" opacity={0.5 * clamp01(v)} />) : null}
      {/* app bar */}
      <rect width={SW} height={164} fill="#FFFFFF" />
      <rect y={162} width={SW} height={2} fill="#E2DCF0" />
      <text x={26} y={140} fontFamily={FONT} fontWeight={800} fontSize={38} fill="#1E1838">Feed</text>
      <circle cx={SW - 48} cy={126} r={20} fill="#C9A6FF" /><rect x={SW - 130} y={112} width={44} height={28} rx={14} fill="#EFEAF8" />
      {/* tab bar */}
      <rect y={SH - 96} width={SW} height={96} fill="#FFFFFF" /><rect y={SH - 96} width={SW} height={2} fill="#E2DCF0" />
      {[0, 1, 2, 3].map((j) => <rect key={j} x={54 + j * 118} y={SH - 68} width={36} height={36} rx={11} fill={j === 0 ? '#7B5CFF' : '#CFC8E2'} />)}
    </g>
  );
};

const Article: React.FC<{t: number; t0: number; mark: number}> = ({t, t0, mark}) => {
  const line = Math.floor(Math.max(0, t - t0) / 9);
  return (
    <g>
      <rect width={SW} height={SH} fill="#FBF7EE" />
      <text x={30} y={140} fontFamily={MONO} fontWeight={600} fontSize={19} fill="#A0763A" letterSpacing={4}>LONG READ</text>
      <rect x={30} y={170} width={410} height={28} rx={8} fill="#231C12" /><rect x={30} y={212} width={300} height={28} rx={8} fill="#231C12" />
      <circle cx={48} cy={282} r={17} fill="#D9B98A" /><rect x={76} y={274} width={150} height={10} rx={5} fill="#8E8576" /><rect x={76} y={290} width={90} height={8} rx={4} fill="#C5BCA9" />
      <rect x={30} y={326} width={SW - 60} height={210} rx={20} fill="#E7C9A0" />
      <circle cx={360} cy={392} r={34} fill="#FFF3D6" />
      <path d={`M30,${516} L130,430 L210,490 L300,400 L${SW - 30},500 V516 A20,20 0 0 1 ${SW - 50},536 H50 A20,20 0 0 1 30,516 Z`} fill="#8C6A3F" opacity={0.6} />
      {Array.from({length: 13}).map((_, i) => {
        const y = 574 + i * 34, w = (SW - 60) * (i % 5 === 4 ? 0.55 : 0.86 + 0.14 * rnd(i * 2.3));
        return (
          <g key={i}>
            {i === line % 13 ? <rect x={22} y={y - 8} width={(w + 16) * Math.max(mark, 0.001)} height={30} rx={8} fill="#FFD84D" opacity={0.85} /> : null}
            <rect x={30} y={y} width={w} height={13} rx={6.5} fill={i < line % 13 ? '#9B9283' : '#3A3226'} />
          </g>
        );
      })}
    </g>
  );
};

const Lock: React.FC<{t: number; lock: number; screen: number}> = ({t, lock, screen}) => {
  const sec = Math.floor(t / 30);            // the always-on screen really updates once a second
  const cx = SW / 2, cy = 430, a = (sec * 6 - 90) * (Math.PI / 180);
  return (
    <g>
      <rect width={SW} height={SH} fill="#020106" />
      <ellipse cx={cx} cy={cy} rx={330} ry={330} fill={`url(#${id}-aod)`} opacity={0.5 + 0.3 * screen} />
      {/* padlock */}
      <g transform={`translate(${cx},${176}) scale(${1 + 0.3 * lock})`}>
        <path d="M-15,-6 V-20 A15,15 0 0 1 15,-20 V-6" fill="none" stroke={lock > 0.3 ? GOLD : '#8C86A6'} strokeWidth={7} strokeLinecap="round" />
        <rect x={-24} y={-8} width={48} height={38} rx={10} fill={lock > 0.3 ? GOLD : '#8C86A6'} />
        <circle cx={0} cy={9} r={5} fill="#020106" />
      </g>
      {/* analogue always-on clock */}
      <circle cx={cx} cy={cy} r={166} fill="none" stroke="#3B3558" strokeWidth={3} />
      <circle cx={cx} cy={cy} r={150} fill="none" stroke="#B8B0D8" strokeWidth={12} strokeDasharray="2 13.708" opacity={0.8} />
      {Array.from({length: 12}).map((_, i) => <rect key={i} x={cx - 3.5} y={cy - 158} width={7} height={i % 3 === 0 ? 30 : 18} rx={3.5} fill="#E9E4FA" transform={`rotate(${i * 30} ${cx} ${cy})`} />)}
      <rect x={cx - 6} y={cy - 92} width={12} height={104} rx={6} fill="#F4F1FF" transform={`rotate(-56 ${cx} ${cy})`} />
      <rect x={cx - 4.5} y={cy - 128} width={9} height={142} rx={4.5} fill="#F4F1FF" transform={`rotate(62 ${cx} ${cy})`} />
      <circle cx={cx + Math.cos(a) * 150} cy={cy + Math.sin(a) * 150} r={11} fill={GOLD} />
      <circle cx={cx + Math.cos(a) * 150} cy={cy + Math.sin(a) * 150} r={24} fill={GOLD} opacity={0.3 * Math.exp(-((t / 30 - sec) * 30) / 6)} />
      <circle cx={cx} cy={cy} r={11} fill={GOLD} />
      <text x={cx} y={690} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill="#E9E4FA">Tuesday</text>
      <text x={cx} y={732} textAnchor="middle" fontFamily={MONO} fontSize={21} fill="#8C86A6" letterSpacing={5}>ALWAYS-ON DISPLAY</text>
      {/* quiet notification pills */}
      {[0, 1, 2].map((i) => <circle key={i} cx={cx - 52 + i * 52} cy={800} r={17} fill="none" stroke="#5B5578" strokeWidth={3} />)}
      {/* fingerprint */}
      {[20, 32, 44].map((r, i) => <circle key={r} cx={cx} cy={SH - 150} r={r} fill="none" stroke="#6C6590" strokeWidth={4} strokeDasharray={`${40 + i * 30} ${14 + i * 4}`} transform={`rotate(${i * 70} ${cx} ${SH - 150})`} />)}
    </g>
  );
};

const Draw: React.FC<WorldDrawProps> = ({t, beats}) => {
  const tFast = at(beats, 'fast', 0, 13), tRefresh = at(beats, 'refresh', 0, 22.5), tDrains = at(beats, 'drains', 0, 34.5), tBatt = at(beats, 'battery', 0, 46.5);
  const tPhones = at(beats, 'phones', 0, 70.5), tCheat = at(beats, 'cheat', 0, 81), tLtpo = at(beats, 'ltpo', 0, 109.5), tScreens = at(beats, 'screens', 0, 132);
  const tShift = at(beats, 'shift', 0, 143.5), tSpeed = at(beats, 'speed', 0, 151), tFly = at(beats, 'fly', 0, 164.5), t120 = at(beats, '120', 0, 201.5);
  const tScroll = at(beats, 'scroll', 0, 233), tSlower = at(beats, 'slower', 0, 253), tRead = at(beats, 'read', 0, 270.5), t1 = at(beats, '1', 0, 298);
  const tHz = at(beats, 'hertz', 0, 306), tLock = at(beats, 'lock', 0, 326), tScreen = at(beats, 'screen', 0, 332.5);

  // ---- the gearbox value: 1 = 120 Hz, 0 = 1 Hz ----
  const keys: [number, number][] = [[0, 1], [tShift, 0.52], [tSpeed, 0.2], [tFly, 0.7], [t120, 1], [tSlower, 0.4], [t1, 0]];
  const gear = (tt: number) => keyed(tt, keys, 12);
  const v = gear(t);
  const rate = (g: number) => 0.035 + Math.pow(g, 1.6);
  // battery = 1 - integral of the drain rate (pure: summed from the scene start)
  let level = 1;
  for (let k = tFast; k < t; k += 1) level -= 0.003 * rate(gear(k)) * Math.min(1, t - k);
  const r = rate(v) / 1.035;
  const mode = t >= t1 ? 'one' : t >= tSlower ? 'lower' : t >= t120 ? 'max' : t >= tShift ? 'auto' : 'max';

  // ---- screen content ----
  const scroll = 1700 * ramp(t, tFast - 4, 110) + 260 * ramp(t, tLtpo, 90) + 2100 * ramp(t, t120 - 4, 56);
  const fv = clamp01((1700 / 110) * 1.5 * Math.sin(Math.PI * clamp01((t - tFast + 4) / 110)) / 24) * 0.6 + clamp01(Math.sin(Math.PI * clamp01((t - t120 + 4) / 56)));
  const aArt = ramp(t, tSlower, 9), aLock = ramp(t, t1, 9);
  const cheat = clamp01((t - tCheat) / 16), ltpo = sp(t, tLtpo, 'bouncy');
  const rimGlow = Math.max(flash(t, tPhones, 9), flash(t, tScreens, 9), flash(t, tScreen, 10), flash(t, tCheat, 10));
  const nA = ((150 + 240 * v) * Math.PI) / 180;
  const arcPt = (deg: number, rr: number): [number, number] => [DX + Math.cos((deg * Math.PI) / 180) * rr, DY + Math.sin((deg * Math.PI) / 180) * rr];
  const arc = (d0: number, d1: number, rr: number) => {
    const [x0, y0] = arcPt(d0, rr), [x1, y1] = arcPt(d1, rr);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${rr} ${rr} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const leverY = lerp(GY + 334, GY + 86, v);
  const gears: [string, number][] = [['SCROLL', 1], ['READ', 0.4], ['LOCK SCREEN', 0]];
  const battC = mix(GREEN, RED, clamp01(r * 1.1));
  const blinkP = mode === 'one' ? 30 : mode === 'lower' ? 6 : 1;
  const blink = Math.exp(-((t % blinkP) / blinkP) * 3);

  return (
    <svg width={1080} height={1920} style={{overflow: 'visible'}}>
      <defs>
        <clipPath id={`${id}-clip`}><rect width={SW} height={SH} rx={62} /></clipPath>
        <clipPath id={`${id}-body`}><rect x={PX} y={PY} width={PW} height={PH} rx={78} /></clipPath>
        <radialGradient id={`${id}-pool`}><stop offset="0" stopColor="#B79CFF" stopOpacity="0.6" /><stop offset="0.55" stopColor="#5B3FB8" stopOpacity="0.2" /><stop offset="1" stopColor="#5B3FB8" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-warm`}><stop offset="0" stopColor="#FFD9A8" stopOpacity="0.5" /><stop offset="1" stopColor="#FFD9A8" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-aod`}><stop offset="0" stopColor="#3A2F6B" stopOpacity="0.8" /><stop offset="1" stopColor="#3A2F6B" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-ti`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F3EEE6" /><stop offset="0.25" stopColor="#8E877E" /><stop offset="0.5" stopColor="#E9E2D6" /><stop offset="0.75" stopColor="#6E675F" /><stop offset="1" stopColor="#CFC6B8" /></linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A2148" /><stop offset="1" stopColor="#07060D" /></linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-console`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2E2650" /><stop offset="0.5" stopColor="#171230" /><stop offset="1" stopColor="#221B40" /></linearGradient>
        <linearGradient id={`${id}-gauge`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={GREEN} /><stop offset="0.55" stopColor={AMBER} /><stop offset="1" stopColor={RED} /></linearGradient>
        <linearGradient id={`${id}-strip`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.5" stopColor="#FFF1DC" stopOpacity="0.9" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-glint`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.85" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${id}-knob`} cx="36%" cy="30%" r="75%"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor={GOLD} /><stop offset="1" stopColor="#7A5A22" /></radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0CC" /><stop offset="0.5" stopColor={GOLD} /><stop offset="1" stopColor="#B8873C" /></linearGradient>
      </defs>

      {/* ---------------- studio: wall seams, softboxes, light pools, glossy floor ---------------- */}
      {Array.from({length: 11}).map((_, i) => <line key={i} x1={-360 + i * 180} x2={-360 + i * 180} y1={-300} y2={1716} stroke="#C9B6FF" strokeWidth={2} opacity={0.06} />)}
      <ellipse cx={330} cy={1060} rx={760} ry={900} fill={`url(#${id}-pool)`} />
      <ellipse cx={850} cy={900} rx={520} ry={700} fill={`url(#${id}-warm)`} opacity={0.5 + 0.2 * r} />
      {[8, 1050].map((x0) => <g key={x0}><rect x={x0 - 26} y={440} width={74} height={1280} fill={`url(#${id}-strip)`} opacity={0.12} /><rect x={x0} y={470} width={22} height={1230} rx={11} fill={`url(#${id}-strip)`} opacity={0.9} /></g>)}
      <rect x={-400} y={1716} width={1880} height={600} fill={`url(#${id}-floor)`} />
      <rect x={-400} y={1716} width={1880} height={3} fill="#E4D8FF" opacity={0.5} />
      {/* reflections on the floor */}
      <rect x={PX + 20} y={1722} width={PW - 40} height={190} rx={40} fill={aLock > 0.5 ? '#2B2450' : '#D9D0F5'} opacity={0.14} />
      <rect x={CX0 + 16} y={1722} width={CW - 32} height={170} rx={30} fill="#FFD9A8" opacity={0.07} />
      {/* plinth */}
      <ellipse cx={PX + PW / 2} cy={1700} rx={330} ry={34} fill="#0A0814" />
      <ellipse cx={PX + PW / 2} cy={1692} rx={330} ry={34} fill="#2F2752" stroke="#8D7FD0" strokeWidth={2.5} />
      <ellipse cx={PX + PW / 2} cy={1690} rx={270} ry={24} fill={LAV} opacity={0.14 + 0.2 * rimGlow} />

      {/* ---------------- the phone ---------------- */}
      <rect x={PX - 18} y={PY - 18} width={PW + 36} height={PH + 36} rx={96} fill="none" stroke={LAV} strokeWidth={22} opacity={0.22 * rimGlow} />
      <rect x={PX + 12} y={PY + 8} width={PW} height={PH} rx={78} fill="#05040A" />
      <rect x={PX + PW - 2} y={PY + 250} width={14} height={86} rx={5} fill="#8E877E" /><rect x={PX + PW - 2} y={PY + 370} width={14} height={150} rx={5} fill="#8E877E" />
      <rect x={PX} y={PY} width={PW} height={PH} rx={78} fill="#0A0A0F" stroke={`url(#${id}-ti)`} strokeWidth={9} />
      <rect x={PX + 6} y={PY + 6} width={PW - 12} height={PH - 12} rx={72} fill="none" stroke="#000" strokeWidth={3} />
      <g transform={`translate(${SX},${SY})`} clipPath={`url(#${id}-clip)`}>
        {aArt < 0.99 ? <Feed s={scroll} v={fv} /> : null}
        {aArt > 0.01 && aLock < 0.99 ? <g opacity={aArt} transform={`translate(0,${(1 - aArt) * 60 - Math.max(0, t - tSlower) * 0.25})`}><Article t={t} t0={tRead} mark={sp(t, tRead, 'settle')} /></g> : null}
        {aLock > 0.01 ? <g opacity={aLock}><Lock t={t} lock={sp(t, tLock, 'bouncy')} screen={flash(t, tScreen, 10)} /></g> : null}
        {/* finger swipe while scrolling */}
        {t > t120 - 6 && t < tSlower + 4 ? (() => {
          const ph = ((t - t120 + 6) % 22) / 22, a = Math.sin(ph * Math.PI) * (1 - aArt);
          return <g opacity={a}><circle cx={SW * 0.62} cy={lerp(820, 420, ph)} r={46} fill="#7B5CFF" opacity={0.28} /><circle cx={SW * 0.62} cy={lerp(820, 420, ph)} r={26} fill="#7B5CFF" opacity={0.6} /><rect x={SW * 0.62 - 5} y={lerp(820, 420, ph) + 30} width={10} height={110 * (1 - ph)} rx={5} fill="#7B5CFF" opacity={0.35} /></g>;
        })() : null}
        {/* LTPO backplane shimmer: the thin-film grid under the pixels */}
        {t > tLtpo && t < tLtpo + 34 ? (
          <g opacity={flash(t, tLtpo, 12)}>
            {Array.from({length: 13}).map((_, i) => <line key={`a${i}`} x1={i * 41.5} x2={i * 41.5} y1={0} y2={SH} stroke={GOLD} strokeWidth={2} opacity={0.7} />)}
            {Array.from({length: 27}).map((_, i) => <line key={`b${i}`} y1={i * 41.5} y2={i * 41.5} x1={0} x2={SW} stroke={GOLD} strokeWidth={2} opacity={0.7} />)}
            <rect y={((t - tLtpo) / 20) * SH - 90} width={SW} height={90} fill={GOLD} opacity={0.35} />
          </g>
        ) : null}
        {/* status bar + refresh chip */}
        <rect x={SW / 2 - 16} y={26} width={32} height={32} rx={16} fill="#000" />
        <g transform={`translate(${SW / 2},${92})`}>
          <rect x={-104} y={-23} width={208} height={46} rx={23} fill="#0B0914" stroke={mode === 'one' ? GOLD : mode === 'max' ? RED : AMBER} strokeWidth={2.5} opacity={0.94} />
          <circle cx={-78} cy={0} r={8} fill={mode === 'one' ? GOLD : mode === 'max' ? RED : AMBER} opacity={0.35 + 0.65 * blink} />
          {mode === 'lower' ? <g transform="translate(-44,0)"><ArrowDown s={0.55} c={AMBER} /></g> : null}
          <text x={mode === 'lower' ? 24 : 12} y={9} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={25} fill="#FFFFFF" letterSpacing={2}>{mode === 'one' ? '1 Hz' : mode === 'max' ? '120 Hz' : mode === 'lower' ? 'LOWER' : 'SHIFTING'}</text>
        </g>
        {/* glass reflection */}
        <path d={`M0,0 H${SW * 0.52} L${SW * 0.12},${SH * 0.56} H0 Z`} fill="#FFFFFF" opacity={0.05} />
      </g>
      {/* "cheat" glint sweeping the whole phone */}
      {t > tCheat && cheat < 1 ? <g clipPath={`url(#${id}-body)`}><rect x={PX - 260 + cheat * (PW + 420)} y={PY - 100} width={200} height={PH + 200} fill={`url(#${id}-glint)`} transform={`skewX(-18)`} style={{transformOrigin: `${PX + PW / 2}px ${PY + PH / 2}px`}} opacity={0.9} /></g> : null}
      {t > tCheat && t - tCheat < 22 ? (() => {
        const qq = (t - tCheat) / 22, s = Math.sin(qq * Math.PI) * 1.5;
        return <g transform={`translate(${PX + PW - 30},${PY + 60}) scale(${s}) rotate(${qq * 90})`}><path d="M0,-60 L10,-10 L60,0 L10,10 L0,60 L-10,10 L-60,0 L-10,-10 Z" fill="#FFFFFF" /><circle r={46} fill={GOLD} opacity={0.35} /></g>;
      })() : null}
      {/* LTPO chip on the panel */}
      {ltpo > 0.01 ? (
        <g transform={`translate(${PX + PW / 2},${PY + PH - 170}) scale(${0.5 + 0.5 * ltpo})`} opacity={clamp01(ltpo * 1.5)}>
          <rect x={-168} y={-52} width={346} height={116} rx={30} fill="#000" opacity={0.45} />
          <rect x={-173} y={-58} width={346} height={116} rx={30} fill={`url(#${id}-gold)`} stroke="#FFF6E0" strokeWidth={3} />
          <rect x={-168} y={-54} width={336} height={46} rx={26} fill="#FFFFFF" opacity={0.35} />
          {[-1, 1].map((s) => [0, 1, 2].map((j) => <rect key={`${s}${j}`} x={s > 0 ? 173 : -187} y={-34 + j * 28} width={14} height={12} rx={3} fill="#B8873C" />))}
          <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={66} fill={INK} letterSpacing={6}>LTPO</text>
          <text x={0} y={42} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={17} fill="#5A4318" letterSpacing={3}>VARIABLE-REFRESH PANEL</text>
        </g>
      ) : null}
      {t > tLtpo && t - tLtpo < 16 ? <rect x={PX + PW / 2 - 173 - (t - tLtpo) * 4} y={PY + PH - 228 - (t - tLtpo) * 3} width={346 + (t - tLtpo) * 8} height={116 + (t - tLtpo) * 6} rx={40} fill="none" stroke={GOLD} strokeWidth={6} opacity={1 - (t - tLtpo) / 16} /> : null}

      {/* ---------------- instrument console ---------------- */}
      <rect x={CX0 + 10} y={PY + 10} width={CW} height={PH} rx={46} fill="#05040A" />
      <rect x={CX0} y={PY} width={CW} height={PH} rx={46} fill={`url(#${id}-console)`} stroke="#6D5FB0" strokeWidth={3} />
      <rect x={CX0 + 3} y={PY + 3} width={CW - 6} height={120} rx={44} fill={`url(#${id}-gloss)`} opacity={0.35} />
      {[[CX0 + 30, PY + 30], [CX0 + CW - 30, PY + 30], [CX0 + 30, PY + PH - 30], [CX0 + CW - 30, PY + PH - 30]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={9} fill="#0B0914" stroke="#8D7FD0" strokeWidth={2} /><line x1={x - 5} y1={y - 3} x2={x + 5} y2={y + 3} stroke="#8D7FD0" strokeWidth={2} /></g>)}
      <text x={DX} y={PY + 44} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={22} fill={LAV} letterSpacing={6}>REFRESH RATE</text>

      {/* dial */}
      <circle cx={DX} cy={DY} r={DR + 16} fill={`url(#${id}-ti)`} />
      <circle cx={DX} cy={DY} r={DR + 4} fill="#07060D" />
      <circle cx={DX} cy={DY} r={DR} fill={PANEL} />
      <circle cx={DX} cy={DY} r={DR + 30 + 30 * (1 - flash(t, tRefresh, 6))} fill="none" stroke={RED} strokeWidth={6} opacity={0.8 * flash(t, tRefresh, 6)} />
      <path d={arc(150, 390, DR - 26)} fill="none" stroke="#2C2550" strokeWidth={24} strokeLinecap="round" />
      <path d={arc(150, 150 + Math.max(1, 240 * v), DR - 26)} fill="none" stroke={mix(GREEN, RED, v)} strokeWidth={24} strokeLinecap="round" />
      <path d={arc(150, 150 + Math.max(1, 240 * v), DR - 26)} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
      {Array.from({length: 25}).map((_, i) => {
        const d = 150 + i * 10, [x0, y0] = arcPt(d, DR - 50), [x1, y1] = arcPt(d, DR - (i % 6 === 0 ? 76 : 64));
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={i / 24 <= v + 0.01 ? '#FFFFFF' : '#6C6590'} strokeWidth={i % 6 === 0 ? 5 : 2.5} strokeLinecap="round" />;
      })}
      <text x={DX - 74} y={DY + 128} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={v < 0.05 ? GOLD : '#A59DC6'}>1</text>
      <text x={DX + 74} y={DY + 128} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={26} fill={v > 0.95 ? '#FF9A94' : '#A59DC6'}>120</text>
      {/* needle */}
      <line x1={DX - Math.cos(nA) * 26} y1={DY - Math.sin(nA) * 26} x2={DX + Math.cos(nA) * (DR - 44)} y2={DY + Math.sin(nA) * (DR - 44)} stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
      <line x1={DX} y1={DY} x2={DX + Math.cos(nA) * (DR - 44)} y2={DY + Math.sin(nA) * (DR - 44)} stroke={mix(GREEN, RED, v)} strokeWidth={3} strokeLinecap="round" />
      <circle cx={DX} cy={DY} r={64} fill="#07060D" stroke={`url(#${id}-ti)`} strokeWidth={5} />
      {mode === 'max' || mode === 'one' ? (
        <g transform={`translate(${DX},${DY}) scale(${1 + 0.18 * Math.max(flash(t, t120, 6), flash(t, t1, 6), flash(t, tHz, 6))})`}>
          <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={mode === 'one' ? 62 : 50} fill={mode === 'one' ? GOLD : '#FFFFFF'} letterSpacing={-1}>{mode === 'one' ? '1' : '120'}</text>
          <text x={0} y={40} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={20} fill={mode === 'one' ? GOLD : '#FF9A94'} letterSpacing={3}>Hz</text>
        </g>
      ) : mode === 'lower' ? (
        <g transform={`translate(${DX},${DY - 4 + 5 * Math.sin(t / 5)}) scale(${1 + 0.2 * flash(t, tSlower, 6)})`}><ArrowDown s={1.25} c={AMBER} /></g>
      ) : (
        <g transform={`translate(${DX},${DY})`}>
          <path d="M-18,-6 L0,-26 L18,-6 M-18,6 L0,26 L18,6" fill="none" stroke={LAV} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      <path d={`M${DX - 120},${DY - 96} A150,150 0 0 1 ${DX + 60},${DY - 142}`} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.1} />

      {/* battery */}
      <text x={CX0 + 40} y={BY - 14} fontFamily={MONO} fontWeight={600} fontSize={20} fill={LAV} letterSpacing={5}>BATTERY</text>
      <g transform={`translate(${CX0 + 36},${BY})`}>
        <rect x={-10} y={-10} width={324} height={150} rx={34} fill="none" stroke={RED} strokeWidth={10} opacity={0.75 * Math.max(flash(t, tDrains, 8), flash(t, tBatt, 8))} />
        <rect x={304} y={40} width={26} height={50} rx={9} fill={`url(#${id}-ti)`} />
        <rect width={304} height={130} rx={28} fill="#07060D" stroke={`url(#${id}-ti)`} strokeWidth={7} />
        {Array.from({length: 10}).map((_, i) => {
          const f = clamp01(level * 10 - i);
          return <g key={i}><rect x={14 + i * 27.8} y={14} width={23} height={102} rx={7} fill="#1D1838" />{f > 0.01 ? <rect x={14 + i * 27.8} y={14 + 102 * (1 - f) * 0} width={23 * f} height={102} rx={7} fill={battC} /> : null}</g>;
        })}
        <rect x={10} y={10} width={284} height={44} rx={20} fill="#FFFFFF" opacity={0.12} />
        <path d="M158,22 L132,70 H152 L144,108 L176,58 H154 Z" fill="#FFFFFF" opacity={0.92} stroke="#07060D" strokeWidth={3} strokeLinejoin="round" />
        {/* charge leaving the battery */}
        {Array.from({length: 7}).map((_, i) => {
          const sp2 = 0.01 + 0.05 * r, ph = (t * sp2 + rnd(i * 5.1)) % 1;
          if (i >= 1 + r * 6) return null;
          return <circle key={i} cx={14 + level * 276 + ph * 70} cy={30 + rnd(i * 2.7) * 70 - ph * 50} r={7 * (1 - ph)} fill={battC} opacity={(1 - ph) * 0.9} />;
        })}
      </g>
      {/* drain meter */}
      <g transform={`translate(${CX0 + 36},${BY + 162})`}>
        <text x={0} y={22} fontFamily={MONO} fontWeight={600} fontSize={20} fill="#A59DC6" letterSpacing={4}>DRAIN</text>
        {Array.from({length: 9}).map((_, i) => {
          const on = i < Math.max(1, Math.round(r * 9));
          const mv = on ? ((t * (0.25 + 1.4 * r)) % 16) - 8 : 0;
          return <path key={i} d={`M${104 + i * 26 + mv * 0.3},4 l12,11 l-12,11`} fill="none" stroke={on ? battC : '#3A3360'} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={on ? 0.55 + 0.45 * Math.sin((t * (0.2 + r) - i) * 0.9) ** 2 : 1} />;
        })}
      </g>

      {/* gear gate */}
      <g>
        <rect x={CX0 + 24} y={GY + 14} width={CW - 48} height={370} rx={34} fill="#0C0A18" stroke="#4B4180" strokeWidth={3} />
        <rect x={CX0 + 27} y={GY + 17} width={CW - 54} height={60} rx={30} fill={`url(#${id}-gloss)`} opacity={0.2} />
        <text x={CX0 + 48} y={GY + 52} fontFamily={MONO} fontWeight={600} fontSize={22} fill={LAV} letterSpacing={5}>AUTO GEARS</text>
        <rect x={CX0 + 70} y={GY + 72} width={28} height={278} rx={14} fill="#020106" stroke="#6D5FB0" strokeWidth={2.5} />
        {gears.map(([name, gv]) => {
          const y = lerp(GY + 334, GY + 86, gv), on = clamp01(1 - Math.abs(v - gv) / 0.12);
          const c = gv === 1 ? RED : gv === 0 ? GOLD : AMBER;
          return (
            <g key={name}>
              <line x1={CX0 + 98} x2={CX0 + 134} y1={y} y2={y} stroke={on > 0.5 ? c : '#4B4180'} strokeWidth={4} />
              <rect x={CX0 + 134} y={y - 29} width={228} height={58} rx={18} fill={on > 0.5 ? c : '#1B1634'} stroke={on > 0.5 ? '#FFFFFF' : '#4B4180'} strokeWidth={2.5} opacity={0.75 + 0.25 * on} />
              <text x={CX0 + 248} y={y + 8} textAnchor="middle" fontFamily={MONO} fontWeight={600} fontSize={name.length > 8 ? 24 : 28} fill={on > 0.5 ? INK : '#8C86A6'} letterSpacing={2}>{name}</text>
            </g>
          );
        })}
        {/* the lever */}
        <rect x={CX0 + 78} y={leverY} width={12} height={GY + 350 - leverY} rx={6} fill="#6D5FB0" opacity={0.5} />
        <circle cx={CX0 + 84} cy={leverY} r={52} fill={GOLD} opacity={0.18 + 0.3 * Math.max(flash(t, tShift, 7), flash(t, tSpeed, 7), flash(t, tFly, 7), flash(t, t120, 7), flash(t, tSlower, 7), flash(t, t1, 7))} />
        <circle cx={CX0 + 88} cy={leverY + 6} r={34} fill="#000" opacity={0.5} />
        <circle cx={CX0 + 84} cy={leverY} r={34} fill={`url(#${id}-knob)`} stroke="#FFF6E0" strokeWidth={2.5} />
        <ellipse cx={CX0 + 74} cy={leverY - 12} rx={12} ry={7} fill="#FFFFFF" opacity={0.8} />
      </g>
      {/* feed lines: console -> phone */}
      <path d={`M${CX0},${BY + 65} H${PX + PW + 14}`} stroke={battC} strokeWidth={6} strokeDasharray="10 12" strokeDashoffset={t * (0.6 + 5 * r)} opacity={0.85} />
      <circle cx={PX + PW + 12} cy={BY + 65} r={8} fill={battC} />
    </svg>
  );
};

export const S06: WorldDef = {
  id: 'gearbox', home: 'phone',
  anchors: {
    phone: {x: 540, y: 1018, zoom: 1},
    lock: {x: 500, y: 1085, zoom: 1.1},
  },
  aliases: {screens: 'phone'},
  palette: {bg0: '#07060D', bg1: '#2B2247', particles: '#E8D9FF', glow: '#B79CFF'},
  Draw,
};
