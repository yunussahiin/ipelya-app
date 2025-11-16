import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    // TODO: implement splash screen ve auth bootstrap akışını bağla.
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#050505" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#050505" }
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}
