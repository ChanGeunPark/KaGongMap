"use client";

import { toast } from "react-toastify";
import {
  useAdminContactInquiries,
  useMarkContactInquiryRead,
  useResolveContactInquiry,
} from "@/lib/api/contactInquiries";
import { formatDate } from "@/lib/utils";
import type {
  ContactInquiry,
  ContactInquiryCategory,
  ContactInquiryStatus,
} from "@/types/db";

const CATEGORY_LABEL: Record<ContactInquiryCategory, string> = {
  service: "서비스 이용",
  report: "신고/콘텐츠",
  account: "계정/탈퇴",
  privacy: "개인정보",
  other: "기타",
};

const STATUS_LABEL: Record<ContactInquiryStatus, string> = {
  pending: "읽지 않음",
  read: "확인함",
  resolved: "처리 완료",
};

const STATUS_CLASS: Record<ContactInquiryStatus, string> = {
  pending: "bg-red-50 text-red-600 border-red-200",
  read: "bg-blue-50 text-blue-600 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export default function ContactInquiriesTab() {
  const {
    data: inquiries = [],
    isLoading,
    isError,
  } = useAdminContactInquiries();
  const readMut = useMarkContactInquiryRead();
  const resolveMut = useResolveContactInquiry();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center py-24 text-gray-400">
        <span className="text-4xl mb-3">⚠️</span>
        <p className="text-sm">문의를 불러오지 못했습니다.</p>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-gray-400">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">접수된 문의가 없습니다.</p>
      </div>
    );
  }

  const markRead = (inquiry: ContactInquiry) => {
    readMut.mutate(inquiry.id, {
      onSuccess: () => toast.success("문의 확인 처리했습니다."),
      onError: (err) => toast.error(err.message),
    });
  };

  const resolve = (inquiry: ContactInquiry) => {
    resolveMut.mutate(inquiry.id, {
      onSuccess: () => toast.success("문의가 처리 완료되었습니다."),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry) => (
        <div
          key={inquiry.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      STATUS_CLASS[inquiry.status]
                    }`}
                  >
                    {STATUS_LABEL[inquiry.status]}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {CATEGORY_LABEL[inquiry.category]}
                  </span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    {inquiry.email}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  접수 {formatDate(inquiry.created_at)}
                  {inquiry.read_at ? ` · 확인 ${formatDate(inquiry.read_at)}` : ""}
                  {inquiry.resolved_at
                    ? ` · 완료 ${formatDate(inquiry.resolved_at)}`
                    : ""}
                </p>
              </div>
            </div>

            <p className="mb-4 whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-3 text-[13px] leading-6 text-gray-700">
              {inquiry.content}
            </p>

            <div className="flex justify-end gap-2">
              {inquiry.status === "pending" && (
                <button
                  type="button"
                  onClick={() => markRead(inquiry)}
                  disabled={readMut.isPending}
                  className="px-3 py-1.5 rounded-lg text-mono font-medium bg-blue-500 text-white hover:bg-blue-600 cursor-pointer disabled:opacity-50"
                >
                  확인 처리
                </button>
              )}
              {inquiry.status !== "resolved" && (
                <button
                  type="button"
                  onClick={() => resolve(inquiry)}
                  disabled={resolveMut.isPending}
                  className="px-3 py-1.5 rounded-lg text-mono font-medium bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer disabled:opacity-50"
                >
                  처리 완료
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
