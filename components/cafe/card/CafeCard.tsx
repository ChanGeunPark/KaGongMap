"use client";

import { CafeMarker } from "@/types/db";
import { cls } from "@/lib/utils";
import { useLikes } from "@/hooks/useLikes";
import { TbHeart, TbHeartFilled } from "react-icons/tb";
import LikeButton from "@/components/button/LikeButton";

interface CafeCardProps {
  cafe: CafeMarker;
  compact?: boolean;
  selected?: boolean;
  onHover?: () => void;
  onClick?: () => void;
}

export default function CafeCard({
  cafe,
  compact,
  selected,
  onHover,
  onClick,
}: CafeCardProps) {
  const { isLiked, toggle } = useLikes();
  const liked = isLiked(cafe.id);

  return (
    <div
      onMouseEnter={onHover}
      onClick={onClick}
      className={cls(
        "group flex gap-3.5 rounded-2xl cursor-pointer transition-all duration-160",
        selected
          ? "bg-kg-amber-light border border-gray-300 shadow-[0_2px_12px_rgba(245,165,36,0.14)]"
          : "bg-bg border border-border-subtle shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "p-4",
      )}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-caption font-semibold tracking-[-0.2px] text-fg truncate m-0 leading-snug">
              {cafe.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-fg-3 mt-[3px]">
              <span>좋아요 {cafe.like_count}</span>
              {cafe.min_order_amount != null && (
                <>
                  <span className="text-fg-4">·</span>
                  <span>
                    최소 {cafe.min_order_amount.toLocaleString("ko-KR")}원
                  </span>
                </>
              )}
            </div>
          </div>

          <LikeButton liked={liked} onClick={() => toggle(cafe.id)} />
        </div>

        <div className="flex flex-wrap gap-[5px] items-center mt-auto">
          {cafe.tags.slice(0, compact ? 2 : 3).map((t) => (
            <span
              key={t}
              className="text-[10.5px] rounded-full font-medium text-fg-2 bg-gray-100"
              style={{ padding: "2px 7px" }}
            >
              {t.replace(/_/g, " ")}
            </span>
          ))}

          {cafe.tags.length > 3 && (
            <span
              className="text-[10.5px] rounded-full font-medium text-fg-2 bg-gray-100"
              style={{ padding: "2px 7px" }}
            >
              +{cafe.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
