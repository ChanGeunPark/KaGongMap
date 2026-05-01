import { CafeWithDetail } from "@/types/db";
import { create } from "zustand";

// ── Image Modal Interface ──────────────────────────────────────────────────────
interface ImageModalStoreState {
  imageUrl: string | null;
  showImageModal: boolean;
  setImageUrl: (imageUrl: string) => void;
  setShowImageModal: (showImageModal: boolean) => void;
}

interface ImageSubmitModalStoreState {
  showImageSubmitModal: boolean;
  cafeId: string | null;
  cafeName: string | null;
  setShowImageSubmitModal: (showImageSubmitModal: boolean) => void;
  setCafeId: (cafeId: string) => void;
  setCafeName: (cafeName: string) => void;
}

interface CafeEditModalStoreState {
  showCafeEditModal: boolean;
  cafe: CafeWithDetail | null;
  setShowCafeEditModal: (showCafeEditModal: boolean) => void;
  setCafe: (cafe: CafeWithDetail) => void;
}

// ── Image Modal Store ───────────────────────────────────────────────────────────
export const useImageModalStore = create<ImageModalStoreState>((set) => ({
  imageUrl: null,
  showImageModal: false,
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setShowImageModal: (showImageModal) => set({ showImageModal }),
  closeImageModal: () => set({ imageUrl: null, showImageModal: false }),
}));

// 이미지 제보 모달
export const useImageSubmitModalStore = create<ImageSubmitModalStoreState>(
  (set) => ({
    showImageSubmitModal: false,
    cafeId: null,
    cafeName: null,
    setCafeId: (cafeId) => set({ cafeId }),
    setCafeName: (cafeName) => set({ cafeName }),
    setShowImageSubmitModal: (showImageSubmitModal) =>
      set(
        showImageSubmitModal
          ? { showImageSubmitModal }
          : { showImageSubmitModal: false, cafeId: null, cafeName: null },
      ),
  }),
);

// 카페 수정 모달
export const useCafeEditModalStore = create<CafeEditModalStoreState>((set) => ({
  showCafeEditModal: false,
  cafe: null,
  setShowCafeEditModal: (showCafeEditModal) =>
    set(
      showCafeEditModal
        ? { showCafeEditModal }
        : { showCafeEditModal: false, cafe: null },
    ),
  setCafe: (cafe) => set({ cafe }),
}));
