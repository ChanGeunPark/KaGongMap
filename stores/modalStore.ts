import { create } from "zustand";

interface ImageModalStoreState {
  imageUrl: string | null;
  showImageModal: boolean;
  setImageUrl: (imageUrl: string) => void;
  setShowImageModal: (showImageModal: boolean) => void;
}

export const useImageModalStore = create<ImageModalStoreState>((set) => ({
  imageUrl: null,
  showImageModal: false,
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setShowImageModal: (showImageModal) => set({ showImageModal }),
  closeImageModal: () => set({ imageUrl: null, showImageModal: false }),
}));
