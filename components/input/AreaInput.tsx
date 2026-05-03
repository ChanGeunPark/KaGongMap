import React from "react";
import { cls } from "@/lib/utils";
import { TextAreaInputProps } from "./input.type";

function AreaInput(props: TextAreaInputProps) {
  const {
    label,
    footnote,
    register,
    placeholder,
    errors,
    name,
    disabled,
    parentClassName,
    descriptionLength,
    defaultValue,
    maxLength,
    showMaxLength = true,
    onInput,
    onKeyDown,
    onBlur,
    className,
    important,
    optional,
    unableEdit,
    value,
    onChange,
    errorText,
  } = props;

  let remainingText = maxLength || 0;
  if (maxLength && descriptionLength) {
    remainingText = maxLength - descriptionLength;
  }

  const displayError = errors || errorText;

  return (
    <div className={cls("flex flex-col w-full", parentClassName)}>
      {label ? (
        <label
          className="text-label font-semibold text-fg-2 mb-1"
          htmlFor={name}
        >
          <h5 className="relative inline-block">{label}</h5>
          {optional && <span className="text-gray-300 ml-1 body3">(선택)</span>}
          {important ? <span className="text-alertMain ml-0.5">*</span> : null}
          {unableEdit ? (
            <span className="text-gray-400 ml-1 body3">(수정불가)</span>
          ) : null}
        </label>
      ) : null}

      <textarea
        {...register}
        value={register ? undefined : value}
        onChange={register ? undefined : onChange}
        onInput={
          onInput as React.FormEventHandler<HTMLTextAreaElement> | undefined
        }
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cls(
          "body1-400 w-full h-28 placeholder:body2-400 rounded-md outline-none resize-none border-2 border-solid focus:ring-0 p-4",
          "text-gray-800 placeholder:text-gray-300 bg-white focus:border-primaryDark",
          displayError
            ? "border-alertMain focus:!border-alertMain"
            : "border-gray-50",
          label ? "mt-1" : "",
          className ?? "",
        )}
        autoComplete="off"
        defaultValue={register ? defaultValue : undefined}
        placeholder={placeholder}
        readOnly={disabled}
        maxLength={maxLength}
        name={name}
      />

      <div className="w-full flex justify-between items-center">
        {!displayError && !footnote && <span></span>}
        {displayError && (
          <p className="text-alertMain body3-400 mt-1">{displayError}</p>
        )}
        {footnote && <p className="body3-400 mt-1 text-gray-500">{footnote}</p>}
        {maxLength && showMaxLength && (
          <span
            className={cls(
              "font-mono text-[11px] text-fg-4 mt-2",
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
