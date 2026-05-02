"use client";
import Link from "next/link";
import React from "react";

import { getSizeStyle, getDefaultStyle } from "../KaGongButton";
import { ButtonProps } from "@/components/button/button.types";
import { cls } from "@/lib/utils";

function CancelButton(props: ButtonProps) {
  const {
    // React Button Default props
    className,
    style,
    onClick,
    onMouseEnter,
    onMouseOut,
    children,
    type = "button",
    target,
    //link
    link,
    replace = false,
    // Design system props
    buttonSize,
    disabled,
    rounded = true,
    width,
    height,
    icon,
    buttonStyle,
    ...rest
  } = props;

  const cancelButtonStyle = cls(
    getDefaultStyle(
      "border-0 bg-transparent text-alertMain lg:hover:bg-gray-50 lg:dark:hover:bg-gray-800",
      rounded,
      disabled,
    ),
    //size
    getSizeStyle(buttonSize),
    className ? className : "",
    width ? `w-[${width}px]` : "",
    height ? `h-[${height}px]` : "",
  );

  return link ? (
    <Link
      href={link}
      target={target}
      className={cancelButtonStyle}
      style={style}
      replace={replace}
    >
      {icon ? <div className="mr-1">{icon}</div> : null}
      {children}
    </Link>
  ) : (
    <button
      className={cancelButtonStyle}
      disabled={disabled}
      type={type}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      onMouseOut={disabled ? undefined : onMouseOut}
      style={style}
      {...rest}
    >
      {icon ? <div className="mr-1 [&_svg]:fill-white">{icon}</div> : null}
      {children}
    </button>
  );
}

export default CancelButton;
