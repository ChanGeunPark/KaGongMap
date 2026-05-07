"use client";

import Image from "next/image";
import KGIcon from "@/components/ui/KGIcon";
import { cls, getCloudflareImageUrl } from "@/lib/utils";
import {
  useImageModalStore,
  useImageSubmitModalStore,
} from "@/stores/modalStore";
import type { CafeMarker } from "@/types/db";

const MAX_VISIBLE = 5;
const SKELETON_COUNT = 4;

type ImageGalleryProps = {
  cafe: CafeMarker;
  images: string[];
  loading: boolean;
};

export default function ImageGallery({
  cafe,
  images,
  loading,
}: ImageGalleryProps) {
  const { setImageUrl, setShowImageModal } = useImageModalStore();
  const { setShowImageSubmitModal, setCafeId, setCafeName } =
    useImageSubmitModalStore();

  const visibleImages = images.slice(0, MAX_VISIBLE);
  const showGallery = images.length > 0 || !loading;

  return (
    <>
      {loading && (
        <div className="flex gap-2">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="size-[84px] rounded-lg shrink-0 cursor-pointer bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      )}

      {showGallery && (
        <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {visibleImages.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => {
                  setImageUrl(getCloudflareImageUrl(img, "public"));
                  setShowImageModal(true);
                }}
                className={cls(
                  "relative size-[84px] rounded-lg overflow-hidden shrink-0",
                  "ring-1 ring-black/5 hover:ring-black/15",
                  "transition-all active:scale-[0.97] cursor-pointer",
                )}
              >
                <Image
                  src={getCloudflareImageUrl(img, "middle")}
                  alt={`${cafe.name} ${idx + 1}`}
                  width={84}
                  height={84}
                  className="size-full object-cover"
                />
              </button>
            ))}

            {visibleImages.length < MAX_VISIBLE && (
              <button
                type="button"
                onClick={() => {
                  setCafeId(cafe.id);
                  setCafeName(cafe.name);
                  setShowImageSubmitModal(true);
                }}
                className={cls(
                  "size-[84px] rounded-lg shrink-0 cursor-pointer",
                  "border border-dashed border-zinc-300 bg-gray-50/60",
                  "flex flex-col items-center justify-center gap-1",
                  "text-zinc-400 hover:text-zinc-500",
                  "hover:border-zinc-400 hover:bg-gray-50 transition-colors",
                )}
              >
                <KGIcon name="plus" size={20} stroke={2.2} />
                <span className="text-[10px] font-medium tracking-tight">
                  사진 제보
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
