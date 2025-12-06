/**
 * BroadcastChannelListScreen
 *
 * Amaç: Yayın kanalları listesi ana ekranı
 * Tarih: 2025-11-26
 *
 * Creator'ın kendi kanalları ve üye olunan kanalları gösterir.
 */

import { useCallback, useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const isLoading = isLoadingMy || isLoadingJoined;
  const isRefetching = isRefetchingMy || isRefetchingJoined;

  // Arama filtresi
  const filteredMyChannels = useMemo(() => {
    if (!searchQuery) return myChannels || [];
    return (myChannels || []).filter((ch: BroadcastChannel) =>
      ch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [myChannels, searchQuery]);

  // Takip ettiklerimden kendi kanallarını çıkar
  const myChannelIds = useMemo(
    () => new Set((myChannels || []).map((c: BroadcastChannel) => c.id)),
    [myChannels]
  );

  const filteredJoinedChannels = useMemo(() => {
    const joined = (joinedChannels || []).filter((ch) => !myChannelIds.has(ch.id));
    if (!searchQuery) return joined;
    return joined.filter((ch) => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [joinedChannels, searchQuery, myChannelIds]);

  // Refresh
  const handleRefresh = useCallback(() => {
    refetchMy();
    refetchJoined();
  }, [refetchMy, refetchJoined]);

  // Kanal tıklama
  const handleChannelPress = useCallback(
    (channel: BroadcastChannel) => {
      useBroadcastStore.getState().setActiveChannel(channel.id);
      router.push(`/(broadcast)/${channel.id}`);
    },
    [router]
  );

  // Popüler kanallar - unique kanallar (kendi kanalları dahil)
  const popularChannels = useMemo(() => {
    const seen = new Set<string>();
    const unique: BroadcastChannel[] = [];
    [...filteredMyChannels, ...filteredJoinedChannels].forEach((ch) => {
      if (!seen.has(ch.id)) {
        seen.add(ch.id);
        unique.push(ch);
      }
    });
    return unique.slice(0, 5);
  }, [filteredMyChannels, filteredJoinedChannels]);

  // Section data
  const sections = [
    {
      title: "Kanallarım",
      data: filteredMyChannels,
      isMine: true,
      count: myChannels?.length || 0
    },
    {
      title: "Takip Ettiklerim",
      data: filteredJoinedChannels,
      isMine: false,
      count: filteredJoinedChannels.length
    },
    {
      title: "Popüler Kanallar",
      data: popularChannels,
      isMine: false,
      isPopular: true,
      count: popularChannels.length
    }
  ].filter((section) => section.data.length > 0);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <BroadcastListHeader onSearch={setSearchQuery} />
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
        <BroadcastListHeader onSearch={setSearchQuery} />
        <EmptyBroadcastList />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <BroadcastListHeader onSearch={setSearchQuery} />

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
        renderSectionHeader={({ section }) => (
          <SectionHeader title={section.title} count={section.count} />
        )}
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
