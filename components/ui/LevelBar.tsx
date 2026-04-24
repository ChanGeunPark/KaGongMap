import { cls } from "@/lib/utils";

interface LevelBarProps {
  value: number;
  max?: number;
}

export default function LevelBar({ value, max = 4 }: LevelBarProps) {
  const levelPercentage = (value / max) * 100;
  return (
    <span className="inline-flex gap-[3px] items-center">
      <span
        className={cls(
          "block rounded-full transition-colors duration-200 bg-gray-100",
          "w-12 h-[5px]",
        )}
      >
        <span
          className="block h-full rounded-full bg-amber-500"
          style={{ width: `${levelPercentage}%` }}
        />
      </span>
    </span>
  );
}
