"use client";

import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import type { PlaceSearchResult } from "@/types/kakao";
import KaGongButton from "../../../button/KaGongButton";
import {
  createSubmission,
  createCafeEditSubmission,
  getCafeIdByNameAndAddress,
  cafeKeys,
  editSubmissionKeys,
} from "@/lib/api/cafes";
import { useUploadCloudflareImages } from "@/lib/api/cloudflare";
import InfoFormStep1 from "./InfoFormStep1";
import InfoFormStep2 from "./InfoFormStep2";
import InfoFormStep3 from "./InfoFormStep3";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CafeFormValues {
  name: string;
  place: PlaceSearchResult | null;
  hours: string;
  minOrderAmount: string;
  description: string;
  tags: string[];
  images: File[];
}

export type CafeFormMode = "create" | "edit";

interface CafeInfoFormProps {
  onClose: () => void;
  mode?: CafeFormMode;
  cafeId?: string;
  defaultValues?: Partial<CafeFormValues>;
  existingImages?: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const SECTIONS_CREATE = [
  { title: "기본 정보", description: "카페의 기본 정보를 입력해주세요." },
  { title: "카공 정보", description: "해당하는 카공 태그를 선택해주세요." },
  { title: "사진", description: "카페 사진을 업로드해주세요." },
] as const;

const SECTIONS_EDIT = [
  { title: "기본 정보", description: "수정할 정보를 변경해주세요." },
  { title: "카공 정보", description: "수정할 태그를 변경해주세요." },
  { title: "사진", description: "현재 등록된 사진입니다." },
] as const;

export default function CafeInfoForm({
  onClose,
  mode = "create",
  cafeId,
  defaultValues,
  existingImages,
}: CafeInfoFormProps) {
  const isEdit = mode === "edit";
  const sections = isEdit ? SECTIONS_EDIT : SECTIONS_CREATE;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId =
    (session?.user as { id?: string } | undefined)?.id ?? null;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CafeFormValues>({
    defaultValues: {
      name: "",
      place: null,
      hours: "",
      minOrderAmount: "",
      description: "",
      tags: [],
      images: [],
      ...defaultValues,
    },
  });

  const { mutateAsync: uploadImages, isPending: isUploading } =
    useUploadCloudflareImages();

  const onSubmit = async (data: CafeFormValues) => {
    try {
      if (!isEdit) {
        // 신규 등록
        if (data.place?.name && data.place?.roadAddress) {
          const id = await getCafeIdByNameAndAddress(
            data.place.name,
            data.place.roadAddress,
          );
          if (id) {
            toast.error("이미 존재하는 카페입니다.");
            return;
          }
        }

        const uploaded = await uploadImages(
          data.images.map((file) => ({ file })),
        );

        const minOrder = data.minOrderAmount.replace(/[^\d]/g, "");
        await createSubmission({
          name: data.name,
          address: data.place?.roadAddress ?? "",
          lat: data.place?.lat ?? 0,
          lng: data.place?.lng ?? 0,
          hours: data.hours || undefined,
          min_order_amount: minOrder ? Number(minOrder) : undefined,
          images: uploaded.map((image) => image.id),
          description: data.description || undefined,
          tags: data.tags as import("@/types/db").CafeTag[],
        });
        toast.success("제보가 접수되었습니다. 검토 후 지도에 등록됩니다.");
        onClose();
        return;
      }

      // 수정 제보
      if (!cafeId) {
        toast.error("카페 정보를 찾을 수 없습니다.");
        return;
      }

      const minOrder = data.minOrderAmount.replace(/[^\d]/g, "");
      await createCafeEditSubmission({
        cafe_id: cafeId,
        name: data.name,
        address: data.place?.roadAddress ?? defaultValues?.place?.roadAddress ?? "",
        lat: data.place?.lat ?? defaultValues?.place?.lat ?? 0,
        lng: data.place?.lng ?? defaultValues?.place?.lng ?? 0,
        hours: data.hours || undefined,
        min_order_amount: minOrder ? Number(minOrder) : undefined,
        description: data.description || undefined,
        tags: data.tags as import("@/types/db").CafeTag[],
        user_id: userId,
      });

      queryClient.invalidateQueries({ queryKey: editSubmissionKeys.list() });
      queryClient.invalidateQueries({ queryKey: cafeKeys.detail(cafeId) });
      toast.success("수정 제보가 접수되었습니다. 어드민 검토 후 반영됩니다.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  const descriptionValue = useWatch({ control, name: "description" });
  const descriptionLength = descriptionValue?.length ?? 0;

  const isBusy = isUploading || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          (e.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
        }
      }}
      className="w-full mx-auto flex flex-col gap-6"
    >
      <p className="text-small text-fg-3">
        {isEdit
          ? "이 카페의 정보 수정을 제안합니다. 어드민 승인 후 반영돼요."
          : "카공맵에 새로운 카페를 알려주세요."}
      </p>

      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5 rounded-lg p-4 bg-zinc-50">
          <h3 className="text-h3 font-bold text-center">{sections[0].title}</h3>
          <p className="text-sm text-center text-zinc-500">
            {sections[0].description}
          </p>
        </div>
        <div className="rounded-2xl border border-border-medium bg-bg p-5 shadow-card">
          <InfoFormStep1
            control={control}
            errors={errors}
            descriptionLength={descriptionLength}
            setNameValue={(name) =>
              setValue("name", name, { shouldValidate: true })
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5 rounded-lg p-4 bg-zinc-50">
          <h3 className="text-h3 font-bold text-center">{sections[1].title}</h3>
          <p className="text-sm text-center text-zinc-500">
            {sections[1].description}
          </p>
        </div>
        <div className="rounded-2xl border border-border-medium bg-bg p-5 shadow-card">
          <InfoFormStep2 control={control} errors={errors} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5 rounded-lg p-4 bg-zinc-50">
          <h3 className="text-h3 font-bold text-center">{sections[2].title}</h3>
          <p className="text-sm text-center text-zinc-500">
            {sections[2].description}
          </p>
        </div>
        <div className="rounded-2xl border border-border-medium bg-bg p-5 shadow-card">
          <InfoFormStep3
            control={control}
            readOnlyImages={isEdit ? (existingImages ?? []) : undefined}
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <KaGongButton
          buttonStyle="SECONDARY"
          type="button"
          onClick={onClose}
          disabled={isBusy}
        >
          취소
        </KaGongButton>
        <KaGongButton
          buttonStyle="PRIMARY"
          type="submit"
          disabled={isBusy}
        >
          {isBusy
            ? isEdit
              ? "제출 중..."
              : "업로드 중..."
            : isEdit
              ? "수정 제보하기"
              : "등록하기"}
        </KaGongButton>
      </div>
    </form>
  );
}
