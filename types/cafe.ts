export type HeroKind = "warm" | "cream" | "paper" | "dark";
export type SortBy = "score" | "distance" | "stars" | "reviews";
export type LayoutVariant = "sidebar" | "sheet" | "floating";
export type FilterVariant = "chips" | "dropdowns" | "bottomSheet";

export interface CafeLevels {
  power: number;
  wifi: number;
  quiet: number;
  space: number;
}

export interface Cafe {
  id: string;
  name: string;
  shortName: string; // 카페 이름 줄임
  neigh: string; // 카페 주소 줄임
  addr: string; // 카페 주소
  x: number;
  y: number;
  hours: string; // 카페 운영시간
  phone?: string;
  priceLevel: number; // 카페 가격 레벨
  avgPrice: string; // 카페 평균 가격
  capacity: number; // 카페 수용인원
  stars: number; // 카페 별점
  reviewCount: number; // 카페 리뷰 개수
  levels: CafeLevels;
  pros: string[]; // 카페 장점
  cons: string[];
  limits: string[]; // 카페 제한사항
  tags: string[]; // 카페 태그
  hero: HeroKind;
  peakHours: number[]; // 카페 피크 시간
  score: number;
}

export interface FilterItem {
  id: string;
  label: string;
  icon: string;
}

export interface MapTransform {
  x: number;
  y: number;
  s: number;
  animated: boolean;
}
