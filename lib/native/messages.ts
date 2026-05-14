export type NativeLocationPermissionStatus =
  | "granted"
  | "denied"
  | "prompt"
  | "unknown"
  | "unsupported";

export interface NativeCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

// ─────────────────────────────────────────────────────────────
// Flutter → Web (수신)
// ─────────────────────────────────────────────────────────────
export type IncomingNativeMessage =
  | {
      type: "FCM_TOKEN";
      payload: { token: string };
    }
  | {
      type: "PUSH_TAP";
      payload: {
        cafeId?: string;
        url?: string;
        data?: Record<string, string>;
      };
    }
  | {
      type: "LOCATION_RESPONSE";
      payload: {
        status: NativeLocationPermissionStatus;
        coords?: NativeCoords;
      };
    }
  | {
      type: "LOCATION_PERMISSION_STATUS";
      payload: { status: NativeLocationPermissionStatus };
    }
  | {
      type: "LOCATION_UPDATE";
      payload: NativeCoords;
    }
  | {
      type: "HEADING_UPDATE";
      /** heading: 진북 기준 시계방향 0~360도 */
      payload: { heading: number };
    }
  | {
      type: "TEST_RESPONSE";
      payload: { text: string };
    };

// ─────────────────────────────────────────────────────────────
// Web → Flutter (송신)
// ─────────────────────────────────────────────────────────────
export type OutgoingNativeMessage =
  | {
      type: "READY";
      payload?: undefined;
    }
  | {
      type: "CHECK_LOCATION_PERMISSION";
      payload?: undefined;
    }
  | {
      type: "REQUEST_LOCATION";
      payload?: { highAccuracy?: boolean };
    }
  | {
      type: "START_LOCATION_UPDATES";
      payload?: {
        highAccuracy?: boolean;
        /** Flutter 측 distance filter (미터). 이 거리 이상 이동 시에만 LOCATION_UPDATE 송신 */
        distanceFilter?: number;
      };
    }
  | {
      type: "STOP_LOCATION_UPDATES";
      payload?: undefined;
    }
  | {
      type: "START_HEADING_UPDATES";
      payload?: undefined;
    }
  | {
      type: "STOP_HEADING_UPDATES";
      payload?: undefined;
    }
  | {
      type: "REQUEST_PUSH_PERMISSION";
      payload?: undefined;
    }
  | {
      type: "OPEN_EXTERNAL_URL";
      payload: { url: string };
    }
  | {
      type: "SHARE";
      payload: { title?: string; text: string; url?: string };
    }
  | {
      type: "HAPTIC";
      payload: { kind: "light" | "medium" | "heavy" | "selection" };
    }
  | {
      type: "AUTH_STATE_CHANGED";
      payload: { signedIn: boolean; userId?: string };
    }
  | {
      type: "SET_STATUS_BAR";
      payload: { style: "light" | "dark"; backgroundColor?: string };
    }
  | {
      type: "TEST";
      payload: { message: string };
    };

// ─────────────────────────────────────────────────────────────
// 타입 헬퍼
// ─────────────────────────────────────────────────────────────
export type NativeIncomingType = IncomingNativeMessage["type"];
export type NativeOutgoingType = OutgoingNativeMessage["type"];

// bridge.ts 호환 — 단일 union 별칭
export type NativeMessage = IncomingNativeMessage | OutgoingNativeMessage;
export type NativeMessageType = NativeMessage["type"];
