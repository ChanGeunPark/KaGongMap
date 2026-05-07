# 카공맵 — 어드민 AI 자동 제보

> 어드민이 본인 PC에서 Claude CLI를 호출해 카페 정보(영업시간·최소 주문 금액·소개·태그)를 자동 조사한 뒤, 결과를 검수해 `cafe_submissions`에 `pending` 으로 등록하는 기능. 일반 사용자 제보 흐름과 동일한 검수 라인을 타며, 어드민의 카페 등록 작업량을 줄이는 게 목적.

---

## 핵심 컨셉

- **로컬 브릿지**: 본인 PC 에서 도는 작은 Node 프로세스(`tools/auto-submit-bridge/`)가 어드민 페이지의 요청을 받아 `claude` CLI 를 spawn 한다. 결과 JSON 을 받아 큐에 보관하고 SSE 로 어드민 화면에 푸시.
- **이미지는 자동 수집하지 않는다**: 라이선스/정확도 문제로 텍스트 필드만 자동화. 이미지는 등록 후 일반 유저 사진 제보로 채워진다.
- **검수는 두 단계**: ① 자동 조사 결과를 어드민이 모달에서 확인·수정 후 큐에 제출 → ② 일반 어드민 대기 탭에서 한 번 더 클릭으로 최종 승인.
- **배포본에서도 동작**: 브라우저는 `http://localhost`/`127.0.0.1` 을 mixed content 예외로 취급하므로, Vercel 배포된 `/admin/auto-submit` 페이지가 본인 PC 의 브릿지를 직접 호출 가능. 단 브릿지가 켜져 있는 본인 데스크탑에서만. 모바일 미지원.

---

## 아키텍처 흐름

```
어드민 브라우저 (kagongmap.vercel.app 또는 localhost:3000)
   │
   │  ① 카카오 검색 → 카페 선택 → "AI 조사 시작"
   ▼
POST http://localhost:7332/jobs   (Authorization: Bearer <BRIDGE_TOKEN>)
   │
   ▼
로컬 브릿지 (tools/auto-submit-bridge, Node + Hono)
   │
   │  ② 큐에 enqueue → SSE 로 모든 구독자에 push
   │  ③ 워커가 spawn: claude -p --output-format json --permission-mode bypassPermissions
   │     (stdin: 카페 메타 + 태그 enum + JSON 스키마 강제 프롬프트)
   ▼
Claude CLI ─ 웹 검색 ─→ JSON 응답
   │
   │  ④ runner.ts 가 응답을 파싱·zod 검증 → status='ready' 로 큐 갱신
   ▼
SSE → 어드민 화면 "검토하기" 버튼 활성화
   │
   │  ⑤ 어드민이 모달에서 hours/min_order/description/tags 검수 + 수정
   │  ⑥ "대기 큐로 제출"
   ▼
POST /api/admin/auto-submissions   (NextAuth 어드민 가드)
   │
   ▼
Supabase: cafe_submissions INSERT (status='pending', user_id=어드민 oauthId)
   │
   ▼
일반 어드민 "대기 중" 탭에 노출 → 클릭 한 번으로 최종 승인 → 트리거가 cafes 생성
```

큐는 브릿지 메모리(Map)에 보관. 브릿지 재시작 시 초기화 — 자동 제보 작업은 일회성이므로 영속화 불필요.

---

## 폴더 구조

### 로컬 브릿지 (`tools/auto-submit-bridge/`)

> 이 저장소(`kagongmap/`)에는 브릿지 소스가 들어 있지 않다. 어드민 본인 PC 에 별도로 클론/관리 (이 저장소의 `tools/` 디렉토리에 두거나, 어디든 같은 머신에서 띄우면 된다).

```
tools/auto-submit-bridge/        # 본인 PC, 외부 관리
├── package.json                 # Hono + zod, tsx watch 로 실행
├── tsconfig.json
├── .env                         # BRIDGE_TOKEN 등 (배포되지 않음)
├── README.md
└── src/
    ├── types.ts                 # Place / CafeTag / Job zod 스키마
    ├── prompt.ts                # Claude 에 던질 프롬프트 빌더
    ├── runner.ts                # claude CLI spawn + JSON 추출 + zod 검증
    ├── queue.ts                 # concurrency-1 큐 + pub/sub
    └── server.ts                # Hono 서버 + CORS + Bearer 인증 + SSE
```

### Next.js 어드민

```
types/autoSubmit.ts                                # Job/Result 타입 (브릿지 타입과 동일 스키마)
lib/api/autoSubmit.ts                              # 브릿지 HTTP/SSE 클라이언트 + createAutoSubmission
app/api/admin/auto-submissions/route.ts            # POST: 어드민 가드 후 cafe_submissions INSERT (pending)
app/admin/auto-submit/
├── page.tsx                                       # 어드민 가드 (page-level)
└── _components/
    ├── AutoSubmitDashboard.tsx                    # 메인 대시보드 + 자동 재연결 5s
    ├── BridgeStatusBadge.tsx                      # ●연결됨/연결 중/끊김 배지
    ├── KakaoSearchPanel.tsx                       # 카카오 검색 → 단일 선택 → "AI 조사 시작"
    ├── JobCard.tsx                                # 큐 카드 (조사중 경과 시간, 재시도, 검토하기, 삭제)
    └── ReviewModal.tsx                            # 자동 조사 결과 검수 + cafe_submissions 제출
```

`AdminDashboard` 헤더 우측에 "✨ AI 자동 제보" 진입 링크 추가.

---

## 환경변수

### 로컬 브릿지 (`tools/auto-submit-bridge/.env`)

| 변수 | 기본값 | 용도 |
|---|---|---|
| `BRIDGE_TOKEN` | 없음 (필수) | 어드민 페이지가 보내는 `Authorization: Bearer` 와 동일해야 함. `openssl rand -hex 32` 로 생성 권장 |
| `PORT` | `7332` | 브릿지 listen 포트. `127.0.0.1` 에만 바인딩 |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS 허용 origin. 콤마 구분. 배포 도메인 추가 필요 (`https://kagongmap.vercel.app`) |
| `AGENT` | `claude` | `claude` (기본) 또는 `codex`. codex 는 placeholder, 실제 검증 안 됨 |
| `CONCURRENCY` | `1` | 동시 실행 작업 수. CLI rate limit 고려해 1~2 권장 |
| `TIMEOUT_MS` | `180000` | CLI 호출 타임아웃 (3분) |

### Next.js (`.env.development.local` 및 Vercel 환경변수)

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_BRIDGE_URL` | 브릿지 URL (`http://localhost:7332`) |
| `NEXT_PUBLIC_BRIDGE_TOKEN` | 브릿지의 `BRIDGE_TOKEN` 과 동일값 |

> `NEXT_PUBLIC_*` 은 빌드 타임에 클라이언트 번들로 인라인되므로, 변경 시 **dev 서버 재시작 + 브라우저 hard reload** 필수.

---

## 셋업 (최초 1회)

```bash
# 1. 브릿지 의존성 설치
cd tools/auto-submit-bridge
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 의 BRIDGE_TOKEN 을 긴 랜덤 문자열로 변경

# 3. Next.js 환경변수 추가 (.env.development.local)
#    NEXT_PUBLIC_BRIDGE_URL=http://localhost:7332
#    NEXT_PUBLIC_BRIDGE_TOKEN=<위와 동일값>

# 4. Claude CLI 사전 설치/로그인 확인
claude --version
```

배포 환경이라면 Vercel 대시보드 → Settings → Environment Variables 에서 `NEXT_PUBLIC_BRIDGE_URL`, `NEXT_PUBLIC_BRIDGE_TOKEN` 추가 후 재배포.

또한 브릿지의 `ALLOWED_ORIGINS` 에 배포 도메인이 포함되어 있어야 함 (`http://localhost:3000,https://kagongmap.vercel.app` 식).

---

## 사용 흐름

1. 본인 PC 터미널: `cd tools/auto-submit-bridge && npm run bridge`
2. `/admin` 헤더의 "✨ AI 자동 제보" 또는 직접 `/admin/auto-submit`
3. 우측 상단 배지가 초록 "● 브릿지 연결됨" 인지 확인
4. 카카오 검색창에 카페명/지역 검색 → 결과에서 한 곳 선택 → "AI 조사 시작"
5. 큐에서 작업 진행 (1건당 1~2분)
6. "검토 대기" 상태가 되면 "검토하기" → 모달에서 hours/min_order/description/tags 검수 + 수정
7. "대기 큐로 제출" → `cafe_submissions` 에 `pending` 으로 들어감
8. `/admin` "대기 중" 탭에서 클릭 한 번으로 최종 승인 → DB 트리거가 `cafes` 생성

---

## 보안 메모

- **브릿지는 `127.0.0.1` 에만 바인딩**: 같은 LAN 의 다른 기기에서 접근 불가. 절대 `0.0.0.0` 으로 바꾸지 말 것.
- **토큰 노출 위험은 낮음**: `NEXT_PUBLIC_BRIDGE_TOKEN` 은 클라이언트 번들에 인라인되어 노출되지만, 토큰을 알아도 본인 PC 에 브릿지가 떠 있어야만 의미 있음. 어드민 가드 뒤에서만 사용하므로 추가 위험 미미.
- **CORS 화이트리스트 필수**: 배포 도메인이 바뀌면 `ALLOWED_ORIGINS` 갱신 필요. preflight 차단 시 `Failed to fetch` 에러로 표면화.
- **브릿지가 spawn 하는 CLI 는 본인 권한으로 실행**: `claude --permission-mode bypassPermissions` 사용. 이는 본인 PC 에서 본인이 직접 돌리는 것과 동등하므로 이미 신뢰 경계 내부.

---

## 알려진 제한 / 향후 개선 후보

- **이미지 자동 수집 미구현**: 의도된 결정. 등록 후 사용자 사진 제보로 보완.
- **codex 지원은 placeholder**: `AGENT=codex` 로 토글 가능하나 실제 호출 검증 안 됨. 필요 시 `runner.ts` 의 `buildCliInvocation` / `extractLlmText` 에 codex 분기 추가.
- **큐 영속화 없음**: 브릿지 재시작 시 진행 중 작업 유실. 현재 일회성 사용 패턴이라 의도된 단순화.
- **Claude CLI 출력 포맷 의존**: `--output-format json` 결과의 `result` 필드를 LLM 텍스트로 사용. 향후 CLI 포맷 변경 시 `runner.ts` 의 `extractLlmText` 수정 필요.
- **태그 분류 정확도 70~80%**: LLM 자체 신뢰도 (`confidence.tags`) 를 `ReviewModal` 상단에 표시하므로, 어드민이 검수 시 참고. 출처 URL 도 함께 노출.
- **모바일 미지원**: 의도. 화면 width<768 시 안내 배너 표시.
