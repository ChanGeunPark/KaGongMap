"use client";
import Link from "next/link";

import { getSizeStyle, getDefaultStyle } from "../KaGongButton";
import { cls } from "@/lib/utils";
import { ButtonProps } from "../button.types";

function SecondaryButton(props: ButtonProps) {
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

  const blackButtonStyle = cls(
    getDefaultStyle(
      "bg-gray-900 text-white lg:hover:bg-gray-800",
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
      className={blackButtonStyle}
      style={style}
      replace={replace}
    >
      {icon ? <div className="mr-1">{icon}</div> : null}
      {children}
    </Link>
  ) : (
    <button
      className={blackButtonStyle}
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

export default SecondaryButton;
