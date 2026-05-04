// ── Step 1: 기본 정보 ──────────────────────────────────────────────────────

import AreaInput from "@/components/input/AreaInput";
import BasicInput from "@/components/input/BasicInput";
import FieldError from "@/components/input/FieldError";
import { Control, Controller, FieldErrors } from "react-hook-form";
import AddressSearch from "../AddressSearch";
import { CafeFormValues } from "./CafeInfoForm";
import HoursInput from "./HoursInput";

export default function InfoFormStep1({
  control,
  errors,
  descriptionLength,
  setNameValue,
}: {
  control: Control<CafeFormValues>;
  errors: FieldErrors<CafeFormValues>;
  descriptionLength: number;
  setNameValue: (name: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
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
              onChange={(place) => {
                field.onChange(place);
                setNameValue(place.name);
              }}
              error={errors.place?.message}
            />
          )}
        />
        <FieldError message={errors.place?.message} />
      </div>

      {/* 카페명 */}
      <div className="flex flex-col gap-1.5">
        <Controller
          name="name"
          control={control}
          rules={{ required: "카페명을 입력해주세요" }}
          render={({ field }) => (
            <BasicInput
              {...field}
              important
              readOnly
              label="카페명"
              name="name"
              type="text"
              placeholder="카페 이름을 입력하세요"
              errorText={errors.name?.message}
            />
          )}
        />
      </div>

      {/* 영업시간 */}
      <div className="flex flex-col gap-1.5">
        <Controller
          name="hours"
          control={control}
          render={({ field }) => (
            <HoursInput value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {/* 최소 주문 금액 */}
      <div className="flex flex-col gap-1.5">
        <Controller
          name="minOrderAmount"
          control={control}
          render={({ field }) => (
            <BasicInput
              {...field}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/[^\d]/g, "");
                const formatted = onlyDigits
                  ? Number(onlyDigits).toLocaleString("ko-KR")
                  : "";
                field.onChange(formatted);
              }}
              label="최소 주문 금액 (원)"
              name="minOrderAmount"
              type="text"
              placeholder="예: 5,000"
              errorText={errors.minOrderAmount?.message}
            />
          )}
        />
      </div>

      {/* 상세 설명 */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <AreaInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              label="상세 설명"
              placeholder="이 카페에 대해 설명해주세요."
              maxLength={300}
              descriptionLength={descriptionLength}
              errorText={errors.description?.message}
            />
          </div>
        )}
      />
    </div>
  );
}
