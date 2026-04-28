import { Control, Controller, FieldErrors } from "react-hook-form";
import { CafeFormValues } from "./CafeInfoForm";
import TagSelector from "../TagSelector";
import FieldError from "@/components/input/FieldError";

// ── Step 2: 카공 정보 ──────────────────────────────────────────────────────
export default function InfoFormStep2({
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
