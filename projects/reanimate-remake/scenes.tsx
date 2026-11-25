// reanimate-remake v2 - real brand logos (Simple Icons), real repo screenshots (capture.py), fluid camera drift,
// light sweeps, floating and particles. Rendered 1080x1920 @ 60 fps (design units: 720x1280 @ 30).
// Every element enters on a word cue (spec.cues['w:<word>'] / ['i:<n>'], design frames from the scene start).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {siClaude, siCss, siFramer, siGithub, siGooglechrome, siGreensock, siLottiefiles, siNextdotjs, siReact, siStripe,
  siTurborepo, siVercel} from 'simple-icons';
import type {Palette, SceneProps} from '../../src/kit/types';
import {Card, Counter, Glyph, LineChart, Pill, Stepper, Strike, Terminal, Tick, TypeOn, Window} from '../../src/kit/ui';
import {Camera, CompareSlider, Float, Logo, LogoTile, MaskReveal, Particles, Shine, Shot, Tilt3D, Underline, springTo} from '../../src/kit/fx';
import {EASE, clamp01, enter, map, pop, prog, rand, springAt} from '../../src/kit/motion';
import {MONO, SANS} from '../../src/kit/fonts';

const IMG = (n: string) => `reanimate-remake/img/${n}.png`;
const URL = 'github.com/NiazMorshed2007/reanimate';
const cueOf = (spec: SceneProps['spec']) => (k: string, fb = 0) => (spec.cues ?? {})[k] ?? fb;
const CORAL = '#E8675A';
const GOLD = '#E8B04A';
const txt = (pal: Palette, size: number, weight = 500, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: SANS, fontSize: size, fontWeight: weight, color: pal.fg, ...extra,
});

// ---------------------------------------------------------------- S01 hook: the skill (GitHub + Claude marks)
const S01: React.FC<SceneProps> = ({t, dur, fps, spec, theme, pal, W}) => {
  const c = cueOf(spec);
  return (
    <Camera t={t} dur={dur} push={0.06}>
      <Window t={t} at={0} pal={pal} x={36} y={380} w={W - 72} h={410} title={URL} fps={fps}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, ...txt(pal, 33, 700)}}>
          <Logo icon={siGithub} size={42} color="#fff" />
          <span style={{color: pal.mute, fontWeight: 500}}>NiazMorshed2007 /</span>
        </div>
        <div style={{...txt(pal, 52, 800), letterSpacing: -1.5, marginTop: 6}}>reanimate</div>
        <div style={{...txt(pal, 22, 400), color: pal.mute, marginTop: 10, lineHeight: 1.4}}>
          A Claude Code skill that reverse-engineers any animation frame by frame.
        </div>
        <div style={{display: 'flex', gap: 12, marginTop: 22}}>
          {[['eye', 'Watch  9'], ['code', 'Fork  212'], ['star', 'Star  2.4k']].map(([g, l], i) => (
            <span key={l} style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10,
                                  border: `1.5px solid ${pal.cardBorder}`, ...txt(pal, 19, 600), ...enter(t, 6 + i * 3)}}>
              <Glyph name={g as 'eye'} size={20} color={i === 2 ? GOLD : pal.mute} fill={i === 2 && t > c('w:skill', 37)} />{l}
            </span>
          ))}
        </div>
        <Shine t={t} at={c('w:skill', 37) - 6} />
      </Window>
      <div style={{position: 'absolute', left: W - 200, top: 344, transform: 'rotate(8deg)'}}>
        <Pill text="FREE" t={t} at={c('w:free', 9)} fps={fps} bg={theme.accent} fg="#fff" size={32} icon="sparkle" />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 840, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
        <LogoTile icon={siClaude} t={t} at={c('w:claude', 18)} fps={fps} size={100} bg="#1E1E1E" />
        <div style={{...txt(pal, 34, 700), ...enter(t, c('w:code', 28))}}>Claude Code <span style={{color: pal.mute, fontWeight: 500}}>skill</span></div>
      </div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S02: any animation online - live tiles + real site marks
const MiniAnim: React.FC<{kind: number; t: number; color: string; size: number}> = ({kind, t, color, size}) => {
  if (kind === 0) return <div style={{width: size * 0.46, height: size * 0.46, borderRadius: 99, border: `4px solid ${color}44`,
                                       borderTopColor: color, transform: `rotate(${t * 12}deg)`}} />;
  if (kind === 1) {
    const ph = (t % 40) / 40;
    const x = EASE.inOut(clamp01(ph < 0.5 ? ph * 4 : (1 - ph) * 4));
    return <div style={{width: size * 0.6, height: size * 0.32, borderRadius: 99, background: x > 0.5 ? color : `${color}33`, position: 'relative'}}>
      <div style={{position: 'absolute', top: 3, left: 3 + x * (size * 0.6 - size * 0.32), width: size * 0.32 - 6, height: size * 0.32 - 6, borderRadius: 99, background: '#fff'}} />
    </div>;
  }
  return <div style={{display: 'flex', gap: 4}}>{[0, 1, 2].map((i) => (
    <div key={i} style={{width: size * 0.11, height: size * 0.11, borderRadius: 9, background: color,
                         transform: `translateY(${-Math.abs(Math.sin((t - i * 4) / 7)) * size * 0.15}px)`}} />))}</div>;
};

const S02: React.FC<SceneProps> = ({t, dur, fps, spec, theme, pal, W}) => {
  const c = cueOf(spec);
  const brands = [siStripe, siVercel, siFramer, siNextdotjs, siReact, siTurborepo];
  const brandCells: Record<number, number> = {1: 0, 3: 1, 9: 2, 15: 3, 21: 4, 23: 5};
  const cols = 5, rows = 5, tile = 104, gap = 16;
  const gx = (W - (cols * tile + (cols - 1) * gap)) / 2, gy = 350;
  const colors = ['#4F8CFF', theme.accent, CORAL, GOLD, '#9B6BFF', '#2EC4B6'];
  const cells = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const i = r * cols + k;
    // ripple out from the centre over ~20 frames (a grid appearing at once reads as a hard cut)
    const s = springAt(t, 4 + Math.hypot(k - 2, r - 2) * 7, fps, {damping: 14, stiffness: 140, mass: 0.7});
    const col = colors[Math.floor(rand(i + 5) * colors.length)];
    const b = brandCells[i];
    cells.push(
      <div key={i} style={{position: 'absolute', left: gx + k * (tile + gap), top: gy + r * (tile + gap), width: tile, height: tile,
                           borderRadius: 24, background: b !== undefined ? '#F4F4F0' : pal.card, border: `1.5px solid ${pal.cardBorder}`,
                           display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: clamp01(s * 1.4),
                           transform: `scale(${0.4 + 0.6 * s}) translateY(${Math.sin((t + i * 9) / 30) * 3}px)`}}>
        {b !== undefined ? <Logo icon={brands[b]} size={tile * 0.48} color={brands[b].hex === '000000' ? '#111' : 'brand'} />
          : <MiniAnim kind={Math.floor(rand(i + 17) * 3)} t={t + i * 3} color={col} size={tile} />}
      </div>,
    );
  }
  const shrink = map(t, [-6, 14], [1, 0], EASE.inOut);
  return (
    <Camera t={t} dur={dur} push={0.05} drift={[0, -10]}>
      {cells}
      <div style={{position: 'absolute', left: 0, right: 0, top: 990, display: 'flex', justifyContent: 'center'}}>
        <Pill text="any site · any app" t={t} at={c('w:online', 51)} fps={fps} bg={pal.card} fg={pal.fg} size={24} icon="link"
              style={{border: `1.5px solid ${pal.cardBorder}`}} />
      </div>
      <div style={{position: 'absolute', left: 48, top: 430, width: W - 96, height: 340, borderRadius: 22, background: pal.card,
                   border: `1.5px solid ${pal.cardBorder}`, opacity: shrink, transform: `translateY(${(1 - shrink) * -260}px) scale(${0.4 + 0.6 * shrink})`}} />
    </Camera>
  );
};

// ---------------------------------------------------------------- S03: frame by frame - film strip of the real stripe card
const S03: React.FC<SceneProps> = ({t, dur, pal}) => {
  const n = 7, fw = 190, gap = 22;
  const x0 = 80 - map(t, [0, 45], [0, 300], EASE.linear);
  return (
    <Camera t={t} dur={dur} push={0.04} drift={[-10, 0]}>
      <div style={{position: 'absolute', top: 450, left: x0, height: 330, width: n * (fw + gap) + 60, background: '#000',
                   borderRadius: 14, border: '1.5px solid #222'}}>
        {[0, 1].map((row) => (
          <div key={row} style={{position: 'absolute', left: 0, right: 0, top: row ? 300 : 8, display: 'flex', gap: 18, paddingLeft: 14}}>
            {Array.from({length: 30}).map((_, i) => <div key={i} style={{width: 16, height: 14, borderRadius: 3, background: '#2a2a2a'}} />)}
          </div>
        ))}
        {Array.from({length: n}).map((_, i) => {
          const p = EASE.out(i / (n - 1));
          return (
            <div key={i} style={{position: 'absolute', top: 36, left: 30 + i * (fw + gap), width: fw, height: 256, borderRadius: 8,
                                 background: '#fff', border: '1.5px solid #3A3D44', overflow: 'hidden', ...enter(t, i * 2, 8, 10, 4)}}>
              {/* the real stripe.com card (left half of the README's hover comparison), entering frame by frame */}
              <Img src={staticFile(IMG('hover_light'))} style={{position: 'absolute', width: fw * 2.05, left: -8,
                    top: -26 + (1 - p) * 70, opacity: 0.2 + 0.8 * p}} />
              <div style={{position: 'absolute', left: 8, top: 6, fontFamily: MONO, fontSize: 15, color: '#555',
                           background: '#ffffffcc', padding: '0 5px', borderRadius: 4}}>f{(i + 1) * 4}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 830, textAlign: 'center', ...txt(pal, 22, 500), color: pal.mute,
                   ...enter(t, 10)}}>every frame measured</div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S04: proves the copy moves the same - real README comparison
const S04: React.FC<SceneProps> = ({t, dur, fps, spec, theme, pal}) => {
  const c = cueOf(spec);
  const same = c('w:same', 51), proves = c('w:proves', 15), copy = c('w:copy', 29);
  // one pointer path drives BOTH cards: identical tilt = "moves the same" (README: the tilt settles within 0.4 px)
  const path = [{at: 4, x: 0.7, y: -0.5}, {at: 22, x: -0.7, y: 0.35}, {at: 38, x: 0.45, y: 0.55}, {at: same - 4, x: 0, y: 0}];
  const cw = 300, ch = cw * (830 / 496);
  const card = (src: string, label: string, sub: string, x: number, at: number) => (
    <div style={{position: 'absolute', left: x, top: 345, width: cw, ...enter(t, at, 12, 30, 10)}}>
      <div style={{...txt(pal, 19, 700), marginBottom: 12}}>{label} <span style={{color: pal.mute, fontWeight: 500}}>· {sub}</span></div>
      <Tilt3D t={t} fps={fps} path={path} max={13} radius={18}>
        <Img src={staticFile(IMG(src))} style={{width: cw, height: ch, display: 'block', borderRadius: 18}} />
      </Tilt3D>
    </div>
  );
  return (
    <Camera t={t} dur={dur} push={0.03} drift={[0, -8]}>
      {card('orig_panel', 'stripe.com', 'original', 44, 0)}
      {card('copy_panel', 'reanimate', 'copy', 376, Math.min(copy - 8, proves + 4))}
      <div style={{position: 'absolute', left: 344, top: 345 + 40 + ch / 2 - 24, width: 32, height: 48, display: 'flex',
                   alignItems: 'center', justifyContent: 'center', ...pop(t, proves, fps)}}>
        <Glyph name="arrow" size={30} color={pal.mute} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 345 + 40 + ch + 28, display: 'flex', justifyContent: 'center', gap: 14}}>
        <div style={{...pop(t, same - 2, fps), padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${pal.cardBorder}`,
                     ...txt(pal, 22, 700), fontFamily: MONO, color: GOLD}}>Δ 0.4 px</div>
        <Pill text="MOVES THE SAME" t={t} at={same + 2} fps={fps} bg={theme.accent} fg="#fff" size={24} icon="check" />
      </div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S05: stars (GitHub mark, counter, particles)
const S05: React.FC<SceneProps> = ({t, dur, fps, spec, pal, W}) => {
  const c = cueOf(spec);
  const land = c('w:2.4k', 32) + 6;
  const pts = Array.from({length: 24}, (_, i) => Math.pow(i / 23, 2.4) * 0.92 + 0.04 + rand(i) * 0.03);
  return (
    <Camera t={t} dur={dur} push={0.05}>
      <Particles t={t} n={26} w={W} h={1280} color={GOLD} seed={5} size={4} />
      <Float t={t} amp={5} period={80}>
        <Card t={t} at={0} pal={pal} x={90} y={420} w={W - 180} h={390} pad={30}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, ...txt(pal, 22, 500), color: pal.mute}}>
            <Logo icon={siGithub} size={28} color="#fff" /> GitHub stars
            <span style={{marginLeft: 'auto'}}><Glyph name="star" size={26} color={GOLD} fill /></span>
          </div>
          <div style={{...txt(pal, 132, 800), letterSpacing: -4, marginTop: 6, lineHeight: 1}}>
            <Counter t={t} at={2} dur={land - 2} from={0} to={2.4} decimals={1} grouping={false} />
            <span style={{color: pal.mute}}>K</span>
          </div>
          <LineChart t={t} at={4} dur={land + 10} points={pts} color={GOLD} x={30} y={210} w={W - 240} h={140} />
          <Shine t={t} at={c('w:stars', 59) - 4} strength={0.18} />
        </Card>
      </Float>
    </Camera>
  );
};

// ---------------------------------------------------------------- S06 (light act): it's called reanimate - real README hero
const S06: React.FC<SceneProps> = ({t, dur, fps, spec, pal, theme, W}) => {
  const c = cueOf(spec);
  const w = W - 80;
  return (
    <Camera t={t} dur={dur} push={0.05}>
      <Shot src={IMG('hero_light')} aspect={348 / 1820} t={t} at={2} x={40} y={400} w={w} h={w * (348 / 1820) * 1.6 + 38} url={URL}
            focus={[{at: -30, x: 0.5, y: 0.3, scale: 1.7}, {at: c('w:reanimate', 20), x: 0.5, y: 0.6, scale: 1.6}]} />
      <div style={{position: 'absolute', left: 40, top: 400 + w * (348 / 1820) * 1.6 + 80, width: w, display: 'flex', gap: 14,
                   justifyContent: 'center'}}>
        <LogoTile icon={siGithub} t={t} at={c('w:called', 11)} fps={fps} size={80} bg="#fff" color="#181717" />
        <LogoTile icon={siClaude} t={t} at={c('w:reanimate', 20)} fps={fps} size={80} bg="#fff" />
        <div style={{...pop(t, c('w:reanimate', 20) + 4, fps), alignSelf: 'center', ...txt(pal, 22, 700)}}>MIT · free</div>
      </div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S07: inputs light up on their words (Chrome, Lottie marks)
const S07: React.FC<SceneProps> = ({t, dur, fps, spec, theme, pal}) => {
  const c = cueOf(spec);
  const items: [string, React.ReactNode, number][] = [
    ['Live site', <Logo key="c" icon={siGooglechrome} size={38} />, c('w:site', 35)],
    ['Screen recording', <Glyph key="f" name="film" size={36} color={CORAL} />, c('w:recording', 66)],
    ['GIF', <span key="g" style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, color: '#9B6BFF'}}>GIF</span>, c('w:gif', 92)],
    ['Lottie file', <Logo key="l" icon={siLottiefiles} size={38} />, c('w:lottie', 112)],
  ];
  return (
    <Camera t={t} dur={dur} push={0.035} drift={[0, -12]}>
      {items.map(([label, icon, at], i) => {
        const on = prog(t, at, 6);
        const x = 40 + (i % 2) * 330, y = 340 + Math.floor(i / 2) * 330;
        return (
          <Float key={label} t={t} amp={4} period={70} phase={i * 17}>
            <Card t={t} at={2 + i * 3} pal={pal} x={x} y={y} w={310} h={305} pad={30}
                  style={{border: `2px solid ${on > 0 ? CORAL : pal.cardBorder}`, boxShadow: `0 0 0 ${on * 5}px ${CORAL}22, 0 14px 40px rgba(0,0,0,0.10)`,
                          transform: `scale(${1 + 0.04 * Math.sin(clamp01((t - at) / 10) * Math.PI)})`}}>
              <div style={{width: 92, height: 92, borderRadius: 24, background: on > 0 ? `${CORAL}18` : '#EFEFE9', display: 'flex',
                           alignItems: 'center', justifyContent: 'center', transform: 'scale(1.3)', transformOrigin: 'left top'}}>{icon}</div>
              <div style={{...txt(pal, 31, 700), marginTop: 70}}>{label}</div>
              <div style={{position: 'absolute', right: 20, top: 20}}>{t >= at ? <Tick t={t} at={at} fps={fps} color={theme.accent} size={34} /> : null}</div>
              <Shine t={t} at={at} strength={0.5} />
            </Card>
          </Float>
        );
      })}
    </Camera>
  );
};

// ---------------------------------------------------------------- S08: records in a headless browser - real "How it works", step 1
const S08: React.FC<SceneProps> = ({t, dur, fps, spec, pal, W}) => {
  const c = cueOf(spec);
  const rec = c('w:records', 15);
  const blink = Math.floor(t / 10) % 2 === 0 ? 1 : 0.35;
  const w = W - 70;
  return (
    <Camera t={t} dur={dur} push={0.04}>
      <Shot src={IMG('howitworks_light')} aspect={660 / 1720} t={t} x={35} y={380} w={w} h={w * (660 / 1720) + 38} url={`${URL} · How it works`}
            focus={[{at: rec - 2, x: 0.3, y: 0.3, scale: 1.55}]} />
      <div style={{position: 'absolute', left: 50, top: 720, display: 'flex', alignItems: 'center', gap: 14}}>
        <LogoTile icon={siGooglechrome} t={t} at={c('w:headless', 50)} fps={fps} size={76} />
        <div style={{...enter(t, c('w:browser', 62)), ...txt(pal, 22, 700)}}>headless Chromium</div>
      </div>
      <div style={{position: 'absolute', right: 50, top: 742, display: 'flex', alignItems: 'center', gap: 8, ...txt(pal, 20, 800),
                   color: '#E5484D', opacity: t >= rec ? blink : 0}}>
        <span style={{width: 14, height: 14, borderRadius: 14, background: '#E5484D'}} />REC
      </div>
      <div style={{position: 'absolute', left: 50, top: 850, display: 'flex', gap: 10}}>
        {Array.from({length: 8}).map((_, i) => (
          <div key={i} style={{width: 68, height: 100, borderRadius: 8, background: '#fff', border: `1.5px solid ${pal.cardBorder}`,
                               overflow: 'hidden', position: 'relative', ...pop(t, rec + 6 + i * 5, fps)}}>
            <Img src={staticFile(IMG('hover_light'))} style={{position: 'absolute', width: 150, left: -10, top: -14 + (7 - i) * 4}} />
          </div>
        ))}
      </div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S09: writes a spec (motion spec table)
const S09: React.FC<SceneProps> = ({t, dur, fps, spec, pal, W}) => {
  const c = cueOf(spec);
  const s0 = c('w:spec', 13);
  const rows = [['.card', 'opacity', '0 → 1', 'ease-out'], ['.card', 'translateY', '24px → 0', 'spring'],
                ['.title', 'blur', '8px → 0', 'ease-out'], ['.badge', 'scale', '0.6 → 1', 'back-out']];
  return (
    <Camera t={t} dur={dur} push={0.045} drift={[0, -8]}>
      <Card t={t} at={0} pal={pal} x={50} y={400} w={W - 100} h={430} pad={26}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, ...txt(pal, 22, 700)}}><Glyph name="doc" size={24} color={CORAL} />motion-spec.md</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1.25fr 1.2fr 1fr', gap: '12px 10px', marginTop: 22, fontFamily: MONO, fontSize: 17}}>
          {['element', 'property', 'from → to', 'easing'].map((h) => <div key={h} style={{color: pal.mute, fontWeight: 600}}>{h}</div>)}
          {rows.map((r, i) => r.map((cell, j) => (
            <div key={`${i}${j}`} style={{color: j === 3 ? CORAL : pal.fg, position: 'relative'}}>
              <TypeOn t={t} at={s0 + i * 7 + j * 2} text={cell} fps={fps} cps={40} cursor={false} />
            </div>
          )))}
        </div>
        <div style={{position: 'absolute', left: 26, right: 26, top: 120 + Math.min(3, Math.floor(Math.max(0, t - s0) / 7)) * 38,
                     height: 34, borderRadius: 8, background: `${CORAL}14`, opacity: t > s0 ? 1 : 0}} />
      </Card>
    </Camera>
  );
};

// ---------------------------------------------------------------- S10: builds it in CSS / Framer Motion / GSAP - real marks
const S10: React.FC<SceneProps> = ({t, dur, fps, spec, pal, W}) => {
  const c = cueOf(spec);
  const lines = ['@keyframes rise {', '  from { opacity: 0;', '         translate: 0 24px; }', '  to   { opacity: 1; }', '}'];
  const libs: [typeof siCss, string, number][] = [[siCss, 'CSS', c('w:css', 21)], [siFramer, 'Framer Motion', c('w:framer', 47)],
    [siGreensock, 'GSAP', c('w:gsap', 79)]];
  return (
    <Camera t={t} dur={dur} push={0.04}>
      <Window t={t} at={0} pal={pal} x={60} y={350} w={W - 120} h={330} title="Hero.tsx" fps={fps}>
        <div style={{fontFamily: MONO, fontSize: 21, lineHeight: 1.7, color: '#2B2D33'}}>
          {lines.map((l, i) => <div key={i}><TypeOn t={t} at={4 + i * 9} text={l} fps={fps} cps={34} cursor={false} /></div>)}
        </div>
      </Window>
      <div style={{position: 'absolute', left: 0, right: 0, top: 730, display: 'flex', justifyContent: 'center', gap: 26}}>
        {libs.map(([ic, name, at], i) => (
          <Float key={name} t={t} amp={5} period={64} phase={i * 21}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
              <LogoTile icon={ic} t={t} at={at} fps={fps} size={110} bg="#fff" />
              <div style={{...pop(t, at + 3, fps), ...txt(pal, 21, 700)}}>{name}</div>
            </div>
          </Float>
        ))}
      </div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S11: films its copy, measures the difference
const S11: React.FC<SceneProps> = ({t, dur, fps, spec, pal, theme, W}) => {
  const c = cueOf(spec);
  const m0 = c('w:measures', 54), m1 = c('w:difference', 69) + 18;
  const sw = 380, sh = sw * (530 / 336);
  const diffColor = t > m1 ? theme.accent : CORAL;
  return (
    <Camera t={t} dur={dur} push={0.035} drift={[0, -8]}>
      <div style={{position: 'absolute', left: (W - sw) / 2, top: 290, ...enter(t, 0, 12, 30, 10)}}>
        <CompareSlider t={t} a={IMG('orig_card')} b={IMG('copy_card')} w={sw} h={sh} labelA="ORIGINAL" labelB="COPY"
                       accent={theme.select.border}
                       keys={[{at: 0, pos: 0.12}, {at: c('w:films', 14), pos: 0.88}, {at: c('w:copy', 37), pos: 0.3}, {at: m0, pos: 0.5}]} />
      </div>
      <Card t={t} at={m0 - 8} pal={pal} x={60} y={290 + sh + 24} w={W - 120} h={180} pad={22}>
        <div style={{display: 'flex', justifyContent: 'space-between', ...txt(pal, 20, 600), color: pal.mute}}>
          <span>pixel difference</span>
          <span style={{display: 'flex', gap: 8}}>{[0, 1, 2].map((r) => <Tick key={r} t={t} at={m0 + r * 9} fps={fps} color={theme.accent} size={26} />)}</span>
        </div>
        <div style={{...txt(pal, 72, 800), color: diffColor, marginTop: 4, letterSpacing: -2}}>
          <Counter t={t} at={m0} dur={m1 - m0} from={12.4} to={0} decimals={1} suffix="%" />
        </div>
        <div style={{height: 10, borderRadius: 10, background: '#ECECE6', marginTop: 10, overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${(1 - prog(t, m0, m1 - m0)) * 100}%`, background: diffColor, borderRadius: 10}} />
        </div>
      </Card>
    </Camera>
  );
};

// ---------------------------------------------------------------- S12: 417 of 417 frames - real examples table + Vercel mark
const S12: React.FC<SceneProps> = ({t, dur, fps, spec, pal, theme, W}) => {
  const c = cueOf(spec);
  const a = c('w:417', 68), b = c('i:7', 90), f = c('w:frames', 121);
  const w = W - 70;
  return (
    <Camera t={t} dur={dur} push={0.045}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', gap: 14, alignItems: 'center'}}>
        <LogoTile icon={siVercel} t={t} at={c('w:vercels', 18)} fps={fps} size={70} bg="#000" color="#fff" />
        <div style={{...enter(t, c('w:toolbar', 34)), ...txt(pal, 26, 700)}}>Vercel Toolbar</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', ...txt(pal, 120, 800), letterSpacing: -4}}>
        <Counter t={t} at={10} dur={a - 10} from={0} to={417} grouping={false} />
        <span style={{color: pal.mute, fontWeight: 600}}> / {t >= b ? '417' : '···'}</span>
      </div>
      <Shot src={IMG('examples_light')} aspect={285 / 1700} t={t} at={c('w:matched', 57) - 6} x={35} y={640} w={w} h={w * (285 / 1700) + 38}
            url={`${URL} · Examples`} focus={[{at: f - 6, x: 0.86, y: 0.6, scale: 1.6}]} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 900, display: 'flex', justifyContent: 'center'}}>
        <Pill text="frames identical" t={t} at={f} fps={fps} bg={theme.accent} fg="#fff" size={26} icon="check" />
      </div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S13 (dark): don't stop at a copy
const S13: React.FC<SceneProps> = ({t, dur, fps, spec, theme, W}) => {
  const c = cueOf(spec);
  const x = c('w:copy', 40);
  return (
    <Camera t={t} dur={dur} push={0.05}>
      <div style={{position: 'absolute', left: 50, top: 380}}><LogoTile icon={siClaude} t={t} at={2} fps={fps} size={70} bg="#1E1E1E" /></div>
      <Terminal t={t} at={0} fps={fps} x={50} y={480} w={W - 100} h={250} fontSize={22} title="claude"
                lines={[{text: '> /reanimate the hero on stripe.com', at: 3}, {text: '✓ copy matches  (0.11% diff)', at: 22, color: '#3FB950'}]} />
      <div style={{position: 'absolute', left: 70, top: 570, width: W - 140, height: 4}}>
        <Strike t={t} at={x - 6} color={theme.accent2} width={5} />
      </div>
      <div style={{position: 'absolute', left: W - 120, top: 450}}><Tick t={t} at={x} fps={fps} color={theme.accent2} size={58} kind="x" /></div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S14 (light): clone this and add that - real modes table
const S14: React.FC<SceneProps> = ({t, dur, fps, spec, pal, theme, W}) => {
  const c = cueOf(spec);
  const w = W - 70;
  const sh = w * (470 / 1700) + 38;
  return (
    <Camera t={t} dur={dur} push={0.04} drift={[0, -10]}>
      <Stepper t={t} at={0} fps={fps} pal={pal} accent={theme.accent} x={50} y={350} w={W - 100}
               steps={[{label: 'Clone', doneAt: c('w:clone', 24) + 4}, {label: 'Add twist', doneAt: c('w:add', 46) + 4},
                       {label: 'Ship', doneAt: c('w:own', 91) + 4}]} />
      <Shot src={IMG('modes_light')} aspect={470 / 1700} t={t} at={6} x={35} y={470} w={w} h={sh} url={`${URL} · modes`}
            focus={[{at: c('w:clone', 24), x: 0.35, y: 0.35, scale: 1.4}, {at: c('w:build', 77) - 4, x: 0.35, y: 0.85, scale: 1.4}]} />
      <div style={{position: 'absolute', left: 60, top: 470 + sh + 40, width: W - 120}}>
        <Card t={t} at={c('w:build', 77) - 6} pal={pal} x={0} y={0} w={W - 120} h={100} pad={24}
              style={{border: `2px solid ${t >= c('w:own', 91) ? theme.accent : pal.cardBorder}`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontSize: 22, color: pal.fg, position: 'relative'}}>
            <Logo icon={siClaude} size={28} />
            <TypeOn t={t} at={c('w:build', 77) - 2} text="/reanimate clone X and add Y" fps={fps} cps={40} cursor={false} />
          </div>
          <Shine t={t} at={c('w:own', 91)} strength={0.5} />
        </Card>
      </div>
    </Camera>
  );
};

// ---------------------------------------------------------------- S15 (dark): comment ANIMATE -> DM with the link (no names)
const S15: React.FC<SceneProps> = ({t, dur, fps, spec, pal, theme, W}) => {
  const c = cueOf(spec);
  const link = c('w:link', 73);
  const s = springAt(t, link, fps, {damping: 15, stiffness: 170, mass: 0.7});
  return (
    <Camera t={t} dur={dur} push={0.05}>
      <div style={{position: 'absolute', left: 30, top: 290, width: W - 60, display: 'flex', gap: 18, alignItems: 'center',
                   background: pal.card, borderRadius: 28, border: `1.5px solid ${pal.cardBorder}`, padding: '22px 24px',
                   boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.45)', opacity: clamp01(s * 1.3),
                   transform: `translateY(${(1 - s) * -70}px) scale(${0.96 + 0.04 * s})`, zIndex: 5}}>
        <div style={{width: 68, height: 68, borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
          <Logo icon={siGithub} size={42} color="#181717" />
        </div>
        <div style={{minWidth: 0}}>
          <div style={{...txt(pal, 24, 700)}}>New message · now</div>
          <div style={{...txt(pal, 21, 500), color: '#58A6FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{URL}</div>
        </div>
      </div>
      <Float t={t} amp={4} period={90}>
        <Card t={t} at={0} pal={pal} x={36} y={420} w={W - 72} h={600} pad={32}>
          <div style={{textAlign: 'center', ...txt(pal, 26, 700), marginBottom: 34}}>Comments</div>
          {[0, 1].map((i) => (
            <div key={i} style={{display: 'flex', gap: 16, alignItems: 'center', marginBottom: 30, ...enter(t, 2 + i * 3)}}>
              <div style={{width: 54, height: 54, borderRadius: 54, background: '#2A2D33'}} />
              <div style={{flex: 1}}>
                <div style={{width: `${40 + i * 20}%`, height: 14, borderRadius: 8, background: '#2F333A'}} />
                <div style={{width: `${70 - i * 15}%`, height: 14, borderRadius: 8, background: '#2A2D33', marginTop: 10}} />
              </div>
            </div>
          ))}
          <div style={{display: 'flex', alignItems: 'center', gap: 16, ...enter(t, c('w:animate', 30) - 4)}}>
            <div style={{width: 54, height: 54, borderRadius: 54, background: `linear-gradient(135deg, ${theme.accent}, #2EC4B6)`}} />
            <div>
              <div style={{...txt(pal, 19, 500), color: pal.mute}}>you · now</div>
              <span style={{display: 'inline-block', marginTop: 6, padding: '8px 18px', borderRadius: 10, background: '#fff',
                            ...txt(pal, 34, 800), color: '#111', ...pop(t, c('w:animate', 30), fps)}}>ANIMATE</span>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 34, marginLeft: 70, ...enter(t, c('w:send', 58))}}>
            <Tick t={t} at={c('w:send', 58)} fps={fps} color={theme.accent} size={34} />
            <div style={{...txt(pal, 25, 600)}}>Sent! Check your DMs</div>
          </div>
        </Card>
      </Float>
      <Particles t={t} n={14} w={W} h={1280} color="#58A6FF" seed={9} size={3} />
    </Camera>
  );
};

export const SCENES = {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15};
