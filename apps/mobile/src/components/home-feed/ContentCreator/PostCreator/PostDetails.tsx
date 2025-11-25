/**
 * PostDetails Component
 * Adım 2: Gönderi detayları (açıklama, anket, ses, konum, vb.)
 */

import React, { useState } from "react";
import { View, StyleSheet, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import {
  BarChart3,
  MessageCircle,
  Music,
  Users,
  MapPin,
  Eye,
  Share2,
  MoreHorizontal,
  Plus,
  Trash2,
  Clock
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import type { MediaAsset, PollData, PostSettings } from "./types";
import { PostHeader } from "./PostHeader";

interface PostDetailsProps {
  selectedAssets: MediaAsset[];
  onBack: () => void;
  onPublish: (data: { caption: string; poll?: PollData; settings: PostSettings }) => void;
}

const POLL_DURATIONS: { value: PollData["duration"]; label: string }[] = [
  { value: "1h", label: "1 saat" },
  { value: "6h", label: "6 saat" },
  { value: "24h", label: "24 saat" },
  { value: "3d", label: "3 gün" },
  { value: "7d", label: "7 gün" }
];

export function PostDetails({ selectedAssets, onBack, onPublish }: PostDetailsProps) {
  const { colors } = useTheme();
  const [caption, setCaption] = useState("");

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState<PollData["duration"]>("24h");

  // Settings state
  const [settings, setSettings] = useState<PostSettings>({
    hideComments: false,
    hideLikes: false,
    hideShareCount: false,
    audience: "followers"
  });

  // Add poll option
  const addPollOption = () => {
    if (pollOptions.length < 4) {
      Haptics.selectionAsync();
      setPollOptions([...pollOptions, ""]);
    }
  };

  // Remove poll option
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      Haptics.selectionAsync();
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Update poll option
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Handle publish
  const handlePublish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const pollData: PollData | undefined =
      showPoll && pollQuestion.trim()
        ? {
            question: pollQuestion.trim(),
            options: pollOptions.filter((o) => o.trim()),
            duration: pollDuration
          }
        : undefined;

    onPublish({
      caption: caption.trim(),
      poll: pollData,
      settings
    });
  };

  // Toggle poll
  const togglePoll = () => {
    Haptics.selectionAsync();
    setShowPoll(!showPoll);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PostHeader
        title="Yeni gönderi"
        onBack={onBack}
        rightAction={{
          label: "Paylaş",
          onPress: handlePublish,
          disabled: selectedAssets.length === 0
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Media Preview */}
        <View style={styles.mediaPreview}>
          {selectedAssets.slice(0, 6).map((asset, index) => (
            <Image
              key={asset.id}
              source={{ uri: asset.uri }}
              style={[styles.previewThumb, index === 0 && styles.previewThumbFirst]}
              contentFit="cover"
            />
          ))}
          {selectedAssets.length > 6 && (
            <View style={[styles.moreOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
              <Text style={styles.moreText}>+{selectedAssets.length - 6}</Text>
            </View>
          )}
        </View>

        {/* Caption Input */}
        <TextInput
          style={[styles.captionInput, { color: colors.textPrimary }]}
          placeholder="Bir açıklama ekle..."
          placeholderTextColor={colors.textMuted}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            style={[
              styles.quickAction,
              { backgroundColor: showPoll ? colors.accent + "20" : colors.surfaceAlt }
            ]}
            onPress={togglePoll}
          >
            <BarChart3 size={18} color={showPoll ? colors.accent : colors.textPrimary} />
            <Text
              style={[
                styles.quickActionText,
                { color: showPoll ? colors.accent : colors.textPrimary }
              ]}
            >
              Anket
            </Text>
          </Pressable>

          <Pressable style={[styles.quickAction, { backgroundColor: colors.surfaceAlt }]}>
            <MessageCircle size={18} color={colors.textPrimary} />
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>İstem</Text>
          </Pressable>
        </View>

        {/* Poll Section */}
        {showPoll && (
          <View style={[styles.pollSection, { backgroundColor: colors.surfaceAlt }]}>
            <TextInput
              style={[
                styles.pollQuestionInput,
                { color: colors.textPrimary, borderColor: colors.border }
              ]}
              placeholder="Anket sorusu..."
              placeholderTextColor={colors.textMuted}
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />

            {pollOptions.map((option, index) => (
              <View key={index} style={styles.pollOptionRow}>
                <TextInput
                  style={[
                    styles.pollOptionInput,
                    { color: colors.textPrimary, borderColor: colors.border }
                  ]}
                  placeholder={`Seçenek ${index + 1}`}
                  placeholderTextColor={colors.textMuted}
                  value={option}
                  onChangeText={(text) => updatePollOption(index, text)}
                />
                {pollOptions.length > 2 && (
                  <Pressable
                    onPress={() => removePollOption(index)}
                    style={styles.removeOptionButton}
                  >
                    <Trash2 size={18} color={colors.warning} />
                  </Pressable>
                )}
              </View>
            ))}

            {pollOptions.length < 4 && (
              <Pressable style={styles.addOptionButton} onPress={addPollOption}>
                <Plus size={18} color={colors.accent} />
                <Text style={[styles.addOptionText, { color: colors.accent }]}>Seçenek ekle</Text>
              </Pressable>
            )}

            {/* Poll Duration */}
            <View style={styles.pollDurationRow}>
              <Clock size={16} color={colors.textMuted} />
              <Text style={[styles.pollDurationLabel, { color: colors.textMuted }]}>Süre:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {POLL_DURATIONS.map((d) => (
                  <Pressable
                    key={d.value}
                    style={[
                      styles.durationChip,
                      { backgroundColor: pollDuration === d.value ? colors.accent : colors.surface }
                    ]}
                    onPress={() => setPollDuration(d.value)}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        { color: pollDuration === d.value ? "#FFF" : colors.textPrimary }
                      ]}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Music size={22} color={colors.textPrimary} />}
            label="Ses ekle"
            colors={colors}
          />
          <MenuItem
            icon={<Users size={22} color={colors.textPrimary} />}
            label="Kişileri etiketle"
            colors={colors}
          />
          <MenuItem
            icon={<MapPin size={22} color={colors.textPrimary} />}
            label="Konum ekle"
            colors={colors}
          />
          <MenuItem
            icon={<Eye size={22} color={colors.textPrimary} />}
            label="Hedef Kitle"
            value={settings.audience === "followers" ? "Takipçiler" : "Yakın Arkadaşlar"}
            colors={colors}
          />
          <MenuItem
            icon={<Share2 size={22} color={colors.textPrimary} />}
            label="Şurada da paylaş..."
            value="Kapalı"
            colors={colors}
          />
          <MenuItem
            icon={<MoreHorizontal size={22} color={colors.textPrimary} />}
            label="Diğer Seçenekler"
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Menu Item Component
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress?: () => void;
}

function MenuItem({ icon, label, value, colors, onPress }: MenuItemProps) {
  return (
    <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      {icon}
      <Text style={[styles.menuItemLabel, { color: colors.textPrimary }]}>{label}</Text>
      {value && <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>{value}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
  mediaPreview: {
    flexDirection: "row",
    padding: 16,
    gap: 4
  },
  previewThumb: {
    width: 60,
    height: 60,
    borderRadius: 8
  },
  previewThumbFirst: {
    width: 100,
    height: 100,
    borderRadius: 12
  },
  moreOverlay: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  moreText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600"
  },
  captionInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "500"
  },
  pollSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  pollQuestionInput: {
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12
  },
  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  pollOptionInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8
  },
  removeOptionButton: {
    padding: 8,
    marginLeft: 8
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8
  },
  addOptionText: {
    fontSize: 14,
    fontWeight: "500"
  },
  pollDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12
  },
  pollDurationLabel: {
    fontSize: 13
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: "500"
  },
  menuSection: {
    paddingHorizontal: 16
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    gap: 14
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16
  },
  menuItemValue: {
    fontSize: 15
  }
});
