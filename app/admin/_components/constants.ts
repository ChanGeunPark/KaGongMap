import type { SubmissionStatus } from "@/types/db";

export const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "대기 중",
  approved: "승인됨",
  rejected: "거절됨",
};

export const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
};

export const CARD_ACCENT: Record<SubmissionStatus, string> = {
  pending: "border-l-amber-400",
  approved: "border-l-emerald-400",
  rejected: "border-l-red-400",
};
