/**
 * BroadcastChannelListScreen
 *
 * Amaç: Yayın kanalları listesi ana ekranı
 * Tarih: 2025-11-26
 *
 * Creator'ın kendi kanalları ve üye olunan kanalları gösterir.
 */

import { useCallback, useState } from "react";
import { View, StyleSheet, RefreshControl, SectionList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useMyBroadcastChannels, useJoinedBroadcastChannels } from "@/hooks/messaging";
import { useBroadcastStore } from "@/store/messaging";
import { BroadcastChannelItem } from "./components/BroadcastChannelItem";
import { BroadcastListHeader } from "./components/BroadcastListHeader";
import { BroadcastListSkeleton } from "./components/BroadcastListSkeleton";
import { EmptyBroadcastList } from "./components/EmptyBroadcastList";
import { SectionHeader } from "./components/SectionHeader";
import type { BroadcastChannel } from "@ipelya/types";

// =============================================
// COMPONENT
// =============================================

export function BroadcastChannelListScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Kanallar
  const {
    data: myChannels,
    isLoading: isLoadingMy,
    refetch: refetchMy,
    isRefetching: isRefetchingMy
  } = useMyBroadcastChannels();

  const {
    data: joinedChannels,
    isLoading: isLoadingJoined,
    refetch: refetchJoined,
    isRefetching: isRefetchingJoined
  } = useJoinedBroadcastChannels();

  const setActiveChannel = useBroadcastStore((s) => s.setActiveChannel);

  const isLoading = isLoadingMy || isLoadingJoined;
  const isRefetching = isRefetchingMy || isRefetchingJoined;

  // Refresh
  const handleRefresh = useCallback(() => {
    refetchMy();
    refetchJoined();
  }, [refetchMy, refetchJoined]);

  // Kanal tıklama
  const handleChannelPress = useCallback(
    (channel: BroadcastChannel) => {
      setActiveChannel(channel.id);
      router.push(`/broadcast/${channel.id}`);
    },
    [router, setActiveChannel]
  );

  // Section data
  const sections = [
    {
      title: "Kanallarım",
      data: myChannels || [],
      isMine: true
    },
    {
      title: "Takip Ettiklerim",
      data: joinedChannels || [],
      isMine: false
    }
  ].filter((section) => section.data.length > 0);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <BroadcastListHeader />
        <BroadcastListSkeleton />
      </SafeAreaView>
    );
  }

  // Empty state
  if (sections.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <BroadcastListHeader />
        <EmptyBroadcastList />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <BroadcastListHeader />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) => (
          <BroadcastChannelItem
            channel={item}
            isMine={section.isMine}
            onPress={() => handleChannelPress(item)}
          />
        )}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContent: {
    paddingBottom: 100
  }
});

export default BroadcastChannelListScreen;
