# 카공맵 — Firebase Analytics (GA4)

> Firebase Analytics(GA4) 기반 사용자 행동 추적. 카공맵의 핵심 가설(어떤 필터가 먹히나? 어디서 이탈하나? 어떤 카페가 인기인가?)을 검증하기 위해 구축됨. 비용은 사실상 무료(GA4 무료 티어).

---

## 개요

- **수집 SDK**: `firebase/analytics` (Web SDK)
- **측정 ID**: `G-72RS70211S` (Firebase 프로젝트 `kagongmap`에 자동 연동)
- **수집 시점**: 클라이언트 사이드 (`logEvent`)
- **자동 수집**: `first_visit`, `session_start`, `user_engagement` 등은 SDK가 자동 처리
- **커스텀 수집**: 카공맵 도메인 이벤트 9종 + SPA pageview 보강

---

## 아키텍처

```
app/layout.tsx
├── <FirebaseAnalytics />        — 첫 방문 시 SDK 초기화 (legacy, 호환용)
├── <Suspense><RouteChangeTracker /></Suspense>
│       └── usePathname() 변할 때마다 logEvent('page_view')
└── <AuthProvider>
    └── <AnalyticsIdentity />    — 세션 변할 때 setUserId + auth_provider
        └── 나머지 children
```

모든 이벤트는 `lib/firebase/analytics.ts`의 `track()` 단일 진입점을 통과합니다.

### 핵심 래퍼: `lib/firebase/analytics.ts`


| 함수                                      | 용도                                                                |
| --------------------------------------- | ----------------------------------------------------------------- |
| `track(name, params?)`                  | 이벤트 전송. SSR 가드, `isSupported()` 체크, 파라미터 sanitize 후 `logEvent` 호출 |
| `setAnalyticsUser(userId, properties?)` | `setUserId` + `setUserProperties`. 로그인 상태 변경 시 호출                 |
| `initAnalytics()`                       | 명시적 초기화 (`<FirebaseAnalytics />`에서만 사용)                           |


**SSR 안전성**: `typeof window === 'undefined'` 가드 + `firebase/analytics` 동적 import (서버 번들에 포함되지 않음).

**파라미터 sanitize**: GA4는 객체/null을 허용 안 하므로 자동 변환:

- `Array` → comma-joined string
- `object` → `JSON.stringify`
- `null/undefined` → 키 자체 제거
- `string | number | boolean` → 그대로

---

## 추적 이벤트 목록

### 1. 페이지 / 세션


| 이벤트         | 위치                               | 파라미터                                       | 목적                                       |
| ----------- | -------------------------------- | ------------------------------------------ | ---------------------------------------- |
| `page_view` | `RouteChangeTracker` (모든 라우트 전환) | `page_path`, `page_location`, `page_title` | App Router SPA 네비게이션 보강. 자동 수집은 첫 진입만 잡음 |


### 2. 지도 / 탐색


| 이벤트                  | 위치                                            | 파라미터                                                                | 목적                |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------- | ----------------- |
| `cafe_marker_click`  | `MainApp` `handleMarkerClick`                 | `cafe_id`, `cafe_name`, `tag_count`                                 | 어떤 카페 핀이 자주 눌리나   |
| `cafe_search_select` | `MainApp` `handleSearchSelect` (TopNav 검색 결과) | `cafe_id`, `cafe_name`                                              | 검색 → 클릭 전환        |
| `filter_apply`       | `MainApp` `toggleFilter`                      | `filter_id`, `action`(add/remove), `active_filters`, `active_count` | 어떤 카공 태그 필터가 인기인가 |


### 3. 카페 상세 / 인터랙션


| 이벤트               | 위치                                  | 파라미터                                              | 목적                     |
| ----------------- | ----------------------------------- | ------------------------------------------------- | ---------------------- |
| `cafe_view`       | `CafeModalDetail` (모달 진입 useEffect) | `cafe_id`, `cafe_name`, `tag_count`, `like_count` | 인기 카페 랭킹, 리스팅 → 상세 전환율 |
| `like_toggle`     | `LikeButton` onClick                | `cafe_id`, `action`(add/remove), `is_logged_in`   | 비로그인 vs 로그인 좋아요 비율     |
| `favorite_toggle` | `BookmarkButton` onClick            | `cafe_id`, `action`, `is_logged_in`               | 즐겨찾기 액션 (로그인 필수)       |


### 4. 제보 / 작성 (← KPI)


| 이벤트                    | 위치                                       | 파라미터                                                                       | 목적                  |
| ---------------------- | ---------------------------------------- | -------------------------------------------------------------------------- | ------------------- |
| `cafe_submit_complete` | `CafeInfoForm` onSubmit (create)         | `tag_count`, `image_count`, `has_description`, `has_hours`, `is_logged_in` | 카페 등록 완료. 가장 비싼 액션  |
| `edit_suggest_submit`  | `CafeInfoForm` onSubmit (edit)           | `cafe_id`, `tag_count`, `is_logged_in`                                     | 정보 수정 제안 제출         |
| `photo_submit`         | `ImageSubmitModal` onSuccess             | `cafe_id`, `image_count`, `has_caption`, `is_logged_in`                    | 사진 제보               |
| `review_submit`        | `CafeReviewSection` ReviewForm onSuccess | `cafe_id`, `content_length`, `is_logged_in`                                | 후기 작성 (로그인/비로그인 분기) |


### 5. 인증 / 권한


| 이벤트                       | 위치                                    | 파라미터                                                    | 목적                   |
| ------------------------- | ------------------------------------- | ------------------------------------------------------- | -------------------- |
| `login_attempt`           | `LoginPage` 카카오/구글 버튼 onClick         | `provider`(kakao/google)                                | 어떤 OAuth가 더 잘 눌리나    |
| `notification_permission` | `PushNotificationToggle` handleEnable | `result`(granted/denied/default), `registered`(boolean) | 푸시 권한 허용률, 토큰 등록 성공률 |


---

## User Properties

`AnalyticsIdentity` 컴포넌트가 세션 변화를 감지해서 자동 갱신:


| 속성                | 값                                              | 갱신 시점                                                                                                                     |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `userId` (GA4 표준) | `session.user.id` 또는 `null`                    | 로그인/로그아웃                                                                                                                  |
| `auth_provider`   | `kakao` / `google` / `authenticated` / `guest` | 세션 상태 변경 시. `lib/auth.ts` 의 session 콜백이 `session.user.provider` 를 노출하므로 정확한 분기. provider 가 없는 예외 케이스에는 `authenticated` 폴백 |


---

## Firebase / GA4 콘솔 설정 체크리스트

### 자동으로 되는 것 (할 일 없음)

- 커스텀 이벤트 이름 등록 → 첫 발송 후 24~48h 내 자동
- Firebase 프로젝트 ↔ GA4 속성 연결 → `measurementId` 박혀 있어 자동
- 자동 수집 이벤트 (`first_visit`, `session_start`, `scroll` 등)

### 수동으로 해야 하는 것

#### (1) 데이터 보관 14개월 — 1회성, 필수

GA4 콘솔 → **관리 → 데이터 설정 → 데이터 보관 → 14개월** → 저장

> 기본 2개월이면 사용자/세션 단위 탐색 분석이 너무 빨리 사라짐. 무료.

#### (2) 주요 이벤트(Key Events) 토글 — 이벤트 첫 발생 후

GA4 콘솔 → **관리 → 이벤트** → 목록에서 별표(★) 클릭:

- `cafe_submit_complete`
- `edit_suggest_submit`
- `photo_submit`
- `review_submit`
- `login_attempt`

> 이벤트가 **한 번이라도 발생해야 목록에 나타남**. 그 전엔 토글할 게 없음.

#### (3) 맞춤 측정기준(Custom Dimensions) 등록 — 분석할 때마다

GA4 콘솔 → **관리 → 데이터 표시 → 맞춤 정의 → 맞춤 측정기준 만들기**


| 측정기준 이름        | 범위       | 이벤트 매개변수         | 우선순위 |
| -------------- | -------- | ---------------- | ---- |
| Cafe ID        | event    | `cafe_id`        | 높음   |
| Cafe Name      | event    | `cafe_name`      | 높음   |
| Tag Count      | event    | `tag_count`      | 중간   |
| Filter ID      | event    | `filter_id`      | 높음   |
| Action         | event    | `action`         | 중간   |
| Provider       | event    | `provider`       | 중간   |
| Is Logged In   | event    | `is_logged_in`   | 높음   |
| Active Filters | event    | `active_filters` | 중간   |
| Result         | event    | `result`         | 낮음   |
| Auth Provider  | **user** | `auth_provider`  | 높음   |


> 한 번에 다 만들 필요 없음. 분석 필요한 시점에 등록. **등록 전 데이터도 등록 후 잡힘.**

#### (4) 내부 트래픽 필터 — 1회성

GA4 콘솔 → **관리 → 데이터 스트림 → 웹 스트림 → 태그 설정 구성 → 내부 트래픽 정의**

- 본인 공유기 IP 추가 → 이름 `internal`
- 그 다음 **관리 → 데이터 설정 → 데이터 필터 → 내부 트래픽 필터 사용 설정**

---

## 추천 퍼널 / 탐색 분석

GA4 콘솔 → **탐색 → 새 탐색 → 유입경로 탐색**

### 퍼널 1: 카페 등록 전환

```
page_view (page_path = /)
  → page_view (page_path 포함 /new 또는 카페 등록 모달 진입)
  → cafe_submit_complete
```

> 어디서 이탈하는지 확인. 폼 단순화 의사결정 근거.

### 퍼널 2: 핵심 참여

```
cafe_marker_click
  → cafe_view
  → like_toggle 또는 review_submit 또는 favorite_toggle
```

> 카페 상세를 봐도 액션을 안 하는 비율 측정.

### 퍼널 3: 로그인 전환

```
login_attempt
  → first_visit/session_start (provider별 분기)
```

> 카카오 vs 구글 로그인 성공률 차이.

---

## 디버깅

### DebugView (실시간)

1. Chrome에 [Google Analytics Debugger](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) 확장 설치 → ON
2. `npm run dev` → 사이트 진입
3. Firebase Console → **애널리틱스 → DebugView**
4. 클릭/액션 직후 이벤트가 실시간으로 뜨면 정상

### 표준 보고서 지연

- DebugView: 실시간
- 실시간 보고서: 수 초 지연
- 일반 대시보드 / 이벤트 목록 / 탐색: **24~48시간** 지연
- 이벤트 첫 발송 후 위 시간이 지나야 GA4 "이벤트" 화면에 자동 등록됨

---

## 새 이벤트 추가 방법

1. **이벤트 네이밍 컨벤션 준수**: snake_case, 동사형 또는 상태 변화. 한 번 정한 이름은 바꾸지 말 것 (과거 데이터와 안 합쳐짐).
2. **호출**: `import { track } from '@/lib/firebase/analytics'` → `track('event_name', { ... })`
3. **파라미터**: 분석에 쓸 차원만. 고카디널리티 값(예: 자유 텍스트)은 피할 것.
4. **이 문서 업데이트**: 위 표에 행 추가.
5. **(필요 시) 맞춤 측정기준 등록**: 그 파라미터로 보고서 슬라이스가 필요한 경우.

---

## 비용

**무료 (Spark 플랜으로 충분)**


| 한도           | 카공맵 현황         |
| ------------ | -------------- |
| 이벤트 수        | 무제한            |
| 서로 다른 이벤트 이름 | 500개 (현재 ~12개) |
| 이벤트당 파라미터    | 25개            |
| 사용자 속성       | 25개 (현재 1개)    |
| 데이터 보관       | 최대 14개월 (무료)   |


> Google Analytics 360 (유료) 또는 BigQuery 대용량 쿼리로 갈 일은 카공맵 스케일에선 한참 멀었음.

---

## 관련 파일

- `lib/firebase/firebase.ts` — Firebase 앱 초기화 (measurementId 포함)
- `lib/firebase/analytics.ts` — `track`, `setAnalyticsUser` 래퍼
- `components/layout/FirebaseAnalytics.tsx` — SDK 초기 부팅
- `components/layout/RouteChangeTracker.tsx` — SPA pageview
- `components/layout/AnalyticsIdentity.tsx` — userId / auth_provider 동기화
- 이벤트 호출부: `MainApp.tsx`, `cafe/detail/CafeModalDetail.tsx`, `cafe/detail/ImageSubmitModal.tsx`, `cafe/detail/CafeReviewSection.tsx`, `cafe/form/CafeInfoForm/CafeInfoForm.tsx`, `app/login/page.tsx`, `notifications/PushNotificationToggle.tsx`

