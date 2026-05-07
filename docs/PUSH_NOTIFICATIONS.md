# 카공맵 — 푸시 알림 (FCM)

> Firebase Cloud Messaging 기반 웹 푸시. 어드민에게 신고·제보 알림을 자동 전송하기 위해 구축됨. 추후 일반 유저 알림(즐겨찾기 카페 신규 후기 등)에도 확장 가능.

---

## 개요

- **발송 측**: 서버(Next.js API route) — Firebase Admin SDK
- **수신 측**: 브라우저 — Firebase JS SDK + Service Worker
- **저장**: 디바이스별 FCM 토큰을 Supabase `fcm_tokens` 테이블에 보관
- **권한 정책**: 로그인 유저만. 마이페이지에서 명시적 토글로 등록/해제

---

## 아키텍처 흐름

### 토큰 발급

```
사용자 → /mypage → "푸시 알림 켜기" 클릭
   ↓
isFcmSupported() 체크 (브라우저 호환성)
   ↓
Notification.requestPermission() → 브라우저 권한 팝업
   ↓
serviceWorker.register('/firebase-messaging-sw.js')
   ↓
getToken(messaging, { vapidKey, serviceWorkerRegistration })
   ↓
POST /api/fcm-tokens { token, userAgent }
   ↓
upsert(fcm_tokens) by token (디바이스 주인 변경 시 user_id 갱신)
   ↓
localStorage에 토큰 저장 (동일 디바이스 재방문 시 상태 표시)
```

### 발송

```
사용자 액션 (제보/신고) → API route 진입
   ↓
INSERT (cafe_submissions / review_reports / ...)
   ↓
sendPushToAdmins(payload) — fire-and-forget
   ↓
ADMIN_USER_IDS env(OAuth ID) → users.id(UUID) lookup
   ↓
fcm_tokens 조회 → sendEachForMulticast (500개 청크)
   ↓
무효 토큰 자동 정리 (registration-token-not-registered)
```

---

## 환경변수

| 변수                             | 위치          | 용도                                                                    |
| -------------------------------- | ------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`   | 클라이언트    | Firebase Web SDK config (apiKey)                                        |
| `NEXT_PUBLIC_FIREBASE_APP_ID`    | 클라이언트    | Firebase Web SDK config (appId)                                         |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | 클라이언트    | 웹 푸시 공개키. Firebase 콘솔 → Cloud Messaging → Web Push certificates |
| `FIREBASE_SERVICE_ACCOUNT_KEY`   | **서버 전용** | Admin SDK 인증용. 서비스 계정 JSON 전체를 한 줄 문자열로                |
| `ADMIN_USER_IDS`                 | 서버          | NextAuth OAuth ID 콤마 구분. 푸시 발송 대상 식별에 재사용               |

> **`NEXT_PUBLIC_*`은 클라이언트 번들에 포함되어도 안전한 식별자**입니다. 보안은 Firebase Security Rules + Google Cloud API Key Restrictions(HTTP referrer 제한)로 통제. `FIREBASE_SERVICE_ACCOUNT_KEY`는 절대 클라이언트 노출 금지.

---

## DB 스키마

### `fcm_tokens`

```sql
CREATE TABLE fcm_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens (user_id);

-- RLS (API route는 createAdminClient로 우회. 정책은 직접 접근 시 안전망)
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fcm_tokens_select_own" ON fcm_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fcm_tokens_insert_own" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fcm_tokens_update_own" ON fcm_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fcm_tokens_delete_own" ON fcm_tokens
  FOR DELETE USING (auth.uid() = user_id);
```

**설계 메모**:

- `UNIQUE(token)` — FCM 토큰은 디바이스+브라우저별 고유. upsert(`onConflict: 'token'`) 시 다른 user_id에서 같은 디바이스 재로그인하면 자동 이전
- `last_used_at` — 추후 오래된 토큰 정리(예: 90일 미사용 cron 삭제) 용도
- 비로그인 토큰은 받지 않음. `user_id NOT NULL`

---

## 파일 구조

```
lib/firebase/
├── firebase.ts          # 클라이언트 Firebase App 싱글톤
├── fcm.ts               # 토큰 발급·등록·해제 (클라이언트)
├── admin.ts             # Admin SDK 싱글톤 (서버 전용, server-only)
└── sendPush.ts          # 발송 헬퍼 (서버 전용, server-only)

components/
├── layout/
│   └── FirebaseAnalytics.tsx     # Analytics 클라이언트 마운트
└── notifications/
    ├── PushNotificationToggle.tsx     # 마이페이지 푸시 알림 토글
    ├── LocationPermissionStatus.tsx   # 마이페이지 위치 권한 상태
    └── ForegroundFcmListener.tsx      # 포그라운드 onMessage 토스트 (전역)

public/
└── firebase-messaging-sw.js      # 백그라운드 메시지 처리 SW

app/api/
├── fcm-tokens/route.ts                       # POST/DELETE — 토큰 등록/해제
├── cafes/submissions/route.ts                # 새 카페 제보 (+ 어드민 푸시)
├── cafes/[id]/image-submissions/route.ts     # 사진 제보 (+ 어드민 푸시)
├── cafes/[id]/edit-submissions/route.ts      # 정보 수정 제안 (+ 어드민 푸시)
└── reviews/[id]/reports/route.ts             # 후기 신고 (+ 어드민 푸시)
```

---

## 클라이언트 API (`lib/firebase/fcm.ts`)

| Export                              | 용도                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `isFcmSupported()`                  | 브라우저가 웹 푸시 지원하는지 (iOS Safari 탭은 false)                   |
| `requestFcmToken()`                 | 권한 요청 + 토큰 발급. 저장은 안 함                                     |
| `registerFcmToken()`                | 권한 요청 + 토큰 발급 + 서버 저장까지 한 번에. **일반적으로 이걸 사용** |
| `unregisterFcmToken(token)`         | 서버에서 토큰 삭제                                                      |
| `listenForegroundMessages(handler)` | 앱이 켜져 있을 때 들어오는 메시지 리스너. unsubscribe 함수 반환         |

내부 동작:

- `vapidKey` 미설정 시 조용히 null 반환 (env 누락 가드)
- Service Worker(`/firebase-messaging-sw.js`)는 토큰 발급 시점에 자동 등록
- `getToken()`에 `serviceWorkerRegistration` 명시 전달

---

## 서버 API (`lib/firebase/sendPush.ts`)

```ts
type PushPayload = {
  title: string;
  body: string;
  link?: string; // 알림 클릭 시 이동할 사이트 내부 경로
  data?: Record<string, string>; // FCM 규약상 모든 값은 string
};
```

| Export                                | 용도                                        |
| ------------------------------------- | ------------------------------------------- |
| `sendPushToUser(userId, payload)`     | 한 유저의 모든 디바이스. 가장 자주 쓸 것    |
| `sendPushToUsers(userIds[], payload)` | 여러 유저 일괄 (즐겨찾기 카페 신규 후기 등) |
| `sendPushToAdmins(payload)`           | `ADMIN_USER_IDS` 전체                       |
| `sendPushToAll(payload)`              | 알림 켠 모든 유저. 공지용                   |

내부 동작:

- **500개 청크** — `sendEachForMulticast` 한 번 최대 500토큰. 자동 분할
- **무효 토큰 자동 정리** — `messaging/registration-token-not-registered` 등 발생 시 `fcm_tokens`에서 삭제. dead token 누적 방지
- **중복 토큰 제거** — 같은 토큰을 두 번 받아도 한 번만 발송

---

## 어드민 알림 트리거 포인트

| 이벤트              | API Route                                | 푸시 제목                | 본문                                     |
| ------------------- | ---------------------------------------- | ------------------------ | ---------------------------------------- |
| 새 카페 제보        | `POST /api/cafes/submissions`            | "새 카페 제보"           | `${카페명} 카페 제보가 들어왔어요.`      |
| 사진 제보           | `POST /api/cafes/[id]/image-submissions` | "새 사진 제보"           | `${카페명}에 사진이 제보되었어요.`       |
| 카페 정보 수정 제안 | `POST /api/cafes/[id]/edit-submissions`  | "새 카페 정보 수정 제안" | `${카페명} 정보 수정 제안이 들어왔어요.` |
| 후기 신고           | `POST /api/reviews/[id]/reports`         | "새 후기 신고"           | `사유: ${사유라벨}`                      |

**모든 트리거 공통**:

- INSERT 성공 후 `void sendPushToAdmins(...).catch(...)` — fire-and-forget
- 푸시 실패해도 본 응답은 정상 (사용자 액션은 항상 성공)
- `link: "/admin"` — 알림 클릭 시 어드민 콘솔로 이동

---

## 플랫폼 지원

| 환경                                | 지원 | 조건                   |
| ----------------------------------- | ---- | ---------------------- |
| Android Chrome (브라우저 탭)        | ✅   | 그냥 받음              |
| Android Chrome (PWA 설치)           | ✅   | 그냥 받음. UX 개선     |
| **iOS Safari (브라우저 탭)**        | ❌   | Apple 정책상 불가      |
| **iOS Safari (PWA 홈 화면)**        | ✅   | iOS **16.4 이상** 필수 |
| 데스크톱 Chrome/Edge/Firefox/Safari | ✅   | 그냥 받음              |

### iOS PWA 사용자 가이드

```
Safari로 사이트 열기
  ↓
공유 버튼 → "홈 화면에 추가"
  ↓
홈 화면 아이콘으로 다시 열기 (Safari 탭에서 누르면 안 됨)
  ↓
/mypage → "푸시 알림 켜기" 버튼 클릭
  ↓
권한 허용
```

iOS Safari 탭에서 마이페이지 들어오면 `isFcmSupported()`가 false 반환 → "이 브라우저는 푸시 알림을 지원하지 않아요" 안내 표시.

---

## Service Worker (`public/firebase-messaging-sw.js`)

백그라운드(앱이 닫혀있거나 다른 탭) 메시지를 처리. 앱이 켜져 있을 때는 동작하지 않음 — 이건 포그라운드 핸들러(추후 추가) 영역.

```js
firebase.initializeApp({
  apiKey: "AIzaSy...",
  projectId: "kagongmap",
  messagingSenderId: "1045730662094",
  appId: "...",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title || "알림", {
    body: payload.notification?.body || "",
    icon: "/icons/icon-192.png",
  });
});
```

**중요**: `public/` 아래 정적 파일은 Next.js가 env 치환을 하지 않으므로 Firebase config 값을 직접 하드코딩해야 함. (apiKey 등은 공개되어도 안전한 식별자라 OK)

---

## 테스트 체크리스트

배포 전 검증:

- [ ] `.env`에 4개 변수(`NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT_KEY`, `ADMIN_USER_IDS`) 모두 설정
- [ ] Vercel 환경변수에도 동일하게 등록
- [ ] Supabase에 `fcm_tokens` 테이블 + RLS SQL 실행
- [ ] `npm i firebase-admin` 완료
- [ ] 어드민 계정 로그인 → /mypage → "푸시 알림 켜기" → `fcm_tokens` 테이블 row 확인
- [ ] 다른 계정/비로그인으로 카페 제보 → 어드민 푸시 도착 확인 (앱 닫고 테스트)
- [ ] 사진 제보 / 수정 제안 / 후기 신고 동일 테스트
- [ ] iOS 16.4+ 디바이스에서 PWA 설치 후 동일 테스트
- [ ] Google Cloud Console에서 Firebase API Key에 HTTP referrer 제한 추가 (도메인 제한)

---

## 포그라운드 메시지 (`ForegroundFcmListener`)

Service Worker는 백그라운드(앱 닫힘/다른 탭)에서만 시스템 알림을 띄움. 사용자가 카공맵 탭을 보고 있을 때는 SW가 동작하지 않으므로 별도 처리 필요.

`components/notifications/ForegroundFcmListener.tsx`를 [app/layout.tsx](../app/layout.tsx)에 마운트해 전역에서 onMessage를 듣고, 토스트로 표시. 토스트 클릭 시 `payload.data.link` 또는 `payload.fcmOptions.link`로 라우터 이동.

```ts
listenForegroundMessages((payload) => {
  toast.info(<카공맵 토스트 컨텐츠>, {
    onClick: link ? () => router.push(link) : undefined,
  });
});
```

서버 측 `sendPush` 헬퍼는 이미 `webpush.fcmOptions.link`를 페이로드에 포함시키므로 별도 작업 불필요.

---

## 남은 작업

### 일반 유저 알림 확장

어드민 외 시나리오:

- 카페 제보 승인 시 제보자에게 "카페가 등록되었습니다" → `sendPushToUser(submitterId, ...)`
- 즐겨찾기 카페 신규 후기 → `sendPushToUsers(bookmarkUserIds, ...)`
- 내 후기에 신고 누적 → 작성자에게 알림
