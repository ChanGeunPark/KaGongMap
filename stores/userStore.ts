import { create } from "zustand";
import type { DbUser } from "@/types/db";

interface UserStoreState {
  dbUser: DbUser | null;
  setDbUser: (user: DbUser | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  dbUser: null,
  setDbUser: (user) => set({ dbUser: user }),
  clearUser: () => set({ dbUser: null }),
}));
