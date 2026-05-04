"use client";

import { useState } from "react";
import { cls } from "@/lib/utils";

const STEP_MINUTES = 30;
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += STEP_MINUTES) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  out.push("24:00");
  return out;
})();

function TimeField({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (next: string) => void;
  compact?: boolean;
}) {
  // 기존 데이터(10:32 등 비정형 값)도 그대로 보이도록 옵션에 포함
  const options =
    value && !TIME_OPTIONS.includes(value)
      ? [value, ...TIME_OPTIONS]
      : TIME_OPTIONS;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cls(
        "w-full bg-white rounded-md border-gray-50 border-solid border-2 text-gray-900 body2-400",
        compact ? "min-h-[40px] px-2 text-sm" : "min-h-[48px] px-3",
      )}
    >
      <option value="">선택</option>
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

type Mode = "everyday" | "weekday-weekend" | "per-day" | "24h" | "custom";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
type Day = (typeof DAYS)[number];

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

const EMPTY_DAY: DayHours = { open: "", close: "", closed: false };

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "everyday", label: "매일 같음" },
  { value: "weekday-weekend", label: "평일·주말" },
  { value: "per-day", label: "요일별" },
  { value: "24h", label: "24시간" },
  { value: "custom", label: "직접 입력" },
];

const buildEveryday = (open: string, close: string) =>
  open && close ? `매일 ${open} – ${close}` : "";

const buildDayLabel = (label: string, h: DayHours) => {
  if (h.closed) return `${label} 휴무`;
  if (h.open && h.close) return `${label} ${h.open} – ${h.close}`;
  return "";
};

const buildWeekdayWeekend = (weekday: DayHours, weekend: DayHours) =>
  [buildDayLabel("평일", weekday), buildDayLabel("주말", weekend)]
    .filter(Boolean)
    .join("\n");

const buildPerDay = (schedule: Record<Day, DayHours>) =>
  DAYS.map((d) => buildDayLabel(d, schedule[d]))
    .filter(Boolean)
    .join("\n");

const createEmptySchedule = (): Record<Day, DayHours> =>
  Object.fromEntries(DAYS.map((d) => [d, { ...EMPTY_DAY }])) as Record<
    Day,
    DayHours
  >;

interface HoursInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HoursInput({ value, onChange }: HoursInputProps) {
  // 초기 진입 시 기존 값이 있으면 custom으로 시작 (수정 모드 보존)
  const [mode, setMode] = useState<Mode>(value ? "custom" : "everyday");

  const [everyday, setEveryday] = useState({ open: "", close: "" });
  const [weekday, setWeekday] = useState<DayHours>(EMPTY_DAY);
  const [weekend, setWeekend] = useState<DayHours>(EMPTY_DAY);
  const [schedule, setSchedule] = useState<Record<Day, DayHours>>(
    createEmptySchedule,
  );
  const [custom, setCustom] = useState(value);

  const handleModeChange = (next: Mode) => {
    setMode(next);
    if (next === "24h") onChange("24시간 영업");
    else if (next === "custom") onChange(custom);
    else if (next === "everyday")
      onChange(buildEveryday(everyday.open, everyday.close));
    else if (next === "weekday-weekend")
      onChange(buildWeekdayWeekend(weekday, weekend));
    else onChange(buildPerDay(schedule));
  };

  const updateEveryday = (open: string, close: string) => {
    setEveryday({ open, close });
    onChange(buildEveryday(open, close));
  };

  const updateWeekday = (next: DayHours) => {
    setWeekday(next);
    onChange(buildWeekdayWeekend(next, weekend));
  };

  const updateWeekend = (next: DayHours) => {
    setWeekend(next);
    onChange(buildWeekdayWeekend(weekday, next));
  };

  const updateDay = (day: Day, next: DayHours) => {
    const nextSchedule = { ...schedule, [day]: next };
    setSchedule(nextSchedule);
    onChange(buildPerDay(nextSchedule));
  };

  const updateCustom = (next: string) => {
    setCustom(next);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-label font-semibold text-fg-2">영업시간</label>

      <div className="flex flex-wrap gap-1.5">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleModeChange(opt.value)}
            className={cls(
              "rounded-full px-3 py-1.5 text-caption font-medium transition-colors",
              mode === opt.value
                ? "bg-main-deep text-white"
                : "bg-gray-100 text-fg-2 hover:bg-gray-200",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === "everyday" && (
        <TimeRange
          open={everyday.open}
          close={everyday.close}
          onChange={updateEveryday}
        />
      )}

      {mode === "weekday-weekend" && (
        <div className="flex flex-col gap-3">
          <DayRow
            label="평일 (월–금)"
            value={weekday}
            onChange={updateWeekday}
          />
          <DayRow
            label="주말 (토·일)"
            value={weekend}
            onChange={updateWeekend}
          />
        </div>
      )}

      {mode === "per-day" && (
        <div className="flex flex-col gap-2">
          {DAYS.map((day) => (
            <DayRow
              key={day}
              label={day}
              value={schedule[day]}
              onChange={(v) => updateDay(day, v)}
            />
          ))}
        </div>
      )}

      {mode === "24h" && (
        <p className="text-sm text-fg-3">
          이 카페는 24시간 영업으로 등록됩니다.
        </p>
      )}

      {mode === "custom" && (
        <input
          type="text"
          value={custom}
          onChange={(e) => updateCustom(e.target.value)}
          placeholder="예: 09:00 – 22:00 (월–금), 10:00 – 21:00 (주말)"
          className="w-full min-h-[48px] bg-white rounded-md border-gray-50 border-solid border-2 p-3 body2-400 text-gray-900 placeholder:text-gray-300 placeholder:body2-500"
        />
      )}

      {mode !== "custom" && value && (
        <p className="text-caption text-fg-3 whitespace-pre-line">
          미리보기: <span className="text-fg-2 font-medium">{value}</span>
        </p>
      )}
    </div>
  );
}

function TimeRange({
  open,
  close,
  onChange,
}: {
  open: string;
  close: string;
  onChange: (open: string, close: string) => void;
}) {
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

function DayRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DayHours;
  onChange: (next: DayHours) => void;
}) {
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
