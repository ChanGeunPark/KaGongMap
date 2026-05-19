"use client";

import { CafeMarker } from "@/types/db";
import { cls } from "@/lib/utils";
import { useLikes } from "@/hooks/user/useLikes";
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

  const maxTags = compact ? 2 : 3;
  const hiddenTagCount = cafe.tags.length - maxTags;

  return (
    <div
      onMouseEnter={onHover}
      onClick={onClick}
      className={cls(
        "group cursor-pointer rounded-2xl border p-4 transition-all duration-150",
        selected
          ? "border-kg-amber/45 bg-kg-amber-light/60 shadow-[0_4px_16px_rgba(245,165,36,0.14)]"
          : "border-border-subtle bg-bg shadow-card hover:border-border-medium hover:shadow-button hover:-translate-y-px",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-btn font-semibold tracking-[-0.2px] text-fg truncate leading-tight m-0">
            {cafe.name}
          </h4>
          {cafe.address && (
            <p className="mt-1 text-[12.5px] text-fg-3 truncate">
              {cafe.address}
            </p>
          )}

          <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-fg-3">
            <span>좋아요 {cafe.like_count.toLocaleString("ko-KR")}</span>
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

        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <LikeButton liked={liked} onClick={() => toggle(cafe.id)} />
        </div>
      </div>

      {cafe.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {cafe.tags.slice(0, maxTags).map((t) => (
            <span
              key={t}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-fg-2"
            >
              {t.replace(/_/g, " ")}
            </span>
          ))}
          {hiddenTagCount > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-fg-3">
              +{hiddenTagCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
