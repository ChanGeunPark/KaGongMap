import React from "react";
import { BadgeProps } from "../badge.types";
import { GetBadgeSizeClassName } from "../Badge";
import { cls } from "@/lib/utils";
import { TbX } from "react-icons/tb";

function TintBadge(props: BadgeProps) {
  const {
    // React Button Default props
    className,
    style,
    children,

    // Design system props
    BadgeSize,
    onClose,
  } = props;

  return (
    <div
      className={cls(
        GetBadgeSizeClassName(BadgeSize),
        "bg-primaryLight border-[1.5px] border-primarySub text-gray-800",
        className ? className : "",
      )}
      style={style}
    >
      {children}
      {onClose ? (
        <button type="button" onClick={onClose}>
          <TbX className="w-4 h-4 ml-1" fill="white" />
        </button>
      ) : null}
    </div>
  );
}

export default TintBadge;
