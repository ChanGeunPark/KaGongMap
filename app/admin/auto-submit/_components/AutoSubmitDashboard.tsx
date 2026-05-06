"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  BridgeError,
  checkBridgeHealth,
  deleteJob,
  enqueueJob,
  listJobs,
  subscribeJobEvents,
} from "@/lib/api/autoSubmit";
import type { AutoSubmitJob } from "@/types/autoSubmit";
import type { PlaceSearchResult } from "@/types/kakao";
import KakaoSearchPanel from "./KakaoSearchPanel";
import JobCard from "./JobCard";
import BridgeStatusBadge, { type BridgeStatus } from "./BridgeStatusBadge";
import ReviewModal from "./ReviewModal";

export default function AutoSubmitDashboard() {
  const [jobs, setJobs] = useState<AutoSubmitJob[]>([]);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("connecting");
  const [bridgeMessage, setBridgeMessage] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<AutoSubmitJob | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모바일 감지 (단순 width 기준 — 브릿지가 본인 PC 에서만 도니까 모바일은 안내만)
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // SSE 구독 + 헬스체크
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let cancelled = false;

    const connect = async () => {
      setBridgeStatus("connecting");
      setBridgeMessage(null);
      try {
        await checkBridgeHealth();
        if (cancelled) return;
        const initial = await listJobs();
        if (cancelled) return;
        setJobs(initial);

        unsub = subscribeJobEvents({
          onOpen: () => {
            if (cancelled) return;
            setBridgeStatus("connected");
            setBridgeMessage(null);
          },
          onEvent: (event) => {
            if (cancelled) return;
            if (event.type === "snapshot") {
              setJobs(event.jobs);
            } else if (event.type === "upsert") {
              setJobs((prev) => {
                const next = prev.filter((j) => j.id !== event.job.id);
                next.push(event.job);
                next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
                return next;
              });
            } else if (event.type === "remove") {
              setJobs((prev) => prev.filter((j) => j.id !== event.id));
            }
          },
          onError: (err) => {
            if (cancelled) return;
            setBridgeStatus("disconnected");
            setBridgeMessage(err.message);
            scheduleReconnect();
          },
        });
      } catch (err) {
        if (cancelled) return;
        setBridgeStatus("disconnected");
        setBridgeMessage(
          err instanceof BridgeError || err instanceof Error
            ? err.message
            : "브릿지 연결에 실패했습니다.",
        );
        scheduleReconnect();
      }
    };

    const scheduleReconnect = () => {
      if (reconnectTimer.current) return;
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        if (!cancelled) connect();
      }, 5_000);
    };

    void connect();

    return () => {
      cancelled = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      unsub?.();
    };
  }, []);

  const handleEnqueue = async (place: PlaceSearchResult) => {
    if (bridgeStatus !== "connected") {
      toast.error("브릿지가 연결되어 있지 않습니다.");
      return;
    }
    try {
      await enqueueJob(place);
      toast.success(`'${place.name}' 조사를 시작합니다.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "큐 등록에 실패했습니다.",
      );
    }
  };

  const handleDelete = async (job: AutoSubmitJob) => {
    if (job.status === "researching") {
      if (!confirm("진행 중인 작업입니다. 정말 취소하시겠습니까?")) return;
    }
    try {
      await deleteJob(job.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "삭제에 실패했습니다.",
      );
    }
  };

  const queueCounts = useMemo(() => {
    const counts = {
      queued: 0,
      researching: 0,
      ready: 0,
      failed: 0,
      submitted: 0,
    };
    for (const j of jobs) counts[j.status] += 1;
    return counts;
  }, [jobs]);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-fg font-semibold text-[19px] tracking-[-0.3px] shrink-0 transition-opacity hover:opacity-80"
            >
              <Image
                src="/images/logo.png"
                alt="카공맵"
                width={120}
                height={50}
                className="object-cover"
              />
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500 truncate">
              ADMIN · AI 자동 제보
            </span>
          </div>
          <BridgeStatusBadge status={bridgeStatus} message={bridgeMessage} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {isMobile && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            ⚠️ 자동 제보 기능은 본인 PC 의 브릿지를 사용하므로{" "}
            <strong>데스크탑에서만 동작</strong>합니다.
          </div>
        )}

        {bridgeStatus === "disconnected" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            <p className="font-semibold mb-2">🔌 로컬 브릿지가 연결되지 않았습니다</p>
            <p className="mb-3 text-rose-700">{bridgeMessage}</p>
            <pre className="bg-white border border-rose-200 rounded-lg p-3 text-xs text-rose-900 overflow-x-auto">
              {`cd tools/auto-submit-bridge
npm install
cp .env.example .env   # BRIDGE_TOKEN 채우기
npm run bridge`}
            </pre>
            <p className="mt-2 text-xs text-rose-600">
              5초마다 자동으로 재연결을 시도합니다.
            </p>
          </div>
        )}

        <KakaoSearchPanel
          onPick={handleEnqueue}
          disabled={bridgeStatus !== "connected"}
        />

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              작업 큐 ({jobs.length})
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>대기 {queueCounts.queued}</span>
              <span>조사중 {queueCounts.researching}</span>
              <span className="text-emerald-600">완료 {queueCounts.ready}</span>
              <span className="text-rose-600">실패 {queueCounts.failed}</span>
              <span className="text-blue-600">
                제출 {queueCounts.submitted}
              </span>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <span className="text-3xl mb-2">🪄</span>
              <p className="text-sm">위에서 카페를 검색해 큐에 추가하세요.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onReview={() => setReviewing(job)}
                  onDelete={() => handleDelete(job)}
                  onRetry={() => handleEnqueue(job.place)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {reviewing && (
        <ReviewModal
          job={reviewing}
          onClose={() => setReviewing(null)}
          onSubmitted={(jobId) => {
            setReviewing(null);
            // SSE 가 status='submitted' 갱신을 보내주지만,
            // 통신 실패 시에도 안전하게 로컬 상태를 업데이트.
            setJobs((prev) =>
              prev.map((j) =>
                j.id === jobId
                  ? { ...j, status: "submitted", completedAt: new Date().toISOString() }
                  : j,
              ),
            );
          }}
        />
      )}
    </div>
  );
}
