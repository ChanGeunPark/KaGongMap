"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCafesAdmin, cafeKeys } from "@/lib/api/cafes";
import { fetchSubmissions, submissionKeys } from "@/lib/api/submissions";
import {
  fetchImageSubmissions,
  imageSubmissionKeys,
} from "@/lib/api/imageSubmissions";
import {
  fetchEditSubmissions,
  editSubmissionKeys,
} from "@/lib/api/editSubmissions";
import Image from "next/image";
import { useAdminCafeReports } from "@/lib/api/cafeReports";
import { useAdminContactInquiries } from "@/lib/api/contactInquiries";
import { useAdminReviewReports } from "@/lib/api/reviewReports";
import CafeReportsTab from "@/app/admin/_components/CafeReportsTab";
import ContactInquiriesTab from "@/app/admin/_components/ContactInquiriesTab";
import ReviewReportsTab from "@/app/admin/_components/ReviewReportsTab";
import Link from "next/link";
import SubmissionCard from "./SubmissionCard";
import RegisteredCafeCard from "./RegisteredCafeCard";
import ImageSubmissionCard from "./ImageSubmissionCard";
import EditSubmissionCard from "./EditSubmissionCard";
import { useAdminMutations } from "@/app/admin/_hooks/useAdminMutations";

type FilterTab =
  | "pending"
  | "registered"
  | "images"
  | "edits"
  | "inquiries"
  | "cafeReports"
  | "reports";

const TAB_LABEL: Record<FilterTab, string> = {
  pending: "대기 중",
  registered: "등록됨",
  images: "사진 제보",
  edits: "수정 제보",
  inquiries: "문의",
  cafeReports: "카페 신고",
  reports: "후기 신고",
};

const EMPTY_LABEL: Record<
  Exclude<FilterTab, "inquiries" | "cafeReports" | "reports">,
  string
> = {
  pending: "대기 중인 제보가 없습니다.",
  registered: "등록된 카페가 없습니다.",
  images: "사진 제보가 없습니다.",
  edits: "수정 제보가 없습니다.",
};

export default function AdminDashboard() {
  const [filter, setFilter] = useState<FilterTab>("pending");

  const submissionsQuery = useQuery({
    queryKey: submissionKeys.list(),
    queryFn: fetchSubmissions,
  });
  const cafesQuery = useQuery({
    queryKey: cafeKeys.list(),
    queryFn: fetchCafesAdmin,
  });
  const imageSubmissionsQuery = useQuery({
    queryKey: imageSubmissionKeys.list(),
    queryFn: fetchImageSubmissions,
  });
  const editSubmissionsQuery = useQuery({
    queryKey: editSubmissionKeys.list(),
    queryFn: fetchEditSubmissions,
  });
  const { data: reportGroups = [] } = useAdminReviewReports();
  const { data: cafeReportGroups = [] } = useAdminCafeReports();
  const { data: contactInquiries = [] } = useAdminContactInquiries();

  const submissions = submissionsQuery.data ?? [];
  const cafes = cafesQuery.data ?? [];
  const imageSubmissions = imageSubmissionsQuery.data ?? [];
  const editSubmissions = editSubmissionsQuery.data ?? [];

  const {
    approve,
    rejectSubmission,
    removeCafe,
    approveImage,
    rejectImage,
    approveEdit,
    rejectEdit,
  } = useAdminMutations();

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const registeredCount = cafes.length;
  const imageSubmissionCount = imageSubmissions.length;
  const editSubmissionCount = editSubmissions.length;
  const reportCount = reportGroups.reduce((sum, g) => sum + g.pending_count, 0);
  const cafeReportCount = cafeReportGroups.reduce(
    (sum, g) => sum + g.pending_count,
    0,
  );
  const unreadInquiryCount = contactInquiries.filter(
    (inquiry) => inquiry.status === "pending",
  ).length;

  const TAB_QUERY: Record<
    Exclude<FilterTab, "inquiries" | "cafeReports" | "reports">,
    { isLoading: boolean; isError: boolean; isEmpty: boolean }
  > = {
    pending: {
      isLoading: submissionsQuery.isLoading,
      isError: submissionsQuery.isError,
      isEmpty: pendingCount === 0,
    },
    registered: {
      isLoading: cafesQuery.isLoading,
      isError: cafesQuery.isError,
      isEmpty: cafes.length === 0,
    },
    images: {
      isLoading: imageSubmissionsQuery.isLoading,
      isError: imageSubmissionsQuery.isError,
      isEmpty: imageSubmissions.length === 0,
    },
    edits: {
      isLoading: editSubmissionsQuery.isLoading,
      isError: editSubmissionsQuery.isError,
      isEmpty: editSubmissions.length === 0,
    },
  };

  const currentTab =
    filter !== "inquiries" && filter !== "cafeReports" && filter !== "reports"
      ? TAB_QUERY[filter]
      : null;
  const filteredSubmissions =
    filter === "pending"
      ? submissions.filter((s) => s.status === "pending")
      : [];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-fg font-semibold text-[19px] tracking-[-0.3px] shrink-0 transition-opacity hover:opacity-80"
            >
              <Image
                src="/images/logo.png"
                alt="카공맵"
                width={120}
                height={50}
                className="object-cover"
              />
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/auto-submit"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full transition-colors"
              title="AI 자동 제보 (본인 PC 의 Claude CLI 사용)"
            >
              ✨ AI 자동 제보
            </Link>
            {pendingCount > 0 && (
              <span className="text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                {pendingCount}건 대기
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "승인 대기",
              value: pendingCount,
              color: "text-amber-600",
              loading: submissionsQuery.isLoading,
            },
            {
              label: "등록된 카페",
              value: registeredCount,
              color: "text-emerald-600",
              loading: cafesQuery.isLoading,
            },
            {
              label: "사진 제보",
              value: imageSubmissionCount,
              color: "text-blue-600",
              loading: imageSubmissionsQuery.isLoading,
            },
            {
              label: "수정 제보",
              value: editSubmissionCount,
              color: "text-purple-600",
              loading: editSubmissionsQuery.isLoading,
            },
            {
              label: "읽지 않은 문의",
              value: unreadInquiryCount,
              color: "text-sky-600",
              loading: false,
            },
            {
              label: "카페 신고",
              value: cafeReportCount,
              color: "text-orange-600",
              loading: false,
            },
            {
              label: "후기 신고",
              value: reportCount,
              color: "text-red-600",
              loading: false,
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

        <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {(Object.keys(TAB_LABEL) as FilterTab[]).map((tab) => {
            const badge =
              tab === "inquiries"
                ? unreadInquiryCount
                : tab === "cafeReports"
                ? cafeReportCount
                : tab === "reports"
                  ? reportCount
                  : 0;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 inline-flex items-center gap-1.5 ${
                  filter === tab
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {TAB_LABEL[tab]}
                {badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      filter === tab
                        ? "bg-white text-gray-900"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {filter === "inquiries" && <ContactInquiriesTab />}
        {filter === "cafeReports" && <CafeReportsTab />}
        {filter === "reports" && <ReviewReportsTab />}

        {currentTab?.isLoading && <SkeletonList />}

        {currentTab?.isError && (
          <div className="flex flex-col items-center py-24 text-gray-400">
            <span className="text-4xl mb-3">⚠️</span>
            <p className="text-sm">데이터를 불러오지 못했습니다.</p>
          </div>
        )}

        {currentTab &&
          !currentTab.isLoading &&
          !currentTab.isError &&
          currentTab.isEmpty && (
            <div className="flex flex-col items-center py-24 text-gray-400">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-sm">
                {
                  EMPTY_LABEL[
                    filter as Exclude<
                      FilterTab,
                      "inquiries" | "cafeReports" | "reports"
                    >
                  ]
                }
              </p>
            </div>
          )}

        {filter === "pending" &&
          !currentTab?.isLoading &&
          !currentTab?.isError && (
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={() => approve.mutate(submission.id)}
                  onDelete={() => rejectSubmission.mutate(submission.id)}
                  isApproving={
                    approve.isPending && approve.variables === submission.id
                  }
                  isDeleting={
                    rejectSubmission.isPending &&
                    rejectSubmission.variables === submission.id
                  }
                />
              ))}
            </div>
          )}

        {filter === "registered" &&
          !currentTab?.isLoading &&
          !currentTab?.isError && (
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
                      removeCafe.mutate(cafe.id);
                    }
                  }}
                  isDeleting={
                    removeCafe.isPending && removeCafe.variables === cafe.id
                  }
                />
              ))}
            </div>
          )}

        {filter === "images" &&
          !currentTab?.isLoading &&
          !currentTab?.isError && (
            <div className="space-y-3">
              {imageSubmissions.map((submission) => (
                <ImageSubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={() => approveImage.mutate(submission.id)}
                  onDelete={() => rejectImage.mutate(submission.id)}
                  isApproving={
                    approveImage.isPending &&
                    approveImage.variables === submission.id
                  }
                  isDeleting={
                    rejectImage.isPending &&
                    rejectImage.variables === submission.id
                  }
                />
              ))}
            </div>
          )}

        {filter === "edits" &&
          !currentTab?.isLoading &&
          !currentTab?.isError && (
            <div className="space-y-3">
              {editSubmissions.map((submission) => (
                <EditSubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={() => approveEdit.mutate(submission.id)}
                  onDelete={() => rejectEdit.mutate(submission.id)}
                  isApproving={
                    approveEdit.isPending &&
                    approveEdit.variables === submission.id
                  }
                  isDeleting={
                    rejectEdit.isPending &&
                    rejectEdit.variables === submission.id
                  }
                />
              ))}
            </div>
          )}
      </main>
    </div>
  );
}

function SkeletonList() {
  return (
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
  );
}
