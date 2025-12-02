/**
 * MediaTabs
 * Amaç: Paylaşılan medya tab'ları
 */

import { View, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Image, Video, Mic, Link, LucideIcon } from "lucide-react-native";

type MediaTabType = "images" | "videos" | "audio" | "links";

interface MediaTabsProps {
  activeTab: MediaTabType;
  onTabChange: (tab: MediaTabType) => void;
}

const tabs: { key: MediaTabType; icon: LucideIcon }[] = [
  { key: "images", icon: Image },
  { key: "videos", icon: Video },
  { key: "audio", icon: Mic },
  { key: "links", icon: Link }
];

export function MediaTabs({ activeTab, onTabChange }: MediaTabsProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && [styles.activeTab, { borderBottomColor: colors.textPrimary }]
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          <tab.icon
            size={24}
            color={activeTab === tab.key ? colors.textPrimary : colors.textMuted}
          />
        </Pressable>
      ))}
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
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent"
  },
  activeTab: {}
});

export type { MediaTabType };
