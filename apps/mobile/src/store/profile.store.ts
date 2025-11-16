import { create } from "zustand";

type Profile = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isShadow?: boolean;
};

type ProfileState = {
  profile: Profile | null;
  setProfile: (data: Profile | null) => void;
  updatePartial: (payload: Partial<Profile>) => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  setProfile: (data) => set({ profile: data }),
  updatePartial: (payload) => {
    const current = get().profile;
    if (!current) {
      return;
    }
    set({ profile: { ...current, ...payload } });
  }
}));
