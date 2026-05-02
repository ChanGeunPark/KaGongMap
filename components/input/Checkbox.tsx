import React, { useRef, useState } from "react";
import { cls } from "@/lib/utils";
import { UseFormRegisterReturn } from "react-hook-form";

interface CheckBtnProps {
  id: string;
  title?: string;
  name: string;
  children?: React.ReactNode;
  register?: UseFormRegisterReturn;
  className?: string;
  important?: boolean;
  allClick?: boolean;
  [key: string]: unknown;
}

function Checkbox({
  id,
  title,
  children,
  important,
  name,
  className,
  register,
  allClick = true,
  ...rest
}: CheckBtnProps) {
  return (
    <span className="group inline-flex items-center">
      <input
        type="checkbox"
        id={id}
        className="peer hidden"
        name={name}
        {...register}
        {...rest}
      />
      <label
        htmlFor={id}
        className={cls(
          "cursor-pointer transition-all flex items-center justify-center text-bold w-[18px] h-[18px] border-gray-300 dark:border-gray-700 border-2 rounded-sm  min-w-[18px] lg:group-hover:border-primaryDark",
          "peer-checked:border-none peer-checked:bg-primaryDark peer-checked:text-white", // button Checked
          "[&>svg]:fill-white dark:[&>svg]:fill-gray-700 peer-checked:[&>svg]:stroke-white", //icon
        )}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill=""
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 stroke-2 "
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M9.00016 16.17L4.83016 12L3.41016 13.41L9.00016 19L21.0002 7L19.5902 5.59L9.00016 16.17Z"
            fill=""
          />
        </svg>
      </label>
      <label
        htmlFor={allClick ? id : ""}
        className={cls(
          "body2-500 ml-2 cursor-pointer text-gray-700 dark:text-gray-300",
          "peer-checked:text-gray-900 dark:peer-checked:text-white",
          className ? className : "",
        )}
      >
        {title}
        {children}
        {important ? (
          <span className="text-secondaryMain ml-0.5">*</span>
        ) : null}
      </label>
    </span>
  );
}

export default Checkbox;
