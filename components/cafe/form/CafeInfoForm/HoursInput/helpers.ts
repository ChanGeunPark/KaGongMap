const STEP_MINUTES = 30;

export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += STEP_MINUTES) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  out.push("24:00");
  return out;
})();

export const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
export type Day = (typeof DAYS)[number];

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export const EMPTY_DAY: DayHours = { open: "", close: "", closed: false };

export type Mode =
  | "everyday"
  | "weekday-weekend"
  | "per-day"
  | "24h"
  | "custom";

export const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "everyday", label: "매일 같음" },
  { value: "weekday-weekend", label: "평일·주말" },
  { value: "per-day", label: "요일별" },
  { value: "24h", label: "24시간" },
  { value: "custom", label: "직접 입력" },
];

export const buildEveryday = (open: string, close: string) =>
  open && close ? `매일 ${open} – ${close}` : "";

export const buildDayLabel = (label: string, h: DayHours) => {
  if (h.closed) return `${label} 휴무`;
  if (h.open && h.close) return `${label} ${h.open} – ${h.close}`;
  return "";
};

export const buildWeekdayWeekend = (weekday: DayHours, weekend: DayHours) =>
  [buildDayLabel("평일", weekday), buildDayLabel("주말", weekend)]
    .filter(Boolean)
    .join("\n");

export const buildPerDay = (schedule: Record<Day, DayHours>) =>
  DAYS.map((d) => buildDayLabel(d, schedule[d]))
    .filter(Boolean)
    .join("\n");

export const createEmptySchedule = (): Record<Day, DayHours> =>
  Object.fromEntries(DAYS.map((d) => [d, { ...EMPTY_DAY }])) as Record<
    Day,
    DayHours
  >;
