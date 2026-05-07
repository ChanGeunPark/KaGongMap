# 카공맵 — 컴포넌트 아키텍처

> Next.js 16 App Router + React 19 + Tailwind 4 기준. `[PUBLIC]` = 비로그인 가능, `[AUTH]` = 로그인 필요, `[ADMIN]` = 어드민(`ADMIN_USER_IDS` 화이트리스트).
>
> **모달 우선 라우팅**: 카페 상세·등록·수정·후기 작성은 모두 모달이며 별도 `/cafes/*` 페이지가 없다. 모든 카페 인터랙션은 메인 지도(`app/page.tsx` → `MainApp`) 위에서 일어난다.

---

## 라우트 (페이지)

| 경로                 | 접근   | 파일                                                | 설명                                           |
| -------------------- | ------ | --------------------------------------------------- | ---------------------------------------------- |
| `/`                  | PUBLIC | `app/page.tsx` → `components/MainApp.tsx`           | 메인 지도 + 사이드바 + 필터 + 모달 허브        |
| `/login`             | PUBLIC | `app/login/page.tsx`                                | NextAuth 카카오/구글 로그인                    |
| `/mypage`            | AUTH   | `app/mypage/page.tsx`                               | 프로필·즐겨찾기·내 카페·내 후기·푸시/위치 권한 |
| `/privacy`           | PUBLIC | `app/privacy/page.tsx`                              | 개인정보처리방침                               |
| `/admin`             | ADMIN  | `app/admin/page.tsx` → `_components/AdminDashboard` | 카페·사진·정보수정·후기신고 검수               |
| `/admin/auto-submit` | ADMIN  | `app/admin/auto-submit/page.tsx`                    | 로컬 브릿지 + Claude CLI 자동 제보             |

---

## 폴더 구조 (실제)

```
app/
├── layout.tsx                        # RootLayout: SW · Analytics · AuthProvider · QueryProvider · 토스트
├── page.tsx                          # 네이버 지도 SDK 로드 + <MainApp />
├── globals.css
├── manifest.ts / robots.ts / sitemap.ts
├── login/page.tsx                    # [PUBLIC]
├── mypage/page.tsx                   # [AUTH]
├── privacy/page.tsx                  # [PUBLIC]
├── admin/                            # [ADMIN]
│   ├── page.tsx                      # 서버 가드 → AdminDashboard
│   ├── _components/
│   │   ├── AdminDashboard.tsx        # 4개 탭 컨테이너 (pending/registered/images/edits/reports)
│   │   ├── SubmissionCard.tsx        # 카페 제보
│   │   ├── RegisteredCafeCard.tsx    # 등록된 카페 (삭제)
│   │   ├── ImageSubmissionCard.tsx   # 사진 제보
│   │   ├── EditSubmissionCard.tsx    # 정보 수정 제안
│   │   ├── ReviewReportsTab.tsx      # 후기 신고
│   │   └── constants.ts
│   ├── _hooks/
│   │   └── useAdminMutations.ts      # 승인/거절/삭제 mutation 일괄
│   └── auto-submit/
│       ├── page.tsx                  # 서버 가드 → AutoSubmitDashboard
│       └── _components/
│           ├── AutoSubmitDashboard.tsx
│           ├── BridgeStatusBadge.tsx
│           ├── KakaoSearchPanel.tsx
│           ├── JobCard.tsx
│           └── ReviewModal.tsx
└── api/                              # Route Handlers (전부 NextAuth + service-role)
    ├── auth/[...nextauth]/route.ts
    ├── cafes/
    │   ├── submissions/route.ts                # POST 카페 제보
    │   └── [id]/
    │       ├── reviews/route.ts                # GET/POST 후기
    │       ├── image-submissions/route.ts      # POST 사진 제보
    │       └── edit-submissions/route.ts       # POST 정보 수정 제안
    ├── reviews/[id]/route.ts                   # DELETE 후기
    ├── reviews/[id]/reports/route.ts           # POST 후기 신고
    ├── likes/route.ts                          # POST 익명 → 로그인 머지
    ├── likes/[cafeId]/route.ts                 # POST/DELETE 좋아요
    ├── bookmarks/route.ts                      # GET 내 즐겨찾기 IDs
    ├── bookmarks/cafes/route.ts                # GET 내 즐겨찾기 카페 카드
    ├── bookmarks/[cafeId]/route.ts             # POST/DELETE
    ├── users/route.ts                          # POST 첫 로그인 시 users upsert
    ├── users/me/cafes/route.ts                 # GET 내가 등록한 카페
    ├── users/me/submissions-summary/route.ts   # GET 내 제보 요약 카운트
    ├── users/me/nickname/route.ts              # PATCH 닉네임
    ├── fcm-tokens/route.ts                     # POST/DELETE FCM 토큰
    ├── cloudflare/image/route.ts               # POST direct-upload URL
    ├── kakao/address/route.ts                  # GET 주소 검색 프록시
    ├── dev/test-push/route.ts                  # [DEV] 푸시 테스트
    └── admin/
        ├── me/route.ts                         # GET 어드민 여부
        ├── submissions/[id]/route.ts           # PATCH/DELETE 카페 제보
        ├── submissions/[id]/approve/route.ts   # POST 승인
        ├── auto-submissions/route.ts           # POST 자동 제보 → cafe_submissions
        ├── image-submissions/[id]/route.ts
        ├── image-submissions/[id]/approve/route.ts
        ├── edit-submissions/[id]/route.ts
        ├── edit-submissions/[id]/approve/route.ts
        ├── cafes/[id]/route.ts                 # DELETE 등록 카페
        ├── reviews/[id]/route.ts               # DELETE 후기
        ├── review-reports/route.ts             # GET 그룹된 신고
        └── review-reports/[id]/dismiss/route.ts

components/
├── MainApp.tsx                       # 메인 지도 클라이언트 컨테이너 (Tier 1/2 데이터·필터·모달 통합)
├── auth/AuthGate.tsx                 # 비로그인 유도 (로그인 페이지 라우팅)
├── badge/                            # Badge + fundamental/{Primary,Secondary,Outlined,Tint,Black}Badge
├── button/                           # KaGongButton, BookmarkButton, LikeButton + fundamental/*
├── input/                            # TextInput, AreaInput, BasicInput, Checkbox, SwitchToggle, FieldError
├── holder/                           # EmptyHolder, SearchHolder, DropdownHolder
├── ui/                               # KGIcon, ScoreDisc(Dark), LevelBar, MonoLabel, StarRating, Chip, CrowdBar
├── cafe/
│   ├── card/CafeCard.tsx
│   ├── form/
│   │   ├── AddressSearch.tsx         # 카카오 주소 검색
│   │   ├── ImageUploader.tsx         # Cloudflare direct upload
│   │   ├── StepIndicator.tsx
│   │   ├── TagSelector.tsx
│   │   └── CafeInfoForm/
│   │       ├── CafeInfoForm.tsx      # 등록 + 수정 제안 양쪽 모드
│   │       ├── HoursInput.tsx
│   │       ├── InfoFormStep1.tsx     # 기본 정보
│   │       ├── InfoFormStep2.tsx     # 카공 태그
│   │       └── InfoFormStep3.tsx     # 사진
│   └── detail/
│       ├── CafeModalDetail.tsx       # 핀 클릭 시 메인 상세 모달
│       ├── CafeInfoSidebar.tsx
│       ├── CafeEnvironmentSection.tsx
│       ├── CafeReviewSection.tsx     # 후기 작성 폼 + 목록
│       ├── CafeReviews.tsx
│       ├── CafeEditModal.tsx         # 정보 수정 제안 (CafeInfoForm 재사용)
│       ├── ImageSubmitModal.tsx      # 사진 제보
│       ├── ReviewReportModal.tsx     # 후기 신고
│       ├── HeroGallery.tsx
│       ├── CafeHeroGlyph.tsx
│       ├── CrowdChart.tsx
│       └── ProsCons.tsx
├── layout/
│   ├── topnav/                       # Logo, SearchBar, MenuItem, AdminButton, AuthArea, ReportButton, TopNav
│   ├── BottomNavigation.tsx
│   ├── BottomSheet.tsx               # 모바일용 카페 리스트 시트
│   ├── CafeSidebar.tsx               # 데스크탑 좌측 카페 리스트
│   ├── FilterBar.tsx
│   ├── FilterDrawer.tsx
│   ├── FirebaseAnalytics.tsx         # 부팅 시 SDK 초기화
│   ├── RouteChangeTracker.tsx        # SPA pageview
│   └── AnalyticsIdentity.tsx         # userId / auth_provider
├── map/
│   ├── MapCanvas.tsx                 # 네이버 지도 인스턴스 + bounds·zoom 이벤트
│   ├── MapControls.tsx
│   ├── CafePin.tsx                   # HTML 오버레이 핀
│   ├── CafeMarkerClusterer.ts        # 줌 레벨별 클러스터링
│   ├── markerIcons.ts
│   └── mapConfig.ts
├── modal/
│   ├── BottomSheetModal.tsx          # 데스크탑은 사이드 모달, 모바일은 바텀시트
│   ├── KagongMapModal.tsx            # 일반 모달 컨테이너
│   ├── ImageDetailModal.tsx
│   ├── BookmarkButtonSheetModal.tsx
│   ├── AlertModal.tsx
│   └── GlobalModal.tsx               # zustand modalStore 기반 전역 모달
├── notifications/
│   ├── PushNotificationToggle.tsx
│   ├── ForegroundFcmListener.tsx     # 앱이 켜져 있을 때 onMessage → 토스트
│   ├── LocationPermissionStatus.tsx
│   └── DevTestPushButton.tsx
├── pwa/
│   ├── PwaInstallBanner.tsx
│   └── ServiceWorkerRegister.tsx
└── tweaks/                           # [DEV] 디자인 토글 패널 (TweaksPanel)

hooks/
├── useFilteredCafes.ts               # bounds + 필터 + 정렬
├── useEditModeBridge.ts              # 편집 모드 ↔ tweak 동기 (DEV)
├── useDragTracker.ts / useDragScroll.ts
├── useDeviceInfo.ts / useWindowSize.ts
├── useLikes.ts                       # 좋아요 (익명 localStorage / 로그인 server)
├── useBookmarks.ts                   # 즐겨찾기 (로그인 전용)
├── useMapGeolocation.ts              # 브라우저 위치 + 지도 패닝
├── useBootstrapDbUser.ts             # 첫 로그인 시 /api/users upsert
└── storage/
    ├── LocalStorage.ts               # SSR 안전 localStorage 래퍼
    └── likedStorage.ts               # 익명 좋아요 ID 저장

lib/
├── api/                              # 모든 도메인 fetch + React Query 훅이 여기 모임
│   ├── Interface.ts
│   ├── cafes.ts                      # useCafeMarkers / useCafeDetail / fetchMyRegisteredCafes
│   ├── reviews.ts                    # useReviews / useCreateReview / useDeleteReview
│   ├── likes.ts                      # likeCafe / unlikeCafe / fetchMyLikedCafeIds
│   ├── bookmarks.ts
│   ├── submissions.ts                # 카페 제보 / 어드민 승인·거절
│   ├── imageSubmissions.ts
│   ├── editSubmissions.ts
│   ├── reviewReports.ts
│   ├── admin.ts
│   ├── user.ts
│   ├── cloudflare.ts                 # direct upload helper
│   └── autoSubmit.ts                 # 로컬 브릿지 HTTP/SSE 클라이언트
├── supabase/
│   ├── client.ts                     # createBrowserClient
│   └── server.ts                     # createServerClient + createAdminClient(service_role)
├── firebase/
│   ├── firebase.ts
│   ├── analytics.ts                  # track / setAnalyticsUser
│   ├── fcm.ts                        # 토큰 발급/등록/해제
│   ├── admin.ts                      # Admin SDK 싱글톤 (server-only)
│   └── sendPush.ts                   # 발송 헬퍼 (server-only)
├── auth.ts                           # NextAuth 옵션 (Kakao + Google + provider/oauthId)
├── adminAuth.ts                      # ADMIN_USER_IDS 가드 헬퍼
├── scoring.ts                        # WEIGHTS·TIER_THRESHOLDS·getScore·getScoreTier
├── data.ts                           # FILTER_TAG_MAP / TAG_LABELS / KG_FILTERS
├── utils.ts                          # cls, cn 등
├── enum.ts
├── siteUrl.ts
├── naverMapAppLink.ts                # 모바일에서 네이버 지도 앱 딥링크
├── pinHash.ts                        # 비로그인 후기 PIN scrypt
└── randomNickname.ts                 # 자동 닉네임

providers/
├── AuthProvider.tsx                  # next-auth/react SessionProvider
└── QueryProvider.tsx                 # React Query QueryClientProvider

stores/
├── cafeSelectionStore.ts             # selectedId / previewId / open·close
├── modalStore.ts                     # 전역 알림·확인 모달
└── userStore.ts                      # 클라이언트 캐시된 user 메타

types/
├── db.ts                             # CafeMarker / CafeWithDetail / DbReview / *Submission
├── cafe.ts                           # FilterItem / SortBy 등 UI 타입
├── api.ts
├── autoSubmit.ts                     # AutoSubmitJob / Event (브릿지와 동일 스키마)
├── kakao.ts                          # 카카오 주소 검색 응답
├── naver.d.ts / naverMap.ts          # 네이버 SDK 전역 타입

public/
├── firebase-messaging-sw.js          # FCM 백그라운드 SW
├── icons/, images/, manifest 부속    # PWA 자산
```

### 외부 도구

```
tools/auto-submit-bridge/             # 본인 PC 에서 도는 Hono + Claude CLI spawn 브릿지.
                                      # 이 저장소에는 들어있지 않다 (https://github.com/ChanGeunPark/auto-submit-bridge).
                                      # 어드민이 `npm run bridge` 로 띄우면 localhost:7332 에서 응답.
                                      # 자세한 셋업·스키마는 docs/AUTO_SUBMIT.md 참고.
```

---

## 페이지별 컴포넌트 트리

### `RootLayout` — `app/layout.tsx`

```
<html lang="ko">
  <body>
    <ServiceWorkerRegister />          # /firebase-messaging-sw.js 등록
    <FirebaseAnalytics />              # Analytics SDK 부팅
    <Suspense><RouteChangeTracker /></Suspense>   # SPA pageview
    <ForegroundFcmListener />          # 앱 켜진 동안 푸시 → 토스트
    <AuthProvider>                     # NextAuth SessionProvider
      <AnalyticsIdentity />            # userId / auth_provider 동기화
      <QueryProvider>                  # React Query
        {children}
        <BottomNavigation />           # 모바일 하단 탭
        <GlobalModal />                # zustand 기반 전역 모달
      </QueryProvider>
    </AuthProvider>
    <ToastContainer />                 # react-toastify
  </body>
</html>
```

---

### `/` 메인 지도 `[PUBLIC]` — `MainApp.tsx`

```
<MainApp>
  <TopNav>
    <Logo />
    <SearchBar />                  # 카페 이름 검색 → 핀 선택
    <ReportButton />               # 비로그인도 OK — CafeInfoForm 모달 오픈
    <AdminButton />                # 어드민일 때만
    <AuthArea />                   # 로그인 / 아바타 / 마이페이지
  </TopNav>

  <FilterBar>                      # 빠른 필터 칩 + 정렬 드롭다운 + 필터 모두 보기
  <CafeSidebar />                  # 데스크탑 좌측: 보이는 카페 카드 리스트
  <MapCanvas>
    네이버 지도 SDK 인스턴스 + bounds 변화시 setBounds
    <CafePin> + <CafeMarkerClusterer>      # 점수 기반 색상 (good/amber/low)
    <MapControls />                # 줌 / 내 위치
  </MapCanvas>

  <BottomSheetModal>               # previewId 있을 때 (모바일=바텀시트, 데스크탑=사이드)
    <CafeModalDetail>              # Tier 1 데이터 즉시 표시 + Tier 2 로드 후 보강
      <HeroGallery>
      <CafeInfoSidebar />          # 주소/시간/태그/점수
      <ProsCons />
      <CafeEnvironmentSection />
      <CrowdChart />
      <CafeReviewSection>          # 후기 폼 + 목록
        <ReviewReportModal />      # 신고
      </CafeReviewSection>
      <BookmarkButton /> <LikeButton />
      [정보 수정 제안] → <CafeEditModal>  (CafeInfoForm 재사용, 모드=edit)
      [📷 사진 제보] → <ImageSubmitModal>  (비로그인 OK)
    </CafeModalDetail>
  </BottomSheetModal>

  <BottomSheet />                  # 모바일에서 visibleCafes 리스트 (tweak: layoutVariant=sheet)
  <FilterDrawer />                 # 모든 필터 보기 (모바일 전체화면)
  {tweaksOn && <TweaksPanel />}    # [DEV] 디자인 토글
</MainApp>
```

**핵심 상태 (MainApp 로컬 state + 스토어)**

- `activeFilters: Set<filterId>` — 다중 AND
- `sortBy: "score" | "likes" | "distance" | ...`
- `bounds: { ne, sw }` — 지도 이동 시 갱신
- `useCafeSelectionStore`: `previewId` (모달 표시), `selectedId` (Tier 2 트리거)
- 카페 등록은 `<ReportButton>` → `<CafeInfoForm>` 모달 (별도 페이지 아님)

---

### `/login` `[PUBLIC]` — `app/login/page.tsx`

```
<LoginPage>
  <Logo />
  <SocialLoginBtn provider="kakao" />   # signIn("kakao") + track("login_attempt")
  <SocialLoginBtn provider="google" />
  <Note />                              # "로그인 없이도 탐색 가능"
</LoginPage>
```

---

### `/mypage` `[AUTH]` — `app/mypage/page.tsx`

```
<MyPage>
  <UserProfile />                       # 아바타·닉네임(인라인 수정)·가입일
  <Tabs>
    [즐겨찾기]   GET /api/bookmarks/cafes      → CafeCard[]
    [내 카페]    GET /api/users/me/cafes       → 내가 등록한 카페
    [내 후기]    클라이언트 join (요약 endpoint)
  </Tabs>
  <PushNotificationToggle />
  <LocationPermissionStatus />
  [로그아웃]
</MyPage>
```

---

### `/admin` `[ADMIN]` — `app/admin/page.tsx`

서버 컴포넌트가 NextAuth 세션을 검증하고 `ADMIN_USER_IDS` (콤마 구분)에 포함된 `session.user.id` 만 통과시킨다. `/api/admin/*` 라우트도 동일 가드.

```
<AdminDashboard>
  <Header>
    헤더 우측 "✨ AI 자동 제보" 링크 → /admin/auto-submit
  </Header>
  <StatsCards>                          # 5종 카운트
  <Tabs>
    [pending]    cafe_submissions where status='pending'
                 <SubmissionCard>
                   ✓ 승인 → POST /api/admin/submissions/[id]/approve
                              (UPDATE status='approved' → 트리거가 cafes + cafe_tags 생성)
                   ✕ 거절 → DELETE /api/admin/submissions/[id]
                              (status='rejected', 행 보존)
    [registered] cafe_detail 뷰 직접 조회
                 <RegisteredCafeCard>
                   🗑 삭제 → DELETE /api/admin/cafes/[id]
    [images]     cafe_image_submissions
                 <ImageSubmissionCard>
                   ✓ 승인 → POST /api/admin/image-submissions/[id]/approve
                              (트리거가 cafes.images에 append)
                   ✕ 거절 → DELETE /api/admin/image-submissions/[id]
    [edits]      cafe_edit_submissions
                 <EditSubmissionCard>
                   ✓ 승인 → POST /api/admin/edit-submissions/[id]/approve
                   ✕ 거절 → DELETE /api/admin/edit-submissions/[id]
    [reports]    review_reports (pending)
                 <ReviewReportsTab>
                   - 후기 단위 그룹 (count + reasons)
                   - 전체 무시 → POST /api/admin/review-reports/[id]/dismiss
                   - 후기 삭제 → DELETE /api/admin/reviews/[id]
  </Tabs>
</AdminDashboard>
```

mutation 은 모두 `_hooks/useAdminMutations.ts` 에 모여 있고, 푸시 알림은 사용자 측 INSERT route 에서 fire-and-forget 으로 어드민에게 전송된다 (`docs/PUSH_NOTIFICATIONS.md`).

---

### `/admin/auto-submit` `[ADMIN]`

`docs/AUTO_SUBMIT.md` 참고. 본인 PC 의 `tools/auto-submit-bridge` 가 떠 있어야 동작.

```
<AutoSubmitDashboard>
  <BridgeStatusBadge />                 # SSE 연결 상태
  <KakaoSearchPanel onPick={enqueueJob}>
    카카오 검색 → 단일 선택 → POST localhost:7332/jobs (Bearer)
  <JobQueue>                            # /events SSE 스트림
    <JobCard status="queued|researching|ready|failed|submitted">
      [검토하기] → <ReviewModal>        # status='ready' 일 때
        LLM 결과 + 신뢰도 배지 + 출처 URL
        → POST /api/admin/auto-submissions
        → cafe_submissions INSERT (status='pending', user_id=어드민)
      [재시도] [삭제]
  </JobQueue>
</AutoSubmitDashboard>
```

---

## 데이터 페칭 아키텍처

```
Tier 1 — 지도 초기 로딩 (전체 마커)
  useCafeMarkers() → supabase.from("cafe_markers")
  반환: CafeMarker[] (id, name, address, lat, lng, like_count, min_order_amount, tags)
  소비처: <MapCanvas> 핀, <CafeSidebar>, <BottomSheet>, useFilteredCafes

Tier 2 — 핀 클릭 시 온디맨드
  useCafeDetail(selectedId) → supabase.from("cafe_detail").eq("id").single()
  반환: CafeWithDetail (전체 컬럼 + review_count + tags)
  enabled: !!selectedId, staleTime: 10분
  소비처: <CafeModalDetail>

후기      useReviews(cafeId)            → GET /api/cafes/[id]/reviews
좋아요   useLikes()                     → GET /api/likes (로그인 시) + localStorage
즐겨찾기 useBookmarks()                  → GET /api/bookmarks (로그인 전용)
내 카페  fetchMyRegisteredCafes()       → GET /api/users/me/cafes
어드민   useAdminMutations / lib/api/admin.ts
```

낙관적 업데이트는 `useLikes` 가 `cafeKeys.markers()` / `cafeKeys.detail(id)` 캐시의 `like_count` 만 부분 패치하여 전체 refetch 를 회피한다.

---

## 인증 / 어드민 가드

- `lib/auth.ts` — NextAuth Kakao + Google. JWT 콜백에서 `account.providerAccountId` 를 `token.oauthId` 로 보관하고, session 콜백에서 `session.user.id`(=oauthId) 와 `session.user.provider` 를 노출.
- `lib/adminAuth.ts` — `getAdminSessionStatus()`, `requireAdminSession()` 헬퍼. 환경변수 `ADMIN_USER_IDS`(콤마 구분 OAuth ID) 와 비교.
- `users` 테이블의 `user_id` 컬럼이 NextAuth `oauthId`(TEXT). UUID `users.id` 는 Supabase 내부 PK.
- `useBootstrapDbUser` 훅이 첫 로그인 시 `/api/users` 로 users row 를 upsert.

---

## 카공 점수 / 필터

- `lib/scoring.ts` — 차원(`kagong | date | talk`) 별 가중치. 카공 임계값: 10+ 우수(녹색), 5+ 양호(앰버), 4 이하 정보부족(레드).
- `lib/data.ts` — `KG_FILTERS` 12개 (콘센트·와이파이·조용함·24시간·노트북·혼잡도·늦은영업·가성비·자연채광·테라스·반려동물·주차). FilterId 와 `CafeTag` 는 `FILTER_TAG_MAP` 으로 1:1.
- `useFilteredCafes(allCafes, activeFilters, sortBy, bounds)` 가 클라이언트에서 AND 매칭 + bounds 필터 + 정렬을 처리.

---

## 모달 패턴

- 메인 카페 상세는 `<BottomSheetModal>` (반응형: 모바일=바텀시트, 데스크탑=우측 사이드 패널). `previewMarker` 가 있으면 표시.
- 사진 제보·정보 수정·후기 신고 등 상세 내부 액션은 `<KagongMapModal>` 위에 폼 컴포넌트.
- 전역 알림/확인은 `stores/modalStore.ts` 의 `<GlobalModal>` 이 `app/layout.tsx` 에 마운트되어 처리.
- 카페 등록은 `TopNav` 의 `<ReportButton>` → `<CafeInfoForm>` 모달 (별도 라우트 없음).

---

## 외부 통합 요약

| 통합                       | 파일                                                         | 비고                                          |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| 네이버 지도 SDK            | `app/page.tsx` `<Script>` 태그 + `components/map/*`          | `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`             |
| Supabase                   | `lib/supabase/{client,server}.ts`                            | 서비스롤 클라이언트는 서버 전용               |
| NextAuth                   | `lib/auth.ts`, `app/api/auth/[...nextauth]`                  | Kakao + Google                                |
| Cloudflare Images          | `lib/api/cloudflare.ts`, `app/api/cloudflare/image/route.ts` | direct creator URL                            |
| 카카오 주소 검색           | `app/api/kakao/address/route.ts`                             | 키 노출 방지용 프록시                         |
| Firebase (Analytics + FCM) | `lib/firebase/*`, `public/firebase-messaging-sw.js`          | docs/PUSH_NOTIFICATIONS.md, docs/ANALYTICS.md |
| 자동 제보 브릿지           | `lib/api/autoSubmit.ts` ↔ `tools/auto-submit-bridge` (외부)  | docs/AUTO_SUBMIT.md                           |

---

## 관련 문서

- `docs/PRD.md` — 기능 명세
- `docs/DB_SCHEMA.md` — 테이블 / 트리거 / RLS / 뷰
- `docs/MILESTONES.md` — 진행 현황
- `docs/PUSH_NOTIFICATIONS.md`
- `docs/ANALYTICS.md`
- `docs/AUTO_SUBMIT.md`
