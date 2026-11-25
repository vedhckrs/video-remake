// Hardware art for S08/S09: a generic, unbranded PC graphics card (front view: shroud, three spinning fans, backplate
// edge, PCB edge with gold fingers, I/O bracket, power lead, glowing accents) on a full-bleed mainboard.
import React from 'react';
import {FONT, MONO} from '../../../src/kit/explainer/stage';

export const CARD = {x: 550, y: 2310, w: 1500, h: 700};
export const BOARD_TOP = 2232;
const CYAN = '#5CF0FF', MAG = '#FF4FD8', VIO = '#8B6CFF';

const rnd = (s: number) => {
  const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export const CardDefs: React.FC = () => (
  <>
    <linearGradient id="gc-shroud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A3F4E" /><stop offset="0.18" stopColor="#23262F" /><stop offset="0.8" stopColor="#15171D" /><stop offset="1" stopColor="#0B0C10" /></linearGradient>
    <linearGradient id="gc-facet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4A5063" /><stop offset="1" stopColor="#1B1D25" /></linearGradient>
    <linearGradient id="gc-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2F5FA" /><stop offset="0.35" stopColor="#8E97A8" /><stop offset="0.6" stopColor="#C9D0DC" /><stop offset="1" stopColor="#59606E" /></linearGradient>
    <linearGradient id="gc-metalh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6C7484" /><stop offset="0.4" stopColor="#E6EAF1" /><stop offset="0.7" stopColor="#8E97A8" /><stop offset="1" stopColor="#474D59" /></linearGradient>
    <linearGradient id="gc-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBE7AE" /><stop offset="0.5" stopColor="#D1AB52" /><stop offset="1" stopColor="#7A5E1E" /></linearGradient>
    <linearGradient id="gc-accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={CYAN} /><stop offset="0.55" stopColor={VIO} /><stop offset="1" stopColor={MAG} /></linearGradient>
    <linearGradient id="gc-blade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#555C70" /><stop offset="0.5" stopColor="#2A2E3A" /><stop offset="1" stopColor="#14161C" /></linearGradient>
    <radialGradient id="gc-hub"><stop offset="0" stopColor="#4B5164" /><stop offset="0.7" stopColor="#1D2029" /><stop offset="1" stopColor="#0C0D12" /></radialGradient>
    <radialGradient id="gc-pool"><stop offset="0" stopColor={VIO} stopOpacity="0.6" /><stop offset="0.5" stopColor={MAG} stopOpacity="0.16" /><stop offset="1" stopColor={MAG} stopOpacity="0" /></radialGradient>
    <radialGradient id="gc-cpool"><stop offset="0" stopColor={CYAN} stopOpacity="0.5" /><stop offset="1" stopColor={CYAN} stopOpacity="0" /></radialGradient>
    <linearGradient id="gc-board" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141230" /><stop offset="0.5" stopColor="#0C0B1E" /><stop offset="1" stopColor="#060510" /></linearGradient>
    <pattern id="gc-fins" width={12} height={40} patternUnits="userSpaceOnUse"><rect width={12} height={40} fill="#07080B" /><rect x={2} width={6} height={40} fill="#737B8C" /><rect x={2} width={2} height={40} fill="#C5CCD9" /></pattern>
    <pattern id="gc-brush" width={9} height={4} patternUnits="userSpaceOnUse"><rect width={9} height={1} fill="#FFFFFF" opacity={0.08} /></pattern>
    <pattern id="gc-traces" width={240} height={240} patternUnits="userSpaceOnUse">
      <path d="M0 30H70L100 60H170L200 30H240M0 120H40L70 150H140L170 120H240M0 205H110L140 175H240M34 0V54L64 84V160L34 190V240M120 0V22L150 52V118M205 0V96L175 126V240" fill="none" stroke="#6E5BD6" strokeWidth={3} opacity={0.55} />
      <path d="M0 76H34M84 104H126L146 124M156 216H206" fill="none" stroke="#C9A24A" strokeWidth={2.5} opacity={0.5} />
      {[[70, 30], [170, 60], [70, 150], [140, 175], [150, 52], [34, 190], [205, 96], [120, 22]].map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r={7} fill="#D9B45E" opacity={0.8} /><circle cx={x} cy={y} r={3} fill="#070612" /></g>
      ))}
    </pattern>
  </>
);

const BLADE = 'M58,-12 C92,-70 166,-76 206,-26 C178,-2 122,16 64,28 Z';

const Fan: React.FC<{cx: number; cy: number; ang: number; glow: number; load: number}> = ({cx, cy, ang, glow, load}) => (
  <g transform={`translate(${cx},${cy})`}>
    <circle r={244} fill="#06070A" />
    <circle r={236} fill="none" stroke="url(#gc-metal)" strokeWidth={9} opacity={0.85} />
    <circle r={225} fill="none" stroke="url(#gc-accent)" strokeWidth={7} opacity={0.2 + 0.8 * glow} />
    <circle r={225} fill="none" stroke={CYAN} strokeWidth={22} opacity={0.14 * glow} />
    <circle r={217} fill="#090A0E" />
    <g transform={`rotate(${ang})`}>
      {Array.from({length: 11}).map((_, i) => <path key={i} d={BLADE} transform={`rotate(${(i * 360) / 11})`} fill="url(#gc-blade)" stroke="#6B7389" strokeWidth={2} />)}
    </g>
    <circle r={212} fill="#9FB0D6" opacity={0.04 + 0.1 * load} />
    <circle r={70} fill="url(#gc-hub)" stroke="#5A6177" strokeWidth={3} />
    <circle r={48} fill="none" stroke="url(#gc-accent)" strokeWidth={5} opacity={0.35 + 0.65 * glow} />
    <path d="M0,-26 L22.5,-13 L22.5,13 L0,26 L-22.5,13 L-22.5,-13 Z" fill="none" stroke="#C9D0DC" strokeWidth={4} opacity={0.8} />
    <circle r={7} fill="#C9D0DC" />
    <path d="M-170,-150 A227,227 0 0 1 60,-219" fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
  </g>
);

/** the graphics card, drawn at CARD.x / CARD.y */
export const GraphicsCard: React.FC<{ang: number; glow: number; load: number; name: number; flash: number}> = ({ang, glow, load, name, flash}) => {
  const {w, h} = CARD;
  const fanY = 336;
  return (
    <g transform={`translate(${CARD.x},${CARD.y})`}>
      {/* light pool + shadow */}
      <ellipse cx={w / 2} cy={h / 2 + 30} rx={w * 0.72} ry={h * 0.95} fill="url(#gc-pool)" opacity={0.25 + 0.75 * glow} />
      <rect x={18} y={40} width={w} height={h} rx={40} fill="#000" opacity={0.6} />
      {/* power lead on the right end */}
      {[0, 1].map((k) => (
        <g key={k}>
          <path d={`M${w + 30},${150 + k * 70} C${w + 220},${150 + k * 70} ${w + 260},${330 + k * 40} ${w + 700},${350 + k * 60}`} fill="none" stroke="#0B0C10" strokeWidth={46} strokeLinecap="round" />
          <path d={`M${w + 30},${150 + k * 70} C${w + 220},${150 + k * 70} ${w + 260},${330 + k * 40} ${w + 700},${350 + k * 60}`} fill="none" stroke="#2B2F3B" strokeWidth={34} strokeLinecap="round" strokeDasharray="10 9" />
          <path d={`M${w + 30},${142 + k * 70} C${w + 220},${142 + k * 70} ${w + 260},${322 + k * 40} ${w + 700},${342 + k * 60}`} fill="none" stroke="#7B8499" strokeWidth={3} opacity={0.5} />
        </g>
      ))}
      <rect x={w - 6} y={104} width={64} height={166} rx={10} fill="#111319" stroke="#4A5063" strokeWidth={3} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={w + 10} y={116 + i * 38} width={34} height={26} rx={5} fill="#000" stroke="#D1AB52" strokeWidth={2} />)}
      {/* I/O bracket */}
      <rect x={-64} y={-34} width={70} height={h + 84} rx={8} fill="url(#gc-metalh)" stroke="#2F343E" strokeWidth={3} />
      <rect x={-64} y={-34} width={150} height={30} rx={8} fill="url(#gc-metal)" stroke="#2F343E" strokeWidth={3} />
      <circle cx={52} cy={-19} r={9} fill="#20232B" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-48} y={70 + i * 140} width={38} height={96} rx={8} fill="#0A0B0F" stroke="#4A5063" strokeWidth={2} />)}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={-40} y={84 + i * 140} width={22} height={68} rx={4} fill="none" stroke="#D1AB52" strokeWidth={2} opacity={0.7} />)}
      {/* PCB edge + gold fingers */}
      <rect x={6} y={h - 96} width={w - 12} height={96} rx={10} fill="#0D1A1F" stroke="#1F3F45" strokeWidth={3} />
      {Array.from({length: 28}).map((_, i) => <rect key={i} x={70 + i * 50 + (rnd(i) > 0.5 ? 8 : 0)} y={h - 34} width={rnd(i * 3) > 0.6 ? 26 : 14} height={18} rx={3} fill={rnd(i * 7) > 0.5 ? '#C9B79A' : '#3B3F4B'} />)}
      <rect x={150} y={h - 6} width={820} height={64} fill="#0D1A1F" />
      {Array.from({length: 38}).map((_, i) => (i === 6 ? null : <rect key={i} x={160 + i * 21.2} y={h - 2} width={14} height={56} rx={3} fill="url(#gc-gold)" />))}
      {/* backplate edge */}
      <rect x={0} y={0} width={w} height={46} rx={14} fill="url(#gc-metal)" stroke="#2F343E" strokeWidth={3} />
      <rect x={0} y={0} width={w} height={46} rx={14} fill="url(#gc-brush)" />
      {[60, 420, 1080, 1440].map((x) => <g key={x}><circle cx={x} cy={23} r={11} fill="#3A404C" /><path d={`M${x - 6},23H${x + 6}M${x},17V29`} stroke="#11131A" strokeWidth={3} /></g>)}
      {/* shroud */}
      <path d={`M40,46 H${w - 40} L${w},86 V${h - 110} L${w - 40},${h - 70} H40 L0,${h - 110} V86 Z`} fill="url(#gc-shroud)" stroke="#4A5063" strokeWidth={3} />
      <rect x={70} y={58} width={w - 140} height={36} fill="url(#gc-fins)" opacity={0.9} />
      <rect x={70} y={h - 118} width={w - 140} height={36} fill="url(#gc-fins)" opacity={0.9} />
      {/* angular facets */}
      <path d={`M0,86 L40,46 H250 L130,${fanY} L250,${h - 70} H40 L0,${h - 110} Z`} fill="url(#gc-facet)" opacity={0.55} />
      <path d={`M${w},86 L${w - 40},46 H${w - 250} L${w - 130},${fanY} L${w - 250},${h - 70} H${w - 40} L${w},${h - 110} Z`} fill="url(#gc-facet)" opacity={0.4} />
      {[510, 990].map((x, k) => (
        <g key={x}>
          <path d={`M${x - 70},100 H${x + 70} L${x + 22},${fanY} L${x + 70},${h - 124} H${x - 70} L${x - 22},${fanY} Z`} fill="#0F1116" stroke="#4A5063" strokeWidth={2.5} />
          <path d={`M${x + 14},112 L${x - 30},${h - 136} H${x - 14} L${x + 30},112 Z`} fill="url(#gc-accent)" opacity={0.25 + 0.75 * glow} />
          <path d={`M${x + 14},112 L${x - 30},${h - 136} H${x - 14} L${x + 30},112 Z`} fill="none" stroke={k ? MAG : CYAN} strokeWidth={22} opacity={0.16 * glow} />
        </g>
      ))}
      <Fan cx={270} cy={fanY} ang={ang} glow={glow} load={load} />
      <Fan cx={750} cy={fanY} ang={-ang * 1.04 + 12} glow={glow} load={load} />
      <Fan cx={1230} cy={fanY} ang={ang * 0.97 + 20} glow={glow} load={load} />
      {/* top light bar + name */}
      <rect x={110} y={12} width={w - 620} height={8} rx={4} fill="url(#gc-accent)" opacity={0.25 + 0.75 * glow} />
      <rect x={110} y={2} width={w - 620} height={28} rx={14} fill={CYAN} opacity={0.14 * glow} />
      <text x={w - 100} y={34} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#11131A" letterSpacing={9}>GRAPHICS CARD</text>
      {name > 0.01 ? <text x={w - 100} y={34} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#FFFFFF" opacity={name} letterSpacing={9}>GRAPHICS CARD</text> : null}
      {/* rim light */}
      <path d={`M40,47 H${w - 40}`} stroke="#FFFFFF" strokeWidth={3} opacity={0.5} />
      {flash > 0.01 ? <path d={`M40,46 H${w - 40} L${w},86 V${h - 110} L${w - 40},${h - 70} H40 L0,${h - 110} V86 Z`} fill="none" stroke="#FFFFFF" strokeWidth={10} opacity={flash} /> : null}
    </g>
  );
};

/** full-bleed mainboard under the card ("on a PC") */
export const Mainboard: React.FC<{on: number; t: number}> = ({on, t}) => {
  const slotY = CARD.y + CARD.h + 24;
  return (
    <g>
      <rect x={-900} y={BOARD_TOP} width={4400} height={2300} fill="url(#gc-board)" />
      <rect x={-900} y={BOARD_TOP} width={4400} height={2300} fill="url(#gc-traces)" opacity={0.75} />
      {/* top edge: metal lip + light strip */}
      <rect x={-900} y={BOARD_TOP - 6} width={4400} height={34} fill="url(#gc-metal)" opacity={0.85} />
      <rect x={-900} y={BOARD_TOP + 28} width={4400} height={9} fill="url(#gc-accent)" opacity={0.2 + 0.8 * on} />
      <rect x={-900} y={BOARD_TOP + 16} width={4400} height={36} fill={CYAN} opacity={0.12 * on} />
      <ellipse cx={1300} cy={BOARD_TOP + 60} rx={1500} ry={260} fill="url(#gc-cpool)" opacity={0.35 * on} />
      {/* VRM heatsink (left) */}
      <g transform="translate(150,2330)">
        <rect x={14} y={20} width={300} height={600} rx={18} fill="#000" opacity={0.5} />
        <rect width={300} height={600} rx={18} fill="url(#gc-metalh)" stroke="#2F343E" strokeWidth={3} />
        {Array.from({length: 13}).map((_, i) => <rect key={i} x={20} y={24 + i * 44} width={260} height={22} rx={6} fill="#1B1E27" opacity={0.75} />)}
        <path d="M210,0 L300,0 L300,600 L120,600 Z" fill="url(#gc-accent)" opacity={0.12 + 0.4 * on} />
      </g>
      {/* memory sticks (right) */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${2170 + i * 92},2320)`}>
          <rect x={8} y={10} width={64} height={720} rx={8} fill="#000" opacity={0.5} />
          <rect width={64} height={720} rx={8} fill="#171923" stroke="#4A5063" strokeWidth={2.5} />
          <rect x={10} y={14} width={44} height={692} rx={6} fill="url(#gc-brush)" />
          <rect x={22} y={14} width={20} height={692} rx={10} fill="url(#gc-accent)" opacity={0.25 + 0.75 * on * (0.7 + 0.3 * Math.sin(t / 9 + i))} />
        </g>
      ))}
      {/* the card's slot */}
      <rect x={CARD.x + 96} y={slotY + 8} width={980} height={70} rx={10} fill="#000" opacity={0.5} />
      <rect x={CARD.x + 90} y={slotY} width={980} height={70} rx={10} fill="#1B1D26" stroke="#5A6177" strokeWidth={3} />
      <rect x={CARD.x + 1070} y={slotY + 10} width={44} height={50} rx={8} fill="#C9D0DC" />
      <text x={CARD.x + 1150} y={slotY + 46} fontFamily={MONO} fontWeight={600} fontSize={28} fill="#B9B3F0" opacity={0.75} letterSpacing={5}>PCIE · GRAPHICS SLOT</text>
      {/* capacitors */}
      {Array.from({length: 9}).map((_, i) => (
        <g key={i} transform={`translate(${620 + i * 78},3190)`}>
          <circle cx={4} cy={6} r={28} fill="#000" opacity={0.5} /><circle r={28} fill="url(#gc-metal)" stroke="#2F343E" strokeWidth={2} />
          <path d="M-18,0H18M0,-18V18" stroke="#59606E" strokeWidth={3} /><path d="M-28,0 A28,28 0 0 1 0,-28 L0,0 Z" fill="#1B1D26" opacity={0.6} />
        </g>
      ))}
      {/* SSD cover */}
      <g transform="translate(590,3280)">
        <rect x={10} y={14} width={900} height={150} rx={18} fill="#000" opacity={0.5} />
        <rect width={900} height={150} rx={18} fill="url(#gc-metal)" stroke="#2F343E" strokeWidth={3} />
        <rect width={900} height={150} rx={18} fill="url(#gc-brush)" />
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={40 + i * 46} y={26} width={22} height={98} rx={11} fill="#2A2E38" opacity={0.6} />)}
        <text x={860} y={98} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={54} fill="#2A2E38" letterSpacing={10}>SSD</text>
        <circle cx={868} cy={34} r={10} fill="#3A404C" />
      </g>
      {/* chipset heatsink */}
      <g transform="translate(1590,3190)">
        <rect x={12} y={16} width={460} height={380} rx={26} fill="#000" opacity={0.5} />
        <rect width={460} height={380} rx={26} fill="url(#gc-shroud)" stroke="#4A5063" strokeWidth={3} />
        <path d="M0,150 L300,0 H360 L0,210 Z" fill="url(#gc-accent)" opacity={0.2 + 0.7 * on} />
        <path d="M100,380 L460,170 V230 L200,380 Z" fill="#2B2F3B" />
        <text x={40} y={340} fontFamily={MONO} fontWeight={600} fontSize={26} fill="#8E97A8" letterSpacing={6}>PC · MAINBOARD</text>
      </g>
      {/* second slot + headers */}
      <rect x={590} y={3490} width={900} height={62} rx={10} fill="#1B1D26" stroke="#5A6177" strokeWidth={3} />
      <rect x={612} y={3510} width={856} height={20} rx={4} fill="#06070A" />
      {Array.from({length: 18}).map((_, i) => <rect key={i} x={600 + i * 44} y={3610} width={26} height={26} rx={4} fill="#111319" stroke="#D1AB52" strokeWidth={2.5} />)}
      {Array.from({length: 18}).map((_, i) => <circle key={i} cx={613 + i * 44} cy={3623} r={5} fill="url(#gc-gold)" />)}
      <text x={600} y={3690} fontFamily={MONO} fontWeight={600} fontSize={24} fill="#B9B3F0" opacity={0.6} letterSpacing={5}>FRONT PANEL · FAN · RGB</text>
      {[0, 1, 2].map((i) => <g key={i} transform={`translate(${1620 + i * 150},3640)`}><rect width={120} height={90} rx={10} fill="#111319" stroke="#5A6177" strokeWidth={3} /><rect x={14} y={30} width={92} height={30} rx={4} fill="#06070A" /></g>)}
      <circle cx={380} cy={3300} r={84} fill="url(#gc-metal)" stroke="#2F343E" strokeWidth={3} /><circle cx={380} cy={3300} r={60} fill="none" stroke="#59606E" strokeWidth={3} />
      <path d="M350,3300H410M380,3270V3330" stroke="#3A404C" strokeWidth={6} />
    </g>
  );
};
