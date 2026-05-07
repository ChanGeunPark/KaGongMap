# 카공맵 — 개발 마일스톤

> **현재 상태: MVP 완료.** 메인 지도, 카페 제보·승인, 후기, 좋아요·즐겨찾기, 마이페이지, 어드민(일반 + AI 자동 제보), 푸시 알림, Analytics 가 운영 중. 이 문서는 다음 단계(품질·성능·V2)에 집중한다.

---

## 완료된 마일스톤 요약

### M1. 기반 셋업
- [x] Next.js 16 (App Router) + Tailwind 4 + TypeScript strict
- [x] Supabase 클라이언트 (`lib/supabase/client.ts` 브라우저, `lib/supabase/server.ts` 서버 + `service_role` 어드민 클라이언트)
- [x] React Query (`providers/QueryProvider.tsx`)
- [x] DB 스키마 마이그레이션 (`docs/DB_SCHEMA.md`): users, cafes, cafe_tags, cafe_submissions, cafe_image_submissions, cafe_edit_submissions, cafe_likes, reviews, review_reports, bookmarks, fcm_tokens
- [x] `cafe_markers`, `cafe_detail` 뷰 + 트리거(`handle_submission_approved`, `handle_image_submission_approved`, `sync_cafe_like_count`)
- [x] RLS 정책 — 직접 접근이 위험한 테이블은 `service_role` API 만 통과

### M2. 인증
- [x] NextAuth.js Kakao + Google (`lib/auth.ts`)
- [x] JWT 세션. `session.user.id` = OAuth account id (TEXT), `session.user.provider`
- [x] 첫 로그인 시 `users` upsert (`useBootstrapDbUser` + `/api/users`)
- [x] 닉네임 자동 생성 (`lib/randomNickname.ts`) + 마이페이지에서 변경
- [x] `/login` 페이지, `<AuthGate>` 비로그인 유도

### M3. 지도 & 핀
- [x] 네이버 지도 SDK (`app/page.tsx` `<Script>` + `components/map/MapCanvas.tsx`)
- [x] 커스텀 핀 + 클러스터링 (`components/map/CafeMarkerClusterer.ts`)
- [x] 점수 기반 색상 (good/amber/low) — `lib/scoring.ts`
- [x] bounds 변화 감지 → `useFilteredCafes` 가 visible cafes 산출
- [x] 데스크탑 좌측 `<CafeSidebar>`, 모바일 `<BottomSheet>`
- [x] 카공 필터 12종 (`lib/data.ts > KG_FILTERS`) + 정렬

### M4. 카페 제보 / 상세 (모달 기반)
- [x] `<CafeInfoForm>` 3단계 모달 (등록 + 수정 제안 mode 양쪽 사용)
- [x] 카카오 주소 검색 프록시 (`/api/kakao/address`)
- [x] Cloudflare Images direct upload (`/api/cloudflare/image` + `<ImageUploader>`)
- [x] `<CafeModalDetail>` (반응형 BottomSheetModal): 갤러리, 정보 사이드바, 점수 디스크, ProsCons, 환경, 혼잡도 차트, 후기, 좋아요·즐겨찾기

### M5. 후기 + 신고
- [x] `reviews` 테이블 — 별점 없는 텍스트, 비로그인은 닉네임+PIN(scrypt)
- [x] `<CafeReviewSection>` 작성 + 목록
- [x] 후기 신고 (`<ReviewReportModal>`), pending 3건 이상 자동 숨김
- [x] 어드민 신고 처리 (단건 dismiss / 후기 삭제 CASCADE)

### M6. 좋아요 / 즐겨찾기
- [x] 비로그인 좋아요 — `bump_cafe_like_count` RPC + localStorage
- [x] 로그인 좋아요 — `cafe_likes` + 트리거 동기
- [x] 로그인 직후 머지 — `merge_anonymous_likes` RPC
- [x] 즐겨찾기 (`bookmarks`, 로그인 전용)
- [x] React Query 캐시 부분 패치(`patchLikeCount`)로 낙관적 업데이트

### M7. 사진 제보 / 정보 수정 제안
- [x] `<ImageSubmitModal>` (비로그인 OK) → `cafe_image_submissions`
- [x] 어드민 승인 시 `cafes.images` 자동 append (트리거)
- [x] `<CafeEditModal>` (로그인 전용) → `cafe_edit_submissions`
- [x] 어드민 승인 시 cafes 갱신

### M8. 마이페이지
- [x] 프로필(아바타·닉네임 인라인 수정·가입일)
- [x] 즐겨찾기 / 내 카페 / 내 후기 / 제보 요약
- [x] 푸시 알림 토글, 위치 권한 상태
- [x] (DEV) 푸시 테스트 버튼

### M9. 어드민 콘솔
- [x] `/admin` 서버 가드 (`ADMIN_USER_IDS`)
- [x] 5탭: 카페 제보 / 등록 / 사진 제보 / 정보 수정 제안 / 후기 신고
- [x] mutation 일괄 (`_hooks/useAdminMutations.ts`)
- [x] 어드민 액션 발생 시 푸시 알림 자동 발송

### M10. 어드민 AI 자동 제보
- [x] `/admin/auto-submit` 페이지
- [x] 로컬 브릿지 클라이언트 (`lib/api/autoSubmit.ts`) — HTTP + SSE
- [x] 카카오 검색 → 큐 → 검수 모달 → `cafe_submissions(pending)` INSERT
- [x] 외부 `tools/auto-submit-bridge` (Hono + Claude CLI spawn) 와 통신
- [x] 모바일 미지원 안내

### M11. 푸시 알림 (FCM)
- [x] `fcm_tokens` 테이블 + RLS
- [x] 클라이언트 토큰 발급/등록/해제 (`lib/firebase/fcm.ts`)
- [x] 서버 발송 헬퍼 (`lib/firebase/sendPush.ts`) — 500 청크, 무효 토큰 자동 정리
- [x] 어드민 알림 트리거 4종 (카페·사진·정보수정·신고)
- [x] 백그라운드 SW (`public/firebase-messaging-sw.js`) + 포그라운드 리스너

### M12. Analytics
- [x] Firebase Analytics SDK + `lib/firebase/analytics.ts > track()`
- [x] SPA pageview (`<RouteChangeTracker>`)
- [x] userId / auth_provider 동기 (`<AnalyticsIdentity>`)
- [x] 카공맵 도메인 이벤트 12종

### M13. 배포
- [x] Vercel 배포
- [x] PWA 매니페스트 (`app/manifest.ts`) + Service Worker 등록
- [x] sitemap / robots / OpenGraph 메타데이터
- [x] react-toastify 전역 토스트

---

## 다음 단계 (우선순위)

### P1. 품질 / 안정성
- [ ] e2e 테스트 (Playwright) — 핵심 플로우(제보, 후기, 좋아요, 어드민 승인) 회귀 방지
- [ ] 에러 바운더리 + Sentry 연동
- [ ] iOS PWA 설치 안내 강화 (현재 푸시 미지원 안내만 있음)
- [ ] 카공 점수 가중치를 어드민에서 조정 가능하도록 `tag_scores` 테이블로 이전

### P2. 성능
- [ ] 지도 마커 viewport 기반 lazy 렌더링 (현재 전체 마커를 한 번에 그림)
- [ ] 이미지 lazy + Cloudflare variants 활용
- [ ] React Query prefetch — 핀 hover 시 Tier 2 미리 로딩

### P3. V2 기능
- [ ] 카페 제보 승인 시 제보자에게 푸시 (`sendPushToUser(submitterId, ...)`)
- [ ] 즐겨찾기 카페 신규 후기 알림 (`sendPushToUsers(bookmarkUserIds, ...)`)
- [ ] 카공 팁 게시판 (`posts` 스키마는 존재, UI/라우트 미구현)
- [ ] 지역별 / 조건별 카페 랭킹 페이지
- [ ] 데이터 비저블 (관리자용) — 신규 가입·제보·신고 추이

### P4. 운영 자동화
- [ ] 오래된 FCM 토큰 정리 cron (last_used_at 기준)
- [ ] 자동 제보 큐 영속화 옵션 (현재 메모리)
- [ ] 어드민 일일 요약 메일 / 슬랙 (제보 N건, 신고 N건)

---

## 운영 체크리스트

### 환경 변수 (Vercel)

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 클라이언트 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 어드민 클라이언트 |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth |
| `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | NextAuth 카카오 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | NextAuth 구글 |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 네이버 지도 SDK |
| `KAKAO_REST_API_KEY` | 카카오 주소 검색 프록시 |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_IMAGES_TOKEN` | Cloudflare Images |
| `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_KEY` | FCM + Analytics |
| `NEXT_PUBLIC_BRIDGE_URL`, `NEXT_PUBLIC_BRIDGE_TOKEN` | AI 자동 제보 브릿지 (배포 환경에서도 본인 PC 의 localhost 와 통신) |
| `ADMIN_USER_IDS` | 어드민 OAuth ID 콤마 구분 |

### 정기 점검
- [ ] DB 백업 정책 (Supabase 자동 + 주기적 export)
- [ ] Cloudflare Images 잔여 용량 / 단가 모니터링
- [ ] FCM 무효 토큰 비율 (자동 정리 로직 동작 확인)
- [ ] GA4 핵심 이벤트 보고 (DebugView → 본 보고서 24~48h 지연)
