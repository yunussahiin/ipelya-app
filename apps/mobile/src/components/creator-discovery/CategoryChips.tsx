import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { CATEGORIES, type CategoryItem, type CreatorCategory } from "./types";

interface CategoryChipsProps {
  selectedCategory: CreatorCategory;
  onSelectCategory: (category: CreatorCategory) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CategoryChip({
  item,
  isSelected,
  onPress
}: {
  item: CategoryItem;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createChipStyles(colors, isSelected), [colors, isSelected]);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onPress();
  }, [onPress]);

  return (
    <AnimatedPressable
      style={[styles.chip, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={styles.icon}>{item.icon}</Text>
      <Text style={styles.label}>{item.label}</Text>
    </AnimatedPressable>
  );
}

export function CategoryChips({ selectedCategory, onSelectCategory }: CategoryChipsProps) {
  const styles = useMemo(() => createStyles(), []);

  const renderItem = useCallback(
    ({ item }: { item: CategoryItem }) => (
      <CategoryChip
        item={item}
        isSelected={item.id === selectedCategory}
        onPress={() => onSelectCategory(item.id)}
      />
    ),
    [selectedCategory, onSelectCategory]
  );

  const keyExtractor = useCallback((item: CategoryItem) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={CATEGORIES}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      marginTop: 20
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 10
    }
  });

const createChipStyles = (colors: ThemeColors, isSelected: boolean) =>
  StyleSheet.create({
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isSelected ? colors.accent : "transparent",
      borderWidth: isSelected ? 0 : 1.5,
      borderColor: colors.border,
      gap: 6
    },
    icon: {
      fontSize: 14
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isSelected ? colors.buttonPrimaryText : colors.textSecondary
    }
  });
