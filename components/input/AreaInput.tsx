import React, { useEffect, useState } from "react";
import { cls } from "@/lib/utils";
import { TextAreaInputProps } from "./input.type";

function AreaInput(props: TextAreaInputProps) {
  const { showMaxLength = true } = props;

  let remainingText = props.maxLength || 0;
  if (props.maxLength && props.descriptionLength) {
    remainingText = Number(props.maxLength) - Number(props.descriptionLength);
  }

  return (
    <div className={cls("flex flex-col w-full", props.parentClassName)}>
      {props.label ? (
        <label className="w-full px-1" htmlFor={props.name}>
          <h5 className="relative inline-block">{props.label}</h5>
          {props.optional && (
            <span className=" text-gray-300 dark:text-gray-700 ml-1 body3">
              (선택)
            </span>
          )}
          {props.important ? (
            <span className="text-alertMain ml-0.5">*</span>
          ) : null}
          {props.unableEdit ? (
            <span className="text-gray-400 ml-1 body3 dark:text-gray-500">
              (수정불가)
            </span>
          ) : null}
        </label>
      ) : null}

      <textarea
        {...props.register}
        onInput={
          props.onInput as
            | React.InputEventHandler<HTMLTextAreaElement>
            | undefined
        }
        onKeyDown={props.onKeyDown}
        onBlur={props.onBlur}
        className={cls(
          "body1-400 w-full h-28 placeholder:body2-400 rounded-xl outline-none resize-none border-2 border-solid focus:ring-0 p-4",
          "text-gray-800 placeholder:text-gray-300 dark:placeholder:text-gray-500 dark:text-gray-200 dark:bg-gray-800 bg-white focus:border-primaryDark dark:focus:border-primaryDark",
          props.errors
            ? "border-alertMain focus:!border-alertMain"
            : "border-gray-50 dark:border-gray-700",

          props.label ? "mt-1" : "",

          `${props.className}`,
        )}
        autoComplete="off"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        readOnly={props.disabled}
        maxLength={props.maxLength}
        {...(props.rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      ></textarea>

      <div className="w-full flex justify-between items-center">
        {!props.errors && !props.footnote && <span></span>}
        {props.errors && (
          <p className="text-alertMain body3-400 mt-1">{props.errors}</p>
        )}
        {props.footnote && (
          <p className="body3-400 mt-1 text-gray-500">{props.footnote}</p>
        )}
        {props.maxLength && (
          <span
            className={cls(
              "body3-400 text-gray-500",
              remainingText <= 0 ? "!text-alertMain" : "text-gray-500",
            )}
          >
            {remainingText > 0 ? remainingText : "0"}
          </span>
        )}
      </div>
    </div>
  );
}

export default AreaInput;
