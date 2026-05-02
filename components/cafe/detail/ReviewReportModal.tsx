"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { useReportReview } from "@/lib/api/reviewReports";
import type { ReviewReportReason } from "@/types/db";
import { cls } from "@/lib/utils";

const REASONS: { value: ReviewReportReason; label: string }[] = [
  { value: "spam", label: "광고/스팸" },
  { value: "abuse", label: "욕설/혐오" },
  { value: "inappropriate", label: "부적절한 내용" },
  { value: "irrelevant", label: "카페와 무관" },
  { value: "other", label: "기타" },
];

const DETAIL_MAX = 500;

interface ReviewReportModalProps {
  reviewId: string;
  open: boolean;
  onClose: () => void;
}

export default function ReviewReportModal({
  reviewId,
  open,
  onClose,
}: ReviewReportModalProps) {
  const [reason, setReason] = useState<ReviewReportReason>("spam");
  const [detail, setDetail] = useState("");
  const reportMut = useReportReview(reviewId);

  const reset = () => {
    setReason("spam");
    setDetail("");
  };

  const handleClose = () => {
    if (reportMut.isPending) return;
    reset();
    onClose();
  };

  const submit = () => {
    const trimmed = detail.trim();
    if (reason === "other" && !trimmed) {
      toast.error("기타 사유는 상세 내용을 입력해주세요.");
      return;
    }
    if (trimmed.length > DETAIL_MAX) {
      toast.error(`상세 내용은 ${DETAIL_MAX}자 이내여야 합니다.`);
      return;
    }

    reportMut.mutate(
      { reason, detail: trimmed || undefined },
      {
        onSuccess: () => {
          toast.success("신고가 접수되었습니다.");
          reset();
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-300">
          <motion.div
            onClick={handleClose}
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="후기 신고"
            className="absolute left-1/2 top-1/2 w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-bg p-5 shadow-overlay"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <h3 className="text-[15px] font-semibold tracking-[-0.2px]">
              후기 신고
            </h3>
            <p className="mt-1 mb-4 text-[12px] text-fg-3">
              어드민 검토 후 부적절한 후기는 삭제됩니다.
            </p>

            <div className="flex flex-col gap-1.5 mb-3">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={cls(
                    "flex items-center gap-2.5 rounded-lg cursor-pointer px-3 py-2 border",
                    reason === r.value
                      ? "border-kg-amber-soft bg-kg-amber-light text-kg-amber-deep"
                      : "border-border-subtle bg-bg text-fg-2 hover:bg-gray-50",
                  )}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-kg-amber"
                  />
                  <span className="text-[13px] font-medium">{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={
                reason === "other"
                  ? "상세 내용을 입력해주세요 (필수)"
                  : "상세 내용 (선택)"
              }
              rows={3}
              maxLength={DETAIL_MAX}
              className="w-full px-3 py-2 rounded-lg border border-border-medium bg-bg text-[12.5px] resize-none leading-relaxed"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={reportMut.isPending}
                className="px-4 py-2 rounded-full text-[12.5px] font-semibold cursor-pointer bg-gray-100 text-fg-2"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={reportMut.isPending}
                className="px-4 py-2 rounded-full text-[12.5px] font-semibold cursor-pointer bg-red-500 text-white disabled:opacity-50"
              >
                {reportMut.isPending ? "전송 중…" : "신고하기"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
