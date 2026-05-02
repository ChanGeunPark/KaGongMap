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
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void | undefined;

  //state
  showToggle?: boolean;
  important?: boolean;
  optional?: boolean;
  unableEdit?: boolean;
  tooltip?: string;
  rest?: React.InputHTMLAttributes<HTMLInputElement>;
}

export interface TextAreaInputProps {
  label?: string;
  footnote?: string;
  register?: UseFormRegisterReturn;
  placeholder?: string;
  require?: boolean;
  errors?: string;
  errorText?: string;
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

  // controlled component support (Controller + field)
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;

  //state
  important?: boolean;
  optional?: boolean;
  unableEdit?: boolean;
}
