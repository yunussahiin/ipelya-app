/**
 * Responsive Design Constants
 * Breakpoints, padding, and font sizes for all device types
 */

export const RESPONSIVE_BREAKPOINTS = {
  xs: 0,      // Extra small (phones < 375px)
  sm: 375,    // Small (compact phones: iPhone SE)
  md: 414,    // Medium (standard phones: iPhone 12+)
  lg: 768,    // Large (tablets: iPad mini)
  xl: 1024    // Extra large (tablets: iPad Pro)
} as const;

export type BreakpointKey = keyof typeof RESPONSIVE_BREAKPOINTS;

/**
 * Get breakpoint key for given width
 */
export function getBreakpoint(width: number): BreakpointKey {
  if (width < 375) return 'xs';
  if (width < 414) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  return 'xl';
}

/**
 * Responsive padding by breakpoint
 */
export const RESPONSIVE_PADDING = {
  xs: { horizontal: 12, vertical: 8, top: 16, bottom: 24 },
  sm: { horizontal: 16, vertical: 12, top: 24, bottom: 32 },
  md: { horizontal: 16, vertical: 12, top: 24, bottom: 32 },
  lg: { horizontal: 32, vertical: 16, top: 32, bottom: 48 },
  xl: { horizontal: 40, vertical: 20, top: 40, bottom: 56 }
} as const;

/**
 * Responsive gaps by breakpoint
 */
export const RESPONSIVE_GAPS = {
  xs: { section: 16, component: 12, element: 8 },
  sm: { section: 20, component: 14, element: 8 },
  md: { section: 24, component: 16, element: 8 },
  lg: { section: 32, component: 20, element: 12 },
  xl: { section: 40, component: 24, element: 16 }
} as const;

/**
 * Responsive font sizes by breakpoint
 */
export const RESPONSIVE_FONT_SIZE = {
  xs: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 24,
    '3xl': 28
  },
  sm: {
    xs: 12,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 19,
    '2xl': 26,
    '3xl': 30
  },
  md: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 28,
    '3xl': 32
  },
  lg: {
    xs: 13,
    sm: 15,
    base: 18,
    lg: 20,
    xl: 22,
    '2xl': 32,
    '3xl': 40
  },
  xl: {
    xs: 14,
    sm: 16,
    base: 20,
    lg: 22,
    xl: 24,
    '2xl': 36,
    '3xl': 44
  }
} as const;

/**
 * Responsive button heights by breakpoint
 */
export const RESPONSIVE_BUTTON_HEIGHT = {
  xs: 44,
  sm: 44,
  md: 48,
  lg: 52,
  xl: 56
} as const;

/**
 * Responsive border radius by breakpoint
 */
export const RESPONSIVE_BORDER_RADIUS = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20
} as const;

/**
 * Responsive grid columns by breakpoint
 */
export const RESPONSIVE_GRID_COLUMNS = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5
} as const;

/**
 * Device types
 */
export const DEVICE_TYPES = {
  phone: { min: 0, max: 600 },
  tablet: { min: 600, max: Infinity }
} as const;

/**
 * Common device sizes for testing
 * iOS & Android support
 */
export const COMMON_DEVICE_SIZES = {
  // === iOS Devices ===
  iPhoneSE: { width: 375, height: 667, name: 'iPhone SE', os: 'iOS' },
  iPhone12: { width: 390, height: 844, name: 'iPhone 12', os: 'iOS' },
  iPhone13: { width: 390, height: 844, name: 'iPhone 13', os: 'iOS' },
  iPhone14: { width: 393, height: 852, name: 'iPhone 14', os: 'iOS' },
  iPhone14Plus: { width: 430, height: 932, name: 'iPhone 14 Plus', os: 'iOS' },
  iPhone15: { width: 393, height: 852, name: 'iPhone 15', os: 'iOS' },
  iPhone15Plus: { width: 430, height: 932, name: 'iPhone 15 Plus', os: 'iOS' },
  iPhone16: { width: 393, height: 852, name: 'iPhone 16', os: 'iOS' },
  iPhone16Plus: { width: 430, height: 932, name: 'iPhone 16 Plus', os: 'iOS' },
  iPhone16Pro: { width: 393, height: 852, name: 'iPhone 16 Pro', os: 'iOS' },
  iPhone16ProMax: { width: 440, height: 956, name: 'iPhone 16 Pro Max', os: 'iOS' },
  
  // === iPad ===
  iPadMini: { width: 768, height: 1024, name: 'iPad Mini', os: 'iOS' },
  iPadAir: { width: 820, height: 1180, name: 'iPad Air', os: 'iOS' },
  iPadPro11: { width: 834, height: 1194, name: 'iPad Pro 11"', os: 'iOS' },
  iPadPro129: { width: 1024, height: 1366, name: 'iPad Pro 12.9"', os: 'iOS' },
  
  // === Android Phones ===
  // Compact (< 375px)
  galaxyS21: { width: 360, height: 800, name: 'Samsung Galaxy S21', os: 'Android' },
  pixel5a: { width: 393, height: 851, name: 'Google Pixel 5a', os: 'Android' },
  
  // Standard (375-414px)
  galaxyS22: { width: 360, height: 800, name: 'Samsung Galaxy S22', os: 'Android' },
  galaxyS23: { width: 360, height: 800, name: 'Samsung Galaxy S23', os: 'Android' },
  galaxyS24: { width: 360, height: 800, name: 'Samsung Galaxy S24', os: 'Android' },
  galaxyS24Ultra: { width: 440, height: 880, name: 'Samsung Galaxy S24 Ultra', os: 'Android' },
  pixel6: { width: 412, height: 915, name: 'Google Pixel 6', os: 'Android' },
  pixel7: { width: 412, height: 915, name: 'Google Pixel 7', os: 'Android' },
  pixel8: { width: 412, height: 915, name: 'Google Pixel 8', os: 'Android' },
  pixel8Pro: { width: 420, height: 936, name: 'Google Pixel 8 Pro', os: 'Android' },
  oneplus12: { width: 440, height: 956, name: 'OnePlus 12', os: 'Android' },
  xiaomi14: { width: 440, height: 956, name: 'Xiaomi 14', os: 'Android' },
  xiaomi14Ultra: { width: 440, height: 956, name: 'Xiaomi 14 Ultra', os: 'Android' },
  
  // Large phones (414-500px)
  galaxyA54: { width: 412, height: 915, name: 'Samsung Galaxy A54', os: 'Android' },
  galaxyA55: { width: 412, height: 915, name: 'Samsung Galaxy A55', os: 'Android' },
  motorolaG54: { width: 412, height: 915, name: 'Motorola G54', os: 'Android' },
  
  // === Android Tablets ===
  galaxyTabS9: { width: 800, height: 1280, name: 'Samsung Galaxy Tab S9', os: 'Android' },
  galaxyTabS10: { width: 800, height: 1280, name: 'Samsung Galaxy Tab S10', os: 'Android' },
  pixelTablet: { width: 912, height: 1280, name: 'Google Pixel Tablet', os: 'Android' }
} as const;
