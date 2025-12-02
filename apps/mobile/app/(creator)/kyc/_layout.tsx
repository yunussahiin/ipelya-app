/**
 * KYC Layout
 * KYC doğrulama wizard için stack navigator
 */

import { Stack } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

export default function KYCLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right"
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="form" />
      <Stack.Screen name="id-front" />
      <Stack.Screen name="id-back" />
      <Stack.Screen name="selfie" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
