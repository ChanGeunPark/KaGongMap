// ── 자동 제보 브릿지 공유 타입 ─────────────────────────────────────────────
// `tools/auto-submit-bridge/src/types.ts` 와 동일 스키마.
// 브릿지를 별도 레포로 분리할 때까지 임시로 어드민 페이지가 직접 import 한다.

import type { CafeTag } from "./db";
import type { PlaceSearchResult } from "./kakao";

export type AutoSubmitConfidence = {
  hours: "high" | "mid" | "low";
  tags: "high" | "mid" | "low";
  overall: "high" | "mid" | "low";
};

export interface ResearchedCafeData {
  hours: string | null;
  min_order_amount: number | null;
  description: string | null;
  tags: CafeTag[];
  confidence: AutoSubmitConfidence;
  sources: string[];
}

export type AutoSubmitJobStatus =
  | "queued"
  | "researching"
  | "ready"
  | "failed"
  | "submitted";

export interface AutoSubmitJob {
  id: string;
  place: PlaceSearchResult;
  status: AutoSubmitJobStatus;
  result?: ResearchedCafeData;
  rawOutput?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type AutoSubmitJobEvent =
  | { type: "snapshot"; jobs: AutoSubmitJob[] }
  | { type: "upsert"; job: AutoSubmitJob }
  | { type: "remove"; id: string };
