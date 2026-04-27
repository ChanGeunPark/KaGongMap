import { cls } from "@/lib/utils";
import { ReactNode } from "react";

interface MonoLabelProps {
  children: ReactNode;
  color?: string;
  bg?: string;
}

export default function MonoLabel({ children, color, bg }: MonoLabelProps) {
  const hasCustom = color || bg;
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold uppercase rounded-full py-1 px-2",
        !hasCustom && "text-kg-amber-deep bg-kg-amber-light",
      )}
      style={hasCustom ? { color: color ?? "inherit", background: bg ?? "transparent" } : undefined}
    >
      {children}
    </span>
  );
}
