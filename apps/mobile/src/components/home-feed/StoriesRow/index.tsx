/**
 * StoriesRow Component
 *
 * Feed header'da görünen hikaye satırı.
 * - Horizontal ScrollView
 * - İlk item: "Hikaye Ekle" butonu
 * - Takip edilen kullanıcıların hikayeleri
 * - Görüntülenmemiş önce, sonra en yeni sıralama
 */

import React, { useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useTheme } from "@/theme";
import { useProfileStore } from "@/store/profile.store";
import { useStories } from "@/hooks/home-feed/useStories";
import { StoryCircle, AddStoryCircle, StoriesRowSkeleton } from "./components";
import type { StoriesRowProps, StoryUser } from "./types";

export function StoriesRow({ onStoryPress, onAddStoryPress, onRefresh }: StoriesRowProps) {
  const { colors } = useTheme();
  const profile = useProfileStore((s) => s.profile);

  const { data, isLoading, isRefetching, refetch } = useStories({
    includeOwn: true,
    profileType: "real"
  });

  const handleRefresh = useCallback(() => {
    refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  const handleStoryPress = useCallback(
    (user: StoryUser) => {
      onStoryPress?.(user, 0);
    },
    [onStoryPress]
  );

  const handleAddStoryPress = useCallback(() => {
    onAddStoryPress?.();
  }, [onAddStoryPress]);

  // Loading state
  if (isLoading) {
    return <StoriesRowSkeleton />;
  }

  const users: StoryUser[] = data?.users || [];

  // Kendi story'miz varsa ayır (profile.id kullan)
  const ownStories = users.find((u: StoryUser) => u.user_id === profile?.id);
  const otherUsers = users.filter((u: StoryUser) => u.user_id !== profile?.id);

  // Kendi hikayemize tıklayınca görüntüle
  const handleOwnStoryPress = useCallback(() => {
    if (ownStories) {
      handleStoryPress(ownStories);
    }
  }, [ownStories, handleStoryPress]);

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Kendi hikayemiz varsa: Avatar + Plus butonu, yoksa: Add Story Button */}
        {ownStories ? (
          <StoryCircle
            user={ownStories}
            onPress={handleOwnStoryPress}
            onAddPress={handleAddStoryPress}
            isOwn
            showAddButton
          />
        ) : (
          <AddStoryCircle avatarUrl={profile?.avatarUrl} onPress={handleAddStoryPress} />
        )}

        {/* Other Users' Stories */}
        {otherUsers.map((user: StoryUser) => (
          <StoryCircle key={user.user_id} user={user} onPress={() => handleStoryPress(user)} />
        ))}
      </ScrollView>
    </View>
  );
}

// Re-export types
export type { StoriesRowProps, StoryUser, Story } from "./types";

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 12
  }
});
