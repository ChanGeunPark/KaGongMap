// ── 어드민 자동 제보 — 로컬 브릿지 클라이언트 ─────────────────────────────
// 본인 PC 에서 실행 중인 auto-submit-bridge 와 통신.
// 환경변수: NEXT_PUBLIC_BRIDGE_URL, NEXT_PUBLIC_BRIDGE_TOKEN

import type {
  AutoSubmitJob,
  AutoSubmitJobEvent,
} from "@/types/autoSubmit";
import type { PlaceSearchResult } from "@/types/kakao";

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_BRIDGE_URL ?? "http://localhost:7332";
const BRIDGE_TOKEN = process.env.NEXT_PUBLIC_BRIDGE_TOKEN ?? "";

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${BRIDGE_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export class BridgeError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "BridgeError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BRIDGE_URL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    });
  } catch (err) {
    throw new BridgeError(
      "브릿지에 연결할 수 없습니다. 본인 PC 에서 `npm run bridge` 가 실행 중인지 확인하세요.",
      err,
    );
  }
  if (res.status === 401) {
    throw new BridgeError(
      "브릿지 토큰이 일치하지 않습니다. NEXT_PUBLIC_BRIDGE_TOKEN 과 BRIDGE_TOKEN 을 동일하게 설정하세요.",
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new BridgeError(
      `브릿지 오류 (${res.status}): ${body.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

// ── HTTP API ────────────────────────────────────────────────────────────────

export async function checkBridgeHealth(): Promise<{
  ok: boolean;
  agent: string;
  concurrency: number;
}> {
  return request("/health");
}

export async function listJobs(): Promise<AutoSubmitJob[]> {
  const json = await request<{ jobs: AutoSubmitJob[] }>("/jobs");
  return json.jobs;
}

export async function enqueueJob(
  place: PlaceSearchResult,
): Promise<AutoSubmitJob> {
  const json = await request<{ job: AutoSubmitJob }>("/jobs", {
    method: "POST",
    body: JSON.stringify({ place }),
  });
  return json.job;
}

export async function deleteJob(id: string): Promise<void> {
  await request(`/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function markJobSubmitted(id: string): Promise<void> {
  await request(`/jobs/${encodeURIComponent(id)}/submitted`, {
    method: "POST",
  });
}

// ── 어드민 자동제보 → cafe_submissions INSERT ─────────────────────────────

export interface CreateAutoSubmissionPayload {
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours?: string | null;
  min_order_amount?: number | null;
  description?: string | null;
  tags: string[];
}

export async function createAutoSubmission(
  payload: CreateAutoSubmissionPayload,
): Promise<string> {
  const res = await fetch("/api/admin/auto-submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "자동 제보 등록 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}

// ── SSE 구독 ───────────────────────────────────────────────────────────────
// 표준 EventSource 는 헤더 추가가 불가능 → fetch streaming 으로 직접 파싱.

export interface SubscribeHandlers {
  onEvent: (event: AutoSubmitJobEvent) => void;
  onOpen?: () => void;
  onError?: (err: Error) => void;
}

export function subscribeJobEvents(
  handlers: SubscribeHandlers,
): () => void {
  const controller = new AbortController();
  let closed = false;

  void (async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/events`, {
        headers: authHeaders(),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new BridgeError(`SSE 연결 실패 (${res.status})`);
      }
      handlers.onOpen?.();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 프레임은 빈 줄(\n\n) 단위
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const dataLine = frame
            .split("\n")
            .find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          const payload = dataLine.slice(6);
          try {
            const event = JSON.parse(payload) as AutoSubmitJobEvent;
            handlers.onEvent(event);
          } catch (err) {
            console.warn("[autoSubmit] SSE parse error", err);
          }
        }
      }
    } catch (err) {
      if (closed || (err as Error).name === "AbortError") return;
      handlers.onError?.(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  })();

  return () => {
    closed = true;
    controller.abort();
  };
}
