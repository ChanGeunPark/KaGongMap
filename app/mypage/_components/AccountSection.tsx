"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";
import { useUserStore } from "@/stores/userStore";
import {
  type DeleteAccountReason,
  useDeleteMe,
  useUpdateNickname,
} from "@/lib/api/user";
import { cls } from "@/lib/utils";

const DELETE_REASONS: { value: DeleteAccountReason; label: string }[] = [
  { value: "not_useful", label: "서비스가 유용하지 않아요" },
  { value: "missing_features", label: "원하는 기능이 부족해요" },
  { value: "privacy_concern", label: "개인정보가 걱정돼요" },
  { value: "too_many_notifications", label: "알림이 너무 많아요" },
  { value: "using_other_service", label: "다른 서비스를 사용할래요" },
  { value: "temporary", label: "잠시 사용을 중단하려고 해요" },
  { value: "other", label: "기타" },
];

const DETAIL_MAX = 500;
const DEFAULT_DELETE_REASON: DeleteAccountReason = "not_useful";

export default function AccountSection() {
  const dbUser = useUserStore((s) => s.dbUser);
  const dbNickname = dbUser?.nickname ?? "";
  const { mutate: updateNickname, isPending } = useUpdateNickname();
  const deleteMeMut = useDeleteMe();

  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState<DeleteAccountReason>(
    DEFAULT_DELETE_REASON,
  );
  const [deleteDetail, setDeleteDetail] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const submit = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      toast.error("닉네임은 2~20자여야 합니다.");
      return;
    }
    if (trimmed === dbNickname) {
      setEditing(false);
      return;
    }
    updateNickname(trimmed, {
      onSuccess: () => {
        toast.success("닉네임이 변경되었습니다.");
        setEditing(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const closeDeleteModal = () => {
    if (deleteMeMut.isPending) return;
    setShowDeleteModal(false);
    setDeleteReason(DEFAULT_DELETE_REASON);
    setDeleteDetail("");
    setDeleteConfirmed(false);
  };

  const handleDeleteAccount = () => {
    const trimmed = deleteDetail.trim();
    if (deleteReason === "other" && !trimmed) {
      toast.error("기타 사유는 상세 내용을 입력해주세요.");
      return;
    }
    if (trimmed.length > DETAIL_MAX) {
      toast.error(`상세 내용은 ${DETAIL_MAX}자 이내여야 합니다.`);
      return;
    }
    if (!deleteConfirmed) {
      toast.error("삭제 안내를 확인해주세요.");
      return;
    }

    deleteMeMut.mutate(
      { reason: deleteReason, detail: trimmed || undefined },
      {
        onSuccess: async () => {
          toast.success("회원 탈퇴가 완료되었습니다.");
          await signOut({ callbackUrl: "/" });
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.5px] text-main-deep">
            Profile
          </p>
          <h2 className="mt-2 text-h3 font-semibold tracking-[-0.3px] text-fg">
            프로필
          </h2>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full bg-gray-100 px-4 py-2 text-[12.5px] font-semibold text-fg-2 transition-colors hover:bg-gray-200"
        >
          로그아웃
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[13px] font-semibold text-fg-2">닉네임</div>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="min-w-0 flex-1 rounded-xl border border-border-medium bg-bg px-4 py-3 text-caption"
              autoFocus
            />
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded-full bg-fg px-4 py-2 text-[12.5px] font-semibold text-bg disabled:opacity-50"
            >
              {isPending ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNickname(dbNickname);
                setEditing(false);
              }}
              className="rounded-full bg-gray-100 px-4 py-2 text-[12.5px] font-semibold text-fg-2"
            >
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-muted px-4 py-3">
            <span className="min-w-0 truncate text-btn font-semibold text-fg">
              {dbNickname || "닉네임 없음"}
            </span>
            <button
              type="button"
              onClick={() => {
                setNickname(dbNickname);
                setEditing(true);
              }}
              className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-mono font-semibold text-fg-2 hover:bg-gray-200"
            >
              변경
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="border border-gray-200 rounded-full px-4 py-2 text-mono font-semibold text-fg-4 underline-offset-2 hover:text-red-500 hover:border-red-200"
        >
          회원 탈퇴
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-330 flex items-center justify-center bg-black/45 px-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="회원 탈퇴"
            className="w-full max-w-[420px] rounded-2xl bg-bg p-5 shadow-overlay"
          >
            <h3 className="text-btn font-semibold tracking-[-0.2px] text-fg">
              회원 탈퇴
            </h3>
            <p className="mt-1 text-mono leading-5 text-fg-3">
              탈퇴 사유를 알려주시면 서비스 개선에 참고하겠습니다.
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              {DELETE_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={cls(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2",
                    deleteReason === reason.value
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-border-subtle bg-bg text-fg-2 hover:bg-gray-50",
                  )}
                >
                  <input
                    type="radio"
                    name="delete-account-reason"
                    value={reason.value}
                    checked={deleteReason === reason.value}
                    onChange={() => setDeleteReason(reason.value)}
                    className="accent-red-500"
                  />
                  <span className="text-[13px] font-medium">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>

            <textarea
              value={deleteDetail}
              onChange={(e) => setDeleteDetail(e.target.value)}
              placeholder={
                deleteReason === "other"
                  ? "상세 사유를 입력해주세요 (필수)"
                  : "더 알려주실 내용이 있으면 적어주세요 (선택)"
              }
              rows={3}
              maxLength={DETAIL_MAX}
              className="mt-3 w-full resize-none rounded-lg border border-border-medium bg-bg px-3 py-2 text-[12.5px] leading-relaxed"
            />

            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg bg-gray-50 p-3 text-mono leading-5 text-fg-3">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-0.5 accent-red-500"
              />
              <span>
                탈퇴하면 계정 정보와 개인 활동 데이터가 삭제되며 복구할 수
                없습니다.
              </span>
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteMeMut.isPending}
                className="rounded-full bg-gray-100 px-4 py-2 text-[12.5px] font-semibold text-fg-2 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteMeMut.isPending || !deleteConfirmed}
                className="rounded-full bg-red-500 px-4 py-2 text-[12.5px] font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteMeMut.isPending ? "탈퇴 처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
