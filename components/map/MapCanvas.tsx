import { Cafe, MapTransform } from '@/types/cafe';
import CafePin from './CafePin';

const ROADS = [
  { d: 'M 0 450 L 1600 450',   w: 28, label: '테헤란로',  labelX: 780,  labelY: 444 },
  { d: 'M 340 0 L 340 1000',   w: 28, label: '강남대로',  labelX: 356,  labelY: 140, rotate: 90 },
  { d: 'M 1100 0 L 1100 1000', w: 22, label: '논현로',    labelX: 1116, labelY: 160, rotate: 90 },
  { d: 'M 720 0 L 720 1000',   w: 20, label: '언주로',    labelX: 736,  labelY: 180, rotate: 90 },
  { d: 'M 0 780 L 1600 780',   w: 22, label: '영동대로',  labelX: 1100, labelY: 774 },
  { d: 'M 0 220 L 1600 220',   w: 18, label: '학동로',    labelX: 420,  labelY: 214 },
  { d: 'M 0 640 L 1600 640',   w: 16, label: '선릉로',    labelX: 1200, labelY: 634 },
];

const BLOCKS = [
  [60, 80, 260, 130], [380, 260, 320, 170], [760, 260, 320, 170],
  [1140, 260, 420, 170], [60, 490, 260, 130], [380, 490, 320, 130],
  [760, 490, 320, 130], [1140, 490, 420, 130], [60, 680, 260, 260],
  [380, 680, 320, 80], [760, 680, 320, 80], [1140, 680, 120, 80],
  [380, 820, 320, 140], [760, 820, 320, 140],
];

const PARKS = [
  { x: 1280, y: 820, w: 260, h: 140, label: '선릉 공원' },
  { x: 60,   y: 80,  w: 180, h: 100, label: '역삼 근린공원' },
];

const DISTRICTS = [
  { x: 180,  y: 340, label: '역삼동', size: 18 },
  { x: 880,  y: 340, label: '논현동', size: 18 },
  { x: 540,  y: 840, label: '삼성동', size: 18 },
  { x: 1260, y: 560, label: '대치동', size: 18 },
  { x: 1380, y: 180, label: '청담동', size: 16 },
];

const SUBWAY = [
  { x: 340,  y: 450, label: '강남',    color: '#3c7be0' },
  { x: 720,  y: 450, label: '역삼',    color: '#3c7be0' },
  { x: 1100, y: 450, label: '선릉',    color: '#3c7be0' },
  { x: 720,  y: 780, label: '삼성중앙', color: '#946ae3' },
];

const minorStreets: string[] = [];
for (let y = 100; y < 1000; y += 90) minorStreets.push(`M 0 ${y} L 1600 ${y}`);
for (let x = 120; x < 1600; x += 110) minorStreets.push(`M ${x} 0 L ${x} 1000`);

interface MapCanvasProps {
  cafes: Cafe[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  transform: MapTransform;
}

export default function MapCanvas({
  cafes,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  transform,
}: MapCanvasProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden cursor-grab"
      style={{ background: 'var(--map-bg)' }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: 1600,
          height: 1000,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.s})`,
          transformOrigin: '0 0',
          transition: transform.animated ? 'transform 360ms var(--ease-out)' : 'none',
        }}
      >
        <svg width="1600" height="1000" viewBox="0 0 1600 1000" className="block">
          {/* Block fills */}
          <g>
            {BLOCKS.map((b, i) => (
              <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} fill="var(--map-block)" rx="4" />
            ))}
          </g>

          {/* Parks */}
          {PARKS.map((p, i) => (
            <g key={i}>
              <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="var(--map-park)" rx="8" />
              <text
                x={p.x + p.w / 2}
                y={p.y + p.h / 2 + 4}
                textAnchor="middle"
                style={{ fontSize: 12, fill: '#6a8a4e', fontFamily: 'var(--font-sans)', fontWeight: 500 }}
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* Minor streets */}
          <g stroke="var(--map-road-sub)" strokeWidth="6" opacity="0.7">
            {minorStreets.map((d, i) => <path key={i} d={d} />)}
          </g>
          <g stroke="var(--map-road-edge)" strokeWidth="0.8" opacity="0.5">
            {minorStreets.map((d, i) => <path key={i} d={d} />)}
          </g>

          {/* Major roads — outline */}
          <g stroke="var(--map-road-edge)" fill="none" strokeLinecap="square">
            {ROADS.map((r, i) => <path key={i} d={r.d} strokeWidth={r.w + 2} />)}
          </g>
          <g stroke="var(--map-road)" fill="none" strokeLinecap="square">
            {ROADS.map((r, i) => <path key={i} d={r.d} strokeWidth={r.w} />)}
          </g>

          {/* Dashed centerlines */}
          <g stroke="#CFD6DF" fill="none" strokeDasharray="8 8" strokeWidth="1.2">
            <path d="M 0 450 L 1600 450" />
            <path d="M 340 0 L 340 1000" />
          </g>

          {/* Road labels */}
          <g style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fill: 'var(--map-label)', fontWeight: 500 }}>
            {ROADS.map((r, i) => (
              <text
                key={i}
                x={r.labelX}
                y={r.labelY}
                transform={r.rotate ? `rotate(${r.rotate} ${r.labelX} ${r.labelY})` : undefined}
                textAnchor="middle"
              >
                {r.label}
              </text>
            ))}
          </g>

          {/* District labels */}
          <g style={{ fontFamily: 'var(--font-sans)', fill: '#3a4150', fontWeight: 600, letterSpacing: '1.5px' }}>
            {DISTRICTS.map((d, i) => (
              <text key={i} x={d.x} y={d.y} textAnchor="middle" style={{ fontSize: d.size, opacity: 0.4 }}>
                {d.label}
              </text>
            ))}
          </g>

          {/* Subway stations */}
          {SUBWAY.map((s, i) => (
            <g key={i} transform={`translate(${s.x} ${s.y})`}>
              <circle r="10" fill="#fff" stroke={s.color} strokeWidth="3" />
              <text y="-16" textAnchor="middle" style={{ fontSize: 11, fill: '#3a4150', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                {s.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Cafe pins */}
        {cafes.map((cafe) => {
          const sel = cafe.id === selectedId;
          const hov = cafe.id === hoveredId;
          return (
            <CafePin
              key={cafe.id}
              cafe={cafe}
              prominent={sel || hov}
              selected={sel}
              onClick={() => onSelect(cafe.id)}
              onMouseEnter={() => onHover(cafe.id)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </div>

      {/* You-are-here */}
      <div
        className="absolute pointer-events-none z-[5]"
        style={{
          left: 760 * transform.s + transform.x,
          top: 480 * transform.s + transform.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="rounded-full border-[3px] border-white"
          style={{
            width: 18,
            height: 18,
            background: '#3772cf',
            boxShadow: '0 0 0 6px rgba(55,114,207,0.2), 0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
        <div
          className="absolute top-[-26px] left-1/2 -translate-x-1/2 text-white rounded-full text-[11px] font-semibold whitespace-nowrap"
          style={{
            background: '#3772cf',
            padding: '3px 8px',
            letterSpacing: '-0.2px',
          }}
        >
          내 위치
        </div>
      </div>
    </div>
  );
}
