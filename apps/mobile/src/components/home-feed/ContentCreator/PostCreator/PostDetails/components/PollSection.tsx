/**
 * PollSection Component
 * Anket oluşturma bölümü
 */

import React from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Plus, Trash2, Clock } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { PollSectionProps } from "../types";
import { POLL_DURATIONS } from "../types";
import { pollSectionStyles as styles } from "../styles";

export function PollSection({
  pollQuestion,
  setPollQuestion,
  pollOptions,
  pollDuration,
  setPollDuration,
  onAddOption,
  onRemoveOption,
  onUpdateOption
}: PollSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
      {/* Anket Sorusu */}
      <TextInput
        style={[styles.questionInput, { color: colors.textPrimary, borderColor: colors.border }]}
        placeholder="Anket sorusu..."
        placeholderTextColor={colors.textMuted}
        value={pollQuestion}
        onChangeText={setPollQuestion}
      />

      {/* Seçenekler */}
      {pollOptions.map((option, index) => (
        <View key={index} style={styles.optionRow}>
          <TextInput
            style={[styles.optionInput, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder={`Seçenek ${index + 1}`}
            placeholderTextColor={colors.textMuted}
            value={option}
            onChangeText={(text) => onUpdateOption(index, text)}
          />
          {pollOptions.length > 2 && (
            <Pressable onPress={() => onRemoveOption(index)} style={styles.removeButton}>
              <Trash2 size={18} color={colors.warning} />
            </Pressable>
          )}
        </View>
      ))}

      {/* Seçenek Ekle */}
      {pollOptions.length < 4 && (
        <Pressable style={styles.addButton} onPress={onAddOption}>
          <Plus size={18} color={colors.accent} />
          <Text style={[styles.addButtonText, { color: colors.accent }]}>Seçenek ekle</Text>
        </Pressable>
      )}

      {/* Süre Seçimi */}
      <View style={styles.durationRow}>
        <Clock size={16} color={colors.textMuted} />
        <Text style={[styles.durationLabel, { color: colors.textMuted }]}>Süre:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {POLL_DURATIONS.map((d) => (
            <Pressable
              key={d.value}
              style={[
                styles.durationChip,
                { backgroundColor: pollDuration === d.value ? colors.accent : colors.surface }
              ]}
              onPress={() => setPollDuration(d.value)}
            >
              <Text
                style={[
                  styles.durationChipText,
                  { color: pollDuration === d.value ? "#FFF" : colors.textPrimary }
                ]}
              >
                {d.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
