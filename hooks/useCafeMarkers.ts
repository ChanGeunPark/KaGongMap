import { useQuery } from "@tanstack/react-query";
import { cafeKeys, fetchCafeMarkers } from "@/lib/api/cafes";

export function useCafeMarkers() {
  return useQuery({
    queryKey: cafeKeys.markers(),
    queryFn: fetchCafeMarkers,
  });
}
