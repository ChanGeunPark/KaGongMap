import React from "react";

export type ButtonSizeType = "FULL" | "LARGE" | "MEDIUM" | "SMALL" | "X-SMALL";

export type ButtonStyleType =
  | "PRIMARY"
  | "SECONDARY"
  | "BLACK"
  | "OUTLINED"
  | "CANCEL"
  | "WARNING";

export interface CheckNamedType {
  label: string;
  checked?: boolean;
}

export interface GroupButtonType {
  styles?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ButtonProps {
  // React Button Default props
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseOut?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset" | undefined;
  target?: string;

  //link
  link?: string;
  replace?: boolean;

  // Design system props
  buttonSize?: ButtonSizeType;
  buttonStyle?: ButtonStyleType;
  disabled?: boolean;
  rounded?: boolean;
  width?: number;
  height?: number;

  //icon button
  icon?: React.ReactNode;
}

export interface IconButtonProps {
  // React Button Default props
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseOut?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset" | undefined;
  target?: string;

  // Design system props
  buttonSize?: ButtonSizeType;
  buttonStyle?: ButtonStyleType;
  disabled?: boolean;
  link?: string;
  width?: number;
  height?: number;
  icon?: React.ReactNode;
}

export interface IMainUIProps {
  moveToPage: () => void;
  className?: string;
}

export interface CopyButtonIProps {
  children?: string;
  onClick?: () => void;
  className?: string;
}
