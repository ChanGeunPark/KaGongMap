import { cls } from "@/lib/utils";
import { ReactNode } from "react";

interface MonoLabelProps {
  children: ReactNode;
  color?: string;
  bg?: string;
}

export default function MonoLabel({ children }: MonoLabelProps) {
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold uppercase rounded-full",
        "text-kg-amber-deep bg-kg-amber-light",
        "py-1 px-2",
      )}
    >
      {children}
    </span>
  );
}
