import { CloudflareImageVariant } from "./enum";

export function cls(...classNames: (string | undefined | null | false)[]) {
  return classNames.filter(Boolean).join(" ");
}

export function getStreamEmbedUrl(videoUrl: string) {
  const connector = videoUrl.includes("?") ? "&" : "?";
  return `${videoUrl}${connector}autoplay=true&muted=true&loop=true&controls=false`;
}

export function getCloudflareImageUrl(
  id: string,
  variant: CloudflareImageVariant = "public",
) {
  return `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL}/${id}/${variant}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
