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
