import { Control, Controller } from "react-hook-form";
import Image from "next/image";
import { CafeFormValues } from "./CafeInfoForm";
import ImageUploader from "../ImageUploader";
import { getCloudflareImageUrl } from "@/lib/utils";

interface InfoFormStep3Props {
  control: Control<CafeFormValues>;
  readOnlyImages?: string[];
}

// ── Step 3: 사진 ───────────────────────────────────────────────────────────
export default function InfoFormStep3({
  control,
  readOnlyImages,
}: InfoFormStep3Props) {
  if (readOnlyImages !== undefined) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-small text-fg-3">
          수정 제보에서는 사진을 변경할 수 없어요.
          <br />
          <span className="text-sm text-gray-400">
            사진 추가/변경은 카페 상세의 &quot;📷 사진 제보&quot; 기능을 이용해주세요.
          </span>
        </p>

        {readOnlyImages.length === 0 ? (
          <p className="text-sm text-fg-4 text-center py-6 rounded-xl bg-gray-50 border border-gray-100">
            등록된 사진이 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {readOnlyImages.map((id, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 ring-1 ring-black/5"
              >
                <Image
                  src={getCloudflareImageUrl(id, "middle")}
                  alt={`기존 이미지 ${i + 1}`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

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
