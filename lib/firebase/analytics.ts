import type { Analytics } from "firebase/analytics";
import { firebaseApp } from "./firebase";

let cached: Analytics | null = null;
let initPromise: Promise<Analytics | null> | null = null;

async function getInstance(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (cached) return cached;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { isSupported, getAnalytics } = await import("firebase/analytics");
    if (!(await isSupported())) return null;
    cached = getAnalytics(firebaseApp);
    return cached;
  })();
  return initPromise;
}

export async function initAnalytics(): Promise<void> {
  await getInstance();
}

type AllowedParam = string | number | boolean;

function sanitize(
  params: Record<string, unknown>,
): Record<string, AllowedParam> {
  const out: Record<string, AllowedParam> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      out[key] = value.join(",");
    } else if (typeof value === "object") {
      out[key] = JSON.stringify(value);
    } else if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    }
  }
  return out;
}

export async function track(
  name: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const analytics = await getInstance();
  if (!analytics) return;
  const { logEvent } = await import("firebase/analytics");
  const safe = params ? sanitize(params) : undefined;
  logEvent(
    analytics,
    name as Parameters<typeof logEvent>[1],
    safe as Parameters<typeof logEvent>[2],
  );
}

export async function setAnalyticsUser(
  userId: string | null,
  properties?: Record<string, AllowedParam | null>,
): Promise<void> {
  const analytics = await getInstance();
  if (!analytics) return;
  const { setUserId, setUserProperties } = await import("firebase/analytics");
  setUserId(analytics, userId);
  if (properties) {
    setUserProperties(analytics, properties);
  }
}
