"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubmissions,
  approveSubmission,
  deleteSubmission,
  fetchCafesAdmin,
  deleteCafe,
  fetchImageSubmissions,
  approveImageSubmission,
  deleteImageSubmission,
  fetchEditSubmissions,
  approveEditSubmission,
  deleteEditSubmission,
  submissionKeys,
  cafeKeys,
  imageSubmissionKeys,
  editSubmissionKeys,
} from "@/lib/api/cafes";
import type {
  CafeSubmission,
  CafeWithDetail,
  CafeImageSubmission,
  CafeEditSubmission,
  SubmissionStatus,
} from "@/types/db";
import { toast } from "react-toastify";
import Image from "next/image";
import { getCloudflareImageUrl } from "@/lib/utils";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "대기 중",
  approved: "승인됨",
  rejected: "거절됨",
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-600 border border-red-200",
};

const CARD_ACCENT: Record<SubmissionStatus, string> = {
  pending: "border-l-amber-400",
  approved: "border-l-emerald-400",
  rejected: "border-l-red-400",
};

const TAG_LABELS: Record<string, string> = {
  콘센트_있음: "🔌 콘센트",
  와이파이_있음: "📶 와이파이",
  조용함: "🤫 조용함",
  "24시간": "🕐 24시간",
  시간제한없음: "♾️ 시간제한 없음",
  노트북_허용: "💻 노트북 허용",
  혼잡도_낮음: "🟢 혼잡도 낮음",
  늦은영업: "🌙 늦은영업",
  가성비_좋음: "💸 가성비 좋음",
  자연채광: "☀️ 자연채광",
  야외테라스: "🌿 야외테라스",
  반려동물_가능: "🐶 반려동물 가능",
};

type FilterTab = "pending" | "registered" | "images" | "edits";

export default function AdminPage() {
  const [filter, setFilter] = useState<FilterTab>("pending");
  const queryClient = useQueryClient();

  const {
    data: submissions = [],
    isLoading: isSubmissionsLoading,
    isError: isSubmissionsError,
  } = useQuery({
    queryKey: submissionKeys.list(),
    queryFn: fetchSubmissions,
  });

  const {
    data: cafes = [],
    isLoading: isCafesLoading,
    isError: isCafesError,
  } = useQuery({
    queryKey: cafeKeys.list(),
    queryFn: fetchCafesAdmin,
  });

  const {
    data: imageSubmissions = [],
    isLoading: isImagesLoading,
    isError: isImagesError,
  } = useQuery({
    queryKey: imageSubmissionKeys.list(),
    queryFn: fetchImageSubmissions,
  });

  const {
    data: editSubmissions = [],
    isLoading: isEditsLoading,
    isError: isEditsError,
  } = useQuery({
    queryKey: editSubmissionKeys.list(),
    queryFn: fetchEditSubmissions,
  });

  const approveMutation = useMutation({
    mutationFn: approveSubmission,
    onSuccess: () => {
      toast.success("제보가 승인되었습니다.");
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.markers() });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: deleteSubmission,
    onSuccess: () => {
      toast.success("제보가 거절되었습니다.");
      queryClient.invalidateQueries({ queryKey: submissionKeys.list() });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteCafeMutation = useMutation({
    mutationFn: deleteCafe,
    onSuccess: () => {
      toast.success("카페가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: cafeKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.markers() });
    },
    onError: (error) => toast.error(error.message),
  });

  const approveImageMutation = useMutation({
    mutationFn: approveImageSubmission,
    onSuccess: () => {
      toast.success("이미지 제보가 승인되었습니다.");
      queryClient.invalidateQueries({ queryKey: imageSubmissionKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteImageMutation = useMutation({
    mutationFn: deleteImageSubmission,
    onSuccess: () => {
      toast.success("이미지 제보가 거절되었습니다.");
      queryClient.invalidateQueries({ queryKey: imageSubmissionKeys.list() });
    },
    onError: (error) => toast.error(error.message),
  });

  const approveEditMutation = useMutation({
    mutationFn: approveEditSubmission,
    onSuccess: () => {
      toast.success("수정 제보가 승인되었습니다.");
      queryClient.invalidateQueries({ queryKey: editSubmissionKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteEditMutation = useMutation({
    mutationFn: deleteEditSubmission,
    onSuccess: () => {
      toast.success("수정 제보가 거절되었습니다.");
      queryClient.invalidateQueries({ queryKey: editSubmissionKeys.list() });
    },
    onError: (error) => toast.error(error.message),
  });

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const registeredCount = cafes.length;
  const imageSubmissionCount = imageSubmissions.length;
  const editSubmissionCount = editSubmissions.length;

  const isLoading =
    filter === "pending"
      ? isSubmissionsLoading
      : filter === "registered"
        ? isCafesLoading
        : filter === "images"
          ? isImagesLoading
          : isEditsLoading;
  const isError =
    filter === "pending"
      ? isSubmissionsError
      : filter === "registered"
        ? isCafesError
        : filter === "images"
          ? isImagesError
          : isEditsError;

  const filteredSubmissions =
    filter === "pending"
      ? submissions.filter((s) => s.status === "pending")
      : [];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">☕</span>
            <span className="font-bold text-gray-900 text-base">카공맵</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">어드민</span>
          </div>
          {pendingCount > 0 && (
            <span className="text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
              {pendingCount}건 대기
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "승인 대기",
              value: pendingCount,
              color: "text-amber-600",
              loading: isSubmissionsLoading,
            },
            {
              label: "등록된 카페",
              value: registeredCount,
              color: "text-emerald-600",
              loading: isCafesLoading,
            },
            {
              label: "사진 제보",
              value: imageSubmissionCount,
              color: "text-blue-600",
              loading: isImagesLoading,
            },
            {
              label: "수정 제보",
              value: editSubmissionCount,
              color: "text-purple-600",
              loading: isEditsLoading,
            },
          ].map(({ label, value, color, loading }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4"
            >
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>
                {loading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {(["pending", "registered", "images", "edits"] as FilterTab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  filter === tab
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {tab === "pending"
                  ? "대기 중"
                  : tab === "registered"
                    ? "등록됨"
                    : tab === "images"
                      ? "사진 제보"
                      : "수정 제보"}
              </button>
            ),
          )}
        </div>

        {/* 로딩 */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="flex gap-3 mb-3">
                  <div className="h-5 w-12 bg-gray-100 rounded-full" />
                  <div className="h-5 w-40 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-4 w-64 bg-gray-100 rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {isError && (
          <div className="flex flex-col items-center py-24 text-gray-400">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-sm">데이터를 불러오지 못했습니다.</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading &&
          !isError &&
          (filter === "pending"
            ? filteredSubmissions.length === 0
            : filter === "registered"
              ? cafes.length === 0
              : filter === "images"
                ? imageSubmissions.length === 0
                : editSubmissions.length === 0) && (
            <div className="flex flex-col items-center py-24 text-gray-400">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm">
                {filter === "pending"
                  ? "대기 중인 제보가 없습니다."
                  : filter === "registered"
                    ? "등록된 카페가 없습니다."
                    : filter === "images"
                      ? "사진 제보가 없습니다."
                      : "수정 제보가 없습니다."}
              </p>
            </div>
          )}

        {/* 카드 목록 */}
        {!isLoading && !isError && filter === "pending" && (
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onApprove={() => approveMutation.mutate(submission.id)}
                onDelete={() => deleteSubmissionMutation.mutate(submission.id)}
                isApproving={
                  approveMutation.isPending &&
                  approveMutation.variables === submission.id
                }
                isDeleting={
                  deleteSubmissionMutation.isPending &&
                  deleteSubmissionMutation.variables === submission.id
                }
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && filter === "registered" && (
          <div className="space-y-3">
            {cafes.map((cafe) => (
              <RegisteredCafeCard
                key={cafe.id}
                cafe={cafe}
                onDelete={() => {
                  if (
                    confirm(
                      `정말 "${cafe.name}"을(를) 삭제하시겠습니까?\n관련된 후기·즐겨찾기·태그도 함께 삭제됩니다.`,
                    )
                  ) {
                    deleteCafeMutation.mutate(cafe.id);
                  }
                }}
                isDeleting={
                  deleteCafeMutation.isPending &&
                  deleteCafeMutation.variables === cafe.id
                }
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && filter === "images" && (
          <div className="space-y-3">
            {imageSubmissions.map((submission) => (
              <ImageSubmissionCard
                key={submission.id}
                submission={submission}
                onApprove={() => approveImageMutation.mutate(submission.id)}
                onDelete={() => deleteImageMutation.mutate(submission.id)}
                isApproving={
                  approveImageMutation.isPending &&
                  approveImageMutation.variables === submission.id
                }
                isDeleting={
                  deleteImageMutation.isPending &&
                  deleteImageMutation.variables === submission.id
                }
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && filter === "edits" && (
          <div className="space-y-3">
            {editSubmissions.map((submission) => (
              <EditSubmissionCard
                key={submission.id}
                submission={submission}
                onApprove={() => approveEditMutation.mutate(submission.id)}
                onDelete={() => deleteEditMutation.mutate(submission.id)}
                isApproving={
                  approveEditMutation.isPending &&
                  approveEditMutation.variables === submission.id
                }
                isDeleting={
                  deleteEditMutation.isPending &&
                  deleteEditMutation.variables === submission.id
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface SubmissionCardProps {
  submission: CafeSubmission;
  onApprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isDeleting: boolean;
}

function SubmissionCard({
  submission,
  onApprove,
  onDelete,
  isApproving,
  isDeleting,
}: SubmissionCardProps) {
  const isPending = submission.status === "pending";

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${CARD_ACCENT[submission.status]} shadow-sm overflow-hidden transition-shadow hover:shadow-md`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* 왼쪽 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {/* 이름 + 상태 배지 */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[submission.status]}`}
              >
                {STATUS_LABEL[submission.status]}
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {submission.name}
              </h2>
            </div>

            {/* 주소 */}
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
              <span>📍</span>
              {submission.address}
            </p>

            {/* 태그 */}
            {submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {submission.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium"
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
              {submission.hours && (
                <span className="flex items-center gap-1">
                  <span>🕐</span>
                  {submission.hours}
                </span>
              )}
              {submission.min_order_amount != null && (
                <span className="flex items-center gap-1">
                  <span>💰</span>
                  최소 {submission.min_order_amount.toLocaleString("ko-KR")}원
                </span>
              )}
              <span>
                제보{" "}
                {new Date(submission.submitted_at).toLocaleDateString("ko-KR")}
              </span>
              {submission.reviewed_at && (
                <span>
                  검토{" "}
                  {new Date(submission.reviewed_at).toLocaleDateString("ko-KR")}
                </span>
              )}
            </div>

            {/* 설명 */}
            {submission.description && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 leading-relaxed">
                {submission.description}
              </p>
            )}

            {/* 이미지 */}
            {submission.images.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {submission.images.map((id, i) => (
                  <Image
                    key={i}
                    src={getCloudflareImageUrl(id, "middle")}
                    alt={`제보 이미지 ${i + 1}`}
                    width={100}
                    height={100}
                    className="h-20 w-20 object-cover rounded-xl shrink-0 border border-gray-100"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {isPending && (
            <div className="flex flex-col gap-2 shrink-0 pt-0.5">
              <button
                onClick={onApprove}
                disabled={isApproving || isDeleting}
                className="px-4 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isApproving ? "승인 중…" : "✓ 승인"}
              </button>
              <button
                onClick={onDelete}
                disabled={isApproving || isDeleting}
                className="px-4 py-2 text-sm font-semibold bg-white text-red-500 border border-red-200 rounded-xl hover:bg-red-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isDeleting ? "처리 중…" : "✕ 거절"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RegisteredCafeCardProps {
  cafe: CafeWithDetail;
  onDelete: () => void;
  isDeleting: boolean;
}

function RegisteredCafeCard({
  cafe,
  onDelete,
  isDeleting,
}: RegisteredCafeCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-emerald-400 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* 이름 + 등록 배지 */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                등록됨
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {cafe.name}
              </h2>
              <span className="text-[11px] text-gray-400">
                ❤ {cafe.like_count}
              </span>
            </div>

            {/* 주소 */}
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
              <span>📍</span>
              {cafe.address}
            </p>

            {/* 태그 */}
            {cafe.tags && cafe.tags.length > 0 && cafe.tags[0] !== null && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {cafe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium"
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
              {cafe.hours && (
                <span className="flex items-center gap-1">
                  <span>🕐</span>
                  {cafe.hours}
                </span>
              )}
              {cafe.min_order_amount != null && (
                <span className="flex items-center gap-1">
                  <span>💰</span>
                  최소 {cafe.min_order_amount.toLocaleString("ko-KR")}원
                </span>
              )}
              <span>
                등록 {new Date(cafe.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            {/* 설명 */}
            {cafe.description && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 leading-relaxed">
                {cafe.description}
              </p>
            )}

            {/* 이미지 */}
            {cafe.images.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {cafe.images.map((id, i) => (
                  <Image
                    key={i}
                    src={getCloudflareImageUrl(id, "middle")}
                    alt={`${cafe.name} 이미지 ${i + 1}`}
                    width={100}
                    height={100}
                    className="h-20 w-20 object-cover rounded-xl shrink-0 border border-gray-100"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 shrink-0 pt-0.5">
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isDeleting ? "삭제 중…" : "🗑 삭제"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ImageSubmissionCardProps {
  submission: CafeImageSubmission;
  onApprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isDeleting: boolean;
}

function ImageSubmissionCard({
  submission,
  onApprove,
  onDelete,
  isApproving,
  isDeleting,
}: ImageSubmissionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-blue-400 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* 카페명 + 배지 */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                사진 제보
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {submission.cafe_name ?? "카페 정보 없음"}
              </h2>
            </div>

            {/* 카페 주소 */}
            {submission.cafe_address && (
              <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                <span>📍</span>
                {submission.cafe_address}
              </p>
            )}

            {/* 메모 */}
            {submission.caption && (
              <p className="mt-1 mb-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 leading-relaxed">
                💬 {submission.caption}
              </p>
            )}

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400 mb-3">
              <span>
                제보{" "}
                {new Date(submission.submitted_at).toLocaleDateString("ko-KR")}
              </span>
              <span>{submission.images.length}장</span>
              {submission.user_id && (
                <span className="truncate max-w-[160px]">
                  user: {submission.user_id}
                </span>
              )}
            </div>

            {/* 이미지 */}
            {submission.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {submission.images.map((id, i) => (
                  <Image
                    key={i}
                    src={getCloudflareImageUrl(id, "middle")}
                    alt={`제보 이미지 ${i + 1}`}
                    width={100}
                    height={100}
                    className="h-20 w-20 object-cover rounded-xl shrink-0 border border-gray-100"
                  />
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 shrink-0 pt-0.5">
            <button
              onClick={onApprove}
              disabled={isApproving || isDeleting}
              className="px-4 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isApproving ? "승인 중…" : "✓ 승인"}
            </button>
            <button
              onClick={onDelete}
              disabled={isApproving || isDeleting}
              className="px-4 py-2 text-sm font-semibold bg-white text-red-500 border border-red-200 rounded-xl hover:bg-red-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isDeleting ? "처리 중…" : "✕ 거절"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditSubmissionCardProps {
  submission: CafeEditSubmission;
  onApprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isDeleting: boolean;
}

function EditSubmissionCard({
  submission,
  onApprove,
  onDelete,
  isApproving,
  isDeleting,
}: EditSubmissionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-purple-400 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* 카페명 + 배지 */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                수정 제보
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {submission.cafe_name ?? submission.name}
              </h2>
            </div>

            {/* 현재 카페 주소 */}
            {submission.cafe_address && (
              <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
                <span>현재:</span>
                <span className="truncate">{submission.cafe_address}</span>
              </p>
            )}

            {/* 제안된 변경 내용 */}
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5 text-xs text-gray-700 mb-3">
              <div>
                <span className="text-gray-400">이름</span>{" "}
                <span className="font-medium">{submission.name}</span>
              </div>
              <div>
                <span className="text-gray-400">주소</span>{" "}
                <span className="font-medium">{submission.address}</span>
              </div>
              {submission.hours && (
                <div>
                  <span className="text-gray-400">영업시간</span>{" "}
                  <span className="font-medium">{submission.hours}</span>
                </div>
              )}
              {submission.min_order_amount != null && (
                <div>
                  <span className="text-gray-400">최소금액</span>{" "}
                  <span className="font-medium">
                    {submission.min_order_amount.toLocaleString("ko-KR")}원
                  </span>
                </div>
              )}
              {submission.description && (
                <div>
                  <span className="text-gray-400">설명</span>{" "}
                  <span className="font-medium">{submission.description}</span>
                </div>
              )}
            </div>

            {/* 태그 */}
            {submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {submission.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium"
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}

            {/* 메타 */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
              <span>
                제보{" "}
                {new Date(submission.submitted_at).toLocaleDateString("ko-KR")}
              </span>
              {submission.user_id && (
                <span className="truncate max-w-[160px]">
                  user: {submission.user_id}
                </span>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2 shrink-0 pt-0.5">
            <button
              onClick={onApprove}
              disabled={isApproving || isDeleting}
              className="px-4 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isApproving ? "승인 중…" : "✓ 승인"}
            </button>
            <button
              onClick={onDelete}
              disabled={isApproving || isDeleting}
              className="px-4 py-2 text-sm font-semibold bg-white text-red-500 border border-red-200 rounded-xl hover:bg-red-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isDeleting ? "처리 중…" : "✕ 거절"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
