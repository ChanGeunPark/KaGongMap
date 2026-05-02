import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CloudflareImage {
  id: string;
  filename: string;
  uploaded: string;
  variants: string[];
  url: string | null;
}

// ── Query Keys ──────────────────────────────────────────────────────────────
export const cloudflareImageKeys = {
  all: ["cloudflare-images"] as const,
  detail: (id: string) => [...cloudflareImageKeys.all, "detail", id] as const,
};

// ── API ─────────────────────────────────────────────────────────────────────

export async function fetchCloudflareImage(
  id: string,
): Promise<CloudflareImage> {
  const res = await fetch(
    `/api/cloudflare/image?id=${encodeURIComponent(id)}`,
  );
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(json?.message ?? "이미지 조회 중 오류가 발생했습니다.");
  }
  return (await res.json()) as CloudflareImage;
}

export interface UploadCloudflareImagePayload {
  file: File | Blob;
  filename?: string;
  metadata?: Record<string, unknown>;
}

export async function uploadCloudflareImage(
  payload: UploadCloudflareImagePayload,
): Promise<CloudflareImage> {
  const formData = new FormData();
  const filename =
    payload.filename ??
    (payload.file instanceof File ? payload.file.name : "upload");
  formData.append("file", payload.file, filename);
  if (payload.metadata) {
    formData.append("metadata", JSON.stringify(payload.metadata));
  }

  const res = await fetch("/api/cloudflare/image", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(json?.message ?? "이미지 업로드 중 오류가 발생했습니다.");
  }
  return (await res.json()) as CloudflareImage;
}

export async function uploadCloudflareImages(
  payloads: UploadCloudflareImagePayload[],
): Promise<CloudflareImage[]> {
  return Promise.all(payloads.map(uploadCloudflareImage));
}

export interface BulkUploadResult {
  succeeded: CloudflareImage[];
  failed: { payload: UploadCloudflareImagePayload; error: Error }[];
}

export async function uploadCloudflareImagesSettled(
  payloads: UploadCloudflareImagePayload[],
): Promise<BulkUploadResult> {
  const results = await Promise.allSettled(payloads.map(uploadCloudflareImage));
  const succeeded: CloudflareImage[] = [];
  const failed: BulkUploadResult["failed"] = [];

  results.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      succeeded.push(result.value);
    } else {
      failed.push({
        payload: payloads[idx],
        error:
          result.reason instanceof Error
            ? result.reason
            : new Error(String(result.reason)),
      });
    }
  });

  return { succeeded, failed };
}

export async function deleteCloudflareImage(id: string): Promise<void> {
  const res = await fetch(
    `/api/cloudflare/image?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(json?.message ?? "이미지 삭제 중 오류가 발생했습니다.");
  }
}

// ── React Query Hooks ───────────────────────────────────────────────────────

export function useCloudflareImage(id: string | null) {
  return useQuery({
    queryKey: cloudflareImageKeys.detail(id ?? ""),
    queryFn: () => fetchCloudflareImage(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUploadCloudflareImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadCloudflareImage,
    onSuccess: (data) => {
      queryClient.setQueryData(cloudflareImageKeys.detail(data.id), data);
    },
  });
}

export function useUploadCloudflareImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadCloudflareImages,
    onSuccess: (images) => {
      images.forEach((image) => {
        queryClient.setQueryData(cloudflareImageKeys.detail(image.id), image);
      });
    },
  });
}

export function useUploadCloudflareImagesSettled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadCloudflareImagesSettled,
    onSuccess: ({ succeeded }) => {
      succeeded.forEach((image) => {
        queryClient.setQueryData(cloudflareImageKeys.detail(image.id), image);
      });
    },
  });
}

export function useDeleteCloudflareImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCloudflareImage,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: cloudflareImageKeys.detail(id) });
    },
  });
}
