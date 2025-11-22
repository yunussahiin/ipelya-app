import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboardingStore } from "@/store/onboarding.store";
import { OnboardingStep1 } from "@/components/onboarding/OnboardingStep1";
import { OnboardingStep2 } from "@/components/onboarding/OnboardingStep2";
import { OnboardingStep3 } from "@/components/onboarding/OnboardingStep3";
import { OnboardingStep4 } from "@/components/onboarding/OnboardingStep4";
import { OnboardingStep5 } from "@/components/onboarding/OnboardingStep5";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { currentStep, nextStep, prevStep, setStep } = useOnboardingStore();
  const { step } = useLocalSearchParams<{ step?: string }>();

  // Resume onboarding from query param
  useEffect(() => {
    if (step) {
      const resumeStep = parseInt(step, 10);
      if (resumeStep > 0 && resumeStep <= 5) {
        console.log(`🔄 Onboarding resume: Step ${resumeStep}`);
        setStep(resumeStep as 1 | 2 | 3 | 4 | 5);
      }
    }
  }, [step, setStep]);

  const styles = createStyles(colors);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingStep1 onNext={nextStep} />;
      case 2:
        return <OnboardingStep2 onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <OnboardingStep3 onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <OnboardingStep4 onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <OnboardingStep5 onPrev={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4, 5].map((step) => (
          <View
            key={step}
            style={[styles.progressBar, step <= currentStep && styles.progressBarActive]}
          />
        ))}
      </View>

      {/* Step Counter */}
      <Text style={styles.stepCounter}>Adım {currentStep} / 5</Text>

      {/* Step Content */}
      <View style={styles.content}>{renderStep()}</View>
    </SafeAreaView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    progressContainer: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 16
    },
    progressBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border
    },
    progressBarActive: {
      backgroundColor: colors.accent
    },
    stepCounter: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      marginBottom: 8
    },
    content: {
      flex: 1
    },
    placeholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    backButton: {
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 12,
      marginBottom: 16
    },
    backButtonPressed: {
      opacity: 0.7
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.accentSoft
    }
  });
}
