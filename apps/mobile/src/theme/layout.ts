/**
 * Layout Constants
 * Sabit layout değerleri - tüm uygulamada kullanılacak
 */

export const LAYOUT_CONSTANTS = {
  // ===== PADDING =====
  screenPaddingHorizontal: 16,    // 16px left/right
  screenPaddingVertical: 12,      // 12px top/bottom (base)
  screenPaddingTop: 24,           // 24px top (extra)
  screenPaddingBottom: 32,        // 32px bottom (extra, for notch)

  // ===== GAPS (Spacing) =====
  sectionGap: 24,                 // Between major sections
  componentGap: 16,               // Between components
  inputGap: 12,                   // Between form inputs
  elementGap: 8,                  // Between small elements
  tinyGap: 4,                     // Minimal gap

  // ===== BORDER RADIUS =====
  radiusSmall: 8,                 // 8px - subtle
  radiusMedium: 12,               // 12px - inputs, buttons
  radiusLarge: 16,                // 16px - cards
  radiusXL: 20,                   // 20px - large cards
  radiusXXL: 24,                  // 24px - hero sections
  radiusXXXL: 28,                 // 28px - auth cards
  radiusFull: 9999,               // Pill shape

  // ===== TOUCH TARGETS =====
  touchTargetMin: 44,             // iOS minimum
  buttonMinHeight: 48,            // Button height
  inputMinHeight: 48,             // Input height
  iconSize: 24,                   // Icon size
  iconSizeSmall: 18,              // Small icon

  // ===== NAVIGATION =====
  navHeight: 80,                  // Bottom nav height
  navPadding: 16,                 // Nav padding

  // ===== SHADOWS =====
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },

  // ===== TYPOGRAPHY =====
  fontSizeXS: 12,                 // 12px
  fontSizeSM: 14,                 // 14px
  fontSizeBase: 16,               // 16px
  fontSizeLG: 18,                 // 18px
  fontSizeXL: 20,                 // 20px
  fontSize2XL: 24,                // 24px
  fontSize3XL: 32,                // 32px

  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',

  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,

  // ===== ANIMATIONS =====
  durationFast: 150,              // 150ms
  durationBase: 300,              // 300ms
  durationSlow: 500,              // 500ms
  durationSlower: 700             // 700ms
} as const;

export type LayoutConstants = typeof LAYOUT_CONSTANTS;
