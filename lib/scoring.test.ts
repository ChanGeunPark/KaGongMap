import { describe, expect, it } from "vitest";
import type { CafeTag } from "@/types/db";
import { getScore, getScoreTier } from "./scoring";

describe("getScore", () => {
  it("빈 태그 배열은 모든 차원에서 0을 반환한다", () => {
    // 잡는 결함: 빈 입력에서 NaN/undefined 반환, 또는 차원 dispatch가 실패해 throw
    expect(getScore([], "kagong")).toBe(0);
    expect(getScore([], "date")).toBe(0);
    expect(getScore([], "talk")).toBe(0);
  });

  it("카공 친화 태그(콘센트·와이파이·노트북·조용함)는 kagong에서 가장 높다", () => {
    // 잡는 결함:
    //  1) 차원 dispatch 실패 — 모든 dim에 같은 가중치 적용
    //  2) sum 로직 깨짐 (예: += → =)
    //  3) "콘센트=카공"이라는 의도가 date/talk로 누설되는 가중치 변경
    const tags: CafeTag[] = [
      "콘센트_있음",
      "와이파이_있음",
      "노트북_허용",
      "조용함",
    ];
    expect(getScore(tags, "kagong")).toBe(3 + 3 + 3 + 2); // 11
    expect(getScore(tags, "date")).toBe(0 + 0 + 0 + 2); // 2
    expect(getScore(tags, "talk")).toBe(0 + 0 + 0 + 0); // 0
  });

  it("데이트 친화 태그(자연채광·야외테라스)는 date에서 가장 높다", () => {
    // 잡는 결함: date 가중치 변경 시 자연채광/야외테라스의 가치가 누락되는 회귀.
    // 위 테스트와 다른 방향(date 기준)에서 차원 분리 의도를 잠금.
    const tags: CafeTag[] = ["자연채광", "야외테라스"];
    expect(getScore(tags, "date")).toBe(3 + 3); // 6
    expect(getScore(tags, "kagong")).toBe(1 + 0); // 1
    expect(getScore(tags, "talk")).toBe(2 + 2); // 4
  });

  it("WEIGHTS에 등록되지 않은 태그는 NaN 없이 0으로 처리된다", () => {
    // 잡는 결함: `?? 0` fallback 제거 시 undefined가 합산되어 NaN 전파.
    // 시나리오: 새 CafeTag enum 값을 추가했는데 일부 dim의 WEIGHTS 객체 갱신 누락.
    const tags: CafeTag[] = [
      "콘센트_있음",
      "신규_태그_미등록" as CafeTag,
    ];
    expect(getScore(tags, "kagong")).toBe(3); // NaN 아님
  });
});

describe("getScoreTier", () => {
  it("kagong 임계값: 10 이상 high, 5 이상 mid, 그 미만 low (경계는 inclusive)", () => {
    // 잡는 결함: `>` vs `>=` 혼동으로 임계값 정확히 일치하는 점수가 잘못된 등급에 떨어짐
    expect(getScoreTier(10, "kagong")).toBe("high"); // 정확히 high 임계
    expect(getScoreTier(9, "kagong")).toBe("mid");
    expect(getScoreTier(5, "kagong")).toBe("mid"); // 정확히 mid 임계
    expect(getScoreTier(4, "kagong")).toBe("low");
  });

  it("같은 점수 7이 차원별로 다른 등급을 낸다 (임계값 분리 의도)", () => {
    // 잡는 결함: TIER_THRESHOLDS를 차원별로 안 보고 한 값을 모든 dim에 적용하는 리팩토링.
    // 점수 7: kagong에선 부족(high 임계 10), date/talk에선 충분(high 임계 7/6).
    expect(getScoreTier(7, "kagong")).toBe("mid");
    expect(getScoreTier(7, "date")).toBe("high");
    expect(getScoreTier(7, "talk")).toBe("high");
  });

  it("음수 점수는 low로 떨어진다", () => {
    // 잡는 결함: 향후 음수 가중치(예: 비카공 차감) 도입 시 분기 누락으로 undefined 반환
    expect(getScoreTier(-1, "kagong")).toBe("low");
    expect(getScoreTier(-100, "date")).toBe("low");
  });
});
