import { UseFormRegisterReturn } from "react-hook-form";

export interface InputProps {
  [key: string]: unknown;
  label?: string;
  name: string;
  type?: string;
  value?: string | number | readonly string[];
  defaultValue?: string;
  ref?: React.Ref<HTMLInputElement> | undefined;
  className?: string;
  readOnly?: boolean;
  disabled?: boolean;
  register?: UseFormRegisterReturn;
  placeholder?: string;

  //text
  addText?: string;
  confirmText?: string;
  errorText?: string;

  //event
  onWheel?: (e: React.WheelEvent<HTMLInputElement>) => void;
  onFocus?: (e?: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e?: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onInput?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  //state
  showToggle?: boolean;
  important?: boolean;
  optional?: boolean;
  unableEdit?: boolean;
  tooltip?: string;
}

export interface TextAreaInputProps {
  label?: string;
  footnote?: string;
  register?: UseFormRegisterReturn;
  placeholder?: string;
  require?: boolean;
  errors?: string;
  name?: string;
  disabled?: boolean;
  parentClassName?: string;
  descriptionLength?: number;
  defaultValue?: string;
  maxLength?: number;
  showMaxLength?: boolean;
  ref?: React.Ref<HTMLTextAreaElement> | undefined;
  onInput?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;

  //state
  important?: boolean;
  optional?: boolean;
  unableEdit?: boolean;
  [key: string]: unknown;
}
