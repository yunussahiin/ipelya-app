/**
 * Live Layout
 * Full-screen live ekranları için Stack layout
 * Tab bar gizli, immersive deneyim
 */

import { Stack } from "expo-router";

export default function LiveLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
        gestureEnabled: true,
        gestureDirection: "vertical"
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="watch/[sessionId]" />
      <Stack.Screen
        name="broadcast/index"
        options={{
          gestureEnabled: false // Creator yayınında aşağı çekme ile kapanma kapalı
        }}
      />
      <Stack.Screen name="audio-room/[sessionId]" />
      <Stack.Screen name="call/[callId]" />
    </Stack>
  );
}
