/**
 * BroadcastPollCard
 *
 * Amaç: Yayın anketi kartı
 * Tarih: 2025-11-26
 */

import { memo, useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { useVoteBroadcastPoll } from "@/hooks/messaging";
import { useAuth } from "@/hooks/useAuth";
import type { BroadcastPoll } from "@ipelya/types";

// =============================================
// TYPES
// =============================================

interface BroadcastPollCardProps {
  poll: BroadcastPoll;
  channelId: string;
}

// =============================================
// COMPONENT
// =============================================

export const BroadcastPollCard = memo(function BroadcastPollCard({
  poll,
  channelId
}: BroadcastPollCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { mutate: votePoll, isPending } = useVoteBroadcastPoll();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Kullanıcının oyları (poll.user_votes'tan)
  const myVotes = poll.user_votes || [];
  const hasVoted = myVotes.length > 0;

  // Süre dolmuş mu?
  const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const isClosed = poll.is_closed || isExpired;

  // Seçenek seç
  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (isClosed || hasVoted) return;

      if (poll.is_multiple_choice) {
        setSelectedOptions((prev) =>
          prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
        );
      } else {
        setSelectedOptions([optionId]);
      }
    },
    [isClosed, hasVoted, poll.is_multiple_choice]
  );

  // Oy ver
  const handleVote = useCallback(() => {
    if (selectedOptions.length === 0 || isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    votePoll({
      poll_id: poll.id,
      option_ids: selectedOptions,
      channelId
    });
  }, [poll.id, selectedOptions, channelId, votePoll, isPending]);

  // Kalan süre
  const getRemainingTime = () => {
    if (!poll.expires_at) return null;
    const remaining = new Date(poll.expires_at).getTime() - Date.now();
    if (remaining <= 0) return "Süre doldu";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} gün kaldı`;
    }
    if (hours > 0) return `${hours} saat ${minutes} dk kaldı`;
    return `${minutes} dk kaldı`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundRaised }]}>
      {/* Question */}
      <Text style={[styles.question, { color: colors.textPrimary }]}>{poll.question}</Text>

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map((option) => {
          const percentage =
            poll.total_votes > 0 ? Math.round((option.vote_count / poll.total_votes) * 100) : 0;
          const isSelected = selectedOptions.includes(option.id);
          const isMyVote = myVotes.includes(option.id);
          const showResults = hasVoted || isClosed;

          return (
            <Pressable
              key={option.id}
              style={[
                styles.option,
                { borderColor: colors.border },
                isSelected && { borderColor: colors.accent },
                isMyVote && { borderColor: colors.accent }
              ]}
              onPress={() => handleOptionSelect(option.id)}
              disabled={isClosed || hasVoted}
            >
              {/* Progress bar */}
              {showResults && (
                <View
                  style={[
                    styles.progressBar,
                    {
                      backgroundColor: isMyVote ? colors.accentSoft : colors.surface,
                      width: `${percentage}%`
                    }
                  ]}
                />
              )}

              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textPrimary },
                    isMyVote && { fontWeight: "600" }
                  ]}
                >
                  {option.text}
                </Text>
                {showResults && (
                  <Text style={[styles.percentage, { color: colors.textMuted }]}>
                    {percentage}%
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.voteCount, { color: colors.textMuted }]}>{poll.total_votes} oy</Text>
        {getRemainingTime() && (
          <Text style={[styles.remaining, { color: colors.textMuted }]}>{getRemainingTime()}</Text>
        )}
      </View>

      {/* Vote button */}
      {!hasVoted && !isClosed && selectedOptions.length > 0 && (
        <Pressable
          style={[styles.voteButton, { backgroundColor: colors.accent }]}
          onPress={handleVote}
          disabled={isPending}
        >
          <Text style={styles.voteButtonText}>Oy Ver</Text>
        </Pressable>
      )}
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16
  },
  options: {
    gap: 8
  },
  option: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative"
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 7
  },
  optionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12
  },
  optionText: {
    fontSize: 15,
    flex: 1
  },
  percentage: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12
  },
  voteCount: {
    fontSize: 13
  },
  remaining: {
    fontSize: 13
  },
  voteButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  voteButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600"
  }
});

export default BroadcastPollCard;
