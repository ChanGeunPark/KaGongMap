import type { FilterItem } from "@/types/cafe";
import type { CafeTag } from "@/types/db";

// 카공 필터. id ↔ CafeTag 1:1 매칭. FILTER_TAG_MAP과 KG_FILTERS는 같은 키 셋을 공유.
export const FILTER_TAG_MAP: Record<string, CafeTag> = {
  power: "콘센트_있음",
  wifi: "와이파이_있음",
  quiet: "조용함",
  open24: "24시간",
  noLimit: "시간제한없음",
  notebook: "노트북_허용",
  space: "혼잡도_낮음",
  lateNight: "늦은영업",
  cheap: "가성비_좋음",
  naturalLight: "자연채광",
  terrace: "야외테라스",
  pet: "반려동물_가능",
};

export const KG_FILTERS: FilterItem[] = [
  { id: "power", label: "콘센트", icon: "plug" },
  { id: "wifi", label: "와이파이", icon: "wifi" },
  { id: "quiet", label: "조용함", icon: "volume" },
  { id: "open24", label: "24시간", icon: "clock" },
  { id: "noLimit", label: "시간제한 없음", icon: "info" },
  { id: "notebook", label: "노트북 허용", icon: "laptop" },
  { id: "space", label: "혼잡도 낮음", icon: "users" },
  { id: "lateNight", label: "늦은영업", icon: "clock" },
  { id: "cheap", label: "가성비", icon: "coin" },
  { id: "naturalLight", label: "자연채광", icon: "sparkle" },
  { id: "terrace", label: "야외테라스", icon: "trending" },
  { id: "pet", label: "반려동물", icon: "heart" },
];
