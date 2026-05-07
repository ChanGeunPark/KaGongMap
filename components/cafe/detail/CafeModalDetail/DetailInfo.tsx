import { TbClock, TbCoin, TbMapPin } from "react-icons/tb";
import type { CafeWithDetail } from "@/types/db";

type DetailInfoProps = {
  detail: CafeWithDetail | null;
  loading: boolean;
};

export default function DetailInfo({ detail, loading }: DetailInfoProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-gray-50">
        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
      </div>
    );
  }

  const hasContent = !!(
    detail &&
    (detail.address || detail.hours || detail.description)
  );

  if (!hasContent) return null;

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-gray-50">
      {detail?.min_order_amount != null && (
        <div className="flex gap-2 text-mono text-fg-2">
          <TbCoin
            size={14}
            strokeWidth={2}
            className="shrink-0 text-fg-4 mt-1"
          />
          <span className="leading-snug">
            최소금액 {detail.min_order_amount.toLocaleString("ko-KR")}원
          </span>
        </div>
      )}

      {detail?.address && (
        <div className="flex items-start gap-2 text-mono text-fg-2">
          <TbMapPin
            size={14}
            strokeWidth={2}
            className="shrink-0 text-fg-4 mt-1"
          />
          <span className="leading-snug">{detail.address}</span>
        </div>
      )}

      {detail?.hours && (
        <div className="flex gap-2 text-mono text-fg-2">
          <TbClock
            size={14}
            strokeWidth={2}
            className="shrink-0 text-fg-4 mt-1"
          />
          <span className="leading-snug whitespace-pre-line">
            {detail.hours}
          </span>
        </div>
      )}

      {detail?.description && (
        <p className="whitespace-pre-line text-fg-3 text-sm border-t border-black/5 mt-0.5 pt-3">
          {detail.description}
        </p>
      )}
    </div>
  );
}
