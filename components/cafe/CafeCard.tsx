import { Cafe } from "@/types/cafe";
import StarRating from "@/components/ui/StarRating";
import LevelBar from "@/components/ui/LevelBar";
import CafeHeroGlyph from "./CafeHeroGlyph";
import { TbPlug, TbWifi, TbVolume, TbBan } from "react-icons/tb";
import { cls } from "@/lib/utils";

interface CafeCardProps {
  cafe: Cafe;
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
      {/* Thumbnail */}
      <div
        className={cls(
          "relative rounded-lg overflow-hidden shrink-0 transition-transform duration-160 group-hover:scale-[1.03]",
          compact ? "size-20 bg-gray-100" : "size-28 bg-gray-200",
        )}
      >
        <CafeHeroGlyph kind={cafe.hero} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        {/* Name row + Score */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-[3px]">
              <h4 className="text-caption font-semibold tracking-[-0.2px] text-fg truncate m-0 leading-snug">
                {cafe.name}
              </h4>
            </div>

            {/* Meta: stars · reviews · distance */}
            <div className="flex items-center gap-1.5 text-[11px] text-fg-3">
              <StarRating value={cafe.stars} size={11} />
              <span className="text-fg-4">·</span>
              <span>후기 {cafe.reviewCount}</span>
            </div>
          </div>
        </div>

        {/* Level bars — hidden in compact */}
        {!compact && (
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] text-fg-3 mt-auto">
            <span className="inline-flex items-center gap-1">
              <TbPlug size={11} strokeWidth={2} />
              <LevelBar value={cafe.levels.power} />
            </span>
            <span className="inline-flex items-center gap-1">
              <TbWifi size={11} strokeWidth={2} />
              <LevelBar value={cafe.levels.wifi} />
            </span>
            <span className="inline-flex items-center gap-1">
              <TbVolume size={11} strokeWidth={2} />
              <LevelBar value={cafe.levels.quiet} />
            </span>
          </div>
        )}

        {/* Tags + crowd */}
        <div className="flex flex-wrap gap-[5px] items-center mt-auto">
          {cafe.tags.slice(0, compact ? 2 : 3).map((t) => (
            <span
              key={t}
              className="text-[10.5px] rounded-full font-medium text-fg-2 bg-gray-100"
              style={{ padding: "2px 7px" }}
            >
              {t}
            </span>
          ))}
          {cafe.limits.slice(0, 1).map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-[3px] text-[10.5px] rounded-full font-semibold bg-error/8 text-error"
              style={{ padding: "2px 7px" }}
            >
              <TbBan size={10} strokeWidth={2.2} />
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
