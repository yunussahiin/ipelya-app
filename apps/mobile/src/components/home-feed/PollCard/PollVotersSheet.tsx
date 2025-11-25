/**
 * PollVotersSheet Component
 * Anket oy verenler bottom sheet
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import type { PollOption } from "@ipelya/types";

interface Voter {
  id: string;
  user?: { username?: string; display_name?: string; avatar_url?: string };
  option?: { option_text?: string };
}

interface PollVotersSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  voters: Voter[];
  loading: boolean;
  options: PollOption[];
  totalVotes: number;
  selectedFilter: string | null;
  onFilterChange: (optionId: string | null) => void;
}

export function PollVotersSheet({
  sheetRef,
  voters,
  loading,
  options,
  totalVotes,
  selectedFilter,
  onFilterChange
}: PollVotersSheetProps) {
  const { colors } = useTheme();

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={["75%"]}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.sheetContent}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Anket Detayları</Text>
          <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
            {totalVotes} kişi oy kullandı
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <Pressable
            style={[
              styles.filterTab,
              {
                backgroundColor: selectedFilter === null ? colors.accent : colors.surfaceAlt,
                borderColor: selectedFilter === null ? colors.accent : colors.border
              }
            ]}
            onPress={() => onFilterChange(null)}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: selectedFilter === null ? "#FFF" : colors.textPrimary }
              ]}
            >
              Tümü
            </Text>
          </Pressable>
          {options.map((opt) => (
            <Pressable
              key={opt.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor: selectedFilter === opt.id ? colors.accent : colors.surfaceAlt,
                  borderColor: selectedFilter === opt.id ? colors.accent : colors.border
                }
              ]}
              onPress={() => onFilterChange(opt.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: selectedFilter === opt.id ? "#FFF" : colors.textPrimary }
                ]}
              >
                {opt.option_text}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Voters List */}
        {loading ? (
          // Skeleton Loading
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[styles.voterItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.skeletonAvatar, { backgroundColor: colors.border }]} />
                <View style={styles.voterInfo}>
                  <View style={[styles.skeletonName, { backgroundColor: colors.border }]} />
                  <View style={[styles.skeletonOption, { backgroundColor: colors.border }]} />
                </View>
              </View>
            ))}
          </View>
        ) : voters.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz oy verilmemiş</Text>
        ) : (
          <FlatList
            data={voters}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.voterItem, { borderBottomColor: colors.border }]}>
                <Image
                  source={{
                    uri:
                      item.user?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${item.user?.username}`
                  }}
                  style={styles.voterAvatar}
                />
                <View style={styles.voterInfo}>
                  <Text style={[styles.voterName, { color: colors.textPrimary }]}>
                    {item.user?.display_name || item.user?.username}
                  </Text>
                  <Text style={[styles.voterOption, { color: colors.textMuted }]}>
                    {item.option?.option_text}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20
  },
  sheetHeader: {
    paddingBottom: 16,
    marginBottom: 16
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  sheetSubtitle: {
    fontSize: 14,
    marginTop: 4
  },
  filterTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "500"
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15
  },
  voterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  voterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  voterInfo: {
    marginLeft: 12,
    flex: 1
  },
  voterName: {
    fontSize: 15,
    fontWeight: "500"
  },
  voterOption: {
    fontSize: 13,
    marginTop: 2
  },
  // Skeleton styles
  skeletonContainer: {
    flex: 1
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.3
  },
  skeletonName: {
    width: 120,
    height: 14,
    borderRadius: 4,
    opacity: 0.3
  },
  skeletonOption: {
    width: 80,
    height: 12,
    borderRadius: 4,
    marginTop: 6,
    opacity: 0.3
  }
});
