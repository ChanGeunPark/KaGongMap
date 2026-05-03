"use client";

import KagongMapModal from "@/components/modal/KagongMapModal";
import CafeInfoForm from "@/components/cafe/form/CafeInfoForm/CafeInfoForm";
import type { CafeWithDetail } from "@/types/db";
import type { PlaceSearchResult } from "@/types/kakao";

interface CafeEditModalProps {
  cafe: CafeWithDetail;
  showModal: boolean;
  onClose: () => void;
}

export default function CafeEditModal({
  cafe,
  showModal,
  onClose,
}: CafeEditModalProps) {
  if (!showModal) return null;

  const place: PlaceSearchResult = {
    id: cafe.id,
    name: cafe.name,
    address: cafe.address,
    roadAddress: cafe.address,
    lat: cafe.lat,
    lng: cafe.lng,
  };

  return (
    <KagongMapModal
      showModal={showModal}
      showModalToggler={(open) => !open && onClose()}
      title={`✏️ ${cafe.name} 정보 수정 제보`}
      blur
      zIndex={260}
    >
      <CafeInfoForm
        mode="edit"
        cafeId={cafe.id}
        existingImages={cafe.images ?? []}
        defaultValues={{
          name: cafe.name,
          place,
          hours: cafe.hours ?? "",
          minOrderAmount:
            cafe.min_order_amount != null
              ? cafe.min_order_amount.toLocaleString("ko-KR")
              : "",
          description: cafe.description ?? "",
          tags: (cafe.tags ?? []).filter(Boolean) as string[],
          images: [],
        }}
        onClose={onClose}
      />
    </KagongMapModal>
  );
}
