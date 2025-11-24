/**
 * PollCard Component
 *
 * Amaç: Anket kartı - Kullanıcıların oy verebileceği anketleri gösterir
 *
 * Özellikler:
 * - Poll question
 * - Options with vote percentages
 * - Vote button
 * - Results display (after voting)
 * - Expiration countdown
 *
 * Props:
 * - poll: Poll objesi
 * - onVote: Vote callback
 * - onUserPress: User profile callback
 *
 * Kullanım:
 * <PollCard poll={poll} onVote={handleVote} />
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { Poll } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";
import { PostHeader } from "../PostHeader";

interface PollCardProps {
  poll: Poll;
  onVote?: (optionIds: string[]) => void;
  onUserPress?: () => void;
}

export function PollCard({ poll, onVote, onUserPress }: PollCardProps) {
  const { colors } = useTheme();
  // Seçili option'lar (multiple choice için array)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Option seçme handler
  const handleSelectOption = (optionId: string) => {
    if (poll.has_voted) return; // Zaten oy kullanılmışsa disable

    if (poll.multiple_choice) {
      // Multiple choice: toggle
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      // Single choice: replace
      setSelectedOptions([optionId]);
    }
  };

  // Oy verme handler
  const handleVote = () => {
    if (selectedOptions.length > 0 && onVote) {
      onVote(selectedOptions);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* Header: User info */}
      <PostHeader user={poll.user} timestamp={poll.created_at} onUserPress={onUserPress} />

      {/* Question */}
      <Text style={[styles.question, { color: colors.textPrimary }]}>{poll.question}</Text>

      {/* Options */}
      <View style={styles.options}>
        {poll.options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const percentage =
            poll.total_votes > 0 ? (option.votes_count / poll.total_votes) * 100 : 0;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelectOption(option.id)}
              style={[
                styles.option,
                { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                isSelected && {
                  borderColor: colors.accent,
                  backgroundColor: colors.accentSoft + "20"
                },
                poll.has_voted && { backgroundColor: colors.surface }
              ]}
            >
              {/* Option text */}
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                {option.option_text}
              </Text>

              {/* Results (after voting) */}
              {poll.has_voted && (
                <View style={styles.results}>
                  <Text style={[styles.percentage, { color: colors.accent }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${percentage}%`, backgroundColor: colors.accent }
                    ]}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Vote button (before voting) */}
      {!poll.has_voted && (
        <Pressable
          onPress={handleVote}
          disabled={selectedOptions.length === 0}
          style={[
            styles.voteButton,
            { backgroundColor: colors.accent },
            selectedOptions.length === 0 && { backgroundColor: colors.border }
          ]}
        >
          <Text style={[styles.voteButtonText, { color: colors.buttonPrimaryText }]}>Oy Ver</Text>
        </Pressable>
      )}

      {/* Total votes */}
      <Text style={[styles.totalVotes, { color: colors.textMuted }]}>
        {poll.total_votes} oy
        {poll.expires_at && ` • ${new Date(poll.expires_at).toLocaleDateString("tr-TR")}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  options: {
    gap: 8,
    marginBottom: 12
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1
  },
  optionText: {
    fontSize: 14
  },
  results: {
    marginTop: 8
  },
  percentage: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4
  },
  progressBar: {
    height: 4,
    borderRadius: 2
  },
  voteButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: "600"
  },
  totalVotes: {
    fontSize: 12
  }
});
