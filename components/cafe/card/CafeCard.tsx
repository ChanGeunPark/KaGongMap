import { CafeMarker } from "@/types/db";
import StarRating from "@/components/ui/StarRating";
import { cls } from "@/lib/utils";

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
      {/* Thumbnail placeholder */}
      {/* <div
        className={cls(
          "relative rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center transition-transform duration-160 group-hover:scale-[1.03]",
          compact ? "size-20" : "size-28",
        )}
      >
        <TbCoffee size={compact ? 24 : 32} className="text-gray-300" strokeWidth={1.5} />
      </div> */}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Name + rating */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-caption font-semibold tracking-[-0.2px] text-fg truncate m-0 leading-snug">
              {cafe.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-fg-3 mt-[3px]">
              <StarRating value={cafe.avg_rating} size={11} />
              <span className="text-fg-4">·</span>
              <span>{cafe.avg_rating.toFixed(1)}</span>
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
        </div>

        {/* Tags */}
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
        </div>
      </div>
    </div>
  );
}
