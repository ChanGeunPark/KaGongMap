<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# 카공맵 — Agent 가이드라인

> 프로젝트 전체 컨텍스트는 **`CLAUDE.md`** 를 먼저 읽어라. 이 파일은 코딩 규칙에 집중한다.

## 프로젝트 한 줄 요약

카공족을 위한 카페 지도 커뮤니티. Next.js 14 App Router + Supabase + 네이버 지도 API.

## 반드시 지켜야 할 규칙

### 파일 위치

- 페이지: `app/` 디렉터리 (App Router)
- 컴포넌트: `components/{map|cafe|review|layout|ui}/`
- 훅: `hooks/use*.ts`
- Supabase 클라이언트: `lib/supabase.ts` 하나만 (싱글톤)
- 타입: `types/index.ts` 또는 `types/*.ts`

### 컴포넌트 작성 원칙

- 서버 컴포넌트가 기본. 인터랙션이 필요할 때만 `'use client'` 추가
- Props 타입은 항상 명시 (TypeScript strict)
- 클라이언트 상태는 Zustand 또는 Context 사용 (Redux 사용 금지)
- 스타일은 Tailwind CSS만 사용 (인라인 style 속성 지양)

### Supabase 사용 규칙

- 클라이언트 사이드: `lib/supabase.ts`의 `createBrowserClient`
- 서버 사이드 (Server Component, Route Handler): `createServerClient`
- RLS(Row Level Security)가 활성화되어 있다고 가정하고 코딩할 것
- 인증 체크는 Supabase Auth 세션으로만 처리 (자체 JWT 구현 금지)

### 인증 처리

- `hooks/useAuth.ts`가 전역 인증 상태를 담당
- 인증 필요 페이지: `ProtectedRoute` 컴포넌트로 감싸거나 서버에서 리다이렉트
- 비로그인 사용자가 인증 필요 액션 클릭 시: `AuthGate` 모달 표시 (페이지 이동 금지)

### 네이버 지도 API

- 클라이언트 컴포넌트에서만 사용 (`'use client'` 필수)
- `dynamic import`로 SSR 비활성화: `dynamic(() => import('@/components/map/NaverMap'), { ssr: false })`
- 지도 인스턴스는 `hooks/useMap.ts`에서 관리

### 환경변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
```

`.env.local`에 설정. 코드에 하드코딩 절대 금지.

### 카공 태그 타입 (공유 enum)

```typescript
type CafeTag =
  | "콘센트_있음"
  | "와이파이_있음"
  | "조용함"
  | "24시간"
  | "노트북_허용"
  | "혼잡도_낮음"
  | "늦은영업"
  | "가성비_좋음"
  | "자연채광"
  | "야외테라스"
  | "반려동물_가능";
```

### 금지 사항

- `any` 타입 사용 금지
- `console.log` 커밋 금지 (개발 중 디버그는 허용)
- CSS Modules, styled-components 사용 금지 (Tailwind만)
- `pages/` 디렉터리 생성 금지 (App Router만 사용)
- 환경변수 하드코딩 금지

## 코드 작성 전 체크리스트

1. [ ] `CLAUDE.md` 읽었는가?
2. [ ] 구현할 컴포넌트가 `docs/ARCHITECTURE.md`에 이미 정의되어 있는가?
3. [ ] 서버 컴포넌트로 만들 수 있는가? (클라이언트 컴포넌트 남용 주의)
4. [ ] 인증이 필요한 기능인가? → `docs/PRD.md`의 Auth Gate 섹션 확인
5. [ ] DB 접근이 필요한가? → `docs/DB_SCHEMA.md`의 테이블 구조 확인

## 관련 문서

- `CLAUDE.md` — 프로젝트 전체 컨텍스트
- `docs/PRD.md` — 기능 명세
- `docs/ARCHITECTURE.md` — 컴포넌트 트리
- `docs/DB_SCHEMA.md` — DB 스키마 & SQL
- `docs/MILESTONES.md` — 개발 순서

---

## Claude 서브에이전트 & 스킬

### 서브에이전트 (`.claude/agents/`)

Claude Code에서 `@` 멘션으로 호출한다.

| 에이전트              | 역할                                | 사용 예                                            |
| --------------------- | ----------------------------------- | -------------------------------------------------- |
| `@kagongmap-coder`    | 새 컴포넌트·훅·페이지·API 코드 작성 | `@kagongmap-coder 즐겨찾기 토글 버튼 만들어줘`     |
| `@kagongmap-refactor` | 기능 변경 없이 코드 품질·타입 개선  | `@kagongmap-refactor CafeInfoSidebar 리팩토링해줘` |
| `@kagongmap-planner`  | 기능 기획·UX 설계·구현 순서 논의    | `@kagongmap-planner 랭킹 기능 어떻게 설계할까?`    |

### 슬래시 커맨드 (`.claude/commands/`)

Claude Code에서 `/커맨드명 [인자]` 형태로 호출한다.

| 커맨드           | 설명                                              | 사용 예                                                |
| ---------------- | ------------------------------------------------- | ------------------------------------------------------ |
| `/new-component` | 프로젝트 컨벤션에 맞는 React 컴포넌트 생성        | `/new-component 카페 즐겨찾기 하트 버튼, cafe/에 위치` |
| `/new-hook`      | React Query 훅 + API 함수 생성                    | `/new-hook 즐겨찾기 목록 조회, userId 파라미터`        |
| `/new-page`      | Next.js App Router 페이지 생성                    | `/new-page /cafes/new 카페 등록 페이지, 인증 필요`     |
| `/new-api`       | Supabase API 함수 + Route Handler 생성            | `/new-api 즐겨찾기 추가/삭제, bookmarks 테이블`        |
| `/feature`       | 기획 검토 → 구현 계획 → 코드 작성까지 단계별 진행 | `/feature 카공 팁 게시판 V2 기능 구현`                 |
| `/type-check`    | TypeScript 오류 전체 점검 및 수정                 | `/type-check`                                          |
