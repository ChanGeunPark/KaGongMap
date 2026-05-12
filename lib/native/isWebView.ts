import { NATIVE_BRIDGE_NAME } from "./constants";

export function isWebView(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return ua.includes(NATIVE_BRIDGE_NAME);
}
