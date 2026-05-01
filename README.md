# 카공맵 (KaGongMap)

> 카공족이 직접 만드는 카페 지도 커뮤니티

콘센트, 와이파이, 소음 수준, 시간 제한 여부 등 **카공 특화 정보**를 지도 위에서 함께 공유합니다.  
네이버 지도·카카오맵에선 볼 수 없는, 카공족 시점의 실용 정보를 제공합니다.

---

## 주요 기능

| 기능              | 설명                                                        |
| ----------------- | ----------------------------------------------------------- |
| 🗺️ 카페 지도 탐색 | 현재 위치 기반 주변 카공 카페 탐색, 커스텀 핀 표시          |
| 🔍 카공 필터 검색 | 콘센트·와이파이·조용함·24시간·시간제한없음 등 다중 AND 필터 |
| ➕ 카페 등록      | 3단계 폼 (기본정보 → 카공태그 → 사진 업로드)                |
| 📄 카페 상세      | 카공 태그, 사진 갤러리, 평균 별점, 후기 목록                |
| ⭐ 후기 & 별점    | 방문 기반 별점 + 카공 태그 + 후기 본문 작성                 |
| 🔖 즐겨찾기       | 자주 가는 카공 카페 북마크 (낙관적 업데이트)                |
| 👤 마이페이지     | 즐겨찾기 / 내가 등록한 카페 / 내 후기 관리                  |

### 카공 태그

| 태그             | 설명                                |
| ---------------- | ----------------------------------- |
| 🔌 콘센트 있음   | 노트북 충전 가능한 콘센트 자리 있음 |
| 📶 와이파이 있음 | 와이파이 제공                       |
| 🤫 조용함        | 대화 소음이 적고 집중하기 좋음      |
| 🌙 24시간        | 24시간 운영                         |
| ⏰ 시간제한없음  | 별도 시간 제한 없음                 |
| 💻 노트북 허용   | 노트북 사용 환영                    |
| 🪑 혼잡도 낮음   | 자리 잡기 쉽고 여유 있음            |

---

## 기술 스택

| 레이어          | 기술                               |
| --------------- | ---------------------------------- |
| Frontend        | Next.js 16 (App Router)            |
| Styling         | Tailwind CSS                       |
| 지도            | 네이버 지도 API                    |
| Backend & Auth  | Supabase (PostgreSQL + Auth + RLS) |
| 이미지 스토리지 | Supabase Storage                   |
| 배포            | Vercel                             |

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- Supabase 프로젝트
- 네이버 지도 API 키

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 값을 입력합니다.

```bash
NEXTAUTH_URL=your_domain
NEXTAUTH_SECRET=your_secret

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
NAVER_MAP_CLIENT_SECRET=your_naver_map_client_secret

KAKAO_REST_API_KEY=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_IMAGES_API_TOKEN=your_cloudflare_images_api_token
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다.

### DB 마이그레이션

Supabase 대시보드 SQL 에디터에서 `docs/DB_SCHEMA.md`의 SQL을 순서대로 실행합니다.

---

## 폴더 구조

```
kagongmap/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx            # 메인 지도 (/)
│   ├── cafes/
│   │   ├── [id]/page.tsx   # 카페 상세 (/cafes/:id)
│   │   ├── [id]/review/    # 후기 작성 [AUTH]
│   │   └── new/page.tsx    # 카페 등록 [AUTH]
│   ├── mypage/page.tsx     # 마이페이지 [AUTH]
│   └── login/page.tsx      # 로그인
├── components/
│   ├── layout/             # GNB, Footer 등 레이아웃
│   ├── map/                # NaverMap, CafeMarker, FilterBar
│   ├── cafe/               # CafeCard, CafeForm, TagSelector
│   ├── review/             # ReviewCard, RatingInput
│   └── ui/                 # Button, Modal, Toast 등 공통 UI
├── hooks/                  # Custom React Hooks
├── lib/                    # Supabase 클라이언트, 유틸 함수
├── types/                  # TypeScript 타입 정의
└── docs/                   # 프로젝트 문서
```

---

## 인증 정책

**"보는 건 자유, 참여는 로그인"**

- **비로그인 가능**: 지도 탐색, 카페 상세 열람, 후기 읽기, 필터 검색
- **로그인 필요**: 카페 등록, 후기 작성, 즐겨찾기, 마이페이지
- 비로그인 상태에서 인증 필요 기능 클릭 시 → `AuthGate` 모달 표시 (페이지 이동 없음)
- 소셜 로그인: Google OAuth (Supabase Auth)

---

## 문서

| 문서                                           | 설명                         |
| ---------------------------------------------- | ---------------------------- |
| [`docs/PRD.md`](docs/PRD.md)                   | 기능 상세 명세               |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | 컴포넌트 트리 & 페이지 구조  |
| [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md)       | Supabase 테이블 스키마 & SQL |
| [`docs/MILESTONES.md`](docs/MILESTONES.md)     | 주차별 개발 목표             |
