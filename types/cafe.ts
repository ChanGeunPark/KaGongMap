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
  shortName: string;
  neigh: string;
  addr: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  distance?: number;
  hours: string;
  phone?: string;
  priceLevel: number;
  avgPrice: string;
  capacity: number;
  stars: number;
  reviewCount: number;
  levels: CafeLevels;
  pros: string[];
  cons: string[];
  limits: string[];
  tags: string[];
  hero: HeroKind;
  peakHours: number[];
  score: number;
  verified?: boolean;
  trending?: string;
  openNow?: boolean;
  crowd?: number;
}

export interface Review {
  initials: string;
  name: string;
  avatarBg: string;
  stars: number;
  date: string;
  visits: number;
  text: string;
  tags: string[];
  badge?: string;
}

export interface FilterItem {
  id: string;
  label: string;
  icon: string;
}
