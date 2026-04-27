"use client";

import { cls } from "@/lib/utils";
import { CafeMarker, CafeWithDetail } from "@/types/db";
import StarRating from "@/components/ui/StarRating";
import { TbX, TbArrowRight, TbBookmark, TbCoffee, TbClock, TbMapPin } from "react-icons/tb";
import { motion } from "framer-motion";

interface FloatingCardProps {
  cafe: CafeMarker;
  detail: CafeWithDetail | null;
  detailLoading: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
}

export function FloatingCard({
  cafe,
  detail,
  detailLoading,
  onClose,
  onOpenDetail,
}: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cls(
        "absolute left-1/2 -translate-x-1/2 z-40",
        "bottom-[28px] min-w-[300px] w-[min(520px,calc(100%-40px))]",
        "bg-bg rounded-2xl border border-border-subtle shadow-overlay",
        "p-5",
      )}
    >
      <div className="flex flex-col gap-4">
        {/* ── Header ── */}
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="size-[80px] rounded-xl shrink-0 bg-gray-100 flex items-center justify-center">
            <TbCoffee size={28} className="text-gray-300" strokeWidth={1.5} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-btn font-semibold tracking-[-0.3px] text-fg m-0 truncate leading-snug flex-1">
                {cafe.name}
              </h4>
              <button
                onClick={onClose}
                className="shrink-0 size-7 rounded-full bg-gray-100 hover:bg-gray-200 inline-flex items-center justify-center cursor-pointer border-none text-fg-3 transition-colors"
              >
                <TbX size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <StarRating value={cafe.avg_rating} size={12} />
              <span className="text-[11px] text-fg-4">{cafe.avg_rating.toFixed(1)}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {cafe.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="text-[10.5px] font-medium text-fg-3 bg-gray-100 rounded-full px-2 py-px"
                >
                  {t.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tier 2 상세 정보 (로딩 후 표시) ── */}
        {detailLoading && (
          <div className="h-px bg-border-subtle" />
        )}
        {detail && !detailLoading && (
          <>
            <div className="h-px bg-border-subtle" />
            <div className="flex flex-col gap-1.5 text-mono text-fg-3">
              {detail.address && (
                <span className="inline-flex items-center gap-1.5">
                  <TbMapPin size={13} strokeWidth={2} className="shrink-0 text-fg-4" />
                  {detail.address}
                </span>
              )}
              {detail.hours && (
                <span className="inline-flex items-center gap-1.5">
                  <TbClock size={13} strokeWidth={2} className="shrink-0 text-fg-4" />
                  {detail.hours}
                </span>
              )}
              {detail.description && (
                <p className="text-fg-3 text-[11.5px] line-clamp-2 mt-0.5">
                  {detail.description}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2">
          <button
            onClick={onOpenDetail}
            className={cls(
              "flex-1 inline-flex items-center justify-center gap-1.5",
              "py-[10px] px-[18px] rounded-full border-none cursor-pointer",
              "font-semibold text-[13.5px] bg-fg text-bg",
              "hover:opacity-90 transition-opacity",
            )}
          >
            상세 보기
            <TbArrowRight size={15} strokeWidth={2.2} />
          </button>
          <button
            className={cls(
              "inline-flex items-center gap-1.5",
              "py-[10px] px-4 rounded-full cursor-pointer border border-border-medium",
              "font-medium text-[13.5px] bg-bg text-fg-2",
              "hover:bg-gray-50 transition-colors",
            )}
          >
            <TbBookmark size={15} strokeWidth={2} />
            저장
          </button>
        </div>
      </div>
    </motion.div>
  );
}
