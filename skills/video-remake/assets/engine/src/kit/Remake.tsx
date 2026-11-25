import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Project, SceneProps, SceneSpec} from './types';
import {Captions} from './Captions';
import {Backdrop} from './Backdrop';
import {EASE, clamp01, prog} from './motion';
import {SANS} from './fonts';
import {GridBackdrop, ProgressRail} from './explainer/stage';
import {Presenter} from './explainer/presenter';
import {ExplainerCaptions} from './explainer/captions';
import {SafeFrame} from './explainer/world';

/** How many frames a scene is drawn before its nominal start / after its end (transition overlap). */
const half = (frames: number) => Math.ceil(frames / 2);

/** Visual treatment of one scene layer during the transitions on both of its sides. */
const layerStyle = (frame: number, s: SceneSpec, next: SceneSpec | undefined, W: number, H: number): React.CSSProperties => {
  const st: React.CSSProperties = {};
  // ---- incoming (this scene's own transitionIn), centred on s.from
  const ti = s.transitionIn;
  if (ti.type !== 'cut' && ti.frames > 0) {
    const a = s.from - half(ti.frames);
    const p = clamp01((frame - a) / ti.frames);
    if (p < 1) {
      if (ti.type === 'dissolve') {
        st.opacity = EASE.inOut(p);
        st.filter = `blur(${(1 - EASE.out(p)) * 18}px)`;
      } else if (ti.type === 'iris') {
        const [ox, oy] = ti.origin ?? [0.5, 0.5];
        const R = Math.hypot(Math.max(ox, 1 - ox) * W, Math.max(oy, 1 - oy) * H);
        // grows from nothing with an ease-in-out: no static "dot" sitting on the outgoing content (looked like
        // a stain), and no slow ease-in start (the detector read that as a hard cut). Put `origin` on an element.
        st.clipPath = `circle(${EASE.inOut(p) * R * 1.02}px at ${ox * 100}% ${oy * 100}%)`;
      } else if (ti.type === 'zoom') {
        const q = EASE.out(p);
        st.opacity = q;
        st.transform = `scale(${1.18 - 0.18 * q})`;
        st.filter = `blur(${(1 - q) * 14}px)`;
      } else if (ti.type === 'slide' || ti.type === 'push') {
        st.transform = `translateX(${(1 - EASE.inOut(p)) * W}px)`;
      } else if (ti.type === 'portal') {
        // the new world grows out of the portal point while the old one flies into it
        const [ox, oy] = ti.origin ?? [0.5, 0.5];
        const q = EASE.out(clamp01((p - 0.35) / 0.65));
        st.opacity = q;
        st.transformOrigin = `${ox * 100}% ${oy * 100}%`;
        st.transform = `scale(${0.25 + 0.75 * q})`;
        st.filter = `blur(${(1 - q) * 16}px)`;
      }
    }
  }
  // ---- outgoing (the next scene's transitionIn), centred on s.to
  if (next && next.transitionIn.type !== 'cut' && next.transitionIn.frames > 0) {
    const tt = next.transitionIn;
    const a = next.from - half(tt.frames);
    const p = clamp01((frame - a) / tt.frames);
    if (p > 0) {
      if (tt.type === 'dissolve') {
        st.opacity = (st.opacity as number ?? 1) * (1 - EASE.inOut(p));
        st.filter = `blur(${EASE.in(p) * 18}px)`;
      } else if (tt.type === 'iris') {
        st.filter = `blur(${EASE.in(p) * 10}px)`;
      } else if (tt.type === 'zoom') {
        st.opacity = 1 - EASE.in(p);
        st.transform = `scale(${1 - 0.35 * EASE.inOut(p)})`;
        st.filter = `blur(${EASE.in(p) * 12}px)`;
      } else if (tt.type === 'push') {
        st.transform = `translateX(${-EASE.inOut(p) * W}px)`;
      } else if (tt.type === 'portal') {
        const [ox, oy] = tt.origin ?? [0.5, 0.5];
        const q = EASE.in(clamp01(p / 0.75));
        st.transformOrigin = `${ox * 100}% ${oy * 100}%`;
        st.transform = `scale(${1 + 5 * q})`;
        st.filter = `blur(${q * 18}px)`;
        st.opacity = 1 - clamp01((p - 0.45) / 0.4);
      }
    }
  }
  return st;
};

export const Remake: React.FC<{project: Project; scenes: Record<string, React.FC<SceneProps>>}> = ({project, scenes}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const {theme} = project;
  const list = project.scenes;
  const base = project.baseFps ?? fps;
  const k = fps / base; // output frames per design frame (2 at 60 fps output, 30 fps design)

  const safe = {focusY: project.safe?.focusY ?? 0.53, zoom: project.safe?.zoom ?? 1};

  return (
    <SafeFrame.Provider value={safe}>
    <AbsoluteFill style={{fontFamily: SANS, background: theme[list[0]?.bg ?? 'dark'].bg}}>
      {list.map((s, i) => {
        const next = list[i + 1];
        const pre = s.transitionIn.type === 'cut' ? 0 : half(s.transitionIn.frames);
        const post = next && next.transitionIn.type !== 'cut' ? half(next.transitionIn.frames) : 0;
        const start = Math.max(0, s.from - pre);
        const end = Math.min(project.durationInFrames, s.to + post);
        const Comp = scenes[s.id];
        const pal = theme[s.bg];
        return (
          <Sequence key={s.id} from={start} durationInFrames={Math.max(1, end - start)} name={s.id}>
            <AbsoluteFill style={{zIndex: i, ...layerStyle(frame, s, next, W, H)}}>
              {project.style === 'explainer' ? <GridBackdrop mode={s.bg} W={W} H={H} /> : <Backdrop bg={s.bg} theme={theme} />}
              {Comp ? (
                <Comp t={(frame - s.from) / k} dur={(s.to - s.from) / k} fps={base} spec={s} theme={theme} pal={pal} W={W} H={H} />
              ) : (
                <AbsoluteFill style={{color: 'red', fontSize: 40, alignItems: 'center', justifyContent: 'center'}}>
                  missing scene component: {s.id}
                </AbsoluteFill>
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {project.presenter && !(project.presenter.hide ?? []).some(([a, b]) => frame / k >= a && frame / k < b) ? (
        <Presenter t={frame / k} cues={project.presenter.cues} talk={project.presenter.talk} enter={project.presenter.enter ?? 0}
                   W={W} H={H} anchor={project.presenter.anchor} widthFrac={project.presenter.widthFrac} shift={project.presenter.shift} />
      ) : null}
      {project.rail ? (
        <ProgressRail t={frame / k} total={project.durationInFrames / k} chapters={project.rail.chapters} W={W} H={H}
                      mode={(list.find((x) => frame >= x.from && frame < x.to) ?? list[0]).bg} />
      ) : null}
      {project.captions.mode === 'explainer' ? <ExplainerCaptions project={project} /> : <Captions project={project} />}
      {project.handle ? <Handle project={project} /> : null}
      {project.audio.vo ? <Audio src={staticFile(project.audio.vo)} volume={project.audio.voVolume ?? 1} /> : null}
      {project.audio.music ? (
        <Audio
          src={staticFile(project.audio.music.src)}
          volume={(f) =>
            project.audio.music!.volume *
            interpolate(f, [0, 6, project.durationInFrames - (project.audio.music!.fadeOutFrames ?? 20), project.durationInFrames], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      ) : null}
      {project.audio.sfx.map((x, i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, x.frame)} name={`sfx ${x.type ?? ''}`}>
          <Audio src={staticFile(x.src)} volume={x.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </SafeFrame.Provider>
  );
};

/** Creator handle, centred near the bottom on every shot (colour follows the scene underneath). */
const Handle: React.FC<{project: Project}> = ({project}) => {
  const frame = useCurrentFrame();
  const s = project.scenes.find((x) => frame >= x.from && frame < x.to) ?? project.scenes[0];
  const pal = project.theme[s.bg];
  const H = project.canvas.height;
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, top: H * 0.86, textAlign: 'center', zIndex: 900,
        fontSize: H * 0.016, color: pal.mute, letterSpacing: 0.2, opacity: 0.9 * prog(frame, 0, 6),
      }}
    >
      {project.handle}
    </div>
  );
};
