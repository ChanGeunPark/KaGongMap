export const likeKeys = {
  all: ["likes"] as const,
  me: () => [...likeKeys.all, "me"] as const,
};

export async function fetchMyLikedCafeIds(): Promise<string[]> {
  const res = await fetch("/api/likes", { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) return [];
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "좋아요 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { cafeIds: string[] };
  return json.cafeIds ?? [];
}

export async function likeCafe(cafeId: string): Promise<void> {
  const res = await fetch(`/api/likes/${encodeURIComponent(cafeId)}`, {
    method: "POST",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "좋아요 추가 중 오류가 발생했습니다.");
  }
}

export async function unlikeCafe(cafeId: string): Promise<void> {
  const res = await fetch(`/api/likes/${encodeURIComponent(cafeId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "좋아요 해제 중 오류가 발생했습니다.");
  }
}

export async function syncLocalLikes(cafeIds: string[]): Promise<string[]> {
  const res = await fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cafeIds }),
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "좋아요 동기화 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { cafeIds: string[] };
  return json.cafeIds ?? [];
}
