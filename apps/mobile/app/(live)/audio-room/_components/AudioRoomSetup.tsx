/**
 * Audio Room Setup Component
 * Sesli oda oluşturma formu
 */

import React from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { ThumbnailPicker } from "../../broadcast/_components/ThumbnailPicker";

type AccessType = "public" | "subscribers_only" | "pay_per_view";
export type MicMode = "standard" | "push_to_talk" | "both";

interface AudioSettings {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

interface AudioRoomSetupProps {
  // User info
  avatarUrl?: string;
  displayName?: string;
  // Form values
  title: string;
  onTitleChange: (value: string) => void;
  thumbnailUrl?: string;
  onThumbnailChange: (url: string | undefined) => void;
  accessType: AccessType;
  onAccessTypeChange: (type: AccessType) => void;
  ppvPrice: string;
  onPpvPriceChange: (value: string) => void;
  // Toggles
  chatEnabled: boolean;
  onChatEnabledChange: (value: boolean) => void;
  giftsEnabled: boolean;
  onGiftsEnabledChange: (value: boolean) => void;
  guestEnabled: boolean;
  onGuestEnabledChange: (value: boolean) => void;
  // Audio settings
  audioSettings: AudioSettings;
  onAudioSettingsChange: (settings: AudioSettings) => void;
  // Mic mode
  micMode: MicMode;
  onMicModeChange: (mode: MicMode) => void;
  // Mic
  isMicOn: boolean;
  onToggleMic: () => void;
}

export function AudioRoomSetup({
  avatarUrl,
  displayName,
  title,
  onTitleChange,
  thumbnailUrl,
  onThumbnailChange,
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
  audioSettings,
  onAudioSettingsChange,
  micMode,
  onMicModeChange,
  isMicOn,
  onToggleMic
}: AudioRoomSetupProps) {
  const { colors } = useTheme();

  const accessOptions = [
    { value: "public", label: "Herkese Açık", icon: "globe-outline" },
    { value: "subscribers_only", label: "Abonelere Özel", icon: "star" },
    { value: "pay_per_view", label: "Ücretli", icon: "ticket" }
  ] as const;

  const micModeOptions = [
    { value: "standard", label: "Standart", icon: "mic", description: "Normal mikrofon" },
    {
      value: "push_to_talk",
      label: "Bas-Konuş",
      icon: "hand-left",
      description: "Basılı tutarak konuş"
    },
    { value: "both", label: "İkisi de", icon: "options", description: "Her iki mod kullanılabilir" }
  ] as const;

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Preview - Kompakt avatar */}
      <View style={styles.previewContainer}>
        <Pressable style={styles.avatarWrapper} onPress={onToggleMic}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.previewAvatar} />
          ) : (
            <View style={[styles.previewAvatarPlaceholder, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
          <View
            style={[
              styles.previewMicBadge,
              { backgroundColor: isMicOn ? colors.accent : "#EF4444" }
            ]}
          >
            <Ionicons name={isMicOn ? "mic" : "mic-off"} size={16} color="#fff" />
          </View>
        </Pressable>
        <Text style={[styles.previewName, { color: colors.textPrimary }]}>
          {displayName || "Kullanıcı"}
        </Text>
        <View style={styles.previewStatus}>
          <View style={[styles.statusDot, { backgroundColor: isMicOn ? "#10B981" : "#EF4444" }]} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {isMicOn ? "Mikrofon açık" : "Mikrofon kapalı"}
          </Text>
        </View>
      </View>

      {/* Title Input */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Oda Başlığı</Text>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Oda başlığını girin..."
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={onTitleChange}
          maxLength={100}
        />
      </View>

      {/* Access Type */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Erişim Türü</Text>
        <View style={styles.accessOptions}>
          {accessOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.accessOption,
                { backgroundColor: accessType === option.value ? colors.accent : colors.surface }
              ]}
              onPress={() => onAccessTypeChange(option.value)}
            >
              <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={accessType === option.value ? "#fff" : colors.textMuted}
              />
              <Text
                style={[
                  styles.accessOptionText,
                  { color: accessType === option.value ? "#fff" : colors.textPrimary }
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* PPV Price */}
      {accessType === "pay_per_view" && (
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Giriş Ücreti</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.surface, color: colors.textPrimary }
            ]}
            placeholder="Coin miktarı"
            placeholderTextColor={colors.textMuted}
            value={ppvPrice}
            onChangeText={onPpvPriceChange}
            keyboardType="number-pad"
          />
        </View>
      )}

      {/* Toggles */}
      <View style={styles.togglesSection}>
        <ToggleRow
          icon="chatbubble-outline"
          label="Sohbet"
          value={chatEnabled}
          onToggle={() => onChatEnabledChange(!chatEnabled)}
        />
        <ToggleRow
          icon="gift-outline"
          label="Hediyeler"
          value={giftsEnabled}
          onToggle={() => onGiftsEnabledChange(!giftsEnabled)}
        />
        <ToggleRow
          icon="people-outline"
          label="Konuk Daveti"
          value={guestEnabled}
          onToggle={() => onGuestEnabledChange(!guestEnabled)}
        />
      </View>

      {/* Thumbnail Picker */}
      <ThumbnailPicker
        selectedUrl={thumbnailUrl}
        onSelect={onThumbnailChange}
        avatarUrl={avatarUrl}
      />

      {/* Mic Mode Selection */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mic-outline" size={18} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Mikrofon Modu</Text>
        </View>
        <View style={styles.micModeContainer}>
          {micModeOptions.map((option) => {
            const isSelected = micMode === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.micModeOption,
                  {
                    backgroundColor: isSelected ? `${colors.accent}15` : colors.surfaceAlt,
                    borderColor: isSelected ? colors.accent : "transparent"
                  }
                ]}
                onPress={() => onMicModeChange(option.value)}
              >
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={isSelected ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.micModeLabel,
                    { color: isSelected ? colors.accent : colors.textPrimary }
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={[styles.micModeDesc, { color: colors.textMuted }]}>
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Audio Settings */}
      <AudioSettingsCard settings={audioSettings} onSettingsChange={onAudioSettingsChange} />
    </ScrollView>
  );
}

// Toggle Row Component
interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: () => void;
}

function ToggleRow({ icon, label, value, onToggle }: ToggleRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable style={[styles.toggleRow, { backgroundColor: colors.surface }]} onPress={onToggle}>
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View
        style={[
          styles.toggleSwitch,
          { backgroundColor: value ? colors.accent : colors.surfaceAlt }
        ]}
      >
        <View style={[styles.toggleKnob, { left: value ? 22 : 2 }]} />
      </View>
    </Pressable>
  );
}

// Audio Settings Card Component
interface AudioSettingsCardProps {
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

function AudioSettingsCard({ settings, onSettingsChange }: AudioSettingsCardProps) {
  const { colors } = useTheme();

  const audioOptions = [
    {
      key: "noiseSuppression" as const,
      icon: "volume-mute-outline",
      title: "Gürültü Engelleme",
      desc: "Arka plan gürültüsünü azaltır"
    },
    {
      key: "echoCancellation" as const,
      icon: "mic-off-outline",
      title: "Yankı Engelleme",
      desc: "Hoparlör yankısını önler"
    },
    {
      key: "autoGainControl" as const,
      icon: "options-outline",
      title: "Otomatik Ses Seviyesi",
      desc: "Ses seviyesini otomatik ayarlar"
    }
  ];

  return (
    <View style={styles.inputSection}>
      <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Ses Ayarları</Text>
      <View style={[styles.audioSettingsCard, { backgroundColor: colors.surface }]}>
        {audioOptions.map((option, index) => (
          <React.Fragment key={option.key}>
            {index > 0 && (
              <View style={[styles.audioSettingDivider, { backgroundColor: colors.border }]} />
            )}
            <Pressable
              style={styles.audioSettingRow}
              onPress={() => onSettingsChange({ ...settings, [option.key]: !settings[option.key] })}
            >
              <View style={styles.audioSettingInfo}>
                <Ionicons
                  name={option.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={colors.textPrimary}
                />
                <View>
                  <Text style={[styles.audioSettingTitle, { color: colors.textPrimary }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.audioSettingDesc, { color: colors.textMuted }]}>
                    {option.desc}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: settings[option.key] ? colors.accent : colors.surfaceAlt }
                ]}
              >
                <View style={[styles.toggleKnob, { left: settings[option.key] ? 22 : 2 }]} />
              </View>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  previewContainer: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 16
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12
  },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  previewAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center"
  },
  previewMicBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#1C1C1E"
  },
  previewName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4
  },
  previewStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    fontSize: 14
  },
  inputSection: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16
  },
  accessOptions: {
    flexDirection: "row",
    gap: 8
  },
  accessOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6
  },
  accessOptionText: {
    fontSize: 12,
    fontWeight: "600"
  },
  togglesSection: {
    gap: 8,
    marginBottom: 8
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500"
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: "relative"
  },
  toggleKnob: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff"
  },
  audioSettingsCard: {
    borderRadius: 12,
    overflow: "hidden"
  },
  audioSettingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16
  },
  audioSettingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  audioSettingTitle: {
    fontSize: 15,
    fontWeight: "500"
  },
  audioSettingDesc: {
    fontSize: 12,
    marginTop: 2
  },
  audioSettingDivider: {
    height: 1,
    marginLeft: 48
  },
  // Mic Mode Section
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600"
  },
  micModeContainer: {
    gap: 8
  },
  micModeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 10
  },
  micModeLabel: {
    fontSize: 14,
    fontWeight: "600"
  },
  micModeDesc: {
    fontSize: 12,
    flex: 1,
    textAlign: "right"
  }
});

export default AudioRoomSetup;
