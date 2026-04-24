import { cls } from "@/lib/utils";

interface CrowdBarProps {
  level: number;
}

export default function CrowdBar({ level }: CrowdBarProps) {
  const pct = Math.round(level * 100);
  const color =
    level < 0.4 ? "score-good" : level < 0.7 ? "kg-amber" : "score-low";
  const label = level < 0.4 ? "여유" : level < 0.7 ? "보통" : "혼잡";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="block rounded-full overflow-hidden bg-gray-100 w-[44px] h-2">
        <span
          className={cls("block h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-mono font-medium text-fg-2">{label}</span>
    </span>
  );
}
