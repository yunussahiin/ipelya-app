/**
 * Broadcast Layout
 *
 * Amaç: Yayın kanalları modülü için Stack navigator
 * Tarih: 2025-11-26
 */

import { Stack } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

export default function BroadcastLayout() {
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
      <Stack.Screen name="create" />
      <Stack.Screen name="[channelId]/index" />
      <Stack.Screen name="[channelId]/settings" />
      <Stack.Screen name="[channelId]/members" />
    </Stack>
  );
}
