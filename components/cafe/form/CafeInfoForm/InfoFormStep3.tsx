import { Control, Controller } from "react-hook-form";
import { CafeFormValues } from "./CafeInfoForm";
import ImageUploader from "../ImageUploader";

// ── Step 3: 사진 ───────────────────────────────────────────────────────────
export default function InfoFormStep3({
  control,
}: {
  control: Control<CafeFormValues>;
}) {
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
