import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";
export type ThemeAccent = "magenta" | "aqua" | "amber" | "custom";

interface SettingsState {
  // Theme
  themeMode: ThemePreference;
  accentColor: ThemeAccent;
  customAccentColor: string;
  
  // Notifications (User & Creator)
  pushNotifications: boolean;
  emailNotifications: boolean;
  messageNotifications: boolean;
  
  // Privacy (User & Creator)
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  
  // Creator-specific
  creatorMode: boolean;
  autoAcceptSubscriptions: boolean;
  contentWatermark: boolean;
  
  // Actions
  setThemeMode: (mode: ThemePreference) => void;
  setAccentColor: (color: ThemeAccent) => void;
  setCustomAccentColor: (color: string) => void;
  togglePushNotifications: () => void;
  toggleEmailNotifications: () => void;
  toggleMessageNotifications: () => void;
  toggleShowOnlineStatus: () => void;
  toggleAllowDirectMessages: () => void;
  toggleCreatorMode: () => void;
  toggleAutoAcceptSubscriptions: () => void;
  toggleContentWatermark: () => void;
  resetSettings: () => void;
}

const defaultSettings = {
  themeMode: "dark" as ThemePreference,
  accentColor: "magenta" as ThemeAccent,
  customAccentColor: "#ff3b81",
  pushNotifications: true,
  emailNotifications: true,
  messageNotifications: true,
  showOnlineStatus: true,
  allowDirectMessages: true,
  creatorMode: false,
  autoAcceptSubscriptions: false,
  contentWatermark: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      setThemeMode: (mode) => set({ themeMode: mode }),
      setAccentColor: (color) => set({ accentColor: color }),
      setCustomAccentColor: (color) => set({ customAccentColor: color }),
      
      togglePushNotifications: () =>
        set((state) => ({ pushNotifications: !state.pushNotifications })),
      toggleEmailNotifications: () =>
        set((state) => ({ emailNotifications: !state.emailNotifications })),
      toggleMessageNotifications: () =>
        set((state) => ({ messageNotifications: !state.messageNotifications })),
      toggleShowOnlineStatus: () =>
        set((state) => ({ showOnlineStatus: !state.showOnlineStatus })),
      toggleAllowDirectMessages: () =>
        set((state) => ({ allowDirectMessages: !state.allowDirectMessages })),
      toggleCreatorMode: () =>
        set((state) => ({ creatorMode: !state.creatorMode })),
      toggleAutoAcceptSubscriptions: () =>
        set((state) => ({ autoAcceptSubscriptions: !state.autoAcceptSubscriptions })),
      toggleContentWatermark: () =>
        set((state) => ({ contentWatermark: !state.contentWatermark })),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: "ipelya-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
