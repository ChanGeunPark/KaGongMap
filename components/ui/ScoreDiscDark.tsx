interface ScoreDiscDarkProps {
  value: number;
}

export default function ScoreDiscDark({ value }: ScoreDiscDarkProps) {
  const size = 96;
  const thickness = 6;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--kg-amber)"
          strokeWidth={thickness}
          strokeDasharray={`${(C * value) / 100} ${C}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[34px] font-bold text-white tracking-[-0.8px]">{value}</span>
        <span className="font-mono text-[10px] mt-[3px] tracking-[0.4px]" style={{ color: "rgba(255,255,255,0.55)" }}>
          / 100
        </span>
      </div>
    </div>
  );
}
