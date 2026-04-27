"use client";

import { useState } from "react";
import {
  useForm,
  useWatch,
  Controller,
  Control,
  FieldErrors,
} from "react-hook-form";
import { cls } from "@/lib/utils";
import {
  TbAlertTriangle,
  TbCheck,
  TbChevronRight,
  TbChevronLeft,
} from "react-icons/tb";
import { toast } from "react-toastify";
import StepIndicator from "@/components/cafe/StepIndicator";
import AddressSearch from "@/components/cafe/AddressSearch";
import TagSelector from "@/components/cafe/TagSelector";
import ImageUploader from "@/components/cafe/ImageUploader";
import type { PlaceSearchResult } from "@/types/kakao";
import KaGongButton from "../button/KaGongButton";

// ── Types ──────────────────────────────────────────────────────────────────

interface CafeFormValues {
  name: string;
  place: PlaceSearchResult | null;
  hours: string;
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

// ── FieldError ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 text-error text-small">
      <TbAlertTriangle size={13} strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}

// ── Step 1: 기본 정보 ──────────────────────────────────────────────────────

function Step1({
  control,
  errors,
}: {
  control: Control<CafeFormValues>;
  errors: FieldErrors<CafeFormValues>;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 카페명 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-label font-semibold text-fg-2">
          카페명 <span className="text-error">*</span>
        </label>
        <Controller
          name="name"
          control={control}
          rules={{ required: "카페명을 입력해주세요" }}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              placeholder="카페 이름을 입력하세요"
              className={cls(
                "w-full rounded-xl border px-3.5 py-2.5 text-body bg-bg text-fg",
                "placeholder:text-fg-4 focus:outline-none transition-colors",
                errors.name
                  ? "border-error/70 focus:border-error"
                  : "border-border-medium focus:border-kg-amber",
              )}
            />
          )}
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* 주소 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-label font-semibold text-fg-2">
          주소 <span className="text-error">*</span>
        </label>
        <Controller
          name="place"
          control={control}
          rules={{
            validate: (v) => v !== null || "주소를 선택해주세요",
          }}
          render={({ field }) => (
            <AddressSearch
              value={field.value}
              onChange={field.onChange}
              error={errors.place?.message}
            />
          )}
        />
        <FieldError message={errors.place?.message} />
      </div>

      {/* 영업시간 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-label font-semibold text-fg-2">영업시간</label>
        <Controller
          name="hours"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              placeholder="예: 09:00 – 22:00 (월–금), 10:00 – 21:00 (주말)"
              className="w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-body bg-bg text-fg placeholder:text-fg-4 focus:outline-none focus:border-kg-amber transition-colors"
            />
          )}
        />
      </div>

      {/* 한줄 설명 */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-label font-semibold text-fg-2">
                한줄 설명
              </label>
              <span className="font-mono text-[11px] text-fg-4">
                {field.value.length}/80
              </span>
            </div>
            <input
              {...field}
              type="text"
              placeholder="이 카페를 한 줄로 소개해주세요"
              maxLength={80}
              className="w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-body bg-bg text-fg placeholder:text-fg-4 focus:outline-none focus:border-kg-amber transition-colors"
            />
          </div>
        )}
      />
    </div>
  );
}

// ── Step 2: 카공 정보 ──────────────────────────────────────────────────────

function Step2({
  control,
  errors,
}: {
  control: Control<CafeFormValues>;
  errors: FieldErrors<CafeFormValues>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-fg-3">
        해당하는 카공 태그를 모두 선택해주세요.
      </p>
      <Controller
        name="tags"
        control={control}
        rules={{
          validate: (v) => v.length > 0 || "태그를 최소 1개 선택해주세요",
        }}
        render={({ field }) => (
          <>
            <TagSelector value={field.value} onChange={field.onChange} />
            {field.value.length > 0 && (
              <p className="font-mono text-[11px] text-kg-amber-deep">
                {field.value.length}개 태그 선택됨
              </p>
            )}
          </>
        )}
      />
      <FieldError message={errors.tags?.message} />
    </div>
  );
}

// ── Step 3: 사진 ───────────────────────────────────────────────────────────

function Step3({ control }: { control: Control<CafeFormValues> }) {
  return (
    <Controller
      name="images"
      control={control}
      render={({ field }) => (
        <ImageUploader value={field.value} onChange={field.onChange} />
      )}
    />
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function CafeInfoForm() {
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
      description: "",
      tags: [],
      images: [],
    },
  });

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = (data: CafeFormValues) => {
    if (step !== STEPS.length - 1) return;

    // TODO: DB insert + 이미지 스토리지 업로드
    if (data.images.length === 0) {
      toast.error("이미지를 1장 이상 업로드 해주세요.");
      return;
    }

    console.log(data);
  };

  const images = useWatch({ control, name: "images" });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full mx-auto flex flex-col gap-6"
    >
      <p className="text-small text-fg-3">카공맵에 새로운 카페를 알려주세요.</p>

      <StepIndicator steps={STEPS} current={step} />

      <div className="rounded-2xl border border-border-medium bg-bg p-5 shadow-card">
        {step === 0 && <Step1 control={control} errors={errors} />}
        {step === 1 && <Step2 control={control} errors={errors} />}
        {step === 2 && <Step3 control={control} />}
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
          <button
            type="submit"
            disabled={images.length === 0}
            className={cls(
              "flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-small font-semibold text-white shadow-button transition-all",
              images.length > 0
                ? "bg-kg-amber hover:bg-kg-amber-deep"
                : "bg-gray-300 cursor-not-allowed",
            )}
          >
            등록하기
            <TbCheck size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </form>
  );
}
