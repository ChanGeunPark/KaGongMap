"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import ImageUploader from "@/components/cafe/form/ImageUploader";
import KaGongButton from "@/components/button/KaGongButton";
import KagongMapModal from "@/components/modal/KagongMapModal";
import { useUploadCloudflareImages } from "@/lib/api/cloudflare";
import { cafeKeys } from "@/lib/api/cafes";
import { createCafeImageSubmission } from "@/lib/api/imageSubmissions";

interface ImageSubmitModalProps {
  cafeId: string;
  cafeName: string;
  showModal: boolean;
  onClose: () => void;
}

export default function ImageSubmitModal({
  cafeId,
  cafeName,
  showModal,
  onClose,
}: ImageSubmitModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const uploadMutation = useUploadCloudflareImages();
  const submitMutation = useMutation({
    mutationFn: createCafeImageSubmission,
    onSuccess: () => {
      toast.success("사진이 제보되었습니다. 승인 후 반영됩니다.");
      queryClient.invalidateQueries({ queryKey: cafeKeys.detail(cafeId) });
      setFiles([]);
      setCaption("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const isSubmitting = uploadMutation.isPending || submitMutation.isPending;

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.warn("사진을 1장 이상 첨부해주세요.");
      return;
    }
    try {
      const uploaded = await uploadMutation.mutateAsync(
        files.map((file) => ({ file })),
      );
      await submitMutation.mutateAsync({
        cafe_id: cafeId,
        images: uploaded.map((img) => img.id),
        caption: caption.trim() || undefined,
        user_id: userId,
      });
    } catch {
      // toast는 onError에서 처리
    }
  };

  return (
    <KagongMapModal
      showModal={showModal}
      showModalToggler={(open) => !open && onClose()}
      title={`📷 ${cafeName} 사진 제보`}
      blur
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-fg-3">
          이 카페의 사진을 제보해주세요. 어드민 검토 후 반영됩니다.
        </p>

        <ImageUploader value={files} onChange={setFiles} />

        <div className="flex flex-col gap-2">
          <label className="text-small font-semibold text-fg-2">
            메모 (선택)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="예: 콘센트 위치, 좌석 분위기 등"
            maxLength={200}
            rows={3}
            className="w-full rounded-md border border-border-medium px-3 py-2 text-sm resize-none focus:outline-none focus:border-kg-amber"
          />
          <span className="text-[11px] text-fg-4 self-end">
            {caption.length}/200
          </span>
        </div>

        <div className="flex gap-2 pt-2 justify-end">
          <KaGongButton
            buttonStyle="SECONDARY"
            buttonSize="LARGE"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </KaGongButton>
          <KaGongButton
            buttonStyle="PRIMARY"
            buttonSize="LARGE"
            onClick={handleSubmit}
            disabled={isSubmitting || files.length === 0}
          >
            {isSubmitting ? "제출 중…" : "제보하기"}
          </KaGongButton>
        </div>
      </div>
    </KagongMapModal>
  );
}
