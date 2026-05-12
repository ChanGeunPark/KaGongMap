# 카공맵 (KaGongMap) — 프로젝트 컨텍스트

## 서비스 한 줄 요약

카공족(카페에서 공부/작업하는 사람)이 직접 만드는 카페 지도 커뮤니티. 콘센트·와이파이·소음 수준 등 카공 특화 정보를 지도 위에 공유한다.

## 해결하는 문제

- 카페에 콘센트가 있는지 가봐야만 안다
- 소음 수준, 장시간 체류 허용 여부를 미리 알 수 없다
- 네이버 지도·카카오맵은 일반 방문자 시점 리뷰만 있고, 카공족 시점 실용 정보가 없다

## 기술 스택

| 레이어          | 기술                                         |
| --------------- | -------------------------------------------- |
| Frontend        | Next.js 16 (App Router)                      |
| Styling         | Tailwind CSS                                 |
| 지도            | 네이버 지도 API                              |
| Auth            | NextAuth.js (Kakao + Google OAuth, JWT 세션) |
| Database        | Supabase (PostgreSQL + RLS)                  |
| 이미지 스토리지 | Cloudflare Images                            |
| 배포            | Vercel                                       |

## 폴더 구조 (실제 프로젝트 구조)

> 카페 등록·상세·후기 작성은 모두 **모달 기반**(`/cafes/*` 별도 페이지 없음). 등록은 TopNav `ReportButton` → `CafeInfoForm` 모달, 상세는 핀 클릭 → `CafeModalDetail`, 후기는 상세 모달 내부 `CafeReviewSection`.

```
kagongmap/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 루트 레이아웃 (Provider, GNB)
│   ├── page.tsx                      # 메인 지도 / [PUBLIC]
│   ├── globals.css
│   ├── manifest.ts / robots.ts / sitemap.ts
│   ├── admin/
│   │   ├── _components/              # 어드민 전용 컴포넌트
│   │   ├── _hooks/
│   │   ├── page.tsx                  # /admin [AUTH/ADMIN]
│   │   └── auto-submit/              # /admin/auto-submit — AI 자동 제보 (로컬 브릿지 연동) [AUTH/ADMIN]
│   │       ├── _components/          # AutoSubmitDashboard, KakaoSearchPanel, JobCard, ReviewModal 등
│   │       └── page.tsx
│   ├── login/page.tsx                # /login [PUBLIC]
│   ├── mypage/page.tsx               # /mypage [AUTH]
│   ├── privacy/page.tsx              # /privacy [PUBLIC]
│   └── api/                          # Route Handlers
│       ├── auth/[...nextauth]/       # NextAuth
│       ├── admin/                    # 어드민 전용 (cafes, submissions, image-submissions, edit-submissions, reviews, review-reports, me)
│       ├── cafes/
│       │   ├── [id]/                 # 카페 상세·후기·이미지/수정 제보
│       │   │   ├── reviews/
│       │   │   ├── image-submissions/
│       │   │   └── edit-submissions/
│       │   └── submissions/          # 카페 제보
│       ├── reviews/[id]/reports/     # 후기 신고
│       ├── bookmarks/                # 즐겨찾기
│       ├── likes/[cafeId]/           # 좋아요
│       ├── users/me/                 # 내 정보·내 카페·닉네임·제보 요약
│       ├── fcm-tokens/               # FCM 토큰 등록/해제
│       ├── cloudflare/image/         # 이미지 업로드 직접 URL
│       ├── kakao/address/            # 주소 검색
│       └── dev/test-push/            # [DEV] 푸시 테스트
브릿지 (Hono + claude CLI spawn)
├── components/
│   ├── auth/                         # AuthGate, AuthProvider
│   ├── badge/, button/, input/       # 공용 UI 프리미티브
│   ├── cafe/
│   │   ├── card/                     # CafeCard
│   │   ├── detail/                   # CafeModalDetail, CafeInfoSidebar, CafeReviewSection, CafeEditModal
│   │   └── form/CafeInfoForm/        # 카페 등록·수정 폼 (HoursInput, TagSelector 등)
│   ├── holder/                       # 페이지/섹션 holder 컴포넌트
│   ├── layout/                       # MainApp 보조 (TopNav, FilterBar, FilterDrawer, BottomSheet, CafeSidebar)
│   │   └── topnav/
│   ├── map/                          # MapCanvas, CafeMarkerClusterer, markerIcons
│   ├── modal/                        # BottomSheetModal 등 공용 모달
│   ├── notifications/                # FCM 권한 요청·DevTestPushButton
│   ├── pwa/                          # 설치 프롬프트 등
│   ├── tweaks/                       # 디자인 토글 패널 (DEV)
│   └── ui/                           # KGIcon, ScoreDisc 등 공통 UI
├── hooks/                            # Custom React Hooks
│   └── storage/                      # localStorage 추상화
├── lib/
│   ├── api/                          # 도메인별 fetch + React Query
│   ├── firebase/                     # admin, fcm, sendPush, analytics
│   ├── supabase/                     # 서버/브라우저 클라이언트
│   ├── scoring.ts                    # 차원별 가중치·점수·등급
│   ├── data.ts                       # FILTER_TAG_MAP, TAG_LABELS, KG_FILTERS
│   ├── auth.ts                       # NextAuth 옵션
│   ├── adminAuth.ts                  # 어드민 가드
│   └── (utils, enum, siteUrl, naverMapAppLink, pinHash, randomNickname)
├── stores/                           # Zustand (cafeSelectionStore, modalStore, userStore)
├── types/                            # TypeScript 타입 정의 (db, api, cafe, naver, kakao)
└── docs/                             # 프로젝트 문서
```

## 인증 원칙: "보는 건 자유, 참여는 로그인"

- **비로그인 가능**: 지도 탐색, 카페 상세·태그 열람, 후기 읽기, 필터 검색, 카페 제보, 후기 작성, 카페 정보 수정 제안 **사진 제보**, **좋아요 (localStorage 보관 → 로그인 시 DB 머지)**
- **로그인 필요**: 즐겨찾기, 마이페이지
- 카페 제보·사진 제보는 비로그인도 가능하지만, 로그인 시 `user_id`가 함께 기록됨

## MVP 범위 (우선 구현)

1. 메인 지도 + 카페 핀 표시
2. 카공 필터 검색 (콘센트·와이파이·소음·24시간·시간제한없음)
3. 카페 등록 (3단계 폼)
4. 카페 상세 페이지
5. 후기 (텍스트, 별점 없음)
6. **좋아요 (비로그인 가능, 카운트 즉시 반영, 로그인 시 DB 동기)**
7. 즐겨찾기
8. 마이페이지
9. Kakao + Google 소셜 로그인 (NextAuth.js)
10. **사진 제보 (기존 카페에 추가 이미지)**
11. **어드민 콘솔 (`/admin`) — 카페/사진 제보 승인·삭제**
12. **어드민 AI 자동 제보 (`/admin/auto-submit`) — 본인 PC Claude CLI 로 카페 정보 자동 조사 (`docs/AUTO_SUBMIT.md`)**

## 적합도 산출 방식

별점/avg_rating 미사용. 카페별 보유 태그에 **차원별 가중치**를 합산해 점수화한다. 가중치와 임계값은 `lib/scoring.ts`에 정의 (클라이언트 계산).

- 차원: `kagong | date | talk` (`ScoreDimension` 타입)
- 함수: `getScore(tags, dim)`, `getScoreTier(score, dim)` (`high | mid | low`)
- 가중치 조정은 `lib/scoring.ts`의 `WEIGHTS` 객체만 수정하면 모든 화면 반영

카공 차원 임계값 (현재):

- **점수 10+**: 우수 (녹색 핀)
- **점수 5+**: 양호 (앰버 핀)
- **점수 4 이하**: 정보 부족 (레드 핀)

정렬 기본값: `like_count DESC` → `getScore(tags, "kagong") DESC` (클라이언트 정렬)

> 향후 어드민에서 가중치를 동적으로 조정해야 할 때 `tag_scores` 테이블로 옮기되, 같은 자료구조를 DB seed로 이전하면 됨.

## V2 예정 기능 (MVP 이후)

- 카공 팁 게시판
- 지역별/조건별 카페 랭킹

## 핵심 카공 태그 (enum)

```
콘센트_있음 | 와이파이_있음 | 조용함 | 24시간 | 시간제한없음 | 노트북_허용
| 혼잡도_낮음 | 늦은영업 | 가성비_좋음 | 자연채광 | 야외테라스
| 반려동물_가능 | 주차_가능
```

## 코딩 컨벤션

- TypeScript strict 모드 사용
- 컴포넌트: PascalCase, 훅: camelCase (use 접두사)
- Supabase 클라이언트는 `lib/supabase.ts`에서 싱글톤으로 관리
- 서버 컴포넌트 우선, 클라이언트 컴포넌트는 `'use client'` 명시
- Tailwind로만 스타일링 (별도 CSS 파일 지양)
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

## 관련 문서

- `docs/PRD.md` — 기능 상세 명세
- `docs/ARCHITECTURE.md` — 페이지별 컴포넌트 트리
- `docs/DB_SCHEMA.md` — Supabase 테이블 스키마 & SQL
- `docs/MILESTONES.md` — 주차별 개발 목표
- `docs/PUSH_NOTIFICATIONS.md` — FCM 푸시 알림 설정 & 발송 헬퍼
- `docs/WEBVIEW_BRIDGE.md` — Flutter WebView ↔ Web 메시지 브릿지 (`lib/native/`)
- `docs/ANALYTICS.md` — Firebase Analytics 이벤트 목록 & GA4 콘솔 설정
- `docs/AUTO_SUBMIT.md` — 어드민 AI 자동 제보 (`/admin/auto-submit` + `tools/auto-submit-bridge`)
