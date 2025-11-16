import { useMemo } from "react";
import { useDeviceProfile } from "./useDeviceProfile";

const horizontalPaddingMap = {
  xs: 18,
  sm: 20,
  md: 24,
  lg: 36,
  xl: 48
} as const;

const sectionGapMap = {
  xs: 20,
  sm: 22,
  md: 24,
  lg: 28,
  xl: 32
} as const;

const cardRadiusMap = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
  xl: 26
} as const;

export function useDeviceLayout() {
  const profile = useDeviceProfile();

  return useMemo(() => {
    const { insets, breakpoint, hasDynamicIsland, hasTallHomeIndicator, isSmallScreen, isTablet, isFold } = profile;

    const topExtra = hasDynamicIsland ? 26 : isSmallScreen ? 10 : 16;
    const topPadding = insets.top + topExtra;

    const baseBottom = hasTallHomeIndicator ? 26 : 18;
    const bottomPadding = Math.max(insets.bottom + baseBottom, isTablet ? 42 : 24);

    const navPadding = isTablet ? bottomPadding + 32 : bottomPadding + 110;

    const contentPaddingHorizontal = horizontalPaddingMap[breakpoint];
    const sectionGap = sectionGapMap[breakpoint];
    const cardRadius = cardRadiusMap[breakpoint];

    const contentWidth = isTablet ? 960 : isFold ? 720 : undefined;
    const sideNavigationOffset = isTablet ? 132 : 0;

    const gridColumns = breakpoint === "xl" ? 3 : breakpoint === "lg" ? 2 : 1;

    return {
      ...profile,
      topPadding,
      bottomPadding,
      navPadding,
      contentPaddingHorizontal,
      sectionGap,
      cardRadius,
      contentWidth,
      sideNavigationOffset,
      gridColumns
    };
  }, [profile]);
}

