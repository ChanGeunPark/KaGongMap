import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { firebaseApp } from "./firebase";

export async function isFcmSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return isSupported();
}

async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!(await isFcmSupported())) return null;
  return getMessaging(firebaseApp);
}

async function registerMessagingServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/firebase-messaging-sw.js");
}

export async function requestFcmToken() {
  if (typeof window === "undefined") return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY가 설정되지 않았습니다.");
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const serviceWorkerRegistration = await registerMessagingServiceWorker();
  if (!serviceWorkerRegistration) return null;

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  return token || null;
}

export async function registerFcmToken(): Promise<string | null> {
  const token = await requestFcmToken();
  if (!token) return null;

  try {
    const res = await fetch("/api/fcm-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        userAgent: navigator.userAgent,
      }),
    });

    if (!res.ok) {
      console.error("[registerFcmToken] 서버 저장 실패", await res.text());
      return null;
    }
  } catch (err) {
    console.error("[registerFcmToken] 네트워크 오류", err);
    return null;
  }

  return token;
}

export async function unregisterFcmToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/fcm-tokens?token=${encodeURIComponent(token)}`,
      { method: "DELETE" },
    );
    return res.ok;
  } catch (err) {
    console.error("[unregisterFcmToken] 네트워크 오류", err);
    return false;
  }
}

/** 앱이 켜져 있을 때(=포그라운드) 들어오는 푸시 메시지 리스너. unsubscribe 함수 반환 */
export async function listenForegroundMessages(
  handler: (payload: MessagePayload) => void,
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;
  return onMessage(messaging, handler);
}
