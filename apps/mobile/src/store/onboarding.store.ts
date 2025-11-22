import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type GenderOption = 
  | "erkek" 
  | "kadın" 
  | "non-binary" 
  | "genderqueer" 
  | "agender" 
  | "belirtmek-istemiyorum";

export type MoodOption = 
  | "romantik" 
  | "macera" 
  | "eğlenceli" 
  | "sakin" 
  | "entelektüel" 
  | "tutkulu";

export type PersonalityOption = 
  | "içe-dönük" 
  | "dışa-dönük" 
  | "dengeli" 
  | "yaratıcı" 
  | "pratik" 
  | "gizemli";

export type EnergyOption = "düşük" | "orta" | "yüksek";

export interface OnboardingStep1 {
  displayName: string;
  bio: string;
  avatarUrl?: string;
  gender: GenderOption | null;
}

export interface OnboardingStep2 {
  mood: MoodOption | null;
  personality: PersonalityOption | null;
  energy: EnergyOption | null;
}

export interface OnboardingStep3 {
  shadowPin: string;
  shadowPinConfirm: string;
  biometricEnabled: boolean;
  biometricType?: "face_id" | "touch_id" | "fingerprint" | null;
}

export interface OnboardingStep4 {
  tosAccepted: boolean;
  privacyAccepted: boolean;
  antiScreenshotAccepted: boolean;
  firewallAccepted: boolean;
}

export interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  step1: OnboardingStep1;
  step2: OnboardingStep2;
  step3: OnboardingStep3;
  step4: OnboardingStep4;
  isCompleted: boolean;

  // Actions
  setStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  updateStep1: (data: Partial<OnboardingStep1>) => void;
  updateStep2: (data: Partial<OnboardingStep2>) => void;
  updateStep3: (data: Partial<OnboardingStep3>) => void;
  updateStep4: (data: Partial<OnboardingStep4>) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialStep1: OnboardingStep1 = {
  displayName: "",
  bio: "",
  avatarUrl: undefined,
  gender: null,
};

const initialStep2: OnboardingStep2 = {
  mood: null,
  personality: null,
  energy: null,
};

const initialStep3: OnboardingStep3 = {
  shadowPin: "",
  shadowPinConfirm: "",
  biometricEnabled: false,
  biometricType: null,
};

const initialStep4: OnboardingStep4 = {
  tosAccepted: false,
  privacyAccepted: false,
  antiScreenshotAccepted: false,
  firewallAccepted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      step1: initialStep1,
      step2: initialStep2,
      step3: initialStep3,
      step4: initialStep4,
      isCompleted: false,

      setStep: (step) => set({ currentStep: step }),

      updateStep1: (data) =>
        set((state) => ({
          step1: { ...state.step1, ...data },
        })),

      updateStep2: (data) =>
        set((state) => ({
          step2: { ...state.step2, ...data },
        })),

      updateStep3: (data) =>
        set((state) => ({
          step3: { ...state.step3, ...data },
        })),

      updateStep4: (data) =>
        set((state) => ({
          step4: { ...state.step4, ...data },
        })),

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < 5) {
          set({ currentStep: (currentStep + 1) as 1 | 2 | 3 | 4 | 5 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as 1 | 2 | 3 | 4 | 5 });
        }
      },

      completeOnboarding: () =>
        set({
          isCompleted: true,
          currentStep: 5,
        }),

      resetOnboarding: () =>
        set({
          currentStep: 1,
          step1: initialStep1,
          step2: initialStep2,
          step3: initialStep3,
          step4: initialStep4,
          isCompleted: false,
        }),
    }),
    {
      name: "onboarding-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        step1: state.step1,
        step2: state.step2,
        step3: state.step3,
        step4: state.step4,
        isCompleted: state.isCompleted,
      }),
    }
  )
);
