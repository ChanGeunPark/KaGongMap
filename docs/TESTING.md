# 테스트 기록

카공맵에 작성한 테스트 코드와 그 이유.

## 한눈에

- 테스트 **11개** (`markerOrdering` 4 + `scoring` 7)
- **Vitest 4** + **Node 22 LTS**
- 전부 **순수 함수** — 30ms 안에 끝남
- DB · 네이버 지도 · React 컴포넌트는 일부러 안 씀 (사유는 아래)

## 환경


| 항목         | 설정                                                 |
| ---------- | -------------------------------------------------- |
| 러너         | Vitest 4                                           |
| Node       | 20.12+ 필요. 카공맵은 22 LTS                             |
| 환경         | `node` (jsdom 미사용)                                 |
| Path alias | `@/`* 매핑 ([vitest.config.ts](../vitest.config.ts)) |
| Watch 모드   | `npm test`                                         |
| 1회 실행      | `npm run test:run`                                 |


---

## 1. `markerOrdering.test.ts` (4개)

테스트 대상: [orderCafesForCluster](../components/map/markerOrdering.ts)

**무엇을 하는 함수**
지도 마커들을 active(선택/호버)와 inactive로 나눠서 active를 앞으로 보내는 stable partition.

**왜 테스트했나**
이 함수의 정렬 로직을 직전에 **O(n² log n) → O(n)** 으로 최적화함. 다음에 누가 또 손대면 회귀가 일어날 가능성이 큼.

### 테스트 목록

```ts
it("선택/호버 없으면 입력 그대로 반환 (no-op fast path)", ...)
it("active를 앞으로 이동, 두 그룹 모두 cafes 순서 보존", ...)
it("selectedId === hoveredId여도 중복 push 안 함", ...)
it("입력 배열 mutate 안 함", ...)
```

### 각 테스트가 잡는 결함


| 테스트                | 어떤 실수를 잡는가                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| no-op fast path    | 항상 sort/copy 돌리는 비효율 구현                                                                            |
| active 앞으로 + 순서 보존 | 한 테스트로 3종 결함 동시 검증 — ① active 그룹을 selectedId 인자 순으로 잡는 실수, ② OR을 AND로 바꿔 한쪽만 처리, ③ inactive 순서가 깨짐 |
| 중복 push 안 함        | OR 대신 `if + if`로 리팩토링하는 함정                                                                         |
| mutate 안 함         | `cafes.sort()` 같은 in-place 변형 실수                                                                   |


### 9개 → 4개로 줄인 과정

처음엔 9개 작성. 다시 보니 5개는 무가치:

- 빈 배열, 존재하지 않는 ID 같은 케이스 — JS가 알아서 처리, 깨질 수가 없음
- `selectedId만` / `hoveredId만` — 거의 대칭이라 한 테스트로 통합 가능
- "stable 정렬" — 다른 테스트에 흡수됨

거름망: **각 테스트가 서로 다른 실제 버그를 잡는가?**

---

## 2. `scoring.test.ts` (7개)

테스트 대상: [getScore, getScoreTier](../lib/scoring.ts)

**무엇을 하는 함수**

- `getScore(tags, dim)` — 카페 태그를 카공/데이트/대화 차원의 점수로 환산
- `getScoreTier(score, dim)` — 점수를 high/mid/low 등급으로 분류

**왜 테스트했나**
`WEIGHTS` 객체와 `TIER_THRESHOLDS`에 서비스 핵심 의도가 박혀 있음. "콘센트=카공", "자연채광=데이트" 같은 의미가 숫자로 표현돼 있어서, 누가 일괄 변경하면 의도가 망가져도 눈치채기 어려움.

### `getScore` (4개)


| 테스트                                                                     | 어떤 실수를 잡는가                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| 빈 태그 → 0 (모든 차원)                                                        | NaN/undefined 반환, 차원 dispatch 실패                               |
| **카공 친화 태그** (콘센트·와이파이·노트북·조용함) → kagong **11**, date **2**, talk **0** | sum 로직 깨짐(`+= → =`), 차원 dispatch 실패, "콘센트=카공" 의도가 다른 차원으로 누설   |
| **데이트 친화 태그** (자연채광·야외테라스) → date **6**, kagong **1**, talk **4**       | 같은 의도를 반대 방향에서 잠금                                              |
| WEIGHTS에 없는 태그도 NaN 안 됨                                                 | `?? 0` fallback 누락. 시나리오: 새 `CafeTag` enum 추가했는데 일부 dim에 등록 누락 |


> **왜 두 방향 anchor를 다 두나**
> 카공 anchor만 잠그면 누가 데이트 가중치만 바꿔도 안 잡힘. 양쪽이 다 있어야 어느 차원이 망가져도 빨갛게 됨.

### `getScoreTier` (3개)


| 테스트                                                  | 어떤 실수를 잡는가                                   |
| ---------------------------------------------------- | -------------------------------------------- |
| kagong 임계값 inclusive (10→high, 5→mid)                | `>` vs `>=` 혼동                               |
| **점수 7이 차원별 다른 등급** kagong=mid, date=high, talk=high | `TIER_THRESHOLDS`를 한 dim 값으로 모든 dim에 쓰는 리팩토링 |
| 음수 점수 → low                                          | 음수 가중치 도입 시 fallback 누락                      |


> **점수 7로 고른 이유**
> 임계값(kagong=10, date=7, talk=6)을 한 숫자로 동시 검증할 수 있는 절묘한 값.

---

## 안 쓴 영역과 그 이유


| 영역                                            | 이유                                 |
| --------------------------------------------- | ---------------------------------- |
| `MapCanvas` · `useNaverMap` · `useUserMarker` | `naver.maps` 전역 mock 비용이 본문보다 큼    |
| API route (`app/api/`**)                      | DB·인증 mock 또는 테스트 DB 셋업이 필요한 별도 영역 |
| `Header` · `DetailInfo` 같은 순수 컴포넌트            | 분기가 단순해 React 동작 재시험에 가까움          |
| Snapshot 테스트                                  | 자동 생성 후 검토 안 됨, 버그까지 같이 잠금         |


---

## 픽스처는 작게

```ts
const cafe = (id: string) => ({ id });   // 이게 전부
```

`orderCafesForCluster`는 `cafe.id` 한 필드만 읽음. 다른 필드(name, lat, lng, tags...)는 픽스처에 넣지 않음.

**이유**

- 무관한 필드를 픽스처에 넣으면 "왜 이 결과가 맞는지" 의도가 노이즈에 묻힘
- 단위 테스트의 핵심은 **격리(isolation)** — 함수가 의존하는 것만 픽스처에

`scoring.test.ts`도 같은 원칙: `CafeTag` enum 값만 명시, 카페 객체 모양은 안 만듦.

여러 필드를 동시에 읽는 함수(`useFilteredCafes` 등)에서는 나중에 `makeCafe(id, overrides)` 같은 factory를 만들 예정.

---

## 테스트가 잡아준 실제 버그: 호버 시 z-index

`markerOrdering` 테스트를 쓰면서 함수 동작을 명시화하는 과정에서 발견한 버그.

### 증상

호버한 마커가 위로 와야 하는데 다른 마커들 뒤로 내려감.

### 원인

[CafeMarkerClusterer.redraw()](../components/map/CafeMarkerClusterer.ts)의 `setMap()` 호출 순서 = DOM 페인팅 순서.
partition이 `[active, inactive]`를 반환하니 active가 먼저 그려지고 → inactive가 그 위에 그려져서 가림.

### 해결: 책임 분리

z-index를 결정하는 데 **두 가지 메커니즘**이 동시에 쓰이고 있어서 충돌. 분리:


| 무엇을 보장                      | 어떤 메커니즘                           |
| --------------------------- | --------------------------------- |
| 클러스터러의 30개 표시 한도에 active 포함 | **partition** 유지 (active를 배열 앞에)  |
| 호버한 마커가 시각적으로 위에 보임         | `**marker.setZIndex(100)`** 명시 호출 |


[useUserMarker](../hooks/useUserMarker.ts)가 사용자 마커에 `zIndex: 100`을 쓰는 것과 같은 패턴.

테스트가 단순 검증을 넘어 **숨어 있던 결합을 드러내고 설계를 개선하게 만든 사례**.

---

