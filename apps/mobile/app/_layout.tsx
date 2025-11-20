import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useDeviceToken } from "@/hooks/useDeviceToken";
import { useNotificationListener } from "@/hooks/useNotificationListener";

function AppStack() {
  const { scheme, colors } = useTheme();

  // Initialize push notifications
  const deviceToken = useDeviceToken();
  useNotificationListener();

  // Log device token status
  if (deviceToken.error) {
    console.warn("⚠️ Device token error:", deviceToken.error);
  }

  return (
    <>
      <SystemBars style={scheme === "dark" ? "light" : "dark"} hidden={{ navigationBar: false }} />
      <StatusBar
        style={scheme === "dark" ? "light" : "dark"}
        backgroundColor={colors.background}
        translucent
        animated
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: colors.background }
          }}
        />
      </View>
    </>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppStack />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
