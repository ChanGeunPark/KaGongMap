"use client";

import { cls } from "@/lib/utils";
import { TIME_OPTIONS } from "./helpers";

type TimeFieldProps = {
  value: string;
  onChange: (next: string) => void;
  compact?: boolean;
};

export default function TimeField({
  value,
  onChange,
  compact = false,
}: TimeFieldProps) {
  // 비정형 기존 값(예: 10:32)도 그대로 보이도록 옵션 앞에 prepend
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
