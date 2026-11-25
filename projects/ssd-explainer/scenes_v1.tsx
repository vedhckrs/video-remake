// "How does an SSD store your files?" - keyframes-explainer style, 1080x1920 @ 60 (design frames @30).
// Every event is keyed to a word cue (spec.cues['w:<word>'], design frames from the scene start).
import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {IsoScene, IsoBox, useIso, project as isoProject, type P3} from '../../src/kit/explainer/iso';
import {EpoxyChip, GoldFingers, SmdArray, TracePattern, Silk, MountHole, CellField, StageLight, DepthBands, StageBand, MAT} from '../../src/kit/explainer/hardware';
import {StageCamera, camPoint, type CamKey, Callout, Stamp, Badge, Meter, FlowPath, Footnote, FONT, MONO, prog, focusStyle} from '../../src/kit/explainer/stage';
import {DrumCounter, HeroNumber, GlassCard, IsoBarChart, IsoTileField} from '../../src/kit/explainer/premium';
import {EvidenceDoc, SocialCTA} from '../../src/kit/explainer/templates';
import {C, alpha, mix, sp, unit} from '../../src/kit/explainer/tokens';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const cue = (spec: SceneProps['spec'], w: string, d = 0) => (spec.cues ?? {})[`w:${w}`] ?? d;

// ---------------------------------------------------------------------------------------------- shared art

/** The M.2 SSD (same drawing in the hook, the promise and the callback). */
const BOARD = {U: 19.5, origin: [169, 552] as [number, number], w: 62, d: 18, h: 0.8};
const NANDS: [number, number][] = [[29, 2.4], [44, 2.4]];
const boardPoint = (p: P3): [number, number] => {
  const [x, y] = isoProject(p, {u: BOARD.U, tilt: 1, mode: 'dark'});
  return [x + BOARD.origin[0], y + BOARD.origin[1]];
};

const SsdBoard: React.FC<{t: number; W: number; H: number; tilt?: number; xray?: number[]; lit?: number; activeRow?: number}> = ({
  t, W, H, tilt = 1, xray = [0, 0], lit = 0, activeRow,
}) => {
  const {w, d, h} = BOARD, Z = h;
  const top = (
    <g>
      <TracePattern ch={(100 * d) / w} seed={4} n={90} />
      <Silk x={30} y={27.6} text="M.2 2280 NVMe  PCIe Gen4 x4" size={1.25} />
      <Silk x={66} y={2.4} text="SN 2X4K9-0021" size={1.0} />
      <MountHole cx={100} cy={14.5} r={2.6} />
    </g>
  );
  return (
    <IsoScene width={W} height={H} u={BOARD.U} origin={BOARD.origin} tilt={tilt}>
      <IsoBox x={0} y={0} w={w} d={d} h={h} color={MAT.pcb.color} gloss={0.25} sheen={0.6} shadow={0.7} topContent={{cw: 100, ch: (100 * d) / w, node: top}} />
      <GoldFingers x={0.2} y={1.2} z={Z} n={28} pitch={0.56} gapAt={6} />
      <SmdArray x={6} y={0.6} z={Z} cols={9} rows={1} dx={2.3} seed={3} />
      <EpoxyChip x={7} y={3.2} z={Z} w={11} d={11} h={1.3} logo="CTRL" lines={['PCIe 4.0 x4', 'NVMe 2.0']} />
      <SmdArray x={7} y={15.2} z={Z} cols={6} rows={1} dx={2.0} seed={8} />
      <SmdArray x={20} y={1} z={Z} cols={3} rows={2} dx={2.2} dy={1.6} seed={5} />
      <EpoxyChip x={20.5} y={5.5} z={Z} w={5.5} d={8.5} h={1.1} logo="DRAM" lines={['LPDDR4', '1 GB']} />
      <SmdArray x={20} y={15.2} z={Z} cols={4} rows={1} dx={2.1} seed={12} />
      {NANDS.map(([x, y], i) => (
        <EpoxyChip key={i} x={x} y={y} z={Z} w={12.5} d={13} h={1.3} logo="NAND" lines={['3D TLC', '512 GB']} xray={xray[i] ?? 0}
                   xrayNode={<CellField cw={100} ch={104} t={t + i * 7} lit={C.info} seed={3 + i * 5} activeRow={activeRow} />} />
      ))}
      <SmdArray x={29} y={15.8} z={Z} cols={6} rows={1} dx={2.1} seed={21} />
      <SmdArray x={44} y={15.8} z={Z} cols={6} rows={1} dx={2.1} seed={33} />
      <SmdArray x={58} y={1} z={Z} cols={1} rows={6} dy={2.1} seed={41} along="y" />
      {lit > 0 ? NANDS.map(([x, y], i) => {
        const [cx, cy] = isoProject([x + 6.2, y + 6.5, Z + 1.4], {u: BOARD.U, tilt, mode: 'dark'});
        return <circle key={`g${i}`} cx={cx} cy={cy} r={180 * lit} fill={alpha(C.info, 0.18 * lit)} style={{mixBlendMode: 'screen'}} />;
      }) : null}
    </IsoScene>
  );
};

/** Photo thumbnail (landscape) drawn in SVG. */
const PhotoThumb: React.FC<{w: number; h: number}> = ({w, h}) => (
  <svg width={w} height={h} viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" style={{display: 'block'}}>
    <defs>
      <linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF9A62" /><stop offset="0.55" stopColor="#FFD08A" /><stop offset="1" stopColor="#9ED0F0" /></linearGradient>
    </defs>
    <rect width={160} height={100} fill="url(#ph-sky)" />
    <circle cx={112} cy={40} r={13} fill="#FFF3D6" />
    <path d="M0,78 L38,44 L62,64 L92,32 L132,70 L160,52 L160,100 L0,100 Z" fill="#4B5D7A" />
    <path d="M0,88 L30,70 L70,84 L110,66 L160,86 L160,100 L0,100 Z" fill="#2F3B52" />
  </svg>
);

const PhotoCard: React.FC<{t: number; at: number; x: number; y: number; w: number; u: number; out?: number}> = ({t, at, x, y, w, u, out}) => (
  <GlassCard t={t} at={at} x={x} y={y} w={w} u={u} out={out} rest={[6, -8]}>
    <div style={{padding: 16 * u}}>
      <div style={{borderRadius: 14 * u, overflow: 'hidden'}}><PhotoThumb w={w - 32 * u} h={(w - 32 * u) * 0.62} /></div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12 * u, fontSize: 26 * u}}>
        <span style={{fontWeight: 700}}>photo.jpg</span><span style={{color: '#8E9196', fontFamily: MONO}}>4.2 MB</span>
      </div>
    </div>
  </GlassCard>
);

/** A flash cell drawn as a glass bucket with a gold gate; electrons fall in and glow; level lines on the front. */
const Bucket: React.FC<{
  t: number; x?: number; y?: number; w?: number; d?: number; h?: number; fill?: number; levels?: number; gate?: number;
  eAt?: number; eCount?: number; leak?: number; leakAt?: number; worn?: number; seed?: number;
}> = ({t, x = 0, y = 0, w = 6, d = 6, h = 8, fill = 0, levels = 0, gate = 0, eAt, eCount = 0, leak = 0, leakAt = 0, worn = 0, seed = 1}) => {
  const ctx = {u: 1, tilt: 1, mode: 'dark' as const};
  const electrons: React.ReactNode[] = [];
  for (let i = 0; i < eCount; i++) {
    const st = (eAt ?? 0) + i * 0.6;
    if (eAt === undefined || t < st) continue;
    const ex = x + 0.8 + rnd(seed * 17 + i) * (w - 1.6), ey = y + 0.8 + rnd(seed * 29 + i * 3) * (d - 1.6);
    const ez = 0.6 + rnd(seed * 7 + i * 5) * Math.max(0.5, h * Math.max(fill, 0.35) - 1);
    const fall = clamp01((t - st) / 7);
    let z = lerp(h + 5, ez, 1 - Math.pow(1 - fall, 2));
    let o = 1;
    if (leak > 0 && i % 3 === 0) {
      const lt = clamp01((t - leakAt - i * 0.4) / 18);
      z = lerp(ez, -4, lt);
      o = 1 - lt;
    }
    electrons.push(<Electron key={i} p={[ex, ey, z]} o={o} />);
  }
  void ctx;
  const glass = mix('#9FB4D8', '#C9604A', worn);
  return (
    <g>
      <IsoBox x={x + 0.3} y={y + 0.3} w={w - 0.6} d={d - 0.6} h={Math.max(0.05, h * fill)} color={C.info} emissive={fill > 0.05 ? C.info : undefined} gloss={0.4} sheen={0.6} />
      {electrons}
      <IsoBox x={x} y={y} w={w} d={d} h={h} color={glass} glass={0.82} shadow={0.6}
              frontContent={levels > 0 ? {cw: 100, ch: (100 * h) / w, node: (
                <g>{Array.from({length: levels - 1}).map((_, k) => (
                  <line key={k} x1={4} x2={96} y1={((100 * h) / w) * (1 - (k + 1) / levels)} y2={((100 * h) / w) * (1 - (k + 1) / levels)}
                        stroke="rgba(160,200,255,0.75)" strokeWidth={levels > 8 ? 0.8 : 1.4} strokeDasharray="3 2" />
                ))}</g>
              )} : undefined} />
      <IsoBox x={x - 0.4 + gate * (w + 0.8)} y={y - 0.4} z={h} w={w + 0.8} d={d + 0.8} h={0.7} color={MAT.gold.color} gloss={1} sheen={1} />
    </g>
  );
};

/** Glowing electron, projected inside whatever IsoScene draws the bucket. */
const Electron: React.FC<{p: P3; o?: number}> = ({p, o = 1}) => {
  const c = useIso();
  const [sx, sy] = isoProject(p, c);
  const r = c.u * 0.42;
  return (
    <g opacity={o}>
      <circle cx={sx} cy={sy} r={r * 2.4} fill={alpha('#7FB8FF', 0.28)} />
      <circle cx={sx} cy={sy} r={r} fill="#DDEBFF" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------- scenes

const S01: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const tilt = sp(t, 0, 'settle');
  const xr = clamp01((t - cue(spec, 'traps', 175) + 2) / 12);
  const keys: CamKey[] = [{t: 0, s: 0.96}, {t: 60, s: 1.04, kind: 'push', dur: 150}];
  const cp = (p: P3) => camPoint(t, keys, W, H, boardPoint(p));
  const filesAt = cue(spec, 'files', 84), into = cue(spec, 'inside', 135);
  const icon = (k: number) => (
    <svg width={34 * u} height={34 * u} viewBox="0 0 24 24">
      {k === 0 ? <><rect x={2} y={5} width={20} height={15} rx={3} fill="#FF9A62" /><circle cx={12} cy={12.5} r={4.2} fill="#2F3B52" /><circle cx={12} cy={12.5} r={2.2} fill="#9ED0F0" /></> :
        k === 1 ? <><path d="M5,2 h10 l4,4 v16 h-14 z" fill="#E6E9ED" /><path d="M8,10 h8 M8,13 h8 M8,16 h5" stroke="#8E9196" strokeWidth={1.4} /></> :
          <><circle cx={8} cy={18} r={3.2} fill="#A14ED6" /><circle cx={17} cy={16} r={3.2} fill="#A14ED6" /><path d="M11,18 V5 l9,-2 v13" stroke="#A14ED6" strokeWidth={2} fill="none" /></>}
    </svg>
  );
  const files = [['0', 'photo.jpg'], ['1', 'notes.pdf'], ['2', 'song.mp3']];
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.7} strength={0.12} />
        <StageCamera t={t} W={W} H={H} keys={keys}>
          <SsdBoard t={t} W={W} H={H} tilt={tilt} xray={[xr, xr * 0.6]} activeRow={xr > 0.5 ? 6 : undefined} />
        </StageCamera>
        <DepthBands W={W} H={H} band={0.075} blur={12} />
      </StageBand>
      {files.map(([ic, name], i) => {
        const a = filesAt - 6 + i * 4;
        if (t < a) return null;
        const s = sp(t, a, 'pop');
        const sink = prog(t, into + i * 3, 14);
        const [tx, ty] = cp([36, 9, 2]);
        const x0 = W * (0.2 + i * 0.3), y0 = H * 0.3;
        return (
          <div key={i} style={{position: 'absolute', left: lerp(x0, tx, sink) - 95 * u, top: lerp(y0, ty, sink) - 40 * u, width: 190 * u, height: 80 * u,
                               borderRadius: 18 * u, background: 'linear-gradient(180deg,#24272D,#17191D)', boxShadow: `0 ${16 * u}px ${40 * u}px rgba(0,0,0,0.6), inset 0 0 0 ${1.2 * u}px rgba(255,255,255,0.1)`,
                               display: 'flex', alignItems: 'center', gap: 12 * u, padding: `0 ${18 * u}px`, boxSizing: 'border-box', fontFamily: FONT, color: '#fff',
                               fontSize: 24 * u, fontWeight: 600, opacity: Math.min(1, s * 1.5) * (1 - sink * 0.9),
                               transform: `scale(${(0.6 + 0.4 * s) * (1 - 0.75 * sink)})`}}>
            {icon(Number(ic))}{name}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: W * 0.56, top: H * 0.255}}>
        <Stamp t={t} at={cue(spec, 'no', 30) + 2} text="0 moving parts" u={u} color={C.info} rot={-6} />
      </div>
      <Callout t={t} at={cue(spec, 'billions', 149) + 2} from={cp([35.2, 8.9, 2.1])} to={[W * 0.84, H * 0.66]} text="NAND flash" gloss="billions of cells" W={W} color={C.info} />
    </>
  );
};

const S02: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const [nx, ny] = boardPoint([35, 9, 2]);
  const keys: CamKey[] = [{t: -6, s: 1.04}, {t: 4, x: nx, y: ny + 60, s: 1.45, kind: 'push', dur: 70}];
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.7} strength={0.12} />
        <StageCamera t={t} W={W} H={H} keys={keys} drift={0.02}>
          <SsdBoard t={t + 218} W={W} H={H} xray={[1, 0.6]} activeRow={6} />
        </StageCamera>
        <DepthBands W={W} H={H} band={0.075} blur={12} />
      </StageBand>
      <PhotoCard t={t} at={cue(spec, 'photo', 49) - 3} x={W * 0.3} y={H * 0.29} w={W * 0.4} u={u} />
    </>
  );
};

const S03: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const toBucket = cue(spec, 'think', 86) - 4;
  const twoAt = cue(spec, 'full', 294) - 6;
  const phaseA = t < toBucket;
  const sw = clamp01((t - toBucket) / 8);
  const gateClose = sp(t, cue(spec, 'trapped', 216) - 4, 'settle');
  const powerOff = t >= cue(spec, 'off', 255);
  const bucketPt = (q: P3): [number, number] => {
    const [x, y] = isoProject(q, {u: 46, tilt: 1, mode: 'dark'});
    return [x + W * 0.5, y + H * 0.555];
  };
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.65} strength={0.12} />
        {phaseA || sw < 1 ? (
          <div style={{opacity: 1 - sw, filter: sw > 0 ? `blur(${sw * 12}px)` : undefined}}>
            <IsoTileField t={t} at={0} cols={16} rows={16} W={W} H={H} u={40} origin={[W * 0.5, H * 0.22]}
                          lit={Math.floor(Math.max(0, t - cue(spec, 'grid', 40)) * 4)} litAt={cue(spec, 'grid', 40)} />
          </div>
        ) : null}
        {!phaseA ? (
          <div style={{opacity: sw, transform: `scale(${0.85 + 0.15 * sw})`, transformOrigin: '50% 48%'}}>
            <IsoScene width={W} height={H} u={46} origin={[W * 0.5, H * 0.555]}>
              {t < twoAt ? (
                <Bucket t={t} x={-3} y={-3} w={6} d={6} h={8} fill={0} gate={1 - gateClose * (t > cue(spec, 'push', 172) ? 1 : 0)}
                        eAt={cue(spec, 'push', 172) + 4} eCount={22} seed={2} />
              ) : (
                <>
                  <Bucket t={t} x={-9} y={-3} w={6} d={6} h={8} gate={0} eAt={twoAt - 40} eCount={22} seed={2} />
                  <Bucket t={t} x={3} y={-3} w={6} d={6} h={8} gate={0} seed={5} />
                </>
              )}
            </IsoScene>
          </div>
        ) : null}
        <DepthBands W={W} H={H} band={0.07} blur={10} />
      </StageBand>
      {!phaseA && t < twoAt ? (
        <>
          <Callout t={t} at={cue(spec, 'gate', 136) - 2} out={twoAt - 8} from={bucketPt([3, 0, 8.7])} to={[W * 0.84, H * 0.3]} text="Gate" gloss="opens and closes" W={W} color={C.goldRich} />
          <Callout t={t} at={cue(spec, 'electrons', 179) + 6} out={twoAt - 8} from={bucketPt([0, 0, 1.5])} to={[W * 0.16, H * 0.66]} text="Electrons" gloss="trapped charge" W={W} color={C.info} />
          <GlassCard t={t} at={cue(spec, 'power', 247) - 8} out={twoAt - 8} x={W * 0.64} y={H * 0.36} w={W * 0.3} u={u} rest={[0, 0]}>
            <div style={{display: 'flex', alignItems: 'center', gap: 16 * u, padding: 20 * u, fontSize: 26 * u, fontWeight: 700}}>
              <div style={{width: 74 * u, height: 40 * u, borderRadius: 20 * u, background: powerOff ? '#3A3E46' : C.ok, position: 'relative'}}>
                <div style={{position: 'absolute', top: 4 * u, left: powerOff ? 4 * u : 38 * u, width: 32 * u, height: 32 * u, borderRadius: 16 * u, background: '#fff'}} />
              </div>
              POWER {powerOff ? 'OFF' : 'ON'}
            </div>
          </GlassCard>
        </>
      ) : null}
      {t >= twoAt ? (
        <>
          {([['1', bucketPt([-6, 0, 4]), cue(spec, 'one', 339), 'FULL', bucketPt([-6, 3, 0])], ['0', bucketPt([6, 0, 4]), cue(spec, 'zero', 348), 'EMPTY', bucketPt([6, 3, 0])]] as [string, [number, number], number, string, [number, number]][]).map(([d, p, at, lab, lp], i) => (
            <React.Fragment key={i}>
              <div style={{position: 'absolute', left: p[0] - 80 * u, top: p[1] - 90 * u, width: 160 * u, textAlign: 'center', fontFamily: FONT,
                           fontWeight: 800, fontSize: 160 * u, color: i === 0 ? '#EAF3FF' : '#8E9196', lineHeight: 1,
                           opacity: t >= at - 2 ? 1 : 0, transform: `scale(${0.6 + 0.4 * sp(t, at - 2, 'pop')})`,
                           textShadow: i === 0 ? `0 0 ${34 * u}px ${alpha(C.info, 0.9)}` : `0 0 ${10 * u}px rgba(0,0,0,0.6)`}}>{d}</div>
              <div style={{position: 'absolute', left: lp[0] - 120 * u, top: lp[1] + 24 * u, width: 240 * u, textAlign: 'center', fontFamily: FONT, fontSize: 30 * u,
                           letterSpacing: '0.16em', color: '#AEB3BA', fontWeight: 700, opacity: prog(t, twoAt + 6 + i * 6, 8)}}>{lab}</div>
            </React.Fragment>
          ))}
        </>
      ) : null}
    </>
  );
};

const S04: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const fourAt = cue(spec, 'four', 91), eightAt = cue(spec, 'eight', 180), sixteenAt = cue(spec, 'sixteen', 237), qlcAt = cue(spec, 'qlc', 308) - 10;
  const levels = t >= sixteenAt ? 16 : t >= eightAt ? 8 : t >= fourAt ? 4 : 0;
  const bits = levels === 16 ? 4 : levels === 8 ? 3 : levels === 4 ? 2 : 1;
  // the fill hops between levels like a stored value
  const step = Math.floor(t / 9);
  const fill = levels ? (1 + Math.floor(rnd(step * 3.1) * (levels - 1))) / levels : 0.0;
  const chart = t >= qlcAt;
  const sw = clamp01((t - qlcAt) / 8);
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.65} strength={0.12} />
        {sw < 1 ? (
          <div style={{opacity: 1 - sw, filter: sw > 0 ? `blur(${sw * 12}px)` : undefined}}>
            <IsoScene width={W} height={H} u={44} origin={[W * 0.34, H * 0.575]}>
              <Bucket t={t} x={-3} y={-3} w={6} d={6} h={9} fill={lerp(0, fill, sp(t, fourAt, 'settle'))} levels={levels} gate={0} />
            </IsoScene>
          </div>
        ) : null}
        {chart ? (
          <div style={{opacity: sw}}>
            <IsoBarChart t={t} at={qlcAt + 2} values={[0.25, 0.5, 0.75, 1]} labels={['SLC', 'MLC', 'TLC', 'QLC']} W={W} H={H} u={34} origin={[W * 0.2, H * 0.5]}
                         valueText={(v, i) => `${i + 1} bit${i ? 's' : ''}`} highlight={3} />
          </div>
        ) : null}
        <DepthBands W={W} H={H} band={0.07} blur={10} />
      </StageBand>
      {!chart && levels > 0 ? (
        <div style={{position: 'absolute', left: W * 0.6, top: H * 0.36, opacity: 1 - sw}}>
          <DrumCounter t={t} at={levels === 4 ? fourAt : levels === 8 ? eightAt : sixteenAt} from={levels === 4 ? 0 : levels === 8 ? 4 : 8} to={levels}
                       dur={14} size={96 * u} digits={2} label="levels" />
          <div style={{marginTop: 36 * u, fontFamily: FONT, fontWeight: 800, fontSize: 64 * u, color: C.info, textAlign: 'center',
                       transform: `scale(${0.85 + 0.15 * sp(t, levels === 4 ? cue(spec, 'two', 145) - 2 : levels === 8 ? cue(spec, 'three', 200) - 2 : sixteenAt + 10, 'pop')})`,
                       textShadow: `0 0 ${24 * u}px ${alpha(C.info, 0.6)}`}}>
            = {bits} bits
          </div>
        </div>
      ) : null}
      {chart ? (
        <div style={{position: 'absolute', left: W * 0.58, top: H * 0.27}}>
          <Stamp t={t} at={cue(spec, 'cheap', 363) - 3} text="$ per TB ↓" u={u} color={C.ok} />
        </div>
      ) : null}
    </>
  );
};

const S05: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const stackAt = cue(spec, 'stack', 87) - 4, overAt = cue(spec, 'over', 136), smallAt = cue(spec, 'smaller', 195) - 6;
  const rise = sp(t, stackAt, 'settle');
  const N = 18;
  const layers: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const s = sp(t, stackAt + i * 1.4, 'settle');
    if (i > 0 && s <= 0.01) continue;
    const z = i * 1.05 * s;
    layers.push(<IsoBox key={i} x={0} y={0} z={z} w={12} d={12} h={0.42} color={i % 2 ? '#2B3446' : '#24456E'} gloss={0.4} sheen={0.7}
                        emissive={i === N - 1 && s > 0.9 ? C.info : undefined}
                        topContent={i === 0 || s > 0.5 ? {cw: 100, ch: 100, node: (
                          <g>{Array.from({length: 8}).map((_, r) => Array.from({length: 8}).map((__, k) => (
                            <rect key={`${r}-${k}`} x={4 + k * 12} y={4 + r * 12} width={9} height={9} rx={1.5}
                                  fill={rnd(i * 64 + r * 8 + k) > 0.6 ? C.info : '#3A4A66'} opacity={0.85} />
                          )))}</g>
                        )} : undefined} />);
  }
  const shrink = sp(t, smallAt, 'settle');
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.52} r={0.6} strength={0.12} />
        <div style={{transform: `scale(${1 - 0.42 * shrink}) translateY(${shrink * 90 * u}px)`, transformOrigin: '50% 60%'}}>
          <IsoScene width={W} height={H} u={36} origin={[W * 0.5, H * 0.58 - rise * 120 * u]}>{layers}</IsoScene>
        </div>
        <DepthBands W={W} H={H} band={0.07} blur={10} />
      </StageBand>
      {t < stackAt + 6 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: H * 0.31, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 44 * u,
                     letterSpacing: '0.2em', color: '#8E9196', opacity: prog(t, cue(spec, 'flat', 50) - 4, 6) * (1 - prog(t, stackAt, 6))}}>1 LAYER</div>
      ) : null}
      <div style={{position: 'absolute', left: W * 0.08, top: H * 0.29, opacity: t >= overAt - 8 ? 1 - prog(t, smallAt + 20, 8) : 0}}>
        <DrumCounter t={t} at={overAt - 8} to={321} size={78 * u} label="layers" dur={22} />
      </div>
      {t >= smallAt ? (
        <div style={{position: 'absolute', left: W * 0.62, top: H * 0.5, fontFamily: FONT, color: '#fff', opacity: prog(t, smallAt + 4, 8)}}>
          <div style={{width: 200 * u, height: 4 * u, background: '#fff', position: 'relative'}}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => <div key={k} style={{position: 'absolute', left: k * 20 * u, top: 0, width: 2 * u, height: (k % 5 ? 12 : 22) * u, background: '#fff'}} />)}
          </div>
          <div style={{fontSize: 30 * u, fontWeight: 700, marginTop: 30 * u}}>≈ 1 cm</div>
          <div style={{fontSize: 24 * u, color: '#8E9196'}}>a fingernail wide</div>
        </div>
      ) : null}
    </>
  );
};

const S06: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const ctrlAt = cue(spec, 'controller', 37), splitAt = cue(spec, 'splits', 126), spreadAt = cue(spec, 'spreads', 173),
    parAt = cue(spec, 'parallel', 252), readsAt = cue(spec, 'reads', 320) - 8;
  const origin: [number, number] = [W * 0.52, H * 0.495];
  const U = 26;
  const P = (p: P3): [number, number] => {
    const [x, y] = isoProject(p, {u: U, tilt: 1, mode: 'dark'});
    return [x + origin[0], y + origin[1]];
  };
  const chips: P3[] = [];
  for (let i = 0; i < 4; i++) { chips.push([-15 + i * 2, -9 + i * 4.6, 0]); chips.push([9 - i * 0, -15 + i * 5.2, 0]); }
  const nand: [number, number][] = [[-16, -4], [-16, 3], [-16, 10], [-9, 12], [8, -14], [12, -7], [12, 0], [12, 7]];
  const ctrlC: P3 = [0, 0, 1.6];
  const glow = sp(t, parAt, 'pop');
  const dim = focusStyle(t, readsAt, undefined, false);
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.7} strength={0.12} />
        <div style={{...dim}}>
          <IsoScene width={W} height={H} u={U} origin={origin}>
            <IsoBox x={-19} y={-17} w={34} d={32} h={0.5} color={MAT.pcb.color} gloss={0.25} sheen={0.6} shadow={0.6}
                    topContent={{cw: 100, ch: 94, node: <TracePattern ch={94} seed={9} n={70} />}} />
            {nand.filter(([x, y]) => x + y < 0).map(([x, y], i) => (
              <EpoxyChip key={`a${i}`} x={x} y={y} z={0.5} w={5} d={5} h={0.9} logo="NAND" xray={glow * 0.9}
                         xrayNode={<CellField cw={100} ch={100} t={t + i * 5} seed={i + 2} activeRow={3 + (i % 3)} />} />
            ))}
            <EpoxyChip x={-4} y={-4} z={0.5} w={8} d={8} h={1.2} logo="CTRL" lines={['PCIe 4.0 x4']} />
            {nand.filter(([x, y]) => x + y >= 0).map(([x, y], i) => (
              <EpoxyChip key={`b${i}`} x={x} y={y} z={0.5} w={5} d={5} h={0.9} logo="NAND" xray={glow * 0.9}
                         xrayNode={<CellField cw={100} ch={100} t={t + i * 7} seed={i + 9} activeRow={2 + (i % 4)} />} />
            ))}
          </IsoScene>
          {nand.map(([x, y], i) => {
            const a = P(ctrlC), b = P([x + 2.5, y + 2.5, 1.4]);
            const mid: [number, number] = [a[0], b[1]];
            return <FlowPath key={i} t={t} at={spreadAt - 10 + i} points={[a, mid, b]} u={u} color={C.info} drawDur={10}
                             packets={[{at: spreadAt + 2 + (i % 2), dur: 16}, {at: spreadAt + 26 + (i % 3), dur: 16}, {at: parAt - 6, dur: 12}]} />;
          })}
        </div>
        <DepthBands W={W} H={H} band={0.07} blur={10} />
      </StageBand>
      {/* the photo flies into the controller, then splits into 8 pages */}
      {t < splitAt + 26 ? (() => {
        const into = prog(t, ctrlAt - 18, 18);
        const [cx, cy] = P(ctrlC);
        const splitP = prog(t, splitAt, 14);
        return (
          <>
            {splitP < 1 ? (
              <div style={{position: 'absolute', left: lerp(W * 0.3, cx - 90 * u, into), top: lerp(H * 0.27, cy - 120 * u, into), width: 180 * u,
                           opacity: (1 - splitP) * prog(t, 0, 6), transform: `scale(${lerp(1.4, 1, into)})`}}>
                <div style={{borderRadius: 12 * u, overflow: 'hidden', boxShadow: `0 ${16 * u}px ${40 * u}px rgba(0,0,0,0.6)`}}><PhotoThumb w={180 * u} h={112 * u} /></div>
              </div>
            ) : null}
            {splitP > 0 ? nand.map(([x, y], i) => {
              const [bx, by] = P([x + 2.5, y + 2.5, 1.4]);
              const go = prog(t, spreadAt + i * 0.5, 18);
              const sx = cx - 60 * u + (i % 4) * 32 * u, sy = cy - 110 * u + Math.floor(i / 4) * 40 * u;
              return (
                <div key={i} style={{position: 'absolute', left: lerp(sx + (i % 4 - 1.5) * 26 * u * splitP, bx - 18 * u, go), top: lerp(sy - 30 * u * splitP, by - 24 * u, go),
                                     width: 36 * u, height: 26 * u, borderRadius: 4 * u, overflow: 'hidden', opacity: 1 - go * 0.9,
                                     boxShadow: `0 0 ${14 * u}px ${alpha(C.info, 0.7)}`, border: `${1.5 * u}px solid ${C.info}`}}>
                  <div style={{marginLeft: -(i % 4) * 36 * u, marginTop: -Math.floor(i / 4) * 26 * u}}><PhotoThumb w={144 * u} h={52 * u} /></div>
                </div>
              );
            }) : null}
          </>
        );
      })() : null}
      <Callout t={t} at={ctrlAt + 6} out={splitAt - 4} from={P([0, 0, 1.8])} to={[W * 0.78, H * 0.28]} text="Controller" gloss="the drive's own processor" W={W} />
      {t >= splitAt + 4 && t < readsAt ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: H * 0.27, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 32 * u, letterSpacing: '0.14em',
                     color: C.info, opacity: prog(t, splitAt + 4, 6) * (1 - prog(t, readsAt - 6, 6))}}>
          {t < parAt ? '8 PAGES · 8 CHIPS' : 'ALL AT ONCE'}
        </div>
      ) : null}
      <HeroNumber t={t} at={readsAt} to={7450} W={W} H={H} unitText="MB/s" label="sequential read" source="fast PCIe 4.0 drives, up to 7,450 MB/s" y={H * 0.36} />
    </>
  );
};

const S07: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const cycAt = cue(spec, 'every', 48), leakAt = cue(spec, 'leak', 221) - 4, thousandAt = cue(spec, 'thousand', 180);
  const cycling = t >= cycAt && t < leakAt;
  const phase = cycling ? (Math.sin(((t - cycAt) / 10) * Math.PI) * 0.5 + 0.5) : t >= leakAt ? 0.6 : 0.6;
  const cycles = Math.round(lerp(0, 3000, clamp01((t - cycAt) / (thousandAt + 10 - cycAt))));
  const wear = clamp01((t - cycAt) / (leakAt - cycAt));
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.65} strength={0.12} rim={t >= leakAt ? C.error : undefined} />
        <IsoScene width={W} height={H} u={44} origin={[W * 0.3, H * 0.56]}>
          <Bucket t={t} x={-3} y={-3} w={6} d={6} h={8} fill={phase * 0.85} gate={cycling ? (phase < 0.5 ? 0.6 : 0) : 0} worn={wear * 0.8}
                  eAt={t >= leakAt ? leakAt - 30 : undefined} eCount={18} leak={t >= leakAt ? 1 : 0} leakAt={leakAt} seed={4} />
        </IsoScene>
        <DepthBands W={W} H={H} band={0.07} blur={10} />
      </StageBand>
      <div style={{position: 'absolute', left: W * 0.58, top: H * 0.36, opacity: prog(t, cycAt - 4, 6)}}>
        <DrumCounter t={t} at={cycAt} to={3000} dur={thousandAt + 10 - cycAt} size={70 * u} label="rewrites" digits={4} accent={wear > 0.8 ? C.error : C.warn} />
        <div style={{marginTop: 40 * u}}>
          <Meter value={wear * 1.05} w={W * 0.32} h={22 * u} u={u} label="gate wear" />
        </div>
      </div>
      <div style={{position: 'absolute', left: W * 0.14, top: H * 0.63}}>
        {t >= leakAt + 6 ? <Stamp t={t} at={leakAt + 6} text="Leaking" u={u} color={C.error} /> : null}
      </div>
      <div style={{display: 'none'}}>{cycles}</div>
    </>
  );
};

const S08: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const neverAt = cue(spec, 'never', 62), leastAt = cue(spec, 'least', 145), movedAt = cue(spec, 'moved', 196) - 10;
  const N = 8;
  const wear0 = (i: number) => 0.15 + rnd(i * 7.7) * 0.75;
  // order tiles by wear: writes go to the least worn
  const order = Array.from({length: N * N}, (_, i) => i).sort((a, b) => wear0(a) - wear0(b));
  const writes = [0, 1, 2, 3, 4, 5].map((k) => ({tile: order[k], at: leastAt - 4 + k * 5}));
  const hammer = 27; // a tile written repeatedly in the 'never rewrites the same cell' beat
  const tiles: React.ReactNode[] = [];
  const cells: [number, number][] = [];
  for (let r = 0; r < N; r++) for (let k = 0; k < N; k++) cells.push([r, k]);
  cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [r, k] of cells) {
    const i = r * N + k;
    let w = wear0(i);
    for (const wr of writes) if (wr.tile === i && t >= wr.at + 7) w += 0.08;
    if (i === hammer && t >= neverAt - 6 && t < leastAt - 10) w = Math.min(1, w + (t - neverAt + 6) / 30);
    const col = w < 0.5 ? mix('#2F6FD6', '#3FB9A0', w * 2) : mix('#3FB9A0', w > 0.85 ? C.error : C.warn, (w - 0.5) * 2);
    tiles.push(<IsoBox key={i} x={k} y={r} w={0.86} d={0.86} h={0.3 + w * 0.5} color={col} gloss={0.4} sheen={0.7} ao={false} />);
  }
  const drops: React.ReactNode[] = [];
  const dropAt = (tile: number, at: number, key: string) => {
    if (t < at || t > at + 14) return;
    const r = Math.floor(tile / N), k = tile % N;
    const z = lerp(6, 0.9, clamp01((t - at) / 7));
    drops.push(<IsoBox key={key} x={k + 0.18} y={r + 0.18} z={z} w={0.5} d={0.5} h={0.5} color="#FFFFFF" emissive={C.info} gloss={0.6} />);
  };
  writes.forEach((wr, k) => dropAt(wr.tile, wr.at, `w${k}`));
  if (t >= neverAt - 8 && t < leastAt - 10) for (let k = 0; k < 4; k++) dropAt(hammer, neverAt - 8 + k * 8, `h${k}`);
  // background moves: data slides from worn tiles to cool tiles
  const moves = [[order[63], order[6]], [order[60], order[7]], [order[58], order[8]]];
  moves.forEach(([a, b], k) => {
    const at = movedAt + k * 6;
    if (t < at || t > at + 18) return;
    const q = clamp01((t - at) / 14);
    const ra = Math.floor(a / N), ka = a % N, rb = Math.floor(b / N), kb = b % N;
    drops.push(<IsoBox key={`m${k}`} x={lerp(ka, kb, q) + 0.25} y={lerp(ra, rb, q) + 0.25} z={1.2 + Math.sin(q * Math.PI) * 1.5} w={0.4} d={0.4} h={0.4}
                       color={C.ok} emissive={C.ok} />);
  });
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.7} strength={0.12} />
        <IsoScene width={W} height={H} u={64} origin={[W * 0.5, H * 0.31]}>{tiles}{drops}</IsoScene>
        <DepthBands W={W} H={H} band={0.07} blur={10} />
      </StageBand>
      <div style={{position: 'absolute', left: W * 0.06, top: H * 0.27, fontFamily: FONT, fontSize: 26 * u, color: '#AEB3BA', fontWeight: 600,
                   opacity: prog(t, 4, 8)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10 * u}}>
          <span>fresh</span>
          <div style={{width: 180 * u, height: 14 * u, borderRadius: 7 * u, background: `linear-gradient(90deg, #2F6FD6, #3FB9A0, ${C.warn}, ${C.error})`}} />
          <span>worn</span>
        </div>
      </div>
      {t >= neverAt + 20 && t < leastAt - 6 ? (
        <div style={{position: 'absolute', left: W * 0.68, top: H * 0.33}}><Badge t={t} at={neverAt + 20} kind="error" size={90 * u} /></div>
      ) : null}
      {t >= leastAt ? <div style={{position: 'absolute', left: W * 0.66, top: H * 0.31}}><Badge t={t} at={leastAt + 2} kind="ok" size={90 * u} /></div> : null}
    </>
  );
};

const S09: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const u = unit(W);
  const sixAt = cue(spec, '600', 77), overAt = cue(spec, 'over', 128);
  return (
    <>
      <EvidenceDoc t={t} at={2} W={W} H={H} source="manufacturer spec sheet · 1 TB TLC NVMe" title="Endurance rating"
                   lines={['Capacity: 1 TB', 'Rated endurance: 600 TBW', 'Warranty: 5 years']} markLine={1} markAt={sixAt - 2}
                   footnote="Typical 1 TB TLC drives (e.g. WD Blue SN580, Samsung 980 PRO)" />
      <HeroNumber t={t} at={overAt - 6} to={329} W={W} H={H} unitText="GB / day" label="for 5 years" y={H * 0.53} />
    </>
  );
};

const S10: React.FC<SceneProps> = ({t, W, H, spec}) => {
  const chargeAt = cue(spec, 'charge', 76), aliveAt = cue(spec, 'alive', 199) - 4;
  const keys: CamKey[] = [{t: -6, s: 1.3, x: boardPoint([36, 9, 2])[0], y: boardPoint([36, 9, 2])[1]}, {t: 4, s: 0.98, x: W / 2, y: 0.485 * H, kind: 'push', dur: 60}];
  const lit = sp(t, chargeAt, 'pop');
  const u = unit(W);
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.72} strength={0.12 + 0.06 * lit} />
        <StageCamera t={t} W={W} H={H} keys={keys}>
          <SsdBoard t={t} W={W} H={H} xray={[1, 1]} lit={lit} activeRow={undefined} />
        </StageCamera>
        <DepthBands W={W} H={H} band={0.075} blur={12} />
      </StageBand>
      {t >= aliveAt ? <div style={{position: 'absolute', left: W * 0.45, top: H * 0.29}}><Badge t={t} at={aliveAt} kind="ok" size={100 * u} /></div> : null}
    </>
  );
};

const S11: React.FC<SceneProps> = ({t, W, H}) => <SocialCTA t={t} at={0} W={W} H={H} name="Explained in 90s" handle="tech, explained in 90 seconds" />;

export const SCENES = {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11};
