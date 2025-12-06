/**
 * usePushNotifications Hook
 *
 * Amaç: Mesajlaşma push notification yönetimi
 * Tarih: 2025-11-26
 *
 * Expo Notifications ile push notification handling.
 */

import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";

// =============================================
// TYPES
// =============================================

interface MessageNotificationData {
  type: "new_message" | "broadcast_message" | "mention" | "reaction";
  conversation_id?: string;
  channel_id?: string;
  message_id?: string;
  sender_id?: string;
  [key: string]: unknown;
}

// =============================================
// NOTIFICATION HANDLER CONFIG
// =============================================

// Foreground notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// =============================================
// HOOK
// =============================================

export function usePushNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Push token kaydet
  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      logger.debug("Must use physical device for push notifications", { tag: "Push" });
      return null;
    }

    // İzin kontrolü
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      logger.debug("Push permission not granted", { tag: "Push" });
      return null;
    }

    // Token al
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    logger.debug("Push token registered", { tag: "Push" });

    // Token'ı Supabase'e kaydet
    if (user) {
      await supabase.from("push_tokens").upsert({
        user_id: user.id,
        token: token.data,
        platform: Platform.OS,
        device_name: Device.deviceName,
        updated_at: new Date().toISOString(),
      });
    }

    // Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("messages", {
        name: "Mesajlar",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B6B",
      });

      await Notifications.setNotificationChannelAsync("broadcast", {
        name: "Yayın Kanalları",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return token.data;
  }, [user]);

  // Notification tıklama handler
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as unknown as MessageNotificationData;


      switch (data.type) {
        case "new_message":
          if (data.conversation_id) {
            router.push(`/messages/${data.conversation_id}`);
          }
          break;
        case "broadcast_message":
          if (data.channel_id) {
            router.push(`/broadcast/${data.channel_id}`);
          }
          break;
        case "mention":
          if (data.conversation_id) {
            router.push(`/messages/${data.conversation_id}`);
          }
          break;
        case "reaction":
          if (data.conversation_id) {
            router.push(`/messages/${data.conversation_id}`);
          }
          break;
      }
    },
    [router]
  );

  // Listeners
  useEffect(() => {
    if (!user) return;

    // Token kaydet
    registerForPushNotifications();

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      () => {
        // Realtime ile sync edilecek
      }
    );

    // Tap listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, registerForPushNotifications, handleNotificationResponse]);

  return {
    registerForPushNotifications,
  };
}

// =============================================
// BADGE MANAGEMENT
// =============================================

/**
 * Badge sayısını günceller
 */
export async function updateBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Badge'i temizler
 */
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

// =============================================
// LOCAL NOTIFICATION
// =============================================

/**
 * Local notification gönderir (test için)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: MessageNotificationData
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Hemen gönder
  });
}
