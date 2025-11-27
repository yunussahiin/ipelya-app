/**
 * useCameraSettings Hook
 *
 * Kamera ayarlarını AsyncStorage'da kalıcı olarak saklar
 * - Flash modu
 * - HDR durumu
 * - Grid gösterimi
 * - Son kullanılan kamera pozisyonu
 */

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CameraPosition } from "react-native-vision-camera";
import type { FlashMode } from "../types";

const STORAGE_KEY = "@camera_settings";

export interface CameraSettings {
  /** Flash modu: off, on, auto */
  flashMode: FlashMode;
  /** HDR aktif mi */
  hdrEnabled: boolean;
  /** Grid göster */
  showGrid: boolean;
  /** Son kullanılan kamera pozisyonu */
  cameraPosition: CameraPosition;
  /** Son kullanılan filtre ID'si */
  lastFilterId: string;
}

const DEFAULT_SETTINGS: CameraSettings = {
  flashMode: "off",
  hdrEnabled: false,
  showGrid: false,
  cameraPosition: "back",
  lastFilterId: "original",
};

interface UseCameraSettingsReturn {
  settings: CameraSettings;
  isLoading: boolean;
  updateSetting: <K extends keyof CameraSettings>(
    key: K,
    value: CameraSettings[K]
  ) => Promise<void>;
  updateSettings: (newSettings: Partial<CameraSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export function useCameraSettings(): UseCameraSettingsReturn {
  const [settings, setSettings] = useState<CameraSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<CameraSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
          console.log("[CameraSettings] Loaded:", parsed);
        }
      } catch (error) {
        console.error("[CameraSettings] Load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to AsyncStorage
  const saveSettings = useCallback(async (newSettings: CameraSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      console.log("[CameraSettings] Saved:", newSettings);
    } catch (error) {
      console.error("[CameraSettings] Save error:", error);
    }
  }, []);

  // Update single setting
  const updateSetting = useCallback(
    async <K extends keyof CameraSettings>(
      key: K,
      value: CameraSettings[K]
    ) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // Update multiple settings
  const updateSettings = useCallback(
    async (newSettings: Partial<CameraSettings>) => {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);
      await saveSettings(merged);
    },
    [settings, saveSettings]
  );

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("[CameraSettings] Reset to defaults");
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings,
  };
}

export default useCameraSettings;
