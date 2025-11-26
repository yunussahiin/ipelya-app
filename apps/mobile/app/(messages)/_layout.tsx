/**
 * Messages Layout
 *
 * Amaç: Mesajlaşma modülü için Stack navigator
 * Tarih: 2025-11-26
 */

import { Stack } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

export default function MessagesLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[conversationId]/index" />
      <Stack.Screen name="[conversationId]/settings" />
    </Stack>
  );
}
