/**
 * ChatDateTime
 *
 * Custom Day and Time components for Gifted Chat
 * Türkçe tarih formatı ile
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Time, type DayProps, type TimeProps, type IMessage } from "react-native-gifted-chat";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import "dayjs/locale/tr";
import type { ThemeColors } from "@/theme/ThemeProvider";

// Dayjs plugins
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.locale("tr");

// =============================================
// DAY SEPARATOR - Custom Turkish format
// =============================================

interface ChatDayProps {
  props: DayProps<IMessage>;
  colors: ThemeColors;
}

function formatDayLabel(date: Date): string {
  const d = dayjs(date);

  if (d.isToday()) {
    return "Bugün";
  }
  if (d.isYesterday()) {
    return "Dün";
  }

  // Bu yıl içindeyse: "25 Kasım"
  if (d.year() === dayjs().year()) {
    return d.format("D MMMM");
  }

  // Geçmiş yıl: "25 Kasım 2024"
  return d.format("D MMMM YYYY");
}

function ChatDayComponent({ props, colors }: ChatDayProps) {
  const { currentMessage } = props;

  if (!currentMessage?.createdAt) return null;

  const dateLabel = formatDayLabel(
    currentMessage.createdAt instanceof Date
      ? currentMessage.createdAt
      : new Date(currentMessage.createdAt)
  );

  return (
    <View style={styles.dayContainer}>
      <View style={[styles.dayBadge, { backgroundColor: colors.surface }]}>
        <Text style={[styles.dayText, { color: colors.textMuted }]}>{dateLabel}</Text>
      </View>
    </View>
  );
}

export const ChatDay = memo(ChatDayComponent);

// =============================================
// TIME
// =============================================

interface ChatTimeProps {
  props: TimeProps<IMessage>;
  colors: ThemeColors;
}

function ChatTimeComponent({ props, colors }: ChatTimeProps) {
  return (
    <Time
      {...props}
      timeTextStyle={{
        left: {
          color: colors.textMuted,
          fontSize: 11
        },
        right: {
          color: "rgba(255,255,255,0.7)",
          fontSize: 11
        }
      }}
    />
  );
}

export const ChatTime = memo(ChatTimeComponent);

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  dayContainer: {
    alignItems: "center",
    marginVertical: 16
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  dayText: {
    fontSize: 12,
    fontWeight: "500"
  }
});
