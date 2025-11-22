import { View, ScrollView, Pressable, Text, StyleSheet, Platform } from "react-native";
import { ReactNode } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

interface OnboardingLayoutProps {
  children: ReactNode;
  onNextPress: () => void;
  onPrevPress?: () => void;
  nextButtonText?: string;
  isNextDisabled?: boolean;
  showPrevButton?: boolean;
}

export function OnboardingLayout({
  children,
  onNextPress,
  onPrevPress,
  nextButtonText = "Devam Et",
  isNextDisabled = false,
  showPrevButton = true
}: OnboardingLayoutProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.buttonContainer}>
        {showPrevButton && onPrevPress && (
          <Pressable
            onPress={onPrevPress}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onNextPress}
          disabled={isNextDisabled}
          style={({ pressed }) => [
            styles.nextButton,
            showPrevButton ? styles.nextButtonWithBack : styles.nextButtonFull,
            {
              opacity: isNextDisabled || pressed ? 0.7 : 1
            }
          ]}
        >
          <Text style={styles.nextButtonText}>{nextButtonText}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background
    },
    container: {
      flex: 1,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 24
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 16,
      paddingBottom: Platform.OS === "ios" ? 32 : 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border
    },
    backButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center"
    },
    backButtonPressed: {
      opacity: 0.7
    },
    backButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accentSoft
    },
    nextButton: {
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 12 : 14,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight
    },
    nextButtonWithBack: {
      flex: 1
    },
    nextButtonFull: {
      flex: 1
    },
    nextButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      fontSize: 14,
      lineHeight: 20
    }
  });
}
