import type { CafeTag } from "@/types/db";

export type ScoreDimension = "kagong" | "date" | "talk";
export type ScoreTier = "high" | "mid" | "low";

// 차원별 태그 가중치. 합계가 점수.
// 가중치 조정은 이 객체만 수정하면 모든 화면에 반영됨.
const WEIGHTS: Record<ScoreDimension, Partial<Record<CafeTag, number>>> = {
  kagong: {
    콘센트_있음: 3,
    와이파이_있음: 3,
    노트북_허용: 3,
    조용함: 2,
    혼잡도_낮음: 2,
    시간제한없음: 2,
    "24시간": 2,
    늦은영업: 1,
    자연채광: 1,
    가성비_좋음: 1,
    주차_가능: 1,
    야외테라스: 0,
    반려동물_가능: 0,
  },
  date: {
    자연채광: 3,
    야외테라스: 3,
    조용함: 2,
    반려동물_가능: 2,
    주차_가능: 2,
    가성비_좋음: 1,
    혼잡도_낮음: 1,
    늦은영업: 1,
    "24시간": 0,
    시간제한없음: 0,
    콘센트_있음: 0,
    와이파이_있음: 0,
    노트북_허용: 0,
  },
  talk: {
    가성비_좋음: 2,
    야외테라스: 2,
    자연채광: 2,
    혼잡도_낮음: 2,
    시간제한없음: 1,
    주차_가능: 1,
    늦은영업: 1,
    "24시간": 1,
    반려동물_가능: 1,
    조용함: 0,
    콘센트_있음: 0,
    와이파이_있음: 0,
    노트북_허용: 0,
  },
};

// 차원별 등급 임계값. 가중치 조정 시 함께 점검.
const TIER_THRESHOLDS: Record<ScoreDimension, { high: number; mid: number }> = {
  kagong: { high: 10, mid: 5 },
  date: { high: 7, mid: 3 },
  talk: { high: 6, mid: 3 },
};

export function getScore(tags: CafeTag[], dim: ScoreDimension): number {
  const w = WEIGHTS[dim];
  let sum = 0;
  for (const t of tags) sum += w[t] ?? 0;
  return sum;
}

export function getScoreTier(score: number, dim: ScoreDimension): ScoreTier {
  const { high, mid } = TIER_THRESHOLDS[dim];
  if (score >= high) return "high";
  if (score >= mid) return "mid";
  return "low";
}

// 차원별 태그 기여도 (UI에서 "이 카페가 카공에 좋은 이유" 같은 표시용)
export function getTagContributions(tags: CafeTag[], dim: ScoreDimension) {
  const w = WEIGHTS[dim];
  return tags
    .map((t) => ({ tag: t, weight: w[t] ?? 0 }))
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}
