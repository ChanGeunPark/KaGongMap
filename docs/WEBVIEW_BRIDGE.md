# 카공맵 — WebView 브릿지

> 카공맵은 단일 Next.js 코드베이스로 **브라우저**와 **Flutter WebView 앱** 두 환경 모두에 서비스된다. 두 환경의 갭(푸시 권한·위치 권한·외부 링크·햅틱 등)을 메시지 기반 브릿지로 메운다. 브라우저에서는 메시지가 no-op으로 떨어져 단일 코드 경로가 깨지지 않는다.

---

## 개요

- **WebView 호스트**: Flutter (`flutter_inappwebview` 또는 자체 컨트롤러)
- **식별**: User-Agent에 `KaGongMapApp` 문자열 포함 여부
- **프로토콜**: JSON 문자열 직렬화 + 단일 진입점 함수 (양방향)
- **타입 안전**: `lib/native/messages.ts`의 union 타입으로 incoming/outgoing 모두 정의
- **상태 동기**: Zustand `useNativeStore` — `isWebView`, `fcmToken`

---

## 아키텍처 흐름

```
┌───────────────────────────┐       ┌────────────────────────────┐
│   Flutter (네이티브 앱)    │       │   Next.js (WebView 내부)    │
│                           │       │                            │
│   FCM SDK / 위치 / 햅틱   │       │   React + Bridge           │
└──────┬─────────────────┬──┘       └──┬─────────────────────┬───┘
       │                 │             │                     │
       │  controller     │             │  KaGongMapApp       │
       │  .runJavaScript │             │  .postMessage       │
       │                 ▼             ▼  / callHandler      │
       │   window.__kgBridge.receive("...JSON...")           │
       │                 (Flutter → Web)                     │
       │                                                     │
       │                          ◄──────────────────────────┤
       │                          (Web → Flutter)            │
       └─────────────────────────────────────────────────────┘
```

**프로토콜 핵심**:

- 모든 메시지는 **JSON 문자열**로 직렬화 (`{ type, payload }`)
- Flutter → Web 진입점: `window.__kgBridge.receive(jsonString)` (단일 함수)
- Web → Flutter 채널: `KaGongMapApp.postMessage(jsonString)` (선호) 또는 `flutter_inappwebview.callHandler("KaGongMapApp", jsonString)` (fallback)

---

## 파일 구조

```
lib/native/
├── constants.ts      # NATIVE_BRIDGE_NAME = "KaGongMapApp"
├── isWebView.ts      # User-Agent 기반 WebView 감지
├── messages.ts       # Incoming/Outgoing 메시지 union 타입
└── bridge.ts         # nativeBridge 싱글톤 (init/on/send/isAvailable)

components/native/
└── NativeBridgeInit.tsx     # 클라이언트 부트스트랩 (app/layout.tsx에 마운트)

stores/
└── nativeStore.ts    # Zustand — isWebView, fcmToken 전역 상태
```

---

## WebView 감지

```ts
// lib/native/isWebView.ts
export function isWebView(): boolean {
  if (typeof window === "undefined") return false;
  return window.navigator.userAgent.includes("KaGongMapApp");
}
```

Flutter 측에서 WebView를 띄울 때 **User-Agent에 `KaGongMapApp` 토큰을 반드시 포함**시켜야 한다 (예: `KaGongMapApp/1.0`). 이게 단일 식별자.

부팅 시점에 [`NativeBridgeInit`](../components/native/NativeBridgeInit.tsx)이 결과를 `useNativeStore.isWebView`에 박제하므로, 호출부는 SSR-safe하게 `useNativeStore((s) => s.isWebView)`로 사용한다 (SSR에서는 항상 false).

---

## 메시지 프로토콜

### Flutter → Web (수신)

```ts
// lib/native/messages.ts
export type IncomingNativeMessage =
  | { type: "FCM_TOKEN";      payload: { token: string } }
  | { type: "PUSH_TAP";       payload: { cafeId?: string; url?: string; data?: Record<string, string> } }
  | { type: "LOCATION_RESPONSE"; payload: {
      status: NativeLocationPermissionStatus;
      coords?: { lat: number; lng: number; accuracy?: number };
    } }
  | { type: "LOCATION_PERMISSION_STATUS"; payload: { status: NativeLocationPermissionStatus } }
  | { type: "LOCATION_UPDATE"; payload: { lat: number; lng: number; accuracy?: number } }
  | { type: "HEADING_UPDATE"; payload: { heading: number /* 진북 기준 시계방향 0~360 */ } }
  | { type: "TEST_RESPONSE";  payload: { text: string } };

// NativeLocationPermissionStatus = "granted" | "denied" | "prompt" | "unknown" | "unsupported"
```

| 타입                          | 트리거                                                                  | 처리                                                              |
| ----------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `FCM_TOKEN`                   | Flutter가 FCM 토큰 발급 후 또는 회전(rotation) 후                       | `useNativeStore.fcmToken` 저장                                    |
| `PUSH_TAP`                    | 백그라운드 푸시 알림 탭 시 (Flutter가 라우팅 의도 전달)                 | 현재 미구독. 향후 router.push 핸들러 필요                         |
| `LOCATION_RESPONSE`           | `REQUEST_LOCATION` 처리 완료 (다이얼로그 띄운 뒤 1회 결과)              | `useNativeStore.nativeLocationPermission` + `nativeLocation` 갱신 |
| `LOCATION_PERMISSION_STATUS`  | `CHECK_LOCATION_PERMISSION` 응답 또는 권한 변화 푸시 (다이얼로그 X)     | `useNativeStore.nativeLocationPermission` 갱신                    |
| `LOCATION_UPDATE`             | `START_LOCATION_UPDATES` 구독 중 좌표 변화 (distanceFilter 이상 이동)   | `useNativeStore.nativeLocation` 갱신 (직전 좌표와 동일하면 skip)  |
| `HEADING_UPDATE`              | `START_HEADING_UPDATES` 구독 중 컴퍼스 방위각 변화 (flutter_compass)    | `useUserHeading` heading store 갱신 (2° 미만 변화 skip)           |
| `TEST_RESPONSE`               | 디버그/QA용                                                             | 현재 미구독                                                       |

### Web → Flutter (송신)

```ts
export type OutgoingNativeMessage =
  | { type: "READY";                       payload?: undefined }
  | { type: "CHECK_LOCATION_PERMISSION";   payload?: undefined }
  | { type: "REQUEST_LOCATION";            payload?: { highAccuracy?: boolean } }
  | { type: "START_LOCATION_UPDATES";      payload?: { highAccuracy?: boolean; distanceFilter?: number } }
  | { type: "STOP_LOCATION_UPDATES";       payload?: undefined }
  | { type: "START_HEADING_UPDATES";       payload?: undefined }
  | { type: "STOP_HEADING_UPDATES";        payload?: undefined }
  | { type: "REQUEST_PUSH_PERMISSION";     payload?: undefined }
  | { type: "OPEN_EXTERNAL_URL";           payload: { url: string } }
  | { type: "SHARE";                       payload: { title?: string; text: string; url?: string } }
  | { type: "HAPTIC";                      payload: { kind: "light" | "medium" | "heavy" | "selection" } }
  | { type: "AUTH_STATE_CHANGED";          payload: { signedIn: boolean; userId?: string } }
  | { type: "SET_STATUS_BAR";              payload: { style: "light" | "dark"; backgroundColor?: string } }
  | { type: "TEST";                        payload: { message: string } };
```

| 타입                         | 용도                                                                                | 현재 사용처                                     |
| ---------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| `READY`                      | 웹 마운트 완료 신호. cold-start 메시지 흘리기 트리거                                | `NativeBridgeInit` 부팅 시                      |
| `CHECK_LOCATION_PERMISSION`  | 위치 권한 상태 **조용히 조회** (다이얼로그 X). 응답: `LOCATION_PERMISSION_STATUS`   | `NativeBridgeInit` 부팅 시 1회                  |
| `REQUEST_LOCATION`           | 위치 권한 다이얼로그 + 1회 좌표 요청. 응답: `LOCATION_RESPONSE`                     | `MainApp` 위치 권한 배너 클릭                   |
| `START_LOCATION_UPDATES`     | 실시간 좌표 구독 시작. 권한이 `granted` 일 때만 송신. `distanceFilter` 미터 단위.   | `useMapGeolocation` (권한 granted + 지도 마운트) |
| `STOP_LOCATION_UPDATES`      | 좌표 구독 종료 — 배터리 보호                                                        | `useMapGeolocation` cleanup                     |
| `START_HEADING_UPDATES`      | `flutter_compass` 구독 시작. 응답: `HEADING_UPDATE` 반복 push                       | `useUserHeading` (지도 + 위치 권한 granted)     |
| `STOP_HEADING_UPDATES`       | 컴퍼스 구독 종료 — 센서 OFF                                                         | `useUserHeading` cleanup                        |
| `REQUEST_PUSH_PERMISSION`    | 네이티브 알림 권한 팝업 요청 → 응답은 `FCM_TOKEN`                                   | `PushNotificationToggle` "켜기" 버튼            |
| `OPEN_EXTERNAL_URL`          | 외부 링크를 시스템 브라우저로                                                       | **미구현** — `naverMapAppLink` 등에 붙일 예정   |
| `SHARE`                      | OS 네이티브 공유 시트                                                               | **미구현**                                      |
| `HAPTIC`                     | 햅틱 피드백 (좋아요·바텀시트 dragger 등)                                            | **미구현**                                      |
| `AUTH_STATE_CHANGED`         | 로그인 상태 변경 — 네이티브에서 토큰 회수 등 사용                                   | **미구현**                                      |
| `SET_STATUS_BAR`             | 라이트/다크 모드 전환 시 상태바 색 동기                                             | **미구현**                                      |

> 미구현 outgoing 타입은 인터페이스 contract만 정의해둔 상태. Flutter 측 핸들러 추가 + 웹 호출부 추가 시 작동.

---

## 송신 메커니즘 (`nativeBridge.send`)

[`lib/native/bridge.ts`](../lib/native/bridge.ts)의 `send()`는 다음 우선순위로 시도하고, 첫 성공 채널을 사용한다:

```ts
// 1순위: Flutter 측이 주입한 폴리필 (단순한 글로벌 객체)
if (typeof w.KaGongMapApp?.postMessage === "function") {
  w.KaGongMapApp.postMessage(JSON.stringify(msg));
  return true;
}

// 2순위: flutter_inappwebview JavascriptHandler
if (typeof w.flutter_inappwebview?.callHandler === "function") {
  w.flutter_inappwebview.callHandler("KaGongMapApp", JSON.stringify(msg));
  return true;
}

// 두 채널 모두 없으면 false — 브라우저 환경에서 자연스럽게 no-op
return false;
```

**브라우저에서는 두 채널 모두 없으니 `send()`가 false를 반환**하고 끝난다. 호출부는 반환값을 보고 fallback(브라우저 권한 팝업 등)으로 분기 가능.

---

## 수신 메커니즘 (`window.__kgBridge.receive`)

[`bridge.ts`](../lib/native/bridge.ts)의 `init()`이 글로벌에 단일 진입 함수를 노출:

```ts
window.__kgBridge = {
  receive: (raw: string) => this.dispatch(raw),
};
```

Flutter 쪽 호출 예:

```dart
controller.runJavaScript(
  'window.__kgBridge.receive(\'${jsonEncode({"type": "FCM_TOKEN", "payload": {"token": token}})}\')'
);
```

`dispatch()`가 JSON 파싱 → `msg.type` 으로 라우팅 → 등록된 핸들러들 호출. 핸들러는 `nativeBridge.on(type, handler)`로 구독, 반환된 unsubscribe 함수로 정리.

```ts
useEffect(() => {
  const unsub = nativeBridge.on("FCM_TOKEN", (payload) => {
    setFcmToken(payload.token);
  });
  return unsub;
}, []);
```

---

## 부트스트랩 (`NativeBridgeInit`)

[`app/layout.tsx`](../app/layout.tsx)에 한 번만 마운트:

```tsx
<NativeBridgeInit />
```

수행 작업:

1. `nativeBridge.init()` — `window.__kgBridge` 글로벌 주입
2. `useNativeStore.setIsWebView(isWebView())` — 환경 식별 박제
3. `nativeBridge.send({ type: "READY" })` — Flutter에게 웹 마운트 완료 신호 (Flutter가 보류한 cold-start 메시지를 흘려보내는 트리거)
4. `FCM_TOKEN` 구독 — 받으면 `useNativeStore.setFcmToken(token)`

---

## 전역 상태 (`useNativeStore`)

```ts
interface NativeStoreState {
  isWebView: boolean;
  fcmToken: string | null;
  nativeLocationPermission: NativeLocationPermissionStatus | null;
  nativeLocation: { lat: number; lng: number; accuracy: number } | null;
  // setters …
}
```

- `isWebView`: SSR 친화. NativeBridgeInit이 마운트 후 갱신. 호출부에서 직접 `isWebView()` 호출보다 이 selector 사용 권장
- `fcmToken`: Flutter가 발급한 토큰. `PushNotificationToggle`이 등록·회전 처리
- `nativeLocationPermission`: WebView 에서 Flutter 가 회신한 권한 상태 (`LOCATION_PERMISSION_STATUS` / `LOCATION_RESPONSE`). 브라우저에서는 `null` — 권한 상태는 `useLocationPermission()` 훅을 사용해 환경에 무관하게 접근
- `nativeLocation`: WebView 에서 Flutter 가 push 한 최신 좌표 (`LOCATION_UPDATE` / `LOCATION_RESPONSE.coords`). 동일 좌표 연속 수신 시 갱신 skip — 불필요 re-render 방지

### 위치 권한 접근 — `useLocationPermission()`

브라우저 / WebView 환경 차이를 가리는 단일 훅 ([hooks/useLocationPermission.ts](../hooks/useLocationPermission.ts)):

- WebView: `useNativeStore.nativeLocationPermission` selector
- 브라우저: 모듈 단위 watcher (`navigator.permissions.query` 구독) — 단일 source 보장
- `setBrowserLocationPermission(status)` — `getCurrentPosition` 성공/실패 직후 강제 동기 (`permissions.query` 미지원 환경 대비)

### WebView 위치 라이프사이클

```
[NativeBridgeInit 부팅]
   ↓
READY  ──────────────────►  Flutter
CHECK_LOCATION_PERMISSION ►  Flutter
   ↓
   ◄──── LOCATION_PERMISSION_STATUS  (조용한 응답, 다이얼로그 X)
   ↓
nativeStore.nativeLocationPermission = "granted" 등

[지도 마운트 + 권한 granted]
   ↓
useMapGeolocation:
   START_LOCATION_UPDATES { highAccuracy, distanceFilter: 5 } ► Flutter
   ↓
   ◄──── LOCATION_UPDATE { lat, lng, accuracy }   (구독 동안 반복)
   ↓
nativeStore.nativeLocation 갱신 → 마커/centering

[지도 언마운트 또는 권한 회수]
   ↓
STOP_LOCATION_UPDATES ► Flutter  (배터리 보호)

[권한 배너 클릭]
   ↓
REQUEST_LOCATION { highAccuracy: true } ► Flutter
   ↓ (다이얼로그)
   ◄──── LOCATION_RESPONSE { status, coords? }
```

---

## 케이스 스터디: 푸시 알림 토큰 등록

브라우저와 WebView가 동일 UI지만 내부 흐름이 완전히 다른 대표 케이스. [`PushNotificationToggle.tsx`](../components/notifications/PushNotificationToggle.tsx)에서 분기.

### 브라우저 경로

```
[켜기 버튼]
   ↓
registerFcmToken()              // lib/firebase/fcm.ts
   ↓
Notification.requestPermission()  // 브라우저 권한 팝업
   ↓
serviceWorker.register('/firebase-messaging-sw.js')
   ↓
getToken(messaging, { vapidKey, serviceWorkerRegistration })
   ↓
POST /api/fcm-tokens { token }
   ↓
localStorage 저장 → enabled=true
```

### WebView 경로

```
[켜기 버튼]
   ↓
awaitingTokenRef = true
nativeBridge.send({ type: "REQUEST_PUSH_PERMISSION" })
   ↓
Flutter가 OS 권한 팝업 띄우고, 허용 시 FCM 토큰 발급
   ↓
window.__kgBridge.receive('{"type":"FCM_TOKEN","payload":{"token":"..."}}')
   ↓
useNativeStore.fcmToken 갱신
   ↓
useEffect 트리거: saveFcmTokenToServer(token)   // 권한 발급 없이 서버 저장만
   ↓
POST /api/fcm-tokens { token }
   ↓
localStorage 저장 → enabled=true
```

**타임아웃 처리**: 사용자가 OS 팝업에서 "거부"를 누르면 Flutter가 응답 없이 끝낼 수 있어, 웹은 10초 후 자동 `busy=false` + 토스트 안내 ([PushNotificationToggle:122-132](../components/notifications/PushNotificationToggle.tsx#L122-L132)).

**토큰 회전 처리**: 이미 `enabled=true`인 상태에서 새 `FCM_TOKEN`이 들어오면 (앱 업데이트·토큰 만료 후 재발급 등), 권한 요청 대기 중이 아닐 때는 조용히 DB만 갱신 ([PushNotificationToggle:94-99](../components/notifications/PushNotificationToggle.tsx#L94-L99)).

---

## Flutter 측 구현 요구사항

웹 코드가 가정하는 Flutter 측 contract:

### 1. User-Agent

WebView 컨트롤러 세팅 시 UA에 `KaGongMapApp` 문자열 포함 (`InAppWebViewSettings(userAgent: "...KaGongMapApp/1.0")`).

### 2. Web → Flutter 핸들러 등록

`flutter_inappwebview` 사용 시:

```dart
controller.addJavaScriptHandler(
  handlerName: "KaGongMapApp",
  callback: (args) {
    final raw = args.first as String;
    final msg = jsonDecode(raw);
    switch (msg["type"]) {
      case "READY": ...
      case "REQUEST_PUSH_PERMISSION": ...
      // ...
    }
  },
);
```

또는 단순 글로벌 폴리필 (`window.KaGongMapApp.postMessage = ...`)을 주입해도 OK.

### 3. Flutter → Web 호출

```dart
final json = jsonEncode({"type": "FCM_TOKEN", "payload": {"token": token}});
await controller.runJavaScript("window.__kgBridge.receive('$json')");
```

> JSON 문자열을 JS 리터럴에 박을 때 따옴표 이스케이프 주의 (현재 토큰은 base64-safe라 문제없지만, 향후 임의 문자열 보낼 때는 `jsonEncode(json)`로 한번 더 감싸 안전하게).

### 4. cold-start 메시지 보류

웹이 마운트되기 전에 보낼 메시지(예: 토큰 캐시)가 있으면 Flutter는 `READY` 수신 전까지 큐에 보류했다가 흘려보내야 한다. 안 그러면 `window.__kgBridge`가 아직 없어서 메시지 손실.

---

## 디버깅 팁

- **`isAvailable()`** — `nativeBridge.isAvailable()`는 `flutter_inappwebview` 또는 `FlutterBridge` 글로벌 존재 여부로 판정. 가벼운 진단용.
- **콘솔 로그** — `dispatch()`는 JSON 파싱 실패 / type 없음 / 핸들러 없음 케이스를 모두 `console.warn` 또는 `console.debug`로 출력. Flutter 측에서 WebView devtools(`InAppWebViewSettings(isInspectable: true)`) 켜고 확인 가능.
- **브라우저에서 WebView 시뮬레이션** — DevTools → Network → User agent를 `Mozilla/5.0 ... KaGongMapApp/1.0`로 바꾸면 `isWebView()`가 true로 떨어지고 분기 흐름을 따라가볼 수 있음. 단 `send()`는 채널이 없어서 항상 false 반환.

---

## 관련 문서

- [PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md) — FCM 토큰 발급·발송 흐름. WebView에서 어떻게 다른지 포함.
