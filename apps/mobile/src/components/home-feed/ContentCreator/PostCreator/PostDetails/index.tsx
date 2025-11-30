/**
 * PostDetails Component
 * Adım 2: Gönderi detayları (açıklama, anket, ses, konum, vb.)
 */

import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import {
  BarChart3,
  MessageCircle,
  Music,
  Users,
  MapPin,
  Eye,
  Share2,
  MoreHorizontal
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { PostHeader } from "../PostHeader";
import {
  MediaPreview,
  MenuItem,
  PollSection,
  AudienceSheet,
  OtherOptionsSheet,
  TagPeopleSheet
} from "./components";
import type { TagPosition } from "./components";
import { usePostDetails } from "./hooks/usePostDetails";
import { styles } from "./styles";
import type { PostDetailsProps } from "./types";

export function PostDetails({ selectedAssets, onBack, onPublish }: PostDetailsProps) {
  const { colors } = useTheme();
  const {
    caption,
    setCaption,
    showPoll,
    togglePoll,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    pollDuration,
    setPollDuration,
    addPollOption,
    removePollOption,
    updatePollOption,
    getPollData,
    settings,
    setAudience,
    setSettings
  } = usePostDetails();

  const [showAudienceSheet, setShowAudienceSheet] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [showTagPeople, setShowTagPeople] = useState(false);
  const [tagPositions, setTagPositions] = useState<TagPosition[]>([]);

  // Debug logger
  const log = (action: string, data?: Record<string, unknown>) => {
    console.log(`[PostDetails] ${action}`, data ? JSON.stringify(data, null, 2) : "");
  };

  // Etiket pozisyonları değiştiğinde
  const handleTagPositionsChange = (positions: TagPosition[]) => {
    log("TAG_POSITIONS_CHANGE", { count: positions.length });
    setTagPositions(positions);
  };

  // Benzersiz etiketlenen kullanıcı sayısı
  const uniqueTaggedUsersCount = new Set(tagPositions.map((p) => p.user.id)).size;

  const handlePublish = () => {
    log("PUBLISH_START", {
      caption: caption.trim().substring(0, 50),
      hasPoll: !!getPollData(),
      assetsCount: selectedAssets.length,
      taggedUsersCount: uniqueTaggedUsersCount
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPublish({
      caption: caption.trim(),
      poll: getPollData(),
      settings
    });
    log("PUBLISH_CALLBACK_CALLED");
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
        <MediaPreview assets={selectedAssets} />

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
          <PollSection
            pollQuestion={pollQuestion}
            setPollQuestion={setPollQuestion}
            pollOptions={pollOptions}
            pollDuration={pollDuration}
            setPollDuration={setPollDuration}
            onAddOption={addPollOption}
            onRemoveOption={removePollOption}
            onUpdateOption={updatePollOption}
          />
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem icon={<Music size={22} color={colors.textPrimary} />} label="Ses ekle" />
          <MenuItem
            icon={<Users size={22} color={colors.textPrimary} />}
            label="Kişileri etiketle"
            value={uniqueTaggedUsersCount > 0 ? `${uniqueTaggedUsersCount} kişi` : undefined}
            onPress={() => setShowTagPeople(true)}
            showChevron
          />
          <MenuItem icon={<MapPin size={22} color={colors.textPrimary} />} label="Konum ekle" />
          <MenuItem
            icon={<Eye size={22} color={colors.textPrimary} />}
            label="Hedef Kitle"
            value={settings.audience === "followers" ? "Takipçiler" : "Abonelerim"}
            onPress={() => setShowAudienceSheet(true)}
            showChevron
          />
          <MenuItem
            icon={<Share2 size={22} color={colors.textPrimary} />}
            label="Şurada da paylaş..."
            value="Kapalı"
          />
          <MenuItem
            icon={<MoreHorizontal size={22} color={colors.textPrimary} />}
            label="Diğer Seçenekler"
            onPress={() => setShowOtherOptions(true)}
            showChevron
          />
        </View>
      </ScrollView>

      {/* Audience Sheet */}
      <AudienceSheet
        visible={showAudienceSheet}
        onClose={() => setShowAudienceSheet(false)}
        selectedAudience={settings.audience}
        onSelect={setAudience}
      />

      {/* Other Options Sheet */}
      <OtherOptionsSheet
        visible={showOtherOptions}
        onClose={() => setShowOtherOptions(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Tag People Sheet */}
      <TagPeopleSheet
        visible={showTagPeople}
        onClose={() => setShowTagPeople(false)}
        assets={selectedAssets}
        tagPositions={tagPositions}
        onTagPositionsChange={handleTagPositionsChange}
      />
    </View>
  );
}

export default PostDetails;
