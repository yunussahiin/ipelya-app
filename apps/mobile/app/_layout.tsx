import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

const appBackground = "#050505";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={appBackground} translucent animated />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: appBackground }
        }}
      />
    </SafeAreaProvider>
  );
}
