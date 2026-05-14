import { TbClock, TbCoin, TbFlag, TbMapPin } from "react-icons/tb";
import type { CafeWithDetail } from "@/types/db";
import { useState } from "react";
import CafeReportModal from "../CafeReportModal";
import { cls } from "@/lib/utils";

type DetailInfoProps = {
  detail: CafeWithDetail | null;
  loading: boolean;
};

export default function DetailInfo({ detail, loading }: DetailInfoProps) {
  const [showReport, setShowReport] = useState(false);

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
    <>
      <div className="relative flex flex-col gap-2 p-3.5 rounded-xl bg-gray-50">
        <button
          type="button"
          onClick={() => setShowReport(true)}
          disabled={loading}
          className={cls(
            "absolute top-3 right-3 cursor-pointer hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 rounded-full flex justify-center items-center transition-all duration-200",
            "w-7 h-7 p-0 text-gray-500",
            loading ? "opacity-50 cursor-not-allowed" : "",
          )}
          aria-label="카페 신고"
        >
          <TbFlag
            size={15}
            className="text-xl absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        </button>
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

      <CafeReportModal
        cafeId={detail.id}
        cafeName={detail.name}
        open={showReport}
        onClose={() => setShowReport(false)}
      />
    </>
  );
}
