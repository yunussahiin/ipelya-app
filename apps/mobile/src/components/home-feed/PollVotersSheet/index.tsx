/**
 * PollVotersSheet Component
 * Anket sahibinin oy veren kullanıcıları görmesi için sheet modal
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { X, Users } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { getPollVoters } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";

interface PollVotersSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  pollId: string;
  pollQuestion: string;
}

interface Voter {
  id: string;
  user: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  option: {
    option_text: string;
  };
  voted_at: string;
}

interface PollOption {
  id: string;
  option_text: string;
  votes_count: number;
}

export function PollVotersSheet({ sheetRef, pollId, pollQuestion }: PollVotersSheetProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  const [loading, setLoading] = useState(true);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchVoters = useCallback(
    async (optionId?: string) => {
      setLoading(true);
      try {
        const response = await getPollVoters(
          supabaseUrl,
          accessToken,
          pollId,
          optionId || undefined
        );

        if (response.success && response.data) {
          setVoters(response.data.voters);
          setOptions(response.data.options);
          setTotalVotes(response.data.total_votes);
        }
      } catch (error) {
        console.error("Voters fetch error:", error);
      } finally {
        setLoading(false);
      }
    },
    [supabaseUrl, accessToken, pollId]
  );

  useEffect(() => {
    fetchVoters(selectedOptionId || undefined);
  }, [fetchVoters, selectedOptionId]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const renderVoter = ({ item }: { item: Voter }) => (
    <View style={[styles.voterItem, { borderBottomColor: colors.border }]}>
      <Image
        source={{
          uri:
            item.user.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/png?seed=${item.user.username}`
        }}
        style={styles.avatar}
      />
      <View style={styles.voterInfo}>
        <Text style={[styles.displayName, { color: colors.textPrimary }]}>
          {item.user.display_name}
        </Text>
        <Text style={[styles.username, { color: colors.textMuted }]}>@{item.user.username}</Text>
      </View>
      <View style={[styles.optionBadge, { backgroundColor: colors.accent + "20" }]}>
        <Text style={[styles.optionBadgeText, { color: colors.accent }]}>
          {item.option.option_text}
        </Text>
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["70%", "90%"]}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Users size={20} color={colors.accent} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Anket Sonuçları</Text>
          </View>
          <Pressable onPress={() => sheetRef.current?.dismiss()}>
            <X size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Question */}
        <Text style={[styles.question, { color: colors.textPrimary }]}>{pollQuestion}</Text>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Pressable
            style={[
              styles.filterTab,
              { backgroundColor: !selectedOptionId ? colors.accent : colors.surfaceAlt }
            ]}
            onPress={() => setSelectedOptionId(null)}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: !selectedOptionId ? "#FFF" : colors.textPrimary }
              ]}
            >
              Tümü ({totalVotes})
            </Text>
          </Pressable>
          {options.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    selectedOptionId === option.id ? colors.accent : colors.surfaceAlt
                }
              ]}
              onPress={() => setSelectedOptionId(option.id)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: selectedOptionId === option.id ? "#FFF" : colors.textPrimary }
                ]}
              >
                {option.option_text} ({option.votes_count})
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Voters List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : voters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz oy verilmemiş</Text>
          </View>
        ) : (
          <FlatList
            data={voters}
            renderItem={renderVoter}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 0.5
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  question: {
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 12
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500"
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyText: {
    fontSize: 15
  },
  listContent: {
    paddingBottom: 20
  },
  voterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  voterInfo: {
    flex: 1,
    marginLeft: 12
  },
  displayName: {
    fontSize: 15,
    fontWeight: "500"
  },
  username: {
    fontSize: 13,
    marginTop: 2
  },
  optionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: "500"
  }
});
