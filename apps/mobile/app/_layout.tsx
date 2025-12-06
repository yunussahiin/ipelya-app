import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { View, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Linking from "expo-linking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useDeviceToken } from "@/hooks/useDeviceToken";
import { useNotificationListener } from "@/hooks/useNotificationListener";
import { useLoadProfile } from "@/hooks/useLoadProfile";
import { useGlobalMessageRealtime, useGlobalPresence } from "@/hooks/messaging";
import { createSessionFromUrl } from "@/services/oauth.service";
import { ToastProvider } from "@/components/ui";

// LiveKit WebRTC globals setup
import { registerGlobals } from "@livekit/react-native";
registerGlobals();

// WebRTC PeerConnection uyarılarını gizle (eski bağlantı referansları)
LogBox.ignoreLogs(["PeerConnection", "not found in receiverGetStats"]);

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10 // 10 minutes
    }
  }
});

function AppStack() {
  const { scheme, colors } = useTheme();

  // Initialize push notifications
  const deviceToken = useDeviceToken();
  useNotificationListener();

  // Load user profile (avatar, displayName, etc.)
  useLoadProfile();

  // Global message realtime (sohbet listesinde yeni mesaj bildirimi için)
  useGlobalMessageRealtime();

  // Global presence (online durumu için)
  useGlobalPresence();

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <BottomSheetModalProvider>
                <AppStack />
              </BottomSheetModalProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
