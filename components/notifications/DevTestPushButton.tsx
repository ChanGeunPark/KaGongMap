"use client";

import { useState } from "react";
import { toast } from "react-toastify";

type Result = {
  ok: boolean;
  tokenCount?: number;
  result?: {
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
  };
  error?: string;
};

export default function DevTestPushButton() {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<Result | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setLast(null);
    try {
      const res = await fetch("/api/dev/test-push", { method: "POST" });
      const json = (await res.json()) as Result;
      setLast(json);

      if (!res.ok || !json.ok) {
        toast.error(`발송 실패: ${json.error ?? res.statusText}`);
        return;
      }

      const r = json.result;
      if (!r || r.successCount === 0) {
        toast.error(
          `토큰 ${json.tokenCount ?? 0}개 / 성공 0 / 실패 ${r?.failureCount ?? 0}`,
        );
        return;
      }

      toast.success(
        `FCM 발송 성공 (${r.successCount}개). 핸드폰 알림창 확인하세요.`,
      );
    } catch (err) {
      toast.error(
        `네트워크 오류: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-5">
      <h2 className="text-[15px] font-semibold text-amber-900">
        [DEV] 푸시 테스트 발송
      </h2>
      <p className="mt-1 text-[12.5px] leading-5 text-amber-800">
        본인에게 즉시 푸시를 발송합니다. 디버깅용 — 배포 전 삭제하세요.
      </p>

      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="mt-3 rounded-full bg-amber-600 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
      >
        {busy ? "발송 중..." : "테스트 푸시 보내기"}
      </button>

      {last && (
        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-white p-3 text-[11px] leading-4 text-gray-800">
          {JSON.stringify(last, null, 2)}
        </pre>
      )}
    </section>
  );
}
