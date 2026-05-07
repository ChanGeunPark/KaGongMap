import TimeField from "./TimeField";
import type { DayHours } from "./helpers";

type DayRowProps = {
  label: string;
  value: DayHours;
  onChange: (next: DayHours) => void;
};

export default function DayRow({ label, value, onChange }: DayRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-[80px] shrink-0 text-sm font-medium text-fg-2 whitespace-nowrap">
        {label}
      </span>
      {value.closed ? (
        <span className="flex-1 text-sm text-fg-3">휴무</span>
      ) : (
        <div className="flex flex-1 items-center gap-1.5 min-w-0">
          <div className="flex-1 min-w-0">
            <TimeField
              value={value.open}
              onChange={(v) => onChange({ ...value, open: v })}
              compact
            />
          </div>
          <span className="text-fg-3 shrink-0">–</span>
          <div className="flex-1 min-w-0">
            <TimeField
              value={value.close}
              onChange={(v) => onChange({ ...value, close: v })}
              compact
            />
          </div>
        </div>
      )}
      <label className="flex shrink-0 items-center gap-1 text-xs text-fg-3 cursor-pointer">
        <input
          type="checkbox"
          checked={value.closed}
          onChange={(e) => onChange({ ...value, closed: e.target.checked })}
        />
        휴무
      </label>
    </div>
  );
}
