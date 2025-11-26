/**
 * MessageStatus
 *
 * Amaç: Mesaj durumu göstergesi (sent/delivered/read)
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { Text, StyleSheet } from "react-native";
import type { MessageStatus as MessageStatusType } from "@ipelya/types";

interface MessageStatusProps {
  status: MessageStatusType;
}

export const MessageStatus = memo(function MessageStatus({ status }: MessageStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return "○";
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "read":
        return "✓✓";
      case "failed":
        return "!";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "read":
        return "#4FC3F7"; // Blue ticks
      case "failed":
        return "#FF5252";
      default:
        return "rgba(255,255,255,0.7)";
    }
  };

  return <Text style={[styles.status, { color: getStatusColor() }]}>{getStatusIcon()}</Text>;
});

const styles = StyleSheet.create({
  status: {
    fontSize: 12,
    marginLeft: 2
  }
});
