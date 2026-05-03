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

```
kagongmap/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃 (GNB, AuthProvider)
│   ├── page.tsx                # 메인 지도 /
│   ├── globals.css
│   ├── cafes/
│   │   ├── [id]/
│   │   │   ├── page.tsx        # 카페 상세 /cafes/[id] [PUBLIC]
│   │   │   └── review/
│   │   │       └── page.tsx    # 후기 작성 /cafes/[id]/review [AUTH]
│   │   └── new/
│   │       └── page.tsx        # 카페 등록 /cafes/new [AUTH]
│   ├── mypage/
│   │   └── page.tsx            # 마이페이지 /mypage [AUTH]
│   └── login/
│       └── page.tsx            # 로그인 /login [PUBLIC]
├── components/
│   ├── layout/                 # GNB, Footer 등 레이아웃 컴포넌트
│   ├── map/                    # NaverMap, CafeMarker, FilterBar 등
│   ├── cafe/                   # CafeCard, CafeTagList, CafeForm 등
│   ├── review/                 # ReviewCard, RatingInput 등
│   └── ui/                     # Button, Input, Modal, Toast 등 공통 UI
├── hooks/                      # Custom React Hooks
├── lib/                        # supabase client, 유틸 함수
├── types/                      # TypeScript 타입 정의
└── docs/                       # 프로젝트 문서
```

## 인증 원칙: "보는 건 자유, 참여는 로그인"

- **비로그인 가능**: 지도 탐색, 카페 상세·태그 열람, 후기 읽기, 필터 검색, 카페 제보, **사진 제보**, **좋아요 (localStorage 보관 → 로그인 시 DB 머지)**
- **로그인 필요**: 후기 작성, 즐겨찾기, 카페 정보 수정 제안, 마이페이지
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

## 카공 적합도 산출 방식

별점/avg_rating 미사용. 카페별 `cafe_tags` 개수 기반:

- **7개 이상**: 우수 (녹색 핀)
- **4개 이상**: 양호 (앰버 핀)
- **3개 이하**: 정보 부족 (레드 핀)

정렬 기본값: `like_count DESC` → `tags.length DESC` (클라이언트 정렬)

## V2 예정 기능 (MVP 이후)

- 카공 팁 게시판
- 지역별/조건별 카페 랭킹

## 핵심 카공 태그 (enum)

```
콘센트_있음 | 와이파이_있음 | 조용함 | 24시간 | 노트북_허용 | 혼잡도_낮음
| 늦은영업 | 가성비_좋음 | 자연채광 | 야외테라스 | 반려동물_가능
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
- `docs/ANALYTICS.md` — Firebase Analytics 이벤트 목록 & GA4 콘솔 설정
