"use client";

import { cls } from "@/lib/utils";
import { TbCheck } from "react-icons/tb";

const CAFE_TAGS = [
  {
    id: "콘센트_있음",
    label: "콘센트 있음",
    emoji: "🔌",
    desc: "충전 가능한 자리 있음",
  },
  {
    id: "와이파이_있음",
    label: "와이파이 있음",
    emoji: "📶",
    desc: "와이파이 제공",
  },
  { id: "조용함", label: "조용함", emoji: "🤫", desc: "집중하기 좋은 분위기" },
  { id: "24시간", label: "24시간", emoji: "🌙", desc: "24시간 운영" },
  {
    id: "시간제한없음",
    label: "시간제한없음",
    emoji: "⏰",
    desc: "무제한 착석",
  },
  {
    id: "노트북_허용",
    label: "노트북 허용",
    emoji: "💻",
    desc: "노트북 사용 환영",
  },
  {
    id: "혼잡도_낮음",
    label: "혼잡도 낮음",
    emoji: "🪑",
    desc: "자리 잡기 여유로움",
  },
] as const;

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({ value, onChange }: TagSelectorProps) {
  const toggle = (id: string) => {
    const next = value.includes(id)
      ? value.filter((t) => t !== id)
      : [...value, id];
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {CAFE_TAGS.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cls(
              "flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-120",
              selected
                ? "bg-kg-amber-light border-kg-amber shadow-[0_0_0_1px_rgba(245,165,36,0.25)]"
                : "bg-bg border-border-medium hover:border-border-strong hover:bg-gray-50",
            )}
          >
            <span className="text-xl leading-none shrink-0">{tag.emoji}</span>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span
                className={cls(
                  "text-small font-semibold truncate leading-tight",
                  selected ? "text-kg-amber-deep" : "text-fg",
                )}
              >
                {tag.label}
              </span>
              <span className="text-[11px] text-fg-4 truncate">{tag.desc}</span>
            </div>
            {selected && (
              <TbCheck
                size={14}
                strokeWidth={2.5}
                className="shrink-0 text-kg-amber-deep"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
