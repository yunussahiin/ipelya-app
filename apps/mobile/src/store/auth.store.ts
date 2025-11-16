import { create } from "zustand";

type AuthState = {
  sessionToken: string | null;
  isHydrated: boolean;
  setSession: (token: string | null) => void;
  markHydrated: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  sessionToken: null,
  isHydrated: false,
  setSession: (token) => set({ sessionToken: token }),
  markHydrated: () => set({ isHydrated: true })
}));
