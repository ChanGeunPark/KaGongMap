"use client";

import { useEffect, useState } from "react";
import { TbReload, TbTrash, TbEye } from "react-icons/tb";
import type { AutoSubmitJob, AutoSubmitJobStatus } from "@/types/autoSubmit";

const STATUS_STYLE: Record<
  AutoSubmitJobStatus,
  { dot: string; label: string; text: string }
> = {
  queued: { dot: "bg-gray-300", label: "대기", text: "text-gray-500" },
  researching: {
    dot: "bg-amber-400 animate-pulse",
    label: "조사중",
    text: "text-amber-700",
  },
  ready: { dot: "bg-emerald-500", label: "검토 대기", text: "text-emerald-700" },
  failed: { dot: "bg-rose-500", label: "실패", text: "text-rose-700" },
  submitted: { dot: "bg-blue-500", label: "제출됨", text: "text-blue-700" },
};

interface JobCardProps {
  job: AutoSubmitJob;
  onReview: () => void;
  onDelete: () => void;
  onRetry: () => void;
}

export default function JobCard({
  job,
  onReview,
  onDelete,
  onRetry,
}: JobCardProps) {
  const style = STATUS_STYLE[job.status];

  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${style.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {style.label}
            {job.status === "researching" && <Elapsed since={job.startedAt} />}
          </span>
          <h3 className="text-sm font-bold text-gray-900 truncate">
            {job.place.name}
          </h3>
        </div>
        <p className="text-xs text-gray-500 truncate">
          📍 {job.place.roadAddress || job.place.address}
        </p>
        {job.status === "ready" && job.result && (
          <ReadyPreview result={job.result} />
        )}
        {job.status === "failed" && job.error && (
          <p className="mt-1.5 text-xs text-rose-600 line-clamp-2">
            {job.error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {job.status === "ready" && (
          <button
            type="button"
            onClick={onReview}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-600 active:scale-95"
          >
            <TbEye size={14} />
            검토하기
          </button>
        )}
        {job.status === "failed" && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <TbReload size={14} />
            재시도
          </button>
        )}
        {job.status !== "researching" && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50"
            title="큐에서 제거"
          >
            <TbTrash size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ReadyPreview({
  result,
}: {
  result: NonNullable<AutoSubmitJob["result"]>;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      <span
        className={`px-1.5 py-0.5 rounded font-mono ${confidenceColor(
          result.confidence.overall,
        )}`}
        title="LLM 자체 신뢰도"
      >
        신뢰 {result.confidence.overall}
      </span>
      <span className="text-gray-500">태그 {result.tags.length}개</span>
      {result.hours && (
        <span className="text-gray-500 truncate">🕐 {result.hours}</span>
      )}
      {result.min_order_amount != null && (
        <span className="text-gray-500">
          💰 {result.min_order_amount.toLocaleString("ko-KR")}원
        </span>
      )}
    </div>
  );
}

function Elapsed({ since }: { since: string | undefined }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!since || now === null) return null;
  const sec = Math.floor((now - new Date(since).getTime()) / 1000);
  return <span className="font-mono text-[10px] text-amber-600">({sec}s)</span>;
}

function confidenceColor(c: "high" | "mid" | "low"): string {
  if (c === "high") return "bg-emerald-50 text-emerald-700";
  if (c === "mid") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}
