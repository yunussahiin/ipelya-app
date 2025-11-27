/**
 * FilterSelector
 *
 * Instagram tarzı yatay kaydırmalı filtre seçici
 * Her filtre küçük bir önizleme thumbnail'ı gösterir
 */

import React, { memo, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Canvas, Image, ColorMatrix, useImage, SkImage } from "@shopify/react-native-skia";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { FILTER_PRESETS, FilterPreset } from "./FilterPresets";

const LOG_PREFIX = "[FilterSelector]";
const THUMBNAIL_SIZE = 72;
const THUMBNAIL_MARGIN = 8;

interface FilterSelectorProps {
  /** Fotoğraf URI'si */
  imageUri: string;
  /** Seçili filtre ID'si */
  selectedFilterId: string;
  /** Filtre seçildiğinde */
  onFilterSelect: (filter: FilterPreset) => void;
}

/**
 * Filtre Thumbnail - Skia ile mini önizleme
 */
const FilterThumbnail = memo(function FilterThumbnail({
  filter,
  image,
  isSelected,
  onPress
}: {
  filter: FilterPreset;
  image: SkImage | null;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.thumbnailContainer, isSelected && styles.thumbnailSelected]}
      onPress={onPress}
    >
      <View style={styles.thumbnailImageContainer} pointerEvents="none">
        {image ? (
          <Canvas style={styles.thumbnailCanvas}>
            <Image
              image={image}
              x={0}
              y={0}
              width={THUMBNAIL_SIZE - 4}
              height={THUMBNAIL_SIZE - 4}
              fit="cover"
            >
              <ColorMatrix matrix={filter.matrix} />
            </Image>
          </Canvas>
        ) : (
          <View
            style={[
              styles.thumbnailPlaceholder,
              { backgroundColor: filter.previewColor || "#666" }
            ]}
          />
        )}
      </View>
      <Text
        style={[styles.thumbnailLabel, isSelected && styles.thumbnailLabelSelected]}
        numberOfLines={1}
      >
        {filter.name}
      </Text>
    </Pressable>
  );
});

/**
 * FilterSelector Component
 */
export function FilterSelector({
  imageUri,
  selectedFilterId,
  onFilterSelect
}: FilterSelectorProps) {
  console.log(`${LOG_PREFIX} Rendering with imageUri:`, imageUri?.substring(0, 50));

  // useImage hook - crash olabilir
  let image: SkImage | null = null;
  try {
    console.log(`${LOG_PREFIX} Calling useImage...`);
    image = useImage(imageUri);
    console.log(`${LOG_PREFIX} useImage result:`, image ? "loaded" : "null");
  } catch (error) {
    console.error(`${LOG_PREFIX} useImage error:`, error);
  }

  useEffect(() => {
    console.log(`${LOG_PREFIX} Mounted with ${FILTER_PRESETS.length} presets`);
    return () => {
      console.log(`${LOG_PREFIX} Unmounted`);
    };
  }, []);

  const handleFilterPress = useCallback(
    (filter: FilterPreset) => {
      console.log(`${LOG_PREFIX} Filter pressed:`, filter.id);
      try {
        Haptics.selectionAsync();
        onFilterSelect(filter);
      } catch (error) {
        console.error(`${LOG_PREFIX} Filter press error:`, error);
      }
    },
    [onFilterSelect]
  );

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={THUMBNAIL_SIZE + THUMBNAIL_MARGIN * 2}
      >
        {FILTER_PRESETS.map((filter) => (
          <FilterThumbnail
            key={filter.id}
            filter={filter}
            image={image}
            isSelected={selectedFilterId === filter.id}
            onPress={() => handleFilterPress(filter)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMBNAIL_SIZE + 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "center"
  },
  thumbnailContainer: {
    alignItems: "center",
    marginHorizontal: THUMBNAIL_MARGIN,
    opacity: 0.7
  },
  thumbnailSelected: {
    opacity: 1
  },
  thumbnailImageContainer: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent"
  },
  thumbnailCanvas: {
    width: THUMBNAIL_SIZE - 4,
    height: THUMBNAIL_SIZE - 4
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%"
  },
  thumbnailLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500"
  },
  thumbnailLabelSelected: {
    color: "#FFF",
    fontWeight: "600"
  }
});

export default FilterSelector;
