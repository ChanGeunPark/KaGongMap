"use client";

import { useEffect, useRef, useState } from "react";
import { TbX, TbExternalLink } from "react-icons/tb";
import { toast } from "react-toastify";
import TagSelector from "@/components/cafe/form/TagSelector";
import {
  createAutoSubmission,
  markJobSubmitted,
} from "@/lib/api/autoSubmit";
import type { AutoSubmitJob, AutoSubmitConfidence } from "@/types/autoSubmit";
import type { CafeTag } from "@/types/db";

interface ReviewModalProps {
  job: AutoSubmitJob;
  onClose: () => void;
  onSubmitted: (jobId: string) => void;
}

export default function ReviewModal({
  job,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const result = job.result;
  const [hours, setHours] = useState(result?.hours ?? "");
  const [minOrderAmount, setMinOrderAmount] = useState(
    result?.min_order_amount != null ? String(result.min_order_amount) : "",
  );
  const [description, setDescription] = useState(result?.description ?? "");
  const [tags, setTags] = useState<CafeTag[]>(result?.tags ?? []);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, submitting]);

  if (!result) {
    return null;
  }

  const place = job.place;

  const handleSubmit = async () => {
    if (tags.length === 0) {
      toast.error("태그를 최소 1개 이상 선택해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const minOrder = minOrderAmount.replace(/[^\d]/g, "");
      await createAutoSubmission({
        name: place.name,
        address: place.roadAddress || place.address,
        lat: place.lat,
        lng: place.lng,
        hours: hours.trim() || null,
        min_order_amount: minOrder ? Number(minOrder) : null,
        description: description.trim() || null,
        tags,
      });
      // 브릿지 큐의 상태도 'submitted' 로 바꿔놓기 (실패해도 무시)
      markJobSubmitted(job.id).catch(() => {});
      toast.success("제보 등록 완료. 어드민 대기 탭에서 확인하세요.");
      onSubmitted(job.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "등록 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (!submitting && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <header className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            자동 조사 결과 검토
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <TbX size={18} />
          </button>
        </header>

        <div className="p-5 flex flex-col gap-5">
          {/* 잠긴 장소 정보 */}
          <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-[11px] font-semibold text-gray-500 mb-1">
              카카오에서 선택된 카페 (수정 불가)
            </p>
            <p className="text-sm font-bold text-gray-900">{place.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              📍 {place.roadAddress || place.address}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-mono">
              ({place.lat.toFixed(6)}, {place.lng.toFixed(6)})
            </p>
          </section>

          {/* 신뢰도 + 출처 */}
          <ConfidencePanel
            confidence={result.confidence}
            sources={result.sources}
          />

          {/* 입력 필드들 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              영업시간
            </label>
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="예) 평일 09:00-22:00 / 주말 10:00-23:00"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              최소 주문 금액 (원)
            </label>
            <input
              value={minOrderAmount}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/[^\d]/g, "");
                setMinOrderAmount(
                  onlyDigits
                    ? Number(onlyDigits).toLocaleString("ko-KR")
                    : "",
                );
              }}
              placeholder="예: 5,000"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              상세 설명{" "}
              <span className="font-normal text-gray-400">
                ({description.length}/300)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, 300))
              }
              rows={4}
              placeholder="이 카페에 대해 설명해주세요."
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-y"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700">
              카공 태그{" "}
              <span className="font-normal text-gray-400">
                ({tags.length}개 선택됨)
              </span>
            </label>
            <TagSelector
              value={tags}
              onChange={(next) => setTags(next as CafeTag[])}
            />
          </div>
        </div>

        <footer className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || tags.length === 0}
            className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "등록 중…" : "대기 큐로 제출"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function ConfidencePanel({
  confidence,
  sources,
}: {
  confidence: AutoSubmitConfidence;
  sources: string[];
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[11px] font-semibold text-gray-500">
          LLM 신뢰도
        </span>
        <ConfBadge label="시간" value={confidence.hours} />
        <ConfBadge label="태그" value={confidence.tags} />
        <ConfBadge label="전체" value={confidence.overall} />
      </div>
      {sources.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-gray-500">참고한 출처</p>
          <ul className="flex flex-col gap-0.5">
            {sources.map((src, i) => (
              <li key={`${src}-${i}`}>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                >
                  <TbExternalLink size={12} className="shrink-0" />
                  <span className="truncate max-w-[480px]">{src}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ConfBadge({
  label,
  value,
}: {
  label: string;
  value: "high" | "mid" | "low";
}) {
  const cls =
    value === "high"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "mid"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <span
      className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 ${cls}`}
    >
      {label} {value}
    </span>
  );
}
