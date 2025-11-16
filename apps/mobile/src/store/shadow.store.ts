import { create } from "zustand";

type ShadowState = {
  enabled: boolean;
  pinSet: boolean;
  toggle: (next?: boolean) => void;
  setPinState: (pinEnabled: boolean) => void;
};

export const useShadowStore = create<ShadowState>((set) => ({
  enabled: false,
  pinSet: false,
  toggle: (next) => set((state) => ({ enabled: typeof next === "boolean" ? next : !state.enabled })),
  setPinState: (pinEnabled) => set({ pinSet: pinEnabled })
}));
