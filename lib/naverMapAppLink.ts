/**
 * 네이버 지도 앱 연동 URL Scheme
 * @see https://guide.ncloud-docs.com/docs/maps-url-scheme
 */

const NAVER_MAP_ANDROID_PACKAGE = "com.nhn.android.nmap";

function appNameParam(): string {
  if (typeof window === "undefined") return "kagongmap-web";
  return window.location.origin;
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/** 네이버 지도 웹: 통합 검색 */
export function naverMapWebSearchUrl(query: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

/**
 * 모바일: 네이버 지도 앱에서 해당 좌표·이름으로 장소 화면 열기 (미설치 시 OS 동작).
 * 데스크톱: 웹 검색 URL을 새 탭으로 연다.
 */
export function openNaverMapPlace(opts: {
  lat: number;
  lng: number;
  placeName: string;
  /** 웹 검색에 쓸 문구 (이름+주소 등). 비어 있으면 placeName만 사용 */
  webSearchQuery?: string;
}): void {
  const { lat, lng, placeName, webSearchQuery } = opts;
  const queryForWeb = (webSearchQuery ?? placeName).trim() || placeName;
  const webUrl = naverMapWebSearchUrl(queryForWeb);

  if (!isMobile()) {
    window.open(webUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const appname = encodeURIComponent(appNameParam());
  const name = encodeURIComponent(placeName.trim() || queryForWeb);

  const nmapPath = `place?lat=${lat}&lng=${lng}&name=${name}&appname=${appname}`;

  if (isAndroid()) {
    const intent = `intent://${nmapPath}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=${NAVER_MAP_ANDROID_PACKAGE};end`;
    window.location.assign(intent);
    return;
  }

  window.location.assign(`nmap://${nmapPath}`);
}
