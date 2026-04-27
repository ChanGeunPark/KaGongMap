import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reviewKeys,
  fetchReviews,
  createReview,
  type CreateReviewPayload,
} from "@/lib/api/reviews";
import { cafeKeys } from "@/lib/api/cafes";

export function useReviews(cafeId: string) {
  return useQuery({
    queryKey: reviewKeys.byCafe(cafeId),
    queryFn: () => fetchReviews(cafeId),
    enabled: !!cafeId,
  });
}

export function useCreateReview(cafeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(payload),
    onSuccess: () => {
      // 리뷰 목록과 카페 상세(avg_rating) 동시 무효화
      queryClient.invalidateQueries({ queryKey: reviewKeys.byCafe(cafeId) });
      queryClient.invalidateQueries({ queryKey: cafeKeys.detail(cafeId) });
    },
  });
}
