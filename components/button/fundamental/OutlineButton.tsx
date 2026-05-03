"use client";
import Link from "next/link";
import React from "react";

import { getSizeStyle, getDefaultStyle } from "../KaGongButton";
import { ButtonProps } from "@/components/button/button.types";
import { cls } from "@/lib/utils";

function OutlineButton(props: ButtonProps) {
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

  const outlinedButtonStyle = cls(
    getDefaultStyle(
      cls(
        "border-[1.5px] text-gray-500 border-gray-100 bg-white lg:hover:bg-gray-50",
      ),
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
      className={outlinedButtonStyle}
      style={style}
      replace={replace}
    >
      {icon ? <div className="mr-1">{icon}</div> : null}
      {children}
    </Link>
  ) : (
    <button
      className={outlinedButtonStyle}
      disabled={disabled}
      type={type}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      onMouseOut={disabled ? undefined : onMouseOut}
      style={style}
      {...rest}
    >
      {icon ? <div className="mr-1">{icon}</div> : null}
      {children}
    </button>
  );
}

export default OutlineButton;
