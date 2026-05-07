"use client";

import { useState } from "react";
import { cls } from "@/lib/utils";
import DayRow from "./DayRow";
import TimeRange from "./TimeRange";
import {
  buildEveryday,
  buildPerDay,
  buildWeekdayWeekend,
  createEmptySchedule,
  DAYS,
  EMPTY_DAY,
  MODE_OPTIONS,
  type Day,
  type DayHours,
  type Mode,
} from "./helpers";

interface HoursInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HoursInput({ value, onChange }: HoursInputProps) {
  // 진입 시 기존 값이 있으면 custom으로 시작 (수정 모드 보존)
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
