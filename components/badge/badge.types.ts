export type BadgeSize = "LARGE" | "MEDIUM" | "SMALL";

export type BadgeStyleType =
  | "PRIMARY"
  | "TINT"
  | "OUTLINED"
  | "SECONDARY"
  | "BLACK";

export interface BadgeProps {
  // React Button Default props
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;

  // Design system props
  BadgeSize?: BadgeSize;
  BadgeStyle?: BadgeStyleType;
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
