"use client";
import Link from "next/link";
import React from "react";

import { getSizeStyle, getDefaultStyle } from "../KaGongButton";
import { ButtonProps } from "@/components/button/button.types";
import { cls } from "@/lib/utils";

function WarningButton(props: ButtonProps) {
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
    buttonStyle,
    ...rest
  } = props;

  const warningButtonStyle = cls(
    getDefaultStyle(
      "text-white bg-kg-amber lg:hover:bg-kg-amber-deep",
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
      className={warningButtonStyle}
      style={style}
      replace={replace}
    >
      {children}
    </Link>
  ) : (
    <button
      className={warningButtonStyle}
      disabled={disabled}
      type={type}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      onMouseOut={disabled ? undefined : onMouseOut}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}

export default WarningButton;
