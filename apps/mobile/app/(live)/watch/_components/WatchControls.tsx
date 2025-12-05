/**
 * Watch Controls Component
 */

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WatchControlsProps {
  onSendGift: () => void;
  onRequestToJoin?: () => void;
  canRequestToJoin?: boolean;
  requestPending?: boolean;
  isGuestEnabled?: boolean;
  bottomInset: number;
}

export function WatchControls({
  onSendGift,
  onRequestToJoin,
  canRequestToJoin,
  requestPending,
  isGuestEnabled,
  bottomInset
}: WatchControlsProps) {
  return (
    <View style={[styles.controls, { paddingBottom: bottomInset + 16 }]}>
      {/* Gift button */}
      <Pressable style={[styles.controlButton, styles.giftButton]} onPress={onSendGift}>
        <Ionicons name="gift" size={24} color="#fff" />
      </Pressable>

      {/* Request to join */}
      {isGuestEnabled && onRequestToJoin && (
        <Pressable
          style={[
            styles.controlButton,
            requestPending && styles.pendingButton,
            !canRequestToJoin && styles.disabledButton
          ]}
          onPress={onRequestToJoin}
          disabled={!canRequestToJoin}
        >
          <Ionicons name={requestPending ? "hourglass" : "hand-left"} size={22} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: "absolute",
    bottom: 0,
    right: 16,
    alignItems: "center",
    gap: 12
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  giftButton: {
    backgroundColor: "#F59E0B"
  },
  pendingButton: {
    backgroundColor: "#6B7280"
  },
  disabledButton: {
    opacity: 0.5
  }
});

export default WatchControls;
