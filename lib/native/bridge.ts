import { NATIVE_BRIDGE_NAME } from "./constants";
import type { NativeMessage, NativeMessageType } from "./messages";

type PayloadOf<T extends NativeMessageType> =
  Extract<NativeMessage, { type: T }> extends { payload: infer P } ? P : never;

type Handler<T extends NativeMessageType> = (payload: PayloadOf<T>) => void;

class NativeBridge {
  private handlers = new Map<
    NativeMessageType,
    Set<Handler<NativeMessageType>>
  >();
  private initialized = false;

  init() {
    if (typeof window === "undefined" || this.initialized) return;
    this.initialized = true;

    // Flutter → Web 진입점. Flutter 쪽에서 controller.runJavaScript(
    //   `window.__kgBridge.receive('${jsonString}')`
    // ) 형태로 호출한다.
    (window as Window & { __kgBridge?: unknown }).__kgBridge = {
      receive: (raw: string) => this.dispatch(raw),
    };
  }

  private dispatch(raw: string) {
    let msg: NativeMessage;
    try {
      msg = JSON.parse(raw) as NativeMessage;
    } catch (e) {
      console.warn("[NativeBridge] JSON parse 실패", raw, e);
      return;
    }
    if (!msg?.type) {
      console.warn("[NativeBridge] type 없는 메시지", msg);
      return;
    }
    const set = this.handlers.get(msg.type);
    if (!set || set.size === 0) {
      console.debug("[NativeBridge] 핸들러 없음", msg.type);
      return;
    }
    set.forEach((h) => {
      try {
        h((msg as { payload: unknown }).payload as never);
      } catch (e) {
        console.error("[NativeBridge] 핸들러 에러", msg.type, e);
      }
    });
  }

  on<T extends NativeMessageType>(type: T, handler: Handler<T>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as unknown as Handler<NativeMessageType>);
    return () => set!.delete(handler as unknown as Handler<NativeMessageType>);
  }

  send(msg: NativeMessage): boolean {
    if (typeof window === "undefined") return false;
    const w = window as Window & {
      KaGongMapApp?: { postMessage?: (s: string) => void };
      flutter_inappwebview?: {
        callHandler: (name: string, ...args: unknown[]) => Promise<unknown>;
      };
    };

    // 폴리필(KaGongMapApp.postMessage) 또는 직접 callHandler — 둘 다 문자열 전달
    if (typeof w.KaGongMapApp?.postMessage === "function") {
      w.KaGongMapApp.postMessage(JSON.stringify(msg));
      return true;
    }
    if (typeof w.flutter_inappwebview?.callHandler === "function") {
      w.flutter_inappwebview.callHandler(
        NATIVE_BRIDGE_NAME,
        JSON.stringify(msg),
      );
      return true;
    }
    return false;
  }

  isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as Window & {
      flutter_inappwebview?: unknown;
      FlutterBridge?: unknown;
    };
    return !!(w.flutter_inappwebview || w.FlutterBridge);
  }
}

export const nativeBridge = new NativeBridge();
