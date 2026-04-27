"use client";

import { useEffect, useState } from "react";
import MonoLabel from "@/components/ui/MonoLabel";
import { cls } from "@/lib/utils";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7 ~ 22

function pseudoRand(h: number) {
  return Math.abs(Math.sin(h * 2.3 + 7));
}

interface CrowdChartProps {
  peakHours: number[];
  crowd: number;
}

export default function CrowdChart({ peakHours, crowd }: CrowdChartProps) {
  const [nowHour, setNowHour] = useState(-1);

  useEffect(() => {
    setNowHour(new Date().getHours());
  }, []);

  const crowdLabel = crowd < 0.4 ? "여유" : crowd < 0.7 ? "보통" : "혼잡";

  return (
    <section className="mb-9">
      <div className="flex items-end justify-between mb-3.5">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.24px] mb-1.5">시간대별 혼잡도</h2>
          <p className="text-[13px] text-fg-3">
            지금은{" "}
            <span className="text-fg font-semibold">{crowdLabel}</span>
            {" "}· {Math.round(crowd * 100)}%
          </p>
        </div>
        <MonoLabel>평일 기준</MonoLabel>
      </div>
      <div className="p-5 rounded-2xl border border-border-subtle">
        <div className="flex items-end gap-[3px] h-16 mb-2">
          {HOURS.map((h) => {
            const isPeak = peakHours.includes(h);
            const isNow = h === nowHour;
            const barHeight = isPeak ? 54 : Math.round(18 + pseudoRand(h) * 14);
            return (
              <div key={h} className="flex-1 flex flex-col items-center">
                <div
                  className={cls(
                    "w-full max-w-[22px] rounded-[3px] transition-all duration-300",
                    isNow ? "bg-kg-amber" : isPeak ? "bg-fg-3" : "bg-gray-200",
                  )}
                  style={{ height: barHeight }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between font-mono text-[10.5px] text-fg-3">
          <span>7</span>
          <span>10</span>
          <span>13</span>
          <span>16</span>
          <span>19</span>
          <span>22</span>
        </div>
        <div className="flex gap-4 mt-3.5 text-[11.5px] text-fg-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-kg-amber" /> 지금
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-fg-3" /> 피크
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-gray-200" /> 여유
          </span>
        </div>
      </div>
    </section>
  );
}
