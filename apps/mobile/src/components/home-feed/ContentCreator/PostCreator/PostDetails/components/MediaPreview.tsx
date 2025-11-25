/**
 * MediaPreview Component
 * Seçilen medyaların önizlemesi
 */

import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import type { MediaPreviewProps } from "../types";
import { mediaPreviewStyles as styles } from "../styles";

export function MediaPreview({ assets }: MediaPreviewProps) {
  if (assets.length === 0) return null;

  return (
    <View style={styles.container}>
      {assets.slice(0, 6).map((asset, index) => (
        <Image
          key={asset.id}
          source={{ uri: asset.uri }}
          style={[styles.thumb, index === 0 && styles.thumbFirst]}
          contentFit="cover"
        />
      ))}
      {assets.length > 6 && (
        <View style={[styles.moreOverlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
          <Text style={styles.moreText}>+{assets.length - 6}</Text>
        </View>
      )}
    </View>
  );
}
