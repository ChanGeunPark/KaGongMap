import { useQuery } from "@tanstack/react-query";
import { cafeKeys, fetchCafeDetail } from "@/lib/api/cafes";

export function useCafeDetail(id: string | null) {
  return useQuery({
    queryKey: cafeKeys.detail(id ?? ""),
    queryFn: () => fetchCafeDetail(id!),
    enabled: !!id, // id가 없으면 요청하지 않음
    staleTime: 1000 * 60 * 10, // 상세는 10분 캐시
  });
}
