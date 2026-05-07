/**
 * 카페 핀의 z-order를 결정하기 위한 안정 정렬(stable partition).
 *
 * 활성(선택 또는 호버) 카페를 앞으로, 나머지는 뒤로 보낸다.
 * 두 그룹 모두 입력 순서를 보존한다.
 *
 * - sort()를 쓰면 O(n log n)이지만 비교 정렬이 불필요한 문제 (단순 2-way partition)
 * - 한 번의 선형 순회로 O(n) 달성
 * - 제네릭이라 마커 타입에 의존하지 않고 테스트 가능
 */
export function orderCafesForCluster<T extends { id: string }>(
  cafes: T[],
  selectedId: string | null,
  hoveredId: string | null,
): T[] {
  const active: T[] = [];
  const inactive: T[] = [];

  for (const cafe of cafes) {
    const isActive = cafe.id === selectedId || cafe.id === hoveredId;
    (isActive ? active : inactive).push(cafe);
  }

  return [...active, ...inactive];
}
