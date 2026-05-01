"use client";

import { ButtonProps, ButtonSizeType } from "./button.types";

import OutlineButton from "./fundamental/OutlineButton";
import PrimaryButton from "./fundamental/PrimaryButton";
import SecondaryButton from "./fundamental/SecondaryButton";
import BlackButton from "./fundamental/BlackButton";
import TextButton from "./fundamental/TextButton";
import CancelButton from "./fundamental/CancelButton";
import WarningButton from "./fundamental/WarningButton";
import { cls } from "@/lib/utils";

// ChizuButton component common settings
export const getSizeStyle = (buttonSize?: ButtonSizeType) => {
  switch (buttonSize) {
    case "FULL":
      return "!w-full py-[12px] px-[24px] h5 font-semibold";
    case "LARGE":
      return "h-[48px] px-[24px] h5 font-semibold";
    case "MEDIUM":
      return "h-[40px] px-[16px] h6 font-semibold";
    case "SMALL":
      return "h-[28px] px-[12px] text-[12px] font-semibold";
    case "X-SMALL":
      return "h-[24px] px-[8px] h6 font-semibold";
    default:
      return "h-[48px] px-[24px] h5 font-semibold";
  }
};

export const getDefaultStyle = (
  buttonStyle: string,
  rounded?: boolean,
  disabled?: boolean,
) => {
  const defaultStyle =
    "rounded-full flex justify-center items-center transition-all duration-200 w-fit flex-shrink-0";
  const roundedStyle = rounded ? "rounded-full" : "rounded-none";
  const disabledStyle = disabled
    ? "!bg-gray-100 lg:hover:!bg-gray-100 !text-gray-400 dark:!bg-gray-800 lg:dark:hover:!bg-gray-800 dark:!text-gray-500 !cursor-default"
    : "";
  return cls(defaultStyle, roundedStyle, buttonStyle, disabledStyle);
};

function KaGongButton(props: ButtonProps) {
  //primary

  switch (props.buttonStyle) {
    case "PRIMARY":
      return <PrimaryButton {...props} />;
    case "SECONDARY":
      return <SecondaryButton {...props} />;
    case "BLACK":
      return <BlackButton {...props} />;
    case "WARNING":
      return <WarningButton {...props} />;
    case "OUTLINED":
      return <OutlineButton {...props} />;
    case "CANCEL":
      return <CancelButton {...props} />;
    default:
      return <TextButton {...props} />;
  }
}

export default KaGongButton;
