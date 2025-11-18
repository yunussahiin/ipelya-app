import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Responsive design hook
 * Provides device classification, responsive values, and safe area insets
 */
export function useResponsive() {
  const { width, height, scale, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Device classification
  const isSmallPhone = width < 375;
  const isPhone = width < 768;
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  // Orientation
  const isLandscape = width > height;
  const isPortrait = height > width;

  // Responsive padding
  const getPadding = () => {
    if (width < 375) {
      return { horizontal: 12, vertical: 8, top: 16, bottom: 24 };
    } else if (width < 414) {
      return { horizontal: 16, vertical: 12, top: 24, bottom: 32 };
    } else if (width < 768) {
      return { horizontal: 16, vertical: 12, top: 24, bottom: 32 };
    } else {
      return { horizontal: 32, vertical: 16, top: 32, bottom: 48 };
    }
  };

  const padding = getPadding();

  // Responsive gaps
  const gap = isTablet ? 24 : 16;
  const componentGap = isTablet ? 16 : 12;

  // Responsive font sizes
  const getFontSize = (baseSize: number) => {
    if (width < 375) {
      return baseSize * 0.9;
    } else if (width < 414) {
      return baseSize * 0.95;
    } else if (width < 768) {
      return baseSize;
    } else {
      return baseSize * 1.2;
    }
  };

  // Responsive columns
  const numColumns = isSmallPhone ? 2 : isPhone ? 3 : 4;

  // Responsive button height
  const buttonHeight = isSmallPhone ? 44 : 48;

  // Responsive border radius
  const borderRadius = isTablet ? 20 : 12;

  return {
    // Dimensions
    width,
    height,
    scale,
    fontScale,

    // Safe area
    insets,

    // Device classification
    isSmallPhone,
    isPhone,
    isTablet,
    isLargeTablet,

    // Orientation
    isLandscape,
    isPortrait,

    // Responsive values
    padding,
    gap,
    componentGap,
    numColumns,
    buttonHeight,
    borderRadius,

    // Helper functions
    getFontSize,

    // Computed values
    contentWidth: width - padding.horizontal * 2,
    maxContentWidth: isTablet ? 1000 : width
  };
}
