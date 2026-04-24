export function cls(...classNames: (string | undefined | null | false)[]) {
  return classNames.filter(Boolean).join(" ");
}

export function getStreamEmbedUrl(videoUrl: string) {
  const connector = videoUrl.includes("?") ? "&" : "?";
  return `${videoUrl}${connector}autoplay=true&muted=true&loop=true&controls=false`;
}
