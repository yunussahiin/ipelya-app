import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { View } from "react-native";
import * as Linking from "expo-linking";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useDeviceToken } from "@/hooks/useDeviceToken";
import { useNotificationListener } from "@/hooks/useNotificationListener";
import { createSessionFromUrl } from "@/services/oauth.service";

function AppStack() {
  const { scheme, colors } = useTheme();

  // Initialize push notifications
  const deviceToken = useDeviceToken();
  useNotificationListener();

  // Setup deep linking for OAuth callbacks
  useEffect(() => {
    // Deep link URL'sini dinle
    const handleDeepLink = ({ url }: { url: string }) => {
      console.log("🔗 Deep link alındı:", url);
      createSessionFromUrl(url).catch((error) => {
        console.error("❌ Deep link session oluşturma hatası:", error);
      });
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Initial URL'yi kontrol et (app açılırken)
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        console.log("🔗 Initial deep link alındı:", url);
        createSessionFromUrl(url).catch((error) => {
          // OAuth callback değilse, hata gösterme
          if (error.message.includes("Token'sız")) {
            console.log("ℹ️ OAuth callback değil, normal app açılışı");
          } else {
            console.error("❌ Deep link session oluşturma hatası:", error);
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
