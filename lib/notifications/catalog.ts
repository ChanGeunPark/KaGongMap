import type { PushPayload } from "@/lib/firebase/sendPush";

/**
 * 알림 타입 카탈로그.
 *
 * 새 알림을 추가할 때:
 *  1) 아래 `NotificationCatalog`에 타입 키와 payload shape 정의
 *  2) `builders`에 빌더 함수 추가
 *  3) 호출부에서 `notifyUser(id, "<type>", { ... })` 형태로 사용
 *
 * `data.type`은 모든 알림에 자동 주입되며 클라이언트에서 라우팅·트래킹 키로 사용한다.
 */
export type NotificationCatalog = {
  // ── 어드민 대상 ──
  admin_new_cafe_submission: { cafeName: string };
  admin_new_image_submission: { cafeName: string };
  admin_new_edit_submission: { cafeName: string };
  admin_new_review_report: { reasonLabel: string };

  // ── 유저 대상 (제보자에게 결과 통보) ──
  // 카페 제보 승인 시 트리거가 새 cafe.id를 만들지만 제보 행에는 적히지 않아
  // 링크는 /mypage 로 보낸다.
  cafe_submission_approved: { cafeName: string };
  cafe_submission_rejected: { cafeName: string };
  image_submission_approved: { cafeName: string; cafeId: string };
  image_submission_rejected: { cafeName: string };
  edit_submission_approved: { cafeName: string; cafeId: string };
  edit_submission_rejected: { cafeName: string };
};

export type NotificationType = keyof NotificationCatalog;

type Builder<T extends NotificationType> = (
  payload: NotificationCatalog[T],
) => Omit<PushPayload, "data"> & { data?: Record<string, string> };

const builders: { [K in NotificationType]: Builder<K> } = {
  admin_new_cafe_submission: (p) => ({
    title: "새 카페 제보",
    body: `${p.cafeName} 카페 제보가 들어왔어요.`,
    link: "/admin",
  }),
  admin_new_image_submission: (p) => ({
    title: "새 사진 제보",
    body: `${p.cafeName}에 사진이 제보되었어요.`,
    link: "/admin",
  }),
  admin_new_edit_submission: (p) => ({
    title: "새 카페 정보 수정 제안",
    body: `${p.cafeName} 정보 수정 제안이 들어왔어요.`,
    link: "/admin",
  }),
  admin_new_review_report: (p) => ({
    title: "새 후기 신고",
    body: `사유: ${p.reasonLabel}`,
    link: "/admin",
  }),

  cafe_submission_approved: (p) => ({
    title: "카페 제보 승인",
    body: `${p.cafeName} 제보가 승인되었어요. 지도에서 확인해보세요!`,
    link: "/mypage",
  }),
  cafe_submission_rejected: (p) => ({
    title: "카페 제보 반려",
    body: `${p.cafeName} 제보가 반려되었어요.`,
    link: "/mypage",
  }),
  image_submission_approved: (p) => ({
    title: "사진 제보 승인",
    body: `${p.cafeName}에 올린 사진이 반영되었어요.`,
    link: `/?cafe=${p.cafeId}`,
    data: { cafeId: p.cafeId },
  }),
  image_submission_rejected: (p) => ({
    title: "사진 제보 반려",
    body: `${p.cafeName}에 올린 사진이 반려되었어요.`,
    link: "/mypage",
  }),
  edit_submission_approved: (p) => ({
    title: "정보 수정 반영",
    body: `${p.cafeName} 정보 수정 제안이 반영되었어요.`,
    link: `/?cafe=${p.cafeId}`,
    data: { cafeId: p.cafeId },
  }),
  edit_submission_rejected: (p) => ({
    title: "정보 수정 반려",
    body: `${p.cafeName} 정보 수정 제안이 반려되었어요.`,
    link: "/mypage",
  }),
};

export function buildNotificationPayload<T extends NotificationType>(
  type: T,
  payload: NotificationCatalog[T],
): PushPayload {
  const built = builders[type](payload);
  return {
    ...built,
    data: { ...(built.data ?? {}), type },
  };
}
