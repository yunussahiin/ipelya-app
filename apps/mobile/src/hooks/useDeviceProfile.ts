import { useMemo } from "react";
import { useWindowDimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Device from "expo-device";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

function resolveBreakpoint(width: number): Breakpoint {
  if (width < 360) return "xs";
  if (width < 400) return "sm";
  if (width < 600) return "md";
  if (width < 900) return "lg";
  return "xl";
}

export function useDeviceProfile() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const aspectRatio = height / width;
    const isIOS = Platform.OS === "ios";
    const isAndroid = Platform.OS === "android";
    const breakpoint = resolveBreakpoint(width);

    const modelId = Device.modelId ?? "unknown";
    const modelName = Device.modelName ?? modelId;
    const model = modelName ?? "unknown";

    const isTablet = Device.deviceType === Device.DeviceType.TABLET;
    const isPortrait = height >= width;

    const tallHomeIndicatorFromInsets = insets.bottom >= 18;
    const dynamicIslandRegex = /(1[4-7]).*(Pro)/;
    const hasDynamicIsland = isIOS && dynamicIslandRegex.test(model);

    const hasTallHomeIndicator =
      (isIOS && /X|1[1-7]/.test(model)) || hasDynamicIsland || tallHomeIndicatorFromInsets;

    const isSmallScreen = isIOS ? /SE/.test(model) || width < 360 : width < 340;

    const isFold = isAndroid && !isTablet && aspectRatio < 1 && width >= 500;
    const hasExtendedStatusBar = isIOS && (insets.top >= 44 || hasDynamicIsland);

    return {
      isIOS,
      isAndroid,
      isTablet,
      isFold,
      isPortrait,
      aspectRatio,
      breakpoint,
      model,
      insets,
      hasDynamicIsland,
      hasTallHomeIndicator,
      hasExtendedStatusBar,
      isSmallScreen,
      window: {
        width,
        height
      }
    };
  }, [height, insets, width]);
}
