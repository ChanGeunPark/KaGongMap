import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminOAuthIds } from "@/lib/adminAuth";
import { adminMessaging } from "./admin";

const FCM_BATCH_SIZE = 500;

const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

export type PushPayload = {
  title: string;
  body: string;
  /** 클릭 시 이동할 사이트 내부 경로 (예: "/cafes/abc123") */
  link?: string;
  /** 추가 데이터. FCM 규약상 모든 값은 문자열이어야 함 */
  data?: Record<string, string>;
};

export type PushResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

function uniqueTokens(rows: Array<{ token: string | null }>) {
  const set = new Set<string>();
  for (const row of rows) {
    if (row.token) set.add(row.token);
  }
  return Array.from(set);
}

async function sendToTokens(
  tokens: string[],
  payload: PushPayload,
): Promise<PushResult> {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const messaging = adminMessaging();
  const data: Record<string, string> = { ...(payload.data ?? {}) };
  if (payload.link) data.link = payload.link;

  const baseMessage = {
    notification: { title: payload.title, body: payload.body },
    data,
    webpush: payload.link ? { fcmOptions: { link: payload.link } } : undefined,
  };

  const invalidTokens: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
    const chunk = tokens.slice(i, i + FCM_BATCH_SIZE);
    const response = await messaging.sendEachForMulticast({
      ...baseMessage,
      tokens: chunk,
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        if (INVALID_TOKEN_ERROR_CODES.has(res.error.code)) {
          invalidTokens.push(chunk[idx]);
        } else {
          console.error("[sendPush] 발송 실패", {
            token: chunk[idx],
            code: res.error.code,
            message: res.error.message,
          });
        }
      }
    });
  }

  if (invalidTokens.length > 0) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("fcm_tokens")
      .delete()
      .in("token", invalidTokens);
    if (error) {
      console.error("[sendPush] 무효 토큰 정리 실패", error);
    }
  }

  return { successCount, failureCount, invalidTokens };
}

/** 특정 유저의 모든 디바이스에 발송 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<PushResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("fcm_tokens")
    .select("token")
    .eq("user_id", userId);

  if (error) {
    console.error("[sendPushToUser] 토큰 조회 실패", error);
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  return sendToTokens(uniqueTokens(data ?? []), payload);
}

/** 여러 유저(중복 제거됨)의 모든 디바이스에 발송 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<PushResult> {
  if (userIds.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("fcm_tokens")
    .select("token")
    .in("user_id", userIds);

  if (error) {
    console.error("[sendPushToUsers] 토큰 조회 실패", error);
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  return sendToTokens(uniqueTokens(data ?? []), payload);
}

/** ADMIN_USER_IDS env에 등록된 어드민 모두에게 발송 */
export async function sendPushToAdmins(
  payload: PushPayload,
): Promise<PushResult> {
  const oauthIds = getAdminOAuthIds();
  if (oauthIds.length === 0) {
    console.error("[sendPushToAdmins] ADMIN_USER_IDS env 미설정");
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  // fcm_tokens.user_id 는 users.id (PK) 라서 OAuth ID → PK 변환 후 발송
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .in("user_id", oauthIds);

  if (error) {
    console.error("[sendPushToAdmins] users 조회 실패", error);
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const adminPks = (data ?? []).map((row) => row.id as string);
  if (adminPks.length === 0) {
    console.warn("[sendPushToAdmins] 매칭되는 어드민 user 행 없음", oauthIds);
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  return sendPushToUsers(adminPks, payload);
}

/** 알림을 켠 모든 유저에게 발송 (공지용) */
export async function sendPushToAll(payload: PushPayload): Promise<PushResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("fcm_tokens").select("token");

  if (error) {
    console.error("[sendPushToAll] 토큰 조회 실패", error);
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  return sendToTokens(uniqueTokens(data ?? []), payload);
}
