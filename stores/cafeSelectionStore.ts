import { create } from "zustand";

interface CafeSelectionStoreState {
  selectedId: string | null;
  previewId: string | null;
  openCafePreview: (id: string) => void;
  closeCafePreview: () => void;
}

export const useCafeSelectionStore = create<CafeSelectionStoreState>((set) => ({
  selectedId: null,
  previewId: null,
  openCafePreview: (id) => set({ selectedId: id, previewId: id }),
  closeCafePreview: () => set({ selectedId: null, previewId: null }),
}));
