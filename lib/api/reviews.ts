import { createClient } from "@/lib/supabase/client";
import type { DbReview } from "@/types/db";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const reviewKeys = {
  all: ["reviews"] as const,
  byCafe: (cafeId: string) => [...reviewKeys.all, "cafe", cafeId] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

export async function fetchReviews(cafeId: string): Promise<DbReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, user:users(nickname, avatar_url)")
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Mutations ────────────────────────────────────────────────────────────────

export interface CreateReviewPayload {
  cafe_id: string;
  rating: number;
  content?: string;
}

export async function createReview(
  payload: CreateReviewPayload,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reviews").insert(payload);
  if (error) throw new Error(error.message);
}
