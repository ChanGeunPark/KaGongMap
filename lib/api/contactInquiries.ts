import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ContactInquiry,
  CreateContactInquiryPayload,
} from "@/types/db";

export const contactInquiryKeys = {
  all: ["contactInquiries"] as const,
  list: () => [...contactInquiryKeys.all, "list"] as const,
};

export async function createContactInquiry(
  payload: CreateContactInquiryPayload,
): Promise<void> {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "문의 접수 중 오류가 발생했습니다.");
  }
}

export async function fetchAdminContactInquiries(): Promise<ContactInquiry[]> {
  const res = await fetch("/api/admin/contact-inquiries", { cache: "no-store" });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "문의 조회 중 오류가 발생했습니다.");
  }
  const json = (await res.json()) as { inquiries: ContactInquiry[] };
  return json.inquiries ?? [];
}

export async function markContactInquiryRead(id: string): Promise<void> {
  const res = await fetch(
    `/api/admin/contact-inquiries/${encodeURIComponent(id)}/read`,
    { method: "POST" },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "문의 확인 처리 중 오류가 발생했습니다.");
  }
}

export async function resolveContactInquiry(id: string): Promise<void> {
  const res = await fetch(
    `/api/admin/contact-inquiries/${encodeURIComponent(id)}/resolve`,
    { method: "POST" },
  );
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message ?? "문의 처리 완료 중 오류가 발생했습니다.");
  }
}

export function useCreateContactInquiry() {
  return useMutation({
    mutationFn: createContactInquiry,
  });
}

export function useAdminContactInquiries() {
  return useQuery({
    queryKey: contactInquiryKeys.list(),
    queryFn: fetchAdminContactInquiries,
  });
}

export function useMarkContactInquiryRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markContactInquiryRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactInquiryKeys.list() });
    },
  });
}

export function useResolveContactInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveContactInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactInquiryKeys.list() });
    },
  });
}
