import React from 'react';
import type {SceneProps} from '../../src/kit/types';
import {IsoScene, IsoBox, OnFace, project as isoProject} from '../../src/kit/explainer/iso';
import {EpoxyChip, GoldFingers, SmdArray, TracePattern, Silk, MountHole, CellField, StageLight, DepthBands, StageBand, MAT} from '../../src/kit/explainer/hardware';
import {StageCamera, camPoint, type CamKey, Callout} from '../../src/kit/explainer/stage';
import {C} from '../../src/kit/explainer/tokens';

const U = 19.5;

const Hero: React.FC<SceneProps> = ({t, W, H}) => {
  const origin: [number, number] = [169, 552];
  const ctx = {u: U, tilt: 1, mode: 'dark' as const};
  const at = (p: [number, number, number]): [number, number] => {
    const [x, y] = isoProject(p, ctx);
    return [x + origin[0], y + origin[1]];
  };
  const keys: CamKey[] = [{t: 0, s: 1.0}];
  const cp = (p: [number, number, number]) => camPoint(t, keys, W, H, at(p));
  const xray = Math.min(1, Math.max(0, (t - 26) / 14));
  const bw = 62, bd = 18, bh = 0.8, Z = bh;
  const boardTop = (
    <g>
      <TracePattern ch={(100 * bd) / bw} seed={4} n={90} />
      <Silk x={30} y={27.6} text="M.2 2280 NVMe  PCIe Gen4 x4" size={1.25} />
      <Silk x={66} y={2.4} text="SN 2X4K9-0021" size={1.0} />
      <Silk x={74} y={27.6} text="R14 C22" size={1.0} />
      <MountHole cx={100} cy={14.5} r={2.6} />
    </g>
  );
  return (
    <>
      <StageBand W={W} H={H}>
        <StageLight W={W} H={H} cy={0.5} r={0.7} strength={0.12} />
        <StageCamera t={t} W={W} H={H} keys={keys} drift={0.04}>
          <IsoScene width={W} height={H} u={U} origin={origin}>
            <IsoBox x={0} y={0} z={0} w={bw} d={bd} h={bh} color={MAT.pcb.color} gloss={0.25} sheen={0.6} shadow={0.7}
                    topContent={{cw: 100, ch: (100 * bd) / bw, node: boardTop}} />
            <GoldFingers x={0.2} y={1.2} z={Z} n={28} pitch={0.56} gapAt={6} />
            <SmdArray x={6} y={0.6} z={Z} cols={9} rows={1} dx={2.3} seed={3} />
            <EpoxyChip x={7} y={3.2} z={Z} w={11} d={11} h={1.3} logo="CTRL" lines={['PCIe 4.0 x4', 'NVMe 2.0  12nm']} />
            <SmdArray x={7} y={15.2} z={Z} cols={6} rows={1} dx={2.0} seed={8} />
            <SmdArray x={20} y={1} z={Z} cols={3} rows={2} dx={2.2} dy={1.6} seed={5} />
            <EpoxyChip x={20.5} y={5.5} z={Z} w={5.5} d={8.5} h={1.1} logo="DRAM" lines={['LPDDR4', '1 GB']} />
            <SmdArray x={20} y={15.2} z={Z} cols={4} rows={1} dx={2.1} seed={12} />
            <EpoxyChip x={29} y={2.4} z={Z} w={12.5} d={13} h={1.3} logo="NAND" lines={['3D TLC  176L', '512 GB']} xray={xray}
                       xrayNode={<CellField cw={100} ch={104} t={t} lit={C.info} activeRow={6} />} />
            <SmdArray x={29} y={15.8} z={Z} cols={6} rows={1} dx={2.1} seed={21} />
            <EpoxyChip x={44} y={2.4} z={Z} w={12.5} d={13} h={1.3} logo="NAND" lines={['3D TLC  176L', '512 GB']} />
            <SmdArray x={44} y={15.8} z={Z} cols={6} rows={1} dx={2.1} seed={33} />
            <SmdArray x={58} y={1} z={Z} cols={1} rows={6} dy={2.1} seed={41} along="y" />
          </IsoScene>
        </StageCamera>
        <DepthBands W={W} H={H} top={0.235} bottom={0.735} band={0.075} blur={12} />
      </StageBand>
      <Callout t={t} at={14} from={cp([12.5, 8.7, Z + 1.3])} to={[W * 0.2, H * 0.3]} text="Controller" gloss="the traffic cop" W={W} />
      <Callout t={t} at={34} from={cp([35, 9, Z + 1.3])} to={[W * 0.86, H * 0.67]} text="NAND flash" gloss="billions of cells" W={W} color={C.info} />
    </>
  );
};

export const SCENES = {hero: Hero};
