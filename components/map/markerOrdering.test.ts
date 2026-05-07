import { describe, expect, it } from "vitest";
import { orderCafesForCluster } from "./markerOrdering";

const cafe = (id: string) => ({ id });

describe("orderCafesForCluster", () => {
  it("선택/호버 없으면 입력 그대로 반환 (no-op fast path)", () => {
    // 잡는 결함: 항상 sort/partition 돌려서 새 배열을 만드는 구현 (불필요한 작업)
    const cafes = ["a", "b", "c"].map(cafe);
    expect(orderCafesForCluster(cafes, null, null)).toEqual(cafes);
  });

  it("active를 앞으로 이동시키고, 두 그룹 모두 cafes 입력 순서를 보존한다", () => {
    // 잡는 결함:
    //  1) active group의 순서를 selectedId/hoveredId 인자 순서로 결정하는 실수
    //     (예: [d, b, a, c, e] — 의도와 다름)
    //  2) inactive 그룹이 입력 순서를 잃는 실수 (예: 정렬·역순 등)
    //  3) selectedId 또는 hoveredId 중 한쪽만 처리하는 실수 (예: && 대신 ||)
    const cafes = ["a", "b", "c", "d", "e"].map(cafe);
    expect(orderCafesForCluster(cafes, "d", "b")).toEqual([
      cafes[1],
      cafes[3], // active: b, d (cafes 입력 순서 그대로)
      cafes[0],
      cafes[2],
      cafes[4], // inactive: a, c, e
    ]);
  });

  it("selectedId === hoveredId여도 중복으로 push하지 않는다", () => {
    // 잡는 결함: `if (=== selectedId) push; if (=== hoveredId) push;` 식으로
    // 리팩토링하면 같은 카페가 두 번 들어가 길이가 늘어남
    const cafes = ["a", "b", "c"].map(cafe);
    const result = orderCafesForCluster(cafes, "b", "b");
    expect(result).toHaveLength(3);
    expect(result).toEqual([cafes[1], cafes[0], cafes[2]]);
  });

  it("입력 배열을 mutate하지 않는다", () => {
    // 잡는 결함: cafes.sort((a, b) => ...) 같은 in-place 변형으로 "최적화"하는 실수
    const cafes = ["a", "b", "c"].map(cafe);
    const snapshot = [...cafes];
    orderCafesForCluster(cafes, "b", null);
    expect(cafes).toEqual(snapshot);
  });
});
