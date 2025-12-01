/**
 * StoryInsightsSheet Component
 * Kendi story'miz için istatistik ve görüntüleyenler sheet'i
 * Tab yapısı: Görüntüleyenler | Tepkiler
 *
 * ⚠️ SADECE KENDİ STORY'MİZDE GÖSTERİLİR
 * - Görüntüleyenler listesi
 * - Tepki verenler listesi (emoji bazlı gruplu)
 * - Her kullanıcıya mesaj gönder butonu
 *
 * Başkasının story'sinde bu component KULLANILMAZ!
 * Başkasının story'sinde StoryActions + StoryReactionPicker gösterilir.
 */

import React, { memo, useCallback, useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { X, Eye, Heart, Send } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type TabType = "viewers" | "reactions";

interface StoryInsightsSheetProps {
  visible: boolean;
  onClose: () => void;
  viewsCount: number;
  reactionsCount: number;
  viewers?: Array<{
    user_id: string;
    username: string;
    avatar_url: string | null;
    reaction?: string | null;
  }>;
  onSendMessage?: (userId: string) => void;
}

// Emoji mapping
const REACTION_EMOJIS: Record<string, string> = {
  heart: "❤️",
  fire: "🔥",
  laugh: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡"
};

function StoryInsightsSheetComponent({
  visible,
  onClose,
  viewsCount,
  reactionsCount,
  viewers = [],
  onSendMessage
}: StoryInsightsSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("viewers");

  const handleClose = useCallback(() => {
    Haptics.selectionAsync();
    onClose();
  }, [onClose]);

  const handleTabChange = useCallback((tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  }, []);

  const handleSendMessage = useCallback(
    (userId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSendMessage?.(userId);
    },
    [onSendMessage]
  );

  // Tepki verenler ve sadece görüntüleyenler
  const reactors = viewers.filter((v) => v.reaction);
  const allViewers = viewers;

  // Tepkileri grupla
  const reactionGroups = reactors.reduce(
    (acc, viewer) => {
      const reaction = viewer.reaction || "heart";
      if (!acc[reaction]) {
        acc[reaction] = [];
      }
      acc[reaction].push(viewer);
      return acc;
    },
    {} as Record<string, typeof reactors>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Hikaye Detayları</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabBar}>
            <Pressable
              style={[
                styles.tab,
                activeTab === "viewers" && [styles.tabActive, { borderBottomColor: colors.accent }]
              ]}
              onPress={() => handleTabChange("viewers")}
            >
              <Eye
                size={18}
                color={activeTab === "viewers" ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "viewers" ? colors.accent : colors.textSecondary }
                ]}
              >
                Görüntüleyenler ({viewsCount})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                activeTab === "reactions" && [
                  styles.tabActive,
                  { borderBottomColor: colors.accent }
                ]
              ]}
              onPress={() => handleTabChange("reactions")}
            >
              <Heart
                size={18}
                color={activeTab === "reactions" ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === "reactions" ? colors.accent : colors.textSecondary }
                ]}
              >
                Tepkiler ({reactionsCount})
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === "viewers" && (
              <>
                {allViewers.length > 0 ? (
                  allViewers.map((viewer) => (
                    <View
                      key={viewer.user_id}
                      style={[styles.viewerRow, { borderBottomColor: colors.border }]}
                    >
                      <Image
                        source={{ uri: viewer.avatar_url || undefined }}
                        style={styles.viewerAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.viewerInfo}>
                        <Text style={[styles.viewerName, { color: colors.textPrimary }]}>
                          {viewer.username}
                        </Text>
                        {viewer.reaction && (
                          <Text style={styles.viewerReaction}>
                            {REACTION_EMOJIS[viewer.reaction] || "❤️"} tepki verdi
                          </Text>
                        )}
                      </View>
                      <Pressable
                        style={[styles.sendButton, { backgroundColor: colors.accent }]}
                        onPress={() => handleSendMessage(viewer.user_id)}
                      >
                        <Send size={16} color="#FFF" />
                      </Pressable>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Eye size={48} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Henüz kimse görüntülemedi
                    </Text>
                  </View>
                )}
              </>
            )}

            {activeTab === "reactions" && (
              <>
                {Object.keys(reactionGroups).length > 0 ? (
                  Object.entries(reactionGroups).map(([reaction, users]) => (
                    <View key={reaction} style={styles.reactionGroup}>
                      <View style={styles.reactionHeader}>
                        <Text style={styles.reactionEmoji}>{REACTION_EMOJIS[reaction]}</Text>
                        <Text style={[styles.reactionCount, { color: colors.textSecondary }]}>
                          {users.length} kişi
                        </Text>
                      </View>
                      {users.map((viewer) => (
                        <View
                          key={viewer.user_id}
                          style={[styles.viewerRow, { borderBottomColor: colors.border }]}
                        >
                          <Image
                            source={{ uri: viewer.avatar_url || undefined }}
                            style={styles.viewerAvatar}
                            contentFit="cover"
                          />
                          <Text style={[styles.viewerName, { color: colors.textPrimary, flex: 1 }]}>
                            {viewer.username}
                          </Text>
                          <Pressable
                            style={[styles.sendButton, { backgroundColor: colors.accent }]}
                            onPress={() => handleSendMessage(viewer.user_id)}
                          >
                            <Send size={16} color="#FFF" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Heart size={48} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Henüz tepki yok
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  sheet: {
    backgroundColor: "#1C1C1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
    minHeight: 400
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: "700"
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)"
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  tabActive: {
    borderBottomWidth: 2
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600"
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  viewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#333"
  },
  viewerInfo: {
    flex: 1,
    marginLeft: 12
  },
  viewerName: {
    fontSize: 15,
    fontWeight: "600"
  },
  viewerReaction: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  reactionGroup: {
    marginBottom: 20
  },
  reactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8
  },
  reactionEmoji: {
    fontSize: 24
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: "500"
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12
  },
  emptyText: {
    fontSize: 15
  }
});

export const StoryInsightsSheet = memo(StoryInsightsSheetComponent);
