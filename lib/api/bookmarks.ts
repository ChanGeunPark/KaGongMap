import type { CafeMarker } from "@/types/db";

export const bookmarkKeys = {
  all: ["bookmarks"] as const,
  me: () => [...bookmarkKeys.all, "me"] as const,
  cafes: () => [...bookmarkKeys.all, "cafes"] as const,
};

export async function fetchMyBookmarkedCafeIds(): Promise<string[]> {
  const res = await fetch("/api/bookmarks", { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) return [];
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "즐겨찾기 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { cafeIds: string[] };
  return json.cafeIds ?? [];
}

export async function fetchMyBookmarkedCafes(): Promise<CafeMarker[]> {
  const res = await fetch("/api/bookmarks/cafes", { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) return [];
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "즐겨찾기 목록 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { cafes: CafeMarker[] };
  return json.cafes ?? [];
}

export async function addBookmark(cafeId: string): Promise<void> {
  const res = await fetch(`/api/bookmarks/${encodeURIComponent(cafeId)}`, {
    method: "POST",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "즐겨찾기 추가 중 오류가 발생했습니다.");
  }
}

export async function removeBookmark(cafeId: string): Promise<void> {
  const res = await fetch(`/api/bookmarks/${encodeURIComponent(cafeId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "즐겨찾기 해제 중 오류가 발생했습니다.");
  }
}
