/**
 * PollCard Component
 * Anket kartı - Kullanıcıların oy verebileceği anketleri gösterir
 */

import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { Poll } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";
import { PostHeader } from "../PostHeader";
import { votePoll, unvotePoll, getPollVoters } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { PollOption } from "./PollOption";
import { PollFooter } from "./PollFooter";
import { PollVotersSheet } from "./PollVotersSheet";

interface PollCardProps {
  poll: Poll;
  onUserPress?: () => void;
  currentUserId?: string;
}

export function PollCard({ poll, onUserPress, currentUserId }: PollCardProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  // Kullanıcının daha önce oy verdiği seçenek (feed'den geliyor)
  const initialVotedOption = (poll as any).voted_option_id;
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    initialVotedOption ? [initialVotedOption] : []
  );
  const [hasVoted, setHasVoted] = useState(poll.has_voted || !!initialVotedOption);
  const [loading, setLoading] = useState(false);
  const [localOptions, setLocalOptions] = useState(poll.options);
  // total_votes hesapla - poll.total_votes veya options'dan hesapla
  const calculatedTotalVotes =
    poll.total_votes || poll.options?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0;
  const [localTotalVotes, setLocalTotalVotes] = useState(calculatedTotalVotes);

  // Sheet state
  const sheetRef = useRef<BottomSheetModal>(null);
  const [voters, setVoters] = useState<
    {
      id: string;
      user?: { username?: string; display_name?: string; avatar_url?: string };
      option?: { option_text?: string };
    }[]
  >([]);
  const [votersLoading, setVotersLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Poll sahibi kontrolü - poll.user_id veya poll.user.user_id olabilir
  // @ts-expect-error - dinamik tip
  const pollOwnerId = poll.user_id || poll.user?.user_id;
  const isOwner = Boolean(currentUserId && pollOwnerId && currentUserId === pollOwnerId);

  // Kalan süre hesaplama
  const getTimeRemaining = () => {
    if (!poll.expires_at) return null;
    const now = new Date();
    const expires = new Date(poll.expires_at);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Sona erdi";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} gün kaldı`;
    }
    if (hours > 0) return `${hours}s ${minutes}dk kaldı`;
    return `${minutes}dk kaldı`;
  };

  // Option seçme ve direkt oy verme handler
  const handleSelectOption = async (optionId: string) => {
    if (loading) return;

    Haptics.selectionAsync();
    setLoading(true);

    // Eğer zaten oy verdiyse ve aynı seçeneğe tıkladıysa - oyu kaldır
    if (hasVoted && selectedOptions.includes(optionId)) {
      try {
        const response = await unvotePoll(supabaseUrl, accessToken, poll.id);

        if (response.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const newOptions = localOptions.map((opt) => ({
            ...opt,
            votes_count: opt.id === optionId ? Math.max(0, opt.votes_count - 1) : opt.votes_count
          }));
          setLocalOptions(newOptions);
          setLocalTotalVotes(Math.max(0, localTotalVotes - 1));
          setHasVoted(false);
          setSelectedOptions([]);
          queryClient.invalidateQueries({ queryKey: ["feed"] });
        } else {
          Alert.alert("❌ Hata", response.error || "Oy kaldırılamadı");
        }
      } catch (error) {
        Alert.alert("❌ Hata", "Bir sorun oluştu");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Yeni oy ver
    if (!hasVoted) {
      setSelectedOptions([optionId]);

      try {
        const response = await votePoll(supabaseUrl, accessToken, {
          poll_id: poll.id,
          option_ids: [optionId]
        });

        if (response.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Optimistic update
          const newOptions = localOptions.map((opt) => ({
            ...opt,
            votes_count: opt.id === optionId ? opt.votes_count + 1 : opt.votes_count
          }));
          setLocalOptions(newOptions);
          setLocalTotalVotes(localTotalVotes + 1);
          setHasVoted(true);

          queryClient.invalidateQueries({ queryKey: ["feed"] });
        } else {
          Alert.alert("❌ Hata", response.error || "Oy verilemedi");
          setSelectedOptions([]);
        }
      } catch (error) {
        Alert.alert("❌ Hata", "Bir sorun oluştu");
        setSelectedOptions([]);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === "Sona erdi";

  // Voters fetch
  const fetchVoters = useCallback(
    async (optionId?: string | null) => {
      setVotersLoading(true);
      try {
        const response = await getPollVoters(
          supabaseUrl,
          accessToken,
          poll.id,
          optionId || undefined
        );
        if (response.success && response.data) {
          setVoters(response.data.voters);
        }
      } catch (error) {
        console.error("Voters fetch error:", error);
      } finally {
        setVotersLoading(false);
      }
    },
    [supabaseUrl, accessToken, poll.id]
  );

  // Detaylar butonuna tıklama
  const handleDetailsPress = () => {
    fetchVoters();
    sheetRef.current?.present();
  };

  // Filter change
  const handleFilterChange = (optionId: string | null) => {
    setSelectedFilter(optionId);
    fetchVoters(optionId);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header: User info */}
      <PostHeader user={poll.user} timestamp={poll.created_at} onUserPress={onUserPress} />

      {/* Caption (gönderi içeriği) - varsa göster */}
      {poll.caption && poll.caption !== poll.question && (
        <Text style={[styles.caption, { color: colors.textPrimary }]}>{poll.caption}</Text>
      )}

      {/* Poll Container - arka planlı anket alanı */}
      <View style={[styles.pollContainer, { backgroundColor: colors.surfaceAlt }]}>
        {/* Question (anket sorusu) */}
        <Text style={[styles.question, { color: colors.textPrimary }]}>{poll.question}</Text>

        {/* Options */}
        <View style={styles.options}>
          {localOptions.map((option) => (
            <PollOption
              key={option.id}
              option={option}
              isSelected={selectedOptions.includes(option.id)}
              hasVoted={hasVoted}
              isExpired={isExpired}
              multipleChoice={poll.multiple_choice}
              totalVotes={localTotalVotes}
              onPress={handleSelectOption}
            />
          ))}
        </View>

        {/* Footer */}
        <PollFooter
          totalVotes={localTotalVotes}
          timeRemaining={timeRemaining}
          isExpired={isExpired}
          isOwner={isOwner}
          onDetailsPress={handleDetailsPress}
        />
      </View>

      {/* Poll Voters Sheet */}
      {isOwner && (
        <PollVotersSheet
          sheetRef={sheetRef}
          voters={voters}
          loading={votersLoading}
          options={localOptions}
          totalVotes={localTotalVotes}
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  caption: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22
  },
  pollContainer: {
    borderRadius: 12,
    padding: 14,
    marginTop: 4
  },
  question: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    lineHeight: 22
  },
  options: {
    gap: 8,
    marginBottom: 16
  }
});
