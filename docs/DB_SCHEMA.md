# 카공맵 — Supabase DB 스키마

> PostgreSQL (Supabase). RLS(Row Level Security) 활성화 필수.

---

## 테이블 목록

| 테이블                    | 설명                                                       |
| ------------------------- | ---------------------------------------------------------- |
| `users`                   | 사용자 프로필 (NextAuth → Supabase users 동기화)           |
| `account_deletion_feedback` | 회원 탈퇴 사유 피드백 (탈퇴 후 user_id는 NULL 처리)       |
| `cafes`                   | 어드민이 승인한 카페 (지도에 표시). `user_id`는 등록자(승인 시 제보자에서 복사) |
| `cafe_tags`               | 카페별 카공 태그 (다대다)                                  |
| `cafe_submissions`        | 사용자 카페 제보. 승인 시 cafes로 이동(행 삭제), 거절 시 status='rejected'로 보존 |
| `cafe_image_submissions`  | 기존 카페 추가 이미지 제보 (승인 시 cafes.images에 append) |
| `cafe_edit_submissions`   | 기존 카페 정보 수정 제안 (로그인 전용, 승인 시 cafes 갱신) |
| `cafe_likes`              | 카페 좋아요 (로그인 유저 기록 — 익명 좋아요는 카운트만)    |
| `reviews`                 | 카페 후기 (텍스트 전용)                                    |
| `review_reports`          | 후기 신고 (pending 3개 이상 시 클라 자동 숨김)             |
| `cafe_reports`            | 카페 자체 신고 (사진 문제·폐업·정보 오류·중복 등)          |
| `contact_inquiries`       | 사용자 문의 (운영자 확인 여부와 처리 상태 관리)            |
| `bookmarks`               | 즐겨찾기 (로그인 필요)                                     |
| `fcm_tokens`              | 디바이스별 FCM 푸시 토큰 (스키마는 `docs/PUSH_NOTIFICATIONS.md`) |
| `posts`                   | 카공 팁 게시글 (V2, 스키마만 정의 — 운영 미사용)            |

---

## 데이터 흐름

### 신규 카페 제보

```
사용자 카페 제보 (로그인 시 user_id = NextAuth OAuth ID)
      ↓
cafe_submissions (status: 'pending')
      ↓ 어드민 페이지에서 "승인" 클릭
      ↓ POST /api/admin/submissions/[id]/approve
      ↓   1. UPDATE status → 'approved'
      ↓   2. 트리거(on_submission_approved) 자동 실행
      ↓      → users.user_id(TEXT)를 users.id(UUID)로 lookup
      ↓      → cafes + cafe_tags INSERT (cafes.user_id에 등록자 보관)
      ↓   3. DELETE cafe_submissions 행 (cafes와 데이터 중복 방지)
cafes 테이블에 영구 저장 — 등록자 활동 카운트는 cafes.user_id 기준
      ↓
cafe_markers 뷰 (Tier 1) → 지도 전체 핀 표시
cafe_detail 뷰  (Tier 2) → 핀 클릭 시 상세 로딩

거절 시: DELETE /api/admin/submissions/[id]
      → UPDATE status → 'rejected' (행 보존, 사용자에게 반려 이력 표시 가능)
```

### 추가 이미지 제보 (기존 카페)

```
사용자 사진 제보 (카페 상세 모달 → ImageSubmitModal)
      ↓
Cloudflare Images 업로드 → image id 반환
      ↓
cafe_image_submissions (status: 'pending')
      ↓ 어드민 페이지 "사진 제보" 탭에서 "승인" 클릭
      ↓ POST /api/admin/image-submissions/[id]/approve
      ↓   1. UPDATE status → 'approved'
      ↓   2. 트리거(on_image_submission_approved) → cafes.images 배열에 append
      ↓   3. DELETE cafe_image_submissions 행 (cafes.images와 데이터 중복 방지)
cafes.images 갱신 → 카페 상세에 즉시 반영

거절 시: UPDATE status → 'rejected' (행 보존)
```

### 등록된 카페 삭제 (어드민)

```
어드민 페이지 "등록됨" 탭 → "🗑 삭제" 클릭 → confirm
      ↓
DELETE /api/admin/cafes/[id]
      ↓ DELETE FROM cafes WHERE id = ?
      ↓ ON DELETE CASCADE → cafe_tags / cafe_likes / reviews / bookmarks 자동 정리
지도/상세에서 즉시 사라짐
```

### 카페 좋아요

비로그인도 좋아요 가능. 카운트는 `cafes.like_count`에 캐시 컬럼으로 저장하고, "누가 좋아요 했는가"는 로그인 유저만 `cafe_likes` 행으로 영속.

```
[비로그인] 하트 클릭
      ↓ POST /api/likes/[cafeId]
      ↓ rpc('bump_cafe_like_count', {p_cafe_id, p_delta: 1})
      ↓ cafes.like_count += 1
      ↓ localStorage.kagongmap.likedCafeIds에 cafeId 추가 (UI 빨간 하트 유지용)

[비로그인] 다시 클릭(해제)
      ↓ DELETE /api/likes/[cafeId]
      ↓ rpc('bump_cafe_like_count', {p_cafe_id, p_delta: -1})
      ↓ localStorage에서 제거

[로그인 상태] 하트 클릭
      ↓ POST /api/likes/[cafeId]
      ↓ INSERT INTO cafe_likes(user_id, cafe_id) ON CONFLICT DO NOTHING
      ↓ 트리거(cafe_likes_count_sync)가 cafes.like_count += 1
      ↓ 다른 기기에서도 빨간 하트 유지

[로그인 직후] localStorage → cafe_likes 머지
      ↓ POST /api/likes  body: { cafeIds: [...] }
      ↓ rpc('merge_anonymous_likes', {p_user_id, p_cafe_ids})
      ↓ INSERT cafe_likes (ON CONFLICT DO NOTHING)
      ↓ 트리거가 새 INSERT마다 +1 했으므로, 익명 단계에서 이미 +1 된 것을 보정해 -1
      ↓ localStorage 비우기
```

---

## Enum 타입

```sql
CREATE TYPE cafe_tag AS ENUM (
  '콘센트_있음',
  '와이파이_있음',
  '조용함',
  '24시간',
  '시간제한없음',
  '노트북_허용',
  '혼잡도_낮음',
  '늦은영업',
  '가성비_좋음',
  '자연채광',
  '야외테라스',
  '반려동물_가능',
  '주차_가능'
);

-- 기존 운영 환경에는 다음 마이그레이션으로 추가:
-- ALTER TYPE cafe_tag ADD VALUE '주차_가능';

CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
```

---

## 테이블 스키마

### users

NextAuth 기반이라 Supabase Auth 트리거를 쓰지 않는다. 첫 로그인 시 클라이언트의 `useBootstrapDbUser` 가 `POST /api/users` 로 upsert 한다. `id`(UUID)는 Supabase 내부 PK, `user_id`(TEXT)는 NextAuth `account.providerAccountId` (= `session.user.id`).

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL UNIQUE,             -- NextAuth OAuth provider account id
  nickname    TEXT NOT NULL,                    -- lib/randomNickname.ts 로 자동 생성, 마이페이지에서 변경 가능
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_user_id ON users (user_id);
```

> 트리거 없음. `auth.users` 와 무관 (Supabase Auth 미사용).

### account_deletion_feedback

회원 탈퇴 사유 피드백. 탈퇴 처리 직전에 저장하고, `users` 행 삭제 시 `user_id`는 `NULL`로 남겨 개인 식별자를 제거한다. 탈퇴 기능 자체는 피드백 저장 실패로 막지 않는다.

```sql
CREATE TABLE account_deletion_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL,                         -- not_useful/missing_features/privacy_concern/too_many_notifications/using_other_service/temporary/other
  detail      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT account_deletion_feedback_reason_check CHECK (
    reason IN (
      'not_useful',
      'missing_features',
      'privacy_concern',
      'too_many_notifications',
      'using_other_service',
      'temporary',
      'other'
    )
  )
);

CREATE INDEX idx_account_deletion_feedback_created_at
ON account_deletion_feedback (created_at DESC);

CREATE INDEX idx_account_deletion_feedback_reason
ON account_deletion_feedback (reason);

ALTER TABLE account_deletion_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage account deletion feedback"
ON account_deletion_feedback
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### contact_inquiries

사용자 문의. 비로그인도 문의 가능하며, 로그인 상태라면 `user_id`를 함께 저장한다. 운영자는 `/admin`의 "문의" 탭에서 `pending`(읽지 않음), `read`(확인함), `resolved`(처리 완료) 상태를 관리한다.

```sql
CREATE TABLE contact_inquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  category     TEXT NOT NULL,                         -- service/report/account/privacy/other
  email        TEXT NOT NULL,                         -- 답변 받을 이메일
  content      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',       -- pending/read/resolved
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at      TIMESTAMPTZ,
  resolved_at  TIMESTAMPTZ,
  CONSTRAINT contact_inquiries_category_check CHECK (
    category IN ('service','report','account','privacy','other')
  ),
  CONSTRAINT contact_inquiries_status_check CHECK (
    status IN ('pending','read','resolved')
  )
);

CREATE INDEX idx_contact_inquiries_status
ON contact_inquiries (status);

CREATE INDEX idx_contact_inquiries_created_at
ON contact_inquiries (created_at DESC);

CREATE INDEX idx_contact_inquiries_user_id
ON contact_inquiries (user_id);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact inquiries"
ON contact_inquiries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### cafes

어드민이 승인한 카페만 저장. INSERT는 트리거(`handle_submission_approved`)를 통해서만, DELETE는 어드민 페이지의 "🗑 삭제" 버튼([app/api/admin/cafes/[id]/route.ts](../app/api/admin/cafes/[id]/route.ts))을 통해서만 발생.

```sql
CREATE TABLE cafes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  address          TEXT NOT NULL,
  lat              FLOAT8 NOT NULL,
  lng              FLOAT8 NOT NULL,
  hours            TEXT,
  min_order_amount INTEGER,
  images           TEXT[] DEFAULT '{}',
  description      TEXT,
  like_count       INT NOT NULL DEFAULT 0,                          -- cafe_likes 트리거 + 익명 RPC가 자동 동기
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cafes_location ON cafes (lat, lng);
CREATE INDEX idx_cafes_user_id  ON cafes (user_id);
```

> `avg_rating`은 더 이상 저장하지 않는다. "적합도"는 `cafe_tags`에 차원별 가중치를 곱해 합산한 점수로 클라이언트에서 산출 (`lib/scoring.ts`). 차원: `kagong | date | talk`. 카공 차원 임계값은 점수 10+ 우수, 5+ 양호, 4 이하 정보 부족.

### cafe_tags

```sql
CREATE TABLE cafe_tags (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id  UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  tag      cafe_tag NOT NULL,
  UNIQUE (cafe_id, tag)
);

CREATE INDEX idx_cafe_tags_cafe_id ON cafe_tags (cafe_id);
CREATE INDEX idx_cafe_tags_tag     ON cafe_tags (tag);
```

### cafe_submissions

누구나 카페를 제보할 수 있음(비로그인 시 `user_id` NULL). 승인 시 트리거가 `cafes` + `cafe_tags`에 자동 삽입하고 **API가 행을 삭제**해 `cafes`와의 데이터 중복을 방지한다. 거절 시에는 `status='rejected'`로만 업데이트해 사용자별 반려 이력을 남긴다. 승인된 제보의 등록자 활동 카운트는 `cafes.user_id` 기준으로 산출.

```sql
CREATE TABLE cafe_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT,                                              -- NextAuth OAuth ID (users.user_id와 동일 포맷). 비로그인 시 NULL
  name             TEXT NOT NULL,
  address          TEXT NOT NULL,
  lat              FLOAT8 NOT NULL,
  lng              FLOAT8 NOT NULL,
  hours            TEXT,
  min_order_amount INTEGER,
  images           TEXT[] DEFAULT '{}',
  description      TEXT,
  tags             cafe_tag[] DEFAULT '{}',
  status           submission_status NOT NULL DEFAULT 'pending',
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ
);

CREATE INDEX idx_submissions_status  ON cafe_submissions (status);
CREATE INDEX idx_submissions_user_id ON cafe_submissions (user_id);
```

#### 승인 트리거

승인 시 `cafes` + `cafe_tags`에 INSERT. `user_id`(TEXT)를 `users.id`(UUID)로 lookup해 `cafes.user_id`에 복사한다. 어드민 라우트는 더 이상 행을 삭제하지 않으며, `pending`/`approved`/`rejected` 모두 누적된다.

```sql
CREATE OR REPLACE FUNCTION handle_submission_approved()
RETURNS TRIGGER AS $$
DECLARE
  new_cafe_id      UUID;
  resolved_user_id UUID;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN

    IF NEW.user_id IS NOT NULL THEN
      SELECT id INTO resolved_user_id FROM users WHERE user_id = NEW.user_id;
    END IF;

    INSERT INTO cafes (user_id, name, address, lat, lng, hours, min_order_amount, images, description)
    VALUES (resolved_user_id, NEW.name, NEW.address, NEW.lat, NEW.lng, NEW.hours, NEW.min_order_amount, NEW.images, NEW.description)
    RETURNING id INTO new_cafe_id;

    INSERT INTO cafe_tags (cafe_id, tag)
    SELECT new_cafe_id, unnest(NEW.tags);

    NEW.reviewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_submission_approved
  BEFORE UPDATE ON cafe_submissions
  FOR EACH ROW EXECUTE FUNCTION handle_submission_approved();
```

### cafe_image_submissions

기존 카페에 추가 이미지를 제보. **비로그인도 제보 가능** (로그인 시 `user_id` 기록). 승인 시 `cafes.images` 배열에 append.

```sql
CREATE TABLE cafe_image_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id      UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id      TEXT,                                              -- NextAuth OAuth ID (users.user_id와 동일 포맷). 비로그인 시 NULL
  images       TEXT[] NOT NULL DEFAULT '{}',
  caption      TEXT,
  status       submission_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

CREATE INDEX idx_image_submissions_cafe_id ON cafe_image_submissions (cafe_id);
CREATE INDEX idx_image_submissions_status  ON cafe_image_submissions (status);
```

#### 승인 트리거

승인 시 `cafes.images` 배열에 새 이미지 ID들을 append. **행 삭제는 API에서 처리** ([app/api/admin/image-submissions/[id]/approve/route.ts](../app/api/admin/image-submissions/[id]/approve/route.ts)).

```sql
CREATE OR REPLACE FUNCTION handle_image_submission_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE cafes
    SET images = COALESCE(images, '{}') || NEW.images
    WHERE id = NEW.cafe_id;

    NEW.reviewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_image_submission_approved
  BEFORE UPDATE ON cafe_image_submissions
  FOR EACH ROW EXECUTE FUNCTION handle_image_submission_approved();
```

### cafe_edit_submissions

기존 카페 정보 수정 제안. **로그인 전용** (`user_id NOT NULL`). 승인 시 어드민 라우트가 `cafes` 컬럼을 직접 UPDATE 하고 `cafe_tags` 를 재구성한다 (자동 트리거가 아닌 명시적 API: `/api/admin/edit-submissions/[id]/approve`).

```sql
CREATE TABLE cafe_edit_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id          UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id          TEXT NOT NULL,                                 -- NextAuth OAuth ID (users.user_id)
  name             TEXT NOT NULL,
  address          TEXT NOT NULL,
  lat              FLOAT8 NOT NULL,
  lng              FLOAT8 NOT NULL,
  hours            TEXT,
  min_order_amount INTEGER,
  description      TEXT,
  tags             cafe_tag[] DEFAULT '{}',
  status           submission_status NOT NULL DEFAULT 'pending',
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ
);

CREATE INDEX idx_edit_submissions_cafe   ON cafe_edit_submissions (cafe_id);
CREATE INDEX idx_edit_submissions_status ON cafe_edit_submissions (status);
```

### cafe_likes

로그인 유저의 좋아요 영속 저장. **비로그인 좋아요는 이 테이블에 행을 만들지 않고** `bump_cafe_like_count` RPC로 `cafes.like_count`만 +1/-1 한다 (UI 상 어떤 카페를 눌렀는지는 `localStorage.kagongmap.likedCafeIds`에 저장 → 로그인 시 `merge_anonymous_likes`로 합집합 머지).

```sql
CREATE TABLE cafe_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id    UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, cafe_id)
);

CREATE INDEX idx_cafe_likes_user ON cafe_likes (user_id);
CREATE INDEX idx_cafe_likes_cafe ON cafe_likes (cafe_id);
```

#### like_count 동기 트리거

```sql
CREATE OR REPLACE FUNCTION sync_cafe_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cafes SET like_count = like_count + 1 WHERE id = NEW.cafe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cafes SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.cafe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER cafe_likes_count_sync
AFTER INSERT OR DELETE ON cafe_likes
FOR EACH ROW EXECUTE FUNCTION sync_cafe_like_count();
```

#### RPC

```sql
-- 익명 +1 / -1 (원자적). 비로그인 좋아요 토글에 사용.
CREATE OR REPLACE FUNCTION bump_cafe_like_count(p_cafe_id UUID, p_delta INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE cafes
  SET like_count = GREATEST(like_count + p_delta, 0)
  WHERE id = p_cafe_id;
END;
$$;

-- 로그인 직후 localStorage 좋아요를 cafe_likes로 합치는 머지.
-- 트리거가 INSERT마다 +1 하지만 익명 시점에 이미 +1 됐으므로 보정 -1.
CREATE OR REPLACE FUNCTION merge_anonymous_likes(p_user_id UUID, p_cafe_ids UUID[])
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inserted_ids UUID[];
BEGIN
  WITH ins AS (
    INSERT INTO cafe_likes (user_id, cafe_id)
    SELECT p_user_id, unnest(p_cafe_ids)
    ON CONFLICT (user_id, cafe_id) DO NOTHING
    RETURNING cafe_id
  )
  SELECT array_agg(cafe_id) INTO v_inserted_ids FROM ins;

  IF v_inserted_ids IS NOT NULL THEN
    UPDATE cafes
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = ANY(v_inserted_ids);
  END IF;
END;
$$;
```

### reviews

별점 없는 텍스트 후기. **비로그인도 작성 가능** — 닉네임(자유 입력) + 4자리 PIN을 받아 `password_hash`(scrypt)로 저장. 자기 글 삭제 시 PIN 검증. 로그인 유저는 `users.nickname`을 그대로 닉네임 컬럼에 스냅샷으로 저장(이후 닉네임 바꿔도 과거 후기엔 영향 없음). 한 유저가 같은 카페에 여러 번 작성 가능 (UNIQUE 없음).

```sql
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id       UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,   -- 비로그인 후기는 NULL
  nickname      TEXT NOT NULL,                                  -- 작성 시점 닉네임 스냅샷
  password_hash TEXT,                                           -- 비로그인 4자리 PIN scrypt 해시 (salt:hash hex)
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reviews_owner_check CHECK (
    (user_id IS NOT NULL AND password_hash IS NULL) OR
    (user_id IS NULL AND password_hash IS NOT NULL)
  )
);

CREATE INDEX idx_reviews_cafe_id_created ON reviews (cafe_id, created_at DESC);
```

### review_reports

후기 신고. **누구나(비로그인 포함) 신고 가능**, 본인이 작성한 후기는 차단(로그인 본인 매칭 시). 같은 후기에 pending 신고가 3개 이상이면 공개 GET에서 자동 숨김(어드민에서는 그대로 노출). 어드민이 처리 시 단건 dismiss / 후기 삭제(CASCADE) 두 가지.

```sql
CREATE TABLE review_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id  UUID REFERENCES users(id) ON DELETE SET NULL,    -- 비로그인 신고는 NULL
  reason       TEXT NOT NULL,                                    -- spam/abuse/inappropriate/irrelevant/other
  detail       TEXT,                                             -- 자유 입력 (other는 필수)
  status       TEXT NOT NULL DEFAULT 'pending',                  -- pending/dismissed/resolved
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT review_reports_reason_check CHECK (
    reason IN ('spam','abuse','inappropriate','irrelevant','other')
  ),
  CONSTRAINT review_reports_status_check CHECK (
    status IN ('pending','dismissed','resolved')
  )
);

CREATE INDEX idx_review_reports_review ON review_reports (review_id);
CREATE INDEX idx_review_reports_status ON review_reports (status);
```

### cafe_reports

카페 자체 신고. **누구나(비로그인 포함) 신고 가능**, 본인이 등록한 카페는 차단(로그인 본인 매칭 시). 사진 문제, 폐업/가게 없어짐, 정보 오류, 부적절한 장소, 중복 등록 등을 어드민이 검토한다.

```sql
CREATE TABLE cafe_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id      UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  reporter_id  UUID REFERENCES users(id) ON DELETE SET NULL,    -- 비로그인 신고는 NULL
  reason       TEXT NOT NULL,                                    -- photo_issue/closed/wrong_info/inappropriate_place/duplicate/other
  detail       TEXT,                                             -- 자유 입력 (other는 필수)
  status       TEXT NOT NULL DEFAULT 'pending',                  -- pending/dismissed/resolved
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cafe_reports_reason_check CHECK (
    reason IN ('photo_issue','closed','wrong_info','inappropriate_place','duplicate','other')
  ),
  CONSTRAINT cafe_reports_status_check CHECK (
    status IN ('pending','dismissed','resolved')
  )
);

CREATE INDEX idx_cafe_reports_cafe ON cafe_reports (cafe_id);
CREATE INDEX idx_cafe_reports_status ON cafe_reports (status);
CREATE INDEX idx_cafe_reports_created_at ON cafe_reports (created_at DESC);

ALTER TABLE cafe_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create cafe reports"
ON cafe_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND reporter_id IS NULL
);

CREATE POLICY "Admins can manage cafe reports"
ON cafe_reports
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

#### 후기 신고 처리 흐름

```
[사용자] 후기 신고 → POST /api/reviews/[id]/reports
                       ↓ (본인 글이면 403 차단)
                       review_reports INSERT (status='pending')

[클라] 후기 GET → /api/cafes/[id]/reviews
                  ↓ pending 신고 3건 이상 후기는 응답에서 제외 (자동 숨김)

[어드민] /admin → "후기 신고" 탭
   ├ 후기 단위로 그룹핑 (pending_count + reasons[])
   ├ 전체 무시 → 모든 pending 신고 → 'dismissed' (후기 다시 노출됨)
   └ 후기 삭제 → DELETE /api/admin/reviews/[id] → CASCADE로 reports도 정리
```

#### 카페 신고 처리 흐름

```
[사용자] 카페 신고 → POST /api/cafes/[id]/reports
                       ↓ (본인 등록 카페면 403 차단)
                       cafe_reports INSERT (status='pending')

[어드민] /admin → "카페 신고" 탭
   ├ 전체 무시 → 모든 pending 신고 → 'dismissed'
   ├ 처리 완료 → 모든 pending 신고 → 'resolved'
   └ 카페 삭제 → DELETE /api/admin/cafes/[id] → CASCADE로 reports도 정리
```

#### 닉네임 정책

- **users.nickname**: 가입 시 `lib/randomNickname.ts`의 베이스 10개 + 4자리 숫자 suffix로 자동 생성 (예: `카공러_4729`). `/mypage`에서 변경 가능 (PATCH `/api/users/me/nickname`).
- **reviews.nickname**: 작성 시점 닉네임을 스냅샷으로 저장. 닉네임 바꿔도 과거 후기는 그대로.

### bookmarks

```sql
CREATE TABLE bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id    UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cafe_id, user_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks (user_id);
```

### posts (V2)

```sql
CREATE TABLE posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cafe_id    UUID REFERENCES cafes(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## RLS 정책

### users

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);
```

### cafes

어드민만 직접 수정. 일반 사용자는 읽기 전용.

```sql
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cafes_select" ON cafes FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE: 트리거(service_role) 또는 어드민 대시보드에서만
```

### cafe_tags

```sql
ALTER TABLE cafe_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cafe_tags_select" ON cafe_tags FOR SELECT USING (true);
-- INSERT: 트리거(service_role)에서만
```

### cafe_submissions

```sql
ALTER TABLE cafe_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_select" ON cafe_submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert" ON cafe_submissions FOR INSERT WITH CHECK (true);
-- UPDATE(status 변경)/DELETE: 어드민 API(service_role)에서만
```

### cafe_image_submissions

```sql
ALTER TABLE cafe_image_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "image_submissions_select" ON cafe_image_submissions FOR SELECT USING (true);
CREATE POLICY "image_submissions_insert" ON cafe_image_submissions FOR INSERT WITH CHECK (true);
-- UPDATE/DELETE: 어드민 API(service_role)에서만
```

### cafe_edit_submissions

직접 접근 차단 — 사용자 측 INSERT 와 어드민 처리 모두 service_role API (`/api/cafes/[id]/edit-submissions`, `/api/admin/edit-submissions/*`) 경유.

```sql
ALTER TABLE cafe_edit_submissions ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = service_role API 전용
```

### cafe_likes

직접 접근 차단. 좋아요 토글/머지/조회는 모두 service_role 경유 API(`/api/likes/*`)에서만 처리.

```sql
ALTER TABLE cafe_likes ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = anon/authed 클라이언트는 직접 접근 불가
```

### reviews

직접 접근 차단 — service_role API(`/api/cafes/[id]/reviews`, `/api/reviews/[id]`)에서만 작성/삭제. 이렇게 해야 비로그인 PIN 검증 + 권한 검증을 서버에서 일관되게 강제.

```sql
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = anon/authed 클라이언트 직접 접근 불가
```

### review_reports

직접 접근 차단 — `/api/reviews/[id]/reports` (제출), `/api/admin/review-reports/*` (어드민)에서만 처리.

```sql
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = service_role API 전용
```

### bookmarks (로그인 필요)

```sql
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookmarks_select" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete" ON bookmarks FOR DELETE USING (auth.uid() = user_id);
```

---

## 뷰 (Views)

### Tier 1 — 지도 마커 (초기 로딩, 전체 핀)

```sql
CREATE OR REPLACE VIEW cafe_markers AS
SELECT
  c.id,
  c.name,
  c.lat,
  c.lng,
  c.min_order_amount,
  c.like_count,
  ARRAY_AGG(DISTINCT ct.tag) FILTER (WHERE ct.tag IS NOT NULL) AS tags
FROM cafes c
LEFT JOIN cafe_tags ct ON ct.cafe_id = c.id
GROUP BY c.id;
```

### Tier 2 — 카페 상세 (핀 클릭 시 온디맨드)

```sql
CREATE OR REPLACE VIEW cafe_detail AS
SELECT
  c.*,
  COUNT(r.id)                                                  AS review_count,
  ARRAY_AGG(DISTINCT ct.tag) FILTER (WHERE ct.tag IS NOT NULL) AS tags
FROM cafes c
LEFT JOIN reviews r    ON r.cafe_id  = c.id
LEFT JOIN cafe_tags ct ON ct.cafe_id = c.id
GROUP BY c.id;
```

---

## TypeScript 타입 (`types/db.ts` 참고)

| 타입                  | 대응 뷰/테이블            | 로딩 시점                 |
| --------------------- | ------------------------- | ------------------------- |
| `CafeMarker`          | `cafe_markers` 뷰         | 앱 초기 로딩 (전체)       |
| `CafeWithDetail`      | `cafe_detail` 뷰          | 핀 클릭 시 1건만 / 어드민 |
| `CafeSubmission`      | `cafe_submissions`        | 제보 폼 제출 시 / 어드민  |
| `CafeImageSubmission` | `cafe_image_submissions`  | 이미지 제보 / 어드민      |
| `CafeEditSubmission`  | `cafe_edit_submissions`   | 정보 수정 제안 / 어드민   |
| `DbReview`            | `reviews`                 | 카페 상세 후기 섹션       |
