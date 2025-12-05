/**
 * Broadcast Settings Component
 * Yayın ayarları formu
 */

import React from "react";
import { View, Text, TextInput, Pressable, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

type SessionType = "video_live" | "audio_room";
type AccessType = "public" | "subscribers_only" | "pay_per_view";
type VideoQuality = "360p" | "540p" | "720p" | "1080p";

export interface BroadcastMediaSettings {
  videoQuality: VideoQuality;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

interface BroadcastSettingsProps {
  title: string;
  onTitleChange: (title: string) => void;
  sessionType: SessionType;
  onSessionTypeChange: (type: SessionType) => void;
  accessType: AccessType;
  onAccessTypeChange: (type: AccessType) => void;
  ppvPrice: string;
  onPpvPriceChange: (price: string) => void;
  chatEnabled: boolean;
  onChatEnabledChange: (enabled: boolean) => void;
  giftsEnabled: boolean;
  onGiftsEnabledChange: (enabled: boolean) => void;
  guestEnabled: boolean;
  onGuestEnabledChange: (enabled: boolean) => void;
  // Media settings
  mediaSettings?: BroadcastMediaSettings;
  onMediaSettingsChange?: (settings: BroadcastMediaSettings) => void;
}

const defaultMediaSettings: BroadcastMediaSettings = {
  videoQuality: "720p",
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true
};

const videoQualityOptions: { value: VideoQuality; label: string; description: string }[] = [
  { value: "360p", label: "360p", description: "Düşük veri kullanımı" },
  { value: "540p", label: "540p", description: "Dengeli" },
  { value: "720p", label: "720p HD", description: "Önerilen" },
  { value: "1080p", label: "1080p Full HD", description: "En yüksek kalite" }
];

export function BroadcastSettings({
  title,
  onTitleChange,
  sessionType,
  onSessionTypeChange,
  accessType,
  onAccessTypeChange,
  ppvPrice,
  onPpvPriceChange,
  chatEnabled,
  onChatEnabledChange,
  giftsEnabled,
  onGiftsEnabledChange,
  guestEnabled,
  onGuestEnabledChange,
  mediaSettings = defaultMediaSettings,
  onMediaSettingsChange
}: BroadcastSettingsProps) {
  const { colors } = useTheme();

  const SettingsSection = ({
    sectionTitle,
    children
  }: {
    sectionTitle: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{sectionTitle}</Text>
      {children}
    </View>
  );

  const OptionRow = ({
    icon,
    label,
    onPress,
    rightElement
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <Pressable style={[styles.optionRow, { backgroundColor: colors.surface }]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{label}</Text>
      {rightElement}
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Title input */}
      <SettingsSection sectionTitle="Yayın Bilgileri">
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Yayın başlığı"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={onTitleChange}
            maxLength={100}
            autoCorrect={false}
            blurOnSubmit={false}
            returnKeyType="done"
          />
        </View>
      </SettingsSection>

      {/* Session type */}
      <SettingsSection sectionTitle="Yayın Türü">
        <View style={styles.typeOptions}>
          <Pressable
            style={[
              styles.typeOption,
              { backgroundColor: sessionType === "video_live" ? colors.accent : colors.surface }
            ]}
            onPress={() => onSessionTypeChange("video_live")}
          >
            <Ionicons
              name="videocam"
              size={24}
              color={sessionType === "video_live" ? "#fff" : colors.textPrimary}
            />
            <Text
              style={[
                styles.typeOptionText,
                { color: sessionType === "video_live" ? "#fff" : colors.textPrimary }
              ]}
            >
              Video
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeOption,
              { backgroundColor: sessionType === "audio_room" ? colors.accent : colors.surface }
            ]}
            onPress={() => onSessionTypeChange("audio_room")}
          >
            <Ionicons
              name="headset"
              size={24}
              color={sessionType === "audio_room" ? "#fff" : colors.textPrimary}
            />
            <Text
              style={[
                styles.typeOptionText,
                { color: sessionType === "audio_room" ? "#fff" : colors.textPrimary }
              ]}
            >
              Sesli
            </Text>
          </Pressable>
        </View>
      </SettingsSection>

      {/* Access type */}
      <SettingsSection sectionTitle="Erişim">
        <OptionRow
          icon="globe-outline"
          label="Herkese Açık"
          onPress={() => onAccessTypeChange("public")}
          rightElement={
            accessType === "public" && (
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            )
          }
        />
        <OptionRow
          icon="star"
          label="Abonelere Özel"
          onPress={() => onAccessTypeChange("subscribers_only")}
          rightElement={
            accessType === "subscribers_only" && (
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            )
          }
        />
        <OptionRow
          icon="ticket"
          label="Ücretli Giriş"
          onPress={() => onAccessTypeChange("pay_per_view")}
          rightElement={
            accessType === "pay_per_view" && (
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            )
          }
        />

        {accessType === "pay_per_view" && (
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, marginTop: 8 }]}>
            <Ionicons name="logo-bitcoin" size={18} color={colors.accent} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Coin miktarı"
              placeholderTextColor={colors.textMuted}
              value={ppvPrice}
              onChangeText={onPpvPriceChange}
              keyboardType="numeric"
              blurOnSubmit={false}
              returnKeyType="done"
            />
          </View>
        )}
      </SettingsSection>

      {/* Features */}
      <SettingsSection sectionTitle="Özellikler">
        <OptionRow
          icon="chatbubble"
          label="Sohbet"
          rightElement={
            <Switch
              value={chatEnabled}
              onValueChange={onChatEnabledChange}
              trackColor={{ true: colors.accent }}
            />
          }
        />
        <OptionRow
          icon="gift"
          label="Hediyeler"
          rightElement={
            <Switch
              value={giftsEnabled}
              onValueChange={onGiftsEnabledChange}
              trackColor={{ true: colors.accent }}
            />
          }
        />
        <OptionRow
          icon="people"
          label="Konuk Daveti"
          rightElement={
            <Switch
              value={guestEnabled}
              onValueChange={onGuestEnabledChange}
              trackColor={{ true: colors.accent }}
            />
          }
        />
      </SettingsSection>

      {/* Video Quality - Sadece video_live için */}
      {sessionType === "video_live" && onMediaSettingsChange && (
        <SettingsSection sectionTitle="Video Kalitesi">
          <View style={styles.qualityOptions}>
            {videoQualityOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.qualityOption,
                  {
                    backgroundColor:
                      mediaSettings.videoQuality === option.value ? colors.accent : colors.surface,
                    borderColor:
                      mediaSettings.videoQuality === option.value ? colors.accent : colors.border
                  }
                ]}
                onPress={() =>
                  onMediaSettingsChange({ ...mediaSettings, videoQuality: option.value })
                }
              >
                <Text
                  style={[
                    styles.qualityLabel,
                    {
                      color:
                        mediaSettings.videoQuality === option.value ? "#fff" : colors.textPrimary
                    }
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.qualityDescription,
                    {
                      color:
                        mediaSettings.videoQuality === option.value
                          ? "rgba(255,255,255,0.8)"
                          : colors.textMuted
                    }
                  ]}
                >
                  {option.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </SettingsSection>
      )}

      {/* Audio Settings */}
      {onMediaSettingsChange && (
        <SettingsSection sectionTitle="Ses Ayarları">
          <OptionRow
            icon="mic"
            label="Gürültü Engelleme"
            rightElement={
              <Switch
                value={mediaSettings.noiseSuppression}
                onValueChange={(value) =>
                  onMediaSettingsChange({ ...mediaSettings, noiseSuppression: value })
                }
                trackColor={{ true: colors.accent }}
              />
            }
          />
          <OptionRow
            icon="volume-high"
            label="Yankı Engelleme"
            rightElement={
              <Switch
                value={mediaSettings.echoCancellation}
                onValueChange={(value) =>
                  onMediaSettingsChange({ ...mediaSettings, echoCancellation: value })
                }
                trackColor={{ true: colors.accent }}
              />
            }
          />
          <OptionRow
            icon="options"
            label="Otomatik Ses Seviyesi"
            rightElement={
              <Switch
                value={mediaSettings.autoGainControl}
                onValueChange={(value) =>
                  onMediaSettingsChange({ ...mediaSettings, autoGainControl: value })
                }
                trackColor={{ true: colors.accent }}
              />
            }
          />
        </SettingsSection>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14
  },
  typeOptions: {
    flexDirection: "row",
    gap: 12
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8
  },
  typeOptionText: {
    fontSize: 15,
    fontWeight: "600"
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 4
  },
  optionLabel: {
    flex: 1,
    fontSize: 15
  },
  qualityOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  qualityOption: {
    width: "48%",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center"
  },
  qualityLabel: {
    fontSize: 15,
    fontWeight: "600"
  },
  qualityDescription: {
    fontSize: 11,
    marginTop: 2
  }
});

export default BroadcastSettings;
