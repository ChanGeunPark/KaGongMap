import { isWebView as detectWebView } from "@/lib/native/isWebView";

export type LocationPermissionEnvironment = "browser" | "webview";
export type LocationPermissionState =
  | PermissionState
  | "unsupported"
  | "unknown";
export type LocationPermission = "checking" | LocationPermissionState;

export interface LocationPermissionSnapshot {
  environment: LocationPermissionEnvironment;
  status: LocationPermissionState;
  isEnabled: boolean;
  canRequest: boolean;
  hasGeolocation: boolean;
  canQueryPermission: boolean;
}

interface LocationPermissionOptions {
  isWebView?: boolean;
}

function getEnvironment(
  isWebView?: boolean,
): LocationPermissionEnvironment {
  return (isWebView ?? detectWebView()) ? "webview" : "browser";
}

function createSnapshot({
  canQueryPermission,
  environment,
  hasGeolocation,
  status,
}: {
  canQueryPermission: boolean;
  environment: LocationPermissionEnvironment;
  hasGeolocation: boolean;
  status: LocationPermissionState;
}): LocationPermissionSnapshot {
  return {
    environment,
    status,
    isEnabled: status === "granted",
    canRequest:
      hasGeolocation && (status === "prompt" || status === "unknown"),
    hasGeolocation,
    canQueryPermission,
  };
}

export async function getLocationPermissionStatus(
  options: LocationPermissionOptions = {},
): Promise<LocationPermissionSnapshot> {
  const environment = getEnvironment(options.isWebView);

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return createSnapshot({
      canQueryPermission: false,
      environment,
      hasGeolocation: false,
      status: "unsupported",
    });
  }

  if (!navigator.permissions?.query) {
    return createSnapshot({
      canQueryPermission: false,
      environment,
      hasGeolocation: true,
      status: environment === "webview" ? "unknown" : "prompt",
    });
  }

  try {
    const permission = await navigator.permissions.query({
      name: "geolocation",
    });

    return createSnapshot({
      canQueryPermission: true,
      environment,
      hasGeolocation: true,
      status: permission.state,
    });
  } catch {
    return createSnapshot({
      canQueryPermission: false,
      environment,
      hasGeolocation: true,
      status: environment === "webview" ? "unknown" : "prompt",
    });
  }
}

export async function isLocationPermissionEnabled(
  options: LocationPermissionOptions = {},
): Promise<boolean> {
  const permission = await getLocationPermissionStatus(options);
  return permission.isEnabled;
}

export function watchLocationPermissionStatus(
  onChange: (snapshot: LocationPermissionSnapshot) => void,
  options: LocationPermissionOptions = {},
): () => void {
  const environment = getEnvironment(options.isWebView);
  let permissionStatus: PermissionStatus | null = null;
  let cancelled = false;

  void getLocationPermissionStatus(options).then((snapshot) => {
    if (!cancelled) onChange(snapshot);
  });

  if (
    typeof navigator === "undefined" ||
    !navigator.geolocation ||
    !navigator.permissions?.query
  ) {
    return () => {
      cancelled = true;
    };
  }

  navigator.permissions
    .query({ name: "geolocation" })
    .then((status) => {
      if (cancelled) return;
      permissionStatus = status;
      status.onchange = () => {
        onChange(
          createSnapshot({
            canQueryPermission: true,
            environment,
            hasGeolocation: true,
            status: status.state,
          }),
        );
      };
    })
    .catch(() => undefined);

  return () => {
    cancelled = true;
    if (permissionStatus) permissionStatus.onchange = null;
  };
}
