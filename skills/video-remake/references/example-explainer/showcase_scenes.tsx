import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {IsoScene, IsoBox, IsoCylinder} from '../../src/kit/explainer/iso';
import {MAT, EpoxyChip, StageBand, DepthBands, StageLight} from '../../src/kit/explainer/hardware';
import {Callout} from '../../src/kit/explainer/stage';
import {MacroDie, HeroNumber, IsoBarChart, IsoTileField} from '../../src/kit/explainer/premium';
import {CompareSplit, EvidenceDoc, Terminal, ChapterCard, SocialCTA} from '../../src/kit/explainer/templates';
import {C, unit} from '../../src/kit/explainer/tokens';

const Macro: React.FC<SceneProps> = ({t, W, H}) => (
  <>
    <StageBand W={W} H={H}>
      <MacroDie W={W} H={H} t={t} at={0} cy={0.485} zoom={1 + Math.min(1, Math.max(0, t / 90)) * 0.12} label="SN 7X-2446" serial="2446 1E · 8HX144" />
      <DepthBands W={W} H={H} band={0.08} blur={14} />
    </StageBand>
    <Callout t={t} at={20} from={[W * 0.4, H * 0.45]} to={[W * 0.7, H * 0.27]} text="Compute die" gloss="billions of transistors" W={W} color={C.info} />
  </>
);

const Num: React.FC<SceneProps> = ({t, W, H}) => (
  <>
    <StageLight W={W} H={H} cy={0.46} r={0.6} strength={0.1} />
    <HeroNumber t={t} at={2} to={7450} W={W} H={H} unitText="MB/s" label="sequential read" source="PCIe 4.0 x4 drive, illustrative" y={H * 0.36} />
  </>
);

const Bars: React.FC<SceneProps> = ({t, W, H}) => (
  <>
    <StageLight W={W} H={H} cy={0.5} r={0.65} strength={0.1} />
    <IsoBarChart t={t} at={4} values={[0.25, 0.5, 0.75, 1]} labels={['SLC', 'MLC', 'TLC', 'QLC']} W={W} H={H} u={34} origin={[W * 0.2, H * 0.5]}
                 valueText={(v, i) => `${i + 1} bit${i ? 's' : ''}`} highlight={3} />
  </>
);

const Tiles: React.FC<SceneProps> = ({t, W, H}) => (
  <>
    <StageBand W={W} H={H}>
      <StageLight W={W} H={H} cy={0.5} r={0.7} strength={0.1} />
      <IsoTileField t={t} at={0} cols={14} rows={14} W={W} H={H} u={44} origin={[W * 0.5, H * 0.24]} lit={Math.floor(Math.max(0, t - 30) * 2.2)} litAt={30} />
      <DepthBands W={W} H={H} band={0.07} blur={10} />
    </StageBand>
  </>
);

const Hdd: React.FC = () => (
  <svg width={360} height={260} style={{overflow: 'visible'}}>
    <IsoScene width={360} height={260} u={15} origin={[180, 60]}>
      <IsoBox x={0} y={0} w={14} d={10} h={1.6} color={MAT.metal.color} gloss={0.8} sheen={0.9} shadow={0.6} />
      <IsoCylinder cx={6} cy={5} z={1.6} r={4} h={0.2} color="#D6DAE0" />
    </IsoScene>
  </svg>
);
const Ssd: React.FC = () => (
  <svg width={360} height={260} style={{overflow: 'visible'}}>
    <IsoScene width={360} height={260} u={15} origin={[180, 60]}>
      <IsoBox x={0} y={0} w={16} d={6} h={0.4} color={MAT.pcb.color} gloss={0.3} sheen={0.6} shadow={0.6} />
      <EpoxyChip x={1.5} y={1} w={4} d={4} h={0.6} logo="" />
      <EpoxyChip x={7} y={1} w={4} d={4} h={0.6} logo="" />
      <EpoxyChip x={11.5} y={1} w={3.5} d={4} h={0.6} logo="" />
    </IsoScene>
  </svg>
);

const Compare: React.FC<SceneProps> = ({t, W, H}) => (
  <CompareSplit t={t} at={2} W={W} H={H} left={{title: 'Hard drive', value: 160, unit: 'MB/s', node: <Hdd />}}
                right={{title: 'NVMe SSD', value: 7450, unit: 'MB/s', color: C.ok, node: <Ssd />}} winner="right" stampText="46x faster" />
);

const Evidence: React.FC<SceneProps> = ({t, W, H}) => (
  <>
    <EvidenceDoc t={t} at={2} W={W} H={H} source="spec-sheet.example.com" title="Endurance rating" markLine={1}
                 lines={['Rated for 600 TB written.', '330 GB every day for 5 years.', 'Wear levelling spreads every write.']} footnote="Illustrative figures" />
    <Terminal t={t} at={40} W={W} H={H} y={H * 0.5} steps={[{type: 'smartctl -a /dev/nvme0', at: 44}, {print: 'Percentage Used:  3%', at: 66, color: C.ok}]} />
  </>
);

const Chapter: React.FC<SceneProps> = ({t, W, H}) => <ChapterCard t={t} at={2} W={W} H={H} n={2} title="Wear levelling" />;
const Cta: React.FC<SceneProps> = ({t, W, H}) => <SocialCTA t={t} at={2} W={W} H={H} name="Explained in 90s" />;

export const SCENES = {macro: Macro, number: Num, bars: Bars, tiles: Tiles, compare: Compare, evidence: Evidence, chapter: Chapter, cta: Cta};
