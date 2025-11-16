import { ReactNode, useMemo } from "react";
import { ScrollView, StyleSheet, View, ViewStyle, ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { useTabsNavigation } from "@/navigation/useTabsNavigation";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

type Layout = ReturnType<typeof useDeviceLayout>;

type PageScreenProps = {
  children: ReactNode | ((helpers: { layout: Layout }) => ReactNode);
  contentStyle?: StylePropOrFactory;
  scrollViewProps?: Omit<ScrollViewProps, "contentContainerStyle">;
  showNavigation?: boolean;
};

type StylePropOrFactory =
  | ViewStyle
  | ViewStyle[]
  | null
  | undefined
  | ((layout: Layout) => ViewStyle | ViewStyle[] | null | undefined);

function resolveChildren(children: PageScreenProps["children"], layout: Layout) {
  return typeof children === "function" ? children({ layout }) : children;
}

function resolveStyle(style: StylePropOrFactory, layout: Layout) {
  if (typeof style === "function") return style(layout);
  return style;
}

export function PageScreen({ children, contentStyle, scrollViewProps, showNavigation = true }: PageScreenProps) {
  const layout = useDeviceLayout();
  const { colors, scheme } = useTheme();
  const { tabs, activeKey, onChange } = useTabsNavigation();
  const showGlows = scheme === "dark";
  const baseStyles = useMemo(() => createStyles(colors), [colors]);
  const bottomPadding = showNavigation ? layout.navPadding : layout.bottomPadding;

  const contentContainerStyle = [
    baseStyles.scrollContent,
    {
      paddingTop: layout.topPadding,
      paddingBottom: bottomPadding,
      paddingHorizontal: layout.contentPaddingHorizontal,
      gap: layout.sectionGap
    },
    layout.isTablet ? { paddingRight: layout.contentPaddingHorizontal + layout.sideNavigationOffset } : null,
    layout.contentWidth ? { width: layout.contentWidth, alignSelf: "center" } : null,
    resolveStyle(contentStyle, layout)
  ];

  return (
    <SafeAreaView style={[baseStyles.safe, { backgroundColor: colors.background }]} edges={["left", "right"]}>
      <View style={baseStyles.chrome}>
        {showGlows ? (
          <>
            <View pointerEvents="none" style={[baseStyles.edgeGlow, baseStyles.topGlow, { height: layout.insets.top + 80 }]} />
            <View pointerEvents="none" style={[baseStyles.edgeGlow, baseStyles.bottomGlow, { height: layout.insets.bottom + 140 }]} />
          </>
        ) : null}
        <ScrollView
          style={baseStyles.scrollView}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ top: layout.insets.top, bottom: layout.insets.bottom + 12 }}
          contentInsetAdjustmentBehavior="never"
          {...scrollViewProps}
        >
          {resolveChildren(children, layout)}
        </ScrollView>
        {showNavigation ? <BottomNavigation items={tabs} activeKey={activeKey} onChange={onChange} /> : null}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1
    },
    chrome: {
      flex: 1,
      position: "relative"
    },
    edgeGlow: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: -1,
      backgroundColor: colors.background
    },
    topGlow: {
      top: 0,
      shadowColor: colors.glowShadow,
      shadowOffset: { height: 24, width: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 50,
      elevation: 35
    },
    bottomGlow: {
      bottom: 0,
      shadowColor: colors.glowShadow,
      shadowOffset: { height: -24, width: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 60,
      elevation: 40
    },
    scrollView: {
      flex: 1
    },
    scrollContent: {
      flexGrow: 1
    }
  });
}
