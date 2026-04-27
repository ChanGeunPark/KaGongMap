import { Cafe } from "@/types/cafe";
import KGIcon from "@/components/ui/KGIcon";
import LevelBar from "@/components/ui/LevelBar";

interface DetailTagRowProps {
  icon: string;
  label: string;
  value: number;
  detail: string;
}

function DetailTagRow({ icon, label, value, detail }: DetailTagRowProps) {
  return (
    <div className="py-4 border-t border-border-subtle flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-fg-2 shrink-0">
        <KGIcon name={icon} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] text-fg-3 uppercase tracking-[0.5px] mb-1">
          {label}
        </div>
        <div className="text-[15px] font-medium text-fg">{detail}</div>
      </div>
      <LevelBar value={value} max={4} />
      <span className="font-mono text-[13px] font-semibold text-fg-2 w-8 text-right shrink-0">
        {value}/4
      </span>
    </div>
  );
}

export default function CafeEnvironmentSection({ cafe }: { cafe: Cafe }) {
  return (
    <section className="mb-9">
      <h2 className="text-[22px] font-semibold tracking-[-0.24px] mb-1">카공 환경</h2>
      <p className="text-sm text-fg-3 mb-2">실제 방문한 카공족이 평가한 항목</p>
      <div>
        <DetailTagRow
          icon="plug"
          label="콘센트"
          value={cafe.levels.power}
          detail={
            cafe.levels.power >= 4
              ? "전석 콘센트"
              : cafe.levels.power >= 3
                ? "대부분 자리에 있음"
                : cafe.levels.power >= 2
                  ? "일부 자리만"
                  : "거의 없음"
          }
        />
        <DetailTagRow
          icon="wifi"
          label="와이파이"
          value={cafe.levels.wifi}
          detail={
            cafe.levels.wifi >= 4
              ? "기가 와이파이 · 화상회의 가능"
              : cafe.levels.wifi >= 3
                ? "빠름 · 업무 원활"
                : cafe.levels.wifi >= 2
                  ? "느리진 않음"
                  : "불안정"
          }
        />
        <DetailTagRow
          icon="volume"
          label="조용함"
          value={cafe.levels.quiet}
          detail={
            cafe.levels.quiet >= 4
              ? "매우 조용 · 타자 소리 주의"
              : cafe.levels.quiet >= 3
                ? "조용한 편"
                : cafe.levels.quiet >= 2
                  ? "보통"
                  : "시끄러움"
          }
        />
        <DetailTagRow
          icon="layout"
          label="공간여유"
          value={cafe.levels.space}
          detail={
            cafe.levels.space >= 4
              ? `${cafe.capacity}석 · 넓은 공간`
              : cafe.levels.space >= 3
                ? `${cafe.capacity}석 · 쾌적함`
                : cafe.levels.space >= 2
                  ? `${cafe.capacity}석 · 보통`
                  : `${cafe.capacity}석 · 다소 좁음`
          }
        />
      </div>
    </section>
  );
}
