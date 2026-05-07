import TimeField from "./TimeField";

type TimeRangeProps = {
  open: string;
  close: string;
  onChange: (open: string, close: string) => void;
};

export default function TimeRange({ open, close, onChange }: TimeRangeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <TimeField value={open} onChange={(v) => onChange(v, close)} />
      </div>
      <span className="text-fg-3">–</span>
      <div className="flex-1">
        <TimeField value={close} onChange={(v) => onChange(open, v)} />
      </div>
    </div>
  );
}
