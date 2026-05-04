// ── Supabase DB 타입 ────────────────────────────────────────────────────────

export type CafeTag =
  | "콘센트_있음"
  | "와이파이_있음"
  | "조용함"
  | "24시간"
  | "시간제한없음"
  | "노트북_허용"
  | "혼잡도_낮음"
  | "늦은영업"
  | "가성비_좋음"
  | "자연채광"
  | "야외테라스"
  | "반려동물_가능"
  | "주차_가능";

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
  address: string;
  lat: number;
  lng: number;
  like_count: number;
  min_order_amount: number | null;
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
  min_order_amount: number | null;
  images: string[];
  description: string | null;
  created_at: string;
  like_count: number;
  review_count: number;
  tags: CafeTag[];
}

// ── cafe_submissions 테이블 ──────────────────────────────────────────────────
// 사용자 카페 제보. 어드민 승인 시 트리거로 cafes에 자동 삽입.
// 비로그인도 가능 (user_id NULL). 로그인 시 NextAuth OAuth ID 기록.
export interface CafeSubmission {
  id: string;
  user_id: string | null;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string | null;
  min_order_amount: number | null;
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
  min_order_amount?: number;
  images: string[];
  description?: string;
  tags: CafeTag[];
  user_id?: string | null;
}

// ── reviews ─────────────────────────────────────────────────────────────────
// 별점/UNIQUE 제약 없음. 비로그인은 password_hash, 로그인은 user_id로 소유 식별.
export interface DbReview {
  id: string;
  cafe_id: string;
  user_id: string | null;
  nickname: string;
  content: string;
  created_at: string;
}

export interface CreateReviewPayload {
  content: string;
  // 로그인 유저는 둘 다 보내지 않음 (서버에서 세션으로 식별)
  nickname?: string;
  password?: string; // 4자리 숫자 PIN (비로그인만)
}

// ── review_reports ──────────────────────────────────────────────────────────
export type ReviewReportReason =
  | "spam"
  | "abuse"
  | "inappropriate"
  | "irrelevant"
  | "other";

export type ReviewReportStatus = "pending" | "dismissed" | "resolved";

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string | null;
  reason: ReviewReportReason;
  detail: string | null;
  status: ReviewReportStatus;
  created_at: string;
}

// 어드민 화면용 — 후기 단위로 신고 묶음
export interface ReviewReportGroup {
  review: DbReview;
  pending_count: number;
  reports: ReviewReport[];
}

export interface CreateReviewReportPayload {
  reason: ReviewReportReason;
  detail?: string;
}

export interface DbBookmark {
  id: string;
  cafe_id: string;
  user_id: string;
  created_at: string;
}

// ── cafe_image_submissions 테이블 ────────────────────────────────────────────
// 기존 카페에 추가 이미지 제보. 비로그인도 제보 가능, 로그인 시 user_id 기록.
// 승인 시 cafes.images 배열에 append.
export interface CafeImageSubmission {
  id: string;
  cafe_id: string;
  user_id: string | null;
  images: string[];
  caption: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  cafe_name?: string;
  cafe_address?: string;
}

export interface CreateCafeImageSubmissionPayload {
  cafe_id: string;
  images: string[];
  caption?: string;
  user_id?: string | null;
}

// ── cafe_edit_submissions 테이블 ─────────────────────────────────────────────
// 기존 카페의 텍스트 정보(이름·주소·시간·태그 등) 수정 제안. 이미지는 변경 불가.
// 비로그인도 가능, 로그인 시 user_id(NextAuth oauthId) 기록.
export interface CafeEditSubmission {
  id: string;
  cafe_id: string;
  user_id: string | null;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string | null;
  min_order_amount: number | null;
  description: string | null;
  tags: CafeTag[];
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  cafe_name?: string;
  cafe_address?: string;
}

export interface CreateCafeEditSubmissionPayload {
  cafe_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours?: string;
  min_order_amount?: number;
  description?: string;
  tags: CafeTag[];
  user_id?: string | null;
}
