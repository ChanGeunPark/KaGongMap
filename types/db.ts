// ── Supabase DB 타입 ────────────────────────────────────────────────────────

export type CafeTag =
  | "콘센트_있음"
  | "와이파이_있음"
  | "조용함"
  | "24시간"
  | "시간제한없음"
  | "노트북_허용"
  | "혼잡도_낮음";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface DbUser {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

// ── Tier 1: cafe_markers 뷰 ──────────────────────────────────────────────────
// 지도 전체 핀 표시용. 앱 초기 1회 로딩.
export interface CafeMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  avg_rating: number;
  tags: CafeTag[];
}

// ── Tier 2: cafe_detail 뷰 ───────────────────────────────────────────────────
// 핀 클릭 시 해당 카페 1건만 온디맨드 로딩.
export interface CafeWithDetail {
  id: string;
  user_id: string | null;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string | null;
  images: string[];
  description: string | null;
  created_at: string;
  avg_rating: number;
  review_count: number;
  tags: CafeTag[];
}

// ── cafe_submissions 테이블 ──────────────────────────────────────────────────
// 사용자 카페 제보. 어드민 승인 시 트리거로 cafes에 자동 삽입.
export interface CafeSubmission {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string | null;
  images: string[];
  description: string | null;
  tags: CafeTag[];
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface CreateSubmissionPayload {
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours?: string;
  images: string[];
  description?: string;
  tags: CafeTag[];
}

// ── reviews ─────────────────────────────────────────────────────────────────
export interface DbReview {
  id: string;
  cafe_id: string;
  user_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  user?: Pick<DbUser, "nickname" | "avatar_url">;
}

export interface DbBookmark {
  id: string;
  cafe_id: string;
  user_id: string;
  created_at: string;
}
