import "server-only";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

function getAdminApp() {
  if (getApps().length) return getApp();

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  let serviceAccount: { project_id: string; client_email: string; private_key: string };
  try {
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY 파싱 실패. 서비스 계정 JSON을 그대로 넣었는지 확인하세요.",
    );
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  });
}

export const adminMessaging = () => getMessaging(getAdminApp());
