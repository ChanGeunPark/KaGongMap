import KGIcon from "@/components/ui/KGIcon";
import { cls } from "@/lib/utils";

interface ReportButtonProps {
  onClick: () => void;
}

export default function ReportButton({ onClick }: ReportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px]",
        "text-base font-semibold border border-kg-amber/20 bg-kg-amber-light text-kg-amber-deep",
        "transition-all duration-150 hover:shadow-button hover:border-kg-amber/35 active:scale-[0.97]",
      )}
    >
      <KGIcon name="plus" size={16} stroke={3} />
      카페 제보
    </button>
  );
}
