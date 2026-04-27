import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";

import { cls } from "@/lib/utils";
import { InputProps } from "./input.type";
import { TbEye, TbEyeOff } from "react-icons/tb";

function BasicInput(props: InputProps) {
  const [inputType, setInputType] = useState<string>(
    props.type ? props.type : "text",
  );

  const [isFocus, setIsFocus] = useState(false);

  const onFocusCustom = (e: React.FocusEvent<HTMLInputElement, Element>) => {
    if (props.type === "number") {
      e.target.addEventListener(
        "wheel",
        function (e) {
          e.preventDefault();
        },
        { passive: false },
      );
    }

    props.onFocus && props.onFocus;
  };

  return (
    <div className={cls("w-full", props.className ? props.className : "")}>
      {/* ============== TITLE ============== */}
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

      {/* ============== INPUT ============== */}
      <div
        className={cls(
          "w-full relative",
          props.label ? "mt-1" : "", // label is not exist, margin-top is 0
        )}
      >
        {/* ============== TOOTIP ============== */}
        {isFocus && props.tooltip ? (
          <motion.div
            className="absolute bottom-[56px] left-0"
            initial={{ opacity: 0, y: "32px" }}
            animate={{ opacity: 1, y: "0" }}
          >
            <div className="bg-primaryMain py-1 px-4 rounded-full">
              <h6 className="!text-gray-900">{props.tooltip}</h6>
            </div>
            <Image
              src="/images/ai/bubble_tail.svg"
              alt=""
              className="ml-4"
              width={16}
              height={10}
            />
          </motion.div>
        ) : null}

        <input
          id={props.name}
          {...props.register}
          placeholder={props.placeholder ? props.placeholder : ""}
          type={inputType}
          defaultValue={props.defaultValue ? props.defaultValue : ""}
          readOnly={props.readOnly}
          autoComplete="off"
          onInput={
            props.onInput as
              | React.InputEventHandler<HTMLInputElement>
              | undefined
          }
          onKeyDown={props.onKeyDown}
          onWheel={props.onWheel}
          onFocus={(e) => {
            if (props.tooltip) {
              setIsFocus(true);
            }
            props.onFocus && props.onFocus(e);
          }}
          onBlur={(e) => {
            if (props.tooltip) {
              setIsFocus(false);
            }
            props.onBlur && props.onBlur(e);
          }}
          disabled={props.disabled}
          //style
          className={cls(
            "w-full min-h-[48px] bg-white dark:bg-gray-800 rounded-xl border-gray-50 border-solid border-2 p-3",
            "body2-400 text-gray-900 dark:text-white placeholder:text-gray-300 placeholder:body2-500", //text
            props.errorText ? "border-alertMain" : "border-gray-50",
            props.readOnly
              ? "invalid:!bg-gray-50 cursor-not-allowed !bg-gray-50 focus:border-gray-50 dark:!text-gray-500 dark:!bg-gray-800 dark:!border-gray-850 dark:focus:border-gray-850"
              : "",
            props.disabled
              ? "bg-gray-50 dark:bg-gray-850 dark:placeholder:text-gray-600"
              : "",
          )}
        />

        {/*  비밀번호 확인 버튼  */}
        {props.showToggle && props.type === "password" ? (
          <button
            type="button"
            onClick={() => {
              setInputType(inputType === "text" ? "password" : "text");
            }}
            className="absolute right-3 bottom-1/2 translate-y-1/2 w-6 h-6 flex justify-center items-center"
          >
            {inputType === "password" ? (
              <TbEyeOff className="fill-gray-600 dark:fill-gray-500" />
            ) : (
              <TbEye className="fill-gray-700 dark:fill-gray-300" />
            )}
          </button>
        ) : null}
      </div>

      {/* ============== 안내 텍스트 ============== */}
      {props.confirmText ? (
        <p className="body3-400 mt-2 text-approveMain">{props.confirmText}</p>
      ) : null}

      {props.addText ? (
        <p className="body3-400 mt-2 text-zinc-600">{props.addText}</p>
      ) : null}

      {props.errorText ? (
        <p className="body3-400 mt-2 text-red-500">{props.errorText}</p>
      ) : null}
    </div>
  );
}

export default BasicInput;
