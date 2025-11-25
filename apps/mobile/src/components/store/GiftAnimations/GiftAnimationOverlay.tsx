/**
 * GiftAnimationOverlay
 * Hediye animasyonlarını gösteren overlay component
 */

import React, { useState, useCallback } from "react";
import { View, StyleSheet, Modal } from "react-native";
import { HeartBurst } from "./HeartBurst";
import { DiamondRain } from "./DiamondRain";
import { CrystalExplosion } from "./CrystalExplosion";
import { GiftType } from "@/services/iap/products";

interface GiftAnimationOverlayProps {
  visible: boolean;
  giftType: GiftType | null;
  onComplete: () => void;
}

export function GiftAnimationOverlay({ visible, giftType, onComplete }: GiftAnimationOverlayProps) {
  if (!visible || !giftType) return null;

  const renderAnimation = () => {
    switch (giftType) {
      case "heart":
      case "rose":
        return <HeartBurst onComplete={onComplete} color="#FF6B6B" />;
      case "star":
      case "fire":
        return <HeartBurst onComplete={onComplete} color="#FFD700" />;
      case "diamond":
        return <DiamondRain onComplete={onComplete} />;
      case "crown":
        return <CrystalExplosion onComplete={onComplete} />;
      default:
        return <HeartBurst onComplete={onComplete} />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>{renderAnimation()}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)"
  }
});
