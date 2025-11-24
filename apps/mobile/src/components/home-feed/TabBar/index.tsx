/**
 * TabBar Component
 *
 * Amaç: Feed tab navigation - Feed, Trending, Following
 *
 * Özellikler:
 * - Horizontal tabs
 * - Active state
 * - Smooth transitions
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border }
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <Pressable
            key={tab.id}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onTabChange(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                isActive && { color: colors.textPrimary, fontWeight: "bold" }
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={[styles.indicator, { backgroundColor: colors.accent }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  tabActive: {
    // Active state
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500"
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2
  }
});
