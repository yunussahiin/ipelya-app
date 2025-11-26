/**
 * useDoNotDisturb Hook
 *
 * Amaç: Global Rahatsız Etmeyin (DND) modu yönetimi
 * Tarih: 2025-11-26
 *
 * Tüm bildirimleri geçici olarak susturur.
 * Zamanlayıcı ile otomatik kapanma desteği.
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

// =============================================
// TYPES
// =============================================

interface DNDSettings {
  enabled: boolean;
  endTime: string | null; // ISO date string
  schedule: DNDSchedule | null;
}

interface DNDSchedule {
  enabled: boolean;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number;
  endMinute: number;
  days: number[]; // 0-6 (Pazar-Cumartesi)
}

const DND_STORAGE_KEY = "@messaging:dnd_settings";

// =============================================
// HOOK
// =============================================

export function useDoNotDisturb() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DNDSettings>({
    enabled: false,
    endTime: null,
    schedule: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Ayarları yükle
  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DND_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DNDSettings;

        // Süre dolmuş mu kontrol et
        if (parsed.endTime && new Date(parsed.endTime) < new Date()) {
          parsed.enabled = false;
          parsed.endTime = null;
        }

        setSettings(parsed);
      }
    } catch (error) {
      console.error("[DND] Ayarlar yüklenemedi:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ayarları kaydet
  const saveSettings = useCallback(async (newSettings: DNDSettings) => {
    try {
      await AsyncStorage.setItem(DND_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);

      // Supabase'e de kaydet (sync için)
      if (user) {
        await supabase
          .from("user_settings")
          .upsert({
            user_id: user.id,
            dnd_enabled: newSettings.enabled,
            dnd_end_time: newSettings.endTime,
            dnd_schedule: newSettings.schedule,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error("[DND] Ayarlar kaydedilemedi:", error);
    }
  }, [user]);

  // DND'yi aç
  const enableDND = useCallback(
    async (durationMinutes?: number) => {
      const endTime = durationMinutes
        ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
        : null;

      await saveSettings({
        ...settings,
        enabled: true,
        endTime,
      });

      console.log(
        `[DND] Etkinleştirildi${durationMinutes ? ` (${durationMinutes} dakika)` : " (süresiz)"}`
      );
    },
    [settings, saveSettings]
  );

  // DND'yi kapat
  const disableDND = useCallback(async () => {
    await saveSettings({
      ...settings,
      enabled: false,
      endTime: null,
    });

    console.log("[DND] Devre dışı bırakıldı");
  }, [settings, saveSettings]);

  // Zamanlama ayarla
  const setSchedule = useCallback(
    async (schedule: DNDSchedule | null) => {
      await saveSettings({
        ...settings,
        schedule,
      });

      console.log("[DND] Zamanlama güncellendi");
    },
    [settings, saveSettings]
  );

  // Şu an DND aktif mi kontrol et (zamanlama dahil)
  const isDNDActive = useCallback((): boolean => {
    // Manuel DND açıksa
    if (settings.enabled) {
      // Süre kontrolü
      if (settings.endTime && new Date(settings.endTime) < new Date()) {
        return false;
      }
      return true;
    }

    // Zamanlama kontrolü
    if (settings.schedule?.enabled) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Bugün zamanlama günlerinden biri mi?
      if (!settings.schedule.days.includes(currentDay)) {
        return false;
      }

      const startMinutes =
        settings.schedule.startHour * 60 + settings.schedule.startMinute;
      const endMinutes =
        settings.schedule.endHour * 60 + settings.schedule.endMinute;

      // Gece yarısını geçen zamanlamalar için
      if (startMinutes > endMinutes) {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return false;
  }, [settings]);

  // Bildirim gösterilmeli mi kontrol et
  const shouldShowNotification = useCallback((): boolean => {
    return !isDNDActive();
  }, [isDNDActive]);

  // Notification handler'ı güncelle
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        const shouldShow = shouldShowNotification();
        return {
          shouldShowAlert: shouldShow,
          shouldPlaySound: shouldShow,
          shouldSetBadge: true, // Badge her zaman güncelle
        };
      },
    });
  }, [shouldShowNotification]);

  // Süre dolduğunda otomatik kapat
  useEffect(() => {
    if (!settings.enabled || !settings.endTime) return;

    const endTime = new Date(settings.endTime).getTime();
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) {
      disableDND();
      return;
    }

    const timeout = setTimeout(() => {
      disableDND();
    }, remaining);

    return () => clearTimeout(timeout);
  }, [settings.enabled, settings.endTime, disableDND]);

  // İlk yüklemede ayarları yükle
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    isDNDActive: isDNDActive(),
    enableDND,
    disableDND,
    setSchedule,
    shouldShowNotification,
  };
}

// =============================================
// PRESET DURATIONS
// =============================================

export const DND_PRESETS = [
  { label: "30 dakika", minutes: 30 },
  { label: "1 saat", minutes: 60 },
  { label: "2 saat", minutes: 120 },
  { label: "4 saat", minutes: 240 },
  { label: "8 saat", minutes: 480 },
  { label: "Yarına kadar", minutes: null }, // Gece yarısına kadar hesaplanacak
  { label: "Süresiz", minutes: undefined },
];

/**
 * Yarına kadar kalan dakikayı hesapla
 */
export function getMinutesUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60));
}
