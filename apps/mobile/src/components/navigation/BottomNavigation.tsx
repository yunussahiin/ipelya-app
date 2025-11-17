import { memo, useCallback, useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView, type BlurTint } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useDeviceProfile } from "@/hooks";
import { useTheme, type ThemeColors, type ThemeScheme } from "@/theme/ThemeProvider";

export type BottomNavigationItem = {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  detail?: string;
};

type BottomNavigationProps = {
  items: BottomNavigationItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type NavItemProps = {
  item: BottomNavigationItem;
  active: boolean;
  isIOS: boolean;
  onPress: (key: string) => void;
  colors: ThemeColors;
  scheme: ThemeScheme;
};

function NavItem({ item, active, isIOS, onPress, colors, scheme }: NavItemProps) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.96)).current;
  const opacity = useRef(new Animated.Value(active ? 1 : 0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: active ? 1 : 0.96, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: active ? 1 : 0.88, duration: 220, useNativeDriver: true })
    ]).start();
  }, [active, opacity, scale]);

  const activeBackground = isIOS
    ? {
        backgroundColor: scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
        borderColor: colors.border
      }
    : {
        backgroundColor: scheme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.08)"
      };

  return (
    <AnimatedPressable
      style={[
        styles.item,
        {
          opacity,
          transform: [{ scale }]
        },
        isIOS ? styles.itemIOS : styles.itemAndroid,
        active && [isIOS ? styles.itemActiveIOS : styles.itemActiveAndroid, activeBackground]
      ]}
      onPress={() => onPress(item.key)}
    >
      <View style={styles.iconWrapper}>
        <Feather
          name={item.icon}
          size={22}
          color={active ? colors.textPrimary : colors.textSecondary}
        />
      </View>
      <View
        style={[
          styles.indicatorBase,
          active ? styles.indicatorActive : styles.indicatorInactive,
          { backgroundColor: active ? colors.navIndicator : "transparent", borderColor: colors.navIndicator }
        ]}
      />
    </AnimatedPressable>
  );
}

type TabletSidebarProps = BottomNavigationProps & {
  profile: ReturnType<typeof useDeviceProfile>;
  colors: ThemeColors;
};

function TabletSidebar({ items, activeKey, onChange, profile, colors }: TabletSidebarProps) {
  return (
    <View
      style={[
        styles.sidebarWrapper,
        {
          top: profile.insets.top + 32,
          bottom: profile.insets.bottom + 32,
          right: profile.insets.right + 36
        }
      ]}
    >
      <View style={[styles.sidebar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <Pressable
              key={item.key}
              style={[styles.sidebarItem, isActive && styles.sidebarItemActive, isActive && { borderColor: colors.border }]}
              onPress={() => onChange(item.key)}
            >
              <View style={styles.sidebarLabelRow}>
                <Feather
                  name={item.icon}
                  size={18}
                  color={isActive ? colors.textPrimary : colors.textSecondary}
                />
                <Text style={[styles.sidebarLabel, { color: isActive ? colors.textPrimary : colors.textSecondary }]}>{item.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BottomNavigationComponent({ items, activeKey, onChange }: BottomNavigationProps) {
  const { colors, scheme } = useTheme();
  const profile = useDeviceProfile();
  const isIOS = Platform.OS === "ios";

  const handlePress = useCallback(
    (key: string) => {
      if (key !== activeKey) {
        Haptics.selectionAsync().catch(() => {});
      }
      onChange(key);
    },
    [activeKey, onChange]
  );

  if (profile.isTablet) {
    return <TabletSidebar items={items} activeKey={activeKey} onChange={handlePress} profile={profile} colors={colors} />;
  }

  const needsExtraAndroidPadding = Platform.OS === "android" && profile.insets.bottom < 20;
  const safeBottom = needsExtraAndroidPadding ? 16 : Math.max(profile.insets.bottom, isIOS ? 12 : 8);
  const baseHeight = profile.breakpoint === "xs" ? 48 : 52;
  const extraPadding = profile.hasTallHomeIndicator ? 20 : profile.isFold ? 18 : 12;
  const calculatedHeight = baseHeight + extraPadding + safeBottom;
  const height = isIOS ? 64 : calculatedHeight;
  const paddingHorizontal = profile.breakpoint === "xs" ? 16 : profile.isFold ? 24 : 18;
  const blurTint = colors.navBlurTint as BlurTint;
  const blurIntensity = isIOS ? 80 : 55;
  const BarComponent = isIOS ? BlurView : View;
  const iosDesignWidth = 327;
  const iosAvailableWidth = profile.window.width - profile.insets.left - profile.insets.right - paddingHorizontal * 2;
  const iosBarWidth = isIOS ? Math.max(280, Math.min(iosDesignWidth, iosAvailableWidth)) : undefined;

  return (
    <View style={[styles.wrapper, { paddingBottom: safeBottom, paddingHorizontal }]}>
      <View pointerEvents="none" style={[styles.shadow, { backgroundColor: colors.navShadow }]} />
      <BarComponent
        {...(isIOS ? { intensity: blurIntensity, tint: blurTint } : {})}
        style={[
          styles.bar,
          isIOS ? styles.barIOS : styles.barAndroid,
          {
            height,
            backgroundColor: colors.navBackground,
            borderColor: colors.navBorder,
            width: iosBarWidth,
            alignSelf: isIOS ? "center" : "stretch"
          }
        ]}
      >
        {items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={item.key === activeKey}
            isIOS={isIOS}
            onPress={handlePress}
            colors={colors}
            scheme={scheme}
          />
        ))}
      </BarComponent>
    </View>
  );
}

export const BottomNavigation = memo(BottomNavigationComponent);

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center"
  },
  shadow: {
    position: "absolute",
    bottom: 6,
    width: "80%",
    height: 50,
    borderRadius: 25,
    opacity: 0.3
  },
  bar: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth
  },
  barIOS: {
    marginHorizontal: 0
  },
  barAndroid: {
    borderRadius: 0,
    marginHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderWidth: 0
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    position: "relative"
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  itemIOS: {
    borderRadius: 22
  },
  itemAndroid: {
    borderRadius: 14
  },
  itemActiveIOS: {
    borderWidth: 1
  },
  itemActiveAndroid: {
    borderWidth: 0
  },
  indicatorBase: {
    position: "absolute",
    bottom: 4,
    width: 8,
    height: 8,
    borderRadius: 4
  },
  indicatorActive: {
    opacity: 1
  },
  indicatorInactive: {
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.4
  },
  sidebarWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  sidebar: {
    width: 124,
    borderRadius: 32,
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8
  },
  sidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 24,
    alignItems: "flex-start",
    gap: 2
  },
  sidebarItemActive: {
    borderWidth: 1
  },
  sidebarLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  sidebarLabel: {
    fontSize: 14,
    fontWeight: "600"
  }
});
