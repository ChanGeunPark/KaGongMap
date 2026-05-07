# 카공맵 — 기능 명세서 (PRD)

> 현재 상태: **MVP 완료**. 메인 지도, 카페 제보·승인, 사진/정보수정 제보, 후기, 좋아요, 즐겨찾기, 마이페이지, 어드민(일반 + AI 자동 제보), 푸시 알림, Analytics 모두 운영 중.

## 서비스 개요

**카공맵(KaGongMap)** 은 카공족(카페에서 공부·작업하는 사람)이 직접 카페를 등록하고, 콘센트·와이파이·소음 등 카공 특화 정보를 지도 위에 공유하는 커뮤니티 서비스다.

### 타겟 유저 페르소나

| 페르소나        | 특징                     | 핵심 니즈                             |
| --------------- | ------------------------ | ------------------------------------- |
| 취준생 (24세)   | 집 집중 안 됨, 카페 전전 | 콘센트 필수, 조용한 곳, 장기 체류     |
| 프리랜서 (29세) | 매일 다른 카페에서 재택  | 와이파이 속도, 화상회의 가능 여부     |
| 대학원생 (26세) | 논문 작업, 카페 선호     | 장시간 허용, 조용한 분위기, 넓은 책상 |

---

## 인증(Auth) 정책

### 핵심 원칙: "보는 건 자유, 참여는 로그인"

| 기능                       | 비로그인          | 로그인  |
| -------------------------- | ----------------- | ------- |
| 지도 탐색 & 핀 보기        | ✅                | ✅      |
| 카페 상세 & 태그 정보 보기 | ✅                | ✅      |
| 후기 읽기                  | ✅                | ✅      |
| 필터 검색                  | ✅                | ✅      |
| 카페 제보                  | ✅                | ✅      |
| 사진 제보                  | ✅                | ✅      |
| 좋아요                     | ✅ (localStorage) | ✅ (DB) |
| 후기 작성                  | ✅ (닉네임+PIN)   | ✅      |
| 후기 신고                  | ✅                | ✅      |
| 카페 정보 수정 제안        | ❌                | ✅      |
| 즐겨찾기                   | ❌                | ✅      |
| 마이페이지                 | ❌                | ✅      |
| 푸시 알림 수신             | ❌                | ✅      |

**UX 처리**: 로그인이 강제되는 액션은 `<AuthGate>` 가 `/login` 으로 안내. 카페·사진 제보·후기·좋아요 등은 비로그인도 가능하지만, 로그인 시 `user_id` 가 자동으로 함께 기록된다.

### 소셜 로그인 (NextAuth.js)

- Kakao OAuth (기본)
- Google OAuth
- JWT 세션. `session.user.id` = OAuth provider account id (TEXT). UUID `users.id` 는 Supabase 내부에서 첫 로그인 시 `/api/users` upsert 로 발급.
- `session.user.provider` 로 카카오/구글 분기 가능 (`lib/auth.ts`).

---

## MVP 기능 (현재 운영)

### F01. 카페 지도 탐색

- 네이버 지도 위 커스텀 핀 (점수에 따라 녹색/앰버/레드 + 클러스터링).
- 현재 위치 기반 진입.
- 지도 이동 시 `bounds` 변화에 따라 클라이언트 측 visible 카페가 갱신됨.
- 핀 클릭 → `<CafeModalDetail>` (모바일 = 바텀시트, 데스크탑 = 우측 사이드 패널).

### F02. 카공 필터 검색

- `KG_FILTERS` 12개 (`lib/data.ts`): 콘센트, 와이파이, 조용함, 24시간, 노트북 허용, 혼잡도 낮음, 늦은영업, 가성비, 자연채광, 야외테라스, 반려동물, 주차.
- 다중 AND 매칭 + 정렬(score / likes / distance / 등) + bounds 필터를 `useFilteredCafes` 가 클라이언트에서 처리.
- 모바일은 `<FilterDrawer>` 풀스크린에서 모든 필터 조작.

### F03. 카페 제보 → 어드민 승인 (모달 기반)

- TopNav `<ReportButton>` → `<CafeInfoForm>` 3단계 모달
  1. **기본 정보** — 카페명, 주소(카카오 주소 검색 + 지도 핀 미세 조정), 영업시간(`<HoursInput>` 요일별), 최소 주문 금액, 한줄 설명
  2. **카공 정보** — 카공 태그 멀티 선택
  3. **사진** — Cloudflare Images direct upload (최대 5장)
- 비로그인도 제보 가능. 로그인 시 `cafe_submissions.user_id` 자동 기록.
- 어드민이 `/admin` 의 "대기 중" 탭에서 승인 → DB 트리거가 `cafes` + `cafe_tags` 자동 생성.

### F04. 카페 상세 (모달)

- `<CafeModalDetail>` 안에서 표시되는 정보:
  - HeroGallery + Cloudflare 이미지
  - 주소·영업시간·최소 주문 금액·연락처
  - 카공 태그 + ScoreDisc (kagong/date/talk 차원별 점수)
  - ProsCons / CafeEnvironmentSection / CrowdChart
  - 좋아요·즐겨찾기 액션
  - "📷 사진 제보" → `<ImageSubmitModal>`
  - "✏️ 정보 수정 제안" → `<CafeEditModal>` (CafeInfoForm 재사용, 로그인 필요)
  - 후기 섹션 → 작성 + 목록 + 신고

### F05. 후기 (별점 없는 텍스트)

- `reviews` 테이블, **별점/avg_rating 없음**. "적합도"는 카공 태그 가중치(`lib/scoring.ts`)로 산출.
- 비로그인: 닉네임(자유 입력) + 4자리 PIN → `password_hash`(scrypt) 저장. 본인 글 삭제 시 PIN 검증.
- 로그인: `users.nickname` 을 작성 시점 스냅샷으로 저장. 닉네임을 바꿔도 과거 후기에는 영향 없음.
- 한 유저가 같은 카페에 여러 번 작성 가능 (UNIQUE 제약 없음).

### F06. 후기 신고

- 비로그인 포함 누구나 `<ReviewReportModal>` 로 신고. 본인이 쓴 후기는 차단(로그인 본인 매칭 시).
- `review_reports` pending 3건 이상이면 공개 GET 응답에서 자동 숨김.
- 어드민이 단건 dismiss 또는 후기 자체 삭제(CASCADE) 처리.

### F07. 좋아요

- 비로그인: `cafes.like_count` 만 RPC `bump_cafe_like_count` 로 +1/-1, 누가 눌렀는지는 `localStorage.kagongmap.likedCafeIds` 에 보관.
- 로그인: `cafe_likes(user_id, cafe_id)` 행 INSERT/DELETE. 트리거가 `like_count` 동기.
- 로그인 직후: `merge_anonymous_likes` RPC 로 localStorage IDs 를 cafe_likes 에 합집합 (트리거가 INSERT 마다 +1 했으므로 중복 +1 보정 -1).

### F08. 즐겨찾기 (로그인 전용)

- `<BookmarkButton>` 토글. 낙관적 업데이트.
- 마이페이지 "즐겨찾기" 탭 = `GET /api/bookmarks/cafes`.

### F09. 사진 제보

- `<ImageSubmitModal>` — 비로그인도 OK. 최대 5장 + 200자 caption.
- Cloudflare Images direct upload → `cafe_image_submissions` 에 `pending`.
- 어드민 승인 시 트리거가 `cafes.images` 배열에 append.

### F10. 카페 정보 수정 제안 (로그인 전용)

- `<CafeEditModal>` 이 `CafeInfoForm` 을 `mode="edit"` 로 재사용.
- `cafe_edit_submissions` 에 변경 diff 저장 → 어드민이 승인 시 cafes 업데이트.

### F11. 마이페이지

- 프로필: 아바타, 닉네임(인라인 수정, `PATCH /api/users/me/nickname`), 가입일.
- 탭: 즐겨찾기 / 내가 등록한 카페 / 내 후기 / 제보 요약.
- 푸시 알림 토글, 위치 권한 상태, (DEV) 푸시 테스트 버튼.

### F12. 어드민 콘솔 `/admin`

- 가드: NextAuth `session.user.id` 가 `ADMIN_USER_IDS`(콤마 구분 환경변수) 에 포함되어야 통과.
- 탭 5종: 카페 제보 (대기 중) · 등록된 카페 · 사진 제보 · 정보 수정 제안 · 후기 신고.
- 모든 mutation 은 `service_role` API 라우트로 RLS 우회.
- 관련 액션 발생 시 어드민 푸시 자동 발송 (`docs/PUSH_NOTIFICATIONS.md`).

### F13. 어드민 AI 자동 제보 `/admin/auto-submit`

- 본인 PC 의 `tools/auto-submit-bridge` (Hono + Claude CLI spawn) 와 통신.
- 카카오 검색 → 카페 선택 → "AI 조사 시작" → 큐 → 검수 모달 → `cafe_submissions(pending)` INSERT.
- 자세한 흐름·환경변수·보안 메모는 `docs/AUTO_SUBMIT.md`.
- 모바일 미지원 (브릿지가 본인 PC `127.0.0.1` 바인딩).

### F14. 푸시 알림 (FCM)

- 어드민에게 카페·사진·정보수정·신고 INSERT 시 자동 발송.
- 일반 사용자는 마이페이지에서 직접 토글로 토큰 등록/해제.
- iOS 는 16.4+ PWA 홈 화면 추가 시에만 동작.
- 전체 흐름·DB 스키마는 `docs/PUSH_NOTIFICATIONS.md`.

### F15. Firebase Analytics

- 이벤트 12종 (page_view, cafe_marker_click, cafe_search_select, filter_apply, cafe_view, like_toggle, favorite_toggle, cafe_submit_complete, edit_suggest_submit, photo_submit, review_submit, login_attempt, notification_permission).
- 단일 진입점 `lib/firebase/analytics.ts` 의 `track()`.
- 자세한 차원 등록·퍼널은 `docs/ANALYTICS.md`.

---

## V2 후보 (미구현)

| 기능                                     | 메모                                                 |
| ---------------------------------------- | ---------------------------------------------------- |
| 카공 팁 게시판 (`posts`)                 | 스키마는 정의돼 있으나 라우트/UI 없음. 카페 연계 글. |
| 지역별 / 조건별 카페 랭킹                | likes + score 기반 집계 페이지.                      |
| 카페 제보 승인 알림을 제보자에게 푸시    | `sendPushToUser(submitterId, ...)`                   |
| 즐겨찾기 카페 신규 후기 알림             | bookmark 가입자에게 푸시                             |
| 가중치 어드민 조정 (`tag_scores` 테이블) | 현재 `lib/scoring.ts` 코드에 하드코딩                |

---

## 카공 태그 정의 (`cafe_tag` enum)

| 태그            | 설명                                   | 이모지 |
| --------------- | -------------------------------------- | ------ |
| `콘센트_있음`   | 노트북 충전 가능한 콘센트 자리 있음    | 🔌     |
| `와이파이_있음` | 와이파이 제공 (비밀번호 있어도 포함)   | 📶     |
| `조용함`        | 대화 소음이 적고 집중하기 좋은 분위기  | 🤫     |
| `24시간`        | 24시간 운영                            | 🕐     |
| `시간제한없음`  | 별도 시간 제한 없음 (무제한 착석)      | ⏳     |
| `노트북_허용`   | 노트북 사용 환영/허용                  | 💻     |
| `혼잡도_낮음`   | 자리 잡기 쉽고 여유 있음               | 🟢     |
| `늦은영업`      | 23시 이후까지 영업 (24시간 아닌 야간)  | 🌙     |
| `가성비_좋음`   | 음료 가격이 합리적                     | 💸     |
| `자연채광`      | 햇빛이 잘 들어오는 환경                | ☀️     |
| `야외테라스`    | 야외 좌석/테라스 있음                  | 🌿     |
| `반려동물_가능` | 강아지·고양이 동반 가능                | 🐶     |
| `주차_가능`     | 차량 주차 가능 (자체/제휴 주차장 포함) | 🅿️     |

> `시간제한없음` 은 enum 에 존재하지만 현재 `KG_FILTERS` UI 에서 빠져 있다 (점수 가중치만 적용). 추가 필요 시 `lib/data.ts` 의 `KG_FILTERS` 에 항목만 더하면 즉시 노출됨.

---

## 적합도 점수 (kagong / date / talk)

- 차원: `kagong | date | talk` (`ScoreDimension`)
- 카페별 보유 태그에 차원별 가중치(`lib/scoring.ts > WEIGHTS`)를 합산.
- 등급(`getScoreTier`): `kagong` 차원은 점수 10+ 우수, 5+ 양호, 4 이하 정보 부족. date/talk 도 자체 임계값.
- 핀 색상은 `getScoreTier(score, "kagong")` 결과로 결정.
- 정렬 기본값: `score` (선택한 차원 점수) → `likes` → `distance` 등 사용자가 변경 가능.

> 어드민이 가중치를 동적으로 조정해야 할 경우 `tag_scores` 테이블을 만들고 동일 자료구조를 DB seed 로 이전하면 됨.
