import { create } from "zustand";

interface NativeStoreState {
  isWebView: boolean;
  fcmToken: string | null;
  setIsWebView: (isWebView: boolean) => void;
  setFcmToken: (fcmToken: string) => void;
}

export const useNativeStore = create<NativeStoreState>((set) => ({
  isWebView: false,
  fcmToken: null,
  setIsWebView: (isWebView) => set({ isWebView }),
  setFcmToken: (fcmToken) => set({ fcmToken }),
}));
