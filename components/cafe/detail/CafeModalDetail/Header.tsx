import { TbHeart } from "react-icons/tb";
import Badge from "@/components/badge/Badge";
import { TAG_LABELS } from "@/lib/data";
import type { CafeMarker } from "@/types/db";

type HeaderProps = {
  cafe: CafeMarker;
};

export default function Header({ cafe }: HeaderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-[17px] font-bold tracking-[-0.4px] text-fg m-0 leading-tight truncate">
          {cafe.name}
        </h4>

        <div className="flex items-center gap-1.5 text-sm text-fg-3">
          <div className="flex items-center gap-1 text-sm font-bold text-zinc-400 py-1">
            <TbHeart size={15} strokeWidth={2.2} />
            <span>{cafe.like_count}</span>
          </div>
        </div>
      </div>

      {cafe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1.5">
          {cafe.tags.map((t) => (
            <Badge key={t} BadgeStyle="OUTLINED" BadgeSize="SMALL">
              {TAG_LABELS[t]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
