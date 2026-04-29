import LocalStorage from "./LocalStorage";

const KEY = "kagongmap.likedCafeIds";

export function readLikedCafeIds(): string[] {
  const raw = LocalStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function writeLikedCafeIds(ids: string[]) {
  LocalStorage.setItem(KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function clearLikedCafeIds() {
  LocalStorage.removeItem(KEY);
}
