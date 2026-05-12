import "server-only";
import {
  sendPushToAdmins,
  sendPushToAll,
  sendPushToUser,
  sendPushToUsers,
  type PushResult,
} from "@/lib/firebase/sendPush";
import { createAdminClient } from "@/lib/supabase/server";
import {
  buildNotificationPayload,
  type NotificationCatalog,
  type NotificationType,
} from "./catalog";

const EMPTY_RESULT: PushResult = {
  successCount: 0,
  failureCount: 0,
  invalidTokens: [],
};

/** users.id (Supabase PK) 기준 발송 */
export async function notifyUser<T extends NotificationType>(
  userId: string,
  type: T,
  payload: NotificationCatalog[T],
): Promise<PushResult> {
  return sendPushToUser(userId, buildNotificationPayload(type, payload));
}

/**
 * OAuth ID (NextAuth session.user.id) 기준 발송.
 * cafe_submissions / cafe_image_submissions / cafe_edit_submissions 등
 * user_id 컬럼에 OAuth ID를 저장하는 테이블의 행을 다룰 때 사용.
 */
export async function notifyUserByOAuth<T extends NotificationType>(
  oauthId: string,
  type: T,
  payload: NotificationCatalog[T],
): Promise<PushResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("user_id", oauthId)
    .maybeSingle();

  if (error) {
    console.error("[notifyUserByOAuth] users 조회 실패", error);
    return EMPTY_RESULT;
  }
  const userPk = (data?.id as string | undefined) ?? null;
  if (!userPk) return EMPTY_RESULT;

  return notifyUser(userPk, type, payload);
}

export async function notifyUsers<T extends NotificationType>(
  userIds: string[],
  type: T,
  payload: NotificationCatalog[T],
): Promise<PushResult> {
  return sendPushToUsers(userIds, buildNotificationPayload(type, payload));
}

export async function notifyAdmins<T extends NotificationType>(
  type: T,
  payload: NotificationCatalog[T],
): Promise<PushResult> {
  return sendPushToAdmins(buildNotificationPayload(type, payload));
}

export async function notifyAll<T extends NotificationType>(
  type: T,
  payload: NotificationCatalog[T],
): Promise<PushResult> {
  return sendPushToAll(buildNotificationPayload(type, payload));
}
