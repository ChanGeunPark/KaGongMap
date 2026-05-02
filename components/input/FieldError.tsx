"use client";

import { cls } from "@/lib/utils";
import { TbAlertTriangle } from "react-icons/tb";

export default function FieldError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      className={cls(
        "flex items-center gap-1.5 text-error text-small",
        className,
      )}
    >
      <TbAlertTriangle size={13} strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}
