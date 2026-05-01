"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { TbFlag, TbTrash } from "react-icons/tb";
import {
  useCreateReview,
  useDeleteReview,
  useReviews,
} from "@/lib/api/reviews";
import { useUserStore } from "@/stores/userStore";
import { cls, formatDate } from "@/lib/utils";
import type { DbReview } from "@/types/db";
import AreaInput from "@/components/input/AreaInput";
import KaGongButton from "@/components/button/KaGongButton";
import ReviewReportModal from "@/components/cafe/detail/ReviewReportModal";
import BasicInput from "@/components/input/BasicInput";
import { generateRandomNickname } from "@/lib/randomNickname";

interface CafeReviewSectionProps {
  cafeId: string;
}

export default function CafeReviewSection({ cafeId }: CafeReviewSectionProps) {
  const { data: reviews = [], isLoading } = useReviews(cafeId);

  return (
    <section className="flex flex-col gap-3 pt-4 border-t border-border-subtle mt-4">
      <header className="flex items-center justify-between">
        <h5 className="text-[14px] font-semibold tracking-[-0.2px]">
          후기 {reviews.length}개
        </h5>
      </header>

      <ReviewForm cafeId={cafeId} />

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="text-[12px] text-fg-3 py-3 text-center">
            불러오는 중…
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-[12px] text-fg-3 py-3 text-center">
            아직 후기가 없어요. 첫 후기를 남겨보세요.
          </div>
        ) : (
          reviews.map((r) => (
            <ReviewItem key={r.id} cafeId={cafeId} review={r} />
          ))
        )}
      </div>
    </section>
  );
}

function ReviewForm({ cafeId }: { cafeId: string }) {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const dbUser = useUserStore((s) => s.dbUser);

  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  const createMut = useCreateReview(cafeId);

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    if (isAuthed) {
      createMut.mutate(
        { content: trimmed },
        {
          onSuccess: () => {
            setContent("");
            toast.success("후기가 등록되었습니다.");
          },
          onError: (err) => toast.error(err.message),
        },
      );
      return;
    }

    if (nickname.trim().length < 2) {
      toast.error("닉네임은 2자 이상이어야 합니다.");
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      toast.error("비밀번호는 4자리 숫자여야 합니다.");
      return;
    }

    createMut.mutate(
      { content: trimmed, nickname: nickname.trim(), password },
      {
        onSuccess: () => {
          setContent("");
          setNickname("");
          setPassword("");
          toast.success("후기가 등록되었습니다.");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  useEffect(() => {
    if (!isAuthed || !dbUser) {
      setTimeout(() => {
        setNickname(generateRandomNickname());
      }, 0);
    }
  }, [isAuthed, dbUser]);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-md bg-gray-50">
      {!isAuthed && (
        <div className="flex gap-2">
          <BasicInput
            name="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={20}
          />
          <BasicInput
            name="password"
            inputMode="numeric"
            pattern="\d{4}"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="비밀번호 4자리"
          />
        </div>
      )}

      {isAuthed && dbUser && (
        <div className="text-[11.5px] text-fg-3">
          <span className="font-semibold text-fg-2">{dbUser.nickname}</span>
          으로 작성됩니다
        </div>
      )}

      <AreaInput
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="이 카페의 카공 정보를 남겨주세요"
        className="px-3 py-2 rounded-md border border-border-medium bg-bg text-[12.5px] resize-none leading-relaxed"
      />

      <div className="flex justify-end">
        <KaGongButton
          buttonStyle="BLACK"
          buttonSize="SMALL"
          onClick={submit}
          disabled={createMut.isPending}
        >
          {createMut.isPending ? "등록 중…" : "후기 작성"}
        </KaGongButton>
      </div>
    </div>
  );
}

function ReviewItem({ cafeId, review }: { cafeId: string; review: DbReview }) {
  const dbUser = useUserStore((s) => s.dbUser);
  const isOwnAuthed = !!review.user_id && dbUser?.id === review.user_id;
  const isAnon = review.user_id === null;
  const canDelete = isOwnAuthed || isAnon;
  // 본인이 작성한 후기는 신고 막기 (로그인 본인 매칭 시에만 판별 가능)
  const canReport = !isOwnAuthed;

  const [showReport, setShowReport] = useState(false);
  const deleteMut = useDeleteReview(cafeId);

  const handleDelete = () => {
    if (isOwnAuthed) {
      if (!confirm("후기를 삭제할까요?")) return;
      deleteMut.mutate(
        { id: review.id },
        {
          onSuccess: () => toast.success("후기가 삭제되었습니다."),
          onError: (err) => toast.error(err.message),
        },
      );
      return;
    }

    const pw = prompt("비밀번호 4자리를 입력해주세요");
    if (pw === null) return;
    if (!/^\d{4}$/.test(pw)) {
      toast.error("비밀번호는 4자리 숫자여야 합니다.");
      return;
    }
    deleteMut.mutate(
      { id: review.id, password: pw },
      {
        onSuccess: () => toast.success("후기가 삭제되었습니다."),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <>
      <article className="flex flex-col gap-1.5 p-3 rounded-md border border-border-subtle bg-bg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[12.5px] font-semibold text-fg-2">
              {review.nickname}
            </span>
            {isAnon && (
              <span className="text-[10px] text-fg-4 px-1.5 py-px rounded bg-gray-100">
                비회원
              </span>
            )}
            <span className="text-[11px] text-fg-4">
              {formatDate(review.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canReport && (
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="text-fg-4 hover:text-red-500 cursor-pointer"
                aria-label="후기 신고"
                title="신고"
              >
                <TbFlag size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                className="text-fg-4 hover:text-red-500 cursor-pointer disabled:opacity-50"
                aria-label="후기 삭제"
              >
                <TbTrash size={14} />
              </button>
            )}
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-fg-2 whitespace-pre-wrap">
          {review.content}
        </p>
      </article>

      <ReviewReportModal
        reviewId={review.id}
        open={showReport}
        onClose={() => setShowReport(false)}
      />
    </>
  );
}
