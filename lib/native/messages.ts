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
      type: "REQUEST_LOCATION";
      payload?: { highAccuracy?: boolean };
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
