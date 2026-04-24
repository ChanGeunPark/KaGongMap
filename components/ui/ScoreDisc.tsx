import { cls } from "@/lib/utils";

interface ScoreDiscProps {
  value: number;
  size?: number;
  thickness?: number;
}

export default function ScoreDisc({
  value,
  size = 56,
  thickness = 5,
}: ScoreDiscProps) {
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  // SVG stroke attributes must remain raw CSS values
  const strokeColor =
    pct >= 85
      ? "var(--score-good)"
      : pct >= 65
        ? "var(--kg-amber)"
        : "var(--score-low)";
  const strokeRing =
    pct >= 85
      ? "rgba(15,167,110,0.15)"
      : pct >= 65
        ? "var(--kg-amber-soft)"
        : "rgba(212,86,86,0.15)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeRing}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={thickness}
          strokeDasharray={`${(C * pct) / 100} ${C}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className={cls("font-bold text-fg tracking-[-0.5px]")}
          style={{ fontSize: size * 0.32 }}
        >
          {pct}
        </span>
        <span
          className={cls(
            "font-mono uppercase text-fg-4 mt-0.5 tracking-[0.4px]",
          )}
          style={{ fontSize: size * 0.14 }}
        >
          pts
        </span>
      </div>
    </div>
  );
}
