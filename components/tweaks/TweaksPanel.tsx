"use client";

import { cls } from "@/lib/utils";
import MonoLabel from "@/components/ui/MonoLabel";
import SegButtons from "./SegButtons";
import TweakRow from "./TweakRow";
import { POINT_COLORS, Tweaks } from "./types";

interface TweaksPanelProps {
  tweaks: Tweaks;
  update: (key: keyof Tweaks, value: string) => void;
}

export default function TweaksPanel({ tweaks, update }: TweaksPanelProps) {
  return (
    <div className="fixed right-5 bottom-5 z-[500] w-[280px] bg-bg border border-border-medium rounded-2xl shadow-overlay p-5 font-sans">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-[13px] font-semibold tracking-[-0.2px]">
          Tweaks
        </div>
        <MonoLabel color="var(--kg-amber-deep)" bg="var(--kg-amber-light)">
          LIVE
        </MonoLabel>
      </div>

      <TweakRow label="레이아웃">
        <SegButtons
          value={tweaks.layoutVariant}
          onChange={(v) => update("layoutVariant", v)}
          options={[
            { v: "sidebar", l: "사이드" },
            { v: "sheet", l: "시트" },
            { v: "floating", l: "플로팅" },
          ]}
        />
      </TweakRow>

      <TweakRow label="필터 UI">
        <SegButtons
          value={tweaks.filterVariant}
          onChange={(v) => update("filterVariant", v)}
          options={[
            { v: "chips", l: "칩" },
            { v: "dropdowns", l: "드롭다운" },
            { v: "bottomSheet", l: "컴팩트" },
          ]}
        />
      </TweakRow>

      <TweakRow label="카드 밀도">
        <SegButtons
          value={tweaks.cardDensity}
          onChange={(v) => update("cardDensity", v)}
          options={[
            { v: "medium", l: "중간" },
            { v: "low", l: "낮음" },
          ]}
        />
      </TweakRow>

      <TweakRow label="포인트 컬러">
        <div className="flex gap-1.5">
          {POINT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update("pointColor", c)}
              className={cls(
                "size-[28px] rounded-full cursor-pointer p-0",
                tweaks.pointColor === c
                  ? "border-2 border-fg"
                  : "border border-border-medium",
              )}
              style={{ background: c }}
            />
          ))}
        </div>
      </TweakRow>
    </div>
  );
}
