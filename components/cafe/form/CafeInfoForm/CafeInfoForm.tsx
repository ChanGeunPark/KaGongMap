"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { TbCheck, TbChevronRight, TbChevronLeft } from "react-icons/tb";
import { toast } from "react-toastify";
import StepIndicator from "@/components/cafe/form/StepIndicator";
import type { PlaceSearchResult } from "@/types/kakao";
import KaGongButton from "../../../button/KaGongButton";
import { createSubmission } from "@/lib/api/cafes";
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

// ── Constants ──────────────────────────────────────────────────────────────

const STEPS = ["기본 정보", "카공 정보", "사진"] as const;

const STEP_FIELDS: (keyof CafeFormValues)[][] = [
  ["name", "place"],
  ["tags"],
  [],
];

export default function CafeInfoForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  const {
    control,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<CafeFormValues>({
    defaultValues: {
      name: "",
      place: null,
      hours: "",
      minOrderAmount: "",
      description: "",
      tags: [],
      images: [],
    },
  });

  const { mutateAsync: uploadImages, isPending: isUploading } =
    useUploadCloudflareImages();

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: CafeFormValues) => {
    if (step !== STEPS.length - 1) return;

    if (data.images.length === 0) {
      toast.error("이미지를 1장 이상 업로드 해주세요.");
      return;
    }

    try {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  const images = useWatch({ control, name: "images" });
  const descriptionValue = useWatch({ control, name: "description" });
  const descriptionLength = descriptionValue.length;

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
      <p className="text-small text-fg-3">카공맵에 새로운 카페를 알려주세요.</p>

      <StepIndicator steps={STEPS} current={step} />

      <div className="rounded-2xl border border-border-medium bg-bg p-5 shadow-card">
        {step === 0 && (
          <InfoFormStep1
            control={control}
            errors={errors}
            descriptionLength={descriptionLength}
          />
        )}
        {step === 1 && <InfoFormStep2 control={control} errors={errors} />}
        {step === 2 && <InfoFormStep3 control={control} />}
      </div>

      <div className="flex items-center justify-between">
        {step > 0 ? (
          <KaGongButton
            buttonStyle="SECONDARY"
            onClick={() => setStep((s) => s - 1)}
          >
            <TbChevronLeft size={15} strokeWidth={2} />
            이전
          </KaGongButton>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <KaGongButton buttonStyle="PRIMARY" onClick={handleNext}>
            다음
            <TbChevronRight size={15} strokeWidth={2} />
          </KaGongButton>
        ) : (
          <KaGongButton
            buttonStyle="PRIMARY"
            type="submit"
            disabled={images.length === 0 || isUploading}
          >
            {isUploading ? "업로드 중..." : "등록하기"}
            <TbCheck size={15} strokeWidth={2.5} />
          </KaGongButton>
        )}
      </div>
    </form>
  );
}
