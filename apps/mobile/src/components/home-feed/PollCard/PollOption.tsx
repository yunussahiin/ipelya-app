/**
 * PollOption Component
 * Tek bir anket seçeneği
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Check } from "lucide-react-native";
import type { PollOption as PollOptionType } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";

interface PollOptionProps {
  option: PollOptionType;
  isSelected: boolean;
  hasVoted: boolean;
  isExpired: boolean;
  multipleChoice: boolean;
  totalVotes: number;
  onPress: (optionId: string) => void;
}

export function PollOption({
  option,
  isSelected,
  hasVoted,
  isExpired,
  multipleChoice,
  totalVotes,
  onPress
}: PollOptionProps) {
  const { colors } = useTheme();
  const percentage = totalVotes > 0 ? (option.votes_count / totalVotes) * 100 : 0;

  return (
    <Pressable
      onPress={() => onPress(option.id)}
      disabled={isExpired}
      style={[
        styles.option,
        { borderColor: colors.border, backgroundColor: colors.surface },
        isSelected &&
          !hasVoted && {
            borderColor: colors.accent,
            backgroundColor: colors.accentSoft + "15"
          }
      ]}
    >
      {/* Progress bar (background) */}
      {hasVoted && (
        <View
          style={[
            styles.progressBarBg,
            {
              width: percentage > 0 ? `${Math.max(percentage, 5)}%` : "0%",
              backgroundColor: isSelected ? colors.accent + "40" : colors.border + "30"
            }
          ]}
        />
      )}

      {/* Option content */}
      <View style={styles.optionContent}>
        {/* Checkbox/Radio indicator */}
        {!hasVoted && (
          <View
            style={[
              styles.indicator,
              { borderColor: isSelected ? colors.accent : colors.border },
              multipleChoice ? styles.checkbox : styles.radio,
              isSelected && { backgroundColor: colors.accent }
            ]}
          >
            {isSelected && <Check size={10} color={colors.buttonPrimaryText} />}
          </View>
        )}

        {/* Option text */}
        <Text
          style={[
            styles.optionText,
            { color: colors.textPrimary },
            hasVoted && isSelected && { fontWeight: "600" }
          ]}
        >
          {option.option_text}
        </Text>

        {/* Percentage (after voting) */}
        {hasVoted && (
          <Text style={[styles.percentage, { color: colors.textSecondary }]}>
            {percentage.toFixed(0)}%
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative"
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1
  },
  indicator: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  checkbox: {
    borderRadius: 6
  },
  radio: {
    borderRadius: 11
  },
  optionText: {
    fontSize: 15,
    flex: 1
  },
  percentage: {
    fontSize: 14,
    fontWeight: "600"
  },
  progressBarBg: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 12
  }
});
