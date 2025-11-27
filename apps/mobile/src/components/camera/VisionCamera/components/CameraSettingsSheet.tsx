/**
 * CameraSettingsSheet
 *
 * Kamera ayarları bottom sheet'i
 * Fotoğraf/video kalitesi, FPS, HDR vb. ayarlar
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from "react-native";
import { Settings, X, Image, Video, Zap, MapPin, Volume2 } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import type { CameraSettings, PhotoQuality, VideoQuality } from "../types";

const LOG_PREFIX = "[CameraSettings]";

interface CameraSettingsSheetProps {
  visible: boolean;
  settings: CameraSettings;
  onSettingsChange: (settings: CameraSettings) => void;
  onClose: () => void;
}

// Seçenek butonları için
interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function OptionButton({ label, selected, onPress, colors }: OptionButtonProps) {
  return (
    <Pressable
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border
        }
      ]}
      onPress={onPress}
    >
      <Text
        style={[styles.optionButtonText, { color: selected ? "#FFFFFF" : colors.textSecondary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Ayar satırı
interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
}

function SettingRow({ icon, title, subtitle, children, colors }: SettingRowProps) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        {icon}
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>{children}</View>
    </View>
  );
}

export function CameraSettingsSheet({
  visible,
  settings,
  onSettingsChange,
  onClose
}: CameraSettingsSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Ayar değiştirme fonksiyonları
  const updateSetting = useCallback(
    <K extends keyof CameraSettings>(key: K, value: CameraSettings[K]) => {
      console.log(`${LOG_PREFIX} Setting changed:`, key, value);
      onSettingsChange({ ...settings, [key]: value });
    },
    [settings, onSettingsChange]
  );

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(300)}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16
          }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Settings size={20} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Kamera Ayarları</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Fotoğraf Kalitesi */}
          <SettingRow
            icon={<Image size={20} color={colors.accent} />}
            title="Fotoğraf Kalitesi"
            subtitle="Düşük = hızlı yükleme, Yüksek = detaylı"
            colors={colors}
          >
            <View style={styles.optionGroup}>
              {(["low", "medium", "high"] as PhotoQuality[]).map((quality) => (
                <OptionButton
                  key={quality}
                  label={quality === "low" ? "Düşük" : quality === "medium" ? "Orta" : "Yüksek"}
                  selected={settings.photoQuality === quality}
                  onPress={() => updateSetting("photoQuality", quality)}
                  colors={colors}
                />
              ))}
            </View>
          </SettingRow>

          {/* Video Kalitesi */}
          <SettingRow
            icon={<Video size={20} color={colors.accent} />}
            title="Video Kalitesi"
            subtitle="720p = küçük dosya, 1080p = yüksek kalite"
            colors={colors}
          >
            <View style={styles.optionGroup}>
              {(["720p", "1080p"] as VideoQuality[]).map((quality) => (
                <OptionButton
                  key={quality}
                  label={quality}
                  selected={settings.videoQuality === quality}
                  onPress={() => updateSetting("videoQuality", quality)}
                  colors={colors}
                />
              ))}
            </View>
          </SettingRow>

          {/* Video FPS */}
          <SettingRow
            icon={<Zap size={20} color={colors.accent} />}
            title="Video FPS"
            subtitle="30 = normal, 60 = akıcı (büyük dosya)"
            colors={colors}
          >
            <View style={styles.optionGroup}>
              {([30, 60] as const).map((fps) => (
                <OptionButton
                  key={fps}
                  label={`${fps} FPS`}
                  selected={settings.videoFps === fps}
                  onPress={() => updateSetting("videoFps", fps)}
                  colors={colors}
                />
              ))}
            </View>
          </SettingRow>

          {/* Video Stabilizasyon */}
          <SettingRow
            icon={<Video size={20} color={colors.accent} />}
            title="Video Stabilizasyon"
            subtitle="Titremeleri azaltır"
            colors={colors}
          >
            <Switch
              value={settings.videoStabilization}
              onValueChange={(value) => updateSetting("videoStabilization", value)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>

          {/* Konum Bilgisi */}
          <SettingRow
            icon={<MapPin size={20} color={colors.accent} />}
            title="Konum Bilgisi"
            subtitle="Fotoğraflara GPS ekle"
            colors={colors}
          >
            <Switch
              value={settings.enableLocation}
              onValueChange={(value) => updateSetting("enableLocation", value)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>

          {/* Shutter Sesi */}
          <SettingRow
            icon={<Volume2 size={20} color={colors.accent} />}
            title="Deklanşör Sesi"
            subtitle="Fotoğraf çekerken ses çıkar"
            colors={colors}
          >
            <Switch
              value={settings.shutterSound}
              onValueChange={(value) => updateSetting("shutterSound", value)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>

          {/* Bilgi */}
          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 Düşük kalite ayarları daha hızlı yükleme sağlar. Sosyal medya paylaşımları için
              "Orta" kalite önerilir.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 100
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  content: {
    paddingHorizontal: 20
  },
  settingRow: {
    paddingVertical: 16,
    borderBottomWidth: 1
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12
  },
  settingTextContainer: {
    flex: 1
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500"
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2
  },
  settingRight: {
    alignItems: "flex-end"
  },
  optionGroup: {
    flexDirection: "row",
    gap: 8
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: "500"
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 20
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20
  }
});

export default CameraSettingsSheet;
