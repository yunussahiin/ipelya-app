/**
 * CreatorTabBar Component
 *
 * Alt tab bar - Gönderi, Hikaye, Video seçimi
 */

import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import type { CreatorTab } from "./index";

interface CreatorTabBarProps {
  tabs: CreatorTab[];
  labels: Record<CreatorTab, string>;
  activeTab: CreatorTab;
  onTabChange: (tab: CreatorTab) => void;
}

export function CreatorTabBar({ tabs, labels, activeTab, onTabChange }: CreatorTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: "rgba(0,0,0,0.9)" }]}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <Pressable
              key={tab}
              style={styles.tab}
              onPress={() => {
                Haptics.selectionAsync();
                onTabChange(tab);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.accent : "rgba(255,255,255,0.5)" }
                ]}
              >
                {labels[tab]}
              </Text>
              {isActive && <View style={[styles.indicator, { backgroundColor: colors.accent }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 16
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center"
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1
  },
  indicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8
  }
});
