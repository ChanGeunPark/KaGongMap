import { cls } from "@/lib/utils";
import { ReactNode } from "react";
import KGIcon from "./KGIcon";

interface ChipProps {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  icon?: string;
  count?: number;
}

export default function Chip({
  active,
  children,
  onClick,
  icon,
  count,
}: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cls(
        "inline-flex items-center gap-1.5 rounded-full whitespace-nowrap cursor-pointer",
        "transition-all duration-fast text-label",
        "py-[7px] pr-[14px] pl-3 border",
        active
          ? "font-semibold bg-fg text-bg border-fg shadow-none"
          : "font-medium bg-bg text-fg-2 border-border-medium shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
      )}
    >
      {icon && <KGIcon name={icon} size={14} stroke={2} />}
      <span>{children}</span>
      {typeof count === "number" && (
        <span
          className={cls(
            "font-mono text-[10.5px] font-semibold rounded-full ml-0.5 px-1.5 py-px",
            active ? "bg-white/16 text-white/80" : "bg-gray-100 text-fg-3",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
