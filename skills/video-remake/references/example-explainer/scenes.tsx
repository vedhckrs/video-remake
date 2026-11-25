import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {IsoScene, IsoBox, IsoChip, IsoBoard, project as isoProject} from '../../src/kit/explainer/iso';
import {StageCamera, camPoint, type CamKey, Callout, BigNumber, Bars, UnitGrid, Card, Marker, Stamp, Badge, FlowPath, Footnote, FONT} from '../../src/kit/explainer/stage';
import {C, unit, sp} from '../../src/kit/explainer/tokens';
import {CompareSplit, EvidenceDoc, SocialCTA, Terminal} from '../../src/kit/explainer/templates';

const Hero: React.FC<SceneProps> = ({t, W, H}) => {
  const u = unit(W);
  const U = 22 * u, ox = W / 2, oy = H * 0.37;
  const tilt = Math.min(1, sp(t, 2, 'settle'));
  const at = (p: [number, number, number]): [number, number] => {
    const [x, y] = isoProject(p, {u: U, tilt: 1, mode: 'dark'});
    return [x + ox, y + oy];
  };
  const keys: CamKey[] = [{t: 0, s: 0.92}, {t: 62, s: 1.0}, {t: 100, x: at([3, 5, 2])[0], y: at([3, 5, 2])[1], s: 1.9, kind: 'push'}];
  const cp = (p: [number, number, number]) => camPoint(t, keys, W, H, at(p));
  return (
    <>
      <StageCamera t={t} W={W} H={H} keys={keys}>
        <IsoScene width={W} height={H} u={U} origin={[ox, oy]} tilt={tilt}>
          <IsoBoard x={-10} y={-4} w={22} d={14} color={C.pcbDark}>
            <IsoChip x={-8} y={-1} w={7} d={7} label="CTRL" sub="NVMe" />
            {[0, 1, 2].map((i) => <IsoChip key={i} x={1 + i * 3.6} y={1} w={3} d={8} label="" substrate={C.substrateBeige} lid={C.chipDark}
                                           xray={Math.min(1, Math.max(0, (t - 88) / 14)) * (i === 1 ? 1 : 0)} dieColor={C.info} />)}
            <IsoBox x={-9} y={8} w={3} d={1.6} h={0.4} color={C.goldRich} />
          </IsoBoard>
        </IsoScene>
      </StageCamera>
      <Callout t={t} at={34} out={96} from={cp([-4.5, 2.5, 1.6])} to={[W * 0.16, H * 0.31]} text="Controller" gloss="the traffic cop" W={W} />
      <Callout t={t} at={66} from={cp([6, 5, 1.6])} to={[W * 0.86, H * 0.62]} text="NAND flash" sub="3 chips" W={W} color={C.info} />
    </>
  );
};

const Numbers: React.FC<SceneProps> = ({t, W, H}) => {
  const u = unit(W);
  return (
    <>
      <BigNumber t={t} at={4} to={4} unitText="bits / cell" W={W} x={W / 2} y={H * 0.36} sizeFrac={0.09} label="QLC flash" />
      <div style={{position: 'absolute', left: W * 0.14, top: H * 0.45}}>
        <Bars t={t} at={22} values={[0.25, 0.5, 0.75, 1]} labels={['SLC', 'MLC', 'TLC', 'QLC']} colors={[C.neutral, C.neutral, C.neutral, C.info]}
              w={W * 0.72} h={H * 0.16} u={u} valueText={(v, i) => `${i + 1}`} />
      </div>
      <Footnote t={t} at={30} text="Source: illustration, not to scale" W={W} H={H} />
    </>
  );
};

const Flow: React.FC<SceneProps> = ({t, W, H}) => {
  const u = unit(W);
  const cells = (
    <UnitGrid t={t} at={6} n={24} cols={6} cell={64 * u} gap={12 * u} lit={Math.floor(Math.min(24, Math.max(0, (t - 30) * 0.8)))} litColor={C.ok} color="#D9DCE1" />
  );
  return (
    <>
      <div style={{position: 'absolute', left: W * 0.5 - 213 * u, top: H * 0.43}}>{cells}</div>
      <Card t={t} at={2} x={W * 0.18} y={H * 0.28} w={W * 0.64} u={u} mode="light" from="pop">
        <div style={{fontSize: 34 * u, fontWeight: 600}}>Every write goes to the <Marker t={t} at={24}>least-worn cell</Marker>.</div>
      </Card>
      <FlowPath t={t} at={10} points={[[W * 0.2, H * 0.4], [W * 0.2, H * 0.55], [W * 0.3, H * 0.55]]} u={u} color={C.info} packets={[{at: 20}, {at: 36}]} />
      <div style={{position: 'absolute', left: W * 0.62, top: H * 0.62}}><Stamp t={t} at={48} text="Even wear" u={u} /></div>
      <div style={{position: 'absolute', left: W * 0.24, top: H * 0.63}}><Badge t={t} at={44} kind="ok" size={70 * u} /></div>
    </>
  );
};

const Compare: React.FC<SceneProps> = ({t, W, H}) => (
  <CompareSplit t={t} at={2} W={W} H={H} left={{title: 'Hard drive', value: 120, unit: 'MB/s'}} right={{title: 'NVMe SSD', value: 7000, unit: 'MB/s', color: C.ok}}
                winner="right" stampText="58x faster" />
);
const Doc: React.FC<SceneProps> = ({t, W, H}) => (
  <>
    <EvidenceDoc t={t} at={2} W={W} H={H} source="spec-sheet.example.com" title="Endurance rating" markLine={1}
                 lines={['Rated for 600 TB written.', 'That is 330 GB every day for 5 years.', 'Wear levelling spreads every write.']} footnote="Illustrative figures" />
    <Terminal t={t} at={34} W={W} H={H * 1.55} steps={[{type: 'smartctl -a /dev/nvme0', at: 38}, {print: 'Percentage Used: 3%', at: 60, color: C.ok}]} />
  </>
);
const Cta: React.FC<SceneProps> = ({t, W, H}) => <SocialCTA t={t} at={2} W={W} H={H} name="Explained in 90s" />;

export const SCENES = {hero: Hero, numbers: Numbers, flow: Flow, compare: Compare, doc: Doc, cta: Cta};
