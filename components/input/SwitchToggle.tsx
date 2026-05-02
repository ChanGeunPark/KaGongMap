import { cls } from "@/lib/utils";
import React from "react";
import { TbCheck, TbX } from "react-icons/tb";

interface SwitchToggleProps {
  className?: string;
  disabled?: boolean;
  [key: string]: unknown;
  themeColor?: string;
  showIcon?: boolean;
}

/**
 * @notice
 * This component is a toggle switch.
 * siblings must have peer class
 */
function SwitchToggle(props: SwitchToggleProps) {
  return (
    <div
      className={cls(
        `${props.className}`,
        "w-11 h-6 bg-gray-200 rounded-full dark:bg-gray-600 relative",
        // peer css
        "peer peer-checked:after:translate-x-full",
        "peer-checked:after:bg-white dark:peer-checked:after:bg-gray-900",
        props.disabled
          ? "peer-checked:bg-gray-100 dark:peer-checked:bg-gray-900 dark:bg-gray-900"
          : props.themeColor
            ? props.themeColor
            : "peer-checked:bg-approveMain",

        // after css
        "after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-[3px]",
        "after:gray-200 dark:after:bg-gray-300 after:rounded-full",
        "after:h-[19px] after:w-[19px] after:transition-all after:duration-500 after:ease-out",
        props.disabled
          ? "after:!bg-gray-200 dark:after:!bg-gray-800"
          : "after:bg-white",

        "peer-checked:[&>b]:opacity-0 peer-checked:[&>i]:opacity-100",
      )}
      {...(props.rest as React.HTMLAttributes<HTMLDivElement>)}
    >
      {props.showIcon && (
        <>
          <b className="absolute z-10 left-1.5 top-1/2 -translate-y-1/2 block">
            <TbX className="w-3 h-3  fill-gray-200" fill="" />
          </b>
          <i className="absolute z-10 opacity-0 right-1.5 top-1/2 -translate-y-1/2">
            <TbCheck className="w-3 h-3  fill-approveMain" fill="" />
          </i>
        </>
      )}

      {props.children ? (props.children as React.ReactNode) : null}
    </div>
  );
}

export default SwitchToggle;
