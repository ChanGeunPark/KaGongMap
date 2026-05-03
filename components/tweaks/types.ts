import { FilterVariant, LayoutVariant } from "@/types/cafe";

export interface Tweaks {
  layoutVariant: LayoutVariant;
  filterVariant: FilterVariant;
  cardDensity: "medium" | "low";
  pointColor: string;
}

export const DEFAULT_TWEAKS: Tweaks = {
  layoutVariant: "sidebar",
  filterVariant: "chips",
  cardDensity: "medium",
  pointColor: "#F5A524",
};

export const POINT_COLORS = [
  "#F5A524",
  "#E86A33",
  "#E33F5F",
  "#8B5CF6",
  "#18E299",
];
